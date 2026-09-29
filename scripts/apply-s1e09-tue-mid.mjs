#!/usr/bin/env node
/** Tue Sep 29 2026 MID — contestant fills + living marks. Snapshot s1e09-tue-mid. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const recDir = join(root, "recs", "2026-09-29-mid");
const season = JSON.parse(readFileSync(path, "utf8"));
const booksPayload = JSON.parse(readFileSync(join(recDir, "BOOKS.after.json"), "utf8"));
const remake = JSON.parse(readFileSync(join(recDir, "REMAKE.json"), "utf8"));
const fillsRaw = JSON.parse(readFileSync(join(recDir, "FILLS.json"), "utf8"));

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

function nameToId(who) {
  return IDS[who] || null;
}

function positionsFromBooks(bookRow, marks, quoteSource) {
  const positions = [];
  for (const p of bookRow.positions || []) {
    const last = marks[p.ticker];
    const sizeUsd =
      p.dollarBuy ??
      (p.mark != null ? p.mark : round4(parseFloat(p.qty) * parseFloat(p.avg)));
    positions.push({
      action: "BUY",
      ticker: p.ticker,
      qty: p.qty,
      avg: String(p.avg),
      sizeUsd: typeof p.dollarBuy === "number" ? p.dollarBuy : round4(parseFloat(p.qty) * parseFloat(p.avg)),
      status: "filled",
      orderId: p.orderId,
      open_lot_id: p.open_lot_id,
      last,
      lastSource: quoteSource,
      lastSession: LAST_SESSION,
      liveMv: p.mark ?? (last != null ? round4(parseFloat(p.qty) * last) : undefined),
      liveUsd: sizeUsd,
      is_selectable: p.is_selectable,
      note: p.is_selectable === false ? "Tue mid BUY (syncing)" : "HOLD / open lot"
    });
  }
  positions.push({
    action: "CASH",
    ticker: "CASH",
    sizeUsd: bookRow.cash,
    status: "cash",
    note: "Tue Sep 29 mid",
    liveMv: bookRow.cash
  });
  return positions;
}

const tueOpen = (season.events || []).find((e) => e && e.id === "s1e09-tue-open");
if (!tueOpen) {
  console.error("s1e09-tue-open mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === SNAPSHOT_ID)) {
  console.error(`${SNAPSHOT_ID} already present — abort`);
  process.exit(1);
}

const standingByName = new Map((remake.standings || []).map((row) => [row.name, row]));

for (const bookRow of booksPayload.living || []) {
  const survivorId = nameToId(bookRow.name);
  const row = season.survivors.find((s) => s.id === survivorId);
  if (!row || row.status !== "active") continue;
  const host = standingByName.get(bookRow.name);
  row.positions = positionsFromBooks(bookRow, LAST_QUOTES, remake.quoteSource);
  row.cashUsd = bookRow.cash;
  row.tickersSummary = bookRow.tickers;
  row.bookUsd = bookRow.bookUsd;
  row.weekPct = bookRow.weekPct;
  row.dayPct = bookRow.dayPct;
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
  const bookRow = (booksPayload.living || []).find((b) => nameToId(b.name) === row.id);
  if (!bookRow) continue;

  const priorMarkUsd = tueOpen.recorded[row.id]?.priorMarkUsd ?? bookRow.priorMarkUsd;

  midRecorded[row.id] = {
    bookUsd: bookRow.bookUsd,
    weekPct: bookRow.weekPct,
    monthPct: row.monthPct,
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

const priorClose = remake.priorClose || tueOpen.marks || {};
const priorCloseDate = remake.priorCloseDate || "2026-09-28";

for (const [ticker, last] of Object.entries(LAST_QUOTES)) {
  const q = season.quotes[ticker] || {};
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: remake.quoteSource,
    session: LAST_SESSION,
    date: "2026-09-29",
    asOf: MARK_AT,
    priorClose: priorClose[ticker] ?? q.priorClose ?? q.sip,
    priorCloseDate,
    priorCloseSource: `sip-list-exchange-close (Mon Sep 28 official · s1e09-mon-eod-sip)`,
    interpolated: false
  };
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
  const side = String(f.side || "").toUpperCase();
  if (side === "HOLD") continue;
  const survivorId = nameToId(f.name);
  if (!survivorId) continue;
  const ticker = f.ticker;
  const lotNote = f.open_lot_id ? ` · open_lot_id ${f.open_lot_id}` : "";
  midFills.push({
    type: "fill",
    id: `fill-${String(f.orderId).slice(0, 8)}-${ticker.toLowerCase()}-${side.toLowerCase()}`,
    survivorId,
    side: side.toLowerCase(),
    ticker,
    qty: f.qty,
    avg: f.avg,
    sizeUsd: f.notional ?? f.dollar_amount,
    orderId: f.orderId,
    at: f.filledAt,
    note: `Tue Sep 29 mid ${side} ${ticker} ${f.qty}${lotNote}`
  });
}

const immunity = { ...remake.immunity, at: MARK_AT, snapshotId: SNAPSHOT_ID };

season.events.push(...midFills);
season.events.push({
  type: "mark",
  id: SNAPSHOT_ID,
  kind: "mid",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Tue Sep 29 2026 MID · robinhood last after fills (~10:11 AM PT). Snapshot s1e09-tue-mid. Contestant fills. MERGED · three living.",
  dayPctPriorOfficial: remake.dayPctPriorOfficial,
  dayPctPriorCloseDate: remake.dayPctPriorCloseDate,
  dayPctBasisNote: "Tue episode dayPct vs priorMarkUsd (Fri Sep 25 tribal carry), same as weekPct",
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
  immunity,
  potUsd: POT_USD,
  huntScore: remake.huntScore || "3/3",
  buyScale: fillsRaw.buyScale,
  fillsSinceOpen: midFills,
  fillsSinceLastHour: [],
  marks: LAST_QUOTES,
  upgradesSnapshotId: "s1e09-tue-open",
  snapshotId: SNAPSHOT_ID,
  standings: remake.standings.map((s) => ({
    name: s.name,
    bookUsd: s.book,
    weekPct: s.week,
    dayPct: s.day,
    cashUsd: s.cash,
    position: s.tickers,
    immune: s.immune
  }))
});

season.liveSnapshotId = SNAPSHOT_ID;
season.lastSnapshotId = SNAPSHOT_ID;
season.lastRemakeAt = MARK_AT;
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Tue Sep 29 MID · robinhood last after fills (~10:11 AM PT). Snapshot s1e09-tue-mid. Leader Claude Opus 5 -0.7115%. Worst GPT-5.6 Luna -4.0483%.";
season.dayPctBasis = "vs priorMarkUsd (Episode 9 week carry · in-session mid marks)";
season.weekPctBasis = "vs Episode 9 carry priorMarkUsd (Fri Sep 25 tribal split)";
season.statusLabel = "Episode 9 · Tue mid · three living · MERGED · comics paused";
season.lastSource = remake.quoteSource;
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E09 Mon Sep 28 – Tue Sep 29. MERGED. Three living. Tue mid remake after hunt-brain fills (no BP scale). Given $361.93. Pot $361.5263. Claude Opus 5 immunity −0.7115%. GPT-5.6 Luna worst −4.0483%. hunt-brain 3/3. Comics paused. Audience only. Tribal Tue Sep 29 2:00 PM PT.";
season.immunity = immunity;

const e9 = (season.episodes || []).find((ep) => ep && ep.id === "s1e09");
if (e9) {
  e9.liveSnapshotId = SNAPSHOT_ID;
  e9.islandPotUsd = POT_USD;
  e9.immunity = {
    name: immunity.name,
    weekPct: round4(immunity.weekPct),
    survivorId: immunity.survivorId,
    asOf: remake.immunity.asOf,
    at: immunity.at
  };
  e9.weekBoardSnapshotId = SNAPSHOT_ID;
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log(`Applied ${SNAPSHOT_ID} · islandPotUsd`, season.islandPotUsd, "· immunity", immunity.name, immunity.weekPct);
