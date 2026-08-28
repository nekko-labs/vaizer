# Spec review, the deep version

The short checklist is in `SKILL.md`. This file is for the judgement calls: what
counts as blocking, which findings are worth writing down, and the cases that
look like drift but are not.

## The two yardsticks

A change is measured against two written promises, and they answer different
questions. The **PR description** says what *this change* is for and what
improves because of it. The **spec** says what *the product* is. Neither
substitutes for the other: a diff can match the spec perfectly and still not do
the thing its author said it would, and a diff can deliver its stated goal
perfectly while making the spec wrong.

Missing yardsticks are findings, not exemptions. No description means nobody can
say whether the change did its job; no spec means the change cannot be placed
against the product at all. In both cases, ask for the missing document, and
never manufacture it from the code and then grade the code against it. A check
that cannot fail is worse than no check.

## What makes a finding blocking

Blocking means "a reader of the spec, or of the PR, would be misled about what
this software does". Concretely:

- The code does not accomplish the goal the PR description stated.
- The description claims something the diff does not contain.
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
- A description that states what changed but not why it matters. Ask for the
  value; do not hold the change hostage over it.
- The goal reached by a different route than the description implies, with the
  outcome the same. Ask for the description to describe what shipped.

The asymmetry is deliberate: a diff should be blocked for making the spec wrong,
not for arriving at a repo whose spec was already thin.

## Judging "does the code deliver the goal?"

The failure mode here is reading the diff and the description in the same breath,
finding the same words in both, and calling it met. The description says "fix the
double-charge on retry"; the diff adds a guard, uses the word retry, and looks
right. Whether it is met depends on whether that guard sits on the path that
double-charged.

So trace, do not pattern-match:

- Follow the claimed effect from the changed lines to a place a user reaches it.
  A flag added but never read, a helper added but never called, a fix on a branch
  the failing case never takes: all of these are not met, and all of them read as
  met from the diff summary alone.
- Judge the **value**, not just the mechanism. "Stop the timeouts" is not
  delivered by a retry when the calls were failing on permissions. Ask what the
  described symptom actually was and whether this change can move it.
- Count the claims. A description promising three things and a diff doing two is
  partially met, and which one was dropped belongs in the finding.
- Partial is a real verdict. Use `partially met` rather than rounding to either
  end, and say which half is missing.

Do not turn this into a design review. "The goal is met, but I would have done it
differently" is another cat's finding, or nobody's.

## When the change conflicts with the spec

This is the most common real finding, and the most commonly misfiled one. The
description announces that the product now does X; the spec still says it does Y.
The instinct is to write it up as the code violating the spec. Usually it is not:
the change was deliberate, it was described, it was reviewed, and the only thing
that failed is that nobody updated the document.

So file it against the document:

```
[SPEC.md § Feature] still says Y; this change makes it X.
Fix: <the sentence the section should now carry>
```

- **Blocking.** A spec that describes the old behavior is worse than a spec with
  a hole in it: the hole is visible, the wrong sentence is not, and every future
  reader and every future agent inherits it.
- **The exception**, and it is the one worth slowing down for: a conflict with a
  stated **non-goal**, **success criterion**, or **scope boundary**. Those lines
  are decisions, not descriptions, and they do not get overwritten by whatever
  merged most recently. Quote the line, say which side the change lands on, and
  ask the author whether the boundary moved or the change did.
- **Three stories, no truth.** If the description and the spec disagree *and* the
  code matches neither, say exactly that. Do not pick a winner: only the author
  knows which one was the intent, and guessing here produces a confident,
  well-formatted wrong answer.

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

- Quote the spec. A drift finding without the spec line is an assertion. Quote
  the description the same way when the finding is an unmet goal.
- Cite `file:line` for code and `SPEC.md § section` for the document.
- The fix for a spec gap is the sentence to add, not "document this".
- One line of problem, one line of fix. If it needs a paragraph, the finding is
  really two findings.
- Rank by whether a reader would be misled, not by how much code is involved.
- Report the count honestly, including zero. "No findings" is a real result and
  more useful than a padded list.
