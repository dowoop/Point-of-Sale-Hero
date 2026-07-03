# Pages — map, content, and defaults

One-glance reference for the **individual shell** (the product — see
[DIRECTION.md](DIRECTION.md)). Derived from [SCREENS.md](SCREENS.md) (full specs),
[LAYOUT.md](LAYOUT.md) (the layout/copy contract) and the `S` state object in
`app.js` (the defaults' source of truth if they drift).

## Page map

```
                     ┌─────────────────────────────────────┐
                     │          App shell (412×860)         │
                     │ status bar · app bar · mode pill     │
                     │ mode strip (Coins/Tracker/History)   │
                     │ drawer ──► Setup wizard              │
                     └──────────────────┬──────────────────┘
                                        │  bottom nav (4 tabs)
      ┌───────────────┬─────────────────┼─────────────────┬────────────────┐
      ▼               ▼                                   ▼                ▼
┌────────────┐  ┌─────────────┐                   ┌─────────────┐  ┌──────────────┐
│ 1 · COINS  │  │ 2 · TRACKER │                   │ 3 · HISTORY │  │ 4 · CONFIG   │
│ keypad IS  │  │ LIVE badge  │                   │ (view-only  │  │ (home cards) │
│ the home   │  │ in flight   │                   │  PIN lock)  │  └──────┬───────┘
└─────┬──────┘  └─────────────┘                   └──────┬──────┘         │
      │                                                  │         Mode & Money
 rail chip ──► chain/asset bottom sheet     recon card + chips     (+ re-read first-
 (NEEDS-SETUP disabled-with-reason)         All / Income /          mainnet notice)
      │                                     Not income / Failed    Payment Rails
 charge (mode verb; 1st MAINNET                   │                Store
 charge ──► interstitial)                   NEEDS REVIEW rows:     Security & Books
      │                                     Review (book locked /  Go Live — Mainnet
 donation code (untracked)                  today / return ──►
                                            REFUND row) · Resume ──► Tracker C

Tracker:  idle ──► B awaiting (◔ 15:00 rate lock · cancel pre-broadcast only)
   lock ends ──► E expired (clean / underpaid / overpaid swaps · re-charge ──► B)
   detected ──► C confirming ──► D settled receipt (Print / Share / New sale)
       │             └─ Stop watching ──► History NEEDS REVIEW (Resume ──► C)
       └─ gas / double-spend ──► E failed · 24 h watcher: late pay ──► NEEDS REVIEW
```

## Page content

### 1 · Coins *(home — the charge keypad, LAYOUT A)*
- **Sticky rail chip** — "Ethereum · USDC · last used / tap to change" → bottom
  sheet: rail grid (Live/Demo dots, NEEDS-SETUP rails disabled with reason), then
  an asset step for multi-token chains.
- Fiat amount + live crypto equivalent · rate line ("…rate locks for 15 min when
  you charge") · always-on fee disclosure (amount + who pays + how chosen).
- 3×4 keypad (1-9, C, 0, .) + Correction bar; blocked while a payment is in flight.
- **Charge button** — two-line mode verb ("CHARGE $X — TEST" / "CHARGE $X" /
  "SIMULATE CHARGE $X" over "· LOCKS RATE 15:00"); disabled-with-reason on blocked
  rails; first MAINNET charge per session interposes the interstitial.
- **Donation code** link — address-only QR, untracked, never enters the ledger.

### 2 · Live Tracker
- **Idle** — empty state prompting to ring up a sale.
- **Awaiting (B)** — rate-lock header + ◔ countdown (error-red final 60 s), QR card
  with corner mode tag + non-mainnet ribbon, amount, address chip + verbal check,
  push-only status, fee attribution, pre-send notice, "Cancel sale — free until
  they send". Consensus Sandbox drives settle/fail/under/over/expire.
- **Detected → Confirming (C)** — DETECTED→CONFIRMING→SETTLED stepper, amount
  check, block strip + redefined confirmations, progress + per-chain ETA
  (BTC/ETH/XMR 3 · SOL/POL 2 · Tari 1), locked-rate reminder, "Can't cancel" note,
  **Stop watching** → NEEDS REVIEW row.
- **Settled (D)** — receipt: rate provenance, dual fee lines, chain·network·
  provenance, block-anchored settlement, txid + publicness, income stamp (full
  equation vs hatched NOT-INCOME + PRACTICE watermark on non-mainnet, shared text
  included), refund footer.
- **Expired / failed (E)** — CODE EXPIRED + 24 h watcher + one-tap re-charge;
  underpaid / overpaid / failed-on-network swaps of the same frame.

### 3 · Sale History
- **Recon card** — income total + the income contract; itemized not-income line.
- **Filter chips** — All / Income / Not income / Failed over one chronological list.
- Rows (3 lines): status word + chain·token + charge-time NETWORK·PROVENANCE badge;
  time · crypto @ locked rate (or reason); txid chip + amount. NEEDS REVIEW rows
  carry Review (book locked / today / return → REFUND row) or Resume.
- CSV export (timestamp, chain·token, crypto amount, locked rate, network,
  provenance, status) · Lock = optional view-only PIN.

### 4 · Terminal Config *(home cards → sub-screens)*
- **Mode & Money** — DEMO / TESTNET / MAINNET (typed-`MAINNET` gate) · **re-read
  first-mainnet notice** row · baseline currency · sales tax · tips.
- **Payment Rails** — price-feed banner; per-rail accordion (READY / NEEDS SETUP).
- **Store** — merchant name; catalog/cart noted as retail-only.
- **Security & Books** — PIN (set / lock / remove), books pointer + clear ledger,
  chain status, danger zone (typed-`RESET`).
- **Go Live — Mainnet** — readiness checklist; blocked until rails are fixed.

### Shell chrome
- App-bar **mode pill** (previews Testnet / Mainnet / Demo chrome — the pill reads
  "Previewing …" and the strip gains a PREVIEW chip; auto-reverts after ~4 s or on
  any charge-affecting act; the real switch stays behind Config's typed-`MAINNET`
  gate), mode strip on the three payment tabs, navigation drawer (Setup wizard,
  Go Live, theme), toast layer, `#overlay-root` (drawer / sheet / dialogs).

## Variable defaults (mirrors `S` in `app.js`)

| Variable | Default | Meaning |
|---|---|---|
| `tab` | `"coins"` | Landing tab |
| `mode` | `"testnet"` | DEMO / TESTNET / MAINNET |
| `modePreview` | `null` | Pill chrome preview (null · `"demo"` · `"testnet"` · `"mainnet"`) — pill + strip only, marked, auto-reverts; never touches `mode` |
| `chain` / `token` | `"Ethereum"` / `"USDC"` | Last-used rail — sticky across sales in-session |
| `draft` | `""` | Keypad amount being typed |
| `sheet` | `null` | Chain/asset bottom sheet: `{step:"chains"}` → `{step:"asset", chain}` |
| `payment` | `{ state: "idle" }` | In flight adds mode, rate, `rateLockEnd`, provenance, address, required/`confs`, `received`, `blockAt`, `endKind`, `failBody` — all captured at charge time |
| `ledger` | 9 seeded rows | Reseeded by stage Reset; Burn Down empties it |
| `txCounter` | `9` | After seeding (row id counter) |
| `histFilter` | `"all"` | History chip: all · income · notincome · failed |
| `firstMainnetAck` | `false` | Session-scoped first-MAINNET interstitial flag |
| `drawer` / `dialog` | `false` / `null` | No overlay open |
| `settingsSection` | `null` | Config home (mode · rails · store · security · golive) |
| `railOpen` | `null` | No rail accordion expanded |
| `onboarding` | `null` | Setup wizard not running |
| `merchant` | `"CryptoPOS Terminal"` | Receipt name |
| `baseline` | `"USD"` | Baseline currency |
| `taxPct` / `tips` | `0` / `false` | Sales tax %, tips toggle |
| `pin` / `historyLocked` | `null` / `false` | Operator PIN unset, History unlocked |
| `heights` | per-chain block tips | Ticked every 1.6 s; seeds `blockAt` for the block strip |
| `subtab` / `cart` / `catalogFirst` / `staff` | `"keypad"` / `[]` / `false` / `[]` | Dead catalog/retail leftovers — unreachable |

Ledger rows carry `id, ts, chainKey, token, usd, crypto, rate, status` (stored
`CONFIRMED` displays as SETTLED), `mode, provenance, network, txHash, memo,
invoicedUsd`, plus `reason`, `resume`/`resumed` (stopped-watch snapshot), `reviewed`
and `reviewOf` on review resolutions. Seeds (one of each shape): mainnet REFUND +
mainnet settle (yesterday); today a demo settle, testnet FAILED (gas), testnet
EXPIRED, mainnet NEEDS REVIEW "watching stopped at 1 of 3" (with resume snapshot),
testnet settle, mainnet NEEDS REVIEW "arrived after the rate lock" (locked $63,200
vs $64,000 today, so the review spread is real), mainnet settle. Out of the box:
INCOME $128.50 · 2 sales; NOT income: $12.50 testnet · $12.00 demo · 1 failed ·
1 expired · 2 need review.

Rail readiness (`RAIL_CFG`): Bitcoin, Ethereum, Solana, Monero, Tari L2 **READY**;
Polygon and Tari L1 **NEEDS SETUP** (demo placeholders — disabled in the sheet).
Go-Live checklist (`GOLIVE`) passes only Ethereum and Solana out of the box.
Rate lock `RATE_LOCK_MS` = 15 min; confirmation targets (`CONFS`): BTC/ETH/XMR 3 ·
SOL/POL 2 · Tari L2/L1 1.
