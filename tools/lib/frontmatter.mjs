/**
 * Minimal, dependency-free YAML frontmatter reader for SKILL.md files.
 *
 * Deliberately tiny: it understands the small subset skills use — top-level
 * `key: value` scalars and a single level of nesting under `metadata:`. It does
 * NOT execute anything and never evaluates values. Anything it can't parse is
 * surfaced as a soft value (string) rather than throwing, so validators can
 * report a clear error instead of crashing on a malformed file.
 */

import { readFileSync } from 'node:fs';

/** Split a SKILL.md into { frontmatterText, body }. */
export function splitFrontmatter(text) {
  // Frontmatter is a leading block delimited by --- on its own lines.
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { frontmatterText: null, body: text };
  return { frontmatterText: m[1], body: m[2] ?? '' };
}

function stripQuotes(v) {
  const t = v.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

/** Parse the limited frontmatter subset into an object. */
export function parseFrontmatter(frontmatterText) {
  const out = {};
  if (!frontmatterText) return out;
  const lines = frontmatterText.split(/\r?\n/);
  let currentNested = null; // name of the key whose nested map we're filling

  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;

    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();
    const colon = line.indexOf(':');
    if (colon === -1) continue;

    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();

    if (indent === 0) {
      currentNested = null;
      if (value === '' || value === '{}') {
        // Could be the start of a nested map (e.g. metadata:).
        out[key] = {};
        currentNested = key;
      } else {
        out[key] = stripQuotes(value);
      }
    } else if (currentNested && typeof out[currentNested] === 'object') {
      out[currentNested][key] = stripQuotes(value);
    }
  }
  return out;
}

/** Read + parse a SKILL.md file. Returns { frontmatter, body, raw }. */
export function readSkillMd(path) {
  const raw = readFileSync(path, 'utf8');
  const { frontmatterText, body } = splitFrontmatter(raw);
  return { frontmatter: parseFrontmatter(frontmatterText), body, raw, hasFrontmatter: frontmatterText !== null };
}
