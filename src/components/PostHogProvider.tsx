'use client';

/**
 * PostHog product analytics — OPTIONAL and privacy-conscious.
 *
 * Initializes only when NEXT_PUBLIC_POSTHOG_KEY is set, so the site runs fine
 * without analytics. Configured to be light on tracking: no autocapture, no
 * session recording, person profiles only for identified events, and it respects
 * the browser's Do Not Track. We capture a small set of explicit product events
 * (see lib/analytics.ts): skill views, install clicks, upvotes, and feedback.
 */

import { useEffect } from 'react';
import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  // Respect Do Not Track across its (non-standard, browser-specific) locations.
  const dnt =
    navigator.doNotTrack ??
    (window as { doNotTrack?: string }).doNotTrack ??
    (navigator as { msDoNotTrack?: string }).msDoNotTrack;
  if (dnt === '1' || dnt === 'yes') return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    person_profiles: 'identified_only',
  });
  initialized = true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);
  return <>{children}</>;
}
