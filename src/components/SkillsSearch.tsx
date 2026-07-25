'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { type SkillCategory } from '@/data/skills';
import type { RemoteSkill } from '@/app/api/anthropic-skills/route';
import { SkillVizPanel, type VizTarget } from './SkillVizPanel';
import { SearchIcon } from './icons';
import { SkillsResults } from './skills/SkillsResults';
import { SkillsBrowse } from './skills/SkillsBrowse';
import { catalogToTarget, detectUrlTarget, type SkillWithVotes } from './skills/helpers';

export type { SkillWithVotes } from './skills/helpers';

/**
 * The Skills page, rebuilt around one search box. You search across our own
 * catalog and Anthropic's official skills at once, or paste any public GitHub
 * URL; clicking any result opens its workflow visualization inline. With no
 * query, the same results are browsable as trust-tiered lists below.
 *
 * The search query, active category, and the currently open skill are all
 * mirrored to the URL (?q=, ?cat=, ?skill=, ?inspect=), so any view, including
 * a broken-down public skill, is a shareable permalink.
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
  const initialized = useRef(false);

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

  // Restore view from the URL once, on mount, so shared links land correctly.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? '';
    const cat = params.get('cat');
    const skillSlug = params.get('skill');
    const inspect = params.get('inspect');
    if (q) setQuery(q);
    if (cat && categories.includes(cat as SkillCategory)) setCategory(cat as SkillCategory);
    if (skillSlug) {
      const found = items.find((i) => i.skill.slug === skillSlug);
      if (found) setSelected(catalogToTarget(found));
    } else if (inspect) {
      const origin = params.get('src') === 'anthropic' ? 'anthropic' : 'url';
      const name = params.get('name') ?? detectUrlTarget(inspect)?.name ?? inspect;
      setSelected({ kind: 'remote', name, url: inspect, origin });
    }
    initialized.current = true;
  }, [items, categories]);

  // Reflect the current view back into the URL as a shareable permalink.
  useEffect(() => {
    if (!initialized.current) return;
    const params = new URLSearchParams();
    if (selected) {
      if (selected.kind === 'catalog') {
        params.set('skill', selected.skill.slug);
      } else {
        params.set('inspect', selected.url);
        params.set('src', selected.origin);
        if (selected.name) params.set('name', selected.name);
      }
    } else {
      if (query.trim()) params.set('q', query.trim());
      if (category !== 'all') params.set('cat', category);
    }
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [query, category, selected]);

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

  // Once a result is chosen, the workflow visualization takes over.
  if (selected) {
    return <SkillVizPanel target={selected} onBack={() => setSelected(null)} />;
  }

  const totalMatches =
    matchedCatalog.length + matchedRemote.length + (urlTarget ? 1 : 0);

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
        <SkillsResults
          urlTarget={urlTarget}
          catalog={matchedCatalog}
          remote={matchedRemote}
          remoteLoading={remoteLoading}
          total={totalMatches}
          onSelect={setSelected}
        />
      ) : (
        <SkillsBrowse
          items={items}
          remoteSkills={remoteSkills}
          remoteLoading={remoteLoading}
          categories={categories}
          category={category}
          setCategory={setCategory}
          onSelect={setSelected}
        />
      )}
    </div>
  );
}
