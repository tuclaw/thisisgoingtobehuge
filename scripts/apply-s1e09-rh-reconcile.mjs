#!/usr/bin/env node
/** Drop the duplicate Claude Sonnet 5 boot-split cash lots.
 *
 * After tribal, living CASH already included +$30.2904. A second boot-split CASH
 * lot of the same amount made holdings sum ~$90.87 over bookUsd / Robinhood sleeves.
 * Does not stamp s1e09-carry — that snapshot would flip public Watch Live to
 * Episode 9 before Mon Sep 28 week tape.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");

const season = JSON.parse(readFileSync(path, "utf8"));

function isSonnetSplitLot(pos) {
  if (!pos || pos.status !== "boot-split") return false;
  const ticker = String(pos.ticker || "").toUpperCase();
  const note = String(pos.note || "");
  return ticker === "CASH" && note.includes("Claude Sonnet 5 boot split");
}

let removed = 0;
for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const before = (row.positions || []).length;
  row.positions = (row.positions || []).filter((pos) => !isSonnetSplitLot(pos));
  removed += before - row.positions.length;
  row.lastSession = "2026-09-25-tribal";
  row.lastSource = "robinhood-last-trade";
}

if (removed !== 0 && removed !== 3) {
  console.error(`expected to drop 0 or 3 Sonnet boot-split lots, dropped ${removed}`);
  process.exit(1);
}

season.events = (season.events || []).filter((event) => !event || event.id !== "s1e09-carry");
season.liveSnapshotId = "s1e08-fri-eod-rth";
season.lastSnapshotId = "s1e08-fri-eod-rth";
season.lastSession = "2026-09-25-tribal";
season.lastSource = "robinhood-last-trade";
season.lastRemakeAt = "2026-09-25T21:10:00Z";
season.markedAt = "2026-09-25T21:00:00Z";
season.markLabel =
  "Fri Sep 25 tribal closed. Boot Claude Sonnet 5 (book $90.8711). Split $30.2904 each to 3 living. Episode 9 open Mon Sep 28 – Tue Sep 29. Immunity cleared. Pot $369.8281.";

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log(`Dropped ${removed} duplicate Sonnet split lots. Live cut stays s1e08-fri-eod-rth.`);
