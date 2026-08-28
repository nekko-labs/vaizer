---
name: nyaa
description: Convene a council of five independent reviewer cats over a code change and merge their findings into one verdict. The primary lens checks the diff against the project's spec (SPEC.md / TASKS.md) for product-intent drift, features shipped without a spec entry, and gaps in the spec itself (missing feature definitions, test expectations, folder structure, conventions); the others cover security, dependencies / supply chain, correctness / concurrency, and style / lint. Use when the user wants to review a pull request or the working diff, asks for a code review, wants a second opinion before merging/shipping, or wants spec-conformance / security / dependency / supply-chain / concurrency / correctness / style review of a diff. Also pulls in external bot reviews (Codex, Dependabot) for the PR. Trigger on "review this PR", "review my diff", "code review", "does this match the spec", "look over this change before I ship".
license: MIT
allowed-tools: Bash(gh:*) Bash(git:*) Bash(pnpm:*) Bash(npm:*) Bash(yarn:*) Bash(cargo:*) Bash(ruff:*) Read Grep Glob
metadata:
  author: Nekko Labs
  version: 1.1.0
  category: engineering
  tags: code-review, pull-request, spec, spec-conformance, security, dependencies, supply-chain, concurrency, lint
---

# nyaa 🐈‍⬛

Convene **nyaa**, a council of reviewer cats, over a code change. Instead
of one monolithic reviewer, five cats each review through a single sharp lens,
then their findings merge into one verdict. It complements — not replaces — the
external bots (Codex, Dependabot).

The lens that carries the most weight is **spec conformance**: the project's
`SPEC.md` says what is being built and why, so the first question about any diff
is whether it matches that, whether the spec was updated to record it, and
whether the spec even defines the things it should. The other four cats judge the
code on its own terms.

The full checklist for each lens lives in `references/` next to this file
(`spectral.md`, `kuro.md`, `tora.md`, `mochi.md`, `shiro.md`). Read them for the
deep version; the summaries below are enough for a quick pass.

## Step 1 — resolve the target

- If the user gave a PR number → that PR.
- Else → the PR for the current branch (`gh pr view --json number,headRefName,url`).
  If there's no PR, review the working diff vs the base branch
  (`git diff origin/main...` or `git diff` for uncommitted work).
- Determine `owner/repo` from `gh repo view --json nameWithOwner -q .nameWithOwner`.

## Step 2 — pull external bot reviews (do this first; cite them)

Codex does **not** post as a GitHub review — it posts as a `github-actions[bot]`
**issue comment** titled "Codex Review". Fetch all comment surfaces:

```bash
# Codex (and other bot) findings — issue comments
gh api repos/{owner}/{repo}/issues/{PR}/comments \
  --jq '.[] | select(.body | test("Codex Review")) | "[\(.user.login)] \(.created_at)\n\(.body)\n"'

# Inline review comments (line-level), if any
gh api repos/{owner}/{repo}/pulls/{PR}/comments \
  --jq '.[] | "[\(.user.login)] \(.path):\(.line // .original_line)\n\(.body)\n"'

# Review summaries / verdicts
gh api repos/{owner}/{repo}/pulls/{PR}/reviews \
  --jq '.[] | select(.body != "") | "[\(.user.login)] \(.state): \(.body)"'
```

Note if Codex **skipped** the PR (e.g. "diff size exceeds the 200KB cap") — that
means there is NO external review and the council is the only safety net. Say so.

## Step 3 — load the spec (do this before reading the diff)

The spec is the yardstick, so read it first, unprimed by the implementation.

```bash
git ls-files 'SPEC.md' 'TASKS.md' 'PRD.md' 'docs/spec*' 'ARCHITECTURE.md'
gh pr diff {PR} -- SPEC.md TASKS.md    # or: git diff origin/main... -- SPEC.md TASKS.md
```

If none of those exist, fall back to the repo's agent guide (`AGENTS.md`,
`CLAUDE.md`) and `CONTRIBUTING.md` for stated conventions, then `README.md`.

Note which of the three states applies (spec+code changed / code only / spec
only), and carry the answer into the verdict header. If the repo has no spec of
any kind, say so and skip to the council: do not infer intent from the diff and
then grade the diff against it. Full detail in `references/spectral.md`.

## Step 4 — convene the council over the diff

Get the diff (`gh pr diff {PR}` or `git diff`). Review it through **five
independent lenses**. Read `references/*.md` for the full checklists; the short
form:

- **Spectral 👻 — spec conformance & product intent** *(blocking for drift)*: read the
  spec (Step 3), then check the diff **both ways**. Code vs spec: does the
  implementation do what the spec says, at the stated scope, using the spec's own
  vocabulary, without scope creep or a feature marked shipped while half-built?
  Spec vs code: a change to a feature, behavior, route, interface, or data shape
  with **no matching spec update is blocking** (refactor / build / test-only
  changes are informational), and a shipped feature needs its task moved to
  Shipped. Then review the **spec itself**: missing feature definitions, no test
  expectation for the code being added, no documented folder structure or home
  for a new file, conventions and best practices the reviewer had to guess at,
  undocumented data model or interfaces, no non-goals, or spec text an earlier
  merge already made stale. **Gaps in the spec are findings, not excuses**:
  report them against `[SPEC.md]` with the sentence to add.
- **Kuro 🖤 — security & data safety** *(blocking)*: string-interpolated SQL,
  XSS (`html_safe`/`raw`), secrets in code, missing authz/IDOR, LLM output
  written to DB / mailers without validation.
- **Tora 🐅 — dependencies & supply chain** *(blocking)*: **run `pnpm audit --prod`
  (or `npm audit`) and review the resulting vuln state, not just the diff text** —
  on a deps PR this is the whole game. Fix transitive vulns whose patch is outside
  the dependency's range with bounded (within-major) `pnpm.overrides`; flag
  major-bump-only patches rather than forcing them. Also: dep bumps that raise the
  runtime floor (cross-check resolved `engines.node` vs the deploy target, not CI),
  latest-vs-stable picks, lockfile out of sync (`--frozen-lockfile`), hand-merged
  lockfiles, suspicious new transitive deps / postinstall scripts.
- **Mochi 🍡 — correctness & concurrency** *(blocking for true bugs)*: races
  (check-then-set without a unique constraint, non-atomic status transitions),
  N+1 queries, conditional side effects (a branch that forgets a side effect),
  off-by-one, inverted conditions, unhandled nil/empty.
- **Shiro 🤍 — style & consistency** *(mostly informational; lint is blocking)*:
  **run the project's linter** (`pnpm lint` / eslint / biome / ruff / clippy — or
  whatever CI runs) and report the command + exit code. Lint failures in files the
  **PR changed** are blocking; failures only in **untouched** files are
  pre-existing → informational, recommend a *separate* lint PR (never bundle
  unrelated formatting into a feature/security PR). Also: dead code, stale
  comments/docs, magic numbers, PR-title vs CHANGELOG/VERSION drift, test gaps.

## Step 5 — consolidated verdict

Merge external findings + council findings. De-dupe. Output:

```
🐈‍⬛ nyaa — N issues (X blocking, Y informational)
External bots: <Codex verdict / skipped / none>
Spec: <updated in this change / not updated (drift) / no spec file found>

BLOCKING
- [file:line] (cat) problem
  Fix: one-line remedy

Informational
- [file:line] (cat) problem
  Fix: one-line remedy

Spec gaps
- [SPEC.md § section] what the spec should define and doesn't
  Fix: the sentence to add
```

Tag each finding with the cat that raised it. Be terse — one line problem, one
line fix. Cite `file:line`. Only flag real problems; if a lens is clean, omit it.
The `Spec:` line is always present, even when clean; omit the `Spec gaps` section
when the spec is complete for what the diff touches.
If nothing: `🐈‍⬛ nyaa — no issues found. nyaa~`
