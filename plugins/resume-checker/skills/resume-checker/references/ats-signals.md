# Automated-screening (ATS) signals

What applicant-tracking systems and automated candidate-analysis tools
actually check, plus the first-human-skim factors that follow them. Apply
every item that fits the detected role family and seniority; skip the ones
that clearly do not apply.

## 1. Parseability (can the machine read it at all)

- Single-column layout for the core content. Multi-column layouts, text boxes,
  and tables scramble many parsers; if the resume uses them, flag it.
- Standard section headings the parser can anchor on: Experience / Work
  Experience, Education, Skills, Projects. Cute headings ("My journey") fail
  keyword-to-section mapping.
- No critical text inside images, charts, icons, headers, or footers. Contact
  info in a page header is a classic silent failure.
- Real text, not a scanned image. Selectable text in the PDF.
- Standard fonts; no dense ornamentation. Dates in a consistent format
  (`MMM YYYY - MMM YYYY` or similar) so tenure math works.
- File type: PDF exported from a text document, or DOCX. Not PNG, not Canva
  image exports.
- Reasonable length: 1 page for entry/career-changer, up to 2 for senior+.
  Longer gets truncated or skimmed badly.

## 2. Contact and identity block

- Name, email, phone, location (city + country is enough), and relevant links
  (GitHub, LinkedIn, portfolio) as real text at the top of the body.
- Links resolve and match the candidate (a GitHub link with no public repos
  weakens rather than helps; note it, do not demand fake activity).
- Professional email address. No photo, age, or marital status for
  US/international applications (region norms differ; Japan's rirekisho
  conventions are a separate format and out of scope unless asked).

## 3. Keyword and requirement matching

- The exact noun forms of the target role's core skills appear somewhere
  ("PostgreSQL" not only "relational databases"; "React" not only "modern
  frontend frameworks"). Parsers match strings, not concepts.
- Both the spelled-out and abbreviated forms of key terms appear at least once
  each when both are common ("Kubernetes (K8s)", "Continuous Integration
  (CI)").
- Skills claimed in the Skills section also show up inside experience bullets.
  A bare skills list with no supporting evidence scores low with humans and
  some rankers.
- Job-title alignment: the resume's titles (or a headline line) map to the
  target role's title family. A career-changer needs the target title to
  appear in a headline/summary or projects context.
- No keyword stuffing: white-text keywords, irrelevant term dumps, or a
  skills section longer than the experience section are negative signals and
  some systems flag them.

## 4. Content strength (what the ranker and the human skim reward)

- Bullets open with strong action verbs, in consistent tense (past roles past
  tense, current role present tense).
- Quantified impact in a meaningful share of bullets: scale ("served 2M
  requests/day"), delta ("cut build time 40%"), scope ("across 6 teams").
  Flag every vague bullet that could carry a number.
- Accomplishment framing, not duty framing: "built X that did Y" beats
  "responsible for X".
- Recency-weighted detail: the last two roles carry the most bullets; ancient
  roles compress to one or two lines.
- No unexplained gaps longer than ~6 months in the recent history (advise a
  one-line honest explanation, never fabrication).
- Education and certifications present where the role family expects them;
  bootcamp/self-taught paths compensate with a Projects section that shows
  shipped, non-tutorial work.
- Spelling and grammar clean. One typo can bounce a borderline screen.

## 5. Career-changer specifics (apply when detected)

- A 2-3 line summary at the top that names the target role explicitly and
  bridges the prior career ("English teacher turned frontend developer...").
- Transferable accomplishments from the prior career quantified the same way
  as engineering work.
- Projects section positioned above old-career experience, with each project
  showing stack nouns, a live link or repo, and a real problem solved.
- Signals of team practice (code review, issues, OSS contributions) since
  solo tutorials are discounted by screens and humans alike.
