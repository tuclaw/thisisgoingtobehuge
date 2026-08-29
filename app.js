/* Last Trader Standing — torchlight UI. Reads the derived season board; never invents marks. */

function assetBase() {
  const raw = document.documentElement.getAttribute("data-base");
  return raw == null ? "" : raw;
}

function assetUrl(path) {
  if (!path) return "";
  if (/^https?:/i.test(String(path))) return path;
  return assetBase() + path;
}

function seasonJsonUrls() {
  const base = assetBase();
  const urls = [];
  if (base) urls.push(base + "season1.json");
  urls.push("/season1.json");
  urls.push("season1.json");
  return [...new Set(urls)];
}

const LEGACY_SLUGS = {
  gage: "grok-4-6",
  mara: "claude-sonnet-5",
  hex: "composer-2-5",
  vesper: "claude-opus-5",
  nori: "gemini-3-7-flash",
  pax: "gpt-5-6-terra",
  riot: "grok-4-5",
  quill: "gpt-5-6-sol",
  sable: "claude-fable-5",
  kite: "gemini-3-1-pro",
  juno: "gpt-5-6-luna",
  reed: "kimi-k3"
};

function survivorSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugOf(s) {
  if (s && s.slug) return s.slug;
  return survivorSlug(s && (s.model || s.name));
}

function survivorHref(sOrName) {
  const slug = typeof sOrName === "object" && sOrName ? slugOf(sOrName) : survivorSlug(sOrName);
  return assetBase() + "survivors/" + slug + ".html";
}

function liveEpisodePath(season) {
  const live = getLiveEpisode(season);
  if (live && live.path) return live.path;
  if (season && season.episode && season.episode.path) return season.episode.path;
  const listed = (season && Array.isArray(season.episodes) ? season.episodes : []).find((ep) => ep.path);
  return listed ? listed.path : "";
}

function weekPctOf(obj) {
  if (obj && typeof obj.weekPct === "number" && !Number.isNaN(obj.weekPct)) return obj.weekPct;
  return 0;
}

function dayPctOf(obj) {
  if (obj && typeof obj.dayPct === "number" && !Number.isNaN(obj.dayPct)) return obj.dayPct;
  return 0;
}

function combinedWeekPctOf(tribe) {
  if (tribe && typeof tribe.combinedWeekPct === "number" && !Number.isNaN(tribe.combinedWeekPct)) {
    return tribe.combinedWeekPct;
  }
  return 0;
}

function combinedDayPctOf(tribe) {
  if (tribe && typeof tribe.combinedDayPct === "number" && !Number.isNaN(tribe.combinedDayPct)) {
    return tribe.combinedDayPct;
  }
  return 0;
}

function tribeById(season, id) {
  return (season.tribes || []).find((t) => t.id === id);
}

function money(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return "$" + n.toFixed(2);
}

function potMoney(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  if (Math.abs(n - Math.round(n)) < 1e-9) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

function islandPotUsd(season) {
  const survivors = season.survivors || [];
  const living = survivors.filter((s) => s && (s.status === "active" || s.status === "immune"));
  if (living.length) {
    const sum = living.reduce((acc, s) => {
      return typeof s.bookUsd === "number" && !Number.isNaN(s.bookUsd) ? acc + s.bookUsd : acc;
    }, 0);
    if (sum > 0) return sum;
  }
  if (typeof season.islandPotUsd === "number" && !Number.isNaN(season.islandPotUsd)) {
    return season.islandPotUsd;
  }
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const n = living.length || survivors.length || 12;
  return start * n;
}

function livingContestantCount(season) {
  const list = season.survivors || [];
  const living = list.filter((s) => s && (s.status === "active" || s.status === "immune"));
  if (living.length) return living.length;
  return list.length || 12;
}

function renderIslandPot(season) {
  const amount = document.getElementById("pot-amount");
  const count = document.getElementById("pot-contestants");
  if (!amount && !count) return;
  if (count) count.textContent = String(livingContestantCount(season));
  if (amount) amount.textContent = potMoney(islandPotUsd(season));
}

function pct(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function modelOf(s) {
  const model = s && s.model ? String(s.model).trim() : "";
  if (model) return model;
  return s && s.name ? String(s.name).trim() : "";
}

function nickOf() {
  return "";
}

function tribeLine(s, tribe) {
  const tribeName = tribe ? tribe.name : s && s.tribeId ? s.tribeId : "";
  return tribeName ? String(tribeName) : "";
}

function modelBadge(s, tiny) {
  const model = modelOf(s);
  if (!model) return "";
  const tribeClass = s.tribeId === "askara" ? " askara" : s.tribeId === "bidu" ? " bidu" : "";
  const sizeClass = tiny ? " tiny" : "";
  return `<span class="model-badge${tribeClass}${sizeClass}">${escapeHtml(model)}</span>`;
}

function nickBadge(s, tiny) {
  const nick = nickOf(s);
  if (!nick) return "";
  const sizeClass = tiny ? " tiny" : "";
  return `<span class="cast-nick${sizeClass}">${escapeHtml(nick)}</span>`;
}

function survivorLabel(s, opts) {
  const options = opts || {};
  const model = escapeHtml(modelOf(s));
  const nick = nickOf(s);
  const nickHtml = nick ? nickBadge(s, options.tiny) : "";
  if (options.link) {
    return `<a href="${escapeHtml(survivorHref(s))}">${model}</a>${nickHtml ? " " + nickHtml : ""}`;
  }
  return `${model}${nickHtml ? " " + nickHtml : ""}`;
}

function positionChip(pos) {
  if (!pos || typeof pos !== "object") return "";
  if (pos.status === "rec-pending-open") {
    return `<span class="pos-chip pos-pending" title="Named torch, unlit — host has not filled">intended · pending open</span>`;
  }
  if (pos.status === "filled") {
    const bits = [];
    if (pos.qty) bits.push(escapeHtml(String(pos.qty)));
    if (pos.avg) bits.push("@ " + escapeHtml(String(pos.avg)));
    const detail = bits.join(" ");
    return `<span class="pos-chip pos-filled">${detail ? "filled · " + detail : "filled"}</span>`;
  }
  if (pos.status === "cash") {
    return `<span class="pos-chip pos-cash">cash</span>`;
  }
  if (pos.status === "cash-short-blocked") {
    return `<span class="pos-chip pos-blocked">shorts blocked</span>`;
  }
  return "";
}

function formatPosition(pos, tribeId) {
  if (pos == null || pos === "") {
    return `<span class="pos-empty">none — torches unlit</span>`;
  }
  if (typeof pos !== "object") {
    return `<span class="pos-empty">${escapeHtml(String(pos))}</span>`;
  }
  const action = String(pos.action || "").toUpperCase();
  const ticker = String(pos.ticker || "").toUpperCase();
  const size = typeof pos.sizeUsd === "number" && !Number.isNaN(pos.sizeUsd) ? pos.sizeUsd : null;
  const tribeClass = tribeId === "askara" ? " askara" : tribeId === "bidu" ? " bidu" : "";
  const chip = positionChip(pos);
  const isCash = ticker === "CASH" || pos.status === "cash" || pos.status === "cash-short-blocked";
  let line;
  if (isCash) {
    line = size != null && size !== 10 ? "CASH · HOLD · $" + size : "CASH · HOLD";
  } else if (action && ticker) {
    line = `${escapeHtml(action)} ${escapeHtml(ticker)}`;
    if (size != null) line += ` · $${size}`;
  } else {
    return `<span class="pos-empty">none — torches unlit</span>`;
  }
  const extra = pos.note || pos.intended || "";
  const extraHtml = extra
    ? `<span class="pos-intended-note">${escapeHtml(extra)}</span>`
    : "";
  return `<span class="pos-intended${tribeClass}"><span class="pos-line">${line}</span>${chip}${extraHtml}</span>`;
}

function bookLegs(s) {
  if (s && Array.isArray(s.positions) && s.positions.length) return s.positions;
  return [];
}

function formatBook(s) {
  const legs = bookLegs(s);
  const tribeId = s && s.tribeId;
  if (!legs.length) return formatPosition(null, tribeId);
  if (legs.length === 1) return formatPosition(legs[0], tribeId);
  return `<span class="pos-book">${legs.map((p) => formatPosition(p, tribeId)).join("")}</span>`;
}

const TICKER_NAMES = {
  TSLA: "Tesla",
  SMCI: "Super Micro Computer",
  SOXL: "Direxion Daily Semiconductor Bull 3X",
  QID: "ProShares UltraShort QQQ",
  BTAL: "AGF U.S. Market Neutral Anti-Beta",
  WM: "Waste Management",
  HOOD: "HOOD",
  COIN: "Coinbase",
  SOFI: "SoFi Technologies",
  COWZ: "Pacer US Cash Cows 100",
  GLD: "SPDR Gold Shares",
  SPY: "SPDR S&P 500",
  NVDA: "NVIDIA",
  MSFT: "Microsoft",
  COST: "Costco Wholesale",
  CASH: "Cash"
};

function tickerOf(pos) {
  return String((pos && pos.ticker) || "").toUpperCase().split("/")[0].trim();
}

function isCashLeg(pos) {
  if (!pos) return false;
  const ticker = tickerOf(pos);
  return ticker === "CASH" || pos.status === "cash" || pos.status === "cash-short-blocked";
}

function tickerName(ticker) {
  const key = String(ticker || "").toUpperCase();
  if (TICKER_NAMES[key]) return TICKER_NAMES[key];
  return key || "Position";
}

function qtyOf(pos) {
  const q = parseFloat(pos && pos.qty);
  return Number.isFinite(q) ? q : null;
}

function avgOf(pos) {
  const a = parseFloat(pos && pos.avg);
  return Number.isFinite(a) ? a : null;
}

function quoteFor(season, ticker) {
  const quotes = season && season.quotes;
  if (!quotes || !ticker) return null;
  return quotes[ticker] || null;
}

function lastOf(pos, season) {
  if (pos && typeof pos.last === "number" && !Number.isNaN(pos.last)) return pos.last;
  const q = quoteFor(season, tickerOf(pos));
  if (q && typeof q.last === "number" && !Number.isNaN(q.last)) return q.last;
  return null;
}

function priorCloseOf(pos, season) {
  if (pos && typeof pos.priorClose === "number" && !Number.isNaN(pos.priorClose)) return pos.priorClose;
  const q = quoteFor(season, tickerOf(pos));
  if (q && typeof q.priorClose === "number" && !Number.isNaN(q.priorClose)) return q.priorClose;
  return null;
}

function markedEquity(pos, season) {
  if (isCashLeg(pos) && typeof pos.sizeUsd === "number") return pos.sizeUsd;
  const qty = qtyOf(pos);
  const last = lastOf(pos, season);
  if (qty != null && last != null) return qty * last;
  return null;
}

function tickerDayPct(pos, season) {
  if (season && season.dayPctPriorOfficial === false) return null;
  const last = lastOf(pos, season);
  const prior = priorCloseOf(pos, season);
  if (last == null || prior == null || prior === 0) return null;
  return ((last - prior) / prior) * 100;
}

function chgClass(n) {
  if (typeof n !== "number" || Number.isNaN(n) || n === 0) return "flat";
  return n > 0 ? "up" : "down";
}

function formatMarkedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(d);
  } catch {
    return String(iso);
  }
}

function holdChips(legs) {
  const tickers = [];
  const seen = new Set();
  (legs || []).forEach((p) => {
    const ticker = isCashLeg(p) ? "CASH" : tickerOf(p);
    if (!ticker || seen.has(ticker)) return;
    seen.add(ticker);
    tickers.push(ticker);
  });
  if (!tickers.length) return "";
  return `<div class="hold-chips">${tickers
    .map((t) => `<span class="hold-chip${t === "CASH" ? " cash" : ""}">${escapeHtml(t)}</span>`)
    .join("")}</div>`;
}

function holdLegHtml(pos, season, tribeId) {
  const cash = isCashLeg(pos);
  const ticker = cash ? "CASH" : tickerOf(pos) || "—";
  const name = cash
    ? pos && pos.status === "cash-short-blocked"
      ? "Cash · shorts blocked"
      : "Cash"
    : tickerName(ticker);
  const qty = qtyOf(pos);
  const avg = avgOf(pos);
  const equity = markedEquity(pos, season);
  const day = cash ? 0 : tickerDayPct(pos, season);
  const marked = equity != null && (cash || day != null || lastOf(pos, season) != null);
  const value = marked ? money(equity) : typeof pos.sizeUsd === "number" ? money(pos.sizeUsd) : "—";
  const valueNote = marked ? "" : typeof pos.sizeUsd === "number" ? "cost" : "";
  let sub = name;
  if (!cash && qty != null && avg != null) {
    sub = `${name} · ${qty} @ ${avg}`;
  } else if (cash && typeof pos.sizeUsd === "number") {
    sub = name;
  }
  const extra = pos && pos.intended ? `<span class="hold-note">${escapeHtml(pos.intended)}</span>` : "";
  let chg;
  if (cash) {
    chg = `<b class="flat">0.00%</b>`;
  } else if (day != null) {
    chg = `<b class="${chgClass(day)}">${pct(day)}</b>`;
  } else {
    chg = `<b class="flat">unmarked</b>`;
  }
  const badge = ticker.length > 4 ? ticker.slice(0, 4) : ticker;
  return `<div class="hold-leg">
    <span class="hold-sym ${tribeId || ""} ${cash ? "cash" : ""}" aria-hidden="true">${escapeHtml(badge)}</span>
    <div class="hold-leg-id">
      <strong>${escapeHtml(ticker)}</strong>
      <em>${escapeHtml(sub)}</em>
      ${extra}
    </div>
    <div class="hold-mark">
      <span class="val">${value}${valueNote ? `<i>${valueNote}</i>` : ""}</span>
      ${chg}
    </div>
  </div>`;
}

function holdBookHtml(s, tribe, season, rank) {
  const legs = bookLegs(s);
  const week = weekPctOf(s);
  const day = dayPctOf(s);
  const model = escapeHtml(modelOf(s));
  const tribeName = tribe ? tribe.name : s.tribeId;
  const face = s.portrait
    ? `<img src="${escapeHtml(assetUrl(s.portrait))}" alt="">`
    : "";
  const pad = rank < 10 ? "0" + rank : String(rank);
  const immune = s.immune ? `<span class="hold-tag">Immune</span>` : "";
  const legsId = `hold-legs-${escapeHtml(slugOf(s))}`;
  const hasLegs = legs.length > 0;
  return `<article class="hold-book ${s.tribeId}${hasLegs ? "" : " is-empty"}">
    <button type="button" class="hold-head" aria-expanded="false"${hasLegs ? ` aria-controls="${legsId}"` : ""} ${hasLegs ? "" : "disabled "}>
      <span class="hold-rank">${pad}</span>
      <span class="hold-face">${face}</span>
      <span class="hold-id">
        <strong>${model}</strong>
        <em>${escapeHtml(tribeName || "")}</em>
      </span>
      <span class="hold-mark">
        <span class="val">${money(s.bookUsd)}</span>
        <b class="${chgClass(week)}">${pct(week)} week</b>
        <b class="day ${chgClass(day)}">${pct(day)} today</b>
      </span>
      ${immune}
    </button>
    ${holdChips(legs)}
    <div class="hold-legs" id="${legsId}" hidden>${legs.map((p) => holdLegHtml(p, season, s.tribeId)).join("")}</div>
  </article>`;
}

function setHoldBookSelected(book, open) {
  if (!book) return;
  const btn = book.querySelector(".hold-head");
  const legs = book.querySelector(".hold-legs");
  const canOpen = !book.classList.contains("is-empty") && legs && legs.children.length > 0;
  const next = !!(open && canOpen);
  book.classList.toggle("is-selected", next);
  if (btn) btn.setAttribute("aria-expanded", next ? "true" : "false");
  if (legs) legs.hidden = !next;
}

function bindHoldingsSelection(root) {
  if (!root || root.dataset.holdSelectBound === "1") return;
  root.dataset.holdSelectBound = "1";
  root.addEventListener("click", (event) => {
    const book = event.target.closest(".hold-book");
    if (!book || !root.contains(book) || book.classList.contains("is-empty")) return;
    if (!event.target.closest(".hold-head, .hold-chips")) return;
    if (event.target.closest("a")) return;
    const next = !book.classList.contains("is-selected");
    root.querySelectorAll(".hold-book.is-selected").forEach((other) => {
      if (other !== book) setHoldBookSelected(other, false);
    });
    setHoldBookSelected(book, next);
  });
}

function renderEpisodeHoldings(season) {
  const root = document.getElementById("episode-holdings");
  if (!root) return;
  const ranked = [...(season.survivors || [])].sort((a, b) => {
    const w = weekPctOf(b) - weekPctOf(a);
    if (w !== 0) return w;
    return modelOf(a).localeCompare(modelOf(b));
  });
  root.innerHTML = ranked
    .map((s, i) => holdBookHtml(s, tribeById(season, s.tribeId), season, i + 1))
    .join("");
  bindHoldingsSelection(root);
  const kicker = document.getElementById("holdings-kicker");
  if (kicker) {
    const label = season.markLabel ? String(season.markLabel).trim() : "";
    const when = formatMarkedAt(season.markedAt);
    if (label) {
      const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
      const priorNote = season.dayPctPriorOfficial
        ? "dayPct versus the prior official mark."
        : "dayPct versus the prior session; that prior may not be SIP official settled.";
      kicker.textContent = `Ranked by week %. ${label}. weekPct from the $${start} week open. ${priorNote}`;
    } else if (when) {
      kicker.textContent = `Ranked by week %. Tickers as of ${when}.`;
    } else {
      kicker.textContent = "Ranked by week %. Tickers as they stood at the last recorded update.";
    }
  }
}

function openFoldForTarget(target) {
  if (!target) return;
  const fold = target.classList && target.classList.contains("day-fold")
    ? target
    : target.closest
      ? target.closest(".day-fold")
      : null;
  if (fold) fold.open = true;
}

function episodeFocusId() {
  if (document.getElementById("tribal-focus")) return "tribal-focus";
  return "week-board";
}

function syncDayRail() {
  const fallback = `#${episodeFocusId()}`;
  const hash = (window.location.hash || fallback).replace(/^#/, "") || episodeFocusId();
  const target = document.getElementById(hash);
  document.querySelectorAll(".day-rail a").forEach((a) => {
    const id = (a.getAttribute("href") || "").replace(/^#/, "");
    const section = id ? document.getElementById(id) : null;
    const on =
      id === hash ||
      (section && target && (section === target || section.contains(target) || target.contains(section)));
    if (on) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  });
}

function openFoldForHash() {
  const hash = (window.location.hash || "").replace(/^#/, "");
  if (hash) {
    const el = document.getElementById(hash);
    if (el) openFoldForTarget(el);
  }
  syncDayRail();
}

function initDayFolds() {
  if (!document.querySelector(".day-fold")) return;
  openFoldForHash();
  if (initDayFolds.bound) return;
  initDayFolds.bound = true;
  window.addEventListener("hashchange", openFoldForHash);
  document.querySelectorAll(".day-rail a").forEach((a) => {
    a.addEventListener("click", () => {
      const href = a.getAttribute("href") || "";
      const id = href.charAt(0) === "#" ? href.slice(1) : "";
      const el = id ? document.getElementById(id) : null;
      if (el) openFoldForTarget(el);
    });
  });
}

function totemSvg(survivor, tribe) {
  const ink = tribe && tribe.id === "askara" ? "#C45A12" : "#0E6B6B";
  const gold = "#d4a017";
  const bone = "#f3ead6";
  const seed = survivor.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const marks = [
    `<circle cx="50" cy="38" r="22" fill="none" stroke="${ink}" stroke-width="3"/>`,
    `<polygon points="50,14 72,58 28,58" fill="none" stroke="${ink}" stroke-width="3"/>`,
    `<rect x="28" y="20" width="44" height="44" fill="none" stroke="${ink}" stroke-width="3" transform="rotate(12 50 42)"/>`,
    `<path d="M26 50 Q50 12 74 50 Q50 70 26 50Z" fill="none" stroke="${ink}" stroke-width="3"/>`
  ];
  const mark = marks[seed % marks.length];
  const letter = survivor.monogram || survivor.name.slice(0, 1);
  return `<svg class="portrait" viewBox="0 0 100 100" role="img" aria-label="${survivor.name} totem">
    <rect width="100" height="100" fill="#120c08"/>
    <circle cx="50" cy="50" r="46" fill="#1a1410" stroke="${gold}" stroke-width="1.5"/>
    ${mark}
    <text x="50" y="58" text-anchor="middle" fill="${bone}" font-family="Cinzel, Times New Roman, serif" font-size="22" letter-spacing="1">${letter}</text>
  </svg>`;
}

const TORCH_LIT = `<svg class="torch torch-lit" viewBox="0 0 32 100" aria-hidden="true">
  <defs>
    <linearGradient id="lt-body" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ff9a1f"/>
      <stop offset="0.5" stop-color="#e85d04"/>
      <stop offset="1" stop-color="#c45a12"/>
    </linearGradient>
    <linearGradient id="lt-midg" x1="16" y1="10" x2="16" y2="28" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffd36a"/>
      <stop offset="1" stop-color="#e85d04"/>
    </linearGradient>
    <linearGradient id="lt-wood" x1="12" y1="40" x2="22" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3a2618"/>
      <stop offset="0.35" stop-color="#6b4530"/>
      <stop offset="0.55" stop-color="#8a5a38"/>
      <stop offset="1" stop-color="#3d2a1c"/>
    </linearGradient>
    <linearGradient id="lt-wrap" x1="10" y1="36" x2="22" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5a3a22"/>
      <stop offset="0.5" stop-color="#c45a12"/>
      <stop offset="1" stop-color="#3a2416"/>
    </linearGradient>
  </defs>
  <!-- shaft -->
  <path fill="url(#lt-wood)" d="M13.2 42c.2-1.4 1.4-2 2.8-2s2.6.6 2.8 2l1.4 46.5c.1 1.6-1.1 3-2.8 3.2h-2.8c-1.7-.2-2.9-1.6-2.8-3.2z"/>
  <path fill="#8a5a38" opacity=".45" d="M15.1 41.2h1.3l1.1 47.2h-1.1z"/>
  <!-- foot -->
  <path fill="#2a1a12" d="M11.4 90.2h9.2l1.2 5.4H10.2z"/>
  <rect x="10.6" y="89.4" width="10.8" height="1.6" rx=".4" fill="#4a3222"/>
  <!-- bowl + wrap -->
  <path fill="#2a1c12" d="M10 38.5c0-1.6 2.6-3.2 6-3.2s6 1.6 6 3.2v3.4c0 1.4-2.6 2.6-6 2.6s-6-1.2-6-2.6z"/>
  <path fill="url(#lt-wrap)" d="M9.6 37.6c0-1.2 2.8-2.2 6.4-2.2s6.4 1 6.4 2.2v2.2c0 1-2.8 1.8-6.4 1.8s-6.4-.8-6.4-1.8z"/>
  <path fill="none" stroke="#1a120c" stroke-width=".7" d="M10.4 38.4h11.2M11.2 40.2h9.6"/>
  <!-- flame -->
  <g class="fm-sway" transform="translate(0,4)">
    <path class="fm-outer" fill="url(#lt-body)" d="M16.1 2.2c2.1 4.8-2.6 6.6-1 11.4 3.8-2.8 7.6.8 7.6 6.6 0 5.6-3.8 7.8-6.7 7.8s-6.7-2.2-6.7-7.8c0-4.6 2.8-7.4 5.5-10-1.8 2.8 0 5.6 1.8 5.6 0-4.6.8-9.4.5-13.6z"/>
    <path class="fm-lick" fill="#e85d04" d="M12.4 10.4c-1.3 3-3 4.6-2.3 7.2 1.2-2.6 3.1-3.2 3.7-5.4-.6 1.1-.8 2.2 0 2.4-.2-1.7-.5-3.1-1.4-4.2z"/>
    <path class="fm-mid" fill="url(#lt-midg)" d="M16 9.6c1.2 2.2-.4 3.4.2 5.6 1.6-1 3.3.3 3.3 2.8 0 2.4-1.6 3.4-3.5 3.4S12.4 20.4 12.4 18c0-2 1.2-3.2 2.4-4.4-.6 1.2.2 2.4 1 2.4 0-2 .2-4.2.2-6.4z"/>
    <path class="fm-inner" fill="#fff1b8" d="M16 15.2c.65 1.15-.2 1.8.1 2.95.85-.55 1.7.15 1.7 1.45 0 1.2-.8 1.75-1.8 1.75s-1.8-.55-1.8-1.75c0-1 .6-1.65 1.2-2.25-.3.6.1 1.2.5 1.2 0-1 .1-2.15.1-3.35z"/>
    <ellipse class="fm-hot" cx="16" cy="22.4" rx="2" ry="2.4" fill="#fff6d6" opacity=".9"/>
  </g>
</svg>`;

const TORCH_SNUFFED = `<svg class="torch torch-snuffed" viewBox="0 0 32 100" aria-hidden="true">
  <defs>
    <linearGradient id="st-wood" x1="12" y1="40" x2="22" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2a1c14"/>
      <stop offset="0.4" stop-color="#4a3426"/>
      <stop offset="0.6" stop-color="#5a4030"/>
      <stop offset="1" stop-color="#2a1c14"/>
    </linearGradient>
    <linearGradient id="st-char" x1="16" y1="32" x2="16" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1a120c"/>
      <stop offset="0.6" stop-color="#3d2e24"/>
      <stop offset="1" stop-color="#2a1c14"/>
    </linearGradient>
  </defs>
  <!-- shaft, colder wood -->
  <path fill="url(#st-wood)" d="M13.2 42c.2-1.4 1.4-2 2.8-2s2.6.6 2.8 2l1.4 46.5c.1 1.6-1.1 3-2.8 3.2h-2.8c-1.7-.2-2.9-1.6-2.8-3.2z"/>
  <path fill="#3d2e24" opacity=".5" d="M15.1 41.2h1.3l1.1 47.2h-1.1z"/>
  <path fill="#1e140e" d="M11.4 90.2h9.2l1.2 5.4H10.2z"/>
  <rect x="10.6" y="89.4" width="10.8" height="1.6" rx=".4" fill="#2a1c14"/>
  <!-- charred bowl -->
  <path fill="url(#st-char)" d="M10 38.5c0-1.6 2.6-3.2 6-3.2s6 1.6 6 3.2v3.4c0 1.4-2.6 2.6-6 2.6s-6-1.2-6-2.6z"/>
  <path fill="#1a120c" d="M9.8 37.4c0-1 2.8-1.8 6.2-1.8s6.2.8 6.2 1.8v1.8c0 .8-2.8 1.5-6.2 1.5s-6.2-.7-6.2-1.5z"/>
  <!-- dead wick / ash -->
  <ellipse cx="16" cy="36.4" rx="2.1" ry="1.2" fill="#2a2118"/>
  <path fill="#3d2e24" d="M15.3 33.2h1.4v3.2h-1.4z"/>
  <ellipse cx="16" cy="33" rx="1.1" ry=".7" fill="#1a120c"/>
  <!-- last warmth in the charcoal -->
  <ellipse cx="16.4" cy="37.2" rx="1.2" ry=".55" fill="#c45a12" opacity=".5"/>
  <!-- smoke -->
  <g fill="#6b5c4a">
    <ellipse class="st-wisp st-wisp-a" cx="15.2" cy="26" rx="2.8" ry="6.2" opacity=".55"/>
    <ellipse class="st-wisp st-wisp-b" cx="18.4" cy="22.5" rx="2.2" ry="5.2" opacity=".45"/>
    <ellipse class="st-wisp st-wisp-c" cx="13.6" cy="23.8" rx="2.0" ry="4.6" opacity=".4"/>
  </g>
  <path class="st-coil" fill="none" stroke="#8a7355" stroke-width="1.15" stroke-linecap="round" opacity=".35"
        d="M16 32c-1.6-3 1.8-5-0.4-8 1.8-2.4-1.2-4.2.6-6.8"/>
</svg>`;

function torchSvg(lit) {
  return lit ? TORCH_LIT : TORCH_SNUFFED;
}


function renderFaces(season) {
  const grid = document.getElementById("face-grid");
  if (!grid) return;
  const tribes = season.tribes || [];
  grid.innerHTML = tribes
    .map((tribe) => {
      const members = (season.survivors || []).filter((s) => s.tribeId === tribe.id);
      const cards = members
        .map((s) => {
          const model = modelOf(s);
          const face = s.portrait
            ? `<img src="${escapeHtml(assetUrl(s.portrait))}" alt="${escapeHtml(model)}">`
            : totemSvg(s, tribe);
          return `<a class="face-card ${s.tribeId}" href="${escapeHtml(survivorHref(s))}">
        ${face}
        <h3>${escapeHtml(model)}</h3>
        <p class="face-tribe">${escapeHtml(tribe.name)}</p>
      </a>`;
        })
        .join("");
      const buff = tribe.buff ? ` · ${escapeHtml(tribe.buff)}` : "";
      return `<div class="face-tribe-block ${tribe.id} reveal">
      <p class="face-tribe-kicker">${escapeHtml(tribe.name)}${buff}</p>
      <div class="face-row">${cards}</div>
    </div>`;
    })
    .join("");
}

function renderMoneyJourney(season) {
  const race = document.getElementById("money-race");
  const totals = document.getElementById("home-tribe-totals");
  const banner = document.getElementById("money-banner");
  if (banner && season.statusLabel) {
    banner.textContent = season.statusLabel;
  }
  if (totals) {
    totals.innerHTML = (season.tribes || [])
      .map((t) => {
        return `<div class="total-card ${t.id}">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="pct">${pct(combinedWeekPctOf(t))}</p>
        <p>${t.livingCount} standing · combined week %</p>
      </div>`;
      })
      .join("");
  }
  if (!race) return;
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const ranked = [...(season.survivors || [])].sort((a, b) => {
    const bw = weekPctOf(b) - weekPctOf(a);
    if (bw !== 0) return bw;
    return (b.bookUsd || 0) - (a.bookUsd || 0);
  });
  const maxBook = Math.max(start, ...ranked.map((s) => (typeof s.bookUsd === "number" ? s.bookUsd : start)));
  race.innerHTML = ranked
    .map((s, i) => {
      const tribe = tribeById(season, s.tribeId);
      const book = typeof s.bookUsd === "number" ? s.bookUsd : start;
      const width = Math.max(8, Math.min(100, (book / maxBook) * 100));
      const week = weekPctOf(s);
      const weekClass = week > 0 ? "up" : week < 0 ? "down" : "flat";
      const face = s.portrait
        ? `<img src="${escapeHtml(assetUrl(s.portrait))}" alt="">`
        : `<span class="money-mono">${escapeHtml(s.monogram || nickOf(s).slice(0, 1) || "?")}</span>`;
      const startPct = Math.max(2, Math.min(98, (start / maxBook) * 100));
      return `<a class="money-row ${s.tribeId}" href="${escapeHtml(survivorHref(s))}" style="--i:${i}">
        <span class="money-rank">${i + 1}</span>
        <span class="money-face">${face}</span>
        <span class="money-id">
          <strong>${escapeHtml(modelOf(s))}</strong>
          <em>${escapeHtml(tribeLine(s, tribe))}</em>
        </span>
        <span class="money-track">
          <span class="money-fill" data-width="${width.toFixed(2)}"></span>
          <span class="money-start" style="left:${startPct.toFixed(2)}%" title="Started at ${money(start)}"></span>
        </span>
        <span class="money-nums">
          <span class="money-book">${money(book)}</span>
          <span class="money-week ${weekClass}">${pct(week)}</span>
        </span>
      </a>`;
    })
    .join("");
  requestAnimationFrame(() => {
    race.querySelectorAll(".money-fill").forEach((el) => {
      el.style.width = el.getAttribute("data-width") + "%";
    });
  });
}

function renderHomeEpisodes(season) {
  const root = document.getElementById("home-episodes");
  if (!root) return;
  const byNum = new Map();
  (Array.isArray(season.episodes) ? season.episodes : []).forEach((ep) => {
    byNum.set(ep.number, ep);
  });
  const episodes = [...byNum.values()].sort((a, b) => (a.number || 0) - (b.number || 0));
  root.innerHTML = episodes
    .map((ep) => {
      const locked = ep.status === "locked" || !ep.path;
      const title = escapeHtml(ep.title || "Episode " + ep.number);
      const label = escapeHtml(ep.weekLabel || "");
      const tease = escapeHtml(ep.tease || "Torches unlit · After Friday tribal");
      if (locked) {
        return `<div class="journey-ep locked reveal" aria-disabled="true">
          <p class="ep-kicker">Coming</p>
          <h3>${title}</h3>
          <p>${label}</p>
          <p class="ep-locked-note">${tease}</p>
        </div>`;
      }
      const href = assetBase() + ep.path;
      const live = ep.status === "live";
      return `<a class="journey-ep${live ? " live" : ""} reveal" href="${escapeHtml(href)}">
        <p class="ep-kicker">${live ? "Now burning" : escapeHtml(ep.status || "Cut")}</p>
        <h3 class="ep-title-row"><span>${title}</span>${live ? liveIndicatorHtml() : ""}</h3>
        <p>${label}</p>
        <p class="ep-go">${live ? "Watch the week unfold →" : "Open episode →"}</p>
      </a>`;
    })
    .join("");
}

function initReveals() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  const hero = document.querySelectorAll(".open-hero .reveal");
  hero.forEach((n) => n.classList.add("is-in"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  nodes.forEach((n) => {
    if (n.closest(".open-hero")) return;
    io.observe(n);
  });
}

function renderSurvivor(season) {
  const root = document.getElementById("survivor-root");
  if (!root) return;
  const slug = document.documentElement.getAttribute("data-survivor");
  const resolved = LEGACY_SLUGS[slug] || slug;
  const s = (season.survivors || []).find((x) => {
    const now = slugOf(x);
    const model = survivorSlug(modelOf(x));
    return now === resolved || model === resolved || now === slug || model === slug;
  });
  if (!s) {
    root.innerHTML = `<section class="episode-hero"><div class="hero-inner"><h1>Unknown torch</h1><p class="lede">That name is not on this island.</p></div></section>`;
    return;
  }
  const tribe = tribeById(season, s.tribeId);
  const tribeName = tribe ? tribe.name : s.tribeId;
  const model = modelOf(s);
  const campUrl = s.camp ? assetUrl(s.camp) : "";
  const campStyle = campUrl ? ` style="--camp:url('${escapeHtml(campUrl)}')"` : "";
  const portrait = s.portrait
    ? `<img class="survivor-portrait" src="${escapeHtml(assetUrl(s.portrait))}" alt="${escapeHtml(model)}">`
    : totemSvg(s, tribe);
  const caption = s.caption ? `<p class="survivor-caption">${escapeHtml(s.caption)}</p>` : "";
  const bio = s.bio ? `<p class="survivor-bio">${escapeHtml(s.bio)}</p>` : "";
  const book = formatBook(s);
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const delta = typeof s.bookUsd === "number" ? s.bookUsd - start : 0;
  const deltaClass = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const mates = (season.survivors || []).filter((x) => x.tribeId === s.tribeId && x.name !== s.name);
  const mateHtml = mates
    .map((m) => {
      const img = m.portrait
        ? `<img src="${escapeHtml(assetUrl(m.portrait))}" alt="${escapeHtml(modelOf(m))}">`
        : "";
      return `<a class="mate-card" href="${escapeHtml(survivorHref(m))}">${img}<span class="mate-model">${escapeHtml(modelOf(m))}</span></a>`;
    })
    .join("");
  document.title = `${model} — Last Trader Standing`;
  root.innerHTML = `
    <section class="survivor-hero" id="survivor"${campStyle}>
      <div class="hero-embers" aria-hidden="true"></div>
      <div class="hero-inner">
        <p class="section-kicker">${escapeHtml(tribeName)}</p>
        <h1>${escapeHtml(model)}</h1>
      </div>
    </section>
    <div class="survivor-sheet ${s.tribeId}">
      ${portrait}
      <h2>${escapeHtml(model)}</h2>
      <div class="survivor-meta">
        <span>${escapeHtml(tribeName)}</span>
        <span>${s.status === "active" ? "In the game" : escapeHtml(s.status)}</span>
      </div>
      <p class="survivor-archetype">${escapeHtml(s.archetype || "")}</p>
      ${bio}
      ${caption}
      <div class="survivor-book">
        <h3>The money</h3>
        <p class="survivor-money-arc">Episode snapshot — started at ${money(start)}. Now ${money(s.bookUsd)} <span class="face-week ${deltaClass}">(${delta >= 0 ? "+" : ""}${delta.toFixed(2)})</span> on the week. <a href="${escapeHtml(assetBase() + liveEpisodePath(season) + "#week-board")}">See the week board →</a></p>
        <p>${book}</p>
        <div class="survivor-stats">
          <div class="survivor-stat"><span>Book</span>${money(s.bookUsd)}</div>
          <div class="survivor-stat"><span>Day %</span>${pct(dayPctOf(s))}</div>
          <div class="survivor-stat"><span>Week %</span>${pct(weekPctOf(s))}</div>
        </div>
      </div>
    </div>
    <aside class="survivor-mates">
      <h3>${escapeHtml(tribeName)} camp</h3>
      <div class="mate-row">${mateHtml}</div>
    </aside>`;
}

function renderStandings(season) {
  const banner = document.getElementById("season-banner");
  const label = season.statusLabel || "Pre-season · torches unlit";
  if (banner) banner.textContent = label;

  const totals = document.getElementById("tribe-totals");
  if (totals) {
    totals.innerHTML = (season.tribes || [])
      .map((t) => {
        return `<div class="total-card ${t.id}">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="pct">${pct(combinedWeekPctOf(t))}</p>
        <p>${t.livingCount} standing · combined week %</p>
      </div>`;
      })
      .join("");
  }

  const body = document.getElementById("books-body");
  if (!body) return;
  body.innerHTML = (season.survivors || [])
    .map((s) => {
      const tribe = tribeById(season, s.tribeId);
      const pos = formatBook(s);
      const immune = s.immune ? " · immune" : "";
      return `<tr>
      <td><span class="dot ${s.tribeId}"></span>${survivorLabel(s, { link: true, tiny: true })}</td>
      <td>${tribe ? escapeHtml(tribe.name) : escapeHtml(s.tribeId)}</td>
      <td class="num">${money(s.bookUsd)}</td>
      <td class="num">${pct(dayPctOf(s))}</td>
      <td class="num">${pct(weekPctOf(s))}</td>
      <td>${pos}</td>
      <td>${escapeHtml(s.status)}${immune}</td>
    </tr>`;
    })
    .join("");
}

function snapshotById(season, id) {
  return (season.snapshots || []).find((snap) => snap.id === id) || null;
}

function snapshotBook(snap, survivorId) {
  if (!snap || !snap.books) return null;
  return snap.books[survivorId] || null;
}

function positionSignature(legs) {
  return (legs || [])
    .map((pos) => `${String(pos.ticker || "").toUpperCase()}:${pos.qty || ""}:${pos.sizeUsd || ""}:${pos.status || ""}`)
    .join("|");
}

function snapshotTag(row, prevRow, kind) {
  const legs = (row && row.positions) || [];
  const allCash = legs.length > 0 && legs.every((pos) => isCashLeg(pos));
  const blocked = legs.some((pos) => pos.status === "cash-short-blocked");
  if (kind === "open" || !prevRow) {
    if (blocked) return { tag: "Shorts blocked", moved: false };
    if (allCash) return { tag: "Held cash", moved: false };
    return { tag: "Opened", moved: false };
  }
  const moved = positionSignature(legs) !== positionSignature(prevRow.positions);
  if (moved) return { tag: "", moved: true };
  return { tag: "Sat", moved: false };
}

function dayCardHtml(s, tribe, opts) {
  const model = escapeHtml(modelOf(s));
  const face = s.portrait
    ? `<img src="${escapeHtml(assetUrl(s.portrait))}" alt="">`
    : "";
  const day = typeof opts.dayPct === "number" ? opts.dayPct : null;
  const week = typeof opts.weekPct === "number" ? opts.weekPct : null;
  const dayClass = day == null ? "flat" : day > 0 ? "up" : day < 0 ? "down" : "flat";
  const weekClass = week == null ? "flat" : week > 0 ? "up" : week < 0 ? "down" : "flat";
  const bookHtml = (opts.legs || []).map((p) => formatPosition(p, s.tribeId)).join("");
  const moved = opts.moved
    ? `<span class="day-tag moved">Moved</span>`
    : opts.tag
      ? `<span class="day-tag">${escapeHtml(opts.tag)}</span>`
      : "";
  let deltaHtml = "";
  if (typeof opts.priorMarkUsd === "number" && typeof opts.bookUsd === "number") {
    const delta = opts.bookUsd - opts.priorMarkUsd;
    const dClass = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const sign = delta > 0 ? "+" : "";
    deltaHtml = `<span><i>Δ day</i><b class="${dClass}">${sign}${delta.toFixed(2)}</b></span>`;
  }
  return `<article class="day-card ${s.tribeId}">
    <div class="day-card-top">
      ${face ? `<a class="day-face" href="${escapeHtml(survivorHref(s))}">${face}</a>` : ""}
      <a class="day-id" href="${escapeHtml(survivorHref(s))}">
        <strong>${model}</strong>
        <em>${escapeHtml(tribeLine(s, tribe))}</em>
      </a>
      ${moved}
    </div>
    <div class="day-book">${bookHtml || formatPosition(null, s.tribeId)}</div>
    <div class="day-nums">
      <span><i>Book</i>${money(opts.bookUsd)}</span>
      ${deltaHtml}
      ${day != null ? `<span><i>Day %</i><b class="${dayClass}">${pct(day)}</b></span>` : ""}
      ${week != null ? `<span><i>Week %</i><b class="${weekClass}">${pct(week)}</b></span>` : ""}
    </div>
  </article>`;
}

function renderEpisodeDays(season) {
  const specs = season.episode && Array.isArray(season.episode.days) ? season.episode.days : [];
  if (!specs.length) return;
  const snapshots = season.snapshots || [];
  const survivors = season.survivors || [];

  specs.forEach((spec, index) => {
    const board = spec.board ? document.getElementById(spec.board) : null;
    const tribesMount = spec.tribes ? document.getElementById(spec.tribes) : null;
    const snap = snapshotById(season, spec.snapshotId);
    if (!snap) return;
    const prevSnap = index > 0 ? snapshotById(season, specs[index - 1].snapshotId) || snapshots[index - 1] : null;

    if (tribesMount) {
      tribesMount.innerHTML = (season.tribes || [])
        .map((t) => {
          const tot = (snap.tribes && snap.tribes[t.id]) || t;
          return `<div class="total-card ${t.id}">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="pct">${pct(combinedWeekPctOf(tot))}</p>
        <p>${t.livingCount} standing · combined week % · snapshot</p>
      </div>`;
        })
        .join("");
    }

    if (!board) return;
    const open = snap.kind === "open" || spec.id === "monday";
    const ordered = [...survivors].sort((a, b) => {
      if (open) {
        if (a.tribeId !== b.tribeId) return a.tribeId < b.tribeId ? -1 : 1;
        return modelOf(a).localeCompare(modelOf(b));
      }
      const bookA = snapshotBook(snap, a.id) || a;
      const bookB = snapshotBook(snap, b.id) || b;
      return dayPctOf(bookB) - dayPctOf(bookA);
    });
    board.innerHTML = ordered
      .map((s) => {
        const tribe = tribeById(season, s.tribeId);
        const row = snapshotBook(snap, s.id) || {};
        const prev = snapshotBook(prevSnap, s.id);
        const meta = snapshotTag(row, prev, snap.kind || (open ? "open" : "mark"));
        const prior =
          !open && typeof row.priorMarkUsd === "number" && !Number.isNaN(row.priorMarkUsd)
            ? row.priorMarkUsd
            : null;
        return dayCardHtml(s, tribe, {
          bookUsd: row.bookUsd,
          priorMarkUsd: prior,
          legs: row.positions || [],
          dayPct: open ? null : dayPctOf(row),
          weekPct: open ? null : weekPctOf(row),
          tag: meta.tag,
          moved: meta.moved
        });
      })
      .join("");
  });
}

function renderEpisodeLiveIndicator(season) {
  if (document.documentElement.dataset.page !== "episode") return;
  const epNum = Number(document.documentElement.dataset.episode);
  if (!epNum) return;
  const live = getLiveEpisode(season);
  if (!live || live.number !== epNum) return;
  const h1 = document.querySelector(".episode-hero h1");
  if (!h1 || h1.querySelector(".live-badge")) return;
  const dateSpan = h1.querySelector(":scope > span");
  const titleRow = document.createElement("span");
  titleRow.className = "ep-title-row ep-hero-title";
  const textNode = h1.firstChild;
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    const titleSpan = document.createElement("span");
    titleSpan.textContent = textNode.textContent.trim();
    titleRow.appendChild(titleSpan);
    h1.removeChild(textNode);
  }
  titleRow.insertAdjacentHTML("beforeend", liveIndicatorHtml());
  h1.insertBefore(titleRow, dateSpan || null);
}

function renderEpisode(season) {
  renderEpisodeDays(season);
  const totals = document.getElementById("episode-tribe-totals");
  if (totals) {
    totals.innerHTML = (season.tribes || [])
      .map((t) => {
        return `<div class="total-card ${t.id}">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="pct">${pct(combinedWeekPctOf(t))}</p>
        <p>${t.livingCount} standing · combined week % · ${pct(combinedDayPctOf(t))} day</p>
      </div>`;
      })
      .join("");
  }
  const banner = document.getElementById("season-banner");
  if (banner) banner.textContent = season.statusLabel || "Live · S1E01 · Friday tribal Aug 28";
  renderEpisodeLiveIndicator(season);
  renderEpisodeHoldings(season);
  const body = document.getElementById("episode-marks-body");
  if (body) {
    body.innerHTML = (season.survivors || [])
      .map((s) => {
        const tribe = tribeById(season, s.tribeId);
        const immune = s.immune ? " · immune" : "";
        return `<tr>
      <td><span class="dot ${s.tribeId}"></span>${survivorLabel(s, { link: true, tiny: true })}</td>
      <td>${tribe ? escapeHtml(tribe.name) : escapeHtml(s.tribeId)}</td>
      <td class="num">${money(s.bookUsd)}</td>
      <td class="num">${pct(dayPctOf(s))}</td>
      <td class="num">${pct(weekPctOf(s))}</td>
      <td>${formatBook(s)}</td>
      <td>${escapeHtml(s.status)}${immune}</td>
    </tr>`;
      })
      .join("");
  }
  const tribal = document.getElementById("episode-tribal");
  const tribalHeading = document.querySelector(
    "#tribal-focus > h2, #tribal-cut > h2, #tribal > h2"
  );
  if (tribal) {
    const log = Array.isArray(season.tribalLog) ? season.tribalLog : [];
    if (log.length === 0) {
      if (tribalHeading) tribalHeading.textContent = "Not yet";
      tribal.innerHTML = `
      <div class="torches">${torchSvg(false)}${torchSvg(false)}${torchSvg(false)}</div>
      <div class="council-empty">
        <h3>Not yet</h3>
        <p>Friday night. Losing tribe walks in. Nobody wears a necklace. The vote is social.</p>
      </div>`;
    } else {
      if (tribalHeading) tribalHeading.textContent = "The vote";
      document.body.classList.add("episode-vote-posted");
      const items = log.map((entry) => formatTribalEntry(entry)).join("");
      tribal.innerHTML = `
    <div class="torches">${torchSvg(true)}${torchSvg(true)}${torchSvg(false)}</div>
    ${wrapTribalSpoiler(`<ul class="log-list tribal-vote-list">${items}</ul>`)}`;
      bindTribalSpoilers(tribal);
    }
  }
}

function tallyFromVotes(votes) {
  if (!votes) return null;
  if (typeof votes === "object" && !Array.isArray(votes)) {
    const entries = Object.entries(votes).filter(([, n]) => Number(n) > 0);
    return entries.length ? entries : null;
  }
  if (!Array.isArray(votes)) return null;
  const counts = new Map();
  for (const v of votes) {
    if (v == null) continue;
    let name = "";
    if (typeof v === "string") name = v;
    else if (typeof v === "object") name = v.for || v.boot || v.target || v.vote || "";
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return counts.size ? [...counts.entries()] : null;
}

function formatTribalTally(entry) {
  const pairs =
    (entry.tally && typeof entry.tally === "object" && !Array.isArray(entry.tally)
      ? Object.entries(entry.tally)
      : null) || tallyFromVotes(entry.votes);
  if (!pairs || !pairs.length) return "";
  const sorted = [...pairs].sort((a, b) => Number(b[1]) - Number(a[1]) || String(a[0]).localeCompare(String(b[0])));
  return sorted
    .map(
      ([name, n]) =>
        `<li class="vote-tally-row"><span class="vote-tally-name">${escapeHtml(String(name))}</span><span class="vote-tally-count">${escapeHtml(String(n))}</span></li>`
    )
    .join("");
}

function formatTribalEntry(entry) {
  const boot = entry.bootName || entry.boot || entry.bootId || "—";
  const tallyRows = formatTribalTally(entry);
  const tallyHtml = tallyRows
    ? `<ul class="vote-tally" aria-label="Votes">${tallyRows}</ul>`
    : "";
  return `<li class="tribal-vote-entry">
    <p class="boot-kicker">The tribe has spoken</p>
    <p class="boot-name">${escapeHtml(String(boot))}</p>
    ${tallyHtml}
  </li>`;
}

function wrapTribalSpoiler(innerHtml) {
  return `<div class="tribal-spoiler">
    <div class="tribal-spoiler-result" id="tribal-spoiler-result" aria-hidden="true">${innerHtml}</div>
    <button type="button" class="tribal-spoiler-cover" aria-expanded="false" aria-controls="tribal-spoiler-result">
      <canvas class="tribal-spoiler-canvas" aria-hidden="true"></canvas>
      <span class="tribal-spoiler-cover-fallback">
        <span class="spoiler-kicker">Spoiler</span>
        <span class="spoiler-title">Click to Reveal the Vote</span>
        <span class="spoiler-copy">Burn to reveal who goes home.</span>
      </span>
      <span class="visually-hidden">Spoiler: tribal results. Click to reveal the vote.</span>
    </button>
    <canvas class="tribal-spoiler-particles" aria-hidden="true"></canvas>
  </div>`;
}

function bindTribalSpoilers(root) {
  if (!root) return;
  root.querySelectorAll(".tribal-spoiler").forEach((wrap) => {
    const btn = wrap.querySelector(".tribal-spoiler-cover");
    const result = wrap.querySelector(".tribal-spoiler-result");
    if (!btn || btn.dataset.fallbackBound === "1") return;
    btn.dataset.fallbackBound = "1";

    const revealFallback = () => {
      wrap.classList.add("is-revealed");
      wrap.classList.remove("is-burning");
      if (result) result.removeAttribute("aria-hidden");
      btn.remove();
    };

    btn.addEventListener("click", () => {
      if (wrap.classList.contains("is-revealed") || wrap.dataset.burnInit === "1") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        revealFallback();
      }
    });
  });
  if (typeof window.initTribalSpoilerBurns === "function") {
    window.initTribalSpoilerBurns(root);
  }
}

function getLiveEpisode(season) {
  const episodes = Array.isArray(season.episodes) ? season.episodes : [];
  return episodes.find((ep) => ep.status === "live") || null;
}

function liveIndicatorHtml() {
  return (
    '<span class="live-badge" aria-label="Live now">' +
    '<span class="live-badge-dot" aria-hidden="true"></span>LIVE</span>'
  );
}

function watchIconHtml() {
  return (
    '<svg class="nav-watch-icon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>' +
    "</svg>"
  );
}

function renderNavWatch(season) {
  const path = liveEpisodePath(season);
  if (!path) return;
  const live = getLiveEpisode(season);
  const href = assetBase() + path;
  const onLiveEpisode =
    live &&
    document.documentElement.dataset.page === "episode" &&
    Number(document.documentElement.dataset.episode) === live.number;

  document.querySelectorAll("[data-nav-watch]").forEach((link) => {
    link.href = href;
    if (!link.querySelector(".nav-watch-icon")) {
      link.insertAdjacentHTML("afterbegin", watchIconHtml());
    }
    if (live && !link.querySelector(".live-badge")) {
      link.insertAdjacentHTML("beforeend", " " + liveIndicatorHtml());
    }
    if (onLiveEpisode) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function episodeFileHref(ep) {
  const path = (ep && ep.path) || "";
  if (!path) return "";
  const parts = String(path).split("/");
  return parts[parts.length - 1] || "";
}

function renderSeasonHub(season) {
  const list = document.getElementById("episode-list");
  if (!list) return;
  const byNum = new Map();
  (Array.isArray(season.episodes) ? season.episodes : []).forEach((ep) => {
    byNum.set(ep.number, ep);
  });
  const episodes = [...byNum.values()].sort((a, b) => (a.number || 0) - (b.number || 0));
  list.innerHTML = episodes
    .map((ep) => {
      const locked = ep.status === "locked" || !ep.path;
      const title = escapeHtml(ep.title || "Episode " + ep.number);
      const label = escapeHtml(ep.weekLabel || "");
      if (locked) {
        return `<div class="episode-card locked" aria-disabled="true">
        <p class="ep-kicker">Torches unlit</p>
        <h3>${title}</h3>
        <p>${label}</p>
        <p class="ep-locked-note">After Friday tribal</p>
      </div>`;
      }
      const href = episodeFileHref(ep);
      const status = ep.status === "live" ? "Now playing" : ep.status || "cut";
      const liveClass = ep.status === "live" ? " live" : "";
      const live = ep.status === "live";
      return `<a class="episode-card${liveClass}" href="${escapeHtml(href)}">
        <p class="ep-kicker">${escapeHtml(status)}</p>
        <h3 class="ep-title-row"><span>${title}</span>${live ? liveIndicatorHtml() : ""}</h3>
        <p>${label}</p>
      </a>`;
    })
    .join("");
}

function render(season, sourceNote) {
  renderIslandPot(season);
  renderFaces(season);
  renderSurvivor(season);
  renderStandings(season);
  renderSeasonHub(season);
  renderEpisode(season);
  renderMoneyJourney(season);
  renderHomeEpisodes(season);
  renderNavWatch(season);
  initDayFolds();
  initReveals();
  const miss = document.getElementById("json-miss");
  if (!miss) return;
  if (sourceNote) {
    miss.textContent = sourceNote;
    miss.classList.remove("hidden");
  } else {
    miss.classList.add("hidden");
  }
}

function emptySeason() {
  return { survivors: [], tribes: [], episodes: [], snapshots: [] };
}

async function loadSeason() {
  for (const path of seasonJsonUrls()) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data || !Array.isArray(data.survivors) || data.survivors.length < 1) continue;
      return { season: data, note: null };
    } catch {
      /* file:// or missing path */
    }
  }
  if (window.__SEASON_FALLBACK__ && Array.isArray(window.__SEASON_FALLBACK__.survivors)) {
    return {
      season: window.__SEASON_FALLBACK__,
      note: "Could not fetch the live board. Showing the baked-in week."
    };
  }
  return {
    season: emptySeason(),
    note: "Could not fetch the live board."
  };
}

const CONTRIBUTE = {
  url: "https://donate.stripe.com/5kQ14m9uv3VJ61m7It0oM00",
  buyButtonId: "buy_btn_1U8ZoTCE93DBZfRIsfo7VX3P",
  publishableKey: "pk_live_sbH7i2tYMmt7NkfHtGrU1FNL"
};

const ROBINHOOD = {
  url: "https://join.robinhood.com/tuckerh138"
};

function initContribute() {
  const nav = document.querySelector(".nav-links");
  if (nav && !nav.querySelector("[data-contribute]")) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = CONTRIBUTE.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.dataset.contribute = "true";
    link.textContent = "Contribute";
    item.appendChild(link);
    nav.appendChild(item);
  }

  const footer = document.querySelector("footer");
  if (footer && !footer.querySelector(".contribute-block")) {
    const block = document.createElement("div");
    block.className = "contribute-block";
    block.innerHTML =
      '<p class="contribute-kicker">Support the contest</p>' +
      '<div class="stripe-buy-wrap">' +
      '<stripe-buy-button buy-button-id="' +
      CONTRIBUTE.buyButtonId +
      '" publishable-key="' +
      CONTRIBUTE.publishableKey +
      '"></stripe-buy-button>' +
      "</div>" +
      '<p class="contribute-note"><a href="' +
      CONTRIBUTE.url +
      '" target="_blank" rel="noopener noreferrer">Contribute via Stripe</a> to help keep the torches lit on Liquidation Island.</p>';
    footer.insertBefore(block, footer.firstChild);
  }

  if (footer && !footer.querySelector(".robinhood-block")) {
    const rh = document.createElement("div");
    rh.className = "robinhood-block";
    rh.innerHTML =
      '<p class="robinhood-credit">Made possible by the Robinhood MCP.</p>' +
      '<p class="robinhood-referral"><a href="' +
      ROBINHOOD.url +
      '" target="_blank" rel="noopener noreferrer">Sign up for Robinhood with my link and we\'ll both pick our own gift stock \uD83C\uDF81</a></p>';
    footer.appendChild(rh);
  }

  if (!document.querySelector('script[src*="buy-button.js"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://js.stripe.com/v3/buy-button.js";
    document.head.appendChild(script);
  }
}

function applyDemoTribal(season) {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demoTribal") !== "1") return season;
  } catch {
    return season;
  }
  const demo = {
    ...season,
    tribalLog: [
      {
        title: "Episode 1 Tribal",
        weekLabel: season.episode && season.episode.weekLabel,
        bootName: "Demo Boot",
        summary: "Demo tally for spoiler UI — not a real council.",
        votes: [
          { from: "Kimi K3", for: "Demo Boot" },
          { from: "Composer 2.5", for: "Demo Boot" },
          { from: "Claude Sonnet 5", for: "Demo Boot" },
          { from: "Gemini 3.7 Flash", for: "Someone Else" }
        ]
      }
    ]
  };
  return demo;
}

initContribute();
loadSeason()
  .then(({ season, note }) => render(applyDemoTribal(season), note))
  .catch((err) => {
    console.error("Failed to load season data:", err);
    const fallback =
      window.__SEASON_FALLBACK__ && Array.isArray(window.__SEASON_FALLBACK__.survivors)
        ? window.__SEASON_FALLBACK__
        : emptySeason();
    render(
      applyDemoTribal(fallback),
      "Could not fetch the live board. Showing the baked-in week."
    );
  });
