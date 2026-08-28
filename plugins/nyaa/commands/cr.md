---
description: nyaa — summon the council of reviewer cats over a PR or the working diff (checks it against the spec; pulls in external bot reviews too)
argument-hint: "[PR number] [--cats a,b | --skip c | --pick]"
allowed-tools: Bash(gh:*), Bash(git:*), Bash(pnpm:*), Bash(npm:*), Read, Grep, Glob
---

# /cr — code review (nyaa council)

Convene **nyaa**, a council of reviewer cats, over a code change. This is
the explicit trigger for the `nyaa` skill in this plugin — follow the
skill's workflow. The five lens checklists are bundled at
`${CLAUDE_PLUGIN_ROOT}/skills/nyaa/references/` (spectral / kuro / tora / mochi
/ shiro). Spectral is the primary lens: the change is reviewed against the
project's `SPEC.md`, and the spec is reviewed too.

Argument: `$ARGUMENTS` accepts a PR number (empty means the current branch or
working diff), optionally followed by a council selection.

## Choosing the council

All five cats sit by default. Convene a narrower council only when asked:

| Cat | Lens | Key |
|---|---|---|
| Spectral 👻 | spec conformance & product intent | `spectral` |
| Kuro 🖤 | security & data safety | `kuro` |
| Tora 🐅 | dependencies & supply chain | `tora` |
| Mochi 🍡 | correctness & concurrency | `mochi` |
| Shiro 🤍 | style & consistency | `shiro` |

- `/cr 42 --cats spectral,kuro` convenes only those two.
- `/cr --skip tora` convenes everyone except Tora.
- `/cr --pick` asks first: show the roster as a multi-select with every cat
  checked, let the user uncheck, then convene what is left.
- Plain language works too ("only the security one", "skip deps").

An empty council is not a review: say so and stop. An unrecognised key lists the
valid keys rather than silently doing nothing. Selection changes who reviews,
never how strictly. Always name the council that sat in the verdict header.

## Step 1 — resolve the target

- If `$ARGUMENTS` is a number → that PR.
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

Note which state applies (spec+code changed / code only / spec only) and carry it
into the verdict header. If the repo has no spec of any kind, say so and skip to
the council: do not infer intent from the diff and then grade the diff against
it. Full detail in the bundled `references/spectral.md`.

## Step 4 — convene the council over the diff

Get the diff (`gh pr diff {PR}` or `git diff`). Review it through the
**independent lenses of the cats you convened** (all five unless narrowed). Read the bundled `references/*.md` for the full checklists:

- **Spectral 👻 — spec conformance & product intent** *(blocking for drift)*: check the
  diff against the spec **both ways**. Code vs spec: does it do what the spec
  says, at the stated scope, in the spec's vocabulary, no scope creep, nothing
  marked shipped while half-built? Spec vs code: a change to a feature, behavior,
  route, interface, or data shape with **no matching spec update is blocking**
  (refactor / build / test-only is informational). Then review the **spec itself**:
  missing feature definitions, no test expectation, no documented folder structure
  or home for a new file, conventions left to guesswork, undocumented data model,
  no non-goals, stale spec text. Gaps in the spec are findings too, reported
  against `[SPEC.md]` with the sentence to add.
- **Kuro 🖤 — security & data safety** *(blocking)*: string-interpolated SQL, XSS
  (`html_safe`/`raw`), secrets in code, missing authz/IDOR, LLM output written to
  DB / mailers without validation.
- **Tora 🐅 — dependencies & supply chain** *(blocking)*: **run `pnpm audit --prod`
  (or `npm audit`) and review the resulting vuln state, not just the diff text.**
  Fix transitive vulns with bounded (within-major) `pnpm.overrides`; flag
  major-bump-only patches. Also: dep bumps that raise the runtime floor
  (cross-check resolved `engines.node` vs the deploy target), latest-vs-stable
  picks, lockfile out of sync, hand-merged lockfiles, suspicious postinstall.
- **Mochi 🍡 — correctness & concurrency** *(blocking for true bugs)*: races
  (check-then-set without a unique constraint, non-atomic status transitions),
  N+1 queries, conditional side effects, off-by-one.
- **Shiro 🤍 — style & consistency** *(mostly informational; lint is blocking)*:
  **run the project's linter** and report the command + exit code. Lint failures
  in files the **PR changed** are blocking; failures only in **untouched** files
  are pre-existing → informational, recommend a *separate* lint PR. Also: dead
  code, stale comments/docs, magic numbers, PR-title vs CHANGELOG/VERSION drift.

## Step 5 — consolidated verdict

Merge external findings + council findings. De-dupe. Output:

```
🐈‍⬛ nyaa — N issues (X blocking, Y informational)
Council: <all five / spectral, kuro (3 sat out)>
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
The `Spec:` line is always present; omit `Spec gaps` when the spec is complete
for what the diff touches.
If nothing: `🐈‍⬛ nyaa — no issues found. nyaa~`
