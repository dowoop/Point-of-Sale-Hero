# Tooling — what the real terminal needs

Research for turning the reference design into the native terminal
(`dowoop/crypto-pos-terminal`). Deep-research run of 2026-07-03: 6 angles, 26 sources,
129 claims extracted, 25 adversarially verified — **22 confirmed, 3 refuted**. Cross-
checked against a full inventory of the pre-alpha codebase.

**Evidence tiers used below** — treat them differently:
- **[VERIFIED]** — survived a 3-0 adversarial panel against primary sources.
- **[PRE-ALPHA]** — working, host-test-covered code exists in `crypto-pos-terminal`,
  but its proofs are self-reported (single squashed commit; live tests skip in CI).
  Corroborating evidence, not verified fact.
- **[OPEN]** — nothing survived verification. Do not treat as answered.

## Payment detection per rail (no full node on the phone)

### Bitcoin — [VERIFIED]
- **The merchant-grade pattern is BTCPay's**: watch-only — merchant supplies an xpub
  from an external wallet, the terminal derives and watches a **fresh address per
  invoice**, never holding keys (BTCPay FAQ; NBXplorer). Direct prior art for
  per-sale payment codes.
- **The documented failure mode is the gap limit**: wallets stop scanning ~20
  consecutive unused addresses (BIP-44 default; configurable in Electrum/Sparrow/
  Wasabi). After 20 unpaid codes, later payments become invisible *in the merchant's
  own wallet* (not lost). The terminal must either surface "raise your gap limit"
  guidance or track its issued addresses itself.
- **Indexer options**: remote Esplora/Electrum-protocol APIs (the pre-alpha uses
  mempool.space REST — [PRE-ALPHA], fail-closed conf counting); or a phone-resident
  **BIP-157/158 Neutrino light client** as Blixt ships (lnd + Neutrino on-device,
  v0.9.0 2026-02; filters still fetched from a remote peer, but matching happens
  on-device — a materially better privacy model than address-watching APIs).
- **Self-hosting Esplora is server-class, not counter-class**: ~1.7 TB Esplora store
  + ~600 GB bitcoind, 16 CPUs / 64 GB RAM (Blockstream 2025); even `--lightmode`
  needs an unpruned bitcoind. Out of scope for the device; plausible for a
  merchant's home server.

### Ethereum / Polygon — [VERIFIED]
- **ERC-20/stablecoin detection**: standard `eth_subscribe("logs")` WebSocket with
  topic0 = Transfer signature and the indexed `to` topic = padded receiving address
  (Alchemy's own worked example; same pub/sub on Polygon).
- **Native transfers via push are vendor lock-in**: `alchemy_minedTransactions`
  (to/from filterable) exists on Ethereum/Arbitrum/Polygon/Optimism only. The
  portable fallback is plain JSON-RPC polling.
- **WebSockets must never be the sole mechanism**: `eth_subscribe` is wss:-only, and
  Alchemy's own docs warn of "many tricky edge cases and silent failure modes";
  missed events during disconnects are gone without reconnect + `eth_getLogs`
  backfill. Architecture: **WS for latency, HTTP polling for truth.**
- **Polygon finality is now deterministic**: since Heimdall v2 (mainnet 2025-07-10),
  milestones finalize in ~2–5 s, readable via the standard `finalized` block tag —
  no probabilistic confirmation counts needed. Caveat: the Sept 2025 milestone stall
  showed `finalized` can go stale for hours during consensus incidents (fail-safe
  direction, but the terminal needs staleness UX).
  *The pre-alpha counts confirmations on Polygon — the research supersedes this:
  gate on `finalized`.*
- **Push payments** (customer's wallet signs; terminal never pulls): the pre-alpha
  uses WalletConnect/Reown AppKit v1.4.5 with EIP-658 receipt-status gating,
  falling back to simulation without a project id — [PRE-ALPHA].

### Solana — [VERIFIED]
- **Solana Pay gives per-sale codes natively**: a fresh 32-byte `reference` key rides
  the transfer as a read-only non-signer account; validators index by account keys,
  so `getSignaturesForAddress(reference)` finds the exact sale. This is the spec'd
  pattern (`findReference()` in the reference SDK).
- **URI semantics**: `solana:<recipient>?amount=&spl-token=&reference=&label=&message=`;
  recipient is the native SOL account (never an ATA); for SPL payments the wallet
  derives the ATA — detection must watch the derived ATA, not the wallet address.
- **Commitment maps onto the income rule**: processed / confirmed / finalized; the
  reference SDK type-excludes `processed`. Choose `confirmed` for counter UX,
  `finalized` for booking. **Refuted 0-3**: `accountSubscribe` alone as the detection
  mechanism — it's at most a latency optimization over reference-key polling.
- **The tooling moved**: `anza-xyz/solana-pay` → `solana-foundation/pay`; the SDK
  lives at `typescript/packages/solana-pay/` (@solana/pay 1.0.20, 2026-06, MIT,
  active). Cite the in-repo paths, not old URLs.

### Monero — core [VERIFIED] (follow-up pass 2026-07-03) · edges [OPEN]
Dedicated research pass: 23 claims confirmed, 2 refuted. The payer-parity stack is
verified end-to-end on primary sources:
- **Payer side**: Monerujo and Cake Wallet both parse `monero:<addr>?tx_amount=`
  (+ `tx_description`) from a scanned QR and **prefill the send screen** — verified
  in both codebases' URI-handling source. Terminal constraints: the URI must be
  opaque (`monero:addr?…`, never `monero://addr` — slashes make Monerujo reject it)
  and `tx_amount` strictly numeric (a bad value rejects the whole URI). Cake's
  in-app scanner is the robust path (its OS deep-link prefill regressed once,
  fixed). **Feather also verified** (second pass): prefills address, amount, and
  description from a scanned/pasted QR since Beta-8 (~2021), via wallet2's own
  `parse_uri`. Official GUI/CLI, Edge, Stack, Trust remain unverified either way.
- **Merchant side (`monero-wallet-rpc`)**: `generate_from_keys` with view key only
  creates a working watch-only wallet; `create_address` mints per-sale subaddresses
  on it (source has no watch-only guard — subaddress derivation needs only the view
  secret + public spend key); `get_transfers` with `pool:true` surfaces unconfirmed
  mempool payments **in seconds** (type "pool", 0 confs, locked=true) —
  `get_payments`/`incoming_transfers` cannot see the pool. Verified operational
  requirement: **the merchant must run their own unrestricted wallet-rpc** —
  restricted RPC blocks both `generate_from_keys` and the inline pool refresh.
- **The ~10-block settle convention is NOT in the RPC docs** — a protocol
  convention the app must encode itself: book only `locked == false ∧
  confirmations ≥ 10 ∧ !double_spend_seen`. **Refuted 0-3**: `unlock_time` as
  "blocks until spendable" — it can be a block height OR a unix timestamp; gate on
  the `locked` boolean, never raw `unlock_time`.
- **On-device parity option**: Monerujo's wallet2-via-JNI bridge is confirmed
  capable of the full loop — view-only wallet from keys with restoreHeight,
  on-device subaddress minting, pool-inclusive history with confirmations/
  isPending. Caveat: Monerujo is **stale-but-alive** (last release/push
  2025-06-17; bundled core pinned v0.18.3.4 vs upstream 0.18.4.x) — sound as an
  architecture reference, re-check before adopting as a dependency.
- **Production precedents** (second pass, 2026-07-03: 22 confirmed, 3 refuted):
  - **MoneroPay** (Go, GPL-3, active into 2026; live deployments) is the strongest
    reference: view-only wallet-rpc advertised as first-class (caveat: not
    code-differentiated — its `/transfer` send endpoint would fail undocumented on
    watch-only), one subaddress per payment with partial-payment accumulation
    (`expected` / `covered{total, unlocked}` / `complete` — a directly stealable
    charge-screen state model), 0-conf **opt-in and off by default** with
    callbacks at exactly **0 / 1 / 10 confirmations** — a production ladder that
    matches DETECTED → CONFIRMING → SETTLED and the 10-block unlock convention.
    SQLite or PostgreSQL. Doc gap worth not inheriting: it auto-creates its wallet
    (since v2.7.0) and says nothing about seed backup or restore height.
  - **BTCPay's Monero plugin** (v1.3.0, 2026-04; active): monerod and wallet-rpc
    as two separately-deployed services wired by env URIs — the standard
    two-process topology.
  - **BitcartCC** (active) is the alternative design point: a view-only Python
    daemon fed only viewkey+address (spend paths raise NotImplementedError; 2-1
    vote — verify before relying), minting **per-invoice integrated addresses**
    (payment-id decrypted from tx_extra) instead of subaddresses — structurally
    immune to the lookahead hazard below, at a privacy/UX cost.
  - **HotShop** is archived (2023-10) — design reference only; published
    descriptions of its internals were refuted 0-3.
- **The subaddress-lookahead hazard (Monero's gap limit) — verified from source**:
  wallet2 scans a rolling **50-major × 200-minor** window (`wallet2.cpp:130-131`).
  A POS minting a subaddress per sale eventually leaves payments >~200 indices
  past the last discovered one **invisible to a seed-only restore** in a normal
  wallet. Worse: raising the lookahead on an existing wallet (`set
  subaddress-lookahead` + `rescan_bc`) was **silently broken from Feb 2021 to
  July 2025** (issue #7364 — reported from exactly the merchant-POS scenario);
  PR #9953 fixed it and added a wallet-rpc `set_subaddress_lookahead` endpoint,
  but the fix is **not in any shipped release, including v0.18.5.0 (2026-05)**.
  Operative recovery today: **restore from seed with the lookahead set at restore
  time** — Feather (≥2.3.0) exposes this on all three restore paths, making it
  the wallet to hand-recommend. Terminal duties: create the POS wallet with a
  raised lookahead, count minted subaddresses, and surface restore instructions
  (with the lookahead number) in Security & Books.
- Still [OPEN]: official GUI/CLI + Edge/Stack/Trust URI parsing; monero-ts /
  monero-java / monero-lws maintenance and Android viability; which Monero release
  first ships PR #9953; whether MoneroPay/BTCPay mitigate the lookahead hazard;
  node topology practice (own vs public daemon, `--untrusted-daemon` semantics for
  view-only wallets); fresh-wallet scan latency/battery on-device.

The pre-alpha's flow (digest auth, conjunctive gate, UNTRACKED amber fallback) now
has its RPC substrate verified and two production processors as precedent; what
remains before trusting the rail is bench work — stagenet end-to-end, then a
mainnet self-pay.

### Tari (Minotari L1 / Ootle L2) — [OPEN], with [PRE-ALPHA] code
Nothing verified; the ecosystem is sparse. Pre-alpha: L1 via Wire gRPC to the
merchant's wallet (`GetCompletedTransactions`, status-keyed gate — MINED_CONFIRMED /
ONE_SIDED_CONFIRMED, per-invoice `payment_id`), LocalNet-proven only (mainnet
blocked on infra). Ootle L2 detectors exist but the repo itself labels the rail
**NOT-READY (structural)**, and its on-chain templates got an initial security
NO-GO (quarantined; the app is observe-only). **Ship Tari as testnet/demo-only
until the ecosystem matures.**

## Price feeds — [OPEN], with [PRE-ALPHA] design worth keeping
No provider claims (rate limits, licensing for open source) survived verification —
that comparison is still to do. The pre-alpha's *architecture* is sound regardless of
provider and matches the reference build's rate-lock rules: primary feed (CoinGecko
`/simple/price`) cross-checked against a secondary (Coinbase); **>3% divergence
drops the token (fail-closed)**; a bounded grace window keeps last-good rates with
"rate as of…" disclosure; **settlement always uses the charge-time rate, never a
re-fetch**; stale rates block mainnet charging.

## Android/Kotlin libraries — [OPEN], with [PRE-ALPHA] choices as the starting list
Library-health claims (bdk-android vs bitcoinj, kethereum vs web3j, Solana Kotlin
SDKs, ESC/POS printing) did not survive verification. What the pre-alpha actually
uses and tests: **ZXing** 3.5.3 (QR), **OkHttp** + org.json with TLS cert pinning
(all chain APIs — no heavyweight chain SDKs at all; JSON-RPC is hand-rolled),
**Reown AppKit** 1.4.5 (WalletConnect), **Square Wire** 4.9.11 (Tari gRPC;
pre-generated stubs because the Wire Gradle plugin fights AGP 9), **Room** 2.7.0
(v13 schema, 11 non-destructive migrations, money as canonical decimal strings),
DataStore + AES-GCM keystore for secrets, Compose BOM. No printing lib exists —
receipts are on-screen + CSV/share. Caution: the pre-alpha's toolchain (AGP 9.2.1,
compileSdk 36.1) is unverified as buildable.

## Operational/trust posture
- Public-API address-watching leaks merchant address activity to the API operator —
  the Neutrino option (Bitcoin) and self-hosted wallet-rpc (Monero) are the
  privacy-respecting ends of the spectrum; document the tradeoff per rail.
- Counter devices need outage behavior: every watcher fail-closed (unreadable tip →
  0 confs; missing receipt status → not settled), WS layered over polling, and the
  rate-lock grace/staleness UX from the reference build.
- Keyless public endpoints (mempool.space, publicnode, api.mainnet-beta.solana.com)
  keep the terminal secret-free; provider keys (Alchemy/Reown) are opt-in upgrades.

## Refuted / do not rely on
- Solana `accountSubscribe` as sufficient POS detection (0-3).
- Precise enumerations of provider subscription-type sets (0-3, 1-2) — vendor docs
  are internally inconsistent; verify per provider at build time.

## Open questions (next research)
1. Monero edges (core + production precedents verified above): URI prefill in
   GUI/CLI/Edge/Stack/Trust; monero-ts/monero-java/monero-lws state; first release
   shipping PR #9953; node topology practice; on-device scan latency/battery.
2. Tari: any real L1 view-key / L2 indexer tooling, or testnet-only until mature.
3. Price feeds: free-tier limits + licensing comparison for an open-source app.
4. Kotlin library health: bdk-android vs the pre-alpha's hand-rolled REST approach;
   kethereum vs web3j vs hand-rolled; maintained Solana Kotlin SDK; ESC/POS printing.
