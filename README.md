# Vaizer

**See how your agents work and what they're focused on.** A [Nekko Labs](https://nekkolabs.com) product, served at [vaizer.app](https://vaizer.app).

Agents run skills, branch on decisions, and grind through long loops, mostly out of sight. Vaizer turns that black box into something you can read and watch.

## What it does

- **Skills, workflow visualizer.** Browse a catalog of skills and see exactly how each one runs as an n8n / Make-style node graph (trigger to output, with branches and loops). Click any step for a plain-English explanation. Install from the [marketplace](https://github.com/nekko-labs/nekko-dojo-skills), grab a `.zip`, or upvote what you like.
- **Skills, break down any public skill.** Paste a GitHub URL (or pick one of Anthropic's official skills) and Vaizer fetches its `SKILL.md`, parses it, and draws the same workflow, even for skills that aren't in the catalog.
- **Watch, agent-loop monitor.** Watch a long-running loop as a journey toward victory: milestones on a path, a marker that advances, and a feed of what the agent just tried and learned. Ships with a demo run; built to accept real run data later.

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

## License

MIT © Nekko Labs
