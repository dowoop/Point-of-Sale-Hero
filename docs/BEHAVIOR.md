# Behavior: payments, ledger, safety

The persona-independent scaffolding (see [DIRECTION.md](DIRECTION.md)). Any future
shell — retail or otherwise — drives exactly this machinery; it must never fork.
Every safety-critical string on these surfaces is the [LAYOUT.md](LAYOUT.md) copy
deck, verbatim — change copy there first, then here.

## Payment state machine

```
idle → awaiting (QR + 15:00 rate lock) → mempool (DETECTED) → confirming (n/N) → confirmed (SETTLED receipt)
         │                                  │                    │
         │                                  ├─ gas / double-spend fail ────→ failed        (FAILED row)
         │                                  │                    └─ overpay → expired·over (CONFIRMED + NEEDS_REVIEW surplus)
         │                                  └─ lock ends part-paid ────────→ expired·under (books on the operator's choice)
         └─ countdown reaches 0:00 ────────────────────────────────────────→ expired·clean (EXPIRED row, $0)
    (donation: address-only, untracked, terminal until Done — never booked)
```

- `startCheckout()` snapshots **everything at charge time**: chain/asset, `usd`,
  `crypto` (rounded **once** to the token's precision — see QR parity), `rate`,
  `rateLockEnd` (now + 15 min), `provenance` REAL|SIMULATED, the mode-aware
  `address`, per-chain `required` confirmations (**BTC / ETH / XMR 3 · SOL / POL 2 ·
  XTR / XTM 1**), `txHash` (`SIM-` prefix in demo, `0x` otherwise) and **the mode**.
  Nothing that happens mid-flight can reclassify the sale.
- **Rate-lock countdown** — a self-rescheduling 1 s `after()` chain reading
  `payment.rateLockEnd`. Each tick writes only the `#lock-countdown` node (never a
  full render), toggles `.urgent` (error color) inside the final 60 s, **stops itself**
  the moment the state leaves `awaiting`, and at 0:00 calls `expireClean()`: the
  EXPIRED row books immediately (`usd: 0`, reason `no payment within rate lock`) —
  E's "the EXPIRED row already exists". An expiry renders no txid (History shows "—").
- **mempool** (`toMempool(received)`, only from `awaiting`) records what was actually
  seen; screen C's amount check declares exact / under / over from it.
- **confirming** (`stepConfirm`) captures `blockAt` (chain tip + 1) on first entry and
  ticks `confs`; the block strip, progress bar and per-chain ETA render from those.
  `settle()` / `failNet()` only proceed from `mempool`/`confirming`.
- **confirmed** — books CONFIRMED, renders SETTLED + the thermal receipt.
- **expired / failed** — one screen-E frame; runtime swaps via `payment.endKind`
  (`clean` | `under` | `over`) or `state === "failed"`:
  - *clean* — re-charge (same sale, same rail, fresh 15:00, back to Awaiting; the new
    charge captures the **current** mode, so the first-MAINNET gate applies) or close.
  - *under* — nothing books until the operator chooses: **Request balance** (books the
    received part CONFIRMED at the locked rate, then opens a second, separate payment
    for the difference), **Accept short** (books received CONFIRMED; `invoicedUsd`
    keeps what was asked), or **Close sale** (quarantines the received money as
    NEEDS_REVIEW `part-paid before expiry — unresolved` — never silently dropped).
  - *over* — the invoiced amount books CONFIRMED; the surplus books NEEDS_REVIEW
    `overpaid — surplus held for return`.
  - *failed* — books FAILED (`ran out of gas` / `double-spend conflict`); fee truth
    kept in the copy, no reversal implied.

### Stop watching → resume

- **Stop watching** (mempool/confirming only) books NEEDS_REVIEW
  `watching stopped at N of M` with a **full flight snapshot** in `row.resume`,
  clears timers, returns to idle and jumps to History.
- **[ Resume ]** on that row marks it `resumed` (the row stays — the ledger never
  rewrites; its Resume is spent), restores the snapshot as the live payment and
  re-enters the flight **continuing from the saved confs** (a snapshot at full
  confirmations goes straight to its outcome). When it settles, the new CONFIRMED
  row reuses the **same txHash** — it is the same transaction, observed again.

### Late payment

The 24 h watcher (sandbox `late`, only from expired/failed) books NEEDS_REVIEW
`arrived after the rate lock` with a **freshly minted txHash** (a late tx is its own
transaction), then returns to idle and lands on History. Never silently booked at a
dead rate.

### Review resolutions (append-only)

`Review: book / return` on a NEEDS_REVIEW row opens the three-way choice. Every
choice **appends** a row via `bookFromRow()` — mode / provenance / network / rate ride
from the held row (i.e. from charge time), `reviewOf` links back to it, and the
original row only gains a `reviewed` marker; it never moves or rewrites:

| Choice | Appended row |
|---|---|
| Book at the locked rate | CONFIRMED at the held `rate`, same `txHash`, reason `review: booked at the locked rate` |
| Book at today's value | CONFIRMED at the current market rate (usd recomputed), same `txHash`, reason `review: booked at today's value` — History drops the word "locked" on this row |
| Return as a NEW payment | REFUND row, **new minted txHash** (`SIM-`/`0x` per the held row's mode), reason `new outbound payment`, shown as −$ |

txHash rule of thumb: resolutions that re-book the *same* money reuse the held hash;
anything that is a *new* transaction (return, late arrival, balance request) mints one.

## Rails & QR URIs

QR content is a **real, scannable** payment URI whose amount equals the on-screen
figure, built from the mode captured at charge time — the QR never encodes a network
that contradicts the mode:

| Rail | URI format (mainnet · testnet) |
|---|---|
| Bitcoin BTC | `bitcoin:<addr>?amount=<btc 8dp>` (BIP-21); testnet swaps in the `tb1q`-flavored sample address |
| Solana USDC | `solana:<addr>?amount=<usdc 6dp>&spl-token=<mint>` (Solana Pay); testnet uses the devnet sample mint (Solana Pay has no chain id — the addresses differ instead) |
| Solana SOL | `solana:<addr>?amount=<sol 6dp>` |
| Ethereum / Polygon USDC | `ethereum:<USDC contract>@<chain_id>/transfer?address=<addr>&uint256=<µUSDC>` (ERC-681, token transfer in atomic units) |
| Ethereum ETH / Polygon POL | `ethereum:<addr>@<chain_id>?value=<wei>` — wei built from **µETH × 10¹²** so small amounts don't round to zero |
| Monero XMR | `monero:<addr>?tx_amount=<xmr 6dp>` |
| Tari XTR / XTM | `tari:<addr>?amount=<usd 2dp>` |
| Donation | scheme + address only (no amount); EVM donation codes still carry `@chain_id` — a bare `ethereum:` URI would read as mainnet |
| **Demo, any rail** | `SIM-PAYMENT:<SIM-addr>?amount=…&asset=…` (donation: `SIM-DONATION:…`) — simulated data, never a payable URI; the encoded amount still equals the screen |

- **EVM chain ids per mode** (`CHAIN_IDS`): mainnet `@1` (Ethereum) / `@137` (Polygon);
  testnet `@11155111` (Sepolia) / `@80002` (Amoy). Chosen from `p.mode`, never `S.mode`.
- **Amount parity**: `crypto` is rounded once at charge time to the token's precision
  (`DEC`: BTC 8 · ETH/SOL/POL/USDC/XMR 6 · XTR/XTM 2); every screen and the QR format
  through the same `decOf()`, so URI amount === on-screen amount, digit for digit.
- Receiving addresses are obvious SAMPLE placeholders per mode — mainnet-flavored,
  testnet-flavored (tb1q / Sepolia / Amoy / devnet / stagenet), `SIM-`-prefixed in
  demo — scannable, never payable. Rates are fixed demo constants (BTC 64000 ·
  ETH 3500 · SOL 150 · POL 0.55 · USDC 1 · XMR 165 · XTR 0.12 · XTM 0.02).

## The honest ledger

Row: `{id, ts "YYYY-MM-DD HH:MM:SS" (wall clock — matches the receipt), chainKey,
token, usd, crypto, rate, status CONFIRMED|NEEDS_REVIEW|EXPIRED|FAILED|REFUND, mode,
provenance REAL|SIMULATED, network MAINNET|TESTNET|DEMO, txHash, memo, invoicedUsd}`
plus optional `reason`, `resume`/`resumed` (stopped watch), `reviewed`, `reviewOf`.

- **Status vocabulary** — stored statuses stay stable; `STATUS_WORDS` maps them to the
  display words: CONFIRMED → **SETTLED**, NEEDS_REVIEW → **NEEDS REVIEW**, the rest
  as-is. Screen, filter logic and CSV all speak the display words.
- **Income = Mainnet + REAL + Confirmed. Nothing else, ever.** One function,
  `isIncome()`, is the whole rule — it drives the reconciliation card, the Income
  filter chip, and the green "+" amount (the only combination that ever earns a "+").
  The receipt stamp prints the same equation: `INCOME — MAINNET · REAL · CONFIRMED`
  only when all three hold, `NOT INCOME — TESTNET/DEMO/SIMULATED` otherwise (a
  mainnet charge on a simulated rail is still not income — the trio is genuine).
- `mode`/`provenance`/`network` come from **charge time** (`p.mode`); `invoicedUsd`
  keeps what was asked even when `usd` books differently (accept-short, expiry $0).
- Amount display: income `+$` green · held `$…·NOT INCOME` amber, no "+" · EXPIRED
  and FAILED `$0.00·NO SALE` · REFUND `−$`.
- The not-income line itemizes by reason (testnet · demo · failed · expired · need
  review) and never sums upward; resumed/reviewed rows leave the review count.
- **The ledger only appends.** `bookRow()` is the single appender; resolutions append
  new rows and mark the original (`reviewed`/`resumed`) — no row is ever rewritten,
  moved or repriced.
- Export: quoted CSV, fixed columns `timestamp, chain·token, crypto amount, locked
  rate, network, provenance, status` (display status words — exports reconcile
  against the screen 1:1), `cryptopos-ledger.csv`.
- In-memory only. `seedLedger()` seeds one of each row shape at init and on stage
  Reset (income, testnet settle, both quarantines incl. a resume snapshot, expiry,
  failure, demo sale, refund); **Burn Down the Store** (typed `RESET`) empties it —
  the honest "INCOME $0.00 · 0 sales" state. Only the theme persists (`posh-theme`
  in localStorage).

## Modes & safety

| Mode | Meaning | Gate |
|---|---|---|
| **testnet** *(default)* | watches real test networks, valueless coin, never income | — |
| **mainnet** | real money | typed `MAINNET` in Terminal Config; solid red strip while active; first-charge interstitial |
| **demo** | sealed sandbox, `SIM-` hashes and pseudo-URIs | — |

- **The mode captured at charge time drives everything on the payment**: QR chain id
  and address flavor, `SIM-` prefixes, the on-card mode tag and ribbon, the receipt's
  network line / booking stamp / PRACTICE watermark, and the row's badges. Every
  in-flight surface reads `p.mode`, never `S.mode` — **a mid-flight mode flip
  reclassifies nothing.**
- **Mode strip** rides under the app bar on every payment surface (Coins, Tracker,
  History); Config keeps the older subtitle/bar chrome. Strings verbatim from the
  copy deck; testnet/demo strips carry "never income" on their own face.
- **First-MAINNET interstitial** — the first charge (or re-charge) after switching to
  MAINNET interposes "Real money from here on. No bank to call. A refund is a new
  payment from you."; the charge proceeds only after *I understand*. The ack is
  **session-scoped** (`firstMainnetAck`, reset by stage reset — no new persistence);
  re-readable from Config → Mode & Money.
- The app-bar **mode pill previews chrome only** (G[1]). A tap cycles
  `S.modePreview` from the real mode's successor; while previewing, only the pill
  ("Previewing Mainnet", dashed outline) and the mode strip (dashed PREVIEW chip on
  its right edge; the strip copy stays verbatim) wear the previewed family — charge
  verb/fill, QR, ribbons, receipts and booking keep reading `S.mode` / charge-time
  `p.mode`. Tapping through back to the real mode, the ~4 s `after()` auto-revert,
  any charge-affecting act, or stage reset clears it. `S.mode` changes **only** via
  Terminal Config → Mode & Money (typed `MAINNET` for mainnet).
- Charge commit chrome follows the mode at charge: only mainnet wears the live
  (green) fill; testnet/demo wear their mode-family fills and their own verbs
  ("— TEST" suffix / "Simulate charge"). NEEDS-SETUP rails render disabled with
  their reason in the sheet **and** on the button — never silently chargeable.
- Operator PIN gates **viewing history only** — taking a payment never requires it.
  *(Known gap: removing the PIN doesn't currently ask for it.)*
- "Burn down the store" requires typing `RESET`.

## Timers

Everything time-driven goes through `after()`, which registers in `S.timers`:

- `clearTimers()` runs on: a new charge, checkout end (Done / cancel / close-sale /
  accept-short), Stop watching, Resume, the late-payment booking, and stage reset —
  **no transition can fire on a dead checkout.**
- The 1 s countdown chain additionally stops itself when the state leaves `awaiting`,
  and `expireClean()` defers its render while a dialog is open (a typed confirmation
  must not be wiped mid-keystroke).
- The sandbox `expire` trigger only shortens `rateLockEnd` — expiry then arrives
  through the same natural countdown path the real 15:00 would take.

## Sandbox triggers

The Consensus Sandbox card is the demo/testnet way to reach **every** state — no real
transactions happen on this device. While a code is live (`awaiting` only, and only
**once** per payment — the `simStarted` guard means double-clicks cannot double-book):

| Trigger | Script (ms) | Exercises |
|---|---|---|
| `fast` | 300 → mempool → 900 → 280/conf | detected → confirming → SETTLED |
| `slow` | 700 → mempool → 1600 → 1300/conf | same ladder, readable pace |
| `gas` | 400 → mempool → 1200 → fail | FAILED ON NETWORK (out of gas) |
| `double` | 400 → mempool → 1200 → fail | FAILED ON NETWORK (double-spend) |
| `under` | 400 → detect 76.8% → 2600 → lock ends | screen E part-paid swap + its three actions |
| `over` | 400 → detect 120% → 1400 → 700/conf | over amount-check, settle + surplus quarantine |
| `expire` | cuts `rateLockEnd` to ≤ 1.2 s | natural clean expiry, EXPIRED row |
| `late` | *(on the E surface)* books instantly | 24 h watcher → NEEDS_REVIEW quarantine |

## Render-loop conventions (for anyone editing app.js)

- Single state object `S` → full `innerHTML` re-render via `render()`; one delegated
  click handler dispatches on `data-act` — every emitted `data-act` needs a `handle()`
  case and vice versa.
- Focus-sensitive typed inputs: the delegated `input` listener does targeted DOM
  writes for the typed-`MAINNET` field (enables its button live); other typed dialogs
  (PIN, `RESET`) read their field at confirm time via `fieldVal()`. Any new dialog
  with typed input must follow one of these patterns or stash values in `S.dialog`
  before re-rendering. Per-second ticks (`#lock-countdown`) are targeted writes too.
- All user-entered strings pass through `esc()` before hitting a template literal.
- Timers only via `after()` so cancel/reset can clear them.
- Debug hooks: `window.__POSH__` (the state), `__POSH_URI__(p)` (QR-contract
  assertions), `__POSH_RECEIPT_TEXT__()` (Share-copy assertions).

## Invariants

- The scaffolding — state machine, rails + real QR encoding, the honest ledger, mode
  safety — stays **persona-independent**; no shell may fork it.
- Tokens live in `styles.css :root` — every color defined for **both** themes; no hex
  in components when a token exists.
- Every class emitted from an app.js template exists in styles.css.
- `esc()` every user string before it reaches a template.
- Timers only via `after()`; cancel/reset/stop/resume clear them all.
- **QR amount parity**: the URI amount equals the on-screen amount — one rounding, at
  charge time, through `decOf()`.
- **The income rule**: only Mainnet + REAL + Confirmed is income (`isIncome()`, one
  place), and a payment books under the **mode captured at charge time** — a
  mid-flight mode flip reclassifies nothing.
- The ledger only appends: resolutions add rows (`reviewOf` linkage); originals only
  gain `reviewed`/`resumed` markers.
- `settle()`/`failNet()` only proceed from `mempool`/`confirming`; a sim starts only
  from `awaiting` and only once; keypad entry is blocked while a payment is in
  flight — nothing can double-book.
- Only mainnet ever wears the live (green) commit fill, and nothing ever overlays a
  payable QR's code modules.
