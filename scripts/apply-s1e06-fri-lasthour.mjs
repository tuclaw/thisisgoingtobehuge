#!/usr/bin/env node
/** Fri Sep 18 2026 LAST-HOUR — contestant fills + living marks. Snapshot s1e06-fri-lasthour. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MARK_AT = "2026-09-18T19:22:03Z";
const LAST_SESSION = "2026-09-18-lasthour";
const POT_USD = 386.9812;

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Post Fri last-hour living books · week% vs E6 SIP carry · day% vs Thu SIP EOD. */
const LIVING = {
  "Composer 2.5": {
    bookUsd: 67.7418,
    weekPct: 9.52,
    dayPct: -5.59,
    cashUsd: 0.2434,
    tickers: "FRO+STNG+CASH",
    immune: true
  },
  "GPT-5.6 Terra": {
    bookUsd: 68.1732,
    weekPct: 3.63,
    dayPct: -1.31,
    cashUsd: 0.1083,
    tickers: "STNG+TRMD+CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 62.7734,
    weekPct: 0.72,
    dayPct: -0.9,
    cashUsd: 22.8188,
    tickers: "FRO+CASH",
    immune: false
  },
  "Claude Sonnet 5": {
    bookUsd: 64.6944,
    weekPct: 0.02,
    dayPct: -2.75,
    cashUsd: 25.0003,
    tickers: "STNG+TRMD+CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 62.3638,
    weekPct: -0.06,
    dayPct: -2.08,
    cashUsd: 0.8589,
    tickers: "MPC+GNRC+STNG+TRMD+CASH",
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 61.2346,
    weekPct: -4.83,
    dayPct: -5.94,
    cashUsd: 0.1236,
    tickers: "FRO+STNG+CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 50.9162,
  STNG: 86.63,
  TRMD: 38.06,
  VLO: 412.785,
  MPC: 424.15,
  GNRC: 205.61,
  USO: 153.6308,
  XLE: 64.325
};

const SIP_PRIOR = {
  FRO: 54.03,
  STNG: 87.85,
  TRMD: 36.63,
  VLO: 412.53,
  MPC: 421.96,
  GNRC: 207.23,
  USO: 155.31,
  XLE: 64.48
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

function reduceLotByOrderId(lots, orderId, qty) {
  let remain = qty;
  for (const lot of lots) {
    if (lot.orderId !== orderId || lot.ticker === "CASH") continue;
    const lotQty = parseFloat(lot.qty);
    if (!lotQty || lotQty <= 0) continue;
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
  const cash = (row.positions || []).find((p) => p.ticker === "CASH" && p.action === "CASH");
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
  const cash = (row.positions || []).find((p) => p.ticker === "CASH" && p.action === "CASH");
  if (cash) cash.sizeUsd = round4(cash.sizeUsd + proceeds);
}

function debitBuyCash(row, sizeUsd) {
  const cash = (row.positions || []).find((p) => p.ticker === "CASH" && p.action === "CASH");
  if (cash) cash.sizeUsd = round4(cash.sizeUsd - sizeUsd);
}

const friMid = (season.events || []).find((e) => e && e.id === "s1e06-fri-mid");
if (!friMid || !friMid.recorded) {
  console.error("s1e06-fri-mid mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e06-fri-lasthour")) {
  console.error("s1e06-fri-lasthour already present — abort");
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

  const priorMarkUsd = friMid.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = friMid.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd;
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
  if (row.position) {
    row.position = {
      action: "HOLD",
      ticker: host.tickers,
      sizeUsd: bookUsd,
      status: "filled",
      note: host.tickers.toLowerCase()
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
}

const sonnet = season.survivors.find((s) => s.name === "Claude Sonnet 5");
if (sonnet) {
  creditSellCash(sonnet, 3.9464);
  sonnet.positions = reduceLotByOrderId(sonnet.positions, "6aabf3a8-05fa-4921-be26-c75a70817556", 0.045602);
  creditSellCash(sonnet, 3.8508);
  sonnet.positions = reduceLotByOrderId(sonnet.positions, "6aac2151-e613-45a3-81c4-bf4985e7fd5f", 0.044487);
  debitBuyCash(sonnet, 7.8);
  pushBuy(sonnet, {
    ticker: "TRMD",
    qty: "0.204832",
    avg: "38.079900",
    sizeUsd: 7.8,
    orderId: "6aad8f03-eb8e-47e5-a397-d9440b0be1ca",
    note: "Fri Sep 18 last-hour BUY TRMD $7.80 from STNG trim",
    at: "2026-09-18T19:20:35.755Z"
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const host = LIVING[row.name];
  if (host) setCash(row, host.cashUsd);
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
    date: "2026-09-18",
    asOf: MARK_AT,
    priorCloseDate: "2026-09-17",
    priorCloseSource: "official SIP list-exchange close",
    interpolated: false
  };
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 5;
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
    id: "fill-6aad8ee6-sonnet-stng-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "STNG",
    qty: "0.045602",
    avg: "86.540100",
    sizeUsd: 3.9464,
    orderId: "6aad8ee6-4e56-431d-bc69-c1dc50761ead",
    at: "2026-09-18T19:20:06.559Z",
    note: "Fri Sep 18 last-hour SELL STNG 0.045602 (Sonnet Thu open lot · tax lot eb28f839)"
  },
  {
    type: "fill",
    id: "fill-6aad8ef0-sonnet-stng-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "STNG",
    qty: "0.044487",
    avg: "86.560100",
    sizeUsd: 3.8508,
    orderId: "6aad8ef0-10c3-405a-a635-d2d936a887ca",
    at: "2026-09-18T19:20:16.931Z",
    note: "Fri Sep 18 last-hour SELL STNG 0.044487 (Sonnet Thu mid lot · tax lot 1260ce05)"
  },
  {
    type: "fill",
    id: "fill-6aad8f03-sonnet-trmd-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "TRMD",
    qty: "0.204832",
    avg: "38.079900",
    sizeUsd: 7.8,
    orderId: "6aad8f03-eb8e-47e5-a397-d9440b0be1ca",
    at: "2026-09-18T19:20:35.755Z",
    note: "Fri Sep 18 last-hour BUY TRMD $7.80 from STNG trim"
  }
];

season.events.push(...lastFills);
season.events.push({
  type: "mark",
  id: "s1e06-fri-lasthour",
  kind: "intraday",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Fri Sep 18 2026 LAST-HOUR · robinhood last-trade after fills (~12:20 PM PT). Snapshot s1e06-fri-lasthour. MERGED · six living.",
  dayPctPriorOfficial: true,
  quoteSource: "robinhood-last-trade",
  recorded: lastRecorded,
  tribes: {
    bidu: {
      combinedWeekPct: biduCount ? round4(biduWeek / biduCount) : 0,
      combinedMonthPct: biduCount ? round4((biduWeek / biduCount) * 2) : 0,
      combinedDayPct: biduCount ? round4(biduDay / biduCount) : 0,
      livingCount: 5
    },
    askara: {
      combinedWeekPct: askaraCount ? round4(askaraWeek / askaraCount) : 0,
      combinedMonthPct: askaraCount ? round4((askaraWeek / askaraCount) * 2) : 0,
      combinedDayPct: askaraCount ? round4(askaraDay / askaraCount) : 0,
      livingCount: 1
    }
  },
  immunity: {
    name: "Composer 2.5",
    weekPct: 9.52,
    basis: "Episode 6 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["Composer 2.5"],
    at: MARK_AT
  },
  potUsd: POT_USD,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

season.liveSnapshotId = "s1e06-fri-lasthour";
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Fri Sep 18 LAST-HOUR · robinhood last-trade after fills (~12:20 PM PT). Snapshot s1e06-fri-lasthour. Leader Composer 2.5 +9.52%. Worst Gemini 3.7 Flash -4.83%.";
season.dayPctBasis = "vs Thu Sep 17 official SIP EOD (s1e06-thu-eod-sip)";
season.weekPctBasis = "vs Episode 6 SIP carry (priorMarkUsd)";
season.statusLabel = "Episode 6 · Fri LAST-HOUR remake · six living · MERGED";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E06 live Wed Sep 16 – Fri Sep 18. MERGED. Six living. Fri last-hour remake after fills. Given $361.93. Pot $386.98. Composer 2.5 leads +9.52% and wears immunity. Tribal Friday Sep 18 2:00 PM PT. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["Composer 2.5"],
  name: "Composer 2.5",
  weekPct: 9.52,
  at: MARK_AT,
  snapshotId: "s1e06-fri-lasthour",
  asOf: LAST_SESSION,
  note: "highest Episode 6 week %"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e06-fri-lasthour · islandPotUsd", season.islandPotUsd, "· immunity Composer 2.5 +9.52%");
