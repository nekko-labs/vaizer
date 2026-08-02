# Security

## For users installing skills

**Agent Skills run code with your own machine's privileges**: filesystem
access, shell, and (in Claude Code) the same network access as any program you
run. Treat installing a skill like installing software.

- **Nekko official** skills are authored and reviewed by Nekko Labs.
- **Community** skills pass automated checks and a human review, but our checks
  prove a skill is *well-formed and statically clean*, they **cannot** prove it
  is *safe*. A skill's payload can be plain-English instructions that influence
  your agent at runtime, which no scanner reliably detects.
- **Audit a community skill before use**: read its `SKILL.md` and any bundled
  scripts, check what network calls and tools it uses, and prefer skills with a
  clear, minimal scope.

This mirrors Anthropic's guidance: use skills from sources you trust, and audit
anything from an unknown source before running it.

## How this repository protects users

This repo holds both the [vaizer.app](https://vaizer.app) site and the Claude
Code plugin marketplace it lists. The protections below apply to the marketplace
paths (`plugins/`, `catalog.json`, `.claude-plugin/`, `schema/`, `tools/`), which
are the only ones a contributed skill touches.

- **Untrusted PRs run powerless.** Validation runs on the `pull_request` trigger
  with a read-only token and **no secrets**, and **never executes** the
  submitted skill; only static checks read its files.
- **Privilege is separated.** The only workflow with write access
  (`pr-comment.yml`) is triggered by `workflow_run`, never checks out PR code,
  and treats PR-derived data as untrusted.
- **Actions are pinned to commit SHAs.**
- **Human review is required.** `CODEOWNERS` gates every change under the
  marketplace paths on a Nekko Labs maintainer.
- **Static security lint** flags prompt injection, dynamic-context execution,
  exfiltration patterns, persistence/memory writes, destructive commands, and
  over-broad `allowed-tools`.

### Recommended repository settings (for maintainers)

- Enable **secret scanning** and **push protection**.
- Require **pull request review from CODEOWNERS** on the marketplace paths,
  require status checks to pass,
  dismiss stale approvals on new commits, and require approval of the latest push
  by someone other than the pusher.
- Require **maintainer approval before fork workflows run** (tighten to all
  outside collaborators).
- Block force-pushes to `main`; restrict who can bypass.

## Reporting a vulnerability

Found a malicious or vulnerable skill, or an issue in this repo's tooling?
**Do not open a public issue.** Email **security@nekkolabs.com** (or use GitHub
private vulnerability reporting). We'll triage promptly and, if needed, remove
the offending skill from the marketplace and the website.
