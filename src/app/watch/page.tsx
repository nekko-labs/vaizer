import type { Metadata } from 'next';
import { demoRun } from '@/data/runs';
import { RunPlayer } from '@/components/RunPlayer';
import { Reveal } from '@/components/motion';

export const metadata: Metadata = {
  title: 'Watch',
  description:
    'Watch a long-running agent loop as a journey toward victory: milestones on a path, a marker that advances, and a feed of what the agent just tried.',
};

export default function WatchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Reveal as="header" load className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Watch a run</h1>
        <p className="mt-3 text-lg text-muted">
          Long autonomous loops are usually a wall of logs, or nothing at all. Vaizer reframes a
          loop as a journey toward victory, so you can answer the only question that matters,{' '}
          <span className="text-fg">is it making progress</span>, at a glance.
        </p>
      </Reveal>

      <Reveal load delay={0.1} className="mt-8">
        <RunPlayer run={demoRun} />
      </Reveal>

      <Reveal className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            t: 'The path',
            d: 'Milestones are stops on a track. They light up as the agent reaches them, so distance-to-goal is always visible.',
          },
          {
            t: 'The attempts',
            d: 'Every loop iteration is one attempt: what it tried, whether it worked, and what it learned. Dead ends and backtracks included.',
          },
          {
            t: 'Your runs, next',
            d: 'This is a demo run. The same view is built to accept real run data from Claude Code or an agent SDK. That feed is coming.',
          },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-fg">{c.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
          </div>
        ))}
      </Reveal>
    </div>
  );
}
