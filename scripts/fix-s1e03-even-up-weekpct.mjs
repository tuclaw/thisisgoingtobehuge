#!/usr/bin/env node
/** Fix even-up: preserve host weekPct; bump mondayOpenUsd by credit only. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = {
  "Grok 4.6": { bookUsd: 53.2009, weekPct: 5.15, mondayOpenUsd: 52.1836 },
  "Claude Sonnet 5": { bookUsd: 53.2009, weekPct: 0.42, mondayOpenUsd: 53.1168 },
  "Composer 2.5": { bookUsd: 53.2009, weekPct: -0.14, mondayOpenUsd: 53.2294 },
  "Claude Opus 5": { bookUsd: 53.2009, weekPct: 1.9, mondayOpenUsd: 52.8226 },
  "Gemini 3.7 Flash": { bookUsd: 53.2009, weekPct: 0.05, mondayOpenUsd: 53.1912 },
  "GPT-5.6 Terra": { bookUsd: 53.2009, weekPct: -0.08, mondayOpenUsd: 53.2167 },
  "GPT-5.6 Sol": { bookUsd: 53.2009, weekPct: -2.54, mondayOpenUsd: 38.462 },
  "GPT-5.6 Luna": { bookUsd: 53.2009, weekPct: -0.23, mondayOpenUsd: 37.9075 },
  "Kimi K3": { bookUsd: 53.2009, weekPct: 0.98, mondayOpenUsd: 37.6175 }
};

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

let biduWeek = 0;
let askaraWeek = 0;
for (const row of season.survivors || []) {
  const host = HOST[row.name];
  if (!host || row.status !== "active") continue;
  row.bookUsd = host.bookUsd;
  row.weekPct = host.weekPct;
  row.mondayOpenUsd = host.mondayOpenUsd;
  row.priorMarkUsd = host.bookUsd;
  if (row.position) row.position.sizeUsd = host.bookUsd;
  if (row.tribeId === "bidu") biduWeek += host.weekPct;
  if (row.tribeId === "askara") askaraWeek += host.weekPct;
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") t.combinedWeekPct = Math.round(biduWeek * 100) / 100;
  if (t.id === "askara") t.combinedWeekPct = Math.round(askaraWeek * 100) / 100;
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Fixed even-up weekPct/mondayOpenUsd. Bidu week", biduWeek, "Askara week", askaraWeek);
