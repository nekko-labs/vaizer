#!/usr/bin/env node
/**
 * validate-skill.mjs — static, dependency-free structural + frontmatter
 * validation for an Agent Skill directory.
 *
 * SAFE FOR UNTRUSTED PRs: it only reads files. It NEVER executes the skill or
 * any bundled script. Run under the powerless `pull_request` trigger.
 *
 * Usage:
 *   node tools/validate-skill.mjs <skill-dir> [<skill-dir> ...]
 *   node tools/validate-skill.mjs --all          # validate every skill under plugins/
 *
 * Exit code 0 = all valid, 1 = at least one error.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename, relative, extname } from 'node:path';
import process from 'node:process';
import { readSkillMd } from './lib/frontmatter.mjs';

const MAX_BODY_LINES = 500; // best-practices guidance
const MAX_DESCRIPTION = 1024;
const MAX_NAME = 64;
const MAX_FILE_BYTES = 1024 * 1024; // 1 MB per file
const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5 MB per skill
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Conservative allowlist of file extensions a skill may bundle. Binaries and
// executables are rejected — keep skills auditable as text.
const ALLOWED_EXT = new Set([
  '.md', '.txt', '.json', '.yaml', '.yml', '.toml',
  '.mjs', '.js', '.cjs', '.ts', '.py', '.sh', '.rb',
  '.csv', '.tsv', '.svg', '.png', '.jpg', '.jpeg', '.gif',
  '.html', '.css', '.sql', '',
]);
const DENY_EXT = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.o', '.a',
  '.zip', '.tar', '.gz', '.7z', '.rar', '.jar', '.class',
  '.bat', '.cmd', '.ps1', '.scr', '.msi', '.app', '.deb', '.rpm',
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push({ path: p, size: st.size });
  }
  return out;
}

function validateSkill(dir) {
  const errors = [];
  const warnings = [];
  const rel = (p) => relative(dir, p);

  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return { dir, errors: [`not a directory: ${dir}`], warnings };
  }

  const skillMdPath = join(dir, 'SKILL.md');
  if (!existsSync(skillMdPath)) {
    return { dir, errors: ['missing SKILL.md'], warnings };
  }

  let parsed;
  try {
    parsed = readSkillMd(skillMdPath);
  } catch (e) {
    return { dir, errors: [`could not read SKILL.md: ${e.message}`], warnings };
  }

  const { frontmatter: fm, body, hasFrontmatter } = parsed;
  const dirName = basename(dir);

  // --- Frontmatter ---
  if (!hasFrontmatter) {
    errors.push('SKILL.md has no YAML frontmatter (--- block at the top)');
  }

  const name = fm.name;
  if (!name) {
    errors.push('frontmatter: `name` is required');
  } else {
    if (name.length > MAX_NAME) errors.push(`name exceeds ${MAX_NAME} chars`);
    if (!NAME_RE.test(name)) errors.push(`name "${name}" must be lowercase a-z/0-9 with single hyphens`);
    if (/anthropic|claude/i.test(name)) errors.push('name must not contain "anthropic" or "claude"');
    if (name !== dirName) errors.push(`name "${name}" must match directory name "${dirName}"`);
    if (/[<>]/.test(name)) errors.push('name must not contain angle brackets');
  }

  const description = fm.description;
  if (!description) {
    errors.push('frontmatter: `description` is required (state what it does AND when to use it)');
  } else {
    if (description.length > MAX_DESCRIPTION) errors.push(`description exceeds ${MAX_DESCRIPTION} chars`);
    if (/[<>]/.test(description)) warnings.push('description contains angle brackets (avoid XML-like tags)');
    if (description.length < 40) warnings.push('description is very short — include trigger context for better matching');
  }

  // --- Body length ---
  const lineCount = body.split(/\r?\n/).length;
  if (lineCount > MAX_BODY_LINES) {
    errors.push(`SKILL.md body is ${lineCount} lines (>${MAX_BODY_LINES}); move detail into references/`);
  }

  // --- File structure / sizes / extensions ---
  let total = 0;
  for (const { path: p, size } of walk(dir)) {
    total += size;
    const ext = extname(p).toLowerCase();
    if (DENY_EXT.has(ext)) errors.push(`disallowed file type ${ext}: ${rel(p)}`);
    else if (!ALLOWED_EXT.has(ext)) warnings.push(`unusual file type ${ext}: ${rel(p)} (allowed but review it)`);
    if (size > MAX_FILE_BYTES) errors.push(`file exceeds 1MB: ${rel(p)} (${(size / 1024 / 1024).toFixed(1)}MB)`);
  }
  if (total > MAX_TOTAL_BYTES) {
    errors.push(`skill total size ${(total / 1024 / 1024).toFixed(1)}MB exceeds 5MB`);
  }

  return { dir, errors, warnings, name };
}

// --- CLI ---
function collectSkillDirs() {
  const root = join(process.cwd(), 'plugins');
  if (!existsSync(root)) return [];
  const dirs = [];
  for (const plugin of readdirSync(root)) {
    const skillsDir = join(root, plugin, 'skills');
    if (existsSync(skillsDir) && statSync(skillsDir).isDirectory()) {
      for (const s of readdirSync(skillsDir)) {
        const d = join(skillsDir, s);
        if (statSync(d).isDirectory()) dirs.push(d);
      }
    }
  }
  return dirs;
}

const args = process.argv.slice(2);
let targets;
if (args.includes('--all') || args.length === 0) {
  targets = collectSkillDirs();
  if (!targets.length) {
    console.error('no skills found under plugins/*/skills/');
    process.exit(1);
  }
} else {
  targets = args;
}

let failed = false;
for (const dir of targets) {
  const { errors, warnings, name } = validateSkill(dir);
  const label = name ? `${name} (${dir})` : dir;
  if (errors.length) {
    failed = true;
    console.error(`✗ ${label}`);
    for (const e of errors) console.error(`    ERROR: ${e}`);
  } else {
    console.log(`✓ ${label}`);
  }
  for (const w of warnings) console.warn(`    warn:  ${w}`);
}

process.exit(failed ? 1 : 0);
