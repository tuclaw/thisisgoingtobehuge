#!/usr/bin/env node
/** Fri Sep 18 2026 MID — contestant fills + living marks. Snapshot s1e06-fri-mid. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MARK_AT = "2026-09-18T17:15:19Z";
const LAST_SESSION = "2026-09-18-mid";
const POT_USD = 387.3824;

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Post Fri mid living books · week% vs E6 SIP carry · day% vs Thu SIP EOD. */
const LIVING = {
  "Composer 2.5": {
    bookUsd: 67.6574,
    weekPct: 9.38,
    dayPct: -5.71,
    cashUsd: 0.2434,
    tickers: "FRO+STNG+CASH",
    immune: true
  },
  "GPT-5.6 Terra": {
    bookUsd: 68.4353,
    weekPct: 4.03,
    dayPct: -0.93,
    cashUsd: 0.1083,
    tickers: "STNG+TRMD+CASH",
    immune: false
  },
  "Claude Sonnet 5": {
    bookUsd: 64.9578,
    weekPct: 0.43,
    dayPct: -2.35,
    cashUsd: 25.0031,
    tickers: "STNG+CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 62.537,
    weekPct: 0.34,
    dayPct: -1.27,
    cashUsd: 22.8188,
    tickers: "FRO+CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 62.2926,
    weekPct: -0.18,
    dayPct: -2.19,
    cashUsd: 0.8589,
    tickers: "MPC+GNRC+STNG+TRMD+CASH",
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 61.5023,
    weekPct: -4.41,
    dayPct: -5.53,
    cashUsd: 0.1236,
    tickers: "FRO+STNG+CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 50.615,
  STNG: 87.18,
  TRMD: 38.205,
  VLO: 410.59,
  MPC: 422.9878,
  GNRC: 203.18,
  USO: 154.29,
  XLE: 64.375
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

const friOpen = (season.events || []).find((e) => e && e.id === "s1e06-fri-open");
if (!friOpen || !friOpen.recorded) {
  console.error("s1e06-fri-open mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e06-fri-mid")) {
  console.error("s1e06-fri-mid already present — abort");
  process.exit(1);
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
  const host = LIVING[row.name];
  if (!host) continue;

  const priorMarkUsd = friOpen.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = friOpen.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd;
  const bookUsd = host.bookUsd;
  const weekPct = host.weekPct;
  const dayPct = host.dayPct;
  const monthPct = monthPctFromWeek(weekPct);

  midRecorded[row.id] = {
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
  creditSellCash(sonnet, 10.7943);
  sonnet.positions = fifoSell(sonnet.positions, "FRO", 0.213159);
  debitBuyCash(sonnet, 10.8);
  pushBuy(sonnet, {
    ticker: "STNG",
    qty: "0.123768",
    avg: "87.259900",
    sizeUsd: 10.8,
    orderId: "6aad713c-ec92-4cd2-8c8b-41210a6f2cc7",
    note: "Fri Sep 18 mid BUY STNG $10.80",
    at: "2026-09-18T17:13:33.084Z"
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const terra = season.survivors.find((s) => s.name === "GPT-5.6 Terra");
if (terra) {
  creditSellCash(terra, 23.1735);
  terra.positions = fifoSell(terra.positions, "STNG", 0.265904);
  creditSellCash(terra, 44.132);
  terra.positions = fifoSell(terra.positions, "STNG", 0.506392);
  debitBuyCash(terra, 67.25);
  pushBuy(terra, {
    ticker: "TRMD",
    qty: "1.759554",
    avg: "38.219900",
    sizeUsd: 67.25,
    orderId: "6aad713f-6c5b-4d4d-b544-8e1cb8790321",
    note: "Fri Sep 18 mid BUY TRMD $67.25",
    at: "2026-09-18T17:13:35.556Z"
  });
  setCash(terra, LIVING["GPT-5.6 Terra"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  creditSellCash(opus, 4.757);
  opus.positions = fifoSell(opus.positions, "TRMD", 0.124461);
  creditSellCash(opus, 8.501);
  opus.positions = fifoSell(opus.positions, "TRMD", 0.222339);
  debitBuyCash(opus, 13.1);
  pushBuy(opus, {
    ticker: "FRO",
    qty: "0.258770",
    avg: "50.624000",
    sizeUsd: 13.1,
    orderId: "6aad713d-8363-493a-bf98-f73813c72083",
    note: "Fri Sep 18 mid BUY FRO $13.10",
    at: "2026-09-18T17:13:34.095Z"
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const luna = season.survivors.find((s) => s.name === "GPT-5.6 Luna");
if (luna) {
  creditSellCash(luna, 18.4077);
  luna.positions = fifoSell(luna.positions, "STNG", 0.211316);
  debitBuyCash(luna, 18.0);
  pushBuy(luna, {
    ticker: "TRMD",
    qty: "0.470958",
    avg: "38.219900",
    sizeUsd: 18.0,
    orderId: "6aad713f-1e35-4af2-bc5f-81ae479997c1",
    note: "Fri Sep 18 mid BUY TRMD $18.00",
    at: "2026-09-18T17:13:35.673Z"
  });
  setCash(luna, LIVING["GPT-5.6 Luna"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) setCash(composer, LIVING["Composer 2.5"].cashUsd);

const gemini = season.survivors.find((s) => s.name === "Gemini 3.7 Flash");
if (gemini) setCash(gemini, LIVING["Gemini 3.7 Flash"].cashUsd);

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

const midFills = [
  {
    type: "fill",
    id: "fill-6aad7102-sonnet-fro-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.213159",
    avg: "50.639900",
    sizeUsd: 10.7943,
    orderId: "6aad7102-7991-4aa0-9cc1-3e75c447522c",
    at: "2026-09-18T17:12:34.645Z",
    note: "Fri Sep 18 mid SELL FRO (Sonnet Thu Sep 10 last-hour lot 0.213159)"
  },
  {
    type: "fill",
    id: "fill-6aad7104-opus-trmd-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "TRMD",
    qty: "0.124461",
    avg: "38.220100",
    sizeUsd: 4.757,
    orderId: "6aad7104-9476-41c3-9882-fa087bdbf5d4",
    at: "2026-09-18T17:12:36.525Z",
    note: "Fri Sep 18 mid SELL TRMD (Opus Thu open lot 0.124461)"
  },
  {
    type: "fill",
    id: "fill-6aad7106-terra-stng-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "STNG",
    qty: "0.265904",
    avg: "87.150000",
    sizeUsd: 23.1735,
    orderId: "6aad7106-0cd4-4fa9-a961-61ba1c46a236",
    at: "2026-09-18T17:12:38.252Z",
    note: "Fri Sep 18 mid SELL STNG (Terra Tue last-hour lot 0.265904)"
  },
  {
    type: "fill",
    id: "fill-6aad7107-terra-stng-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "STNG",
    qty: "0.506392",
    avg: "87.150000",
    sizeUsd: 44.132,
    orderId: "6aad7107-9b9c-4c12-832a-2fe7c26e6186",
    at: "2026-09-18T17:12:40.031Z",
    note: "Fri Sep 18 mid SELL STNG (Terra Thu last-hour lot 0.506392)"
  },
  {
    type: "fill",
    id: "fill-6aad7116-luna-stng-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "STNG",
    qty: "0.211316",
    avg: "87.110000",
    sizeUsd: 18.4077,
    orderId: "6aad7116-8694-4d3d-a4c7-5386f2147c66",
    at: "2026-09-18T17:12:54.364Z",
    note: "Fri Sep 18 mid SELL STNG (Luna Thu mid lot 0.211316; retry after tax-lot API fail)"
  },
  {
    type: "fill",
    id: "fill-6aad7124-opus-trmd-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "TRMD",
    qty: "0.222339",
    avg: "38.234200",
    sizeUsd: 8.501,
    orderId: "6aad7124-2544-4464-85d4-64f6409d1a07",
    at: "2026-09-18T17:13:08.422Z",
    note: "Fri Sep 18 mid SELL TRMD (Opus Fri open lot 0.222339 — FIFO, same-day not pin-selectable)"
  },
  {
    type: "fill",
    id: "fill-6aad713c-sonnet-stng-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "STNG",
    qty: "0.123768",
    avg: "87.259900",
    sizeUsd: 10.8,
    orderId: "6aad713c-ec92-4cd2-8c8b-41210a6f2cc7",
    at: "2026-09-18T17:13:33.084Z",
    note: "Fri Sep 18 mid BUY STNG $10.80 from FRO exit"
  },
  {
    type: "fill",
    id: "fill-6aad713d-opus-fro-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.258770",
    avg: "50.624000",
    sizeUsd: 13.1,
    orderId: "6aad713d-8363-493a-bf98-f73813c72083",
    at: "2026-09-18T17:13:34.095Z",
    note: "Fri Sep 18 mid BUY FRO $13.10 from TRMD exit"
  },
  {
    type: "fill",
    id: "fill-6aad713f-terra-trmd-buy",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "TRMD",
    qty: "1.759554",
    avg: "38.219900",
    sizeUsd: 67.25,
    orderId: "6aad713f-6c5b-4d4d-b544-8e1cb8790321",
    at: "2026-09-18T17:13:35.556Z",
    note: "Fri Sep 18 mid BUY TRMD $67.25 from STNG rotation"
  },
  {
    type: "fill",
    id: "fill-6aad713f-luna-trmd-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "TRMD",
    qty: "0.470958",
    avg: "38.219900",
    sizeUsd: 18.0,
    orderId: "6aad713f-1e35-4af2-bc5f-81ae479997c1",
    at: "2026-09-18T17:13:35.673Z",
    note: "Fri Sep 18 mid BUY TRMD $18.00 from STNG trim"
  }
];

season.events.push(...midFills);
season.events.push({
  type: "mark",
  id: "s1e06-fri-mid",
  kind: "mid",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Fri Sep 18 2026 MID · robinhood last-trade after fills (~10:14 AM PT). Snapshot s1e06-fri-mid. MERGED · six living.",
  dayPctPriorOfficial: true,
  quoteSource: "robinhood-last-trade",
  recorded: midRecorded,
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
    weekPct: 9.38,
    basis: "Episode 6 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["Composer 2.5"],
    at: MARK_AT
  },
  potUsd: POT_USD,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

season.liveSnapshotId = "s1e06-fri-mid";
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Fri Sep 18 MID · robinhood last-trade after fills (~10:14 AM PT). Snapshot s1e06-fri-mid. Leader Composer 2.5 +9.38%. Worst Gemini 3.7 Flash -4.41%.";
season.dayPctBasis = "vs Thu Sep 17 official SIP EOD (s1e06-thu-eod-sip)";
season.weekPctBasis = "vs Episode 6 SIP carry (priorMarkUsd)";
season.statusLabel = "Episode 6 · Fri MID remake · six living · MERGED";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E06 live Wed Sep 16 – Fri Sep 18. MERGED. Six living. Fri mid remake after fills. Given $361.93. Pot $387.38. Composer 2.5 leads +9.38% and wears immunity. Tribal Friday Sep 18 2:00 PM PT. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["Composer 2.5"],
  name: "Composer 2.5",
  weekPct: 9.38,
  at: MARK_AT,
  snapshotId: "s1e06-fri-mid",
  asOf: LAST_SESSION,
  note: "highest Episode 6 week %"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e06-fri-mid · islandPotUsd", season.islandPotUsd, "· immunity Composer 2.5 +9.38%");
