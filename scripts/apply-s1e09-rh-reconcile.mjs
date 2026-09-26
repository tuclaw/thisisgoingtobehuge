#!/usr/bin/env node
/** Drop the duplicate Claude Sonnet 5 boot-split cash lots and stamp s1e09-carry.
 *
 * After tribal, living CASH already included +$30.2904. A second boot-split CASH
 * lot of the same amount made holdings sum ~$90.87 over bookUsd / Robinhood sleeves.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");

const SPLIT = 30.2904;
const CARRY_AT = "2026-09-25T21:30:00Z";
const LIVING = {
  "Claude Opus 5": { bookUsd: 122.3328, monthPct: 208.2 },
  "GPT-5.6 Terra": { bookUsd: 126.8077, monthPct: 216.34 },
  "GPT-5.6 Luna": { bookUsd: 120.6876, monthPct: 387.09 }
};

const season = JSON.parse(readFileSync(path, "utf8"));

function isSonnetSplitLot(pos) {
  if (!pos || pos.status !== "boot-split") return false;
  const ticker = String(pos.ticker || "").toUpperCase();
  const note = String(pos.note || "");
  return ticker === "CASH" && note.includes("Claude Sonnet 5 boot split");
}

let removed = 0;
for (const row of season.survivors || []) {
  if (row.status !== "active" || !LIVING[row.name]) continue;
  const before = (row.positions || []).length;
  row.positions = (row.positions || []).filter((pos) => !isSonnetSplitLot(pos));
  removed += before - row.positions.length;
  row.lastSession = "2026-09-25-tribal";
  row.lastSource = "robinhood-last-trade";
}

if (removed !== 3) {
  console.error(`expected to drop 3 Sonnet boot-split lots, dropped ${removed}`);
  process.exit(1);
}

if ((season.events || []).some((event) => event && event.id === "s1e09-carry")) {
  console.error("s1e09-carry already present — abort");
  process.exit(1);
}

const recorded = {};
for (const row of season.survivors || []) {
  const host = LIVING[row.name];
  if (!host) continue;
  recorded[row.id] = {
    bookUsd: host.bookUsd,
    weekPct: 0,
    dayPct: 0,
    monthPct: host.monthPct,
    priorMarkUsd: host.bookUsd,
    eodMarkUsd: host.bookUsd
  };
}

season.events.push({
  type: "mark",
  id: "s1e09-carry",
  kind: "carry",
  at: CARRY_AT,
  throughAt: CARRY_AT,
  lastSession: "2026-09-25-tribal",
  label:
    "Episode 9 carry · Friday tribal books after Claude Sonnet 5 boot split (s1e08-fri-eod-rth). weekPct reset. Duplicate boot-split cash lots removed so holdings match Robinhood last-trade sleeves. Mon RTH not yet. SIP Sep 25 still missing (still dated 2026-09-24).",
  dayPctPriorOfficial: true,
  dayPctPriorCloseDate: "2026-09-24",
  quoteSource: "robinhood-last-trade",
  sipMissing: true,
  officialCloseDateStill: "2026-09-24",
  recorded,
  potUsd: 369.8281,
  upgradesSnapshotId: "s1e08-fri-eod-rth",
  brokerNote:
    "Agentic ••••6969 still holds Claude Sonnet 5 AR 1.510094 + SPY 0.028546 (liq queued Mon Sep 28 RTH open) plus leftover VLO 0.014984 · MPC 0.044873 · FRO 0.358734. Contestant lots otherwise match the broker."
});

season.liveSnapshotId = "s1e09-carry";
season.lastSnapshotId = "s1e09-carry";
season.lastSession = "2026-09-25-tribal";
season.lastSource = "robinhood-last-trade";
season.lastRemakeAt = CARRY_AT;
season.markedAt = CARRY_AT;
season.markLabel =
  "Episode 9 carry after Fri Sep 25 tribal. Boot Claude Sonnet 5 (book $90.8711). Split $30.2904 each to 3 living. Duplicate split lots dropped. Immunity cleared. Pot $369.8281. Mon RTH not yet.";

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log(`Applied s1e09-carry · dropped ${removed} duplicate Sonnet split lots ($${SPLIT} each).`);
