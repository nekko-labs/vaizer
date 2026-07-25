'use client';

import type { RemoteSkill } from '@/app/api/anthropic-skills/route';
import type { SkillCategory } from '@/data/skills';
import type { VizTarget } from '../SkillVizPanel';
import { Stagger, StaggerItem } from '../motion';
import { SkillResultCard } from './SkillResultCard';
import { SkillsFilters } from './SkillsFilters';
import { catalogToTarget, GROUPS, remoteToTarget, type SkillWithVotes } from './helpers';

/**
 * With no query, the catalog and Anthropic's skills are browsable as
 * trust-tiered lists, filterable by category.
 */
export function SkillsBrowse({
  items,
  remoteSkills,
  remoteLoading,
  categories,
  category,
  setCategory,
  onSelect,
}: {
  items: SkillWithVotes[];
  remoteSkills: RemoteSkill[];
  remoteLoading: boolean;
  categories: SkillCategory[];
  category: SkillCategory | 'all';
  setCategory: (c: SkillCategory | 'all') => void;
  onSelect: (t: VizTarget) => void;
}) {
  const filtered =
    category === 'all' ? items : items.filter((i) => i.skill.category === category);

  return (
    <div className="mt-6">
      <SkillsFilters categories={categories} category={category} setCategory={setCategory} />

      <div className="mt-8 space-y-12">
        {GROUPS.map((group) => {
          const groupItems = filtered.filter((i) => i.skill.source === group.source);
          const alwaysShow = group.source === 'nekko-official' || group.source === 'community';
          if (!alwaysShow && groupItems.length === 0) return null;

          return (
            <section key={group.source} aria-labelledby={`group-${group.source}`}>
              <div className="flex items-baseline gap-2">
                <h2 id={`group-${group.source}`} className="text-xl font-semibold tracking-tight">
                  {group.title}
                </h2>
                <span className="text-sm text-muted">{groupItems.length}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{group.blurb}</p>

              {groupItems.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
                  {category !== 'all'
                    ? 'No skills in this tier match that category.'
                    : group.source === 'community'
                      ? 'No community skills yet. Submit yours via PR to the marketplace.'
                      : 'Nothing here yet.'}
                </p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupItems.map((i) => (
                    <SkillResultCard key={i.skill.id} target={catalogToTarget(i)} onSelect={onSelect} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* Anthropic's official skills, live from their repo. Hidden when a
            catalog-only category filter is active (these carry no category). */}
        {category === 'all' && (
          <section aria-labelledby="group-anthropic">
            <div className="flex items-baseline gap-2">
              <h2 id="group-anthropic" className="text-xl font-semibold tracking-tight">
                🔗 Anthropic official
              </h2>
              <span className="text-sm text-muted">{remoteSkills.length}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Anthropic&apos;s official skills, read live from their repo. Click any one to break
              down its workflow.
            </p>

            {remoteLoading ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
                Loading Anthropic&apos;s skills…
              </p>
            ) : remoteSkills.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
                Could not reach Anthropic&apos;s skill repo right now.
              </p>
            ) : (
              <Stagger className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.04}>
                {remoteSkills.map((r) => (
                  <StaggerItem key={r.id} className="h-full">
                    <SkillResultCard
                      target={remoteToTarget(r)}
                      skillName={r.name}
                      description={r.description}
                      onSelect={onSelect}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
