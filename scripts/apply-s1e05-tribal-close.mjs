#!/usr/bin/env node
/** S1E05 tribal close — boot Grok 4.6, open Episode 6 (+ Sep 15 SIP catch-up).
 *  Canonical ledger: copy host season1.json from tribal close remake (do not recompute splits). */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = process.argv[2] || join(root, "data", "season1.json");
const dest = join(root, "data", "season1.json");

const season = JSON.parse(readFileSync(canonical, "utf8"));
if (season.episode && season.episode.diagramStartSnapshotId === "s1e06-carry") {
  season.episode.diagramStartSnapshotId = "s1e06-carry-sip";
}
const e6 = (season.episodes || []).find((ep) => ep && ep.id === "s1e06");
if (e6 && e6.diagramStartSnapshotId === "s1e06-carry") {
  e6.diagramStartSnapshotId = "s1e06-carry-sip";
}
writeFileSync(dest, JSON.stringify(season, null, 2) + "\n");
console.log("Applied S1E05 tribal close ledger — Grok 4.6 booted, Episode 6 open (SIP carry).");
