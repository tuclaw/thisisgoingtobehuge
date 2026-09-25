#!/usr/bin/env node
/** Fri Sep 25 2026 LAST-HOUR — contestant fills + living marks. Snapshot s1e08-fri-lasthour. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const recDir = join(root, "recs", "2026-09-25-lasthour");
const hostPath = join(recDir, "season1.after-lasthour.json");
const booksPayload = JSON.parse(readFileSync(join(recDir, "BOOKS.after.json"), "utf8"));
const remake = JSON.parse(readFileSync(join(recDir, "REMAKE.json"), "utf8"));
const fills = JSON.parse(readFileSync(join(recDir, "FILLS.json"), "utf8"));

const season = JSON.parse(readFileSync(path, "utf8"));
let host = JSON.parse(readFileSync(hostPath, "utf8"));

const MARK_AT = remake.asOf;
const LAST_SESSION = fills.session;
const POT_USD = remake.pot ?? remake.islandPotUsd;
const QUOTE_SOURCE = remake.quoteSource ?? "robinhood-last";

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
    String(bookRow.tickersSummary || bookRow.legs || "")
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

function bookRowToPositions(bookRow, session) {
  const legs = bookRow.legs || bookRow.tickersSummary || "";
  const tickers = new Set(
    legs
      .split("+")
      .map((t) => t.trim())
      .filter((t) => t && t !== "CASH")
  );
  const positions = (bookRow.positions || [])
    .filter((p) => p.ticker && p.ticker !== "CASH" && tickers.has(p.ticker))
    .map((p) => ({
      action: "BUY",
      ticker: p.ticker,
      qty: p.qty,
      avg: p.avg,
      sizeUsd: p.markUsd ?? p.sizeUsd,
      status: "filled",
      note: p.note,
      orderId: p.orderId,
      open_lot_id: p.open_lot_id,
      last: p.last,
      lastSource: QUOTE_SOURCE,
      lastSession: session,
      liveMv: p.markUsd,
      liveUsd: p.markUsd
    }));
  if (typeof bookRow.cashUsd === "number") {
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

function patchHostFromBooks(hostSeason, livingRows, session) {
  const byId = new Map((livingRows || []).map((row) => [row.id, row]));
  hostSeason.survivors = (hostSeason.survivors || []).map((s) => {
    const bookRow = byId.get(s.id);
    if (!bookRow || s.status !== "active") return s;
    const legs = bookRow.legs || bookRow.tickersSummary;
    const positions = bookRowToPositions(bookRow, session);
    const tickerLabel = legs.replace(/\+/g, " / ");
    return {
      ...s,
      bookUsd: bookRow.bookUsd,
      weekPct: bookRow.weekPct,
      dayPct: bookRow.dayPct,
      monthPct: monthPctFromWeek(bookRow.weekPct),
      cashUsd: bookRow.cashUsd,
      immune: Boolean(bookRow.immune),
      tickersSummary: legs,
      priorMarkUsd: bookRow.priorMarkUsd,
      eodMarkUsd: bookRow.eodMarkUsd,
      lastSource: QUOTE_SOURCE,
      lastSession: session,
      positions,
      position: {
        action: "HOLD",
        ticker: tickerLabel,
        sizeUsd: bookRow.bookUsd,
        status: "filled",
        note: legs.toLowerCase().replace(/\+cash/g, "").replace(/\+/g, " / ")
      }
    };
  });
  hostSeason.islandPotUsd = POT_USD;
  return hostSeason;
}

host = patchHostFromBooks(host, booksPayload.living, LAST_SESSION);
writeFileSync(hostPath, JSON.stringify(host, null, 2) + "\n");

const friMid = (season.events || []).find((e) => e && e.id === "s1e08-fri-mid");
if (!friMid) {
  console.error("s1e08-fri-mid mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e08-fri-lasthour")) {
  console.error("s1e08-fri-lasthour already present — abort");
  process.exit(1);
}

const legsByName = new Map((booksPayload.living || []).map((row) => [row.name, row.legs || row.tickersSummary]));

const hostMap = new Map((host.survivors || []).map((s) => [s.id, s]));
season.survivors = (season.survivors || []).map((s) => {
  const h = hostMap.get(s.id);
  if (!h) return s;
  const legs = legsByName.get(h.name) || h.tickersSummary;
  const merged = { ...h, tickersSummary: legs };
  if (merged.status === "active" && typeof merged.position === "string") {
    merged.position = {
      action: "HOLD",
      ticker: legs.replace(/\+/g, " / "),
      sizeUsd: merged.bookUsd,
      status: "filled",
      note: legs.toLowerCase().replace(/\+cash/g, "").replace(/\+/g, " / ")
    };
  }
  if (merged.status === "active" && merged.position && typeof merged.position === "object") {
    merged.position = {
      ...merged.position,
      ticker: legs.replace(/\+/g, " / "),
      sizeUsd: merged.bookUsd,
      note: legs.toLowerCase().replace(/\+cash/g, "").replace(/\+/g, " / ")
    };
  }
  merged.positions = livingPositionsFromTape({
    tickersSummary: legs,
    positions: merged.positions || []
  });
  merged.monthPct = monthPctFromWeek(merged.weekPct);
  merged.immune = merged.name === remake.immunity.name;
  merged.lastSource = QUOTE_SOURCE;
  merged.lastSession = LAST_SESSION;
  return merged;
});

let biduWeek = 0;
let askaraWeek = 0;
let biduDay = 0;
let askaraDay = 0;
let biduCount = 0;
let askaraCount = 0;
const lastRecorded = {};

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const priorMarkUsd = friMid.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = friMid.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd;
  const bookUsd = row.bookUsd;
  const weekPct = row.weekPct;
  const dayPct = row.dayPct;

  lastRecorded[row.id] = {
    bookUsd,
    weekPct,
    monthPct: monthPctFromWeek(weekPct),
    dayPct,
    priorMarkUsd,
    eodMarkUsd
  };

  if (row.tribeId === "bidu") {
    biduWeek += weekPct;
    biduDay += dayPct;
    biduCount += 1;
  }
  if (row.tribeId === "askara") {
    askaraWeek += weekPct;
    askaraDay += dayPct;
    askaraCount += 1;
  }
}

for (const [ticker, last] of Object.entries(LAST_QUOTES)) {
  const q = season.quotes[ticker] || {};
  const prior = friMid.marks?.[ticker] ?? q.priorClose;
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: QUOTE_SOURCE,
    session: LAST_SESSION,
    date: "2026-09-25",
    asOf: MARK_AT,
    priorClose: prior,
    priorCloseDate: "2026-09-25",
    priorCloseSource: "robinhood-last (Fri Sep 25 mid · s1e08-fri-mid)",
    interpolated: false
  };
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 3;
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

const lastHourFills = [];

for (const f of fills.contestantFills || []) {
  const survivorId = nameToId(f.name);
  if (!survivorId) continue;
  const side = String(f.side || "").toLowerCase();
  lastHourFills.push({
    type: "fill",
    id: `fill-${f.orderId.slice(0, 8)}-${f.ticker.toLowerCase()}-${side}`,
    survivorId,
    side,
    ticker: f.ticker,
    qty: f.qty,
    avg: f.avg,
    sizeUsd: f.notional,
    orderId: f.orderId,
    at: f.filledAt,
    note: f.note || `Fri Sep 25 last-hour ${f.side} ${f.ticker}`
  });
}

season.events.push(...lastHourFills);
season.events.push({
  type: "mark",
  id: "s1e08-fri-lasthour",
  kind: "intraday",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Fri Sep 25 2026 LAST-HOUR · robinhood last after fills (~11:59 AM PT). Snapshot s1e08-fri-lasthour. Contestant fills. MERGED · four living.",
  dayPctPriorOfficial: true,
  dayPctPriorCloseDate: "2026-09-24",
  quoteSource: QUOTE_SOURCE,
  recorded: lastRecorded,
  tribes: {
    bidu: {
      combinedWeekPct: biduCount ? round4(biduWeek / biduCount) : 0,
      combinedMonthPct: biduCount ? round4((biduWeek / biduCount) * 2) : 0,
      combinedDayPct: biduCount ? round4(biduDay / biduCount) : 0,
      livingCount: 3
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
  fillsSinceOpen: [],
  fillsSinceLastHour: lastHourFills,
  marks: LAST_QUOTES,
  upgradesSnapshotId: "s1e08-fri-mid"
});

season.liveSnapshotId = remake.snapshotId;
season.lastSnapshotId = remake.snapshotId;
season.lastRemakeAt = MARK_AT;
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Fri Sep 25 last-hour remake · Robinhood last · snapshot s1e08-fri-lasthour. hunt-brain 4/4. Leader Claude Opus 5 -1.4663%. Worst Claude Sonnet 5 -4.3974%.";
season.dayPctBasis = "vs Episode 8 carry priorMarkUsd (Tue SIP open marks · s1e08-carry)";
season.weekPctBasis = "vs Episode 8 carry priorMarkUsd (Tue SIP open marks · s1e08-carry)";
season.statusLabel = "Episode 8 · Fri last-hour · four living · MERGED · comics paused";
season.lastSource = QUOTE_SOURCE;
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E08 live Wed Sep 23 – Fri Sep 25. MERGED. Four living. Fri last-hour remake after hunt-brain fills. Given $361.93. Pot $370.1377. Claude Opus 5 leads −1.4663% and wears immunity. Claude Sonnet 5 worst −4.3974%. hunt-brain 4/4. Comics paused. Audience only. Tribal Fri Sep 25 2:00 PM PT.";
season.immunity = { ...remake.immunity, snapshotId: remake.snapshotId };

const e8 = (season.episodes || []).find((ep) => ep && ep.id === "s1e08");
if (e8) {
  e8.liveSnapshotId = remake.snapshotId;
  e8.islandPotUsd = POT_USD;
  e8.immunity = {
    name: remake.immunity.name,
    weekPct: round4(remake.immunity.weekPct),
    survivorId: remake.immunity.survivorId,
    asOf: remake.immunity.asOf
  };
  e8.weekBoardSnapshotId = remake.snapshotId;
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e08-fri-lasthour · islandPotUsd", season.islandPotUsd, "· immunity Claude Opus 5 -1.47%");
