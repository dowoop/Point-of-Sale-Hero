# CLAUDE.md — Point of Sale Hero

Dependency-free HTML reference build of the CryptoPoS terminal
(`dowoop/crypto-pos-terminal`, native Android/Compose). This repo — not Figma, not the
Android app — is the **design source of truth**.

## Direction (read this first)

**This is the INDIVIDUAL build, and individual is the product.** A retail experience
may come later as a layer on the same scaffolding, but **retail is not defined yet —
do not build retail features, do not create retail branches, do not speculate about
what retail means.** A retail exploration was implemented and deliberately discarded
on 2026-07-01; its specs survive in `docs/SCREENS.md` as reference only.

All design knowledge lives in `docs/` (open markdown, supersedes the Figma file):
`DIRECTION.md` (why + decision log) · `RESEARCH.md` (verified evidence) ·
`LAYOUT.md` (**the layout & copy contract** — its Copy deck strings are verbatim;
change copy there first, then in the build) · `SCREENS.md` (the build as it stands) ·
`BEHAVIOR.md` (state machine + invariants) · `DESIGN-SYSTEM.md` (tokens) ·
`PAGES.md` (one-glance map & defaults) · `TOOLING.md` (verified tooling research
for the native terminal) · `LOGIC.md` (the premade scaffolding pack — behavior
contract for any real implementation; evidence-tagged REF/PA/RESEARCH).

The native pre-alpha (`dowoop/crypto-pos-terminal`, cloned as a sibling dir) has
real, test-covered chain logic but self-reported proofs — treat its knowledge with
caution; TOOLING.md records what is verified vs pre-alpha-only.

## Stack & architecture

- Zero deps, no build step: `index.html` + `styles.css` + `app.js` +
  `assets/icons.js` (window.ICONS) + `assets/qrcode.js` (vendored MIT).
- One state object `S` → full innerHTML `render()`; one delegated click listener
  dispatching on `data-act`; a delegated `input` listener for focus-sensitive fields.
- Invariants that must hold (details in `docs/BEHAVIOR.md`):
  - the scaffolding (state machine, rails/QR, ledger, mode safety) stays
    persona-independent;
  - tokens in `styles.css :root` — every color defined for BOTH themes; no hex in
    components when a token exists;
  - every class emitted from app.js templates must exist in styles.css;
  - `esc()` every user string before it reaches a template;
  - timers only via `after()` so cancel/reset can clear them;
  - QR amounts must equal on-screen amounts;
  - only Mainnet + REAL + Confirmed is income, and a payment books under the mode it
    was charged in.

## Run & verify

```bash
python3 -m http.server 8000        # then http://localhost:8000
```

Verify changes visually — drive it with Playwright (chromium is installed), screenshot
`.phone` for every affected screen in **both** themes (flip
`document.documentElement.dataset.theme`), and actually read the images.
`window.__POSH__` exposes `S` for scripted state assertions; the stage `#reset-btn`
resets between scenarios.

## Publishing

`git push` to main republishes the live demo (GitHub Pages via `pages.yml`) at
https://dowoop.github.io/Point-of-Sale-Hero/ — don't push casually, and never commit
or push without being asked.
