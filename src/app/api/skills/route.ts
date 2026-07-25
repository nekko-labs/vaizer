import { NextResponse } from 'next/server';
import { getAllSkills, sourceLabels, categoryLabels } from '@/data/skills';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const revalidate = 3600;

/**
 * Public skills catalog API: a stable, CORS-readable JSON view of the catalog
 * so other properties can embed the skills list without hand-maintaining one.
 * First consumer: Nekko Dojo's Community "Helpful tools" section.
 *
 * The shape is deliberately flat and small (no workflow graphs); each entry
 * carries an absolute `url` back to its Vaizer skill page, which is where the
 * graph, install flow, votes, and feedback live.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
} as const;

export type PublicSkill = {
  slug: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  tier: string;
  tierLabel: string;
  author: string;
  /** Absolute URL of the skill's page on Vaizer. */
  url: string;
  /** The skill's source repo (external origin for curated skills). */
  sourceUrl: string;
  installCommand?: string;
  featured?: boolean;
  beginnerFriendly?: boolean;
};

export async function GET() {
  const skills: PublicSkill[] = getAllSkills().map((s) => ({
    slug: s.slug,
    name: s.name,
    description: s.description,
    category: s.category,
    categoryLabel: categoryLabels[s.category],
    tier: s.source,
    tierLabel: sourceLabels[s.source],
    author: s.author,
    url: `${site.url}/skills/${s.slug}`,
    sourceUrl: s.sourceUrl,
    ...(s.installCommand ? { installCommand: s.installCommand } : {}),
    ...(s.featured ? { featured: true } : {}),
    ...(s.beginnerFriendly ? { beginnerFriendly: true } : {}),
  }));

  return NextResponse.json(
    { source: 'vaizer', url: site.url, count: skills.length, skills },
    { headers: CORS_HEADERS },
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
