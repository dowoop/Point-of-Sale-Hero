# Layout — the target point of sale

This document is the layout the build converges toward — the seven-surface target that `index.html` should match screen by screen. `SCREENS.md` documents the build as it stands today; when the two disagree, this file is the intent and the difference is the remaining work.

Every element below encodes the verified research brief (each claim adversarially verified 3-0, July 2026): the crypto-misconception studies — SOUPS 2020, FC 2016, CHI 2016 — on how people misread confirmations, fees, publicness, and irreversibility; Square's payment lifecycle and receipt/transactions anatomy for state words and ledger shape; BTCPay Server's invoice and keypad ("Light view") conventions; and BIP 321 / ERC-681 for push-only payment URIs, network targeting, and the QR threat model. Findings are cited inline as "Research 1–10"; the traceability table at the end maps each finding back to the elements that carry it.

The frame is the winning lens from the design bake-off — the **Wallet-convention purist**: every surface reuses idioms crypto users already trust (QR cards with quiet zones, mono address chips, block explorers, wallet confirm screens) instead of inventing new ones. Onto that base are grafted the judge-endorsed fixes from the losing lenses: the "· never income" suffix on the mode strip, on-card QR mode tags, the SOUPS "clear text" pre-send notice verbatim, the block-strip confirmation visual, the full booking equation on receipts, the diagonal PRACTICE watermark, and the Tracker's "Stop watching" exit.

## Screens

### A · Charge

Keypad home on the Coins tab — BTCPay "Light view": the keypad IS the home (research 9). The chain gallery lives in a bottom sheet behind the asset chip — one tap away, never in the charge path — and the chip is sticky: the terminal always reopens on the last-used rail. Keypad layout is the current individual build's, verbatim (1–9 / C 0 . plus the full-width Correction bar).

```
┌────────────────────────────────────────────┐
│ 9:41                             LTE ▮▮▮▮  │
├────────────────────────────────────────────┤
│ ≡  CryptoPOS Terminal          (TESTNET)   │
│ ░ TEST NETWORK — coins have no value ·     │
│   never income ░                       [1] │
├────────────────────────────────────────────┤
│ (B) Bitcoin · BTC · last used          [2] │
│     tap to change                          │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│                                            │
│                $ 12.50                 [3] │
│           = 0.00019531 BTC                 │
│                                            │
│ 1 BTC = $64,000 · rate locks for       [4] │
│ 15 min when you charge                     │
│ No processor fee. Network fee ≈ $0.42, [5] │
│ paid by the customer's wallet, set by      │
│ network demand right now.                  │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│      [ 1 ]     [ 2 ]     [ 3 ]             │
│      [ 4 ]     [ 5 ]     [ 6 ]         [6] │
│      [ 7 ]     [ 8 ]     [ 9 ]             │
│      [ C ]     [ 0 ]     [ . ]             │
│      [        Correction        ]      [7] │
│ ┌────────────────────────────────────────┐ │
│ │   CHARGE $12.50 — TEST              [8]│ │
│ │   · LOCKS RATE 15:00                   │ │
│ └────────────────────────────────────────┘ │
│ Donation code (address only, untracked)[9] │
├────────────────────────────────────────────┤
│ ● Coins    Tracker    History    Config    │
└────────────────────────────────────────────┘
```

- **[1] Mode strip** — persistent on every payment surface; testnet reads "TEST NETWORK — coins have no value · never income" (blue family `--mode-*`) so the strip itself forecloses bookability, not just the receipt watermark. Wallets may ignore the URI's `@chain_id`, so the screen carries the network, unmissably. Research 8, 6.
- **[2] Asset chip — sticky rail** — "Bitcoin · BTC · last used" + "tap to change": the keypad home always reopens on the last-used rail (zero taps to start typing); the tap opens the chain gallery as a sheet (Live/Demo rail dots kept there), where NEEDS-SETUP rails render disabled-with-reason — never silently chargeable. Keypad-first shape per BTCPay Light view. Research 9, 8.
- **[3] Amount display** — fiat primary, crypto equivalent live underneath; the QR amount will equal this figure exactly (existing invariant). Research 10.
- **[4] Rate line** — "1 BTC = $64,000 · rate locks for 15 min when you charge" — names the volatility defense before it starts. Research 5.
- **[5] Fee disclosure** — "No processor fee. Network fee ≈ $0.42, paid by the customer's wallet, set by network demand right now." — amount + who pays + how chosen, always on-surface, never collapsed behind an ⓘ-tap; fixes BTCPay's misleading "no fees". Research 2.
- **[6] Keypad** — the current individual build's layout, verbatim: 1–9 / C 0 . ("C" clears the entry); entry blocked while a payment is in flight (existing invariant). Research 9.
- **[7] Correction bar** — the current build's full-width "Correction" bar, kept for fat-finger recovery (deletes the last digit) — distinct in shape from the commit button below it. Research 9.
- **[8] Charge button** — Square's commit idiom fused with the volatility contract: "CHARGE $12.50 — TEST · LOCKS RATE 15:00" (verb line, with the lock clause as a smaller subline so glanceability survives); in TESTNET/DEMO it never wears the live-charge treatment — mode-family fill (testnet blue, demo neutral with verb "Simulate charge $12.50") so a non-mainnet charge can never look bookable; disabled-with-reason when the selected rail is down; the first MAINNET charge interposes a one-time interstitial ("Real money from here on… no bank to call. A refund is a new payment from you"), re-readable from Config → Mode & Money. Research 8, 6, 5, 4.
- **[9] Donation link** — "Donation code (address only, untracked)" — address-only QR, never enters the ledger. Research 6.

### B · Awaiting payment

Live Tracker. BTCPay invoice anatomy top-to-bottom — countdown, QR card, amount, address chip, status line — plus the SOUPS pre-send notice the convention lacks, now verbatim. Grafts applied on this screen: the SOUPS "clear text" phrasing replaces the softer paraphrase in the pre-send notice; the QR card carries an on-card mode tag so a cropped or screenshotted code still names its network; the rate-lock countdown turns `--error` colored for its final 60 seconds; and the shared mode strip appends "never income". Content below the fold scrolls (⋮) — nothing may overlay the code modules.

```
┌────────────────────────────────────────────┐
│ ░ TEST NETWORK — coins have no value ·     │
│   never income ░                       [1] │
├────────────────────────────────────────────┤
│ ←  AWAITING PAYMENT           ◔ 14:32  [2] │
│    Rate locked: 1 BTC = $64,000            │
│ ┌──────────────────────────────────┐       │
│ │ ▛▀▖▝▜  bitcoin:bc1q…?amount=     │       │
│ │ ▌█▐▐▌  0.00019531                │  [3]  │
│ │ ▖▚▗▄▟  (white card, quiet zone)  │       │
│ │                         TESTNET  │  [4]  │
│ └──────────────────────────────────┘       │
│       0.00019531 BTC   ($12.50)        [5] │
│                                            │
│ To: bc1q 8f3k …… x0wl 4u2e     [Copy]  [6] │
│ Say the first & last 4 out loud — they     │
│ must match the customer's wallet.      [7] │
│  ⋮                                         │
│ ◌ Waiting for the customer to approve  [8] │
│   in their wallet. This terminal never     │
│   pulls funds.                             │
│ Their wallet adds the network fee      [9] │
│ ≈ $0.42, set by network demand.            │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ ! Before they send: broadcast in clear     │
│   text and can never be altered —     [10] │
│   public, traceable, permanent. No         │
│   chargebacks.                             │
│                                            │
│ [ Cancel sale — free until they send ] [11]│
├────────────────────────────────────────────┤
│ Coins   ● Tracker LIVE   History   Config  │
└────────────────────────────────────────────┘
```

- **[1] Mode strip** — "TEST NETWORK — coins have no value · never income" — shared chrome on every payment surface (blue `--mode-*` family); the appended "never income" makes the strip itself, not just the receipt watermark, foreclose bookability. Research 8, 6.
- **[2] Rate-lock countdown** — "Rate locked: 1 BTC = $64,000" + "◔ 14:32" — BTCPay's expiry pie, honestly labeled: the countdown is the *rate lock*, not an arbitrary deadline; it turns `--error` colored for the final 60 seconds (pure token reuse, high glanceability); expiry leads to screen E. Research 5.
- **[3] QR card** — "bitcoin:bc1q…?amount=0.00019531" — standard framing: white card + quiet zone in both themes; encodes the real BIP-21/EIP-681/Solana-Pay URI whose amount equals [5] exactly. Research 10, 8.
- **[4] On-card mode tag** — "TESTNET" printed in the card's corner, outside the quiet zone and never over the code modules, so a screenshotted or cropped QR still carries its network; demo cards read "SIMULATED — not payable" (see G), mainnet cards stay clean per the no-overlay rule (G[9]). Research 8, 10.
- **[5] Amount** — "0.00019531 BTC ($12.50)" — crypto bold, fiat secondary — matches the payer's wallet confirm screen so the customer sees the same number twice before sending. Research 10.
- **[6] Address chip** — "To: bc1q 8f3k …… x0wl 4u2e" + "[Copy]" — wallet convention: mono `prefix …… suffix`; toast on copy names what was copied (honest clipboard). Research 10.
- **[7] Verbal verification hint** — "Say the first & last 4 out loud — they must match the customer's wallet." — on-surface instruction that turns the familiar chip into the ERC-681 anti-tamper check. Research 10.
- **[8] Push-only status** — "Waiting for the customer to approve in their wallet. This terminal never pulls funds." — pulse dot uses the status-live token. Research 7.
- **[9] Fee attribution** — "Their wallet adds the network fee ≈ $0.42, set by network demand." — amount + who pays + how chosen, kept always-on and repeated at the moment fees are actually chosen. Research 2.
- **[10] Pre-send notice** — SOUPS prescription verbatim, then the counter paraphrase: "Before they send: broadcast in clear text and can never be altered — public, traceable, permanent. No chargebacks." Research 3, 4.
- **[11] Cancel** — "Cancel sale — free until they send" — confirm-gated; after broadcast the button disappears and screen C explains why ("Can't cancel — it's on the public network now"). Research 4.

### C · Detected -> Confirming

Square's state machine gives the words (APPROVED→PENDING→COMPLETED); crypto's truth
re-labels them. The bare confirmations counter — the convention most guilty of the
"peers approved my tx" misreading — is replaced by the SOUPS block-strip. Two grafts
land here: the mode strip now carries "· never income" on its own face, and the
screen gains its missing exit — a "Stop watching" affordance whose copy forecloses
any reversal reading, parking the row as needs-review (never income) with resume
from its History row.

```
┌────────────────────────────────────────────┐
│ ░ TEST NETWORK — coins have no value ·     │
│   never income ░                       [1] │
├────────────────────────────────────────────┤
│  DETECTED ──► CONFIRMING ──► SETTLED   [2] │
│     ✓           ● 1 of 3        ○          │
│ Detected = seen in the network queue.  [3] │
│ Not money yet — wait for SETTLED           │
│ before handing over goods.                 │
│ Amount check: received exactly         [4] │
│ 0.00019531 BTC — matches the invoice.      │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ Your payment is in block #850,412.         │
│  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │#850,412│─►│#850,413│─►│ next   │    [5] │
│  │your tx │  │mined ✓ │  │mining… │        │
│  └────────┘  └────────┘  └────────┘        │
│ 1 of 3 blocks mined on top of yours.       │
│ Each block on top makes reversal           │
│ harder — nobody "approves" it.         [6] │
│  ⋮                                         │
│ ▓▓▓▓▓▓░░░░░░░░░░░░  Confirming 1/3     [7] │
│ Est. ~20 min on Bitcoin                    │
│                                            │
│ Rate locked at charge: $64,000/BTC.    [8] │
│ Books at this rate whatever the            │
│ market does now.                           │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ Can't cancel — it's on the public      [9] │
│ network now. A refund would be a NEW       │
│ payment.                                   │
│ [ Stop watching ]                     [10] │
│ The customer has already sent — this       │
│ cannot cancel or reverse their payment.    │
│ Books as NEEDS REVIEW — not income;        │
│ resume from its History row.               │
├────────────────────────────────────────────┤
│ Coins   ● Tracker LIVE   History   Config  │
└────────────────────────────────────────────┘
```

- **[1] Mode strip (shared chrome, grafted)** — "TEST NETWORK — coins have no value · never income" — the strip itself, not just the receipt watermark, forecloses bookability; persistent on every payment surface because wallets may ignore the URI's `@chain_id`. Research 8, 6.
- **[2] State stepper** — Square terminal-state words, crypto-mapped: "DETECTED ──► CONFIRMING ──► SETTLED" (≈ APPROVED → PENDING → COMPLETED); persistent across the whole flight so the payee learns the ladder. Research 6.
- **[3] Detected definition** — "Detected = seen in the network queue. Not money yet — wait for SETTLED before handing over goods." Mempool detection is never income and never a green state. Research 6.
- **[4] Amount check** — "Amount check: received exactly 0.00019531 BTC — matches the invoice." Declares exact/under/over at the moment of detection; under/over routes to screen E's partial/overpayment panels, so E's states are visibly reachable. Research 10.
- **[5] Block strip** — SOUPS prescription: "Your payment is in block #850,412." with cells labeled "your tx", "mined ✓", "mining…" — shows WHICH block holds the tx and the confirmed blocks that follow it, with real block numbers. Research 1.
- **[6] Confirmations, redefined** — "1 of 3 blocks mined on top of yours. Each block on top makes reversal harder — nobody 'approves' it." The familiar counter survives; the miners-approved-my-tx misreading doesn't. Research 1.
- **[7] Progress + ETA** — "Confirming 1/3" bar keyed to per-chain confirmation targets (BTC/ETH/XMR 3 · SOL/POL 2 · Tari 1); "Est. ~20 min on Bitcoin" sets expectations for the counter's pace. Research 1.
- **[8] Locked-rate reminder** — "Rate locked at charge: $64,000/BTC. Books at this rate whatever the market does now." Volatility answered mid-wait, where the payee actually worries; same snapshot the ledger stores. Research 5.
- **[9] Cancel removed, honestly** — "Can't cancel — it's on the public network now. A refund would be a NEW payment." Post-broadcast copy never implies a reversal path. Research 4, 3.
- **[10] Stop watching (grafted exit)** — "Stop watching" with "The customer has already sent — this cannot cancel or reverse their payment. Books as NEEDS REVIEW — not income; resume from its History row." Frees the Tracker from a stuck confirmation without implying reversal; the quarantined row can never read as income until the operator resolves it, and its History row offers Resume. Research 4, 6.

### D · Settled

Receipt — Live Tracker terminal state. Square receipt anatomy on the existing light "thermal paper" tokens (both themes): merchant, timestamp, total, tender line, fees, then the crypto-truth block Square never needed. Synthesis grafts applied here: the testnet strip now carries "· never income" on the chrome itself, the mainnet income stamp prints the full booking equation ("INCOME — MAINNET · REAL · CONFIRMED", never a bare "BOOKED AS INCOME"), and every non-mainnet receipt adds a diagonal PRACTICE watermark on top of the hatched NOT-INCOME band so it can never pass as real once printed or shared.

```
┌────────────────────────────────────────────┐
│ ░ TEST NETWORK — coins have no value       │
│   · never income ░                     [1] │
├────────────────────────────────────────────┤
│ ✓ SETTLED                              [2] │
│ ╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮   │
│ ┆        CryptoPOS Terminal            ┆   │
│ ┆      Jul 2, 2026 · 10:07 AM      [3] ┆   │
│ ┆ -------------------------------      ┆   │
│ ┆ Total                     $12.50 [4] ┆   │
│ ┆ Paid   0.00019531 BTC                ┆   │
│ ┆ Rate   $64,000/BTC — locked at   [5] ┆   │
│ ┆        charge, 10:02 AM              ┆   │
│ ┆ Processor fee              $0.00     ┆   │
│ ┆ Network fee  $0.41 — paid by the [6] ┆   │
│ ┆   customer, set by the network       ┆   │
│ ┆ -------------------------------      ┆   │
│ ┆ Bitcoin · TESTNET · REAL         [7] ┆   │
│ ┆ Settled: 3 blocks mined on top   [8] ┆   │
│ ┆ of block #850,412                    ┆   │
│ ┆ tx 4f8a 29bc …… e1d9 9c2e  [Copy][9] ┆   │
│ ┆ Public record — anyone can look      ┆   │
│ ┆ this transaction up, forever.        ┆   │
│ ┆ -------------------------------      ┆   │
│ ┆ ▚▚▚ NOT INCOME — TESTNET ▚▚▚    [10] ┆   │
│ ┆ ╲   P R A C T I C E   ╲         [11] ┆   │
│ ┆ A refund is a new payment back  [12] ┆   │
│ ┆ to the customer. This payment        ┆   │
│ ┆ itself can't be reversed.            ┆   │
│ ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯   │
│ [ Print ]   [ Share ]   [ New sale ]  [13] │
├────────────────────────────────────────────┤
│ Coins     Tracker     History    Config    │
└────────────────────────────────────────────┘
```

- **[1] Mode strip (shared chrome, grafted)** — "TEST NETWORK — coins have no value · never income" — the grafted "· never income" suffix makes the strip itself, not just the receipt watermark, foreclose bookability; wallets may ignore the URI's `@chain_id`, so the screen carries the network unmissably on every payment surface. Research 8, 6.
- **[2] Terminal state word** — "SETTLED" in the confirmed-status token (a status color, never a mode or primary color) — the only state word that ever reads as money; on screen it is the face of the ledger's documented CONFIRMED status. Research 6.
- **[3] Receipt header** — merchant name (from Store config) + "Jul 2, 2026 · 10:07 AM" — Square receipt anatomy on the existing thermal-paper tokens, printable/shareable as-is. Research 6.
- **[4] Tender block** — "Total $12.50" then "Paid 0.00019531 BTC" — fiat is the accounting truth, crypto is the tender, mirroring Square's card-tender line; the paid figure equals the invoiced QR amount exactly. Research 6, 10.
- **[5] Rate provenance** — "Rate $64,000/BTC — locked at charge, 10:02 AM" — the Square `buyer_currency_exchange` precedent, printed; the ledger stores the same charge-time snapshot. Research 5.
- **[6] Fee lines** — "Processor fee $0.00" AND "Network fee $0.41 — paid by the customer, set by the network" — amount + who pays + how chosen; both lines always print, so the absence of one fee never implies the absence of the other. Research 2.
- **[7] Network + mode line** — "Bitcoin · TESTNET · REAL" — chain · network · provenance from the mode captured at charge time; a mode flip mid-flight can never reclassify this receipt. Research 8, 6.
- **[8] Settlement definition** — "Settled: 3 blocks mined on top of block #850,412" — the receipt itself teaches confirmations as succeeding mined blocks and names the block that holds the tx. Research 1.
- **[9] TxID chip + publicness** — wallet-style mono "tx 4f8a 29bc …… e1d9 9c2e" + "[Copy]" (toast names what was copied), then "Public record — anyone can look this transaction up, forever." Research 3, 10.
- **[10] Income stamp** — hatched band "NOT INCOME — TESTNET" (demo prints "NOT INCOME — DEMO"); on mainnet the band becomes the full booking equation "INCOME — MAINNET · REAL · CONFIRMED" (grafted — never a bare "BOOKED AS INCOME"), because only that trio ever books. Research 6, 8.
- **[11] PRACTICE watermark (grafted)** — diagonal "PRACTICE" rendered across the entire receipt body on every non-mainnet receipt (the frame hints one strut of it), including printed and shared copies, so a test receipt can never pass as real once it leaves the device — belt-and-braces over [10]. Research 8, 6.
- **[12] Refund footer** — "A refund is a new payment back to the customer. This payment itself can't be reversed." — the terminal state never implies a reversal path; a refund, if made, appears in Sale History as its own outbound row with its own txid. Research 4.
- **[13] Actions** — "[ Print ]", "[ Share ]" (shares the receipt text, never claims printing), "[ New sale ]" returns to the keypad home so the keypad stays the terminal's resting state. Research 9.

### E · Failed / expired

BTCPay's expired-invoice frame, its jargon dropped: plain-language state word, one-tap
recovery that carries the amount and rail, a late-payment watcher that quarantines
instead of silently booking, and copy that never offers a reversal — only new
payments. The frame shows the clean expiry (the common case); under-, over- and
network-failure are state swaps documented after the legend — no variant meta-labels
inside the mock.

```
┌────────────────────────────────────────────┐
│ ░ TEST NETWORK — coins have no value ·     │
│   never income ░                           │
├────────────────────────────────────────────┤
│ ◷ CODE EXPIRED                         [1] │
│ The 15-min rate lock ended before a        │
│ payment arrived. Nothing was sent —        │
│ nothing to undo.                       [2] │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ Still watching this address for 24 h.  [3] │
│ A late payment lands as NEEDS REVIEW       │
│ — not income — until you choose:           │
│ book at the locked rate, book at       [4] │
│ today's value, or return it as a           │
│ NEW payment from you.                      │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ ┌────────────────────────────────────────┐ │
│ │ RE-CHARGE $12.50 AT NEW RATE — TEST [5]│ │
│ └────────────────────────────────────────┘ │
│ Same sale, same rail — locks a fresh   [6] │
│ 15:00 and returns to Awaiting.             │
│ [ Close sale ]                         [7] │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ Recorded in Sale History as EXPIRED    [8] │
│ — never income. Whatever you choose        │
│ is recorded as it happened — the       [9] │
│ ledger never rewrites.                     │
├────────────────────────────────────────────┤
│ Coins     Tracker     History    Config    │
└────────────────────────────────────────────┘
```

- **[1] State word** — "CODE EXPIRED" in the error status token with the clock glyph — plain words ("code" is this design's own vocabulary) replacing BTCPay's "INVOICE EXPIRED" jargon; the subline "The 15-min rate lock ended before a payment arrived." names the countdown's honest meaning, and EXPIRED stays a distinct state from FAILED (see state swaps). Research 5.
- **[2] No-reversal-needed copy** — "Nothing was sent — nothing to undo." — even the benign case rehearses that undo isn't a thing; this line is the zero-received reading of C's amount check, which is how the under/over swaps below are reached. Research 4, 10.
- **[3] Late-payment watcher** — "Still watching this address for 24 h. A late payment lands as NEEDS REVIEW — not income —" — late money is explicitly quarantined in the ledger, never silently booked at a dead rate and never income until the operator decides. Research 5, 6.
- **[4] Late-payment resolution** — "book at the locked rate, book at today's value, or return it as a NEW payment from you." — the operator makes the rate call, the machine never does; "return" is a new outbound payment with its own lifecycle, never a reversal. Research 5, 6, 4.
- **[5] One-tap re-charge** — "RE-CHARGE $12.50 AT NEW RATE — TEST" — expiry recovery carries the amount and rail in the label so the last glance confirms the number; the "— TEST" suffix (amber/blue fill, per mode) means recovery can never look more bookable than the original charge. Research 5, 8.
- **[6] Re-charge contract** — "Same sale, same rail — locks a fresh 15:00 and returns to Awaiting." — a dead sale costs exactly one tap, and the volatility promise is restated at the moment of recommitment. Research 5.
- **[7] Close sale** — "Close sale" — ends the sale without erasing it: the EXPIRED row already exists (no trace-less dismiss). Research 6.
- **[8] Ledger honesty** — "Recorded in Sale History as EXPIRED — never income." — failures are recorded, not hidden; the row surfaces under History's Not income and Failed filter chips as "$0.00·NO SALE". Research 6.
- **[9] Ledger immutability** — "Whatever you choose is recorded as it happened — the ledger never rewrites." — accept-short, return, or re-charge each append rows; nothing mutates the original. Research 6, 4.

State swaps (same frame, different runtime state — never a meta-label inside the mock):

- **Underpaid** — the panel replaces [2]: "▲ PART-PAID BEFORE EXPIRY — Received 0.00015000 of 0.00019531 BTC — $2.90 short at the locked rate." with two actions replacing [5]: "[ Request balance — new code $2.90 ]" (a second, separate payment for only the difference, approved by the customer in their own wallet — this terminal never pulls funds) and "[ Accept short — book $9.60 ]" (the row records both invoiced and received; the payee decides, the machine never rounds up). Research 10, 5, 7, 6.
- **Overpaid** — the panel reads: "Overpaid? The extra goes back as a NEW payment to an address the customer gives you — the original can't be pulled back." — the surplus holds as NEEDS REVIEW — not income — until returned. Research 4, 6.
- **Failed on network** — header swaps to "✕ FAILED ON NETWORK — the transaction ran out of gas. The customer keeps their funds (minus their network fee). Nothing arrived, so there is nothing to send back." — fee truth kept even in failure, and the copy never implies the terminal reversed anything; the row books FAILED — never income — one tap away under History's Failed chip. Research 4, 2, 6.
- **Shared chrome** — the mode strip here carries the grafted suffix "TEST NETWORK — coins have no value · never income", so even the failure surface forecloses bookability on its own; tab bar and strip otherwise verbatim from the shell. Research 8, 6.

### F · Ledger (Sale History with reconciliation)

Square's transactions list, with the one column Square never needed: whether a row is income at all. The reconciliation card prints its own filter and its immutability contract next to the number; the list stays chronological under four filter chips (no hard income partition), and everything the 24 h watcher or a stopped Tracker leaves behind lands here as an explicit NEEDS REVIEW row — quarantined, never income, never silent.

```
┌────────────────────────────────────────────┐
│ ░ TEST NETWORK — coins have no value ·     │
│   never income ░                       [1] │
├────────────────────────────────────────────┤
│ Sale History             [CSV]  [Lock] [2] │
│ ┌────────────────────────────────────────┐ │
│ │ INCOME   $128.50 · 9 sales         [3] │ │
│ │ mainnet + real + settled, only; no     │ │
│ │ other row can ever move here           │ │
│ │ NOT income: $47.20 testnet ·       [4] │ │
│ │ $12.00 demo · 2 failed · 1 expired     │ │
│ │ · 2 need review                        │ │
│ └────────────────────────────────────────┘ │
│ (All) (Income) (Not income) (Failed)   [5] │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ SETTLED  Bitcoin·BTC    MAINNET·REAL   [6] │
│ 10:07 AM · 0.00019531 @ $64,000 locked [7] │
│ tx 4f8a…9c2e [copy]            +$12.50 [8] │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ SETTLED  Ethereum·USDC  TESTNET·REAL       │
│ 9:41 AM · 12.500000 @ $1.00 locked         │
│ tx 0x7b…44aa [copy]  $12.50·NOT INCOME [9] │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ NEEDS REVIEW  Bitcoin·BTC  MAINNET·REAL    │
│ 9:55 AM · arrived after the rate lock [10] │
│ [ Review: book / return ] $12.50·NOT INCOME│
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ NEEDS REVIEW  Ethereum·ETH MAINNET·REAL    │
│ 9:20 AM · watching stopped at 1 of 3  [11] │
│ [ Resume ]            $12.50·NOT INCOME    │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ EXPIRED  Bitcoin·BTC    TESTNET·REAL       │
│ 9:12 AM · no payment within rate lock      │
│ —                       $0.00·NO SALE [12] │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈   │
│ REFUND   Bitcoin·BTC    MAINNET·REAL       │
│ Yesterday · new outbound payment      [13] │
│ tx 9d21…77f0 [copy]            −$12.50     │
│  ⋮                                         │
├────────────────────────────────────────────┤
│ Coins     Tracker    ● History   Config    │
└────────────────────────────────────────────┘
```

- **[1] Mode strip** — shared chrome with the endorsed suffix: "TEST NETWORK — coins have no value · never income" — the strip itself forecloses bookability before any row, badge, or watermark has to. Research 8, 6.
- **[2] Header actions** — "[CSV]" exports fixed columns (timestamp, chain·token, crypto amount, locked rate, network, provenance, status — the same status words shown on-screen, so exports reconcile against the screen 1:1); "[Lock]" is an optional PIN that gates viewing only — taking payment never needs the PIN. Research 6, 8.
- **[3] Income card** — "INCOME $128.50 · 9 sales" with the immutability contract printed under the number: "mainnet + real + settled, only; no other row can ever move here"; the empty state stays honest — "INCOME $0.00 · 0 sales", never hidden, never padded. Research 6.
- **[4] Not-income line** — itemized by reason, never summed upward: "NOT income: $47.20 testnet · $12.00 demo · 2 failed · 1 expired · 2 need review" — test, dead, and held money is counted, visibly, outside income. Research 6, 8.
- **[5] Filter chips** — "(All) (Income) (Not income) (Failed)" — the Failed chip makes reconciling dead transactions one tap; every chip filters the same chronological list (the reconciliation card is tappable proof, Square-style; chronology is never sacrificed to the income split). Research 6.
- **[6] Row line 1** — status word first (SETTLED / NEEDS REVIEW / EXPIRED / FAILED / REFUND), chain·token, then provenance badges from the mode captured at charge time — a later mode flip can never reclassify a row; this vocabulary deliberately supersedes the old CONFIRMED|FAILED pair (SETTLED is the display word for stored CONFIRMED, and the CSV carries the same words). Research 6, 8.
- **[7] Row line 2** — "0.00019531 @ $64,000 locked" — the charge-time rate snapshot on every row (Square buyer_currency_exchange precedent), so what booked never depends on today's market. Research 5.
- **[8] Income amount** — "+$12.50" in live-green only when mainnet + REAL + settled — the only combination that ever earns a "+". Research 6.
- **[9] Not-income amount** — "$12.50·NOT INCOME" in amber, no "+" sign — a test sale can never scan as revenue. Research 6, 8.
- **[10] Late-payment quarantine** — money the 24 h watcher catches after expiry ("arrived after the rate lock") is held as NEEDS REVIEW — not income until you decide; "[ Review: book / return ]" opens the explicit choice — book at the locked rate, book at today's value, or return it as a NEW outbound payment — and whatever you choose is recorded as it happened — the ledger never rewrites. Research 5, 6, 4.
- **[11] Stopped-watch row** — a Tracker exited via Stop watching books here as NEEDS REVIEW ("watching stopped at 1 of 3"), never income; "[ Resume ]" reopens the Tracker on this same payment — resuming observation, never reversing it ("The customer has already sent — this cannot cancel or reverse their payment"). Research 6, 4, 1.
- **[12] Expired row** — records the non-event honestly: "no payment within rate lock", "$0.00·NO SALE" — failures and expiries are recorded, not hidden. Research 5, 6.
- **[13] Refund row** — a refund is its own outbound payment with its own txid and lifecycle: "new outbound payment", shown as "−$12.50", never mutating the original row it relates to. Research 4.

### G · Mode chrome (DEMO / TESTNET / MAINNET shell)

The mode strip rides under the app bar on EVERY payment surface (A–F all carry it). Because many wallets ignore ERC-681 `@chain_id`, the screen — strip, QR-card mode tag, button verb, receipt stamp — carries the network instead. One frame, three bands: the same shell in each of the three modes.

```
┌────────────────────────────────────────────┐
│ ≡ CryptoPOS Terminal        (◦ DEMO)   [1] │
│ ░ DEMO — simulated, SIM- hashes,           │
│   never income ░                       [2] │
│ QR: corner tag "DEMO" + ribbon         [3] │
│   "SIMULATED — not payable"                │
│ Button: "Simulate charge $12.50 ·      [4] │
│   locks rate 15:00"                        │
│ Receipt: hatched NOT INCOME — DEMO +   [5] │
│   diagonal PRACTICE watermark              │
├────────────────────────────────────────────┤
│ ≡ CryptoPOS Terminal        (◆ TESTNET)    │
│ ░ TEST NETWORK — coins have no value       │
│   · never income ░                     [6] │
│ QR: corner tag "TESTNET" + ribbon      [7] │
│   "TEST — coins worthless"                 │
│ Button: "Charge $12.50 — TEST ·            │
│   locks rate 15:00"                        │
│ Receipt: hatched NOT INCOME — TESTNET      │
│   + diagonal PRACTICE watermark            │
├────────────────────────────────────────────┤
│ ≡ CryptoPOS Terminal        (▲ MAINNET)    │
│ █ REAL MONEY — payments are public,    [8] │
│   permanent, no chargebacks █              │
│ QR: corner tag "MAINNET" only — no     [9] │
│   ribbon ever overlays a live code         │
│ Button: "Charge $12.50 ·                   │
│   locks rate 15:00"                        │
│ First charge only:                    [10] │
│ ┌────────────────────────────────────────┐ │
│ │ Real money from here on. No bank to   │ │
│ │ call. A refund is a new payment       │ │
│ │ from you.            [ I understand ] │ │
│ └────────────────────────────────────────┘ │
│ Re-read anytime: Config → Mode & Money     │
│ Receipt stamp: INCOME — MAINNET       [11] │
│   · REAL · CONFIRMED (solid green)         │
└────────────────────────────────────────────┘
```

- **[1] Mode pill** — app-bar pill in the existing `--mode-*` families (demo neutral, testnet blue, mainnet red); tap previews the chrome below; the real switch stays behind Terminal Config's typed-`MAINNET` gate. Research 8.
- **[2] Demo strip** — "DEMO — simulated, SIM- hashes, never income"; simulated hashes keep the `SIM-` prefix everywhere they print, so demo output can never be mistaken for chain data. Research 8, 6.
- **[3] Demo QR marking** — mode tag printed on the QR card itself (quiet-zone-safe corner, never over the code modules) plus ribbon "SIMULATED — not payable" — a screenshotted or cropped QR still carries its network. Research 8, 10.
- **[4] Demo commit verb** — "Simulate charge $12.50 · locks rate 15:00" — a demo charge never shares a verb with a real one, and the rate-lock promise rides the last thing read before committing. Research 6, 8, 5.
- **[5] Non-mainnet receipt marking** — hatched "NOT INCOME — DEMO" / "NOT INCOME — TESTNET" band plus a diagonal PRACTICE watermark on any printed/shared copy, so a test receipt can never pass as real once it leaves the device; the mode stamped is the one captured at charge time — a mode flip mid-flight can't reclassify a receipt. Research 6, 8.
- **[6] Testnet strip** — "TEST NETWORK — coins have no value · never income" — the strip itself forecloses bookability, not just the receipt watermark. Research 8, 6.
- **[7] Testnet QR + button** — corner tag "TESTNET" on the card (testnet gets the on-card mode tag too, not just demo) + ribbon "TEST — coins worthless"; button suffix "— TEST" in the testnet mode-family fill — only mainnet chrome ever carries the live charge styling, so testnet can never look bookable. Research 8.
- **[8] Mainnet strip** — red band "REAL MONEY — payments are public, permanent, no chargebacks" — the standing publicness/irreversibility warning, always on while mainnet is active; dual-placed with screen B's pre-send notice ("broadcast in clear text and can never be altered") per SOUPS. Research 3, 4.
- **[9] Mainnet QR integrity** — corner mode tag "MAINNET" only, outside the quiet zone; no ribbon or decoration ever overlays a payable code (nothing may occlude or invite tampering with a live QR); trust moves to the address-chip verbal check (B[6]–[7]). Research 10, 8.
- **[10] First-MAINNET-charge interstitial** — shown once, before the first charge after switching to MAINNET (session-scoped, so it needs no new persistence): "Real money from here on. No bank to call. A refund is a new payment from you." — the literal pre-charge irreversibility warning without adding standing copy to screen A; re-readable from "Config → Mode & Money". Research 4.
- **[11] Mainnet receipt stamp** — the full booking equation "INCOME — MAINNET · REAL · CONFIRMED" (never a bare "BOOKED AS INCOME"), printed only when all three hold — mainnet network, REAL provenance, settled state; every other combination stamps NOT INCOME per [5]. Research 6, 8.

## Copy deck

Every safety-critical string, verbatim. This deck is the maintained artifact — change copy here first, then in the build. Amounts, rates, counts, and times ($12.50, $64,000, ≈ $0.42, 15:00, 1 of 3, block #850,412) are live values; the surrounding words are fixed.

### Mode strips & shared chrome (A–F, G)
- Testnet strip: "TEST NETWORK — coins have no value · never income"
- Demo strip: "DEMO — simulated, SIM- hashes, never income"
- Mainnet strip: "REAL MONEY — payments are public, permanent, no chargebacks"

### QR card markings (B, G)
- On-card corner mode tags: "TESTNET" · "DEMO" · "MAINNET" (quiet-zone-safe; mainnet gets the tag only — no ribbon ever overlays a payable code)
- Demo ribbon: "SIMULATED — not payable"
- Testnet ribbon: "TEST — coins worthless"

### Commit buttons & first-mainnet interstitial (A, G)
- Mainnet: "Charge $12.50 · locks rate 15:00"
- Testnet: "Charge $12.50 — TEST · locks rate 15:00" (screen A renders the verb line "CHARGE $12.50 — TEST · LOCKS RATE 15:00" with the lock clause as subline)
- Demo: "Simulate charge $12.50 · locks rate 15:00"
- Interstitial (first MAINNET charge): "Real money from here on. No bank to call. A refund is a new payment from you." — "[ I understand ]" — "Re-read anytime: Config → Mode & Money"

### A · Charge
- Rate line: "1 BTC = $64,000 · rate locks for 15 min when you charge"
- Fee disclosure: "No processor fee. Network fee ≈ $0.42, paid by the customer's wallet, set by network demand right now."
- Donation link: "Donation code (address only, untracked)"

### B · Awaiting payment
- Rate-lock header: "Rate locked: 1 BTC = $64,000"
- Verbal verification: "Say the first & last 4 out loud — they must match the customer's wallet."
- Push-only status: "Waiting for the customer to approve in their wallet. This terminal never pulls funds."
- Fee attribution: "Their wallet adds the network fee ≈ $0.42, set by network demand."
- Pre-send notice: "Before they send: broadcast in clear text and can never be altered — public, traceable, permanent. No chargebacks."
- Cancel: "Cancel sale — free until they send"

### C · Detected → Confirming
- State words (stepper, persistent): "DETECTED" → "CONFIRMING" → "SETTLED"
- Detected definition: "Detected = seen in the network queue. Not money yet — wait for SETTLED before handing over goods."
- Amount check: "Amount check: received exactly 0.00019531 BTC — matches the invoice."
- Block strip: "Your payment is in block #850,412." — cells "your tx" / "mined ✓" / "mining…"
- Confirmations redefined: "1 of 3 blocks mined on top of yours. Each block on top makes reversal harder — nobody 'approves' it."
- Progress + ETA: "Confirming 1/3" · "Est. ~20 min on Bitcoin"
- Locked-rate reminder: "Rate locked at charge: $64,000/BTC. Books at this rate whatever the market does now."
- Cancel removed: "Can't cancel — it's on the public network now. A refund would be a NEW payment."
- Stop watching: "Stop watching" — "The customer has already sent — this cannot cancel or reverse their payment. Books as NEEDS REVIEW — not income; resume from its History row."

### D · Settled (receipt)
- Rate provenance: "Rate $64,000/BTC — locked at charge, 10:02 AM"
- Fee lines (both always print): "Processor fee $0.00" · "Network fee $0.41 — paid by the customer, set by the network"
- Network + mode line: "Bitcoin · TESTNET · REAL"
- Settlement definition: "Settled: 3 blocks mined on top of block #850,412"
- Publicness: "Public record — anyone can look this transaction up, forever."
- Income stamps: "INCOME — MAINNET · REAL · CONFIRMED" (mainnet only — never a bare "BOOKED AS INCOME") · "NOT INCOME — TESTNET" · "NOT INCOME — DEMO"
- Watermark (every non-mainnet receipt, printed/shared included): "PRACTICE"
- Refund footer: "A refund is a new payment back to the customer. This payment itself can't be reversed."

### E · Failed / expired
- State word + subline: "CODE EXPIRED" — "The 15-min rate lock ended before a payment arrived. Nothing was sent — nothing to undo."
- Late-payment watcher: "Still watching this address for 24 h. A late payment lands as NEEDS REVIEW — not income — until you choose: book at the locked rate, book at today's value, or return it as a NEW payment from you."
- Re-charge: "RE-CHARGE $12.50 AT NEW RATE — TEST" — "Same sale, same rail — locks a fresh 15:00 and returns to Awaiting."
- Ledger honesty: "Recorded in Sale History as EXPIRED — never income." — "Whatever you choose is recorded as it happened — the ledger never rewrites."
- Underpaid swap: "▲ PART-PAID BEFORE EXPIRY — Received 0.00015000 of 0.00019531 BTC — $2.90 short at the locked rate." — actions "Request balance — new code $2.90" · "Accept short — book $9.60"
- Overpaid swap: "Overpaid? The extra goes back as a NEW payment to an address the customer gives you — the original can't be pulled back."
- Network-failure swap: "✕ FAILED ON NETWORK — the transaction ran out of gas. The customer keeps their funds (minus their network fee). Nothing arrived, so there is nothing to send back."

### F · Ledger (Sale History)
- Income contract (printed under the total): "mainnet + real + settled, only; no other row can ever move here"
- Not-income line (itemized, never summed upward): "NOT income: $47.20 testnet · $12.00 demo · 2 failed · 1 expired · 2 need review"
- Row status words (screen and CSV identical): "SETTLED" · "NEEDS REVIEW" · "EXPIRED" · "FAILED" · "REFUND"
- Non-income amounts: "$12.50·NOT INCOME" (amber, no "+") · "$0.00·NO SALE"
- Quarantine reasons + actions: "arrived after the rate lock" — "[ Review: book / return ]" · "watching stopped at 1 of 3" — "[ Resume ]"
- Refund row: "new outbound payment" (amount shown "−$12.50")

## Research traceability

Each numbered finding from the verified brief (SOUPS 2020 / FC 2016 / CHI 2016 misconception studies; Square payment lifecycle; BTCPay; BIP 321 / ERC-681), mapped to the elements that carry it. Bracketed numbers are the callouts in each screen's legend.

| # | Finding | Where it lives |
|---|---------|----------------|
| 1 | Confirmations = blocks mined on top, not "peers who approved" | C[5] block strip · C[6] counter redefined · C[7] progress + ETA · D[8] settlement definition · F[11] "watching stopped at 1 of 3" |
| 2 | Fees: amount + who pays + how chosen; never a bare "no fees" | A[5] fee disclosure · B[9] fee attribution · D[6] dual fee lines · E network-failure swap (fee truth kept in failure) |
| 3 | Payments are public, traceable, permanent | B[10] pre-send notice (SOUPS verbatim) · C[9] "public network" · D[9] txid + public-record line · G[8] mainnet strip |
| 4 | Irreversible — a refund is a NEW outbound payment, never a reversal | A[8] / G[10] first-mainnet interstitial · B[10][11] · C[9][10] Stop watching · D[12] refund footer · E[2][4] + overpaid/failed swaps · F[10][11][13] refund row |
| 5 | Volatility: rate locked at charge, visible expiry, snapshot in ledger | A[4][8] · B[2] countdown (error color final 60 s) · C[8] · D[5] rate provenance · E[1][3][4][5][6] expiry + re-charge · F[7][10][12] · G[4] |
| 6 | Detected ≠ settled ≠ income; only mainnet + REAL + confirmed books | A[1][8][9] · B[1] · C[2][3][10] state ladder · D[2][10][11] booking equation · E[3][4][7][8][9] · F[1]–[13] the whole ledger · G[2][5][11] |
| 7 | Push-only: the payer signs in their own wallet; the POS never pulls | B[8] waiting status · E underpaid swap ("Request balance" is a second customer-approved payment) |
| 8 | Mode safety on-screen — wallets may ignore `@chain_id`; non-mainnet never looks bookable | Mode strip [1] on A–F · A[2][8] · B[4] on-card tag · D[7][10][11] · E[5] + shared chrome · F[1][6][9] · G entire screen |
| 9 | Keypad-first is a first-class crypto POS shape | A[2][6][7] keypad home + sticky rail · D[13] "New sale" returns to the keypad |
| 10 | QR is security-relevant: tampering pays; enable verbal verification | A[3] amount invariant · B[3]–[7] QR card, address chip, verbal check · C[4] amount check · D[4][9] · E underpaid swap · G[3][7][9] no-overlay rule |