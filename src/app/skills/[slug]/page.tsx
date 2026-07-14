import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  categoryLabels,
  getSkillBySlug,
  isInstallable,
  skills,
  skillsMarketplace,
  sourceBadges,
  sourceLabels,
} from '@/data/skills';
import { getVoteCount } from '@/lib/votes';
import { InstallCommand } from '@/components/InstallCommand';
import { DownloadButton } from '@/components/DownloadButton';
import { SkillVote } from '@/components/SkillVote';
import { SkillFeedback } from '@/components/SkillFeedback';
import { SkillWorkflow } from '@/components/SkillWorkflow';
import { DiscordCTA } from '@/components/DiscordCTA';
import { ExternalLinkIcon, GitHubIcon } from '@/components/icons';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return skills.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) return {};
  return { title: skill.name, description: skill.description };
}

export const revalidate = 3600;

export default async function SkillDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);
  if (!skill) notFound();

  const votes = await getVoteCount(skill.id);
  const installable = isInstallable(skill);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/skills" className="text-sm text-accent hover:text-accent-hover">
        ← Skills
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-muted">
            {sourceBadges[skill.source]} {sourceLabels[skill.source]}
          </span>
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-muted">
            {categoryLabels[skill.category]}
          </span>
          {skill.beginnerFriendly && (
            <span className="rounded-full bg-accent/12 px-2.5 py-0.5 font-medium text-accent">
              Beginner friendly
            </span>
          )}
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{skill.name}</h1>
          <SkillVote skillId={skill.id} initialCount={votes} />
        </div>
        <p className="mt-1 text-sm text-muted">by {skill.author}</p>
        <p className="mt-4 text-lg text-muted">{skill.longDescription ?? skill.description}</p>

        {skill.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      {skill.workflow && (
        <>
          <hr className="my-8 border-border" />
          <section aria-labelledby="workflow-heading">
            <h2 id="workflow-heading" className="text-lg font-semibold tracking-tight">
              How it works
            </h2>
            <p className="mt-1 text-sm text-muted">
              The steps this skill runs through when you invoke it. Click any step to see what it
              does.
            </p>
            <div className="mt-4">
              <SkillWorkflow workflow={skill.workflow} />
            </div>
          </section>
        </>
      )}

      <hr className="my-8 border-border" />

      {installable ? (
        <section aria-labelledby="get-heading">
          <h2 id="get-heading" className="text-lg font-semibold tracking-tight">
            Get this skill
          </h2>
          <div className="mt-4 space-y-3">
            <InstallCommand
              command={skillsMarketplace.addCommand}
              label="1. Add the marketplace (once)"
            />
            {skill.installCommand && (
              <InstallCommand
                command={skill.installCommand}
                skillId={skill.id}
                label="2. Install the skill"
              />
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <DownloadButton skillId={skill.id} slug={skill.slug} />
            <a
              href={skill.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
            >
              <GitHubIcon className="h-4 w-4" /> View source
            </a>
          </div>
          <p className="mt-3 text-xs text-muted">
            Skills run with your machine&apos;s permissions. Read the source before you run
            anything you didn&apos;t write.
          </p>
        </section>
      ) : (
        <section aria-labelledby="external-heading">
          <h2 id="external-heading" className="text-lg font-semibold tracking-tight">
            External skill
          </h2>
          <p className="mt-2 text-sm text-muted">
            This is a curated skill we link to with attribution — install it from its original
            source rather than our marketplace.
          </p>
          <a
            href={skill.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            Go to source
            <ExternalLinkIcon className="h-4 w-4" />
          </a>
        </section>
      )}

      <hr className="my-8 border-border" />

      <SkillFeedback skillId={skill.id} />

      <div className="mt-16">
        <DiscordCTA />
      </div>
    </div>
  );
}
