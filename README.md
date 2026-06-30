# Point of Sale Hero

An interactive, dependency-free **HTML reference build** of the
[CryptoPoS crypto point-of-sale terminal](https://github.com/dowoop/crypto-pos-terminal)
(a native Android / Jetpack Compose app). It exists to answer one question before any
real tooling goes in:

> **What is the terminal *supposed* to look like, and how is it supposed to behave?**

It is a faithful, click-through port of the app's UI and core interactions — the four-tab
shell, a **blockchain → asset → sub-cart** checkout flow (keypad / product catalog), the
full payment state machine, the thermal receipt, the sales ledger, and the Terminal Config
settings tree — rebuilt cleanly so the layout is consistent and the design tokens are a
single source of truth.

**Live demo:** https://dowoop.github.io/Point-of-Sale-Hero/

Everything runs locally in the browser. There is no build step, no framework, no network,
and no real funds. Open `index.html` and it works.

---

## Run it

```bash
# just open the file…
open index.html            # macOS  (xdg-open on Linux)

# …or serve it (any static server)
python3 -m http.server 8000   # then visit http://localhost:8000
```

On a desktop it renders inside a phone frame (with a light/dark toggle); on a phone it
goes full-bleed and behaves like the app.

---

## What's in it

| Tab | What you can do |
|---|---|
| **Coins** *(home)* | The flow starts here. **Choose a blockchain → choose an asset → a sub-cart** showing the chosen network, asset, live exchange rate, amount due, crypto equivalent and network fee — with the **keypad** (or **Product Catalog** cart) below to build the amount. Then **Generate Payment QR** (or an address-only **donation code**). |
| **Live Tracker** | Watches a checkout settle. Real, scannable QR. The **Consensus Sandbox** buttons drive the state machine: **Fast / Slow** settle, **Out-Of-Gas / Double-Spend** fail. Ends on a **thermal receipt** (or a failure card). |
| **Sale History** | The sales ledger with a **reconciliation card** that books *only* Mainnet + REAL + Confirmed sales as income — testnet/demo sales are recorded but never counted. Export CSV, clear ledger. |
| **Terminal Config** | Mode & Money (terminal mode, baseline currency, sales tax, tips) · Payment Rails (accordion, READY / NEEDS SETUP) · Store (merchant name, cashier screen, catalog) · Security & Books (operator lock, chain status, danger zone) · the **Go-Live — Mainnet** checklist with a typed-`MAINNET` gate. |

Plus: the mode pill (tap to preview **Testnet / Mainnet / Demo** chrome), the navigation
drawer, and a first-run **Setup wizard** (drawer → Setup wizard).

### The payment state machine

```
Idle → Awaiting (QR shown) → Mempool detected → Confirming (n/N) → Settled (receipt)
                                                              └────→ Failed
                          (Donation / untracked code is a terminal-only branch)
```

This mirrors `PaymentSessionState` / `PosViewModel` in the source app.

---

## Design tokens (one source of truth)

Pulled 1:1 from the app's Compose theme and centralized in `styles.css` `:root`. **Every**
status/badge color is defined for *both* light and dark.

| Role | Light — "Clean Minimalist" | Dark — "Terminal Slate" |
|---|---|---|
| Background | `#FEF7FF` | `#0B0E14` |
| Surface | `#FFFFFF` | `#161B22` |
| Primary | `#6750A4` (purple) | `#00E676` (emerald) |
| On-surface | `#1D1B20` | `#FFFFFF` |
| Outline | `#CAC4D0` | `#3A434E` |
| Error | `#B3261E` | `#FF6B6B` |

Status: live `#2E7D32` / demo `#B26A00` / untracked `#6A4BB2` / refund `#7C4DFF`.
Chain brands: BTC `#F7931A` · ETH `#8E24AA` · SOL `#00E5FF` · POL `#8247E5` ·
XMR `#FF6600` · Tari L2/XTR `#C0179C` · Tari L1/XTM `#7E57C2` · USDC `#2775CA`.
Spacing/radius follow the app's `Dimens.kt` 4dp scale.

---

## Layout inconsistencies this build fixes

The original `site/demo.*` prototype in the source repo had drifted. This rebuild corrects:

1. **Fake QR → real QR.** The old demo hand-painted a non-scannable canvas pattern. This
   build uses the vendored MIT [`qrcode-generator`](assets/qrcode.js) to emit genuine,
   scannable BIP-21 / Solana Pay / EIP-681 / Monero URIs (from clearly-marked **SAMPLE**
   receiving addresses).
2. **Emoji/Unicode glyphs → real vector icons.** A cohesive Material-style SVG icon set
   ([`assets/icons.js`](assets/icons.js)) replaces emoji that rendered differently per OS.
3. **Light-only pastels → fully themed.** Status pills, the clear key, badges and cards now
   have proper light **and** dark values instead of pale fills that washed out on the dark
   surface.
4. **Ticker-on-disc coin glyphs** are now legible — per-coin ink color (e.g. dark text on
   cyan Solana) and a subtle highlight, instead of low-contrast white-on-light.
5. **Ragged 7-into-4 grid → clean 2-column** coin gallery.
6. **Three divergent color/brand palettes → one** canonical token set (the `Color.kt`-derived
   values above).
7. **Dead decimal key → working** decimal entry on the keypad.
8. **Ad-hoc z-index → a documented scale**, and a responsive phone frame that scales to the
   viewport instead of overflowing.

---

## Project layout

```
index.html        # phone-frame shell
styles.css        # design system + every component (tokens in :root)
app.js            # state, render loop, all screens, the payment state machine
assets/icons.js   # Material-style SVG icon set
assets/qrcode.js  # vendored MIT qrcode-generator (real, scannable codes)
```

No package manager, no transpiler. Add tooling on top whenever you're ready — the contract
between markup, tokens, and behavior is deliberately plain.

---

## Honesty notes

- **It's a simulation.** No network is contacted; checkouts are driven by the sandbox
  buttons. The receipt always carries a "browser demo — no funds moved" line.
- **Addresses are samples.** The QR codes are real and scannable, but the addresses inside
  them are obvious placeholders and are not payable.
- This is a *layout/interaction* reference, not the production app. For what is real vs.
  simulated in the actual terminal, see the source repo's `AUTOPSY.md` / `docs/autopsy/`.

## Credits

QR encoding by [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator)
(© Kazuhiko Arase, MIT). Everything else in this repo is MIT-licensed — see [LICENSE](LICENSE).
