# Changelog

## 3.1.0 — Immersive Radio Console

- Central overlay/Escape policy, focus containment and restoration, inert background, terminal-safe Pause/Resume, one keyboard pipeline and native modifier/IME support.
- Actual mobile 3D stage with portrait/landscape layouts; canvas-relative raycasting, incremental bounded tuning/volume drag with fractional movement retained for slow one-pixel/fine gestures, larger non-overlapping 3D hit areas and reliable gesture release.
- Cabinet/control bounding-box camera framing, one renderer/loop, resize smoothing, front fill light and physical control labels. Decorative aerial can extend beyond the cabinet framing.
- Powered-off CRT textures stop updating; imported motion/quality preferences immediately match the controls; freeplay resumes the existing AudioContext after returning from a hidden tab.
- Verified V2.2 v1-key migration with raw backup, explicit briefing choice, compatible archive and no unearned Night Shift progress. Hardened save validation, error reporting and bounded write frequency.
- Portable Playwright browser selection, Node 22 CI validation/E2E jobs, screenshots/traces/reports and expanded unit/integration/WebGL regressions.
- Mission frequencies, 7429 code, difficulty constants, resource formulas and score rules preserved. Only restore validation was hardened (known difficulty names, bounded arrays and integer counters).
