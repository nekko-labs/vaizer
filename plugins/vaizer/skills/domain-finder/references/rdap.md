# RDAP background

Reference for the `domain-finder` skill. Read this if the user asks how
availability checking works, or hits an edge case (`.jp`, premium names, "it
said available but I can't register it").

## Why RDAP instead of WHOIS

**RDAP** (Registration Data Access Protocol) is the IANA-mandated successor to
WHOIS:

- **HTTP/JSON instead of port-43 text.** Works anywhere you have outbound
  HTTPS — no special WHOIS client, no firewall holes.
- **Structured status codes.** You read HTTP status + a JSON `status` array
  instead of parsing each registrar's free-form text.
- **Far less rate-limiting** than legacy WHOIS, and a standard bootstrap
  registry so you can discover the right endpoint for any TLD.

The checker uses a simple convention:

| HTTP status | Meaning            | Result            |
|-------------|--------------------|-------------------|
| `404`       | no record found    | **AVAILABLE**     |
| `200`       | record exists      | **taken**         |
| `400`/`422` | often reserved     | **premium/reserved** |
| `429`       | rate limited       | retry with backoff |

## Endpoint discovery (any TLD)

Endpoints come from IANA's RDAP bootstrap registry:

- `https://data.iana.org/rdap/dns.json`

It maps each TLD to its registry's RDAP base URL. The script fetches and caches
this once per run, so **any TLD with a public RDAP service works** — not just a
hardcoded list. A small static map is kept only as an offline fallback.

## The `.jp` caveat

`.jp` has **no public RDAP endpoint**. If the user wants `nekko.jp` or a
Japanese IDN like `ネコ.jp`, check it separately via **JPRS**:

- `https://whois.jprs.jp` (web) or `whois.jprs.jp` (port-43)

The script reports `.jp` as `no-rdap (check manually)` rather than guessing.

## IDN / Japanese names

Unicode (internationalized) names are converted to ASCII **punycode** before
querying — e.g. `ネコ.com` → `xn--tck8b.com`. That's the form the registry
actually stores, so results are accurate for Japanese/other-script names.

## "Available" ≠ "registerable"

A `404`/AVAILABLE result is a **strong** signal but **not** a guarantee you can
register the name:

- **Premium pricing** — some registries flag desirable names at much higher
  prices (sometimes surfaced as `400`/`422`, sometimes only at checkout).
- **Registry holds / reserved lists** — names withheld by the registry.
- **Trademark conflicts** — availability says nothing about whether a name is
  legally safe (that's Stage 3 of the skill).

Always confirm at a registrar before committing. Cloudflare Registrar sells at
cost (no markup) and is a good default.
