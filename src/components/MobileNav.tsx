'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { nav, site } from '@/lib/site';
import { GitHubIcon } from './icons';

/**
 * Compact nav for small screens: a hamburger toggle that drops a full-width
 * panel of the site links below the header. The inline desktop nav is hidden
 * at this breakpoint, so the two never fight for the same row.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-6 w-6">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-6 w-6">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-bg shadow-xl">
          <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={site.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <GitHubIcon className="h-5 w-5" />
              GitHub
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
