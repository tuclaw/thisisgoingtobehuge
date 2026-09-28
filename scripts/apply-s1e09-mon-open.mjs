#!/usr/bin/env node
/** Mon Sep 28 2026 OPEN — Sonnet boot pin + contestant fills + living marks. Snapshot s1e09-mon-open. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const recDir = join(root, "recs", "2026-09-28-open");
const season = JSON.parse(readFileSync(path, "utf8"));
const booksPayload = JSON.parse(readFileSync(join(recDir, "BOOKS.after.json"), "utf8"));
const remake = JSON.parse(readFileSync(join(recDir, "REMAKE.json"), "utf8"));
const fillsRaw = JSON.parse(readFileSync(join(recDir, "FILLS.json"), "utf8"));

const MARK_AT = remake.asOf;
const LAST_SESSION = fillsRaw.session;
const POT_USD = remake.islandPotUsd;

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
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

function livingPositionsFromTape(bookRow) {
  const livingTickers = new Set(
    String(bookRow.tickersSummary || "")
      .split("+")
      .map((t) => t.trim())
      .filter((t) => t && t !== "CASH")
  );
  const positions = (bookRow.positions || bookRow.held || []).filter((p) => {
    if (p.action === "SELL") return false;
    if (p.action === "CASH" || p.ticker === "CASH") return true;
    return livingTickers.has(p.ticker);
  });
  const hasCash = positions.some((p) => p.ticker === "CASH" || p.action === "CASH");
  if (!hasCash && typeof bookRow.cashUsd === "number") {
    positions.push({
      action: "CASH",
      ticker: "CASH",
      sizeUsd: bookRow.cashUsd,
      status: "filled",
      note: "cash remainder"
    });
  }
  return positions;
}

const friTribal = (season.events || []).find((e) => e && e.id === "s1e08-fri-tribal");
const friEodRth = (season.events || []).find((e) => e && e.id === "s1e08-fri-eod-rth");
if (!friTribal) {
  console.error("s1e08-fri-tribal missing");
  process.exit(1);
}
if (!friEodRth) {
  console.error("s1e08-fri-eod-rth mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e09-mon-open")) {
  console.error("s1e09-mon-open already present — abort");
  process.exit(1);
}

const standingById = new Map((booksPayload.living || []).map((row) => [row.id, row]));

const booksAfter = (booksPayload.living || []).map((book) => {
  const host = remake.standings.find((s) => s.name === book.name);
  if (!host) {
    console.error(`missing standing for ${book.name}`);
    process.exit(1);
  }
  return {
    name: book.name,
    id: book.id,
    tribeId: book.tribeId,
    tribeLabel: book.origin,
    tickersSummary: book.tickersSummary || host.tickers,
    cashUsd: book.cashUsd,
    bookUsd: book.bookUsd,
    weekPct: book.weekPct,
    dayPct: book.dayPct,
    priorMarkUsd: book.priorMarkUsd,
    eodMarkUsd: book.eodMarkUsd,
    positions: book.positions || book.held || []
  };
});

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
  row.immune = Boolean(host && host.immune);
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
  const prior = friEodRth.marks?.[ticker] ?? q.priorClose;
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: remake.quoteSource,
    session: LAST_SESSION,
    date: "2026-09-28",
    asOf: MARK_AT,
    priorClose: prior,
    priorCloseDate: "2026-09-25",
    priorCloseSource: "robinhood-last-trade (Fri Sep 25 RTH-EOD · s1e08-fri-eod-rth)",
    interpolated: false
  };
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = biduCount;
    t.combinedWeekPct = biduCount ? round4(biduWeek / biduCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = biduCount ? round4(biduDay / biduCount) : 0;
  }
  if (t.id === "askara") {
    t.livingCount = askaraCount;
    t.combinedWeekPct = askaraCount ? round4(askaraWeek / askaraCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = askaraCount ? round4(askaraDay / askaraCount) : 0;
  }
}

const openFills = [];

for (const o of fillsRaw.bootLiquidations || []) {
  openFills.push({
    type: "fill",
    id: `fill-${o.orderId.slice(0, 8)}-${String(o.ticker).toLowerCase()}-boot-sell`,
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: o.ticker,
    qty: o.qty,
    avg: o.avg,
    sizeUsd: o.notional,
    orderId: o.orderId,
    at: o.filledAt,
    note: `Mon Sep 28 open boot broker Claude Sonnet 5 SELL ${o.ticker} ${o.qty} (books credited Fri tribal · pin Sonnet lots only · ${o.note || ""})`.trim()
  });
}

for (const f of fillsRaw.contestantFills || []) {
  const survivorId = nameToId(f.name);
  if (!survivorId) continue;
  const side = String(f.side || "").toLowerCase();
  openFills.push({
    type: "fill",
    id: `fill-${f.orderId.slice(0, 8)}-${String(f.ticker).toLowerCase()}-${side}`,
    survivorId,
    side,
    ticker: f.ticker,
    qty: f.qty,
    avg: f.avg,
    sizeUsd: f.notional,
    orderId: f.orderId,
    at: f.filledAt,
    note:
      side === "buy"
        ? `Mon Sep 28 open BUY ${f.ticker} $${f.dollar_amount}${f.note ? ` · ${f.note}` : ""}`
        : `Mon Sep 28 open SELL ${f.ticker} ${f.qty}${f.open_lot_id ? ` · open_lot_id ${f.open_lot_id}` : ""}${f.note ? ` · ${f.note}` : ""}`
  });
}

season.events.push(...openFills);
season.events.push({
  type: "mark",
  id: "s1e09-mon-open",
  kind: "open",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Mon Sep 28 2026 OPEN · robinhood last after fills (~6:51 AM PT). Snapshot s1e09-mon-open. Sonnet boot AR+SPY pin + contestant fills. MERGED · three living.",
  dayPctPriorOfficial: true,
  dayPctPriorCloseDate: "2026-09-25",
  quoteSource: remake.quoteSource,
  recorded: lastRecorded,
  tribes: {
    bidu: {
      combinedWeekPct: biduCount ? round4(biduWeek / biduCount) : 0,
      combinedMonthPct: biduCount ? round4((biduWeek / biduCount) * 2) : 0,
      combinedDayPct: biduCount ? round4(biduDay / biduCount) : 0,
      livingCount: biduCount
    },
    askara: {
      combinedWeekPct: askaraCount ? round4(askaraWeek / askaraCount) : 0,
      combinedMonthPct: askaraCount ? round4((askaraWeek / askaraCount) * 2) : 0,
      combinedDayPct: askaraCount ? round4(askaraDay / askaraCount) : 0,
      livingCount: askaraCount
    }
  },
  immunity: remake.immunity,
  potUsd: POT_USD,
  bootLiquidation: remake.bootLiquidation,
  huntScore: remake.huntScore,
  fillsSinceOpen: openFills.filter((fill) => fill.survivorId !== IDS["Claude Sonnet 5"]),
  fillsSinceLastHour: [],
  marks: LAST_QUOTES,
  upgradesSnapshotId: "s1e08-fri-tribal"
});

season.liveSnapshotId = remake.snapshotId;
season.lastSnapshotId = remake.snapshotId;
season.lastRemakeAt = MARK_AT;
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Mon Sep 28 open remake · Robinhood last · snapshot s1e09-mon-open. hunt-brain 3/3. Leader Claude Opus 5 -0.454%. Worst GPT-5.6 Luna -2.7947%.";
season.dayPctBasis = "vs Episode 9 carry priorMarkUsd (Fri tribal post-split priors · s1e08-fri-tribal)";
season.weekPctBasis = "vs Episode 9 carry priorMarkUsd (Fri tribal post-split priors · s1e08-fri-tribal)";
season.statusLabel = "Live · Episode 9 · Mon open · three living · MERGED · comics paused";
season.lastSource = remake.quoteSource;
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E09 Mon Sep 28 – Tue Sep 29. MERGED. Three living. Mon open remake after Sonnet boot pin + hunt-brain fills. Given $361.93. Pot $364.6126. Claude Opus 5 leads −0.454% and wears immunity. GPT-5.6 Luna worst −2.7947%. hunt-brain 3/3. Comics paused. Audience only. Tribal Tue Sep 29 2:00 PM PT.";
season.immunity = { ...remake.immunity, snapshotId: remake.snapshotId };

const e9 = (season.episodes || []).find((ep) => ep && ep.id === "s1e09");
if (e9) {
  e9.liveSnapshotId = remake.snapshotId;
  e9.islandPotUsd = POT_USD;
  e9.immunity = {
    name: remake.immunity.name,
    weekPct: round4(remake.immunity.weekPct),
    survivorId: remake.immunity.survivorId,
    asOf: remake.immunity.asOf
  };
  e9.weekBoardSnapshotId = remake.snapshotId;
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log(
  "Applied s1e09-mon-open · islandPotUsd",
  season.islandPotUsd,
  "· immunity Claude Opus 5",
  remake.immunity.weekPct + "%"
);
