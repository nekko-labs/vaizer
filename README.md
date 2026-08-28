# Vaizer

**See how your agents work and what they're focused on.** A [Nekko Labs](https://nekkolabs.com) product, served at [vaizer.app](https://vaizer.app).

Agents run skills, branch on decisions, and grind through long loops, mostly out of sight. Vaizer turns that black box into something you can read and watch.

## What it does

- **Skills, workflow visualizer.** Browse a catalog of skills and see exactly how each one runs as an n8n / Make-style node graph (trigger to output, with branches and loops). Click any step for a plain-English explanation. Install from the [marketplace](#skills-marketplace) below, grab a `.zip`, or upvote what you like.
- **Skills, break down any public skill.** Paste a GitHub URL (or pick one of Anthropic's official skills) and Vaizer fetches its `SKILL.md`, parses it, and draws the same workflow, even for skills that aren't in the catalog.
- **Watch, agent-loop monitor.** Watch a long-running loop as a journey toward victory: milestones on a path, a marker that advances, and a feed of what the agent just tried and learned. Ships with a demo run; built to accept real run data later.

## Skills marketplace

This repo is also a **Claude Code plugin marketplace**, so the Nekko-official
skills in the catalog install straight into your agent and get updates pulled in
automatically.

```bash
# Add the marketplace once
/plugin marketplace add nekko-labs/vaizer

# Install a skill
/plugin install vaizer@vaizer

# Later, pull updates
/plugin marketplace update vaizer
```

| Skill | Tier | Category | Description |
|---|---|---|---|
| [domain-finder](plugins/domain-finder) | Nekko official | research | Brainstorm startup/project names, check domain availability across TLDs via RDAP, and vet brand/trademark conflicts. |
| [nyaa](plugins/nyaa) | Nekko official | engineering | Convene a council of four reviewer cats (security, deps/supply-chain, correctness/concurrency, style) over a PR or working diff, pulling in external bot reviews too. |
| [resume-checker](plugins/resume-checker) | Nekko official | career | Check a resume against automated candidate-screening (ATS) signals and AI-centric job expectations, score it against specific jobs, then interactively apply fixes and show what changed. |

Trust tiers, as shown on the site:

| Tier | What it is | How to treat it |
|---|---|---|
| 🟣 **Nekko official** | Built and reviewed by Nekko Labs | Safe to install and run when connected |
| 🟢 **Community** | Submitted by anyone via pull request; passes automated checks + human review | **Browse and choose deliberately. Audit before use**, since skills run with your machine's privileges |
| 🔗 **Curated (external)** | Great skills from Anthropic and the wider community | Linked with attribution on the site; install from their original source |

> ⚠️ **Skills execute code with your own permissions.** The automated checks here
> prove a skill is *well-formed and statically clean*, they **cannot** prove it is
> *safe*. Treat installing a skill like installing software. See
> [SECURITY.md](SECURITY.md).

Marketplace layout:

```
.claude-plugin/marketplace.json   # the installable-plugin manifest
catalog.json                      # machine-readable index of the same skills
plugins/<name>/                   # one plugin per skill
  .claude-plugin/plugin.json
  skills/<name>/SKILL.md          # the skill (agentskills.io standard)
schema/                           # JSON Schema for SKILL.md frontmatter
tools/                            # static validators (used by CI; safe to run locally)
.github/workflows/                # untrusted-PR-safe validation + commenting
```

Anyone can submit a community skill via pull request. Read
**[CONTRIBUTING.md](CONTRIBUTING.md)** first; it covers the required SKILL.md
shape, the rules CI enforces, and the security expectations. Run the same checks
CI runs, locally:

```bash
node tools/validate-skill.mjs --all
node tools/lint-skill-security.mjs --all
```

## Stack

Next.js 15 (App Router, React 19) · TypeScript · Tailwind CSS v4 · `motion` · Supabase (optional, for upvotes/feedback) · PostHog + Vercel Analytics (optional). Hosted on Vercel.

See [SPEC.md](SPEC.md) for the what/why and [TASKS.md](TASKS.md) for the plan + task list.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

The site builds and runs with **no env file**: Supabase, PostHog, and Discord all have safe fallbacks or inert modes. To light up the optional pieces, copy `.env.example` to `.env.local` and fill in what you need.

## Provenance

Vaizer began as the Skills feature inside [Nekko Dojo](https://github.com/nekko-labs/nekko-dojo) and was spun out into its own product. The skills subsystem (catalog, visualizer, install/download/upvote/feedback) moved here wholesale and was expanded with public-skill breakdown and the Watch monitor.

The plugin marketplace itself lived in a separate repo (`nekko-labs/nekko-dojo-skills`) until 2026-08-02, when it folded into this one so the catalog and the skills it lists ship together. Install commands changed from `@nekko-dojo-skills` to `@vaizer` at that point.

## License

MIT © Nekko Labs
