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
| Untracked | `#6A4BB2` | `#B39DDB` |
| Refund | `#7C4DFF` | `#B39DDB` |

Mode pills: testnet = blue family, mainnet = red family, demo = neutral family
(`--mode-*` tokens). The receipt stays light "thermal paper" in both themes
(`--receipt-*` tokens).

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

## Scale & shape

- **Spacing** — 4dp scale: 2 / 4 / 8 / 12 / 16 / 24 / 32 (`--s-xxs` … `--s-xxl`).
- **Radius** — 6 / 8 / 12 / 16 / 999 (`--r-sm` … `--r-round`).
- **Type** — Roboto stack (`--font-sans`), mono for addresses/hashes (`--font-mono`).
- **Phone frame** — 412×860 outer, 12px bezel, 44px radius; full-bleed under 540px.
- **z-scale** — statusbar 5 · appbar/nav 10 · overlay 40 · toast 60. `#overlay-root`
  sits inside `.viewport`, so scrims cover the screen area but **not** the bottom nav
  (a documented gap — see SCREENS.md).
- Bare `<svg>` in the viewport/drawer/dialog defaults to 24×24; component icons are
  sized by scoped selectors (`.qr-frame svg` must stay 100% wide — mind rule order).
- Icons: `assets/icons.js` (`window.ICONS`, Material-style 24×24 path strings).

## Refinements proposed by the retail exploration (not applied)

The 2026-07-01 exploration refined some values against the Figma frames. Kept here in
case they're wanted when a redesign lands: light surface `#FFFBFE`, light
surface-variant `#E7E0EC`, confirmed green `#108A3F` on `#E0F7EA`, demo yellow
fg `#594700` on `#FCF09C`, error `#B00D0D`, BTC `#F4960D`, ETH `#627EEA`,
SOL `#9945FF`; plus an `--on-status-live` token (white in light / dark-green ink in
dark) because white text on the dark theme's `#4CAF50` fills has poor contrast today.
