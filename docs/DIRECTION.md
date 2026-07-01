# Product direction

> **Individual first. Retail comes later, on this scaffolding — its shape is not yet
> defined, so do not build toward it.**
> — decided 2026-07-01

The product is CryptoPoS for **the individual**: a person accepting crypto payments —
one-off charges built on a keypad, a fresh payment code per sale, an address-only
donation code, an honest personal ledger. No products, no staff, no storefront
assumptions.

A **retail** experience (catalog, cart, tax, receipts with a merchant identity) is a
possible future *layer* on the same scaffolding. What "retail" concretely means has
**not been decided**. A retail UI was explored once (see the decision log); its specs
are preserved in [SCREENS.md](SCREENS.md) as reference material only — they are not a
plan, and there is deliberately no retail branch.

## What is scaffolding (must stay persona-independent)

Everything hard lives below the tab shell and must never fork per persona:

- **Payment state machine** — Idle → Awaiting → Mempool → Confirming (n/N) → Settled /
  Failed, with tracked timers so cancel/reset always kills pending transitions.
  See [BEHAVIOR.md](BEHAVIOR.md).
- **Rails + real QR encoding** — BIP-21 / Solana Pay / EIP-681 / Monero / Tari URIs
  from clearly-marked SAMPLE addresses; QR amounts must always match the on-screen
  figure.
- **The honest ledger** — every settlement recorded; **only Mainnet + REAL + Confirmed
  books as income**; the mode is captured at charge time so nothing can be
  reclassified after the fact.
- **Mode safety** — Mainnet is gated behind a typed confirmation in Terminal Config
  (the app-bar pill can *preview* modes); demo/testnet sales can never become income.
- **Design tokens** — one palette, both themes, in `styles.css :root`.
  See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- **The phone-frame shell** — statusbar, viewport, bottom nav, dialogs, toast.

## Decision log

- **2026-06-29** — Initial reference build: faithful 4-tab port of the Android app.
- **2026-06-29** — Restructured Coins-first, dropped the Terminal tab; then keypad-only
  checkout: **the individual audience became the product** (commits `79a73e2`,
  `e6be761`).
- **2026-06-30 → 07-01** — A solo-retail UX exploration ran in Figma
  (file `NNdVeKNRXBMkCQmzGu1TTH`): 5-tab retail shell specced, 2 frames built. Figma
  work stalled on free-plan MCP limits — **Figma is a stepping stone, not the source
  of truth. This repo and these docs are.**
- **2026-07-01** — The retail exploration was implemented in code end-to-end (all 5
  tabs × both themes, screenshot-verified, multi-agent reviewed). Reviewing it
  surfaced real **scaffolding** bugs shared with the individual build.
- **2026-07-01** — **Decision: individual only.** The retail implementation was
  discarded — not branched — because retail's meaning isn't defined yet. Its verified
  scaffolding fixes were ported onto the individual build (ETH wei precision in the
  QR, sim one-shot guard, settle/fail state guards, mode captured at charge time,
  Today-card income filter, honest clipboard toast, Share ≠ Print). The exploration's
  specs live on in [SCREENS.md](SCREENS.md) as reference.

## Notes from the retail exploration (reference only — not a plan)

The exploration's UX audit diagnosed *persona overload* in the original app (solo
retailer + infra operator + crypto researcher in one UI). If retail is ever defined,
these observations may be useful:

- Retail wants cart-first: amount/products first, the chain choice as a small selector.
- Cashier-facing screens want plain language ("Waiting for the customer to scan…").
- Candidates for retail-only surface: product catalog tab, always-visible cart, sales
  tax, merchant identity, printer / customer display / staff slots.
- Candidates the retail persona doesn't need: the coin gallery as home, donation codes
  on the cashier path, chain-literate copy.

None of the above is committed direction until retail is defined.
