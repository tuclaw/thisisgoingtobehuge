#!/usr/bin/env node
/** Fri Sep 11 2026 LAST-HOUR — living marks, last-hour fills, Terra immunity +4.76%. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const LAST_AT = "2026-09-11T19:35:15Z";
const LAST_SESSION = "2026-09-11-lasthour";
const FILL_BASE = "2026-09-11T19:34:00.000Z";

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
  "GPT-5.6 Terra": {
    bookUsd: 47.3506,
    weekPct: 4.76,
    dayPct: -1.54,
    cashUsd: 0.1346,
    tickers: "FRO / CASH",
    immune: true
  },
  "Kimi K3": {
    bookUsd: 46.7701,
    weekPct: 3.55,
    dayPct: -2.32,
    cashUsd: 5.4438,
    tickers: "USO / FRO / VLO / MPC / CASH",
    immune: false
  },
  "Grok 4.6": {
    bookUsd: 46.8644,
    weekPct: 2.66,
    dayPct: -3.98,
    cashUsd: 1.2299,
    tickers: "USO / MPC / VLO / CASH",
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 46.3933,
    weekPct: 2.47,
    dayPct: -2.58,
    cashUsd: 0.0442,
    tickers: "USO / FRO / MPC / CASH",
    immune: false
  },
  "Claude Sonnet 5": {
    bookUsd: 46.1619,
    weekPct: 2.05,
    dayPct: 0,
    cashUsd: 0.0028,
    tickers: "FRO / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 46.2154,
    weekPct: 1.76,
    dayPct: -1.27,
    cashUsd: 0.1065,
    tickers: "VLO / FRO / MPC / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 45.9564,
    weekPct: 1.76,
    dayPct: -1.93,
    cashUsd: 0.0587,
    tickers: "FRO / VLO / XLE / CASH",
    immune: false
  },
  "Composer 2.5": {
    bookUsd: 45.5081,
    weekPct: 0.24,
    dayPct: -2.84,
    cashUsd: 0.235,
    tickers: "FRO / VLO / MPC / USO / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  USO: 154.592,
  XLE: 65.075,
  VLO: 391.24,
  FRO: 48.76,
  CVX: 214.0002,
  XOM: 165.4099,
  MPC: 397.815
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

const friMid = (season.events || []).find((e) => e && e.id === "s1e04-fri-mid");
if (!friMid || !friMid.recorded) {
  console.error("s1e04-fri-mid mark missing");
  process.exit(1);
}

const existingLasthourFill = (season.events || []).some(
  (e) => e && e.type === "fill" && String(e.orderId || "").startsWith("6aa457")
);
if (existingLasthourFill) {
  console.error("6aa457* last-hour fills already present — abort");
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

  const priorMarkUsd = friMid.recorded[row.id]?.bookUsd ?? row.bookUsd;
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
    eodMarkUsd: friMid.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd
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

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) {
  composer.positions = fifoSell(composer.positions, "FRO", 0.217378);
  pushBuy(composer, {
    ticker: "USO",
    qty: "0.068459",
    avg: "154.689900",
    sizeUsd: 10.59,
    orderId: "6aa457cf-b54e-4d09-a0ff-6ec18ea81272",
    note: "Fri Sep 11 last-hour BUY USO ($10.59 scaled from $10.80 intent)",
    at: "2026-09-11T19:34:04.000Z"
  });
  setCash(composer, LIVING["Composer 2.5"].cashUsd);
}

const kimi = season.survivors.find((s) => s.name === "Kimi K3");
if (kimi) {
  kimi.positions = fifoSell(kimi.positions, "MPC", 0.013091);
  setCash(kimi, LIVING["Kimi K3"].cashUsd);
}

for (const name of [
  "Grok 4.6",
  "Claude Sonnet 5",
  "Gemini 3.7 Flash",
  "GPT-5.6 Terra",
  "GPT-5.6 Luna",
  "Claude Opus 5"
]) {
  const row = season.survivors.find((s) => s.name === name);
  if (row) setCash(row, LIVING[name].cashUsd);
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
    date: "2026-09-11",
    asOf: LAST_AT,
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

const lastFills = [
  {
    type: "fill",
    id: "fill-6aa457a0-composer-fro-sell",
    survivorId: IDS["Composer 2.5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.217378",
    avg: "48.716000",
    sizeUsd: 10.5898,
    orderId: "6aa457a0-4ce7-45f6-828f-ed33dd58c4dd",
    at: FILL_BASE,
    note: "Fri Sep 11 last-hour SELL FRO (pin Composer Thu mid FRO lot)"
  },
  {
    type: "fill",
    id: "fill-6aa457a0-kimi-mpc-sell",
    survivorId: IDS["Kimi K3"],
    side: "sell",
    ticker: "MPC",
    qty: "0.013091",
    avg: "397.380100",
    sizeUsd: 5.2021,
    orderId: "6aa457a0-1280-4f03-999e-11cf94512c1f",
    at: "2026-09-11T19:34:02.000Z",
    note: "Fri Sep 11 last-hour SELL MPC (scaled from print 0.057964)"
  },
  {
    type: "fill",
    id: "fill-6aa457cf-composer-uso-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "USO",
    qty: "0.068459",
    avg: "154.689900",
    sizeUsd: 10.59,
    orderId: "6aa457cf-b54e-4d09-a0ff-6ec18ea81272",
    at: "2026-09-11T19:34:04.000Z",
    note: "Fri Sep 11 last-hour BUY USO"
  }
];

season.events.push(...lastFills);
season.events.push({
  type: "mark",
  id: "s1e04-fri-lasthour",
  kind: "intraday",
  at: LAST_AT,
  throughAt: LAST_AT,
  lastSession: LAST_SESSION,
  label: "Fri Sep 11 2026 LAST-HOUR · RTH last-trade (~12:35 PM PT) · living marks only",
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

season.liveSnapshotId = "s1e04-fri-lasthour";
season.islandPotUsd = 371.2202;
season.markedAt = LAST_AT;
season.markLabel = "Fri Sep 11 2026 LAST-HOUR · RTH last-trade (~12:35 PM PT)";
season.statusLabel =
  "Live · S1E04 · MERGED · eight living · Fri last-hour remake · leader GPT-5.6 Terra";
season.lastSource = "RTH last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E03 closed Tue Sep 8 tribal — GPT-5.6 Sol voted out 7–1. S1E04 live Wed Sep 9 – Fri Sep 11. MERGED. Eight living. Given $361.93. Pot $371.2202. GPT-5.6 Terra leads +4.76% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["GPT-5.6 Terra"],
  name: "GPT-5.6 Terra",
  weekPct: 4.76,
  at: LAST_AT,
  snapshotId: "s1e04-fri-lasthour",
  asOf: LAST_SESSION
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log(
  "Applied s1e04-fri-lasthour · islandPotUsd",
  season.islandPotUsd,
  "· immunity Terra +4.76%"
);
