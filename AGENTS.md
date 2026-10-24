# Agent workflow

Conventions for any AI agent or human opening PRs in this repo.

## UI changes need visual evidence

Any PR that changes what the app looks like ships the proof in its description:

- **Before/after screenshots** for every visual change, in a two-column table labeled
  `Before` / `After`, captured at the same route, viewport, theme, and data. Take the
  "before" shot from the base branch before applying the change, not from memory.
- **A short screen recording** (a few seconds, mp4 or gif) whenever the change touches
  animation, transition, gesture, scroll, or timing. A still frame cannot show motion,
  so screenshots alone do not cover those changes.
- Cover every surface the change actually affects: mobile and desktop widths on web,
  iOS and Android for native, light and dark theme if both shift.
- Media is shown in the PR description, but a local path such as
  `![After](/abs/path/after.png)` renders broken: `gh` cannot upload images (GitHub's
  attachment upload has no API), and PR bodies do not resolve relative paths. Commit the
  files on the PR branch (under `screenshots/`) and link each by raw URL pinned to the commit SHA:
  `https://raw.githubusercontent.com/nekko-labs/vaizer/<sha>/<path>`, sized with
  `<img src="..." width="300">` inside the table. Pin the SHA, not the branch name: a
  branch name with a slash makes the raw path ambiguous, and a SHA keeps pointing at the
  same file after the branch moves. A gif renders the same way; an mp4 shows only as a
  link. Open the PR logged out to confirm every image loads.
- If a change has no visual delta (refactor, types, tests, docs, build config), write
  "no visual change" rather than silently omitting the screenshots. A new screen has no
  "before": say so instead of skipping the table.

## Finish the branch before opening the PR

PRs here can be merged within minutes of opening, so "open it, then refine it" does not
work: a commit pushed after `gh pr create` can miss the merge and stay stranded on the
branch.

- Push every commit (screenshots included) before `gh pr create`.
- Right before opening, `git fetch` and re-check `origin/main`; if it moved, merge or rebase
  first so the PR does not open already conflicting (`TASKS.md` is the usual collision).
- After it merges, confirm what landed with `gh pr view <n> --json commits,mergeCommit`
  rather than assuming the branch tip is what reached `main`.
