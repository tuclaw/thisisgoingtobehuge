#!/usr/bin/env node
/** Fri Sep 11 2026 MID catch-up — mid-session fills (6aa434*) + living marks Terra +5.13%. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MID_AT = "2026-09-11T17:06:02Z";
const MID_SESSION = "2026-09-11-mid";
const FILL_BASE = "2026-09-11T17:05:00.000Z";

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

/** Post mid-fill living books (host truth). */
const LIVING = {
  "GPT-5.6 Terra": {
    bookUsd: 47.5153,
    weekPct: 5.13,
    dayPct: -1.2,
    cashUsd: 0.1346,
    tickers: "FRO / CASH",
    immune: true
  },
  "Kimi K3": {
    bookUsd: 47.1754,
    weekPct: 4.45,
    dayPct: -1.48,
    cashUsd: 0.2417,
    tickers: "USO / MPC / FRO / VLO / CASH",
    immune: false
  },
  "Grok 4.6": {
    bookUsd: 47.3168,
    weekPct: 3.66,
    dayPct: -3.06,
    cashUsd: 1.2299,
    tickers: "USO / MPC / VLO / CASH",
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 46.5002,
    weekPct: 2.71,
    dayPct: -2.36,
    cashUsd: 0.0442,
    tickers: "USO / FRO / MPC / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 46.5972,
    weekPct: 2.6,
    dayPct: -0.45,
    cashUsd: 0.1065,
    tickers: "VLO / FRO / MPC / CASH",
    immune: false
  },
  "Claude Sonnet 5": {
    bookUsd: 46.323,
    weekPct: 2.4,
    dayPct: 0.35,
    cashUsd: 0.0028,
    tickers: "FRO / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 46.148,
    weekPct: 2.18,
    dayPct: -1.52,
    cashUsd: 0.0587,
    tickers: "FRO / VLO / XLE / CASH",
    immune: false
  },
  "Composer 2.5": {
    bookUsd: 45.8156,
    weekPct: 0.92,
    dayPct: -2.19,
    cashUsd: 0.2352,
    tickers: "FRO / VLO / MPC / CASH",
    immune: false
  }
};

const MID_QUOTES = {
  USO: 154.07,
  FRO: 48.93,
  VLO: 394.6,
  MPC: 402.795,
  XLE: 65.11,
  CVX: 213.835,
  XOM: 165.46
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
    last: MID_QUOTES[ticker],
    lastSource: "RTH last-trade",
    lastSession: MID_SESSION
  });
}

const friOpen = (season.events || []).find((e) => e && e.id === "s1e04-fri-open");
const friMidIdx = (season.events || []).findIndex((e) => e && e.id === "s1e04-fri-mid");
if (!friOpen || !friOpen.recorded || friMidIdx < 0) {
  console.error("s1e04-fri-open or s1e04-fri-mid mark missing");
  process.exit(1);
}

const existingMidFill = (season.events || []).some(
  (e) => e && e.type === "fill" && String(e.orderId || "").startsWith("6aa434")
);
if (existingMidFill) {
  console.error("6aa434* mid fills already present — abort");
  process.exit(1);
}

const midRecorded = {};
let biduWeek = 0;
let askaraWeek = 0;
let biduCount = 0;
let askaraCount = 0;

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const host = LIVING[row.name];
  if (!host) continue;

  const priorMarkUsd = friOpen.recorded[row.id]?.bookUsd ?? row.bookUsd;
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
    eodMarkUsd: friOpen.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = dayPct;
  row.priorMarkUsd = priorMarkUsd;
  row.immune = host.immune;
  row.lastSource = "RTH last-trade";
  row.lastSession = MID_SESSION;
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
    biduCount += 1;
  }
  if (row.tribeId === "askara") {
    askaraWeek += weekPct;
    askaraCount += 1;
  }
}

const grok = season.survivors.find((s) => s.name === "Grok 4.6");
if (grok) {
  grok.positions = fifoSell(grok.positions, "USO", 0.164659);
  pushBuy(grok, {
    ticker: "MPC",
    qty: "0.060783",
    avg: "403.069900",
    sizeUsd: 24.5,
    orderId: "6aa43442-9051-4ce2-bd1c-0bb270f11540",
    note: "Fri Sep 11 mid BUY MPC",
    at: FILL_BASE
  });
  setCash(grok, LIVING["Grok 4.6"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) {
  composer.positions = fifoSell(composer.positions, "USO", 0.136751);
  pushBuy(composer, {
    ticker: "VLO",
    qty: "0.035469",
    avg: "394.709900",
    sizeUsd: 14,
    orderId: "6aa43444-2990-41cb-a283-66db31ee2ffb",
    note: "Fri Sep 11 mid BUY VLO",
    at: "2026-09-11T17:05:02.000Z"
  });
  pushBuy(composer, {
    ticker: "MPC",
    qty: "0.017370",
    avg: "402.985100",
    sizeUsd: 7,
    orderId: "6aa43444-43a0-44e5-b653-22df5c732231",
    note: "Fri Sep 11 mid BUY MPC",
    at: "2026-09-11T17:05:04.000Z"
  });
  setCash(composer, LIVING["Composer 2.5"].cashUsd);
}

const kimi = season.survivors.find((s) => s.name === "Kimi K3");
if (kimi) {
  kimi.positions = fifoSell(kimi.positions, "USO", 0.124803);
  pushBuy(kimi, {
    ticker: "FRO",
    qty: "0.142974",
    avg: "48.959900",
    sizeUsd: 7,
    orderId: "6aa43449-f6a6-48cb-b1b0-6f0e2b2519b7",
    note: "Fri Sep 11 mid BUY FRO",
    at: "2026-09-11T17:05:06.000Z"
  });
  pushBuy(kimi, {
    ticker: "MPC",
    qty: "0.029777",
    avg: "402.982300",
    sizeUsd: 12,
    orderId: "6aa43449-f505-490a-8551-ad83bc924a0a",
    note: "Fri Sep 11 mid BUY MPC",
    at: "2026-09-11T17:05:08.000Z"
  });
  setCash(kimi, LIVING["Kimi K3"].cashUsd);
}

const luna = season.survivors.find((s) => s.name === "GPT-5.6 Luna");
if (luna) {
  luna.positions = fifoSell(luna.positions, "USO", 0.095463);
  pushBuy(luna, {
    ticker: "XLE",
    qty: "0.225789",
    avg: "65.105000",
    sizeUsd: 14.7,
    orderId: "6aa43445-3d8b-4b81-9fa1-a2f254ea29fd",
    note: "Fri Sep 11 mid BUY XLE",
    at: "2026-09-11T17:05:10.000Z"
  });
  setCash(luna, LIVING["GPT-5.6 Luna"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  opus.positions = fifoSell(opus.positions, "USO", 0.02713);
  pushBuy(opus, {
    ticker: "MPC",
    qty: "0.011161",
    avg: "403.179900",
    sizeUsd: 4.5,
    orderId: "6aa43445-5824-4219-9f4f-379f945b18f7",
    note: "Fri Sep 11 mid BUY MPC (USO sell retried after tax-lot unavailable)",
    at: "2026-09-11T17:05:12.000Z"
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

for (const name of ["Claude Sonnet 5", "Gemini 3.7 Flash", "GPT-5.6 Terra"]) {
  const row = season.survivors.find((s) => s.name === name);
  if (row) setCash(row, LIVING[name].cashUsd);
}

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  for (const pos of row.positions || []) {
    if (!pos.ticker || pos.ticker === "CASH") continue;
    if (MID_QUOTES[pos.ticker]) {
      pos.last = MID_QUOTES[pos.ticker];
    }
    pos.lastSource = "RTH last-trade";
    pos.lastSession = MID_SESSION;
  }
}

for (const [ticker, last] of Object.entries(MID_QUOTES)) {
  const q = season.quotes[ticker] || {};
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: "RTH last-trade",
    session: MID_SESSION,
    date: "2026-09-11",
    asOf: MID_AT,
    priorCloseDate: q.priorCloseDate || "2026-09-10",
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

const midFills = [
  {
    type: "fill",
    id: "fill-6aa4340a-grok-uso-sell",
    survivorId: IDS["Grok 4.6"],
    side: "sell",
    ticker: "USO",
    qty: "0.164659",
    avg: "154.069100",
    sizeUsd: 25.3689,
    orderId: "6aa4340a-0049-4553-9e12-d5d7d4eb123c",
    at: FILL_BASE,
    note: "Fri Sep 11 mid SELL USO"
  },
  {
    type: "fill",
    id: "fill-6aa4340e-composer-uso-sell",
    survivorId: IDS["Composer 2.5"],
    side: "sell",
    ticker: "USO",
    qty: "0.136751",
    avg: "154.090100",
    sizeUsd: 21.072,
    orderId: "6aa4340e-4dc5-40ea-9afd-8b1ecb5efef6",
    at: "2026-09-11T17:05:01.000Z",
    note: "Fri Sep 11 mid SELL USO"
  },
  {
    type: "fill",
    id: "fill-6aa43410-kimi-uso-sell",
    survivorId: IDS["Kimi K3"],
    side: "sell",
    ticker: "USO",
    qty: "0.124803",
    avg: "154.111300",
    sizeUsd: 19.2336,
    orderId: "6aa43410-3a80-4b74-ad6b-a20fdd32b4b6",
    at: "2026-09-11T17:05:02.000Z",
    note: "Fri Sep 11 mid SELL USO (scaled — tiny USO stub remains)"
  },
  {
    type: "fill",
    id: "fill-6aa43414-luna-uso-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "USO",
    qty: "0.095463",
    avg: "154.089100",
    sizeUsd: 14.7098,
    orderId: "6aa43414-10c7-44b5-aa69-cf3cee25e84a",
    at: "2026-09-11T17:05:03.000Z",
    note: "Fri Sep 11 mid SELL USO"
  },
  {
    type: "fill",
    id: "fill-6aa4341e-opus-uso-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "USO",
    qty: "0.027130",
    avg: "154.090100",
    sizeUsd: 4.1805,
    orderId: "6aa4341e-159a-4777-826c-4f9f96f01664",
    at: "2026-09-11T17:05:04.000Z",
    note: "Fri Sep 11 mid SELL USO (retried after tax-lot unavailable)"
  },
  {
    type: "fill",
    id: "fill-6aa43442-grok-mpc-buy",
    survivorId: IDS["Grok 4.6"],
    side: "buy",
    ticker: "MPC",
    qty: "0.060783",
    avg: "403.069900",
    sizeUsd: 24.5,
    orderId: "6aa43442-9051-4ce2-bd1c-0bb270f11540",
    at: "2026-09-11T17:05:05.000Z",
    note: "Fri Sep 11 mid BUY MPC"
  },
  {
    type: "fill",
    id: "fill-6aa43444-composer-vlo-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "VLO",
    qty: "0.035469",
    avg: "394.709900",
    sizeUsd: 14,
    orderId: "6aa43444-2990-41cb-a283-66db31ee2ffb",
    at: "2026-09-11T17:05:06.000Z",
    note: "Fri Sep 11 mid BUY VLO"
  },
  {
    type: "fill",
    id: "fill-6aa43444-composer-mpc-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "MPC",
    qty: "0.017370",
    avg: "402.985100",
    sizeUsd: 7,
    orderId: "6aa43444-43a0-44e5-b653-22df5c732231",
    at: "2026-09-11T17:05:07.000Z",
    note: "Fri Sep 11 mid BUY MPC"
  },
  {
    type: "fill",
    id: "fill-6aa43445-opus-mpc-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "MPC",
    qty: "0.011161",
    avg: "403.179900",
    sizeUsd: 4.5,
    orderId: "6aa43445-5824-4219-9f4f-379f945b18f7",
    at: "2026-09-11T17:05:08.000Z",
    note: "Fri Sep 11 mid BUY MPC"
  },
  {
    type: "fill",
    id: "fill-6aa43445-luna-xle-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "XLE",
    qty: "0.225789",
    avg: "65.105000",
    sizeUsd: 14.7,
    orderId: "6aa43445-3d8b-4b81-9fa1-a2f254ea29fd",
    at: "2026-09-11T17:05:09.000Z",
    note: "Fri Sep 11 mid BUY XLE"
  },
  {
    type: "fill",
    id: "fill-6aa43449-kimi-fro-buy",
    survivorId: IDS["Kimi K3"],
    side: "buy",
    ticker: "FRO",
    qty: "0.142974",
    avg: "48.959900",
    sizeUsd: 7,
    orderId: "6aa43449-f6a6-48cb-b1b0-6f0e2b2519b7",
    at: "2026-09-11T17:05:10.000Z",
    note: "Fri Sep 11 mid BUY FRO"
  },
  {
    type: "fill",
    id: "fill-6aa43449-kimi-mpc-buy",
    survivorId: IDS["Kimi K3"],
    side: "buy",
    ticker: "MPC",
    qty: "0.029777",
    avg: "402.982300",
    sizeUsd: 12,
    orderId: "6aa43449-f505-490a-8551-ad83bc924a0a",
    at: "2026-09-11T17:05:11.000Z",
    note: "Fri Sep 11 mid BUY MPC"
  }
];

season.events.splice(friMidIdx, 0, ...midFills);

const friMidIdxAfter = (season.events || []).findIndex((e) => e && e.id === "s1e04-fri-mid");
season.events[friMidIdxAfter] = {
  type: "mark",
  id: "s1e04-fri-mid",
  kind: "intraday",
  at: MID_AT,
  throughAt: MID_AT,
  lastSession: MID_SESSION,
  label:
    "Fri Sep 11 2026 MID · RTH last-trade (~10:03 AM PT) · living marks after mid fills",
  dayPctPriorOfficial: true,
  recorded: midRecorded,
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
};

season.liveSnapshotId = "s1e04-fri-mid";
season.islandPotUsd = 373.3915;
season.markedAt = MID_AT;
season.markLabel =
  "Fri Sep 11 2026 MID · RTH last-trade (~10:03 AM PT) · living marks after mid fills";
season.statusLabel = "Live · S1E04 · MERGED · eight living · Fri mid · leader GPT-5.6 Terra";
season.lastSource = "RTH last-trade";
season.lastSession = MID_SESSION;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E03 closed Tue Sep 8 tribal — GPT-5.6 Sol voted out 7–1. S1E04 live Wed Sep 9 – Fri Sep 11. MERGED. Eight living. Given $361.93. Pot $373.3915. GPT-5.6 Terra leads +5.13% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["GPT-5.6 Terra"],
  name: "GPT-5.6 Terra",
  weekPct: 5.13,
  at: MID_AT,
  snapshotId: "s1e04-fri-mid",
  asOf: MID_SESSION
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e04-fri-mid fills · islandPotUsd", season.islandPotUsd, "· immunity Terra +5.13%");
