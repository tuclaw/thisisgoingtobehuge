#!/usr/bin/env node
/** Thu Sep 17 2026 MID — contestant fills + living marks. Snapshot s1e06-thu-mid. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const hostPath = process.argv[2];
if (!hostPath) {
  console.error("Usage: node apply-s1e06-thu-mid.mjs <host-season1-after-mid.json>");
  process.exit(1);
}

const season = JSON.parse(readFileSync(path, "utf8"));
const host = JSON.parse(readFileSync(hostPath, "utf8"));

const MARK_AT = "2026-09-17T17:21:00Z";
const LAST_SESSION = "2026-09-17-mid";

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

const LAST_QUOTES = {
  FRO: 54.675,
  STNG: 89.8,
  VLO: 410.7299,
  MPC: 422.55,
  TRMD: 36.93,
  USO: 156.27,
  XLE: 64.3
};

const SIP_PRIOR = {
  FRO: 53.67,
  STNG: 85.64,
  VLO: 403.28,
  MPC: 413.92,
  TRMD: 36.6,
  USO: 156.17,
  XLE: 64.03
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

const thuOpen = (season.events || []).find((e) => e && e.id === "s1e06-thu-open");
if (!thuOpen || !thuOpen.recorded) {
  console.error("s1e06-thu-open mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e06-thu-mid")) {
  console.error("s1e06-thu-mid already present — abort");
  process.exit(1);
}

const hostMap = new Map((host.survivors || []).map((s) => [s.id, s]));
season.survivors = (season.survivors || []).map((s) => {
  const h = hostMap.get(s.id);
  return h ? { ...h } : s;
});

let biduWeek = 0;
let askaraWeek = 0;
let biduDay = 0;
let askaraDay = 0;
let biduCount = 0;
let askaraCount = 0;
const midRecorded = {};

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const priorMarkUsd = thuOpen.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = thuOpen.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd;
  const bookUsd = row.bookUsd;
  const weekPct = row.weekPct;
  const dayPct = row.dayPct;
  const monthPct = monthPctFromWeek(weekPct);

  midRecorded[row.id] = {
    bookUsd,
    weekPct,
    monthPct,
    dayPct,
    priorMarkUsd,
    eodMarkUsd
  };

  row.monthPct = monthPct;

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

const midFills = [
  {
    type: "fill",
    id: "fill-6aac2120-sonnet-fro-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.257564",
    avg: "54.700100",
    sizeUsd: 14.0888,
    orderId: "6aac2120-98df-426c-9a0e-bef831b83fbc",
    at: "2026-09-17T17:19:28.609Z",
    note: "Thu Sep 17 mid SELL FRO (Sonnet Wed-open FRO lot 0.257564 @53.54)"
  },
  {
    type: "fill",
    id: "fill-6aac2120-luna-vlo-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "VLO",
    qty: "0.043957",
    avg: "410.606100",
    sizeUsd: 18.049,
    orderId: "6aac2120-ff76-40fe-ac8a-05a645116096",
    at: "2026-09-17T17:19:29.084Z",
    note: "Thu Sep 17 mid SELL VLO (Luna Tue last-hour VLO sole sleeve lot)"
  },
  {
    type: "fill",
    id: "fill-6aac214e-luna-stng-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "STNG",
    qty: "0.211316",
    avg: "89.912700",
    sizeUsd: 19.0,
    orderId: "6aac214e-e5a1-4e94-a481-d888030323d1",
    at: "2026-09-17T17:20:14.793Z",
    note: "Thu Sep 17 mid BUY STNG $19.00 from VLO exit"
  },
  {
    type: "fill",
    id: "fill-6aac2150-terra-fro-buy",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "FRO",
    qty: "0.021930",
    avg: "54.717400",
    sizeUsd: 1.2,
    orderId: "6aac2150-7ad8-4c90-af0d-822ede1cc54b",
    at: "2026-09-17T17:20:16.278Z",
    note: "Thu Sep 17 mid BUY FRO $1.20 (sleeve cash $0.0069; filled from residual/shared BP after sells)"
  },
  {
    type: "fill",
    id: "fill-6aac2150-opus-fro-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "FRO",
    qty: "0.021930",
    avg: "54.717400",
    sizeUsd: 1.2,
    orderId: "6aac2150-52ab-4f33-8498-076a4d5249b9",
    at: "2026-09-17T17:20:16.413Z",
    note: "Thu Sep 17 mid BUY FRO $1.20"
  },
  {
    type: "fill",
    id: "fill-6aac2151-sonnet-stng-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "STNG",
    qty: "0.044487",
    avg: "89.912700",
    sizeUsd: 4.0,
    orderId: "6aac2151-e613-45a3-81c4-bf4985e7fd5f",
    at: "2026-09-17T17:20:17.732Z",
    note: "Thu Sep 17 mid BUY STNG $4.00 from FRO trim"
  }
];

season.events.push(...midFills);
season.events.push({
  type: "mark",
  id: "s1e06-thu-mid",
  kind: "mid",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Thu Sep 17 2026 MID · robinhood last-trade after fills (~10:21 AM PT). Snapshot s1e06-thu-mid. MERGED · six living.",
  dayPctPriorOfficial: true,
  quoteSource: "robinhood-last-trade",
  recorded: midRecorded,
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
    weekPct: 6.84,
    basis: "Episode 6 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["GPT-5.6 Terra"],
    at: MARK_AT
  },
  potUsd: 396.118,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

season.liveSnapshotId = "s1e06-thu-mid";
season.islandPotUsd = 396.118;
season.markedAt = MARK_AT;
season.markLabel =
  "Thu Sep 17 MID · robinhood last-trade after fills (~10:21 AM PT). Snapshot s1e06-thu-mid. Leader GPT-5.6 Terra +6.84%. Worst Claude Opus 5 +2.15%.";
season.dayPctBasis = "vs Wed SIP EOD (eodMarkUsd)";
season.weekPctBasis = "vs Episode 6 open/priorMarkUsd (SIP carry)";
season.statusLabel = "Episode 6 · Thu MID remake · six living · MERGED";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E06 live Wed Sep 16 – Fri Sep 18. MERGED. Six living. Thu mid remake after fills. Given $361.93. Pot $396.12. GPT-5.6 Terra leads +6.84% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["GPT-5.6 Terra"],
  name: "GPT-5.6 Terra",
  weekPct: 6.84,
  at: MARK_AT,
  snapshotId: "s1e06-thu-mid",
  asOf: LAST_SESSION,
  note: "highest Episode 6 week %"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e06-thu-mid · islandPotUsd", season.islandPotUsd, "· immunity GPT-5.6 Terra +6.84%");
