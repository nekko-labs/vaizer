---
name: resume-checker
description: Review a resume the way automated candidate-screening (ATS) tools and modern hiring pipelines will. Use when the user wants their resume or CV checked, scored against a specific job posting, tailored for an application, or updated for AI-era role expectations. Takes a resume file plus optional job links; produces an HTML results report with concrete feedback and a success-likelihood estimate per job, then interactively applies the fixes the user picks and highlights exactly what changed.
license: MIT
allowed-tools: Read Write Edit Glob WebFetch WebSearch AskUserQuestion
metadata:
  author: Nekko Labs
  version: 1.0.0
  category: career
  tags: resume, cv, ats, job-hunt, career, screening, ai-roles
---

# Resume Checker

Evaluate a resume against what actually screens candidates today: automated
parsing and keyword systems (ATS), recruiter skim patterns, and the new
expectations showing up in AI-centric job descriptions. Then help the user fix
it, on their terms, and show them exactly what changed.

Work through the five stages in order. The user can jump in mid-flow (e.g.
"just tailor it to this job" starts at Stage 2 with the job links they gave).

---

## Stage 1: Intake

1. Get the **resume**. Accept any readable format (PDF, DOCX, Markdown, plain
   text, or pasted text). Read it fully before commenting on anything.
2. Ask for (or collect from the prompt) **job links**: zero or more postings
   the user wants to apply to. Each link gets its own match analysis in the
   report. No links is fine; the resume still gets the full general review.
3. Note any explicit target the user states (role, level, location, industry).
   Stated targets override detection in Stage 2.

If the resume file cannot be read (scanned image PDF, corrupt file), say so
plainly and ask for a text version. Do not guess at content you cannot see.

## Stage 2: Detect the role type

Infer from the resume (titles, skills, project nouns) and any job links:

- **Role family**: e.g. frontend, backend, full-stack, mobile, data
  engineering, data science, ML/AI engineering, DevOps/SRE/platform, QA,
  security, product management, design, or non-engineering.
- **Seniority band**: entry/career-changer, mid, senior, staff+/leadership.
- **AI-centricity**: is the target role AI-native (agents, LLM products,
  prompt/eval work), AI-adjacent (normal role, AI tools expected), or
  conventional?

State the detection in one short line ("Reading this as a mid-level backend
engineer targeting AI-adjacent roles") and let the user correct it before the
deep evaluation. The role type decides which criteria matter: do not judge a
data scientist's resume by frontend portfolio standards, and do not demand
LLM experience for a role that never mentions it.

## Stage 3: Evaluate

Run two evaluation lenses over the resume. The detailed checklists live in the
reference files; read both before scoring.

1. **Automated-screening (ATS) signals**: read
   [references/ats-signals.md](references/ats-signals.md) and check the resume
   against every applicable item (parseability, structure, keywords,
   quantified impact, red flags).
2. **AI-era expectations**: read
   [references/ai-role-signals.md](references/ai-role-signals.md) and apply
   the sections that match the detected AI-centricity level.

For each **job link** provided:

- Fetch the posting with WebFetch. If a posting is behind a login or the fetch
  fails, tell the user and ask them to paste the description text instead.
- Extract: hard requirements, preferred qualifications, the exact skill and
  tool nouns, and any AI-specific asks.
- Compute a keyword/requirement gap: which of the posting's terms the resume
  hits, near-misses (synonyms the ATS may not match), and outright misses.
- Estimate a **success likelihood** for passing the automated screen and the
  first human skim: one of `strong / good / fair / low`, with the two or three
  factors that most drove the rating. Frame it honestly: this is an estimate
  of screening survival from visible signals, not an offer probability, and
  say so in the report.

## Stage 4: Report (HTML)

Write the results as a single self-contained HTML file (inline CSS, no
external assets, readable in light and dark). Save it beside the resume as
`resume-report.html` (or in the working directory) and tell the user where it
is. The report contains, in order:

1. **Summary**: overall assessment in two or three sentences, the detected
   role read, and a headline score out of 100 with a one-line rationale.
2. **Per-job match cards** (when links were given): posting title/company,
   success likelihood with its driving factors, keyword hits / near-misses /
   misses, and the caveat sentence.
3. **Findings**: every failed or weak check from Stage 3, grouped by lens
   (screening mechanics / content strength / AI-era signals), each with the
   evidence line from the resume and why it matters.
4. **Suggested changes**: a numbered list (S1, S2, ...). Each suggestion has
   the exact current text (or "missing"), the proposed replacement text, and
   the check it fixes. These IDs drive Stage 5.
5. **What's already strong**: genuine strengths, so the user does not fix
   what is not broken.

## Stage 5: Interactive fix loop

1. Present the suggestion IDs and ask which to apply: **all**, a **subset**
   (by ID), or none. Use AskUserQuestion when available; otherwise a numbered
   prompt. Never apply changes unasked.
2. Apply the chosen suggestions to a **copy** of the resume (e.g.
   `resume-updated.md` or matching the input format when practical). Never
   overwrite the original.
3. Show exactly what changed:
   - A concise change list: each applied suggestion ID with before → after.
   - A visual diff: an HTML view of the updated resume with insertions
     highlighted (e.g. subtle green background) and removals noted, saved as
     `resume-changes.html`. If a browser/screenshot tool is available in the
     session, render the updated resume and produce an annotated screenshot
     overlay marking each change; otherwise the highlighted HTML is the
     deliverable.
4. Offer one more pass: re-score the updated resume against the same jobs so
   the user sees the likelihood move. Loop back to Stage 5 if they want to
   apply more of the remaining suggestions.

---

## Tone and honesty rules

- Be specific. "Quantify the migration bullet: how many services, what
  latency win?" beats "add more metrics".
- Never fabricate experience, inflate titles, or suggest keyword-stuffing that
  misrepresents the candidate. Tailoring means surfacing true things the
  screen cares about, not inventing them.
- Success likelihood is always presented as an estimate of automated-screen
  and first-skim survival, with its caveat, never as a hiring prediction.
- If the resume is strong, say so and keep the suggestion list short. Do not
  manufacture findings to look thorough.
