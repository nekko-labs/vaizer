---
project: Vaizer
design-system: Vellum
last-updated: 2026-07-25
---

# STYLESEED

Design rules that keep the Vellum identity intact and stop new (often
agent-written) screens from drifting into the generic "AI-generated look".
Inspired by [StyleSeed](https://github.com/bitjaru/styleseed): a persistent
rulebook plus a lightweight review gate. Vaizer implements the rules locally
against its own token layer rather than adding the dependency.

Read this before adding a screen or component. The token source of truth is
`src/app/globals.css` (`:root` vars mapped through `@theme`); `TASKS.md` holds
the "Design system: Vellum" prose.

## Rules

1. No hardcoded colors. Never write a hex, `rgb()`, or `rgba()` literal in a
   component, nor a Tailwind arbitrary color (`text-[#dc2626]`, `bg-[#b45309]`).
   Use a semantic token utility (`text-fg`, `bg-surface`, `border-border`,
   `text-accent`, `text-signal`, `text-danger`, `text-warn`, ...) or the CSS
   var directly in an inline `style` when SVG/canvas needs it
   (`fill="var(--node-tool)"`). If a color is missing, add a token in
   `globals.css`, do not inline a one-off value.
2. No default indigo / generic SaaS palette. The primary accent is the
   Vellum indigo-ink token `--accent (#5646d4)`, applied via `bg-accent` /
   `text-accent`; do not reach for Tailwind's default `indigo-*`, `blue-*`,
   `red-*`, etc.
3. Status colors are semantic. Fail / needs-attention uses `danger`
   (`--danger`, text `--danger-fg`); partial / stale / waiting uses `warn`
   (`--warn`, text `--warn-fg`); ok / success / progress uses `signal`. No
   raw reds/ambers.
4. Node-kind hues are fixed tokens. Trigger amber, context blue, agent violet,
   tool teal-green, decision yellow, loop pink, output green live as
   `--node-*` tokens. Reuse them; do not invent per-screen graph colors.
5. Icons are SVG, not emoji. New UI affordances use the icons in
   `src/components/icons.tsx` (add one there if missing). Emoji already present
   in copy/marketing may stay, but do not introduce emoji as functional icons
   on new interactive controls.
6. Never plain white / plain black surfaces. Backgrounds come from the warm
   `--bg` / `--surface` / `--surface-2` ramp; ink is `--fg`, never `#000`.
7. Motion stays quiet and once-only (`Reveal` / `Stagger` from
   `components/motion.tsx`), except the purposeful ongoing motion on `/watch`
   and `/hud`. Respect `prefers-reduced-motion` (the shared primitives already
   do).
8. Accessibility is not optional. Interactive elements are real `<button>` /
   `<a>` (not `div onClick`); dialogs use `role="dialog"` + `aria-modal`, trap
   focus, close on Escape, and return focus to the trigger; keep the
   `:focus-visible` ring.

## Review gate

Before merging a UI change, self-score against the rules above. Any hardcoded
color literal or Tailwind arbitrary color is an automatic fail: move it onto a
token first. Record notable design decisions (new tokens, deliberate
exceptions) below so the next screen inherits them.

## Decisions

- 2026-07-25: Added semantic status tokens (`--danger`, `--danger-fg`,
  `--warn`, `--warn-fg`) and `--node-*` node-kind tokens, and moved every
  stray hex/`red-*` value in components onto them.
