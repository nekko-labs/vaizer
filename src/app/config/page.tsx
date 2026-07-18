import type { Metadata } from 'next';
import { ConfigBoard } from '@/components/ConfigBoard';
import { Reveal } from '@/components/motion';

export const metadata: Metadata = {
  title: 'Prompt config',
  description:
    'Feature-flag your prompts per project and environment: toggle what is served in development, staging, and production, and cache or invalidate prompts like a LaunchDarkly flag.',
};

export default function ConfigPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Reveal as="header" load className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Prompt config</h1>
        <p className="mt-3 text-lg text-muted">
          Prompts as feature flags. Each project&apos;s prompts are toggled per environment, served from a cache, and{' '}
          <span className="text-fg">invalidated on your schedule, not a redeploy&apos;s</span>. The workflow you know from LaunchDarkly, pointed at
          prompts.
        </p>
      </Reveal>

      <Reveal load delay={0.1} className="mt-8">
        <ConfigBoard />
      </Reveal>

      <Reveal className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            t: 'Toggle, don’t deploy',
            d: 'Flip a prompt on in development, promote it to staging, then production, without shipping code between each step.',
          },
          {
            t: 'Cache with intent',
            d: 'A served prompt stays cached until you invalidate it. Stale prompts re-render and re-cache on the next request.',
          },
          {
            t: 'Your projects, next',
            d: 'This board runs on demo projects stored in your browser. The same workflow is built to sit in front of a real prompt store.',
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
