# Logic — the premade scaffolding pack

Every persona-independent algorithm the real terminal needs, specified so the
Android build is assembly, not invention. Two independent implementations already
exist and were cross-checked to write this: the **reference build** (`app.js` here —
normative for UX, ledger semantics, and copy; visually verified) and the
**pre-alpha** (`crypto-pos-terminal` Kotlin — 1,011 host tests; treat its live
proofs as claims). Tags: **[REF]** reference build · **[PA]** pre-alpha ·
**[RESEARCH]** verified in [TOOLING.md](TOOLING.md) / [RESEARCH.md](RESEARCH.md).

Where the two implementations disagree, the resolution is stated. LAYOUT.md remains
the copy contract; this file is the behavior contract beneath it.

## 1 · Payment state machine

```
idle ──charge──► awaiting ──detected──► mempool ──1st conf──► confirming ──n/N──► CONFIRMED
        │            │                     │                      │
        │            ├─ lock expiry ──► EXPIRED (endKind: clean|under|over)
        │            └─ cancel (pre-broadcast only, confirm-gated)
        │                                  └─ chain failure ──► FAILED
        └─ first MAINNET charge: interstitial gate           └─ stop watching ──► NEEDS_REVIEW
```

- Charge captures, frozen forever on the row: `mode, provenance, rate, taxPct,
  baseline, address/reference, invoicedUsd, rateLockEnd = now + 15min`. [REF+PA]
- Single-flight: one payment in flight; keypad locked; re-entry latched. [PA]
- Expiry fires through the countdown itself (no separate path), then a **24 h
  watcher** holds the address: late payment → NEEDS_REVIEW, never silently booked
  at a dead rate. [REF]
- **Stop watching** frees the terminal without implying reversal: row books
  NEEDS_REVIEW with a resume snapshot (confs so far, block anchor); Resume re-enters
  confirming; a settled resume reuses the same txHash. [REF]
- Orphaned in-flight rows are reaped at boot → EXPIRED (status-guarded DAO update,
  never a delete). [PA]
- Terminal states: CONFIRMED · EXPIRED · FAILED (+ NEEDS_REVIEW as a parked
  non-terminal; REFUND rows are new payments, §5). Detected/mempool is **never**
  money — Square's APPROVED≠COMPLETED mapping [RESEARCH].

## 2 · Detection contract (per-rail watcher interface)

Every rail implements: `watch(invoice) → observation {txId, creditedAmount,
confirmations, status}` — pure parsing separated from transport, all failures
returning "unknown", never "paid". [PA]

- **Amount tolerance**: paid if `credited ≥ invoiced × 0.995`; overpay flagged at
  `> invoiced × 1.005`; under → PART-PAID flow (§5). Integer base units only
  (sats, lamports, wei, atomic USDC) — never floats. [PA+REF]
- **Confirmation gates** (per chain, all fail-closed):
  - Bitcoin: `confs = tip − txHeight + 1`; unreadable tip → 0; refuse a lagging
    tip; required 3 mainnet / 1 testnet; post-settle reorg re-check (404 → Dropped). [PA]
  - Ethereum: EIP-658 receipt `status == 0x1` **and** conf count; missing/unparseable
    status → not settled. [PA]
  - Polygon: gate on the `finalized` block tag (Heimdall v2 milestones, ~2–5 s) —
    **supersedes [PA]'s conf counting**; handle multi-hour `finalized` staleness as
    fail-safe delay, not failure. [RESEARCH]
  - Solana: commitment map — finalized → settled, confirmed → 1/N, processed →
    nothing. Detection = per-sale reference key + `getSignaturesForAddress` polling;
    `accountSubscribe` is a latency add-on only (refuted 0-3 as sole mechanism). [RESEARCH]
  - Monero: `locked == false ∧ confs ≥ 10 ∧ !double_spend_seen ∧ height > 0`
    (conjunctive — all four or nothing). The 10-block convention is protocol lore,
    not in the RPC docs — encode it; gate on the `locked` boolean, **never** raw
    `unlock_time` (it can be a height OR a unix timestamp — refuted 0-3). DETECTED
    comes from `get_transfers pool:true` only (`get_payments`/`incoming_transfers`
    cannot see the pool); requires an **unrestricted** wallet-rpc. Production
    corroboration: MoneroPay's callback ladder fires at exactly 0/1/10 confs —
    the same DETECTED → CONFIRMING → SETTLED mapping — with 0-conf opt-in and
    off by default. Bench-verified live (stagenet 2026-07-03): `locked` flips
    false exactly at conf 10. Operational duties from the bench: **supervise
    wallet-rpc** (it wedges against public remote nodes; fail-closed but
    unresponsive), **`store` after every subaddress mint** (a crash re-issues
    unmined indices → address reuse), provision the view-only wallet at setup
    (~5 min fast-forward before first RPC response), and keep an alternate node
    for re-relays (a daemon holding stale key images rejects re-sends other
    nodes accept). [RESEARCH+PA+BENCH]
  - Tari L1: status-keyed — no depth counter on the wire (status + mined-height
    only, verified at the pinned proto). Base gate `{MINED_CONFIRMED,
    ONE_SIDED_CONFIRMED} ∧ INBOUND ∧ !cancelled`; the wallet's own
    `is_confirmed()` ALSO counts `*_CONFIRMED_LOCKED` — whether
    confirmed-but-time-locked books is a deliberate policy call (spendability
    gating says defer, matching the Monero `locked` rule); server-side
    payment_id filtering is unreleased → filter client-side. [RESEARCH+PA]
  - Dash: two-tier — show "locked" on `instantlock_internal == true` (the pure
    islock, ~3 s; the plain `instantlock` field is a COMPOSITE islock-OR-chainlock,
    and mempool RPCs return it as the string `"true"/"false"/"unknown"`); BOOK
    only when the containing block's `chainlock == true` OR confs ≥ 6 (Dash's own
    input-eligibility depth; Kraken's production floor is 2). Not every tx gets an
    islock (inputs must each be locked, chainlocked, or 6-conf deep) and both
    signals are spork-toggleable — the depth fallback is mandatory. ZMQ lock
    topics (`zmqpubhashtxlock`/`zmqpubhashchainlock`) are latency-only: delivery
    is documented lossy, so poll RPC for truth. [RESEARCH]
  - Zcash: no `locked` boolean, no deterministic finality — PoW with 75-second
    target block spacing. Gate: `confs >= 10` (protocol lore, not consensus —
    same convention as Monero's 10-block unlock; zcash glossary: "generally
    recommended to wait for 10+ confirmations"). DETECTED is local
    trial-decryption: the client downloads compact blocks from lightwalletd
    (116 bytes per shielded output — cmu, epk, first 52 bytes of ciphertext;
    80% bandwidth reduction vs full) and trial-decrypts every output against its
    incoming viewing key (IVK). The server never learns which outputs match
    (ZIP-307 payment-detection privacy). No address-watching API — detection is
    O(chain) work, not O(own-txs). Transport: lightwalletd gRPC streaming for
    compact blocks; local scan for truth. `nExpiryHeight` (ZIP-203) is the
    built-in rate-lock: unmined txs expire after 40 blocks (~50 min) — tighter
    than the terminal's 15-min lock, which must enforce expiry app-side.
    [RESEARCH]
- **Transport discipline**: WS/push for latency, HTTP polling for truth — missed WS
  events are unrecoverable without polling backfill. [RESEARCH]

## 3 · Per-sale payment codes (the attribution problem)

How a payment is bound to *this* sale, per rail:

| Rail | Mechanism | Notes |
|---|---|---|
| Bitcoin | **Fresh HD address per sale** from merchant xpub (public derivation only; reject any private key material; durably reserve index before display; fall back to static address on failure) | Gap limit: warn the merchant at ~15 consecutive unpaid codes, or track issued addresses in-app [RESEARCH+PA] |
| Dash | **Inherits the Bitcoin xpub flow verbatim** — fresh HD address per sale; watch via a Dash Core v21+ descriptor wallet (`createwallet disable_private_keys=true descriptors=true` + `importdescriptors` ranged xpub; descriptors are opt-in, NOT the default) | InstantSend needs nothing per-sale — locks are input-level and automatic; DashJ SPV is the on-device candidate (whether SPV *verifies* islocks or trust-relays them is open) [RESEARCH] |
| Zcash | **Fresh diversified address per sale** from the merchant's incoming viewing key (IVK) — the IVK + a diversifier (11-byte d) produces up to 2⁸⁸ unlinkable addresses that all decrypt with the same key. No HD derivation, no xpub, no gap limit, no index reservation | Detection is local trial-decryption via lightwalletd compact blocks (not address-watching); IVK-only means the terminal detects incoming but never outgoing — honest for POS (can't accidentally spend, lacks the spend key). zcashd `z_importviewingkey` + `z_listunspent includeWatchonly=true` is the RPC path; on-device via zcash-android-wallet-sdk (Kotlin + Rust FFI). No gap-limit analogue — wallet restored from spending key re-derives IVK and recovers all diversified addresses [RESEARCH] |
| Solana | Static address + **fresh 32-byte reference key** as read-only non-signer account | Spec'd Solana Pay pattern; for SPL watch the derived ATA [RESEARCH] |
| Monero | **Fresh subaddress per sale** via view-only wallet (`generate_from_keys` view-key-only + `create_address` — both verified watch-only-safe in source; production precedent: MoneroPay) | Merchant runs own **unrestricted** wallet-rpc (or on-device wallet2); address-only config = UNTRACKED: show code, book nothing. **Lookahead duty** (Monero's gap limit): wallet2 restores scan only a rolling 50×200 window, and the in-place raise is broken in every shipped release ≤ v0.18.5.0 — create the POS wallet with raised lookahead, count minted subaddresses, and surface seed-restore instructions (restore-time lookahead; Feather ≥2.3.0 wizard) [RESEARCH+PA] |
| Tari L1 | Per-sale `payment_id` **embedded in the TariAddress itself** (RFC-0155: dual-key address + ≤256 B encrypted payment id that lands on the UTXO) | Detect via the **read-only console wallet** (view key + public spend key — never the spend wallet) over gRPC; payer-wallet QR support for embedded payment ids unverified [RESEARCH+PA] |
| EVM push | The WalletConnect session itself binds sale→tx (terminal proposes, customer signs one tx) | [PA] |
| EVM QR-only | **Weakest**: static address + exact-amount matching within the lock window | Accept as v1 limitation; document collision risk |

## 4 · Rate lock & price feeds

- Quote once at charge (`rate`, `marketRate`), lock 15 min, **settle at the open
  rate no matter what the market did** (`recordedUsd = received × openRate`). [REF+PA]
- Feed architecture: primary + independent secondary; **divergence > 3% drops the
  token** (fail-closed — no rate, no mainnet charge); bounded grace window reuses
  last-good with on-screen "rate as of…" disclosure; stale rate blocks MAINNET
  charging entirely, never testnet/demo. [PA]
- Fallback/hardcoded rates may only ever price valueless modes (testnet/demo). [PA]

## 5 · Ledger & booking (append-only, honest)

- **The income rule, one function**: `income ⟺ network==Mainnet ∧ provenance==REAL
  ∧ status==CONFIRMED` — drives the recon card, the only green "+", and the receipt
  stamp. Everything else is itemized NOT-income. [REF+PA identical]
- Rows are never rewritten: reviews append (`reviewed` marker + `reviewOf` link);
  refunds are **new outbound rows** with their own txHash and lifecycle, shown −$;
  expiry books `$0.00 · NO SALE`. [REF]
- NEEDS_REVIEW resolutions (operator chooses, machine never does): book at locked
  rate · book at today's value · return as new payment. Review-bookings reuse the
  held row's txHash (same money); returns mint their own. [REF]
- Settlement write is idempotent on unique `(chain, txHash)`; a write that fails
  for unknown reasons quarantines as OutcomeUnknown — never retry into a double
  booking, never drop silently. [PA]
- Money persists as canonical decimal strings (or integer base units), never
  floating point; CSV columns mirror on-screen status words 1:1. [PA+REF]

## 6 · Mode safety

- Three modes; **captured at charge time on the row** — nothing downstream (QR tag,
  ribbon, receipt stamp, booking) re-reads live mode. [REF+PA]
- MAINNET entry: typed `MAINNET` gate only; the mode pill is preview-only. First
  mainnet charge per session shows the irreversibility interstitial. [REF]
- QR encodes the mode's network: chain-id per mode (`@1/@137` vs `@11155111/@80002`),
  testnet address formats, Tari network authority (`tari://mainnet/` vs
  `tari://esmeralda/` — uniquely, the payer wallet ENFORCES this, unlike EVM
  wallets which ignore chain_id), `SIM-` markers in demo; demo codes are
  non-payable and marked. Untracked/donation codes book nothing. [REF+PA]
- Mainnet safety gates before charge: rail configured ∧ rate live ∧ (typed gate
  passed) — each blocks with a reason, never silently. [PA]

## 7 · URI/QR builders (amount parity is an invariant)

BIP-21/321 `bitcoin:` (decimal BTC, period, no commas) · Dash:
`dash:<addr>?amount=<decimal DASH>` — plain BIP-21, source-verified round-trip in
Dash Wallet Android (its scanner prefills address+amount; its Receive screen emits
the same form). **Never add an InstantSend param**: `IS=1` is ignored and
`req-IS=1` voids the whole URI in both dashcore-lib and dashj (BIP-21 unknown
`req-*` rejection); locking is automatic network-side · ZIP-321 `zcash:`
(`zcash:<addr>?amount=<decimal ZEC>&memo=<base64url>&message=<text>&label=<text>`;
amounts decimal ZEC up to 8 places; `req-` unknown params void the URI; Sprout
addresses MUST NOT be supported; memo is base64url and shielded-only; the
diversified address itself is the per-sale binding — no separate payment_id
param; source-verified round-trip in Ywallet Receive + Zashi scan) · ERC-681 `ethereum:`
(`@chainId`; ERC-20 as `/transfer?address=&uint256=` in atomic units) · Solana Pay
`solana:` (`amount`, `spl-token`, `reference`) · `monero:<addr>?tx_amount=` —
**opaque form only** (`monero://` with slashes is rejected by Monerujo) and strictly
numeric amount (a bad value voids the whole URI; verified prefill in Monerujo +
Cake) · Minotari: **RFC-0154 deeplink only** —
`tari://<network>/transactions/send?tariAddress=<base58>&amount=<µT integer>`
(bare addresses degrade to add-contact; the wallet enforces the network
authority — build from the RFC's normative table, its worked example is wrong;
per-sale id rides inside the RFC-0155 address, keep it 8–16 B). The amount
encoded, displayed, watched, and persisted must be the same value — build all
from one source. [REF+PA+RESEARCH]

## 8 · Fail-closed conventions (the house style)

Unreadable chain tip → 0 confirmations. Missing receipt status → not settled.
Feed divergence → token offline. Unknown write outcome → quarantine. Unconfigured
rail → disabled-with-reason, never silently chargeable. Private key material in an
xpub field → reject outright. No custody anywhere; the only signing key in the
pre-alpha is loyalty-scoped and quarantined — the payment path must never gain one.

## What the pre-alpha does NOT give you (build fresh)

The reference build's honesty layer post-dates the pre-alpha: EXPIRED as a
first-class UX state with re-charge, the 24 h watcher + NEEDS_REVIEW quarantine,
review/refund append flows, the block-strip confirmation teaching, the copy deck,
PRACTICE watermarks, and the preview-only mode pill. Port those from
[LAYOUT.md](LAYOUT.md)/[SCREENS.md](SCREENS.md), not from the Kotlin.
