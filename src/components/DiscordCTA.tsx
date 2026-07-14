import Link from 'next/link';
import { site } from '@/lib/site';
import { DiscordIcon } from './icons';

/**
 * Reusable call-to-action block. Nudges toward the two things Vaizer does:
 * inspect any skill, and watch a run. Also links the Nekko Labs Discord for
 * people who want to talk agents. Used on the skill detail page footer.
 */
export function DiscordCTA({ className = '' }: { className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-8 text-center ${className}`}
    >
      <h2 className="text-xl font-semibold">Understand your own agents next</h2>
      <p className="mx-auto mt-2 max-w-prose text-muted">
        Break down any public skill into a workflow you can read, or watch a
        long-running loop make its way toward the goal.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/skills/inspect"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Break down a skill
        </Link>
        <Link
          href="/watch"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 font-medium text-fg transition-colors hover:border-accent"
        >
          Watch a run
        </Link>
        <a
          href={site.discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium text-muted transition-colors hover:text-fg"
        >
          <DiscordIcon className="h-5 w-5" />
          Discord
        </a>
      </div>
    </section>
  );
}
