'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  categoryLabels,
  sourceBadges,
  sourceLabels,
  type Skill,
  type SkillCategory,
  type SkillSource,
} from '@/data/skills';
import type { RemoteSkill } from '@/app/api/anthropic-skills/route';
import { SkillVizPanel, type VizTarget } from './SkillVizPanel';
import { Stagger, StaggerItem } from './motion';
import { ArrowRightIcon, GitHubIcon, SearchIcon } from './icons';

export type SkillWithVotes = { skill: Skill; voteCount: number };

type RemoteTarget = Extract<VizTarget, { kind: 'remote' }>;

/** Trust-tier presentation for the browsable catalog groups. */
const GROUPS: Array<{ source: SkillSource; title: string; blurb: string }> = [
  {
    source: 'nekko-official',
    title: '🟣 Nekko official',
    blurb: 'Built and reviewed by Nekko Labs. Safe to run once installed.',
  },
  {
    source: 'community',
    title: '🟢 Community',
    blurb: 'Submitted via PR to the marketplace. Audit the source before you run it.',
  },
  {
    source: 'curated',
    title: '🔗 Recommended from Anthropic',
    blurb: 'Great skills we did not build. Install them from their original source.',
  },
];

/** Does the query look like a GitHub link (or `owner/repo/...`) to break down? */
function detectUrlTarget(query: string): RemoteTarget | null {
  const s = query.trim();
  if (!s) return null;
  const nameFrom = (v: string) => {
    const seg = v.split(/[/?#]/).filter(Boolean);
    return seg[seg.length - 1] || v;
  };

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (/(^|\.)github\.com$/i.test(u.hostname) || u.hostname === 'raw.githubusercontent.com') {
        return { kind: 'remote', name: nameFrom(u.pathname), url: s, origin: 'url' };
      }
    } catch {
      /* not a URL */
    }
    return null;
  }
  if (/^(www\.)?github\.com\//i.test(s) || /^raw\.githubusercontent\.com\//i.test(s)) {
    return { kind: 'remote', name: nameFrom(s), url: `https://${s}`, origin: 'url' };
  }
  // owner/repo[/path], no whitespace.
  if (!/\s/.test(s) && /^[\w.-]+\/[\w.-]+(\/.+)?$/.test(s)) {
    return { kind: 'remote', name: nameFrom(s), url: `https://github.com/${s}`, origin: 'url' };
  }
  return null;
}

/**
 * The Skills page, rebuilt around one search box. You search across our own
 * catalog and Anthropic's official skills at once, or paste any public GitHub
 * URL; clicking any result opens its workflow visualization inline. With no
 * query, the same results are browsable as trust-tiered lists below.
 */
export function SkillsSearch({
  items,
  categories,
}: {
  items: SkillWithVotes[];
  categories: SkillCategory[];
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SkillCategory | 'all'>('all');
  const [selected, setSelected] = useState<VizTarget | null>(null);

  // Anthropic's official skills, fetched once and searched alongside the
  // catalog. Failure is silent: the page still works on the catalog + URLs.
  const [remote, setRemote] = useState<RemoteSkill[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/anthropic-skills');
        const data = (await res.json()) as { skills?: RemoteSkill[] };
        if (!cancelled) setRemote(data.skills ?? []);
      } catch {
        /* leave empty */
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Drop Anthropic-index skills we already curate in the catalog (same id), so
  // each skill shows once, preferring our hand-drawn catalog workflow.
  const catalogIds = useMemo(() => new Set(items.map((i) => i.skill.id)), [items]);
  const remoteSkills = useMemo(
    () => remote.filter((r) => !catalogIds.has(r.id)),
    [remote, catalogIds],
  );

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const urlTarget = useMemo(() => detectUrlTarget(query), [query]);

  const matchedCatalog = useMemo(() => {
    if (!searching) return [];
    return items.filter(({ skill }) =>
      [skill.name, skill.description, skill.author, ...skill.tags]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [items, q, searching]);

  const matchedRemote = useMemo(() => {
    if (!searching) return [];
    return remoteSkills.filter((r) =>
      [r.name, r.description, r.path, ...r.tags].join(' ').toLowerCase().includes(q),
    );
  }, [remoteSkills, q, searching]);

  const catalogToTarget = (i: SkillWithVotes): VizTarget => ({
    kind: 'catalog',
    skill: i.skill,
    voteCount: i.voteCount,
  });
  const remoteToTarget = (r: RemoteSkill): VizTarget => ({
    kind: 'remote',
    name: r.name,
    url: r.url,
    origin: 'anthropic',
  });

  // Once a result is chosen, the workflow visualization takes over.
  if (selected) {
    return <SkillVizPanel target={selected} onBack={() => setSelected(null)} />;
  }

  const totalMatches =
    matchedCatalog.length + matchedRemote.length + (urlTarget ? 1 : 0);

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition-colors ${
      active
        ? 'border-accent bg-accent/12 text-accent'
        : 'border-border text-muted hover:border-accent hover:text-accent'
    }`;

  return (
    <div>
      {/* The search box is the whole entry point. */}
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 focus-within:border-accent">
        <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills, or paste a GitHub URL…"
          aria-label="Search skills or paste a GitHub URL"
          className="w-full bg-transparent py-3 text-sm text-fg outline-none placeholder:text-muted"
        />
      </div>
      <p className="mt-2 px-1 text-xs text-muted">
        Searches our catalog and Anthropic&apos;s official skills. Paste any public GitHub URL to
        break down a skill that isn&apos;t listed.
      </p>

      {searching ? (
        <SearchResults
          urlTarget={urlTarget}
          catalog={matchedCatalog}
          remote={matchedRemote}
          remoteLoading={remoteLoading}
          total={totalMatches}
          onSelect={setSelected}
          catalogToTarget={catalogToTarget}
          remoteToTarget={remoteToTarget}
        />
      ) : (
        <BrowseLists
          items={items}
          remoteSkills={remoteSkills}
          remoteLoading={remoteLoading}
          categories={categories}
          category={category}
          setCategory={setCategory}
          chip={chip}
          onSelect={setSelected}
          catalogToTarget={catalogToTarget}
          remoteToTarget={remoteToTarget}
        />
      )}
    </div>
  );
}

/* -------------------------------- results -------------------------------- */

function SearchResults({
  urlTarget,
  catalog,
  remote,
  remoteLoading,
  total,
  onSelect,
  catalogToTarget,
  remoteToTarget,
}: {
  urlTarget: RemoteTarget | null;
  catalog: SkillWithVotes[];
  remote: RemoteSkill[];
  remoteLoading: boolean;
  total: number;
  onSelect: (t: VizTarget) => void;
  catalogToTarget: (i: SkillWithVotes) => VizTarget;
  remoteToTarget: (r: RemoteSkill) => VizTarget;
}) {
  return (
    <div className="mt-8">
      {urlTarget && (
        <button
          type="button"
          onClick={() => onSelect(urlTarget)}
          className="group flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-5 text-left transition hover:border-accent"
        >
          <div className="flex items-center gap-3">
            <GitHubIcon className="h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="font-semibold tracking-tight text-fg">Break down this URL</p>
              <p className="mt-0.5 break-all font-mono text-xs text-muted">{urlTarget.url}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            Break it down
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      )}

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {total} {total === 1 ? 'result' : 'results'}
      </p>

      {catalog.length > 0 && (
        <ResultSection title="From the catalog">
          {catalog.map((i) => (
            <SkillResultCard key={i.skill.id} target={catalogToTarget(i)} onSelect={onSelect} />
          ))}
        </ResultSection>
      )}

      {remote.length > 0 && (
        <ResultSection title="Anthropic official">
          {remote.map((r) => (
            <SkillResultCard key={r.id} target={remoteToTarget(r)} skillName={r.name} description={r.description} onSelect={onSelect} />
          ))}
        </ResultSection>
      )}

      {total === 0 && !remoteLoading && (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-muted">
          No skills match that. Try different keywords, or paste a public GitHub URL to break down
          any skill.
        </p>
      )}
      {total === 0 && remoteLoading && (
        <p className="mt-8 text-center text-sm text-muted">Searching Anthropic&apos;s skills…</p>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

/* --------------------------------- browse -------------------------------- */

function BrowseLists({
  items,
  remoteSkills,
  remoteLoading,
  categories,
  category,
  setCategory,
  chip,
  onSelect,
  catalogToTarget,
  remoteToTarget,
}: {
  items: SkillWithVotes[];
  remoteSkills: RemoteSkill[];
  remoteLoading: boolean;
  categories: SkillCategory[];
  category: SkillCategory | 'all';
  setCategory: (c: SkillCategory | 'all') => void;
  chip: (active: boolean) => string;
  onSelect: (t: VizTarget) => void;
  catalogToTarget: (i: SkillWithVotes) => VizTarget;
  remoteToTarget: (r: RemoteSkill) => VizTarget;
}) {
  const filtered =
    category === 'all' ? items : items.filter((i) => i.skill.category === category);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter the catalog by category">
        <button type="button" onClick={() => setCategory('all')} className={chip(category === 'all')}>
          All categories
        </button>
        {categories.map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)} className={chip(category === c)}>
            {categoryLabels[c]}
          </button>
        ))}
      </div>

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

/* ------------------------------- result card ------------------------------ */

/**
 * One clickable result. Works for both a catalog skill (rich badges, tags) and
 * a remote skill (name + description). Clicking opens the viz panel.
 */
function SkillResultCard({
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
