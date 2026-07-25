import type { Skill, SkillSource } from '@/data/skills';
import type { RemoteSkill } from '@/app/api/anthropic-skills/route';
import type { VizTarget } from '../SkillVizPanel';

/** A catalog skill paired with its live vote count. */
export type SkillWithVotes = { skill: Skill; voteCount: number };

export type RemoteTarget = Extract<VizTarget, { kind: 'remote' }>;

/** Trust-tier presentation for the browsable catalog groups. */
export const GROUPS: Array<{ source: SkillSource; title: string; blurb: string }> = [
  {
    source: 'nekko-official',
    title: '🟣 Nekko official',
    blurb: 'Built and reviewed by Nekko Labs. Safe to run once installed.',
  },
  {
    source: 'community',
    title: '🟢 Community',
    blurb: 'Submitted via PR to the marketplace. Audit the source before you run it.',
  },
  {
    source: 'curated',
    title: '🔗 Recommended from Anthropic',
    blurb: 'Great skills we did not build. Install them from their original source.',
  },
];

/** Does the query look like a GitHub link (or `owner/repo/...`) to break down? */
export function detectUrlTarget(query: string): RemoteTarget | null {
  const s = query.trim();
  if (!s) return null;
  const nameFrom = (v: string) => {
    const seg = v.split(/[/?#]/).filter(Boolean);
    return seg[seg.length - 1] || v;
  };

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (/(^|\.)github\.com$/i.test(u.hostname) || u.hostname === 'raw.githubusercontent.com') {
        return { kind: 'remote', name: nameFrom(u.pathname), url: s, origin: 'url' };
      }
    } catch {
      /* not a URL */
    }
    return null;
  }
  if (/^(www\.)?github\.com\//i.test(s) || /^raw\.githubusercontent\.com\//i.test(s)) {
    return { kind: 'remote', name: nameFrom(s), url: `https://${s}`, origin: 'url' };
  }
  // owner/repo[/path], no whitespace.
  if (!/\s/.test(s) && /^[\w.-]+\/[\w.-]+(\/.+)?$/.test(s)) {
    return { kind: 'remote', name: nameFrom(s), url: `https://github.com/${s}`, origin: 'url' };
  }
  return null;
}

export const catalogToTarget = (i: SkillWithVotes): VizTarget => ({
  kind: 'catalog',
  skill: i.skill,
  voteCount: i.voteCount,
});

export const remoteToTarget = (r: RemoteSkill): VizTarget => ({
  kind: 'remote',
  name: r.name,
  url: r.url,
  origin: 'anthropic',
});

/** Category filter chip styling, shared by the browse filters. */
export const chipClass = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${
    active
      ? 'border-accent bg-accent/12 text-accent'
      : 'border-border text-muted hover:border-accent hover:text-accent'
  }`;
