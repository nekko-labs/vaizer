---
description: nyaa — summon the council of reviewer cats over a PR or the working diff (pulls in external bot reviews too)
argument-hint: "[PR number | empty for current branch / working diff]"
allowed-tools: Bash(gh:*), Bash(git:*), Bash(pnpm:*), Bash(npm:*), Read, Grep, Glob
---

# /cr — code review (nyaa council)

Convene **nyaa**, a council of reviewer cats, over a code change. This is
the explicit trigger for the `nyaa` skill in this plugin — follow the
skill's workflow. The four lens checklists are bundled at
`${CLAUDE_PLUGIN_ROOT}/skills/nyaa/references/` (kuro / tora / mochi / shiro).

Argument: `$ARGUMENTS` — a PR number, or empty.

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

## Step 3 — convene the council over the diff

Get the diff (`gh pr diff {PR}` or `git diff`). Review it through **four
independent lenses**. Read the bundled `references/*.md` for the full checklists:

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

## Step 4 — consolidated verdict

Merge external findings + council findings. De-dupe. Output:

```
🐈‍⬛ nyaa — N issues (X blocking, Y informational)
External bots: <Codex verdict / skipped / none>

BLOCKING
- [file:line] (cat) problem
  Fix: one-line remedy

Informational
- [file:line] (cat) problem
  Fix: one-line remedy
```

Tag each finding with the cat that raised it. Be terse — one line problem, one
line fix. Cite `file:line`. Only flag real problems; if a lens is clean, omit it.
If nothing: `🐈‍⬛ nyaa — no issues found. nyaa~`
