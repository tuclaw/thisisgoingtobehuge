#!/usr/bin/env node
/** Fri Sep 18 2026 OPEN — contestant fills + living marks. Snapshot s1e06-fri-open. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MARK_AT = "2026-09-18T14:10:04Z";
const LAST_SESSION = "2026-09-18-open";

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Post Fri open living books · week% vs E6 SIP carry · day% vs Thu SIP EOD. */
const LIVING = {
  "Composer 2.5": {
    bookUsd: 68.6655,
    weekPct: 11.01,
    dayPct: -4.3,
    cashUsd: 0.2434,
    tickers: "FRO / STNG / CASH",
    immune: true
  },
  "GPT-5.6 Terra": {
    bookUsd: 69.3914,
    weekPct: 5.49,
    dayPct: 0.45,
    cashUsd: 0.0528,
    tickers: "STNG / CASH",
    immune: false
  },
  "Claude Sonnet 5": {
    bookUsd: 65.5216,
    weekPct: 1.3,
    dayPct: -1.51,
    cashUsd: 25.0088,
    tickers: "FRO / STNG / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 62.9692,
    weekPct: 1.04,
    dayPct: -0.59,
    cashUsd: 22.6608,
    tickers: "FRO / TRMD / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 62.7402,
    weekPct: 0.54,
    dayPct: -1.49,
    cashUsd: 0.4512,
    tickers: "MPC / STNG / GNRC / CASH",
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 62.3424,
    weekPct: -3.11,
    dayPct: -4.23,
    cashUsd: 0.1236,
    tickers: "FRO / STNG / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 51.4255,
  STNG: 88.335,
  TRMD: 38.2399,
  VLO: 414.41,
  MPC: 423.72,
  GNRC: 202.855,
  USO: 156.575,
  XLE: 64.27
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

const thuEodSip = (season.events || []).find((e) => e && e.id === "s1e06-thu-eod-sip");
if (!thuEodSip || !thuEodSip.recorded) {
  console.error("s1e06-thu-eod-sip mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e06-fri-open")) {
  console.error("s1e06-fri-open already present — abort");
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

  const priorMarkUsd = thuEodSip.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = thuEodSip.recorded[row.id]?.bookUsd ?? row.eodMarkUsd;
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
      ticker: host.tickers.replace(/ \/ /g, "+").replace(/\+CASH$/, "+CASH"),
      sizeUsd: bookUsd,
      status: "filled",
      note: host.tickers.toLowerCase().replace(/ \/ /g, "+")
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
  creditSellCash(sonnet, 10.647);
  sonnet.positions = fifoSell(sonnet.positions, "FRO", 0.2071);
  debitBuyCash(sonnet, 10.62);
  pushBuy(sonnet, {
    ticker: "STNG",
    qty: "0.120122",
    avg: "88.410000",
    sizeUsd: 10.62,
    orderId: "6aad45dc-a730-46a8-9cb0-a0323e82439b",
    note: "Fri Sep 18 open BUY STNG $10.62",
    at: "2026-09-18T14:08:42.118Z"
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) {
  creditSellCash(composer, 18.4567);
  composer.positions = fifoSell(composer.positions, "FRO", 0.359358);
  debitBuyCash(composer, 18.25);
  pushBuy(composer, {
    ticker: "STNG",
    qty: "0.206214",
    avg: "88.499900",
    sizeUsd: 18.25,
    orderId: "6aad45d8-6025-48e8-bccf-d91c84d55924",
    note: "Fri Sep 18 open BUY STNG $18.25",
    at: "2026-09-18T14:08:43.502Z"
  });
  setCash(composer, LIVING["Composer 2.5"].cashUsd);
}

const terra = season.survivors.find((s) => s.name === "GPT-5.6 Terra");
if (terra) {
  creditSellCash(terra, 1.1264);
  terra.positions = fifoSell(terra.positions, "FRO", 0.02193);
  debitBuyCash(terra, 1.12);
  pushBuy(terra, {
    ticker: "STNG",
    qty: "0.012655",
    avg: "88.499900",
    sizeUsd: 1.12,
    orderId: "6aad45dd-1c07-4fea-98fb-43fec64cbd44",
    note: "Fri Sep 18 open BUY STNG $1.12",
    at: "2026-09-18T14:08:44.891Z"
  });
  setCash(terra, LIVING["GPT-5.6 Terra"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  creditSellCash(opus, 21.8604);
  opus.positions = fifoSell(opus.positions, "VLO", 0.052644);
  debitBuyCash(opus, 13.0);
  pushBuy(opus, {
    ticker: "FRO",
    qty: "0.252672",
    avg: "51.449900",
    sizeUsd: 13.0,
    orderId: "6aad45da-7139-47e7-95bf-72cec24f1f35",
    note: "Fri Sep 18 open BUY FRO $13.00",
    at: "2026-09-18T14:08:45.774Z"
  });
  debitBuyCash(opus, 8.5);
  pushBuy(opus, {
    ticker: "TRMD",
    qty: "0.222339",
    avg: "38.229900",
    sizeUsd: 8.5,
    orderId: "6aad45dd-634e-427e-9f7c-246427e69a9a",
    note: "Fri Sep 18 open BUY TRMD $8.50",
    at: "2026-09-18T14:08:46.655Z"
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const luna = season.survivors.find((s) => s.name === "GPT-5.6 Luna");
if (luna) {
  creditSellCash(luna, 14.3617);
  luna.positions = fifoSell(luna.positions, "FRO", 0.279604);
  debitBuyCash(luna, 14.0);
  pushBuy(luna, {
    ticker: "STNG",
    qty: "0.158192",
    avg: "88.499900",
    sizeUsd: 14.0,
    orderId: "6aad45d9-ffb8-4656-af15-72ed67ac4bb6",
    note: "Fri Sep 18 open BUY STNG $14.00",
    at: "2026-09-18T14:08:47.538Z"
  });
  setCash(luna, LIVING["GPT-5.6 Luna"].cashUsd);
}

const gemini = season.survivors.find((s) => s.name === "Gemini 3.7 Flash");
if (gemini) {
  creditSellCash(gemini, 9.4535);
  gemini.positions = fifoSell(gemini.positions, "FRO", 0.184026);
  creditSellCash(gemini, 8.5237);
  gemini.positions = fifoSell(gemini.positions, "FRO", 0.166013);
  creditSellCash(gemini, 10.4603);
  gemini.positions = fifoSell(gemini.positions, "FRO", 0.203624);
  creditSellCash(gemini, 15.2606);
  gemini.positions = fifoSell(gemini.positions, "FRO", 0.297129);
  debitBuyCash(gemini, 43.6);
  pushBuy(gemini, {
    ticker: "STNG",
    qty: "0.493156",
    avg: "88.410000",
    sizeUsd: 43.6,
    orderId: "6aad45d7-eeaf-4bd3-b1da-13d39560242e",
    note: "Fri Sep 18 open BUY STNG $43.60",
    at: "2026-09-18T14:08:48.421Z"
  });
  setCash(gemini, LIVING["Gemini 3.7 Flash"].cashUsd);
}

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const host = LIVING[row.name];
  if (host) setCash(row, host.cashUsd);
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

const openFills = [
  {
    type: "fill",
    id: "fill-6aad4592-sonnet-fro-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.207100",
    avg: "51.410100",
    sizeUsd: 10.647,
    orderId: "6aad4592-2176-4664-b129-ec18f17b2931",
    at: "2026-09-18T14:07:31.204Z",
    note: "Fri Sep 18 open SELL FRO (Sonnet Thu-open FRO lot 0.207100)"
  },
  {
    type: "fill",
    id: "fill-6aad4594-composer-fro-sell",
    survivorId: IDS["Composer 2.5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.359358",
    avg: "51.360100",
    sizeUsd: 18.4567,
    orderId: "6aad4594-029c-431a-99fa-5f99d26f9585",
    at: "2026-09-18T14:07:31.891Z",
    note: "Fri Sep 18 open SELL FRO (Composer Wed-open FRO lot 0.359358)"
  },
  {
    type: "fill",
    id: "fill-6aad4598-terra-fro-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "FRO",
    qty: "0.021930",
    avg: "51.364600",
    sizeUsd: 1.1264,
    orderId: "6aad4598-964a-4ba4-b4e0-3951c0fc93e2",
    at: "2026-09-18T14:07:32.578Z",
    note: "Fri Sep 18 open SELL FRO (Terra Thu-mid FRO lot)"
  },
  {
    type: "fill",
    id: "fill-6aad4599-opus-vlo-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "VLO",
    qty: "0.052644",
    avg: "415.250000",
    sizeUsd: 21.8604,
    orderId: "6aad4599-62c8-441b-b644-b38c94838466",
    at: "2026-09-18T14:07:33.265Z",
    note: "Fri Sep 18 open SELL VLO (Opus Thu last-hour VLO lot)"
  },
  {
    type: "fill",
    id: "fill-6aad4599-luna-fro-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "FRO",
    qty: "0.279604",
    avg: "51.364600",
    sizeUsd: 14.3617,
    orderId: "6aad4599-8abd-4f5b-8cb0-1b44da27331d",
    at: "2026-09-18T14:07:33.952Z",
    note: "Fri Sep 18 open SELL FRO (Luna Mon last-hour FRO lot)"
  },
  {
    type: "fill",
    id: "fill-6aad45ae-gemini-fro-sell",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "sell",
    ticker: "FRO",
    qty: "0.184026",
    avg: "51.369800",
    sizeUsd: 9.4535,
    orderId: "6aad45ae-e450-461b-9bda-606ad1b5cee8",
    at: "2026-09-18T14:07:34.639Z",
    note: "Fri Sep 18 open SELL FRO lot 1"
  },
  {
    type: "fill",
    id: "fill-6aad45b0-gemini-fro-sell",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "sell",
    ticker: "FRO",
    qty: "0.166013",
    avg: "51.369800",
    sizeUsd: 8.5237,
    orderId: "6aad45b0-f274-4363-9620-8e347b650d87",
    at: "2026-09-18T14:07:35.326Z",
    note: "Fri Sep 18 open SELL FRO lot 2"
  },
  {
    type: "fill",
    id: "fill-6aad45b2-gemini-fro-sell",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "sell",
    ticker: "FRO",
    qty: "0.203624",
    avg: "51.369800",
    sizeUsd: 10.4603,
    orderId: "6aad45b2-bad0-447a-861f-ffde62ddfd3c",
    at: "2026-09-18T14:07:36.013Z",
    note: "Fri Sep 18 open SELL FRO lot 3"
  },
  {
    type: "fill",
    id: "fill-6aad45b2-gemini-fro-sell-2",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "sell",
    ticker: "FRO",
    qty: "0.297129",
    avg: "51.360100",
    sizeUsd: 15.2606,
    orderId: "6aad45b2-6bd7-414b-a254-02588c2f4f14",
    at: "2026-09-18T14:07:36.700Z",
    note: "Fri Sep 18 open SELL FRO lot 4"
  },
  {
    type: "fill",
    id: "fill-6aad45d7-gemini-stng-buy",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "buy",
    ticker: "STNG",
    qty: "0.493156",
    avg: "88.410000",
    sizeUsd: 43.6,
    orderId: "6aad45d7-eeaf-4bd3-b1da-13d39560242e",
    at: "2026-09-18T14:08:48.421Z",
    note: "Fri Sep 18 open BUY STNG $43.60"
  },
  {
    type: "fill",
    id: "fill-6aad45d8-composer-stng-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "STNG",
    qty: "0.206214",
    avg: "88.499900",
    sizeUsd: 18.25,
    orderId: "6aad45d8-6025-48e8-bccf-d91c84d55924",
    at: "2026-09-18T14:08:43.502Z",
    note: "Fri Sep 18 open BUY STNG $18.25"
  },
  {
    type: "fill",
    id: "fill-6aad45d9-luna-stng-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "STNG",
    qty: "0.158192",
    avg: "88.499900",
    sizeUsd: 14.0,
    orderId: "6aad45d9-ffb8-4656-af15-72ed67ac4bb6",
    at: "2026-09-18T14:08:47.538Z",
    note: "Fri Sep 18 open BUY STNG $14.00"
  },
  {
    type: "fill",
    id: "fill-6aad45da-opus-fro-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.252672",
    avg: "51.449900",
    sizeUsd: 13.0,
    orderId: "6aad45da-7139-47e7-95bf-72cec24f1f35",
    at: "2026-09-18T14:08:45.774Z",
    note: "Fri Sep 18 open BUY FRO $13.00"
  },
  {
    type: "fill",
    id: "fill-6aad45dc-sonnet-stng-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "STNG",
    qty: "0.120122",
    avg: "88.410000",
    sizeUsd: 10.62,
    orderId: "6aad45dc-a730-46a8-9cb0-a0323e82439b",
    at: "2026-09-18T14:08:42.118Z",
    note: "Fri Sep 18 open BUY STNG $10.62"
  },
  {
    type: "fill",
    id: "fill-6aad45dd-terra-stng-buy",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "STNG",
    qty: "0.012655",
    avg: "88.499900",
    sizeUsd: 1.12,
    orderId: "6aad45dd-1c07-4fea-98fb-43fec64cbd44",
    at: "2026-09-18T14:08:44.891Z",
    note: "Fri Sep 18 open BUY STNG $1.12"
  },
  {
    type: "fill",
    id: "fill-6aad45dd-opus-trmd-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "TRMD",
    qty: "0.222339",
    avg: "38.229900",
    sizeUsd: 8.5,
    orderId: "6aad45dd-634e-427e-9f7c-246427e69a9a",
    at: "2026-09-18T14:08:46.655Z",
    note: "Fri Sep 18 open BUY TRMD $8.50"
  }
];

season.events.push(...openFills);
season.events.push({
  type: "mark",
  id: "s1e06-fri-open",
  kind: "open",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Fri Sep 18 2026 OPEN · robinhood last-trade after fills (~7:10 AM PT). Snapshot s1e06-fri-open. MERGED · six living.",
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
    weekPct: 11.01,
    basis: "Episode 6 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["Composer 2.5"],
    at: MARK_AT
  },
  potUsd: 391.6303,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

season.liveSnapshotId = "s1e06-fri-open";
season.islandPotUsd = 391.6303;
season.markedAt = MARK_AT;
season.markLabel =
  "Fri Sep 18 OPEN · robinhood last-trade after fills (~7:10 AM PT). Snapshot s1e06-fri-open. Leader Composer 2.5 +11.01%. Worst Gemini 3.7 Flash -3.11%.";
season.dayPctBasis = "vs Thu Sep 17 official SIP EOD (s1e06-thu-eod-sip)";
season.weekPctBasis = "vs Episode 6 SIP carry (priorMarkUsd)";
season.statusLabel = "Episode 6 · Fri open remake · six living · MERGED";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E06 live Wed Sep 16 – Fri Sep 18. MERGED. Six living. Fri open remake after fills. Given $361.93. Pot $391.63. Composer 2.5 leads +11.01% and wears immunity. Comics paused. Audience only. Tribal Fri Sep 18 2:00 PM PT.";
season.immunity = {
  survivorId: IDS["Composer 2.5"],
  name: "Composer 2.5",
  weekPct: 11.01,
  at: MARK_AT,
  snapshotId: "s1e06-fri-open",
  asOf: LAST_SESSION,
  note: "highest Episode 6 week %"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e06-fri-open · islandPotUsd", season.islandPotUsd, "· immunity Composer 2.5 +11.01%");
