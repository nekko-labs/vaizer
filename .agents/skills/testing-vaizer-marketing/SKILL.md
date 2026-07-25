---
name: testing-vaizer-marketing
description: Test the Vaizer marketing site (home page brand mark, hero copy, favicons) end-to-end. Use when verifying visual/copy changes to the Next.js site.
---

# Testing Vaizer marketing site

Vaizer is a Next.js 15 (App Router) marketing + product site. Most PRs touching the
landing page are visual/copy changes verified by running the app locally and looking at `/`.

## Run locally
```bash
npm install          # deps
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit — should pass
npm run build        # production build — should pass
```
No env file is required; Supabase/PostHog/Discord have inert fallbacks.

Note: `npm run lint` (`next lint`) may not be initialized and can drop into an
interactive ESLint-config prompt (exits non-zero). Treat a lint failure of this
kind as unrelated to code changes; rely on `typecheck` + `build` instead.

## Where the brand mark lives
- The single source of truth for the logo/icon is `src/components/Logo.tsx`
  (`VaizerMark`, inline SVG, inherits `currentColor`, `--signal` for the accent).
- It is reused in `SiteHeader.tsx`, `SiteFooter.tsx`, and `src/app/page.tsx`
  (hero badge + closing CTA). Changing `Logo.tsx` updates all of them.
- Favicons are separate PNGs: `src/app/icon.png` (512) and `src/app/apple-icon.png`
  (180). They do NOT auto-update from the SVG — regenerate them from a matching SVG.

## Regenerating favicons from an SVG
`convert` (ImageMagick) needs `rsvg-convert`; install `librsvg2-bin` if missing.
```bash
sudo apt-get install -y librsvg2-bin
rsvg-convert -w 512 -h 512 mark.svg -o src/app/icon.png
rsvg-convert -w 180 -h 180 mark.svg -o src/app/apple-icon.png
```
Use concrete hex colors in the SVG (not CSS `var(--...)`); rsvg won't resolve theme vars.
Brand colors (from `src/app/globals.css`): bg `#0a0b10`, accent `#7c74ff`, signal `#34e6d6`.

## Verifying (UI)
Open `http://localhost:3000` and check the home page:
- Header + footer brand mark match the intended design (zoom in — the mark is small).
- Hero `<h1>` text matches the requested copy exactly (colored spans on key words).
- The "Built on one idea: ..." section `<h2>`.
- Closing-CTA mark (large) above "Stop guessing what your agent is doing."
- Browser tab favicon reflects the new icon (hard-refresh if cached).

## Devin Secrets Needed
None. The site builds and runs with no env file.
