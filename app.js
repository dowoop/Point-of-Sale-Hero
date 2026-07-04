/* ============================================================================
   Point of Sale Hero — interactive reference build of the CryptoPoS terminal.

   A faithful, framework-free port of the Android (Jetpack Compose) terminal:
   the same five-tab shell, the keypad / product-catalog flow, the "Pay with"
   chain selector, the Idle → Awaiting → Mempool → Confirming → Settled / Failed
   payment state machine, the thermal receipt, the coin gallery, the sales
   ledger with mainnet-vs-testnet reconciliation, and the Terminal Config
   settings tree.

   Everything is simulated locally — no network, no real funds. Payment QRs are
   REAL, scannable codes (BIP-21 / Solana Pay / EIP-681 / Monero URI) built from
   clearly-marked SAMPLE receiving addresses.
   ========================================================================== */
(function () {
  "use strict";

  /* ---- data: rails (ChainDisplays.ALL + Color.kt brand tokens) ------------- */
  const CHAINS = [
    { key: "Bitcoin",  name: "Bitcoin",  sym: "BTC", tokens: ["BTC"],         brand: "#F7931A", ink: "#fff",     group: "instant", coin: "live", rail: "ready", confs: 3 },
    { key: "Ethereum", name: "Ethereum", sym: "ETH", tokens: ["USDC", "ETH"], brand: "#8E24AA", ink: "#fff",     group: "instant", coin: "live", rail: "ready", confs: 3, chainId: 1 },
    { key: "Solana",   name: "Solana",   sym: "SOL", tokens: ["USDC", "SOL"], brand: "#00E5FF", ink: "#06303a",  group: "instant", coin: "live", rail: "ready", confs: 2 },
    { key: "Polygon",  name: "Polygon",  sym: "POL", tokens: ["USDC", "POL"], brand: "#8247E5", ink: "#fff",     group: "instant", coin: "live", rail: "setup", confs: 2, chainId: 137 },
    { key: "Monero",   name: "Monero",   sym: "XMR", tokens: ["XMR"],         brand: "#FF6600", ink: "#fff",     group: "private", coin: "live", rail: "ready", confs: 3 },
    { key: "Tari",     name: "Tari L2",  sym: "XTR", tokens: ["XTR"],         brand: "#C0179C", ink: "#fff",     group: "private", coin: "live", rail: "ready", confs: 1 },
    { key: "Minotari", name: "Tari L1",  sym: "XTM", tokens: ["XTM"],         brand: "#7E57C2", ink: "#fff",     group: "private", coin: "demo", rail: "setup", confs: 1 },
  ];
  const RATES = { BTC: 64000, ETH: 3500, SOL: 150, POL: 0.55, USDC: 1, XMR: 165, XTR: 0.12, XTM: 0.02 };
  const CONFS = { Bitcoin: 3, Ethereum: 3, Solana: 2, Polygon: 2, Monero: 3, Tari: 1, Minotari: 1 };

  let PRODUCTS = [
    { id: 1, name: "Artisan Avocado Toast", price: 12.0, cat: "Foods", ico: "food", fav: false },
    { id: 2, name: "Hardware Cold Storage Kit", price: 95.0, cat: "Hardware", ico: "dns", fav: false },
    { id: 3, name: "Organic Espresso", price: 3.2, cat: "Beverages", ico: "coffee", fav: false },
  ];

  const MODES = {
    testnet: { pill: "Testnet", cls: "testnet", sub: "Real test networks · valueless coin · never income", bar: null, net: "TESTNET" },
    mainnet: { pill: "Mainnet", cls: "mainnet", sub: null, bar: "MAINNET — REAL FUNDS", net: "MAINNET" },
    demo:    { pill: "Demo Sandbox", cls: "demo", sub: "Practice mode — nothing real settles", bar: null, net: "DEMO" },
  };
  const MODE_CYCLE = { testnet: "mainnet", mainnet: "demo", demo: "testnet" };

  /* Mode strip — persistent chrome under the app bar on every payment surface.
     Strings are the LAYOUT.md copy deck, verbatim. */
  const MODE_STRIP = {
    testnet: { cls: "testnet", text: "TEST NETWORK — coins have no value · never income" },
    demo:    { cls: "demo",    text: "DEMO — simulated, SIM- hashes, never income" },
    mainnet: { cls: "mainnet", text: "REAL MONEY — payments are public, permanent, no chargebacks" },
  };

  /* 15-minute rate lock, set at charge time */
  const RATE_LOCK_MS = 15 * 60 * 1000;

  /* Ledger status vocabulary — display words for stored statuses (stored data
     stays backward compatible: CONFIRMED is stored, SETTLED is displayed). */
  const STATUS_WORDS = { CONFIRMED: "SETTLED", NEEDS_REVIEW: "NEEDS REVIEW", EXPIRED: "EXPIRED", FAILED: "FAILED", REFUND: "REFUND" };
  const displayStatus = (st) => STATUS_WORDS[st] || st;

  const SAMPLE_ADDR = {
    Bitcoin: "bc1qsamplep0sherodemoaddr0xk3n9q7w2vr5t8u",
    Ethereum: "0x5AmpLEp0sHer0DemoEvmReceiv1ngAddr00b85C",
    Solana: "So1aP0sHeroSampLEDemoReceiveAddr29x9Rk7",
    Polygon: "0x5AmpLEp0sHer0DemoEvmReceiv1ngAddr00b85C",
    Monero: "49P0sHeroSampleDemoSubaddrXmrReceive00R7",
    Tari: "tari://sample_p0shero_demo_ootle_component",
    Minotari: "minotari_sample_p0shero_demo_l1_address",
  };
  const USDC = {
    sol: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    eth: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    pol: "0x3c499c542cEF5E3811e1192ce70d8cc03d5c3359",
  };

  /* Testnet-flavored SAMPLE receiving addresses (Sepolia / Amoy / tb1q testnet
     style) — clearly placeholders, used when the charge is made in testnet mode
     so the QR never encodes a network that contradicts the mode. */
  const TESTNET_ADDR = {
    Bitcoin: "tb1qsamplep0sherotestnetaddr0xk3n9q7w2vr5",
    Ethereum: "0x5AmpLEp0sHer0TestnetEvmReceiv1ngAddr11a4",
    Solana: "So1aP0sHeroSampLeDevnetReceiveAddr29x9Rk7",
    Polygon: "0x5AmpLEp0sHer0TestnetEvmReceiv1ngAddr11a4",
    Monero: "59P0sHeroSampleStagenetSubaddrXmrRecv00R7",
    Tari: "tari://sample_p0shero_testnet_ootle_component",
    Minotari: "minotari_sample_p0shero_testnet_l1_address",
  };
  /* Testnet SAMPLE token contracts — placeholders for the Sepolia / Amoy /
     devnet USDC deployments (this is a reference build; the shape matters). */
  const USDC_TEST = {
    sol: "SampLeDevnetUsdcM1ntP0sHero8G4wEGGkZwyTD",
    eth: "0x5AmpLeSepoliaTestUsdcT0kenC0ntract1155a2",
    pol: "0x5AmpLeAmoyTestUsdcT0kenC0ntract00080002b",
  };
  /* EVM chain ids per mode — mainnet @1/@137, testnet @11155111 (Sepolia) /
     @80002 (Amoy). The id is chosen from the mode captured at charge time. */
  const CHAIN_IDS = {
    mainnet: { Ethereum: 1, Polygon: 137 },
    testnet: { Ethereum: 11155111, Polygon: 80002 },
  };
  const payAddress = (chainKey, mode) =>
    mode === "demo" ? "SIM-" + SAMPLE_ADDR[chainKey]
    : mode === "testnet" ? TESTNET_ADDR[chainKey]
    : SAMPLE_ADDR[chainKey];

  /* Fee disclosure — LAYOUT.md A[5], the same verbatim anatomy for every rail:
     amount + who pays + how chosen, always on-surface, never behind an ⓘ-tap.
     FEE_EST is the bare per-rail estimate (a live value) for surfaces that
     name the fee inline (Tracker fee attribution, receipt fee lines). */
  const FEE_EST = {
    Bitcoin: "$0.42",
    Ethereum: "$1.20",
    Polygon: "$0.01",
    Solana: "$0.001",
    Monero: "$0.03",
    Tari: "$0.01",
    Minotari: "$0.01",
  };
  const FEE_COPY = {};
  Object.keys(FEE_EST).forEach((k) => {
    FEE_COPY[k] = `No processor fee. Network fee ≈ ${FEE_EST[k]}, paid by the customer's wallet, set by network demand right now.`;
  });

  /* Payment Rails screen — per-rail readiness config copy (matches screenshots) */
  const RAIL_CFG = {
    Bitcoin:  { title: "Bitcoin (BTC)", sub: "Receiving address set", status: "ready" },
    Ethereum: { title: "Ethereum (USDC · ETH)", sub: "Receiving address set", status: "ready" },
    Polygon:  { title: "Polygon (USDC · POL)", sub: "Demo placeholder address — replace it with your wallet's", status: "setup" },
    Solana:   { title: "Solana (USDC · SOL)", sub: "Receiving address set", status: "ready" },
    Monero:   { title: "Monero (XMR)", sub: "Real detector — view-key wallet-rpc configured", status: "ready" },
    Tari:     { title: "Tari Ootle L2 (XTR)", sub: "Real indexer + account configured (loyalty and refunds optional)", status: "ready" },
    Minotari: { title: "Tari L1 (XTM)", sub: "Demo placeholder — add a view key to track", status: "setup" },
  };
  const RAIL_ORDER = ["Bitcoin", "Ethereum", "Polygon", "Solana", "Monero", "Tari", "Minotari"];

  /* Go-Live checklist — the configured rails and their blockers (from screenshot) */
  const GOLIVE = [
    { key: "Ethereum", name: "Ethereum", ok: true, state: "READY · USDC, ETH" },
    { key: "Bitcoin",  name: "Bitcoin",  ok: false, state: "the Bitcoin receiving address is not a valid Mainnet address" },
    { key: "Solana",   name: "Solana",   ok: true, state: "READY · USDC, SOL" },
    { key: "Polygon",  name: "Polygon",  ok: false, state: "the Polygon receiving address is still the demo placeholder — set your own wallet" },
    { key: "Monero",   name: "Monero (XMR)", ok: false, state: "live exchange rates are unavailable for XMR (price feed unreachable or this token wasn't priced live) — prices would be stale" },
    { key: "Tari",     name: "Tari Ootle L2 (XTR)", ok: false, state: "live exchange rates are unavailable for XTR (price feed unreachable or this token wasn't priced live) — prices would be stale" },
  ];

  /* ---- state --------------------------------------------------------------- */
  const S = {
    tab: "coins",
    mode: "testnet",
    modePreview: null, // pill chrome preview (LAYOUT G[1]): null | "demo" | "testnet" | "mainnet" — never the real mode
    chain: "Ethereum", // last-used rail — persists across sales in-session
    token: "USDC",
    subtab: "keypad",
    draft: "",
    cart: [], // [{id, qty}]
    payment: { state: "idle" },
    ledger: [], // seeded from seedLedger() at init/reset
    txCounter: 0,
    histFilter: "all", // Sale History filter chip: all | income | notincome | failed
    drawer: false,
    dialog: null, // {kind, ...}
    sheet: null, // chain-gallery bottom sheet: null | {step:"chains"} | {step:"asset", chain}
    firstMainnetAck: false, // session-scoped: first-MAINNET-charge interstitial acknowledged
    settingsSection: null, // mode | rails | store | security | golive
    railOpen: null,
    onboarding: null, // null | {step, mode, picked:{}}
    timers: [],
    // settings values
    merchant: "CryptoPOS Terminal",
    baseline: "USD",
    taxPct: 0,
    tips: false,
    staff: [],
    catalogFirst: false,
    pin: null,
    historyLocked: false,
    heights: { Bitcoin: 2580431, Ethereum: 20419773, Solana: 281944120, Polygon: 60192344, Monero: 3204881, Tari: 1204831, Minotari: 451208 },
  };

  /* ---- dom + helpers ------------------------------------------------------- */
  const screen = document.getElementById("screen");
  const navEl = document.getElementById("bottomnav");
  const overlayRoot = document.getElementById("overlay-root");
  const toastEl = document.getElementById("toast");

  const clearTimers = () => { S.timers.forEach(clearTimeout); S.timers = []; };
  const after = (ms, fn) => { const t = setTimeout(fn, ms); S.timers.push(t); return t; };
  const chainOf = (k) => CHAINS.find((c) => c.key === k);
  const prodOf = (id) => PRODUCTS.find((p) => p.id === id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const usd = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fix = (n, d) => Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const hex = (n) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
  const elide = (s) => (s.length > 26 ? s.slice(0, 12) + "…" + s.slice(-12) : s);
  function svg(name, cls) { return `<svg class="${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${(window.ICONS && window.ICONS[name]) || ""}</svg>`; }

  /* Per-token amount decimals — QR-encoded amounts and on-screen amounts must
     be digit-identical, so both sides format through the same precision. */
  const DEC = { BTC: 8, ETH: 6, SOL: 6, POL: 6, USDC: 6, XMR: 6, XTR: 2, XTM: 2 };
  const decOf = (tok) => (DEC[tok] != null ? DEC[tok] : 6);
  const cryptoStr = (tok, amt) => fix(amt, decOf(tok));

  const draftVal = () => { const v = parseFloat(S.draft); return isNaN(v) ? 0 : v; };
  const cartUsd = () => S.cart.reduce((a, l) => a + prodOf(l.id).price * l.qty, 0);
  const subtotalUsd = () => +(cartUsd() + draftVal()).toFixed(2);
  const taxUsd = () => +(subtotalUsd() * (S.taxPct / 100)).toFixed(2);
  const dueUsd = () => +(subtotalUsd() + taxUsd()).toFixed(2);
  const cartCount = () => S.cart.reduce((a, l) => a + l.qty, 0);
  const railLive = (ch) => S.mode !== "demo" && ch.coin === "live";
  /* NEEDS-SETUP rails are never silently chargeable — the gallery sheet renders
     them disabled with this reason, and the charge button double-checks. */
  const railBlocked = (ch) => (RAIL_CFG[ch.key] && RAIL_CFG[ch.key].status === "setup" ? RAIL_CFG[ch.key].sub : null);
  const cryptoAmt = (token, usdv) => usdv / (RATES[token] || 1);
  /* Rate display for the screen-A rate line — "$64,000", not "$64,000.00" */
  const rateStr = (r) => "$" + Number(r).toLocaleString("en-US", { maximumFractionDigits: Number.isInteger(r) ? 0 : 2 });

  /* Rate-lock countdown (mm:ss from payment.rateLockEnd) — screen B header */
  const lockLeftStr = (p) => {
    const s = Math.max(0, Math.ceil((p.rateLockEnd - Date.now()) / 1000));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };
  /* Wallet-convention address grouping — "bc1q 8f3k …… x0wl 4u2e" (B[6]) */
  const chipAddr = (a) => (a.length > 16 ? `${a.slice(0, 4)} ${a.slice(4, 8)} …… ${a.slice(-8, -4)} ${a.slice(-4)}` : a);
  const fmtBlock = (n) => "#" + Number(n).toLocaleString("en-US");
  /* Per-chain block cadence (seconds) — drives "Est. ~20 min on Bitcoin" (C[7]) */
  const BLOCK_SEC = { Bitcoin: 600, Ethereum: 15, Solana: 3, Polygon: 5, Monero: 120, Tari: 10, Minotari: 120 };
  const etaLine = (p) => {
    const secs = Math.max(1, p.required - p.confs) * (BLOCK_SEC[p.chainKey] || 30);
    return `Est. ${secs >= 90 ? "~" + Math.round(secs / 60) + " min" : "~" + secs + " s"} on ${chainOf(p.chainKey).name}`;
  };

  /* ---- D/F formatting helpers ------------------------------------------- */
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtTime = (ms) => {
    const d = new Date(ms);
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ap = h < 12 ? "AM" : "PM";
    h = h % 12 || 12;
    return `${h}:${m} ${ap}`;
  };
  /* Receipt header — "Jul 2, 2026 · 10:07 AM" (D[3]) */
  const fmtDateTime = (ms) => {
    const d = new Date(ms);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${fmtTime(ms)}`;
  };
  /* Local "YYYY-MM-DD HH:MM:SS" — ledger rows book in wall-clock time so a
     row's time always matches the receipt printed for the same sale. */
  const localTs = (ms) => {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  /* Ledger timestamps ("YYYY-MM-DD HH:MM:SS") → row time words: today shows
     the time, yesterday shows "Yesterday", older shows "Jun 30". */
  const tsDisplay = (ts) => {
    const [d, t] = String(ts).split(" ");
    if (!t) return ts;
    if (d === localTs(Date.now()).slice(0, 10)) {
      const [H, M] = t.split(":");
      const h = +H % 12 || 12;
      return `${h}:${M} ${+H < 12 ? "AM" : "PM"}`;
    }
    if (d === localTs(Date.now() - 864e5).slice(0, 10)) return "Yesterday";
    const [, mo, da] = d.split("-");
    return `${MONTHS[+mo - 1]} ${+da}`;
  };
  /* "tx 0x4f8a…9c2e" — short chip form for History line 3 (F[8]) */
  const shortHash = (h) => (h.length > 14 ? h.slice(0, h.startsWith("SIM-") ? 8 : 6) + "…" + h.slice(-4) : h);
  /* Rate snapshots on rows and receipts — "$64,000" but "$1.00" (sub-$1000
     rates keep their cents so "@ $1 locked" never looks like a typo). */
  const rateFmt = (r) => (r >= 1000 ? rateStr(r) : usd(r));
  /* THE booking rule, one place: only mainnet + REAL + confirmed is income. */
  const isIncome = (r) => r.network === "MAINNET" && r.provenance === "REAL" && r.status === "CONFIRMED";

  function coinDisc(ch, size) {
    return `<span class="coin-glyph" style="--brand:${ch.brand};--ink:${ch.ink};--glyph:${size || 40}px">${ch.sym}</span>`;
  }
  function statusWord(ch) { return ch.coin === "live" ? "Live" : ch.coin === "untracked" ? "Untracked" : "Demo"; }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("show"), 1900);
  }

  /* ---- real payment QR (mode-aware: the QR never encodes a network that
          contradicts the mode captured at charge time) ------------------------ */
  function paymentUri(p) {
    const a = p.address, amt = p.crypto, ch = p.chainKey, tok = p.token;
    const mode = p.mode || S.mode;
    if (mode === "demo") {
      // Demo QRs are simulated SIM- data — never a payable URI. The encoded
      // amount still equals the on-screen amount exactly.
      return p.donation ? "SIM-DONATION:" + a : `SIM-PAYMENT:${a}?amount=${amt.toFixed(decOf(tok))}&asset=${tok}`;
    }
    if (p.donation) return ch === "Bitcoin" ? "bitcoin:" + a : ch === "Solana" ? "solana:" + a
      // EVM donation codes carry the mode's chain id too — a bare ethereum: URI
      // reads as mainnet, which would contradict a testnet-mode QR.
      : (ch === "Ethereum" || ch === "Polygon") ? `ethereum:${a}@${(CHAIN_IDS[mode === "testnet" ? "testnet" : "mainnet"])[ch]}`
      // Minotari: an amount-less RFC-0154 send deeplink — a bare-address QR
      // degrades to Aurora's add-contact dialog, never the send screen.
      : ch === "Minotari" ? `tari://${mode === "mainnet" ? "mainnet" : "esmeralda"}/transactions/send?tariAddress=${a}` : a;
    if (ch === "Bitcoin") return `bitcoin:${a}?amount=${amt.toFixed(8)}`;
    if (ch === "Solana") return tok === "USDC"
      ? `solana:${a}?amount=${amt.toFixed(6)}&spl-token=${mode === "testnet" ? USDC_TEST.sol : USDC.sol}`
      : `solana:${a}?amount=${amt.toFixed(6)}`;
    if (ch === "Ethereum" || ch === "Polygon") {
      const id = (CHAIN_IDS[mode === "testnet" ? "testnet" : "mainnet"])[ch];
      if (tok === "USDC") {
        const u = Math.round(amt * 1e6);
        const usdcAddrs = mode === "testnet" ? USDC_TEST : USDC;
        const c = ch === "Polygon" ? usdcAddrs.pol : usdcAddrs.eth;
        return `ethereum:${c}@${id}/transfer?address=${a}&uint256=${u}`;
      }
      // wei from µETH, so the QR always matches the 6-decimal on-screen amount
      // (milli-ETH rounding used to encode zero or a wildly wrong value for small sales)
      return `ethereum:${a}@${id}?value=${Math.round(amt * 1e6)}000000000000`;
    }
    if (ch === "Monero") return `monero:${a}?tx_amount=${amt.toFixed(6)}`;
    if (ch === "Minotari") {
      // RFC-0154 deeplink — the only form Aurora's scanner accepts (anything
      // else scan-errors; a bare address degrades to add-contact with no
      // amount). The payer wallet ENFORCES the network authority, so it must
      // match the charge-time mode; amount is integer MicroTari (1 XTM = 1e6 µT).
      // Built from RFC-0154's normative table — its worked example is wrong.
      const net = mode === "mainnet" ? "mainnet" : "esmeralda";
      return `tari://${net}/transactions/send?tariAddress=${a}&amount=${Math.round(amt * 1e6)}`;
    }
    // Tari Ootle (XTR): no payment-URI standard exists yet (L2 NOT-READY) —
    // provisional form until one does.
    return `tari:${a}?amount=${amt.toFixed(2)}`;
  }
  function qrMarkup(text) {
    try {
      const qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      if (qr.createSvgTag) return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
      return qr.createImgTag(6, 2);
    } catch (e) { return '<div class="qr-caption">QR unavailable</div>'; }
  }

  /* ============================================================================
     APP CHROME (app bar + subtitle)
     ========================================================================== */
  /* Mode preview (LAYOUT G[1]) — the app-bar pill only PREVIEWS mode chrome;
     it never touches S.mode. A tap cycles S.modePreview starting from the real
     mode's successor; tapping through back to the real mode — or the
     auto-revert timeout — clears it. Only the pill and the mode strip read the
     preview, and both are unmistakably marked; every other surface keeps
     reading S.mode / charge-time p.mode. The real switch lives solely in
     Config → Mode & Money (typed MAINNET for mainnet). */
  const MODE_PREVIEW_MS = 4000;
  let modePreviewTimer = null;
  function clearModePreview() {
    if (modePreviewTimer != null) { clearTimeout(modePreviewTimer); modePreviewTimer = null; }
    S.modePreview = null;
  }
  function cycleModePreview() {
    const next = MODE_CYCLE[S.modePreview || S.mode];
    clearModePreview();
    if (next !== S.mode) {
      S.modePreview = next;
      modePreviewTimer = after(MODE_PREVIEW_MS, () => { modePreviewTimer = null; S.modePreview = null; render(); });
    }
    render();
  }
  /* Acts that start or affect a charge — or change the real mode — clear an
     active preview instantly: a charge decision is always judged against the
     real mode's chrome, and a stale preview can't outlive clearTimers(). */
  const PREVIEW_CLEAR_ACTS = new Set([
    "generate", "donation", "re-charge", "request-balance", "mainnet-ack", "sim",
    "checkout-cancel", "cancel-confirm", "checkout-done", "close-sale", "accept-short",
    "stop-watching", "resume-payment",
    "set-mode", "mainnet-confirm", "onb-finish",
  ]);

  function modeStrip() {
    // While previewing, the strip wears the previewed mode's family but is
    // unmistakably marked: the PREVIEW chip is a separate element on the right
    // edge — the strip copy itself stays verbatim from the LAYOUT.md deck.
    const pv = S.modePreview;
    const s = MODE_STRIP[pv || S.mode];
    return `<div class="mode-strip ${s.cls}${pv ? " previewing" : ""}">${s.text}${pv ? '<span class="preview-chip">PREVIEW</span>' : ""}</div>`;
  }

  function chrome() {
    const m = MODES[S.mode];
    const pv = S.modePreview;
    const pm = MODES[pv || S.mode]; // the pill (with the strip, alone) may wear the preview
    // The mode strip rides under the app bar on every payment surface
    // (Coins, Tracker, History). Config keeps the older subtitle/bar chrome,
    // which always reads the REAL mode — the preview never reaches it.
    const paymentSurface = ["coins", "tracker", "history"].includes(S.tab);
    return `
      <div class="appbar">
        <button class="icon-btn" data-act="drawer-open" aria-label="Menu">${svg("menu")}</button>
        <span class="brand">CryptoPoS</span>
        <button class="mode-pill ${pm.cls}${pv ? " previewing" : ""}" data-act="mode-cycle" title="Tap to preview Testnet / Mainnet / Demo chrome — the real switch is Config → Mode & Money"><span class="dot"></span>${pv ? `Previewing ${pm.pill}` : pm.pill}</button>
      </div>
      ${paymentSurface
        ? modeStrip()
        : m.bar
        ? `<div class="mainnet-bar"><span class="dot"></span>${m.bar}</div>`
        : `<div class="subtitle">${m.sub}</div>`}`;
  }

  /* Charge-button label — used everywhere a charge commits. Only mainnet ever
     wears the live-charge (green) fill; testnet/demo wear their mode family. */
  function chargeLabel(due) {
    const amt = usd(due);
    if (S.mode === "mainnet") return `Charge ${amt} · locks rate 15:00`;
    if (S.mode === "testnet") return `Charge ${amt} — TEST · locks rate 15:00`;
    return `Simulate charge ${amt} · locks rate 15:00`;
  }
  function chargeBtnClass() {
    return S.mode === "mainnet" ? "live" : S.mode === "testnet" ? "mode-testnet" : "mode-demo";
  }

  /* ============================================================================
     TERMINAL
     ========================================================================== */
  const ASSET_NAMES = {
    BTC: "Bitcoin", ETH: "Ether", SOL: "Solana", POL: "Polygon",
    XMR: "Monero", XTR: "Tari (Ootle L2)", XTM: "Minotari (Tari L1)",
    USDC: "USD Coin",
  };
  const assetBrand = (ch, tok) => (tok === "USDC" ? "#2775CA" : ch.brand);
  const assetInk = (ch, tok) => (tok === "USDC" ? "#fff" : ch.ink);

  function keypad() {
    // Entry is blocked while a payment is in flight (onKey guards too).
    const dis = S.payment.state !== "idle" ? "disabled" : "";
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "."];
    return `
      <div class="keypad">
        ${keys.map((k) => k === "C"
          ? `<button class="key clear" data-act="key" data-v="C" ${dis}>C</button>`
          : `<button class="key" data-act="key" data-v="${k}" ${dis}>${k}</button>`).join("")}
      </div>
      <button class="correction" data-act="key" data-v="back" ${dis}><span class="badge">${svg("backspace")}</span> Correction</button>`;
  }

  function catalog() {
    const rows = PRODUCTS.map((p) => {
      const line = S.cart.find((l) => l.id === p.id);
      const qty = line ? line.qty : 0;
      return `
        <div class="product ${qty > 0 ? "" : ""}" style="${qty > 0 ? "border-color:var(--primary)" : ""}">
          <span class="p-ico">${svg(p.ico)}</span>
          <span class="p-mid">
            <div class="p-name">${esc(p.name)}</div>
            <div class="p-cat">${usd(p.price)} • ${esc(p.cat)}</div>
          </span>
          ${qty > 0 ? `<button class="cart-step" data-act="prod-sub" data-id="${p.id}">−</button><span style="min-width:18px;text-align:center;font-weight:700">${qty}</span>` : ""}
          <button class="p-add" data-act="prod-add" data-id="${p.id}" aria-label="Add">${svg("add")}</button>
        </div>`;
    }).join("");
    return `<div class="catalog">${rows}</div>`;
  }

  /* ============================================================================
     SCREEN A — CHARGE (the keypad IS the home; LAYOUT.md screen A)
     ========================================================================== */

  // [2] Sticky rail chip — the terminal always reopens on the last-used rail;
  // tapping opens the chain gallery as a bottom sheet (never in the charge path).
  function railChip(ch) {
    return `
      <button class="rail-chip" data-act="rail-sheet" title="Change network or asset">
        ${coinDisc(ch, 34)}
        <span class="rc-body">
          <span class="rc-name">${ch.name} · ${S.token} · last used</span>
          <span class="rc-sub">tap to change</span>
        </span>
        <span class="chev">${svg("expand_more")}</span>
      </button>`;
  }

  function viewCoins() {
    const ch = chainOf(S.chain);
    const due = dueUsd();
    const blocked = railBlocked(ch);
    const disabled = due <= 0 || S.payment.state !== "idle" || !!blocked;
    // chargeLabel() is the single source of the commit copy; screen A renders it
    // as a verb line + smaller lock-clause subline (LAYOUT.md A[8]).
    const parts = chargeLabel(due).split(" · ");
    const taxNote = S.taxPct > 0 && due > 0
      ? `<div class="rate-line">Subtotal ${usd(subtotalUsd())} · tax ${S.taxPct}% ${usd(taxUsd())}</div>` : "";
    return `
      ${railChip(ch)}
      <div class="amount-zone">
        <div class="amt-fiat ${due > 0 ? "" : "zero"}">$ ${fix(due, 2)}</div>
        <div class="amt-crypto">= ${cryptoStr(S.token, cryptoAmt(S.token, due))} ${S.token}</div>
      </div>
      ${taxNote}
      <div class="rate-line">1 ${S.token} = ${rateStr(RATES[S.token])} · rate locks for 15 min when you charge</div>
      <div class="fee-note">${FEE_COPY[S.chain]}</div>
      <div class="home-divider"></div>
      ${keypad()}
      <div class="charge-wrap">
        <button class="charge-btn two-line ${chargeBtnClass()}" data-act="generate" ${disabled ? "disabled" : ""}>
          <span class="cb-verb">${parts[0]}</span>
          <span class="cb-lock">${blocked ? esc(ch.name + " rail needs setup — " + blocked) : "· " + parts[1]}</span>
        </button>
        <button class="donation-link" data-act="donation">Donation code (address only, untracked)</button>
      </div>`;
  }

  /* ============================================================================
     LIVE TRACKER + payment states
     ========================================================================== */
  function trackerCancelBar() {
    return `<div style="padding:10px 16px 0"><button class="sim-btn danger" data-act="checkout-cancel" style="width:100%">${svg("close")} Cancel Payment &amp; Exit</button></div>`;
  }

  function checkoutHeader(title) {
    const p = S.payment;
    const ch = chainOf(p.chainKey);
    const liveBadge = p.live
      ? `<span class="badge ready">LIVE</span>`
      : `<span class="badge sim">SIMULATED</span>`;
    return `<div style="text-align:center;margin-bottom:12px">
        <div style="font-size:.74rem;font-weight:800;letter-spacing:.08em;color:var(--on-surface-variant)">${title}</div>
        <div style="font-weight:700;margin-top:2px">${ch.name} · ${p.token} ${liveBadge}</div>
      </div>`;
  }

  /* Consensus Sandbox — every payment state is reachable in testnet/demo.
     While a code is live: settle fast/slow, fail (gas / double-spend),
     underpay, overpay, or cut the rate lock short (expiry then arrives through
     the same natural countdown path the real 15:00 would take). On the E
     surface: mock the 24 h watcher catching a late payment. */
  function simCard() {
    const p = S.payment;
    if (["expired", "failed"].includes(p.state)) {
      return `
        <div class="card" style="margin-top:16px">
          <div style="font-size:.78rem;font-weight:800;letter-spacing:.04em;color:var(--primary)">CONSENSUS SANDBOX — SIMULATE PAYMENT FEED</div>
          <p style="font-size:.8rem;color:var(--on-surface-variant);line-height:1.45;margin:6px 0 12px">
            Mock the 24 h watcher catching money on this address after the lock ended:</p>
          <div class="sim-row one">
            <button class="sim-btn" data-act="sim" data-v="late">${svg("timer")} Late payment</button>
          </div>
        </div>`;
    }
    return `
      <div class="card" style="margin-top:16px">
        <div style="font-size:.78rem;font-weight:800;letter-spacing:.04em;color:var(--primary)">CONSENSUS SANDBOX — SIMULATE PAYMENT FEED</div>
        <p style="font-size:.8rem;color:var(--on-surface-variant);line-height:1.45;margin:6px 0 12px">
          No real multi-chain gas transactions happen on this device. Use these to mock the RPC events a customer's wallet broadcast would trigger:</p>
        <div class="sim-row">
          <button class="sim-btn primary" data-act="sim" data-v="fast">${svg("bolt")} Fast settle</button>
          <button class="sim-btn" data-act="sim" data-v="slow">${svg("timer")} Slow settle</button>
        </div>
        <div class="sim-row" style="margin-top:8px">
          <button class="sim-btn" data-act="sim" data-v="under">Underpay</button>
          <button class="sim-btn" data-act="sim" data-v="over">Overpay</button>
        </div>
        <div class="sim-row" style="margin-top:8px">
          <button class="sim-btn danger" data-act="sim" data-v="gas">Out-of-gas fail</button>
          <button class="sim-btn danger" data-act="sim" data-v="double">Double-spend fail</button>
        </div>
        <div class="sim-row one" style="margin-top:8px">
          <button class="sim-btn" data-act="sim" data-v="expire">Expire now — skip the rate lock</button>
        </div>
      </div>`;
  }

  /* SCREEN B — AWAITING PAYMENT (LAYOUT.md screen B; copy deck verbatim).
     BTCPay invoice anatomy top-to-bottom: countdown, QR card, amount, address
     chip, status line — plus the SOUPS pre-send notice the convention lacks. */
  function viewAwaiting() {
    const p = S.payment;
    const uri = paymentUri(p);
    const net = MODES[p.mode].net; // mode captured at charge time, not S.mode
    // [4] On-card mode tag for every mode; ribbon for non-mainnet only —
    // nothing ever overlays a payable code (G[9]).
    const ribbon = p.mode === "demo" ? `<div class="qr-ribbon demo">SIMULATED — not payable</div>`
      : p.mode === "testnet" ? `<div class="qr-ribbon testnet">TEST — coins worthless</div>` : "";
    const urgent = p.rateLockEnd - Date.now() < 60000;
    return `
      <div class="screen-pad" style="padding-top:6px">
        <div class="await-head">
          <button class="icon-btn" data-act="tab" data-t="coins" aria-label="Back to keypad">${svg("arrow_back")}</button>
          <span class="ah-mid">
            <div class="ah-title">AWAITING PAYMENT</div>
            <div class="ah-sub">Rate locked: 1 ${p.token} = ${rateStr(p.rate)}</div>
          </span>
          <span id="lock-countdown" class="lock-count ${urgent ? "urgent" : ""}">◔ ${lockLeftStr(p)}</span>
        </div>
        <div class="qr-card">
          ${ribbon}
          <div class="qr-code">${qrMarkup(uri)}</div>
          <div class="qr-tagrow"><span class="qr-tag ${p.mode}">${net}</span></div>
        </div>
        <div class="pay-amount">${cryptoStr(p.token, p.crypto)} ${p.token} <span class="pa-fiat">(${usd(p.usd)})</span></div>
        <div class="addr-line">
          <span class="addr-chip">To:&nbsp;<b>${chipAddr(p.address)}</b><button class="chip-copy" data-act="copy-addr">Copy</button></span>
        </div>
        <div class="verbal-hint">Say the first &amp; last 4 out loud — they must match the customer's wallet.</div>
        <div class="push-status"><span class="pulse-dot"></span><span>Waiting for the customer to approve in their wallet. This terminal never pulls funds.</span></div>
        <div class="fee-attrib">Their wallet adds the network fee ≈ ${FEE_EST[p.chainKey]}, set by network demand.</div>
        <div class="home-divider" style="margin:12px 0"></div>
        <div class="presend-note"><b>!</b> Before they send: broadcast in clear text and can never be altered — public, traceable, permanent. No chargebacks.</div>
        <button class="cancel-sale" data-act="checkout-cancel">Cancel sale — free until they send</button>
        ${simCard()}
      </div>`;
  }

  /* SCREEN C — DETECTED → CONFIRMING (LAYOUT.md screen C; copy deck verbatim).
     One view for both in-flight states: the stepper is persistent across the
     whole flight so the payee learns the ladder. The bare confirmations
     counter is replaced by the SOUPS block strip with real block numbers. */
  function viewFlight() {
    const p = S.payment;
    const detected = p.state === "mempool";
    const rec = p.received != null ? p.received : p.crypto;
    const step = (label, cls, sub) => `<span class="step ${cls}"><span class="st-word">${label}</span><span class="st-sub">${sub}</span></span>`;
    const stepper = `
      <div class="stepper">
        ${step("DETECTED", detected ? "active" : "done", detected ? "●" : "✓")}
        <span class="st-arr">──►</span>
        ${step("CONFIRMING", detected ? "pending" : "active", detected ? "○" : `● ${p.confs} of ${p.required}`)}
        <span class="st-arr">──►</span>
        ${step("SETTLED", "pending", "○")}
      </div>`;
    // [4] Amount check — declared at detection; under/over route to screen E
    let check;
    if (rec === p.crypto) {
      check = `<div class="amount-check ok">Amount check: received exactly ${cryptoStr(p.token, rec)} ${p.token} — matches the invoice.</div>`;
    } else if (rec < p.crypto) {
      check = `<div class="amount-check warn">Amount check: received ${cryptoStr(p.token, rec)} of ${cryptoStr(p.token, p.crypto)} ${p.token} — ${usd(p.usd - rec * p.rate)} short at the locked rate.</div>`;
    } else {
      check = `<div class="amount-check warn">Amount check: received ${cryptoStr(p.token, rec)} of ${cryptoStr(p.token, p.crypto)} ${p.token} — ${usd((rec - p.crypto) * p.rate)} over the invoice; the extra is held for review.</div>`;
    }
    // [5] Block strip — which block holds the tx, and the blocks on top of it
    let blocks;
    if (detected) {
      blocks = `<div class="co-status" style="margin:0 0 4px"><span class="spinner"></span> In the network queue — waiting for the next block…</div>`;
    } else {
      const mined = p.confs >= 1
        ? `<span class="blk mined"><b>${fmtBlock(p.blockAt + p.confs)}</b><span>mined ✓</span></span><span class="blk-arr">─►</span>` : "";
      blocks = `
        <div class="block-line">Your payment is in block ${fmtBlock(p.blockAt)}.</div>
        <div class="block-strip">
          <span class="blk you"><b>${fmtBlock(p.blockAt)}</b><span>your tx</span></span>
          <span class="blk-arr">─►</span>
          ${mined}
          <span class="blk next"><b>next</b><span>mining…</span></span>
        </div>
        <div class="flight-note">${p.confs} of ${p.required} blocks mined on top of yours. Each block on top makes reversal harder — nobody 'approves' it.</div>`;
    }
    const pct = Math.round((p.confs / p.required) * 100);
    return `
      <div class="screen-pad" style="padding-top:4px">
        ${stepper}
        <div class="flight-note">Detected = seen in the network queue. Not money yet — wait for SETTLED before handing over goods.</div>
        ${check}
        <div class="home-divider" style="margin:12px 0"></div>
        ${blocks}
        <div class="conf-progress"><i style="width:${pct}%"></i></div>
        <div class="conf-label"><span>Confirming ${p.confs}/${p.required}</span><span>${etaLine(p)}</span></div>
        <div class="rate-remind">Rate locked at charge: ${rateStr(p.rate)}/${p.token}. Books at this rate whatever the market does now.</div>
        <div class="home-divider" style="margin:12px 0"></div>
        <div class="nocancel-note">Can't cancel — it's on the public network now. A refund would be a NEW payment.</div>
        <button class="e-secondary" data-act="stop-watching" style="width:100%;margin-top:10px">Stop watching</button>
        <div class="stop-explain">The customer has already sent — this cannot cancel or reverse their payment. Books as NEEDS REVIEW — not income; resume from its History row.</div>
      </div>`;
  }

  /* Re-charge label — chargeLabel's mode-suffix idiom for expiry recovery:
     recovery can never look more bookable than the original charge (E[5]). */
  function rechargeLabel(due) {
    const amt = usd(due);
    if (S.mode === "mainnet") return `Re-charge ${amt} at new rate`;
    if (S.mode === "testnet") return `Re-charge ${amt} at new rate — TEST`;
    return `Simulate re-charge ${amt} at new rate`;
  }

  /* SCREEN E — FAILED / EXPIRED (LAYOUT.md screen E; copy deck verbatim).
     One frame; runtime state swaps: clean expiry (the common case), part-paid
     before expiry, overpaid, failed on network. Never a meta-label on-screen. */
  function viewEnd() {
    const p = S.payment;
    const kind = p.state === "failed" ? "failed" : (p.endKind || "clean");
    let head = "", panel = "";
    if (kind === "failed") {
      head = `<div class="e-state error">✕ FAILED ON NETWORK</div>
        <p class="e-sub">— ${esc(p.failBody)}</p>`;
    } else if (kind === "under") {
      head = `<div class="e-state error">◷ CODE EXPIRED</div>`;
      panel = `<div class="e-panel">▲ PART-PAID BEFORE EXPIRY — Received ${cryptoStr(p.token, p.received)} of ${cryptoStr(p.token, p.crypto)} ${p.token} — ${usd(p.usd - p.received * p.rate)} short at the locked rate.</div>`;
    } else if (kind === "over") {
      const surplus = +(p.received - p.crypto).toFixed(decOf(p.token));
      head = `<div class="e-state warn">▲ OVERPAID</div>`;
      panel = `<div class="e-panel">Overpaid? The extra goes back as a NEW payment to an address the customer gives you — the original can't be pulled back.</div>
        <p class="e-sub">The invoiced ${usd(p.usd)} settled at the locked rate. The surplus ${cryptoStr(p.token, surplus)} ${p.token} (${usd(surplus * p.rate)}) holds as NEEDS REVIEW — not income — until returned.</p>`;
    } else {
      head = `<div class="e-state error">◷ CODE EXPIRED</div>
        <p class="e-sub">The 15-min rate lock ended before a payment arrived. Nothing was sent — nothing to undo.</p>`;
    }
    let actions;
    if (kind === "under") {
      const recUsd = +(p.received * p.rate).toFixed(2);
      const short = +(p.usd - recUsd).toFixed(2);
      actions = `
        <div class="e-actions">
          <button class="charge-btn ${chargeBtnClass()}" data-act="request-balance">Request balance — new code ${usd(short)}</button>
          <button class="e-secondary" data-act="accept-short">Accept short — book ${usd(recUsd)}</button>
          <button class="e-secondary" data-act="close-sale">Close sale</button>
        </div>`;
    } else if (kind === "over") {
      actions = `<div class="e-actions"><button class="e-secondary" data-act="close-sale">Close sale</button></div>`;
    } else {
      actions = `
        <div class="e-actions">
          <button class="charge-btn caps ${chargeBtnClass()}" data-act="re-charge">${rechargeLabel(p.usd)}</button>
          <div class="e-subline">Same sale, same rail — locks a fresh 15:00 and returns to Awaiting.</div>
          <button class="e-secondary" data-act="close-sale">Close sale</button>
        </div>`;
    }
    const ledgerNote =
      kind === "clean" ? "Recorded in Sale History as EXPIRED — never income. Whatever you choose is recorded as it happened — the ledger never rewrites."
      : kind === "failed" ? "Recorded in Sale History as FAILED — never income. Whatever you choose is recorded as it happened — the ledger never rewrites."
      : "Whatever you choose is recorded as it happened — the ledger never rewrites.";
    return `
      <div class="screen-pad" style="padding-top:8px">
        ${head}
        ${panel}
        <div class="home-divider" style="margin:12px 0"></div>
        <div class="e-watch">Still watching this address for 24 h. A late payment lands as NEEDS REVIEW — not income — until you choose: book at the locked rate, book at today's value, or return it as a NEW payment from you.</div>
        ${actions}
        <div class="home-divider" style="margin:12px 0"></div>
        <div class="e-ledgernote">${ledgerNote}</div>
        ${simCard()}
      </div>`;
  }

  /* SCREEN D — SETTLED RECEIPT (LAYOUT.md screen D; copy deck verbatim).
     Square receipt anatomy on the thermal-paper tokens (paper stays light in
     BOTH themes): merchant, timestamp, tender, both fee lines — then the
     crypto-truth block Square never needed. Every mode-dependent element here
     reads the mode captured at charge time, so a mode flip mid-flight can
     never reclassify this receipt. */
  const notIncomeWord = (mode) => (mode === "demo" ? "DEMO" : mode === "testnet" ? "TESTNET" : "SIMULATED");
  function viewReceipt() {
    const p = S.payment;
    const ch = chainOf(p.chainKey);
    // The full booking equation: only mainnet + REAL + confirmed (= this
    // screen) ever stamps INCOME — never a bare "BOOKED AS INCOME".
    const income = p.mode === "mainnet" && p.provenance === "REAL";
    const blockAt = p.blockAt != null ? p.blockAt : S.heights[p.chainKey];
    const stamp = income
      ? `<div class="r-stamp income">INCOME — MAINNET · REAL · CONFIRMED</div>`
      : `<div class="r-stamp not">▚▚ NOT INCOME — ${notIncomeWord(p.mode)} ▚▚</div>`;
    return `
      <div class="screen-pad" style="padding-top:10px">
        <div class="settled-word">✓ SETTLED</div>
        <div class="receipt r-doc">
          <div class="r-merchant">${esc(S.merchant)}</div>
          <div class="r-when">${fmtDateTime(p.settledAt || Date.now())}</div>
          <div class="r-divider"></div>
          <div class="r-line"><span class="rk">Total</span><span class="rv">${usd(p.usd)}</span></div>
          <div class="r-line"><span class="rk">Paid</span><span class="rv">${cryptoStr(p.token, p.crypto)} ${p.token}</span></div>
          <div class="r-line"><span class="rk">Rate</span><span class="rv soft">${rateFmt(p.rate)}/${p.token} — locked at charge, ${fmtTime(p.rateLockEnd - RATE_LOCK_MS)}</span></div>
          <div class="r-line"><span class="rk">Processor fee</span><span class="rv">$0.00</span></div>
          <div class="r-line"><span class="rk">Network fee</span><span class="rv soft">${FEE_EST[p.chainKey]} — paid by the customer, set by the network</span></div>
          <div class="r-divider"></div>
          <div class="r-netline">${ch.name} · ${MODES[p.mode].net} · ${p.provenance}</div>
          <div class="r-settle">Settled: ${p.required} blocks mined on top of block ${fmtBlock(blockAt)}</div>
          <div class="r-txchip"><span class="r-tx">tx ${chipAddr(p.txHash)}</span><button class="chip-copy" data-act="copy-hash" data-h="${p.txHash}">Copy</button></div>
          <div class="r-public">Public record — anyone can look this transaction up, forever.</div>
          <div class="r-divider"></div>
          ${stamp}
          <div class="r-refund">A refund is a new payment back to the customer. This payment itself can't be reversed.</div>
          ${p.mode !== "mainnet" ? `<div class="r-watermark" aria-hidden="true"><span>PRACTICE</span></div>` : ""}
        </div>
        <div class="receipt-actions three">
          <button class="sim-btn" data-act="receipt-print">${svg("print")} Print</button>
          <button class="sim-btn" data-act="receipt-share">${svg("share")} Share</button>
          <button class="sim-btn primary" data-act="checkout-done">New sale</button>
        </div>
      </div>`;
  }

  /* The receipt as plain text — what [ Share ] actually shares. The PRACTICE
     watermark and NOT-INCOME band ride along on every non-mainnet copy, so a
     shared test receipt can never pass as real once it leaves the device. */
  function receiptText(p) {
    const ch = chainOf(p.chainKey);
    const income = p.mode === "mainnet" && p.provenance === "REAL";
    const rule = "--------------------------------";
    const L = [
      S.merchant,
      fmtDateTime(p.settledAt || Date.now()),
      rule,
      `Total ${usd(p.usd)}`,
      `Paid ${cryptoStr(p.token, p.crypto)} ${p.token}`,
      `Rate ${rateFmt(p.rate)}/${p.token} — locked at charge, ${fmtTime(p.rateLockEnd - RATE_LOCK_MS)}`,
      "Processor fee $0.00",
      `Network fee ${FEE_EST[p.chainKey]} — paid by the customer, set by the network`,
      rule,
      `${ch.name} · ${MODES[p.mode].net} · ${p.provenance}`,
      `Settled: ${p.required} blocks mined on top of block ${fmtBlock(p.blockAt != null ? p.blockAt : S.heights[p.chainKey])}`,
      `tx ${p.txHash}`,
      "Public record — anyone can look this transaction up, forever.",
      rule,
    ];
    if (income) L.push("INCOME — MAINNET · REAL · CONFIRMED");
    else L.push(`▚▚ NOT INCOME — ${notIncomeWord(p.mode)} ▚▚`);
    if (p.mode !== "mainnet") L.push("╲ ╲ ╲   P R A C T I C E   ╲ ╲ ╲");
    L.push("A refund is a new payment back to the customer. This payment itself can't be reversed.");
    return L.join("\n");
  }

  function viewDonation() {
    const p = S.payment;
    return `
      ${trackerCancelBar()}
      <div class="screen-pad" style="padding-top:14px">
        ${checkoutHeader("UNTRACKED PAYMENT CODE")}
        <div class="checkout">
          <div class="qr-frame">${qrMarkup(paymentUri(p))}</div>
          <div class="co-amount" style="font-size:1.3rem">Donation Code</div>
          <div class="co-crypto">Any amount — address only</div>
          <div class="addr-chip">${elide(p.address)}<button class="copy" data-act="copy-addr">${svg("copy")}</button></div>
          <div class="card" style="margin-top:12px;background:var(--status-demo-bg);border-color:var(--status-demo-border)">
            <div style="font-size:.82rem;color:var(--status-demo);font-weight:600;line-height:1.45">This code is untracked — payments to it are not recorded in your books. Use a per-invoice code to track a sale.</div>
          </div>
          <button class="charge-btn" data-act="checkout-done" style="margin-top:16px">Done</button>
        </div>
      </div>`;
  }

  function viewTrackerIdle() {
    return `
      <div class="empty-state" style="padding-top:40px">
        <div class="es-ico" style="width:84px;height:84px;background:var(--primary-container);color:var(--on-primary-container)">${svg("qr")}</div>
        <div class="es-title">Awaiting Checkout Proposal</div>
        <div class="es-sub" style="max-width:300px">Ring up a sale on the Coins keypad — charging generates a payment code and its settlement is tracked here in real time.</div>
      </div>`;
  }

  function viewTracker() {
    switch (S.payment.state) {
      case "awaiting": return viewAwaiting();
      case "donation": return viewDonation();
      case "mempool": return viewFlight();     // C — DETECTED
      case "confirming": return viewFlight();  // C — CONFIRMING
      case "confirmed": return viewReceipt();
      case "failed": return viewEnd();         // E — failed-on-network swap
      case "expired": return viewEnd();        // E — clean / under / over
      default: return viewTrackerIdle();
    }
  }

  /* ============================================================================
     SCREEN F — SALE HISTORY (LAYOUT.md screen F; copy deck verbatim).
     Square's transactions list plus the one column Square never needed:
     whether a row is income at all. One chronological list under four filter
     chips — chronology is never sacrificed to the income split.
     ========================================================================== */

  /* One History row — F[6]–[13] anatomy: status word first, chain·token,
     charge-time provenance badge; timestamp + rate snapshot (or the row's
     reason); txid chip + amount; NEEDS-REVIEW rows carry their one action. */
  function histRow(r) {
    const ch = chainOf(r.chainKey);
    const stCls = { CONFIRMED: "st-settled", NEEDS_REVIEW: "st-review", EXPIRED: "st-expired", FAILED: "st-failed", REFUND: "st-refund" }[r.status] || "st-expired";
    let l2;
    if (r.status === "CONFIRMED") {
      // "locked" is the charge-time snapshot claim — a review booked at
      // today's value carries today's rate instead, so it drops the word.
      const lockWord = r.reason === "review: booked at today's value" ? "" : " locked";
      l2 = `${cryptoStr(r.token, r.crypto)} @ ${rateFmt(r.rate)}${lockWord}${r.reason ? " · " + esc(r.reason) : ""}`;
    } else {
      l2 = r.reason ? esc(r.reason) : `${cryptoStr(r.token, r.crypto)} @ ${rateFmt(r.rate)} locked`;
    }
    // An expiry has no transaction — its txid cell stays honest ("—").
    const tx = r.txHash && r.status !== "EXPIRED"
      ? `<span class="tx-chip">tx ${shortHash(r.txHash)}<button class="chip-copy" data-act="copy-hash" data-h="${r.txHash}">copy</button></span>`
      : `<span class="tx-none">—</span>`;
    let amt;
    if (isIncome(r)) amt = `<span class="hrow-amt income">+${usd(r.usd)}</span>`; // the only combination that ever earns a "+"
    else if (r.status === "REFUND") amt = `<span class="hrow-amt refund">−${usd(r.usd)}</span>`;
    else if (r.status === "EXPIRED" || r.status === "FAILED") amt = `<span class="hrow-amt nosale">$0.00·NO SALE</span>`;
    else amt = `<span class="hrow-amt hold">${usd(r.usd)}·NOT INCOME</span>`;
    let act = "";
    if (r.status === "NEEDS_REVIEW") {
      if (r.resume && !r.resumed) act = `<button class="row-btn" data-act="resume-payment" data-id="${r.id}">Resume</button>`;
      else if (r.resumed) act = `<span class="hrow-resolved">✓ resumed — the flight continued; this row stays as it happened</span>`;
      else if (r.reviewed) act = `<span class="hrow-resolved">✓ reviewed — ${esc(r.reviewed)}</span>`;
      else act = `<button class="row-btn review" data-act="review-open" data-id="${r.id}">Review: book / return</button>`;
    }
    return `
      <div class="hrow">
        <div class="hrow-l1"><span class="hrow-status ${stCls}">${displayStatus(r.status)}</span><span class="hrow-chain">${ch.name}·${r.token}</span><span class="hrow-badge ${r.mode}">${r.network}·${r.provenance}</span></div>
        <div class="hrow-l2">${tsDisplay(r.ts)} · ${l2}</div>
        <div class="hrow-l3">${tx}${amt}</div>
        ${act ? `<div class="hrow-act">${act}</div>` : ""}
      </div>`;
  }

  function viewHistory() {
    if (S.historyLocked && S.pin) {
      return `
        <div class="empty-state" style="padding-top:48px">
          <div class="es-ico">${svg("lock")}</div>
          <div class="es-title">Sales history is locked</div>
          <div class="es-sub">Enter the operator PIN to view past sales. Taking a payment doesn't require unlocking.</div>
          <div style="margin-top:16px"><button class="charge-btn" style="height:48px" data-act="history-unlock">Unlock to view history</button></div>
        </div>`;
    }
    const income = S.ledger.filter(isIncome);
    const incomeSum = income.reduce((a, r) => a + r.usd, 0);
    // Not-income, itemized by reason and never summed upward (F[4]); only
    // non-zero items print. Resumed / reviewed rows left the review queue.
    const sum = (f) => S.ledger.filter(f).reduce((a, r) => a + r.usd, 0);
    const cnt = (f) => S.ledger.filter(f).length;
    const testnetSum = sum((r) => r.network === "TESTNET" && r.status === "CONFIRMED");
    const demoSum = sum((r) => r.network === "DEMO" && r.status === "CONFIRMED");
    const failedN = cnt((r) => r.status === "FAILED");
    const expiredN = cnt((r) => r.status === "EXPIRED");
    const reviewN = cnt((r) => r.status === "NEEDS_REVIEW" && !r.resumed && !r.reviewed);
    const items = [];
    if (testnetSum) items.push(`${usd(testnetSum)} testnet`);
    if (demoSum) items.push(`${usd(demoSum)} demo`);
    if (failedN) items.push(`${failedN} failed`);
    if (expiredN) items.push(`${expiredN} expired`);
    if (reviewN) items.push(`${reviewN} need${reviewN === 1 ? "s" : ""} review`);
    const head = `
      <div class="hist-head">
        <h2 class="hh-title">Sale History</h2>
        <button class="hh-btn" data-act="csv">${svg("export")} CSV</button>
        <button class="hh-btn" data-act="history-lock">${svg("lock")} Lock</button>
      </div>`;
    // The income card prints its own filter and immutability contract next to
    // the number; the empty state stays honest — never hidden, never padded.
    const recon = `
      <div class="recon-card">
        <div class="recon-total"><span class="recon-kicker">INCOME</span>${usd(incomeSum)} · ${income.length} sale${income.length === 1 ? "" : "s"}</div>
        <div class="recon-contract">mainnet + real + settled, only; no other row can ever move here</div>
        ${items.length ? `<div class="recon-notline">NOT income: ${items.join(" · ")}</div>` : ""}
      </div>`;
    const chips = `<div class="fchips">${[["all", "All"], ["income", "Income"], ["notincome", "Not income"], ["failed", "Failed"]]
      .map(([k, l]) => `<button class="fchip ${S.histFilter === k ? "active" : ""}" data-act="hist-filter" data-v="${k}">${l}</button>`).join("")}</div>`;
    const FILTERS = {
      all: () => true,
      income: isIncome,
      notincome: (r) => !isIncome(r),
      failed: (r) => r.status === "FAILED" || r.status === "EXPIRED", // dead transactions, one tap (E[8] surfaces expiries here too)
    };
    const rows = S.ledger.filter(FILTERS[S.histFilter] || FILTERS.all).slice().reverse().map(histRow).join("");
    const list = rows
      ? `<div class="history-list">${rows}</div>`
      : `<div class="hist-empty">${S.ledger.length ? "No rows under this filter." : "No sales yet — every charge, expiry and failure is recorded here as it happens."}</div>`;
    return head + recon + chips + list;
  }

  /* ============================================================================
     SETTINGS
     ========================================================================== */
  function viewSettingsHome() {
    const cards = [
      { id: "mode", t: "Mode & Money", d: "Terminal mode, baseline currency, sales tax, tips", ico: "tune", meta: `${MODES[S.mode].pill} · ${S.baseline} baseline` },
      { id: "rails", t: "Payment Rails", d: "Where payments arrive — addresses and detectors, one rail at a time", ico: "wallet" },
      { id: "store", t: "Store", d: "Merchant name shown on receipts", ico: "storefront" },
      { id: "security", t: "Security & Books", d: "Operator lock, chain diagnostics, and where the books live", ico: "lock" },
    ];
    return `
      <div class="section-head"><h2>Terminal Config</h2><p>Owner settings, grouped by what they change.</p></div>
      <div class="settings-list">
        ${cards.map((c) => `
          <button class="settings-card" data-act="settings-go" data-s="${c.id}">
            <span class="sc-ico">${svg(c.ico)}</span>
            <span class="sc-body">
              <div class="sc-title">${c.t}</div>
              <div class="sc-desc">${c.d}</div>
              ${c.meta ? `<div class="sc-meta">${c.meta}</div>` : ""}
            </span>
            <span class="chev">${svg("chevron_right")}</span>
          </button>`).join("")}
      </div>`;
  }

  function settingsBack(title) {
    return `<div class="subscreen-head"><button class="icon-btn" data-act="settings-back">${svg("arrow_back")}</button><h2>${title}</h2></div>`;
  }

  function sectionMode() {
    const modeBtn = (id, label) => `<button class="choice ${S.mode === id ? "selected" : ""}" data-act="set-mode" data-m="${id}">${label}</button>`;
    const curr = { testnet: "TESTNET — live watching, valueless test coin", mainnet: "MAINNET — REAL MONEY", demo: "DEMO — sandbox ledger, every rail simulated" }[S.mode];
    const baselines = ["USD", "USDC", "BTC", "ETH", "SOL", "POL", "XMR"];
    return `
      ${settingsBack("MODE &amp; MONEY")}
      <div class="screen-pad">
        <div class="card">
          <div class="due-label">Terminal Mode</div>
          <div style="font-weight:700;margin:6px 0 12px">${curr}</div>
          <div class="choice-row">${modeBtn("demo", "DEMO")}${modeBtn("testnet", "TESTNET")}${modeBtn("mainnet", "MAINNET")}</div>
          <p class="helper">Demo is a sealed sandbox: every rail runs its simulator. Testnet watches real test networks (never income). Mainnet takes real money and keeps its typed-confirmation gate.</p>
        </div>
        <div class="card">
          <div class="due-label">First Mainnet Charge</div>
          <p class="helper" style="margin-top:6px">Shown once per session, before your first MAINNET charge: "Real money from here on. No bank to call. A refund is a new payment from you."</p>
          <button class="dialog-btn" data-act="mainnet-interstitial" style="margin-top:8px">Re-read the warning</button>
        </div>
        <div class="card">
          <div class="due-label">Baseline Currency</div>
          <div style="font-weight:700;margin:6px 0 12px">${S.baseline} — catalog, cart and books run in this unit</div>
          <div class="choice-row">${baselines.map((b) => `<button class="choice ${S.baseline === b ? "selected" : ""}" data-act="set-baseline" data-b="${b}">${b}</button>`).join("")}</div>
        </div>
        <div class="card">
          <div class="due-label">Sales Tax (add-on)</div>
          <div style="font-weight:700;margin:6px 0 12px">${S.taxPct > 0 ? "Tax " + S.taxPct + "% — added on top at checkout" : "No tax — totals charge exactly as priced"}</div>
          <div style="display:flex;gap:8px;align-items:center">
            <input class="field" id="tax-input" inputmode="decimal" placeholder="e.g. 8.25" value="${S.taxPct || ""}" style="flex:1" />
            <button class="dialog-btn primary" data-act="apply-tax">Apply</button>
          </div>
        </div>
        <div class="card">
          <div class="due-label">Tips (booked split)</div>
          <div class="setting-row" style="border:none;padding-top:10px">
            <div><div class="sr-label">Tip prompt</div><div class="sr-desc">${S.tips ? "On — tip chips show on the cart panel" : "Off — no tip prompt at checkout"}</div></div>
            <button class="switch ${S.tips ? "on" : ""}" data-act="toggle-tips" aria-label="Tips"></button>
          </div>
        </div>
      </div>`;
  }

  function sectionRails() {
    const feed = `
      <div class="feed-banner">
        <div class="fb-title">Price Feed</div>
        <div class="fb-row"><span>● Live prices — some tokens estimated</span><span class="fb-prices">BTC ${usd(63537)} · SOL ${usd(66.86)}</span></div>
        <div class="fb-note">Every rail quotes from this shared feed. On Mainnet a token without a live price refuses to take payment (the per-token rate gate).</div>
      </div>`;
    const rows = RAIL_ORDER.map((k) => {
      const cfg = RAIL_CFG[k];
      const ch = chainOf(k);
      const open = S.railOpen === k;
      const badge = cfg.status === "ready" ? `<span class="badge ready">READY</span>` : `<span class="badge setup">NEEDS SETUP</span>`;
      return `
        <div class="rail-row ${open ? "open" : ""}">
          <div class="rail-head" data-act="rail-toggle" data-k="${k}">
            <span class="rail-mid"><div class="rail-title">${cfg.title}</div><div class="rail-sub">${cfg.sub}</div></span>
            ${badge}
            <span class="chev">${svg("expand_more")}</span>
          </div>
          <div class="rail-detail">
            <div class="kv"><span class="k">Receiving address</span><span class="v">${SAMPLE_ADDR[k]}</span></div>
            <div class="kv"><span class="k">Watcher</span><span class="v" style="font-family:inherit">${cfg.status === "ready" ? "Configured · auto-confirm on-chain" : "Demo placeholder — set your own wallet"}</span></div>
          </div>
        </div>`;
    }).join("");
    return `
      ${settingsBack("PAYMENT RAILS")}
      ${feed}
      <div class="rails-hint">Tap a rail to set it up. READY means the saved config points at your own wallet or detector; NEEDS SETUP means the rail is still on its demo placeholder.</div>
      ${rows}
      <div style="height:24px"></div>`;
  }

  function sectionStore() {
    return `
      ${settingsBack("STORE")}
      <div class="screen-pad">
        <div class="card">
          <div class="due-label">Merchant Name (receipts)</div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
            <input class="field" id="merch-input" placeholder="CryptoPOS Terminal" value="${esc(S.merchant)}" style="flex:1" />
            <button class="dialog-btn primary" data-act="apply-merchant">Save</button>
          </div>
          <p class="helper">Printed on settled receipts. Leave blank to use the default.</p>
        </div>
        <div class="card">
          <div class="due-label">Cashier Screen</div>
          <p class="helper" style="margin-top:6px">This terminal is set up for individual payments — the checkout is a single amount on the keypad. A product catalog and cart arrive with the retail build.</p>
        </div>
      </div>`;
  }

  function sectionSecurity() {
    const heightRows = Object.keys(S.heights).map((k) => `<div class="kv"><span class="k">${chainOf(k).name}</span><span class="v" style="font-family:var(--font-mono)">#${S.heights[k].toLocaleString("en-US")}</span></div>`).join("");
    return `
      ${settingsBack("SECURITY &amp; BOOKS")}
      <div class="screen-pad">
        <div class="card">
          <div class="due-label">Operator Lock</div>
          <div style="font-weight:600;margin:6px 0 12px;font-size:.9rem">${S.pin ? (S.historyLocked ? "Locked. Unlock to view history or change settings." : "Unlocked for this session.") : "No PIN — anyone can change settings or clear the ledger."}</div>
          <div class="choice-row">
            ${S.pin
              ? `<button class="choice" data-act="lock-now">Lock now</button><button class="choice" data-act="remove-pin">Remove PIN</button>`
              : `<button class="choice selected" data-act="set-pin">Set PIN</button>`}
          </div>
        </div>
        <div class="card">
          <div class="due-label">Books</div>
          <p class="helper" style="margin-top:6px">Your sales ledger lives on the Sale History tab — view every sale and export the bookkeeping CSV there. Clearing the ledger lives here, away from the payment path.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <button class="dialog-btn" data-act="open-history">Open Sale History</button>
            <button class="dialog-btn" data-act="ledger-clear" style="color:var(--error)">Clear ledger</button>
          </div>
        </div>
        <div class="card">
          <div class="due-label">Chain Status</div>
          <div class="rail-detail" style="display:block;border:none;padding:4px 0 0">${heightRows}</div>
          <p class="helper">Live chain tips for connectivity troubleshooting. Settlement never reads these — confirmations are counted per-transaction at settle time.</p>
        </div>
        <div class="card" style="border-color:color-mix(in srgb, var(--error) 40%, var(--outline));background:var(--error-container)">
          <div class="due-label" style="color:var(--on-error-container)">Danger Zone</div>
          <p class="helper" style="color:var(--on-error-container);margin-top:6px">Burn down the store — erase the ledger, settings and receiving wallets, returning this device to a fresh install. Can't be undone.</p>
          <button class="dialog-btn danger" data-act="burn-down" style="margin-top:8px">Burn Down the Store</button>
        </div>
      </div>`;
  }

  function sectionGoLive() {
    const rows = GOLIVE.map((g) => `
      <div class="golive-row ${g.ok ? "ok" : "blocked"}">
        <span class="gl-mark">${svg(g.ok ? "check_circle" : "error")}</span>
        <span class="gl-body"><div class="gl-name">${g.name}</div><div class="gl-state">${g.ok ? "READY · " + g.state.replace("READY · ", "") : g.state}</div></span>
        <button class="switch on" data-act="noop" aria-label="rail toggle"></button>
      </div>`).join("");
    const ready = GOLIVE.filter((g) => g.ok).length;
    const blocked = GOLIVE.length - ready;
    return `
      ${settingsBack("GO LIVE — MAINNET")}
      <div class="golive-intro">Before taking real money, every rail you're selling on must be ready. Fix the blockers below, or switch off the rails you're not using yet — then confirm.</div>
      ${rows}
      <div class="golive-intro" style="color:${blocked ? "var(--error)" : "var(--status-live)"};font-weight:600">${blocked} coin${blocked === 1 ? "" : "s"} set up but need${blocked === 1 ? "s" : ""} attention — fix the blocker to continue.</div>
      <div class="screen-pad"><button class="charge-btn" data-act="enable-mainnet" disabled>Continue to confirmation</button></div>`;
  }

  function viewSettings() {
    switch (S.settingsSection) {
      case "mode": return sectionMode();
      case "rails": return sectionRails();
      case "store": return sectionStore();
      case "security": return sectionSecurity();
      case "golive": return sectionGoLive();
      default: return viewSettingsHome();
    }
  }

  /* ============================================================================
     OVERLAYS: drawer, dialogs, onboarding
     ========================================================================== */
  function navItems() {
    return [
      { id: "coins", label: "Coins", ico: "apps" },
      { id: "tracker", label: "Live Tracker", ico: "scanner" },
      { id: "history", label: "Sale History", ico: "history" },
      { id: "settings", label: "Terminal Config", ico: "settings" },
    ];
  }

  function drawerHtml() {
    if (!S.drawer) return "";
    const active = ["awaiting", "donation", "mempool", "confirming"].includes(S.payment.state);
    const items = navItems().map((n) => `
      <button class="drawer-item ${S.tab === n.id ? "active" : ""}" data-act="drawer-nav" data-t="${n.id}">${svg(n.ico)} ${n.label}${n.id === "tracker" && active ? ' <span class="badge ready" style="margin-left:auto">LIVE</span>' : ""}</button>`).join("");
    return `
      <div class="scrim" data-act="drawer-close"></div>
      <div class="drawer">
        <div class="drawer-head"><div class="dh-brand">CryptoPoS</div><div class="dh-sub">${MODES[S.mode].pill} · Point of Sale Hero reference build</div></div>
        <div class="drawer-nav">
          ${items}
          <div style="height:1px;background:var(--outline-soft);margin:8px 6px"></div>
          <button class="drawer-item" data-act="drawer-onboarding">${svg("storefront")} Setup wizard</button>
          <button class="drawer-item" data-act="drawer-golive">${svg("bolt")} Go Live — Mainnet</button>
          <button class="drawer-item" data-act="drawer-theme">${svg(document.documentElement.dataset.theme === "dark" ? "sun" : "moon")} ${document.documentElement.dataset.theme === "dark" ? "Light theme" : "Dark theme"}</button>
        </div>
        <div class="drawer-note"><b>No telemetry, ever.</b> This terminal carries no analytics or crash-reporting SDK — its only network traffic is the chain/price endpoints. (This reference build runs fully offline.)</div>
      </div>`;
  }

  /* Chain gallery — a bottom sheet behind the rail chip (LAYOUT.md A[2]): one
     tap away, never in the charge path. NEEDS-SETUP rails render disabled with
     their reason — never silently chargeable. */
  function sheetHtml() {
    const sh = S.sheet;
    if (!sh) return "";
    let body;
    if (sh.step === "asset") {
      const ch = chainOf(sh.chain);
      const cards = ch.tokens.map((tok) => {
        const brand = assetBrand(ch, tok);
        return `
          <button class="asset-card" data-act="sheet-asset" data-t="${tok}" style="--brand:${brand}">
            <span class="coin-glyph" style="--brand:${brand};--ink:${assetInk(ch, tok)};--glyph:40px">${tok}</span>
            <span class="ac-body">
              <div class="ac-name">${ASSET_NAMES[tok] || tok}</div>
              <div class="ac-sub">${tok} · 1 ${tok} ≈ ${rateStr(RATES[tok])}</div>
            </span>
            ${svg("chevron_right")}
          </button>`;
      }).join("");
      body = `
        <div class="sheet-head">
          <button class="icon-btn" data-act="sheet-back" aria-label="Back">${svg("arrow_back")}</button>
          <span class="sheet-head-mid">
            <div class="sheet-title">${ch.name}</div>
            <div class="sheet-sub">Choose the asset to charge in on ${ch.name}.</div>
          </span>
          <button class="icon-btn" data-act="sheet-close" aria-label="Close">${svg("close")}</button>
        </div>
        <div class="asset-list">${cards}</div>`;
    } else {
      const card = (ch) => {
        const blocked = railBlocked(ch);
        if (blocked) {
          return `
            <button class="coin-card blocked" style="--brand:${ch.brand}" disabled>
              <div class="cc-top">
                ${coinDisc(ch, 36)}
                <span><div class="cc-name">${ch.name}</div><div class="cc-sym">${ch.sym}</div></span>
              </div>
              <div class="coin-status"><span class="badge setup">NEEDS SETUP</span></div>
              <div class="cc-reason">${esc(blocked)}</div>
            </button>`;
        }
        return `
          <button class="coin-card ${ch.key === S.chain ? "selected" : ""}" data-act="sheet-chain" data-k="${ch.key}" style="--brand:${ch.brand}">
            <div class="cc-top">
              ${coinDisc(ch, 36)}
              <span><div class="cc-name">${ch.name}</div><div class="cc-sym">${ch.sym}</div></span>
            </div>
            <div class="coin-status ${ch.coin}"><span class="status-dot ${ch.coin}"></span>${statusWord(ch)}</div>
          </button>`;
      };
      body = `
        <div class="sheet-head">
          <span class="sheet-head-mid">
            <div class="sheet-title">Change rail</div>
            <div class="sheet-sub">Your last-used rail stays selected between sales.</div>
          </span>
          <button class="icon-btn" data-act="sheet-close" aria-label="Close">${svg("close")}</button>
        </div>
        <div class="coins-grid">${CHAINS.map(card).join("")}</div>`;
    }
    return `<div class="scrim" data-act="sheet-close"></div><div class="sheet"><div class="sheet-grab"></div>${body}</div>`;
  }

  function dialogHtml() {
    const d = S.dialog;
    if (!d) return "";
    let body = "";
    if (d.kind === "addproduct") {
      const cats = ["Beverages", "Foods", "Merchandise", "Hardware"];
      const icos = [["coffee", "coffee"], ["drink", "drink"], ["food", "food"], ["bag", "bag"], ["dns", "dns"]];
      body = `
        <div class="dialog-title">Add Catalog Product</div>
        <div class="dialog-body">
          <input class="field" id="ap-name" placeholder="Item Name" style="width:100%;margin-bottom:10px" />
          <input class="field" id="ap-price" inputmode="decimal" placeholder="Price (USD)" style="width:100%;margin-bottom:12px" />
          <div class="field-label">Category</div>
          <div class="preset-row">${cats.map((c, i) => `<button class="preset ${i === 0 ? "selected" : ""}" data-act="ap-cat" data-c="${c}">${c}</button>`).join("")}</div>
          <div class="field-label" style="margin-top:12px">Icon</div>
          <div class="preset-row">${icos.map((ic, i) => `<button class="preset ${i === 0 ? "selected" : ""}" data-act="ap-ico" data-i="${ic[0]}" style="padding:8px 12px">${svg(ic[1])}</button>`).join("")}</div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn text" data-act="dialog-close">Cancel</button>
          <button class="dialog-btn primary" data-act="ap-confirm">Confirm</button>
        </div>`;
    } else if (d.kind === "mainnet") {
      body = `
        <div class="dialog-title">Switch to MAINNET?</div>
        <div class="dialog-body">
          <p style="font-size:.88rem;line-height:1.5;color:var(--on-surface-variant);margin:0 0 12px">Live checkouts will settle with REAL money on public mainnets. Make sure every receiving address is a wallet you control. Type <b>MAINNET</b> to confirm.</p>
          <input class="field" id="mainnet-confirm" placeholder="Type MAINNET" style="width:100%" />
          <p class="helper" id="mainnet-err" style="color:var(--error);display:none">That doesn't match. Type MAINNET exactly.</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn text" data-act="dialog-close">Cancel</button>
          <button class="dialog-btn danger" data-act="mainnet-confirm" id="mainnet-go" disabled>Enable Mainnet</button>
        </div>`;
    } else if (d.kind === "firstmainnet") {
      body = `
        <div class="dialog-title">Before your first MAINNET charge</div>
        <div class="dialog-body">
          <p class="interstitial-copy">Real money from here on. No bank to call. A refund is a new payment from you.</p>
          <p class="helper">Re-read anytime: Config → Mode &amp; Money</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn primary" data-act="mainnet-ack">I understand</button>
        </div>`;
    } else if (d.kind === "setpin") {
      body = `
        <div class="dialog-title">Set operator PIN</div>
        <div class="dialog-body">
          <input class="field" id="pin-input" inputmode="numeric" maxlength="6" placeholder="4–6 digit PIN" style="width:100%" />
          <p class="helper">Locks the mode, receiving wallets and sales history behind this PIN.</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn text" data-act="dialog-close">Cancel</button>
          <button class="dialog-btn primary" data-act="pin-save">Set PIN</button>
        </div>`;
    } else if (d.kind === "unlock") {
      body = `
        <div class="dialog-title">Enter operator PIN</div>
        <div class="dialog-body">
          <input class="field" id="pin-input" inputmode="numeric" maxlength="6" placeholder="PIN" style="width:100%" />
          <p class="helper" id="unlock-err" style="color:var(--error);display:none">Incorrect PIN.</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn text" data-act="dialog-close">Cancel</button>
          <button class="dialog-btn primary" data-act="pin-unlock">Unlock</button>
        </div>`;
    } else if (d.kind === "burn") {
      body = `
        <div class="dialog-title">Burn down the store?</div>
        <div class="dialog-body">
          <p style="font-size:.88rem;line-height:1.5;color:var(--on-surface-variant);margin:0 0 12px">Erases the ledger, all settings and receiving wallets, returning this reference build to a fresh state. Type <b>RESET</b> to confirm.</p>
          <input class="field" id="burn-confirm" placeholder="Type RESET" style="width:100%" />
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn text" data-act="dialog-close">Cancel</button>
          <button class="dialog-btn danger" data-act="burn-confirm">Burn it down</button>
        </div>`;
    } else if (d.kind === "review") {
      // F[10] — the explicit three-way choice for quarantined money: book at
      // the locked rate, book at today's value, or return it as a NEW
      // outbound payment. Every choice APPENDS; the original row never moves.
      const row = S.ledger.find((r) => r.id === d.id);
      if (!row) return "";
      const todayRate = RATES[row.token] || row.rate;
      const lockedUsd = +(row.crypto * row.rate).toFixed(2);
      const todayUsd = +(row.crypto * todayRate).toFixed(2);
      body = `
        <div class="dialog-title">Review: book / return</div>
        <div class="dialog-body">
          <p class="review-sum">${cryptoStr(row.token, row.crypto)} ${row.token} held — ${esc(row.reason || "needs review")}. Not income until you choose.</p>
          <button class="review-choice" data-act="review-book" data-v="locked" data-id="${row.id}"><b>Book at the locked rate</b><span>${usd(lockedUsd)} at ${rateFmt(row.rate)}/${row.token} — the rate captured at charge</span></button>
          <button class="review-choice" data-act="review-book" data-v="today" data-id="${row.id}"><b>Book at today's value</b><span>${usd(todayUsd)} at ${rateFmt(todayRate)}/${row.token} — the market right now</span></button>
          <button class="review-choice" data-act="review-return" data-id="${row.id}"><b>Return it as a NEW payment from you</b><span>A new outbound payment with its own transaction — the original can't be pulled back</span></button>
          <p class="helper">Whatever you choose is recorded as it happened — the ledger never rewrites.</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn text" data-act="dialog-close">Cancel</button>
        </div>`;
    } else if (d.kind === "cancel") {
      // Only reachable before broadcast (screen B / donation) — after the
      // customer sends, the button is gone and screen C explains why.
      body = `
        <div class="dialog-title">Cancel this sale?</div>
        <div class="dialog-body"><p style="font-size:.88rem;line-height:1.5;color:var(--on-surface-variant);margin:0">The customer hasn't sent anything yet — cancelling is free and nothing is recorded.</p></div>
        <div class="dialog-actions">
          <button class="dialog-btn text" data-act="dialog-close">Keep waiting</button>
          <button class="dialog-btn danger" data-act="cancel-confirm">Cancel sale</button>
        </div>`;
    }
    return `<div class="scrim" data-act="dialog-close"></div><div class="dialog-wrap"><div class="dialog">${body}</div></div>`;
  }

  function onboardingHtml() {
    const o = S.onboarding;
    if (!o) return "";
    let body = "";
    if (o.step === 0) {
      body = `
        <div class="onb-h">Welcome to CryptoPoS</div>
        <p class="onb-p">How will this terminal take payment? You can change this anytime in Terminal Config — and your funds are never at risk by default.</p>
        <button class="onb-choice ${o.mode === "testnet" ? "sel" : ""}" data-act="onb-mode" data-m="testnet"><b>Testnet</b><span class="onb-tag">Safe, free testing — recommended</span><div class="onb-d">Watch real test networks using valueless test coins. Nothing real is ever charged.</div></button>
        <button class="onb-choice ${o.mode === "mainnet" ? "sel" : ""}" data-act="onb-mode" data-m="mainnet"><b>Mainnet</b><span class="onb-tag">Real money</span><div class="onb-d">Accept real cryptocurrency. You'll add your own wallets and pass a Go-Live check first.</div></button>
        <div class="onb-actions"><span></span><button class="charge-btn" style="width:auto;padding:0 24px;height:48px" data-act="onb-next">Next</button></div>`;
    } else if (o.step === 1) {
      const picked = Object.keys(o.picked).filter((k) => o.picked[k]).length;
      body = `
        <div class="onb-step">Step 2 of 3 <button class="onb-back" data-act="onb-back">${svg("arrow_back")}</button></div>
        <div class="onb-h">Which coins do you accept?</div>
        <p class="onb-p">Pick the coins your shop takes. Only the coins you set up here show on the cashier screen.</p>
        ${CHAINS.map((ch) => `<button class="onb-coin ${o.picked[ch.key] ? "sel" : ""}" data-act="onb-pick" data-k="${ch.key}" style="--brand:${ch.brand}">${coinDisc(ch, 30)}<span style="flex:1;text-align:left"><div style="font-weight:700">${ch.name}</div><div style="font-size:.78rem;color:var(--on-surface-variant)">${ch.sym}</div></span>${o.picked[ch.key] ? `<span class="badge ready">PICKED</span>` : svg("add_circle", "")}</button>`).join("")}
        <div class="onb-actions"><span></span><button class="charge-btn" style="width:auto;padding:0 24px;height:48px" data-act="onb-next" ${picked ? "" : "disabled"}>${picked ? "Next" : "Set up at least one coin"}</button></div>`;
    } else {
      const picked = CHAINS.filter((ch) => o.picked[ch.key]);
      body = `
        <div class="onb-step">Step 3 of 3 <button class="onb-back" data-act="onb-back">${svg("arrow_back")}</button></div>
        <div class="onb-h">Review</div>
        <p class="onb-p">These are the coins your cashier screen will show.</p>
        ${picked.map((ch) => `<div class="onb-coin" style="--brand:${ch.brand}">${coinDisc(ch, 30)}<span style="flex:1"><div style="font-weight:700">${ch.name}</div><div style="font-size:.78rem;color:var(--on-surface-variant)">Accepting ${ch.tokens.join(", ")}</div></span>${svg("check_circle", "")}</div>`).join("")}
        <div class="onb-actions"><span></span><button class="charge-btn" style="width:auto;padding:0 24px;height:48px" data-act="onb-finish">Finish setup</button></div>`;
    }
    return `<div class="onboarding"><div class="onb-card">${body}</div></div>`;
  }

  /* ============================================================================
     RENDER
     ========================================================================== */
  function render() {
    if (S.onboarding) { overlayRoot.innerHTML = onboardingHtml(); return; }
    let content;
    switch (S.tab) {
      case "coins": content = viewCoins(); break;
      case "tracker": content = viewTracker(); break;
      case "history": content = viewHistory(); break;
      case "settings": content = viewSettings(); break;
      default: content = viewCoins();
    }
    screen.innerHTML = chrome() + content;
    const active = ["awaiting", "donation", "mempool", "confirming"].includes(S.payment.state);
    navEl.innerHTML = navItems().map((n) => `
      <button class="nav-item ${S.tab === n.id ? "active" : ""}" data-act="tab" data-t="${n.id}">
        <span class="nav-ico ${n.id === "tracker" && active ? "nav-badge" : ""}">${svg(n.ico)}</span>
        <span>${n.label}</span>
      </button>`).join("");
    overlayRoot.innerHTML = drawerHtml() + sheetHtml() + dialogHtml();
  }

  /* ============================================================================
     PAYMENT STATE MACHINE
     ========================================================================== */
  function startCheckout(opts) {
    const ch = chainOf(opts.chain || S.chain);
    const token = opts.token || S.token;
    const usdv = opts.usd;
    S.payment = {
      state: opts.donation ? "donation" : "awaiting",
      mode: S.mode, // books under the mode it was charged in, even if Config changes mid-flight
      chainKey: ch.key,
      token: token,
      usd: usdv,
      // rounded once, at charge time, to the token's precision — the QR, the
      // screens and the ledger all carry this same figure
      crypto: +cryptoAmt(token, usdv).toFixed(decOf(token)),
      rate: RATES[token], // rate snapshot captured at charge time — the ledger books this
      rateLockEnd: Date.now() + RATE_LOCK_MS, // 15-minute rate lock, set at charge time
      provenance: railLive(ch) ? "REAL" : "SIMULATED", // captured at charge time
      address: payAddress(ch.key, S.mode), // mode-aware: testnet/demo samples never masquerade as mainnet
      live: railLive(ch),
      required: CONFS[ch.key] || 2,
      confs: 0,
      txHash: (S.mode === "demo" ? "SIM-" : "0x") + hex(56),
      donation: !!opts.donation,
      memo: opts.memo || (S.cart.length ? S.cart.map((l) => prodOf(l.id).name).join(", ") : "Custom sale"),
      received: null, // crypto actually seen at detection (exact/under/over)
      blockAt: null, // the block that holds the tx, captured at first confirm
      endKind: null, // screen-E swap: "clean" | "under" | "over"
    };
    S.sheet = null;
    S.tab = "tracker";
    clearModePreview(); // belt-and-braces: a charge always starts under the real mode's chrome
    clearTimers();
    render();
    if (!opts.donation) startLockCountdown();
  }

  /* Ledger booking — one appender for every row. {rate, mode, provenance}
     were captured at charge time; a mode flip or market move mid-flight can
     never reclassify or reprice a row. The ledger only ever appends. */
  function bookRow(extra) {
    const p = S.payment;
    const row = Object.assign({
      id: ++S.txCounter,
      ts: localTs(Date.now()), // wall-clock, same clock the receipt prints
      chainKey: p.chainKey,
      token: p.token,
      usd: p.usd,
      crypto: p.crypto,
      rate: p.rate || RATES[p.token],
      status: "CONFIRMED", // stored status; displays as SETTLED
      mode: p.mode,
      provenance: p.provenance || (p.mode === "mainnet" ? "REAL" : "SIMULATED"),
      network: (MODES[p.mode] || {}).net,
      txHash: p.txHash,
      memo: p.memo,
      invoicedUsd: p.usd, // what was asked, kept even when usd books differently
    }, extra);
    S.ledger.push(row);
    return row;
  }

  /* Appends a row derived from an EXISTING ledger row (review resolutions run
     with no payment in flight). Mode / provenance / network / rate come from
     the held row — i.e. from charge time — unless extra overrides them. */
  function bookFromRow(row, extra) {
    return bookRow(Object.assign({
      chainKey: row.chainKey,
      token: row.token,
      usd: row.usd,
      crypto: row.crypto,
      rate: row.rate,
      mode: row.mode,
      provenance: row.provenance,
      network: row.network,
      txHash: row.txHash,
      memo: row.memo,
      invoicedUsd: row.invoicedUsd,
      reviewOf: row.id, // provenance trail — which held row this resolves
    }, extra));
  }

  /* Rate-lock countdown — a self-rescheduling after() chain (cleared by
     cancel/reset/new charge, self-stopping once the state leaves "awaiting").
     Per-second ticks only touch the #lock-countdown node — a full re-render
     every second would fight open dialogs and their typed inputs. */
  function startLockCountdown() {
    const tick = () => {
      const p = S.payment;
      if (p.state !== "awaiting") return;
      if (Date.now() >= p.rateLockEnd) { expireClean(); return; }
      const el = document.getElementById("lock-countdown");
      if (el) {
        el.textContent = "◔ " + lockLeftStr(p);
        el.classList.toggle("urgent", p.rateLockEnd - Date.now() < 60000);
      }
      after(1000, tick);
    };
    after(1000, tick);
  }

  /* The countdown hit 0 with nothing received — the EXPIRED row books
     immediately (E[7]: "the EXPIRED row already exists"), never income. */
  function expireClean() {
    const p = S.payment;
    if (p.state !== "awaiting") return;
    bookRow({ status: "EXPIRED", usd: 0, reason: "no payment within rate lock" });
    p.state = "expired";
    p.endKind = "clean";
    // Don't re-render over an open dialog (a typed confirmation would be
    // wiped); the dialog's own close/confirm handlers re-render from state.
    if (!S.dialog) render();
  }

  /* Partial payment seen, then the lock ended — screen E underpaid swap.
     Nothing books yet: the payee decides (request balance / accept short /
     close), and whatever they choose is recorded as it happened. */
  function expireUnder() {
    const p = S.payment;
    if (!["awaiting", "mempool"].includes(p.state)) return;
    p.state = "expired";
    p.endKind = "under";
    render();
  }

  /* Confirmed but over the invoice — the invoiced amount settles at the
     locked rate; the surplus is quarantined as NEEDS REVIEW until returned. */
  function enterOverpaid() {
    const p = S.payment;
    if (p.state !== "confirming") return;
    const surplus = +(p.received - p.crypto).toFixed(decOf(p.token));
    p.txId = bookRow({ status: "CONFIRMED" }).id;
    bookRow({
      status: "NEEDS_REVIEW",
      usd: +(surplus * p.rate).toFixed(2),
      crypto: surplus,
      reason: "overpaid — surplus held for return",
    });
    p.state = "expired";
    p.endKind = "over";
    S.cart = [];
    S.draft = "";
    render();
  }

  /* Final confirmation landed — exact amounts settle, overpays divert to E. */
  function finishConfirmed() {
    const p = S.payment;
    if (p.received != null && p.received > p.crypto) enterOverpaid();
    else settle();
  }

  function toMempool(received) {
    const p = S.payment;
    if (!["awaiting"].includes(p.state)) return;
    p.received = received != null ? received : p.crypto;
    p.state = "mempool";
    render();
  }
  /* Starts — or, after a Resume, continues — the confirmation ladder.
     Never resets confs: startCheckout seeds 0, a resumed row carries its own. */
  function stepConfirm(delay, onDone) {
    const p = S.payment;
    p.state = "confirming";
    if (p.blockAt == null) p.blockAt = (S.heights[p.chainKey] || 1204830) + 1;
    render();
    const tick = () => {
      if (S.payment.state !== "confirming") return;
      S.payment.confs++;
      render();
      if (S.payment.confs >= S.payment.required) { after(delay, onDone); }
      else after(delay, tick);
    };
    // a flight resumed at full confirmations goes straight to its outcome
    if (p.confs >= p.required) after(delay, onDone);
    else after(delay, tick);
  }
  function settle() {
    const p = S.payment;
    if (!["confirming", "mempool"].includes(p.state)) return;
    p.txId = bookRow({ status: "CONFIRMED" }).id;
    p.settledAt = Date.now(); // receipt header timestamp (D[3])
    p.state = "confirmed";
    S.cart = [];
    S.draft = "";
    render();
  }
  /* Failed on the network (screen E swap) — the row books FAILED, never
     income; fee truth is kept even in failure, and nothing implies reversal. */
  function failNet(kind) {
    const p = S.payment;
    if (!["confirming", "mempool"].includes(p.state)) return;
    bookRow({ status: "FAILED", reason: kind === "gas" ? "ran out of gas" : "double-spend conflict" });
    p.failBody = kind === "gas"
      ? "the transaction ran out of gas. The customer keeps their funds (minus their network fee). Nothing arrived, so there is nothing to send back."
      : "a conflicting double-spend replaced it. The customer keeps their funds (minus their network fee). Nothing arrived, so there is nothing to send back.";
    p.state = "failed";
    render();
  }
  function runSim(kind) {
    const p = S.payment;
    if (kind === "late") {
      // 24 h watcher catches money after the lock ended — quarantined as
      // NEEDS REVIEW, never silently booked at a dead rate.
      if (!["expired", "failed"].includes(p.state)) return;
      bookRow({
        status: "NEEDS_REVIEW",
        reason: "arrived after the rate lock",
        txHash: (p.mode === "demo" ? "SIM-" : "0x") + hex(56), // a late tx has its own hash
      });
      clearTimers();
      S.payment = { state: "idle" };
      S.tab = "history";
      showToast("Late payment held as NEEDS REVIEW — not income");
      render();
      return;
    }
    if (p.state !== "awaiting" || p.simStarted) return;
    if (kind === "expire") {
      // Cut the lock short — expiry then arrives through the same natural
      // countdown path the real 15:00 would take.
      p.rateLockEnd = Math.min(p.rateLockEnd, Date.now() + 1200);
      showToast("Rate lock cut short — expiring…");
      return;
    }
    p.simStarted = true; // a double-click must not double-book the ledger
    if (kind === "fast") {
      after(300, () => { toMempool(); after(900, () => stepConfirm(280, finishConfirmed)); });
    } else if (kind === "slow") {
      after(700, () => { toMempool(); after(1600, () => stepConfirm(1300, finishConfirmed)); });
    } else if (kind === "gas") {
      after(400, () => { toMempool(); after(1200, () => failNet("gas")); });
    } else if (kind === "double") {
      after(400, () => { toMempool(); after(1200, () => failNet("double")); });
    } else if (kind === "under") {
      // Partial detected (C shows the under amount-check), then the lock ends.
      after(400, () => { toMempool(+(p.crypto * 0.768).toFixed(decOf(p.token))); after(2600, expireUnder); });
    } else if (kind === "over") {
      // Over-detected (C shows the over check through the whole flight), then
      // the invoiced amount settles and the surplus quarantines (screen E).
      after(400, () => { toMempool(+(p.crypto * 1.2).toFixed(decOf(p.token))); after(1400, () => stepConfirm(700, finishConfirmed)); });
    }
  }
  function endCheckout() { clearTimers(); S.payment = { state: "idle" }; render(); }

  /* ============================================================================
     EVENTS
     ========================================================================== */
  function onKey(v) {
    if (S.payment.state !== "idle") return;
    if (v === "C") { S.draft = ""; S.cart = []; }
    else if (v === "back") { S.draft = S.draft.slice(0, -1); }
    else if (v === ".") { if (!S.draft.includes(".")) S.draft = (S.draft || "0") + "."; }
    else { if (S.draft === "0") S.draft = v; else if ((S.draft.split(".")[1] || "").length < 2) S.draft += v; }
    render();
  }

  function fieldVal(id) { const el = document.getElementById(id); return el ? el.value.trim() : ""; }

  function handle(act, el) {
    // A charge-adjacent act must never be judged against previewed chrome —
    // drop the preview first (safe to render here: no act in the set reads a
    // typed field, so nothing is wiped mid-keystroke).
    if (S.modePreview && PREVIEW_CLEAR_ACTS.has(act)) { clearModePreview(); render(); }
    switch (act) {
      case "tab": S.tab = el.dataset.t; if (S.tab !== "settings") S.settingsSection = null; S.sheet = null; render(); break;
      case "drawer-open": S.drawer = true; render(); break;
      case "drawer-close": S.drawer = false; render(); break;
      case "drawer-nav": S.drawer = false; S.tab = el.dataset.t; S.settingsSection = null; S.sheet = null; render(); break;
      case "drawer-theme": S.drawer = false; toggleTheme(); render(); break;
      case "drawer-onboarding": S.drawer = false; S.onboarding = { step: 0, mode: "testnet", picked: {} }; render(); break;
      case "drawer-golive": S.drawer = false; S.tab = "settings"; S.settingsSection = "golive"; render(); break;
      case "mode-cycle": cycleModePreview(); break; // preview only — S.mode changes solely via Config (G[1])

      case "subtab": S.subtab = el.dataset.v; render(); break;
      case "key": onKey(el.dataset.v); break;
      case "chain": { const ch = chainOf(el.dataset.k); S.chain = ch.key; if (!ch.tokens.includes(S.token)) S.token = ch.tokens[0]; render(); break; }
      case "token": S.token = el.dataset.t; render(); break;
      case "prod-add": { const id = +el.dataset.id; const l = S.cart.find((x) => x.id === id); if (l) l.qty++; else S.cart.push({ id, qty: 1 }); render(); break; }
      case "prod-sub": { const id = +el.dataset.id; const l = S.cart.find((x) => x.id === id); if (l) { l.qty--; if (l.qty <= 0) S.cart = S.cart.filter((x) => x.id !== id); } render(); break; }
      case "cart-clear": S.cart = []; render(); break;

      case "generate": {
        const due = dueUsd();
        // A NEEDS-SETUP rail is never silently chargeable (button is disabled
        // with the reason; this guard is belt-and-braces).
        if (due <= 0 || S.payment.state !== "idle" || railBlocked(chainOf(S.chain))) return;
        if (S.mode === "mainnet" && !S.firstMainnetAck) {
          // First MAINNET charge this session — interpose the interstitial;
          // the charge proceeds only after "I understand".
          S.dialog = { kind: "firstmainnet", pending: { chain: S.chain, token: S.token, usd: due } };
          render();
          break;
        }
        startCheckout({ chain: S.chain, token: S.token, usd: due });
        break;
      }
      case "mainnet-ack": {
        S.firstMainnetAck = true; // session-scoped, no persistence
        const pending = S.dialog && S.dialog.pending;
        S.dialog = null;
        if (pending) startCheckout(pending); else render();
        break;
      }
      case "mainnet-interstitial": S.dialog = { kind: "firstmainnet" }; render(); break;
      case "sim": runSim(el.dataset.v); break;
      case "checkout-cancel": S.dialog = { kind: "cancel", from: S.payment.state }; render(); break;
      case "cancel-confirm": S.dialog = null; endCheckout(); S.tab = "coins"; render(); break;
      case "checkout-done": endCheckout(); S.tab = "coins"; render(); break;
      case "receipt-print": showToast("Receipt sent to printer (demo)"); break;
      case "receipt-share":
        // Share shares the receipt TEXT — it never claims anything printed.
        copy(receiptText(S.payment), "Receipt text copied — nothing was printed");
        break;
      case "copy-addr": copy(S.payment.address, "Receiving address copied"); break;
      case "copy-hash": copy(el.dataset.h, "Transaction hash copied"); break;

      /* ---- screen C exit: Stop watching (books NEEDS_REVIEW, resumable) --- */
      case "stop-watching": {
        const p = S.payment;
        if (!["mempool", "confirming"].includes(p.state)) break;
        bookRow({
          status: "NEEDS_REVIEW",
          reason: `watching stopped at ${p.confs} of ${p.required}`,
          resume: Object.assign({}, p), // full flight snapshot — History [ Resume ] reopens it
        });
        clearTimers();
        S.payment = { state: "idle" };
        S.tab = "history";
        showToast("Booked NEEDS REVIEW — resume from its History row");
        render();
        break;
      }
      /* Reopens the Tracker on a stopped payment (stage 4 wires the History
         button) — resuming observation, never reversing anything. */
      case "resume-payment": {
        const row = S.ledger.find((r) => r.id === +el.dataset.id);
        if (!row || !row.resume || row.resumed) break;
        row.resumed = true; // the row stays (the ledger never rewrites); its Resume is spent
        clearTimers();
        S.payment = Object.assign({}, row.resume);
        S.tab = "tracker";
        if (S.payment.state === "mempool") { render(); after(1600, () => stepConfirm(1300, finishConfirmed)); }
        else stepConfirm(1300, finishConfirmed); // continues from the saved confs
        break;
      }

      /* ---- screen E actions ------------------------------------------------ */
      case "re-charge": {
        const p = S.payment;
        if (!["expired", "failed"].includes(p.state)) break;
        // Same sale, same rail — fresh 15:00 lock, back to Awaiting. The new
        // charge captures the CURRENT mode, so the first-MAINNET gate applies.
        const opts = { chain: p.chainKey, token: p.token, usd: p.usd, memo: p.memo };
        if (S.mode === "mainnet" && !S.firstMainnetAck) { S.dialog = { kind: "firstmainnet", pending: opts }; render(); break; }
        startCheckout(opts);
        break;
      }
      case "close-sale": {
        const p = S.payment;
        if (p.state === "expired" && p.endKind === "under") {
          // Closing on an unresolved partial quarantines the received money —
          // never silently booked, never silently dropped.
          bookRow({
            status: "NEEDS_REVIEW",
            usd: +(p.received * p.rate).toFixed(2),
            crypto: p.received,
            reason: "part-paid before expiry — unresolved",
          });
        }
        S.cart = []; S.draft = "";
        endCheckout();
        S.tab = "coins";
        render();
        break;
      }
      case "request-balance": {
        const p = S.payment;
        if (p.state !== "expired" || p.endKind !== "under") break;
        const recUsd = +(p.received * p.rate).toFixed(2);
        const short = +(p.usd - recUsd).toFixed(2);
        // The received part books as it happened, at the locked rate…
        bookRow({ status: "CONFIRMED", usd: recUsd, crypto: p.received, reason: "part-paid before expiry — balance requested" });
        // …and the difference becomes a second, separate payment the customer
        // approves in their own wallet — this terminal never pulls funds.
        startCheckout({ chain: p.chainKey, token: p.token, usd: short, memo: p.memo + " — balance" });
        showToast("Balance code created — " + usd(short));
        break;
      }
      case "accept-short": {
        const p = S.payment;
        if (p.state !== "expired" || p.endKind !== "under") break;
        const recUsd = +(p.received * p.rate).toFixed(2);
        // Records both invoiced and received — the payee decides, the machine
        // never rounds up (invoicedUsd rides every row via bookRow).
        bookRow({ status: "CONFIRMED", usd: recUsd, crypto: p.received, reason: "part-paid before expiry — accepted short" });
        showToast("Booked " + usd(recUsd) + " — recorded as it happened");
        S.cart = []; S.draft = "";
        endCheckout();
        S.tab = "coins";
        render();
        break;
      }

      case "rail-sheet": S.sheet = { step: "chains" }; render(); break;
      case "sheet-close": S.sheet = null; render(); break;
      case "sheet-back": S.sheet = { step: "chains" }; render(); break;
      case "sheet-chain": {
        const ch = chainOf(el.dataset.k);
        if (railBlocked(ch)) break; // disabled in the sheet — never silently chargeable
        if (ch.tokens.length > 1) { S.sheet = { step: "asset", chain: ch.key }; }
        else { S.chain = ch.key; S.token = ch.tokens[0]; S.sheet = null; }
        render(); break;
      }
      case "sheet-asset": { S.chain = S.sheet.chain; S.token = el.dataset.t; S.sheet = null; render(); break; }
      case "donation": { const ch = chainOf(S.chain); startCheckout({ chain: ch.key, token: S.token, usd: 0, donation: true, memo: "Donation" }); break; }

      case "csv": exportCsv(); break;
      case "ledger-clear": S.ledger = []; showToast("Ledger cleared"); render(); break;
      case "history-unlock": S.dialog = { kind: "unlock" }; render(); break;
      case "hist-filter": S.histFilter = el.dataset.v; render(); break;
      /* [Lock] — the existing PIN gate, viewing only; taking payment never
         needs the PIN. Without a PIN it offers to set one first. */
      case "history-lock":
        if (!S.pin) { S.dialog = { kind: "setpin" }; render(); }
        else { S.historyLocked = true; showToast("History locked — viewing needs the PIN"); render(); }
        break;

      /* ---- F[10] review resolutions — every choice APPENDS; the original
              NEEDS_REVIEW row is only marked `reviewed`, never rewritten. --- */
      case "review-open": S.dialog = { kind: "review", id: +el.dataset.id }; render(); break;
      case "review-book": {
        const row = S.ledger.find((r) => r.id === +el.dataset.id);
        if (!row || row.status !== "NEEDS_REVIEW" || row.reviewed || row.resumed) break;
        const today = el.dataset.v === "today";
        const rate = today ? (RATES[row.token] || row.rate) : row.rate;
        const booked = bookFromRow(row, {
          status: "CONFIRMED",
          rate,
          usd: +(row.crypto * rate).toFixed(2),
          reason: today ? "review: booked at today's value" : "review: booked at the locked rate",
        });
        row.reviewed = today ? "booked at today's value" : "booked at the locked rate";
        S.dialog = null;
        showToast(`Booked ${usd(booked.usd)} — appended as a new row`);
        render();
        break;
      }
      case "review-return": {
        const row = S.ledger.find((r) => r.id === +el.dataset.id);
        if (!row || row.status !== "NEEDS_REVIEW" || row.reviewed || row.resumed) break;
        // A return is a NEW outbound payment with its own transaction hash —
        // never a reversal of the transaction being reviewed.
        bookFromRow(row, {
          status: "REFUND",
          usd: +(row.crypto * row.rate).toFixed(2),
          reason: "new outbound payment",
          txHash: (row.mode === "demo" ? "SIM-" : "0x") + hex(56),
        });
        row.reviewed = "returned as a new payment";
        S.dialog = null;
        showToast("Returned — REFUND row appended with its own tx");
        render();
        break;
      }

      case "settings-go": S.settingsSection = el.dataset.s; render(); break;
      case "settings-back": S.settingsSection = null; render(); break;
      case "set-mode": {
        const m = el.dataset.m;
        if (m === "mainnet") { S.dialog = { kind: "mainnet" }; render(); }
        else { S.mode = m; render(); }
        break;
      }
      case "set-baseline": S.baseline = el.dataset.b; showToast("Baseline set to " + S.baseline); render(); break;
      case "apply-tax": { const v = parseFloat(fieldVal("tax-input")); S.taxPct = isNaN(v) ? 0 : Math.max(0, v); showToast(S.taxPct ? "Tax set to " + S.taxPct + "%" : "Tax cleared"); render(); break; }
      case "toggle-tips": S.tips = !S.tips; render(); break;
      case "rail-toggle": S.railOpen = S.railOpen === el.dataset.k ? null : el.dataset.k; render(); break;
      case "apply-merchant": { S.merchant = fieldVal("merch-input") || "CryptoPOS Terminal"; showToast("Merchant name saved"); render(); break; }
      case "toggle-catalogfirst": S.catalogFirst = !S.catalogFirst; S.subtab = S.catalogFirst ? "catalog" : "keypad"; render(); break;
      case "add-product": S.dialog = { kind: "addproduct", cat: "Beverages", ico: "coffee" }; render(); break;
      case "ap-cat": S.dialog.cat = el.dataset.c; render(); break;
      case "ap-ico": S.dialog.ico = el.dataset.i; render(); break;
      case "ap-confirm": {
        const name = fieldVal("ap-name"); const price = parseFloat(fieldVal("ap-price"));
        if (!name || isNaN(price)) { showToast("Enter a name and price"); return; }
        PRODUCTS.push({ id: Date.now(), name, price: +price.toFixed(2), cat: S.dialog.cat, ico: S.dialog.ico, fav: false });
        S.dialog = null; showToast("Product added"); render(); break;
      }
      case "prod-fav": { const p = prodOf(+el.dataset.id); p.fav = !p.fav; render(); break; }
      case "prod-del": { PRODUCTS = PRODUCTS.filter((p) => p.id !== +el.dataset.id); render(); break; }
      case "set-pin": S.dialog = { kind: "setpin" }; render(); break;
      case "pin-save": { const v = fieldVal("pin-input"); if (v.length < 4) { showToast("PIN must be 4–6 digits"); return; } S.pin = v; S.dialog = null; showToast("Operator PIN set"); render(); break; }
      case "remove-pin": S.pin = null; S.historyLocked = false; showToast("PIN removed"); render(); break;
      case "lock-now": S.historyLocked = true; showToast("Terminal locked"); render(); break;
      case "pin-unlock": { const v = fieldVal("pin-input"); if (v === S.pin) { S.historyLocked = false; S.dialog = null; render(); } else { const e = document.getElementById("unlock-err"); if (e) e.style.display = "block"; } break; }
      case "open-history": S.settingsSection = null; S.tab = "history"; render(); break;
      case "burn-down": S.dialog = { kind: "burn" }; render(); break;
      case "burn-confirm": { if (fieldVal("burn-confirm") === "RESET") { resetAll(true); showToast("Store reset to fresh install"); } break; }
      case "enable-mainnet": break; // disabled (blockers present)

      case "mainnet-confirm": { if (fieldVal("mainnet-confirm") === "MAINNET") { S.mode = "mainnet"; S.dialog = null; S.settingsSection = null; showToast("Mainnet enabled"); render(); } break; }

      case "dialog-close": S.dialog = null; render(); break;

      case "onb-mode": S.onboarding.mode = el.dataset.m; render(); break;
      case "onb-next": S.onboarding.step++; render(); break;
      case "onb-back": S.onboarding.step--; render(); break;
      case "onb-pick": { const k = el.dataset.k; S.onboarding.picked[k] = !S.onboarding.picked[k]; render(); break; }
      case "onb-finish": { S.mode = "testnet"; S.onboarding = null; S.tab = "coins"; showToast("Setup complete"); render(); break; }
      case "noop": break;
    }
  }

  function copy(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(msg), () => showToast("Copy failed"));
    } else {
      showToast("Clipboard unavailable");
    }
  }

  function exportCsv() {
    // Fixed columns (F[2]); the status column carries the same words shown
    // on-screen (SETTLED, NEEDS REVIEW, …) so exports reconcile 1:1.
    const lines = ["timestamp,chain·token,crypto amount,locked rate,network,provenance,status"].concat(
      S.ledger.map((r) => [
        r.ts,
        `${chainOf(r.chainKey).name}·${r.token}`,
        cryptoStr(r.token, r.crypto),
        r.rate,
        r.network,
        r.provenance,
        displayStatus(r.status),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cryptopos-ledger.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast("Ledger exported to CSV");
  }

  /* Out-of-the-box ledger — one of each row shape History teaches with:
     mainnet income, a testnet settle, both NEEDS-REVIEW quarantines (late
     arrival + stopped watch with its resume snapshot), an expiry, a network
     failure, a demo sale and a refund. Reconciliation stays consistent with
     these rows: INCOME $128.50 · 2 sales; NOT income: $12.50 testnet ·
     $12.00 demo · 1 failed · 1 expired · 2 need review. */
  function seedLedger() {
    const day = (off) => localTs(Date.now() - off * 864e5).slice(0, 10);
    // wall-clock ms for a seed event ("off days ago at h:m") — keeps derived
    // times (e.g. a resumed receipt's "locked at charge") plausible
    const at = (off, h, m) => { const d = new Date(Date.now() - off * 864e5); d.setHours(h, m, 0, 0); return d.getTime(); };
    const ETH_STOP_TX = "0x7bd30a5e19c2f4886d1e0b3a9c57f2481ade60b9315c7d02e8f4a1c6d9e044aa";
    return [
      { id: 1, ts: `${day(1)} 16:42:10`, chainKey: "Bitcoin", token: "BTC", usd: 12.5, crypto: 0.00019531, rate: 64000,
        status: "REFUND", mode: "mainnet", provenance: "REAL", network: "MAINNET",
        txHash: "0x9d21c04af52e619b7d3a880e5b21c99d02f4a6e30d1b57cc4b8a92ff130a77f0",
        memo: "Return to customer", invoicedUsd: 12.5, reason: "new outbound payment" },
      { id: 2, ts: `${day(1)} 17:30:41`, chainKey: "Solana", token: "USDC", usd: 116, crypto: 116, rate: 1,
        status: "CONFIRMED", mode: "mainnet", provenance: "REAL", network: "MAINNET",
        txHash: "0x62b8e4d10fa4c95327d9be01c6a8873dd2b1f0c99871a3ce45d6b2a08c11f9ab",
        memo: "Custom sale", invoicedUsd: 116 },
      { id: 3, ts: `${day(0)} 08:58:51`, chainKey: "Solana", token: "SOL", usd: 12, crypto: 0.08, rate: 150,
        status: "CONFIRMED", mode: "demo", provenance: "SIMULATED", network: "DEMO",
        txHash: "SIM-8f31c07bd2ae5964d1c8b0a7f3e92d465a1b8c0d9e2f74a3b5c6d7e8f9a0b1c2",
        memo: "Custom sale", invoicedUsd: 12 },
      { id: 4, ts: `${day(0)} 09:05:37`, chainKey: "Ethereum", token: "ETH", usd: 21, crypto: 0.006, rate: 3500,
        status: "FAILED", mode: "testnet", provenance: "REAL", network: "TESTNET",
        txHash: "0x1cc39fa07d5e12b84a6c0f3d9b2e785614a0cd3f9b871e26c5d4a3f0e9b8d7c6",
        memo: "Custom sale", invoicedUsd: 21, reason: "ran out of gas" },
      { id: 5, ts: `${day(0)} 09:12:18`, chainKey: "Bitcoin", token: "BTC", usd: 0, crypto: 0.00014063, rate: 64000,
        status: "EXPIRED", mode: "testnet", provenance: "REAL", network: "TESTNET",
        txHash: "", memo: "Custom sale", invoicedUsd: 9, reason: "no payment within rate lock" },
      { id: 6, ts: `${day(0)} 09:20:12`, chainKey: "Ethereum", token: "ETH", usd: 12.5, crypto: 0.003571, rate: 3500,
        status: "NEEDS_REVIEW", mode: "mainnet", provenance: "REAL", network: "MAINNET",
        txHash: ETH_STOP_TX, memo: "Custom sale", invoicedUsd: 12.5, reason: "watching stopped at 1 of 3",
        // Full flight snapshot — [ Resume ] reopens the Tracker mid-ladder.
        resume: { state: "confirming", mode: "mainnet", chainKey: "Ethereum", token: "ETH", usd: 12.5,
          crypto: 0.003571, rate: 3500, rateLockEnd: at(0, 9, 32) /* charged 9:17 AM + 15:00 lock */, provenance: "REAL", address: SAMPLE_ADDR.Ethereum,
          live: true, required: 3, confs: 1, txHash: ETH_STOP_TX, donation: false, memo: "Custom sale",
          received: 0.003571, blockAt: 20419688, endKind: null } },
      { id: 7, ts: `${day(0)} 09:41:03`, chainKey: "Ethereum", token: "USDC", usd: 12.5, crypto: 12.5, rate: 1,
        status: "CONFIRMED", mode: "testnet", provenance: "REAL", network: "TESTNET",
        txHash: "0x7b52d90c3ea8f1b6470d2c5a9e8b3f174c6a0d2e9b5f8c1a3d7e0f6b9c2a44aa",
        memo: "Custom sale", invoicedUsd: 12.5 },
      // Locked at $63,200 while today's market is $64,000 — so the review
      // dialog's "locked rate vs today's value" choice shows a real spread.
      { id: 8, ts: `${day(0)} 09:55:29`, chainKey: "Bitcoin", token: "BTC", usd: 12.5, crypto: 0.00019778, rate: 63200,
        status: "NEEDS_REVIEW", mode: "mainnet", provenance: "REAL", network: "MAINNET",
        txHash: "0x3e91b7a20cd54f68a1b3c9d0e7f2485196acdb30e7f5a2c8d1b6e9f0a3c7d5e4",
        memo: "Custom sale", invoicedUsd: 12.5, reason: "arrived after the rate lock" },
      { id: 9, ts: `${day(0)} 10:07:44`, chainKey: "Bitcoin", token: "BTC", usd: 12.5, crypto: 0.00019531, rate: 64000,
        status: "CONFIRMED", mode: "mainnet", provenance: "REAL", network: "MAINNET",
        txHash: "0x4f8a29bc51e07d3aa2b64f0c8d9e1735c6a4b2d8f0917e5a3c1b0d2fe1d99c2e",
        memo: "Custom sale", invoicedUsd: 12.5 },
    ];
  }

  /* Stage reset reseeds the reference ledger; Burn Down the Store (empty:
     true) erases it — the honest "INCOME $0.00 · 0 sales" state. */
  function resetAll(empty) {
    clearTimers();
    clearModePreview();
    const seeds = empty ? [] : seedLedger();
    Object.assign(S, {
      tab: "coins", mode: "testnet", modePreview: null, chain: "Ethereum", token: "USDC", subtab: "keypad",
      draft: "", cart: [], payment: { state: "idle" }, ledger: seeds, txCounter: seeds.length, drawer: false,
      dialog: null, sheet: null, settingsSection: null, railOpen: null, onboarding: null, firstMainnetAck: false,
      merchant: "CryptoPOS Terminal", baseline: "USD", taxPct: 0, tips: false, staff: [],
      catalogFirst: false, pin: null, historyLocked: false, histFilter: "all",
    });
    render();
  }

  /* ---- theme + clock ------------------------------------------------------- */
  function toggleTheme() {
    const dark = document.documentElement.dataset.theme === "dark";
    setTheme(dark ? "light" : "dark");
  }
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("posh-theme", t); } catch (e) {}
    const btn = document.getElementById("theme-btn");
    if (btn) {
      btn.querySelector("svg").innerHTML = (window.ICONS[t === "dark" ? "sun" : "moon"]) || "";
      document.getElementById("theme-label").textContent = t === "dark" ? "Light" : "Dark";
    }
  }
  function tickClock() {
    const d = new Date();
    let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, "0");
    h = h % 12 || 12;
    const el = document.getElementById("clock");
    if (el) el.textContent = h + ":" + m;
  }
  function tickHeights() {
    S.heights.Bitcoin += Math.random() < 0.15 ? 1 : 0;
    S.heights.Ethereum += 1;
    S.heights.Solana += 2;
    S.heights.Polygon += 1;
    S.heights.Monero += Math.random() < 0.15 ? 1 : 0;
    S.heights.Tari += Math.random() < 0.4 ? 1 : 0;
    S.heights.Minotari += Math.random() < 0.1 ? 1 : 0;
    if (S.tab === "settings" && S.settingsSection === "security") render();
  }

  /* ---- init ---------------------------------------------------------------- */
  function init() {
    // status bar icons
    document.getElementById("sb-wifi").innerHTML = window.ICONS.wifi;
    document.getElementById("sb-signal").innerHTML = window.ICONS.signal;
    document.getElementById("sb-battery").innerHTML = window.ICONS.battery;
    document.getElementById("reset-btn").querySelector("svg").innerHTML = window.ICONS.refresh;
    let t = "light";
    try { t = localStorage.getItem("posh-theme") || "light"; } catch (e) {}
    setTheme(t);
    tickClock();
    setInterval(tickClock, 20000);
    setInterval(tickHeights, 1600);

    // delegated events
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-act]");
      if (!el) return;
      e.preventDefault();
      handle(el.dataset.act, el);
    });
    // live update for typed confirmations (no full re-render → keep focus)
    document.addEventListener("input", (e) => {
      const t2 = e.target;
      if (t2.id === "mainnet-confirm") {
        const go = document.getElementById("mainnet-go");
        if (go) go.disabled = t2.value !== "MAINNET";
      }
    });
    // stage controls
    document.getElementById("theme-btn").addEventListener("click", () => { toggleTheme(); render(); });
    // the click event must not read as resetAll's `empty` flag
    document.getElementById("reset-btn").addEventListener("click", () => resetAll());

    // seed the ledger so Sale History shows meaningfully out of the box
    S.ledger = seedLedger();
    S.txCounter = S.ledger.length;
    render();
    window.__POSH__ = S;
    window.__POSH_URI__ = paymentUri; // scripted QR-contract assertions (like __POSH__)
    window.__POSH_RECEIPT_TEXT__ = () => receiptText(S.payment); // scripted Share-copy assertions
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
