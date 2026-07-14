import Link from 'next/link';
import {
  categoryLabels,
  isInstallable,
  sourceBadges,
  sourceLabels,
  type Skill,
} from '@/data/skills';
import { SkillVote } from './SkillVote';
import { ArrowRightIcon, DownloadIcon, ExternalLinkIcon } from './icons';

/**
 * Catalog card for a single skill. Whole card links to the detail page; the
 * upvote control and its own affordances sit above that as separate targets.
 */
export function SkillCard({ skill, voteCount }: { skill: Skill; voteCount: number }) {
  const installable = isInstallable(skill);

  return (
    <article
      className={`group relative flex h-full flex-col rounded-2xl border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent ${
        skill.featured ? 'border-accent/50' : 'border-border'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-muted"
          title={`${sourceLabels[skill.source]} skill`}
        >
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
        {skill.featured && (
          <span className="ml-auto text-accent" aria-label="Featured">
            ★
          </span>
        )}
      </div>

      <Link href={`/skills/${skill.slug}`} className="mt-3 block">
        <h3 className="text-lg font-semibold tracking-tight group-hover:text-accent">
          {skill.name}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{skill.description}</p>
      </Link>

      {skill.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {skill.tags.slice(0, 4).map((tag) => (
            <li key={tag} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 pt-1">
        <SkillVote skillId={skill.id} initialCount={voteCount} size="sm" />
        <Link
          href={`/skills/${skill.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
        >
          {installable ? (
            <>
              <DownloadIcon className="h-3.5 w-3.5" /> Get skill
            </>
          ) : (
            <>
              <ExternalLinkIcon className="h-3.5 w-3.5" /> View source
            </>
          )}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
