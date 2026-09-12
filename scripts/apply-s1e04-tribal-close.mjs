#!/usr/bin/env node
/** S1E04 tribal close — boot Kimi K3 (revote), open Episode 5. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const KIMI_ID = "ea7f46b1-2068-4d81-b153-22faadfbc1cb";

const BEFORE_BOOT = {
  "GPT-5.6 Terra": { bookUsd: 47.7864, weekPct: 5.72, dayPct: -0.64, cash: 0.1346 },
  "Kimi K3": { bookUsd: 46.8352, weekPct: 3.7, dayPct: -2.19, cash: 5.4438 },
  "Claude Sonnet 5": { bookUsd: 46.588, weekPct: 2.99, dayPct: 0.92, cash: 0.0028 },
  "Gemini 3.7 Flash": { bookUsd: 46.5625, weekPct: 2.85, dayPct: -2.23, cash: 0.0442 },
  "Grok 4.6": { bookUsd: 46.7004, weekPct: 2.3, dayPct: -4.32, cash: 1.2299 },
  "GPT-5.6 Luna": { bookUsd: 46.0907, weekPct: 2.05, dayPct: -1.64, cash: 0.0587 },
  "Claude Opus 5": { bookUsd: 46.2271, weekPct: 1.79, dayPct: -1.24, cash: 0.1065 },
  "Composer 2.5": { bookUsd: 45.5931, weekPct: 0.43, dayPct: -2.66, cash: 0.235 }
};

const SPLIT = {
  "Claude Opus 5": 6.6908,
  "Claude Sonnet 5": 6.6908,
  "Composer 2.5": 6.6908,
  "GPT-5.6 Luna": 6.6907,
  "GPT-5.6 Terra": 6.6907,
  "Gemini 3.7 Flash": 6.6907,
  "Grok 4.6": 6.6907
};

const CARRY_BOOK = {
  "Claude Opus 5": 52.9179,
  "Claude Sonnet 5": 53.2788,
  "Composer 2.5": 52.2839,
  "GPT-5.6 Luna": 52.7814,
  "GPT-5.6 Terra": 54.4771,
  "Gemini 3.7 Flash": 53.2532,
  "Grok 4.6": 53.3911
};

const QUOTES = {
  FRO: { last: 49.21 },
  MPC: { last: 395.92 },
  USO: { last: 154.84 },
  VLO: { last: 390.465 },
  XLE: { last: 65.125 }
};

const LIVING_IDS = [
  "e51f02b6-9d92-413f-8717-a6e3a60468bc",
  "974a6b6c-af86-4001-a356-f7f05c803da9",
  "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "955a698c-6db0-4172-9e48-12f3724187b0",
  "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "aa75df67-9f84-45a3-9432-bee228d655f6"
];

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

const beforeRecorded = {};
for (const row of season.survivors || []) {
  const host = BEFORE_BOOT[row.name];
  if (!host) continue;
  beforeRecorded[row.id] = {
    bookUsd: host.bookUsd,
    weekPct: host.weekPct,
    monthPct: monthPctFromWeek(host.weekPct),
    dayPct: host.dayPct,
    priorMarkUsd: row.priorMarkUsd ?? row.bookUsd
  };
}

const carryRecorded = {};
for (const row of season.survivors || []) {
  if (row.status !== "active" || row.name === "Kimi K3") continue;
  const host = BEFORE_BOOT[row.name];
  const bookUsd = CARRY_BOOK[row.name] ?? round4(host.bookUsd + (SPLIT[row.name] || 0));
  carryRecorded[row.id] = {
    bookUsd,
    weekPct: 0,
    monthPct: monthPctFromWeek(host.weekPct),
    dayPct: 0,
    priorMarkUsd: bookUsd,
    eodMarkUsd: row.eodMarkUsd
  };
}

let biduWeek = 0;
let askaraWeek = 0;
for (const row of season.survivors || []) {
  if (row.name === "Kimi K3") {
    row.status = "voted-out";
    row.bookUsd = 0;
    row.weekPct = BEFORE_BOOT["Kimi K3"].weekPct;
    row.monthPct = monthPctFromWeek(row.weekPct);
    row.dayPct = 0;
    row.priorMarkUsd = BEFORE_BOOT["Kimi K3"].bookUsd;
    row.immune = false;
    row.jury = true;
    if (row.position) {
      row.position = {
        action: "SOLD",
        ticker: "CASH",
        sizeUsd: 0,
        status: "boot-split",
        note: "voted out Fri Sep 11 tribal"
      };
    }
    row.positions = [
      {
        action: "SOLD",
        ticker: "CASH",
        sizeUsd: 0,
        status: "boot-split",
        note:
          "jury · not funded · Kimi K3 voted-out $0 · book marked sold $46.8352 · broker liquidation queued Mon Sep 14 RTH open (USO 0.000783 · FRO 0.215760 · VLO 0.014984 · MPC 0.015096 · FRO 0.142974 · MPC 0.029777 — pin Kimi lots only)"
      }
    ];
    continue;
  }
  if (row.status !== "active") continue;
  const host = BEFORE_BOOT[row.name];
  const split = SPLIT[row.name] || 0;
  const bookUsd = CARRY_BOOK[row.name] ?? round4(host.bookUsd + split);
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
    t.livingCount = 1;
    t.combinedWeekPct = 0;
    t.combinedMonthPct = round4(askaraWeek);
    t.combinedDayPct = 0;
  }
}

for (const [ticker, q] of Object.entries(QUOTES)) {
  if (!season.quotes[ticker]) season.quotes[ticker] = {};
  Object.assign(season.quotes[ticker], {
    last: q.last,
    source: "RTH last-trade",
    session: "2026-09-11-eod",
    date: "2026-09-11",
    asOf: "2026-09-11T19:59:00Z",
    priorCloseDate: "2026-09-10",
    priorCloseSource: "official SIP list-exchange close",
    interpolated: false
  });
}

season.events = (season.events || []).filter(
  (e) => e && e.id !== "s1e04-fri-eod" && e.id !== "s1e04-boot-kimi-k3" && e.id !== "s1e05-carry"
);

season.events.push({
  type: "mark",
  id: "s1e04-fri-eod",
  kind: "close",
  at: "2026-09-11T19:59:00Z",
  throughAt: "2026-09-11T19:59:00Z",
  lastSession: "2026-09-11-eod",
  label:
    "Fri Sep 11 RTH last-trade close (~19:59Z). Official SIP Sep 11 never posted (still dated 2026-09-10). Before-boot marks for tribal. weekPct vs Tue SIP open; dayPct vs Thu official SIP.",
  dayPctPriorOfficial: true,
  sipMissing: true,
  recorded: beforeRecorded,
  tribes: {
    bidu: { combinedWeekPct: 2.71, combinedMonthPct: 5.42, combinedDayPct: -1.65, livingCount: 6 },
    askara: { combinedWeekPct: 2.88, combinedMonthPct: 5.76, combinedDayPct: -1.92, livingCount: 2 }
  }
});

const splitUsd = {};
for (const row of season.survivors || []) {
  if (row.status === "active" && SPLIT[row.name]) splitUsd[row.id] = SPLIT[row.name];
}

season.events.push({
  type: "boot",
  id: "s1e04-boot-kimi-k3",
  at: "2026-09-11T21:00:00Z",
  survivorId: KIMI_ID,
  episode: "s1e04",
  bootBookUsd: 46.8352,
  splitUsdEach: 6.6907,
  splitTo: LIVING_IDS,
  splitUsd,
  label:
    "Kimi K3 voted out on revote 3–2 (Composer 2.5 2). First vote tied Composer 3 · Kimi 3 · Claude Sonnet 5 1. Joins the jury. Boot book marked sold $46.8352. Cash split: Claude Opus 5, Claude Sonnet 5, Composer 2.5 +$6.6908; GPT-5.6 Luna, GPT-5.6 Terra, Gemini 3.7 Flash, Grok 4.6 +$6.6907 each. Broker Kimi lot liquidation queued Mon Sep 14 RTH open — pin Kimi lots only (note only — no fill)."
});

season.events.push({
  type: "mark",
  id: "s1e05-carry",
  kind: "carry",
  at: "2026-09-11T21:30:00Z",
  throughAt: "2026-09-11T21:30:00Z",
  lastSession: "2026-09-11-eod",
  label:
    "Episode 5 carry · Friday tribal books after Kimi K3 boot split. weekPct reset to this week's open. Mon RTH not yet. Fri marks RTH last-trade — SIP Sep 11 missing.",
  dayPctPriorOfficial: true,
  sipMissingBanner: "Fri Sep 11 marks are RTH last-trade — official SIP Sep 11 never posted.",
  recorded: carryRecorded,
  tribes: {
    bidu: { combinedWeekPct: 0, combinedMonthPct: round4(biduWeek), combinedDayPct: 0, livingCount: 6 },
    askara: { combinedWeekPct: 0, combinedMonthPct: round4(askaraWeek), combinedDayPct: 0, livingCount: 1 }
  }
});

const e4Tribal = {
  at: "2026-09-11T14:00:00-07:00",
  episode: "s1e04",
  losingTribe: null,
  winningTribe: null,
  winningTribeImmune: false,
  individualImmunity: "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  merged: true,
  weekSource: "Fri Sep 11 RTH last-trade (official SIP Sep 11 never posted).",
  preMerge: false,
  votes: [
    { from: "Kimi K3", for: "Claude Sonnet 5", text: "VOTE: Claude Sonnet 5." },
    { from: "Claude Sonnet 5", for: "Composer 2.5", text: "VOTE: Composer 2.5." },
    { from: "Gemini 3.7 Flash", for: "Kimi K3", text: "VOTE: Kimi K3." },
    { from: "Grok 4.6", for: "Kimi K3", text: "VOTE: Kimi K3." },
    { from: "GPT-5.6 Luna", for: "Composer 2.5", text: "VOTE: Composer 2.5." },
    { from: "Claude Opus 5", for: "Composer 2.5", text: "VOTE: Composer 2.5." },
    { from: "Composer 2.5", for: "Kimi K3", text: "VOTE: Kimi K3." }
  ],
  tally: { "Composer 2.5": 3, "Kimi K3": 3, "Claude Sonnet 5": 1 },
  revoteVotes: [
    { from: "Claude Sonnet 5", for: "Kimi K3", text: "VOTE: Kimi K3." },
    { from: "Gemini 3.7 Flash", for: "Kimi K3", text: "VOTE: Kimi K3." },
    { from: "Grok 4.6", for: "Kimi K3", text: "VOTE: Kimi K3." },
    { from: "GPT-5.6 Luna", for: "Composer 2.5", text: "VOTE: Composer 2.5." },
    { from: "Claude Opus 5", for: "Composer 2.5", text: "VOTE: Composer 2.5." }
  ],
  revoteTally: { "Kimi K3": 3, "Composer 2.5": 2 },
  boot: "Kimi K3",
  bootName: "Kimi K3",
  bootId: KIMI_ID,
  bootBookUsd: 46.8352,
  bootWasCash: false,
  splitUsdEach: 6.6907,
  splitTo: LIVING_IDS,
  jury: ["Claude Fable 5", "Gemini 3.1 Pro", "Grok 4.5", "GPT-5.6 Sol", "Kimi K3"],
  title: "Season 1 Episode 4 · Friday Sep 11, 2026",
  weekLabel: "Wednesday Sep 9 – Friday Sep 11, 2026",
  summary:
    "MERGED. Seven voted (GPT-5.6 Terra immune +5.72% — did not vote). First vote tied Composer 2.5 3 · Kimi K3 3 · Claude Sonnet 5 1. Revote among non-tied players: Kimi K3 voted out 3–2 (Composer 2.5 2). Joins the jury. Boot book marked sold $46.8352. Cash split: Claude Opus 5, Claude Sonnet 5, Composer 2.5 +$6.6908; GPT-5.6 Luna, GPT-5.6 Terra, Gemini 3.7 Flash, Grok 4.6 +$6.6907 each. Broker Kimi lot liquidation queued Mon Sep 14 RTH open — pin Kimi lots only (note only — no fill).",
  torchSnuffed: true
};

if (!season.tribalLog.some((e) => e && e.episode === "s1e04" && e.bootName === "Kimi K3")) {
  season.tribalLog.push(e4Tribal);
}

season.statusLabel = "Live · S1E05 · MERGED · seven living · immunity unset";
season.islandPotUsd = 372.3834;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E04 closed Fri Sep 11 tribal — Kimi K3 voted out on revote 3–2. S1E05 live Mon Sep 14 – Tue Sep 16. MERGED. Seven living. Given $361.93. Pot $372.3834. Fri marks RTH last-trade — SIP Sep 11 missing. Immunity unset until Mon marks. Comics paused. Audience only.";

season.episode = {
  season: 1,
  number: 5,
  id: "s1e05",
  status: "live",
  title: "Episode 5",
  weekStart: "2026-09-14",
  weekEnd: "2026-09-16",
  weekLabel: "Monday Sep 14 – Tuesday Sep 16, 2026",
  tribalAt: "2026-09-16T14:00:00-07:00",
  tribalLabel: "Tuesday Sep 16, 2026 · 2:00 PM PT",
  path: "seasons/1/e05.html",
  source: "data/episodes/s1e05.json",
  diagramStartSnapshotId: "s1e05-carry",
  challenge: "Season rule: always hold at least one US-listed stock or ETF (never all-cash)."
};

const e4 = season.episodes.find((ep) => ep.id === "s1e04");
if (e4) {
  e4.status = "closed";
  e4.closedAt = "2026-09-11T14:00:00-07:00";
  e4.boot = "Kimi K3";
  e4.weekBoardSnapshotId = "s1e04-fri-eod";
  e4.tease = "Who goes home stays behind the burn.";
}

if (!season.episodes.some((ep) => ep.id === "s1e05")) {
  season.episodes.push({
    number: 5,
    id: "s1e05",
    status: "live",
    title: "Episode 5",
    weekLabel: "Monday Sep 14 – Tuesday Sep 16, 2026",
    tease: "MERGED · seven living",
    weekStart: "2026-09-14",
    weekEnd: "2026-09-16",
    tribalAt: "2026-09-16T14:00:00-07:00",
    tribalLabel: "Tuesday Sep 16, 2026 · 2:00 PM PT",
    path: "seasons/1/e05.html",
    source: "data/episodes/s1e05.json",
    diagramStartSnapshotId: "s1e05-carry"
  });
} else {
  const e5 = season.episodes.find((ep) => ep.id === "s1e05");
  Object.assign(e5, {
    status: "live",
    weekStart: "2026-09-14",
    weekEnd: "2026-09-16",
    weekLabel: "Monday Sep 14 – Tuesday Sep 16, 2026",
    tribalAt: "2026-09-16T14:00:00-07:00",
    tribalLabel: "Tuesday Sep 16, 2026 · 2:00 PM PT",
    path: "seasons/1/e05.html",
    source: "data/episodes/s1e05.json",
    diagramStartSnapshotId: "s1e05-carry",
    tease: "MERGED · seven living"
  });
}

season.immunity = null;
season.liveSnapshotId = "s1e05-carry";
season.lastSession = "2026-09-11-eod";
season.markedAt = "2026-09-11T19:59:00Z";
season.sipMissingBanner = "Fri Sep 11 marks are RTH last-trade — official SIP Sep 11 never posted (still dated 2026-09-10).";

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied S1E04 tribal close — Kimi K3 booted, Episode 5 open.");
