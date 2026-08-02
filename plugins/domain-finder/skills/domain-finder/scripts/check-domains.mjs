#!/usr/bin/env node
/**
 * check-domains.mjs
 *
 * Checks domain availability across multiple TLDs using RDAP (the modern
 * replacement for WHOIS). RDAP is HTTP-based and returns structured JSON, so it
 * works anywhere you have outbound HTTPS — no port-43 WHOIS needed.
 *
 * Endpoints are resolved dynamically from IANA's RDAP bootstrap registry
 * (https://data.iana.org/rdap/dns.json), so ANY TLD with a public RDAP service
 * works — not just a hardcoded list. A small static map is used as an offline
 * fallback and to cover a couple of well-known cases.
 *
 * Safety notes (this script is published for public use):
 *   - No filesystem writes, no shell-out, no secrets, no dependencies (Node 18+).
 *   - It only ever contacts IANA's bootstrap file and the RDAP endpoints IANA
 *     publishes for each TLD — the request HOST is never taken from user input,
 *     so there is no SSRF surface. Only the query NAME is user-controlled, and
 *     it is validated and percent-encoded.
 *   - Inputs are validated; malformed names are rejected rather than sent.
 *   - Polite concurrency, request timeouts, 429 backoff, and a per-run cap.
 *
 * Usage:
 *   node check-domains.mjs nekko                 # nekko.{com,app,io}
 *   node check-domains.mjs nekko cat --tlds com,ai,dev
 *   node check-domains.mjs --full nekko.com foo.ai   # check exact FQDNs as-is
 *   node check-domains.mjs --json example        # machine-readable output
 *   node check-domains.mjs ネコ --tlds com        # IDN input (auto punycode)
 *   node check-domains.mjs --help
 *
 * Exit code is 0 on success (including "all taken"); non-zero only on a usage
 * error.
 */

import process from 'node:process';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_TLDS = ['com', 'app', 'io'];
const IANA_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';
const USER_AGENT =
  'nekko-dojo-domain-finder/1.0 (+https://nekkolabs.com/dojo/skills/domain-finder)';

const DEFAULTS = {
  concurrency: 6,
  timeoutMs: 8000,
  maxDomains: 500, // abuse guard: refuse absurdly large runs
  retries: 2, // retries on 429 / network blips (in addition to the first try)
};

// Offline fallback / overrides. The bootstrap registry is the source of truth;
// these are only used if the bootstrap can't be fetched, or to hard-code the
// "no public RDAP" cases.
const STATIC_ENDPOINTS = {
  com: 'https://rdap.verisign.com/com/v1/domain/',
  net: 'https://rdap.verisign.com/net/v1/domain/',
  org: 'https://rdap.publicinterestregistry.org/rdap/domain/',
  io: 'https://rdap.identitydigital.services/rdap/domain/',
  app: 'https://www.registry.google/rdap/domain/',
  dev: 'https://www.registry.google/rdap/domain/',
  page: 'https://www.registry.google/rdap/domain/',
  co: 'https://rdap.nic.co/domain/',
  ai: 'https://rdap.nic.ai/domain/',
  me: 'https://rdap.nic.me/domain/',
  xyz: 'https://rdap.centralnic.com/xyz/domain/',
};

// TLDs with no public RDAP endpoint — flagged so the user knows to check manually.
const NO_RDAP = {
  jp: 'no public RDAP; check via JPRS whois (whois.jprs.jp)',
};

const STATUS = {
  AVAILABLE: 'AVAILABLE',
  TAKEN: 'taken',
  PREMIUM: 'premium/reserved',
  UNKNOWN: 'unknown',
  INVALID: 'invalid',
  NO_RDAP: 'no-rdap (check manually)',
};

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  let tlds = DEFAULT_TLDS;
  let fullMode = false;
  let json = false;
  let help = false;
  let concurrency = DEFAULTS.concurrency;
  const bases = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      help = true;
    } else if (a === '--full') {
      fullMode = true;
    } else if (a === '--json') {
      json = true;
    } else if (a === '--tlds') {
      const val = argv[++i];
      if (!val) throw new UsageError('--tlds requires a value, e.g. --tlds com,app,io');
      tlds = val
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^\./, ''))
        .filter(Boolean);
      if (!tlds.length) throw new UsageError('--tlds was empty');
    } else if (a === '--concurrency') {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 1 || n > 20) {
        throw new UsageError('--concurrency must be an integer 1–20');
      }
      concurrency = n;
    } else if (a.startsWith('-')) {
      throw new UsageError(`unknown flag: ${a}`);
    } else {
      bases.push(a);
    }
  }

  return { tlds, fullMode, json, help, concurrency, bases };
}

class UsageError extends Error {}

// ---------------------------------------------------------------------------
// Input validation + IDN handling
// ---------------------------------------------------------------------------

// A conservative LDH (letter/digit/hyphen) domain matcher applied AFTER IDN ->
// punycode conversion. Each label: 1–63 chars, no leading/trailing hyphen.
const LABEL = '(?!-)[a-z0-9-]{1,63}(?<!-)';
const FQDN_RE = new RegExp(`^${LABEL}(?:\\.${LABEL})+$`, 'i');
const SINGLE_LABEL_RE = new RegExp(`^${LABEL}$`, 'i');

/** Convert a possibly-Unicode (IDN) host to ASCII punycode. Returns null if invalid. */
function toAscii(host) {
  try {
    // URL handles IDNA/punycode for the hostname.
    const u = new URL(`http://${host.toLowerCase()}`);
    // u.hostname is punycoded and lowercased; strip a trailing dot if present.
    const ascii = u.hostname.replace(/\.$/, '');
    return ascii || null;
  } catch {
    return null;
  }
}

/** Normalize + validate a base label (no dot). Returns ASCII label or null. */
function normalizeLabel(raw) {
  const ascii = toAscii(raw);
  if (!ascii || ascii.includes('.')) return null;
  return SINGLE_LABEL_RE.test(ascii) ? ascii : null;
}

/** Normalize + validate a full FQDN. Returns ASCII fqdn or null. */
function normalizeFqdn(raw) {
  const ascii = toAscii(raw);
  if (!ascii || !ascii.includes('.')) return null;
  return FQDN_RE.test(ascii) ? ascii : null;
}

// ---------------------------------------------------------------------------
// IANA RDAP bootstrap
// ---------------------------------------------------------------------------

let bootstrapCache = null; // Map<tld, endpointBase> once loaded

async function loadBootstrap(timeoutMs) {
  if (bootstrapCache) return bootstrapCache;
  const map = new Map();
  try {
    const res = await fetchWithTimeout(IANA_BOOTSTRAP_URL, timeoutMs, {
      Accept: 'application/json',
    });
    if (res.ok) {
      const data = await res.json();
      // services: [ [ ["com","net"], ["https://rdap.example/"] ], ... ]
      for (const [tldList, urls] of data.services || []) {
        const base = pickHttps(urls);
        if (!base) continue;
        for (const tld of tldList) map.set(tld.toLowerCase(), ensureSlash(base));
      }
    }
  } catch {
    // Network unavailable — fall back to the static map below.
  }
  bootstrapCache = map;
  return map;
}

function pickHttps(urls) {
  if (!Array.isArray(urls)) return null;
  return urls.find((u) => u.startsWith('https://')) || urls[0] || null;
}

function ensureSlash(base) {
  return base.endsWith('/') ? base : base + '/';
}

/**
 * Resolve the RDAP "domain" query base for a TLD.
 * Returns { base } | { noRdap: note } | { unknown: true }.
 */
function resolveEndpoint(tld, bootstrap) {
  if (NO_RDAP[tld]) return { noRdap: NO_RDAP[tld] };
  const fromBoot = bootstrap.get(tld);
  if (fromBoot) return { base: fromBoot + 'domain/' };
  const fromStatic = STATIC_ENDPOINTS[tld];
  if (fromStatic) return { base: fromStatic };
  return { unknown: true };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url, ms, headers = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': USER_AGENT, ...headers },
      redirect: 'follow',
    });
  } finally {
    clearTimeout(id);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Core check via RDAP
// ---------------------------------------------------------------------------

async function checkDomain(fqdn, bootstrap, opts) {
  const tld = fqdn.split('.').pop();
  const ep = resolveEndpoint(tld, bootstrap);

  if (ep.noRdap) return { fqdn, status: STATUS.NO_RDAP, note: ep.noRdap };
  if (ep.unknown) {
    return { fqdn, status: STATUS.NO_RDAP, note: `no RDAP endpoint published for .${tld}` };
  }

  const url = ep.base + encodeURIComponent(fqdn);

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, opts.timeoutMs, {
        Accept: 'application/rdap+json',
      });

      // RDAP conventions:
      //   404 -> not found      -> AVAILABLE
      //   200 -> exists         -> TAKEN
      //   400/422 -> often reserved/premium names
      //   429 -> rate limited   -> back off and retry
      if (res.status === 404) return { fqdn, status: STATUS.AVAILABLE };
      if (res.status === 200) {
        const data = await res.json().catch(() => ({}));
        const statuses = (data.status || []).join(',');
        if (/reserved|premium/i.test(statuses)) {
          return { fqdn, status: STATUS.PREMIUM, note: statuses };
        }
        return { fqdn, status: STATUS.TAKEN, note: statuses || undefined };
      }
      if (res.status === 400 || res.status === 422) {
        return { fqdn, status: STATUS.PREMIUM, note: `registry returned ${res.status}` };
      }
      if (res.status === 429) {
        if (attempt < opts.retries) {
          await sleep(500 * (attempt + 1) + Math.floor(attempt * 250));
          continue;
        }
        return { fqdn, status: STATUS.UNKNOWN, note: 'rate-limited (429), try again later' };
      }
      return { fqdn, status: STATUS.UNKNOWN, note: `HTTP ${res.status}` };
    } catch (err) {
      const transient = err.name === 'AbortError';
      if (attempt < opts.retries && transient) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      return {
        fqdn,
        status: STATUS.UNKNOWN,
        note: err.name === 'AbortError' ? 'timeout' : err.message,
      };
    }
  }
  return { fqdn, status: STATUS.UNKNOWN, note: 'exhausted retries' };
}

// ---------------------------------------------------------------------------
// Concurrency pool
// ---------------------------------------------------------------------------

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const my = idx++;
      results[my] = await worker(items[my]);
    }
  });
  await Promise.all(runners);
  return results;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const useColor = process.stdout.isTTY;
const paint = (fn, s) => (useColor ? fn(s) : s);

function colorFor(status) {
  if (status === STATUS.AVAILABLE) return C.green;
  if (status === STATUS.TAKEN) return C.red;
  if (status === STATUS.PREMIUM) return C.yellow;
  return C.dim;
}

const SORT_ORDER = {
  [STATUS.AVAILABLE]: 0,
  [STATUS.PREMIUM]: 1,
  [STATUS.TAKEN]: 2,
  [STATUS.UNKNOWN]: 3,
  [STATUS.NO_RDAP]: 4,
  [STATUS.INVALID]: 5,
};

const HELP = `check-domains — RDAP-based domain availability checker

Usage:
  node check-domains.mjs <base...> [--tlds com,app,io]
  node check-domains.mjs --full <fqdn...>
  node check-domains.mjs [--json] [--concurrency N] ...

Options:
  --tlds <list>     Comma-separated TLDs to combine with each base (default: com,app,io)
  --full            Treat each argument as a complete FQDN (e.g. nekko.com)
  --json            Emit machine-readable JSON instead of a table
  --concurrency N   Parallel requests, 1–20 (default: 6)
  -h, --help        Show this help

Notes:
  - Resolves RDAP endpoints from IANA's bootstrap registry, so any TLD with a
    public RDAP service works. .jp has no public RDAP (check JPRS manually).
  - "AVAILABLE" is a strong signal but not a guarantee of registerability —
    premium pricing, registry holds, and trademark conflicts still apply.`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (err instanceof UsageError) {
      process.stderr.write(`error: ${err.message}\n\n${HELP}\n`);
      process.exit(2);
    }
    throw err;
  }

  if (args.help) {
    process.stdout.write(HELP + '\n');
    return;
  }

  const baseInputs = args.bases.length ? args.bases : ['nekko'];

  // Build + validate the FQDN list. Invalid inputs are reported, not requested.
  const toCheck = []; // { fqdn }
  const invalid = []; // { input, reason }

  if (args.fullMode) {
    for (const raw of baseInputs) {
      const fqdn = normalizeFqdn(raw);
      if (fqdn) toCheck.push(fqdn);
      else invalid.push({ input: raw, reason: 'not a valid domain name' });
    }
  } else {
    for (const raw of baseInputs) {
      const label = normalizeLabel(raw);
      if (!label) {
        invalid.push({ input: raw, reason: 'not a valid domain label' });
        continue;
      }
      for (const t of args.tlds) {
        const fqdn = normalizeFqdn(`${label}.${t}`);
        if (fqdn) toCheck.push(fqdn);
        else invalid.push({ input: `${raw}.${t}`, reason: `invalid TLD ".${t}"` });
      }
    }
  }

  // De-duplicate.
  const unique = [...new Set(toCheck)];

  if (unique.length > DEFAULTS.maxDomains) {
    process.stderr.write(
      `error: ${unique.length} domains exceeds the ${DEFAULTS.maxDomains}-per-run cap. ` +
        `Split into smaller batches.\n`,
    );
    process.exit(2);
  }

  if (!unique.length) {
    if (args.json) {
      process.stdout.write(JSON.stringify({ results: [], invalid }, null, 2) + '\n');
    } else {
      process.stderr.write('No valid domains to check.\n');
      for (const i of invalid) process.stderr.write(`  ${i.input}: ${i.reason}\n`);
    }
    process.exit(invalid.length ? 1 : 0);
    return;
  }

  const bootstrap = await loadBootstrap(DEFAULTS.timeoutMs);
  const opts = { timeoutMs: DEFAULTS.timeoutMs, retries: DEFAULTS.retries };

  if (!args.json) {
    process.stdout.write(
      paint(
        C.bold,
        `\nChecking ${unique.length} domain${unique.length === 1 ? '' : 's'} via RDAP ` +
          `(${args.concurrency} concurrent)...\n\n`,
      ),
    );
  }

  const results = await runPool(unique, (d) => checkDomain(d, bootstrap, opts), args.concurrency);
  results.sort((a, b) => SORT_ORDER[a.status] - SORT_ORDER[b.status] || a.fqdn.localeCompare(b.fqdn));

  if (args.json) {
    process.stdout.write(JSON.stringify({ results, invalid }, null, 2) + '\n');
    return;
  }

  const pad = Math.max(...unique.map((d) => d.length), 10) + 2;
  for (const r of results) {
    const c = colorFor(r.status);
    const line = `${r.fqdn.padEnd(pad)} ${paint(c, r.status.padEnd(18))} ${
      r.note ? paint(C.dim, r.note) : ''
    }`;
    process.stdout.write(line.trimEnd() + '\n');
  }

  if (invalid.length) {
    process.stdout.write(paint(C.dim, `\nSkipped ${invalid.length} invalid input(s):\n`));
    for (const i of invalid) process.stdout.write(paint(C.dim, `  ${i.input} — ${i.reason}\n`));
  }

  const avail = results.filter((r) => r.status === STATUS.AVAILABLE);
  process.stdout.write(paint(C.bold, `\n${avail.length} available:\n`));
  process.stdout.write(
    (avail.map((r) => '  ' + paint(C.green, r.fqdn)).join('\n') || '  (none)') + '\n',
  );
  process.stdout.write(
    paint(
      C.dim,
      `\nNote: RDAP "available" is strong but not a guarantee of registerability ` +
        `(premium pricing, registry holds, and trademark conflicts still apply). ` +
        `Confirm + register at Cloudflare Registrar (at-cost) or your preferred registrar.\n`,
    ),
  );
}

main().catch((err) => {
  process.stderr.write(`unexpected error: ${err?.stack || err}\n`);
  process.exit(1);
});
