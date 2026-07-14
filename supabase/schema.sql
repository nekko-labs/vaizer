-- Nekko Dojo — Agent Skills hub: votes & feedback schema.
--
-- Apply in the Supabase SQL editor (or `supabase db push`). The website talks
-- to this with the ANON key only; all writes go through SECURITY DEFINER RPCs
-- and reads through a view, so the anon role never has direct table access.
--
-- Run this whole file once. Re-running is safe (idempotent where practical).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.skill_votes (
  skill_id   text        not null,
  voter_hash text        not null,
  created_at timestamptz not null default now(),
  primary key (skill_id, voter_hash)   -- one vote per (skill, voter) — dedup
);

create index if not exists skill_votes_skill_idx on public.skill_votes (skill_id);

create table if not exists public.skill_feedback (
  id         bigint generated always as identity primary key,
  skill_id   text        not null,
  helpful    boolean,
  comment    text,
  created_at timestamptz not null default now(),
  constraint comment_len check (comment is null or char_length(comment) <= 2000)
);

create index if not exists skill_feedback_skill_idx on public.skill_feedback (skill_id);

-- ---------------------------------------------------------------------------
-- Read-only aggregate view (counts per skill)
-- ---------------------------------------------------------------------------

create or replace view public.skill_vote_counts as
  select skill_id, count(*)::int as votes
  from public.skill_votes
  group by skill_id;

-- ---------------------------------------------------------------------------
-- Row Level Security: lock the tables; expose only via RPCs + the view
-- ---------------------------------------------------------------------------

alter table public.skill_votes    enable row level security;
alter table public.skill_feedback enable row level security;
-- No policies are created, so anon/authenticated have NO direct table access.
-- (SECURITY DEFINER functions below run as the owner and bypass RLS.)

-- ---------------------------------------------------------------------------
-- RPCs (the only write path)
-- ---------------------------------------------------------------------------

-- Cast a vote. Idempotent per (skill_id, voter_hash). Returns the new count.
create or replace function public.cast_vote(p_skill_id text, p_voter_hash text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_skill_id is null or char_length(p_skill_id) = 0 or char_length(p_skill_id) > 100 then
    raise exception 'invalid skill_id';
  end if;
  if p_voter_hash is null or char_length(p_voter_hash) < 8 or char_length(p_voter_hash) > 128 then
    raise exception 'invalid voter_hash';
  end if;

  insert into public.skill_votes (skill_id, voter_hash)
  values (p_skill_id, p_voter_hash)
  on conflict (skill_id, voter_hash) do nothing;

  select count(*)::int into v_count from public.skill_votes where skill_id = p_skill_id;
  return v_count;
end;
$$;

-- Submit feedback (optional helpful flag + comment).
create or replace function public.submit_feedback(
  p_skill_id text,
  p_helpful  boolean,
  p_comment  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_skill_id is null or char_length(p_skill_id) = 0 or char_length(p_skill_id) > 100 then
    raise exception 'invalid skill_id';
  end if;
  insert into public.skill_feedback (skill_id, helpful, comment)
  values (p_skill_id, p_helpful, nullif(left(coalesce(p_comment, ''), 2000), ''));
end;
$$;

-- Grant execute + view read to the anon role (used by the website).
grant select on public.skill_vote_counts to anon, authenticated;
grant execute on function public.cast_vote(text, text)              to anon, authenticated;
grant execute on function public.submit_feedback(text, boolean, text) to anon, authenticated;
