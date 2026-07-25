'use client';

import {
  categoryLabels,
  sourceBadges,
  sourceLabels,
} from '@/data/skills';
import type { VizTarget } from '../SkillVizPanel';
import { ArrowRightIcon } from '../icons';

/**
 * One clickable result. Works for both a catalog skill (rich badges, tags) and
 * a remote skill (name + description). Clicking opens the viz panel.
 */
export function SkillResultCard({
  target,
  skillName,
  description,
  onSelect,
}: {
  target: VizTarget;
  skillName?: string;
  description?: string;
  onSelect: (t: VizTarget) => void;
}) {
  const isCatalog = target.kind === 'catalog';
  const skill = isCatalog ? target.skill : null;
  const name = isCatalog ? skill!.name : skillName ?? target.name;
  const desc = isCatalog ? skill!.description : description ?? '';

  return (
    <button
      type="button"
      onClick={() => onSelect(target)}
      className={`group flex h-full w-full flex-col rounded-2xl border bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-accent ${
        skill?.featured ? 'border-accent/50' : 'border-border'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {isCatalog ? (
          <>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-muted">
              {sourceBadges[skill!.source]} {sourceLabels[skill!.source]}
            </span>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-muted">
              {categoryLabels[skill!.category]}
            </span>
            {skill!.beginnerFriendly && (
              <span className="rounded-full bg-accent/12 px-2.5 py-0.5 font-medium text-accent">
                Beginner friendly
              </span>
            )}
            {skill!.featured && (
              <span className="ml-auto text-accent" aria-label="Featured">
                ★
              </span>
            )}
          </>
        ) : (
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-muted">
            🔗 Anthropic official
          </span>
        )}
      </div>

      <h3 className="mt-3 text-lg font-semibold tracking-tight group-hover:text-accent">{name}</h3>
      {desc && <p className="mt-2 line-clamp-3 text-sm text-muted">{desc}</p>}

      {isCatalog && skill!.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {skill!.tags.slice(0, 4).map((tag) => (
            <li key={tag} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
        {isCatalog ? 'View workflow' : 'Break it down'}
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
