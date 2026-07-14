'use client';

import { useState } from 'react';
import { DownloadIcon } from './icons';
import { capture } from '@/lib/analytics';

/**
 * Download a skill's `.zip` from the API route. Uses a real navigation to the
 * endpoint (so the browser handles the file save) and fires a `skill_downloaded`
 * analytics event. Shows a brief "Preparing…" state while the edge assembles
 * the archive on a cold cache.
 */
export function DownloadButton({ skillId, slug }: { skillId: string; slug: string }) {
  const [busy, setBusy] = useState(false);

  function onDownload() {
    if (busy) return;
    setBusy(true);
    capture('skill_downloaded', { skill_id: skillId });
    // Trigger the download without leaving the page.
    window.location.href = `/api/skills/${slug}/download`;
    // The navigation is a file response, so the page stays; reset shortly after.
    setTimeout(() => setBusy(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={onDownload}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
    >
      <DownloadIcon className="h-4 w-4" />
      {busy ? 'Preparing…' : 'Download .zip'}
    </button>
  );
}
