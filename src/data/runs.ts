/**
 * The Watch run model.
 *
 * A "run" is a long-running agent loop reframed as a journey toward victory:
 * a goal, an ordered set of milestones along a path, and a timeline of
 * attempts (what the agent tried, whether it worked, what it learned). The
 * Watch UI replays a run so you can see momentum at a glance.
 *
 * This is the same shape a real run feed would produce, so the demo run here
 * can later be swapped for live data (an SSE endpoint, an uploaded run JSON,
 * or a small agent-SDK hook) without changing the UI.
 */

export type AttemptStatus = 'success' | 'fail' | 'partial' | 'running';

export type Attempt = {
  /** Monotonic index in the run timeline. */
  n: number;
  /** Index of the milestone this attempt is pushing toward. */
  milestone: number;
  /** What the agent tried, in one line. */
  action: string;
  status: AttemptStatus;
  /** What the agent took away from it (shown in the feed). */
  learning?: string;
};

export type Milestone = {
  id: string;
  label: string;
  detail?: string;
};

export type Run = {
  id: string;
  goal: string;
  /** Short context line: what kind of loop this is. */
  kind: string;
  milestones: Milestone[];
  attempts: Attempt[];
};

/** How far along a run is, given how many attempts have been revealed. */
export function progressAt(run: Run, revealed: number): {
  milestone: number;
  reached: boolean[];
  won: boolean;
} {
  const reached = run.milestones.map(() => false);
  let maxMilestone = -1;
  for (let i = 0; i < revealed && i < run.attempts.length; i++) {
    const a = run.attempts[i];
    if (a.status === 'success') {
      for (let m = 0; m <= a.milestone; m++) reached[m] = true;
      maxMilestone = Math.max(maxMilestone, a.milestone);
    }
  }
  const won = reached.length > 0 && reached[reached.length - 1];
  return { milestone: maxMilestone, reached, won };
}

/**
 * The built-in demo run: an agent grinding a flaky CI test to green, then
 * shipping. Realistic rhythm: dead ends, a partial win, backtracking, then a
 * clean finish. Zero setup required to see Watch do its thing.
 */
export const demoRun: Run = {
  id: 'demo-flaky-ci',
  goal: 'Get the flaky checkout test passing in CI, then ship the fix',
  kind: 'Fix-until-green loop · Claude Code',
  milestones: [
    { id: 'repro', label: 'Reproduce', detail: 'Make the failure happen on demand' },
    { id: 'isolate', label: 'Isolate cause', detail: 'Find why it flakes' },
    { id: 'fix', label: 'First fix', detail: 'Apply a candidate fix' },
    { id: 'green', label: 'Tests green', detail: '20 consecutive passes' },
    { id: 'ship', label: 'Ship', detail: 'PR opened, checks pass, merged' },
  ],
  attempts: [
    { n: 1, milestone: 0, action: 'Run the checkout suite once locally', status: 'fail', learning: 'Passed locally. The flake only shows in CI.' },
    { n: 2, milestone: 0, action: 'Loop the test 50x locally to force the flake', status: 'fail', learning: 'Still green locally. Environment difference, not the test alone.' },
    { n: 3, milestone: 0, action: 'Reproduce under CI concurrency (4 workers)', status: 'success', learning: 'Reproduced. Fails ~1 in 8 runs under parallelism.' },
    { n: 4, milestone: 1, action: 'Add timing logs around the payment mock', status: 'partial', learning: 'Failure correlates with a slow mock response.' },
    { n: 5, milestone: 1, action: 'Inspect shared fixture state across workers', status: 'success', learning: 'Root cause: workers share one seeded cart row. Race on teardown.' },
    { n: 6, milestone: 2, action: 'Give each worker its own cart fixture', status: 'partial', learning: 'Flake rate drops but a new assertion times out.' },
    { n: 7, milestone: 2, action: 'Await the payment webhook instead of a fixed sleep', status: 'success', learning: 'Removed the last sleep. Deterministic ordering now.' },
    { n: 8, milestone: 3, action: 'Run the suite 20x in CI-like concurrency', status: 'fail', learning: '19/20. One failure in a different test, DB pool exhausted.' },
    { n: 9, milestone: 3, action: 'Raise the test DB pool + close connections in teardown', status: 'success', learning: '20/20 green, three times in a row.' },
    { n: 10, milestone: 4, action: 'Open PR with the fix and a regression test', status: 'partial', learning: 'CI queued. Lint flagged an unused import.' },
    { n: 11, milestone: 4, action: 'Drop the unused import, push', status: 'success', learning: 'All checks green. Auto-merge enabled.' },
    { n: 12, milestone: 4, action: 'Merge on green', status: 'success', learning: 'Merged. Flaky test retired.' },
  ],
};

export const runs: Record<string, Run> = {
  [demoRun.id]: demoRun,
};
