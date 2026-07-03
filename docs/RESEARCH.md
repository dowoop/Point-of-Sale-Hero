# Research — why the layout says what it says

The evidence base behind [LAYOUT.md](LAYOUT.md). Deep-research run of 2026-07-02:
5 search angles, 22 sources fetched, 110 claims extracted, top 25 adversarially
verified by independent 3-vote panels — **25 confirmed, 0 refuted**. Merged into the
12 findings below; LAYOUT.md cites them as "Research 1–10" (its brief condenses
findings 1–12 into ten design points).

## The misconceptions (what payers and payees get wrong)

**1 · Confirmations are misread as approvals.** Users commonly interpret the
confirmations counter as "a number of miners or peers who signed, approved, or
validated their transaction" — not succeeding mined blocks. Even experts wrongly
treat a fixed count as the security threshold. Among active Bitcoin users, only about
half could explain mining; 2 of 10 could define a block. *(SOUPS 2020 §4.6, N=29;
CHI 2016, N=10)* → Status copy must define confirmations as **blocks mined on top**
and can assume nothing.

**2 · Fees are a mystery — and flagship crypto POS copy lies about them.** Study
participants believed fees are fixed, set by an administrator, or chosen by miners;
without tool guidance users may overpay. BTCPay Server markets "accept
cryptocurrencies without fees" — true only of processor fees, eliding miner fees (its
own settings pass network fees to the customer). *(SOUPS 2020 §4.3.2; BTCPay docs)*
→ State **fee amount + who pays + how chosen**; never a bare "no fees".

**3 · The anonymity myth — best-documented misconception, three independent
studies.** Many users believe the blockchain is encrypted by default; 32.3% of 990
surveyed Bitcoin users believed Bitcoin is per-se anonymous (it is only
pseudonymous); 9 of 10 CHI interviewees thought it provides good privacy despite
wallet clustering and traffic analysis. *(SOUPS 2020; FC 2016 n=990; CHI 2016)*
→ Say plainly: payments are **public, traceable, permanent**.

**4 · Permanent loss is mainstream, not an edge case.** No chargebacks, no bank to
call; 22.5% of surveyed users had lost bitcoins or keys at least once — 43.2% of
those by their own error — and most losses were permanent. *(FC 2016 §7.4; CHI 2016)*
→ Pre-charge warnings; failure copy never implies a reversal path; a **refund is a
new outbound payment**, never a reversal.

**5 · Volatility is users' #1 perceived risk** — ranked above wallet hacks and
malware theft. *(FC 2016 §7.3)* Mainstream POS answers at the data-model level:
Square's Payment object records `buyer_currency_exchange` details at charge time
(documented example: bitcoin lightning). → **Lock the rate at charge time**, show the
window, snapshot rate + mode into the ledger.

**6 · The interface is the intervention ("cryptocurrency tool bias").** Wallet and
exchange interfaces measurably shape users' mental models — including the wrong ones.
The study's prescriptions: visualize **which block** holds the transaction and how
many confirmed blocks follow; warn pre-send that the transaction is "broadcast in
clear text" and can never be altered. *(SOUPS 2020 §4.6, §5.1 — a recommendation,
not a tested intervention)* → Screen copy is a first-order design surface.

## How real POS tooling operates

**7 · Approval ≠ settlement ≠ income.** Square models a payment as exactly five
states — APPROVED, PENDING, COMPLETED, CANCELED, FAILED (last three terminal) — and
separates authorization from capture (untouched approvals auto-cancel after 36 h
card-present). Crypto mapping: **seen-in-mempool = detected, never income**; only the
terminal confirmed state books — the evidence trail for the honest-ledger rule
(mainnet + REAL + confirmed only). *(Square Payments API)*

**8 · Refunds are asynchronous objects even on card rails.** Square refunds have
their own state machine (PENDING → COMPLETED/FAILED/REJECTED; up to 14 days
pending). On-chain, where nothing reverses, a refund can only be a **new outbound
payment with its own lifecycle and ledger row**. *(Square Refunds API + finding 4)*

**9 · Keypad-first is a validated crypto-POS shape.** BTCPay Server ships a
keypad-only "Light view" as a first-class PoS mode and settles non-custodially to
the merchant's own wallet. The individual-first direction (keypad, per-sale codes,
self-custody) is an established product shape, not a retail derivative. BTCPay also
locks the invoice exchange rate for a default 15-minute window as volatility
protection. *(BTCPay docs)*

**10 · The QR standards define the payload — and the mode-safety hook.**
BIP 21 is formally superseded by the backward-compatible **BIP 321** (amounts MUST
be decimal BTC, period separator, no commas; addressless multi-rail URIs allowed).
**ERC-681** (Final) governs `ethereum:` — an ERC-20/stablecoin payment is a
structurally different payload (a `/transfer` call on the token contract, amount in
atomic units), and the optional `@chain_id` explicitly targets mainnet vs testnets;
without it, the payer's current wallet network silently applies. *(BIP 321; EIP-681)*

**11 · Crypto POS is push-only.** Wallets MUST NOT act on a payment URI without user
authorization; only the payer's wallet can sign a send. The terminal never pulls —
its state machine models "request displayed, waiting for the payer to approve in
their own wallet." *(BIP 21/321; EIP-681)*

**12 · QR integrity is a security surface.** ERC-681's security section: with
irreversible transactions, "changing either the recipient address or the amount
transferred can be a profitable attack." → Address prefix/suffix verbal
verification; nothing overlays a payable code. *(EIP-681)*

## Caveats

The misconception studies are 2015–2020 with small or self-selected samples (SOUPS
2020 N=29 qualitative; FC 2016 n=990 but 2015-era bitcointalk/Twitter, 85% male;
CHI 2016 N=10, all male). The **percentages describe 2015-era enthusiasts** — do not
quote as current population rates — though post-2020 corroboration confirms the
misconceptions persist. The SOUPS design prescriptions are untested recommendations.
Wallet support for BIP 321 extras and ERC-681 `chain_id`/token params is uneven
(some major wallets parse only the address) — `@chain_id` is a signal, not
enforcement, which is why LAYOUT.md carries mode on-screen everywhere. BTCPay
"without fees" is marketing copy critiqued here, not endorsed. Square docs verified
live 2026-07; vendor APIs change.

## Open questions (did not survive verification / not yet researched)

1. **Tax & AML/KYC grounding.** No tax-law claims survived verification. The
   "what is income" copy rests on Square's settlement model, not IRS guidance — the
   ledger's income rule needs legal review before anyone treats it as tax advice.
2. **Wallet compatibility matrix (2026).** Which wallets actually parse ERC-681
   `chain_id`/amount/token and BIP 321 multi-rail URIs? Needed before relying on
   QR-encoded network targeting for anything beyond labeling.
3. **Does the copy work?** No A/B or usability evidence exists for the SOUPS-style
   status visualizations at a real counter.
4. **Crypto-native refund flow.** How to return funds when the payer's address may
   not be reusable — no verified evidence surfaced; LAYOUT.md's "address the
   customer gives you" is design reasoning, not cited practice.

## Sources

Primary: [SOUPS 2020, Mai et al.](https://www.usenix.org/system/files/soups2020-mai.pdf) ·
[FC 2016, Krombholz et al.](https://fc16.ifca.ai/preproceedings/33_Krombholz.pdf) ·
[CHI 2016, Gao et al.](https://dl.acm.org/doi/10.1145/2858036.2858049) ·
[BIP 21](https://en.bitcoin.it/wiki/BIP_0021) ·
[BIP 321](https://github.com/bitcoin/bips/blob/master/bip-0321.mediawiki) ·
[ERC-681](https://eips.ethereum.org/EIPS/eip-681) ·
[Square Payment object](https://developer.squareup.com/reference/square/objects/Payment) ·
[Square delayed capture](https://developer.squareup.com/docs/payments-api/take-payments/card-payments/delayed-capture) ·
[Square refunds](https://developer.squareup.com/docs/payments-api/refund-payments) ·
[BTCPay apps](https://docs.btcpayserver.org/Apps/) ·
[BTCPay invoices](https://docs.btcpayserver.org/Invoices/) ·
[BTCPay FAQ](https://docs.btcpayserver.org/FAQ/General/)
