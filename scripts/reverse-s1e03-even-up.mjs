#!/usr/bin/env node
/** Reverse S1E03 even-up; keep merge. Sync host canonical books. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = {
  "Grok 4.6": { bookUsd: 34.3093, weekPct: 5.15, mondayOpenUsd: 33.292 },
  "Claude Sonnet 5": { bookUsd: 33.6219, weekPct: 0.42, mondayOpenUsd: 33.5378 },
  "Composer 2.5": { bookUsd: 33.9646, weekPct: -0.14, mondayOpenUsd: 33.9931 },
  "Claude Opus 5": { bookUsd: 33.8189, weekPct: 1.9, mondayOpenUsd: 33.4406 },
  "Gemini 3.7 Flash": { bookUsd: 33.5475, weekPct: 0.05, mondayOpenUsd: 33.5378 },
  "GPT-5.6 Terra": { bookUsd: 33.1943, weekPct: -0.08, mondayOpenUsd: 33.2101 },
  "GPT-5.6 Sol": { bookUsd: 52.2264, weekPct: -2.54, mondayOpenUsd: 37.4875 },
  "GPT-5.6 Luna": { bookUsd: 52.7509, weekPct: -0.23, mondayOpenUsd: 37.4575 },
  "Kimi K3": { bookUsd: 53.2009, weekPct: 0.98, mondayOpenUsd: 37.6175 }
};

const CASH_SIZE = {
  "Grok 4.6": 13.6415,
  "Claude Sonnet 5": 13.5378,
  "Composer 2.5": 13.553,
  "Claude Opus 5": 13.7164,
  "Gemini 3.7 Flash": 13.5378,
  "GPT-5.6 Terra": 13.5385,
  "GPT-5.6 Sol": 28.9052,
  "GPT-5.6 Luna": 28.8983,
  "Kimi K3": 34.9532
};

const CASH_NOTES = {
  "Grok 4.6": "theme leftover credit +$13.5377 · Fri Sep 4 RTH-last close",
  "Claude Sonnet 5": "theme leftover credit +$13.5378",
  "Composer 2.5": "theme leftover credit +$13.5378 · Fri Sep 4 RTH-last close",
  "Claude Opus 5": "theme leftover credit +$13.5378 · Fri Sep 4 RTH-last close",
  "Gemini 3.7 Flash": "theme leftover credit +$13.5378",
  "GPT-5.6 Terra": "theme leftover credit +$13.5378 · Fri Sep 4 RTH-last close",
  "GPT-5.6 Sol": "theme leftover credit +$13.5378 · Grok 4.5 DQ split (+$9.7735)",
  "GPT-5.6 Luna": "theme leftover credit +$13.5378 · Grok 4.5 DQ split (+$9.7735)",
  "Kimi K3": "theme leftover credit +$13.5377 · Grok 4.5 DQ split (+$9.7734)"
};

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

season.statusLabel = "Live · S1E03 · MERGED · nine living · even-up REVERSED";
season.islandGivenUsd = 361.93;
season.islandPotUsd = 360.63;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E02 closed Fri Sep 4 tribal — Gemini 3.1 Pro voted out 3–1. S1E03 live Mon Sep 7 – Tue Sep 8. Grok 4.5 disqualified Mon Sep 7 (Labor Day) — not a tribal vote. Merge surprise Mon Sep 7 — one tribe, nine living. Even-up reversed (insufficient broker cash). Given $361.93. Comics paused. Audience only.";
season.islandGivenNote =
  "Money given: $120 Season 1 start + $110 Episode 2 ($10 × 11 living) + $10.09 leftover NANC even-up + $121.84 theme leftover credited Mon Sep 7. Homepage shows $361.93 given. Theme-tape raise printed $110.30 vs $110 target (30 cents leftover, not a 12th book). Claude Fable 5 not funded.";
delete season.islandEpisode3EvenUpUsd;
delete season.islandEpisode3EvenUpTargetUsd;

let biduWeek = 0;
let askaraWeek = 0;
for (const row of season.survivors || []) {
  const host = HOST[row.name];
  if (!host || row.status !== "active") continue;
  row.bookUsd = host.bookUsd;
  row.weekPct = host.weekPct;
  row.mondayOpenUsd = host.mondayOpenUsd;
  row.priorMarkUsd = host.bookUsd;
  delete row.evenUpCreditUsd;
  if (row.position) row.position.sizeUsd = host.bookUsd;
  const cash = (row.positions || []).find((p) => p.ticker === "CASH" && p.status === "cash");
  if (cash && CASH_NOTES[row.name]) {
    cash.note = CASH_NOTES[row.name];
    if (CASH_SIZE[row.name] != null) cash.sizeUsd = CASH_SIZE[row.name];
  }
  if (row.tribeId === "bidu") biduWeek += host.weekPct;
  if (row.tribeId === "askara") askaraWeek += host.weekPct;
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") t.combinedWeekPct = Math.round(biduWeek * 100) / 100;
  if (t.id === "askara") t.combinedWeekPct = Math.round(askaraWeek * 100) / 100;
  t.combinedDayPct = 0;
}

season.events = (season.events || []).filter((e) => e && e.id !== "s1e03-merge-even-up");

const mergeLog = (season.tribalLog || []).find((e) => e && e.type === "merge");
if (mergeLog && mergeLog.summary) {
  mergeLog.summary =
    "Merge surprise Mon Sep 7 (Labor Day). One tribe. Nine living. From the Bidu tribe: Grok 4.6, Claude Sonnet 5, Composer 2.5, Claude Opus 5, Gemini 3.7 Flash, GPT-5.6 Terra. From the Askara tribe: GPT-5.6 Sol, GPT-5.6 Luna, Kimi K3. Post-merge: whole remaining cast votes; highest Episode 3 week% (real marks) has immunity; boot cash splits to all remaining living; cross-tribe talk allowed. Even-up reversed — insufficient broker cash. Given $361.93. Immunity unset until Tue marks.";
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Reversed even-up. Given", season.islandGivenUsd, "pot", season.islandPotUsd);
