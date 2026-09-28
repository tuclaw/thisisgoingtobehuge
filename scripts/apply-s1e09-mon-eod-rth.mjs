#!/usr/bin/env node
/** Mon Sep 28 2026 RTH-EOD — BUY-only marks (no fills since last-hour). Snapshot s1e09-mon-eod-rth. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const recDir = join(root, "recs", "2026-09-28-eod-rth");
const season = JSON.parse(readFileSync(path, "utf8"));
const after = JSON.parse(readFileSync(join(recDir, "season1.after-eod-rth.json"), "utf8"));
const remake = JSON.parse(readFileSync(join(recDir, "REMAKE.json"), "utf8"));
const quotesPayload = JSON.parse(readFileSync(join(recDir, "QUOTES.json"), "utf8"));

const MARK_AT = remake.asOf;
const LAST_SESSION = remake.session;
const POT_USD = remake.islandPotUsd;
const SNAPSHOT_ID = remake.snapshotId;

const IDS = {
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

const lastHour = (season.events || []).find((e) => e && e.id === "s1e09-mon-lasthour");
if (!lastHour) {
  console.error("s1e09-mon-lasthour mark missing");
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
  row.tickersSummary = host.position.replace(/\+/g, "+");
  row.bookUsd = host.bookUsd;
  row.weekPct = host.weekPct;
  row.dayPct = host.dayPct;
  row.monthPct = monthPctFromWeek(host.weekPct);
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

const lastRecorded = {};
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

  lastRecorded[row.id] = {
    bookUsd: host.bookUsd,
    weekPct: host.weekPct,
    monthPct: monthPctFromWeek(host.weekPct),
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

const priorClose = lastHour.marks || {};
const priorCloseDate = remake.officialCloseDateStill || "2026-09-25";

for (const [ticker, last] of Object.entries(remake.marks)) {
  const venue = quotesPayload.venueLastTradeTimesZ?.[ticker];
  const prevClose = quotesPayload.prevClose?.[ticker];
  const q = season.quotes[ticker] || {};
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    source: remake.quoteSource,
    session: LAST_SESSION,
    date: "2026-09-28",
    asOf: MARK_AT,
    priorClose: prevClose ?? q.priorClose,
    priorCloseDate,
    priorCloseSource: `SIP list-exchange close still dated ${priorCloseDate} (wanted ${remake.officialCloseDateWanted})`,
    interpolated: false,
    ...(venue ? { venueLastTradeTime: venue } : {})
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

const immunity = {
  name: remake.immunity.name,
  weekPct: remake.immunity.weekPct,
  basis: remake.immunity.basis,
  note: remake.immunity.note,
  asOf: remake.immunity.asOf,
  survivorId: remake.immunity.survivorId,
  at: remake.immunity.at,
  snapshotId: SNAPSHOT_ID
};

const markEvent = (after.events || []).find((e) => e && e.id === SNAPSHOT_ID);
if (!markEvent) {
  console.error("season1.after-eod-rth missing mark event");
  process.exit(1);
}

season.events.push({
  ...markEvent,
  recorded: lastRecorded,
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
  "Season live. S1E09 Mon Sep 28 – Tue Sep 29. MERGED. Three living. Mon RTH-EOD remake (SIP 2026-09-28 missing). Given $361.93. Pot $362.3071. Claude Opus 5 immunity −0.9937%. GPT-5.6 Luna worst −3.7901%. Comics paused. Audience only. Tribal Tue Sep 29 2:00 PM PT.";
season.immunity = immunity;

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
