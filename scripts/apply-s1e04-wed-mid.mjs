#!/usr/bin/env node
/** Wed Sep 9 2026 MID — living marks, mid fills, Luna immunity. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MID_AT = "2026-09-09T17:28:00Z";
const MID_SESSION = "2026-09-09-mid";

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

/** Post-mid living books · week%/day% vs E4 even-up open. */
const LIVING = {
  "GPT-5.6 Luna": { bookUsd: 46.0077, weekPct: 1.87, dayPct: 1.87, cashUsd: 0.8978, tickers: "VLO / XLE / CASH", immune: true },
  "Kimi K3": { bookUsd: 45.8819, weekPct: 1.59, dayPct: 1.59, cashUsd: 0, tickers: "CVX / FRO / USO", immune: false },
  "Claude Opus 5": { bookUsd: 46.0698, weekPct: 1.44, dayPct: 1.44, cashUsd: 0.0266, tickers: "FRO / VLO / CASH", immune: false },
  "Grok 4.6": { bookUsd: 46.2757, weekPct: 1.37, dayPct: 1.37, cashUsd: 0.3403, tickers: "USO / XOM / CASH", immune: false },
  "Gemini 3.7 Flash": { bookUsd: 45.7681, weekPct: 1.09, dayPct: 1.09, cashUsd: 0.0094, tickers: "USO / XLE / CASH", immune: false },
  "GPT-5.6 Terra": { bookUsd: 45.6094, weekPct: 0.91, dayPct: 0.91, cashUsd: 0, tickers: "FRO / XLE", immune: false },
  "Composer 2.5": { bookUsd: 45.8088, weekPct: 0.9, dayPct: 0.9, cashUsd: 0.0608, tickers: "CVX / USO / CASH", immune: false },
  "Claude Sonnet 5": { bookUsd: 45.6053, weekPct: 0.82, dayPct: 0.82, cashUsd: 0.3746, tickers: "FRO / VLO / XLE / CASH", immune: false }
};

const MID_QUOTES = {
  USO: 148.2801,
  XOM: 164.4029,
  FRO: 47.4199,
  CVX: 213.2101,
  MPC: 400.6227,
  VLO: 382,
  XLE: 65.8033
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

const wedOpen = (season.events || []).find((e) => e && e.id === "s1e04-wed-open");
if (!wedOpen || !wedOpen.recorded) {
  console.error("s1e04-wed-open mark missing");
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

  const priorMarkUsd = wedOpen.recorded[row.id]?.bookUsd ?? row.bookUsd;
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
    eodMarkUsd: wedOpen.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd
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

// --- position deltas from mid fills ---
const grok = season.survivors.find((s) => s.name === "Grok 4.6");
if (grok) {
  grok.positions = fifoSell(grok.positions, 0.105);
  grok.positions.push({
    action: "BUY",
    ticker: "XOM",
    qty: "0.094280",
    avg: "164.4029",
    sizeUsd: round4(0.09428 * 164.4029),
    status: "filled",
    note: "Wed Sep 9 mid BUY XOM",
    last: MID_QUOTES.XOM,
    lastSource: "RTH last-trade",
    lastSession: MID_SESSION,
    orderId: "6aa19716",
    filledAt: MID_AT
  });
  setCash(grok, LIVING["Grok 4.6"].cashUsd);
}

const sonnet = season.survivors.find((s) => s.name === "Claude Sonnet 5");
if (sonnet) {
  sonnet.positions.push({
    action: "BUY",
    ticker: "FRO",
    qty: "0.031625",
    avg: "47.4299",
    sizeUsd: round4(0.031625 * 47.4299),
    status: "filled",
    note: "Wed Sep 9 mid BUY FRO",
    last: MID_QUOTES.FRO,
    lastSource: "RTH last-trade",
    lastSession: MID_SESSION,
    orderId: "6aa196e0",
    filledAt: MID_AT
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  opus.positions = (opus.positions || []).filter((p) => p.ticker !== "MPC");
  opus.positions.push({
    action: "BUY",
    ticker: "FRO",
    qty: "0.082261",
    avg: "47.4100",
    sizeUsd: round4(0.082261 * 47.41),
    status: "filled",
    note: "Wed Sep 9 mid BUY FRO (scaled)",
    last: MID_QUOTES.FRO,
    lastSource: "RTH last-trade",
    lastSession: MID_SESSION,
    orderId: "6aa19717",
    filledAt: MID_AT
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const kimi = season.survivors.find((s) => s.name === "Kimi K3");
if (kimi) {
  const cvxLot = (kimi.positions || []).find((p) => p.ticker === "CVX" && p.orderId === "6a95d7a6-f82f-439d-8cb1-ae694dea2a64");
  if (cvxLot) {
    cvxLot.qty = "0";
    cvxLot.sizeUsd = 0;
    cvxLot.status = "sold";
  }
  kimi.positions = (kimi.positions || []).filter((p) => p.status !== "sold");
  kimi.positions.push({
    action: "BUY",
    ticker: "FRO",
    qty: "0.110291",
    avg: "47.4199",
    sizeUsd: round4(0.110291 * 47.4199),
    status: "filled",
    note: "Wed Sep 9 mid BUY FRO",
    last: MID_QUOTES.FRO,
    lastSource: "RTH last-trade",
    lastSession: MID_SESSION,
    orderId: "6aa19718",
    filledAt: MID_AT
  });
  const cash = kimi.positions.find((p) => p.ticker === "CASH");
  if (cash) kimi.positions = kimi.positions.filter((p) => p.ticker !== "CASH");
  setCash(kimi, 0);
}

const HOLD_LAST = {
  "Gemini 3.7 Flash": { USO: 148.12, XLE: 65.8033 },
  "GPT-5.6 Terra": { FRO: 45.38, XLE: 65.8033 }
};

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const holdLast = HOLD_LAST[row.name];
  for (const pos of row.positions || []) {
    if (!pos.ticker || pos.ticker === "CASH") continue;
    if (holdLast && holdLast[pos.ticker]) {
      pos.last = holdLast[pos.ticker];
    } else if (MID_QUOTES[pos.ticker]) {
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
    date: "2026-09-09",
    asOf: MID_AT,
    priorCloseDate: q.priorCloseDate || "2026-09-08",
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
    id: "fill-6aa196dd-grok-uso-sell",
    survivorId: IDS["Grok 4.6"],
    side: "sell",
    ticker: "USO",
    qty: "0.105000",
    avg: "148.2801",
    sizeUsd: round4(0.105 * 148.2801),
    orderId: "6aa196dd",
    at: "2026-09-09T17:25:10.000Z",
    note: "Wed Sep 9 mid SELL USO (pinned Grok USO)"
  },
  {
    type: "fill",
    id: "fill-6aa19716-grok-xom-buy",
    survivorId: IDS["Grok 4.6"],
    side: "buy",
    ticker: "XOM",
    qty: "0.094280",
    avg: "164.4029",
    sizeUsd: round4(0.09428 * 164.4029),
    orderId: "6aa19716",
    at: "2026-09-09T17:25:12.000Z",
    note: "Wed Sep 9 mid BUY XOM"
  },
  {
    type: "fill",
    id: "fill-6aa196e0-sonnet-fro-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.031625",
    avg: "47.4299",
    sizeUsd: round4(0.031625 * 47.4299),
    orderId: "6aa196e0",
    at: "2026-09-09T17:25:14.000Z",
    note: "Wed Sep 9 mid BUY FRO"
  },
  {
    type: "fill",
    id: "fill-6aa196df-opus-mpc-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "MPC",
    qty: "0.005951",
    avg: "400.6227",
    sizeUsd: round4(0.005951 * 400.6227),
    orderId: "6aa196df",
    at: "2026-09-09T17:25:16.000Z",
    note: "Wed Sep 9 mid SELL MPC (pinned MPC)"
  },
  {
    type: "fill",
    id: "fill-6aa19717-opus-fro-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.082261",
    avg: "47.4100",
    sizeUsd: round4(0.082261 * 47.41),
    orderId: "6aa19717",
    at: "2026-09-09T17:25:18.000Z",
    note: "Wed Sep 9 mid BUY FRO (scaled)"
  },
  {
    type: "fill",
    id: "fill-6aa196e0-kimi-cvx-sell",
    survivorId: IDS["Kimi K3"],
    side: "sell",
    ticker: "CVX",
    qty: "0.024190",
    avg: "213.2101",
    sizeUsd: round4(0.02419 * 213.2101),
    orderId: "6aa196e0",
    at: "2026-09-09T17:25:20.000Z",
    note: "Wed Sep 9 mid SELL CVX (pinned CVX)"
  },
  {
    type: "fill",
    id: "fill-6aa19718-kimi-fro-buy",
    survivorId: IDS["Kimi K3"],
    side: "buy",
    ticker: "FRO",
    qty: "0.110291",
    avg: "47.4199",
    sizeUsd: round4(0.110291 * 47.4199),
    orderId: "6aa19718",
    at: "2026-09-09T17:25:22.000Z",
    note: "Wed Sep 9 mid BUY FRO"
  }
];

season.events.push(...midFills);
season.events.push({
  type: "mark",
  id: "s1e04-wed-mid",
  kind: "intraday",
  at: MID_AT,
  throughAt: MID_AT,
  lastSession: MID_SESSION,
  label: "Wed Sep 9 2026 MID · RTH last-trade (~10:28 AM PT) · living marks only",
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
});

season.liveSnapshotId = "s1e04-wed-mid";
season.islandPotUsd = 367.0267;
season.markedAt = MID_AT;
season.markLabel = "Wed Sep 9 2026 MID · RTH last-trade (~10:28 AM PT)";
season.statusLabel = "Live · S1E04 · MERGED · eight living · Wed mid remake · immunity GPT-5.6 Luna";
season.lastSource = "RTH last-trade";
season.lastSession = MID_SESSION;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E03 closed Tue Sep 8 tribal — GPT-5.6 Sol voted out 7–1. S1E04 live Wed Sep 9 – Fri Sep 11. MERGED. Eight living. Given $361.93. GPT-5.6 Luna leads +1.87% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["GPT-5.6 Luna"],
  name: "GPT-5.6 Luna",
  weekPct: 1.87,
  at: MID_AT,
  snapshotId: "s1e04-wed-mid"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e04-wed-mid · islandPotUsd", season.islandPotUsd, "· immunity GPT-5.6 Luna");
