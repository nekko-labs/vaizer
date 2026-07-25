'use client';

import type { RemoteSkill } from '@/app/api/anthropic-skills/route';
import type { VizTarget } from '../SkillVizPanel';
import { ArrowRightIcon, GitHubIcon } from '../icons';
import { SkillResultCard } from './SkillResultCard';
import { catalogToTarget, remoteToTarget, type RemoteTarget, type SkillWithVotes } from './helpers';

/** Search results: an optional "break down this URL" affordance + matches. */
export function SkillsResults({
  urlTarget,
  catalog,
  remote,
  remoteLoading,
  total,
  onSelect,
}: {
  urlTarget: RemoteTarget | null;
  catalog: SkillWithVotes[];
  remote: RemoteSkill[];
  remoteLoading: boolean;
  total: number;
  onSelect: (t: VizTarget) => void;
}) {
  return (
    <div className="mt-8">
      {urlTarget && (
        <button
          type="button"
          onClick={() => onSelect(urlTarget)}
          className="group flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-5 text-left transition hover:border-accent"
        >
          <div className="flex items-center gap-3">
            <GitHubIcon className="h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="font-semibold tracking-tight text-fg">Break down this URL</p>
              <p className="mt-0.5 break-all font-mono text-xs text-muted">{urlTarget.url}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            Break it down
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      )}

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {total} {total === 1 ? 'result' : 'results'}
      </p>

      {catalog.length > 0 && (
        <ResultSection title="From the catalog">
          {catalog.map((i) => (
            <SkillResultCard key={i.skill.id} target={catalogToTarget(i)} onSelect={onSelect} />
          ))}
        </ResultSection>
      )}

      {remote.length > 0 && (
        <ResultSection title="Anthropic official">
          {remote.map((r) => (
            <SkillResultCard
              key={r.id}
              target={remoteToTarget(r)}
              skillName={r.name}
              description={r.description}
              onSelect={onSelect}
            />
          ))}
        </ResultSection>
      )}

      {total === 0 && !remoteLoading && (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-muted">
          No skills match that. Try different keywords, or paste a public GitHub URL to break down
          any skill.
        </p>
      )}
      {total === 0 && remoteLoading && (
        <p className="mt-8 text-center text-sm text-muted">Searching Anthropic&apos;s skills…</p>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
