#!/usr/bin/env node
/** Thu Sep 17 2026 OPEN — contestant fills + living marks. Snapshot s1e06-thu-open. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MARK_AT = "2026-09-17T14:07:04Z";
const LAST_SESSION = "2026-09-17-open";

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Post Thu open living books · week% vs E6 SIP carry · day% vs Wed SIP EOD. */
const LIVING = {
  "Composer 2.5": {
    bookUsd: 64.2967,
    weekPct: 3.95,
    dayPct: 1.41,
    cashUsd: 0.0367,
    tickers: "FRO / CASH",
    immune: true
  },
  "GPT-5.6 Terra": {
    bookUsd: 68.3513,
    weekPct: 3.9,
    dayPct: 1.78,
    cashUsd: 0.0069,
    tickers: "FRO / STNG / CASH",
    immune: false
  },
  "Claude Sonnet 5": {
    bookUsd: 66.8223,
    weekPct: 3.31,
    dayPct: 1.1,
    cashUsd: 14.4283,
    tickers: "FRO / STNG / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 63.724,
    weekPct: 2.25,
    dayPct: 0.77,
    cashUsd: 23.463,
    tickers: "FRO / TRMD / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 63.6701,
    weekPct: 2.03,
    dayPct: 0.56,
    cashUsd: 1.0267,
    tickers: "FRO / MPC / VLO / CASH",
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 65.5054,
    weekPct: 1.81,
    dayPct: 0.6,
    cashUsd: 0.0215,
    tickers: "FRO / STNG / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 54.425,
  USO: 153.96,
  MPC: 414.175,
  STNG: 87.79,
  VLO: 401.2886,
  TRMD: 37.101,
  XLE: 63.85
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

const wedEodSip = (season.events || []).find((e) => e && e.id === "s1e06-wed-eod-sip");
if (!wedEodSip || !wedEodSip.recorded) {
  console.error("s1e06-wed-eod-sip mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e06-thu-open")) {
  console.error("s1e06-thu-open already present — abort");
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

  const priorMarkUsd = wedEodSip.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = wedEodSip.recorded[row.id]?.bookUsd ?? row.eodMarkUsd;
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
  creditSellCash(sonnet, 4.1887);
  sonnet.positions = fifoSell(sonnet.positions, "FRO", 0.077125);
  debitBuyCash(sonnet, 4.0);
  pushBuy(sonnet, {
    ticker: "STNG",
    qty: "0.045602",
    avg: "87.715400",
    sizeUsd: 4.0,
    orderId: "6aabf3a8-05fa-4921-be26-c75a70817556",
    note: "Thu Sep 17 open BUY STNG $4.00",
    at: "2026-09-17T14:05:28.369Z"
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  creditSellCash(opus, 4.6255);
  opus.positions = fifoSell(opus.positions, "MPC", 0.011161);
  debitBuyCash(opus, 4.62);
  pushBuy(opus, {
    ticker: "TRMD",
    qty: "0.124461",
    avg: "37.119900",
    sizeUsd: 4.62,
    orderId: "6aabf3a9-4ecf-4fe4-8070-f29ced288ea7",
    note: "Thu Sep 17 open BUY TRMD $4.62 (scaled from $5.50 — own MPC sell proceeds only)",
    at: "2026-09-17T14:05:29.309Z"
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const gemini = season.survivors.find((s) => s.name === "Gemini 3.7 Flash");
if (gemini) {
  creditSellCash(gemini, 18.7179);
  gemini.positions = fifoSell(gemini.positions, "USO", 0.121589);
  debitBuyCash(gemini, 10.0);
  pushBuy(gemini, {
    ticker: "FRO",
    qty: "0.184026",
    avg: "54.339900",
    sizeUsd: 10.0,
    orderId: "6aabf3a9-53ea-4cf3-8763-4d0b78436235",
    note: "Thu Sep 17 open BUY FRO $10.00",
    at: "2026-09-17T14:05:30.182Z"
  });
  debitBuyCash(gemini, 8.7);
  pushBuy(gemini, {
    ticker: "STNG",
    qty: "0.099088",
    avg: "87.800000",
    sizeUsd: 8.7,
    orderId: "6aabf3c6-b075-470b-95a0-3c30f58ce491",
    note: "Thu Sep 17 open BUY STNG $8.70",
    at: "2026-09-17T14:05:58.916Z"
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

const SIP_PRIOR = {
  FRO: 53.67,
  USO: 156.17,
  MPC: 413.92,
  STNG: 85.64,
  VLO: 403.28,
  TRMD: 36.6,
  XLE: 64.03
};

for (const [ticker, last] of Object.entries(LAST_QUOTES)) {
  const q = season.quotes[ticker] || {};
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    sip: SIP_PRIOR[ticker] ?? q.sip,
    source: "robinhood-last-trade",
    session: LAST_SESSION,
    date: "2026-09-17",
    asOf: MARK_AT,
    priorCloseDate: "2026-09-16",
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
    id: "fill-6aabf37c-sonnet-fro-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.077125",
    avg: "54.310100",
    sizeUsd: 4.1887,
    orderId: "6aabf37c-3878-4dbe-a190-d596ae0d9661",
    at: "2026-09-17T14:04:44.217Z",
    note: "Thu Sep 17 open SELL FRO (Sonnet Wed Sep 9 FRO lot 0.077125 @47.33)"
  },
  {
    type: "fill",
    id: "fill-6aabf37c-opus-mpc-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "MPC",
    qty: "0.011161",
    avg: "414.430700",
    sizeUsd: 4.6255,
    orderId: "6aabf37c-2311-4b8b-8b8f-44b8c6e9f274",
    at: "2026-09-17T14:04:45.085Z",
    note: "Thu Sep 17 open SELL MPC (Opus Fri mid MPC sole lot)"
  },
  {
    type: "fill",
    id: "fill-6aabf37d-gemini-uso-sell",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "sell",
    ticker: "USO",
    qty: "0.121589",
    avg: "153.943900",
    sizeUsd: 18.7179,
    orderId: "6aabf37d-b053-4273-a658-ba2fa0a576f4",
    at: "2026-09-17T14:04:45.168Z",
    note: "Thu Sep 17 open SELL USO (Gemini both USO lots 0.079856+0.041733)"
  },
  {
    type: "fill",
    id: "fill-6aabf3a8-sonnet-stng-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "STNG",
    qty: "0.045602",
    avg: "87.715400",
    sizeUsd: 4.0,
    orderId: "6aabf3a8-05fa-4921-be26-c75a70817556",
    at: "2026-09-17T14:05:28.369Z",
    note: "Thu Sep 17 open BUY STNG $4.00"
  },
  {
    type: "fill",
    id: "fill-6aabf3a9-opus-trmd-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "TRMD",
    qty: "0.124461",
    avg: "37.119900",
    sizeUsd: 4.62,
    orderId: "6aabf3a9-4ecf-4fe4-8070-f29ced288ea7",
    at: "2026-09-17T14:05:29.309Z",
    note: "Thu Sep 17 open BUY TRMD $4.62 (scaled from $5.50 — own MPC sell proceeds only)"
  },
  {
    type: "fill",
    id: "fill-6aabf3a9-gemini-fro-buy",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "buy",
    ticker: "FRO",
    qty: "0.184026",
    avg: "54.339900",
    sizeUsd: 10.0,
    orderId: "6aabf3a9-53ea-4cf3-8763-4d0b78436235",
    at: "2026-09-17T14:05:30.182Z",
    note: "Thu Sep 17 open BUY FRO $10.00"
  },
  {
    type: "fill",
    id: "fill-6aabf3c6-gemini-stng-buy",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "buy",
    ticker: "STNG",
    qty: "0.099088",
    avg: "87.800000",
    sizeUsd: 8.7,
    orderId: "6aabf3c6-b075-470b-95a0-3c30f58ce491",
    at: "2026-09-17T14:05:58.916Z",
    note: "Thu Sep 17 open BUY STNG $8.70"
  }
];

season.events.push(...openFills);
season.events.push({
  type: "mark",
  id: "s1e06-thu-open",
  kind: "open",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Thu Sep 17 2026 OPEN · robinhood last-trade after fills (~7:06 AM PT). Snapshot s1e06-thu-open. MERGED · six living.",
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
    weekPct: 3.95,
    basis: "Episode 6 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["Composer 2.5"],
    at: MARK_AT
  },
  potUsd: 392.3698,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

season.liveSnapshotId = "s1e06-thu-open";
season.islandPotUsd = 392.3698;
season.markedAt = MARK_AT;
season.markLabel =
  "Thu Sep 17 OPEN · robinhood last-trade after fills (~7:06 AM PT). Snapshot s1e06-thu-open.";
season.dayPctBasis = "vs Wed Sep 16 official SIP EOD (s1e06-wed-eod-sip)";
season.weekPctBasis = "vs Episode 6 SIP carry (priorMarkUsd)";
season.statusLabel = "Live · S1E06 · MERGED · six living · Thu open";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E06 live Wed Sep 16 – Fri Sep 18. MERGED. Six living. Thu open remake after fills. Given $361.93. Pot $392.37. Composer 2.5 leads +3.95% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["Composer 2.5"],
  name: "Composer 2.5",
  weekPct: 3.95,
  at: MARK_AT,
  snapshotId: "s1e06-thu-open",
  asOf: LAST_SESSION,
  note: "highest Episode 6 week %"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e06-thu-open · islandPotUsd", season.islandPotUsd, "· immunity Composer 2.5 +3.95%");
