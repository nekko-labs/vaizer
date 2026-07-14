'use client';

import { useState } from 'react';
import { capture } from '@/lib/analytics';

/**
 * "Was this helpful?" + optional comment. Posts to /api/feedback. Used on the
 * skill detail page — this is the website side of the post-use feedback loop
 * that official skills point users to.
 */
export function SkillFeedback({ skillId }: { skillId: string }) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(value: boolean | null, withComment: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          helpful: value,
          comment: withComment ? comment.slice(0, 2000) : null,
        }),
      });
      if (res.ok) {
        setSent(true);
        capture('skill_feedback_submitted', { skill_id: skillId, helpful: value });
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted">Thanks for the feedback! 🐱 It helps us improve the hub.</p>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium">Was this skill helpful?</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setHelpful(true);
            void submit(true, false);
          }}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            helpful === true
              ? 'border-accent/50 bg-accent/12 text-accent'
              : 'border-border text-muted hover:border-accent hover:text-accent'
          }`}
        >
          👍 Yes
        </button>
        <button
          type="button"
          onClick={() => setHelpful(false)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            helpful === false
              ? 'border-accent/50 bg-accent/12 text-accent'
              : 'border-border text-muted hover:border-accent hover:text-accent'
          }`}
        >
          👎 Not yet
        </button>
      </div>

      {helpful === false && (
        <div className="mt-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="What would make it better? (optional)"
            className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void submit(false, true)}
            disabled={busy}
            className="mt-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            Send feedback
          </button>
        </div>
      )}
    </div>
  );
}
