# screenshots

Visual evidence for pull requests, committed so the before/after tables in a PR
description have a stable URL to point at. `gh pr create` cannot upload local
files to GitHub's `user-attachments` CDN (that endpoint needs an authenticated
web session, and there is no API for it), so a PR opened from the CLI has
nowhere to host its images.

Reference them from a PR body by absolute raw URL pinned to a commit, not by
relative path: PR and issue descriptions do not resolve relative image paths.

```
https://raw.githubusercontent.com/nekko-labs/vaizer/<sha>/screenshots/<file>.png
```

Naming: `<surface>-<viewport>-<before|after>.png`. Keep pairs at the same route,
viewport, theme, and data, and capture the "before" from the base branch rather
than reconstructing it.

## Current contents

PR #21, the config toggle knob and the clipped hero loop-back edge:

| File | What it shows |
| --- | --- |
| `toggle-desktop-before.png` | `/config` toggle at 1280px, knob rendered fully outside its track |
| `toggle-desktop-after.png` | same, knob anchored 2px inside the track |
| `toggle-mobile-before.png` | same bug at 390px |
| `toggle-mobile-after.png` | same fix at 390px |
| `hero-desktop-before.png` | home hero at 1280px, `loop -> decide` edge clipped by the panel |
| `hero-desktop-after.png` | same, full curve visible after the viewBox change |
| `hero-mobile-before.png` | same clipping at 390px |
| `hero-mobile-after.png` | same fix at 390px |
