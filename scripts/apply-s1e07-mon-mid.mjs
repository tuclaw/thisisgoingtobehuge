#!/usr/bin/env node
/** Mon Sep 21 2026 MID — contestant fills + living marks. Snapshot s1e07-mon-mid. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MARK_AT = "2026-09-21T17:29:24Z";
const LAST_SESSION = "2026-09-21-mid";
const POT_USD = 396.054;

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Post Mon mid living books · week% / day% vs Episode 7 carry (priorMarkUsd). */
const LIVING = {
  "Composer 2.5": {
    bookUsd: 90.1854,
    weekPct: 11.91,
    dayPct: 11.91,
    cashUsd: 0.569,
    tickers: "FRO / STNG / TRMD / CASH",
    immune: true
  },
  "Claude Opus 5": {
    bookUsd: 75.177,
    weekPct: -0.36,
    dayPct: -0.36,
    cashUsd: 53.8668,
    tickers: "FRO / TRMD / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 74.5636,
    weekPct: -0.61,
    dayPct: -0.61,
    cashUsd: 20.7429,
    tickers: "STNG / INTC / CASH",
    immune: false
  },
  "Claude Sonnet 5": {
    bookUsd: 76.7282,
    weekPct: -0.67,
    dayPct: -0.67,
    cashUsd: 37.3689,
    tickers: "STNG / CASH",
    immune: false
  },
  "GPT-5.6 Terra": {
    bookUsd: 79.3998,
    weekPct: -1.74,
    dayPct: -1.74,
    cashUsd: 13.2412,
    tickers: "STNG / INTC / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 50.26,
  STNG: 86.45,
  TRMD: 37.42,
  INTC: 121.295,
  VLO: 404.26,
  MPC: 414.65,
  GNRC: 204.9,
  USO: 147.3992,
  XLE: 62.65
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
  const boot = (row.positions || []).find((p) => p.status === "boot-split" && p.ticker === "CASH");
  const cash = (row.positions || []).find((p) => p.ticker === "CASH" && p.action === "CASH");
  let remain = sizeUsd;
  if (boot && boot.sizeUsd > 0) {
    const fromBoot = Math.min(boot.sizeUsd, remain);
    boot.sizeUsd = round4(boot.sizeUsd - fromBoot);
    remain = round4(remain - fromBoot);
  }
  if (remain > 0 && cash) cash.sizeUsd = round4(cash.sizeUsd - remain);
}

const monOpen = (season.events || []).find((e) => e && e.id === "s1e07-mon-open");
if (!monOpen || !monOpen.recorded) {
  console.error("s1e07-mon-open mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e07-mon-mid")) {
  console.error("s1e07-mon-mid already present — abort");
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

  const priorMarkUsd = monOpen.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = monOpen.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd;
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
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  creditSellCash(opus, 9.9812);
  opus.positions = fifoSell(opus.positions, "FRO", 0.198829);
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const terra = season.survivors.find((s) => s.name === "GPT-5.6 Terra");
if (terra) {
  creditSellCash(terra, 65.8073);
  terra.positions = fifoSell(terra.positions, "TRMD", 1.759554);
  debitBuyCash(terra, 65);
  pushBuy(terra, {
    ticker: "INTC",
    qty: "0.536416",
    avg: "121.174600",
    sizeUsd: 65,
    orderId: "6ab168fc-905e-4d56-a3ac-9f44e501ad4d",
    note: "Mon Sep 21 mid BUY INTC $65.00 from TRMD exit; HOLD STNG residual",
    at: "2026-09-21T17:27:25.024Z"
  });
  setCash(terra, LIVING["GPT-5.6 Terra"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) {
  pushBuy(composer, {
    ticker: "FRO",
    qty: "0.218888",
    avg: "50.254000",
    sizeUsd: 11,
    orderId: "6ab168ff-dc51-487d-b1fd-6ca51dabe01c",
    note: "Mon Sep 21 mid BUY FRO $11.00 (shared BP; TRMD sell skipped same-day; sleeve cash unchanged)",
    at: "2026-09-21T17:27:27.284Z"
  });
  setCash(composer, LIVING["Composer 2.5"].cashUsd);
}

const sonnet = season.survivors.find((s) => s.name === "Claude Sonnet 5");
if (sonnet) setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);

const luna = season.survivors.find((s) => s.name === "GPT-5.6 Luna");
if (luna) setCash(luna, LIVING["GPT-5.6 Luna"].cashUsd);

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

const midFills = [
  {
    type: "fill",
    id: "fill-6ab168df-opus-fro-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.198829",
    avg: "50.200100",
    sizeUsd: 9.9812,
    orderId: "6ab168df-40ab-48c2-817d-5e9e86a994b4",
    at: "2026-09-21T17:26:55.482Z",
    note: "Mon Sep 21 mid SELL FRO (Opus Sep 10 FRO lot 0.198829)"
  },
  {
    type: "fill",
    id: "fill-6ab168df-terra-trmd-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "TRMD",
    qty: "1.759554",
    avg: "37.400000",
    sizeUsd: 65.8073,
    orderId: "6ab168df-08bc-45bb-9658-378344c22e8d",
    at: "2026-09-21T17:26:55.283Z",
    note: "Mon Sep 21 mid SELL TRMD (Terra Fri mid TRMD lot 1.759554)"
  },
  {
    type: "fill",
    id: "fill-6ab168fc-terra-intc-buy",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "INTC",
    qty: "0.536416",
    avg: "121.174600",
    sizeUsd: 65,
    orderId: "6ab168fc-905e-4d56-a3ac-9f44e501ad4d",
    at: "2026-09-21T17:27:25.024Z",
    note: "Mon Sep 21 mid BUY INTC $65.00 from TRMD exit; HOLD STNG residual"
  },
  {
    type: "fill",
    id: "fill-6ab168ff-composer-fro-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.218888",
    avg: "50.254000",
    sizeUsd: 11,
    orderId: "6ab168ff-dc51-487d-b1fd-6ca51dabe01c",
    at: "2026-09-21T17:27:27.284Z",
    note: "Mon Sep 21 mid BUY FRO $11.00 from shared BP (TRMD sell skipped same-day; sleeve cash unchanged)"
  }
];

season.events.push(...midFills);
season.events.push({
  type: "mark",
  id: "s1e07-mon-mid",
  kind: "mid",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Mon Sep 21 2026 MID · robinhood last-trade after fills (~10:27 AM PT). Snapshot s1e07-mon-mid. MERGED · five living.",
  dayPctPriorOfficial: true,
  quoteSource: "robinhood-last-trade",
  recorded: midRecorded,
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
    name: "Composer 2.5",
    weekPct: 11.91,
    basis: "Episode 7 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["Composer 2.5"],
    at: MARK_AT
  },
  potUsd: POT_USD,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

season.liveSnapshotId = "s1e07-mon-mid";
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Mon Sep 21 MID · robinhood last-trade after fills (~10:27 AM PT). Snapshot s1e07-mon-mid. Leader Composer 2.5 +11.91%. Worst GPT-5.6 Terra -1.74%.";
season.dayPctBasis = "vs Fri Sep 18 tribal carry at Episode 7 open (s1e07-carry)";
season.weekPctBasis = "vs Episode 7 carry (priorMarkUsd)";
season.statusLabel = "Episode 7 · Mon mid · five living · MERGED · Composer 2.5 immunity";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E07 live Mon Sep 21 – Tue Sep 22. MERGED. Five living. Mon mid remake after fills. Given $361.93. Pot $396.05. Composer 2.5 leads +11.91% and wears immunity. Comics paused. Audience only. Tribal Tue Sep 22 2:00 PM PT.";
season.immunity = {
  survivorId: IDS["Composer 2.5"],
  name: "Composer 2.5",
  weekPct: 11.91,
  at: MARK_AT,
  snapshotId: "s1e07-mon-mid",
  asOf: LAST_SESSION,
  note: "highest Episode 7 week %"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e07-mon-mid · islandPotUsd", season.islandPotUsd, "· immunity Composer 2.5 +11.91%");
