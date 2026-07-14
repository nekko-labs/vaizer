import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getSupabase } from '@/lib/supabase';
import { getSkillBySlug, skills } from '@/data/skills';

export const runtime = 'nodejs';

const validIds = new Set(skills.map((s) => s.id));

/** Best-effort voter fingerprint: client token + IP + server salt, hashed. */
function voterHash(token: string, ip: string): string {
  const salt = process.env.VOTE_SALT ?? 'vaizer-dev-salt';
  return createHash('sha256').update(`${salt}:${token}:${ip}`).digest('hex').slice(0, 64);
}

export async function POST(req: Request) {
  let body: { skillId?: unknown; token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const skillId = typeof body.skillId === 'string' ? body.skillId : '';
  const token = typeof body.token === 'string' ? body.token : '';

  // Accept votes only for skills we know about (also covered by `slug` lookups).
  if (!validIds.has(skillId) && !getSkillBySlug(skillId)) {
    return NextResponse.json({ error: 'unknown skill' }, { status: 400 });
  }
  const id = validIds.has(skillId) ? skillId : getSkillBySlug(skillId)!.id;

  if (token.length < 8 || token.length > 128) {
    return NextResponse.json({ error: 'invalid token' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'voting unavailable' }, { status: 503 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const { data, error } = await supabase.rpc('cast_vote', {
    p_skill_id: id,
    p_voter_hash: voterHash(token, ip),
  });

  if (error) {
    return NextResponse.json({ error: 'vote failed' }, { status: 500 });
  }
  return NextResponse.json({ count: typeof data === 'number' ? data : 0 });
}
