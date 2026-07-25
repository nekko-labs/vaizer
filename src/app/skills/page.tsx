import type { Metadata } from 'next';
import { getAllSkills, getUsedCategories } from '@/data/skills';
import { getVoteCounts } from '@/lib/votes';
import { SkillsSearch, type SkillWithVotes } from '@/components/SkillsSearch';
import { Reveal } from '@/components/motion';

export const metadata: Metadata = {
  title: 'Skills',
  description:
    'Search any skill, from our catalog or anywhere on GitHub, and see exactly how it runs as a workflow graph before you trust it with your machine.',
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
          Search for any skill, ours or anyone&apos;s, and open it to see how it runs: the trigger,
          the context it gathers, the tools it calls, where it branches and loops, and what it
          hands back. Read the workflow before you run it.
        </p>
      </Reveal>

      <div className="mt-10">
        <SkillsSearch items={items} categories={getUsedCategories()} />
      </div>
    </div>
  );
}
