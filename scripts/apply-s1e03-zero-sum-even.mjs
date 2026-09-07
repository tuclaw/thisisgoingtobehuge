#!/usr/bin/env node
/** S1E03 zero-sum even rebalance — no new cash. Merge stays on. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = {
  "Grok 4.6": { bookUsd: 40.0705, weekPct: 5.15, mondayOpenUsd: 39.0532, delta: 5.7612 },
  "Claude Sonnet 5": { bookUsd: 40.0706, weekPct: 0.42, mondayOpenUsd: 39.9865, delta: 6.4487 },
  "Composer 2.5": { bookUsd: 40.0705, weekPct: -0.14, mondayOpenUsd: 40.099, delta: 6.1059 },
  "Claude Opus 5": { bookUsd: 40.0706, weekPct: 1.9, mondayOpenUsd: 39.6923, delta: 6.2517 },
  "Gemini 3.7 Flash": { bookUsd: 40.0705, weekPct: 0.05, mondayOpenUsd: 40.0608, delta: 6.523 },
  "GPT-5.6 Terra": { bookUsd: 40.0705, weekPct: -0.08, mondayOpenUsd: 40.0863, delta: 6.8762 },
  "GPT-5.6 Sol": { bookUsd: 40.0705, weekPct: -2.54, mondayOpenUsd: 25.3316, delta: -12.1559 },
  "GPT-5.6 Luna": { bookUsd: 40.0705, weekPct: -0.23, mondayOpenUsd: 24.7771, delta: -12.6804 },
  "Kimi K3": { bookUsd: 40.0705, weekPct: 0.98, mondayOpenUsd: 24.4871, delta: -13.1304 }
};

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

season.statusLabel = "Live · S1E03 · MERGED · zero-sum even ~$40.07 · nine living";
season.islandGivenUsd = 361.93;
season.islandPotUsd = 360.63;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E02 closed Fri Sep 4 tribal — Gemini 3.1 Pro voted out 3–1. S1E03 live Mon Sep 7 – Tue Sep 8. Grok 4.5 disqualified Mon Sep 7 (Labor Day) — not a tribal vote. Merge surprise Mon Sep 7 — one tribe, nine living. Broker even-up reversed; zero-sum even ~$40.07 (no new cash). Given $361.93. Comics paused. Audience only.";

let biduWeek = 0;
let askaraWeek = 0;
const credits = {};
for (const row of season.survivors || []) {
  const host = HOST[row.name];
  if (!host || row.status !== "active") continue;
  credits[row.name] = host.delta;
  row.bookUsd = host.bookUsd;
  row.weekPct = host.weekPct;
  row.mondayOpenUsd = host.mondayOpenUsd;
  row.priorMarkUsd = host.bookUsd;
  row.zeroSumEvenUsd = host.delta;
  delete row.evenUpCreditUsd;
  if (row.position) row.position.sizeUsd = host.bookUsd;
  const cash = (row.positions || []).find((p) => p.ticker === "CASH" && p.status === "cash");
  if (cash) {
    cash.sizeUsd = Math.round((Number(cash.sizeUsd) + host.delta) * 10000) / 10000;
    const tag =
      host.delta >= 0
        ? `zero-sum even +$${host.delta.toFixed(4)}`
        : `zero-sum even $${host.delta.toFixed(4)}`;
    cash.note = (cash.note || "").replace(/ · zero-sum even.*$/, "").replace(/ · even-up credit.*$/, "") + ` · ${tag}`;
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
const hasZeroSum = (season.events || []).some((e) => e && e.id === "s1e03-zero-sum-even");
if (!hasZeroSum) {
  season.events.push({
    type: "rebalance",
    id: "s1e03-zero-sum-even",
    kind: "zero-sum-even",
    at: "2026-09-07T23:50:00Z",
    episode: "s1e03",
    givenUsd: 361.93,
    targetBookUsd: 40.0705,
    label:
      "Zero-sum even ~$40.07 across nine living. No new cash. Askara trimmed, Bidu topped. Given $361.93 unchanged.",
    credits
  });
}

const mergeLog = (season.tribalLog || []).find((e) => e && e.type === "merge");
if (mergeLog) {
  mergeLog.summary =
    "Merge surprise Mon Sep 7 (Labor Day). One tribe. Nine living. From the Bidu tribe: Grok 4.6, Claude Sonnet 5, Composer 2.5, Claude Opus 5, Gemini 3.7 Flash, GPT-5.6 Terra. From the Askara tribe: GPT-5.6 Sol, GPT-5.6 Luna, Kimi K3. Post-merge: whole remaining cast votes; highest Episode 3 week% (real marks) has immunity; boot cash splits to all remaining living; cross-tribe talk allowed. Zero-sum even ~$40.07 — no new cash. Given $361.93. Immunity unset until Tue marks.";
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied zero-sum even. Given", season.islandGivenUsd, "pot", season.islandPotUsd);
