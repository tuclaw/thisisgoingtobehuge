#!/usr/bin/env node
/** Mon Sep 21 2026 OPEN — Gemini boot liq cleared + contestant fills + living marks. Snapshot s1e07-mon-open. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MARK_AT = "2026-09-21T14:24:20Z";
const LAST_SESSION = "2026-09-21-open";

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** week% / day% vs Episode 7 carry (priorMarkUsd). */
const LIVING = {
  "Composer 2.5": {
    bookUsd: 81.9965,
    weekPct: 1.75,
    dayPct: 1.75,
    cashUsd: 0.569,
    tickers: "FRO / STNG / TRMD / CASH",
    immune: true
  },
  "Claude Sonnet 5": {
    bookUsd: 78.0828,
    weekPct: 1.08,
    dayPct: 1.08,
    cashUsd: 37.3689,
    tickers: "STNG / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 76.1674,
    weekPct: 0.95,
    dayPct: 0.95,
    cashUsd: 43.8856,
    tickers: "FRO / TRMD / CASH",
    immune: false
  },
  "GPT-5.6 Terra": {
    bookUsd: 81.0269,
    weekPct: 0.28,
    dayPct: 0.28,
    cashUsd: 12.4339,
    tickers: "STNG / TRMD / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 74.7943,
    weekPct: -0.31,
    dayPct: -0.31,
    cashUsd: 20.7429,
    tickers: "INTC / STNG / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 52.26,
  STNG: 89.425,
  TRMD: 38.34,
  VLO: 405.2601,
  MPC: 416.12,
  GNRC: 205.125,
  USO: 148.01,
  XLE: 62.9,
  INTC: 120.57
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

if ((season.events || []).some((e) => e && e.id === "s1e07-mon-open")) {
  console.error("s1e07-mon-open already present — abort");
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

  const priorMarkUsd = row.priorMarkUsd ?? row.bookUsd;
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
    eodMarkUsd: row.eodMarkUsd ?? priorMarkUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = dayPct;
  row.priorMarkUsd = priorMarkUsd;
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

const sonnet = season.survivors.find((s) => s.name === "Claude Sonnet 5");
if (sonnet) {
  creditSellCash(sonnet, 7.843);
  sonnet.positions = fifoSell(sonnet.positions, "TRMD", 0.204832);
  debitBuyCash(sonnet, 7.8);
  pushBuy(sonnet, {
    ticker: "STNG",
    qty: "0.087073",
    avg: "89.579900",
    sizeUsd: 7.8,
    orderId: "6ab13df7-41fa-4c15-8996-d5483ad83062",
    note: "Mon Sep 21 open BUY STNG $7.80 from TRMD rotation",
    at: "2026-09-21T14:23:51.341Z"
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) {
  debitBuyCash(composer, 12);
  pushBuy(composer, {
    ticker: "TRMD",
    qty: "0.312908",
    avg: "38.349900",
    sizeUsd: 12,
    orderId: "6ab13df8-e856-4fc4-a3f0-407cdef9d2d4",
    note: "Mon Sep 21 open BUY TRMD $12.00 add (HOLD FRO+STNG)",
    at: "2026-09-21T14:23:53.161Z"
  });
  setCash(composer, LIVING["Composer 2.5"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  creditSellCash(opus, 13.2127);
  opus.positions = fifoSell(opus.positions, "FRO", 0.252672);
  creditSellCash(opus, 13.5285);
  opus.positions = fifoSell(opus.positions, "FRO", 0.25877);
  debitBuyCash(opus, 18);
  pushBuy(opus, {
    ticker: "TRMD",
    qty: "0.469503",
    avg: "38.338400",
    sizeUsd: 18,
    orderId: "6ab13df9-5411-49e2-89e2-7500094fe3d3",
    note: "Mon Sep 21 open BUY TRMD $18.00 from FRO trim",
    at: "2026-09-21T14:23:54.102Z"
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const luna = season.survivors.find((s) => s.name === "GPT-5.6 Luna");
if (luna) {
  creditSellCash(luna, 13.6426);
  luna.positions = fifoSell(luna.positions, "MPC", 0.032892);
  creditSellCash(luna, 15.8781);
  luna.positions = fifoSell(luna.positions, "GNRC", 0.077452);
  creditSellCash(luna, 18.0377);
  luna.positions = fifoSell(luna.positions, "TRMD", 0.470958);
  debitBuyCash(luna, 40);
  pushBuy(luna, {
    ticker: "INTC",
    qty: "0.330970",
    avg: "120.856700",
    sizeUsd: 40,
    orderId: "6ab13df9-21d8-4cb8-a7b7-654f425fd213",
    note: "Mon Sep 21 open BUY INTC $40 from MPC+GNRC+TRMD exit; HOLD STNG",
    at: "2026-09-21T14:23:54.248Z"
  });
  setCash(luna, LIVING["GPT-5.6 Luna"].cashUsd);
}

const terra = season.survivors.find((s) => s.name === "GPT-5.6 Terra");
if (terra) {
  setCash(terra, LIVING["GPT-5.6 Terra"].cashUsd);
}

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
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
  const prior = {
    FRO: 51.42,
    STNG: 87.16,
    TRMD: 38.23,
    VLO: 413.28,
    MPC: 424.89,
    GNRC: 207.44,
    USO: 153.82,
    XLE: 64.31,
    INTC: 108.6
  }[ticker];
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: "robinhood-last-trade",
    session: LAST_SESSION,
    date: "2026-09-21",
    asOf: MARK_AT,
    priorClose: prior ?? q.priorClose,
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

const openFills = [
  {
    type: "fill",
    id: "fill-6ab13c87-gemini-fro-sell",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "sell",
    ticker: "FRO",
    qty: "0.192569",
    avg: "52.249900",
    sizeUsd: 10.0617,
    orderId: "6ab13c87-d4e1-412a-be3d-54062eca44ce",
    at: "2026-09-21T14:17:43.224Z",
    note: "Boot broker liquidation Gemini 3.7 Flash FRO (jury book $0 · pin Gemini lots only)"
  },
  {
    type: "fill",
    id: "fill-6ab13c93-gemini-stng-sell-a",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "sell",
    ticker: "STNG",
    qty: "0.099088",
    avg: "88.960100",
    sizeUsd: 8.8149,
    orderId: "6ab13c93-7ffd-4c74-80ff-76ec3503d8a3",
    at: "2026-09-21T14:17:55.561Z",
    note: "Boot broker liquidation Gemini 3.7 Flash STNG (jury book $0 · pin Gemini lots only)"
  },
  {
    type: "fill",
    id: "fill-6ab13c93-gemini-stng-sell-b",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "sell",
    ticker: "STNG",
    qty: "0.493156",
    avg: "89.015400",
    sizeUsd: 43.8985,
    orderId: "6ab13c93-dce1-4d40-89d0-ad7cd305f820",
    at: "2026-09-21T14:17:55.271Z",
    note: "Boot broker liquidation Gemini 3.7 Flash STNG (jury book $0 · pin Gemini lots only)"
  },
  {
    type: "fill",
    id: "fill-6ab13dd1-sonnet-trmd-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "TRMD",
    qty: "0.204832",
    avg: "38.290100",
    sizeUsd: 7.843,
    orderId: "6ab13dd1-7eb4-4341-b0c3-b1461bc81601",
    at: "2026-09-21T14:23:13.242Z",
    note: "Mon Sep 21 open SELL TRMD (Sonnet Fri last-hour lot)"
  },
  {
    type: "fill",
    id: "fill-6ab13dd2-opus-fro-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.252672",
    avg: "52.291800",
    sizeUsd: 13.2127,
    orderId: "6ab13dd2-1009-4557-937a-5d2a2431b0cf",
    at: "2026-09-21T14:23:14.892Z",
    note: "Mon Sep 21 open SELL FRO (Opus Fri open lot)"
  },
  {
    type: "fill",
    id: "fill-6ab13dd4-opus-fro-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.258770",
    avg: "52.280100",
    sizeUsd: 13.5285,
    orderId: "6ab13dd4-c525-41ca-8636-160954916747",
    at: "2026-09-21T14:23:17.037Z",
    note: "Mon Sep 21 open SELL FRO (Opus Fri mid lot)"
  },
  {
    type: "fill",
    id: "fill-6ab13dd6-luna-mpc-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "MPC",
    qty: "0.032892",
    avg: "414.770000",
    sizeUsd: 13.6426,
    orderId: "6ab13dd6-b348-4f07-bad2-8b83df6e4616",
    at: "2026-09-21T14:23:18.428Z",
    note: "Mon Sep 21 open SELL MPC (Luna Tue mid lot)"
  },
  {
    type: "fill",
    id: "fill-6ab13dd7-luna-gnrc-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "GNRC",
    qty: "0.077452",
    avg: "205.005500",
    sizeUsd: 15.8781,
    orderId: "6ab13dd7-fd4d-40d3-b7a5-4f48835401a0",
    at: "2026-09-21T14:23:19.383Z",
    note: "Mon Sep 21 open SELL GNRC (Luna Thu last-hour lot)"
  },
  {
    type: "fill",
    id: "fill-6ab13dd7-luna-trmd-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "TRMD",
    qty: "0.470958",
    avg: "38.300100",
    sizeUsd: 18.0377,
    orderId: "6ab13dd7-c92b-4205-a7b9-e1fd3f69a467",
    at: "2026-09-21T14:23:19.293Z",
    note: "Mon Sep 21 open SELL TRMD (Luna Fri mid lot)"
  },
  {
    type: "fill",
    id: "fill-6ab13df7-sonnet-stng-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "STNG",
    qty: "0.087073",
    avg: "89.579900",
    sizeUsd: 7.8,
    orderId: "6ab13df7-41fa-4c15-8996-d5483ad83062",
    at: "2026-09-21T14:23:51.341Z",
    note: "Mon Sep 21 open BUY STNG $7.80 from TRMD rotation"
  },
  {
    type: "fill",
    id: "fill-6ab13df8-composer-trmd-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "TRMD",
    qty: "0.312908",
    avg: "38.349900",
    sizeUsd: 12,
    orderId: "6ab13df8-e856-4fc4-a3f0-407cdef9d2d4",
    at: "2026-09-21T14:23:53.161Z",
    note: "Mon Sep 21 open BUY TRMD $12.00 add (HOLD FRO+STNG)"
  },
  {
    type: "fill",
    id: "fill-6ab13df9-opus-trmd-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "TRMD",
    qty: "0.469503",
    avg: "38.338400",
    sizeUsd: 18,
    orderId: "6ab13df9-5411-49e2-89e2-7500094fe3d3",
    at: "2026-09-21T14:23:54.102Z",
    note: "Mon Sep 21 open BUY TRMD $18.00 from FRO trim"
  },
  {
    type: "fill",
    id: "fill-6ab13df9-luna-intc-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "INTC",
    qty: "0.330970",
    avg: "120.856700",
    sizeUsd: 40,
    orderId: "6ab13df9-21d8-4cb8-a7b7-654f425fd213",
    at: "2026-09-21T14:23:54.248Z",
    note: "Mon Sep 21 open BUY INTC $40 from MPC+GNRC+TRMD exit; HOLD STNG"
  }
];

season.events.push(...openFills);
season.events.push({
  type: "mark",
  id: "s1e07-mon-open",
  kind: "open",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Mon Sep 21 2026 OPEN · robinhood last-trade after fills (~7:24 AM PT). Snapshot s1e07-mon-open. MERGED · five living. Gemini boot liq cleared.",
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
    name: "Composer 2.5",
    weekPct: 1.75,
    basis: "Episode 7 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["Composer 2.5"],
    at: MARK_AT
  },
  potUsd: 392.0679,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

const flash = season.survivors.find((s) => s.name === "Gemini 3.7 Flash");
if (flash && flash.positions && flash.positions[0]) {
  flash.positions[0].note =
    "jury · not funded · Gemini voted-out $0 · boot broker liquidation cleared Mon Sep 21 open (FRO 0.192569 · STNG 0.099088 · STNG 0.493156 — pin Gemini lots only)";
}

season.liveSnapshotId = "s1e07-mon-open";
season.islandPotUsd = 392.0679;
season.markedAt = MARK_AT;
season.markLabel =
  "Mon Sep 21 OPEN · robinhood last-trade after fills (~7:24 AM PT). Snapshot s1e07-mon-open. Leader Composer 2.5 +1.75%. Worst GPT-5.6 Luna -0.31%.";
season.dayPctBasis = "vs Fri Sep 18 tribal carry at Episode 7 open (s1e07-carry)";
season.weekPctBasis = "vs Episode 7 carry (priorMarkUsd)";
season.statusLabel = "Episode 7 · Mon open · five living · MERGED · Composer 2.5 immunity";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E07 live Mon Sep 21 – Tue Sep 22. MERGED. Five living. Mon open remake after fills. Given $361.93. Pot $392.07. Composer 2.5 leads +1.75% and wears immunity. Gemini 3.7 Flash boot liq cleared. Comics paused. Audience only. Tribal Tue Sep 22 2:00 PM PT.";
season.immunity = {
  survivorId: IDS["Composer 2.5"],
  name: "Composer 2.5",
  weekPct: 1.75,
  at: MARK_AT,
  snapshotId: "s1e07-mon-open",
  asOf: LAST_SESSION,
  note: "highest Episode 7 week %"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e07-mon-open · islandPotUsd", season.islandPotUsd, "· immunity Composer 2.5 +1.75%");
