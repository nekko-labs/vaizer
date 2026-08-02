# Contributing a skill

Thanks for adding to the Vaizer skills marketplace! Anyone can submit a
**community** skill via pull request. Community skills are accepted only after
they pass automated checks **and** a human Nekko Labs maintainer review.

This repo is both the [vaizer.app](https://vaizer.app) site and the Claude Code
plugin marketplace it lists. A skill contribution only touches `plugins/`,
`catalog.json`, and `.claude-plugin/marketplace.json`. You never need to run or
build the site to add one. (For changes to the site itself, see
[README.md](README.md).)

## What a skill is

A skill is a directory whose entrypoint is a `SKILL.md` file (YAML frontmatter +
Markdown instructions), optionally bundling `scripts/`, `references/`, and
`assets/`. It follows the open [agentskills.io](https://agentskills.io) standard.

## 1. Add your skill as a plugin

```
plugins/<your-skill>/
├── .claude-plugin/plugin.json          # name, description, version, author, license
└── skills/<your-skill>/
    ├── SKILL.md                        # required (dir name must equal frontmatter `name`)
    ├── scripts/                        # optional: executable helpers
    └── references/                     # optional: docs loaded on demand
```

Then add an entry for it in **`.claude-plugin/marketplace.json`** and
**`catalog.json`** (keep them in sync). A maintainer adds the matching site entry
in `src/data/skills.ts`, which is what draws your skill's workflow graph on
[vaizer.app/skills](https://vaizer.app/skills); include a rough step-by-step of
what your skill does in the PR description so that graph is accurate.

## 2. SKILL.md frontmatter rules

Validated by `schema/skill-frontmatter.schema.json` and `tools/validate-skill.mjs`:

- **`name`** (required): 1-64 chars, lowercase `a-z`/`0-9` with single hyphens.
  Must **match the skill's directory name**. Must not contain `anthropic`/`claude`.
- **`description`** (required): ≤1024 chars. State **what it does AND when to use
  it**, in the **third person**. This is what the agent uses to decide when to
  trigger your skill, so make it specific and keyword-rich.
- Optional: `license`, `metadata` (conventionally `author`, `version`, `category`,
  `tags`), `allowed-tools`.
- Keep the SKILL.md body **under 500 lines**; move detail into `references/`.

## 3. Security requirements (enforced)

Skills run with the **user's own machine privileges**. To protect users, the
following are rejected by `tools/lint-skill-security.mjs`:

- Prompt-injection phrasing ("ignore previous instructions", "developer mode",
  "do not tell the user…").
- `!`-dynamic-context command execution in SKILL.md (runs before model review).
- `curl … | bash` / remote-code-execution and reverse shells.
- Reading credential/secret files (`.aws`, `.ssh`, gcloud) or exfiltrating
  tokens/env vars over the network.
- Writing to agent-memory or shell-startup files (`MEMORY.md`, `.bashrc`, …).
- Destructive deletes; over-broad `allowed-tools` such as `Bash(*)` (scope it,
  e.g. `Bash(node:*)`).

Also required:
- **No secrets** in the PR (enable and respect GitHub secret scanning / push
  protection).
- **No binaries or archives**, so skills stay auditable as text.
- Bundled scripts should be dependency-light and do only what the SKILL.md says.
- If your skill makes network calls, **say so explicitly** in SKILL.md and keep
  them minimal. Skills that fetch external content and then act on it are a known
  risk, so avoid having the agent execute fetched instructions.

> `allowed-tools` is a **grant, not a sandbox**: it widens auto-approval, it
> does not restrict what the agent can do. Keep it minimal.

## 4. Run the checks locally

```bash
node tools/validate-skill.mjs plugins/<your-skill>/skills/<your-skill>
node tools/lint-skill-security.mjs plugins/<your-skill>/skills/<your-skill>
```

Both must exit 0. CI runs the same checks on your PR under a powerless,
read-only context (no secrets, your code is never executed). A maintainer then
reviews before merge.

## 5. What happens on your PR

1. `pr-validate` runs the static validators, JSON checks, and ShellCheck.
2. `pr-comment` posts the result.
3. A Nekko Labs maintainer (CODEOWNERS) reviews and merges.
4. Your skill appears in the marketplace and on
   [vaizer.app/skills](https://vaizer.app/skills), where users
   can upvote it.

By contributing you agree your skill is licensed under MIT (or the license you
declare in the skill).
