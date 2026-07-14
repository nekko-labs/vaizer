'use client';

import { useState } from 'react';
import { SkillWorkflow } from './SkillWorkflow';
import { ArrowRightIcon, ExternalLinkIcon, GitHubIcon } from './icons';
import { capture } from '@/lib/analytics';
import type { SkillWorkflow as SkillWorkflowGraph } from '@/data/skills';

type InspectResult = {
  source: string;
  name: string;
  description: string;
  tools: string[];
  workflow: SkillWorkflowGraph;
  lowConfidence: boolean;
};

/** A well-known public skill you can break down in one click. */
export type Shortcut = { label: string; url: string; note?: string };

export function SkillInspector({ shortcuts }: { shortcuts: Shortcut[] }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InspectResult | null>(null);

  async function inspect(target: string) {
    const value = target.trim();
    if (!value) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not break down that skill.');
      } else {
        setResult(data as InspectResult);
        capture('skill_inspected', { source: (data as InspectResult).source });
      }
    } catch {
      setError('Something went wrong reaching that URL. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          inspect(url);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 focus-within:border-accent">
          <GitHubIcon className="h-5 w-5 shrink-0 text-muted" />
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="github.com/owner/repo/tree/main/path-to-skill"
            className="w-full bg-transparent py-3 font-mono text-sm text-fg outline-none placeholder:text-muted"
            aria-label="GitHub URL to a skill"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-fg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Breaking it down…' : 'Break it down'}
          {!loading && <ArrowRightIcon className="h-4 w-4" />}
        </button>
      </form>

      {shortcuts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Or try one of these
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {shortcuts.map((s) => (
              <button
                key={s.url}
                onClick={() => {
                  setUrl(s.url);
                  inspect(s.url);
                }}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-subtle transition hover:border-accent hover:text-accent"
                title={s.note}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{result.name}</h2>
              <p className="mt-1 max-w-2xl text-muted">{result.description}</p>
            </div>
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
              This skill did not have much explicit structure, so the breakdown below is a
              best-effort guess at its shape.
            </p>
          )}

          <div className="mt-5">
            <SkillWorkflow workflow={result.workflow} />
          </div>
        </div>
      )}
    </div>
  );
}
