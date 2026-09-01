/* Last Trader Standing — torchlight UI. Reads the derived season board; never invents marks. */

function assetBase() {
  const raw = document.documentElement.getAttribute("data-base");
  return raw == null ? "" : raw;
}

function isSafePublicPath(path) {
  const raw = String(path || "").trim();
  if (!raw) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return false;
  if (raw.startsWith("//") || raw.startsWith("\\")) return false;
  if (raw.includes("..") || raw.includes("\\")) return false;
  return true;
}

function assetUrl(path) {
  if (!isSafePublicPath(path)) return "";
  const raw = String(path).trim();
  if (raw.startsWith("/")) return raw;
  return assetBase() + raw;
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
  const page = document.documentElement.getAttribute("data-page");
  if (page === "island" || page === "episode") {
    return "#castaway=" + encodeURIComponent(slug);
  }
  return assetBase() + "index.html#castaway=" + encodeURIComponent(slug);
}

function nickIdOf(s) {
  const slug = slugOf(s);
  const entry = Object.entries(LEGACY_SLUGS).find((pair) => pair[1] === slug);
  return entry ? entry[0] : slug;
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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function holdBookWasted(s, season) {
  if (!s || (s.status !== "jury" && s.status !== "boot")) return false;
  const ep = currentPageEpisode(season);
  return Boolean(ep && Number(ep.number) >= 2);
}

function holdBookHtml(s, tribe, season, rank) {
  const wasted = holdBookWasted(s, season);
  const legs = wasted ? [] : bookLegs(s);
  const week = weekPctOf(s);
  const day = dayPctOf(s);
  const model = escapeHtml(modelOf(s));
  const tribeName = tribeChromeName(tribe || s.tribeId);
  const face = s.portrait
    ? `<img src="${escapeHtml(assetUrl(s.portrait))}" alt="">`
    : "";
  const pad = rank < 10 ? "0" + rank : String(rank);
  const immune = s.immune ? `<span class="hold-tag">Immune</span>` : "";
  const bootTag = s.status === "jury" || s.status === "boot" ? `<span class="hold-tag">Voted out · jury</span>` : "";
  const legsId = `hold-legs-${escapeHtml(slugOf(s))}`;
  const hasLegs = legs.length > 0;
  const mark = wasted
    ? ""
    : `<span class="hold-mark">
        <span class="val">${money(s.bookUsd)}</span>
        <b class="${chgClass(week)}">${pct(week)} week</b>
        <b class="day ${chgClass(day)}">${pct(day)} today</b>
      </span>
      ${immune}${bootTag}`;
  const wastedStamp = wasted
    ? `<span class="hold-wasted" aria-hidden="true">WASTED</span>`
    : "";
  const wastedLabel = wasted ? ` aria-label="${model} · voted out"` : "";
  return `<article class="hold-book ${s.tribeId}${hasLegs ? "" : " is-empty"}${wasted ? " is-wasted" : ""}">
    <button type="button" class="hold-head" aria-expanded="false"${hasLegs ? ` aria-controls="${legsId}"` : ""} ${hasLegs ? "" : "disabled "}${wastedLabel}>
      <span class="hold-rank">${pad}</span>
      <span class="hold-face">${face}</span>
      <span class="hold-id">
        <strong>${model}</strong>
        <em>${escapeHtml(tribeName || "")}</em>
      </span>
      ${mark}
    </button>
    ${holdChips(legs)}
    <div class="hold-legs" id="${legsId}" hidden>${legs.map((p) => holdLegHtml(p, season, s.tribeId)).join("")}</div>
    ${wastedStamp}
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
  const letter = escapeHtml(survivor.monogram || survivor.name.slice(0, 1));
  return `<svg class="portrait" viewBox="0 0 100 100" role="img" aria-label="${escapeHtml(survivor.name)} totem">
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

function councilTorchCount(season, entry) {
  if (entry) {
    const votes = Array.isArray(entry.votes) ? entry.votes : [];
    if (votes.length > 0) return votes.length;
    const tribeId = entry.losingTribe;
    if (tribeId) {
      const onTribe = (season.survivors || []).filter((s) => s && s.tribeId === tribeId);
      if (onTribe.length) return onTribe.length;
    }
  }
  const tribes = (season.tribes || []).length || 2;
  const living = livingContestantCount(season);
  return Math.max(2, Math.round(living / tribes));
}

function councilTorchRowHtml(season, entry) {
  const count = councilTorchCount(season, entry);
  if (!entry) {
    return Array.from({ length: count }, () => torchSvg(false)).join("");
  }
  const snuffed =
    entry.torchSnuffed === true || entry.bootName || entry.boot || entry.bootId ? 1 : 0;
  const lit = Math.max(0, count - snuffed);
  return (
    Array.from({ length: lit }, () => torchSvg(true)).join("") +
    Array.from({ length: snuffed }, () => torchSvg(false)).join("")
  );
}


function hover3dWrap(innerHtml) {
  const zones = Array.from({ length: 8 }, () => '<span class="hover-3d-zone" aria-hidden="true"></span>').join("");
  return `<span class="hover-3d-face">${innerHtml}</span>${zones}`;
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
          const slug = slugOf(s);
          const face = s.portrait
            ? `<img class="portrait" src="${escapeHtml(assetUrl(s.portrait))}" alt="${escapeHtml(model)}">`
            : totemSvg(s, tribe);
          const mark =
            globalThis.LabLogos && typeof LabLogos.labMarkHtml === "function"
              ? LabLogos.labMarkHtml({ slug: slug, className: "face-lab-mark" })
              : "";
          return `<a class="face-card hover-3d ${s.tribeId}" href="${escapeHtml(survivorHref(s))}" data-castaway="${escapeHtml(slug)}">${hover3dWrap(`
        <span class="face-photo">${face}</span>
        <span class="face-id">
          ${mark ? `<span class="face-lab">${mark}</span>` : ""}
          <h3 class="face-name">${escapeHtml(model)}</h3>
        </span>
        <p class="face-tribe">${escapeHtml(tribeChromeName(tribe))}</p>
      `)}</a>`;
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

function castInTribeOrder(season) {
  const tribes = season.tribes || [];
  const people = [];
  tribes.forEach((tribe) => {
    (season.survivors || [])
      .filter((s) => s && s.tribeId === tribe.id)
      .forEach((s) => people.push(s));
  });
  if (!people.length) {
    (season.survivors || []).forEach((s) => people.push(s));
  }
  return people;
}

const LETTERS_PREVIEW_ROWS = 2;
const LETTERS_DESKTOP_COLS = 2;

function lettersPreviewCount() {
  const mobile =
    typeof window.matchMedia === "function" && window.matchMedia("(max-width: 720px)").matches;
  return LETTERS_PREVIEW_ROWS * (mobile ? 1 : LETTERS_DESKTOP_COLS);
}

function syncLettersMore(list, btn) {
  if (!list || !btn) return;
  const count = list.querySelectorAll(".letter-item").length;
  const extra = count > lettersPreviewCount();
  btn.hidden = !extra;
  if (!extra) {
    list.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Show more";
  }
}

function initLettersMore() {
  const list = document.getElementById("letter-list");
  const btn = document.getElementById("letter-more");
  if (!list || !btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    const open = list.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Show less" : "Show more";
  });
  if (typeof window.matchMedia === "function") {
    const mq = window.matchMedia("(max-width: 720px)");
    const onBreak = () => syncLettersMore(list, btn);
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onBreak);
    else if (typeof mq.addListener === "function") mq.addListener(onBreak);
  }
}

function renderLettersFromHome(season) {
  const list = document.getElementById("letter-list");
  if (!list) return;
  const Labs = globalThis.LabLogos;
  const rows = castInTribeOrder(season)
    .map((s) => {
      const slug = slugOf(s);
      const model = modelOf(s);
      const ceo = Labs && typeof Labs.ceoFor === "function" ? Labs.ceoFor(slug) : null;
      if (!ceo || !ceo.twitter || !ceo.name) return "";
      const href =
        Labs && typeof Labs.twitterUrlFor === "function"
          ? Labs.twitterUrlFor(slug)
          : "https://x.com/" + encodeURIComponent(ceo.twitter);
      if (!href) return "";
      const mark =
        Labs && typeof Labs.labMarkHtml === "function" ? Labs.labMarkHtml({ slug: slug }) : "";
      return `<li class="letter-item ${escapeHtml(s.tribeId || "")}">
      <a class="letter-row" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
        ${mark}
        <span class="letter-copy">
          <span class="letter-model">${escapeHtml(model)}</span>
          <span class="letter-from">Letter from ${escapeHtml(ceo.name)}</span>
        </span>
        <span class="letter-handle">@${escapeHtml(ceo.twitter)}</span>
      </a>
    </li>`;
    })
    .filter(Boolean)
    .join("");
  list.innerHTML = rows;
  list.classList.remove("is-open");
  const btn = document.getElementById("letter-more");
  if (btn) {
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Show more";
    syncLettersMore(list, btn);
  }
  initLettersMore();
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
      return `<a class="money-row ${s.tribeId}" href="${escapeHtml(survivorHref(s))}" data-castaway="${escapeHtml(slugOf(s))}" style="--i:${i}">
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

function episodeIsClosed(ep) {
  return ep && (ep.status === "closed" || ep.status === "cut");
}

function episodeKicker(ep) {
  if (!ep) return "Cut";
  if (ep.status === "live") return "Now burning";
  if (episodeIsClosed(ep)) return "Closed";
  return ep.status || "Cut";
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
        <p class="ep-kicker">${escapeHtml(episodeKicker(ep))}</p>
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

const CASTAWAY_DOW = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

let castawaySeason = null;
let castawayThreads = null;
let castawayThreadsPromise = null;
let castawayReturnFocus = null;
let castawayPlayToken = 0;

function parseCastawayHash(rawHash) {
  const raw = String(rawHash == null ? location.hash : rawHash).replace(/^#/, "");
  if (!raw.startsWith("castaway=")) return null;
  const params = new URLSearchParams(raw);
  const slug = params.get("castaway");
  if (!slug) return null;
  return {
    slug: LEGACY_SLUGS[slug] || slug,
    view: params.get("view") || "",
    thread: params.get("thread") || ""
  };
}

function parseCastawayHref(href) {
  const raw = String(href || "");
  const hashIndex = raw.indexOf("#");
  if (hashIndex < 0) return null;
  return parseCastawayHash(raw.slice(hashIndex));
}

function isSamePageCastawayHref(href) {
  const raw = String(href || "");
  if (raw.charAt(0) === "#") return true;
  try {
    const url = new URL(raw, location.href);
    return url.pathname === location.pathname;
  } catch {
    return false;
  }
}

function castawayHashFor(slug, extra) {
  const params = new URLSearchParams();
  params.set("castaway", slug);
  if (extra && extra.view) params.set("view", extra.view);
  if (extra && extra.thread) params.set("thread", extra.thread);
  return "#" + params.toString();
}

function threadTimeScore(thread) {
  const raw = String((thread && thread.dayLabel) || "")
    .split("·")[0]
    .trim();
  const match = raw.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b(?:\s+(.+))?$/i);
  if (!match) return 0;
  const day = CASTAWAY_DOW[match[1].toLowerCase()] || 0;
  const rest = String(match[2] || "")
    .trim()
    .toLowerCase();
  let mins = 0;
  if (rest === "dinner") mins = 19 * 60;
  else if (rest === "lunch") mins = 12 * 60 + 30;
  else {
    const time = rest.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (time) {
      let hour = parseInt(time[1], 10);
      const minute = parseInt(time[2], 10);
      const ap = String(time[3] || "").toLowerCase();
      if (ap === "pm" && hour < 12) hour += 12;
      if (ap === "am" && hour === 12) hour = 0;
      mins = hour * 60 + minute;
    }
  }
  return day * 1440 + mins;
}

function findCastaway(season, slug) {
  const resolved = LEGACY_SLUGS[slug] || slug;
  return (season.survivors || []).find((x) => {
    const now = slugOf(x);
    const model = survivorSlug(modelOf(x));
    return now === resolved || model === resolved || now === slug || model === slug;
  });
}

function conversationHasCastaway(conversation, survivor) {
  if (!conversation || !survivor) return false;
  const nick = nickIdOf(survivor);
  const slug = slugOf(survivor);
  const name = modelOf(survivor);
  return (conversation.participants || []).some((p) => {
    if (!p) return false;
    if (p.id === nick || p.id === slug || LEGACY_SLUGS[p.id] === slug) return true;
    if (p.name === name || p.name === survivor.name) return true;
    return survivorSlug(p.name) === slug;
  });
}

function collectLiveCastawayThreads() {
  const keys = [
    "WEDNESDAY_DINNER_CONVERSATIONS",
    "THURSDAY_LUNCH_CONVERSATIONS",
    "THURSDAY_DINNER_CONVERSATIONS",
    "FRIDAY_LUNCH_CONVERSATIONS",
    "SATURDAY_LUNCH_CONVERSATIONS",
    "SATURDAY_DINNER_CONVERSATIONS",
    "SUNDAY_LUNCH_CONVERSATIONS"
  ];
  const byId = {};
  const order = [];
  keys.forEach((key) => {
    const map = window[key];
    if (!map || typeof map !== "object") return;
    Object.keys(map).forEach((id) => {
      const raw = map[id];
      if (!raw || !Array.isArray(raw.messages) || !raw.messages.length) return;
      const next = Object.assign({ id: raw.id || id }, raw);
      if (!next.id) return;
      if (!byId[next.id]) order.push(next.id);
      byId[next.id] = next;
    });
  });
  return order.map((id) => byId[id]);
}

async function loadCastawayThreads() {
  if (Array.isArray(castawayThreads)) return castawayThreads;
  if (castawayThreadsPromise) return castawayThreadsPromise;
  castawayThreadsPromise = (async () => {
    const paths = [
      assetBase() + "seasons/1/threads.json",
      "seasons/1/threads.json",
      "threads.json",
      "./threads.json"
    ];
    for (let i = 0; i < paths.length; i += 1) {
      try {
        const res = await fetch(paths[i], { cache: "no-store" });
        if (!res.ok) continue;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data && data.conversations;
        if (Array.isArray(list) && list.length) {
          castawayThreads = list;
          return list;
        }
      } catch {
        /* try next */
      }
    }
    castawayThreads = collectLiveCastawayThreads();
    return castawayThreads;
  })();
  return castawayThreadsPromise;
}

function threadsForCastaway(survivor, kind) {
  const list = (castawayThreads || []).filter((thread) => conversationHasCastaway(thread, survivor));
  const filtered = kind
    ? list.filter((thread) => {
        const count = (thread.participants || []).length;
        const inferred = thread.kind || (count > 2 ? "group" : "dm");
        return inferred === kind;
      })
    : list;
  return filtered.slice().sort((a, b) => {
    const diff = threadTimeScore(b) - threadTimeScore(a);
    if (diff !== 0) return diff;
    return String((a && a.id) || "").localeCompare(String((b && b.id) || ""));
  });
}

function enrichCastawayThread(thread, season) {
  const next = Object.assign({}, thread);
  const cast = (window.CampfireEngine && window.CampfireEngine.cast) || {};
  const survivors = (season && season.survivors) || [];
  next.participants = (thread.participants || []).map((p) => {
    const out = Object.assign({}, p);
    if (out.portrait && isSafePublicPath(out.portrait)) {
      if (out.portrait.startsWith("/") || (assetBase() && out.portrait.indexOf(assetBase()) === 0)) {
        return out;
      }
      out.portrait = assetBase() + out.portrait;
      return out;
    }
    const person = cast[p.id];
    if (person && isSafePublicPath(person.portrait)) {
      out.portrait = assetBase() + person.portrait;
      out.tribe = out.tribe || person.tribe;
      return out;
    }
    const match = survivors.find((s) => slugOf(s) === LEGACY_SLUGS[p.id] || slugOf(s) === survivorSlug(p.name));
    if (match && match.portrait) {
      out.portrait = assetUrl(match.portrait);
      out.tribe = out.tribe || match.tribeId;
    }
    return out;
  });
  return next;
}

function otherThreadNames(thread, survivor) {
  const slug = slugOf(survivor);
  const nick = nickIdOf(survivor);
  return (thread.participants || [])
    .filter((p) => p && p.id !== nick && p.id !== slug && survivorSlug(p.name) !== slug)
    .map((p) => p.name || p.id)
    .filter(Boolean);
}

function phoneIconSvg() {
  return `<svg class="castaway-msg-svg" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M9.1 4.2c.8-.8 2-.8 2.8 0l2.1 2.1c.7.7.8 1.8.2 2.6l-1.5 2c-.3.5-.3 1.1.1 1.5 1.4 1.6 3 3.2 4.6 4.6.4.4 1 .4 1.5.1l2-1.5c.8-.6 1.9-.5 2.6.2l2.1 2.1c.8.8.8 2 0 2.8l-1.3 1.3c-1 .9-2.4 1.3-3.8 1.1-3.6-.6-7.7-3.4-11.1-6.8S5.4 8.9 4.8 5.3c-.2-1.4.2-2.8 1.1-3.8L9.1 4.2z"/></svg>`;
}

function groupIconSvg() {
  return `<svg class="castaway-msg-svg" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7 8.2h12.5c1.4 0 2.5 1.1 2.5 2.5v6.2c0 1.4-1.1 2.5-2.5 2.5h-4.8L10 23.3c-.5.4-1.2 0-1.1-.6l.4-3.3H7c-1.4 0-2.5-1.1-2.5-2.5V10.7C4.5 9.3 5.6 8.2 7 8.2z"/><path fill="currentColor" d="M14.2 5.4h10.3c1.4 0 2.5 1.1 2.5 2.5v5.4c0 1.2-.8 2.2-2 2.4-.2-1.7-1.6-3-3.4-3h-2.1V7.9c0-1.4-1.1-2.5-2.5-2.5h-2.8z" opacity=".72"/></svg>`;
}

function getCastawaySheet() {
  return document.getElementById("castaway-sheet");
}

function ensureCastawaySheet() {
  let root = getCastawaySheet();
  if (root) return root;
  root = document.createElement("div");
  root.id = "castaway-sheet";
  root.className = "castaway-sheet";
  root.hidden = true;
  root.setAttribute("aria-hidden", "true");
  root.innerHTML =
    '<div class="castaway-sheet-backdrop" data-castaway-dismiss></div>' +
    '<div class="castaway-sheet-panel" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="castaway-sheet-title">' +
    '<button type="button" class="castaway-sheet-close" data-castaway-dismiss aria-label="Close player">×</button>' +
    '<div class="castaway-sheet-body" id="castaway-sheet-body"></div>' +
    "</div>";
  document.body.appendChild(root);
  return root;
}

function hideCastawaySheet() {
  const root = getCastawaySheet();
  if (!root || root.hidden) return;
  castawayPlayToken += 1;
  root.hidden = true;
  root.setAttribute("aria-hidden", "true");
  document.body.classList.remove("castaway-sheet-open");
  document.removeEventListener("keydown", onCastawaySheetKeydown);
  const restore = castawayReturnFocus;
  castawayReturnFocus = null;
  if (restore && typeof restore.focus === "function") {
    try {
      restore.focus();
    } catch {
      /* ignore */
    }
  }
}

function closeCastawaySheet() {
  hideCastawaySheet();
  if (parseCastawayHash()) {
    history.replaceState(history.state, "", location.pathname + location.search);
  }
}

function onCastawaySheetKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeCastawaySheet();
    return;
  }
  if (event.key !== "Tab") return;
  const root = getCastawaySheet();
  if (!root || root.hidden) return;
  const focusable = root.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function paintCastawaySheet(season, parsed) {
  const root = ensureCastawaySheet();
  const body = document.getElementById("castaway-sheet-body");
  const panel = root.querySelector(".castaway-sheet-panel");
  if (!body || !parsed) return;
  const survivor = findCastaway(season, parsed.slug);
  if (!survivor) {
    body.innerHTML =
      '<p class="castaway-empty">That name is not on this island.</p>';
    return;
  }
  const tribe = tribeById(season, survivor.tribeId);
  const tribeName = tribeChromeName(tribe || survivor.tribeId);
  const model = modelOf(survivor);
  if (panel) {
    panel.className = "castaway-sheet-panel " + escapeHtml(survivor.tribeId || "");
  }
  const dms = threadsForCastaway(survivor, "dm");
  const groups = threadsForCastaway(survivor, "group");
  const view = parsed.view === "group" || parsed.view === "dm" ? parsed.view : "";
  const playing = view && parsed.thread
    ? (view === "group" ? groups : dms).find((thread) => thread.id === parsed.thread)
    : null;

  if (playing) {
    const names = (playing.participants || []).map((p) => p.name || p.id).filter(Boolean);
    const heading = names.length > 2
      ? names.slice(0, 2).join(" · ") + " +" + (names.length - 2)
      : names.join(" ↔ ") || playing.title || "Thread";
    body.innerHTML =
      '<div class="castaway-phone camp-chat-demo">' +
      '<div class="camp-chat-header">' +
      `<button type="button" class="camp-chat-back" data-castaway-view="${escapeHtml(view)}" aria-label="Back to thread list">‹</button>` +
      '<div class="camp-chat-header-meta">' +
      `<p class="camp-chat-title">${escapeHtml(playing.title || heading)}</p>` +
      `<p class="camp-chat-subtitle">${escapeHtml(playing.subtitle || playing.dayLabel || "")}</p>` +
      "</div></div>" +
      '<div class="camp-chat-thread" id="castaway-thread" aria-live="polite"></div>' +
      "</div>";
    playCastawayThread(playing, season);
    return;
  }

  const portrait = survivor.portrait
    ? `<img class="castaway-portrait" src="${escapeHtml(assetUrl(survivor.portrait))}" alt="${escapeHtml(model)}">`
    : totemSvg(survivor, tribe);
  const list = view === "group" ? groups : view === "dm" ? dms : null;
  const listHtml = list
    ? `<div class="castaway-thread-list">
        <p class="castaway-thread-kicker">${view === "group" ? "Group threads" : "Private DMs"}</p>
        ${
          list.length
            ? `<ul>${list
                .map((thread) => {
                  const others = otherThreadNames(thread, survivor);
                  const label = others.join(" · ") || thread.title || "Thread";
                  return `<li><button type="button" class="castaway-thread-row" data-castaway-thread="${escapeHtml(thread.id)}">
                    <span class="castaway-thread-day">${escapeHtml(thread.dayLabel || "")}</span>
                    <strong>${escapeHtml(label)}</strong>
                    <em>${escapeHtml(thread.subtitle || thread.title || "")}</em>
                  </button></li>`;
                })
                .join("")}</ul>`
            : `<p class="castaway-empty">${view === "group" ? "No group fires on the tape yet." : "No private threads on the tape yet."}</p>`
        }
      </div>`
    : "";

  body.innerHTML =
    `<div class="castaway-card">
      ${portrait}
      <p class="castaway-kicker">${escapeHtml(tribeName)}</p>
      <h2 id="castaway-sheet-title">${escapeHtml(model)}</h2>
      <div class="castaway-stats">
        <div><span>Book</span>${money(survivor.bookUsd)}</div>
        <div><span>Day</span>${pct(dayPctOf(survivor))}</div>
        <div><span>Week</span>${pct(weekPctOf(survivor))}</div>
      </div>
      <div class="castaway-actions">
        <button type="button" class="castaway-msg-btn${view === "dm" ? " is-on" : ""}" data-castaway-view="dm"${dms.length ? "" : " disabled"} aria-pressed="${view === "dm" ? "true" : "false"}">
          <span class="castaway-msg-icon is-phone">${phoneIconSvg()}</span>
          <span class="castaway-msg-copy"><b>DMs</b><em>${dms.length ? dms.length + (dms.length === 1 ? " thread" : " threads") : "None yet"}</em></span>
        </button>
        <button type="button" class="castaway-msg-btn${view === "group" ? " is-on" : ""}" data-castaway-view="group"${groups.length ? "" : " disabled"} aria-pressed="${view === "group" ? "true" : "false"}">
          <span class="castaway-msg-icon is-group">${groupIconSvg()}</span>
          <span class="castaway-msg-copy"><b>Group</b><em>${groups.length ? groups.length + (groups.length === 1 ? " thread" : " threads") : "None yet"}</em></span>
        </button>
      </div>
      ${listHtml}
    </div>`;
}

async function playCastawayThread(thread, season) {
  const token = ++castawayPlayToken;
  const el = document.getElementById("castaway-thread");
  if (!el) return;
  const conversation = enrichCastawayThread(thread, season);
  const play = window.CampChat && window.CampChat.playConversation;
  if (typeof play !== "function") {
    (conversation.messages || []).forEach((msg) => {
      const p = document.createElement("p");
      p.className = "castaway-empty";
      p.textContent = (msg.from || "") + ": " + (msg.text || "");
      el.appendChild(p);
    });
    return;
  }
  const reduce = typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  await play(el, conversation, {
    typingMs: reduce ? 0 : 900,
    msgAnimMs: reduce ? 0 : 640,
    isAborted: function () {
      return token !== castawayPlayToken;
    }
  });
}

async function openCastawaySheet(slug, extra, trigger) {
  const season = castawaySeason;
  if (!season || !slug) return;
  const parsed = {
    slug: LEGACY_SLUGS[slug] || slug,
    view: (extra && extra.view) || "",
    thread: (extra && extra.thread) || ""
  };
  const root = ensureCastawaySheet();
  if (root.hidden) {
    castawayReturnFocus =
      trigger && typeof trigger.focus === "function"
        ? trigger
        : document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("castaway-sheet-open");
    document.addEventListener("keydown", onCastawaySheetKeydown);
  }
  await loadCastawayThreads();
  if (!getCastawaySheet() || getCastawaySheet().hidden) return;
  paintCastawaySheet(season, parsed);
  const focusTarget =
    root.querySelector("[data-castaway-view].is-on") ||
    root.querySelector(".castaway-sheet-close") ||
    root.querySelector(".castaway-sheet-panel");
  if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
}

function syncCastawayFromHash() {
  const parsed = parseCastawayHash();
  if (!parsed) {
    hideCastawaySheet();
    return;
  }
  openCastawaySheet(parsed.slug, { view: parsed.view, thread: parsed.thread });
}

function setCastawayLocation(slug, extra, push) {
  const next = castawayHashFor(slug, extra);
  if (location.hash === next) {
    syncCastawayFromHash();
    return;
  }
  if (push) history.pushState({ castaway: true }, "", next);
  else history.replaceState({ castaway: true }, "", next);
  syncCastawayFromHash();
}

function onCastawayDocumentClick(event) {
  const dismiss = event.target.closest("[data-castaway-dismiss]");
  if (dismiss && getCastawaySheet() && getCastawaySheet().contains(dismiss)) {
    event.preventDefault();
    closeCastawaySheet();
    return;
  }

  const viewBtn = event.target.closest("[data-castaway-view]");
  if (viewBtn && getCastawaySheet() && getCastawaySheet().contains(viewBtn)) {
    event.preventDefault();
    const parsed = parseCastawayHash() || {};
    const nextView = viewBtn.getAttribute("data-castaway-view") || "";
    const slug = parsed.slug;
    if (!slug) return;
    const already = parsed.view === nextView && !parsed.thread;
    setCastawayLocation(slug, already ? {} : { view: nextView }, true);
    return;
  }

  const threadBtn = event.target.closest("[data-castaway-thread]");
  if (threadBtn && getCastawaySheet() && getCastawaySheet().contains(threadBtn)) {
    event.preventDefault();
    const parsed = parseCastawayHash();
    if (!parsed) return;
    setCastawayLocation(
      parsed.slug,
      { view: parsed.view || "dm", thread: threadBtn.getAttribute("data-castaway-thread") },
      true
    );
    return;
  }

  const link = event.target.closest("a[href], [data-castaway]");
  if (!link || link.closest("#castaway-sheet")) return;
  const href = link.getAttribute("href") || "";
  const fromHref = parseCastawayHref(href);
  const fromData = link.getAttribute("data-castaway");
  const slug = (fromHref && fromHref.slug) || (fromData ? LEGACY_SLUGS[fromData] || fromData : "");
  if (!slug) return;
  if (href && !isSamePageCastawayHref(href) && fromHref) return;
  event.preventDefault();
  setCastawayLocation(slug, fromHref ? { view: fromHref.view, thread: fromHref.thread } : {}, true);
}

function initCastawaySheet(season) {
  castawaySeason = season;
  const page = document.documentElement.getAttribute("data-page");
  if (page === "survivor") {
    const slug =
      LEGACY_SLUGS[document.documentElement.getAttribute("data-survivor")] ||
      document.documentElement.getAttribute("data-survivor");
    if (slug) {
      location.replace(assetBase() + "index.html#castaway=" + encodeURIComponent(slug));
      return;
    }
  }
  ensureCastawaySheet();
  if (!document.documentElement.dataset.castawayBound) {
    document.documentElement.dataset.castawayBound = "true";
    document.addEventListener("click", onCastawayDocumentClick, true);
    window.addEventListener("hashchange", syncCastawayFromHash);
    window.addEventListener("popstate", syncCastawayFromHash);
  }
  loadCastawayThreads();
  syncCastawayFromHash();
}

function renderSurvivor(season) {
  initCastawaySheet(season);
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
      ${face ? `<a class="day-face" href="${escapeHtml(survivorHref(s))}" data-castaway="${escapeHtml(slugOf(s))}">${face}</a>` : ""}
      <a class="day-id" href="${escapeHtml(survivorHref(s))}" data-castaway="${escapeHtml(slugOf(s))}">
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

function currentPageEpisode(season) {
  const num = Number(document.documentElement.dataset.episode);
  if (Number.isFinite(num) && Array.isArray(season.episodes)) {
    const match = season.episodes.find((ep) => ep && ep.number === num);
    if (match) return match;
  }
  return season.episode || null;
}

function tribalLogForPage(season) {
  const all = Array.isArray(season.tribalLog) ? season.tribalLog : [];
  const ep = currentPageEpisode(season);
  if (ep && ep.id) return all.filter((entry) => entry && entry.episode === ep.id);
  return [];
}

function priorTribalLog(season) {
  const all = Array.isArray(season.tribalLog) ? season.tribalLog : [];
  const ep = currentPageEpisode(season);
  if (!ep || !ep.id) return [];
  return all.filter((entry) => entry && entry.episode && entry.episode !== ep.id);
}

function renderEpisodeDays(season) {
  const pageEp = currentPageEpisode(season);
  const specs =
    (pageEp && Array.isArray(pageEp.days) && pageEp.days) ||
    (season.episode && Array.isArray(season.episode.days) && season.episode.days) ||
    [];
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
  homeBooksHandler: null,
  scrollObserver: null,
  progress: 0,
  raf: null,
  playStartedAt: 0,
  playFromProgress: 0,
  skyOn: false,
  axisMax: 5,
  chapters: [],
  chapterIndex: 0
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

function tickerIsEpisodeTwo(episode) {
  return Boolean(episode && (episode.id === "s1e02" || Number(episode.number) === 2));
}

function moneyPutInTotal(season, episode, range) {
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const castN = (season.survivors || []).length || (season.cast || []).length || 12;
  const original = typeof season.islandGivenStartUsd === "number" ? season.islandGivenStartUsd : start * castN;
  /* Episode 2 week is funded: dotted island bar is islandGivenUsd, not the $120 open. */
  if (range === "week" && tickerIsEpisodeTwo(episode) && typeof season.islandGivenUsd === "number") {
    return season.islandGivenUsd;
  }
  return original;
}

function tickerSleevePutIn(season, episode, range) {
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  if (tickerIsEpisodeTwo(episode) && range !== "open") {
    const extra = typeof season.islandEpisode2TopUpEachUsd === "number" ? season.islandEpisode2TopUpEachUsd : 10;
    return start + extra;
  }
  return start;
}

function episodeDiagramStartId(episode) {
  if (!episode) return "";
  if (episode.diagramStartSnapshotId) return episode.diagramStartSnapshotId;
  return tickerIsEpisodeTwo(episode) ? "s1e02-cash-add" : "";
}

function snapshotsFromEpisodeStart(snaps, episode) {
  const list = Array.isArray(snaps) ? snaps.slice() : [];
  const startId = episodeDiagramStartId(episode);
  if (!startId) return list;
  const idx = list.findIndex((snap) => snap && snap.id === startId);
  return idx >= 0 ? list.slice(idx) : list;
}

function snapshotsInTickerRange(snapshots, episode, range) {
  const all = Array.isArray(snapshots) ? snapshots.slice() : [];
  if (!all.length) return [];
  if (range !== "week") return all;
  const ep = episode || {};
  const weekStart = ep.weekStart ? Date.parse(ep.weekStart + "T00:00:00-07:00") : NaN;
  const weekEnd = ep.weekEnd
    ? Date.parse(ep.weekEnd + "T23:59:59-07:00")
    : ep.tribalAt
      ? Date.parse(ep.tribalAt) + 36 * 60 * 60 * 1000
      : NaN;
  if (Number.isNaN(weekStart) || Number.isNaN(weekEnd)) return all;
  let filtered = all.filter((snap) => {
    const t = Date.parse(snap.at);
    return !Number.isNaN(t) && t >= weekStart && t <= weekEnd;
  });
  /* Episode 2 week starts after the $10 cash add so opening numbers already carry the extra sleeve. */
  filtered = snapshotsFromEpisodeStart(filtered, ep);
  return filtered.length ? filtered : all;
}

function islandHostAddUsd(season) {
  const given = islandGivenUsd(season);
  const start = moneyPutInTotal(season);
  if (given == null || Number.isNaN(given) || given <= start + 0.00005) return null;
  return roundMoney(given - start);
}

function islandHostAddEpisodeLabel(seasonOrEpisode) {
  const n = Number(
    seasonOrEpisode && seasonOrEpisode.number != null
      ? seasonOrEpisode.number
      : seasonOrEpisode && seasonOrEpisode.episode && seasonOrEpisode.episode.number
  );
  return Number.isFinite(n) && n > 0 ? `E${n}` : "E2";
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

function pacificDateParts(iso) {
  if (!iso) return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).formatToParts(d);
    const get = (type) => {
      const part = parts.find((p) => p.type === type);
      return part ? part.value : "";
    };
    const month = get("month");
    const day = get("day");
    const year = get("year");
    if (!month || !day || !year) return null;
    return {
      weekday: get("weekday"),
      month,
      day,
      year,
      key: `${year}-${month}-${day}`
    };
  } catch {
    return null;
  }
}

function formatPacificDateRange(startIso, endIso) {
  const start = pacificDateParts(startIso);
  const end = pacificDateParts(endIso) || start;
  if (!start) return "";
  if (!end || start.key === end.key) return `${start.month} ${start.day}`;
  if (start.month === end.month && start.year === end.year) {
    return `${start.month} ${start.day}–${end.day}`;
  }
  if (start.year === end.year) return `${start.month} ${start.day}–${end.month} ${end.day}`;
  return `${start.month} ${start.day}, ${start.year}–${end.month} ${end.day}, ${end.year}`;
}

const MONEY_TICKER_WEEKDAYS = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" }
];
const MONEY_TICKER_WEEKDAY_SLOT = { Sun: 0, Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 4 };

function parseEpisodeWeekLabel(label) {
  const text = String(label || "");
  const hits = [
    ...text.matchAll(
      /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})\b/gi
    )
  ];
  const yearHit = text.match(/\b(20\d{2})\b/);
  const year = yearHit ? Number(yearHit[1]) : NaN;
  if (hits.length < 2 || !Number.isFinite(year)) return null;
  const months = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11
  };
  const toYmd = (monthName, day) => {
    const month = months[String(monthName).slice(0, 3).toLowerCase()];
    if (month == null || !Number.isFinite(Number(day))) return "";
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
  };
  const weekStart = toYmd(hits[0][1], hits[0][2]);
  const weekEnd = toYmd(hits[hits.length - 1][1], hits[hits.length - 1][2]);
  if (!weekStart || !weekEnd) return null;
  return { weekStart, weekEnd };
}

function episodeWeekBounds(ep) {
  if (!ep) return null;
  let weekStart = ep.weekStart;
  let weekEnd = ep.weekEnd;
  if (!weekStart || !weekEnd) {
    const parsed = parseEpisodeWeekLabel(ep.weekLabel);
    if (parsed) {
      weekStart = weekStart || parsed.weekStart;
      weekEnd = weekEnd || parsed.weekEnd;
    }
  }
  const startMs = weekStart ? Date.parse(`${weekStart}T00:00:00-07:00`) : NaN;
  const endMs = weekEnd
    ? Date.parse(`${weekEnd}T23:59:59-07:00`)
    : ep.tribalAt
      ? Date.parse(ep.tribalAt) + 36 * 60 * 60 * 1000
      : NaN;
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return { startMs, endMs, weekStart, weekEnd };
}

function tickerEpisodeForRange(season) {
  if (typeof document !== "undefined" && document.documentElement) {
    if (document.documentElement.getAttribute("data-page") === "episode") {
      return currentPageEpisode(season) || season.episode || null;
    }
  }
  return season.episode || null;
}

function survivorBootAtMs(season, survivor) {
  if (!survivor) return null;
  const log = Array.isArray(season && season.tribalLog) ? season.tribalLog : [];
  for (let i = 0; i < log.length; i += 1) {
    const entry = log[i];
    if (!entry || !entry.at) continue;
    const t = Date.parse(entry.at);
    if (Number.isNaN(t)) continue;
    if (entry.bootId && entry.bootId === survivor.id) return t;
    const bootName = entry.bootName || entry.boot;
    if (bootName && (bootName === survivor.name || bootName === survivor.model)) return t;
  }
  return null;
}

function survivorLivingAt(season, survivor, iso) {
  if (!survivor) return false;
  const bootAt = survivorBootAtMs(season, survivor);
  if (bootAt == null) {
    return !survivor.status || survivor.status === "active" || survivor.status === "immune";
  }
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return true;
  return t < bootAt;
}

function moneyTickerAssignAxis(frames, range) {
  const list = frames || [];
  const n = list.length;
  /* Tape order, not calendar slots. Same-day marks must travel the plot;
     weekday ticks stay as labels. Season chapters should call this after load. */
  moneyTicker.axisMax = Math.max(1, n - 1);
  list.forEach((frame, i) => {
    frame.axisT = n < 2 ? 0 : i;
  });
}

function moneyTickerAxisTAt(t, frames) {
  const list = frames || moneyTicker.frames || [];
  if (!list.length) return 0;
  const max = list.length - 1;
  const u = Math.max(0, Math.min(max, t));
  const i0 = Math.floor(u);
  const i1 = Math.min(max, i0 + 1);
  const a = typeof list[i0].axisT === "number" ? list[i0].axisT : i0;
  const b = typeof list[i1].axisT === "number" ? list[i1].axisT : i1;
  return lerp(a, b, u - i0);
}

function moneyTickerXFromAxisT(axisT, axisMax) {
  const padL = 36;
  const padR = 12;
  const w = 640 - padL - padR;
  const max = axisMax || moneyTicker.axisMax || 5;
  const t = Math.max(0, Math.min(max, Number(axisT) || 0));
  return padL + (max ? (t / max) * w : 0);
}

function moneyTickerLiveNowX(frames, range) {
  const mode = range || (moneyTicker && moneyTicker.range) || "week";
  const list = frames || [];
  const now = new Date();
  const nowIso = now.toISOString();
  const last = list[list.length - 1];
  const lastT = last && typeof last.axisT === "number" ? last.axisT : Math.max(0, list.length - 1);
  if (mode === "week") {
    const bounds = episodeWeekBounds(tickerEpisodeForRange(moneyTicker.season));
    if (!bounds) return null;
    const nowMs = now.getTime();
    if (nowMs < bounds.startMs || nowMs > bounds.endMs) return null;
    if (!list.length) return null;
    return moneyTickerXFromAxisT(lastT);
  }
  const today = pacificDateParts(nowIso);
  const lastDay = last && pacificDateParts(last.at);
  if (!today || !lastDay || today.key !== lastDay.key) return null;
  return moneyTickerXFromAxisT(lastT);
}

function moneyTickerWeekdayTicks(frames, range) {
  const mode = range || (moneyTicker && moneyTicker.range) || "week";
  if (mode === "week") {
    return MONEY_TICKER_WEEKDAYS.map((day, i) => ({
      x: moneyTickerXFromAxisT(i + 0.5, 5),
      label: day.label,
      weekday: day.key
    }));
  }
  const days = [];
  const byKey = new Map();
  (frames || []).forEach((frame) => {
    const parts = pacificDateParts(frame && frame.at);
    if (!parts) return;
    if (!byKey.has(parts.key)) {
      byKey.set(parts.key, {
        weekday: parts.weekday,
        day: parts.day,
        month: parts.month,
        key: parts.key
      });
      days.push(byKey.get(parts.key));
    }
  });
  const trading = days.filter((day) => MONEY_TICKER_WEEKDAY_SLOT[day.weekday] != null && day.weekday !== "Sat" && day.weekday !== "Sun");
  const use = trading.length ? trading : days;
  if (!use.length) {
    return MONEY_TICKER_WEEKDAYS.map((day, i) => ({
      x: moneyTickerXFromAxisT(i + 0.5, 5),
      label: day.label,
      weekday: day.key
    }));
  }
  const full =
    use.length <= 5 && use.every((day) => MONEY_TICKER_WEEKDAYS.some((item) => item.key === day.weekday));
  const axisMax = Math.max(1, use.length);
  return use.map((day, i) => {
    const named = MONEY_TICKER_WEEKDAYS.find((item) => item.key === day.weekday);
    return {
      x: moneyTickerXFromAxisT(i + 0.5, axisMax),
      label: full && named ? named.label : `${day.weekday} ${day.day}`,
      weekday: day.weekday
    };
  });
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

function listedTickerEpisodes(season) {
  return (season && Array.isArray(season.episodes) ? season.episodes : []).filter((ep) => {
    if (!ep || !ep.number || !ep.id) return false;
    if (ep.status === "locked") return false;
    return true;
  });
}

function snapshotMatchesEpisode(snap, episode) {
  if (!snap || !episode) return false;
  const id = String(snap.id || "");
  const eid = String(episode.id || "");
  if (eid && id.startsWith(eid)) return true;
  const t = Date.parse(snap.at);
  const start = episode.weekStart ? Date.parse(episode.weekStart + "T00:00:00-07:00") : NaN;
  const end = episode.weekEnd
    ? Date.parse(episode.weekEnd + "T23:59:59-07:00")
    : episode.tribalAt
      ? Date.parse(episode.tribalAt) + 36 * 60 * 60 * 1000
      : NaN;
  if (Number.isNaN(t) || Number.isNaN(start) || Number.isNaN(end)) return false;
  return t >= start && t <= end;
}

function groupSnapshotsByEpisode(season, snapshots) {
  const episodes = listedTickerEpisodes(season);
  const groups = episodes.map((episode) => ({ episode, snaps: [] }));
  (snapshots || []).forEach((snap) => {
    const hit =
      groups.find((g) => String(snap.id || "").startsWith(String(g.episode.id || ""))) ||
      groups.find((g) => snapshotMatchesEpisode(snap, g.episode)) ||
      groups[groups.length - 1];
    if (hit) hit.snaps.push(snap);
  });
  return groups.filter((g) => g.snaps.length);
}

function snapshotsForTickerRange(season, range) {
  /* Page episode, not the live week — Episode 1 WEEK must not use Episode 2 dates. */
  const ep = tickerEpisodeForRange(season) || currentPageEpisode(season) || season.episode || {};
  return snapshotsInTickerRange(season.snapshots, ep, range);
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
    if (!survivorLivingAt(season, s, frame && frame.at)) return;
    const id = s.tribeId;
    if (!id) return;
    if (out[id] == null) out[id] = 0;
    const v = frame.books && frame.books[s.id];
    if (typeof v === "number") out[id] = roundMoney(out[id] + v);
  });
  return out;
}

function framesFromSnapshots(season, snaps) {
  const sleeve = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const cast = season.survivors || [];
  const tribeIndex = {};
  cast.forEach((s) => {
    const key = s.tribeId || "x";
    tribeIndex[key] = tribeIndex[key] || 0;
    s.__tickerTone = candidateStroke(s, tribeIndex[key]);
    tribeIndex[key] += 1;
  });
  const frames = (snaps || []).map((snap) => {
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
  moneyTickerAssignAxis(frames);
  return frames;
}

function buildTickerFrames(season, range) {
  return framesFromSnapshots(season, snapshotsForTickerRange(season, range));
}

function buildTickerChapters(season) {
  const all = Array.isArray(season.snapshots) ? season.snapshots.slice() : [];
  return groupSnapshotsByEpisode(season, all)
    .map((group) => ({
      episode: group.episode,
      frames: framesFromSnapshots(season, snapshotsFromEpisodeStart(group.snaps, group.episode))
    }))
    .filter((ch) => ch.frames.length);
}

function moneyTickerUsesChapters() {
  return moneyTicker.range === "season" && Array.isArray(moneyTicker.chapters) && moneyTicker.chapters.length > 0;
}

function moneyTickerActiveEpisode(season) {
  if (moneyTickerUsesChapters()) {
    const ch = moneyTicker.chapters[moneyTicker.chapterIndex];
    if (ch && ch.episode) return ch.episode;
  }
  return currentPageEpisode(season) || (season && season.episode) || null;
}

function moneyTickerChapterPutIn(season, episode) {
  const start = moneyPutInTotal(season);
  const hostAdd = islandHostAddUsd(season);
  const given = hostAdd != null ? islandGivenUsd(season) : null;
  const n = episode && Number(episode.number);
  if (n >= 2 && typeof given === "number" && hostAdd != null) return given;
  return start;
}

function setTickerChapter(index, opts) {
  const chapters = moneyTicker.chapters || [];
  if (!chapters.length) return false;
  const i = Math.max(0, Math.min(chapters.length - 1, index));
  const chapter = chapters[i];
  moneyTicker.chapterIndex = i;
  moneyTicker.frames = chapter.frames;
  moneyTicker.putIn = moneyTickerChapterPutIn(moneyTicker.season, chapter.episode);
  moneyTicker.sleevePutIn = tickerSleevePutIn(moneyTicker.season, chapter.episode, "season");
  const livingPerTribe = Math.max(
    1,
    Math.round(
      (((moneyTicker.season && moneyTicker.season.survivors) || []).length || 12) /
        Math.max(1, ((moneyTicker.season && moneyTicker.season.tribes) || []).length || 2)
    )
  );
  moneyTicker.tribePutIn = roundMoney(moneyTicker.sleevePutIn * livingPerTribe);
  const end = Math.max(0, chapter.frames.length - 1);
  if (opts && opts.atEnd) {
    moneyTicker.index = end;
    moneyTicker.progress = end;
  } else {
    moneyTicker.index = 0;
    moneyTicker.progress = 0;
  }
  return true;
}

function syncTickerChapterChrome() {
  const root = moneyTicker.root;
  if (!root) return;
  root.querySelectorAll("[data-ticker-chapter]").forEach((btn) => {
    const i = Number(btn.getAttribute("data-ticker-chapter"));
    btn.setAttribute("aria-selected", i === moneyTicker.chapterIndex ? "true" : "false");
  });
  const scrub = root.querySelector("[data-ticker-scrub]");
  if (scrub) {
    scrub.max = String(Math.max(0, moneyTicker.frames.length - 1));
    if (scrub.value !== String(moneyTicker.progress || 0)) scrub.value = String(moneyTicker.progress || 0);
  }
}

function loadTickerChapter(index, opts) {
  if (!setTickerChapter(index, opts)) return false;
  if (moneyTicker.root && moneyTicker.root.querySelector(".money-ticker-plot")) {
    refreshMoneyTickerChart();
    syncTickerChapterChrome();
    setMoneyTickerProgress(moneyTicker.progress || 0);
  }
  return true;
}

function advanceTickerChapter() {
  if (!moneyTickerUsesChapters()) return false;
  if (moneyTicker.chapterIndex >= moneyTicker.chapters.length - 1) return false;
  return loadTickerChapter(moneyTicker.chapterIndex + 1);
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
  const segments = Math.max(5, moneyTicker.frames.length - 1);
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
    if (moneyTickerUsesChapters()) loadTickerChapter(moneyTicker.chapters.length - 1, { atEnd: true });
    setMoneyTickerProgress(Math.max(0, moneyTicker.frames.length - 1));
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
    if (advanceTickerChapter()) {
      moneyTicker.playing = true;
      moneyTicker.playFromProgress = 0;
      moneyTicker.playStartedAt = performance.now();
      const playBtn = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-play]");
      if (playBtn) {
        playBtn.setAttribute("aria-pressed", "true");
        playBtn.innerHTML = `<span aria-hidden="true">❚❚</span> Pause`;
      }
      moneyTicker.raf = requestAnimationFrame(tickMoneyTickerPlayback);
      return;
    }
    stopMoneyTickerPlayback();
    const btn = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-play]");
    if (btn) btn.innerHTML = `<span aria-hidden="true">↻</span> Replay`;
    return;
  }
  moneyTicker.raf = requestAnimationFrame(tickMoneyTickerPlayback);
}

function applyMoneyTickerAutoDiagram() {
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
  if (!autoDiagram) return;
  const rootEl = moneyTicker.root;
  if (!rootEl) return;
  rootEl.querySelectorAll("[data-ticker-diagram]").forEach((btn) => {
    const id = btn.getAttribute("data-ticker-diagram");
    btn.setAttribute("aria-selected", id === autoDiagram ? "true" : "false");
  });
  refreshMoneyTickerChart();
}

function kickoffMoneyTickerAutoplay() {
  if (moneyTicker.autoplayDone || moneyTicker.reducedMotion) return;
  moneyTicker.autoplayDone = true;
  moneyTicker.autoplayArmed = false;
  if (moneyTicker.scrollObserver) {
    moneyTicker.scrollObserver.disconnect();
    moneyTicker.scrollObserver = null;
  }
  applyMoneyTickerAutoDiagram();
  setMoneyTickerSpeed(0.5);
  startMoneyTickerPlayback({ fromStart: true });
}

function onHomeBooksEvent(event) {
  const action = event && event.detail && event.detail.action;
  if (action === "reset") {
    stopMoneyTickerPlayback();
    moneyTicker.autoplayDone = false;
    moneyTicker.autoplayArmed = false;
    if (moneyTickerUsesChapters()) loadTickerChapter(0);
    setMoneyTickerProgress(0);
    const playBtn = moneyTicker.root && moneyTicker.root.querySelector("[data-ticker-play]");
    if (playBtn) {
      playBtn.setAttribute("aria-pressed", "false");
      playBtn.innerHTML = `<span aria-hidden="true">▶</span> Play`;
    }
    return;
  }
  if (action === "play") {
    kickoffMoneyTickerAutoplay();
  }
}

function armMoneyTickerAutoplay() {
  const root = moneyTicker.root;
  if (!root || moneyTicker.autoplayDone || moneyTicker.reducedMotion) return;
  if (moneyTicker.scrollObserver) {
    moneyTicker.scrollObserver.disconnect();
    moneyTicker.scrollObserver = null;
  }
  moneyTicker.autoplayArmed = true;

  if (moneyTicker.homeBooksHandler) {
    document.removeEventListener("lts-home-books", moneyTicker.homeBooksHandler);
    moneyTicker.homeBooksHandler = null;
  }

  /* Home: wait for the title cards, then land on the books diagram and play. */
  if (moneyTickerIsHome()) {
    moneyTicker.homeBooksHandler = onHomeBooksEvent;
    document.addEventListener("lts-home-books", moneyTicker.homeBooksHandler);
    if (!document.body.classList.contains("is-titles")) {
      kickoffMoneyTickerAutoplay();
    }
    return;
  }

  if (!("IntersectionObserver" in window)) {
    kickoffMoneyTickerAutoplay();
    return;
  }

  moneyTicker.scrollObserver = new IntersectionObserver(
    (entries) => {
      const hit = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35);
      if (!hit) return;
      kickoffMoneyTickerAutoplay();
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
  const chgText = `${arrow} ${money(Math.abs(delta))} (${pct(pctChange).replace("+", "")}) from ${potMoney(putIn)} put in`;
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

function moneyTickerXAt(t, count, frames) {
  const list = frames || moneyTicker.frames;
  if (list && list.length && typeof list[0].axisT === "number") {
    return moneyTickerXFromAxisT(moneyTickerAxisTAt(t, list));
  }
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

function tickerLivingRun(values) {
  let start = 0;
  while (start < values.length && values[start] == null) start += 1;
  let end = start;
  while (end < values.length && values[end] != null) end += 1;
  return { start, end };
}

function tickerPathForSeries(values, min, max, top, height, seriesKey, frames) {
  if (!values.length) return "";
  const run = tickerLivingRun(values);
  if (run.end <= run.start) return "";
  const slice = values.slice(run.start, run.end);
  const span = max - min || 1;
  const samples = jaggedSeriesSamples(slice, seriesKey, span);
  const count = values.length;
  return samples
    .map((pt, i) => {
      const x = moneyTickerXAt(pt.t + run.start, count, frames);
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
    const putInLabel = `$${tribePutIn.toFixed(0)} in`;
    return {
      title: "Tribes",
      aria: "Tribe book totals over recorded marks. Dotted line is money put into each tribe.",
      putIn: tribePutIn,
      putInLabel,
      guides: [{ id: "putin", value: tribePutIn, label: putInLabel, className: "money-ticker-putin" }],
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
    const series = [];
    cast.forEach((s, idx) => {
      const values = frames.map((frame) => {
        if (!survivorLivingAt(season, s, frame.at)) return null;
        const v = frame.books[s.id];
        return typeof v === "number" ? v : null;
      });
      if (!values.some((v) => v != null)) return;
      values.forEach((v) => {
        if (typeof v === "number") {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
      series.push({
        id: s.id,
        label: modelOf(s),
        color: s.__tickerTone || "#d4a017",
        values,
        seed: idx + 11,
        width: 1.45
      });
    });
    const pad = Math.max(0.35, (max - min) * 0.14);
    min = Math.min(min, sleeve) - pad;
    max = Math.max(max, sleeve) + pad;
    const putInLabel = `$${sleeve.toFixed(0)} in`;
    return {
      title: "Contestants",
      aria: `Contestant sleeves over recorded marks. Dotted line is the $${sleeve.toFixed(0)} put into each book. Voted-out players drop after tribal.`,
      putIn: sleeve,
      putInLabel,
      guides: [{ id: "putin", value: sleeve, label: putInLabel, className: "money-ticker-putin" }],
      min,
      max,
      series,
      legend: series.map((item) => ({
        label: item.label,
        color: item.color
      })),
      liveSeries: series[0] ? series[0].id : "total",
      strokeForDot: series[0] ? series[0].color : "#e89354"
    };
  }

  /* island */
  const startPutIn = moneyPutInTotal(season);
  const hostAdd = islandHostAddUsd(season);
  const given = hostAdd != null ? islandGivenUsd(season) : null;
  const episode = moneyTickerActiveEpisode(season);
  const epNum = episode && Number(episode.number);
  const hostBar = typeof given === "number" && hostAdd != null && epNum >= 2;
  /* E2 week and E2 season chapter start at the cash-add — only the given bar. */
  const fundedBar = hostBar && (moneyTickerUsesChapters() || moneyTicker.range === "week");
  const scalePutIn = fundedBar ? given : startPutIn;
  let min = scalePutIn;
  let max = scalePutIn;
  frames.forEach((frame) => {
    if (frame.total < min) min = frame.total;
    if (frame.total > max) max = frame.total;
  });
  if (hostBar) {
    if (given < min) min = given;
    if (given > max) max = given;
  }
  if (!fundedBar) {
    if (startPutIn < min) min = startPutIn;
    if (startPutIn > max) max = startPutIn;
  }
  const pad = Math.max(0.8, (max - min) * 0.18);
  min -= pad;
  max += pad;
  const potDown = last && last.total < scalePutIn - 0.00005;
  const potStroke = potDown ? "#e89354" : "#8ee8d8";
  const putInLabel = `$${startPutIn.toFixed(0)} in`;
  const guides = [];
  const legend = [{ label: "Island pot", color: potStroke }];
  if (!fundedBar) {
    guides.push({
      id: "putin",
      value: startPutIn,
      label: putInLabel,
      className: "money-ticker-putin",
      lineLabel: putInLabel,
      labelClass: "is-putin"
    });
    legend.push({ label: putInLabel, color: "rgba(243, 234, 214, 0.92)", swatch: "dash" });
  }
  let aria = "Island pot over recorded marks. Dotted line is money put into the game.";
  if (hostBar) {
    const ep = islandHostAddEpisodeLabel(episode || season);
    guides.push({
      id: "host-add",
      value: given,
      label: `${potMoney(given)} given`,
      className: "money-ticker-host-add",
      lineLabel: `${ep} host +${potMoney(hostAdd)}`,
      labelClass: "is-host-add"
    });
    legend.push({ label: `${ep} host +${potMoney(hostAdd)}`, color: "#f0c14b", swatch: "dash" });
    aria = fundedBar
      ? `Island pot for ${episode.title || ep}. Horizontal bar is Episode ${ep.slice(1)} host +${potMoney(hostAdd)} at ${potMoney(given)} given.`
      : `Island pot over recorded marks. Both dotted lines stay on: $${startPutIn.toFixed(0)} put in, and Episode ${ep.slice(1)} host +${potMoney(hostAdd)} at ${potMoney(given)} given.`;
  }
  const title =
    moneyTickerUsesChapters() && episode
      ? `Island · ${episode.title || "Episode " + episode.number}`
      : "Island";
  return {
    title,
    aria,
    putIn: scalePutIn,
    putInLabel: fundedBar ? `${potMoney(given)} given` : putInLabel,
    guides,
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
    legend,
    liveSeries: "total",
    strokeForDot: potStroke
  };
}

function moneyTickerYAxisLabels(spec, chartTop, chartHeight) {
  const guides = spec.guides || [];
  const ticks = guides.map((guide) => ({ value: guide.value, label: guide.label, priority: 0 }));
  ticks.push({ value: spec.max, label: money(spec.max), priority: 1 });
  ticks.push({ value: spec.min, label: money(spec.min), priority: 1 });
  ticks.sort((a, b) => a.priority - b.priority || b.value - a.value);
  const usedY = [];
  const usedV = [];
  const kept = [];
  ticks.forEach((tick) => {
    if (typeof tick.value !== "number" || Number.isNaN(tick.value)) return;
    if (usedV.some((v) => Math.abs(v - tick.value) < 0.0001)) return;
    const y = moneyTickerY(tick.value, spec.min, spec.max, chartTop, chartHeight);
    if (usedY.some((sy) => Math.abs(sy - y) < 12)) return;
    usedY.push(y);
    usedV.push(tick.value);
    kept.push({ ...tick, y });
  });
  kept.sort((a, b) => a.y - b.y);
  return kept
    .map((tick) => {
      return `<text class="money-ticker-axis" x="2" y="${(tick.y + 4).toFixed(2)}">${escapeHtml(tick.label)}</text>
      <line class="money-ticker-grid" x1="36" y1="${tick.y.toFixed(2)}" x2="628" y2="${tick.y.toFixed(2)}" />`;
    })
    .join("");
}

function moneyTickerGuideMarkup(spec, chartTop, chartHeight) {
  const guides = spec.guides && spec.guides.length
    ? spec.guides
    : [{ id: "putin", value: spec.putIn, label: spec.putInLabel, className: "money-ticker-putin" }];
  return guides
    .map((guide) => {
      const y = moneyTickerY(guide.value, spec.min, spec.max, chartTop, chartHeight);
      const labelClass = ["money-ticker-guide-label", guide.labelClass].filter(Boolean).join(" ");
      const lineLabel = guide.lineLabel
        ? `<text class="${escapeHtml(labelClass)}" data-ticker-guide-label="${escapeHtml(guide.id)}" x="622" y="${(y - 5).toFixed(2)}" text-anchor="end">${escapeHtml(guide.lineLabel)}</text>`
        : "";
      return `<g data-ticker-guide="${escapeHtml(guide.id)}">
      <title>${escapeHtml(guide.lineLabel || guide.label)}</title>
      <line class="${escapeHtml(guide.className)}" x1="36" y1="${y.toFixed(2)}" x2="628" y2="${y.toFixed(2)}" />
      ${lineLabel}
    </g>`;
    })
    .join("");
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

  const yLabels = moneyTickerYAxisLabels(spec, chartTop, chartHeight);
  const guideLines = moneyTickerGuideMarkup(spec, chartTop, chartHeight);
  const xLabels = moneyTickerWeekdayTicks(frames, moneyTicker.range)
    .map((tick) => {
      let anchor = "middle";
      if (tick.x < 70) anchor = "start";
      else if (tick.x > 600) anchor = "end";
      const short = tick.weekday || tick.label;
      return `<g class="money-ticker-day" data-ticker-x-weekday="${escapeHtml(short)}">
        <line class="money-ticker-day-grid" x1="${tick.x.toFixed(2)}" y1="16" x2="${tick.x.toFixed(2)}" y2="198" />
        <line class="money-ticker-day-tick" x1="${tick.x.toFixed(2)}" y1="198" x2="${tick.x.toFixed(2)}" y2="206" />
        <circle class="money-ticker-day-dot" cx="${tick.x.toFixed(2)}" cy="198" r="2.1" />
        <text class="money-ticker-axis money-ticker-day-full" x="${tick.x.toFixed(2)}" y="216" text-anchor="${anchor}">${escapeHtml(tick.label)}</text>
        <text class="money-ticker-axis money-ticker-day-short" x="${tick.x.toFixed(2)}" y="216" text-anchor="${anchor}">${escapeHtml(short)}</text>
      </g>`;
    })
    .join("");

  const lines = spec.series
    .map((series) => {
      const d = tickerPathForSeries(series.values, spec.min, spec.max, chartTop, chartHeight, series.seed, frames);
      const run = tickerLivingRun(series.values);
      const livingCount = run.end - run.start;
      let markDot = "";
      if (livingCount === 1) {
        const idx = run.start;
        const x = moneyTickerXAt(idx, frames.length, frames);
        const y = moneyTickerY(series.values[idx], spec.min, spec.max, chartTop, chartHeight);
        markDot = `<circle class="money-ticker-mark-dot" data-series="${escapeHtml(series.id)}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3" fill="${escapeHtml(series.color)}" />`;
      }
      return `<path class="money-ticker-line" data-series="${escapeHtml(series.id)}" d="${d}" stroke="${escapeHtml(series.color)}" fill="none" stroke-width="${series.width || 1.6}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"><title>${escapeHtml(series.label)}</title></path>${markDot}`;
    })
    .join("");

  const playProgress =
    typeof moneyTicker.progress === "number" ? moneyTicker.progress : moneyTicker.index || 0;
  const playX = moneyTickerXAt(playProgress, frames.length);
  const liveNowX = moneyTickerLiveNowX(frames, moneyTicker.range);
  const liveNow =
    liveNowX == null
      ? ""
      : `<g class="money-ticker-live-now" data-ticker-live-now>
        <line x1="${liveNowX.toFixed(2)}" y1="16" x2="${liveNowX.toFixed(2)}" y2="198" />
        <rect x="${(liveNowX + 4).toFixed(2)}" y="16" width="28" height="12" rx="2" />
        <text x="${(liveNowX + 18).toFixed(2)}" y="25" text-anchor="middle">Live</text>
      </g>`;
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
    ${guideLines}
    <g clip-path="url(#money-ticker-clip)">
      ${lines}
      ${
        showDot
          ? `<circle class="money-ticker-pot-dot" data-ticker-pot-dot cx="${playX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="3.4" fill="${escapeHtml(spec.strokeForDot)}" />`
          : `<circle class="money-ticker-pot-dot" data-ticker-pot-dot cx="-20" cy="-20" r="0" fill="transparent" />`
      }
    </g>
    <line class="money-ticker-playhead" data-ticker-playhead x1="${playX}" y1="16" x2="${playX}" y2="198" />
    ${liveNow}
    ${xLabels}
  </svg>`;
}

function moneyTickerLegendHtml(season, frames) {
  const spec = moneyTickerDiagramSeries(season, frames);
  return (spec.legend || [])
    .map((item) => {
      const swatchClass = item.swatch === "dash" ? "swatch is-dash" : "swatch";
      const swatchStyle =
        item.swatch === "dash" ? `color:${escapeHtml(item.color)}` : `background:${escapeHtml(item.color)}`;
      return `<li><span class="${swatchClass}" style="${swatchStyle}"></span>${escapeHtml(item.label)}</li>`;
    })
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
    const chapterBtn = event.target.closest("[data-ticker-chapter]");
    if (chapterBtn) {
      const next = Number(chapterBtn.getAttribute("data-ticker-chapter"));
      if (!Number.isNaN(next) && next !== moneyTicker.chapterIndex) {
        const wasPlaying = moneyTicker.playing;
        stopMoneyTickerPlayback();
        loadTickerChapter(next);
        if (wasPlaying) startMoneyTickerPlayback({ fromStart: true });
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
      const atEnd = (moneyTicker.progress || 0) >= moneyTicker.frames.length - 1 - 0.001;
      if (atEnd && moneyTickerUsesChapters()) {
        if (moneyTicker.chapterIndex < moneyTicker.chapters.length - 1) {
          loadTickerChapter(moneyTicker.chapterIndex + 1);
        } else {
          loadTickerChapter(0);
        }
        startMoneyTickerPlayback({ fromStart: true });
        return;
      }
      startMoneyTickerPlayback({ fromStart: atEnd });
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
  const pageEp = currentPageEpisode(season) || season.episode || {};
  moneyTicker.sleevePutIn = tickerSleevePutIn(season, pageEp, moneyTicker.range);
  moneyTicker.putIn = moneyPutInTotal(season, pageEp, moneyTicker.range);
  const livingPerTribe = Math.max(
    1,
    Math.round(((season.survivors || []).length || 12) / Math.max(1, (season.tribes || []).length || 2))
  );
  moneyTicker.tribePutIn = roundMoney(moneyTicker.sleevePutIn * livingPerTribe);
  const keepEnd = opts && opts.keepEnd;
  moneyTicker.chapters = moneyTicker.range === "season" ? buildTickerChapters(season) : [];
  moneyTicker.chapterIndex = 0;
  if (moneyTicker.chapters.length) {
    const homeStart = homeMode && !keepEnd;
    setTickerChapter(homeStart ? 0 : moneyTicker.chapters.length - 1, { atEnd: !homeStart });
  } else {
    moneyTicker.frames = buildTickerFrames(season, moneyTicker.range);
  }
  if (!moneyTicker.frames.length) {
    root.innerHTML = "";
    root.hidden = true;
    return;
  }
  root.hidden = false;
  const end = moneyTicker.frames.length - 1;
  /* Home lands on the start of the books diagram, then the open starts playback. */
  if (homeMode && !keepEnd) {
    moneyTicker.index = 0;
    moneyTicker.progress = 0;
  } else {
    moneyTicker.index = end;
    moneyTicker.progress = end;
  }

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

  const chapterTabs =
    moneyTickerUsesChapters() && moneyTicker.chapters.length > 1
      ? `<div class="money-ticker-chapters" role="tablist" aria-label="Episode">
        ${moneyTicker.chapters
          .map((ch, i) => {
            const on = i === moneyTicker.chapterIndex;
            const label = (ch.episode && ch.episode.title) || `Episode ${ch.episode && ch.episode.number}`;
            return `<button type="button" role="tab" data-ticker-chapter="${i}" aria-selected="${on ? "true" : "false"}">${escapeHtml(label)}</button>`;
          })
          .join("")}
      </div>`
      : "";

  const givenNow = islandGivenUsd(season);
  const givenLede = typeof givenNow === "number" ? potMoney(givenNow) : "$240.09";
  const lede = homeMode
    ? "See how each tribe and contestant did in the Episode."
    : `Watch the island, the tribes, or every contestant sleeve. Monday through Friday. Voted-out players drop after tribal. Season plays one episode at a time. Episode 2 moves the bar to ${givenLede}.`;

  /* Home puts Replay trailer under the tagline; episode keeps the books kicker. */
  const tickerHead = homeMode
    ? `<p class="money-ticker-lede">${lede}</p>`
    : `<div class="money-ticker-head">
      <p class="money-ticker-kicker">Replay the books</p>
      <p class="money-ticker-lede">${lede}</p>
    </div>`;

  root.innerHTML = `
    ${tickerHead}
    <div class="money-ticker-toolbar">
      <div class="money-ticker-range" role="tablist" aria-label="Time range">
        ${rangeTabs}
      </div>
      ${chapterTabs}
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
    const log = tribalLogForPage(season);
    if (log.length === 0) {
      if (tribalHeading) tribalHeading.textContent = "Not yet";
      tribal.innerHTML = `
      <div class="torches">${councilTorchRowHtml(season, null)}</div>
      <div class="council-empty">
        <h3>Not yet</h3>
        <p>Friday night. Losing tribe walks in. Nobody wears a necklace. The vote is social.</p>
      </div>`;
    } else {
      if (tribalHeading) tribalHeading.textContent = "The vote";
      document.body.classList.add("episode-vote-posted");
      const latest = log[log.length - 1];
      const items = log.map((entry) => formatTribalEntry(entry)).join("");
      tribal.innerHTML = `
    <div class="torches">${councilTorchRowHtml(season, latest)}</div>
    ${wrapTribalSpoiler(`<ul class="log-list tribal-vote-list">${items}</ul>`)}`;
      bindTribalSpoilers(tribal);
    }
  }
  renderEpisodeRecapSpoiler(season);
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
    ? `<p class="vote-tally-kicker">Votes</p><ul class="vote-tally" aria-label="Votes">${tallyRows}</ul>`
    : "";
  return `<li class="tribal-vote-entry">
    <p class="boot-kicker">The tribe has spoken</p>
    <p class="boot-name">${escapeHtml(String(boot))}</p>
    ${tallyHtml}
  </li>`;
}

function wrapTribalSpoiler(innerHtml, options) {
  const opts = options && typeof options === "object" ? options : {};
  const resultId = opts.resultId || "tribal-spoiler-result";
  const kicker = opts.kicker || "Spoiler";
  const title = opts.title || "Click to Reveal the Vote";
  const copy = opts.copy || "Burn to reveal who goes home.";
  const srLabel = opts.srLabel || "Spoiler: tribal results. Click to reveal the vote.";
  return `<div class="tribal-spoiler">
    <div class="tribal-spoiler-result" id="${escapeHtml(resultId)}" aria-hidden="true">${innerHtml}</div>
    <button type="button" class="tribal-spoiler-cover hover-3d" aria-expanded="false" aria-controls="${escapeHtml(resultId)}">${hover3dWrap(`
      <canvas class="tribal-spoiler-canvas" aria-hidden="true"></canvas>
      <span class="tribal-spoiler-cover-fallback">
        <span class="spoiler-kicker">${escapeHtml(kicker)}</span>
        <span class="spoiler-title">${escapeHtml(title)}</span>
        <span class="spoiler-copy">${escapeHtml(copy)}</span>
      </span>
      <span class="visually-hidden">${escapeHtml(srLabel)}</span>
    `)}</button>
    <canvas class="tribal-spoiler-particles" aria-hidden="true"></canvas>
  </div>`;
}

function renderEpisodeRecapSpoiler(season) {
  const mount = document.getElementById("episode-recap");
  const stage = document.getElementById("episode-recap-stage");
  if (!mount || !stage) return;
  const prior = priorTribalLog(season);
  if (!prior.length) {
    mount.hidden = true;
    stage.innerHTML = "";
    return;
  }
  mount.hidden = false;
  const items = prior.map((entry) => formatTribalEntry(entry)).join("");
  const hasE1 = prior.some((entry) => entry.episode === "s1e01");
  stage.innerHTML = wrapTribalSpoiler(`<ul class="log-list tribal-vote-list">${items}</ul>`, {
    resultId: "episode-recap-spoiler-result",
    kicker: "RECAP",
    title: hasE1
      ? "Reveal the results of the Episode 1 tribal council vote"
      : "Reveal the results of the last tribal council vote",
    copy: "Burn to reveal who went home.",
    srLabel: "Recap: prior tribal results. Click to reveal the vote."
  });
  bindTribalSpoilers(stage);
}

function firstEpisodeHref(season) {
  const episodes = Array.isArray(season && season.episodes) ? season.episodes : [];
  const ep = episodes.find((item) => item && (item.number === 1 || item.id === "s1e01"));
  return ep && ep.path ? assetUrl(ep.path) : assetUrl("seasons/1/e01.html");
}

function renderHomeTribalSpoiler(season) {
  const stage = document.getElementById("home-tribal");
  const band = document.getElementById("home-vote");
  if (!stage) return;
  const log = Array.isArray(season.tribalLog) ? season.tribalLog : [];
  if (log.length === 0) {
    if (band) band.hidden = true;
    stage.innerHTML = "";
    return;
  }
  if (band) band.removeAttribute("hidden");
  const items = log.map((entry) => formatTribalEntry(entry)).join("");
  stage.innerHTML = wrapTribalSpoiler(`<ul class="log-list tribal-vote-list">${items}</ul>`, {
    resultId: "home-tribal-spoiler-result",
    title: "See who was voted off in episode one",
    copy: "Burn to reveal who goes home."
  });
  bindTribalSpoilers(stage);
  const cta = document.getElementById("home-vote-episode");
  if (cta) cta.setAttribute("href", firstEpisodeHref(season));
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
      const live = ep.status === "live";
      const status = live ? "Now playing" : episodeIsClosed(ep) ? "Closed" : ep.status || "cut";
      const liveClass = live ? " live" : episodeIsClosed(ep) ? " closed" : "";
      return `<a class="episode-card${liveClass}" href="${escapeHtml(href)}">
        <p class="ep-kicker">${escapeHtml(status)}</p>
        <h3 class="ep-title-row"><span>${title}</span>${live ? liveIndicatorHtml() : ""}</h3>
        <p>${label}</p>
      </a>`;
    })
    .join("");
}

function startArchifyEmbedFlow(iframe) {
  if (!iframe || !iframe.contentWindow) return;
  try {
    iframe.contentWindow.postMessage({ type: "lts-diagram-flow", on: true }, "*");
  } catch {
    /* cross-origin or not ready */
  }
}

function initArchifyEmbedFlow() {
  const root = document.getElementById("island-bot-diagram");
  const iframe = root && root.querySelector("iframe");
  if (!root || !iframe || root.dataset.archFlowInit === "1") return;
  root.dataset.archFlowInit = "1";
  const start = () => startArchifyEmbedFlow(iframe);
  iframe.addEventListener("load", start);
  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        start();
        io.disconnect();
      });
    },
    { threshold: 0.32, rootMargin: "0px 0px -8% 0px" }
  );
  io.observe(root);
}

function render(season, sourceNote) {
  renderIslandPot(season);
  renderFaces(season);
  renderLettersFromHome(season);
  renderSurvivor(season);
  renderStandings(season);
  renderSeasonHub(season);
  renderEpisode(season);
  renderMoneyJourney(season);
  renderHomeEpisodes(season);
  renderHomeTribalSpoiler(season);
  renderHomeTorches(season);
  renderNavWatch(season);
  initArchifyEmbedFlow();
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

let fuelPromptReturnFocus = null;

function getFuelPrompt() {
  return document.getElementById("fuel-prompt");
}

function closeFuelPrompt() {
  const root = getFuelPrompt();
  if (!root || root.hidden) return;
  root.hidden = true;
  root.setAttribute("aria-hidden", "true");
  document.body.classList.remove("fuel-prompt-open");
  document.removeEventListener("keydown", onFuelPromptKeydown);
  const restore = fuelPromptReturnFocus;
  fuelPromptReturnFocus = null;
  if (restore && typeof restore.focus === "function") {
    try {
      restore.focus();
    } catch {
      /* ignore */
    }
  }
}

function onFuelPromptKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeFuelPrompt();
    return;
  }
  if (event.key !== "Tab") return;
  const root = getFuelPrompt();
  if (!root || root.hidden) return;
  const focusable = root.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function ensureFuelPrompt() {
  let root = getFuelPrompt();
  if (root) return root;

  root = document.createElement("div");
  root.id = "fuel-prompt";
  root.className = "fuel-prompt";
  root.hidden = true;
  root.setAttribute("aria-hidden", "true");
  root.innerHTML =
    '<div class="fuel-prompt-backdrop" data-fuel-dismiss></div>' +
    '<div class="fuel-prompt-panel" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="fuel-prompt-title" aria-describedby="fuel-prompt-copy">' +
    '<button type="button" class="fuel-prompt-close" data-fuel-dismiss aria-label="Close">×</button>' +
    '<p class="fuel-prompt-kicker">Fuel the fire</p>' +
    '<h2 id="fuel-prompt-title">Do you want to add funds to fuel the fire?</h2>' +
    '<p id="fuel-prompt-copy" class="fuel-prompt-copy">' +
    "This will help fund the torches staying lit, the bots investing, and the conversations flowing. " +
    "It also helps me know you want more of this. " +
    "Clicking the add fuel button will take you to a Stripe page so you can contribute." +
    "</p>" +
    '<div class="fuel-prompt-actions">' +
    '<a class="btn ember" href="' +
    CONTRIBUTE.url +
    '" target="_blank" rel="noopener noreferrer" data-fuel-go>Add Fuel</a>' +
    '<button type="button" class="btn ghost" data-fuel-dismiss>Not now</button>' +
    "</div>" +
    "</div>";

  root.addEventListener("click", (event) => {
    const go = event.target.closest("[data-fuel-go]");
    if (go) {
      closeFuelPrompt();
      return;
    }
    if (event.target.closest("[data-fuel-dismiss]")) {
      event.preventDefault();
      closeFuelPrompt();
    }
  });

  document.body.appendChild(root);
  return root;
}

function openFuelPrompt(trigger) {
  const root = ensureFuelPrompt();
  fuelPromptReturnFocus =
    trigger && typeof trigger.focus === "function"
      ? trigger
      : document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  root.hidden = false;
  root.setAttribute("aria-hidden", "false");
  document.body.classList.add("fuel-prompt-open");
  document.addEventListener("keydown", onFuelPromptKeydown);
  const primary = root.querySelector("[data-fuel-go]");
  const panel = root.querySelector(".fuel-prompt-panel");
  const focusTarget = primary || panel;
  if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
}

function isFuelPromptTrigger(el) {
  if (!el || el.closest("#fuel-prompt")) return false;
  if (el.closest("[data-contribute]")) return true;
  if (el.closest("a.pot-fuel")) return true;
  if (el.closest(".contribute-note a[href]")) return true;
  return false;
}

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

  if (!document.querySelector('script[src*="buy-button.js"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://js.stripe.com/v3/buy-button.js";
    document.head.appendChild(script);
  }

  if (!document.documentElement.dataset.fuelPromptBound) {
    document.documentElement.dataset.fuelPromptBound = "true";
    document.addEventListener(
      "click",
      (event) => {
        const trigger = event.target.closest(
          "a[data-contribute], a.pot-fuel, .contribute-note a"
        );
        if (!isFuelPromptTrigger(trigger)) return;
        event.preventDefault();
        openFuelPrompt(trigger);
      },
      true
    );
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
initArchifyEmbedFlow();
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
