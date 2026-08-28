---
description: Review a change against the project's spec, or review a spec document itself. Takes a PR link, a PR number, a branch, nothing (your working diff), or a path to a spec file.
argument-hint: "[PR link | PR number | branch | path/to/SPEC.md | empty for working diff]"
allowed-tools: Bash(gh:*), Bash(git:*), Read, Grep, Glob
---

# /spec: spec conformance review

The short trigger for the `codereview-spec` skill in this plugin. Follow that
skill's workflow; the deep checklist is bundled at
`${CLAUDE_PLUGIN_ROOT}/skills/codereview-spec/references/spec-review.md`.

Argument: `$ARGUMENTS`.

## Resolve the target first

`$ARGUMENTS` decides both the mode and which repository's spec you may read:

| `$ARGUMENTS` | Target | Mode |
|---|---|---|
| `https://github.com/{owner}/{repo}/pull/{n}` | That PR. Pass `--repo {owner}/{repo}` to every `gh` call. | diff |
| `123` or `#123` | That PR in the current repo | diff |
| empty | The PR for the current branch, else the working diff vs the base branch | diff |
| a branch name | `git diff origin/{base}...{branch}` | diff |
| a path to `SPEC.md`, `TASKS.md`, a PRD, or `features/<name>/prompt.md` | That document | spec |

```bash
gh pr view "$ARGUMENTS" --json number,headRefOid,headRepository,baseRefName,url
gh pr diff "$ARGUMENTS"
```

**If the PR link points at a different repo than your working directory**, read
that PR's spec, not the one in your checkout. Grading another project's change
against your local `SPEC.md` produces confident nonsense.

```bash
gh api "repos/{owner}/{repo}/contents/SPEC.md?ref={head_sha}" --jq '.content' | base64 -d
# `gh pr diff` takes no pathspec; ask the API for the spec's patch instead.
gh api "repos/{owner}/{repo}/pulls/{n}/files" --paginate \
  --jq '.[] | select(.filename | test("^(SPEC|TASKS)\\.md$")) | "\(.filename)\n\(.patch)"' 
```

If that repo has no readable spec, say so and stop rather than substituting a
local one.

State the resolved target and mode in one line, then run the skill's steps.

## Verdict

```
👻 codereview-spec · <diff|spec> mode · N findings (X blocking, Y informational)
Target: <owner/repo#123 | branch | working diff | path/to/SPEC.md>
Spec: <updated in this change / not updated (drift) / no spec file found>

BLOCKING
- [file:line] problem, with the spec line it contradicts
  Fix: one-line remedy

Informational
- [file:line] problem
  Fix: one-line remedy

Spec gaps
- [SPEC.md § section] what the spec should define and does not
  Fix: the sentence to add
```

One line per problem, one per fix. Quote the spec whenever the finding is drift.
Omit any section with no findings. If everything is clean:
`👻 codereview-spec · no findings.`
