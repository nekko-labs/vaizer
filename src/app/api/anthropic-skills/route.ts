import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 3600;

/**
 * A live index of Anthropic's official skills, so the Skills search can surface
 * public skills that aren't in our own catalog. We read the repo tree once
 * (cached), keep every `skills/<name>/SKILL.md`, and pull each skill's name +
 * description from its frontmatter. Clicking a result runs it through the same
 * `/api/inspect` breakdown as any other public skill.
 *
 * No token required: the public tree + raw file endpoints are enough, and the
 * whole response is cached for an hour, so this stays within unauthenticated
 * rate limits and keeps the site env-optional. If GitHub is unreachable we
 * return an empty index rather than failing the page.
 */

const REPO = 'anthropics/skills';
const BRANCH = 'main';

export type RemoteSkill = {
  id: string;
  name: string;
  description: string;
  /** Folder within the repo, e.g. `skills/pdf`. */
  path: string;
  /** GitHub URL to the skill folder (what /api/inspect breaks down). */
  url: string;
  tags: string[];
};

/** Turn a folder slug (`web-artifacts-builder`) into a readable title. */
function humanize(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Pull `name` + `description` out of a SKILL.md's YAML frontmatter. */
function frontmatterMeta(md: string): { name?: string; description?: string } {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  if (!m) return {};
  const yaml = m[1];
  const grab = (key: string): string | undefined => {
    const mm = new RegExp(`^${key}\\s*:\\s*(.+)$`, 'im').exec(yaml);
    if (!mm) return undefined;
    return mm[1].trim().replace(/^["']|["']$/g, '');
  };
  return { name: grab('name'), description: grab('description') };
}

async function fetchMeta(path: string): Promise<{ name?: string; description?: string }> {
  const raw = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}/SKILL.md`;
  try {
    const res = await fetch(raw, {
      headers: { 'User-Agent': 'vaizer-skill-index' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    return frontmatterMeta(await res.text());
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`,
      {
        headers: {
          'User-Agent': 'vaizer-skill-index',
          Accept: 'application/vnd.github+json',
        },
        next: { revalidate: 3600 },
      },
    );
    if (!treeRes.ok) return NextResponse.json({ skills: [] });

    const tree = (await treeRes.json()) as { tree?: Array<{ path?: string }> };
    const folders = (tree.tree ?? [])
      .map((n) => n.path ?? '')
      .filter((p) => /^skills\/[^/]+\/SKILL\.md$/.test(p))
      .map((p) => p.replace(/\/SKILL\.md$/, ''));

    const skills: RemoteSkill[] = await Promise.all(
      folders.map(async (folder) => {
        const slug = folder.split('/').pop()!;
        const meta = await fetchMeta(folder);
        return {
          id: `anthropic-${slug}`,
          name: meta.name || humanize(slug),
          description: meta.description ?? '',
          path: folder,
          url: `https://github.com/${REPO}/tree/${BRANCH}/${folder}`,
          tags: ['anthropic', 'official'],
        };
      }),
    );

    skills.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ skills: [] });
  }
}
