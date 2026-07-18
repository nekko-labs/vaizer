/**
 * Dynamic prompt configuration ("prompt flags").
 *
 * The LaunchDarkly workflow applied to prompts: a project holds prompt flags,
 * each flag can be toggled per environment (development / staging /
 * production), and each environment tracks its cache state. A served prompt
 * is cached until you invalidate it; invalidation marks the cache stale so
 * the next request re-renders and re-caches the prompt. This v1 persists to
 * localStorage with seeded demo projects, and the shapes are ready to be fed
 * by a real control plane later.
 */

export const environments = ['development', 'staging', 'production'] as const;
export type Environment = (typeof environments)[number];

export type CacheStatus = 'cached' | 'stale' | 'uncached';

export type EnvState = {
  enabled: boolean;
  cache: {
    status: CacheStatus;
    /** ISO timestamp of the last successful cache write, if any. */
    cachedAt?: string;
  };
};

export type PromptFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  /** The prompt text this flag serves (excerpt is fine for the demo). */
  prompt: string;
  /** Simple targeting summary, LaunchDarkly-style. */
  targeting: string;
  env: Record<Environment, EnvState>;
};

export type Project = {
  id: string;
  key: string;
  name: string;
  description: string;
  flags: PromptFlag[];
};

const KEY = 'vaizer.prompt-config.v1';

function envState(enabled: boolean, status: CacheStatus, agoMin?: number): EnvState {
  return {
    enabled,
    cache: {
      status,
      cachedAt: agoMin !== undefined ? new Date(Date.now() - agoMin * 60_000).toISOString() : undefined,
    },
  };
}

function seed(): Project[] {
  return [
    {
      id: 'proj_support',
      key: 'atlas-support',
      name: 'Atlas Support Bot',
      description: 'Customer-facing support assistant. Prompts here answer real users, so production is cache-heavy.',
      flags: [
        {
          id: 'flag_greeting',
          key: 'system-prompt.greeting',
          name: 'System prompt: greeting + persona',
          description: 'The persona block served at the start of every support conversation.',
          prompt: 'You are Atlas, a calm and precise support agent. Greet the user by name, confirm the product they are asking about, and never promise a refund without an order id.',
          targeting: 'Serve to all users · fallback: v3 (frozen)',
          env: {
            development: envState(true, 'cached', 12),
            staging: envState(true, 'cached', 140),
            production: envState(true, 'cached', 2 * 24 * 60),
          },
        },
        {
          id: 'flag_escalation',
          key: 'policy.escalation-v2',
          name: 'Escalation policy v2',
          description: 'New escalation wording that routes billing disputes to a human sooner.',
          targeting: '25% of production traffic · beta cohort first',
          prompt: 'If the user mentions a charge they do not recognize, apologize once, collect the last 4 digits of the order id, and hand off to a human agent immediately.',
          env: {
            development: envState(true, 'cached', 5),
            staging: envState(true, 'stale'),
            production: envState(false, 'uncached'),
          },
        },
        {
          id: 'flag_tone',
          key: 'style.tone-experiment',
          name: 'Tone experiment: warmer voice',
          description: 'A/B variant that adds a warmer, more conversational tone block.',
          targeting: '50/50 split vs control · production only',
          prompt: 'Use a warm, collaborative tone. Acknowledge the user\'s frustration before troubleshooting. Keep answers under 120 words.',
          env: {
            development: envState(true, 'cached', 30),
            staging: envState(false, 'uncached'),
            production: envState(true, 'stale'),
          },
        },
      ],
    },
    {
      id: 'proj_pipeline',
      key: 'nightly-pipeline',
      name: 'Nightly Pipeline Agents',
      description: 'Autonomous agents that run overnight jobs. Prompts change often in dev, rarely in prod.',
      flags: [
        {
          id: 'flag_triage',
          key: 'agent.issue-triage',
          name: 'Issue triage agent prompt',
          description: 'Labels and prioritizes new issues every night at 02:00.',
          targeting: 'Serve to all runs · pinned model: sonnet',
          prompt: 'Triage each new issue: label area and severity, close duplicates with a link, and flag anything security-related for human review. Done when every unlabeled issue is handled.',
          env: {
            development: envState(true, 'stale'),
            staging: envState(true, 'cached', 26 * 60),
            production: envState(true, 'cached', 9 * 24 * 60),
          },
        },
        {
          id: 'flag_digest',
          key: 'agent.weekly-digest',
          name: 'Weekly digest writer',
          description: 'Summarizes the week\'s merged PRs into a digest for the team channel.',
          targeting: 'Fridays only · staging mirror enabled',
          prompt: 'Write a friendly weekly digest from the merged PR list. Group by feature area, call out breaking changes first, keep it under 300 words.',
          env: {
            development: envState(true, 'cached', 60),
            staging: envState(true, 'cached', 3 * 24 * 60),
            production: envState(true, 'cached', 6 * 24 * 60),
          },
        },
      ],
    },
  ];
}

export function loadProjects(): Project[] {
  if (typeof window === 'undefined') return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Project[];
  } catch {
    /* fall through to seed */
  }
  const s = seed();
  saveProjects(s);
  return s;
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(projects));
  } catch {
    /* non-fatal: state stays in memory for the session */
  }
}

export function resetProjects(): Project[] {
  const s = seed();
  saveProjects(s);
  return s;
}
