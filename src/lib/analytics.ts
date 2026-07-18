'use client';

/**
 * Thin wrapper over PostHog capture. No-ops safely when PostHog isn't
 * initialized (env unset / DNT), so call sites never need to null-check.
 */

import posthog from 'posthog-js';

export type AnalyticsEvent =
  | 'skill_viewed'
  | 'skill_install_clicked'
  | 'skill_downloaded'
  | 'skill_upvoted'
  | 'skill_feedback_submitted'
  | 'skill_inspected'
  | 'watch_run_played'
  | 'community_link_clicked'
  | 'prompt_created'
  | 'prompt_version_saved'
  | 'prompt_preference_changed'
  | 'config_flag_toggled'
  | 'config_cache_invalidated'
  | 'hud_attention_resolved';

export function capture(event: AnalyticsEvent, props?: Record<string, unknown>) {
  try {
    if (typeof window === 'undefined') return;
    // __loaded is set once posthog.init has run.
    if (!(posthog as unknown as { __loaded?: boolean }).__loaded) return;
    posthog.capture(event, props);
  } catch {
    /* analytics must never break the UI */
  }
}
