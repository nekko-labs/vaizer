import type { Metadata } from 'next';
import Link from 'next/link';
import { SkillInspector, type Shortcut } from '@/components/SkillInspector';
import { Reveal } from '@/components/motion';

export const metadata: Metadata = {
  title: 'Break down a skill',
  description:
    'Paste a public skill from GitHub and Vaizer draws its workflow: the trigger, the context it gathers, the tools it runs, and what it produces.',
};

/**
 * A few well-known public skills, so you can see the breakdown work with one
 * click. These fetch live from GitHub at request time.
 */
const SHORTCUTS: Shortcut[] = [
  {
    label: 'Anthropic · pdf',
    url: 'https://github.com/anthropics/skills/tree/main/skills/pdf',
    note: "Anthropic's official PDF skill",
  },
  {
    label: 'Anthropic · mcp-builder',
    url: 'https://github.com/anthropics/skills/tree/main/skills/mcp-builder',
    note: "Anthropic's skill for building MCP servers",
  },
  {
    label: 'Anthropic · skill-creator',
    url: 'https://github.com/anthropics/skills/tree/main/skills/skill-creator',
    note: "Anthropic's skill for authoring new skills",
  },
  {
    label: 'Anthropic · webapp-testing',
    url: 'https://github.com/anthropics/skills/tree/main/skills/webapp-testing',
    note: "Anthropic's browser-testing skill",
  },
];

export default function InspectPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Reveal as="header" load className="max-w-2xl">
        <Link href="/skills" className="text-sm text-accent hover:text-accent-hover">
          ← Skills
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Break down a skill
        </h1>
        <p className="mt-3 text-lg text-muted">
          Point Vaizer at any public skill on GitHub. It fetches the{' '}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">SKILL.md</code>,
          reads its frontmatter and instructions, and draws the workflow: the trigger, the
          context it gathers, where it branches and loops, and what it produces.
        </p>
      </Reveal>

      <Reveal load delay={0.1} className="mt-8">
        <SkillInspector shortcuts={SHORTCUTS} />
      </Reveal>

      <Reveal className="mt-12 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
        <p className="font-medium text-fg">How it works</p>
        <p className="mt-2 leading-relaxed">
          There is no formal &quot;workflow&quot; inside a SKILL.md, so Vaizer infers one: it pulls
          out the ordered steps (numbered lists, headings, then bullets), classifies each into a
          node kind by what it does, and wires them together. It is a readable approximation of
          how a skill runs, not a formal execution trace.
        </p>
      </Reveal>
    </div>
  );
}
