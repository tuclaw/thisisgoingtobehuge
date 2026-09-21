#!/usr/bin/env node
/** Mon Sep 21 2026 LAST-HOUR STRIP — corrective books. Snapshot s1e07-mon-lasthour-strip. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MARK_AT = "2026-09-21T20:40:00Z";
const LAST_SESSION = "2026-09-21-lasthour-strip";
const POT_USD = 385.0897;

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Post STRIP living books · week% / day% vs Episode 7 carry (priorMarkUsd). Marks reused from s1e07-mon-lasthour. */
const LIVING = {
  "GPT-5.6 Luna": {
    bookUsd: 74.7213,
    weekPct: -0.4,
    dayPct: -0.4,
    cashUsd: 21.9128,
    tickers: "INTC / CASH",
    immune: true
  },
  "Claude Sonnet 5": {
    bookUsd: 76.9162,
    weekPct: -0.43,
    dayPct: -0.43,
    cashUsd: 29.8389,
    tickers: "STNG / INTC / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 75.0199,
    weekPct: -0.57,
    dayPct: -0.57,
    cashUsd: 32.4602,
    tickers: "TRMD / INTC / CASH",
    immune: false
  },
  "GPT-5.6 Terra": {
    bookUsd: 79.5982,
    weekPct: -1.49,
    dayPct: -1.49,
    cashUsd: 13.2412,
    tickers: "STNG / INTC / CASH",
    immune: false
  },
  "Composer 2.5": {
    bookUsd: 78.8341,
    weekPct: -2.17,
    dayPct: -2.17,
    cashUsd: 0.569,
    tickers: "FRO / STNG / TRMD / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 49.77,
  STNG: 86.87,
  TRMD: 37.19,
  INTC: 121.655,
  VLO: 393.16,
  MPC: 401.7,
  GNRC: 205.545,
  USO: 147.915,
  XLE: 62.4901
};

const SIP_PRIOR = {
  FRO: 51.42,
  STNG: 87.16,
  TRMD: 38.23,
  INTC: 108.6,
  VLO: 413.28,
  MPC: 424.89,
  GNRC: 207.44,
  USO: 153.82,
  XLE: 64.31
};

const STRIPS = [
  {
    survivorId: IDS["Composer 2.5"],
    orderId: "6ab168ff-dc51-487d-b1fd-6ca51dabe01c",
    ticker: "FRO",
    qty: "0.218888",
    cashNote:
      "Mon mid: FRO buy -$11 from residual/shared BP; sleeve cash unchanged; TRMD sell skipped · STRIP s1e07-mon-lasthour-strip: FRO 0.218888 STRIPPED (orphan; broker sell Tue); sleeve cash unchanged"
  },
  {
    survivorId: IDS["GPT-5.6 Terra"],
    orderId: "6ab186bf-bf0e-47f9-b385-3a9e3e08fdf4",
    ticker: "STNG",
    qty: "0.469991",
    cashNote:
      "Mon last-hour: STNG buy -$40.80 from shared BP; sleeve cash unchanged · STRIP s1e07-mon-lasthour-strip: STNG 0.469991 STRIPPED (orphan; broker sell Tue); sleeve cash unchanged"
  }
];

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

function removeLotByOrderId(positions, orderId) {
  return (positions || []).filter((p) => p.orderId !== orderId);
}

function appendCashNote(row, note) {
  for (const p of row.positions || []) {
    if (p.ticker === "CASH" && p.action === "CASH" && p.status === "cash") {
      p.note = note;
      return;
    }
  }
}

const monLasthour = (season.events || []).find((e) => e && e.id === "s1e07-mon-lasthour");
if (!monLasthour || !monLasthour.recorded) {
  console.error("s1e07-mon-lasthour mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e07-mon-lasthour-strip")) {
  console.error("s1e07-mon-lasthour-strip already present — abort");
  process.exit(1);
}

for (const strip of STRIPS) {
  const row = season.survivors.find((s) => s.id === strip.survivorId);
  if (!row) {
    console.error("survivor missing for strip", strip.orderId);
    process.exit(1);
  }
  row.positions = removeLotByOrderId(row.positions, strip.orderId);
  appendCashNote(row, strip.cashNote);
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
  const host = LIVING[row.name];
  if (!host) continue;

  const priorMarkUsd = monLasthour.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = monLasthour.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd;
  const bookUsd = host.bookUsd;
  const weekPct = host.weekPct;
  const dayPct = host.dayPct;
  const monthPct = monthPctFromWeek(weekPct);

  lastRecorded[row.id] = {
    bookUsd,
    weekPct,
    monthPct,
    dayPct,
    priorMarkUsd,
    eodMarkUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = dayPct;
  row.priorMarkUsd = priorMarkUsd;
  row.eodMarkUsd = eodMarkUsd;
  row.immune = host.immune;
  row.lastSource = "robinhood-last-trade";
  row.lastSession = LAST_SESSION;
  row.cashUsd = host.cashUsd;
  row.tickersSummary = host.tickers.replace(/ \/ /g, "+");
  if (row.position) {
    row.position = {
      action: "HOLD",
      ticker: host.tickers,
      sizeUsd: bookUsd,
      status: "filled",
      note: host.tickers.toLowerCase().replace(/ \/ cash/g, "").replace(/ \/ /g, " / ")
    };
  }

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

  for (const pos of row.positions || []) {
    if (!pos.ticker || pos.ticker === "CASH") continue;
    if (LAST_QUOTES[pos.ticker]) pos.last = LAST_QUOTES[pos.ticker];
    pos.lastSource = "robinhood-last-trade";
    pos.lastSession = LAST_SESSION;
  }
}

for (const [ticker, last] of Object.entries(LAST_QUOTES)) {
  const q = season.quotes[ticker] || {};
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    sip: SIP_PRIOR[ticker] ?? q.sip,
    source: "robinhood-last-trade",
    session: LAST_SESSION,
    date: "2026-09-21",
    asOf: MARK_AT,
    priorClose: SIP_PRIOR[ticker] ?? q.priorClose,
    priorCloseDate: q.priorCloseDate || "2026-09-18",
    priorCloseSource: q.priorCloseSource || "robinhood-last-trade (Fri tribal RTH)",
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

season.events.push({
  type: "mark",
  id: "s1e07-mon-lasthour-strip",
  kind: "corrective",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Mon Sep 21 2026 LAST-HOUR STRIP · corrective books (shared-BP lots stripped). Snapshot s1e07-mon-lasthour-strip. MERGED · five living.",
  dayPctPriorOfficial: true,
  quoteSource: "robinhood-last-trade",
  corrects: "s1e07-mon-lasthour",
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
  immunity: {
    name: "GPT-5.6 Luna",
    weekPct: -0.4,
    basis: "Episode 7 weekPct vs priorMarkUsd (post-boot-split carry)",
    note: "Mon Sep 21 last-hour STRIP corrective remake (shared-BP lots removed from sleeves)",
    asOf: LAST_SESSION,
    survivorId: IDS["GPT-5.6 Luna"],
    at: MARK_AT
  },
  potUsd: POT_USD,
  strips: [
    {
      who: "Composer 2.5",
      ticker: "FRO",
      qty: "0.218888",
      orderId: "6ab168ff-dc51-487d-b1fd-6ca51dabe01c",
      open_lot_id: "b4cf0ac2-7aa2-5f9d-9ae9-898ff735e32d",
      avg: "50.254000",
      sizeUsd: 11,
      reason: "Mon mid shared-BP BUY; sleeve cash never debited; orphan pending broker sell Tue open"
    },
    {
      who: "GPT-5.6 Terra",
      ticker: "STNG",
      qty: "0.469991",
      orderId: "6ab186bf-bf0e-47f9-b385-3a9e3e08fdf4",
      open_lot_id: "fc3a9b9c-841e-5194-a33a-b697456322f2",
      avg: "86.810000",
      sizeUsd: 40.8,
      reason: "Mon last-hour shared-BP BUY; sleeve cash never debited; orphan pending broker sell Tue open"
    }
  ],
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

season.liveSnapshotId = "s1e07-mon-lasthour-strip";
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Mon Sep 21 last-hour STRIP corrective remake · snapshot s1e07-mon-lasthour-strip";
season.dayPctBasis = "vs eodMarkUsd (Fri tribal EOD / E7 open carry)";
season.weekPctBasis = "vs priorMarkUsd (post-boot-split E7 carry)";
season.statusLabel =
  "Live · Episode 7 · Mon last-hour STRIP · immunity GPT-5.6 Luna -0.40% · pot $385.09";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E07 live Mon Sep 21 – Tue Sep 22. MERGED. Five living. Mon last-hour STRIP corrective books (Composer FRO 0.218888 + Terra STNG 0.469991 stripped; broker orphans Tue open). Given $361.93. Pot $385.09. GPT-5.6 Luna leads −0.40% and wears immunity. Comics paused. Audience only. Tribal Tue Sep 22 2:00 PM PT.";
season.immunity = {
  survivorId: IDS["GPT-5.6 Luna"],
  name: "GPT-5.6 Luna",
  weekPct: -0.4,
  at: MARK_AT,
  snapshotId: "s1e07-mon-lasthour-strip",
  asOf: LAST_SESSION,
  basis: "Episode 7 weekPct vs priorMarkUsd (post-boot-split carry)",
  note: "Mon Sep 21 last-hour STRIP corrective remake (shared-BP lots removed from sleeves)"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e07-mon-lasthour-strip · islandPotUsd", season.islandPotUsd, "· immunity GPT-5.6 Luna -0.40%");
