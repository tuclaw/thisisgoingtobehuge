#!/usr/bin/env node
/** S1E07 tribal close — boot Composer 2.5, open Episode 8. Merge canonical overlay onto full host ledger. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const canonicalPath =
  process.argv[2] || join(root, "data", "host", "s1e07-tribal-canonical.json");

const BOOT_AT = "2026-09-22T21:00:00Z";
const COMPOSER_ID = "b1f6dd99-de69-44e0-a163-7b71eb19dfbf";
const SPLIT_TO = [
  "955a698c-6db0-4172-9e48-12f3724187b0",
  "974a6b6c-af86-4001-a356-f7f05c803da9",
  "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "aa75df67-9f84-45a3-9432-bee228d655f6"
];
const SPLIT_EACH = 19.2674;

let season;
let canon;
try {
  season = JSON.parse(readFileSync(path, "utf8"));
  canon = JSON.parse(readFileSync(canonicalPath, "utf8"));
} catch (err) {
  console.error(err);
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e07-tue-tribal")) {
  console.error("s1e07-tue-tribal already present — abort");
  process.exit(1);
}

const canonEod = (canon.events || []).find((e) => e && e.id === "s1e07-tue-eod-rth");
const canonTribal = (canon.events || []).find((e) => e && e.id === "s1e07-tue-tribal");
if (!canonEod || !canonTribal) {
  console.error("canonical missing s1e07-tue-eod-rth or s1e07-tue-tribal");
  process.exit(1);
}

const hasEod = (season.events || []).some((e) => e && e.id === "s1e07-tue-eod-rth");
if (!hasEod) {
  season.events.push(canonEod);
}
season.events.push({
  type: "boot",
  id: "s1e07-boot-composer-2-5",
  at: BOOT_AT,
  survivorId: COMPOSER_ID,
  episode: "s1e07",
  bootBookUsd: 77.0694,
  splitUsdEach: SPLIT_EACH,
  splitTo: SPLIT_TO,
  splitUsd: Object.fromEntries(SPLIT_TO.map((id) => [id, SPLIT_EACH])),
  label:
    "MERGED. GPT-5.6 Terra immune (−0.11% RTH — did not vote). Parchment Composer 2.5 2 · GPT-5.6 Luna 1 · Claude Opus 5 1. Composer 2.5 voted out. Joins the jury. Boot book marked sold $77.0694. Cash split $19.2674 each to four living. Broker Composer INTC lot liquidation queued Wed Sep 23 RTH open — pin Composer lots only (note only).",
  tally: {
    "Composer 2.5": 2,
    "GPT-5.6 Luna": 1,
    "Claude Opus 5": 1
  }
});
season.events.push(canonTribal);

const carryRecorded = {};
for (const s of canon.survivors || []) {
  if (s.status !== "active") continue;
  carryRecorded[s.id] = {
    bookUsd: s.bookUsd,
    weekPct: 0,
    dayPct: 0,
    monthPct: s.monthPct ?? 0,
    priorMarkUsd: s.priorMarkUsd ?? s.bookUsd,
    eodMarkUsd: s.bookUsd
  };
}

season.events.push({
  type: "mark",
  id: "s1e08-carry",
  kind: "carry",
  at: "2026-09-22T21:30:00Z",
  throughAt: "2026-09-22T21:30:00Z",
  lastSession: "2026-09-22-tribal",
  label:
    "Episode 8 carry · Tuesday tribal books after Composer 2.5 boot split. weekPct reset to this week's open. Wed RTH not yet.",
  dayPctPriorOfficial: true,
  recorded: carryRecorded,
  potUsd: canon.islandPotUsd ?? 382.2148
});

const overlayKeys = [
  "episodes",
  "status",
  "statusLabel",
  "tribalLog",
  "immunity",
  "islandPotUsd",
  "islandGivenUsd",
  "winnerId",
  "quotes",
  "tribes",
  "notes",
  "liveSnapshotId",
  "lastSource",
  "lastSession",
  "markedAt",
  "markLabel",
  "lastSnapshotId",
  "lastRemakeAt",
  "dayPctBasis",
  "weekPctBasis",
  "sipMissingBanner"
];
for (const key of overlayKeys) {
  if (canon[key] !== undefined) season[key] = canon[key];
}

season.survivors = canon.survivors;
const composerRow = (season.survivors || []).find((s) => s.name === "Composer 2.5");
if (composerRow) {
  Object.assign(composerRow, {
    status: "voted-out",
    bookUsd: 0,
    weekPct: 0,
    immune: false,
    jury: true,
    votedOutAt: BOOT_AT,
    votedOutEpisode: "s1e07",
    bootBookUsd: 77.0694,
    cashUsd: null,
    tickersSummary: "CASH",
    position: {
      action: "SOLD",
      ticker: "CASH",
      sizeUsd: 0,
      status: "boot-split",
      note: "voted out Tue Sep 22 tribal"
    },
    positions: [
      {
        action: "SOLD",
        ticker: "CASH",
        qty: null,
        avg: null,
        sizeUsd: 0,
        status: "boot-split",
        note: "voted out Tue Sep 22 tribal"
      }
    ]
  });
}
for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 3;
    t.combinedWeekPct = 0;
    t.combinedDayPct = 0;
    t.combinedMonthPct = 0;
  }
  if (t.id === "askara") {
    t.livingCount = 1;
    t.combinedWeekPct = 0;
    t.combinedDayPct = 0;
  }
}
const e6Listed = (season.episodes || []).find((ep) => ep && ep.id === "s1e06");
const e7Listed = (season.episodes || []).find((ep) => ep && ep.id === "s1e07");
if (e6Listed) e6Listed.tease = "MERGED · tribal closed";
if (e7Listed) e7Listed.tease = "MERGED · tribal closed";
const tribalEntry = (season.tribalLog || [])[8];
if (tribalEntry && tribalEntry.bootName === "Composer 2.5") {
  tribalEntry.summary =
    "MERGED. GPT-5.6 Terra immune (−0.11% RTH — did not vote). Parchment Composer 2.5 2 · GPT-5.6 Luna 1 · Claude Opus 5 1. Composer 2.5 voted out. Joins the jury. Boot book marked sold $77.0694. Cash split $19.2674 each to four living. Broker Composer INTC lot liquidation queued Wed Sep 23 RTH open — pin Composer lots only (note only).";
  tribalEntry.title = "Season 1 Episode 7 · Tuesday Sep 22, 2026";
  tribalEntry.torchSnuffed = true;
  tribalEntry.brokerLiqPending = {
    survivor: "Composer 2.5",
    when: "2026-09-23 RTH open",
    pin: "Composer lots only",
    note: "INTC lots — pin Composer lots only; no after-hours fractionals"
  };
}

const liveEp = (season.episodes || []).find((ep) => ep && ep.status === "live");
season.episode = liveEp || season.episode;
if (typeof season.episode === "number") {
  season.episode = liveEp;
}
season.episode = season.episode || liveEp;

if (!season.markedAt) season.markedAt = BOOT_AT;

season.notes =
  "Season live. S1E08 Wed Sep 23 – Fri Sep 25. MERGED. Four living. Composer 2.5 voted out Tue Sep 22 tribal. Given $361.93. Pot $382.2148. Episode 8 open carry. Broker Composer INTC lot liquidation queued Wed Sep 23 RTH open (pin Composer lots only — note only). Comics paused. Audience only. Tribal Fri Sep 25 2:00 PM PT.";

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied S1E07 tribal close — Composer 2.5 booted, Episode 8 open.");
