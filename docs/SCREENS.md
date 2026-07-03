# Screen specifications

The **individual shell is the product** (see [DIRECTION.md](DIRECTION.md)). The build
implements the seven-surface target in [LAYOUT.md](LAYOUT.md) — exact safety copy
lives in its copy deck; this file describes each screen's behavior. The retail
section at the bottom is a preserved exploration — reference material only.

## Individual shell (the current build — 4 tabs)

Defaults: mode **testnet**, merchant "CryptoPOS Terminal", ledger seeded with one
row of every shape History teaches with (see [PAGES.md](PAGES.md)). Tabs: Coins ·
Live Tracker · Sale History · Terminal Config.

### 1 · Coins *(home — LAYOUT A "Charge")*
The keypad IS the home — no gallery step in the charge path.
- **Sticky rail chip** — "Ethereum · USDC · last used / tap to change"; always
  reopens on the last-used rail. Tap opens the **chain/asset bottom sheet**: rail
  grid with Live/Demo dots; NEEDS-SETUP rails (Polygon, Tari L1) render disabled
  with their reason — never silently chargeable; multi-token chains add an asset
  step (Ethereum → USDC | ETH).
- **Amount zone** — fiat primary, live crypto equivalent beneath (per-token
  decimals; QR amounts equal on-screen amounts digit-for-digit).
- **Rate line** — "1 USDC = $1 · rate locks for 15 min when you charge"; a
  subtotal/tax subline appears when tax is set.
- **Fee disclosure** — always on-surface, per-rail estimate: "No processor fee.
  Network fee ≈ $1.20, paid by the customer's wallet, set by network demand
  right now."
- **Keypad** — 3×4 (1-9, C, 0, .) + full-width Correction (backspace) bar; entry
  blocked while a payment is in flight.
- **Charge button** — two lines: mode verb ("CHARGE $12.50 — TEST" / mainnet
  "CHARGE $12.50" / demo "SIMULATE CHARGE $12.50") over "· LOCKS RATE 15:00".
  Mode-family fill — only mainnet wears live green. Disabled at $0, in flight, or
  on a blocked rail (the subline then names the setup reason).
- **Donation link** — "Donation code (address only, untracked)" → address-only QR
  in the Tracker; never enters the ledger.

### 2 · Live Tracker *(LAYOUT B–E)*
The payment state machine's home; nav badge shows **LIVE** while in flight. Idle
prompts to ring up a sale. The **Consensus Sandbox** card mocks the feed (fast/slow
settle, under/overpay, gas / double-spend fail, expire-now; on end screens, a 24 h
"Late payment") so every state below is reachable.
- **Awaiting (B)** — "Rate locked: 1 BTC = $64,000" header + ◔ 15:00 countdown
  (error-red for the final 60 s, expiring to E); white QR card with corner mode tag
  (TESTNET / DEMO / MAINNET) plus non-mainnet ribbons ("TEST — coins worthless" /
  "SIMULATED — not payable"; mainnet gets the tag only — nothing overlays a live
  code); crypto-bold amount; address chip ("To: bc1q 8f3k …… x0wl 4u2e" + Copy)
  with the verbal-check line; push-only pulse status; fee attribution; pre-send
  notice (SOUPS verbatim); "Cancel sale — free until they send" — confirm-gated
  and pre-broadcast only (gone once the customer sends).
- **Detected → Confirming (C)** — DETECTED→CONFIRMING→SETTLED stepper; detected
  definition ("Not money yet…"); amount check declared at detection (exact / short
  / over); block strip with real block numbers ("your tx / mined ✓ / mining…");
  confirmations redefined ("n of N blocks mined on top of yours… nobody 'approves'
  it"); progress bar + per-chain ETA. Targets: BTC/ETH/XMR 3 · SOL/POL 2 · Tari 1.
  Locked-rate reminder; "Can't cancel" note; **Stop watching** books the flight as
  NEEDS REVIEW (full snapshot on the row) and jumps to History.
- **Settled receipt (D)** — thermal card (light paper in both themes): merchant +
  "Jul 2, 2026 · 10:07 AM"; Total / Paid; rate provenance ("$64,000/BTC — locked at
  charge, 10:02 AM"); dual fee lines (processor $0.00 AND network fee, always
  both); chain · network · provenance line; block-anchored settlement line; txid
  chip + publicness line; income stamp — the full equation "INCOME — MAINNET ·
  REAL · CONFIRMED" on mainnet, else hatched "NOT INCOME — TESTNET/DEMO" plus a
  diagonal PRACTICE watermark (Share copies the receipt as text; band and
  watermark ride along); refund footer. Print (toast) / Share / New sale.
- **Failed / expired (E)** — one frame, runtime swaps: clean "◷ CODE EXPIRED" (the
  EXPIRED row books immediately) with one-tap "RE-CHARGE $12.50 AT NEW RATE — TEST"
  (same sale, same rail, fresh 15:00 → Awaiting); underpaid ("PART-PAID BEFORE
  EXPIRY" panel — Request balance issues a second, separate code for the
  difference; Accept short books what arrived; Close quarantines the partial);
  overpaid (invoiced settles, surplus books NEEDS REVIEW until returned); "✕ FAILED
  ON NETWORK" (gas / double-spend; row books FAILED). All carry the 24 h-watcher
  copy; a caught late payment lands in History as NEEDS REVIEW.

### 3 · Sale History *(LAYOUT F)*
- Header: **CSV** (fixed columns: timestamp, chain·token, crypto amount, locked
  rate, network, provenance, status — the same words shown on-screen) and **Lock**
  (view-only PIN gate; offers to set a PIN if none — taking payment never needs it).
- **Reconciliation card** — "INCOME $128.50 · 2 sales" over the contract "mainnet +
  real + settled, only; no other row can ever move here", then the itemized
  not-income line (testnet $ · demo $ · n failed · n expired · n need review; only
  non-zero items print).
- **Filter chips** — All / Income / Not income / Failed (failed = FAILED + EXPIRED);
  one chronological list, newest first.
- **Row anatomy, 3 lines** — (1) status word (SETTLED / NEEDS REVIEW / EXPIRED /
  FAILED / REFUND) + chain·token + charge-time NETWORK·PROVENANCE badge; (2) time ·
  crypto @ rate locked, or the row's reason; (3) txid chip + copy (EXPIRED shows
  "—") + amount — green "+$" only when income, "−$" on REFUND, "$0.00·NO SALE" on
  dead rows, else "$…·NOT INCOME".
- **NEEDS REVIEW actions** — "Review: book / return" opens the three-way dialog:
  book at the locked rate / book at today's value / return as a NEW outbound
  payment (appends a REFUND row with its own tx). Stopped-watch rows carry
  **Resume**, reopening the Tracker mid-ladder from the saved snapshot. Every
  resolution APPENDS; the held row is only marked resolved, never rewritten.

### 4 · Terminal Config
Home cards → sub-screens, unchanged by the rebuild except one new row:
- **Mode & Money** — DEMO / TESTNET / MAINNET (Mainnet via typed-`MAINNET` dialog);
  **new "First Mainnet Charge" card re-reads the one-time interstitial**; baseline
  currency, sales tax, tips toggle.
- **Payment Rails** — price-feed banner; per-rail accordion (READY / NEEDS SETUP,
  receiving address, watcher status).
- **Store** — merchant name (receipts); cashier-screen card notes catalog/cart is
  retail-only.
- **Security & Books** — operator PIN (set / lock / remove), books pointer + clear
  ledger, chain-status heights, danger zone ("burn down the store", typed-`RESET`).
- **Go Live — Mainnet** — per-rail readiness checklist; blocked (only Ethereum and
  Solana pass out of the box).

### Mode chrome *(LAYOUT G)*
The mode strip rides under the app bar on Coins, Tracker and History (Config keeps
the older subtitle/mainnet-bar chrome): testnet "TEST NETWORK — coins have no value
· never income" (blue) · demo "DEMO — simulated, SIM- hashes, never income" ·
mainnet red "REAL MONEY — payments are public, permanent, no chargebacks". Mode is
captured at charge time — QR tag, address flavor (testnet/SIM-), receipt stamp and
ledger row all read the captured mode, never the current one. The first MAINNET
charge per session interposes the interstitial ("Real money from here on…");
"I understand" releases the pending charge. The app-bar **mode pill previews
chrome only** (G[1]): a tap cycles a *marked* preview through the other modes —
the pill reads "Previewing Mainnet" with a dashed outline, the strip wears the
previewed band with a dashed PREVIEW chip on its right edge (the strip copy
itself stays verbatim) — and only the pill and the strip follow it; charge
verb/fill, QR, ribbons and receipts keep the real mode. Tapping through back to
the real mode, ~4 s of inactivity, or any charge-affecting action reverts it;
the real switch stays behind Config's typed-`MAINNET` gate. Plus: navigation
drawer, and the first-run Setup wizard (drawer → Setup wizard).

### Known gaps (documented, not yet fixed)
- Removing the operator PIN from Security doesn't require entering the PIN first.
- Dialog/drawer/sheet scrims cover only the viewport (`#overlay-root` still sits
  inside `.viewport`; the bottom nav is a sibling) — the nav stays tappable under
  any scrim, including the new chain/asset sheet.
- The product/catalog code (PRODUCTS, add-product dialog, cart/subtab handlers) is
  now fully unreachable dead code — nothing renders a way into it (catalog is
  reserved for a retail build).
- Tab labels are long-form ("Live Tracker", "Sale History", "Terminal Config")
  where LAYOUT.md's mocks use the short forms (Tracker · History · Config).
- The donation QR carries no on-card mode tag or ribbon — the mode strip and the
  testnet/SIM- address flavor carry the network instead.
- The keypad draft persists after sales that end away from the keypad (late-payment
  booking, Stop watching) — returning to Coins shows the old amount still typed.

---

## Retail exploration (2026-07-01) — reference only, NOT a plan

A 5-tab retail shell (Sale · Payment · History · Products · Settings) was fully
implemented once, screenshot-verified in both themes, reviewed, then **discarded by
decision** ("individual only — retail isn't defined yet"). Specs kept for whenever
retail is actually defined. Frame 390×844; exploration defaults: mode DEMO, merchant
"Counter Coffee", tax 8%.

**Sale (home):** big amount display + ≈crypto line · KEYPAD|PRODUCTS segmented ·
4×3 pill keypad (1-9 / . 0 ⌫) · always-visible cart (qty steppers, custom amount,
tax line, total) · rail selector (dot + label) beside one **Charge $X** button.

**Payment:** idle empty state · awaiting = back + "Awaiting Payment" + red Cancel,
rail chip, ~240px white QR card, crypto bold + USD, address + Copy, green pulse
"Waiting for the customer to scan…", demo-controls card · detected → confirming (n/N)
→ thermal receipt / failure card · LIVE nav badge.

**History:** green TODAY hero (sum · count · crypto) · MAINNET·REAL | DEMO/TEST split ·
rows: coin disc, "Chain TOKEN", relative date ("Today 9:41 AM" / "Yesterday" /
"Jun 28") + memo, +$, DEMO/CONFIRMED/FAILED badge · Export text button · seeded with
3 demo rows.

**Products:** "+" app-bar button (add dialog: name/price/category/icon) · live search ·
chips All/Food/Drinks/Other · 2-col grid (icon disc, name, cat, price, Add/stepper).
Seed: Coffee 4.50 · Latte 5.50 · Pastry 3.00 · Juice 4.00 · Water 2.00 · Cookie 2.50.

**Settings (flat):** MODE 3-way (typed-MAINNET gate) · rails Bitcoin / Ethereum USDC /
Solana USDC READY + "Add advanced rail" toggle (ETH, SOL, XMR) · Merchant row (name +
tax dialog) · greyed Retail Tools (printer, customer display, staff — "Coming soon") ·
Operator PIN row (remove requires current PIN).

**Figma:** file `NNdVeKNRXBMkCQmzGu1TTH` holds only 2 of these frames (Sale `2:2`,
Payment `2:3`); this document supersedes it.
