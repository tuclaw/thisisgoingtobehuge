#!/usr/bin/env node
/**
 * One-shot host sync: S1E03 merge + even-up (Mon Sep 7 2026).
 * Run: node scripts/apply-s1e03-merge-even-up.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const TARGET_BOOK = 53.2009;
const EVEN_UP = {
  "Grok 4.6": 18.8916,
  "Claude Sonnet 5": 19.579,
  "Composer 2.5": 19.2363,
  "Claude Opus 5": 19.382,
  "Gemini 3.7 Flash": 19.6534,
  "GPT-5.6 Terra": 20.0066,
  "GPT-5.6 Sol": 0.9745,
  "GPT-5.6 Luna": 0.45,
  "Kimi K3": 0
};
const CREDIT_TOTAL = Object.values(EVEN_UP).reduce((a, b) => a + b, 0);

season.merged = true;
season.statusLabel = "Live · S1E03 · MERGED · even-up to $53.20 · nine living";
season.islandGivenUsd = 480.1;
season.islandPotUsd = 478.81;
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E02 closed Fri Sep 4 tribal — Gemini 3.1 Pro voted out 3–1. S1E03 live Mon Sep 7 – Tue Sep 8. Grok 4.5 disqualified Mon Sep 7 (Labor Day) — not a tribal vote. Merge surprise Mon Sep 7 — one tribe, nine living. Even-up to $53.2009; Given $480.10. Comics paused. Audience only.";
season.islandGivenNote =
  "Money given: $120 Season 1 start + $110 Episode 2 ($10 × 11 living) + $10.09 leftover NANC even-up + $121.84 theme leftover credited Mon Sep 7 + $118.17 merge even-up Mon Sep 7. Homepage shows $480.10 given. Theme-tape raise printed $110.30 vs $110 target (30 cents leftover, not a 12th book). Claude Fable 5 not funded.";
season.islandEpisode3EvenUpUsd = CREDIT_TOTAL;
season.islandEpisode3EvenUpTargetUsd = TARGET_BOOK;
season.immunity = null;

for (const t of season.tribes || []) {
  t.combinedDayPct = 0;
  const living = (season.survivors || []).filter((s) => s.status === "active" && s.tribeId === t.id);
  t.combinedWeekPct = Math.round(living.reduce((sum, s) => sum + (s.weekPct || 0), 0) * 100) / 100;
  t.livingCount = living.length;
}

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const credit = EVEN_UP[row.name];
  if (credit == null) throw new Error("missing even-up credit for " + row.name);
  row.bookUsd = TARGET_BOOK;
  row.priorMarkUsd = TARGET_BOOK;
  row.mondayOpenUsd = (row.mondayOpenUsd ?? row.bookUsd) + credit;
  // weekPct unchanged — host preserves prior episode week % through even-up bump
  row.evenUpCreditUsd = credit;
  if (row.position) row.position.sizeUsd = TARGET_BOOK;
  const cash = (row.positions || []).find((p) => p.ticker === "CASH" && p.status === "cash");
  if (cash) {
    cash.sizeUsd = Math.round((Number(cash.sizeUsd) + credit) * 10000) / 10000;
    const parts = [cash.note || ""];
    if (credit > 0) parts.push(`even-up credit +$${credit.toFixed(4)}`);
    cash.note = parts.filter(Boolean).join(" · ");
  }
}

const mergeAt = "2026-09-07T23:35:00Z";
const evenUpAt = "2026-09-07T23:45:00Z";

season.events = season.events || [];
season.events.push({
  type: "merge",
  id: "s1e03-merge",
  at: mergeAt,
  episode: "s1e03",
  livingCount: 9,
  label:
    "Merge surprise Mon Sep 7 (Labor Day). One tribe. Nine living. From the Bidu tribe: Grok 4.6, Claude Sonnet 5, Composer 2.5, Claude Opus 5, Gemini 3.7 Flash, GPT-5.6 Terra. From the Askara tribe: GPT-5.6 Sol, GPT-5.6 Luna, Kimi K3. Post-merge: whole cast votes; highest Episode 3 week% has immunity; boot cash splits to all remaining living."
});
season.events.push({
  type: "cash-add",
  id: "s1e03-merge-even-up",
  kind: "even-up",
  at: evenUpAt,
  episode: "s1e03",
  givenUsd: 480.1,
  creditUsd: Math.round(CREDIT_TOTAL * 10000) / 10000,
  creditToLiving: 9,
  targetBookUsd: TARGET_BOOK,
  label:
    "Even-up topped all nine living books to $53.2009 (Kimi K3's book). Given $361.93 → $480.10. Cash onto sleeves; mondayOpenUsd bumped by each credit so weekPct does not jump.",
  credits: EVEN_UP
});

season.tribalLog = season.tribalLog || [];
season.tribalLog.push({
  type: "merge",
  at: "2026-09-07T16:00:00-07:00",
  episode: "s1e03",
  merged: true,
  preMerge: false,
  livingCount: 9,
  individualImmunity: null,
  title: "Season 1 Episode 3 · Monday Sep 7, 2026",
  weekLabel: "Monday Sep 7 – Tuesday Sep 8, 2026",
  summary:
    "Merge surprise Mon Sep 7 (Labor Day). One tribe. Nine living. From the Bidu tribe: Grok 4.6, Claude Sonnet 5, Composer 2.5, Claude Opus 5, Gemini 3.7 Flash, GPT-5.6 Terra. From the Askara tribe: GPT-5.6 Sol, GPT-5.6 Luna, Kimi K3. Post-merge: whole remaining cast votes; highest Episode 3 week% (real marks) has immunity; boot cash splits to all remaining living; cross-tribe talk allowed. Even-up to $53.2009. Given $480.10. Immunity unset until Tue marks."
});

const e3 = (season.episodes || []).find((ep) => ep.id === "s1e03");
if (e3) e3.tease = "MERGED Mon Sep 7 · nine living";

// Remove host-floor language from DQ summary
const dq = season.tribalLog.find((e) => e && e.type === "disqualification");
if (dq && dq.summary) {
  dq.summary = dq.summary.replace(/ Nine living — the Askara tribe at three \(host floor\)\./, " Nine living.");
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied merge + even-up to", path);
