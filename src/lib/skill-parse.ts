/**
 * Heuristic parser: a skill's `SKILL.md` -> a `SkillWorkflow` graph.
 *
 * Agent Skills are Markdown with YAML frontmatter (name, description, and
 * sometimes allowed-tools) plus a body of instructions. There is no formal
 * "workflow" in the file, so we infer one: we pull out the discrete steps
 * (numbered lists, or headings, or bullet points, in that order of
 * preference), classify each step into a node kind by keyword, and wire them
 * left-to-right with a trigger at the front and an output at the end. Loop
 * language ("repeat", "until", "for each") adds a dashed back-edge.
 *
 * This is intentionally approximate: the goal is a readable, mostly-right
 * picture of how a skill runs, not a formal execution trace. It runs
 * server-side (see /api/inspect) and its output feeds the same visualizer the
 * catalog uses.
 */

import type { SkillNode, SkillNodeKind, SkillEdge, SkillWorkflow } from '@/data/skills';

export type ParsedSkill = {
  name: string;
  description: string;
  tools: string[];
  workflow: SkillWorkflow;
  /** True when we found little structure and fell back to a generic shape. */
  lowConfidence: boolean;
};

type Frontmatter = { name?: string; description?: string; tools: string[] };

/** Split leading YAML frontmatter (--- ... ---) from the body. */
function splitFrontmatter(md: string): { fm: Frontmatter; body: string } {
  const fm: Frontmatter = { tools: [] };
  const match = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!match) return { fm, body: md };
  const yaml = match[1];
  const body = md.slice(match[0].length);

  const grab = (key: string): string | undefined => {
    const re = new RegExp(`^${key}\\s*:\\s*(.+)$`, 'im');
    const m = re.exec(yaml);
    if (!m) return undefined;
    return m[1].trim().replace(/^["']|["']$/g, '');
  };
  fm.name = grab('name');
  fm.description = grab('description');

  const toolsRaw = grab('allowed-tools') ?? grab('allowed_tools') ?? grab('tools');
  if (toolsRaw) {
    fm.tools = toolsRaw
      .replace(/^\[|\]$/g, '')
      .split(/[,\n]/)
      .map((t) => t.trim().replace(/^["'-]\s*|["']$/g, ''))
      .filter(Boolean);
  }
  return { fm, body };
}

/** Keyword tables, checked in priority order (first match wins). */
const KIND_RULES: Array<{ kind: SkillNodeKind; re: RegExp }> = [
  { kind: 'loop', re: /\b(repeat|iterate|loop|for each|until (?:done|complete|green|passing)|keep (?:going|running)|each (?:file|item|test))\b/i },
  { kind: 'decision', re: /\b(if |when |otherwise|whether|decide|check (?:if|whether)|branch|choose|either)\b/i },
  { kind: 'output', re: /\b(return|output|produce|deliver|report|summar|final|result|present|write (?:the )?(?:report|summary|answer)|hand back)\b/i },
  { kind: 'tool', re: /\b(run |execute|edit|write (?:the )?file|create (?:a )?file|git |bash|command|call (?:the )?api|shell|install|npm|build|test\b|grep|apply)\b/i },
  { kind: 'context', re: /\b(read|gather|load|fetch|collect|inspect|scan|search|find|review|analyze|look at|explore|understand)\b/i },
];

function classify(text: string): SkillNodeKind {
  for (const rule of KIND_RULES) if (rule.re.test(text)) return rule.kind;
  return 'agent';
}

/** A short, node-sized label from a longer step sentence. */
function toLabel(text: string): string {
  let t = text.replace(/`[^`]*`/g, '').replace(/[*_#>]/g, '').trim();
  t = t.replace(/\s+/g, ' ');
  // Prefer the first clause.
  const clause = t.split(/[.:;]/)[0].trim();
  const words = (clause || t).split(' ').slice(0, 6).join(' ');
  const label = words.length > 42 ? words.slice(0, 40) + '…' : words;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function toDetail(text: string): string | undefined {
  const t = text
    .replace(/`([^`]*)`/g, '$1') // inline code -> plain
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold -> plain
    .replace(/[*_]/g, '') // stray emphasis markers
    .replace(/^#+\s*/, '') // leading heading hashes
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length < 6) return undefined;
  return t.length > 120 ? t.slice(0, 118) + '…' : t;
}

/** Extract candidate step strings from the body, best structure first. */
function extractSteps(body: string): string[] {
  const lines = body.split(/\r?\n/);

  // 1) Numbered list items (the strongest signal of an ordered process).
  const numbered = lines
    .map((l) => /^\s*\d+[.)]\s+(.*)$/.exec(l)?.[1])
    .filter((x): x is string => Boolean(x && x.trim().length > 2));
  if (numbered.length >= 3) return numbered;

  // 2) Section headings (## / ###), skipping the title (#).
  const headings = lines
    .map((l) => /^\s{0,3}#{2,3}\s+(.*)$/.exec(l)?.[1])
    .filter((x): x is string => Boolean(x && x.trim().length > 1));
  if (headings.length >= 3) return headings;

  // 3) Bullet points.
  const bullets = lines
    .map((l) => /^\s*[-*]\s+(.*)$/.exec(l)?.[1])
    .filter((x): x is string => Boolean(x && x.trim().length > 4));
  if (bullets.length >= 3) return bullets;

  // 4) Fallback: leading sentences of the prose.
  const prose = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`]/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  return prose;
}

const MAX_STEPS = 8;

export function parseSkillMarkdown(md: string, fallbackName?: string): ParsedSkill {
  const { fm, body } = splitFrontmatter(md);
  const name = fm.name || fallbackName || 'skill';
  const description = fm.description || 'A skill parsed from its SKILL.md.';

  const rawSteps = extractSteps(body);
  const lowConfidence = rawSteps.length < 3;

  // Downsample to a readable number of steps, keeping order.
  let steps = rawSteps;
  if (steps.length > MAX_STEPS) {
    const stride = steps.length / MAX_STEPS;
    steps = Array.from({ length: MAX_STEPS }, (_, i) => steps[Math.floor(i * stride)]);
  }

  const nodes: SkillNode[] = [];
  const edges: SkillEdge[] = [];

  // Trigger: how the skill starts.
  nodes.push({
    id: 'trigger',
    kind: 'trigger',
    label: `/${name}`.replace(/\/+/g, '/'),
    detail: 'Invoke the skill (with any arguments).',
  });

  const stepNodes: SkillNode[] = steps.map((text, i) => ({
    id: `s${i}`,
    kind: classify(text),
    label: toLabel(text),
    detail: toDetail(text),
  }));

  // Guarantee a closing output node if the body never described one.
  const hasOutput = stepNodes.some((n) => n.kind === 'output');
  if (!hasOutput) {
    stepNodes.push({
      id: 'output',
      kind: 'output',
      label: 'Result',
      detail: 'What the skill hands back when it finishes.',
    });
  }

  nodes.push(...stepNodes);

  // Wire the spine: trigger -> s0 -> s1 -> ... -> last.
  let prevId = 'trigger';
  for (const n of stepNodes) {
    edges.push({ from: prevId, to: n.id });
    prevId = n.id;
  }

  // Loop steps get a dashed back-edge to the step two before them (or to the
  // first step), so the "keeps cycling" shape reads on the canvas.
  stepNodes.forEach((n, i) => {
    if (n.kind === 'loop') {
      const targetIdx = Math.max(0, i - 2);
      const target = stepNodes[targetIdx];
      if (target && target.id !== n.id) {
        edges.push({ from: n.id, to: target.id, back: true, label: 'repeat' });
      }
    }
  });

  return {
    name,
    description,
    tools: fm.tools,
    workflow: { nodes, edges },
    lowConfidence,
  };
}
