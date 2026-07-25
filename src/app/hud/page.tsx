import type { Metadata } from 'next';
import { AgentHud } from '@/components/AgentHud';
import { Reveal } from '@/components/motion';

export const metadata: Metadata = {
  title: 'Agent HUD',
  description:
    'A command center for every agent session: long-running loops and short chats together, with progress, spend, and an attention queue that surfaces the ones that actually need you.',
};

export default function HudPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Reveal as="header" load className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Agent HUD</h1>
        <p className="mt-3 text-lg text-muted">
          Every session on one board: overnight loops, scheduled jobs, and quick chats side by side. Self-running agents stay quiet while they make
          progress; <span className="text-fg">the attention queue surfaces the few that actually need you</span>.
        </p>
      </Reveal>

      <Reveal load delay={0.1} className="mt-8">
        <AgentHud />
      </Reveal>

      <Reveal className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            t: 'Triage, not tailing',
            d: 'Status, progress, and spend per session, so "is everything fine?" takes one glance instead of five terminal tabs.',
          },
          {
            t: 'Attention when earned',
            d: 'Agents that need a decision, an approval, or an answer jump to the queue. Everything else keeps working unwatched.',
          },
          {
            t: 'Your fleet, next',
            d: 'This board plays a demo fleet. The same shapes are built to be fed by real session events from Claude Code or an agent SDK.',
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
