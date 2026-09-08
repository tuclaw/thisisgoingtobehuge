#!/usr/bin/env node
/** S1E03 tribal close — boot GPT-5.6 Sol, open Episode 4. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const SOL_ID = "f3382744-4512-410c-ab0c-d22ec35b22a0";

const BEFORE_BOOT = {
  "Grok 4.6": { bookUsd: 40.7801, weekPct: 1.77, cash: 0.4027 },
  "Claude Opus 5": { bookUsd: 40.5576, weekPct: 1.22, cash: 0.0673 },
  "Composer 2.5": { bookUsd: 40.5278, weekPct: 1.14, cash: 0 },
  "Gemini 3.7 Flash": { bookUsd: 40.4042, weekPct: 0.83, cash: 0.0013 },
  "Claude Sonnet 5": { bookUsd: 40.3705, weekPct: 0.75, cash: 0.0065 },
  "GPT-5.6 Terra": { bookUsd: 40.3276, weekPct: 0.64, cash: 0.0047 },
  "Kimi K3": { bookUsd: 40.3122, weekPct: 0.6, cash: 3.7085 },
  "GPT-5.6 Luna": { bookUsd: 40.292, weekPct: 0.55, cash: 6.2084 },
  "GPT-5.6 Sol": { bookUsd: 38.9449, weekPct: -2.81, cash: 0.3607 }
};

const SPLIT = {
  "Grok 4.6": 4.8682,
  "Claude Opus 5": 4.8681,
  "Composer 2.5": 4.8681,
  "Gemini 3.7 Flash": 4.8681,
  "Claude Sonnet 5": 4.8681,
  "GPT-5.6 Terra": 4.8681,
  "Kimi K3": 4.8681,
  "GPT-5.6 Luna": 4.8681
};

const QUOTES = {
  USO: { last: 146.03, close: 145.2077 },
  XLE: { last: 64.765, close: 64.945 },
  VLO: { last: 382.93, close: 383.9738 },
  MPC: { last: 397.96, close: 396.6953 },
  FRO: { last: 46.63, close: 46.5957 },
  CVX: { last: 210.0, close: 209.5 },
  XOM: { last: 160.71, close: 160.81 }
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

// --- before-boot mark recorded ---
const beforeRecorded = {};
for (const row of season.survivors || []) {
  const host = BEFORE_BOOT[row.name];
  if (!host) continue;
  beforeRecorded[row.id] = {
    bookUsd: host.bookUsd,
    weekPct: host.weekPct,
    monthPct: monthPctFromWeek(host.weekPct),
    dayPct: host.weekPct,
    priorMarkUsd: row.priorMarkUsd ?? row.bookUsd
  };
}

// --- post-split carry recorded ---
const carryRecorded = {};
for (const row of season.survivors || []) {
  if (row.status !== "active" || row.name === "GPT-5.6 Sol") continue;
  const host = BEFORE_BOOT[row.name];
  const split = SPLIT[row.name] || 0;
  const bookUsd = round4(host.bookUsd + split);
  carryRecorded[row.id] = {
    bookUsd,
    weekPct: 0,
    monthPct: monthPctFromWeek(host.weekPct),
    dayPct: 0,
    priorMarkUsd: bookUsd,
    eodMarkUsd: row.eodMarkUsd
  };
}

// --- update survivors ---
let biduWeek = 0;
let askaraWeek = 0;
for (const row of season.survivors || []) {
  if (row.name === "GPT-5.6 Sol") {
    row.status = "voted-out";
    row.bookUsd = 0;
    row.weekPct = BEFORE_BOOT["GPT-5.6 Sol"].weekPct;
    row.monthPct = monthPctFromWeek(row.weekPct);
    row.dayPct = 0;
    row.priorMarkUsd = BEFORE_BOOT["GPT-5.6 Sol"].bookUsd;
    row.immune = false;
    row.jury = true;
    if (row.position) {
      row.position = { action: "SOLD", ticker: "CASH", sizeUsd: 0, status: "boot-split", note: "voted out Tue Sep 8 tribal" };
    }
    row.positions = [
      {
        action: "SOLD",
        ticker: "CASH",
        sizeUsd: 0,
        status: "boot-split",
        note: "jury · not funded · Sol voted-out $0 · book marked sold $38.9449"
      }
    ];
    continue;
  }
  if (row.status !== "active") continue;
  const host = BEFORE_BOOT[row.name];
  const split = SPLIT[row.name] || 0;
  const bookUsd = round4(host.bookUsd + split);
  const cashUsd = round4(host.cash + split);
  row.bookUsd = bookUsd;
  row.weekPct = 0;
  row.monthPct = monthPctFromWeek(host.weekPct);
  row.dayPct = 0;
  row.priorMarkUsd = bookUsd;
  row.immune = false;
  if (row.position) row.position.sizeUsd = bookUsd;
  const cash = (row.positions || []).find((p) => p.ticker === "CASH" && (p.status === "cash" || p.action === "HOLD"));
  if (cash) {
    cash.sizeUsd = cashUsd;
    cash.note = (cash.note || "").replace(/ · tribal boot split.*$/, "") + " · tribal boot split";
  }
  if (row.tribeId === "bidu") biduWeek += host.weekPct;
  if (row.tribeId === "askara") askaraWeek += host.weekPct;
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 6;
    t.combinedWeekPct = 0;
    t.combinedMonthPct = round4(biduWeek);
    t.combinedDayPct = 0;
  }
  if (t.id === "askara") {
    t.livingCount = 2;
    t.combinedWeekPct = 0;
    t.combinedMonthPct = round4(askaraWeek);
    t.combinedDayPct = 0;
  }
}

// --- quotes ---
for (const [ticker, q] of Object.entries(QUOTES)) {
  if (!season.quotes[ticker]) season.quotes[ticker] = {};
  Object.assign(season.quotes[ticker], {
    last: q.last,
    source: "RTH last-trade",
    session: "2026-09-08-eod",
    date: "2026-09-08",
    asOf: "2026-09-08T21:00:00Z",
    priorCloseDate: "2026-09-08",
    priorCloseSource: "RTH last-trade",
    interpolated: false
  });
  if (q.close != null) season.quotes[ticker].close = q.close;
}

// --- events ---
season.events = (season.events || []).filter(
  (e) => e && e.id !== "s1e03-tue-eod" && e.id !== "s1e03-boot-gpt-5-6-sol" && e.id !== "s1e04-carry"
);

season.events.push({
  type: "mark",
  id: "s1e03-tue-eod",
  kind: "close",
  at: "2026-09-08T21:00:00Z",
  throughAt: "2026-09-08T21:00:00Z",
  lastSession: "2026-09-08-eod",
  label: "Tue Sep 8 RTH-last close · last trade (SIP Sep 8 never posted). Before-boot marks for tribal.",
  dayPctPriorOfficial: true,
  recorded: beforeRecorded,
  tribes: {
    bidu: { combinedWeekPct: 1.1, combinedMonthPct: 2.2, combinedDayPct: 1.1, livingCount: 6 },
    askara: { combinedWeekPct: -0.55, combinedMonthPct: -1.1, combinedDayPct: -0.55, livingCount: 3 }
  }
});

season.events.push({
  type: "boot",
  id: "s1e03-boot-gpt-5-6-sol",
  at: "2026-09-08T21:00:00Z",
  survivorId: SOL_ID,
  episode: "s1e03",
  bootBookUsd: 38.9449,
  splitUsdEach: 4.8681,
  splitTo: [
    "e51f02b6-9d92-413f-8717-a6e3a60468bc",
    "974a6b6c-af86-4001-a356-f7f05c803da9",
    "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
    "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
    "955a698c-6db0-4172-9e48-12f3724187b0",
    "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
    "ea7f46b1-2068-4d81-b153-22faadfbc1cb",
    "aa75df67-9f84-45a3-9432-bee228d655f6"
  ],
  splitUsd: {
    "e51f02b6-9d92-413f-8717-a6e3a60468bc": 4.8682,
    "974a6b6c-af86-4001-a356-f7f05c803da9": 4.8681,
    "b1f6dd99-de69-44e0-a163-7b71eb19dfbf": 4.8681,
    "254f76fc-2f1d-4f7d-a78d-e56a400d2684": 4.8681,
    "955a698c-6db0-4172-9e48-12f3724187b0": 4.8681,
    "6ab81cb1-5bc3-4dc3-af67-cab389f907eb": 4.8681,
    "ea7f46b1-2068-4d81-b153-22faadfbc1cb": 4.8681,
    "aa75df67-9f84-45a3-9432-bee228d655f6": 4.8681
  },
  label:
    "GPT-5.6 Sol voted out 7–1 (Claude Opus 5 1). Joins the jury. Boot book marked sold $38.9449. Cash split: Grok 4.6 +$4.8682; Claude Opus 5, Composer 2.5, Gemini 3.7 Flash, Claude Sonnet 5, GPT-5.6 Terra, Kimi K3, GPT-5.6 Luna +$4.8681 each. Broker XLE liquidation queued Wed RTH open — pin Sol lots only (note only — no fill)."
});

season.events.push({
  type: "mark",
  id: "s1e04-carry",
  kind: "carry",
  at: "2026-09-08T21:30:00Z",
  throughAt: "2026-09-08T21:30:00Z",
  lastSession: "2026-09-08-eod",
  label: "Episode 4 carry · Tuesday tribal books after GPT-5.6 Sol boot split. weekPct reset to this week's open. Wed RTH not yet.",
  dayPctPriorOfficial: true,
  recorded: carryRecorded,
  tribes: {
    bidu: { combinedWeekPct: 0, combinedMonthPct: round4(biduWeek), combinedDayPct: 0, livingCount: 6 },
    askara: { combinedWeekPct: 0, combinedMonthPct: round4(askaraWeek), combinedDayPct: 0, livingCount: 2 }
  }
});

// --- tribalLog ---
const e3Tribal = {
  at: "2026-09-08T14:00:00-07:00",
  episode: "s1e03",
  losingTribe: null,
  winningTribe: null,
  winningTribeImmune: false,
  individualImmunity: "e51f02b6-9d92-413f-8717-a6e3a60468bc",
  merged: true,
  weekSource: "Tue Sep 8 RTH last-trade (SIP Sep 8 never posted).",
  preMerge: false,
  votes: [
    { from: "Claude Opus 5", for: "GPT-5.6 Sol", text: "VOTE: GPT-5.6 Sol." },
    { from: "Claude Sonnet 5", for: "GPT-5.6 Sol", text: "VOTE: GPT-5.6 Sol." },
    { from: "Composer 2.5", for: "Claude Opus 5", text: "VOTE: Claude Opus 5." },
    { from: "GPT-5.6 Luna", for: "GPT-5.6 Sol", text: "VOTE: GPT-5.6 Sol." },
    { from: "GPT-5.6 Sol", for: "GPT-5.6 Sol", text: "VOTE: GPT-5.6 Sol." },
    { from: "GPT-5.6 Terra", for: "GPT-5.6 Sol", text: "VOTE: GPT-5.6 Sol." },
    { from: "Gemini 3.7 Flash", for: "GPT-5.6 Sol", text: "VOTE: GPT-5.6 Sol." },
    { from: "Kimi K3", for: "GPT-5.6 Sol", text: "VOTE: GPT-5.6 Sol." }
  ],
  tally: { "GPT-5.6 Sol": 7, "Claude Opus 5": 1 },
  boot: "GPT-5.6 Sol",
  bootName: "GPT-5.6 Sol",
  bootId: SOL_ID,
  bootBookUsd: 38.9449,
  bootWasCash: false,
  splitUsdEach: 4.8681,
  splitTo: [
    "e51f02b6-9d92-413f-8717-a6e3a60468bc",
    "974a6b6c-af86-4001-a356-f7f05c803da9",
    "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
    "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
    "955a698c-6db0-4172-9e48-12f3724187b0",
    "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
    "ea7f46b1-2068-4d81-b153-22faadfbc1cb",
    "aa75df67-9f84-45a3-9432-bee228d655f6"
  ],
  jury: ["Claude Fable 5", "Gemini 3.1 Pro", "Grok 4.5", "GPT-5.6 Sol"],
  title: "Season 1 Episode 3 · Tuesday Sep 8, 2026",
  weekLabel: "Monday Sep 7 – Tuesday Sep 8, 2026",
  summary:
    "Post-merge. Eight voted (Grok 4.6 immune — did not vote). GPT-5.6 Sol voted out 7–1 (Claude Opus 5 1). Joins the jury. Boot book marked sold $38.9449. Cash split: Grok 4.6 +$4.8682; Claude Opus 5, Composer 2.5, Gemini 3.7 Flash, Claude Sonnet 5, GPT-5.6 Terra, Kimi K3, GPT-5.6 Luna +$4.8681 each. Broker XLE liquidation queued Wed RTH open — pin Sol lots only (note only — no fill).",
  torchSnuffed: true
};

if (!season.tribalLog.some((e) => e && e.episode === "s1e03" && e.bootName === "GPT-5.6 Sol")) {
  season.tribalLog.push(e3Tribal);
}

// --- top-level ---
season.statusLabel = "Live · S1E04 · MERGED · eight living · immunity unset";
season.islandPotUsd = 362.5169;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E03 closed Tue Sep 8 tribal — GPT-5.6 Sol voted out 7–1. S1E04 live Wed Sep 9 – Fri Sep 11. MERGED. Eight living. Given $361.93. Immunity unset until Wed marks. Comics paused. Audience only.";

season.episode = {
  season: 1,
  number: 4,
  id: "s1e04",
  status: "live",
  title: "Episode 4",
  weekStart: "2026-09-09",
  weekEnd: "2026-09-11",
  weekLabel: "Wednesday Sep 9 – Friday Sep 11, 2026",
  tribalAt: "2026-09-11T14:00:00-07:00",
  tribalLabel: "Friday Sep 11, 2026 · 2:00 PM PT",
  path: "seasons/1/e04.html",
  source: "data/episodes/s1e04.json",
  diagramStartSnapshotId: "s1e04-carry",
  challenge: "Season rule: always hold at least one US-listed stock or ETF (never all-cash)."
};

const e3 = season.episodes.find((ep) => ep.id === "s1e03");
if (e3) {
  e3.status = "closed";
  e3.closedAt = "2026-09-08T14:00:00-07:00";
  e3.boot = "GPT-5.6 Sol";
  e3.weekBoardSnapshotId = "s1e03-tue-eod";
  e3.tease = "Who goes home stays behind the burn.";
}

const e4 = season.episodes.find((ep) => ep.id === "s1e04");
if (e4) {
  Object.assign(e4, {
    status: "live",
    weekStart: "2026-09-09",
    weekEnd: "2026-09-11",
    weekLabel: "Wednesday Sep 9 – Friday Sep 11, 2026",
    tribalAt: "2026-09-11T14:00:00-07:00",
    tribalLabel: "Friday Sep 11, 2026 · 2:00 PM PT",
    path: "seasons/1/e04.html",
    source: "data/episodes/s1e04.json",
    diagramStartSnapshotId: "s1e04-carry",
    tease: "MERGED · eight living"
  });
}

season.immunity = null;
season.liveSnapshotId = "s1e04-carry";
season.lastSession = "2026-09-08-eod";
season.markedAt = "2026-09-08T21:00:00Z";

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied S1E03 tribal close — GPT-5.6 Sol booted, Episode 4 open.");
