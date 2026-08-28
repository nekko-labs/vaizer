---
description: nyaa — summon the council of reviewer cats over a PR or the working diff (checks the code against the PR description and the spec; pulls in external bot reviews too)
argument-hint: "[PR number] [--cats a,b | --skip c | --pick]"
allowed-tools: Bash(gh:*), Bash(git:*), Bash(pnpm:*), Bash(npm:*), Read, Grep, Glob
---

# /cr — code review (nyaa council)

Convene **nyaa**, a council of reviewer cats, over a code change. This is
the explicit trigger for the `nyaa` skill in this plugin — follow the
skill's workflow. The five lens checklists are bundled at
`${CLAUDE_PLUGIN_ROOT}/skills/nyaa/references/` (spectral / kuro / tora / mochi
/ shiro). Spectral is the primary lens: the change is reviewed against both of
its statements of intent, the PR description (does the code deliver the goal it
claimed?) and the project's `SPEC.md`, and the spec is reviewed too.

Argument: `$ARGUMENTS` accepts a PR number (empty means the current branch or
working diff), optionally followed by a council selection.

## Choosing the council

All five cats sit by default. Convene a narrower council only when asked:

| Cat | Lens | Key |
|---|---|---|
| Spectral 👻 | PR goal, product intent & spec conformance | `spectral` |
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

## Step 3 — read the PR description (the stated goal)

The description is the author's own account of what this change is for, and the
only place the *value* of a change is written down. Read it before the diff.

```bash
gh pr view {PR} --json title,url,body -q '.title, .url, .body'
```

Pull out the **goal** (one sentence: what this should accomplish), the **product
context and value** (who it is for, what improves for them), and the **claims**
(everything the description says it does, each of which the diff must contain).
Carry the goal into the verdict header and answer it: met / partially met / not met.

**No description** (empty body, unfilled template, "fix", a bare issue link) is a
finding: **blocking** when the diff changes behavior, a feature, a route, an
interface, or a data shape, informational for refactor / build / test-only work.
Ask for one and draft it from the diff as a copy-pasteable block (what changed,
why and for whom, what to look at, how to verify), offered in the verdict rather
than posted to the PR. **Never grade the diff against a description you wrote**,
it came from the code and so cannot fail; the goal line stays `no description
given`. With no PR at all, take the goal from the branch name and
`git log origin/main..`, say so in the header, and treat what commits omit as
unknown rather than met.

## Step 4 — load the spec (do this before reading the diff)

The spec is the yardstick, so read it first, unprimed by the implementation.

```bash
git ls-files 'SPEC.md' 'TASKS.md' 'PRD.md' 'docs/spec*' 'ARCHITECTURE.md'
# `gh pr diff` takes no pathspec, so the spec's patch comes from the API:
gh api "repos/{owner}/{repo}/pulls/{PR}/files" --paginate \
  --jq '.[] | select(.filename | test("^(SPEC|TASKS)\\.md$")) | "\(.filename)\n\(.patch)"'
# Working diff instead: git does take pathspecs.
git diff origin/main... -- SPEC.md TASKS.md
```

If none of those exist, fall back to the repo's agent guide (`AGENTS.md`,
`CLAUDE.md`) and `CONTRIBUTING.md` for stated conventions, then `README.md`.

Note which state applies (spec+code changed / code only / spec only) and carry it
into the verdict header. If the repo has no spec of any kind, say so and skip to
the council: do not infer intent from the diff and then grade the diff against
it. Full detail in the bundled `references/spectral.md`.

Then compare the **product change the description announces** against the
features the spec still describes. A conflict (description says the product now
does X, spec still says Y) is almost always a spec nobody updated rather than a
rogue implementation, so report it against the spec, `[SPEC.md § Feature] still
says Y; this change makes it X`, with the sentence it should now carry. It is
blocking either way. The exception is a conflict with a stated non-goal, success
criterion, or scope boundary: quote the line and ask the author whether the
boundary moved or the change did. If description and spec disagree and the code
matches neither, say that instead of picking a winner.

## Step 5 — convene the council over the diff

Get the diff (`gh pr diff {PR}` or `git diff`). Review it through the
**independent lenses of the cats you convened** (all five unless narrowed). Read the bundled `references/*.md` for the full checklists:

- **Spectral 👻 — PR goal, product intent & spec conformance** *(blocking for drift)*:
  three checks. **Goal**: trace the description's claimed effect through the diff
  to where a user reaches it. A goal not met, or a claim the diff does not
  contain, is blocking; substantial work the description never mentions is
  unexplained scope; a description with no "why" is informational, ask for the
  value. **Code vs spec**: does it do what the spec
  says, at the stated scope, in the spec's vocabulary, no scope creep, nothing
  marked shipped while half-built? Where the change contradicts a feature the
  spec still describes, treat it as a stale spec (Step 4), not a rogue diff.
  Spec vs code: a change to a feature, behavior,
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

## Step 6 — consolidated verdict

Merge external findings + council findings. De-dupe. Output:

```
🐈‍⬛ nyaa — N issues (X blocking, Y informational)
Council: <all five / spectral, kuro (3 sat out)>
External bots: <Codex verdict / skipped / none>
Goal: "<the stated goal, one line>" → met / partially met / not met
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

Suggested PR description
<copy-pasteable draft, only when the PR has none>
```

Tag each finding with the cat that raised it. Be terse — one line problem, one
line fix. Cite `file:line`. Only flag real problems; if a lens is clean, omit it.
The `Goal:` and `Spec:` lines are present whenever Spectral sat; omit `Spec gaps`
when the spec is complete for what the diff touches. `Goal:` reads `no
description given` for an empty PR body and `from commits: "..."` when there is
no PR, and the `Suggested PR description` block appears only in the first case.
If nothing: `🐈‍⬛ nyaa — no issues found. nyaa~`
