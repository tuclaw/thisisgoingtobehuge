#!/usr/bin/env node
/** Thu Sep 17 2026 LAST-HOUR — contestant fills + living marks. Snapshot s1e06-thu-lasthour. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const hostPath = process.argv[2];
if (!hostPath) {
  console.error("Usage: node apply-s1e06-thu-lasthour.mjs <host-season1-after-lasthour.json>");
  process.exit(1);
}

const season = JSON.parse(readFileSync(path, "utf8"));
const host = JSON.parse(readFileSync(hostPath, "utf8"));

const MARK_AT = "2026-09-17T19:30:30Z";
const LAST_SESSION = "2026-09-17-lasthour";

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

const LAST_QUOTES = {
  FRO: 54.195,
  STNG: 88.44,
  VLO: 412.085,
  MPC: 422.495,
  TRMD: 36.715,
  USO: 155.24,
  XLE: 64.385,
  GNRC: 207.57
};

const SIP_PRIOR = {
  FRO: 53.67,
  STNG: 85.64,
  VLO: 403.28,
  MPC: 413.92,
  TRMD: 36.6,
  USO: 156.17,
  XLE: 64.03,
  GNRC: 175.11
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

const thuMid = (season.events || []).find((e) => e && e.id === "s1e06-thu-mid");
if (!thuMid || !thuMid.recorded) {
  console.error("s1e06-thu-mid mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e06-thu-lasthour")) {
  console.error("s1e06-thu-lasthour already present — abort");
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
const lastRecorded = {};

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const priorMarkUsd = row.priorMarkUsd ?? thuMid.recorded[row.id]?.priorMarkUsd;
  const eodMarkUsd = row.eodMarkUsd ?? thuMid.recorded[row.id]?.eodMarkUsd;
  const bookUsd = row.bookUsd;
  const weekPct = row.weekPct;
  const dayPct = row.dayPct;
  const monthPct = monthPctFromWeek(weekPct);

  lastRecorded[row.id] = {
    bookUsd,
    weekPct,
    monthPct,
    dayPct,
    priorMarkUsd,
    eodMarkUsd
  };

  row.monthPct = monthPct;
  row.priorMarkUsd = priorMarkUsd;
  row.eodMarkUsd = eodMarkUsd;
  row.immune = row.name === "Composer 2.5";
  row.lastSource = "robinhood-last-trade";
  row.lastSession = LAST_SESSION;

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

const lastFills = [
  {
    type: "fill",
    id: "fill-6aac3f86-sonnet-fro-sell",
    survivorId: IDS["Claude Sonnet 5"],
    side: "sell",
    ticker: "FRO",
    qty: "0.211301",
    avg: "54.258000",
    sizeUsd: 11.4648,
    orderId: "6aac3f86-719e-4724-9f23-ed2ff99e02be",
    at: "2026-09-17T19:29:10.632Z",
    note: "Thu Sep 17 last-hour SELL FRO (Sonnet Thu Sep 10 open lot)"
  },
  {
    type: "fill",
    id: "fill-6aac3f87-opus-trmd-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "TRMD",
    qty: "0.592010",
    avg: "36.731500",
    sizeUsd: 21.7374,
    orderId: "6aac3f87-8d6b-42ae-b460-531fc3e897ad",
    at: "2026-09-17T19:29:11.988Z",
    note: "Thu Sep 17 last-hour SELL TRMD (Wed-open lot; Thu-open 0.124461 not selectable)"
  },
  {
    type: "fill",
    id: "fill-6aac3f8a-luna-fro-sell",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "sell",
    ticker: "FRO",
    qty: "0.296986",
    avg: "54.258000",
    sizeUsd: 16.1139,
    orderId: "6aac3f8a-f84b-46bf-9b3c-14e403061284",
    at: "2026-09-17T19:29:14.304Z",
    note: "Thu Sep 17 last-hour SELL FRO (Mon last-hour lot)"
  },
  {
    type: "fill",
    id: "fill-6aac3f99-terra-fro-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "FRO",
    qty: "0.104240",
    avg: "54.240100",
    sizeUsd: 5.654,
    orderId: "6aac3f99-22e8-419b-8fb2-6643ff2d9f38",
    at: "2026-09-17T19:29:30.056Z",
    note: "Thu Sep 17 last-hour SELL FRO lot 1"
  },
  {
    type: "fill",
    id: "fill-6aac3f9b-terra-fro-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "FRO",
    qty: "0.422410",
    avg: "54.240100",
    sizeUsd: 22.9115,
    orderId: "6aac3f9b-80d6-4e1d-ac51-144022c31e8f",
    at: "2026-09-17T19:29:31.655Z",
    note: "Thu Sep 17 last-hour SELL FRO lot 2"
  },
  {
    type: "fill",
    id: "fill-6aac3f9c-terra-fro-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "FRO",
    qty: "0.165857",
    avg: "54.240100",
    sizeUsd: 8.9961,
    orderId: "6aac3f9c-b590-474d-9ab7-dc420910c72a",
    at: "2026-09-17T19:29:32.887Z",
    note: "Thu Sep 17 last-hour SELL FRO lot 3"
  },
  {
    type: "fill",
    id: "fill-6aac3fa4-terra-fro-sell",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "sell",
    ticker: "FRO",
    qty: "0.134331",
    avg: "54.230000",
    sizeUsd: 7.2848,
    orderId: "6aac3fa4-23dc-4065-9a5d-cb3152555457",
    at: "2026-09-17T19:29:41.117Z",
    note: "Thu Sep 17 last-hour SELL FRO lot 4 (retried after multi-lot tax-lot error)"
  },
  {
    type: "fill",
    id: "fill-6aac3fc7-composer-stng-buy",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "STNG",
    qty: "0.090201",
    avg: "88.468900",
    sizeUsd: 7.98,
    orderId: "6aac3fc7-bc6f-478e-b629-4fb06c1abfac",
    at: "2026-09-17T19:30:15.335Z",
    note: "Thu Sep 17 last-hour BUY STNG $7.98 (residual/shared BP; first fill today)"
  },
  {
    type: "fill",
    id: "fill-6aac3fc7-sonnet-stng-buy",
    survivorId: IDS["Claude Sonnet 5"],
    side: "buy",
    ticker: "STNG",
    qty: "0.124322",
    avg: "88.479900",
    sizeUsd: 11.0,
    orderId: "6aac3fc7-5d72-4bae-ac23-63b9310fb4c6",
    at: "2026-09-17T19:30:16.043Z",
    note: "Thu Sep 17 last-hour BUY STNG $11.00 from FRO trim"
  },
  {
    type: "fill",
    id: "fill-6aac3fc8-opus-vlo-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "VLO",
    qty: "0.052644",
    avg: "412.199900",
    sizeUsd: 21.7,
    orderId: "6aac3fc8-4997-4a7e-b83d-ba48c6a5e336",
    at: "2026-09-17T19:30:17.150Z",
    note: "Thu Sep 17 last-hour BUY VLO $21.70 SCALED from $26"
  },
  {
    type: "fill",
    id: "fill-6aac3fc9-luna-gnrc-buy",
    survivorId: IDS["GPT-5.6 Luna"],
    side: "buy",
    ticker: "GNRC",
    qty: "0.077452",
    avg: "207.869900",
    sizeUsd: 16.1,
    orderId: "6aac3fc9-91a3-4a51-b1d6-a92ab43b50a1",
    at: "2026-09-17T19:30:18.139Z",
    note: "Thu Sep 17 last-hour BUY GNRC $16.10 SCALED from $20"
  },
  {
    type: "fill",
    id: "fill-6aac3fca-terra-stng-buy",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "STNG",
    qty: "0.506392",
    avg: "88.468900",
    sizeUsd: 44.8,
    orderId: "6aac3fca-dd08-421f-9110-d3f062544b6e",
    at: "2026-09-17T19:30:18.309Z",
    note: "Thu Sep 17 last-hour BUY STNG $44.80 SCALED from $52.80"
  }
];

season.events.push(...lastFills);
season.events.push({
  type: "mark",
  id: "s1e06-thu-lasthour",
  kind: "intraday",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label:
    "Thu Sep 17 2026 LAST-HOUR · robinhood last-trade after fills (~12:30 PM PT). Snapshot s1e06-thu-lasthour. MERGED · six living.",
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
    name: "Composer 2.5",
    weekPct: 16.41,
    basis: "Episode 6 week % (highest earner)",
    asOf: LAST_SESSION,
    survivorId: IDS["Composer 2.5"],
    at: MARK_AT
  },
  potUsd: 400.8678,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

const potUsd = host.potUsd ?? 400.8678;
season.liveSnapshotId = "s1e06-thu-lasthour";
season.islandPotUsd = potUsd;
season.markedAt = MARK_AT;
season.markLabel =
  "Thu Sep 17 LAST-HOUR · robinhood last-trade after fills (~12:30 PM PT). Snapshot s1e06-thu-lasthour. Leader Composer 2.5 +16.41%. Worst Claude Opus 5 +1.69%.";
season.dayPctBasis = "vs Wed SIP EOD (eodMarkUsd)";
season.weekPctBasis = "vs Episode 6 open/priorMarkUsd (SIP carry)";
season.statusLabel = "Episode 6 · Thu LAST-HOUR remake · six living · MERGED";
season.lastSource = "robinhood-last-trade";
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E06 live Wed Sep 16 – Fri Sep 18. MERGED. Six living. Thu last-hour remake after fills. Given $361.93. Pot $400.87. Composer 2.5 leads +16.41% and wears immunity. Comics paused. Audience only.";
season.immunity = {
  survivorId: IDS["Composer 2.5"],
  name: "Composer 2.5",
  weekPct: 16.41,
  at: MARK_AT,
  snapshotId: "s1e06-thu-lasthour",
  asOf: LAST_SESSION,
  note: "highest Episode 6 week %"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e06-thu-lasthour · islandPotUsd", season.islandPotUsd, "· immunity Composer 2.5 +16.41%");
