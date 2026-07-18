'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  analyzePrompt,
  type ModelAssessment,
  type Preference,
  type Severity,
} from '@/lib/prompt-analysis';
import { formatUsd, modelById } from '@/data/models';
import {
  createPrompt,
  deletePrompt,
  listPrompts,
  restoreVersion,
  saveVersion,
  updatePrompt,
  type StoredPrompt,
} from '@/lib/prompt-store';
import { capture } from '@/lib/analytics';

/**
 * The prompt workbench: library (left) + editor + live analysis (right).
 * Everything runs client-side: prompts persist to localStorage, and the
 * analyzer is a pure function, so the page works with zero setup. Analysis
 * re-runs as you type; the model recommendation follows the preference
 * toggle (cheapest / balanced / highest quality).
 */

const SEVERITY_META: Record<Severity, { label: string; cls: string }> = {
  high: { label: 'High', cls: 'bg-[#dc2626]/10 text-[#b91c1c] border-[#dc2626]/30' },
  medium: { label: 'Medium', cls: 'bg-[#b45309]/10 text-[#92400e] border-[#b45309]/30' },
  low: { label: 'Low', cls: 'bg-border/60 text-subtle border-border' },
};

export function PromptWorkbench() {
  const [prompts, setPrompts] = useState<StoredPrompt[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preference, setPreference] = useState<Preference>('balanced');
  const [showVersions, setShowVersions] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // localStorage is client-only: load after mount to keep SSR markup stable.
  useEffect(() => {
    const all = listPrompts();
    setPrompts(all);
    setActiveId(all[0]?.id ?? null);
    setHydrated(true);
  }, []);

  const active = prompts.find((p) => p.id === activeId) ?? null;
  const analysis = useMemo(
    () => (active && active.content.trim() ? analyzePrompt(active.content, preference) : null),
    [active, preference],
  );

  const refresh = (nextActive?: string | null) => {
    const all = listPrompts();
    setPrompts(all);
    if (nextActive !== undefined) setActiveId(nextActive);
  };

  const onNew = () => {
    const p = createPrompt('Untitled prompt');
    capture('prompt_created');
    refresh(p.id);
    setShowVersions(false);
  };

  const onEdit = (patch: Partial<Pick<StoredPrompt, 'name' | 'content'>>) => {
    if (!active) return;
    updatePrompt(active.id, patch);
    refresh();
  };

  const onSaveVersion = () => {
    if (!active) return;
    saveVersion(active.id);
    capture('prompt_version_saved');
    refresh();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const onDelete = () => {
    if (!active) return;
    deletePrompt(active.id);
    const all = listPrompts();
    setPrompts(all);
    setActiveId(all[0]?.id ?? null);
  };

  if (!hydrated) {
    return <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">Loading your prompt library…</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Library */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Library</h2>
            <button
              onClick={onNew}
              className="rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg transition-transform hover:-translate-y-0.5"
            >
              + New
            </button>
          </div>
          <ul className="mt-3 space-y-1">
            {prompts.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    setActiveId(p.id);
                    setShowVersions(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    p.id === activeId ? 'bg-surface-2 font-semibold text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg'
                  }`}
                >
                  <span className="block truncate">{p.name}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-muted">
                    v{p.versions.length || 0} · {p.content.trim() ? `${p.content.trim().split(/\s+/).length}w` : 'empty'}
                  </span>
                </button>
              </li>
            ))}
            {prompts.length === 0 && <li className="px-3 py-2 text-sm text-muted">No prompts yet.</li>}
          </ul>
          <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted">
            Stored locally in your browser. Versions snapshot on save.
          </p>
        </div>
      </aside>

      {/* Editor + analysis */}
      <div className="min-w-0 space-y-6">
        {active ? (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={active.name}
                onChange={(e) => onEdit({ name: e.target.value })}
                aria-label="Prompt name"
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-lg font-semibold tracking-tight outline-none transition-colors focus:border-border"
              />
              <button
                onClick={onSaveVersion}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-accent"
              >
                {savedFlash ? 'Saved ✓' : `Save version (v${(active.versions[active.versions.length - 1]?.v ?? 0) + 1})`}
              </button>
              <button
                onClick={() => setShowVersions((s) => !s)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-fg"
              >
                History ({active.versions.length})
              </button>
              <button
                onClick={onDelete}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-[#dc2626] hover:text-[#b91c1c]"
              >
                Delete
              </button>
            </div>

            {showVersions && (
              <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3">
                {active.versions.length === 0 ? (
                  <p className="text-sm text-muted">No versions yet; edits autosave, and “Save version” snapshots the current text.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {[...active.versions].reverse().map((v) => (
                      <li key={v.v} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 flex-1 truncate text-muted">
                          <span className="font-mono text-fg">v{v.v}</span> · {new Date(v.savedAt).toLocaleString()} {v.note ? `· ${v.note}` : ''}
                        </span>
                        <button
                          onClick={() => {
                            restoreVersion(active.id, v.v);
                            refresh();
                          }}
                          className="shrink-0 text-xs font-semibold text-accent hover:text-accent-hover"
                        >
                          Restore
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <textarea
              value={active.content}
              onChange={(e) => onEdit({ content: e.target.value })}
              placeholder="Write your prompt here. Analysis updates as you type."
              rows={10}
              className="mt-4 w-full resize-y rounded-xl border border-border bg-surface-2 p-4 font-mono text-sm leading-relaxed text-fg outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>
                {analysis ? `${analysis.wordCount} words · ~${analysis.inputTokens.toLocaleString()} input tokens` : 'Empty prompt'}
              </span>
              <span>Autosaves as you type</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
            Create a prompt to get started.
          </div>
        )}

        {analysis && (
          <>
            {/* Review: score, profile, issues */}
            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Prompt review</h2>
                <span className="font-mono text-xs text-muted">
                  {analysis.profile.typeLabel} · {analysis.profile.complexity} complexity
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[110px_1fr]">
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-2 p-4">
                  <span className="text-4xl font-bold text-accent">{analysis.grade}</span>
                  <span className="mt-1 font-mono text-xs text-muted">{analysis.score}/100</span>
                </div>
                <div className="space-y-2">
                  {analysis.issues.length === 0 && (
                    <p className="text-sm text-muted">No issues found. This prompt is specific, bounded, and checkable.</p>
                  )}
                  {analysis.issues.map((issue) => (
                    <details key={issue.title} className="group rounded-xl border border-border bg-surface-2 px-4 py-2.5 open:pb-3.5">
                      <summary className="flex cursor-pointer list-none items-center gap-2.5 text-sm font-medium text-fg">
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_META[issue.severity].cls}`}>
                          {SEVERITY_META[issue.severity].label}
                        </span>
                        <span className="flex-1">{issue.title}</span>
                        <span className="text-muted transition-transform group-open:rotate-90">›</span>
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{issue.detail}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-fg">
                        <span className="font-semibold text-signal">Fix:</span> {issue.fix}
                      </p>
                    </details>
                  ))}
                  {analysis.strengths.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {analysis.strengths.map((s) => (
                        <li key={s} className="flex gap-2 text-sm text-muted">
                          <span className="text-signal">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Decisions the prompt delegates */}
              <div className="mt-5 border-t border-border pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">Decisions this prompt hands to the model</h3>
                <ul className="mt-2 space-y-2">
                  {analysis.decisions.map((d, i) => (
                    <li key={i} className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
                      <span className="font-mono text-xs text-subtle">“{d.excerpt}”</span>
                      <p className="mt-1 leading-relaxed text-muted">{d.decision}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Model fit */}
            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Which model should run it</h2>
                <div className="flex rounded-lg border border-border p-0.5" role="radiogroup" aria-label="Optimization preference">
                  {(
                    [
                      ['cheapest', 'Cheapest'],
                      ['balanced', 'Balanced'],
                      ['quality', 'Highest quality'],
                    ] as [Preference, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      role="radio"
                      aria-checked={preference === value}
                      onClick={() => {
                        setPreference(value);
                        capture('prompt_preference_changed', { preference: value });
                      }}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                        preference === value ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[...analysis.assessments]
                  .sort((a, b) => b.score - a.score)
                  .map((a) => (
                    <ModelCard key={a.model.id} a={a} recommended={a.model.id === analysis.recommended} />
                  ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Cost = ~{analysis.inputTokens.toLocaleString()} input + ~{analysis.estOutputTokens.toLocaleString()} estimated output tokens at each
                model&apos;s list price. Estimates, not quotes.
              </p>
            </section>

            {/* Plan paths */}
            <PlanPaths assessments={analysis.assessments} recommended={analysis.recommended} />
          </>
        )}
      </div>
    </div>
  );
}

function ModelCard({ a, recommended }: { a: ModelAssessment; recommended: boolean }) {
  return (
    <div
      className={`flex h-full flex-col rounded-xl border p-4 ${
        recommended ? 'border-accent bg-surface-2 shadow-[0_0_0_1px_var(--accent)]' : 'border-border bg-surface-2'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight">{a.model.name}</h3>
        {recommended && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-fg">Pick</span>
        )}
      </div>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">{a.behavior}</p>
      <dl className="mt-3 space-y-1 border-t border-border pt-2 font-mono text-[11px]">
        <div className="flex justify-between">
          <dt className="text-muted">per run</dt>
          <dd className="text-fg">{formatUsd(a.costPerRun)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">per 1k runs</dt>
          <dd className="text-fg">{formatUsd(a.costPer1k)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">fit</dt>
          <dd className={a.fits ? 'text-signal' : 'text-[#b45309]'}>{a.fits ? 'clears the bar' : 'below the bar'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">score</dt>
          <dd className="text-fg">{a.score}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Side-by-side plan paths: how each model would work the same prompt. */
function PlanPaths({ assessments, recommended }: { assessments: ModelAssessment[]; recommended: string }) {
  const [selected, setSelected] = useState<string[]>(() => {
    const rec = recommended;
    const other = assessments.find((a) => a.model.id !== rec)?.model.id;
    return other ? [rec, other] : [rec];
  });

  // Keep the recommendation in view when it changes with the preference.
  useEffect(() => {
    setSelected((sel) => (sel.includes(recommended) ? sel : [recommended, ...sel].slice(0, 3)));
  }, [recommended]);

  const toggle = (id: string) =>
    setSelected((sel) => (sel.includes(id) ? (sel.length > 1 ? sel.filter((x) => x !== id) : sel) : [...sel, id].slice(-3)));

  const shown = assessments.filter((a) => selected.includes(a.model.id));

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Estimated plan path, per model</h2>
        <div className="flex flex-wrap gap-1.5">
          {assessments.map((a) => (
            <button
              key={a.model.id}
              onClick={() => toggle(a.model.id)}
              aria-pressed={selected.includes(a.model.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selected.includes(a.model.id) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-fg'
              }`}
            >
              {modelById(a.model.id).name.replace('Claude ', '')}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">How each model would process this prompt differently, from first read to final answer. Compare up to 3.</p>

      <div className={`mt-4 grid gap-4 ${shown.length === 1 ? '' : shown.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {shown.map((a) => (
          <div key={a.model.id} className="rounded-xl border border-border bg-surface-2 p-4">
            <h3 className="text-sm font-semibold">
              {a.model.name}
              {a.model.id === recommended && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-accent-fg">Pick</span>}
            </h3>
            <ol className="mt-3 space-y-0">
              {a.plan.map((step, i) => (
                <li key={i} className="relative pb-4 pl-6 last:pb-0">
                  {i < a.plan.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-border" aria-hidden />}
                  <span className="absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full border border-accent bg-surface font-mono text-[9px] text-accent">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium leading-tight">{step.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{step.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
