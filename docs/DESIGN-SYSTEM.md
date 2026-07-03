# Design system

One palette, two themes, defined once in `styles.css :root` /
`[data-theme="light"|"dark"]`. Every status/badge color exists in **both** themes —
never hardcode a hex in a component when a token exists. Values below mirror
`styles.css` (the source of truth if they ever drift).

## Core tokens

| Token | Light — "Clean Minimalist" | Dark — "Terminal Slate" |
|---|---|---|
| `--bg` | `#FEF7FF` | `#0B0E14` |
| `--surface` | `#FFFFFF` | `#161B22` |
| `--surface-variant` | `#F3EDF7` | `#21262D` |
| `--on-surface` | `#1D1B20` | `#FFFFFF` |
| `--on-surface-variant` | `#49454F` | `#C2CBD3` |
| `--outline` | `#CAC4D0` | `#3A434E` |
| `--primary` | `#6750A4` (purple) | `#00E676` (emerald) |
| `--on-primary` | `#FFFFFF` | `#00210F` |
| `--secondary-container` | `#E8DEF8` | `#13294B` |
| `--error` | `#B3261E` | `#FF6B6B` |

## Status colors

| Role | Light | Dark |
|---|---|---|
| Live green | `#1B7A3D` (dot `#2E7D32`) on `#E7F5EC` | `#4CAF50` on `#12351F` |
| Demo amber | `#B26A00` on `#FBEEDA` | `#FFB74D` on `#3A2A05` |
| `--status-warn` (NEEDS REVIEW / amount-check warn / NOT-INCOME amounts) | `#B26A00` | `#FFB74D` |
| `--status-refund` (REFUND rows) | `#7C4DFF` | `#B39DDB` |
| Untracked | `#6A4BB2` | `#B39DDB` |

## Mode families (`--mode-*`)

Testnet = blue, mainnet = red, demo = neutral. Each mode has the soft pill pair
(`-bg`/`-fg`/`-dot`) plus a **solid/strong fill** (`-solid-bg`/`-solid-fg`) for the
commit button and the mainnet strip band:

| Token pair | Light | Dark |
|---|---|---|
| `--mode-testnet-bg/fg` | `#E3EDFB` / `#133A63` | `#13294B` / `#CBDDFF` |
| `--mode-mainnet-bg/fg` | `#FBE7E4` / `#8C1D18` | `#4A1414` / `#FFD7D2` |
| `--mode-demo-bg/fg` | `#ECE7F6` / `#4A3D6B` | `#21262D` / `#C2CBD3` |
| `--mode-testnet-solid-bg/fg` | `#1D5BBF` / `#FFFFFF` | `#2979FF` / `#06203F` |
| `--mode-demo-solid-bg/fg` | `#5D5470` / `#FFFFFF` | `#77828E` / `#0C1116` |
| `--mode-mainnet-solid-bg/fg` | `#B3261E` / `#FFFFFF` | `#E5484D` / `#2A0A0A` |

The **receipt stays light "thermal paper" in both themes** (`--receipt-*`:
bg `#FFFFFF` light / `#F6F3FB` dark, ink `#1D1B20` both), and that rule now extends
to **QR cards**: the card and its quiet zone stay white in both themes for
scanability, so the QR marking pairs are theme-invariant (repeated per theme block
by convention):

| Token | Light | Dark |
|---|---|---|
| `--qr-card-bg` | `#FFFFFF` | `#FFFFFF` |
| `--qr-testnet-bg/fg` | `#1D5BBF` / `#FFFFFF` | same |
| `--qr-demo-bg/fg` | `#5D5470` / `#FFFFFF` | same |
| `--qr-mainnet-bg/fg` | `#FBE7E4` / `#8C1D18` | same |
| `--receipt-income-bg/fg` | `#1B7A3D` / `#FFFFFF` | same |
| `--receipt-hold-fg` | `#8A5A00` | same |
| `--receipt-watermark` | `rgba(178,106,0,0.18)` | same |

## Chain brand tokens (`--c-*` / `--ink-*`)

| Chain | Brand | Ink on disc |
|---|---|---|
| Bitcoin BTC | `#F7931A` | white |
| Ethereum ETH | `#8E24AA` | white |
| Solana SOL | `#00E5FF` | **dark** `#06303A` (cyan needs dark ink) |
| Polygon POL | `#8247E5` | white |
| Monero XMR | `#FF6600` | white |
| Tari L2 XTR | `#C0179C` | white |
| Tari L1 XTM | `#7E57C2` | white |
| USDC | `#2775CA` | white |

The same hexes live in the `CHAINS` array in `app.js`; `coinDisc()` passes them as
inline `--brand`/`--ink` values.

## Component conventions

- **Mode strip** (`.mode-strip`) — persistent band under the app bar on every payment
  surface (Coins, Tracker, History; Config keeps the older subtitle/bar chrome).
  Testnet/demo wear their soft `-bg/-fg` pair; mainnet wears the solid red fill.
- **Charge button** — `.charge-btn.two-line` renders the commit copy as
  `.cb-verb` (uppercase verb line) + `.cb-lock` (smaller lock clause, or the
  disabled-with-reason line). Fills: `.live` (green `--status-live`) is worn by
  **mainnet only**; `.mode-testnet` / `.mode-demo` wear the solid mode fills — a
  non-mainnet charge can never look bookable.
- **QR card** (`.qr-card`) — white in both themes; the mode ribbon (`.qr-ribbon`,
  testnet/demo only) sits **above** the code and the corner mode tag (`.qr-tag`, all
  modes) sits in a row **below** it — nothing ever overlays a payable code's modules.
  Mainnet gets the tag only, no ribbon.
- **Block strip** (`.block-strip`) — `.blk.you` (primary border) → `.blk.mined`
  (live-green fill) → `.blk.next` (dashed), joined by `.blk-arr` arrows.
- **History row** (`.hrow`) — 3-line anatomy: `.hrow-l1` status word
  (`st-settled/review/expired/failed/refund` colors) + chain·token + charge-time mode
  badge (soft `--mode-*` pair); `.hrow-l2` time · rate snapshot or reason;
  `.hrow-l3` tx chip (or honest "—") + amount (`income/hold/nosale/refund` classes);
  plus an optional `.hrow-act` action line on NEEDS-REVIEW rows.
- **Thermal receipt bands** — `.r-stamp.income` solid green booking equation;
  `.r-stamp.not` hatched via a 135° `repeating-linear-gradient` of
  `--receipt-hold-fg` over the paper; `.r-watermark` overlays the diagonal PRACTICE
  word (`rotate(-24deg)`, `--receipt-watermark`) on every non-mainnet receipt.
- **Bottom nav** — 4 equal columns (`grid-template-columns: repeat(4, 1fr)`).

## Scale & shape

- **Spacing** — 4dp scale: 2 / 4 / 8 / 12 / 16 / 24 / 32 (`--s-xxs` … `--s-xxl`).
- **Radius** — 6 / 8 / 12 / 16 / 999 (`--r-sm` / `--r-md` / `--r-lg` / `--r-pill` /
  `--r-round`).
- **Type** — Roboto stack (`--font-sans`), mono for addresses/hashes (`--font-mono`).
- **Phone frame** — 412×860 outer, 12px bezel, 44px radius; full-bleed under 540px.
- **z-scale** — statusbar 5 (notch +1) · bottom nav 10 · overlay 40 (scrims and
  full-screen overlays; drawer/sheet sit at +1, dialogs at +2) · toast 60.
  `--z-appbar: 10` is declared but unused — the app bar is in normal flow.
  `#overlay-root` still sits inside `.viewport`, so scrims cover the screen area but
  **not** the bottom nav, which stays tappable underneath (a documented gap — see
  SCREENS.md).
- Bare `<svg>` in the viewport/drawer/dialog defaults to 24×24; component icons are
  sized by scoped selectors (`.qr-frame svg` **and** `.qr-code svg` must stay 100%
  wide — mind rule order).
- Icons: `assets/icons.js` (`window.ICONS`, Material-style 24×24 path strings).

## Refinements proposed by the retail exploration (not applied)

The 2026-07-01 exploration refined some values against the Figma frames. Kept here in
case they're wanted when a redesign lands: light surface `#FFFBFE`, light
surface-variant `#E7E0EC`, confirmed green `#108A3F` on `#E0F7EA`, demo yellow
fg `#594700` on `#FCF09C`, error `#B00D0D`, BTC `#F4960D`, ETH `#627EEA`,
SOL `#9945FF`; plus an `--on-status-live` token (white in light / dark-green ink in
dark) because white text on the dark theme's `#4CAF50` fills has poor contrast today
(now also relevant to the mainnet `.charge-btn.live` fill).
