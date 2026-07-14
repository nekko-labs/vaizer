'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { type Run, type AttemptStatus, progressAt } from '@/data/runs';
import { capture } from '@/lib/analytics';

/**
 * The Watch player: replays a run as a journey toward victory. A path of
 * milestones fills in as they are reached, the current attempt pulses, and a
 * feed shows what the agent just tried and learned. Auto-plays on mount;
 * pause, step, restart, and change speed. Reduced-motion users get the same
 * information without the ongoing animation.
 */

const STATUS: Record<AttemptStatus, { glyph: string; color: string; label: string }> = {
  success: { glyph: '✓', color: 'var(--signal)', label: 'worked' },
  fail: { glyph: '✕', color: '#f87171', label: 'failed' },
  partial: { glyph: '◐', color: '#fbbf24', label: 'partial' },
  running: { glyph: '●', color: 'var(--accent)', label: 'running' },
};

const SPEEDS = [
  { label: '0.5x', ms: 3000 },
  { label: '1x', ms: 1600 },
  { label: '2x', ms: 850 },
];

export function RunPlayer({ run }: { run: Run }) {
  // revealed = number of attempts shown so far (0..attempts.length)
  const [revealed, setRevealed] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1);
  const capturedRef = useRef(false);

  const total = run.attempts.length;
  const done = revealed >= total;

  useEffect(() => {
    if (!playing || done) return;
    const t = setTimeout(() => setRevealed((r) => Math.min(total, r + 1)), SPEEDS[speedIdx].ms);
    return () => clearTimeout(t);
  }, [playing, revealed, speedIdx, done, total]);

  useEffect(() => {
    if (done && !capturedRef.current) {
      capturedRef.current = true;
      capture('watch_run_played', { run: run.id });
    }
  }, [done, run.id]);

  const { reached, won } = useMemo(() => progressAt(run, revealed), [run, revealed]);
  const reachedCount = reached.filter(Boolean).length;
  const current = run.attempts[revealed - 1];
  const fillPct = run.milestones.length > 1
    ? (Math.max(0, reachedCount - (won ? 0 : 0)) / (run.milestones.length - 1)) * 100
    : won ? 100 : 0;

  function restart() {
    capturedRef.current = false;
    setRevealed(1);
    setPlaying(true);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Goal header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{run.kind}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">🎯 {run.goal}</h2>
        </div>
        <div
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
            won
              ? 'bg-signal/20 text-signal'
              : done
                ? 'bg-red-500/15 text-red-300'
                : 'bg-accent/15 text-accent'
          }`}
        >
          {won ? 'Victory' : done ? 'Ended' : `Attempt ${revealed}/${total}`}
        </div>
      </div>

      {/* Path to victory */}
      <div
        className="p-6"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="relative">
          {/* base + fill line (desktop horizontal) */}
          <div className="absolute left-0 right-0 top-5 hidden h-1 -translate-y-1/2 rounded bg-border sm:block" />
          <div
            className="vaizer-fill absolute left-0 top-5 hidden h-1 -translate-y-1/2 rounded bg-signal sm:block"
            style={{ width: `${fillPct}%` }}
          />
          <ol className="relative flex flex-col gap-6 sm:flex-row sm:justify-between sm:gap-0">
            {run.milestones.map((m, i) => {
              const isReached = reached[i];
              const isCurrent = !won && current?.milestone === i && !isReached;
              const isVictory = won && i === run.milestones.length - 1;
              return (
                <li key={m.id} className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:text-center">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                      isVictory
                        ? 'vaizer-breathe border-signal bg-signal text-accent-fg'
                        : isReached
                          ? 'border-signal bg-signal/15 text-signal'
                          : isCurrent
                            ? 'vaizer-pulse border-accent bg-accent text-accent-fg'
                            : 'border-border bg-surface text-muted'
                    }`}
                  >
                    {isVictory ? '★' : isReached ? '✓' : i + 1}
                  </span>
                  <span className="sm:mt-2">
                    <span
                      className={`block text-sm font-semibold ${isReached || isCurrent ? 'text-fg' : 'text-muted'}`}
                    >
                      {m.label}
                    </span>
                    {m.detail && (
                      <span className="block text-xs text-muted sm:max-w-[9rem]">{m.detail}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 border-y border-border px-5 py-3">
        <button
          onClick={() => (done ? restart() : setPlaying((p) => !p))}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-transform hover:-translate-y-0.5"
        >
          {done ? '↻ Replay' : playing ? '❚❚ Pause' : '▶ Play'}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setRevealed((r) => Math.min(total, r + 1));
          }}
          disabled={done}
          className="rounded-lg border border-border px-3 py-2 text-sm text-fg transition-colors hover:border-accent disabled:opacity-40"
        >
          Step →
        </button>
        <button
          onClick={restart}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-fg"
        >
          Restart
        </button>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-1">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSpeedIdx(i)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                i === speedIdx ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attempt feed */}
      <div className="max-h-[22rem] overflow-y-auto p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          What it is trying
        </p>
        <ol className="space-y-2.5">
          {run.attempts
            .slice(0, revealed)
            .reverse()
            .map((a) => {
              const s = STATUS[a.status];
              const isLatest = a.n === revealed;
              return (
                <li
                  key={a.n}
                  className={`vaizer-enter flex gap-3 rounded-xl border p-3 ${
                    isLatest ? 'border-accent/50 bg-accent/5' : 'border-border bg-bg/30'
                  }`}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ color: s.color, border: `1.5px solid ${s.color}` }}
                    title={s.label}
                  >
                    {s.glyph}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      <span className="mr-2 font-mono text-xs text-muted">#{a.n}</span>
                      {a.action}
                    </p>
                    {a.learning && (
                      <p className="mt-0.5 text-sm text-muted">
                        <span style={{ color: s.color }}>→</span> {a.learning}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
        </ol>
      </div>
    </div>
  );
}
