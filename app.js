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

function islandGivenUsd(season) {
  if (typeof season.islandGivenUsd === "number" && !Number.isNaN(season.islandGivenUsd)) {
    return season.islandGivenUsd;
  }
  return null;
}

function livingContestantCount(season) {
  const list = season.survivors || [];
  const living = list.filter((s) => s && (s.status === "active" || s.status === "immune"));
  if (living.length) return living.length;
  return list.length || 12;
}

function seasonOngoing(season) {
  if (!season) return false;
  if (season.winnerId) return false;
  if (season.status === "complete" || season.status === "ended") return false;
  return season.status === "live" || season.started === true;
}

function homeTorchCount(season) {
  const n = (season && Array.isArray(season.survivors) && season.survivors.length) || 0;
  return n > 0 ? n : 12;
}

function renderHomeTorches(season) {
  const root = document.querySelector(".tribal-torches");
  if (!root) return;
  const count = homeTorchCount(season);
  const lit = seasonOngoing(season);
  root.innerHTML = Array.from({ length: count }, (_, i) => {
    const delay = lit ? ` style="--torch-delay: ${((-0.17 * i) % 1.4).toFixed(2)}s"` : "";
    return `<span class="tribal-torch ${lit ? "lit" : "dark"}"${delay}></span>`;
  }).join("");
}

function renderIslandPot(season) {
  const amount = document.getElementById("pot-amount");
  const count = document.getElementById("pot-contestants");
  if (!amount && !count) return;
  if (count) count.textContent = String(livingContestantCount(season));
  if (amount) {
    const homepage = document.documentElement.getAttribute("data-page") === "island";
    const given = homepage ? islandGivenUsd(season) : null;
    amount.textContent = potMoney(given != null ? given : islandPotUsd(season));
  }
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

function tribeChromeName(tribeOrId) {
  const id = tribeOrId && typeof tribeOrId === "object"
    ? String(tribeOrId.id || tribeOrId.tribeId || "").toLowerCase()
    : String(tribeOrId || "").toLowerCase();
  const name = tribeOrId && typeof tribeOrId === "object" ? String(tribeOrId.name || "") : "";
  const raw = id || name.toLowerCase();
  if (raw === "askara" || raw === "the askara tribe" || /^askara$/i.test(name)) return "The Askara tribe";
  if (raw === "bidu" || raw === "the bidu tribe" || /^bidu$/i.test(name)) return "The Bidu tribe";
  return name || String(tribeOrId || "");
}

function tribeCampBanner(tribeOrId) {
  const chrome = tribeChromeName(tribeOrId);
  return chrome ? chrome + " camp" : "";
}

function tribeLine(s, tribe) {
  return tribeChromeName(tribe || (s && s.tribeId));
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
  const tribeName = tribeChromeName(tribe || s.tribeId);
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
  return "week-board";
}

function openFoldForHash() {
  const hash = (window.location.hash || "").replace(/^#/, "");
  if (hash) {
    const el = document.getElementById(hash);
    if (el) openFoldForTarget(el);
  }
}

function initDayFolds() {
  if (!document.querySelector(".day-fold")) return;
  openFoldForHash();
  if (initDayFolds.bound) return;
  initDayFolds.bound = true;
  window.addEventListener("hashchange", openFoldForHash);
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
        <p class="face-tribe">${escapeHtml(tribeChromeName(tribe))}</p>
      </a>`;
        })
        .join("");
      const buff = tribe.buff ? ` · ${escapeHtml(tribe.buff)}` : "";
      return `<div class="face-tribe-block ${tribe.id} reveal">
      <p class="face-tribe-kicker">${escapeHtml(tribeChromeName(tribe))}${buff}</p>
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
        <h3>${escapeHtml(tribeChromeName(t))}</h3>
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
  const tribeName = tribeChromeName(tribe || s.tribeId);
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
      <h3>${escapeHtml(tribeCampBanner(tribe || s.tribeId))}</h3>
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
        <h3>${escapeHtml(tribeChromeName(t))}</h3>
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
      <td>${escapeHtml(tribeChromeName(tribe || s.tribeId))}</td>
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
        <h3>${escapeHtml(tribeChromeName(t))}</h3>
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

const MONEY_TICKER_SPEEDS = [0.5, 1, 4, 16];
const MONEY_TICKER_DIAGRAMS = ["island", "tribes", "contestants"];
const MONEY_TICKER_RANGES = ["week", "season"];
const MONEY_TICKER_HOME_DIAGRAMS = ["island"];
const MONEY_TICKER_HOME_RANGES = ["season"];
const moneyTicker = {
  root: null,
  season: null,
  range: "week",
  diagram: "island",
  mode: "episode",
  ranges: MONEY_TICKER_RANGES.slice(),
  diagrams: MONEY_TICKER_DIAGRAMS.slice(),
  speed: 1,
  index: 0,
  playing: false,
  timer: null,
  frames: [],
  putIn: 120,
  sleevePutIn: 10,
  tribePutIn: 60,
  chartMin: 0,
  chartMax: 1,
  chartTop: 18,
  chartHeight: 176,
  liveSeries: "total",
  reducedMotion: false,
  autoplayArmed: false,
  autoplayDone: false,
  scrollObserver: null,
  progress: 0,
  raf: null,
  playStartedAt: 0,
  playFromProgress: 0,
  skyOn: false
};

function moneyTickerIsHome() {
  return moneyTicker.mode === "home";
}

function moneyTickerAllowedDiagrams() {
  return moneyTicker.diagrams && moneyTicker.diagrams.length
    ? moneyTicker.diagrams
    : MONEY_TICKER_DIAGRAMS;
}

function moneyTickerAllowedRanges() {
  return moneyTicker.ranges && moneyTicker.ranges.length
    ? moneyTicker.ranges
    : MONEY_TICKER_RANGES;
}

function moneyPutInTotal(season) {
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const castN = (season.survivors || []).length || (season.cast || []).length || 12;
  return roundMoney(start * castN);
}

function roundMoney(n) {
  return Math.round(n * 10000) / 10000;
}

function snapshotTotal(snap) {
  if (!snap || !snap.books) return 0;
  return roundMoney(
    Object.values(snap.books).reduce((acc, book) => {
      return typeof book.bookUsd === "number" && !Number.isNaN(book.bookUsd) ? acc + book.bookUsd : acc;
    }, 0)
  );
}

function pacificDayLabel(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function pacificHourDecimal(dateOrIso) {
  const d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);
  if (Number.isNaN(d.getTime())) return 12;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23"
    }).formatToParts(d);
    const hour = Number((parts.find((p) => p.type === "hour") || {}).value);
    const minute = Number((parts.find((p) => p.type === "minute") || {}).value);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return 12;
    return hour + minute / 60;
  } catch {
    return 12;
  }
}

function moneyTickerPlayheadDate(progress) {
  const frames = moneyTicker.frames;
  if (!frames.length) return null;
  const max = frames.length - 1;
  const t = Math.max(0, Math.min(max, progress));
  const i0 = Math.floor(t);
  const i1 = Math.min(max, i0 + 1);
  const u = t - i0;
  const t0 = Date.parse(frames[i0].at);
  const t1 = Date.parse(frames[i1].at);
  if (Number.isNaN(t0)) return null;
  if (Number.isNaN(t1) || i0 === i1) return new Date(t0);
  return new Date(lerp(t0, t1, u));
}

/** Late-August Liquidation Island sky: sun/moon arcs over the day in PT. */
function moneyTickerSkyPose(hour) {
  const h = ((hour % 24) + 24) % 24;
  const sunRise = 6.2;
  const sunSet = 19.55;
  const dayLen = sunSet - sunRise;
  const sunT = (h - sunRise) / dayLen;
  const sunUp = sunT > -0.02 && sunT < 1.02;
  const sunX = Math.max(0, Math.min(1, sunT));
  const sunY = sunUp ? Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, sunT)))) : 0;

  const hNight = h < sunRise ? h + 24 : h;
  const nightLen = 24 - dayLen;
  const moonT = (hNight - sunSet) / nightLen;
  const moonUp = moonT >= -0.02 && moonT <= 1.02;
  const moonX = Math.max(0, Math.min(1, moonT));
  const moonY = moonUp ? Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, moonT)))) : 0;

  let phase = "night";
  if (h >= sunRise - 0.6 && h < sunRise + 1.1) phase = "dawn";
  else if (h >= sunRise + 1.1 && h < sunSet - 1.2) phase = "day";
  else if (h >= sunSet - 1.2 && h < sunSet + 0.8) phase = "dusk";

  return { hour: h, phase, sunX, sunY, sunUp, moonX, moonY, moonUp };
}

function moneyTickerSkyColors(phase, hour) {
  if (phase === "dawn") {
    return { top: "#3a2240", mid: "#c45a3a", bot: "#f0c14b", glow: "rgba(240, 193, 75, 0.45)" };
  }
  if (phase === "day") {
    return { top: "#1a4a62", mid: "#2a7a8a", bot: "#8ec8c0", glow: "rgba(255, 220, 120, 0.35)" };
  }
  if (phase === "dusk") {
    return { top: "#1a1028", mid: "#c45a12", bot: "#e89354", glow: "rgba(232, 147, 84, 0.5)" };
  }
  /* night — cooler near midnight */
  const deep = hour > 22 || hour < 4;
  return {
    top: deep ? "#05060c" : "#0a1020",
    mid: deep ? "#0c1428" : "#152038",
    bot: deep ? "#1a2030" : "#2a3048",
    glow: "rgba(200, 210, 255, 0.2)"
  };
}

function renderMoneyTickerSkySvg() {
  return `<svg class="money-ticker-sky-svg" viewBox="0 0 640 222" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="mts-sky" x1="0" y1="0" x2="0" y2="1">
        <stop data-sky-stop="top" offset="0" stop-color="#0a1020"/>
        <stop data-sky-stop="mid" offset="0.55" stop-color="#152038"/>
        <stop data-sky-stop="bot" offset="1" stop-color="#2a3048"/>
      </linearGradient>
      <radialGradient id="mts-sun-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#fff6d6" stop-opacity="0.95"/>
        <stop offset="0.35" stop-color="#f0c14b" stop-opacity="0.7"/>
        <stop offset="1" stop-color="#e85d04" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="mts-moon-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#f3ead6" stop-opacity="0.85"/>
        <stop offset="0.45" stop-color="#c8d0e8" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#c8d0e8" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect class="money-ticker-sky-fill" width="640" height="222" fill="url(#mts-sky)"/>
    <g class="money-ticker-stars" data-sky-stars opacity="0">
      <circle cx="72" cy="28" r="1.1" fill="#f3ead6"/>
      <circle cx="140" cy="48" r="0.8" fill="#f3ead6"/>
      <circle cx="210" cy="22" r="1" fill="#f3ead6"/>
      <circle cx="290" cy="40" r="0.7" fill="#f3ead6"/>
      <circle cx="360" cy="18" r="1.2" fill="#f3ead6"/>
      <circle cx="430" cy="36" r="0.8" fill="#f3ead6"/>
      <circle cx="510" cy="24" r="1" fill="#f3ead6"/>
      <circle cx="580" cy="44" r="0.9" fill="#f3ead6"/>
      <circle cx="100" cy="70" r="0.6" fill="#f3ead6"/>
      <circle cx="470" cy="60" r="0.7" fill="#f3ead6"/>
    </g>
    <g data-sky-sun opacity="0">
      <circle data-sky-sun-glow cx="0" cy="0" r="28" fill="url(#mts-sun-glow)"/>
      <circle data-sky-sun-body cx="0" cy="0" r="11" fill="#fff1b8"/>
    </g>
    <g data-sky-moon opacity="0">
      <circle data-sky-moon-glow cx="0" cy="0" r="22" fill="url(#mts-moon-glow)"/>
      <circle data-sky-moon-body cx="0" cy="0" r="9" fill="#e8eef8"/>
      <circle data-sky-moon-shade cx="3" cy="-1" r="8" fill="#0a1020" opacity="0.22"/>
    </g>
    <g class="money-ticker-island" fill="#0a0708">
      <path d="M0 176 C40 168 70 150 110 152 C150 154 170 168 210 164 C250 160 280 140 330 142 C380 144 410 158 460 154 C510 150 550 138 600 148 C620 152 640 160 640 160 L640 222 L0 222 Z"/>
      <path d="M80 158 C88 140 96 128 104 158 Z" opacity="0.95"/>
      <path d="M400 156 C408 132 418 120 426 156 Z" opacity="0.9"/>
      <ellipse cx="320" cy="198" rx="220" ry="18" fill="#050408" opacity="0.55"/>
      <!-- palm tree -->
      <g class="money-ticker-palm" transform="translate(528 86)">
        <path d="M14 66 C12 48 11 32 13 18 C14 10 15 4 16 0 C18 8 20 18 19 34 C18 48 18 58 20 70 Z"/>
        <path d="M16 8 C2 2 -10 8 -18 18 C-8 12 4 10 16 12 Z"/>
        <path d="M16 6 C6 -6 -4 -14 -14 -12 C-4 -10 6 -2 16 8 Z"/>
        <path d="M16 4 C22 -8 34 -14 46 -10 C34 -12 24 -4 16 6 Z"/>
        <path d="M16 8 C28 0 42 2 52 12 C40 6 28 8 16 12 Z"/>
        <path d="M16 10 C8 16 -2 28 -4 40 C2 28 10 18 16 14 Z"/>
        <path d="M16 10 C24 18 34 28 40 40 C32 28 24 18 16 14 Z"/>
        <circle cx="15" cy="7" r="2.2"/>
      </g>
    </g>
  </svg>`;
}

function syncMoneyTickerSky(progress) {
  const root = moneyTicker.root;
  if (!root || !moneyTicker.skyOn) return;
  const sky = root.querySelector(".money-ticker-sky");
  if (!sky) return;
  const when = moneyTickerPlayheadDate(progress);
  const hour = when ? pacificHourDecimal(when) : 12;
  const pose = moneyTickerSkyPose(hour);
  const colors = moneyTickerSkyColors(pose.phase, pose.hour);

  sky.querySelectorAll("[data-sky-stop]").forEach((stop) => {
    const key = stop.getAttribute("data-sky-stop");
    if (key && colors[key]) stop.setAttribute("stop-color", colors[key]);
  });

  const stars = sky.querySelector("[data-sky-stars]");
  if (stars) {
    const starOp = pose.phase === "night" ? 0.85 : pose.phase === "dusk" || pose.phase === "dawn" ? 0.25 : 0;
    stars.setAttribute("opacity", String(starOp));
  }

  const skyPadL = 48;
  const skyPadR = 48;
  const skyW = 640 - skyPadL - skyPadR;
  const horizon = 168;
  const zenith = 28;

  const place = (groupSel, glowSel, bodySel, xNorm, yNorm, up) => {
    const g = sky.querySelector(groupSel);
    if (!g) return;
    g.setAttribute("opacity", up && yNorm > 0.02 ? "1" : "0");
    const x = skyPadL + xNorm * skyW;
    const y = horizon - yNorm * (horizon - zenith);
    const glow = sky.querySelector(glowSel);
    const body = sky.querySelector(bodySel);
    if (glow) {
      glow.setAttribute("cx", String(x));
      glow.setAttribute("cy", String(y));
    }
    if (body) {
      body.setAttribute("cx", String(x));
      body.setAttribute("cy", String(y));
    }
    return { x, y };
  };

  place("[data-sky-sun]", "[data-sky-sun-glow]", "[data-sky-sun-body]", pose.sunX, pose.sunY, pose.sunUp);
  const moon = place("[data-sky-moon]", "[data-sky-moon-glow]", "[data-sky-moon-body]", pose.moonX, pose.moonY, pose.moonUp);
  const shade = sky.querySelector("[data-sky-moon-shade]");
  if (shade && moon) {
    shade.setAttribute("cx", String(moon.x + 3));
    shade.setAttribute("cy", String(moon.y - 1));
  }

  const chart = root.querySelector(".money-ticker-chart");
  if (chart) chart.setAttribute("data-sky-phase", pose.phase);
}

function snapshotsForTickerRange(season, range) {
  const all = Array.isArray(season.snapshots) ? season.snapshots.slice() : [];
  if (!all.length) return [];
  if (range !== "week") return all;
  const ep = season.episode || {};
  const weekStart = ep.weekStart ? Date.parse(ep.weekStart + "T00:00:00-07:00") : NaN;
  const weekEnd = ep.weekEnd
    ? Date.parse(ep.weekEnd + "T23:59:59-07:00")
    : ep.tribalAt
      ? Date.parse(ep.tribalAt) + 36 * 60 * 60 * 1000
      : NaN;
  if (Number.isNaN(weekStart) || Number.isNaN(weekEnd)) return all;
  const filtered = all.filter((snap) => {
    const t = Date.parse(snap.at);
    return !Number.isNaN(t) && t >= weekStart && t <= weekEnd;
  });
  return filtered.length ? filtered : all;
}

function candidateStroke(survivor, indexInTribe) {
  const askara = survivor.tribeId === "askara";
  const bases = askara
    ? ["#C45A12", "#e85d04", "#f0a060", "#a34410", "#ffb347", "#8a3a0c"]
    : ["#0E6B6B", "#1a9a8a", "#8ee8d8", "#0a4a4a", "#3cb8a8", "#145c5c"];
  return bases[indexInTribe % bases.length];
}

function tribeBooksFromFrame(frame, season) {
  const out = {};
  (season.tribes || []).forEach((tribe) => {
    out[tribe.id] = 0;
  });
  (season.survivors || []).forEach((s) => {
    const id = s.tribeId;
    if (!id) return;
    if (out[id] == null) out[id] = 0;
    const v = frame.books && frame.books[s.id];
    if (typeof v === "number") out[id] = roundMoney(out[id] + v);
  });
  return out;
}

function buildTickerFrames(season, range) {
  const snaps = snapshotsForTickerRange(season, range);
  const sleeve = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const cast = season.survivors || [];
  const tribeIndex = {};
  cast.forEach((s) => {
    const key = s.tribeId || "x";
    tribeIndex[key] = tribeIndex[key] || 0;
    s.__tickerTone = candidateStroke(s, tribeIndex[key]);
    tribeIndex[key] += 1;
  });
  return snaps.map((snap) => {
    const books = {};
    cast.forEach((s) => {
      const row = snap.books && snap.books[s.id];
      books[s.id] = row && typeof row.bookUsd === "number" ? row.bookUsd : sleeve;
    });
    const frame = {
      id: snap.id,
      at: snap.at,
      label: snap.label || pacificDayLabel(snap.at),
      total: snapshotTotal(snap),
      books
    };
    frame.tribes = tribeBooksFromFrame(frame, season);
    return frame;
  });
}

function stopMoneyTickerPlayback() {
  if (moneyTicker.timer) {
    clearTimeout(moneyTicker.timer);
    moneyTicker.timer = null;
  }
  if (moneyTicker.raf) {
    cancelAnimationFrame(moneyTicker.raf);
    moneyTicker.raf = null;
  }
  moneyTicker.playing = false;
  const btn = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-play]");
  if (btn) {
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `<span aria-hidden="true">▶</span> Play`;
  }
}

function moneyTickerFullDurationMs() {
  const segments = Math.max(1, moneyTicker.frames.length - 1);
  return (segments * 900) / Math.max(0.05, moneyTicker.speed || 1);
}

function setMoneyTickerSpeed(speed) {
  if (!MONEY_TICKER_SPEEDS.includes(speed)) return;
  const wasPlaying = moneyTicker.playing;
  const at = moneyTicker.progress || 0;
  moneyTicker.speed = speed;
  const root = moneyTicker.root;
  if (root) {
    root.querySelectorAll("[data-ticker-speed]").forEach((btn) => {
      const s = Number(btn.getAttribute("data-ticker-speed"));
      btn.setAttribute("aria-pressed", s === speed ? "true" : "false");
    });
  }
  if (wasPlaying) {
    moneyTicker.playFromProgress = at;
    moneyTicker.playStartedAt = performance.now();
  }
}

function startMoneyTickerPlayback(opts) {
  if (!moneyTicker.frames.length) return;
  const max = moneyTicker.frames.length - 1;
  if (moneyTicker.reducedMotion) {
    setMoneyTickerProgress(max);
    return;
  }
  const fromStart = !opts || opts.fromStart !== false;
  if (fromStart || (moneyTicker.progress || 0) >= max - 0.001) {
    setMoneyTickerProgress(0);
  }
  if (moneyTicker.playing) return;
  moneyTicker.playing = true;
  moneyTicker.playFromProgress = moneyTicker.progress || 0;
  moneyTicker.playStartedAt = performance.now();
  const playBtn = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-play]");
  if (playBtn) {
    playBtn.setAttribute("aria-pressed", "true");
    playBtn.innerHTML = `<span aria-hidden="true">❚❚</span> Pause`;
  }
  moneyTicker.raf = requestAnimationFrame(tickMoneyTickerPlayback);
}

function tickMoneyTickerPlayback(now) {
  if (!moneyTicker.playing) return;
  const max = Math.max(0, moneyTicker.frames.length - 1);
  const full = moneyTickerFullDurationMs();
  const rate = max / full;
  const progress = Math.min(max, moneyTicker.playFromProgress + (now - moneyTicker.playStartedAt) * rate);
  setMoneyTickerProgress(progress);
  if (progress >= max - 0.0001) {
    setMoneyTickerProgress(max);
    stopMoneyTickerPlayback();
    const btn = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-play]");
    if (btn) btn.innerHTML = `<span aria-hidden="true">↻</span> Replay`;
    return;
  }
  moneyTicker.raf = requestAnimationFrame(tickMoneyTickerPlayback);
}

function armMoneyTickerAutoplay() {
  const root = moneyTicker.root;
  if (!root || moneyTicker.autoplayDone || moneyTicker.reducedMotion) return;
  if (moneyTicker.scrollObserver) {
    moneyTicker.scrollObserver.disconnect();
    moneyTicker.scrollObserver = null;
  }
  moneyTicker.autoplayArmed = true;

  const kickoff = () => {
    if (moneyTicker.autoplayDone || moneyTicker.reducedMotion) return;
    moneyTicker.autoplayDone = true;
    moneyTicker.autoplayArmed = false;
    if (moneyTicker.scrollObserver) {
      moneyTicker.scrollObserver.disconnect();
      moneyTicker.scrollObserver = null;
    }
    const allowed = moneyTickerAllowedDiagrams();
    /* Episode autoplay opens on Tribes; home stays on Island (only diagram offered). */
    const autoDiagram = moneyTickerIsHome()
      ? allowed.includes("island")
        ? "island"
        : allowed[0]
      : allowed.includes("tribes")
        ? "tribes"
        : allowed[0];
    if (autoDiagram === "tribes") {
      moneyTicker.diagram = "tribes";
    } else if (autoDiagram && autoDiagram !== moneyTicker.diagram) {
      moneyTicker.diagram = autoDiagram;
    }
    if (autoDiagram) {
      const rootEl = moneyTicker.root;
      if (rootEl) {
        rootEl.querySelectorAll("[data-ticker-diagram]").forEach((btn) => {
          const id = btn.getAttribute("data-ticker-diagram");
          btn.setAttribute("aria-selected", id === autoDiagram ? "true" : "false");
        });
        refreshMoneyTickerChart();
      }
    }
    setMoneyTickerSpeed(0.5);
    startMoneyTickerPlayback({ fromStart: true });
  };

  if (!("IntersectionObserver" in window)) {
    kickoff();
    return;
  }

  moneyTicker.scrollObserver = new IntersectionObserver(
    (entries) => {
      const hit = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35);
      if (!hit) return;
      kickoff();
    },
    { threshold: [0.35, 0.5], rootMargin: "0px 0px -8% 0px" }
  );
  moneyTicker.scrollObserver.observe(root);
}

function lerp(a, b, u) {
  return a + (b - a) * u;
}

function sampleJaggedValue(values, seriesKey, progress, valueSpan) {
  if (!values.length) return 0;
  const max = values.length - 1;
  const t = Math.max(0, Math.min(max, progress));
  if (t <= 0) return values[0];
  if (t >= max) return values[max];
  if (Math.abs(t - Math.round(t)) < 1e-6) return values[Math.round(t)];
  const samples = jaggedSeriesSamples(values, seriesKey, valueSpan);
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].t >= t) {
      const a = samples[i - 1];
      const b = samples[i];
      const u = (t - a.t) / (b.t - a.t || 1);
      return lerp(a.v, b.v, u);
    }
  }
  return values[max];
}

function setMoneyTickerIndex(next, opts) {
  setMoneyTickerProgress(next, opts);
}

function setMoneyTickerProgress(next, opts) {
  const frames = moneyTicker.frames;
  if (!frames.length) return;
  const max = frames.length - 1;
  const progress = Math.max(0, Math.min(max, Number(next) || 0));
  moneyTicker.progress = progress;
  const i0 = Math.floor(progress);
  const i1 = Math.min(max, i0 + 1);
  const u = progress - i0;
  const a = frames[i0];
  const b = frames[i1];
  moneyTicker.index = u < 0.5 ? i0 : i1;

  const total = roundMoney(lerp(a.total, b.total, u));
  const putIn = moneyTicker.putIn;
  const delta = roundMoney(total - putIn);
  const pctChange = putIn ? (delta / putIn) * 100 : 0;
  const down = delta < -0.00005;
  const up = delta > 0.00005;
  const chgClass = up ? "up" : down ? "down" : "flat";
  const arrow = up ? "▲" : down ? "▼" : "●";

  const amount = document.getElementById("pot-amount");
  if (amount) {
    amount.textContent = potMoney(total);
    amount.classList.toggle("is-ticker-down", down);
    amount.classList.toggle("is-ticker-up", up);
  }
  const live = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-live]");
  if (live) {
    live.textContent = potMoney(total);
    live.classList.toggle("is-ticker-down", down);
    live.classList.toggle("is-ticker-up", up);
  }
  const chgText = `${arrow} ${money(Math.abs(delta))} (${pct(pctChange).replace("+", "")}) from $${putIn.toFixed(0)} put in`;
  const chg = document.getElementById("money-ticker-chg");
  if (chg) {
    chg.className = "money-ticker-chg " + chgClass;
    chg.textContent = chgText;
  }
  const liveChg = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-live-chg]");
  if (liveChg) {
    liveChg.className = "money-ticker-chg " + chgClass;
    liveChg.textContent = chgText;
  }

  const scrub = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-scrub]");
  if (scrub) {
    const scrubVal = String(progress);
    if (scrub.value !== scrubVal) scrub.value = scrubVal;
  }

  const stamp = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-stamp]");
  if (stamp) {
    let when = "";
    const t0 = Date.parse(a.at);
    const t1 = Date.parse(b.at);
    if (!Number.isNaN(t0) && !Number.isNaN(t1)) {
      when = pacificDayLabel(new Date(lerp(t0, t1, u)).toISOString());
    } else {
      when = pacificDayLabel(u < 0.5 ? a.at : b.at) || (u < 0.5 ? a.label : b.label) || "";
    }
    stamp.textContent = when ? `Playhead · ${when}` : "";
  }

  const playX = moneyTickerXAt(progress, frames.length);
  const playhead = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-playhead]");
  if (playhead) {
    playhead.setAttribute("x1", String(playX));
    playhead.setAttribute("x2", String(playX));
  }
  const clip = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-clip]");
  if (clip) {
    clip.setAttribute("width", String(Math.max(playX + 4, 40)));
  }
  const potDot = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-pot-dot]");
  if (potDot && moneyTicker.diagram === "island") {
    const values = frames.map((f) => f.total);
    const span = moneyTicker.chartMax - moneyTicker.chartMin || 1;
    const value = sampleJaggedValue(values, 7, progress, span);
    potDot.setAttribute("cx", String(playX));
    potDot.setAttribute(
      "cy",
      String(moneyTickerY(value, moneyTicker.chartMin, moneyTicker.chartMax, moneyTicker.chartTop, moneyTicker.chartHeight))
    );
  }

  if (opts && opts.animate && !moneyTicker.reducedMotion) {
    const chart = moneyTicker.root && moneyTicker.root.querySelector(".money-ticker-chart");
    if (chart) {
      chart.classList.remove("is-tick");
      void chart.offsetWidth;
      chart.classList.add("is-tick");
    }
  }
  syncMoneyTickerSky(progress);
}

function moneyTickerXAt(t, count) {
  const padL = 36;
  const padR = 12;
  const w = 640 - padL - padR;
  if (count <= 1) return padL;
  return padL + (t / (count - 1)) * w;
}

function moneyTickerX(index, count) {
  return moneyTickerXAt(index, count);
}

function moneyTickerY(value, min, max, top, height) {
  const padT = typeof top === "number" ? top : 18;
  const h = typeof height === "number" ? height : 176;
  const span = max - min || 1;
  return padT + (1 - (value - min) / span) * h;
}

/** Deterministic 0..1 noise for stable jagged fills between marks. */
function tickerNoise(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Robinhood-style jagged polyline through real mark values.
 * Intermediate wiggles are decorative; every mark lands exactly on tape.
 */
function jaggedSeriesSamples(values, seriesKey, valueSpan) {
  const samples = [];
  if (!values.length) return samples;
  const steps = values.length <= 3 ? 18 : 14;
  const baseAmp = Math.max((valueSpan || 1) * 0.045, 0.08);
  samples.push({ t: 0, v: values[0] });
  for (let i = 1; i < values.length; i++) {
    const v0 = values[i - 1];
    const v1 = values[i];
    const segAmp = Math.max(Math.abs(v1 - v0) * 0.55, baseAmp);
    const seedBase = (Number(seriesKey) || 1) * 19.17 + i * 97.3;
    for (let s = 1; s < steps; s++) {
      const u = s / steps;
      const linear = v0 + (v1 - v0) * u;
      const env = Math.sin(Math.PI * u);
      const n1 = tickerNoise(seedBase + s * 3.17) * 2 - 1;
      const n2 = tickerNoise(seedBase + s * 11.9 + 4.2) * 2 - 1;
      const jag = (n1 * 0.65 + n2 * 0.35) * segAmp * env;
      samples.push({ t: i - 1 + u, v: linear + jag });
    }
    samples.push({ t: i, v: v1 });
  }
  return samples;
}

function tickerPathForSeries(values, min, max, top, height, seriesKey) {
  if (!values.length) return "";
  const span = max - min || 1;
  const samples = jaggedSeriesSamples(values, seriesKey, span);
  const count = values.length;
  return samples
    .map((pt, i) => {
      const x = moneyTickerXAt(pt.t, count);
      const y = moneyTickerY(pt.v, min, max, top, height);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function moneyTickerDiagramSeries(season, frames) {
  const sleeve = moneyTicker.sleevePutIn;
  const putIn = moneyTicker.putIn;
  const tribePutIn = moneyTicker.tribePutIn;
  const diagram = moneyTicker.diagram || "island";
  const last = frames[frames.length - 1];

  if (diagram === "tribes") {
    const tribes = season.tribes || [];
    let min = tribePutIn;
    let max = tribePutIn;
    frames.forEach((frame) => {
      tribes.forEach((tribe) => {
        const v = frame.tribes && frame.tribes[tribe.id];
        if (typeof v === "number") {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
    });
    const pad = Math.max(0.6, (max - min) * 0.18);
    min = Math.min(min, tribePutIn) - pad;
    max = Math.max(max, tribePutIn) + pad;
    return {
      title: "Tribes",
      aria: "Tribe book totals over recorded marks. Dotted line is money put into each tribe.",
      putIn: tribePutIn,
      putInLabel: `$${tribePutIn.toFixed(0)} in`,
      min,
      max,
      series: tribes.map((tribe) => ({
        id: tribe.id,
        label: tribeChromeName(tribe),
        color: tribe.color || (tribe.id === "askara" ? "#C45A12" : "#0E6B6B"),
        values: frames.map((f) => (f.tribes && f.tribes[tribe.id]) || tribePutIn),
        seed: tribe.id === "askara" ? 42 : 17,
        width: 2.2
      })),
      legend: tribes.map((tribe) => ({
        label: tribeChromeName(tribe),
        color: tribe.color || (tribe.id === "askara" ? "#C45A12" : "#0E6B6B")
      })),
      liveSeries: tribes[0] ? tribes[0].id : "total",
      strokeForDot: (tribes[0] && (tribes[0].color || "#0E6B6B")) || "#e89354"
    };
  }

  if (diagram === "contestants") {
    const cast = season.survivors || [];
    let min = sleeve;
    let max = sleeve;
    frames.forEach((frame) => {
      cast.forEach((s) => {
        const v = frame.books[s.id];
        if (typeof v === "number") {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
    });
    const pad = Math.max(0.35, (max - min) * 0.14);
    min = Math.min(min, sleeve) - pad;
    max = Math.max(max, sleeve) + pad;
    return {
      title: "Contestants",
      aria: "Contestant sleeves over recorded marks. Dotted line is the $10 put into each book.",
      putIn: sleeve,
      putInLabel: `$${sleeve.toFixed(0)} in`,
      min,
      max,
      series: cast.map((s, idx) => ({
        id: s.id,
        label: modelOf(s),
        color: s.__tickerTone || "#d4a017",
        values: frames.map((f) => f.books[s.id]),
        seed: idx + 11,
        width: 1.45
      })),
      legend: cast.map((s) => ({
        label: modelOf(s),
        color: s.__tickerTone || "#d4a017"
      })),
      liveSeries: cast[0] ? cast[0].id : "total",
      strokeForDot: cast[0] && cast[0].__tickerTone ? cast[0].__tickerTone : "#e89354"
    };
  }

  /* island */
  let min = putIn;
  let max = putIn;
  frames.forEach((frame) => {
    if (frame.total < min) min = frame.total;
    if (frame.total > max) max = frame.total;
  });
  const pad = Math.max(0.8, (max - min) * 0.22);
  min = Math.min(min, putIn) - pad;
  max = Math.max(max, putIn) + pad;
  const potDown = last && last.total < putIn - 0.00005;
  const potStroke = potDown ? "#e89354" : "#8ee8d8";
  return {
    title: "Island",
    aria: "Island pot over recorded marks. Dotted line is money put into the game.",
    putIn,
    putInLabel: `$${putIn.toFixed(0)} in`,
    min,
    max,
    series: [
      {
        id: "island",
        label: "Island pot",
        color: potStroke,
        values: frames.map((f) => f.total),
        seed: 7,
        width: 2.6
      }
    ],
    legend: [{ label: "Island pot", color: potStroke }],
    liveSeries: "total",
    strokeForDot: potStroke
  };
}

function renderMoneyTickerSvg(season, frames) {
  const chartTop = 22;
  const chartHeight = 168;
  const spec = moneyTickerDiagramSeries(season, frames);
  moneyTicker.chartMin = spec.min;
  moneyTicker.chartMax = spec.max;
  moneyTicker.chartTop = chartTop;
  moneyTicker.chartHeight = chartHeight;
  moneyTicker.liveSeries = spec.liveSeries;

  const yTicks = [spec.max, spec.putIn, spec.min];
  const yLabels = yTicks
    .map((v) => {
      const y = moneyTickerY(v, spec.min, spec.max, chartTop, chartHeight);
      const label = Math.abs(v - spec.putIn) < 0.0001 ? spec.putInLabel : money(v);
      return `<text class="money-ticker-axis" x="2" y="${(y + 4).toFixed(2)}">${escapeHtml(label)}</text>
      <line class="money-ticker-grid" x1="36" y1="${y.toFixed(2)}" x2="628" y2="${y.toFixed(2)}" />`;
    })
    .join("");

  const putY = moneyTickerY(spec.putIn, spec.min, spec.max, chartTop, chartHeight);
  const xLabels = frames
    .map((frame, i) => {
      if (frames.length > 5 && i !== 0 && i !== frames.length - 1 && i % 2 === 1) return "";
      const x = moneyTickerXAt(i, frames.length);
      const short = pacificDayLabel(frame.at).replace(/,.*/, "") || `M${i + 1}`;
      return `<text class="money-ticker-axis" x="${x.toFixed(2)}" y="214" text-anchor="middle">${escapeHtml(short)}</text>`;
    })
    .join("");

  const lines = spec.series
    .map((series) => {
      const d = tickerPathForSeries(series.values, spec.min, spec.max, chartTop, chartHeight, series.seed);
      return `<path class="money-ticker-line" data-series="${escapeHtml(series.id)}" d="${d}" stroke="${escapeHtml(series.color)}" fill="none" stroke-width="${series.width || 1.6}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"><title>${escapeHtml(series.label)}</title></path>`;
    })
    .join("");

  const playProgress =
    typeof moneyTicker.progress === "number" ? moneyTicker.progress : moneyTicker.index || 0;
  const playX = moneyTickerXAt(playProgress, frames.length);
  const frame = frames[Math.min(frames.length - 1, Math.round(playProgress))] || frames[frames.length - 1];
  let dotValue = frame ? frame.total : spec.putIn;
  if (moneyTicker.diagram === "island") {
    const values = frames.map((f) => f.total);
    const span = spec.max - spec.min || 1;
    dotValue = sampleJaggedValue(values, 7, playProgress, span);
  } else if (spec.liveSeries !== "total" && frame) {
    if (moneyTicker.diagram === "tribes" && frame.tribes) dotValue = frame.tribes[spec.liveSeries] ?? dotValue;
    else if (moneyTicker.diagram === "contestants" && frame.books) dotValue = frame.books[spec.liveSeries] ?? dotValue;
  }
  const dotY = moneyTickerY(dotValue, spec.min, spec.max, chartTop, chartHeight);
  const showDot = moneyTicker.diagram === "island";

  return `<svg class="money-ticker-svg" viewBox="0 0 640 222" role="img" aria-label="${escapeHtml(spec.aria)}">
    <defs>
      <clipPath id="money-ticker-clip">
        <rect data-ticker-clip x="0" y="0" width="${Math.max(playX + 4, 40).toFixed(2)}" height="222" />
      </clipPath>
    </defs>
    <text class="money-ticker-panel-label" x="36" y="14">${escapeHtml(spec.title)}</text>
    ${yLabels}
    <line class="money-ticker-putin" x1="36" y1="${putY.toFixed(2)}" x2="628" y2="${putY.toFixed(2)}" />
    <g clip-path="url(#money-ticker-clip)">
      ${lines}
      ${
        showDot
          ? `<circle class="money-ticker-pot-dot" data-ticker-pot-dot cx="${playX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="3.4" fill="${escapeHtml(spec.strokeForDot)}" />`
          : `<circle class="money-ticker-pot-dot" data-ticker-pot-dot cx="-20" cy="-20" r="0" fill="transparent" />`
      }
    </g>
    <line class="money-ticker-playhead" data-ticker-playhead x1="${playX}" y1="16" x2="${playX}" y2="198" />
    ${xLabels}
  </svg>`;
}

function moneyTickerLegendHtml(season, frames) {
  const spec = moneyTickerDiagramSeries(season, frames);
  return (spec.legend || [])
    .map(
      (item) =>
        `<li><span class="swatch" style="background:${escapeHtml(item.color)}"></span>${escapeHtml(item.label)}</li>`
    )
    .join("");
}

function refreshMoneyTickerChart() {
  const root = moneyTicker.root;
  const season = moneyTicker.season;
  if (!root || !season || !moneyTicker.frames.length) return;
  const plot = root.querySelector(".money-ticker-plot");
  const legend = root.querySelector(".money-ticker-legend");
  if (plot) plot.innerHTML = renderMoneyTickerSvg(season, moneyTicker.frames);
  if (legend) legend.innerHTML = moneyTickerLegendHtml(season, moneyTicker.frames);
  setMoneyTickerProgress(moneyTicker.progress || moneyTicker.index || 0);
}

function bindMoneyTickerControls() {
  const root = moneyTicker.root;
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  root.addEventListener("click", (event) => {
    const skyBtn = event.target.closest("[data-ticker-sky]");
    if (skyBtn) {
      moneyTicker.skyOn = !moneyTicker.skyOn;
      skyBtn.setAttribute("aria-pressed", moneyTicker.skyOn ? "true" : "false");
      const chart = root.querySelector(".money-ticker-chart");
      if (chart) chart.classList.toggle("is-sky-on", moneyTicker.skyOn);
      syncMoneyTickerSky(moneyTicker.progress || 0);
      return;
    }
    const diagramBtn = event.target.closest("[data-ticker-diagram]");
    if (diagramBtn) {
      const next = diagramBtn.getAttribute("data-ticker-diagram");
      if (next && moneyTickerAllowedDiagrams().includes(next) && next !== moneyTicker.diagram) {
        stopMoneyTickerPlayback();
        moneyTicker.diagram = next;
        root.querySelectorAll("[data-ticker-diagram]").forEach((btn) => {
          btn.setAttribute("aria-selected", btn === diagramBtn ? "true" : "false");
        });
        refreshMoneyTickerChart();
      }
      return;
    }
    const rangeBtn = event.target.closest("[data-ticker-range]");
    if (rangeBtn) {
      const next = rangeBtn.getAttribute("data-ticker-range");
      if (next && moneyTickerAllowedRanges().includes(next) && next !== moneyTicker.range) {
        stopMoneyTickerPlayback();
        moneyTicker.range = next;
        mountMoneyTicker(moneyTicker.season, { keepEnd: true });
      }
      return;
    }
    const speedBtn = event.target.closest("[data-ticker-speed]");
    if (speedBtn) {
      const speed = Number(speedBtn.getAttribute("data-ticker-speed"));
      if (!Number.isNaN(speed)) setMoneyTickerSpeed(speed);
      return;
    }
    const playBtn = event.target.closest("[data-ticker-play]");
    if (playBtn) {
      if (moneyTicker.playing) {
        stopMoneyTickerPlayback();
        return;
      }
      moneyTicker.autoplayDone = true;
      startMoneyTickerPlayback({
        fromStart: (moneyTicker.progress || 0) >= moneyTicker.frames.length - 1 - 0.001
      });
    }
  });

  root.addEventListener("input", (event) => {
    const scrub = event.target.closest("[data-ticker-scrub]");
    if (!scrub) return;
    moneyTicker.autoplayDone = true;
    stopMoneyTickerPlayback();
    setMoneyTickerIndex(Number(scrub.value));
  });
}

function mountMoneyTicker(season, opts) {
  const root = document.getElementById("money-ticker");
  if (!root) return;
  moneyTicker.root = root;
  moneyTicker.season = season;
  const homeMode =
    root.getAttribute("data-ticker-mode") === "home" ||
    document.documentElement.getAttribute("data-page") === "island";
  moneyTicker.mode = homeMode ? "home" : "episode";
  moneyTicker.ranges = homeMode ? MONEY_TICKER_HOME_RANGES.slice() : MONEY_TICKER_RANGES.slice();
  moneyTicker.diagrams = homeMode ? MONEY_TICKER_HOME_DIAGRAMS.slice() : MONEY_TICKER_DIAGRAMS.slice();
  if (homeMode && !(opts && opts.keepEnd)) {
    moneyTicker.range = "season";
    moneyTicker.diagram = "island";
  }
  if (!moneyTickerAllowedRanges().includes(moneyTicker.range)) {
    moneyTicker.range = moneyTickerAllowedRanges()[0] || "season";
  }
  if (!moneyTickerAllowedDiagrams().includes(moneyTicker.diagram)) {
    moneyTicker.diagram = moneyTickerAllowedDiagrams()[0] || "island";
  }
  moneyTicker.reducedMotion =
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  moneyTicker.sleevePutIn = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  moneyTicker.putIn = moneyPutInTotal(season);
  const livingPerTribe = Math.max(
    1,
    Math.round(((season.survivors || []).length || 12) / Math.max(1, (season.tribes || []).length || 2))
  );
  moneyTicker.tribePutIn = roundMoney(moneyTicker.sleevePutIn * livingPerTribe);
  moneyTicker.frames = buildTickerFrames(season, moneyTicker.range);
  if (!moneyTicker.frames.length) {
    root.innerHTML = "";
    root.hidden = true;
    return;
  }
  root.hidden = false;
  const keepEnd = opts && opts.keepEnd;
  const end = moneyTicker.frames.length - 1;
  moneyTicker.index = end;
  moneyTicker.progress = end;

  const speeds = MONEY_TICKER_SPEEDS.map((s) => {
    const on = s === moneyTicker.speed;
    return `<button type="button" class="money-ticker-speed" data-ticker-speed="${s}" aria-pressed="${on ? "true" : "false"}">${s}x</button>`;
  }).join("");

  const rangeLabels = {
    week: "Week",
    season: "Season"
  };
  /* Episode keeps both range tabs (data-ticker-range="week" / "season"). */
  const rangeTabs = moneyTickerAllowedRanges()
    .map((id) => {
      const on = moneyTicker.range === id;
      const label = rangeLabels[id] || id;
      return `<button type="button" role="tab" data-ticker-range="${id}" aria-selected="${on ? "true" : "false"}">${label}</button>`;
    })
    .join("");

  const diagramLabelList = [
    ["island", "Island"],
    ["tribes", "Tribes"],
    ["contestants", "Contestants"]
  ];
  const diagramTabs = diagramLabelList
    .filter(([id]) => moneyTickerAllowedDiagrams().includes(id))
    .map(([id, label]) => {
      const on = moneyTicker.diagram === id;
      return `<button type="button" role="tab" data-ticker-diagram="${id}" aria-selected="${on ? "true" : "false"}">${label}</button>`;
    })
    .join("");

  const lede = homeMode
    ? "See how each tribe and contestant did in the Episode."
    : "Watch the island, the tribes, or every contestant sleeve. Dotted line is money put in.";

  root.innerHTML = `
    <div class="money-ticker-head">
      <p class="money-ticker-kicker">Replay the books</p>
      <p class="money-ticker-lede">${lede}</p>
    </div>
    <div class="money-ticker-toolbar">
      <div class="money-ticker-range" role="tablist" aria-label="Time range">
        ${rangeTabs}
      </div>
      <div class="money-ticker-diagrams" role="tablist" aria-label="Diagram">
        ${diagramTabs}
      </div>
      <button type="button" class="money-ticker-sky-toggle" data-ticker-sky aria-pressed="${moneyTicker.skyOn ? "true" : "false"}">Sun &amp; moon</button>
    </div>
    <div class="money-ticker-chart${moneyTicker.skyOn ? " is-sky-on" : ""}">
      <div class="money-ticker-sky" aria-hidden="true">${renderMoneyTickerSkySvg()}</div>
      <div class="money-ticker-plot">${renderMoneyTickerSvg(season, moneyTicker.frames)}</div>
    </div>
    <div class="money-ticker-transport">
      <input class="money-ticker-scrub" data-ticker-scrub type="range" min="0" max="${moneyTicker.frames.length - 1}" value="${moneyTicker.progress || moneyTicker.index}" step="0.01" aria-label="Scrub marks" />
      <div class="money-ticker-controls">
        <button type="button" class="money-ticker-play" data-ticker-play aria-pressed="false"><span aria-hidden="true">▶</span> Play</button>
        <div class="money-ticker-speeds" role="group" aria-label="Playback speed">${speeds}</div>
      </div>
      <p class="money-ticker-stamp" data-ticker-stamp></p>
    </div>
    <ul class="money-ticker-legend">${moneyTickerLegendHtml(season, moneyTicker.frames)}</ul>
    <div class="money-ticker-foot">
      <p class="money-ticker-live" data-ticker-live>${escapeHtml(potMoney(moneyTicker.frames[moneyTicker.index].total))}</p>
      <p class="money-ticker-chg" data-ticker-live-chg></p>
    </div>`;

  bindMoneyTickerControls();
  setMoneyTickerProgress(moneyTicker.progress);
  if (!(opts && opts.keepEnd)) {
    armMoneyTickerAutoplay();
  }
}

function renderEpisode(season) {
  renderEpisodeDays(season);
  const totals = document.getElementById("episode-tribe-totals");
  if (totals) {
    totals.innerHTML = (season.tribes || [])
      .map((t) => {
        return `<div class="total-card ${t.id}">
        <h3>${escapeHtml(tribeChromeName(t))}</h3>
        <p class="pct">${pct(combinedWeekPctOf(t))}</p>
        <p>${t.livingCount} standing · combined week % · ${pct(combinedDayPctOf(t))} day</p>
      </div>`;
      })
      .join("");
  }
  const banner = document.getElementById("season-banner");
  if (banner) banner.textContent = season.statusLabel || "Live · S1E01 · Friday tribal Aug 28";
  renderEpisodeLiveIndicator(season);
  mountMoneyTicker(season);
  renderEpisodeHoldings(season);
  const body = document.getElementById("episode-marks-body");
  if (body) {
    body.innerHTML = (season.survivors || [])
      .map((s) => {
        const tribe = tribeById(season, s.tribeId);
        const immune = s.immune ? " · immune" : "";
        return `<tr>
      <td><span class="dot ${s.tribeId}"></span>${survivorLabel(s, { link: true, tiny: true })}</td>
      <td>${escapeHtml(tribeChromeName(tribe || s.tribeId))}</td>
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
  renderHomeTorches(season);
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
