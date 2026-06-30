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
  const PRESETS = [1, 2, 5, 10, 20];
  const CONFS = { Bitcoin: 3, Ethereum: 3, Solana: 2, Polygon: 2, Monero: 3, Tari: 1, Minotari: 1 };

  let PRODUCTS = [
    { id: 1, name: "Artisan Avocado Toast", price: 12.0, cat: "Foods", ico: "food", fav: false },
    { id: 2, name: "Hardware Cold Storage Kit", price: 95.0, cat: "Hardware", ico: "dns", fav: false },
    { id: 3, name: "Organic Espresso", price: 3.2, cat: "Beverages", ico: "coffee", fav: false },
  ];

  const MODES = {
    testnet: { pill: "Testnet", cls: "testnet", sub: "Real test networks · valueless coin · never income", bar: null, net: "TESTNET" },
    mainnet: { pill: "Mainnet", cls: "mainnet", sub: null, bar: "MAINNET — REAL FUNDS", net: "MAINNET" },
    demo:    { pill: "Demo Sandbox", cls: "demo", sub: "Practice mode — nothing real settles", bar: null, net: "TESTNET" },
  };
  const MODE_CYCLE = { testnet: "mainnet", mainnet: "demo", demo: "testnet" };

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

  const FEE_COPY = {
    Bitcoin: "Negligible (testnet) — paid by the customer's wallet",
    Ethereum: "Negligible (testnet) — paid by the customer's wallet",
    Polygon: "Sub-cent (Polygon L2) — paid by the customer's wallet",
    Solana: "Sub-cent (a fraction of a penny) — paid by the customer's wallet",
    Monero: "Low (typically a few cents) — set by the customer's wallet",
    Tari: "Near zero (Ootle L2 testnet) — paid by the customer's wallet",
    Minotari: "Sub-penny (Minotari L1) — paid by the customer's wallet",
  };

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
    coinStep: "chains",
    mode: "testnet",
    chain: "Ethereum",
    token: "USDC",
    subtab: "keypad",
    draft: "",
    cart: [], // [{id, qty}]
    payment: { state: "idle" },
    ledger: [],
    txCounter: 0,
    drawer: false,
    dialog: null, // {kind, ...}
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
    heights: { Bitcoin: 2580431, Ethereum: 20419773, Solana: 281944120, Polygon: 60192344, Monero: 3204881 },
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

  const draftVal = () => { const v = parseFloat(S.draft); return isNaN(v) ? 0 : v; };
  const cartUsd = () => S.cart.reduce((a, l) => a + prodOf(l.id).price * l.qty, 0);
  const subtotalUsd = () => +(cartUsd() + draftVal()).toFixed(2);
  const taxUsd = () => +(subtotalUsd() * (S.taxPct / 100)).toFixed(2);
  const dueUsd = () => +(subtotalUsd() + taxUsd()).toFixed(2);
  const cartCount = () => S.cart.reduce((a, l) => a + l.qty, 0);
  const railLive = (ch) => S.mode !== "demo" && ch.coin === "live";
  const cryptoAmt = (token, usdv) => usdv / (RATES[token] || 1);

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

  /* ---- real payment QR ----------------------------------------------------- */
  function paymentUri(p) {
    const a = p.address, amt = p.crypto, ch = p.chainKey, tok = p.token;
    if (p.donation) return ch === "Bitcoin" ? "bitcoin:" + a : ch === "Solana" ? "solana:" + a
      : (ch === "Ethereum" || ch === "Polygon") ? "ethereum:" + a : a;
    if (ch === "Bitcoin") return `bitcoin:${a}?amount=${fix(amt, 8).replace(/,/g, "")}`;
    if (ch === "Solana") return tok === "USDC"
      ? `solana:${a}?amount=${amt.toFixed(2)}&spl-token=${USDC.sol}`
      : `solana:${a}?amount=${amt.toFixed(6)}`;
    if (ch === "Ethereum" || ch === "Polygon") {
      const id = ch === "Polygon" ? 137 : 1;
      if (tok === "USDC") { const u = Math.round(amt * 1e6); const c = ch === "Polygon" ? USDC.pol : USDC.eth; return `ethereum:${c}@${id}/transfer?address=${a}&uint256=${u}`; }
      return `ethereum:${a}@${id}?value=${Math.round(amt * 1e3)}000000000000000`;
    }
    if (ch === "Monero") return `monero:${a}?tx_amount=${amt.toFixed(6)}`;
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
  function chrome() {
    const m = MODES[S.mode];
    return `
      <div class="appbar">
        <button class="icon-btn" data-act="drawer-open" aria-label="Menu">${svg("menu")}</button>
        <span class="brand">CryptoPoS</span>
        <button class="mode-pill ${m.cls}" data-act="mode-cycle" title="Tap to preview Testnet / Mainnet / Demo"><span class="dot"></span>${m.pill}</button>
      </div>
      ${m.bar
        ? `<div class="mainnet-bar"><span class="dot"></span>${m.bar}</div>`
        : `<div class="subtitle">${m.sub}</div>`}`;
  }

  /* ============================================================================
     TERMINAL
     ========================================================================== */
  function terminalToday() {
    const real = S.ledger.filter((r) => r.network === "MAINNET" && r.status === "CONFIRMED");
    const sum = real.reduce((a, r) => a + r.usd, 0);
    return `
      <div class="today-card">
        <div>
          <div class="label">Today</div>
          <div class="sub">${real.length} confirmed sale${real.length === 1 ? "" : "s"}</div>
        </div>
        <div class="amt">${usd(sum)}</div>
      </div>`;
  }

  const ASSET_NAMES = {
    BTC: "Bitcoin", ETH: "Ether", SOL: "Solana", POL: "Polygon",
    XMR: "Monero", XTR: "Tari (Ootle L2)", XTM: "Minotari (Tari L1)",
    USDC: "USD Coin",
  };
  const assetBrand = (ch, tok) => (tok === "USDC" ? "#2775CA" : ch.brand);
  const assetInk = (ch, tok) => (tok === "USDC" ? "#fff" : ch.ink);

  // The "sub-cart" — chosen network/asset + all the pertinent checkout info
  function subCart() {
    const ch = chainOf(S.chain);
    const due = dueUsd();
    const rate = RATES[S.token];
    const t = new Date().toTimeString().slice(0, 8);
    const cryptoLine = due > 0 ? `<div style="color:var(--status-demo);font-weight:700;font-variant-numeric:tabular-nums;margin-top:2px">= ${fix(cryptoAmt(S.token, due), 6)} ${S.token}</div>` : "";
    const taxNote = S.taxPct > 0 && due > 0 ? `<div class="due-divider"></div><div style="font-size:.8rem;color:var(--on-surface-variant)">Subtotal ${usd(subtotalUsd())} · tax ${S.taxPct}% ${usd(taxUsd())}</div>` : "";
    return `
      <div class="card due-card">
        <button class="subcart-coin" data-act="coin-back-asset" title="Change network or asset">
          ${coinDisc(ch, 32)}
          <span class="sc-coin-body">
            <div class="sc-coin-name">${ch.name} · ${S.token}</div>
            <div class="sc-coin-sub"><span class="status-dot ${ch.coin}"></span>${statusWord(ch)} · tap to change</div>
          </span>
          <span class="chev">${svg("chevron_right")}</span>
        </button>
        <div class="due-divider"></div>
        <div class="due-top">
          <div>
            <div class="due-label">Total Amount Due</div>
            <div class="due-amount ${due > 0 ? "" : "zero"}">${usd(due)}</div>
          </div>
          <div class="rate-box">
            <div class="rate-title">${S.token} Exchange Rate</div>
            <div class="rate-eq">1 ${S.token} ≈ ${usd(rate)} USD</div>
            <div class="rate-time">live · as of ${t}</div>
            ${cryptoLine}
          </div>
        </div>
        ${taxNote}
        <div class="due-divider"></div>
        <div style="font-size:.82rem;color:var(--on-surface-variant)">Network fee: ${FEE_COPY[S.chain]}</div>
      </div>`;
  }

  function keypad() {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "."];
    return `
      <div class="keypad">
        ${keys.map((k) => k === "C"
          ? `<button class="key clear" data-act="key" data-v="C">C</button>`
          : `<button class="key" data-act="key" data-v="${k}">${k}</button>`).join("")}
      </div>
      <button class="correction" data-act="key" data-v="back"><span class="badge">${svg("backspace")}</span> Correction</button>`;
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
     COINS FLOW: blockchains → asset → sub-cart + keypad  (the checkout builder)
     ========================================================================== */

  // Step 1 — available blockchains (the home screen)
  function viewChains() {
    const card = (ch) => `
      <button class="coin-card" data-act="pick-chain" data-k="${ch.key}" style="--brand:${ch.brand}">
        <div class="cc-top">
          ${coinDisc(ch, 36)}
          <span><div class="cc-name">${ch.name}</div><div class="cc-sym">${ch.sym}</div></span>
        </div>
        <div class="coin-status ${ch.coin}"><span class="status-dot ${ch.coin}"></span>${statusWord(ch)}</div>
      </button>`;
    return `
      ${terminalToday()}
      <div class="section-head">
        <h2>Accepted Coins</h2>
        <p>Choose a network, then an asset — every sale gets its own fresh payment code.</p>
      </div>
      <div class="coins-grid">${CHAINS.map(card).join("")}</div>`;
  }

  // Step 2 — choose the asset to charge in
  function viewAsset() {
    const ch = chainOf(S.chain);
    const cards = ch.tokens.map((tok) => {
      const brand = assetBrand(ch, tok);
      return `
        <button class="asset-card" data-act="pick-asset" data-t="${tok}" style="--brand:${brand}">
          <span class="coin-glyph" style="--brand:${brand};--ink:${assetInk(ch, tok)};--glyph:42px">${tok}</span>
          <span class="ac-body">
            <div class="ac-name">${ASSET_NAMES[tok] || tok}</div>
            <div class="ac-sub">${tok} · 1 ${tok} ≈ ${usd(RATES[tok])}</div>
          </span>
          ${svg("chevron_right")}
        </button>`;
    }).join("");
    return `
      <div class="subscreen-head"><button class="icon-btn" data-act="coin-back-chains">${svg("arrow_back")}</button><h2>${ch.name}</h2></div>
      <div class="rails-hint">Choose the asset to charge in on ${ch.name}. Each sale generates its own fresh ${ch.name} payment code.</div>
      <div class="asset-list">${cards}</div>`;
  }

  // Step 3 — the checkout builder (sub-cart + keypad)
  function viewBuild() {
    const ch = chainOf(S.chain);
    const due = dueUsd();
    const live = railLive(ch);
    const disabled = due <= 0 || S.payment.state !== "idle";
    return `
      <div class="subscreen-head"><button class="icon-btn" data-act="coin-back-asset">${svg("arrow_back")}</button><h2 style="text-transform:none;letter-spacing:.02em">New ${ch.name} sale</h2></div>
      ${subCart()}
      ${keypad()}
      <div class="charge-wrap">
        <button class="charge-btn ${live ? "live" : ""}" data-act="generate" ${disabled ? "disabled" : ""}>
          ${svg("scanner")} GENERATE PAYMENT QR (${S.token}) • ${usd(due)}
        </button>
        <button class="donation-link" data-act="donation">Show address-only donation code (untracked)</button>
      </div>`;
  }

  function viewCoins() {
    if (S.coinStep === "asset") return viewAsset();
    if (S.coinStep === "build") return viewBuild();
    return viewChains();
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

  function simCard() {
    return `
      <div class="card" style="margin-top:16px">
        <div style="font-size:.78rem;font-weight:800;letter-spacing:.04em;color:var(--primary)">CONSENSUS SANDBOX — SIMULATE PAYMENT FEED</div>
        <p style="font-size:.8rem;color:var(--on-surface-variant);line-height:1.45;margin:6px 0 12px">
          No real multi-chain gas transactions happen on this device. Use these to mock the RPC events a customer's wallet broadcast would trigger:</p>
        <div class="sim-row">
          <button class="sim-btn primary" data-act="sim" data-v="fast">${svg("bolt")} Fast Payment</button>
          <button class="sim-btn" data-act="sim" data-v="slow">${svg("timer")} Simulate Slow</button>
        </div>
        <div class="sim-row" style="margin-top:8px">
          <button class="sim-btn danger" data-act="sim" data-v="gas">Out-Of-Gas Fail</button>
          <button class="sim-btn danger" data-act="sim" data-v="double">Double-Spend Fail</button>
        </div>
      </div>`;
  }

  function viewAwaiting() {
    const p = S.payment;
    const uri = paymentUri(p);
    return `
      ${trackerCancelBar()}
      <div class="screen-pad" style="padding-top:14px">
        ${checkoutHeader("AWAITING MULTI-CHAIN BROADCAST")}
        <div class="checkout">
          <div class="qr-frame">${qrMarkup(uri)}</div>
          <div class="co-amount">${fix(p.crypto, 6)} ${p.token}</div>
          <div class="co-crypto">Equivalent to ${usd(p.usd)} USD</div>
          <div class="addr-chip">${elide(p.address)}<button class="copy" data-act="copy-addr" aria-label="Copy">${svg("copy")}</button></div>
          <div class="qr-caption">⚠ SAMPLE receiving address — scannable, but not payable</div>
          <div class="co-status"><span class="spinner"></span> ${p.live ? "LIVE — watching " + chainOf(p.chainKey).name + " for payment…" : "Waiting for the customer to scan…"}</div>
        </div>
        ${simCard()}
      </div>`;
  }

  function viewMempool() {
    const p = S.payment;
    return `
      ${trackerCancelBar()}
      <div class="screen-pad" style="padding-top:14px">
        ${checkoutHeader("UNCONFIRMED BROADCAST DETECTED")}
        <div class="checkout">
          <div style="margin:8px auto;display:grid;place-items:center;color:var(--status-demo)">${svg("cloud", "big-ico")}</div>
          <div class="co-amount" style="font-size:1.5rem;letter-spacing:.04em">MEMPOOL DETECTED</div>
          <div style="height:8px;border-radius:999px;background:var(--surface-variant);overflow:hidden;margin:14px 0">
            <div style="height:100%;width:38%;background:var(--status-demo);border-radius:999px"></div>
          </div>
        </div>
        <div class="card" style="margin-top:8px">
          <div class="rail-detail" style="display:block;border:none;padding:0">
            <div class="kv"><span class="k">Network fee</span><span class="v" style="font-family:inherit">${FEE_COPY[p.chainKey]}</span></div>
            <div class="kv"><span class="k">Sender</span><span class="v">${p.live ? elide("0x" + hex(40)) : "Simulated Sender"}</span></div>
            <div class="kv"><span class="k">Transaction ID</span><span class="v">${elide(p.txHash)}</span></div>
          </div>
        </div>
        <div class="co-status" style="margin-top:12px"><span class="spinner"></span> Inspected mempool — unconfirmed transaction identified.</div>
      </div>`;
  }

  function viewConfirming() {
    const p = S.payment;
    const pct = Math.round((p.confs / p.required) * 100);
    return `
      ${trackerCancelBar()}
      <div class="screen-pad" style="padding-top:14px">
        ${checkoutHeader("CONSENSUS CONFIRMATION CYCLE")}
        <div class="checkout">
          <div style="width:118px;height:118px;margin:6px auto 14px;border-radius:50%;display:grid;place-items:center;border:6px solid var(--primary);font-weight:800;font-size:1.6rem;font-variant-numeric:tabular-nums">${p.confs}/${p.required}</div>
          <div style="font-size:.74rem;font-weight:800;letter-spacing:.06em;color:var(--on-surface-variant)">BLOCK CONFIRMATIONS PROGRESS</div>
          <div style="height:8px;border-radius:999px;background:var(--surface-variant);overflow:hidden;margin:12px 0">
            <div style="height:100%;width:${pct}%;background:var(--primary);border-radius:999px;transition:width .3s"></div>
          </div>
        </div>
        <div class="card">
          <div class="rail-detail" style="display:block;border:none;padding:0">
            <div class="kv"><span class="k">Settlement type</span><span class="v" style="font-family:inherit;color:${p.live ? "var(--status-live)" : "var(--status-demo)"}">${p.live ? "Live on-chain" : "SIMULATED (demo)"}</span></div>
            <div class="kv"><span class="k">Checkout amount</span><span class="v" style="font-family:inherit">${fix(p.crypto, 6)} ${p.token} · ${usd(p.usd)}</span></div>
            <div class="kv"><span class="k">Consensus Tx</span><span class="v">${elide(p.txHash)}</span></div>
          </div>
        </div>
        <div class="co-status" style="margin-top:12px"><span class="spinner"></span> Block mined — settle progress (${p.confs}/${p.required} confirmations)</div>
      </div>`;
  }

  function viewReceipt() {
    const p = S.payment;
    const ch = chainOf(p.chainKey);
    const sim = S.mode === "demo";
    const loyalty = Math.max(1, Math.round(p.usd));
    return `
      <div class="screen-pad" style="padding-top:16px">
        <div class="receipt">
          <div class="r-check">${svg("check")}</div>
          <div class="r-title">${sim ? "SIMULATED CHECKOUT" : "TRANSACTION SETTLED"}</div>
          <div class="r-sub" style="text-transform:uppercase;letter-spacing:.04em">${esc(S.merchant)}</div>
          ${sim ? `<div style="color:var(--status-demo);font-weight:800;font-size:.8rem;margin-top:6px">⚠ SIMULATED — NOT A REAL PAYMENT</div>` : ""}
          <div class="r-amount">${usd(p.usd)}</div>
          <div class="r-sub">${fix(p.crypto, 6)} ${p.token}</div>
          <div class="r-divider"></div>
          <div class="r-line"><span class="rk">SETTLEMENT DATE</span><span class="rv">${p.dateUtc}</span></div>
          <div class="r-line"><span class="rk">BLOCKCHAIN BASE</span><span class="rv">${ch.name.toUpperCase()}</span></div>
          <div class="r-line"><span class="rk">CURRENCY ASSET</span><span class="rv">${p.token}</span></div>
          <div class="r-line"><span class="rk">TX RECEIPT ID</span><span class="rv">#Tx${p.txId}</span></div>
          <div class="r-line"><span class="rk">NETWORK FEE</span><span class="rv" style="font-weight:500;text-align:right;max-width:170px">${FEE_COPY[p.chainKey]}</span></div>
          <div class="r-line"><span class="rk">TX HASH</span><span class="rv mono">${elide(p.txHash)}</span></div>
          ${ch.key === "Tari" ? `<div class="r-loyalty">★ LOYALTY POINTS MINTED: +${loyalty} pts</div>` : ""}
          <div style="font-size:.66rem;color:var(--receipt-muted);margin-top:14px;letter-spacing:.06em">REPLACE INGENICO SYSTEM VIA WEB3 · BROWSER DEMO — NO FUNDS MOVED</div>
        </div>
        <div class="receipt-actions">
          <button class="sim-btn" data-act="receipt-print">${svg("print")} Print</button>
          <button class="sim-btn" data-act="receipt-print">${svg("share")} Share</button>
        </div>
        <div class="new-sale-wrap">
          <button class="charge-btn" data-act="checkout-done">PRINT RECEIPT &amp; CONTINUE</button>
        </div>
      </div>`;
  }

  function viewFailed() {
    const p = S.payment;
    return `
      <div class="screen-pad" style="padding-top:16px">
        <div class="card" style="border-color:color-mix(in srgb, var(--error) 45%, var(--outline))">
          <div style="text-align:center;color:var(--error);margin-bottom:8px">${svg("cancel", "big-ico")}</div>
          <div style="text-align:center;font-weight:800;letter-spacing:.03em;color:var(--error)">PAYMENT NOT COMPLETED</div>
          <div style="margin-top:14px;padding:12px;border-radius:8px;background:var(--error-container);color:var(--on-error-container);font-family:var(--font-mono);font-size:.8rem;line-height:1.45">Reason: ${esc(p.reason)}</div>
          <p style="font-size:.84rem;color:var(--on-surface-variant);margin:12px 0 0;line-height:1.5">No funds moved. Ask the customer to try again, or pick another rail.</p>
        </div>
        <div class="new-sale-wrap">
          <button class="charge-btn" data-act="checkout-done">Dismiss &amp; Back to Terminal</button>
        </div>
      </div>`;
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
        <div class="es-sub" style="max-width:300px">Ring up a sale on the Terminal tab — or tap a coin in the Coins gallery for a quick one-off — pick your chain, and generate a checkout QR to monitor real-time settlement here.</div>
      </div>`;
  }

  function viewTracker() {
    switch (S.payment.state) {
      case "awaiting": return viewAwaiting();
      case "donation": return viewDonation();
      case "mempool": return viewMempool();
      case "confirming": return viewConfirming();
      case "confirmed": return viewReceipt();
      case "failed": return viewFailed();
      default: return viewTrackerIdle();
    }
  }

  /* ============================================================================
     SALE HISTORY
     ========================================================================== */
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
    const head = `
      <div class="subscreen-head" style="justify-content:space-between">
        <div><h2 style="text-transform:none;letter-spacing:.06em">SALES LEDGER</h2>
        <p style="margin:4px 0 0;font-size:.82rem;color:var(--on-surface-variant)">Stored locally (this session only)</p></div>
        ${S.ledger.length ? `<span style="display:flex;gap:4px"><button class="icon-btn" data-act="csv" title="Export CSV">${svg("export")}</button><button class="icon-btn" data-act="ledger-clear" title="Clear ledger" style="color:var(--error)">${svg("delete_sweep")}</button></span>` : ""}
      </div>`;
    if (!S.ledger.length) {
      return head + `
        <div class="empty-state">
          <div class="es-ico">${svg("receipt_long")}</div>
          <div class="es-title">Ledger history is empty</div>
          <div class="es-sub">Completed terminal checkout sessions are recorded here in real time.</div>
        </div>`;
    }
    const real = S.ledger.filter((r) => r.network === "MAINNET" && r.status === "CONFIRMED" && r.provenance === "REAL");
    const realSum = real.reduce((a, r) => a + r.usd, 0);
    const notIncome = S.ledger.filter((r) => !(r.network === "MAINNET" && r.provenance === "REAL"));
    const notSum = notIncome.reduce((a, r) => a + r.usd, 0);
    const recon = `
      <div class="card" style="margin:0 16px 12px;border-color:var(--status-live-border)">
        <div style="font-size:.7rem;font-weight:800;letter-spacing:.06em;color:var(--status-live)">REAL INCOME · MAINNET CONFIRMED SALES</div>
        <div style="font-size:1.5rem;font-weight:800;color:var(--status-live);margin-top:4px;font-variant-numeric:tabular-nums">${usd(realSum)} · ${real.length} sale${real.length === 1 ? "" : "s"}</div>
        <div style="font-size:.82rem;color:var(--on-surface-variant);margin-top:6px">Not income — testnet/sim ${usd(notSum)} (${notIncome.length})</div>
        <div style="font-size:.66rem;color:var(--on-surface-variant);margin-top:8px;line-height:1.5">Counts only Mainnet + REAL + Confirmed as revenue — testnet and demo sales are recorded but never booked as income.</div>
      </div>`;
    const rows = S.ledger.slice().reverse().map((r) => {
      const ch = chainOf(r.chainKey);
      const stCls = r.status === "CONFIRMED" ? "settled" : r.status === "FAILED" ? "failed" : "expired";
      const stWord = r.status === "CONFIRMED" ? "CONFIRMED" : r.status;
      const stColor = r.status === "CONFIRMED" ? "var(--status-live)" : r.status === "FAILED" ? "var(--error)" : "var(--on-surface-variant)";
      return `
        <div class="history-row">
          <span class="status-dot ${ch.coin}" style="width:9px;height:9px;border-radius:50%;background:${stColor};flex:0 0 auto"></span>
          <span class="hr-mid">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <strong style="font-size:.86rem">${ch.name.toUpperCase()}:${r.token}</strong>
              <span class="badge ${r.provenance === "REAL" ? "ready" : "sim"}" style="padding:1px 6px;font-size:.6rem">${r.provenance}</span>
              <span class="badge ${r.network === "MAINNET" ? "ready" : "expired"}" style="padding:1px 6px;font-size:.6rem">${r.network}</span>
              <span style="font-size:.62rem;font-weight:800;color:${stColor}">${stWord}</span>
            </div>
            <div class="hr-sub">${r.ts}</div>
            <div class="hr-sub">${esc(r.memo)} · ${fix(r.crypto, 6)} ${r.token} @ ${usd(r.rate)}/${r.token}</div>
            <div class="hr-sub" style="display:flex;align-items:center;gap:6px">TxID: ${elide(r.txHash)} <button class="copy" data-act="copy-hash" data-h="${r.txHash}" style="border:none;background:none;color:var(--primary);cursor:pointer;padding:0">${svg("copy")}</button></div>
          </span>
          <span class="hr-amt" style="color:var(--status-live)">+${usd(r.usd)}</span>
        </div>`;
    }).join("");
    return head + recon + `<div class="history-list">${rows}</div>`;
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
          <p class="helper" style="margin-top:6px">Your sales ledger lives on the Sale History tab — view every sale, export the bookkeeping CSV, or clear the ledger there.</p>
          <button class="dialog-btn" data-act="open-history" style="margin-top:8px">Open Sale History</button>
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

  function dialogHtml() {
    const d = S.dialog;
    if (!d) return "";
    let body = "";
    if (d.kind === "gallery") {
      const ch = chainOf(d.chain);
      const tokens = ch.tokens.length > 1
        ? `<div class="field-label">Token</div><div class="token-row" style="margin:0 0 12px">${ch.tokens.map((t) => `<button class="token-pill ${t === d.token ? "selected" : ""}" data-act="gallery-token" data-t="${t}">${t}</button>`).join("")}</div>` : "";
      body = `
        <div class="dialog-title">Charge with ${ch.name} (${d.token})</div>
        <div class="dialog-body">
          ${tokens}
          <div class="field-label">Quick amounts (${S.baseline})</div>
          <div class="preset-row">${PRESETS.map((v) => `<button class="preset" data-act="gallery-preset" data-v="${v}">${usd(v)}</button>`).join("")}</div>
          <input class="field" id="gallery-amt" inputmode="decimal" placeholder="Custom amount ($)" value="${d.amount || ""}" style="margin-top:12px;width:100%" />
          <p class="helper" id="gallery-help">${d.amount ? "Each sale is tracked as its own invoice — amounts and references are never shared between sales." : "Leave the amount blank to show an address-only donation code — any amount, but untracked."}</p>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn text" data-act="dialog-close">Cancel</button>
          <button class="dialog-btn primary" data-act="gallery-go" id="gallery-go">${d.amount ? "GENERATE CODE" : "SHOW DONATION CODE"}</button>
        </div>`;
    } else if (d.kind === "addproduct") {
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
    } else if (d.kind === "cancel") {
      const active = ["mempool", "confirming"].includes(d.from);
      body = `
        <div class="dialog-title">${active ? "Stop tracking this payment?" : "Cancel this checkout?"}</div>
        <div class="dialog-body"><p style="font-size:.88rem;line-height:1.5;color:var(--on-surface-variant);margin:0">${active ? "The on-chain payment is irreversible. Stopping only stops the terminal from watching for it." : "The customer hasn't paid yet. This clears the checkout."}</p></div>
        <div class="dialog-actions">
          <button class="dialog-btn text" data-act="dialog-close">${active ? "Keep tracking" : "Keep waiting"}</button>
          <button class="dialog-btn danger" data-act="cancel-confirm">${active ? "Stop tracking" : "Cancel checkout"}</button>
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
    overlayRoot.innerHTML = drawerHtml() + dialogHtml();
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
      chainKey: ch.key,
      token: token,
      usd: usdv,
      crypto: cryptoAmt(token, usdv),
      address: SAMPLE_ADDR[ch.key],
      live: railLive(ch),
      required: CONFS[ch.key] || 2,
      confs: 0,
      txHash: (S.mode === "demo" ? "SIM-" : "0x") + hex(56),
      donation: !!opts.donation,
      memo: opts.memo || (S.cart.length ? S.cart.map((l) => prodOf(l.id).name).join(", ") : "Custom sale"),
    };
    S.tab = "tracker";
    clearTimers();
    render();
  }

  function toMempool() {
    if (!["awaiting"].includes(S.payment.state)) return;
    S.payment.state = "mempool";
    render();
  }
  function stepConfirm(delay, onDone) {
    S.payment.state = "confirming";
    S.payment.confs = 0;
    render();
    const tick = () => {
      if (S.payment.state !== "confirming") return;
      S.payment.confs++;
      render();
      if (S.payment.confs >= S.payment.required) { after(delay, onDone); }
      else after(delay, tick);
    };
    after(delay, tick);
  }
  function settle() {
    const p = S.payment;
    S.txCounter++;
    p.txId = S.txCounter;
    p.dateUtc = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC";
    p.state = "confirmed";
    const m = MODES[S.mode];
    S.ledger.push({
      id: p.txId,
      ts: new Date().toISOString().slice(0, 19).replace("T", " "),
      chainKey: p.chainKey,
      token: p.token,
      usd: p.usd,
      crypto: p.crypto,
      rate: RATES[p.token],
      status: "CONFIRMED",
      provenance: S.mode === "mainnet" ? "REAL" : "SIMULATED",
      network: m.net,
      txHash: p.txHash,
      memo: p.memo,
    });
    S.cart = [];
    S.draft = "";
    render();
  }
  function fail(reason) {
    const p = S.payment;
    S.ledger.push({
      id: ++S.txCounter, ts: new Date().toISOString().slice(0, 19).replace("T", " "),
      chainKey: p.chainKey, token: p.token, usd: p.usd, crypto: p.crypto, rate: RATES[p.token],
      status: "FAILED", provenance: S.mode === "mainnet" ? "REAL" : "SIMULATED", network: MODES[S.mode].net,
      txHash: p.txHash, memo: p.memo,
    });
    p.state = "failed";
    p.reason = reason;
    render();
  }
  function runSim(kind) {
    if (S.payment.state !== "awaiting") return;
    if (kind === "fast") {
      after(300, () => { toMempool(); after(500, () => stepConfirm(280, settle)); });
    } else if (kind === "slow") {
      after(700, () => { toMempool(); after(1300, () => stepConfirm(1300, settle)); });
    } else if (kind === "gas") {
      after(400, () => { toMempool(); after(900, () => fail("Smart contract execution reverted: insufficient sender gas limit.")); });
    } else if (kind === "double") {
      after(400, () => { toMempool(); after(900, () => fail("Simulated double-spend / collision detected — this DEMO checkout was rejected (no real payment).")); });
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
    switch (act) {
      case "tab": S.tab = el.dataset.t; if (S.tab !== "settings") S.settingsSection = null; if (S.tab === "coins") S.coinStep = "chains"; render(); break;
      case "drawer-open": S.drawer = true; render(); break;
      case "drawer-close": S.drawer = false; render(); break;
      case "drawer-nav": S.drawer = false; S.tab = el.dataset.t; S.settingsSection = null; if (S.tab === "coins") S.coinStep = "chains"; render(); break;
      case "drawer-theme": S.drawer = false; toggleTheme(); render(); break;
      case "drawer-onboarding": S.drawer = false; S.onboarding = { step: 0, mode: "testnet", picked: {} }; render(); break;
      case "drawer-golive": S.drawer = false; S.tab = "settings"; S.settingsSection = "golive"; render(); break;
      case "mode-cycle": S.mode = MODE_CYCLE[S.mode]; render(); break;

      case "subtab": S.subtab = el.dataset.v; render(); break;
      case "key": onKey(el.dataset.v); break;
      case "chain": { const ch = chainOf(el.dataset.k); S.chain = ch.key; if (!ch.tokens.includes(S.token)) S.token = ch.tokens[0]; render(); break; }
      case "token": S.token = el.dataset.t; render(); break;
      case "prod-add": { const id = +el.dataset.id; const l = S.cart.find((x) => x.id === id); if (l) l.qty++; else S.cart.push({ id, qty: 1 }); render(); break; }
      case "prod-sub": { const id = +el.dataset.id; const l = S.cart.find((x) => x.id === id); if (l) { l.qty--; if (l.qty <= 0) S.cart = S.cart.filter((x) => x.id !== id); } render(); break; }
      case "cart-clear": S.cart = []; render(); break;

      case "generate": {
        const due = dueUsd();
        if (due <= 0) return;
        startCheckout({ chain: S.chain, token: S.token, usd: due });
        break;
      }
      case "sim": runSim(el.dataset.v); break;
      case "checkout-cancel": S.dialog = { kind: "cancel", from: S.payment.state }; render(); break;
      case "cancel-confirm": S.dialog = null; endCheckout(); S.tab = "coins"; S.coinStep = "chains"; render(); break;
      case "checkout-done": endCheckout(); S.tab = "coins"; S.coinStep = "chains"; render(); break;
      case "receipt-print": showToast("Receipt sent to printer (demo)"); break;
      case "copy-addr": copy(S.payment.address, "Wallet address copied!"); break;
      case "copy-hash": copy(el.dataset.h, "Transaction hash copied!"); break;

      case "pick-chain": { const ch = chainOf(el.dataset.k); S.chain = ch.key; if (!ch.tokens.includes(S.token)) S.token = ch.tokens[0]; S.coinStep = "asset"; render(); break; }
      case "pick-asset": S.token = el.dataset.t; S.coinStep = "build"; render(); break;
      case "coin-back-chains": S.coinStep = "chains"; render(); break;
      case "coin-back-asset": S.coinStep = "asset"; render(); break;
      case "donation": { const ch = chainOf(S.chain); startCheckout({ chain: ch.key, token: S.token, usd: 0, donation: true, memo: "Donation" }); break; }

      case "csv": exportCsv(); break;
      case "ledger-clear": S.ledger = []; showToast("Ledger cleared"); render(); break;
      case "history-unlock": S.dialog = { kind: "unlock" }; render(); break;

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
      case "burn-confirm": { if (fieldVal("burn-confirm") === "RESET") { resetAll(); showToast("Store reset to fresh install"); } break; }
      case "enable-mainnet": break; // disabled (blockers present)

      case "mainnet-confirm": { if (fieldVal("mainnet-confirm") === "MAINNET") { S.mode = "mainnet"; S.dialog = null; S.settingsSection = null; showToast("Mainnet enabled"); render(); } break; }

      case "dialog-close": S.dialog = null; render(); break;

      case "onb-mode": S.onboarding.mode = el.dataset.m; render(); break;
      case "onb-next": S.onboarding.step++; render(); break;
      case "onb-back": S.onboarding.step--; render(); break;
      case "onb-pick": { const k = el.dataset.k; S.onboarding.picked[k] = !S.onboarding.picked[k]; render(); break; }
      case "onb-finish": { S.mode = "testnet"; S.onboarding = null; S.tab = "coins"; S.coinStep = "chains"; showToast("Setup complete"); render(); break; }
      case "noop": break;
    }
  }

  function copy(text, msg) {
    try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) {}
    showToast(msg);
  }

  function exportCsv() {
    const cols = ["id", "ts", "network", "provenance", "status", "chainKey", "token", "usd", "crypto", "rate", "txHash", "memo"];
    const lines = [cols.join(",")].concat(S.ledger.map((r) => cols.map((c) => `"${String(r[c]).replace(/"/g, '""')}"`).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cryptopos-ledger.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast("Ledger exported to CSV");
  }

  function resetAll() {
    clearTimers();
    Object.assign(S, {
      tab: "coins", coinStep: "chains", mode: "testnet", chain: "Ethereum", token: "USDC", subtab: "keypad",
      draft: "", cart: [], payment: { state: "idle" }, ledger: [], txCounter: 0, drawer: false,
      dialog: null, settingsSection: null, railOpen: null, onboarding: null,
      merchant: "CryptoPOS Terminal", baseline: "USD", taxPct: 0, tips: false, staff: [],
      catalogFirst: false, pin: null, historyLocked: false,
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
    // live update for gallery amount + typed confirmations (no full re-render → keep focus)
    document.addEventListener("input", (e) => {
      const t2 = e.target;
      if (t2.id === "gallery-amt") {
        const has = t2.value.trim() && parseFloat(t2.value) > 0;
        const go = document.getElementById("gallery-go");
        const help = document.getElementById("gallery-help");
        if (S.dialog) S.dialog.amount = t2.value;
        if (go) go.textContent = has ? "GENERATE CODE" : "SHOW DONATION CODE";
        if (help) help.textContent = has ? "Each sale is tracked as its own invoice — amounts and references are never shared between sales." : "Leave the amount blank to show an address-only donation code — any amount, but untracked.";
      } else if (t2.id === "mainnet-confirm") {
        const go = document.getElementById("mainnet-go");
        if (go) go.disabled = t2.value !== "MAINNET";
      }
    });
    // stage controls
    document.getElementById("theme-btn").addEventListener("click", () => { toggleTheme(); render(); });
    document.getElementById("reset-btn").addEventListener("click", resetAll);

    render();
    window.__POSH__ = S;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
