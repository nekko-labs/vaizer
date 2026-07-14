'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { capture } from '@/lib/analytics';

type TrackedLinkProps = {
  href: string;
  /** Which section of the Community page the link lives in. */
  section: string;
  /** Human-readable name of the destination (for analytics grouping). */
  name: string;
  /** Optional finer classification, e.g. 'board' | 'company' | 'project'. */
  kind?: string;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick' | 'onAuxClick'>;

/**
 * An external link that fires a `community_link_clicked` PostHog event before
 * navigating. Opens in a new tab, so the capture always has time to flush.
 * Also handles middle-click / open-in-new-tab via onAuxClick.
 */
export function TrackedLink({
  href,
  section,
  name,
  kind,
  children,
  ...rest
}: TrackedLinkProps) {
  function track() {
    capture('community_link_clicked', {
      link_name: name,
      url: href,
      section,
      ...(kind ? { kind } : {}),
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={track}
      onAuxClick={(e) => {
        if (e.button === 1) track();
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
