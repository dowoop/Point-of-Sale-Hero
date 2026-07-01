# Behavior: payments, ledger, safety

The persona-independent scaffolding (see [DIRECTION.md](DIRECTION.md)). Any future
shell — retail or otherwise — drives exactly this machinery; it must never fork.

## Payment state machine

```
Idle → Awaiting (QR shown) → Mempool → Confirming (n/N) → Settled (receipt)
                                                     └───→ Failed
        (Donation: address-only, untracked, terminal until Done — never booked)
```

Invariants:

- Every `setTimeout` is registered in `S.timers` via `after()`; **cancel/reset clears
  them all**, so no transition can fire on a dead checkout.
- `settle()` / `fail()` only proceed from `confirming`/`mempool`; a sim can only start
  from `awaiting` and only **once** (`simStarted` guard) — double-clicks cannot
  double-book the ledger.
- Confirmations required per chain: BTC / ETH / XMR **3** · SOL / POL **2** ·
  Tari **1**.
- Sandbox sim scripts (ms): fast 300→500→(280×confs) · slow 700→1300→(1300×confs) ·
  out-of-gas 400→900→fail · double-spend 400→900→fail.
- The payment object snapshots everything at charge time: chain/asset, amounts,
  address, tx-hash prefix (`SIM-` in demo, `0x` otherwise), and **the mode** —
  changing mode mid-flight cannot reclassify the sale.
- Keypad entry is blocked while a payment is active (`onKey` returns unless idle).

## Rails & QR URIs

QR content is a **real, scannable** payment URI whose amount must equal the on-screen
figure:

| Rail | URI format |
|---|---|
| Bitcoin BTC | `bitcoin:<addr>?amount=<btc 8dp>` (BIP-21) |
| Solana USDC | `solana:<addr>?amount=<usd 2dp>&spl-token=<USDC mint>` (Solana Pay) |
| Solana SOL | `solana:<addr>?amount=<sol 6dp>` |
| Ethereum / Polygon USDC | `ethereum:<USDC contract>@<1\|137>/transfer?address=<addr>&uint256=<µUSDC>` (EIP-681) |
| Ethereum ETH / Polygon POL | `ethereum:<addr>@<chainId>?value=<wei>` — wei built from **µETH × 10¹²** so small amounts don't round to zero |
| Monero XMR | `monero:<addr>?tx_amount=<xmr 6dp>` |
| Tari | `tari:<addr>?amount=<usd 2dp>` |
| Donation | scheme + address only (no amount) |

Receiving addresses are obvious SAMPLE placeholders — scannable, never payable — and
every QR screen says so. Rates are fixed demo constants (BTC 64000 · ETH 3500 ·
SOL 150 · POL 0.55 · USDC 1 · XMR 165 · XTR 0.12 · XTM 0.02).

## The honest ledger

Row: `{id, ts "YYYY-MM-DD HH:MM:SS", chainKey, token, usd, crypto, rate,
status CONFIRMED|FAILED, provenance REAL|SIMULATED, network MAINNET|TESTNET,
txHash, memo}`.

- **Income = Mainnet + REAL + Confirmed. Nothing else, ever.** Testnet/demo sales are
  recorded but permanently "not income". The Today card and the reconciliation card
  apply the same filter.
- `provenance`/`network` derive from the **mode captured at charge time** (`p.mode`).
- Failed payments are recorded too (never summed as income).
- Export: quoted CSV, fixed column order, `cryptopos-ledger.csv`.
- In-memory only (session); the ledger starts empty. Only the theme persists
  (`posh-theme` in localStorage).

## Modes & safety

| Mode | Meaning | Gate |
|---|---|---|
| **testnet** *(default)* | watches real test networks, valueless coin, never income | — |
| **mainnet** | real money | typed `MAINNET` in Terminal Config; red banner while active |
| **demo** | sealed sandbox, `SIM-` hashes | — |

- The app-bar **mode pill cycles modes directly** — it's a chrome *preview*. The
  Terminal Config path is the gated one; a payment's booking is safe either way
  because the mode is captured at charge time.
- Operator PIN gates **viewing history only** — taking a payment never requires it.
  *(Known gap: removing the PIN doesn't currently ask for it.)*
- "Burn down the store" requires typing `RESET`.

## Render-loop conventions (for anyone editing app.js)

- Single state object `S` → full `innerHTML` re-render via `render()`; one delegated
  click handler dispatches on `data-act` — every emitted `data-act` needs a `handle()`
  case and vice versa.
- Focus-sensitive text inputs (the gallery amount, typed `MAINNET`) update through the
  delegated `input` listener with targeted DOM writes — never a full render. Any new
  dialog with typed input must follow this pattern or stash values in `S.dialog`
  before re-rendering.
- All user-entered strings pass through `esc()` before hitting a template literal.
- Timers only via `after()` so cancel/reset can clear them.
