#!/usr/bin/env node
/** Tue Sep 22 2026 MID — contestant fills + living marks. Snapshot s1e07-tue-mid. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));
const booksAfter = JSON.parse(
  readFileSync(join(root, "recs", "2026-09-22-mid", "BOOKS.after.json"), "utf8")
);
const remake = JSON.parse(readFileSync(join(root, "recs", "2026-09-22-mid", "REMAKE.json"), "utf8"));
const fills = JSON.parse(readFileSync(join(root, "recs", "2026-09-22-mid", "FILLS.json"), "utf8"));

const MARK_AT = remake.asOf;
const LAST_SESSION = fills.session;
const POT_USD = remake.islandPotUsd;

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

const LAST_QUOTES = remake.quotes;

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

function nameToId(who) {
  return IDS[who] || null;
}

/** Living lots only — match post-mid tickersSummary (tape may still list sold lots for audit). */
function livingPositionsFromTape(bookRow) {
  const livingTickers = new Set(
    String(bookRow.tickersSummary || "")
      .split("+")
      .map((t) => t.trim())
      .filter((t) => t && t !== "CASH")
  );
  return (bookRow.positions || []).filter((p) => {
    if (p.action === "SELL") return false;
    if (p.action === "CASH" || p.ticker === "CASH") return true;
    return livingTickers.has(p.ticker);
  });
}

const tueOpen = (season.events || []).find((e) => e && e.id === "s1e07-tue-open");
if (!tueOpen) {
  console.error("s1e07-tue-open mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e07-tue-mid")) {
  console.error("s1e07-tue-mid already present — abort");
  process.exit(1);
}

const standingById = new Map(remake.standings.map((row) => [row.id, row]));

for (const bookRow of booksAfter) {
  const row = season.survivors.find((s) => s.id === bookRow.id);
  if (!row || row.status !== "active") continue;
  const host = standingById.get(bookRow.id);
  row.positions = livingPositionsFromTape(bookRow);
  row.cashUsd = bookRow.cashUsd;
  row.tickersSummary = bookRow.tickersSummary;
  row.bookUsd = bookRow.bookUsd;
  row.weekPct = bookRow.weekPct;
  row.dayPct = bookRow.dayPct;
  row.monthPct = monthPctFromWeek(bookRow.weekPct);
  row.priorMarkUsd = bookRow.priorMarkUsd;
  row.eodMarkUsd = bookRow.eodMarkUsd;
  row.immune = host && host.name === remake.immunity.name;
  row.lastSource = remake.quoteSource;
  row.lastSession = LAST_SESSION;
  if (row.position) {
    row.position = {
      action: "HOLD",
      ticker: bookRow.tickersSummary.replace(/\+/g, " / "),
      sizeUsd: bookRow.bookUsd,
      status: "filled",
      note: bookRow.tickersSummary.toLowerCase().replace(/\+cash/g, "").replace(/\+/g, " / ")
    };
  }
}

const lastRecorded = {};
let biduWeek = 0;
let askaraWeek = 0;
let biduDay = 0;
let askaraDay = 0;
let biduCount = 0;
let askaraCount = 0;

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const bookRow = booksAfter.find((b) => b.id === row.id);
  if (!bookRow) continue;

  lastRecorded[row.id] = {
    bookUsd: bookRow.bookUsd,
    weekPct: bookRow.weekPct,
    monthPct: monthPctFromWeek(bookRow.weekPct),
    dayPct: bookRow.dayPct,
    priorMarkUsd: bookRow.priorMarkUsd,
    eodMarkUsd: bookRow.eodMarkUsd
  };

  if (row.tribeId === "bidu") {
    biduWeek += bookRow.weekPct;
    biduDay += bookRow.dayPct;
    biduCount += 1;
  }
  if (row.tribeId === "askara") {
    askaraWeek += bookRow.weekPct;
    askaraDay += bookRow.dayPct;
    askaraCount += 1;
  }
}

for (const [ticker, last] of Object.entries(LAST_QUOTES)) {
  const q = season.quotes[ticker] || {};
  const prior = tueOpen.marks?.[ticker] ?? q.priorClose;
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: remake.quoteSource,
    session: LAST_SESSION,
    date: "2026-09-22",
    asOf: MARK_AT,
    priorClose: prior,
    priorCloseDate: "2026-09-21",
    priorCloseSource: "sip-list-exchange-close (Mon Sep 21 official)",
    interpolated: false
  };
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 4;
    t.combinedWeekPct = biduCount ? round4(biduWeek / biduCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = biduCount ? round4(biduDay / biduCount) : 0;
  }
  if (t.id === "askara") {
    t.livingCount = 1;
    t.combinedWeekPct = askaraCount ? round4(askaraWeek / askaraCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = askaraCount ? round4(askaraDay / askaraCount) : 0;
  }
}

const midFills = [];

for (const s of fills.sells || []) {
  const survivorId = nameToId(s.who);
  if (!survivorId) continue;
  midFills.push({
    type: "fill",
    id: `fill-${s.orderId.slice(0, 8)}-${s.symbol.toLowerCase()}-sell`,
    survivorId,
    side: "sell",
    ticker: s.symbol,
    qty: s.qty,
    avg: s.avg,
    sizeUsd: s.notional,
    orderId: s.orderId,
    at: s.at,
    note: `Tue Sep 22 mid SELL ${s.symbol} ${s.qty} · ${s.open_lot_id ? `open_lot_id ${s.open_lot_id}` : ""}`.trim()
  });
}

for (const b of fills.buys || []) {
  const survivorId = nameToId(b.who);
  if (!survivorId) continue;
  midFills.push({
    type: "fill",
    id: `fill-${b.orderId.slice(0, 8)}-${b.symbol.toLowerCase()}-buy`,
    survivorId,
    side: "buy",
    ticker: b.symbol,
    qty: b.qty,
    avg: b.avg,
    sizeUsd: b.notional,
    orderId: b.orderId,
    at: b.at,
    note: `Tue Sep 22 mid BUY ${b.symbol} $${b.dollar}`
  });
}

season.events.push(...midFills);
season.events.push({
  type: "mark",
  id: "s1e07-tue-mid",
  kind: "mid",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Tue Sep 22 2026 MID · robinhood last after fills (~10:21 AM PT). Snapshot s1e07-tue-mid. Contestant fills. MERGED · five living.",
  dayPctPriorOfficial: true,
  dayPctPriorCloseDate: "2026-09-21",
  quoteSource: remake.quoteSource,
  recorded: lastRecorded,
  tribes: {
    bidu: {
      combinedWeekPct: biduCount ? round4(biduWeek / biduCount) : 0,
      combinedMonthPct: biduCount ? round4((biduWeek / biduCount) * 2) : 0,
      combinedDayPct: biduCount ? round4(biduDay / biduCount) : 0,
      livingCount: 4
    },
    askara: {
      combinedWeekPct: askaraCount ? round4(askaraWeek / askaraCount) : 0,
      combinedMonthPct: askaraCount ? round4((askaraWeek / askaraCount) * 2) : 0,
      combinedDayPct: askaraCount ? round4(askaraDay / askaraCount) : 0,
      livingCount: 1
    }
  },
  immunity: remake.immunity,
  potUsd: POT_USD,
  fillsSinceOpen: [],
  fillsSinceLastHour: midFills,
  marks: LAST_QUOTES,
  upgradesSnapshotId: "s1e07-tue-open"
});

season.liveSnapshotId = remake.snapshotId;
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Tue Sep 22 MID · robinhood last after fills (~10:21 AM PT). Snapshot s1e07-tue-mid. Leader GPT-5.6 Luna -0.48%. Worst Composer 2.5 -6.00%.";
season.dayPctBasis = remake.dayPctBasis;
season.weekPctBasis = remake.weekPctBasis;
season.statusLabel =
  "Live · Episode 7 · Tue mid · immunity GPT-5.6 Luna -0.48% · pot $379.21";
season.lastSource = remake.quoteSource;
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E07 live Mon Sep 21 – Tue Sep 22. MERGED. Five living. Tue mid remake after hunt-brain fills. Given $361.93. Pot $379.21. GPT-5.6 Luna leads −0.48% and wears immunity. Composer 2.5 worst −6.00%. Comics paused. Audience only. Tribal Tue Sep 22 2:00 PM PT.";
season.immunity = { ...remake.immunity, snapshotId: remake.snapshotId };

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e07-tue-mid · islandPotUsd", season.islandPotUsd, "· immunity GPT-5.6 Luna -0.48%");
