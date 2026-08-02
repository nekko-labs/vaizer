#!/usr/bin/env node
/**
 * lint-skill-security.mjs — static, dependency-free security lint for an Agent
 * Skill directory.
 *
 * SAFE FOR UNTRUSTED PRs: reads files only; NEVER executes the skill or its
 * scripts. This catches the skill-specific risks that generic SAST misses
 * (prompt injection in SKILL.md, dynamic-context preprocessing, over-broad
 * tool grants, phone-home patterns). It is a tripwire, not a guarantee — a
 * clean lint still requires human CODEOWNERS review before merge.
 *
 * Usage:
 *   node tools/lint-skill-security.mjs <skill-dir> [...]   (default: --all)
 *
 * Exit code 0 = no ERROR findings, 1 = at least one ERROR. Warnings never fail
 * the build on their own but should be reviewed.
 */

import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, basename, relative, extname } from 'node:path';
import process from 'node:process';
import { readSkillMd } from './lib/frontmatter.mjs';

const SCRIPT_EXT = new Set(['.mjs', '.js', '.cjs', '.ts', '.py', '.sh', '.rb']);

// Each rule: { id, level: 'error'|'warn', re, msg, where: 'body'|'script'|'frontmatter'|'any' }
const RULES = [
  // --- Dynamic-context preprocessing (runs BEFORE the model sees the skill) ---
  {
    id: 'dynamic-context',
    level: 'error',
    where: 'body',
    re: /!`[^`]+`/,
    msg: 'SKILL.md uses `!`-dynamic-context command execution (runs during preprocessing, bypassing model-level review)',
  },
  // --- Phone-home / remote code execution ---
  {
    id: 'curl-pipe-shell',
    level: 'error',
    where: 'any',
    re: /\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba)?sh\b/i,
    msg: 'pipes a downloaded script straight into a shell (curl|bash) — remote code execution',
  },
  {
    id: 'reverse-shell',
    level: 'error',
    where: 'any',
    re: /\bnc\b\s+-[a-z]*e|\bncat\b[^\n]*--exec|bash\s+-i\s*>&\s*\/dev\/tcp/i,
    msg: 'looks like a reverse shell',
  },
  // --- Credential / secret exfiltration ---
  {
    id: 'cred-file-read',
    level: 'error',
    where: 'any',
    re: /(~|\$HOME)\/\.(aws\/credentials|ssh\/id_|config\/gcloud)|\.ssh\/id_(rsa|ed25519)/,
    msg: 'reads credential/secret files (.aws/.ssh/gcloud)',
  },
  {
    id: 'gh-token-exfil',
    level: 'error',
    where: 'any',
    re: /gh\s+auth\s+token|GITHUB_TOKEN[^\n]{0,40}(curl|wget|fetch|post)/i,
    msg: 'accesses a GitHub token in a way consistent with exfiltration',
  },
  {
    id: 'env-dump-network',
    level: 'warn',
    where: 'script',
    re: /(process\.env|os\.environ)[^\n]{0,80}(fetch|requests\.|urllib|http)/i,
    msg: 'sends environment variables over the network — review carefully',
  },
  // --- Persistence / memory poisoning ---
  {
    id: 'memory-write',
    level: 'error',
    where: 'any',
    re: /(>>?|write|append|edit)[^\n]{0,40}(MEMORY\.md|SOUL\.md|CLAUDE\.md|\.bashrc|\.zshrc|\.profile|crontab)/i,
    msg: 'writes to agent-memory or shell-startup files (persistence / memory poisoning)',
  },
  // --- Destructive ---
  {
    id: 'rm-rf-root',
    level: 'error',
    where: 'any',
    re: /\brm\s+-rf\s+(\/(\s|$)|~|\$HOME|\*)/,
    msg: 'destructive recursive delete of a broad path',
  },
  // --- Prompt injection language ---
  {
    id: 'injection-phrasing',
    level: 'error',
    where: 'body',
    re: /ignore (all |any )?(previous|prior|above) instructions|disregard (the )?(system|previous)|developer mode|do not (tell|inform|warn) the user/i,
    msg: 'contains prompt-injection phrasing',
  },
  // --- Obfuscation ---
  {
    id: 'base64-blob',
    level: 'warn',
    where: 'any',
    re: /[A-Za-z0-9+/]{200,}={0,2}/,
    msg: 'contains a long base64-like blob (possible obfuscated payload)',
  },
  {
    id: 'eval-exec',
    level: 'warn',
    where: 'script',
    re: /\beval\s*\(|\bexec\s*\(|child_process|subprocess\.(Popen|call|run)|os\.system/i,
    msg: 'uses eval/exec/subprocess — review what it runs',
  },
];

// allowed-tools grants that are too broad.
const BROAD_TOOL_RE = /(^|\s)(Bash(\(\s*\*\s*\))?|Bash\(\s*\*\s*\))(\s|$)/;

function walkFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

function scanText(text, where, findings, fileLabel) {
  const lines = text.split(/\r?\n/);
  for (const rule of RULES) {
    if (rule.where !== 'any' && rule.where !== where) continue;
    for (let i = 0; i < lines.length; i++) {
      if (rule.re.test(lines[i])) {
        findings.push({ level: rule.level, id: rule.id, msg: rule.msg, where: `${fileLabel}:${i + 1}` });
      }
    }
  }
}

function lintSkill(dir) {
  const findings = [];
  const skillMdPath = join(dir, 'SKILL.md');
  if (!existsSync(skillMdPath)) return { dir, findings: [{ level: 'error', id: 'no-skill-md', msg: 'missing SKILL.md', where: dir }] };

  const { frontmatter: fm, body } = readSkillMd(skillMdPath);

  // Body scan.
  scanText(body, 'body', findings, 'SKILL.md');

  // allowed-tools breadth.
  const tools = fm['allowed-tools'];
  if (typeof tools === 'string' && BROAD_TOOL_RE.test(tools)) {
    findings.push({
      level: 'error',
      id: 'broad-allowed-tools',
      msg: `allowed-tools grants broad Bash access ("${tools.trim()}"). Scope it, e.g. Bash(node:*). Remember allowed-tools is a grant, not a sandbox.`,
      where: 'SKILL.md (frontmatter)',
    });
  }

  // External http(s) URLs in the body — informational (skills legitimately
  // reference docs, but agents fetching+acting on external content is a risk).
  const urlMatches = body.match(/https?:\/\/[^\s)>\]]+/g) || [];
  const external = urlMatches.filter((u) => !/nekkolabs\.com|anthropic\.com|claude\.com|iana\.org|github\.com\/nekkolabs/.test(u));
  if (external.length > 8) {
    findings.push({ level: 'warn', id: 'many-external-urls', msg: `${external.length} external URLs in SKILL.md — verify none instruct the agent to fetch+execute untrusted content`, where: 'SKILL.md' });
  }

  // Bundled scripts.
  for (const p of walkFiles(dir)) {
    if (basename(p) === 'SKILL.md') continue;
    const ext = extname(p).toLowerCase();
    if (!SCRIPT_EXT.has(ext)) continue;
    let text;
    try {
      text = readFileSync(p, 'utf8');
    } catch {
      continue;
    }
    scanText(text, 'script', findings, relative(dir, p));
  }

  return { dir, findings };
}

function collectSkillDirs() {
  const root = join(process.cwd(), 'plugins');
  if (!existsSync(root)) return [];
  const dirs = [];
  for (const plugin of readdirSync(root)) {
    const skillsDir = join(root, plugin, 'skills');
    if (existsSync(skillsDir)) {
      for (const s of readdirSync(skillsDir)) {
        const d = join(skillsDir, s);
        if (statSync(d).isDirectory()) dirs.push(d);
      }
    }
  }
  return dirs;
}

const args = process.argv.slice(2);
const targets = args.includes('--all') || args.length === 0 ? collectSkillDirs() : args;
if (!targets.length) {
  console.error('no skills found under plugins/*/skills/');
  process.exit(1);
}

let hasError = false;
for (const dir of targets) {
  const { findings } = lintSkill(dir);
  const errs = findings.filter((f) => f.level === 'error');
  const warns = findings.filter((f) => f.level === 'warn');
  if (errs.length) {
    hasError = true;
    console.error(`✗ ${dir}`);
    for (const f of errs) console.error(`    ERROR [${f.id}] ${f.where}: ${f.msg}`);
  } else {
    console.log(`✓ ${dir} — no security errors`);
  }
  for (const f of warns) console.warn(`    warn  [${f.id}] ${f.where}: ${f.msg}`);
}

process.exit(hasError ? 1 : 0);
