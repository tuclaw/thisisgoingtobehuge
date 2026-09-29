#!/usr/bin/env node
/** Mon Sep 28 2026 official SIP EOD — upgrade s1e09-mon-eod-rth. No fills since last-hour. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const recDir = join(root, "recs", "2026-09-28-eod-sip");
const season = JSON.parse(readFileSync(path, "utf8"));
const after = JSON.parse(readFileSync(join(recDir, "season1.after-eod-sip.json"), "utf8"));
const remake = JSON.parse(readFileSync(join(recDir, "REMAKE.json"), "utf8"));
const quotesPayload = JSON.parse(readFileSync(join(recDir, "QUOTES.json"), "utf8"));

const MARK_AT = remake.asOf;
const LAST_SESSION = remake.session;
const POT_USD = remake.islandPotUsd;
const SNAPSHOT_ID = remake.snapshotId;

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

const rthMark = (season.events || []).find((e) => e && e.id === "s1e09-mon-eod-rth");
if (!rthMark) {
  console.error("s1e09-mon-eod-rth mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === SNAPSHOT_ID)) {
  console.error(`${SNAPSHOT_ID} already present — abort`);
  process.exit(1);
}

const standingByName = new Map((remake.standings || []).map((row) => [row.name, row]));

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const patch = after.survivors.find((s) => s.id === row.id);
  const host = standingByName.get(row.name);
  if (!patch || !host) continue;

  row.positions = patch.positions;
  row.cashUsd = host.cashUsd;
  row.tickersSummary = host.position;
  row.bookUsd = host.bookUsd;
  row.weekPct = host.weekPct;
  row.dayPct = host.dayPct;
  row.monthPct = host.monthPct;
  row.priorMarkUsd = host.priorMarkUsd;
  row.eodMarkUsd = host.eodMarkUsd;
  row.immune = Boolean(host.immune);
  row.lastSource = remake.quoteSource;
  row.lastSession = LAST_SESSION;
  if (row.position) {
    const tick = host.position.replace(/\+CASH/g, "").replace(/\+/g, " / ");
    row.position = {
      action: "HOLD",
      ticker: tick.includes("CASH") ? tick : `${tick} / CASH`,
      sizeUsd: host.bookUsd,
      status: "filled",
      note: tick.toLowerCase().replace(/ \/ cash/g, "")
    };
  }
}

const sipRecorded = {};
let biduWeek = 0;
let askaraWeek = 0;
let biduDay = 0;
let askaraDay = 0;
let biduCount = 0;
let askaraCount = 0;

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const host = standingByName.get(row.name);
  if (!host) continue;

  sipRecorded[row.id] = {
    bookUsd: host.bookUsd,
    weekPct: host.weekPct,
    monthPct: host.monthPct,
    dayPct: host.dayPct,
    priorMarkUsd: host.priorMarkUsd,
    eodMarkUsd: host.eodMarkUsd
  };

  if (row.tribeId === "bidu") {
    biduWeek += host.weekPct;
    biduDay += host.dayPct;
    biduCount += 1;
  }
  if (row.tribeId === "askara") {
    askaraWeek += host.weekPct;
    askaraDay += host.dayPct;
    askaraCount += 1;
  }
}

const prevCloseFri = quotesPayload.prevCloseFri || {};
for (const [ticker, last] of Object.entries(remake.marks)) {
  const q = season.quotes[ticker] || {};
  const rthEarlier = quotesPayload.rthMarksEarlier?.[ticker];
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    sip: last,
    source: remake.quoteSource,
    session: LAST_SESSION,
    date: remake.officialCloseDate,
    asOf: MARK_AT,
    officialCloseDate: remake.officialCloseDate,
    interpolated: false,
    priorClose: prevCloseFri[ticker] ?? q.priorClose,
    priorCloseDate: "2026-09-25",
    priorCloseSource: "sip-list-exchange-close (Fri Sep 25 tribal carry)",
    ...(rthEarlier !== undefined ? { rthLastEarlier: rthEarlier } : {})
  };
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 2;
    t.combinedWeekPct = biduCount ? round4(biduWeek / biduCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = biduCount ? round4(biduDay / biduCount) : 0;
  }
  if (t.id === "askara") {
    t.livingCount = 1;
    t.combinedWeekPct = askaraCount ? round4(askaraWeek / askaraCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = askaraCount ? round4(askaraDay / askaraCount) : 0;
  }
}

const immunity = { ...remake.immunity };

const markEvent = (after.events || []).find((e) => e && e.id === SNAPSHOT_ID);
if (!markEvent) {
  console.error("season1.after-eod-sip missing mark event");
  process.exit(1);
}

season.events.push({
  ...markEvent,
  recorded: sipRecorded,
  tribes: {
    bidu: {
      combinedWeekPct: biduCount ? round4(biduWeek / biduCount) : 0,
      combinedMonthPct: biduCount ? round4((biduWeek / biduCount) * 2) : 0,
      combinedDayPct: biduCount ? round4(biduDay / biduCount) : 0,
      livingCount: 2
    },
    askara: {
      combinedWeekPct: askaraCount ? round4(askaraWeek / askaraCount) : 0,
      combinedMonthPct: askaraCount ? round4((askaraWeek / askaraCount) * 2) : 0,
      combinedDayPct: askaraCount ? round4(askaraDay / askaraCount) : 0,
      livingCount: 1
    }
  },
  immunity
});

season.liveSnapshotId = SNAPSHOT_ID;
season.lastSnapshotId = SNAPSHOT_ID;
season.lastRemakeAt = MARK_AT;
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel = remake.markLabel;
season.dayPctBasis =
  "vs Episode 9 priorMarkUsd (Fri Sep 25 tribal carry) — same as weekPct for Mon EOD remake";
season.weekPctBasis = "Episode 9 weekPct vs priorMarkUsd (Fri Sep 25 tribal carry)";
season.statusLabel = remake.statusLabel;
season.lastSource = remake.quoteSource;
season.lastSession = LAST_SESSION;
season.notes =
  "Season live. S1E09 Mon Sep 28 – Tue Sep 29. MERGED. Three living. Mon official SIP list-exchange close 2026-09-28 (catch-up after RTH-EOD). Given $361.93. Pot $362.2467. Claude Opus 5 immunity −0.9970%. GPT-5.6 Luna worst −3.8119%. Comics paused. Audience only. Tribal Tue Sep 29 2:00 PM PT.";
season.immunity = immunity;
delete season.sipMissingBanner;

const e9 = (season.episodes || []).find((ep) => ep && ep.id === "s1e09");
if (e9) {
  e9.liveSnapshotId = SNAPSHOT_ID;
  e9.islandPotUsd = POT_USD;
  e9.immunity = {
    name: immunity.name,
    weekPct: round4(immunity.weekPct),
    survivorId: immunity.survivorId,
    asOf: immunity.asOf,
    at: immunity.at
  };
  e9.weekBoardSnapshotId = SNAPSHOT_ID;
}

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log(`Applied ${SNAPSHOT_ID} · islandPotUsd`, season.islandPotUsd, "· immunity", immunity.name, immunity.weekPct);
