---
status: draft
last-updated: 2026-07-15
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
  - `/skills`, catalog + "break down a skill" entry
  - `/skills/[slug]`, catalog skill detail + workflow visualizer
  - `/skills/inspect`, break down any public skill (input a GitHub URL / pick a known one)
  - `/watch`, agent-loop monitor (demo run + future live runs)
  - API: `/api/vote`, `/api/feedback`, `/api/skills/[slug]/download`, `/api/inspect` (fetch + parse a public skill)
- **Skills data** (`src/data/skills.ts`): typed catalog + the `SkillWorkflow` graph type + a pure `layoutWorkflow` layered-layout function. This is the shared vocabulary the whole app renders skills in.
- **Skill parsing** (`src/lib/skill-parse.ts`): heuristic `SKILL.md` → `SkillWorkflow` parser (frontmatter + body sections/steps → trigger/context/agent/tool/decision/loop/output nodes). Runs server-side in `/api/inspect`.
- **Watch run model** (`src/data/runs.ts`): a `Run` = goal + ordered milestones + a stream of attempts + status. A demo run drives the UI; the same shape can be fed by a real run feed later.
- The workflow visualizer (`SkillWorkflow.tsx`) is source-agnostic: it renders any `SkillWorkflow`, whether from the catalog or a parsed public skill.

### Conventions
- Server Components by default; `'use client'` only for interactive islands (visualizer, explorer, vote/feedback, watch player).
- Env-optional: the site always builds without any env file (Supabase/PostHog/Discord all have safe fallbacks or inert modes).
- File-header comments explain *why* a module exists, matching the ported Dojo style.
- **No em dashes** anywhere (per workspace writing rule).

### Design system: "Signal" (dark node-graph)
- A single dark theme. Deep slate canvas, subtle dot-grid echoing the node canvas, one electric accent.
- Tokens in `globals.css` (`--bg`, `--surface`, `--surface-2`, `--fg`, `--muted`, `--subtle`, `--border`, `--accent`, ...); everything re-skins from there.
- Palette: near-black slate background, violet-indigo primary accent, cyan secondary "signal" for focus/progress. Node-kind colors (trigger amber, context blue, agent violet, tool green, decision yellow, loop pink, output green) carry over from Dojo so the graph reads the same.
- Type: crisp sans (Inter) + mono (JetBrains Mono).
- Motion is quiet and once-only, except the Watch view (purposeful ongoing motion); `prefers-reduced-motion` respected.

### Provenance
- Forked from `nekko-dojo` (Next 15 app). The Skills subsystem (catalog, visualizer, install/download/vote/feedback, Supabase schema) moved here wholesale; Dojo's learning content (articles, guide, community) was stripped. Dojo's `/skills` was removed and Vaizer is now linked from Dojo's Community projects and the Nekko Labs Apps page.

---

## Tasks

### Now
- [ ] Connect Vercel project (nekkolabs team) + set `NEXT_PUBLIC_SITE_URL=https://vaizer.app`, added 2026-07-15
- [ ] Point vaizer.app DNS at Vercel (Philip, later), added 2026-07-15
- [ ] Set Supabase + PostHog env on Vercel to light up votes/feedback/analytics, added 2026-07-15

### Backlog
- [ ] Deepen the public-skill parser: read `allowed-tools`/`tools` frontmatter and multi-file skills into richer graphs, added 2026-07-15 · [Skills, break down any public skill](SPEC.md)
- [ ] Watch: define + implement the real run feed (SSE endpoint or uploaded run JSON), then a Claude Code / agent-SDK hook that emits it, added 2026-07-15 · [Watch](SPEC.md)
- [ ] Generate the catalog `skills.ts` from the marketplace `catalog.json` instead of hand-maintaining, added 2026-07-15
- [ ] Shareable permalink for a parsed public-skill breakdown, added 2026-07-15
- [ ] Final logo / wordmark + OG image pass, added 2026-07-15

### Shipped
- [x] Scaffold vaizer from nekko-dojo; strip Dojo content (articles, guide, community, MDX content); keep the Skills subsystem, added 2026-07-15 · [Provenance](TASKS.md)
- [x] Rebrand to the "Signal" dark node-graph theme: `globals.css` tokens, Inter + JetBrains Mono, layout, site config, header/footer/mobile nav, added 2026-07-15 · [Cross-cutting](SPEC.md)
- [x] Marketing home: hero + two feature sections (skills visualizer, agent-loop monitor) with live mini-previews + closing CTA, added 2026-07-15 · [Marketing home](SPEC.md)
- [x] Skills catalog + detail + interactive workflow visualizer (ported, rebranded), added 2026-07-15 · [Skills, workflow visualizer](SPEC.md)
- [x] Break down any public skill: `/skills/inspect` + `/api/inspect` (fetch `SKILL.md` from GitHub, heuristic parse to a workflow graph, render + explain) + curated Anthropic-official shortcuts, added 2026-07-15 · [Skills, break down any public skill](SPEC.md)
- [x] Watch: run model (`runs.ts`) + path-to-victory visualization + attempt feed + auto-playing demo run, added 2026-07-15 · [Watch](SPEC.md)
- [x] Remove `/skills` from Nekko Dojo (nav, routes, data, api, components) and update its SPEC, added 2026-07-15
- [x] Add Vaizer to the Nekko Dojo Community projects list and the Nekko Labs Apps page, added 2026-07-15

> Note: "Shipped" items are checked off (✅) once verified in the running app + merged. They ship together as the initial Vaizer cut.
