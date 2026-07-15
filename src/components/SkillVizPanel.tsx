'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  categoryLabels,
  isInstallable,
  skillsMarketplace,
  sourceBadges,
  sourceLabels,
  type Skill,
  type SkillWorkflow as SkillWorkflowGraph,
} from '@/data/skills';
import { SkillWorkflow } from './SkillWorkflow';
import { InstallCommand } from './InstallCommand';
import { SkillVote } from './SkillVote';
import { ArrowLeftIcon, ExternalLinkIcon, GitHubIcon } from './icons';
import { capture } from '@/lib/analytics';

/**
 * What the viz panel renders. A `catalog` target already carries its workflow
 * (from our typed catalog); a `remote` target is any public skill we break down
 * live via /api/inspect (Anthropic's official ones, or a pasted GitHub URL).
 */
export type VizTarget =
  | { kind: 'catalog'; skill: Skill; voteCount: number }
  | { kind: 'remote'; name: string; url: string; origin: 'anthropic' | 'url' };

type InspectResult = {
  source: string;
  name: string;
  description: string;
  tools: string[];
  workflow: SkillWorkflowGraph;
  lowConfidence: boolean;
};

/**
 * The inline "visualization flow": once a search result is clicked, its
 * workflow graph takes over the panel with a control back to the results.
 * Catalog skills render their stored graph immediately; remote skills fetch and
 * parse their SKILL.md first.
 */
export function SkillVizPanel({ target, onBack }: { target: VizTarget; onBack: () => void }) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to search
      </button>

      <div className="mt-4">
        {target.kind === 'catalog' ? (
          <CatalogViz skill={target.skill} voteCount={target.voteCount} />
        ) : (
          <RemoteViz name={target.name} url={target.url} origin={target.origin} />
        )}
      </div>
    </div>
  );
}

/** Visualize a catalog skill from its stored workflow + install affordances. */
function CatalogViz({ skill, voteCount }: { skill: Skill; voteCount: number }) {
  useEffect(() => {
    capture('skill_viewed', { skill_id: skill.id, surface: 'search' });
  }, [skill.id]);

  const installable = isInstallable(skill);

  return (
    <div>
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
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{skill.name}</h2>
          <p className="mt-1 text-sm text-muted">by {skill.author}</p>
        </div>
        <SkillVote skillId={skill.id} initialCount={voteCount} />
      </div>

      <p className="mt-4 text-muted">{skill.longDescription ?? skill.description}</p>

      {skill.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {skill.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}

      {skill.workflow ? (
        <div className="mt-6">
          <SkillWorkflow workflow={skill.workflow} />
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          This skill does not have a workflow graph yet.
        </p>
      )}

      {installable && (
        <div className="mt-6 space-y-3">
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
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href={`/skills/${skill.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
        >
          Open full page
          <ArrowLeftIcon className="h-4 w-4 rotate-180" />
        </Link>
        <a
          href={skill.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
        >
          <GitHubIcon className="h-4 w-4" /> View source
        </a>
      </div>
    </div>
  );
}

/** Break down a public skill live and render its parsed workflow. */
function RemoteViz({
  name,
  url,
  origin,
}: {
  name: string;
  url: string;
  origin: 'anthropic' | 'url';
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InspectResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);

    (async () => {
      try {
        const res = await fetch('/api/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || 'Could not break down that skill.');
        } else {
          setResult(data as InspectResult);
          capture('skill_inspected', { source: (data as InspectResult).source, origin });
        }
      } catch {
        if (!cancelled) setError('Something went wrong reaching that skill. Try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, origin]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
        Breaking down <span className="font-medium text-fg">{name}</span>…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-muted">
          {origin === 'anthropic' ? '🔗 Anthropic official' : '🔗 Public skill'}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{result.name}</h2>
        <a
          href={result.source}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
        >
          View SKILL.md
          <ExternalLinkIcon className="h-4 w-4" />
        </a>
      </div>

      {result.description && <p className="mt-1 max-w-2xl text-muted">{result.description}</p>}

      {result.tools.length > 0 && (
        <div className="mt-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Allowed tools
          </span>
          <ul className="mt-2 flex flex-wrap gap-2">
            {result.tools.map((t) => (
              <li
                key={t}
                className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-xs text-subtle"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.lowConfidence && (
        <p className="mt-4 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
          This skill did not have much explicit structure, so the breakdown below is a best-effort
          guess at its shape.
        </p>
      )}

      <div className="mt-6">
        <SkillWorkflow workflow={result.workflow} />
      </div>
    </div>
  );
}
