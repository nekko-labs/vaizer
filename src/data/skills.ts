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
 * Installable skills (nekko-official + community) live in this repo under
 * `plugins/`, which doubles as a Claude Code plugin marketplace, and carry an
 * `installCommand`. Curated entries link out via `sourceUrl` and have no install
 * command in our channel. (Until 2026-08-02 the plugins lived in a separate repo,
 * `nekko-labs/nekko-dojo-skills`, and installed as `@nekko-dojo-skills`.)
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
  | 'devops'
  | 'career';

/**
 * A skill's workflow graph — the steps it runs through (trigger → context →
 * agent → tools → output, with branches and loops). The skill detail page
 * renders this as an n8n / Make-style node canvas so you can see what a skill
 * actually does before you install it. Ported from the Kotrain desktop app so
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
  /** Lead paragraph for the detail page, and the page's meta description. Keep
   * it to a sentence or two; the scannable detail belongs in `highlights`. */
  longDescription?: string;
  /** Scannable bullets for the detail page: what the skill does, and why that
   * helps. Rendered as a list under the lead paragraph. */
  highlights?: { label: string; body: string }[];
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

/** The marketplace these skills install from: this repo. */
export const skillsMarketplace = {
  name: 'vaizer',
  repoUrl: 'https://github.com/nekko-labs/vaizer',
  addCommand: '/plugin marketplace add nekko-labs/vaizer',
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
  career: 'Career',
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
      'https://github.com/nekko-labs/vaizer/tree/main/plugins/vaizer/skills/domain-finder',
    installCommand: '/plugin install vaizer@vaizer',
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
    id: 'codereview-spec',
    name: 'codereview-spec',
    slug: 'codereview-spec',
    description:
      "Reviews a change against what its PR description promised and against your spec, then reviews the spec itself. Catches stated goals the code does not actually deliver, features shipped without a spec update, and the gaps in the spec that let them through.",
    longDescription:
      'The spec review on its own: does the code do what the PR said it would, does it do what the project said it would, and does the spec still describe reality?',
    highlights: [
      {
        label: 'Two modes, nothing to remember.',
        body: 'Point it at a pull request or diff and it reviews the code against the spec. Point it at a SPEC.md, TASKS.md, or PRD and it reviews that document instead. The target picks the mode.',
      },
      {
        label: 'Checks the code against what the PR promised.',
        body: 'It reads the description first, takes the goal and the value being claimed, then traces that claim through the diff. A goal not met is blocking. No description at all is a finding too, and it drafts one from the diff for you.',
      },
      {
        label: 'Catches drift in both directions.',
        body: 'Code doing what the spec never promised, and changes that shipped while the spec still describes the old behaviour. A conflict is filed as a stale spec with the sentence to change, since that is almost always what it is. Blocks on real feature changes, quiet for refactors.',
      },
      {
        label: 'Tells you what the spec is missing.',
        body: 'Undefined features, no test expectation, no documented home for new files, missing non-goals, and text an earlier merge already made false. Every gap arrives with the sentence to add.',
      },
      {
        label: 'Will not invent a spec to grade you against.',
        body: 'With no spec at all it says so plainly, rather than inferring intent from your code and then declaring your code correct.',
      },
      {
        label: 'The council lens, standalone.',
        body: 'This is nyaa\'s spec reviewer on its own, for repos that want the spec question answered without the other four reviewers.',
      },
    ],
    category: 'coding',
    tags: [
      'code-review',
      'spec',
      'spec-conformance',
      'product-intent',
      'pr-description',
      'drift',
      'documentation',
      'pull-request',
    ],
    source: 'nekko-official',
    author: 'Nekko Labs',
    sourceUrl:
      'https://github.com/nekko-labs/vaizer/tree/main/plugins/vaizer/skills/codereview-spec',
    installCommand: '/plugin install vaizer@vaizer',
    beginnerFriendly: true,
    workflow: wf(
      [
        { id: 't', kind: 'trigger', label: '/codereview-spec', detail: 'A PR, a diff, or a spec file' },
        { id: 'find', kind: 'context', label: 'Find the spec', detail: 'SPEC.md, TASKS.md, PRD, AGENTS.md' },
        { id: 'mode', kind: 'decision', label: 'Diff or spec?', detail: 'The target picks the mode' },
        { id: 'desc', kind: 'context', label: 'Read the PR description', detail: 'The stated goal + the value claimed' },
        { id: 'delta', kind: 'context', label: 'Read the spec diff', detail: 'What the change did to it' },
        { id: 'intent', kind: 'agent', label: 'Code vs intent', detail: 'Goal met? drift, scope creep' },
        { id: 'audit', kind: 'agent', label: 'Audit the spec', detail: 'Gaps, contradictions, staleness' },
        { id: 'merge', kind: 'agent', label: 'Rank findings', detail: 'Blocking vs informational' },
        { id: 'out', kind: 'output', label: 'Spec verdict' },
      ],
      [
        { from: 't', to: 'find' },
        { from: 'find', to: 'mode' },
        { from: 'mode', to: 'desc', label: 'diff' },
        { from: 'mode', to: 'audit', label: 'spec' },
        { from: 'desc', to: 'delta' },
        { from: 'delta', to: 'intent' },
        { from: 'intent', to: 'audit' },
        { from: 'audit', to: 'merge' },
        { from: 'merge', to: 'out' },
      ],
    ),
  },
  {
    id: 'nyaa',
    name: 'nyaa',
    slug: 'nyaa',
    description:
      'Five reviewer cats read your PR or working diff, one lens each. The first checks the code against what the PR description promised and against SPEC.md; the rest cover security, dependencies, correctness, and style. Choose which cats sit, and external bot reviews fold into a single verdict.',
    longDescription:
      'Five specialist reviewers read your pull request or working diff, each hunting one kind of problem, and their findings merge into a single verdict. The heaviest one reads intent before code: your PR description says what this change is for and what it is worth, your SPEC.md says what the product is, and the review is whether the diff actually delivered that.',
    highlights: [
      {
        label: 'Holds the code to what the PR said it would do.',
        body: 'It reads the description first, pulls out the goal and the value being claimed, then traces that claim through the diff. Not met, or claimed and missing, is blocking. An empty description is a finding too, and it drafts one for you.',
      },
      {
        label: 'Checks the change against your spec.',
        body: 'The heaviest lens reads SPEC.md before the code, then flags anything the spec never promised and any feature that shipped without the spec being updated. When the change contradicts a feature the spec still describes, it says so as a stale spec, with the sentence to change.',
      },
      {
        label: 'Reviews the spec itself, not just the code.',
        body: 'Missing feature definitions, no stated test expectation, undocumented conventions. Each gap comes back with the sentence to add, so the spec improves instead of just being blamed.',
      },
      {
        label: 'Four more lenses, one concern each.',
        body: 'Security, dependencies and supply chain, correctness and concurrency, style and lint. One reviewer per concern stays sharper than one reviewer for everything.',
      },
      {
        label: 'Runs your real tools, not just the diff text.',
        body: 'The dependency cat runs your audit; the style cat runs your linter and separates failures this change caused from ones that were already there.',
      },
      {
        label: 'You choose who reviews.',
        body: 'All five sit by default. Narrow the council with --cats, --skip, or --pick for an interactive roster. The verdict always names who sat, so a partial pass can never read as a clean one.',
      },
      {
        label: 'Folds in the bots you already run.',
        body: 'Codex and Dependabot findings are pulled in and cited, including when Codex skipped the PR, which is precisely when you need to know nothing else reviewed it.',
      },
    ],
    category: 'coding',
    tags: [
      'code-review',
      'pull-request',
      'pr-description',
      'spec',
      'spec-conformance',
      'product-intent',
      'security',
      'dependencies',
      'supply-chain',
      'concurrency',
      'lint',
    ],
    source: 'nekko-official',
    author: 'Nekko Labs',
    sourceUrl:
      'https://github.com/nekko-labs/vaizer/tree/main/plugins/vaizer/skills/nyaa',
    installCommand: '/plugin install vaizer@vaizer',
    featured: true,
    workflow: wf(
      [
        { id: 't', kind: 'trigger', label: '/cr', detail: 'A PR or your working diff' },
        { id: 'ctx', kind: 'context', label: 'Load diff', detail: 'Changed files + bot reviews' },
        { id: 'desc', kind: 'context', label: 'Read the PR description', detail: 'The stated goal + the value claimed' },
        { id: 'spec', kind: 'context', label: 'Read the spec', detail: 'SPEC.md + what the diff did to it' },
        { id: 'conf', kind: 'agent', label: '👻 Spec cat', detail: 'Goal met? drift + spec gaps' },
        { id: 'sec', kind: 'agent', label: '🐱 Security cat', detail: 'Vulns, secrets, authz' },
        { id: 'dep', kind: 'agent', label: '🐱 Supply-chain cat', detail: 'Deps + licenses' },
        { id: 'corr', kind: 'agent', label: '🐱 Correctness cat', detail: 'Bugs + concurrency' },
        { id: 'style', kind: 'agent', label: '🐱 Style cat', detail: 'Clarity + conventions' },
        { id: 'merge', kind: 'agent', label: 'Consolidate', detail: 'Merge + dedupe findings' },
        { id: 'out', kind: 'output', label: 'Council review' },
      ],
      [
        { from: 't', to: 'ctx' },
        { from: 'ctx', to: 'desc' },
        { from: 'desc', to: 'spec' },
        { from: 'spec', to: 'conf' },
        { from: 'spec', to: 'sec' },
        { from: 'spec', to: 'dep' },
        { from: 'spec', to: 'corr' },
        { from: 'spec', to: 'style' },
        { from: 'conf', to: 'merge' },
        { from: 'sec', to: 'merge' },
        { from: 'dep', to: 'merge' },
        { from: 'corr', to: 'merge' },
        { from: 'style', to: 'merge' },
        { from: 'merge', to: 'out' },
      ],
    ),
  },
  {
    id: 'resume-checker',
    name: 'Resume Checker',
    slug: 'resume-checker',
    description:
      'Check a resume against automated candidate-screening (ATS) signals and AI-centric job expectations, score it against specific job postings, then interactively apply fixes and see exactly what changed.',
    longDescription:
      'A five-stage resume review built for how screening actually works now. Give it a resume (and optionally links to jobs you want to apply to): it auto-detects the role type (family, seniority, how AI-centric the target is) and evaluates accordingly, checking automated-screening signals (parseability, section structure, keyword and requirement matching, quantified impact) alongside the expectations showing up in AI-era job descriptions. The output is a self-contained HTML report with findings, concrete suggested changes, and, per job link, an honest success-likelihood estimate for surviving the automated screen. Then it gets interactive: pick all or some of the suggestions, and it applies them to a copy of your resume and highlights exactly what changed.',
    category: 'career',
    tags: ['resume', 'cv', 'ats', 'job-hunt', 'career', 'screening', 'ai-roles'],
    source: 'nekko-official',
    author: 'Nekko Labs',
    sourceUrl:
      'https://github.com/nekko-labs/vaizer/tree/main/plugins/vaizer/skills/resume-checker',
    installCommand: '/plugin install vaizer@vaizer',
    beginnerFriendly: true,
    featured: true,
    workflow: wf(
      [
        { id: 't', kind: 'trigger', label: '/resume-checker', detail: 'Resume + optional job links' },
        { id: 'ctx', kind: 'context', label: 'Load resume + jobs', detail: 'Fetch each posting' },
        { id: 'role', kind: 'agent', label: 'Detect role type', detail: 'Family, seniority, AI-centricity' },
        { id: 'eval', kind: 'agent', label: 'Evaluate resume', detail: 'ATS + AI-era lenses' },
        { id: 'match', kind: 'agent', label: 'Score vs jobs', detail: 'Keyword gaps + likelihood' },
        { id: 'rep', kind: 'tool', label: 'Write HTML report', detail: 'Findings + suggestions S1...' },
        { id: 'dec', kind: 'decision', label: 'Apply which fixes?' },
        { id: 'fix', kind: 'tool', label: 'Apply chosen edits', detail: 'To a copy, never the original' },
        { id: 'out', kind: 'output', label: 'Updated resume + change highlights' },
      ],
      [
        { from: 't', to: 'ctx' },
        { from: 'ctx', to: 'role' },
        { from: 'role', to: 'eval' },
        { from: 'eval', to: 'match' },
        { from: 'match', to: 'rep' },
        { from: 'rep', to: 'dec' },
        { from: 'dec', to: 'fix', label: 'all / some' },
        { from: 'dec', to: 'out', label: 'keep as-is' },
        { from: 'fix', to: 'eval', label: 're-score', back: true },
        { from: 'fix', to: 'out' },
      ],
    ),
  },
  // --- Curated external skills (link-only, attributed) ---
  {
    id: 'impeccable',
    name: 'Impeccable',
    slug: 'impeccable',
    description:
      'Paul Bakaus’s design language for AI harnesses: a shared vocabulary (polish, audit, critique, distill...) plus 46 deterministic detector rules that keep your agent’s UI work from sliding into slop. Not a Nekko Labs skill.',
    longDescription:
      'Impeccable, by Paul Bakaus (creator of jQuery UI), gives your coding agent a real design vocabulary. `/impeccable init` captures your product’s audience, brand lane, voice, colors, and components into PRODUCT.md and DESIGN.md; commands like polish, audit, critique, bolder, and quieter then act with that context. Under the hood it pairs 46 deterministic detector rules with LLM-only critique checks, and its installer wires a hook that reviews direct UI file edits as your agent works. Third-party and MIT-licensed: this is a curated listing with attribution, not a Nekko Labs skill; install it from its own repo.',
    category: 'design',
    tags: ['design', 'ui', 'frontend', 'polish', 'critique', 'third-party'],
    source: 'curated',
    author: 'Paul Bakaus',
    sourceUrl: 'https://github.com/pbakaus/impeccable',
    featured: true,
    workflow: wf(
      [
        { id: 't', kind: 'trigger', label: '/impeccable', detail: 'polish / audit / critique ...' },
        { id: 'ctx', kind: 'context', label: 'Load design context', detail: 'PRODUCT.md + DESIGN.md' },
        { id: 'det', kind: 'tool', label: 'Run detectors', detail: '46 deterministic rules' },
        { id: 'crit', kind: 'agent', label: 'LLM critique', detail: 'Taste checks rules can’t catch' },
        { id: 'dec', kind: 'decision', label: 'Findings?' },
        { id: 'fix', kind: 'tool', label: 'Apply fixes', detail: 'Edit the UI files' },
        { id: 'out', kind: 'output', label: 'Polished UI + report' },
      ],
      [
        { from: 't', to: 'ctx' },
        { from: 'ctx', to: 'det' },
        { from: 'ctx', to: 'crit' },
        { from: 'det', to: 'dec' },
        { from: 'crit', to: 'dec' },
        { from: 'dec', to: 'fix', label: 'yes' },
        { from: 'dec', to: 'out', label: 'clean' },
        { from: 'fix', to: 'det', label: 're-check', back: true },
        { from: 'fix', to: 'out' },
      ],
    ),
  },
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
 * symmetrically. Pure + deterministic. Ported from the Kotrain desktop app.
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
