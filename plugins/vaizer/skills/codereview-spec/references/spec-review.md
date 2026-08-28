# Spec review, the deep version

The short checklist is in `SKILL.md`. This file is for the judgement calls: what
counts as blocking, which findings are worth writing down, and the cases that
look like drift but are not.

## What makes a finding blocking

Blocking means "a reader of the spec would be misled about what this software
does". Concretely:

- The code contradicts a spec statement. Not "goes beyond", contradicts.
- A feature, user-visible behavior, route, public interface, or persisted data
  shape changed and the spec still describes the old one.
- A task is checked off, or a feature is marked shipped, for work the diff does
  not finish.
- The spec claims a capability the code does not have.

Informational:

- Pure refactor, build config, dependency bump, test-only change with no spec
  update. Say the spec was not touched and move on.
- Scope creep that is plausibly in the spirit of the spec but unstated.
- Vocabulary drift on internal names that never reach a user or an API.
- Any gap in the spec itself. These matter, but they describe a document that was
  already incomplete before this change, so they should not block this change.

The asymmetry is deliberate: a diff should be blocked for making the spec wrong,
not for arriving at a repo whose spec was already thin.

## Drift that is not drift

Do not report these:

- **An implementation detail the spec never claimed.** A spec that says "users
  can reset their password" does not owe you the token expiry. Ask whether a
  reader would be misled, not whether the spec is exhaustive.
- **A rename with a spec update in the same diff.** Read both sides before
  calling vocabulary drift.
- **A feature spec living somewhere else.** Check `features/<name>/prompt.md` and
  linked design docs before declaring something unrecorded.
- **Work explicitly staged.** "Backlog", "planned", "phase 2" in the spec means
  the code being absent is correct, not a contradiction.
- **The spec being terse.** Terse is a style, not a gap. A gap is a question a
  reader or implementer cannot answer from the document.

## Judging the three states

**Spec changed and code changed.** The trap is a spec edit written from the
diff's commit message rather than from the code. Read the spec edit, then read
the code, and ask whether someone holding only the spec edit would predict this
code. Watch for the spec generalising ("supports multiple providers") what the
code special-cases (one provider, hardcoded).

**Code changed, spec not.** Establish the blast radius before calling it. Get the
list of changed files and ask which ones a user or an API consumer could notice:

```bash
gh pr diff {PR} --name-only     # or: git diff --name-only origin/main...
```

If everything is tests, CI, lockfiles, or internal refactor, this is
informational. One user-visible change makes it blocking.

**Spec changed, code not.** Usually fine and often correct (planning ahead). The
finding is only when the new text reads as present tense shipped fact while
nothing implements it. Check the task checklist too: a task moved to Shipped with
no implementing code is the sharpest version of this.

## Reviewing the spec itself

Work through the document asking what an implementer would have to invent.

**Feature set.** Walk the app's actual surface (routes, commands, entry points,
menu items) and check each one appears. The common failure is not a wrong entry,
it is a feature that shipped six months ago and was never written down.

**Tests.** Look for a stated expectation, not just existing tests: what must be
covered, at what level, what "done" means. Without it, "no test for this" is an
opinion rather than a violation.

**Folder structure.** A new kind of file should have a documented home. When a
diff invents a directory, that is the moment the plan should have said where
things go.

**Conventions.** Naming, error handling, typing strictness, logging,
accessibility, security posture, writing rules, design tokens. The test: did you
have to guess at any convention while reading the diff? Every guess is a gap.

**Data model and interfaces.** Anything persisted, exposed over a network, or
versioned. These are the expensive things to change later, so they are the
things worth writing down.

**Non-goals.** A spec with no boundaries cannot be used to reject anything, which
means scope creep is undetectable by construction. Their absence is a finding on
its own.

**Placeholders and contradictions.** `TBD`, `TODO`, empty headings, requirements
too vague to test. Then check sections against each other: architecture that does
not match the feature list, two statements that cannot both hold.

**Staleness.** Text describing behavior an earlier merge already changed. Sample
a few concrete claims and verify them against the code. One stale paragraph
costs more trust than ten missing ones, because a reader cannot tell which parts
to believe.

## Writing the findings

- Quote the spec. A drift finding without the spec line is an assertion.
- Cite `file:line` for code and `SPEC.md § section` for the document.
- The fix for a spec gap is the sentence to add, not "document this".
- One line of problem, one line of fix. If it needs a paragraph, the finding is
  really two findings.
- Rank by whether a reader would be misled, not by how much code is involved.
- Report the count honestly, including zero. "No findings" is a real result and
  more useful than a padded list.
