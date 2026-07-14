/**
 * Server-side reads of skill vote counts from Supabase.
 *
 * Used by the (server-rendered, ISR-cached) skills pages. Returns 0 / empty
 * maps when Supabase isn't configured, so pages render fine without a backend.
 * Writes happen in the /api/vote route via the `cast_vote` RPC.
 */

import 'server-only';
import { getSupabase } from './supabase';

/** Map of skillId -> vote count. Missing skills are treated as 0. */
export async function getVoteCounts(): Promise<Record<string, number>> {
  const supabase = getSupabase();
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('skill_vote_counts')
      .select('skill_id, votes');
    if (error || !data) return {};
    const out: Record<string, number> = {};
    for (const row of data as Array<{ skill_id: string; votes: number }>) {
      out[row.skill_id] = Number(row.votes) || 0;
    }
    return out;
  } catch {
    return {};
  }
}

export async function getVoteCount(skillId: string): Promise<number> {
  const counts = await getVoteCounts();
  return counts[skillId] ?? 0;
}
