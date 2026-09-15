#!/usr/bin/env node
/** Tue Sep 15 2026 LAST-HOUR — living marks, last-hour fills, Sonnet immunity +4.80%. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const LAST_AT = "2026-09-15T19:29:50Z";
const LAST_SESSION = "2026-09-15-lasthour";

const IDS = {
  "Grok 4.6": "e51f02b6-9d92-413f-8717-a6e3a60468bc",
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Post last-hour living books · week% vs Episode 5 carry · day% vs Mon SIP EOD. */
const LIVING = {
  "Claude Sonnet 5": {
    bookUsd: 55.8346,
    weekPct: 4.8,
    dayPct: 2.24,
    cashUsd: 14.2344,
    tickers: "FRO / XLE / CASH",
    immune: true
  },
  "GPT-5.6 Terra": {
    bookUsd: 56.9155,
    weekPct: 4.48,
    dayPct: 2.17,
    cashUsd: 0.0029,
    tickers: "FRO / STNG / CASH",
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 55.4726,
    weekPct: 4.17,
    dayPct: 2.57,
    cashUsd: 0.0096,
    tickers: "FRO / USO / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 53.5283,
    weekPct: 1.42,
    dayPct: 1.72,
    cashUsd: 1.0222,
    tickers: "FRO / MPC / USO / VLO / CASH",
    immune: false
  },
  "Composer 2.5": {
    bookUsd: 53.0077,
    weekPct: 1.38,
    dayPct: 1.61,
    cashUsd: 0.0015,
    tickers: "FRO / USO / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 53.4774,
    weekPct: 1.06,
    dayPct: 1.39,
    cashUsd: 23.4572,
    tickers: "FRO / MPC / CASH",
    immune: false
  },
  "Grok 4.6": {
    bookUsd: 53.3393,
    weekPct: -0.1,
    dayPct: 2.13,
    cashUsd: 0.011,
    tickers: "FRO / USO / VLO / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 51.6595,
  USO: 161.5801,
  MPC: 411.305,
  STNG: 85.62,
  VLO: 396.685,
  XLE: 65.7999
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

function fifoSell(lots, ticker, qty) {
  let remain = qty;
  for (const lot of lots) {
    if (lot.ticker === "CASH" || lot.action === "HOLD" || lot.ticker !== ticker) continue;
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

function pushBuy(row, { ticker, qty, avg, sizeUsd, orderId, note, at }) {
  row.positions.push({
    action: "BUY",
    ticker,
    qty,
    avg,
    sizeUsd: round4(sizeUsd),
    status: "filled",
    note,
    orderId,
    filledAt: at,
    last: LAST_QUOTES[ticker],
    lastSource: "robinhood-last-trade",
    lastSession: LAST_SESSION
  });
}

function creditSellCash(row, proceeds) {
  const cash = (row.positions || []).find((p) => p.ticker === "CASH");
  if (cash) cash.sizeUsd = round4(cash.sizeUsd + proceeds);
}

function debitBuyCash(row, sizeUsd) {
  const cash = (row.positions || []).find((p) => p.ticker === "CASH");
  if (cash) cash.sizeUsd = round4(cash.sizeUsd - sizeUsd);
}

const tueMid = (season.events || []).find((e) => e && e.id === "s1e05-tue-mid");
if (!tueMid || !tueMid.recorded) {
  console.error("s1e05-tue-mid mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e05-tue-lasthour")) {
  console.error("s1e05-tue-lasthour already present — abort");
  process.exit(1);
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

  const priorMarkUsd = tueMid.recorded[row.id]?.bookUsd ?? row.bookUsd;
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
    eodMarkUsd: tueMid.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = dayPct;
  row.priorMarkUsd = priorMarkUsd;
  row.immune = host.immune;
  row.lastSource = "robinhood-last-trade";
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
    biduDay += dayPct;
    biduCount += 1;
  }
  if (row.tribeId === "askara") {
    askaraWeek += weekPct;
    askaraDay += dayPct;
    askaraCount += 1;
  }
}

const sonnet = season.survivors.find((s) => s.name === "Claude Sonnet 5");
if (sonnet) {
  creditSellCash(sonnet, 3.3122);
  sonnet.positions = fifoSell(sonnet.positions, "FRO", 0.064215);
  creditSellCash(sonnet, 1.6316);
  sonnet.positions = fifoSell(sonnet.positions, "FRO", 0.031625);
  debitBuyCash(sonnet, 4.99);
  pushBuy(sonnet, {
    ticker: "XLE",
    qty: "0.075835",
    avg: "65.799900",
    sizeUsd: 4.99,
    orderId: "6aa99c5e-ed76-49ce-98bd-0c4e753dd7a7",
    note: "Tue Sep 15 last-hour BUY XLE $4.99 (scaled from $10)",
    at: "2026-09-15T19:28:30.310Z"
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const grok = season.survivors.find((s) => s.name === "Grok 4.6");
if (grok) {
  creditSellCash(grok, 12.3975);
  grok.positions = fifoSell(grok.positions, "USO", 0.076721);
  debitBuyCash(grok, 12.39);
  pushBuy(grok, {
    ticker: "VLO",
    qty: "0.031213",
    avg: "396.947000",
    sizeUsd: 12.39,
    orderId: "6aa99c39-a1aa-4e45-8b07-719dbb0ecc2f",
    note: "Tue Sep 15 last-hour BUY VLO $12.39 (scaled from $17.50)",
    at: "2026-09-15T19:27:53.317Z"
  });
  setCash(grok, LIVING["Grok 4.6"].cashUsd);
}

const luna = season.survivors.find((s) => s.name === "GPT-5.6 Luna");
if (luna) {
  creditSellCash(luna, 17.4495);
  luna.positions = fifoSell(luna.positions, "FRO", 0.338225);
  debitBuyCash(luna, 17.45);
  pushBuy(luna, {
    ticker: "VLO",
    qty: "0.043957",
    avg: "396.977400",
    sizeUsd: 17.45,
    orderId: "6aa99c30-3608-4a6d-b71e-b292420cb4f6",
    note: "Tue Sep 15 last-hour BUY VLO $17.45 (scaled from $18.47)",
    at: "2026-09-15T19:27:44.795Z"
  });
  setCash(luna, LIVING["GPT-5.6 Luna"].cashUsd);
}

const terra = season.survivors.find((s) => s.name === "GPT-5.6 Terra");
if (terra) {
  creditSellCash(terra, 22.7823);
  terra.positions = fifoSell(terra.positions, "FRO", 0.441686);
  debitBuyCash(terra, 22.78);
  pushBuy(terra, {
    ticker: "STNG",
    qty: "0.265904",
    avg: "85.669900",
    sizeUsd: 22.78,
    orderId: "6aa99c28-aef2-4f01-aea4-17decd7f9f7e",
    note: "Tue Sep 15 last-hour BUY STNG $22.78",
    at: "2026-09-15T19:27:36.257Z"
  });
  setCash(terra, LIVING["GPT-5.6 Terra"].cashUsd);
}

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  for (const pos of row.positions || []) {
    if (!pos.ticker || pos.ticker === "CASH") continue;
    if (LAST_QUOTES[pos.ticker]) {
      pos.last = LAST_QUOTES[pos.ticker];
    }
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
    source: "robinhood-last-trade",
    session: LAST_SESSION,
    date: "2026-09-15",
    asOf: LAST_AT,
    priorCloseDate: q.priorCloseDate || "2026-09-14",
    priorCloseSource: q.priorCloseSource || "official SIP list-exchange close",
    interpolated: false
  };
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 6;
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

const lastFills = [
  {
    type: "fill",
    id: "fill-6aa99bd7-sonnet-fro-sell-a",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.064215",
    avg: "51.580100",
    sizeUsd: 3.3122,
    orderId: "6aa99bd7-54cc-4512-9b5a-eebc571d345c",
    at: "2026-09-15T19:26:15.551Z",
    note: "Tue Sep 15 last-hour SELL FRO (Sonnet Wed Sep 9 open lot)"
  },
  {
    type: "fill",
    id: "fill-6aa99beb-sonnet-fro-sell-b",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.031625",
    avg: "51.590800",
    sizeUsd: 1.6316,
    orderId: "6aa99beb-61eb-418c-90d1-37d8c94510ed",
    at: "2026-09-15T19:26:35.270Z",
    note: "Tue Sep 15 last-hour SELL FRO (Sonnet Wed Sep 9 mid lot)"
  },
  {
    type: "fill",
    id: "fill-6aa99bda-grok-uso-sell",
    survivorId: IDS["Grok 4.6"],
    side: "sell",
    ticker: "USO",
    qty: "0.076721",
    avg: "161.591300",
    sizeUsd: 12.3975,
    orderId: "6aa99bda-a15e-4527-bcf2-99ef79599e26",
    at: "2026-09-15T19:26:18.595Z",
    note: "Tue Sep 15 last-hour SELL USO (Grok Mon mid lot)"
  },
  {
    type: "fill",
    id: "fill-6aa99bdb-luna-fro-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "FRO",
    qty: "0.338225",
    avg: "51.590800",
    sizeUsd: 17.4495,
    orderId: "6aa99bdb-f5e1-40aa-a62d-8f97015fe614",
    at: "2026-09-15T19:26:20.088Z",
    note: "Tue Sep 15 last-hour SELL FRO (Luna Thu Sep 10 open lot)"
  },
  {
    type: "fill",
    id: "fill-6aa99bf1-terra-fro-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "FRO",
    qty: "0.441686",
    avg: "51.580100",
    sizeUsd: 22.7823,
    orderId: "6aa99bf1-dda8-4a4c-8539-f3390694390d",
    at: "2026-09-15T19:26:41.131Z",
    note: "Tue Sep 15 last-hour SELL FRO (Terra Fri Sep 11 open lot)"
  },
  {
    type: "fill",
    id: "fill-6aa99c28-terra-stng-buy",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "STNG",
    qty: "0.265904",
    avg: "85.669900",
    sizeUsd: 22.78,
    orderId: "6aa99c28-aef2-4f01-aea4-17decd7f9f7e",
    at: "2026-09-15T19:27:36.257Z",
    note: "Tue Sep 15 last-hour BUY STNG $22.78"
  },
  {
    type: "fill",
    id: "fill-6aa99c30-luna-vlo-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "VLO",
    qty: "0.043957",
    avg: "396.977400",
    sizeUsd: 17.45,
    orderId: "6aa99c30-3608-4a6d-b71e-b292420cb4f6",
    at: "2026-09-15T19:27:44.795Z",
    note: "Tue Sep 15 last-hour BUY VLO $17.45 (scaled from $18.47)"
  },
  {
    type: "fill",
    id: "fill-6aa99c39-grok-vlo-buy",
    survivorId: IDS["Grok 4.6"],
    side: "buy",
    ticker: "VLO",
    qty: "0.031213",
    avg: "396.947000",
    sizeUsd: 12.39,
    orderId: "6aa99c39-a1aa-4e45-8b07-719dbb0ecc2f",
    at: "2026-09-15T19:27:53.317Z",
    note: "Tue Sep 15 last-hour BUY VLO $12.39 (scaled from $17.50)"
  },
  {
    type: "fill",
    id: "fill-6aa99c5e-sonnet-xle-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "XLE",
    qty: "0.075835",
    avg: "65.799900",
    sizeUsd: 4.99,
    orderId: "6aa99c5e-ed76-49ce-98bd-0c4e753dd7a7",
    at: "2026-09-15T19:28:30.310Z",
    note: "Tue Sep 15 last-hour BUY XLE $4.99 (scaled from $10)"
  }
];

season.events.push(...lastFills);
season.events.push({
  type: "mark",
  id: "s1e05-tue-lasthour",
  kind: "intraday",
  at: LAST_AT,
  throughAt: LAST_AT,
  lastSession: LAST_SESSION,
  label:
    "Episode 5 Tue last-hour remake · RTH last-trade (~12:29 PM PT) · living marks after last-hour fills",
  dayPctPriorOfficial: true,
  quoteSource: "robinhood-last-trade",
  recorded: lastRecorded,
  tribes: {
    bidu: {
      combinedWeekPct: biduCount ? round4(biduWeek / biduCount) : 0,
      combinedMonthPct: biduCount ? round4((biduWeek / biduCount) * 2) : 0,
      combinedDayPct: biduCount ? round4(biduDay / biduCount) : 0,
      livingCount: 6
    },
    askara: {
      combinedWeekPct: askaraCount ? round4(askaraWeek / askaraCount) : 0,
      combinedMonthPct: askaraCount ? round4((askaraWeek / askaraCount) * 2) : 0,
      combinedDayPct: askaraCount ? round4(askaraDay / askaraCount) : 0,
      livingCount: 1
    }
  },
  immunity: {
    name: "Claude Sonnet 5",
    weekPct: 4.8,
    basis: "Episode 5 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["Claude Sonnet 5"],
    at: LAST_AT
  },
  potUsd: 381.5754
});

season.liveSnapshotId = "s1e05-tue-lasthour";
season.islandPotUsd = 381.5754;
season.markedAt = LAST_AT;
season.markLabel =
  "Episode 5 Tue last-hour remake · RTH last-trade (~12:29 PM PT) · living marks after last-hour fills";
season.statusLabel = "Live · S1E05 · MERGED · seven living · Tue last-hour remake";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E05 live Mon Sep 14 – Tue Sep 16. MERGED. Seven living. Tue last-hour remake after fills. Given $361.93. Pot $381.58. Claude Sonnet 5 leads +4.80% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["Claude Sonnet 5"],
  name: "Claude Sonnet 5",
  weekPct: 4.8,
  at: LAST_AT,
  snapshotId: "s1e05-tue-lasthour",
  asOf: LAST_SESSION
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e05-tue-lasthour · islandPotUsd", season.islandPotUsd, "· immunity Claude Sonnet 5 +4.80%");
