import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSkillBySlug, skills } from '@/data/skills';

export const runtime = 'nodejs';

const validIds = new Set(skills.map((s) => s.id));

export async function POST(req: Request) {
  let body: { skillId?: unknown; helpful?: unknown; comment?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const skillId = typeof body.skillId === 'string' ? body.skillId : '';
  if (!validIds.has(skillId) && !getSkillBySlug(skillId)) {
    return NextResponse.json({ error: 'unknown skill' }, { status: 400 });
  }
  const id = validIds.has(skillId) ? skillId : getSkillBySlug(skillId)!.id;

  const helpful = typeof body.helpful === 'boolean' ? body.helpful : null;
  const comment =
    typeof body.comment === 'string' ? body.comment.slice(0, 2000) : null;

  if (helpful === null && !comment) {
    return NextResponse.json({ error: 'empty feedback' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'feedback unavailable' }, { status: 503 });
  }

  const { error } = await supabase.rpc('submit_feedback', {
    p_skill_id: id,
    p_helpful: helpful,
    p_comment: comment,
  });

  if (error) {
    return NextResponse.json({ error: 'feedback failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
