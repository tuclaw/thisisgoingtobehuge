#!/usr/bin/env node
/** Mon Sep 14 2026 LAST-HOUR — living marks, last-hour fills, Sonnet immunity +2.54%. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const LAST_AT = "2026-09-14T19:29:00Z";
const LAST_SESSION = "2026-09-14-lasthour";
const FILL_BASE = "2026-09-14T19:28:30.000Z";

const IDS = {
  "Grok 4.6": "e51f02b6-9d92-413f-8717-a6e3a60468bc",
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Post last-hour living books · week% vs Episode 5 carry · day% vs Mon mid. */
const LIVING = {
  "Claude Sonnet 5": {
    bookUsd: 54.6342,
    weekPct: 2.54,
    dayPct: 1.42,
    cashUsd: 0.0008,
    tickers: "FRO / CASH",
    immune: true
  },
  "GPT-5.6 Terra": {
    bookUsd: 55.7295,
    weekPct: 2.3,
    dayPct: 1.42,
    cashUsd: 0.0007,
    tickers: "FRO / CASH",
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 54.0046,
    weekPct: 1.41,
    dayPct: 0.86,
    cashUsd: 0.0069,
    tickers: "FRO / USO / CASH",
    immune: false
  },
  "Composer 2.5": {
    bookUsd: 52.1825,
    weekPct: -0.19,
    dayPct: 0.53,
    cashUsd: 10.6715,
    tickers: "FRO / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 52.7607,
    weekPct: -0.3,
    dayPct: 0.9,
    cashUsd: 8.3954,
    tickers: "FRO / MPC / STNG / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 52.6064,
    weekPct: -0.33,
    dayPct: 0.34,
    cashUsd: 14.5229,
    tickers: "FRO / USO / CASH",
    immune: false
  },
  "Grok 4.6": {
    bookUsd: 52.1821,
    weekPct: -2.26,
    dayPct: 0.81,
    cashUsd: 5.2381,
    tickers: "FRO / USO / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 50.54,
  USO: 155.8899,
  MPC: 393.55,
  VLO: 379.95,
  XLE: 64.3276,
  STNG: 85.695
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
    lastSource: "RTH last-trade",
    lastSession: LAST_SESSION
  });
}

function creditSellCash(row, qty, avg) {
  const cash = (row.positions || []).find((p) => p.ticker === "CASH");
  if (cash) cash.sizeUsd = round4(cash.sizeUsd + qty * avg);
}

function debitBuyCash(row, sizeUsd) {
  const cash = (row.positions || []).find((p) => p.ticker === "CASH");
  if (cash) cash.sizeUsd = round4(cash.sizeUsd - sizeUsd);
}

const monMid = (season.events || []).find((e) => e && e.id === "s1e05-mon-mid");
if (!monMid || !monMid.recorded) {
  console.error("s1e05-mon-mid mark missing");
  process.exit(1);
}

const existing = (season.events || []).some((e) => e && e.id === "s1e05-mon-lasthour");
if (existing) {
  console.error("s1e05-mon-lasthour already present — abort");
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

  const priorMarkUsd = monMid.recorded[row.id]?.bookUsd ?? row.bookUsd;
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
    eodMarkUsd: monMid.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd
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

const grok = season.survivors.find((s) => s.name === "Grok 4.6");
if (grok) {
  creditSellCash(grok, 0.040548, 155.7747);
  grok.positions = fifoSell(grok.positions, "USO", 0.040548);
  debitBuyCash(grok, 2.5);
  pushBuy(grok, {
    ticker: "FRO",
    qty: "0.049454",
    avg: "50.552000",
    sizeUsd: 2.5,
    orderId: "6aa84b1d-d449-4c14-bcad-3e24ec2a5437",
    note: "Mon Sep 14 last-hour BUY FRO ($2.50 scaled from $7.50)",
    at: "2026-09-14T19:29:05.000Z"
  });
  setCash(grok, LIVING["Grok 4.6"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) {
  creditSellCash(composer, 0.068459, 155.7713);
  composer.positions = fifoSell(composer.positions, "USO", 0.068459);
  debitBuyCash(composer, 21);
  pushBuy(composer, {
    ticker: "FRO",
    qty: "0.415760",
    avg: "50.509900",
    sizeUsd: 21,
    orderId: "6aa84a9b-5ea5-4770-bff6-3527309f2f02",
    note: "Mon Sep 14 last-hour BUY FRO",
    at: "2026-09-14T19:28:45.000Z"
  });
  setCash(composer, LIVING["Composer 2.5"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  creditSellCash(opus, 0.018254, 380.1101);
  opus.positions = fifoSell(opus.positions, "VLO", 0.018254);
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const luna = season.survivors.find((s) => s.name === "GPT-5.6 Luna");
if (luna) {
  creditSellCash(luna, 0.225789, 64.312);
  luna.positions = fifoSell(luna.positions, "XLE", 0.225789);
  debitBuyCash(luna, 15);
  pushBuy(luna, {
    ticker: "FRO",
    qty: "0.296986",
    avg: "50.507400",
    sizeUsd: 15,
    orderId: "6aa84a9c-303a-4521-9b77-d87c248708c1",
    note: "Mon Sep 14 last-hour BUY FRO",
    at: "2026-09-14T19:28:50.000Z"
  });
  setCash(luna, LIVING["GPT-5.6 Luna"].cashUsd);
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
    date: "2026-09-14",
    asOf: LAST_AT,
    priorCloseDate: q.priorCloseDate || "2026-09-11",
    priorCloseSource: q.priorCloseSource || "RTH last-trade",
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
    t.livingCount = 1;
    t.combinedWeekPct = askaraCount ? round4(askaraWeek / askaraCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = t.combinedWeekPct;
  }
}

const lastFills = [
  {
    type: "fill",
    id: "fill-6aa84a6d-grok-uso-sell",
    survivorId: IDS["Grok 4.6"],
    side: "sell",
    ticker: "USO",
    qty: "0.040548",
    avg: "155.774700",
    sizeUsd: round4(0.040548 * 155.7747),
    orderId: "6aa84a6d-5738-4e35-ab73-aa749c672d9f",
    at: FILL_BASE,
    note: "Mon Sep 14 last-hour SELL USO"
  },
  {
    type: "fill",
    id: "fill-6aa84a6f-composer-uso-sell",
    survivorId: IDS["Composer 2.5"],
    side: "sell",
    ticker: "USO",
    qty: "0.068459",
    avg: "155.771300",
    sizeUsd: round4(0.068459 * 155.7713),
    orderId: "6aa84a6f-12c2-4e12-a89d-fc3aaaca28eb",
    at: "2026-09-14T19:28:32.000Z",
    note: "Mon Sep 14 last-hour SELL USO"
  },
  {
    type: "fill",
    id: "fill-6aa84a71-opus-vlo-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "VLO",
    qty: "0.018254",
    avg: "380.110100",
    sizeUsd: round4(0.018254 * 380.1101),
    orderId: "6aa84a71-df30-41c2-b1a6-af5106b66a55",
    at: "2026-09-14T19:28:34.000Z",
    note: "Mon Sep 14 last-hour SELL VLO"
  },
  {
    type: "fill",
    id: "fill-6aa84a71-luna-xle-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "XLE",
    qty: "0.225789",
    avg: "64.312000",
    sizeUsd: round4(0.225789 * 64.312),
    orderId: "6aa84a71-1b96-4018-a477-1afb55f135bb",
    at: "2026-09-14T19:28:36.000Z",
    note: "Mon Sep 14 last-hour SELL XLE"
  },
  {
    type: "fill",
    id: "fill-6aa84a9b-composer-fro-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.415760",
    avg: "50.509900",
    sizeUsd: 21,
    orderId: "6aa84a9b-5ea5-4770-bff6-3527309f2f02",
    at: "2026-09-14T19:28:45.000Z",
    note: "Mon Sep 14 last-hour BUY FRO"
  },
  {
    type: "fill",
    id: "fill-6aa84a9c-luna-fro-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "FRO",
    qty: "0.296986",
    avg: "50.507400",
    sizeUsd: 15,
    orderId: "6aa84a9c-303a-4521-9b77-d87c248708c1",
    at: "2026-09-14T19:28:50.000Z",
    note: "Mon Sep 14 last-hour BUY FRO"
  },
  {
    type: "fill",
    id: "fill-6aa84b1d-grok-fro-buy",
    survivorId: IDS["Grok 4.6"],
    side: "buy",
    ticker: "FRO",
    qty: "0.049454",
    avg: "50.552000",
    sizeUsd: 2.5,
    orderId: "6aa84b1d-d449-4c14-bcad-3e24ec2a5437",
    at: "2026-09-14T19:29:05.000Z",
    note: "Mon Sep 14 last-hour BUY FRO ($2.50 scaled from $7.50)"
  }
];

season.events.push(...lastFills);
season.events.push({
  type: "mark",
  id: "s1e05-mon-lasthour",
  kind: "intraday",
  at: LAST_AT,
  throughAt: LAST_AT,
  lastSession: LAST_SESSION,
  label: "Mon Sep 14 2026 LAST-HOUR · RTH last-trade (~12:29 PM PT) · living marks after last-hour fills",
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
      livingCount: 1
    }
  }
});

season.liveSnapshotId = "s1e05-mon-lasthour";
season.islandPotUsd = 374.1;
season.markedAt = LAST_AT;
season.markLabel =
  "Mon Sep 14 2026 LAST-HOUR · RTH last-trade (~12:29 PM PT) · living marks after last-hour fills";
season.statusLabel =
  "Live · S1E05 · MERGED · seven living · Mon last-hour · leader Claude Sonnet 5";
season.lastSource = "RTH last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E04 closed Fri Sep 11 tribal — Kimi K3 voted out on revote 3–2. S1E05 live Mon Sep 14 – Tue Sep 16. MERGED. Seven living. Given $361.93. Pot $374.10. Claude Sonnet 5 leads +2.54% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["Claude Sonnet 5"],
  name: "Claude Sonnet 5",
  weekPct: 2.54,
  at: LAST_AT,
  snapshotId: "s1e05-mon-lasthour",
  asOf: LAST_SESSION
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e05-mon-lasthour · islandPotUsd", season.islandPotUsd, "· immunity Claude Sonnet 5 +2.54%");
