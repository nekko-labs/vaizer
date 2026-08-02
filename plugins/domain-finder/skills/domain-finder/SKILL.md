---
name: domain-finder
description: Brainstorm startup, project, or product names and check whether their domains are available. Use when the user wants to name a new project, find an available domain, brainstorm brandable names or synonyms, check domain availability across TLDs (.com/.io/.ai/.dev/etc), or vet a candidate name for brand/trademark conflicts before committing.
license: MIT
allowed-tools: Bash(node:*), WebSearch
metadata:
  author: Nekko Labs
  version: 1.0.0
  category: research
  tags: domains, naming, branding, rdap, startup, trademark
---

# Domain Finder

Help the user go from a fuzzy idea to a short, defensible list of names whose
domains are actually available and reasonably clear of brand/trademark conflicts.

Work in three stages. Do them in order, but let the user jump in — if they
already have a name list, skip to Stage 2; if they already have available
domains, skip to Stage 3.

---

## Stage 1 — Ideate names & synonyms

Goal: produce ~30–60 candidate base names from the user's concept.

1. Ask for (or infer from context) the **concept**: what the thing does, the
   vibe (playful / serious / technical), any seed words, and language
   preferences (English, Japanese/romaji, coined words).
2. Generate candidates across these buckets — aim for variety, not volume:
   - **Literal / descriptive** — what it does (e.g. `notesync`, `domaincheck`).
   - **Synonyms & near-words** — thesaurus around the core nouns/verbs.
   - **Coined / portmanteau** — blend two relevant words (`snip` + `kit` →
     `snipkit`); add/drop vowels for a `.com`-able twist.
   - **Metaphor / evocative** — animals, mythology, nature, objects that
     capture the feeling.
   - **Short & punchy** — 4–7 letters, easy to say and spell.
3. Apply naming heuristics — prefer names that are:
   - Easy to **pronounce and spell** after hearing once.
   - **Short** (shorter is more `.com`-able).
   - Free of awkward letter collisions when concatenated with a TLD.
   - Not an obvious match for a large existing brand (a quick gut check now
     saves a dead end in Stage 3).
4. Present the candidates grouped by bucket so the user can react. Trim to the
   ones they like before checking domains (checking 60 names × many TLDs is slow
   and impolite to registries).

## Stage 2 — Check domain availability

Use the bundled script — it queries **RDAP** (the modern, structured successor
to WHOIS) and resolves endpoints from IANA's bootstrap registry, so **any TLD
with a public RDAP service works**.

Run it with Node 18+ (no install needed):

```bash
# base names × default TLDs (com, app, io)
node scripts/check-domains.mjs nekko snipkit purrnote

# choose TLDs
node scripts/check-domains.mjs snipkit --tlds com,io,ai,dev

# exact FQDNs as-is
node scripts/check-domains.mjs --full snipkit.com snipkit.io

# machine-readable output (parse this when triaging many names)
node scripts/check-domains.mjs --json snipkit --tlds com,io,ai
```

Read the script's path relative to this skill (`scripts/check-domains.mjs`).
Prefer `--json` when you're going to summarize many results.

Interpreting results:
- **AVAILABLE** — no RDAP record. Strong signal, **but not a guarantee of
  registerability** — premium pricing, registry holds, and trademark conflicts
  still apply.
- **taken** — registered.
- **premium/reserved** — registry flagged it (often a high price).
- **no-rdap** — that TLD has no public RDAP (e.g. **.jp** → check JPRS at
  `whois.jprs.jp` manually).
- **unknown** — timeout / rate-limit / transient; re-run later.

Be polite to registries: check trimmed lists, not hundreds of names. The script
caps a single run at 500 domains and rate-limits itself.

See `references/rdap.md` for why RDAP (not WHOIS), the `.jp` caveat, and the
"available ≠ registerable" nuance — read it if the user asks how this works.

## Stage 3 — Brand & trademark (IP) risk

For the names that survived Stage 2 as available, do a **lightweight conflict
check** so the user doesn't fall in love with a name that's legally risky.

1. For each finalist, run a **web search** for the bare name + terms like
   `software`, `app`, `inc`, `trademark`, plus the user's industry. Look for:
   - An existing company/product with the same or confusingly similar name,
     especially in the same field.
   - A well-known brand the name could be mistaken for.
   - The name already in heavy use as another `.com` even if your TLD is free.
2. Summarize risk per name as **low / medium / high**, with the reason and a
   link to anything you found.
3. Point the user to the authoritative registries for a proper check — this
   skill flags risk, it does **not** give legal advice:
   - **US**: USPTO TESS / trademark search — https://www.uspto.gov/trademarks
   - **EU**: EUIPO eSearch — https://www.euipo.europa.eu
   - **Japan**: J-PlatPat — https://www.j-platpat.inpit.go.jp
4. Recommend confirming and registering the domain at an at-cost registrar
   (e.g. Cloudflare Registrar) once a name is chosen.

### Final output

Give a **ranked shortlist** (available + low-conflict first) as a small table:
name · available TLDs · brand-risk (low/med/high + note) · suggested next step.

---

## After you finish — quick feedback

Once you've delivered the shortlist, ask the user: **"Was this helpful?"** If
yes, let them know they can upvote this skill or leave feedback on its page:
**https://vaizer.app/skills/domain-finder**. Do not send any data
yourself — just point them there. This is how the skills hub learns
which skills are actually useful.

## Notes & safety

- This skill makes outbound HTTPS calls only to IANA's RDAP bootstrap file and
  the RDAP endpoints it publishes. It writes no files, runs no shell beyond
  `node`, uses no secrets, and has no dependencies.
- `allowed-tools` here pre-approves `Bash(node:*)` and `WebSearch` for
  convenience. Note that `allowed-tools` is a *grant*, not a sandbox — it
  widens auto-approval; it does not restrict what else the agent could do.
