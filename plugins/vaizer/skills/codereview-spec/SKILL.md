---
name: codereview-spec
description: Review a change against its stated intent, and review the spec itself. Two modes, auto-detected. Diff mode reads both statements of intent, the PR description (the goal and the value it claims) and SPEC.md, then checks that the code delivers the stated goal, that it matches the spec, and that the spec was updated to record it. A change conflicting with a feature the spec still describes is reported as a stale spec; a PR with no description gets one drafted. Spec mode audits a SPEC.md / TASKS.md / PRD on its own for missing feature definitions, absent test expectations, undocumented structure and conventions, undefined data model, missing non-goals, contradictions, placeholders, and stale text. Use when the user asks whether a change matches the spec or does what its PR says, wants spec-drift or product-intent review, or asks to audit a spec. Trigger on "does this match the spec", "does this PR do what it says", "did we update the spec", "spec drift", "review my spec", "what is missing from the spec".
license: MIT
allowed-tools: Bash(gh:*) Bash(git:*) Read Grep Glob
metadata:
  author: Nekko Labs
  version: 1.2.0
  category: engineering
  tags: code-review, spec, spec-conformance, product-intent, pr-description, drift, documentation, pull-request
---

# codereview-spec 👻

What a change was *supposed* to do is written down in two places: the PR
description says what this change is for and what improves because of it, the
spec says what the product is. This skill is the only reviewer that cares about
those promises: it never argues with the implementation on its own terms
(correctness, security, and style reviewers do that). It asks whether this is
the thing that was said would be built, and when nothing says what that was, it
says so rather than passing quietly.

The deep checklist lives in `references/spec-review.md` next to this file.

## Step 1: resolve the target

Whatever the user pointed at, resolve it first. It decides both the mode and,
more importantly, **which repository's spec you are allowed to read**.

| Given | Resolve to | Mode |
|---|---|---|
| A PR link, `https://github.com/{owner}/{repo}/pull/{n}` | That PR. Parse all three parts and pass `--repo {owner}/{repo}` to every `gh` call below. | diff |
| A bare PR number, `#123` or `123` | That PR in the current repo | diff |
| Nothing at all | The PR for the current branch (`gh pr view --json number,url`); if there is none, the working diff against the base branch | diff |
| A branch name | `git diff origin/{base}...{branch}` | diff |
| A path to a spec file (`SPEC.md`, `TASKS.md`, a PRD, `features/<name>/prompt.md`) | That document | spec |

```bash
# A PR link: everything downstream needs the owner/repo, not just the number.
gh pr view "$PR_URL" --json number,headRefOid,headRepository,baseRefName,url
gh pr diff "$PR_URL"

# A bare number in the current repo.
gh repo view --json nameWithOwner -q .nameWithOwner
```

Say in one line which target and mode you resolved, then continue. Do not ask,
and do not run both modes.

### A PR link is not always this repository

When the PR belongs to a repo other than your working directory, **the spec must
come from that PR's repo**, at the PR's head commit. Grading someone else's
change against whatever `SPEC.md` happens to be in your current checkout
produces confident nonsense, and it is the easiest mistake to make here.

```bash
# Read a file from the PR's head, without cloning.
gh api "repos/{owner}/{repo}/contents/SPEC.md?ref={head_sha}" --jq '.content' | base64 -d
# What the PR itself changed in the spec. `gh pr diff` takes no pathspec, so
# ask the API for the per-file patch:
gh api "repos/{owner}/{repo}/pulls/{n}/files" --paginate \
  --jq '.[] | select(.filename | test("^(SPEC|TASKS)\\.md$")) | "\(.filename)\n\(.patch)"' 
```

If the PR's repo has no readable spec, say so and stop. Never fall back to a
local spec from a different project.

## Step 1b (diff mode): read the PR description

The description is the author's account of what this change is for, and the only
place the **value** of a change is written down. Read it before the diff.

```bash
gh pr view {n} --json title,url,body -q '.title, .url, .body'
```

Take three things from it: the **goal** (one sentence, what this should
accomplish), the **product context and value** (who it is for, what improves for
them), and the **claims** (each specific thing it says the change does).

**No description** (empty body, unfilled template, "fix", a bare issue link) is a
finding: **blocking** when the diff changes behavior, a feature, a route, an
interface, or a data shape, informational for refactor / build / test-only work.
Without a stated goal nobody can say whether the change did its job. Ask for one
and draft it from the diff as a copy-pasteable block (what changed, why and for
whom, what to look at, how to verify), offered in the verdict rather than posted
to the PR. **Never grade the diff against a description you wrote**: it came from
the code, so the code passes it by construction, the same trap as
reverse-engineering a spec. The `Goal:` line then reads `no description given`.

With no PR, take the goal from the branch name and `git log origin/{base}..`,
say so in the header, and treat what commits omit as unknown rather than as met.

## Step 2: find the spec

In the repo the target belongs to, look for these in order. Stop at the first
that exists, then also read any others that do:

1. `SPEC.md` at the repo root: the source of truth (vision, users, journeys, features).
2. `TASKS.md` / `PLAN.md`: the technical plan (stack, architecture, data model,
   conventions, folder structure, design system) plus its task checklist.
3. `docs/spec*.md`, `PRD.md`, `product-requirements.md`, `ARCHITECTURE.md`.
4. `AGENTS.md` / `CLAUDE.md` / `CONTRIBUTING.md` for stated conventions and rules.
5. A feature-level spec for the area touched (`features/<name>/prompt.md`).
6. Last resort: the feature list in `README.md`.

```bash
git ls-files 'SPEC.md' 'TASKS.md' 'PRD.md' 'docs/spec*' 'ARCHITECTURE.md' 'AGENTS.md'
```

Read the spec **before** the diff, so the implementation does not prime you.

If **no spec of any kind exists**, stop and say so. That is the finding: the
change cannot be reviewed against stated intent, and the repo should have a
`SPEC.md`. Do **not** reverse-engineer intent from the code and then grade the
code against it, that only launders the implementation into a spec.

## Step 3 (diff mode): what did the change do to the spec?

```bash
# A PR. `gh pr diff` accepts no pathspec, so the per-file patch comes from the API.
gh api "repos/{owner}/{repo}/pulls/{n}/files" --paginate \
  --jq '.[] | select(.filename | test("^(SPEC|TASKS)\\.md$")) | "\(.filename)\n\(.patch)"'

# Blast radius, for deciding whether a missing spec update is blocking:
gh api "repos/{owner}/{repo}/pulls/{n}/files" --paginate --jq '.[].filename'

git diff origin/main... -- SPEC.md TASKS.md     # a branch (git does take pathspecs)
git diff -- SPEC.md TASKS.md                    # uncommitted work
```

Three states, three verdicts:

- **Spec changed and code changed**: read both, check they describe the *same*
  thing. A spec edit that oversells the code ("supports X") and a code change
  that quietly exceeds its spec edit are both findings.
- **Code changed, spec not**: drift. **Blocking** when the diff adds, removes, or
  alters a feature, user-visible behavior, route, interface, or data shape.
  Informational for a pure refactor, build config, or test-only change.
- **Spec changed, code not**: the spec now promises something unbuilt. Check it
  reads as intent (`[planned]`, Backlog) rather than as shipped.

Also check the task checklist: a shipped feature with no entry moved to Shipped,
or a box ticked for work this diff does not actually finish.

## Step 4 (diff mode): code vs stated intent

First against the PR description. Trace the claimed effect through the diff to
where a user reaches it: the fix has to be on the path they actually hit, the
flag has to be read, the query made faster has to be the one that was slow.

- **Goal not met**, or a claim the description makes that the diff does not
  contain: **blocking**. A description is read as a promise by reviewers and by
  whoever writes the release notes.
- **Substantial work the description never mentions**: unexplained scope. Ask for
  a sentence covering it, or for it to come out.
- **A description with no "why"**: informational, ask for the value. Without it
  nobody after the merge can judge whether the change was worth its risk.
- Report `met` / `partially met` / `not met` in the verdict header.

### A conflict with the spec usually means a stale spec

When the description says the product now does X and the spec still says it does
Y, that is a conflict, and the cause is almost always a spec nobody updated
rather than an implementation that went rogue. Report it against the spec, not
the code: `[SPEC.md § Feature] still says Y; this change makes it X`, with the
sentence the section should now carry. It is **blocking** either way, because a
spec describing the old behavior is not incomplete, it is wrong. The exception is
a conflict with a stated **non-goal, success criterion, or scope boundary**:
quote the line and ask the author whether the boundary moved or the change did.
If description and spec disagree and the code matches neither, say exactly that
rather than picking a winner.

Then against the spec. For every feature the diff touches:

- **Recorded?** Is the feature in the spec at all? A whole feature landing with
  no spec entry is drift at feature scale.
- **Faithful?** Same behavior, same scope, same user journey, same edge cases as
  the spec describes. Cite the spec line and the code line side by side.
- **Complete?** Spec promises X, Y, Z; the diff builds X and Y and marks it
  shipped. Partial delivery sold as done is a finding.
- **Scope creep.** Anything built that the spec never asked for. Either the spec
  grows to cover it or it comes out.
- **Vocabulary drift.** Code naming entities, statuses, routes, or roles
  differently from the spec's terms. Two vocabularies for one concept is how a
  spec stops being readable.
- **Goals and boundaries.** Does the change work against a stated success
  criterion, non-goal, or scope boundary? Quote it.

## Step 5: review the spec itself

Runs in both modes. In diff mode it is scoped to what the diff touched; in spec
mode it is the whole document.

**Gaps in the spec are findings, not excuses.** If the spec does not define the
thing the diff needed defined, that is feedback on the spec. Check it covers:

- **Feature set**: every user-facing feature, with status (shipped / planned).
  A feature the app has and the spec omits is a gap even when the diff is fine.
- **Tests**: the expected testing approach and what must be covered. A feature
  added with no test *and* no stated test expectation is two findings, the
  missing test and the missing expectation that would have required it.
- **Folder structure**: where code of each kind belongs. A new file in a new
  place with no documented home means the plan never said where things go.
- **Conventions and best practices**: naming, error handling, typing, logging,
  accessibility, security posture, writing rules, design tokens. Anything a
  reviewer had to *guess* at belongs in the spec.
- **Data model and interfaces**: anything persisted, exposed, or versioned.
- **Non-goals and scope boundaries**: without these, scope creep is undetectable.
- **Placeholders**: `TBD`, `TODO`, empty sections, requirements too vague to
  build from or to test against.
- **Contradictions**: two sections that cannot both be true, or an architecture
  that does not match the feature descriptions.
- **Staleness**: text describing behavior an *earlier* merge already changed or
  removed. The spec is not merely incomplete there, it is wrong.

Report these against `[SPEC.md § section]` with a fix that says what sentence to
add.

## Step 6: verdict

```
👻 codereview-spec · <diff|spec> mode · N findings (X blocking, Y informational)
Target: <owner/repo#123 | branch | working diff | path/to/SPEC.md>
Goal: "<the stated goal>" → met / partially met / not met   (diff mode only)
Spec: <updated in this change / not updated (drift) / no spec file found>
Read: SPEC.md, TASKS.md

BLOCKING
- [file:line] problem, with the spec line it contradicts
  Fix: one-line remedy

Informational
- [file:line] problem
  Fix: one-line remedy

Spec gaps
- [SPEC.md § section] what the spec should define and does not
  Fix: the sentence to add

Suggested PR description
<copy-pasteable draft, only when the PR has none>
```

Be terse: one line for the problem, one for the fix. Quote the spec whenever the
finding is drift, so the reader sees both sides. Skip anything that is fine, and
never write "the spec looks good overall". The `Target:` and `Spec:` lines are
always present, and `Goal:` whenever the mode is diff (`no description given`
for an empty PR body, `from commits: "..."` when there is no PR). Omit a section
that has no findings, and the suggested description unless the PR lacked one. If everything is clean:
`👻 codereview-spec · no findings.`

## Note

This is the standalone form of the **Spectral 👻** lens from the `nyaa` review
council, which runs it alongside security, dependency, correctness, and style
cats. Use `nyaa` for a full review; use this when the spec is the only question.
The two carry the same checklist, so a change to one belongs in the other.
