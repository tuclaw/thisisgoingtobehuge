#!/usr/bin/env node
/** Mon Sep 28 2026 MID — contestant fills + living marks. Snapshot s1e09-mon-mid. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const recDir = join(root, "recs", "2026-09-28-mid");
const season = JSON.parse(readFileSync(path, "utf8"));
const booksPayload = JSON.parse(readFileSync(join(recDir, "BOOKS.after.json"), "utf8"));
const remake = JSON.parse(readFileSync(join(recDir, "REMAKE.json"), "utf8"));
const fillsRaw = JSON.parse(readFileSync(join(recDir, "FILLS.json"), "utf8"));
const quotesPayload = JSON.parse(readFileSync(join(recDir, "QUOTES.json"), "utf8"));

const MARK_AT = remake.asOf;
const LAST_SESSION = fillsRaw.session;
const POT_USD = remake.islandPotUsd;
const SNAPSHOT_ID = remake.snapshotId;

const IDS = {
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
    String(bookRow.tickers || bookRow.tickersSummary || "")
      .split("+")
      .map((t) => t.trim())
      .filter((t) => t && t !== "CASH")
  );
  const positions = (bookRow.positions || []).filter((p) => {
    if (p.action === "SELL") return false;
    if (p.action === "CASH" || p.ticker === "CASH") return true;
    return livingTickers.has(p.ticker);
  });
  const hasCash = positions.some((p) => p.ticker === "CASH" || p.action === "CASH");
  if (!hasCash && typeof bookRow.cash === "number") {
    positions.push({
      action: "CASH",
      ticker: "CASH",
      sizeUsd: bookRow.cash,
      status: "cash",
      note: "cash remainder"
    });
  }
  return positions.map((p) => {
    const out = { ...p };
    if (out.action === "CASH" || out.ticker === "CASH") {
      out.status = out.status || "cash";
      return out;
    }
    out.status = out.status || "filled";
    return out;
  });
}

const monOpen = (season.events || []).find((e) => e && e.id === "s1e09-mon-open");
if (!monOpen) {
  console.error("s1e09-mon-open mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === SNAPSHOT_ID)) {
  console.error(`${SNAPSHOT_ID} already present — abort`);
  process.exit(1);
}

const standingByName = new Map((remake.standings || []).map((row) => [row.name, row]));

for (const bookRow of booksPayload.living || []) {
  const row = season.survivors.find((s) => s.id === bookRow.survivorId);
  if (!row || row.status !== "active") continue;
  const host = standingByName.get(bookRow.name);
  row.positions = livingPositionsFromTape(bookRow);
  row.cashUsd = bookRow.cash;
  row.tickersSummary = bookRow.tickers;
  row.bookUsd = bookRow.bookUsd;
  row.weekPct = bookRow.weekPct;
  row.dayPct = bookRow.dayPct;
  row.monthPct = monthPctFromWeek(bookRow.weekPct);
  row.priorMarkUsd = bookRow.priorMarkUsd;
  row.eodMarkUsd = bookRow.bookUsd;
  row.immune = Boolean(host && host.immune);
  row.lastSource = remake.quoteSource;
  row.lastSession = LAST_SESSION;
  if (row.position) {
    const tick = bookRow.tickers.replace(/\+CASH/g, "").replace(/\+/g, " / ");
    row.position = {
      action: "HOLD",
      ticker: tick.includes("CASH") ? tick : `${tick} / CASH`,
      sizeUsd: bookRow.bookUsd,
      status: "filled",
      note: tick.toLowerCase().replace(/ \/ cash/g, "")
    };
  }
}

const midRecorded = {};
let biduWeek = 0;
let askaraWeek = 0;
let biduDay = 0;
let askaraDay = 0;
let biduCount = 0;
let askaraCount = 0;

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const bookRow = (booksPayload.living || []).find((b) => b.survivorId === row.id);
  if (!bookRow) continue;

  const priorMarkUsd = monOpen.recorded[row.id]?.priorMarkUsd ?? bookRow.priorMarkUsd;

  midRecorded[row.id] = {
    bookUsd: bookRow.bookUsd,
    weekPct: bookRow.weekPct,
    monthPct: monthPctFromWeek(bookRow.weekPct),
    dayPct: bookRow.dayPct,
    priorMarkUsd,
    eodMarkUsd: bookRow.bookUsd
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

const priorClose = quotesPayload.priorClose || remake.priorClose;
const priorCloseDate = quotesPayload.priorCloseDate || remake.priorCloseDate;

for (const [ticker, last] of Object.entries(LAST_QUOTES)) {
  const q = season.quotes[ticker] || {};
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: remake.quoteSource,
    session: LAST_SESSION,
    date: "2026-09-28",
    asOf: MARK_AT,
    priorClose: priorClose[ticker] ?? q.priorClose,
    priorCloseDate,
    priorCloseSource: `robinhood-last (Fri Sep 25 tribal carry · prior official close ${priorCloseDate})`,
    interpolated: false
  };
  if (quotesPayload.venueLastTradeTimesZ && quotesPayload.venueLastTradeTimesZ[ticker]) {
    season.quotes[ticker].venueLastTradeTimeZ = quotesPayload.venueLastTradeTimesZ[ticker];
  }
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 2;
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

for (const f of fillsRaw.contestantFills || []) {
  const survivorId = nameToId(f.name);
  if (!survivorId) continue;
  const side = String(f.side || "").toLowerCase();
  const ticker = f.ticker;
  midFills.push({
    type: "fill",
    id: `fill-${String(f.orderId).slice(0, 8)}-${ticker.toLowerCase()}-${side}`,
    survivorId,
    side,
    ticker,
    qty: f.qty,
    avg: f.avg,
    sizeUsd: f.notional,
    orderId: f.orderId,
    at: f.filledAt,
    note: `Mon Sep 28 mid ${side.toUpperCase()} ${ticker} ${f.qty}${f.open_lot_id ? ` · open_lot_id ${f.open_lot_id}` : ""}`
  });
}

season.events.push(...midFills);
season.events.push({
  type: "mark",
  id: SNAPSHOT_ID,
  kind: "mid",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Mon Sep 28 2026 MID · robinhood last after fills (~10:10 AM PT). Snapshot s1e09-mon-mid. Contestant fills. MERGED · three living.",
  dayPctPriorOfficial: false,
  dayPctPriorCloseDate: priorCloseDate,
  quoteSource: remake.quoteSource,
  recorded: midRecorded,
  tribes: {
    bidu: {
      combinedWeekPct: biduCount ? round4(biduWeek / biduCount) : 0,
      combinedMonthPct: biduCount ? round4((biduWeek / biduCount) * 2) : 0,
      combinedDayPct: biduCount ? round4(biduDay / biduCount) : 0,
      livingCount: 2
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
  huntScore: remake.huntScore,
  fillsSinceOpen: midFills,
  fillsSinceLastHour: [],
  marks: LAST_QUOTES,
  upgradesSnapshotId: "s1e09-mon-open"
});

season.liveSnapshotId = SNAPSHOT_ID;
season.lastSnapshotId = SNAPSHOT_ID;
season.lastRemakeAt = MARK_AT;
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Mon Sep 28 mid remake · Robinhood last · snapshot s1e09-mon-mid. hunt-brain 3/3. Immunity Claude Opus 5 −0.8386%. Worst GPT-5.6 Luna −3.7713%.";
season.dayPctBasis = "vs priorMarkUsd (Episode 9 week carry · in-session mid marks)";
season.weekPctBasis = "vs Episode 9 carry priorMarkUsd (Fri Sep 25 tribal split)";
season.statusLabel = "Live · Episode 9 · Mon mid · three living · MERGED";
season.lastSource = remake.quoteSource;
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E09 Mon Sep 28 – Tue Sep 29. MERGED. Three living. Mon mid remake after hunt-brain fills. Given $361.93. Pot $362.7380. Claude Opus 5 immunity −0.8386%. GPT-5.6 Luna worst −3.7713%. hunt-brain 3/3. Comics paused. Audience only. Tribal Tue Sep 29 2:00 PM PT.";
season.immunity = { ...remake.immunity, snapshotId: SNAPSHOT_ID };

const e9 = (season.episodes || []).find((ep) => ep && ep.id === "s1e09");
if (e9) {
  e9.liveSnapshotId = SNAPSHOT_ID;
  e9.islandPotUsd = POT_USD;
  e9.immunity = {
    name: remake.immunity.name,
    weekPct: round4(remake.immunity.weekPct),
    survivorId: remake.immunity.survivorId,
    asOf: remake.immunity.asOf,
    at: remake.immunity.at
  };
  e9.weekBoardSnapshotId = SNAPSHOT_ID;
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log(`Applied ${SNAPSHOT_ID} · islandPotUsd`, season.islandPotUsd, "· immunity", remake.immunity.name, remake.immunity.weekPct);
