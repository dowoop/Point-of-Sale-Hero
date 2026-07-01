# Screen specifications

The **individual shell is the product** (see [DIRECTION.md](DIRECTION.md)). The retail
section at the bottom is a preserved exploration — reference material only.

## Individual shell (the current build — 4 tabs)

Defaults: mode **testnet**, merchant "CryptoPOS Terminal", ledger starts empty.

### 1 · Coins *(home)*
- Today card (booked income only: mainnet + REAL + confirmed).
- Section head, then a **2-column gallery** of accepted chains (brand disc, name,
  ticker, Live/Demo status dot): Bitcoin, Ethereum, Solana, Polygon, Monero, Tari L2,
  Tari L1.
- **Pick chain → pick asset** (e.g. Ethereum → USDC | ETH) → **the checkout builder**:
  - sub-cart card: chosen network/asset ("tap to change"), Total Amount Due, live
    exchange-rate box with crypto equivalent, tax note when set, network-fee line;
  - keypad (3×4: 1-9, C, 0, .) + a Correction (backspace) bar;
  - **GENERATE PAYMENT QR** (green when the rail is live) and an address-only
    **donation code** link (untracked).

### 2 · Live Tracker
The payment state machine's home. Idle empty-state prompts to ring up a sale.
Awaiting shows the real QR, amount, address chip with Copy, and the **Consensus
Sandbox** card (Fast / Slow settle · Out-Of-Gas / Double-Spend fail). Then mempool →
confirming (n/N ring + progress) → **thermal receipt** (Print / Share / continue) or a
failure card. Cancel is confirm-gated, with different copy before vs. after broadcast.
The nav badge shows **LIVE** while a payment is in flight.

### 3 · Sale History
Ledger header with CSV export + clear; reconciliation card (REAL income vs.
"not income — testnet/sim"); reversed transaction rows: chain:token, provenance +
network badges, status word, timestamp, memo, crypto @ rate, TxID with copy, +$ amount.
Optionally locked behind the operator PIN (viewing only).

### 4 · Terminal Config
Home cards → sub-screens:
- **Mode & Money** — DEMO / TESTNET / MAINNET choice (Mainnet via typed-`MAINNET`
  dialog), baseline currency, sales tax, tips toggle.
- **Payment Rails** — price-feed banner, per-rail accordion rows (READY / NEEDS SETUP,
  receiving address, watcher status).
- **Store** — merchant name (receipts). *(The cashier-screen card notes a product
  catalog/cart would arrive with a retail build.)*
- **Security & Books** — operator PIN (set / lock / remove), chain-status tips,
  books pointer, danger zone ("burn down the store", typed-`RESET` gate).
- **Go Live — Mainnet** — per-rail readiness checklist; blocked until rails are fixed.

Plus: app-bar mode pill (tap to *preview* Testnet / Mainnet / Demo chrome), navigation
drawer, and the first-run **Setup wizard** (drawer → Setup wizard).

### Known gaps (documented, not yet fixed)
- Removing the operator PIN from Security doesn't require entering the PIN first.
- Dialog/drawer scrims cover only the viewport — the bottom nav stays tappable
  underneath.
- The add-product dialog exists but nothing renders a button to open it (catalog is
  reserved for a retail build).

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
