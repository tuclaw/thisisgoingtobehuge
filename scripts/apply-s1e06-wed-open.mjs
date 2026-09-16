#!/usr/bin/env node
/** Wed Sep 16 2026 OPEN — Grok boot liq cleared + contestant fills + living marks. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const MARK_AT = "2026-09-16T14:05:37Z";
const LAST_SESSION = "2026-09-16-open";

const IDS = {
  "Grok 4.6": "e51f02b6-9d92-413f-8717-a6e3a60468bc",
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

const LIVING = {
  "GPT-5.6 Terra": {
    bookUsd: 67.3823,
    weekPct: 2.43,
    dayPct: 2.43,
    cashUsd: 0.0069,
    tickers: "FRO / STNG / CASH",
    immune: true
  },
  "Composer 2.5": {
    bookUsd: 63.2281,
    weekPct: 2.22,
    dayPct: 2.22,
    cashUsd: 0.0367,
    tickers: "FRO / CASH",
    immune: false
  },
  "Claude Sonnet 5": {
    bookUsd: 65.9532,
    weekPct: 1.97,
    dayPct: 1.97,
    cashUsd: 14.2396,
    tickers: "FRO / CASH",
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 65.3145,
    weekPct: 1.51,
    dayPct: 1.51,
    cashUsd: 0.0036,
    tickers: "USO / FRO / CASH",
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 63.2557,
    weekPct: 1.5,
    dayPct: 1.5,
    cashUsd: 23.4575,
    tickers: "FRO / MPC / TRMD / CASH",
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 62.7161,
    weekPct: 0.5,
    dayPct: 0.5,
    cashUsd: 1.0267,
    tickers: "FRO / MPC / VLO / CASH",
    immune: false
  }
};

const LAST_QUOTES = {
  FRO: 53.52,
  USO: 158.89,
  MPC: 410.2,
  STNG: 86.96,
  VLO: 394.43,
  XLE: 64.69,
  TRMD: 36.77
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

function debitBootSplit(row, amount) {
  const boot = (row.positions || []).find((p) => p.status === "boot-split" && p.ticker === "CASH");
  if (boot) boot.sizeUsd = round4(Math.max(0, boot.sizeUsd - amount));
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

if ((season.events || []).some((e) => e && e.id === "s1e06-wed-open")) {
  console.error("s1e06-wed-open already present — abort");
  process.exit(1);
}

const carrySipAt = season.markedAt || "2026-09-16T00:07:39Z";
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

  const priorMarkUsd = row.bookUsd;
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
    eodMarkUsd: row.eodMarkUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = dayPct;
  row.priorMarkUsd = priorMarkUsd;
  row.immune = host.immune;
  row.lastSource = "robinhood-last-trade";
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
  creditSellCash(sonnet, 4.9111);
  sonnet.positions = fifoSell(sonnet.positions, "XLE", 0.075835);
  debitBuyCash(sonnet, 13.79);
  pushBuy(sonnet, {
    ticker: "FRO",
    qty: "0.257564",
    avg: "53.539900",
    sizeUsd: 13.79,
    orderId: "6aaaa1e7-27d7-44b0-a4eb-3a159bbda860",
    note: "Wed Sep 16 open BUY FRO $13.79 (scaled from $15; STNG $12 skipped)",
    at: "2026-09-16T14:04:23.289Z"
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) {
  creditSellCash(composer, 10.3911);
  composer.positions = fifoSell(composer.positions, "USO", 0.065452);
  debitBuyCash(composer, 19.24);
  pushBuy(composer, {
    ticker: "FRO",
    qty: "0.359358",
    avg: "53.539900",
    sizeUsd: 19.24,
    orderId: "6aaaa1e4-fa61-4518-ae20-0b5f5a6cdfd5",
    note: "Wed Sep 16 open BUY FRO $19.24",
    at: "2026-09-16T14:04:20.616Z"
  });
  setCash(composer, LIVING["Composer 2.5"].cashUsd);
}

const luna = season.survivors.find((s) => s.name === "GPT-5.6 Luna");
if (luna) {
  creditSellCash(luna, 6.0904);
  luna.positions = fifoSell(luna.positions, "USO", 0.03836);
  debitBuyCash(luna, 14.97);
  pushBuy(luna, {
    ticker: "FRO",
    qty: "0.279604",
    avg: "53.539900",
    sizeUsd: 14.97,
    orderId: "6aaaa1e5-a149-4f7a-a5dc-81eb7253755e",
    note: "Wed Sep 16 open BUY FRO $14.97 (scaled from $15.00)",
    at: "2026-09-16T14:04:21.785Z"
  });
  setCash(luna, LIVING["GPT-5.6 Luna"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  creditSellCash(opus, 12.8962);
  opus.positions = fifoSell(opus.positions, "FRO", 0.240915);
  debitBuyCash(opus, 21.78);
  pushBuy(opus, {
    ticker: "TRMD",
    qty: "0.592010",
    avg: "36.789900",
    sizeUsd: 21.78,
    orderId: "6aaaa1e7-3421-4e7e-9074-fa42a518fcfc",
    note: "Wed Sep 16 open BUY TRMD $21.78 (scaled from $22; VLO $20 skipped)",
    at: "2026-09-16T14:04:23.478Z"
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const gemini = season.survivors.find((s) => s.name === "Gemini 3.7 Flash");
if (gemini) {
  debitBuyCash(gemini, 8.89);
  pushBuy(gemini, {
    ticker: "FRO",
    qty: "0.166013",
    avg: "53.549900",
    sizeUsd: 8.89,
    orderId: "6aaaa1e1-3bc5-47e9-a7f6-fc0b24cddb23",
    note: "Wed Sep 16 open BUY FRO $8.89",
    at: "2026-09-16T14:04:17.939Z"
  });
  setCash(gemini, LIVING["Gemini 3.7 Flash"].cashUsd);
}

const terra = season.survivors.find((s) => s.name === "GPT-5.6 Terra");
if (terra) {
  debitBuyCash(terra, 8.88);
  pushBuy(terra, {
    ticker: "FRO",
    qty: "0.165857",
    avg: "53.539900",
    sizeUsd: 8.88,
    orderId: "6aaaa1e2-c611-467c-ae75-1ae16319b230",
    note: "Wed Sep 16 open BUY FRO $8.88",
    at: "2026-09-16T14:04:19.122Z"
  });
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
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: "robinhood-last-trade",
    session: LAST_SESSION,
    date: "2026-09-16",
    asOf: MARK_AT,
    priorCloseDate: q.priorCloseDate || "2026-09-15",
    priorCloseSource: q.priorCloseSource || "official SIP list-exchange close",
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
    id: "fill-boot-grok-fro-sell-wed",
    survivorId: IDS["Grok 4.6"],
    side: "sell",
    ticker: "FRO",
    qty: "0.691896",
    avg: "53.240100",
    sizeUsd: 36.8366,
    orderId: "6aaaa05b-23eb-4465-ae89-4b607a4fd630",
    at: "2026-09-16T13:57:47.550Z",
    note: "Boot broker liquidation Grok 4.6 FRO (jury book $0 · pin Grok lots only)"
  },
  {
    type: "fill",
    id: "fill-boot-grok-uso-sell-wed",
    survivorId: IDS["Grok 4.6"],
    side: "sell",
    ticker: "USO",
    qty: "0.032204",
    avg: "158.380100",
    sizeUsd: 5.1005,
    orderId: "6aaaa05c-57be-4cb0-9581-32eded264d30",
    at: "2026-09-16T13:57:49.042Z",
    note: "Boot broker liquidation Grok 4.6 USO (jury book $0 · pin Grok lots only)"
  },
  {
    type: "fill",
    id: "fill-boot-grok-vlo-sell-wed",
    survivorId: IDS["Grok 4.6"],
    side: "sell",
    ticker: "VLO",
    qty: "0.031213",
    avg: "395.191500",
    sizeUsd: 12.3351,
    orderId: "6aaaa06b-deb2-4fcb-b203-ae39228f5158",
    at: "2026-09-16T13:58:03.960Z",
    note: "Boot broker liquidation Grok 4.6 VLO (jury book $0 · pin Grok lots only)"
  },
  {
    type: "fill",
    id: "fill-6aaaa1ae-sonnet-xle-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "XLE",
    qty: "0.075835",
    avg: "64.760100",
    sizeUsd: 4.9111,
    orderId: "6aaaa1ae-f2f8-480e-ab64-6fa7599e938f",
    at: "2026-09-16T14:03:27.010Z",
    note: "Wed Sep 16 open SELL XLE (Sonnet Tue last-hour lot)"
  },
  {
    type: "fill",
    id: "fill-6aaaa1b0-composer-uso-sell",
    survivorId: IDS["Composer 2.5"],
    side: "sell",
    ticker: "USO",
    qty: "0.065452",
    avg: "158.760100",
    sizeUsd: 10.3911,
    orderId: "6aaaa1b0-c063-46d5-94dc-933c8bf36516",
    at: "2026-09-16T14:03:29.075Z",
    note: "Wed Sep 16 open SELL USO (Composer Tue mid lot)"
  },
  {
    type: "fill",
    id: "fill-6aaaa1b2-luna-uso-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "USO",
    qty: "0.038360",
    avg: "158.770100",
    sizeUsd: 6.0904,
    orderId: "6aaaa1b2-c7b2-45f0-9ee9-fe977229dd4e",
    at: "2026-09-16T14:03:30.940Z",
    note: "Wed Sep 16 open SELL USO (Luna Mon mid lot)"
  },
  {
    type: "fill",
    id: "fill-6aaaa1bd-opus-fro-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.240915",
    avg: "53.530100",
    sizeUsd: 12.8962,
    orderId: "6aaaa1bd-b391-42d0-b75c-0d7f52b5a3b5",
    at: "2026-09-16T14:03:41.818Z",
    note: "Wed Sep 16 open SELL FRO (Opus Mon mid lot)"
  },
  {
    type: "fill",
    id: "fill-6aaaa1e1-gemini-fro-buy",
    survivorId: IDS["Gemini 3.7 Flash"],
    side: "buy",
    ticker: "FRO",
    qty: "0.166013",
    avg: "53.549900",
    sizeUsd: 8.89,
    orderId: "6aaaa1e1-3bc5-47e9-a7f6-fc0b24cddb23",
    at: "2026-09-16T14:04:17.939Z",
    note: "Wed Sep 16 open BUY FRO $8.89"
  },
  {
    type: "fill",
    id: "fill-6aaaa1e2-terra-fro-buy",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "FRO",
    qty: "0.165857",
    avg: "53.539900",
    sizeUsd: 8.88,
    orderId: "6aaaa1e2-c611-467c-ae75-1ae16319b230",
    at: "2026-09-16T14:04:19.122Z",
    note: "Wed Sep 16 open BUY FRO $8.88"
  },
  {
    type: "fill",
    id: "fill-6aaaa1e4-composer-fro-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.359358",
    avg: "53.539900",
    sizeUsd: 19.24,
    orderId: "6aaaa1e4-fa61-4518-ae20-0b5f5a6cdfd5",
    at: "2026-09-16T14:04:20.616Z",
    note: "Wed Sep 16 open BUY FRO $19.24"
  },
  {
    type: "fill",
    id: "fill-6aaaa1e5-luna-fro-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "FRO",
    qty: "0.279604",
    avg: "53.539900",
    sizeUsd: 14.97,
    orderId: "6aaaa1e5-a149-4f7a-a5dc-81eb7253755e",
    at: "2026-09-16T14:04:21.785Z",
    note: "Wed Sep 16 open BUY FRO $14.97 (scaled from $15.00)"
  },
  {
    type: "fill",
    id: "fill-6aaaa1e7-sonnet-fro-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.257564",
    avg: "53.539900",
    sizeUsd: 13.79,
    orderId: "6aaaa1e7-27d7-44b0-a4eb-3a159bbda860",
    at: "2026-09-16T14:04:23.289Z",
    note: "Wed Sep 16 open BUY FRO $13.79 (scaled from $15; STNG $12 skipped)"
  },
  {
    type: "fill",
    id: "fill-6aaaa1e7-opus-trmd-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "TRMD",
    qty: "0.592010",
    avg: "36.789900",
    sizeUsd: 21.78,
    orderId: "6aaaa1e7-3421-4e7e-9074-fa42a518fcfc",
    at: "2026-09-16T14:04:23.478Z",
    note: "Wed Sep 16 open BUY TRMD $21.78 (scaled from $22; VLO $20 skipped)"
  }
];

season.events.push(...openFills);
season.events.push({
  type: "mark",
  id: "s1e06-wed-open",
  kind: "open",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Wed Sep 16 2026 OPEN · robinhood last-trade after fills (~7:04 AM PT). Snapshot s1e06-wed-open. Grok boot liq cleared.",
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
    name: "GPT-5.6 Terra",
    weekPct: 2.43,
    basis: "Episode 6 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["GPT-5.6 Terra"],
    at: MARK_AT
  },
  potUsd: 387.8499
});

const grok = season.survivors.find((s) => s.name === "Grok 4.6");
if (grok && grok.positions && grok.positions[0]) {
  grok.positions[0].note =
    "jury · not funded · Grok voted-out $0 · boot broker liquidation cleared Wed Sep 16 open (FRO 0.691896 · USO 0.032204 · VLO 0.031213 — pin Grok lots only)";
}

season.liveSnapshotId = "s1e06-wed-open";
season.islandPotUsd = 387.8499;
season.markedAt = MARK_AT;
season.markLabel =
  "Wed Sep 16 OPEN · robinhood last-trade after fills (~7:04 AM PT). Snapshot s1e06-wed-open. Grok boot liq cleared.";
season.dayPctBasis = "vs Tue Sep 15 official SIP EOD (s1e06-carry-sip)";
season.weekPctBasis = "vs Episode 6 carry / open mark (Episode 6 week)";
season.statusLabel = "Live · S1E06 · MERGED · six living · Wed open";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E06 live Wed Sep 16 – Fri Sep 18. MERGED. Six living. Wed open remake after fills. Given $361.93. Pot $387.85. GPT-5.6 Terra leads +2.43% and wears immunity. Grok 4.6 boot liq cleared. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["GPT-5.6 Terra"],
  name: "GPT-5.6 Terra",
  weekPct: 2.43,
  at: MARK_AT,
  snapshotId: "s1e06-wed-open",
  asOf: LAST_SESSION
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e06-wed-open · islandPotUsd", season.islandPotUsd, "· immunity GPT-5.6 Terra +2.43%");
