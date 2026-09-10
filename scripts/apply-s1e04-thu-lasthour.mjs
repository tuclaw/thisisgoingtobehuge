#!/usr/bin/env node
/** Thu Sep 10 2026 LAST-HOUR — living marks, last-hour fills, Grok immunity +6.82%. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const LAST_AT = "2026-09-10T19:31:00Z";
const LAST_SESSION = "2026-09-10-lasthour";

const IDS = {
  "Grok 4.6": "e51f02b6-9d92-413f-8717-a6e3a60468bc",
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6",
  "Kimi K3": "ea7f46b1-2068-4d81-b153-22faadfbc1cb"
};

/** Post last-hour living books · week%/day% vs E4 even-up open. */
const LIVING = {
  "Grok 4.6": { bookUsd: 48.7599, weekPct: 6.82, dayPct: 4.64, cashUsd: 0.3637, tickers: "USO / CASH", immune: true },
  "GPT-5.6 Terra": { bookUsd: 48.0496, weekPct: 6.31, dayPct: 4.82, cashUsd: 0.1015, tickers: "FRO / USO / CASH", immune: false },
  "Kimi K3": { bookUsd: 47.8849, weekPct: 6.02, dayPct: 3.59, cashUsd: 0.003, tickers: "USO / MPC / FRO / CASH", immune: false },
  "Gemini 3.7 Flash": { bookUsd: 47.5765, weekPct: 5.09, dayPct: 3.3, cashUsd: 0.039, tickers: "USO / FRO / CASH", immune: false },
  "GPT-5.6 Luna": { bookUsd: 46.8175, weekPct: 3.66, dayPct: 1.1, cashUsd: 0.0089, tickers: "FRO / USO / CASH", immune: false },
  "Claude Opus 5": { bookUsd: 46.8632, weekPct: 3.19, dayPct: 1.87, cashUsd: 0.1835, tickers: "VLO / USO / FRO / CASH", immune: false },
  "Composer 2.5": { bookUsd: 46.7956, weekPct: 3.08, dayPct: 1.79, cashUsd: 0.1557, tickers: "USO / FRO / CASH", immune: false },
  "Claude Sonnet 5": { bookUsd: 46.1244, weekPct: 1.96, dayPct: 0.81, cashUsd: 0.1602, tickers: "FRO / USO / CASH", immune: false }
};

const LAST_QUOTES = {
  USO: 158.2177,
  FRO: 48.3675,
  VLO: 388.6301,
  MPC: 397.96,
  CVX: 213.5048,
  XLE: 65.1633
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

function fifoSell(lots, qty) {
  let remain = qty;
  for (const lot of lots) {
    if (lot.ticker === "CASH" || lot.action === "HOLD") continue;
    const lotQty = parseFloat(lot.qty);
    if (!lotQty || lotQty <= 0) continue;
    if (remain <= 0) break;
    const take = Math.min(lotQty, remain);
    const newQty = round4(lotQty - take);
    if (newQty <= 0.000001) {
      lot.qty = "0";
      lot.sizeUsd = 0;
      lot.status = "sold";
    } else {
      lot.qty = newQty.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
      lot.sizeUsd = round4(newQty * parseFloat(lot.avg));
    }
    remain = round4(remain - take);
  }
  return lots.filter((lot) => !(lot.qty === "0" || lot.status === "sold"));
}

function setCash(row, cashUsd) {
  const cash = (row.positions || []).find((p) => p.ticker === "CASH");
  if (cash) cash.sizeUsd = cashUsd;
}

const thuMid = (season.events || []).find((e) => e && e.id === "s1e04-thu-mid");
if (!thuMid || !thuMid.recorded) {
  console.error("s1e04-thu-mid mark missing");
  process.exit(1);
}

const lastRecorded = {};
let biduWeek = 0;
let askaraWeek = 0;
let biduCount = 0;
let askaraCount = 0;

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const host = LIVING[row.name];
  if (!host) continue;

  const priorMarkUsd = thuMid.recorded[row.id]?.bookUsd ?? row.bookUsd;
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
    eodMarkUsd: thuMid.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = dayPct;
  row.priorMarkUsd = priorMarkUsd;
  row.immune = host.immune;
  row.lastSource = "RTH last-trade";
  row.lastSession = LAST_SESSION;
  if (row.position) {
    row.position = {
      action: "HOLD",
      ticker: host.tickers,
      sizeUsd: bookUsd,
      status: "filled",
      note: host.tickers.toLowerCase().replace(/ \/ cash/g, "").replace(/ \/ /g, " / ")
    };
  }
  setCash(row, host.cashUsd);

  if (row.tribeId === "bidu") {
    biduWeek += weekPct;
    biduCount += 1;
  }
  if (row.tribeId === "askara") {
    askaraWeek += weekPct;
    askaraCount += 1;
  }
}

const sonnet = season.survivors.find((s) => s.name === "Claude Sonnet 5");
if (sonnet) {
  sonnet.positions = fifoSell(sonnet.positions, 0.0264);
  sonnet.positions.push({
    action: "BUY",
    ticker: "FRO",
    qty: "0.213159",
    avg: "48.3675",
    sizeUsd: round4(0.213159 * 48.3675),
    status: "filled",
    note: "Thu Sep 10 last-hour BUY FRO",
    last: LAST_QUOTES.FRO,
    lastSource: "RTH last-trade",
    lastSession: LAST_SESSION,
    orderId: "6aa30582",
    filledAt: LAST_AT
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) {
  composer.positions = fifoSell(composer.positions, 0.300021);
  composer.positions.push({
    action: "BUY",
    ticker: "USO",
    qty: "0.091582",
    avg: "158.2177",
    sizeUsd: round4(0.091582 * 158.2177),
    status: "filled",
    note: "Thu Sep 10 last-hour BUY USO",
    last: LAST_QUOTES.USO,
    lastSource: "RTH last-trade",
    lastSession: LAST_SESSION,
    orderId: "6aa30583",
    filledAt: LAST_AT
  });
  setCash(composer, LIVING["Composer 2.5"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  opus.positions = fifoSell(opus.positions, 0.006541);
  opus.positions.push({
    action: "BUY",
    ticker: "FRO",
    qty: "0.052511",
    avg: "48.3699",
    sizeUsd: round4(0.052511 * 48.3699),
    status: "filled",
    note: "Thu Sep 10 last-hour BUY FRO (scaled VLO sell)",
    last: LAST_QUOTES.FRO,
    lastSource: "RTH last-trade",
    lastSession: LAST_SESSION,
    orderId: "6aa30583",
    filledAt: LAST_AT
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  for (const pos of row.positions || []) {
    if (!pos.ticker || pos.ticker === "CASH") continue;
    if (LAST_QUOTES[pos.ticker]) {
      pos.last = LAST_QUOTES[pos.ticker];
    }
    pos.lastSource = "RTH last-trade";
    pos.lastSession = LAST_SESSION;
  }
}

for (const [ticker, last] of Object.entries(LAST_QUOTES)) {
  const q = season.quotes[ticker] || {};
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: "RTH last-trade",
    session: LAST_SESSION,
    date: "2026-09-10",
    asOf: LAST_AT,
    priorCloseDate: q.priorCloseDate || "2026-09-09",
    priorCloseSource: q.priorCloseSource || "sip-list-exchange-close",
    interpolated: false
  };
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 6;
    t.combinedWeekPct = biduCount ? round4(biduWeek / biduCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = t.combinedWeekPct;
  }
  if (t.id === "askara") {
    t.livingCount = 2;
    t.combinedWeekPct = askaraCount ? round4(askaraWeek / askaraCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = t.combinedWeekPct;
  }
}

const lastFills = [
  {
    type: "fill",
    id: "fill-6aa30563-sonnet-vlo-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "VLO",
    qty: "0.026400",
    avg: "388.6301",
    sizeUsd: round4(0.0264 * 388.6301),
    orderId: "6aa30563",
    at: "2026-09-10T19:29:10.000Z",
    note: "Thu Sep 10 last-hour SELL VLO"
  },
  {
    type: "fill",
    id: "fill-6aa30565-composer-fro-sell",
    survivorId: IDS["Composer 2.5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.300021",
    avg: "48.3301",
    sizeUsd: round4(0.300021 * 48.3301),
    orderId: "6aa30565",
    at: "2026-09-10T19:29:12.000Z",
    note: "Thu Sep 10 last-hour SELL FRO"
  },
  {
    type: "fill",
    id: "fill-6aa30565-opus-vlo-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "VLO",
    qty: "0.006541",
    avg: "388.6301",
    sizeUsd: round4(0.006541 * 388.6301),
    orderId: "6aa30565",
    at: "2026-09-10T19:29:14.000Z",
    note: "Thu Sep 10 last-hour SELL VLO (scaled)"
  },
  {
    type: "fill",
    id: "fill-6aa30582-sonnet-fro-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.213159",
    avg: "48.3675",
    sizeUsd: round4(0.213159 * 48.3675),
    orderId: "6aa30582",
    at: "2026-09-10T19:29:16.000Z",
    note: "Thu Sep 10 last-hour BUY FRO"
  },
  {
    type: "fill",
    id: "fill-6aa30583-composer-uso-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "USO",
    qty: "0.091582",
    avg: "158.2177",
    sizeUsd: round4(0.091582 * 158.2177),
    orderId: "6aa30583",
    at: "2026-09-10T19:29:18.000Z",
    note: "Thu Sep 10 last-hour BUY USO"
  },
  {
    type: "fill",
    id: "fill-6aa30583-opus-fro-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.052511",
    avg: "48.3699",
    sizeUsd: round4(0.052511 * 48.3699),
    orderId: "6aa30583",
    at: "2026-09-10T19:29:20.000Z",
    note: "Thu Sep 10 last-hour BUY FRO"
  }
];

season.events.push(...lastFills);
season.events.push({
  type: "mark",
  id: "s1e04-thu-lasthour",
  kind: "intraday",
  at: LAST_AT,
  throughAt: LAST_AT,
  lastSession: LAST_SESSION,
  label: "Thu Sep 10 2026 LAST-HOUR · RTH last-trade (~12:31 PM PT) · living marks only",
  dayPctPriorOfficial: true,
  recorded: lastRecorded,
  tribes: {
    bidu: {
      combinedWeekPct: biduCount ? round4(biduWeek / biduCount) : 0,
      combinedMonthPct: biduCount ? round4((biduWeek / biduCount) * 2) : 0,
      combinedDayPct: biduCount ? round4(biduWeek / biduCount) : 0,
      livingCount: 6
    },
    askara: {
      combinedWeekPct: askaraCount ? round4(askaraWeek / askaraCount) : 0,
      combinedMonthPct: askaraCount ? round4((askaraWeek / askaraCount) * 2) : 0,
      combinedDayPct: askaraCount ? round4(askaraWeek / askaraCount) : 0,
      livingCount: 2
    }
  }
});

season.liveSnapshotId = "s1e04-thu-lasthour";
season.islandPotUsd = 378.8717;
season.markedAt = LAST_AT;
season.markLabel = "Thu Sep 10 2026 LAST-HOUR · RTH last-trade (~12:31 PM PT)";
season.statusLabel =
  "Live · S1E04 · MERGED · eight living · Thu last-hour remake · leader Grok 4.6";
season.lastSource = "RTH last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E03 closed Tue Sep 8 tribal — GPT-5.6 Sol voted out 7–1. S1E04 live Wed Sep 9 – Fri Sep 11. MERGED. Eight living. Given $361.93. Pot $378.8717. Grok 4.6 leads +6.82% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["Grok 4.6"],
  name: "Grok 4.6",
  weekPct: 6.82,
  at: LAST_AT,
  snapshotId: "s1e04-thu-lasthour"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e04-thu-lasthour · islandPotUsd", season.islandPotUsd, "· immunity Grok 4.6 +6.82%");
