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

## Rails direction (2026-07-03)

**All technologies and assets the scaffolding can honestly serve are hoped to be
supported eventually** — "hoped" is deliberate: nothing ships without clearing the
bar the Monero rail set (adversarially verified research, then bench work).
**Privacy-focused rails get priority: Tari, Dash, and Zcash**, alongside the
already-verified Monero — privacy at the counter is the differentiating promise of
a self-custodial terminal. **All three priority privacy rails are now verified at
the desk level** (Tari, Dash, Zcash — 2026-07-03/04); each awaits testnet bench
work before mainnet. Priority orders the research/bench queue; it does not exempt a
rail from the honesty rules (untracked modes book nothing, mode captured at charge
time, fail-closed detection).

## What is scaffolding (must stay persona-independent)

Everything hard lives below the tab shell and must never fork per persona:

- **Payment state machine** — Idle → Awaiting (15-min rate lock) → Mempool →
  Confirming (n/N) → Settled / Expired / Failed, plus the Needs-Review quarantine
  (late payments, stopped watches, overpay surplus) and refunds as NEW outbound
  payments — with tracked timers so cancel/reset always kills pending transitions.
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
- **2026-07-02** — Deep research into crypto-payment misconceptions and POS practice
  (SOUPS 2020 / FC 2016 / CHI 2016; Square's payment lifecycle; BTCPay; BIP 321 /
  ERC-681 — 25 claims adversarially verified, 0 refuted) → [RESEARCH.md](RESEARCH.md).
  A three-lens design bake-off (honesty-maximalist / counter-speed / wallet-convention,
  judged, winner synthesized with 28 grafts) produced [LAYOUT.md](LAYOUT.md) — the
  target layout and **verbatim copy deck**.
- **2026-07-02** — **The "new hero": build rewritten to match LAYOUT.md.** Keypad-first
  charge home, mode strip on every payment surface, rate-lock countdown, block-strip
  confirmations, NEEDS REVIEW / REFUND ledger states, PRACTICE watermark on
  non-mainnet receipts; fixed the testnet QR bug (chain ids were hardcoded mainnet
  @1/@137 — now Sepolia @11155111 / Amoy @80002 per the mode captured at charge time).
  Docs rewritten to describe the new build; **copy changes go through LAYOUT.md's
  Copy deck first**.
- **2026-07-03** — Tooling research for the native terminal (22 claims verified,
  3 refuted) → [TOOLING.md](TOOLING.md). A follow-up Monero pass (23 confirmed,
  2 refuted) verified the view-only detection core end-to-end — wallet-rpc
  view-only wallets, per-sale subaddresses, pool-scan DETECTED, Monerujo/Cake URI
  prefill. A third pass (22 confirmed, 3 refuted) mined production processors
  (MoneroPay's 0/1/10-conf ladder + covered/unlocked model, BTCPay's plugin
  topology, BitcartCC's integrated-address alternative) and characterized the
  **subaddress-lookahead restore hazard** from source (50×200 rolling window;
  in-place raise broken in every shipped release; restore-time lookahead is the
  recovery — Feather wizard). Tari/price-feeds/Kotlin-libs remain open.
- **2026-07-03** — **Stagenet bench executed** (v0.18.5.0, public remote nodes):
  the full view-only flow settled end-to-end — per-sale subaddress, confirmation
  ladder, `locked`→false at exactly 10 confs. Corrected the research on
  `set_subaddress_lookahead` (it IS in shipped v0.18.5.0). Earned rules:
  supervise wallet-rpc, `store` after mint, alternate-node re-relay, provision
  the wallet at setup. Remaining: mainnet self-pay (operator's step), pool
  latency vs a local node. Details in [TOOLING.md](TOOLING.md).
- **2026-07-03** — Rails direction set: all assets hoped for eventually;
  **privacy rails prioritized (Tari, Dash, Zcash)**. Tari research pass
  (22 confirmed, 3 refuted): **view-only detection exists** (console wallet
  read-only mode; official exchange-guide precedent), payment_id is embeddable
  in the TariAddress (RFC-0155), Tor was config-default not requirement, the
  pre-alpha's confirmation gate needs a LOCKED-status policy decision, and
  Ootle stays NOT-READY. Payer leg (tari:// URI, Aurora/Universe prefill)
  unverified — Tari ships testnet-only until it is. [TOOLING.md](TOOLING.md).
- **2026-07-03** — **Dash rail research** (two passes: 24 + 25 claims confirmed,
  1 refuted): InstantSend is automatic since v0.14.0 and observable
  (`instantlock_internal`; the composite `instantlock` field trap is documented),
  but not universal — input-eligibility rules and spork toggles make a ≥6-conf
  depth fallback mandatory. ChainLocks make blocks reorg-final when present
  (verify per block, fail-closed). Gate: show "locked" on the islock (~3 s),
  book only on a chainlocked block or ≥6 confs — no verified production acceptor
  books on islock alone (Kraken: 2 plain confs). Payer leg verified at source:
  plain BIP-21 `dash:` URI round-trips through Dash Wallet Android; never emit
  `req-IS` (voids the URI). Watch-only via Dash Core v21+ descriptor wallets.
  **Honesty note: Dash has no receiver-side privacy** (transparent chain;
  CoinJoin is payer-side opt-in, and Kraken refuses mixed-source deposits) —
  its priority slot rests on InstantSend counter-UX, not privacy. Remaining:
  testnet bench, explorer fallback, third-party wallet parity.
  [TOOLING.md](TOOLING.md).
- **2026-07-04** — **Zcash rail research** (pass: 28 confirmed, 2 refuted).
  The last priority privacy rail is now verified. Zcash is structurally unique:
  detection is **local trial-decryption** of compact blocks (ZIP-307), not
  address-watching — the server never learns which outputs match (strongest
  privacy model of any rail). Per-sale attribution is the **diversified-address
  pattern** (ZIP-316): the IVK + a diversifier produces up to 2⁸⁸ unlinkable
  addresses that all decrypt with the same key — no HD derivation, no xpub, no
  gap limit, no index reservation (cleaner than Bitcoin/Dash/Bitcoin HD or
  Monero subaddresses). Payer leg verified at source: ZIP-321
  `zcash:<addr>?amount=<ZEC>&memo=<base64url>` round-trips in Ywallet (emits and
  scans) and Zashi (scans, but URI-scheme deeplinks not auto-opened — security-
  audit decision; QR scan parity is fine for POS). Gate: `confs >= 10` (protocol
  lore, same convention as Monero's 10-block unlock). `nExpiryHeight` (ZIP-203)
  is the built-in rate-lock (40 blocks / ~50 min default). **Timing hazard**:
  zcashd is deprecated (2025), migrating to the Z3 stack (zebrad + Zaino +
  Zallet) — Zallet is v0.1.0-alpha.4, not production-ready; the lightwalletd +
  SDK path (stable, works with both zcashd and zebrad) is the build target.
  **Honesty note: Zcash is the only priority rail with receiver-side privacy**
  — the merchant's address, amounts, and history are not on a transparent chain.
  Remaining: testnet bench (scan latency, trial-decryption e2e, 10-conf gate,
  ZIP-321 round-trip), iOS payer parity, mainnet self-pay.
  [TOOLING.md](TOOLING.md).
- **2026-07-03** — **Tari payer leg verified** (wallet source as evidence):
  Aurora Android prefills address+amount from the RFC-0154 deeplink
  (`tari://<network>/transactions/send?tariAddress=&amount=<µT>`); the wallet
  ENFORCES the URI's network authority (payer-side mode safety stronger than
  ERC-681); bare-address QRs degrade to add-contact — never emit them; per-sale
  ids ride inside the RFC-0155 address (keep 8–16 B). The reference build's
  Minotari URI was corrected to the RFC-0154 form. Rail status: both legs
  verified; esmeralda bench + mainnet self-pay remain before mainnet.
  Full inventory of the `crypto-pos-terminal` pre-alpha (real chain logic, 1,011
  host tests, but doc-only provenance — knowledge treated with caution). The
  persona-independent scaffolding distilled into [LOGIC.md](LOGIC.md), evidence-
  tagged per source, so the native build is assembly, not invention.

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
