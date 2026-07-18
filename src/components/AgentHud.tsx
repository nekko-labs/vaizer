'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  demoEvents,
  demoFleet,
  kindLabels,
  statusMeta,
  type AgentSession,
  type SessionStatus,
} from '@/data/agents';
import { capture } from '@/lib/analytics';

/**
 * The Agent HUD: every running session, long loops and short chats together,
 * in one command-center view. The point is triage: self-running agents stay
 * quietly on the board while they make progress, and the attention queue
 * surfaces the few that genuinely need a human. A demo fleet ticks along
 * client-side (like Watch's demo run); the same board is designed to be fed
 * by a real session feed later.
 */

const TONE_CLS: Record<'ok' | 'warn' | 'bad' | 'quiet', { text: string; dot: string; ring: string }> = {
  ok: { text: 'text-signal', dot: 'bg-signal', ring: 'border-border' },
  warn: { text: 'text-[#92400e]', dot: 'bg-[#b45309]', ring: 'border-[#b45309]/40' },
  bad: { text: 'text-[#b91c1c]', dot: 'bg-[#dc2626]', ring: 'border-[#dc2626]/40' },
  quiet: { text: 'text-muted', dot: 'bg-border', ring: 'border-border' },
};

const FILTERS: Array<{ key: 'all' | SessionStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'running', label: 'Running' },
  { key: 'needs-attention', label: 'Needs you' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'done', label: 'Done' },
  { key: 'failed', label: 'Failed' },
];

export function AgentHud() {
  const [fleet, setFleet] = useState<AgentSession[]>(demoFleet);
  const [filter, setFilter] = useState<'all' | SessionStatus>('all');
  const [live, setLive] = useState(true);
  const eventIdx = useRef<Record<string, number>>({});

  // The demo heartbeat: running sessions advance, occasionally finishing.
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      setFleet((prev) =>
        prev.map((s) => {
          if (s.status !== 'running') return s;
          const events = demoEvents[s.id];
          const idx = eventIdx.current[s.id] ?? 0;
          const nextEvent = events && idx < events.length ? events[idx] : undefined;
          if (nextEvent) eventIdx.current[s.id] = idx + 1;
          const progress = Math.min(100, s.progress + 5);
          const finished = progress >= 100;
          return {
            ...s,
            progress,
            ageMin: s.ageMin + 1,
            tokens: s.tokens + 12_000,
            cost: +(s.cost + 0.06).toFixed(2),
            lastEvent: nextEvent ?? s.lastEvent,
            status: finished ? 'done' : s.status,
          };
        }),
      );
    }, 2500);
    return () => clearInterval(t);
  }, [live]);

  const attention = fleet.filter((s) => s.status === 'needs-attention');
  const shown = filter === 'all' ? fleet : fleet.filter((s) => s.status === filter);

  const totals = useMemo(() => {
    const active = fleet.filter((s) => ['running', 'waiting', 'needs-attention'].includes(s.status));
    return {
      active: active.length,
      attention: attention.length,
      tokens: fleet.reduce((a, s) => a + s.tokens, 0),
      cost: fleet.reduce((a, s) => a + s.cost, 0),
    };
  }, [fleet, attention.length]);

  const resolve = (id: string) => {
    capture('hud_attention_resolved', { session: id });
    setFleet((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: 'running', attention: undefined, lastEvent: 'Unblocked by you; resuming.' }
          : s,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Active sessions" value={String(totals.active)} />
        <Stat label="Need your attention" value={String(totals.attention)} tone={totals.attention > 0 ? 'bad' : 'ok'} />
        <Stat label="Tokens today" value={`${(totals.tokens / 1e6).toFixed(1)}M`} />
        <Stat label="Est. spend today" value={`$${totals.cost.toFixed(2)}`} />
      </div>

      {/* Attention queue */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Attention queue</h2>
        {attention.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-signal" />
            Nothing needs you. Every agent is making progress on its own.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {attention.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#dc2626]/30 bg-surface-2 p-3">
                <span className="vaizer-pulse h-2 w-2 shrink-0 rounded-full bg-[#dc2626]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.attention}</p>
                </div>
                <button
                  onClick={() => resolve(s.id)}
                  className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-transform hover:-translate-y-0.5"
                >
                  Resolve &amp; resume
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Fleet board */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Filter sessions">
            {FILTERS.map((f) => {
              const count = f.key === 'all' ? fleet.length : fleet.filter((s) => s.status === f.key).length;
              return (
                <button
                  key={f.key}
                  role="radio"
                  aria-checked={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filter === f.key ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-fg'
                  }`}
                >
                  {f.label} <span className="font-mono">{count}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setLive((l) => !l)}
            aria-pressed={live}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'vaizer-pulse bg-signal' : 'bg-border'}`} />
            {live ? 'Live (demo feed)' : 'Paused'}
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => (
            <SessionCard key={s.id} s={s} onResolve={() => resolve(s.id)} />
          ))}
          {shown.length === 0 && (
            <p className="col-span-full rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
              No sessions match this filter.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${tone === 'bad' ? 'text-[#b91c1c]' : tone === 'ok' ? 'text-signal' : 'text-fg'}`}>
        {value}
      </p>
    </div>
  );
}

function SessionCard({ s, onResolve }: { s: AgentSession; onResolve: () => void }) {
  const meta = statusMeta[s.status];
  const tone = TONE_CLS[meta.tone];
  const age = s.ageMin >= 90 ? `${Math.round(s.ageMin / 60)}h` : `${s.ageMin}m`;

  return (
    <article className={`flex h-full flex-col rounded-2xl border bg-surface p-4 ${tone.ring}`}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold leading-tight">{s.name}</h3>
          <p className="mt-0.5 font-mono text-[11px] text-muted">
            {kindLabels[s.kind]} · {s.model.replace('claude-', '')} · {age}
          </p>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 text-[11px] font-semibold ${tone.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot} ${s.status === 'running' ? 'vaizer-pulse' : ''}`} />
          {meta.label}
        </span>
      </header>

      {/* Progress */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/60">
        <div
          className={`vaizer-fill h-full rounded-full ${s.status === 'failed' ? 'bg-[#dc2626]' : s.status === 'done' ? 'bg-signal' : 'bg-accent'}`}
          style={{ width: `${s.progress}%` }}
        />
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{s.lastEvent}</p>

      {s.status === 'needs-attention' && s.attention && (
        <div className="mt-3 rounded-xl border border-[#dc2626]/30 bg-surface-2 p-3">
          <p className="text-xs leading-relaxed text-fg">{s.attention}</p>
          <button onClick={onResolve} className="mt-2 text-xs font-semibold text-accent hover:text-accent-hover">
            Resolve &amp; resume →
          </button>
        </div>
      )}

      <footer className="mt-3 flex items-center justify-between border-t border-border pt-2.5 font-mono text-[11px] text-muted">
        <span>{(s.tokens / 1000).toFixed(0)}k tokens</span>
        <span>${s.cost.toFixed(2)}</span>
        <span>{s.progress}%</span>
      </footer>
    </article>
  );
}
