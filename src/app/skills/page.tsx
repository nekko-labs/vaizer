import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllSkills, getUsedCategories, skillsMarketplace } from '@/data/skills';
import { getVoteCounts } from '@/lib/votes';
import { InstallCommand } from '@/components/InstallCommand';
import { SkillsExplorer, type SkillWithVotes } from '@/components/SkillsExplorer';
import { GitHubIcon, ArrowRightIcon } from '@/components/icons';
import { Reveal } from '@/components/motion';

export const metadata: Metadata = {
  title: 'Skills',
  description:
    'Browse skills and see exactly how each one runs as a workflow graph. Break down any public skill before you trust it with your machine.',
};

// Rebuild periodically so newly added skills and vote counts stay fresh.
export const revalidate = 3600;

export default async function SkillsPage() {
  const skills = getAllSkills();
  const counts = await getVoteCounts();
  const items: SkillWithVotes[] = skills.map((skill) => ({
    skill,
    voteCount: counts[skill.id] ?? 0,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Reveal as="header" load className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Skills</h1>
        <p className="mt-3 text-lg text-muted">
          Every skill is a workflow: a trigger, the context it gathers, the steps the agent
          reasons through, the tools it runs, and what it hands back. Open any skill to see that
          graph and click through it, so you know what a skill does before you run it.
        </p>
      </Reveal>

      {/* Break down any public skill */}
      <Reveal load delay={0.08} className="mt-8">
        <Link
          href="/skills/inspect"
          className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-5 transition hover:border-accent sm:p-6"
        >
          <div>
            <h2 className="font-semibold tracking-tight text-fg">Break down any public skill</h2>
            <p className="mt-1 text-sm text-muted">
              Not in the catalog? Paste a GitHub URL, or pick one of Anthropic&apos;s official
              skills, and Vaizer will draw its workflow.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            Break it down
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </Reveal>

      {/* Add-the-marketplace primer */}
      <Reveal load delay={0.14} className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight">Install from the marketplace</h2>
            <p className="mt-1 text-sm text-muted">
              Add the marketplace once in Claude Code, then install any skill by name.
            </p>
          </div>
          <a
            href={skillsMarketplace.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
          >
            <GitHubIcon className="h-4 w-4" /> View the repo
          </a>
        </div>
        <div className="mt-4">
          <InstallCommand command={skillsMarketplace.addCommand} label="Add the marketplace (once)" />
        </div>
      </Reveal>

      <div className="mt-10">
        <SkillsExplorer items={items} categories={getUsedCategories()} />
      </div>
    </div>
  );
}
