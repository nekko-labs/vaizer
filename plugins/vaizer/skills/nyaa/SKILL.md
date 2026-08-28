---
name: nyaa
description: Convene five independent reviewer cats over a code change and merge their findings into one verdict. The primary lens reads the change's two statements of intent, the PR description (what it is for, and the value it claims) and the project's spec (SPEC.md / TASKS.md), then checks the code delivers the stated goal and that a described product change does not conflict with the spec's features, since a conflict usually means the spec was never updated. Spec gaps are reported too, and a PR with no description gets one drafted. The others cover security, dependencies, correctness, and style / lint. All five sit by default; the council is selectable (--cats / --skip / --pick). External bot reviews (Codex, Dependabot) fold in. Use when the user wants a PR or working diff reviewed, asks for a code review or a second opinion before merging, or wants spec-conformance, security, dependency, or style review. Trigger on "review this PR", "code review", "does this PR do what it says", "does this match the spec".
license: MIT
allowed-tools: Bash(gh:*) Bash(git:*) Bash(pnpm:*) Bash(npm:*) Bash(yarn:*) Bash(cargo:*) Bash(ruff:*) Read Grep Glob
metadata:
  author: Nekko Labs
  version: 1.3.0
  category: engineering
  tags: code-review, pull-request, pr-description, spec, spec-conformance, product-intent, security, dependencies, supply-chain, concurrency, lint
---

# nyaa 🐈‍⬛

Convene **nyaa**, a council of reviewer cats, over a code change. Instead
of one monolithic reviewer, five cats each review through a single sharp lens,
then their findings merge into one verdict. It complements — not replaces — the
external bots (Codex, Dependabot).

The lens that carries the most weight is **intent conformance**, and a change has
two statements of intent. The **PR description** says what this change is for and
what improves because of it. The **spec** (`SPEC.md`) says what the product is and
why. So the first questions about any diff are whether the code actually
accomplishes the goal the description claims, whether it matches the spec,
whether the spec was updated to record it, and whether the spec even defines the
things it should. The other four cats judge the code on its own terms.

A PR with no description is not a neutral starting point, it is a missing
yardstick. Without it nobody can say what the change was supposed to do, so
nobody can say whether it did. Ask the author for one, and hand them a draft.

The full checklist for each lens lives in `references/` next to this file
(`spectral.md`, `kuro.md`, `tora.md`, `mochi.md`, `shiro.md`). Read them for the
deep version; the summaries below are enough for a quick pass.

## Choosing the council

By default **all five cats sit**. Run the full council unless the user asks for
something narrower; do not prompt on every invocation.

| Cat | Lens | Key |
|---|---|---|
| Spectral 👻 | PR goal, product intent & spec conformance | `spectral` |
| Kuro 🖤 | security & data safety | `kuro` |
| Tora 🐅 | dependencies & supply chain | `tora` |
| Mochi 🍡 | correctness & concurrency | `mochi` |
| Shiro 🤍 | style & consistency | `shiro` |

Honour a selection when the user gives one, in any of these forms:

- `--cats spectral,kuro` convenes only those.
- `--skip tora` convenes everyone except those.
- `--pick` (or `--interactive`) asks first: present the roster as a multi-select
  with every cat already checked, let the user uncheck the ones they don't want,
  then convene what is left.
- Plain language: "only the security and correctness cats", "skip the dependency
  one", "just check it against the spec". The key, the cat's name, the lens name,
  and the emoji all resolve to the same cat.

Rules:

- An empty council is not a review. If every cat would be skipped, say so and
  stop rather than emitting a clean verdict.
- An unrecognised key is not a silent no-op. List the valid keys and ask.
- Selection changes **who reviews, never how strictly**. A cat that sits still
  blocks on its own blocking findings.
- **Always name the council that sat in the verdict header.** A two-cat pass must
  never be mistakable for a clean five-cat review.

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

## Step 3 — read the PR description (the stated goal)

The description is the author's own account of what this change is for, and it is
the only place the *value* of a change is ever written down. Read it before the
diff, for the same reason the spec is read first: so the implementation cannot
tell you what it was meant to do.

```bash
gh pr view {PR} --json title,url,body -q '.title, .url, .body'
```

Pull three things out of it:

- **Goal.** One sentence: what this change is supposed to accomplish.
- **Product context and value.** Who it is for and what improves for them: the
  bug they were hitting, the workflow that was blocked, the risk being closed,
  the number meant to move. This is what makes the change worth merging, and it
  is the one thing a diff can never tell you.
- **Claims.** Everything the description says the change does, each of which the
  diff has to actually contain.

Carry the goal into the verdict header, quoted in one line, and answer it there:
`met`, `partially met`, or `not met`. Deciding that is Spectral's job in Step 5.

### When there is no description

An empty body, an unfilled template, a one-word body ("fix", "wip", "updates"),
or a bare issue link with no words all count as no description. That is a
finding, not a detail:

- **Blocking** when the diff changes behavior, a feature, a route, an interface,
  or a data shape (the same bar as spec drift). The review has no yardstick, so
  "this looks fine" would mean nothing.
- **Informational** for a pure refactor, build config, dependency bump, or
  test-only change.

Either way, ask for one and make it easy: read the diff and offer a draft
description as a copy-pasteable block (what changed, why it matters and to whom,
what a reviewer should look at, how to verify it). Offer it in the verdict; do
not post it to the PR, the author decides.

**Never grade the diff against a description you wrote.** It came from the code,
so the code passes it by construction. That is the same trap as
reverse-engineering a spec: it launders the implementation into intent. When the
description is missing, the `Goal:` line reads `no description given` and stays
that way for this review.

### When there is no PR

On a working diff there is no description to read. Take the stated goal from the
branch name and commit messages (`git log origin/main..`), say in the header that
it came from commits, and recommend the description be written when the PR is
opened. Commit messages record what was done, not what it was for, so treat what
they leave out as unknown rather than as met.

## Step 4 — load the spec (do this before reading the diff)

The spec is the product yardstick, so read it next, still unprimed by the
implementation.

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

Note which of the three states applies (spec+code changed / code only / spec
only), and carry the answer into the verdict header. If the repo has no spec of
any kind, say so and skip to the council: do not infer intent from the diff and
then grade the diff against it. Full detail in `references/spectral.md`.

### When the change conflicts with the spec

Compare the **product change the description announces** against the features the
spec currently describes. If the description says the product now does X and the
spec still says it does Y, that is a conflict, and the cause is almost always a
spec that was never updated rather than an implementation that went rogue. Report
it as a sync failure, not as a code defect:

- Name the spec section that is now wrong and give the sentence it should say
  instead: `[SPEC.md § Feature] still says Y; this change makes it X`.
- It is **blocking** either way. Leaving the two in conflict means the next
  reader of the spec is misled about what the software does, which is the exact
  failure this lens exists to catch.
- The exception is a conflict with a stated **non-goal, success criterion, or
  scope boundary**. Those exist to be argued with, not quietly overwritten: quote
  the line the change crosses and ask the author whether the boundary moved or
  the change did, before it merges.
- If the description and the spec disagree and the code matches neither, that is
  three stories and no truth. Say so plainly rather than picking a winner.

## Step 5 — convene the council over the diff

Get the diff (`gh pr diff {PR}` or `git diff`). Review it through the
**independent lenses of the cats you convened** (all five unless the user
narrowed the council). Read `references/*.md` for the full checklists; the short
form:

- **Spectral 👻 — PR goal, product intent & spec conformance** *(blocking for drift)*:
  three checks, in order. **Goal (Step 3)**: does the diff actually accomplish
  what the description said, and deliver the value it claimed? Trace it: the fix
  has to reach the path users actually hit, the flag has to be read, the query
  made faster has to be the slow one. A goal not met, or a description claiming
  something the diff does not do, is blocking. A diff doing substantially more
  than the description says is unexplained scope and needs a sentence in the
  description. A description that says what changed but never why it matters or
  to whom is informational: ask for the value. No description at all is Step 3's
  finding, with a suggested draft. **Code vs spec (Step 4)**: does the
  implementation do what the spec says, at the stated scope, using the spec's own
  vocabulary, without scope creep or a feature marked shipped while half-built?
  **Spec vs code**: a change to a feature, behavior, route, interface, or data
  shape with **no matching spec update is blocking** (refactor / build / test-only
  changes are informational), and a shipped feature needs its task moved to
  Shipped. Where the described change **contradicts** a feature the spec still
  describes, treat it as a stale spec, not a rogue diff: name the section and the
  sentence it should now say (Step 4), and escalate to the author only when the
  line crossed is a stated non-goal or scope boundary. Then review the **spec itself**: missing feature definitions, no test
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
The `Council:` line is always present. The `Goal:` and `Spec:` lines are present
whenever Spectral sat; omit them and the `Spec gaps` section when Spectral sat
out, and omit `Spec gaps` alone when the spec is complete for what the diff
touches. `Goal:` reads `no description given` when the PR body is empty and
`from commits: "..."` when there is no PR; the `Suggested PR description` block
appears only in the first of those cases.
If nothing: `🐈‍⬛ nyaa — no issues found. nyaa~`
