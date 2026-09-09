#!/usr/bin/env node
/** Wed Sep 9 2026 LAST-HOUR — living marks, last-hour fills, Luna immunity +2.25%. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const LAST_AT = "2026-09-09T19:16:00Z";
const LAST_SESSION = "2026-09-09-lasthour";

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
  "GPT-5.6 Luna": { bookUsd: 46.1809, weekPct: 2.25, dayPct: 2.25, cashUsd: 0.8978, tickers: "VLO / XLE / CASH", immune: true },
  "Kimi K3": { bookUsd: 46.1572, weekPct: 2.2, dayPct: 2.2, cashUsd: 0, tickers: "CVX / FRO / USO", immune: false },
  "Grok 4.6": { bookUsd: 46.5954, weekPct: 2.07, dayPct: 2.07, cashUsd: 0.3403, tickers: "USO / XOM / CASH", immune: false },
  "Gemini 3.7 Flash": { bookUsd: 46.0512, weekPct: 1.72, dayPct: 1.72, cashUsd: 0.0094, tickers: "USO / XLE / CASH", immune: false },
  "Composer 2.5": { bookUsd: 46.0321, weekPct: 1.4, dayPct: 1.4, cashUsd: 0.087, tickers: "CVX / FRO / CASH", immune: false },
  "Claude Opus 5": { bookUsd: 46.0385, weekPct: 1.37, dayPct: 1.37, cashUsd: 0.5241, tickers: "FRO / USO / VLO / XOM / CASH", immune: false },
  "GPT-5.6 Terra": { bookUsd: 45.7344, weekPct: 1.18, dayPct: 1.18, cashUsd: 0.1179, tickers: "FRO / USO / CASH", immune: false },
  "Claude Sonnet 5": { bookUsd: 45.7438, weekPct: 1.12, dayPct: 1.12, cashUsd: 0.0021, tickers: "FRO / VLO / XLE / CASH", immune: false }
};

const LAST_QUOTES = {
  USO: 149.5177,
  XOM: 165.1199,
  FRO: 47.3299,
  CVX: 213.2101,
  MPC: 400.9901,
  VLO: 382.5,
  XLE: 65.5601
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

const wedMid = (season.events || []).find((e) => e && e.id === "s1e04-wed-mid");
if (!wedMid || !wedMid.recorded) {
  console.error("s1e04-wed-mid mark missing");
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

  const priorMarkUsd = wedMid.recorded[row.id]?.bookUsd ?? row.bookUsd;
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
    eodMarkUsd: wedMid.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd
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

const sonnet = season.survivors.find((s) => s.name === "Claude Sonnet 5");
if (sonnet) {
  sonnet.positions = fifoSell(sonnet.positions, 0.05);
  sonnet.positions.push({
    action: "BUY",
    ticker: "FRO",
    qty: "0.077125",
    avg: "47.3257",
    sizeUsd: round4(0.077125 * 47.3257),
    status: "filled",
    note: "Wed Sep 9 last-hour BUY FRO",
    last: LAST_QUOTES.FRO,
    lastSource: "RTH last-trade",
    lastSession: LAST_SESSION,
    orderId: "6aa1b055",
    filledAt: LAST_AT
  });
  setCash(sonnet, LIVING["Claude Sonnet 5"].cashUsd);
}

const composer = season.survivors.find((s) => s.name === "Composer 2.5");
if (composer) {
  composer.positions = fifoSell(composer.positions, 0.095132);
  composer.positions.push({
    action: "BUY",
    ticker: "FRO",
    qty: "0.300021",
    avg: "47.3299",
    sizeUsd: round4(0.300021 * 47.3299),
    status: "filled",
    note: "Wed Sep 9 last-hour BUY FRO",
    last: LAST_QUOTES.FRO,
    lastSource: "RTH last-trade",
    lastSession: LAST_SESSION,
    orderId: "6aa1b056",
    filledAt: LAST_AT
  });
  setCash(composer, LIVING["Composer 2.5"].cashUsd);
}

const opus = season.survivors.find((s) => s.name === "Claude Opus 5");
if (opus) {
  opus.positions = fifoSell(opus.positions, 0.253);
  opus.positions = (opus.positions || []).filter((p) => p.ticker !== "MPC");
  opus.positions.push({
    action: "BUY",
    ticker: "XOM",
    qty: "0.054505",
    avg: "165.1199",
    sizeUsd: round4(0.054505 * 165.1199),
    status: "filled",
    note: "Wed Sep 9 last-hour BUY XOM",
    last: LAST_QUOTES.XOM,
    lastSource: "RTH last-trade",
    lastSession: LAST_SESSION,
    orderId: "6aa1b058",
    filledAt: LAST_AT
  });
  opus.positions.push({
    action: "BUY",
    ticker: "USO",
    qty: "0.033441",
    avg: "149.5146",
    sizeUsd: round4(0.033441 * 149.5146),
    status: "filled",
    note: "Wed Sep 9 last-hour BUY USO",
    last: LAST_QUOTES.USO,
    lastSource: "RTH last-trade",
    lastSession: LAST_SESSION,
    orderId: "6aa1b059",
    filledAt: LAST_AT
  });
  setCash(opus, LIVING["Claude Opus 5"].cashUsd);
}

const terra = season.survivors.find((s) => s.name === "GPT-5.6 Terra");
if (terra) {
  terra.positions = fifoSell(terra.positions, 0.622603);
  terra.positions.push({
    action: "BUY",
    ticker: "USO",
    qty: "0.272074",
    avg: "149.5177",
    sizeUsd: round4(0.272074 * 149.5177),
    status: "filled",
    note: "Wed Sep 9 last-hour BUY USO",
    last: LAST_QUOTES.USO,
    lastSource: "RTH last-trade",
    lastSession: LAST_SESSION,
    orderId: "6aa1b059",
    filledAt: LAST_AT
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
    date: "2026-09-09",
    asOf: LAST_AT,
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

const lastFills = [
  {
    type: "fill",
    id: "fill-6aa1b033-sonnet-xle-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "XLE",
    qty: "0.050000",
    avg: "65.5501",
    sizeUsd: round4(0.05 * 65.5501),
    orderId: "6aa1b033",
    at: "2026-09-09T19:14:10.000Z",
    note: "Wed Sep 9 last-hour SELL XLE"
  },
  {
    type: "fill",
    id: "fill-6aa1b035-composer-uso-sell",
    survivorId: IDS["Composer 2.5"],
    side: "sell",
    ticker: "USO",
    qty: "0.095132",
    avg: "149.5414",
    sizeUsd: round4(0.095132 * 149.5414),
    orderId: "6aa1b035",
    at: "2026-09-09T19:14:12.000Z",
    note: "Wed Sep 9 last-hour SELL USO"
  },
  {
    type: "fill",
    id: "fill-6aa1b037-opus-fro-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.253000",
    avg: "47.3001",
    sizeUsd: round4(0.253 * 47.3001),
    orderId: "6aa1b037",
    at: "2026-09-09T19:14:14.000Z",
    note: "Wed Sep 9 last-hour SELL FRO"
  },
  {
    type: "fill",
    id: "fill-6aa1b03a-opus-mpc-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "MPC",
    qty: "0.006311",
    avg: "400.9901",
    sizeUsd: round4(0.006311 * 400.9901),
    orderId: "6aa1b03a",
    at: "2026-09-09T19:14:16.000Z",
    note: "Wed Sep 9 last-hour SELL MPC (pinned MPC)"
  },
  {
    type: "fill",
    id: "fill-6aa1b03a-terra-xle-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "XLE",
    qty: "0.622603",
    avg: "65.5601",
    sizeUsd: round4(0.622603 * 65.5601),
    orderId: "6aa1b03a",
    at: "2026-09-09T19:14:18.000Z",
    note: "Wed Sep 9 last-hour SELL XLE"
  },
  {
    type: "fill",
    id: "fill-6aa1b055-sonnet-fro-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.077125",
    avg: "47.3257",
    sizeUsd: round4(0.077125 * 47.3257),
    orderId: "6aa1b055",
    at: "2026-09-09T19:14:20.000Z",
    note: "Wed Sep 9 last-hour BUY FRO"
  },
  {
    type: "fill",
    id: "fill-6aa1b056-composer-fro-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.300021",
    avg: "47.3299",
    sizeUsd: round4(0.300021 * 47.3299),
    orderId: "6aa1b056",
    at: "2026-09-09T19:14:22.000Z",
    note: "Wed Sep 9 last-hour BUY FRO"
  },
  {
    type: "fill",
    id: "fill-6aa1b058-opus-xom-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "XOM",
    qty: "0.054505",
    avg: "165.1199",
    sizeUsd: round4(0.054505 * 165.1199),
    orderId: "6aa1b058",
    at: "2026-09-09T19:14:24.000Z",
    note: "Wed Sep 9 last-hour BUY XOM"
  },
  {
    type: "fill",
    id: "fill-6aa1b059-opus-uso-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "USO",
    qty: "0.033441",
    avg: "149.5146",
    sizeUsd: round4(0.033441 * 149.5146),
    orderId: "6aa1b059",
    at: "2026-09-09T19:14:26.000Z",
    note: "Wed Sep 9 last-hour BUY USO"
  },
  {
    type: "fill",
    id: "fill-6aa1b059-terra-uso-buy",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "USO",
    qty: "0.272074",
    avg: "149.5177",
    sizeUsd: round4(0.272074 * 149.5177),
    orderId: "6aa1b059",
    at: "2026-09-09T19:14:28.000Z",
    note: "Wed Sep 9 last-hour BUY USO"
  }
];

season.events.push(...lastFills);
season.events.push({
  type: "mark",
  id: "s1e04-wed-lasthour",
  kind: "intraday",
  at: LAST_AT,
  throughAt: LAST_AT,
  lastSession: LAST_SESSION,
  label: "Wed Sep 9 2026 LAST-HOUR · RTH last-trade (~12:16 PM PT) · living marks only",
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

season.liveSnapshotId = "s1e04-wed-lasthour";
season.islandPotUsd = 368.5335;
season.markedAt = LAST_AT;
season.markLabel = "Wed Sep 9 2026 LAST-HOUR · RTH last-trade (~12:16 PM PT)";
season.statusLabel =
  "Live · S1E04 · MERGED · eight living · Wed last-hour remake · leader GPT-5.6 Luna";
season.lastSource = "RTH last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E03 closed Tue Sep 8 tribal — GPT-5.6 Sol voted out 7–1. S1E04 live Wed Sep 9 – Fri Sep 11. MERGED. Eight living. Given $361.93. Pot $368.5335. GPT-5.6 Luna leads +2.25% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["GPT-5.6 Luna"],
  name: "GPT-5.6 Luna",
  weekPct: 2.25,
  at: LAST_AT,
  snapshotId: "s1e04-wed-lasthour"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e04-wed-lasthour · islandPotUsd", season.islandPotUsd, "· immunity GPT-5.6 Luna +2.25%");
