#!/usr/bin/env node
/** Mon Sep 21 2026 LAST-HOUR — contestant fills + living marks. Snapshot s1e07-mon-lasthour. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MARK_AT = "2026-09-21T19:36:28Z";
const LAST_SESSION = "2026-09-21-lasthour";
const POT_USD = 436.8119;

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Post Mon last-hour living books · week% / day% vs Episode 7 carry (priorMarkUsd). */
const LIVING = {
  "GPT-5.6 Terra": {
    bookUsd: 120.4263,
    weekPct: 49.03,
    dayPct: 49.03,
    cashUsd: 13.2412,
    tickers: "STNG / INTC / CASH",
    immune: true
  },
  "Composer 2.5": {
    bookUsd: 89.7282,
    weekPct: 11.34,
    dayPct: 11.34,
    cashUsd: 0.569,
    tickers: "FRO / STNG / TRMD / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 74.7213,
    weekPct: -0.4,
    dayPct: -0.4,
    cashUsd: 21.9128,
    tickers: "INTC / CASH",
    immune: false
  },
  "Claude Sonnet 5": {
    bookUsd: 76.9162,
    weekPct: -0.43,
    dayPct: -0.43,
    cashUsd: 29.8389,
    tickers: "STNG / INTC / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 75.0199,
    weekPct: -0.57,
    dayPct: -0.57,
    cashUsd: 32.4602,
    tickers: "TRMD / INTC / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 49.77,
  STNG: 86.87,
  TRMD: 37.19,
  INTC: 121.655,
  VLO: 393.16,
  MPC: 401.7,
  GNRC: 205.545,
  USO: 147.915,
  XLE: 62.4901
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

const monMid = (season.events || []).find((e) => e && e.id === "s1e07-mon-mid");
if (!monMid || !monMid.recorded) {
  console.error("s1e07-mon-mid mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e07-mon-lasthour")) {
  console.error("s1e07-mon-lasthour already present — abort");
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

  const priorMarkUsd = monMid.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = monMid.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd;
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
  creditSellCash(opus, 3.7034);
  opus.positions = reduceLotByOrderId(
    opus.positions,
    "6aad713d-8363-493a-bf98-f73813c72083",
    0.074441
  );
  debitBuyCash(opus, 25.11);
  pushBuy(opus, {
    ticker: "INTC",
    qty: "0.206312",
    avg: "121.708400",
    sizeUsd: 25.11,
    orderId: "6ab186be-6e43-4f66-984a-80555abb7a90",
    note: "Mon Sep 21 last-hour BUY INTC $25.11 scaled from $40 (FRO exit + sleeve cash)",
    at: "2026-09-21T19:34:22.269Z"
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const luna = season.survivors.find((s) => s.name === "GPT-5.6 Luna");
if (luna) {
  creditSellCash(luna, 13.7199);
  luna.positions = reduceLotByOrderId(
    luna.positions,
    "6aad45d9-ffb8-4656-af15-72ed67ac4bb6",
    0.158192
  );
  debitBuyCash(luna, 12.55);
  pushBuy(luna, {
    ticker: "INTC",
    qty: "0.103114",
    avg: "121.709900",
    sizeUsd: 12.55,
    orderId: "6ab186bd-6699-48d1-a98d-39bfc7acd84a",
    note: "Mon Sep 21 last-hour BUY INTC $12.55 scaled from $20 (STNG exit)",
    at: "2026-09-21T19:34:21.389Z"
  });
  setCash(luna, LIVING["GPT-5.6 Luna"].cashUsd);
}

const sonnet = season.survivors.find((s) => s.name === "Claude Sonnet 5");
if (sonnet) {
  debitBuyCash(sonnet, 7.53);
  pushBuy(sonnet, {
    ticker: "INTC",
    qty: "0.061869",
    avg: "121.708400",
    sizeUsd: 7.53,
    orderId: "6ab186bf-c86b-4bdd-98e7-19aab30ff328",
    note: "Mon Sep 21 last-hour BUY INTC $7.53 scaled from $12; HOLD all STNG",
    at: "2026-09-21T19:34:23.84Z"
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const terra = season.survivors.find((s) => s.name === "GPT-5.6 Terra");
if (terra) {
  pushBuy(terra, {
    ticker: "STNG",
    qty: "0.469991",
    avg: "86.810000",
    sizeUsd: 40.8,
    orderId: "6ab186bf-bf0e-47f9-b385-3a9e3e08fdf4",
    note: "Mon Sep 21 last-hour BUY STNG $40.80 scaled from $65 (shared BP; sleeve cash unchanged); HOLD INTC",
    at: "2026-09-21T19:34:23.273Z"
  });
  setCash(terra, LIVING["GPT-5.6 Terra"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) setCash(composer, LIVING["Composer 2.5"].cashUsd);

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

const lastFills = [
  {
    type: "fill",
    id: "fill-6ab18692-opus-fro-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.074441",
    avg: "49.750100",
    sizeUsd: 3.7034,
    orderId: "6ab18692-4dea-4872-8bef-3b99f3fb4b7c",
    at: "2026-09-21T19:33:39.169Z",
    note: "Mon Sep 21 last-hour SELL FRO 0.074441 (Opus Fri mid FRO lot)"
  },
  {
    type: "fill",
    id: "fill-6ab18692-luna-stng-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "STNG",
    qty: "0.158192",
    avg: "86.729700",
    sizeUsd: 13.7199,
    orderId: "6ab18692-e32c-4cfc-a93f-8220f92da424",
    at: "2026-09-21T19:33:38.978Z",
    note: "Mon Sep 21 last-hour SELL STNG 0.158192 (Luna Fri open STNG lot)"
  },
  {
    type: "fill",
    id: "fill-6ab186bd-luna-intc-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "INTC",
    qty: "0.103114",
    avg: "121.709900",
    sizeUsd: 12.55,
    orderId: "6ab186bd-6699-48d1-a98d-39bfc7acd84a",
    at: "2026-09-21T19:34:21.389Z",
    note: "Mon Sep 21 last-hour BUY INTC $12.55 scaled from $20"
  },
  {
    type: "fill",
    id: "fill-6ab186be-opus-intc-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "INTC",
    qty: "0.206312",
    avg: "121.708400",
    sizeUsd: 25.11,
    orderId: "6ab186be-6e43-4f66-984a-80555abb7a90",
    at: "2026-09-21T19:34:22.269Z",
    note: "Mon Sep 21 last-hour BUY INTC $25.11 scaled from $40"
  },
  {
    type: "fill",
    id: "fill-6ab186bf-sonnet-intc-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "INTC",
    qty: "0.061869",
    avg: "121.708400",
    sizeUsd: 7.53,
    orderId: "6ab186bf-c86b-4bdd-98e7-19aab30ff328",
    at: "2026-09-21T19:34:23.84Z",
    note: "Mon Sep 21 last-hour BUY INTC $7.53 scaled from $12; HOLD all STNG"
  },
  {
    type: "fill",
    id: "fill-6ab186bf-terra-stng-buy",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "STNG",
    qty: "0.469991",
    avg: "86.810000",
    sizeUsd: 40.8,
    orderId: "6ab186bf-bf0e-47f9-b385-3a9e3e08fdf4",
    at: "2026-09-21T19:34:23.273Z",
    note: "Mon Sep 21 last-hour BUY STNG $40.80 scaled from $65 (shared BP; sleeve cash unchanged)"
  }
];

season.events.push(...lastFills);
season.events.push({
  type: "mark",
  id: "s1e07-mon-lasthour",
  kind: "intraday",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Mon Sep 21 2026 LAST-HOUR · robinhood last-trade after fills (~12:34 PM PT). Snapshot s1e07-mon-lasthour. MERGED · five living.",
  dayPctPriorOfficial: true,
  quoteSource: "robinhood-last-trade",
  recorded: lastRecorded,
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
    name: "GPT-5.6 Terra",
    weekPct: 49.03,
    basis: "Episode 7 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["GPT-5.6 Terra"],
    at: MARK_AT
  },
  potUsd: POT_USD,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

season.liveSnapshotId = "s1e07-mon-lasthour";
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel =
  "Mon Sep 21 LAST-HOUR · robinhood last-trade after fills (~12:34 PM PT). Snapshot s1e07-mon-lasthour. Leader GPT-5.6 Terra +49.03%. Worst Claude Opus 5 -0.57%.";
season.dayPctBasis = "vs Fri Sep 18 tribal carry at Episode 7 open (s1e07-carry)";
season.weekPctBasis = "vs Episode 7 carry (priorMarkUsd)";
season.statusLabel = "Episode 7 · Mon last-hour · five living · MERGED · GPT-5.6 Terra immunity";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E07 live Mon Sep 21 – Tue Sep 22. MERGED. Five living. Mon last-hour remake after fills. Given $361.93. Pot $436.81. GPT-5.6 Terra leads +49.03% and wears immunity. Comics paused. Audience only. Tribal Tue Sep 22 2:00 PM PT.";
season.immunity = {
  survivorId: IDS["GPT-5.6 Terra"],
  name: "GPT-5.6 Terra",
  weekPct: 49.03,
  at: MARK_AT,
  snapshotId: "s1e07-mon-lasthour",
  asOf: LAST_SESSION,
  note: "highest Episode 7 week %"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e07-mon-lasthour · islandPotUsd", season.islandPotUsd, "· immunity GPT-5.6 Terra +49.03%");
