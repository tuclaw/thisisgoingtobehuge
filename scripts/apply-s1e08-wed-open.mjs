#!/usr/bin/env node
/** Wed Sep 23 2026 OPEN — Composer boot liq + contestant fills + living marks. Snapshot s1e08-wed-open. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));
const booksPayload = JSON.parse(
  readFileSync(join(root, "recs", "2026-09-23-open", "BOOKS.after.json"), "utf8")
);
const remake = JSON.parse(readFileSync(join(root, "recs", "2026-09-23-open", "REMAKE.json"), "utf8"));
const fills = JSON.parse(readFileSync(join(root, "recs", "2026-09-23-open", "FILLS.json"), "utf8"));

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

function nameToId(who) {
  if (who.includes("BOOT")) return IDS["Composer 2.5"];
  return IDS[who] || null;
}

const e8Carry = (season.events || []).find((e) => e && e.id === "s1e08-carry");
const e7TueEodSip = (season.events || []).find((e) => e && e.id === "s1e07-tue-eod-sip");
if (!e8Carry) {
  console.error("s1e08-carry mark missing");
  process.exit(1);
}
if (!e7TueEodSip) {
  console.error("s1e07-tue-eod-sip mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e08-wed-open")) {
  console.error("s1e08-wed-open already present — abort");
  process.exit(1);
}

const standingById = new Map(remake.standings.map((row) => [row.id, row]));

const booksAfter = Array.isArray(booksPayload)
  ? booksPayload
  : booksPayload.books.map((book) => {
      const host = remake.standings.find((s) => s.name === book.name);
      if (!host) {
        console.error(`missing standing for ${book.name}`);
        process.exit(1);
      }
      const positions = (book.allPositions || book.held || []).filter((p) => p.action !== "SELL");
      return {
        name: book.name,
        id: host.id,
        tribeId: host.tribeId,
        tribeLabel: host.origin,
        tickersSummary: host.legs,
        cashUsd: book.cashUsd,
        bookUsd: book.bookUsd,
        weekPct: book.weekPct,
        dayPct: book.dayPct,
        priorMarkUsd: book.priorMarkUsd,
        eodMarkUsd: book.eodMarkUsd,
        positions
      };
    });

for (const bookRow of booksAfter) {
  const row = season.survivors.find((s) => s.id === bookRow.id);
  if (!row || row.status !== "active") continue;
  const host = standingById.get(bookRow.id);
  row.positions = bookRow.positions.filter((p) => p.action !== "SELL");
  row.cashUsd = bookRow.cashUsd;
  row.tickersSummary = bookRow.tickersSummary;
  row.bookUsd = bookRow.bookUsd;
  row.weekPct = bookRow.weekPct;
  row.dayPct = bookRow.dayPct;
  row.priorMarkUsd = bookRow.priorMarkUsd;
  row.eodMarkUsd = bookRow.eodMarkUsd;
  row.immune = Boolean(host && host.name === remake.immunity.name);
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

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer && composer.positions && composer.positions[0]) {
  composer.positions[0].note =
    "voted out Tue Sep 22 tribal · boot broker INTC liquidation cleared Wed Sep 23 open (pin Composer lots only; tribal book lock $77.0694 kept)";
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
    monthPct: row.monthPct,
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
  const prior = e7TueEodSip.marks?.[ticker] ?? q.priorClose;
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: remake.quoteSource,
    session: LAST_SESSION,
    date: "2026-09-23",
    asOf: MARK_AT,
    priorClose: prior,
    priorCloseDate: "2026-09-22",
    priorCloseSource: "sip-list-exchange-close (Tue Sep 22 official · Episode 8 carry)",
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

const openFills = [];

for (const o of fills.bootLiquidations || []) {
  openFills.push({
    type: "fill",
    id: `fill-${o.orderId.slice(0, 8)}-boot-intc-sell`,
    survivorId: IDS["Composer 2.5"],
    side: "sell",
    ticker: o.symbol,
    qty: o.qty,
    avg: o.avg,
    sizeUsd: o.notional,
    orderId: o.orderId,
    at: o.at,
    note: `Boot broker liquidation Composer 2.5 INTC (jury book $0 · pin Composer lots only · ${o.note || ""})`.trim()
  });
}

for (const s of fills.sells || []) {
  const survivorId = nameToId(s.who);
  if (!survivorId) continue;
  openFills.push({
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
    note: `Wed Sep 23 open SELL ${s.symbol} ${s.qty}${s.open_lot_id ? ` · open_lot_id ${s.open_lot_id}` : ""}`
  });
}

for (const b of fills.buys || []) {
  const survivorId = nameToId(b.who);
  if (!survivorId) continue;
  openFills.push({
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
    note: `Wed Sep 23 open BUY ${b.symbol} $${b.dollar}`
  });
}

season.events.push(...openFills);
season.events.push({
  type: "mark",
  id: "s1e08-wed-open",
  kind: "open",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Wed Sep 23 2026 OPEN · robinhood last after fills (~7:13 AM PT). Snapshot s1e08-wed-open. Composer boot liq cleared + contestant fills. MERGED · four living.",
  dayPctPriorOfficial: true,
  dayPctPriorCloseDate: "2026-09-22",
  quoteSource: remake.quoteSource,
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
  composerBootLockUsd: remake.composerBootLockUsd,
  bootLiquidations: fills.bootLiquidations,
  huntScore: remake.huntScore,
  fillsSinceOpen: openFills.filter((f) => f.survivorId && f.survivorId !== IDS["Composer 2.5"]),
  fillsSinceLastHour: [],
  marks: LAST_QUOTES,
  upgradesSnapshotId: "s1e08-carry"
});

season.liveSnapshotId = remake.snapshotId;
season.lastSnapshotId = remake.snapshotId;
season.lastRemakeAt = MARK_AT;
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Wed Sep 23 OPEN · robinhood last after fills (~7:13 AM PT). Snapshot s1e08-wed-open. Leader Claude Opus 5 -0.94%. Worst Claude Sonnet 5 -3.35%.";
season.dayPctBasis = "vs Episode 8 carry priorMarkUsd (Tue SIP open marks · s1e08-carry)";
season.weekPctBasis = "vs Episode 8 carry priorMarkUsd (Tue SIP open marks · s1e08-carry)";
season.statusLabel = "Live · Episode 8 · Wed open · immunity Claude Opus 5 -0.94% · pot $374.62";
season.lastSource = remake.quoteSource;
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E08 live Wed Sep 23 – Fri Sep 25. MERGED. Four living. Wed open remake after Composer boot liq + contestant fills. Given $361.93. Pot $374.6164. Claude Opus 5 leads −0.94% and wears immunity. Claude Sonnet 5 worst −3.35%. hunt-brain 4/4. Comics paused. Audience only. Tribal Fri Sep 25 2:00 PM PT.";
season.immunity = { ...remake.immunity, snapshotId: remake.snapshotId };

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e08-wed-open · islandPotUsd", season.islandPotUsd, "· immunity Claude Opus 5 -0.94%");
