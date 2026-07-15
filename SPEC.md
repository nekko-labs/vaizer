---
status: draft
last-updated: 2026-07-15
owner: Philip
---

# Spec: Vaizer

> **This is the source of truth for the project.** It describes *what* we're building and *why*: vision, users, journeys, the feature set, and what success looks like. It is **not** about stack or technical design (that lives in `TASKS.md`). It is a **living artifact**: every prompt that adds or changes a feature updates this file so it always describes the system as it actually is and intends to be.

## Vision

**Vaizer** helps you *see* how your AI agents work and what they're focused on.

Agents are increasingly doing real work: running skills, calling tools, branching on decisions, and grinding through long autonomous loops. But that work is mostly invisible. You paste a prompt, wait, and hope. Vaizer turns that black box into something you can watch and understand: the *shape* of a skill's run before you invoke it, and the *live progress* of a long-running agent loop as it tries things and pushes toward a goal.

Served at **vaizer.app**, a Nekko Labs product.

The feel is a calm, technical observability tool: dark node-graph canvas, precise typography, everything readable at a glance. Less "dashboard for suits," more "the instrument panel a builder actually keeps open."

## Why It Exists

Two gaps, one theme (agents are opaque):

1. **You can't see what a skill does before you run it.** Agent Skills are Markdown + tools; their real behavior (the trigger, the context it gathers, where it branches, where it loops, what it produces) is buried in prose. Vaizer renders any skill as a workflow graph you can read and click through, so you understand it *before* you trust it with your machine.
2. **You can't watch a long-running agent loop make progress.** When an agent runs for minutes or hours (a migration, an audit, a fix-until-green loop), you get a wall of logs or nothing. Vaizer reframes a loop as a *journey toward victory*: a path with milestones, attempts that succeed or fail, and visible momentum, so watching an agent work feels like watching a speedrun rather than tailing a log.

Vaizer starts from the skills-workflow visualizer originally built inside Nekko Dojo, spins it out as its own product, and expands it into a general "understand and watch your agents" tool.

## Who It's For

1. **Agent builders / power users** (primary), people running Claude Code, agent SDKs, and skills daily who want to understand and trust what their agents do.
2. **Skill authors**, want to see their skill's workflow rendered, catch surprises, and share a visual of how it runs.
3. **Teams running long autonomous jobs**, want an at-a-glance "is it making progress?" view of loops that would otherwise be a log tail.
4. **The curious**, anyone who wants to break down a public skill (e.g. Anthropic's official ones) and see how it's built.

## User Journeys & Experiences

1. **Find and understand a skill:** Home → Skills → one search box searches our catalog and Anthropic's official skills at once (or browse the same as trust-tiered lists below) → click any result and its workflow graph opens inline → click each step to learn what it does and where it branches → decide to install or move on.
2. **Break down a public skill:** In that same Skills search, paste any public GitHub URL (repo, folder, or raw `SKILL.md`) → a "Break down this URL" result appears → click it and Vaizer fetches its `SKILL.md`, parses it into a workflow graph inline, and explains each step. No separate page: breaking down any skill is just searching.
3. **Watch an agent loop:** Home → Watch → open a run (demo run, or a live run fed to Vaizer) → see the path to victory, current attempt, what it just tried, and how far along it is → keep it open in a side monitor while the agent works.
4. **Discover Vaizer:** Land on the marketing home → grasp the two capabilities in one scroll → jump into Skills or Watch.

Interacting with the app should feel like reading a well-drawn diagram: quiet motion, high signal, nothing that loops or distracts while you're trying to read.

### Motion

Vaizer uses a quiet, once-only animation language (the `motion` library): page headers and the home hero fade and rise on load; sections and card grids reveal and cascade as they scroll into view; workflow-graph edges and nodes settle in place. The Watch view is the one place with *ongoing* motion, and it is purposeful: the progress path advances, the current attempt pulses, milestones light up as they're reached. `prefers-reduced-motion` users get opacity-only fades and a static, fully-drawn state.

## What Success Looks Like

- People paste a public skill and get an accurate, readable breakdown they couldn't get from the raw Markdown.
- Skill authors share Vaizer graphs of their skills.
- Builders keep the Watch view open during long runs because it answers "is it working?" faster than logs.
- Installs / clickthroughs to skills from the visualizer.
- Qualitative: "I finally get what my agent is doing."

## Feature Set

The living catalog of capabilities. Mark each `[shipped]` / `[in progress]` / `[planned]`.

### Marketing home
The front door. Explains the pitch (see how your agents work and what they're focused on) and routes to the two features. *Why:* first-touch clarity; a product, not a repo.

- Hero: one-line pitch + primary CTAs to Skills and Watch `[shipped]`
- Feature section: the skills workflow visualizer, with a live mini-graph preview `[shipped]`
- Feature section: the agent-loop monitor, with a mini path-to-victory preview `[shipped]`
- Closing CTA + Nekko Labs attribution footer `[shipped]`

### Skills: search-first workflow visualizer (main feature)
One search box is the whole entry point to the Skills page. You search across our own catalog and any public skill at once; clicking any result opens its workflow graph (an n8n / Make-style node canvas) inline, so finding a skill and seeing how it runs is a single flow. Ported and expanded from Nekko Dojo. *Why:* the core "understand your agent" capability, with the lowest-friction path from "which skill?" to "here's how it runs."

- Unified search: one box matches the local catalog **and** a live index of Anthropic's official skills; paste any public GitHub URL and it becomes a "Break down this URL" result `[shipped]`
- Click-to-visualize: selecting any result (catalog, Anthropic, or pasted URL) opens the interactive workflow graph inline (trigger → context → agent → tools → decisions → loops → output); click any step for an explanation, then "Back to search" `[shipped]`
- Browse mode (empty query): the same skills as trust-tiered lists below (Nekko official / community / curated) plus a live "Anthropic official" group, filterable by category `[shipped]`
- Live Anthropic index: `/api/anthropic-skills` reads the `anthropics/skills` repo tree + frontmatter server-side (cached 1h, no token, env-optional), deduped against catalog entries `[shipped]`
- Per-skill detail page (deep link / SEO) with the same graph, trust tiers, install commands, per-skill `.zip` download, community upvotes + feedback (Supabase-backed) `[shipped]`
- Marketplace install flow from `nekko-labs/nekko-dojo-skills`, shown inline for installable catalog skills `[shipped]`

### Skills: break down any public skill (folded into search)
Point Vaizer at *any* public skill and get the same workflow breakdown, even if it isn't in our catalog. This is no longer a separate page: it is the URL-paste path of the unified search (the old `/skills/inspect` route redirects to `/skills`). *Why:* the visualizer is only as useful as the set of skills it can read; opening it to all public skills (e.g. Anthropic's official ones) makes it a general tool.

- Paste a GitHub URL (repo, folder, raw `SKILL.md`, or bare `owner/repo/path`) into the Skills search `[shipped]`
- Server-side fetch of the skill's `SKILL.md` (`/api/inspect`) + parse of frontmatter (name, description, tools) and body into a workflow graph via a heuristic step parser `[shipped]`
- Render the parsed skill through the same visualizer + step explainer, inline on the search page `[shipped]`
- Graceful handling of unreachable / unparseable sources `[shipped]`
- Deeper parse (multi-file skills, sub-skills) `[planned]`

### Watch: agent-loop monitor (game-like)
A page for watching long-running agent loops as a journey toward victory. *Why:* long autonomous runs are opaque; a path-to-victory framing answers "is it making progress?" at a glance and makes watching genuinely engaging.

- A "run" model: goal, milestones along a path, iterations/attempts, current state, momentum toward victory `[shipped]`
- Path-to-victory visualization: milestones as stops on a track, a marker advancing, win/lose states `[shipped]`
- Attempt feed: what the agent just tried, whether it worked, what it learned `[shipped]`
- A built-in demo run that plays out so the value is visible with zero setup `[shipped]`
- Designed to accept real run data (a run feed) later `[in progress]`
- Live ingestion: stream real Claude Code / agent-SDK run events into a Watch run `[planned]`

### Cross-cutting
- Dark node-graph brand + design system (tokens in `globals.css`) `[shipped]`
- Responsive + `prefers-reduced-motion` aware `[shipped]`
- PostHog analytics (optional, privacy-conscious) + Vercel Analytics `[shipped]`
- 404 page `[shipped]`

## Scope Boundaries

This project is NOT:
- A general agent runtime or orchestrator (Vaizer observes and explains; it doesn't run your agents).
- A logs/APM product (it's a focused, opinionated view, not a log aggregator).
- The Nekko Dojo learning platform (Dojo is a separate property; the skills feature moved *out* of Dojo into Vaizer).
- A skill *authoring* IDE (v1 reads and visualizes; it doesn't edit skills).

## Open Questions

- Hosting: deploy on Vercel (nekkolabs team), served at `vaizer.app` (DNS moved over later by Philip).
- Supabase env not yet set on Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VOTE_SALT`); votes/feedback stay inert until then. The same schema as Dojo (`supabase/schema.sql`) applies.
- Public-skill breakdown parses `SKILL.md` heuristically; accuracy on complex/multi-file skills is a known limitation to deepen.
- Watch currently plays a demo run; the shape of the real run feed (SSE endpoint? uploaded JSON? a small SDK hook?) is still open.
- Brand: v1 ships a clean dark node-graph theme; a final logo/wordmark pass is pending.
