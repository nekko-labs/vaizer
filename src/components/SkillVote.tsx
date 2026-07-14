'use client';

import { useEffect, useState } from 'react';
import { UpvoteIcon } from './icons';
import { capture } from '@/lib/analytics';

/**
 * Upvote button. Best-effort one-vote-per-browser via a localStorage token +
 * a "voted" flag; the server also dedups on (skill, voter hash). Optimistic,
 * and degrades to a no-op display if voting is unavailable (no backend).
 */
function getToken(): string {
  const KEY = 'nekko-skill-voter';
  let t = localStorage.getItem(KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(KEY, t);
  }
  return t;
}

export function SkillVote({
  skillId,
  initialCount,
  size = 'md',
}: {
  skillId: string;
  initialCount: number;
  size?: 'sm' | 'md';
}) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setVoted(localStorage.getItem(`nekko-voted-${skillId}`) === '1');
    } catch {
      /* ignore */
    }
  }, [skillId]);

  async function onVote() {
    if (voted || busy) return;
    setBusy(true);
    setCount((c) => c + 1); // optimistic
    setVoted(true);
    try {
      localStorage.setItem(`nekko-voted-${skillId}`, '1');
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, token: getToken() }),
      });
      if (res.ok) {
        const data = (await res.json()) as { count?: number };
        if (typeof data.count === 'number') setCount(data.count);
        capture('skill_upvoted', { skill_id: skillId });
      } else {
        // roll back optimistic state on failure
        setCount((c) => Math.max(0, c - 1));
        setVoted(false);
        localStorage.removeItem(`nekko-voted-${skillId}`);
      }
    } catch {
      setCount((c) => Math.max(0, c - 1));
      setVoted(false);
    } finally {
      setBusy(false);
    }
  }

  const pad = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      type="button"
      onClick={onVote}
      disabled={voted || busy}
      aria-pressed={voted}
      aria-label={voted ? 'You upvoted this skill' : 'Upvote this skill'}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors ${pad} ${
        voted
          ? 'border-accent/50 bg-accent/12 text-accent'
          : 'border-border text-muted hover:border-accent hover:text-accent'
      } disabled:cursor-default`}
    >
      <UpvoteIcon className={icon} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
