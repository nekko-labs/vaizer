/**
 * The Agent HUD data model.
 *
 * A "session" is any live agent conversation: a long-running autonomous loop,
 * a scheduled job, or a short interactive chat. The HUD renders a fleet of
 * them in one command-center view so a human can see, at a glance, which
 * sessions are cruising and which actually need attention. A demo fleet
 * drives the UI (the HUD simulates ticks client-side); the shapes match what
 * a real session feed (Claude Code, agent SDK, Managed Agents events) would
 * supply later, same pattern as Watch's demo run.
 */

export type SessionKind = 'loop' | 'job' | 'chat';

export type SessionStatus =
  | 'running'
  | 'needs-attention'
  | 'waiting' // blocked on something external (CI, rate limit), not on a human
  | 'idle'
  | 'done'
  | 'failed';

export type AgentSession = {
  id: string;
  name: string;
  kind: SessionKind;
  model: string;
  status: SessionStatus;
  /** Minutes since the session started. */
  ageMin: number;
  /** 0-100 toward its goal; short chats just jump to 100 when answered. */
  progress: number;
  /** The most recent thing the agent did or said, one line. */
  lastEvent: string;
  /** Present iff status is needs-attention: why a human is needed. */
  attention?: string;
  /** Rough token spend so far. */
  tokens: number;
  /** Estimated USD spend so far. */
  cost: number;
};

export const kindLabels: Record<SessionKind, string> = {
  loop: 'Autonomous loop',
  job: 'Scheduled job',
  chat: 'Interactive chat',
};

export const statusMeta: Record<SessionStatus, { label: string; tone: 'ok' | 'warn' | 'bad' | 'quiet' }> = {
  running: { label: 'Running', tone: 'ok' },
  'needs-attention': { label: 'Needs you', tone: 'bad' },
  waiting: { label: 'Waiting', tone: 'warn' },
  idle: { label: 'Idle', tone: 'quiet' },
  done: { label: 'Done', tone: 'ok' },
  failed: { label: 'Failed', tone: 'bad' },
};

/** The demo fleet: a realistic mix of long loops, jobs, and short chats. */
export const demoFleet: AgentSession[] = [
  {
    id: 's_migrate',
    name: 'DB migration: orders table',
    kind: 'loop',
    model: 'claude-opus-4-8',
    status: 'running',
    ageMin: 142,
    progress: 64,
    lastEvent: 'Backfilled 31/48 partitions; verifying row counts per batch.',
    tokens: 1_840_000,
    cost: 14.2,
  },
  {
    id: 's_flaky',
    name: 'Fix-until-green: checkout suite',
    kind: 'loop',
    model: 'claude-sonnet-5',
    status: 'running',
    ageMin: 37,
    progress: 45,
    lastEvent: 'Attempt 9: isolated the race to the cart mutex; writing a fix.',
    tokens: 410_000,
    cost: 2.9,
  },
  {
    id: 's_audit',
    name: 'Dependency audit sweep',
    kind: 'loop',
    model: 'claude-sonnet-5',
    status: 'needs-attention',
    ageMin: 58,
    progress: 80,
    lastEvent: 'Found a major-version bump with breaking changes in auth middleware.',
    attention: 'Approve or reject the breaking upgrade of `next-auth` before it opens the PR.',
    tokens: 620_000,
    cost: 4.1,
  },
  {
    id: 's_release',
    name: 'Release notes: v2.14',
    kind: 'job',
    model: 'claude-haiku-4-5',
    status: 'waiting',
    ageMin: 12,
    progress: 70,
    lastEvent: 'Waiting on CI to finish so the changelog can link green builds.',
    tokens: 38_000,
    cost: 0.09,
  },
  {
    id: 's_triage',
    name: 'Overnight issue triage',
    kind: 'job',
    model: 'claude-sonnet-5',
    status: 'done',
    ageMin: 420,
    progress: 100,
    lastEvent: 'Labeled 23 issues, closed 4 duplicates, flagged 1 for security review.',
    tokens: 280_000,
    cost: 1.7,
  },
  {
    id: 's_onboard',
    name: 'Chat: onboarding flow question',
    kind: 'chat',
    model: 'claude-opus-4-8',
    status: 'needs-attention',
    ageMin: 6,
    progress: 30,
    lastEvent: 'Asked which of the two signup variants is canonical; blocked on your answer.',
    attention: 'Answer one question: is variant A or B the canonical signup flow?',
    tokens: 22_000,
    cost: 0.24,
  },
  {
    id: 's_spec',
    name: 'Chat: draft billing spec',
    kind: 'chat',
    model: 'claude-fable-5',
    status: 'running',
    ageMin: 18,
    progress: 55,
    lastEvent: 'Drafting the proration section; two open questions noted for the end.',
    tokens: 96_000,
    cost: 2.1,
  },
  {
    id: 's_scrape',
    name: 'Docs refresh crawler',
    kind: 'job',
    model: 'claude-haiku-4-5',
    status: 'failed',
    ageMin: 95,
    progress: 35,
    lastEvent: 'Aborted: target site returned 429 for 15 minutes straight.',
    tokens: 64_000,
    cost: 0.15,
  },
];

/** Follow-up events the simulator feeds to running sessions, per session. */
export const demoEvents: Record<string, string[]> = {
  s_migrate: [
    'Backfilled 34/48 partitions; row counts match.',
    'Backfilled 38/48 partitions; slowing batch size for peak hours.',
    'Backfilled 43/48 partitions; verifying indexes.',
    'Backfilled 48/48 partitions; running final consistency check.',
    'Consistency check passed; preparing cutover checklist.',
  ],
  s_flaky: [
    'Attempt 10: fix applied; looping the suite 20x.',
    'Attempt 10: 14/20 green so far.',
    'Attempt 10: 20/20 green. Opening the PR.',
    'PR opened; CI running.',
  ],
  s_spec: [
    'Proration section drafted; moving to dunning.',
    'Dunning rules drafted; consolidating open questions.',
    'Spec draft complete with 2 open questions for you.',
  ],
};
