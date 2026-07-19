---
status: draft
last-updated: 2026-07-19
owner: Philip
---

# Spec: Vaizer

> **This is the source of truth for the project.** It describes *what* we're building and *why*: vision, users, journeys, the feature set, and what success looks like. It is **not** about stack or technical design (that lives in `TASKS.md`). It is a **living artifact**: every prompt that adds or changes a feature updates this file so it always describes the system as it actually is and intends to be.

## Vision

**Vaizer** is agent and prompt management, made visible: *see*, *shape*, and *steer* your agents.

Agents are increasingly doing real work: running skills, calling tools, branching on decisions, and grinding through long autonomous loops. That work is driven by prompts and mostly happens out of sight. Vaizer makes the whole loop legible and manageable: the *shape* of a skill's run before you invoke it, the *quality, cost, and behavior* of a prompt before a model runs it, *which prompt each environment serves* (prompts as feature flags, not redeploys), and the *live state of every session* from one command-center HUD.

Served at **vaizer.app**, a Nekko Labs product.

The feel is a calm, technical instrument: a light vellum node-graph canvas (lighter, but never plain white), precise typography, everything readable at a glance. Less "dashboard for suits," more "the instrument panel a builder actually keeps open."

## Why It Exists

Four gaps, one theme (agents are opaque and their inputs are unmanaged):

1. **You can't see what a skill does before you run it.** Agent Skills are Markdown + tools; their real behavior (the trigger, the context it gathers, where it branches, where it loops, what it produces) is buried in prose. Vaizer renders any skill as a workflow graph you can read and click through, so you understand it *before* you trust it with your machine.
2. **You can't see what a prompt will do, cost, or leave to chance.** Prompts get pasted and hoped over. Vaizer reviews a prompt (issues, weak points, concrete fixes), surfaces the decisions it quietly delegates to the model, estimates the plan path each model would take, and recommends a model by your preference (cheapest that fits, balanced, or highest quality) with per-run and per-1k-run cost.
3. **Prompts are config, but they're managed like code.** Changing a served prompt shouldn't be a redeploy. Vaizer applies the LaunchDarkly workflow to prompts: per-project flags toggled per environment (development / staging / production), with explicit prompt caching and invalidation.
4. **You can't watch your agents work.** For a *fleet*, there is no answer to "is everything fine, and who needs me?"; Vaizer's HUD puts long loops, scheduled jobs, and quick chats on one board with an attention queue. For a *single long run*, you get a wall of logs; Vaizer's Watch view reframes it as a *journey toward victory*: milestones, attempts that succeed or fail, visible momentum.

Vaizer starts from the skills-workflow visualizer originally built inside Nekko Dojo, spins it out as its own product, and expands it into a general "manage and watch your agents" tool.

## Who It's For

1. **Agent builders / power users** (primary), people running Claude Code, agent SDKs, and skills daily who want to understand and trust what their agents do.
2. **Skill authors**, want to see their skill's workflow rendered, catch surprises, and share a visual of how it runs.
3. **Teams running long autonomous jobs**, want an at-a-glance "is it making progress?" view of loops that would otherwise be a log tail.
4. **Teams that ship prompts**, want prompts reviewed, versioned, and promoted through environments like the config they are.
5. **The curious**, anyone who wants to break down a public skill (e.g. Anthropic's official ones) and see how it's built.

## User Journeys & Experiences

1. **Find and understand a skill:** Home → Skills → one search box searches our catalog and Anthropic's official skills at once (or browse the same as trust-tiered lists below) → click any result and its workflow graph opens inline → click each step to learn what it does and where it branches → decide to install or move on.
2. **Break down a public skill:** In that same Skills search, paste any public GitHub URL (repo, folder, or raw `SKILL.md`) → a "Break down this URL" result appears → click it and Vaizer fetches its `SKILL.md`, parses it into a workflow graph inline, and explains each step. No separate page: breaking down any skill is just searching.
3. **Write and analyze a prompt:** Home → Prompts → pick a prompt from the library (or create one) → edit in place, analysis updates as you type → read the review (grade, issues with fixes, strengths, the decisions the prompt hands to the model) → set the preference (cheapest / balanced / highest quality) → see which model should run it, what a run costs on each, and each model's estimated plan path side by side → save a version when it's good.
4. **Manage prompt config for a project:** Home → Config → pick a project → flip prompt flags per environment like LaunchDarkly → invalidate a cached prompt (or a whole environment) and watch it re-cache on the next request → expand a flag to read the served prompt and its targeting.
5. **Run the fleet:** Home → HUD → every session on one board (loops, jobs, chats) with status, progress, and spend → the attention queue lists the agents that need a human → resolve one and it resumes → filter to running / needs-you / done.
6. **Watch an agent loop:** Home → Watch → open a run (demo run, or a live run fed to Vaizer) → see the path to victory, current attempt, what it just tried, and how far along it is → keep it open in a side monitor while the agent works.
7. **Discover Vaizer:** Land on the marketing home → grasp the capabilities in one scroll → jump into any of them.

Interacting with the app should feel like reading a well-drawn diagram: quiet motion, high signal, nothing that loops or distracts while you're trying to read.

### Motion

Vaizer uses a quiet, once-only animation language (the `motion` library): page headers and the home hero fade and rise on load; sections and card grids reveal and cascade as they scroll into view; workflow-graph edges and nodes settle in place. The Watch view and the HUD are the places with *ongoing* motion, and it is purposeful: progress advances, running/stale indicators pulse, milestones light up as they're reached. `prefers-reduced-motion` users get opacity-only fades and a static, fully-drawn state.

## What Success Looks Like

- People paste a public skill and get an accurate, readable breakdown they couldn't get from the raw Markdown.
- Skill authors share Vaizer graphs of their skills.
- People run their prompts through the workbench before shipping them, and the review changes what they write (and which model they pick).
- Teams treat prompts as flags: promoted through environments and invalidated on purpose, not shipped in deploys.
- Builders keep the HUD open all day and the Watch view open during long runs, because both answer "is it working?" faster than logs.
- Installs / clickthroughs to skills from the visualizer.
- Qualitative: "I finally get what my agents are doing."

## Feature Set

The living catalog of capabilities. Mark each `[shipped]` / `[in progress]` / `[planned]`.

### Marketing home
The front door. Explains the pitch (see, shape, and steer your agents) and routes to the features. *Why:* first-touch clarity; a product, not a repo.

- Hero: one-line pitch + primary CTAs to Prompts and the HUD `[shipped]`
- Feature grid: Skills, Prompts, Config, and HUD cards, each with a hand-built mini preview `[shipped]`
- Watch banner: the path-to-victory preview linking to /watch `[shipped]`
- Closing CTA + Nekko Labs attribution footer `[shipped]`

### Skills: search-first workflow visualizer (main feature)
One search box is the whole entry point to the Skills page. You search across our own catalog and any public skill at once; clicking any result opens its workflow graph (an n8n / Make-style node canvas) inline, so finding a skill and seeing how it runs is a single flow. Ported and expanded from Nekko Dojo. *Why:* the core "understand your agent" capability, with the lowest-friction path from "which skill?" to "here's how it runs."

- Unified search: one box matches the local catalog **and** a live index of Anthropic's official skills; paste any public GitHub URL and it becomes a "Break down this URL" result `[shipped]`
- Click-to-visualize: selecting any result (catalog, Anthropic, or pasted URL) opens the interactive workflow graph inline (trigger → context → agent → tools → decisions → loops → output); click any step for an explanation, then "Back to search" `[shipped]`
- Browse mode (empty query): the same skills as trust-tiered lists below (Nekko official / community / curated) plus a live "Anthropic official" group, filterable by category `[shipped]`
- Live Anthropic index: `/api/anthropic-skills` reads the `anthropics/skills` repo tree + frontmatter server-side (cached 1h, no token, env-optional), deduped against catalog entries `[shipped]`
- Per-skill detail page (deep link / SEO) with the same graph, trust tiers, install commands, per-skill `.zip` download, community upvotes + feedback (Supabase-backed) `[shipped]`
- Marketplace install flow from `nekko-labs/nekko-dojo-skills`, shown inline for installable catalog skills `[shipped]`
- **Public catalog API:** a JSON endpoint exposing the skills catalog (name, slug, description, trust tier, categories, link) so other properties can embed the list without hand-maintaining it. First consumer: Nekko Dojo's Community "Helpful tools" section. `[planned]`
- **Third-party skills in the catalog:** skills not authored by Nekko Labs, listed with clear attribution to their real author and a distinct trust tier. First entry: **impeccable**. `[planned]`

### Skills: Resume Checker (Nekko-official skill)
A job-hunt skill authored by Nekko Labs, published to the marketplace (`nekko-labs/nekko-dojo-skills`) and listed in the catalog like any other skill. It checks a resume against what current automated candidate-analysis (ATS) tools screen for and against what new AI-centric role job descriptions ask for. *Why:* Dojo's audience is actively applying for jobs, and resume screening is now largely automated; a skill that evaluates against the actual screeners (and the new AI-role expectations) is concrete, differentiated value, and it seeds the catalog with a flagship Nekko-official skill. `[planned]`

- Input: a resume, plus optionally links to specific jobs the user wants to apply to `[planned]`
- Auto-detects the role type from the resume and any provided jobs, and evaluates against role-appropriate criteria (an AI-engineering resume is judged differently from a frontend one) `[planned]`
- Checks cover current ATS / automated-screening signals (keywords, structure, parseability, quantified impact) and the expectations showing up in AI-centric job descriptions `[planned]`
- Output: an HTML results page with the findings, concrete resume feedback, and, when a job link was provided, a success-likelihood estimate against that posting `[planned]`
- Interactive fix loop: the skill proposes changes and the user accepts all or only some of them `[planned]`
- Produces the updated resume and highlights exactly what changed, e.g. a rendered screenshot of the resume with an overlay marking the edits `[planned]`

### Skills: break down any public skill (folded into search)
Point Vaizer at *any* public skill and get the same workflow breakdown, even if it isn't in our catalog. This is no longer a separate page: it is the URL-paste path of the unified search (the old `/skills/inspect` route redirects to `/skills`). *Why:* the visualizer is only as useful as the set of skills it can read; opening it to all public skills (e.g. Anthropic's official ones) makes it a general tool.

- Paste a GitHub URL (repo, folder, raw `SKILL.md`, or bare `owner/repo/path`) into the Skills search `[shipped]`
- Server-side fetch of the skill's `SKILL.md` (`/api/inspect`) + parse of frontmatter (name, description, tools) and body into a workflow graph via a heuristic step parser `[shipped]`
- Render the parsed skill through the same visualizer + step explainer, inline on the search page `[shipped]`
- Graceful handling of unreachable / unparseable sources `[shipped]`
- Deeper parse (multi-file skills, sub-skills) `[planned]`

### Prompts: workbench (storage, versioning, analysis)
Write, store, and analyze prompts in one place at `/prompts`. *Why:* prompts drive everything agents do, but they get written in whatever text box is nearest and judged only after the run; the workbench makes them reviewable assets.

- Prompt library with localStorage persistence (works with zero setup, no account), seeded with examples `[shipped]`
- Write/edit prompts with autosave; explicit "Save version" snapshots an immutable version history with restore `[shipped]`
- Live prompt review as you type: 0-100 score + letter grade, issues with severity and a concrete fix each (vagueness, missing format, conflicting instructions, no success criteria, unbounded scope, negation-heavy rules, wall of text, ...), plus detected strengths `[shipped]`
- "Decisions this prompt hands to the model": the prompt's branch points and unstated quality bars, surfaced as excerpts + what the model will decide `[shipped]`
- Model recommendation with a preference toggle (cheapest that fits / balanced / highest quality): per-model fit vs. task complexity, estimated cost per run and per 1k runs, and a score `[shipped]`
- Estimated plan paths: side-by-side, step-by-step sketches of how each model (Haiku 4.5 / Sonnet 5 / Opus 4.8 / Fable 5) would process the same prompt differently, compare up to 3 `[shipped]`
- Everything runs client-side via a deterministic heuristic analyzer (`src/lib/prompt-analysis.ts`); an LLM-backed deep-review mode is a natural upgrade `[planned]`
- Server-side prompt storage (Supabase) + sharing `[planned]`

### Config: dynamic prompt configuration (prompt flags)
The LaunchDarkly workflow pointed at prompts, at `/config`. A project holds prompt flags; each flag toggles per environment (development / staging / production) and tracks its prompt-cache state. *Why:* prompts are config, not code; changing what production serves shouldn't be a redeploy, and cached prompts need explicit, visible invalidation.

- Projects → prompt flags → per-environment toggles, LaunchDarkly-style board `[shipped]`
- Prompt caching per environment: cached (with age) / stale / not cached; invalidate one flag or a whole environment; stale prompts visibly re-cache on the next (simulated) request `[shipped]`
- Flag detail: the served prompt text + a targeting summary `[shipped]`
- Demo projects persisted to localStorage with reset; shapes designed for a real control plane later `[shipped]`
- Real backing store + API for serving flags to actual agents `[planned]`
- Link flags to prompts in the workbench library `[planned]`

### HUD: agent command center
One board for every agent session at `/hud`: long-running loops, scheduled jobs, and short interactive chats together. *Why:* self-running agents shouldn't demand constant human attention; the HUD gives visibility (status, progress, spend) and surfaces only the sessions that genuinely need a person.

- Fleet board: session cards with kind, model, age, status, live progress, latest event, token + cost spend `[shipped]`
- Attention queue: sessions blocked on a human decision float to the top with the exact ask; "Resolve & resume" unblocks them `[shipped]`
- Summary strip: active sessions, needs-attention count, tokens and estimated spend today `[shipped]`
- Status filters (all / running / needs you / waiting / done / failed) + live/pause control `[shipped]`
- Demo fleet ticks client-side (same pattern as Watch's demo run); shapes match a future real session feed `[shipped]`
- Live ingestion: feed the HUD from real Claude Code / agent-SDK / Managed Agents session events `[planned]`

### Watch: agent-loop monitor (game-like)
A page for watching long-running agent loops as a journey toward victory. *Why:* long autonomous runs are opaque; a path-to-victory framing answers "is it making progress?" at a glance and makes watching genuinely engaging.

- A "run" model: goal, milestones along a path, iterations/attempts, current state, momentum toward victory `[shipped]`
- Path-to-victory visualization: milestones as stops on a track, a marker advancing, win/lose states `[shipped]`
- Attempt feed: what the agent just tried, whether it worked, what it learned `[shipped]`
- A built-in demo run that plays out so the value is visible with zero setup `[shipped]`
- Designed to accept real run data (a run feed) later `[in progress]`
- Live ingestion: stream real Claude Code / agent-SDK run events into a Watch run `[planned]`

### Cross-cutting
- "Vellum" light node-graph brand + design system (tokens in `globals.css`): warm bone canvas, indigo-ink accent, deep-teal signal; lighter but never white (replaced the original dark "Signal" theme 2026-07-18) `[shipped]`
- Responsive + `prefers-reduced-motion` aware `[shipped]`
- PostHog analytics (optional, privacy-conscious) + Vercel Analytics `[shipped]`
- 404 page `[shipped]`

## Scope Boundaries

This project is NOT:
- A general agent runtime or orchestrator (Vaizer observes, explains, and configures; it doesn't run your agents).
- A logs/APM product (it's a focused, opinionated view, not a log aggregator).
- The Nekko Dojo learning platform (Dojo is a separate property; the skills feature moved *out* of Dojo into Vaizer).
- A skill *authoring* IDE (v1 reads and visualizes; it doesn't edit skills).
- An LLM gateway/proxy (v1 recommends models and estimates cost; it doesn't route or bill your API calls).

## Open Questions

- Hosting: deploy on Vercel (nekkolabs team), served at `vaizer.app` (DNS moved over later by Philip).
- Supabase env not yet set on Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VOTE_SALT`); votes/feedback stay inert until then. The same schema as Dojo (`supabase/schema.sql`) applies.
- Public-skill breakdown parses `SKILL.md` heuristically; accuracy on complex/multi-file skills is a known limitation to deepen.
- Prompt analysis is a deterministic heuristic in v1; when/how to add an LLM-backed deep review (and whether it needs an API key or a server-side quota) is open.
- Prompts, config, and the HUD all persist to localStorage in v1; the order for moving them server-side (Supabase for prompts first?) is open.
- Watch and the HUD currently play demo data; the shape of the real session/run feed (SSE endpoint? uploaded JSON? a small SDK hook?) is still open, and ideally one feed powers both.
- Brand: v1.1 ships the "Vellum" light node-graph theme; a final logo/wordmark pass is pending.
- The public catalog API's exact shape (and whether it merges the live Anthropic index or serves only our catalog) is open; Nekko Dojo's Helpful tools section is the first consumer, so its needs set the v1 shape.
- The Resume Checker's success-likelihood estimate against a job link needs an honest framing (it is an estimate from screening signals, not a promise); how strongly to caveat it is open.
