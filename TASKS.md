---
status: draft
last-updated: 2026-07-19
owner: Philip
---

# Tasks: Vaizer

> Top half is the **plan** (the rules of the game: stack, architecture, conventions, design system). Bottom half is the **task checklist** (Now / Backlog / Shipped). See [SPEC.md](SPEC.md) for the what/why.

## Plan

### Stack
- **Next.js 15** (App Router, React 19, RSC) + **TypeScript**.
- **Tailwind CSS v4** (`@tailwindcss/postcss`), theme tokens as CSS vars in `globals.css` mapped through `@theme`.
- **`motion`** (Framer Motion successor) for the quiet reveal/entrance system and the Watch view's purposeful ongoing motion.
- **Supabase** (optional) for skill upvotes + feedback, via SECURITY-DEFINER RPCs (`cast_vote`, `submit_feedback`) and a read-only view. Degrades to inert when env is unset.
- **PostHog** (optional, privacy-conscious) + **Vercel Analytics** for product events.
- **JSZip** to assemble per-skill `.zip` downloads on demand from the marketplace repo.
- Hosted on **Vercel** (nekkolabs team), domain **vaizer.app**.

### Architecture
- Single Next.js app at the domain root (no basePath). Routes:
  - `/`, marketing home
  - `/skills`, search-first catalog + break down any public skill (inline visualization)
  - `/skills/[slug]`, catalog skill detail + workflow visualizer
  - `/skills/inspect`, redirects to `/skills` (legacy)
  - `/prompts`, prompt workbench: library + versioning + live analysis
  - `/config`, dynamic prompt configuration (prompt flags per project/environment, cache + invalidation)
  - `/hud`, agent command center (fleet board + attention queue, demo feed)
  - `/watch`, agent-loop monitor (demo run + future live runs)
  - API: `/api/vote`, `/api/feedback`, `/api/skills/[slug]/download`, `/api/inspect` (fetch + parse a public skill), `/api/anthropic-skills`, `/api/skills` (planned: public JSON catalog for external consumers, first consumer Nekko Dojo)
- **Skills data** (`src/data/skills.ts`): typed catalog + the `SkillWorkflow` graph type + a pure `layoutWorkflow` layered-layout function. This is the shared vocabulary the whole app renders skills in.
- **Skill parsing** (`src/lib/skill-parse.ts`): heuristic `SKILL.md` → `SkillWorkflow` parser (frontmatter + body sections/steps → trigger/context/agent/tool/decision/loop/output nodes). Runs server-side in `/api/inspect`.
- **Watch run model** (`src/data/runs.ts`): a `Run` = goal + ordered milestones + a stream of attempts + status. A demo run drives the UI; the same shape can be fed by a real run feed later.
- The workflow visualizer (`SkillWorkflow.tsx`) is source-agnostic: it renders any `SkillWorkflow`, whether from the catalog or a parsed public skill.
- **Model catalog** (`src/data/models.ts`): typed Claude family data (pricing per MTok, context, quality/speed ratings, planning traits). The one place model facts live.
- **Prompt analysis** (`src/lib/prompt-analysis.ts`): pure, deterministic analyzer. Classifies the task (type + complexity), reviews the prompt (issues w/ fixes, strengths, score), extracts the decision points it delegates, estimates tokens/cost per model, generates per-model plan paths from `models.ts` planning traits, and scores a recommendation by preference (cheapest / balanced / quality). No API calls; runs client-side.
- **Prompt store** (`src/lib/prompt-store.ts`): localStorage CRUD + immutable version snapshots, seeded on first load. Designed to swap to Supabase without changing the workbench.
- **Prompt config** (`src/data/prompt-config.ts`): Project → PromptFlag → per-environment `{enabled, cache}` state, localStorage-persisted demo data. `ConfigBoard.tsx` owns the toggle/invalidate/re-cache workflow (invalidate marks stale; a simulated next request re-caches).
- **HUD session model** (`src/data/agents.ts`): `AgentSession` (kind, status incl. needs-attention, progress, last event, spend) + a demo fleet and scripted events; `AgentHud.tsx` ticks it client-side. Same demo-first pattern as Watch, ready for a real session feed.

### Conventions
- Server Components by default; `'use client'` only for interactive islands (visualizer, explorer, vote/feedback, watch player).
- Env-optional: the site always builds without any env file (Supabase/PostHog/Discord all have safe fallbacks or inert modes).
- File-header comments explain *why* a module exists, matching the ported Dojo style.
- **No em dashes** anywhere (per workspace writing rule).

### Design system: "Vellum" (light node-graph)
- A single light theme, but never plain white: warm bone/vellum canvas with the subtle dot-grid echoing the node canvas. Reads like a technical drawing on paper. (Replaced the original dark "Signal" theme on 2026-07-18.)
- Tokens in `globals.css` (`--bg: #ece9e1`, `--surface`, `--surface-2`, `--fg` near-black ink, `--muted`, `--subtle`, `--border`, `--accent`, ...); everything re-skins from there.
- Palette: indigo-ink primary accent (`#5646d4`), deep-teal secondary "signal" (`#0e7c72`) for focus/progress/success. Node-kind hues carry over from Dojo (trigger amber, context blue, agent violet, tool teal-green, decision yellow, loop pink, output green) but in 600/700-weight values tuned for the light canvas.
- Status colors on light: red `#dc2626` (fail/needs-attention), amber `#b45309` (partial/stale/waiting), signal teal for ok/success.
- Type: crisp sans (Inter) + mono (JetBrains Mono).
- Motion is quiet and once-only, except the Watch view and the HUD (purposeful ongoing motion); `prefers-reduced-motion` respected.

### Provenance
- Forked from `nekko-dojo` (Next 15 app). The Skills subsystem (catalog, visualizer, install/download/vote/feedback, Supabase schema) moved here wholesale; Dojo's learning content (articles, guide, community) was stripped. Dojo's `/skills` was removed and Vaizer is now linked from Dojo's Community projects and the Nekko Labs Apps page.

---

## Tasks

### Now
- [ ] Connect Vercel project (nekkolabs team) + set `NEXT_PUBLIC_SITE_URL=https://vaizer.app`, added 2026-07-15
- [ ] Point vaizer.app DNS at Vercel (Philip, later), added 2026-07-15
- [ ] Set Supabase + PostHog env on Vercel to light up votes/feedback/analytics, added 2026-07-15
- [ ] Public catalog API `/api/skills`: JSON list of the catalog (name, slug, description, trust tier, categories, absolute link to the skill page), CORS-readable and cached, so Nekko Dojo's Community "Helpful tools" section can render it without hand-maintaining a list, added 2026-07-19 · [Skills, search-first workflow visualizer](SPEC.md)
- [ ] Author the **Resume Checker** skill and save it to the marketplace (`nekko-labs/nekko-dojo-skills`), then list it in the catalog as Nekko-official. Behavior: takes a resume + optional job links; auto-detects the role type and evaluates against role-appropriate criteria; checks current ATS / automated-screening signals and AI-centric JD expectations; outputs an HTML results page (findings, resume feedback, success likelihood per provided job link); interactive fix loop where the user accepts all or some suggested changes; emits the updated resume and highlights exactly what changed (e.g. a screenshot with an overlay of the edits), added 2026-07-19 · [Skills, Resume Checker](SPEC.md)
- [ ] Add the third-party **impeccable** skill to the catalog with clear attribution (not a Nekko Labs skill; distinct trust tier, link to the author's repo), added 2026-07-19 · [Skills, search-first workflow visualizer](SPEC.md)

### Backlog
- [ ] Deepen the public-skill parser: read `allowed-tools`/`tools` frontmatter and multi-file skills into richer graphs, added 2026-07-15 · [Skills, break down any public skill](SPEC.md)
- [ ] One real session/run feed powering both the HUD and Watch (SSE endpoint or uploaded run JSON), then a Claude Code / agent-SDK hook that emits it, added 2026-07-15 (widened to the HUD 2026-07-18) · [Watch](SPEC.md), [HUD](SPEC.md)
- [ ] Prompts: server-side storage + sharing (Supabase; reuse the vote/feedback env), added 2026-07-18 · [Prompts](SPEC.md)
- [ ] Prompts: optional LLM-backed deep review on top of the heuristic analyzer, added 2026-07-18 · [Prompts](SPEC.md)
- [ ] Config: real backing store + serve API so agents can actually read flags, and link flags to workbench prompts, added 2026-07-18 · [Config](SPEC.md)
- [ ] Generate the catalog `skills.ts` from the marketplace `catalog.json` instead of hand-maintaining, added 2026-07-15
- [ ] Shareable permalink for a parsed public-skill breakdown, added 2026-07-15
- [ ] Final logo / wordmark + OG image pass (now on the Vellum palette), added 2026-07-15

### Shipped
- [x] Retheme to "Vellum": light warm-bone canvas, indigo-ink accent, deep-teal signal, node-kind + status colors retuned for light; `color-scheme: light`, added+done 2026-07-18 · [Cross-cutting](SPEC.md)
- [x] Prompt workbench at `/prompts`: localStorage library w/ seeds, autosave editing, immutable version snapshots + restore (`src/lib/prompt-store.ts`, `PromptWorkbench.tsx`), added+done 2026-07-18 · [Prompts](SPEC.md)
- [x] Prompt analysis (`src/lib/prompt-analysis.ts` + `src/data/models.ts`): live review (grade, issues w/ fixes, strengths), delegated-decision extraction, per-model cost estimates, preference-weighted model recommendation (cheapest/balanced/quality), side-by-side per-model plan paths, added+done 2026-07-18 · [Prompts](SPEC.md)
- [x] Dynamic prompt config at `/config`: LaunchDarkly-style projects → flags → per-env toggles, prompt cache states (cached/stale/uncached) with single + bulk invalidation and simulated re-cache, flag detail w/ served prompt + targeting (`src/data/prompt-config.ts`, `ConfigBoard.tsx`), added+done 2026-07-18 · [Config](SPEC.md)
- [x] Agent HUD at `/hud`: fleet board (loops/jobs/chats) w/ status, progress, spend; attention queue w/ resolve-and-resume; summary stats; filters; live demo ticker (`src/data/agents.ts`, `AgentHud.tsx`), added+done 2026-07-18 · [HUD](SPEC.md)
- [x] Reposition home + nav for agent & prompt management: new hero/copy, 4-card feature grid + Watch banner, new mini previews, nav Skills/Prompts/Config/HUD/Watch, header CTA "Open the HUD", new tagline/description in `site.ts`, added+done 2026-07-18 · [Marketing home](SPEC.md)
- [x] Scaffold vaizer from nekko-dojo; strip Dojo content (articles, guide, community, MDX content); keep the Skills subsystem, added 2026-07-15 · [Provenance](TASKS.md)
- [x] Rebrand to the "Signal" dark node-graph theme: `globals.css` tokens, Inter + JetBrains Mono, layout, site config, header/footer/mobile nav, added 2026-07-15 · [Cross-cutting](SPEC.md)
- [x] Marketing home: hero + two feature sections (skills visualizer, agent-loop monitor) with live mini-previews + closing CTA, added 2026-07-15 · [Marketing home](SPEC.md)
- [x] Skills catalog + detail + interactive workflow visualizer (ported, rebranded), added 2026-07-15 · [Skills, workflow visualizer](SPEC.md)
- [x] Break down any public skill: `/skills/inspect` + `/api/inspect` (fetch `SKILL.md` from GitHub, heuristic parse to a workflow graph, render + explain) + curated Anthropic-official shortcuts, added 2026-07-15 · [Skills, break down any public skill](SPEC.md)
- [x] Watch: run model (`runs.ts`) + path-to-victory visualization + attempt feed + auto-playing demo run, added 2026-07-15 · [Watch](SPEC.md)
- [x] Remove `/skills` from Nekko Dojo (nav, routes, data, api, components) and update its SPEC, added 2026-07-15
- [x] Add Vaizer to the Nekko Dojo Community projects list and the Nekko Labs Apps page, added 2026-07-15

> Note: "Shipped" items are checked off (✅) once verified in the running app + merged. They ship together as the initial Vaizer cut.
