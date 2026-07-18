'use client';

import { useEffect, useRef, useState } from 'react';
import {
  environments,
  loadProjects,
  resetProjects,
  saveProjects,
  type CacheStatus,
  type Environment,
  type Project,
} from '@/data/prompt-config';
import { capture } from '@/lib/analytics';

/**
 * The prompt-config board: LaunchDarkly's flag workflow applied to prompts.
 * Pick a project, see its prompt flags, flip them per environment, and manage
 * each environment's prompt cache: a served prompt stays cached until you
 * invalidate it; invalidation marks it stale, and the next request (simulated
 * here after a beat) re-renders and re-caches it. State persists locally so
 * the demo is safe to play with.
 */

const CACHE_META: Record<CacheStatus, { label: string; cls: string; dot: string }> = {
  cached: { label: 'Cached', cls: 'text-signal', dot: 'bg-signal' },
  stale: { label: 'Stale · re-caching', cls: 'text-[#92400e]', dot: 'bg-[#b45309]' },
  uncached: { label: 'Not cached', cls: 'text-muted', dot: 'bg-border' },
};

function relTime(iso?: string): string {
  if (!iso) return '';
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function ConfigBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const p = loadProjects();
    setProjects(p);
    setProjectId(p[0]?.id ?? null);
    setHydrated(true);
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const project = projects.find((p) => p.id === projectId) ?? null;

  const mutate = (fn: (draft: Project[]) => void) => {
    setProjects((prev) => {
      const draft = structuredClone(prev);
      fn(draft);
      saveProjects(draft);
      return draft;
    });
  };

  /** After a beat, a "request" comes in and re-caches any stale, enabled env. */
  const scheduleRecache = (flagId: string, env: Environment) => {
    timers.current.push(
      setTimeout(() => {
        mutate((draft) => {
          const flag = draft.flatMap((p) => p.flags).find((f) => f.id === flagId);
          if (flag && flag.env[env].enabled && flag.env[env].cache.status === 'stale') {
            flag.env[env].cache = { status: 'cached', cachedAt: new Date().toISOString() };
          }
        });
      }, 1800),
    );
  };

  const onToggle = (flagId: string, env: Environment) => {
    capture('config_flag_toggled', { flag: flagId, env });
    mutate((draft) => {
      const flag = draft.flatMap((p) => p.flags).find((f) => f.id === flagId);
      if (!flag) return;
      const state = flag.env[env];
      state.enabled = !state.enabled;
      state.cache = state.enabled ? { status: 'stale' } : { status: 'uncached' };
    });
    scheduleRecache(flagId, env);
  };

  const onInvalidate = (flagId: string, env: Environment) => {
    capture('config_cache_invalidated', { flag: flagId, env });
    mutate((draft) => {
      const flag = draft.flatMap((p) => p.flags).find((f) => f.id === flagId);
      if (flag && flag.env[env].enabled) flag.env[env].cache = { status: 'stale' };
    });
    scheduleRecache(flagId, env);
  };

  const onInvalidateAll = (env: Environment) => {
    if (!project) return;
    capture('config_cache_invalidated', { flag: 'all', env });
    mutate((draft) => {
      const p = draft.find((x) => x.id === project.id);
      p?.flags.forEach((flag) => {
        if (flag.env[env].enabled) flag.env[env].cache = { status: 'stale' };
      });
    });
    project.flags.forEach((f) => scheduleRecache(f.id, env));
  };

  if (!hydrated) {
    return <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">Loading projects…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Project switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Projects">
          {projects.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === projectId}
              onClick={() => setProjectId(p.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                p.id === projectId ? 'border-accent bg-surface text-fg' : 'border-border text-muted hover:text-fg'
              }`}
            >
              {p.name}
              <span className="ml-2 font-mono text-xs font-normal text-muted">{p.flags.length} flags</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            const p = resetProjects();
            setProjects(p);
            setProjectId(p[0]?.id ?? null);
          }}
          className="text-xs font-medium text-muted underline-offset-2 hover:text-fg hover:underline"
        >
          Reset demo data
        </button>
      </div>

      {project && (
        <>
          <p className="text-sm leading-relaxed text-muted">{project.description}</p>

          {/* Env header + bulk invalidation */}
          <div className="hidden gap-3 md:grid md:grid-cols-[1fr_repeat(3,150px)]">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">Prompt flag</span>
            {environments.map((env) => (
              <div key={env} className="text-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">{env}</span>
                <button
                  onClick={() => onInvalidateAll(env)}
                  className="mt-0.5 block w-full text-[11px] font-medium text-accent hover:text-accent-hover"
                >
                  Invalidate all
                </button>
              </div>
            ))}
          </div>

          {/* Flags */}
          <div className="space-y-3">
            {project.flags.map((flag) => (
              <div key={flag.id} className="rounded-2xl border border-border bg-surface">
                <div className="grid gap-4 p-4 md:grid-cols-[1fr_repeat(3,150px)] md:items-center">
                  <button
                    onClick={() => setExpanded((e) => (e === flag.id ? null : flag.id))}
                    className="min-w-0 text-left"
                    aria-expanded={expanded === flag.id}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{flag.name}</h3>
                      <span className="text-muted transition-transform" style={{ transform: expanded === flag.id ? 'rotate(90deg)' : undefined }}>
                        ›
                      </span>
                    </div>
                    <code className="mt-0.5 block truncate font-mono text-xs text-accent">{flag.key}</code>
                    <p className="mt-1 truncate text-xs text-muted">{flag.description}</p>
                  </button>

                  {environments.map((env) => {
                    const state = flag.env[env];
                    const cache = CACHE_META[state.cache.status];
                    return (
                      <div key={env} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 md:flex-col md:items-center md:gap-1.5">
                        <span className="text-xs font-medium capitalize text-muted md:hidden">{env}</span>
                        <Toggle
                          on={state.enabled}
                          label={`${flag.name} in ${env}`}
                          onChange={() => onToggle(flag.id, env)}
                        />
                        <div className="flex flex-col items-end md:items-center">
                          <span className={`flex items-center gap-1.5 text-[11px] font-medium ${cache.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cache.dot} ${state.cache.status === 'stale' ? 'vaizer-pulse' : ''}`} />
                            {cache.label}
                          </span>
                          {state.cache.status === 'cached' && (
                            <button
                              onClick={() => onInvalidate(flag.id, env)}
                              className="text-[11px] font-medium text-accent hover:text-accent-hover"
                            >
                              Invalidate {state.cache.cachedAt && <span className="text-muted">· {relTime(state.cache.cachedAt)}</span>}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {expanded === flag.id && (
                  <div className="border-t border-border p-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_260px]">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">Served prompt</h4>
                        <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-subtle">
                          {flag.prompt}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">Targeting</h4>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{flag.targeting}</p>
                        <p className="mt-3 text-xs leading-relaxed text-muted">
                          Toggling an environment serves (or stops serving) this prompt there. Invalidating drops the cached copy; the next request
                          re-renders and re-caches it.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
        on ? 'border-accent bg-accent' : 'border-border bg-surface'
      }`}
    >
      <span
        className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-surface-2 shadow transition-transform ${
          on ? 'translate-x-[22px] border border-accent-fg/20' : 'translate-x-0.5 border border-border'
        }`}
      />
    </button>
  );
}
