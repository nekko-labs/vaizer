'use client';

import { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';
import { capture } from '@/lib/analytics';

/**
 * Copy-to-clipboard for a CLI command. Fires `skill_install_clicked` when the
 * command is for installing a skill (i.e. an analytics signal for "installs").
 */
export function InstallCommand({
  command,
  skillId,
  label,
}: {
  command: string;
  skillId?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; ignore */
    }
    if (skillId) capture('skill_install_clicked', { skill_id: skillId, command });
  }

  return (
    <div>
      {label && <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">
          {command}
        </code>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Copied' : 'Copy command'}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-fg"
        >
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5 text-accent" /> Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
