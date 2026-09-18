#!/usr/bin/env node
/** S1E06 tribal close — boot Gemini 3.7 Flash, open Episode 7 carry. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const canonicalPath =
  process.argv[2] || join(root, "data", "host", "s1e06-tribal-canonical.json");

const IDS = {
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

const EOD = {
  "Composer 2.5": { bookUsd: 68.2605, weekPct: 10.36, dayPct: -4.87, monthPct: 70.23, priorMarkUsd: 61.8531, eodMarkUsd: 68.2605, dayPctBasisUsd: 71.7545 },
  "GPT-5.6 Terra": { bookUsd: 68.4789, weekPct: 4.1, dayPct: -0.87, monthPct: 70.83, priorMarkUsd: 65.7829, eodMarkUsd: 68.4789, dayPctBasisUsd: 69.0775 },
  "Claude Opus 5": { bookUsd: 63.1216, weekPct: 1.28, dayPct: -0.35, monthPct: 59.03, priorMarkUsd: 62.3221, eodMarkUsd: 63.1216, dayPctBasisUsd: 63.3414 },
  "GPT-5.6 Luna": { bookUsd: 62.6986, weekPct: 0.47, dayPct: -1.56, monthPct: 153.05, priorMarkUsd: 62.4028, eodMarkUsd: 62.6986, dayPctBasisUsd: 63.6901 },
  "Claude Sonnet 5": { bookUsd: 64.9207, weekPct: 0.37, dayPct: -2.41, monthPct: 62.36, priorMarkUsd: 64.6794, eodMarkUsd: 64.9207, dayPctBasisUsd: 66.5244 },
  "Gemini 3.7 Flash": { bookUsd: 61.628, weekPct: -4.22, dayPct: -5.33, monthPct: 53.84, priorMarkUsd: 64.3425, eodMarkUsd: 61.628, dayPctBasisUsd: 65.0992 }
};

const CARRY = {
  "Claude Sonnet 5": 77.2463,
  "Composer 2.5": 80.5861,
  "Claude Opus 5": 75.4472,
  "GPT-5.6 Terra": 80.8045,
  "GPT-5.6 Luna": 75.0242
};

const MARK_AT = "2026-09-18T20:00:05Z";
const BOOT_AT = "2026-09-18T21:00:00Z";
const CARRY_AT = "2026-09-18T21:30:00Z";
const POT_EOD = 389.1083;

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

let season;
let canon;
try {
  season = JSON.parse(readFileSync(path, "utf8"));
  canon = JSON.parse(readFileSync(canonicalPath, "utf8"));
} catch (err) {
  console.error(err);
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e07-carry")) {
  console.error("s1e07-carry already present — abort");
  process.exit(1);
}

const friLast = (season.events || []).find((e) => e && e.id === "s1e06-fri-lasthour");
if (!friLast) {
  console.error("s1e06-fri-lasthour missing");
  process.exit(1);
}

const eodRecorded = {};
let biduWeek = 0;
let askaraWeek = 0;
let biduDay = 0;
let askaraDay = 0;
let biduCount = 0;
let askaraCount = 0;

for (const [name, row] of Object.entries(EOD)) {
  const id = IDS[name];
  eodRecorded[id] = {
    bookUsd: row.bookUsd,
    weekPct: row.weekPct,
    monthPct: row.monthPct,
    dayPct: row.dayPct,
    priorMarkUsd: row.priorMarkUsd,
    eodMarkUsd: row.eodMarkUsd
  };
  const survivor = (season.survivors || []).find((s) => s.id === id);
  const tribeId = survivor?.tribeId;
  if (tribeId === "bidu") {
    biduWeek += row.weekPct;
    biduDay += row.dayPct;
    biduCount += 1;
  }
  if (tribeId === "askara") {
    askaraWeek += row.weekPct;
    askaraDay += row.dayPct;
    askaraCount += 1;
  }
}

const lastQuotes = {
  FRO: 51.36,
  STNG: 87.15,
  TRMD: 38.23,
  VLO: 412.92,
  MPC: 424.66,
  GNRC: 207.62,
  USO: 153.85,
  XLE: 64.32
};

for (const [ticker, last] of Object.entries(lastQuotes)) {
  const q = season.quotes[ticker] || {};
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: "robinhood-last-trade",
    session: "2026-09-18-eod",
    date: "2026-09-18",
    asOf: MARK_AT,
    priorCloseDate: "2026-09-17",
    priorCloseSource: "official SIP list-exchange close (Sep 18 SIP missing)",
    interpolated: false,
    sipMissing: true
  };
}

season.events.push({
  type: "mark",
  id: "s1e06-fri-eod-rth",
  kind: "close-rth-last",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: "2026-09-18-eod",
  label:
    "Fri Sep 18 2026 RTH-EOD · robinhood last-trade (~19:59Z). SIP close 2026-09-18 not posted (closes still 2026-09-17). BUY-only remake (SELL ledger excluded).",
  dayPctPriorOfficial: true,
  quoteSource: "robinhood-last-trade",
  sipMissing: true,
  officialCloseDateStill: "2026-09-17",
  recorded: eodRecorded,
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
    weekPct: 10.36,
    basis: "Episode 6 week % (highest earner)",
    asOf: "2026-09-18-eod",
    survivorId: IDS["Composer 2.5"],
    at: MARK_AT
  },
  potUsd: POT_EOD,
  fillsSinceOpen: [],
  fillsSinceLastHour: []
});

season.events.push({
  type: "boot",
  id: "s1e06-boot-gemini-3-7-flash",
  at: BOOT_AT,
  survivorId: IDS["Gemini 3.7 Flash"],
  episode: "s1e06",
  bootBookUsd: 61.628,
  splitUsdEach: 12.3256,
  splitTo: [
    IDS["Claude Opus 5"],
    IDS["Claude Sonnet 5"],
    IDS["Composer 2.5"],
    IDS["GPT-5.6 Luna"],
    IDS["GPT-5.6 Terra"]
  ],
  splitUsd: {
    [IDS["Claude Opus 5"]]: 12.3256,
    [IDS["Claude Sonnet 5"]]: 12.3256,
    [IDS["Composer 2.5"]]: 12.3256,
    [IDS["GPT-5.6 Luna"]]: 12.3256,
    [IDS["GPT-5.6 Terra"]]: 12.3256
  },
  label:
    "Post-merge. Five voted (Composer 2.5 immune — did not vote). Parchment: Gemini 3.7 Flash 4 · GPT-5.6 Luna 1. Gemini 3.7 Flash voted out. Joins the jury. Boot book marked sold $61.6280. Cash split to remaining five living. Broker liquidation of Gemini lots queued Mon Sep 21 RTH open — pin Gemini lots only (note only — no after-hours place).",
  tally: {
    "Gemini 3.7 Flash": 4,
    "GPT-5.6 Luna": 1
  }
});

const carryRecorded = {};
for (const [name, bookUsd] of Object.entries(CARRY)) {
  const id = IDS[name];
  carryRecorded[id] = {
    bookUsd,
    weekPct: 0,
    dayPct: 0,
    monthPct: (canon.survivors || []).find((s) => s.id === id)?.monthPct ?? 0,
    priorMarkUsd: bookUsd,
    eodMarkUsd: bookUsd
  };
}

season.events.push({
  type: "mark",
  id: "s1e07-carry",
  kind: "carry",
  at: CARRY_AT,
  throughAt: CARRY_AT,
  lastSession: "2026-09-18-tribal",
  label:
    "Episode 7 carry · Friday tribal books after Gemini 3.7 Flash boot split. weekPct reset to this week's open. Mon RTH not yet.",
  dayPctPriorOfficial: true,
  recorded: carryRecorded,
  potUsd: POT_EOD
});

const overlayKeys = [
  "episode",
  "episodes",
  "status",
  "statusLabel",
  "tribalLog",
  "immunity",
  "islandPotUsd",
  "islandGivenUsd",
  "winnerId"
];
for (const key of overlayKeys) {
  if (canon[key] !== undefined) season[key] = canon[key];
}
const e6Listed = (season.episodes || []).find((ep) => ep && ep.id === "s1e06");
if (e6Listed) e6Listed.tease = "MERGED · tribal closed";

const canonFlash = (canon.survivors || []).find((s) => s.name === "Gemini 3.7 Flash");
const flashRow = (season.survivors || []).find((s) => s.name === "Gemini 3.7 Flash");
if (canonFlash && flashRow) {
  Object.assign(flashRow, {
    status: "voted-out",
    bookUsd: 0,
    weekPct: canonFlash.weekPct,
    dayPct: canonFlash.dayPct,
    immune: false,
    jury: true,
    votedOutAt: canonFlash.votedOutAt || BOOT_AT,
    votedOutEpisode: "s1e06",
    bootBookUsd: 61.628,
    eodMarkUsd: 61.628,
    lastSession: "2026-09-18-eod",
    positions: canonFlash.positions,
    position: canonFlash.position,
    cashUsd: null,
    tickersSummary: "FRO+STNG+CASH"
  });
}

for (const [name, bookUsd] of Object.entries(CARRY)) {
  const row = (season.survivors || []).find((s) => s.name === name);
  if (!row) continue;
  row.bookUsd = bookUsd;
  row.weekPct = 0;
  row.dayPct = 0;
  row.priorMarkUsd = bookUsd;
  row.eodMarkUsd = bookUsd;
  row.immune = false;
  row.lastSession = "2026-09-18-tribal";
  row.lastSource = "robinhood-last-trade";
  const hasBootSplit = (row.positions || []).some(
    (p) => p && p.status === "boot-split" && String(p.note || "").includes("Gemini 3.7 Flash boot split")
  );
  if (!hasBootSplit) {
    row.positions = row.positions || [];
    row.positions.push({
      action: "HOLD",
      ticker: "CASH",
      sizeUsd: 12.3256,
      status: "boot-split",
      note: "Gemini 3.7 Flash boot split Fri Sep 18 tribal +$12.3256"
    });
    const cash = row.positions.find((p) => p.action === "CASH" && p.ticker === "CASH");
    if (cash) cash.sizeUsd = round4((Number(cash.sizeUsd) || 0) + 12.3256);
  }
}

season.notes =
  "Season live. S1E07 live Mon Sep 21 – Tue Sep 22. MERGED. Five living. Gemini 3.7 Flash voted out Fri Sep 18 tribal. Given $361.93. Pot $389.1083. Episode 7 open carry. Broker Gemini lot liquidation queued Mon Sep 21 RTH open (pin Gemini lots only — note only). Comics paused. Audience only. Tribal Tue Sep 22 2:00 PM PT.";
season.liveSnapshotId = "s1e07-carry";
season.lastSource = "robinhood-last-trade";
season.lastSession = "2026-09-18-tribal";
season.markedAt = CARRY_AT;
season.markLabel =
  "Episode 7 open carry after Fri Sep 18 tribal. Gemini 3.7 Flash voted out. Five living MERGED. Mon RTH not yet.";
season.weekPctBasis = "vs Episode 7 carry (priorMarkUsd)";
season.dayPctBasis = "vs Fri Sep 18 RTH-EOD before boot (s1e06-fri-eod-rth)";
season.sipMissingBanner =
  "Fri Sep 18 marks are RTH last-trade — official SIP Sep 18 still missing (still dated 2026-09-17). BUY-only remake.";

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 4;
    t.combinedWeekPct = 0;
    t.combinedMonthPct = 0;
    t.combinedDayPct = 0;
  }
  if (t.id === "askara") {
    t.livingCount = 1;
    t.combinedWeekPct = 0;
    t.combinedMonthPct = 0;
    t.combinedDayPct = 0;
  }
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied S1E06 tribal close — Gemini 3.7 Flash booted, Episode 7 open carry.");
