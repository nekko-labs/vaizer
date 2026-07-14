/**
 * The Agent Skills hub catalog.
 *
 * Three sources/tiers:
 *  - `nekko-official` — built & reviewed by Nekko Labs; safe to run when connected.
 *  - `community`      — submitted publicly via PR to the marketplace repo; passes
 *                       automated checks + human review; audit before use.
 *  - `curated`        — great external skills (e.g. Anthropic's). Linked with
 *                       attribution, NOT re-hosted — install from their source.
 *
 * Installable skills (nekko-official + community) live in the marketplace repo
 * `nekko-labs/nekko-dojo-skills` and carry an `installCommand`. Curated entries
 * link out via `sourceUrl` and have no install command in our channel.
 *
 * This is structured, typed data (v1). A future enhancement can generate it
 * from the marketplace's `catalog.json`. Vote counts are NOT stored here —
 * they come from Supabase at request time (see `lib/votes.ts`).
 */

export type SkillSource = 'nekko-official' | 'community' | 'curated';

export type SkillCategory =
  | 'research'
  | 'writing'
  | 'coding'
  | 'data'
  | 'design'
  | 'productivity'
  | 'devops';

/**
 * A skill's workflow graph — the steps it runs through (trigger → context →
 * agent → tools → output, with branches and loops). The skill detail page
 * renders this as an n8n / Make-style node canvas so you can see what a skill
 * actually does before you install it. Ported from the Open Paw desktop app so
 * the two share one visual language for skills.
 */
export type SkillNodeKind =
  | 'trigger' // the `/command` and its input
  | 'context' // gather files / diff / repo state
  | 'agent' // model reasoning step
  | 'tool' // a concrete tool call (edit, run, git, web)
  | 'decision' // a branch / condition check
  | 'loop' // an iterating step
  | 'output'; // the final deliverable

export type SkillNode = {
  id: string;
  kind: SkillNodeKind;
  label: string;
  /** One-line explanation shown under the node label. */
  detail?: string;
};

export type SkillEdge = {
  from: string;
  to: string;
  label?: string;
  /** A return/loop edge (drawn dashed, routed around), ignored for layering. */
  back?: boolean;
};

export type SkillWorkflow = {
  nodes: SkillNode[];
  edges: SkillEdge[];
};

/** Terse workflow builder. */
const wf = (nodes: SkillNode[], edges: SkillEdge[]): SkillWorkflow => ({ nodes, edges });

export type Skill = {
  id: string;
  name: string;
  slug: string;
  /** One-line summary used on cards and as the meta description. */
  description: string;
  /** Longer prose for the detail page (optional). */
  longDescription?: string;
  category: SkillCategory;
  tags: string[];
  source: SkillSource;
  author: string;
  /** Link to the skill's source (our repo, or the external origin for curated). */
  sourceUrl: string;
  /** Present for skills installable via our marketplace. */
  installCommand?: string;
  /** Known to be approachable for newcomers. */
  beginnerFriendly?: boolean;
  /** Pin toward the top. */
  featured?: boolean;
  /** Step graph rendered by the workflow visualizer on the detail page. */
  workflow?: SkillWorkflow;
};

/** The marketplace these skills install from. */
export const skillsMarketplace = {
  name: 'nekko-dojo-skills',
  repoUrl: 'https://github.com/nekko-labs/nekko-dojo-skills',
  addCommand: '/plugin marketplace add nekko-labs/nekko-dojo-skills',
} as const;

export const sourceLabels: Record<SkillSource, string> = {
  'nekko-official': 'Nekko official',
  community: 'Community',
  curated: 'Curated',
};

/** Emoji marker per tier, matching the marketplace repo's trust-tier table. */
export const sourceBadges: Record<SkillSource, string> = {
  'nekko-official': '🟣',
  community: '🟢',
  curated: '🔗',
};

/**
 * A skill is installable from our marketplace when it carries an install
 * command (nekko-official + community). Curated entries link out instead, and
 * only installable skills expose a downloadable `.zip`.
 */
export function isInstallable(skill: Skill): boolean {
  return Boolean(skill.installCommand);
}

export const categoryLabels: Record<SkillCategory, string> = {
  research: 'Research',
  writing: 'Writing',
  coding: 'Coding',
  data: 'Data',
  design: 'Design',
  productivity: 'Productivity',
  devops: 'DevOps',
};

export const skills: Skill[] = [
  {
    id: 'domain-finder',
    name: 'Domain Finder',
    slug: 'domain-finder',
    description:
      'Brainstorm startup/project names, check domain availability across TLDs via RDAP, and vet brand/trademark conflicts.',
    longDescription:
      'A three-stage naming workflow: (1) generate brandable name candidates and synonyms from your concept, (2) check domain availability across any TLD using RDAP (the modern, structured successor to WHOIS — it resolves endpoints from IANA’s registry, so any TLD with a public RDAP service works), and (3) research brand/trademark conflicts for the survivors and produce a ranked shortlist. The bundled checker is dependency-free, validates input, handles internationalized (Japanese) domains, and is rate-limit friendly.',
    category: 'research',
    tags: ['domains', 'naming', 'branding', 'rdap', 'startup', 'trademark'],
    source: 'nekko-official',
    author: 'Nekko Labs',
    sourceUrl:
      'https://github.com/nekko-labs/nekko-dojo-skills/tree/main/plugins/domain-finder',
    installCommand: '/plugin install domain-finder@nekko-dojo-skills',
    beginnerFriendly: true,
    featured: true,
    workflow: wf(
      [
        { id: 't', kind: 'trigger', label: '/domain-finder', detail: 'Your concept or theme' },
        { id: 'gen', kind: 'agent', label: 'Generate names', detail: 'Brandable candidates + synonyms' },
        { id: 'rdap', kind: 'tool', label: 'Check RDAP', detail: 'Availability across TLDs' },
        { id: 'dec', kind: 'decision', label: 'Available?' },
        { id: 'vet', kind: 'agent', label: 'Vet brand', detail: 'Trademark + conflict screen' },
        { id: 'out', kind: 'output', label: 'Ranked shortlist' },
      ],
      [
        { from: 't', to: 'gen' },
        { from: 'gen', to: 'rdap' },
        { from: 'rdap', to: 'dec' },
        { from: 'dec', to: 'vet', label: 'free' },
        { from: 'dec', to: 'gen', label: 'taken', back: true },
        { from: 'vet', to: 'out' },
      ],
    ),
  },
  {
    id: 'nyaa',
    name: 'nyaa',
    slug: 'nyaa',
    description:
      'Convene a council of four reviewer cats (security, deps/supply-chain, correctness/concurrency, style) over a PR or working diff, pulling in external bot reviews too.',
    longDescription:
      'A code-review skill that summons a council of four specialist reviewer “cats”, each with a distinct lens: security, dependencies and supply-chain, correctness and concurrency, and style. Point it at a GitHub pull request or your uncommitted working diff and it produces a consolidated review, folding in any external bot reviews (e.g. Codex) already posted on the PR. Ships a `/cr` command so you can summon the council in one line.',
    category: 'coding',
    tags: [
      'code-review',
      'pull-request',
      'security',
      'dependencies',
      'supply-chain',
      'concurrency',
      'lint',
    ],
    source: 'nekko-official',
    author: 'Nekko Labs',
    sourceUrl:
      'https://github.com/nekko-labs/nekko-dojo-skills/tree/main/plugins/nyaa',
    installCommand: '/plugin install nyaa@nekko-dojo-skills',
    featured: true,
    workflow: wf(
      [
        { id: 't', kind: 'trigger', label: '/cr', detail: 'A PR or your working diff' },
        { id: 'ctx', kind: 'context', label: 'Load diff', detail: 'Changed files + bot reviews' },
        { id: 'sec', kind: 'agent', label: '🐱 Security cat', detail: 'Vulns, secrets, authz' },
        { id: 'dep', kind: 'agent', label: '🐱 Supply-chain cat', detail: 'Deps + licenses' },
        { id: 'corr', kind: 'agent', label: '🐱 Correctness cat', detail: 'Bugs + concurrency' },
        { id: 'style', kind: 'agent', label: '🐱 Style cat', detail: 'Clarity + conventions' },
        { id: 'merge', kind: 'agent', label: 'Consolidate', detail: 'Merge + dedupe findings' },
        { id: 'out', kind: 'output', label: 'Council review' },
      ],
      [
        { from: 't', to: 'ctx' },
        { from: 'ctx', to: 'sec' },
        { from: 'ctx', to: 'dep' },
        { from: 'ctx', to: 'corr' },
        { from: 'ctx', to: 'style' },
        { from: 'sec', to: 'merge' },
        { from: 'dep', to: 'merge' },
        { from: 'corr', to: 'merge' },
        { from: 'style', to: 'merge' },
        { from: 'merge', to: 'out' },
      ],
    ),
  },
  // --- Curated external skills (link-only, attributed) ---
  {
    id: 'anthropic-skill-creator',
    name: 'Skill Creator',
    slug: 'skill-creator',
    description:
      'Anthropic’s official skill for creating, editing, and improving Agent Skills — scaffolds a SKILL.md and bundled resources.',
    category: 'productivity',
    tags: ['skills', 'authoring', 'meta', 'official'],
    source: 'curated',
    author: 'Anthropic',
    sourceUrl: 'https://github.com/anthropics/skills',
    featured: true,
    workflow: wf(
      [
        { id: 't', kind: 'trigger', label: '/skill-creator', detail: 'What the skill should do' },
        { id: 'ctx', kind: 'context', label: 'Clarify intent', detail: 'Scope + trigger cases' },
        { id: 'draft', kind: 'agent', label: 'Draft SKILL.md', detail: 'Instructions + metadata' },
        { id: 'scaffold', kind: 'tool', label: 'Scaffold files', detail: 'Bundled resources' },
        { id: 'dec', kind: 'decision', label: 'Passes eval?' },
        { id: 'out', kind: 'output', label: 'Ready-to-use skill' },
      ],
      [
        { from: 't', to: 'ctx' },
        { from: 'ctx', to: 'draft' },
        { from: 'draft', to: 'scaffold' },
        { from: 'scaffold', to: 'dec' },
        { from: 'dec', to: 'out', label: 'yes' },
        { from: 'dec', to: 'draft', label: 'no', back: true },
      ],
    ),
  },
  {
    id: 'anthropic-pdf',
    name: 'PDF Tools',
    slug: 'pdf-tools',
    description:
      'Anthropic’s official skill for working with PDFs — extract text and tables, fill forms, merge, split, and create documents.',
    category: 'data',
    tags: ['pdf', 'documents', 'extraction', 'official'],
    source: 'curated',
    author: 'Anthropic',
    sourceUrl: 'https://github.com/anthropics/skills',
    workflow: wf(
      [
        { id: 't', kind: 'trigger', label: '/pdf', detail: 'A PDF file + what you need' },
        { id: 'ctx', kind: 'context', label: 'Load PDF', detail: 'Pages, text, layout' },
        { id: 'dec', kind: 'decision', label: 'What task?' },
        { id: 'extract', kind: 'tool', label: 'Extract', detail: 'Text + tables' },
        { id: 'forms', kind: 'tool', label: 'Fill forms' },
        { id: 'edit', kind: 'tool', label: 'Merge / split' },
        { id: 'out', kind: 'output', label: 'Result document' },
      ],
      [
        { from: 't', to: 'ctx' },
        { from: 'ctx', to: 'dec' },
        { from: 'dec', to: 'extract', label: 'read' },
        { from: 'dec', to: 'forms', label: 'fill' },
        { from: 'dec', to: 'edit', label: 'edit' },
        { from: 'extract', to: 'out' },
        { from: 'forms', to: 'out' },
        { from: 'edit', to: 'out' },
      ],
    ),
  },
  {
    id: 'anthropic-mcp-builder',
    name: 'MCP Builder',
    slug: 'mcp-builder',
    description:
      'Anthropic’s official skill for building Model Context Protocol (MCP) servers that connect agents to external tools and data.',
    category: 'devops',
    tags: ['mcp', 'integrations', 'servers', 'official'],
    source: 'curated',
    author: 'Anthropic',
    sourceUrl: 'https://github.com/anthropics/skills',
    workflow: wf(
      [
        { id: 't', kind: 'trigger', label: '/mcp-builder', detail: 'The integration you want' },
        { id: 'ctx', kind: 'context', label: 'Define tools', detail: 'Data + actions to expose' },
        { id: 'scaffold', kind: 'agent', label: 'Scaffold server', detail: 'Protocol + handlers' },
        { id: 'wire', kind: 'tool', label: 'Wire tools', detail: 'Implement each tool' },
        { id: 'test', kind: 'tool', label: 'Test connection' },
        { id: 'out', kind: 'output', label: 'Running MCP server' },
      ],
      [
        { from: 't', to: 'ctx' },
        { from: 'ctx', to: 'scaffold' },
        { from: 'scaffold', to: 'wire' },
        { from: 'wire', to: 'test' },
        { from: 'test', to: 'out' },
      ],
    ),
  },
];

const sourceRank: Record<SkillSource, number> = {
  'nekko-official': 0,
  curated: 1,
  community: 2,
};

/** All skills, featured first, then by source tier, then by name. */
export function getAllSkills(): Skill[] {
  return [...skills].sort(
    (a, b) =>
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
      sourceRank[a.source] - sourceRank[b.source] ||
      a.name.localeCompare(b.name),
  );
}

export function getFeaturedSkills(): Skill[] {
  return getAllSkills().filter((s) => s.featured);
}

export function getSkillBySlug(slug: string): Skill | undefined {
  return skills.find((s) => s.slug === slug);
}

/** Distinct categories present in the catalog, in label order. */
export function getUsedCategories(): SkillCategory[] {
  const present = new Set(skills.map((s) => s.category));
  return (Object.keys(categoryLabels) as SkillCategory[]).filter((c) => present.has(c));
}

// --- Workflow layout (pure; consumed by the SkillWorkflow visualizer) --------

export type LaidOutNode = SkillNode & {
  layer: number;
  row: number;
  x: number;
  y: number;
};

export type WorkflowLayout = {
  nodes: LaidOutNode[];
  edges: SkillEdge[];
  width: number;
  height: number;
  nodeW: number;
  nodeH: number;
};

export type LayoutOptions = {
  nodeW?: number;
  nodeH?: number;
  gapX?: number;
  gapY?: number;
  margin?: number;
};

/**
 * Left-to-right layered layout. Each node's column (layer) is its longest path
 * from a root over forward edges (back/loop edges are ignored for layering);
 * nodes sharing a layer are stacked and vertically centred so fan-outs splay
 * symmetrically. Pure + deterministic. Ported from the Open Paw desktop app.
 */
export function layoutWorkflow(workflow: SkillWorkflow, opts: LayoutOptions = {}): WorkflowLayout {
  const nodeW = opts.nodeW ?? 156;
  const nodeH = opts.nodeH ?? 60;
  const gapX = opts.gapX ?? 64;
  const gapY = opts.gapY ?? 24;
  const margin = opts.margin ?? 24;

  const forward = workflow.edges.filter((e) => !e.back);
  const byId = new Map(workflow.nodes.map((n) => [n.id, n]));
  const incoming = new Map<string, number>();
  for (const n of workflow.nodes) incoming.set(n.id, 0);
  for (const e of forward) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);

  // Longest-path layering: relax forward edges until stable (DAG, small graphs).
  const layer = new Map<string, number>();
  for (const n of workflow.nodes) layer.set(n.id, 0);
  for (let i = 0; i < workflow.nodes.length; i++) {
    let changed = false;
    for (const e of forward) {
      if (!byId.has(e.from) || !byId.has(e.to)) continue;
      const cand = (layer.get(e.from) ?? 0) + 1;
      if (cand > (layer.get(e.to) ?? 0)) {
        layer.set(e.to, cand);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Group nodes by layer, preserving declaration order within a layer.
  const layers = new Map<number, SkillNode[]>();
  for (const n of workflow.nodes) {
    const l = layer.get(n.id) ?? 0;
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l)!.push(n);
  }

  const colHeight = (count: number) => count * nodeH + Math.max(0, count - 1) * gapY;
  const maxRows = Math.max(...[...layers.values()].map((g) => g.length), 1);
  const canvasInner = colHeight(maxRows);

  const laid: LaidOutNode[] = [];
  for (const [l, group] of [...layers.entries()].sort((a, b) => a[0] - b[0])) {
    const colH = colHeight(group.length);
    const startY = margin + (canvasInner - colH) / 2;
    group.forEach((n, row) => {
      laid.push({
        ...n,
        layer: l,
        row,
        x: margin + l * (nodeW + gapX),
        y: startY + row * (nodeH + gapY),
      });
    });
  }

  const layerCount = layers.size;
  const width = margin * 2 + layerCount * nodeW + Math.max(0, layerCount - 1) * gapX;
  const height = margin * 2 + canvasInner;

  return { nodes: laid, edges: workflow.edges, width, height, nodeW, nodeH };
}
