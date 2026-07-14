'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  categoryLabels,
  type Skill,
  type SkillCategory,
  type SkillSource,
} from '@/data/skills';
import { SkillCard } from './SkillCard';
import { Stagger, StaggerItem } from './motion';

export type SkillWithVotes = { skill: Skill; voteCount: number };

/** Presentation for each source group: heading, blurb, and accent glyph. */
const GROUPS: Array<{
  source: SkillSource;
  badge: string;
  title: string;
  blurb: string;
}> = [
  {
    source: 'nekko-official',
    badge: '🟣',
    title: 'Nekko official',
    blurb: 'Built and reviewed by Nekko Labs. Safe to run once installed.',
  },
  {
    source: 'community',
    badge: '🟢',
    title: 'Community',
    blurb: 'Submitted via PR to the marketplace. Audit the source before you run it.',
  },
  {
    source: 'curated',
    badge: '🔗',
    title: 'Recommended from Anthropic',
    blurb:
      'Great skills we did not build. Install them from their original source, with attribution.',
  },
];

/**
 * Client-side catalog browser. Search + category filters apply across the whole
 * catalog, and results are split into visually distinct source groups
 * (official / community / recommended) so the trust tier is obvious at a glance.
 */
export function SkillsExplorer({
  items,
  categories,
}: {
  items: SkillWithVotes[];
  categories: SkillCategory[];
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SkillCategory | 'all'>('all');

  // The grid staggers in once on first render; after the entrance settles,
  // cards added by filtering/searching appear instantly so filtering never
  // feels sluggish.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(({ skill }) => {
      if (category !== 'all' && skill.category !== category) return false;
      if (!q) return true;
      const haystack = [skill.name, skill.description, skill.author, ...skill.tags]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query, category]);

  // Which source groups exist at all in the catalog (before filtering), so an
  // empty-but-real tier (e.g. Community) can still show its invitation.
  const presentSources = useMemo(
    () => new Set(items.map((i) => i.skill.source)),
    [items],
  );

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition-colors ${
      active
        ? 'border-accent bg-accent/12 text-accent'
        : 'border-border text-muted hover:border-accent hover:text-accent'
    }`;

  return (
    <div>
      <div className="flex flex-col gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills…"
          aria-label="Search skills"
          className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
        />

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={chip(category === 'all')}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={chip(category === c)}
            >
              {categoryLabels[c]}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'skill' : 'skills'}
      </p>

      <div className="mt-4 space-y-12">
        {GROUPS.map((group) => {
          const groupItems = filtered.filter((i) => i.skill.source === group.source);
          // Always show official + community (community shows its "submit yours"
          // invitation even when empty, so the tier split is explicit). Other
          // tiers only appear when the catalog actually has skills in them.
          const alwaysShow = group.source === 'nekko-official' || group.source === 'community';
          if (!alwaysShow && !presentSources.has(group.source)) return null;
          const emptyFromFilter = groupItems.length === 0;

          return (
            <section key={group.source} aria-labelledby={`group-${group.source}`}>
              <div className="flex items-baseline gap-2">
                <h2
                  id={`group-${group.source}`}
                  className="text-xl font-semibold tracking-tight"
                >
                  <span aria-hidden className="mr-1.5">
                    {group.badge}
                  </span>
                  {group.title}
                </h2>
                <span className="text-sm text-muted">{groupItems.length}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{group.blurb}</p>

              {emptyFromFilter ? (
                <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
                  {query || category !== 'all'
                    ? 'No skills in this tier match your filters.'
                    : group.source === 'community'
                      ? 'No community skills yet. Submit yours via PR to the marketplace.'
                      : 'Nothing here yet.'}
                </p>
              ) : (
                <Stagger
                  className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  gap={0.06}
                >
                  {groupItems.map(({ skill, voteCount }) => (
                    <StaggerItem key={skill.id} className="h-full" instant={settled}>
                      <SkillCard skill={skill} voteCount={voteCount} />
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
            </section>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-muted">No skills match your filters yet.</p>
        )}
      </div>
    </div>
  );
}
