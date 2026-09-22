#!/usr/bin/env node
/** Mon Sep 21 2026 official SIP EOD — upgrade s1e07-mon-lasthour-strip. No fills since strip. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));
const booksAfter = JSON.parse(
  readFileSync(join(root, "recs", "2026-09-21-eod-sip", "BOOKS.after.json"), "utf8")
);
const remake = JSON.parse(
  readFileSync(join(root, "recs", "2026-09-21-eod-sip", "REMAKE.json"), "utf8")
);

const MARK_AT = remake.asOf;
const LAST_SESSION = remake.session;
const POT_USD = remake.islandPotUsd;

const SIP_CLOSES = remake.marks;

const LIVING = {};
for (const row of remake.standings) {
  LIVING[row.name] = {
    bookUsd: row.bookUsd,
    weekPct: row.weekPct,
    dayPct: row.dayPct,
    monthPct: row.monthPct,
    cashUsd: row.cashUsd,
    tickers: row.position.replace(/\+/g, " / "),
    immune: row.name === remake.leader.name
  };
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

const stripMark = (season.events || []).find((e) => e && e.id === "s1e07-mon-lasthour-strip");
if (!stripMark || !stripMark.recorded) {
  console.error("s1e07-mon-lasthour-strip mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e07-mon-eod-sip")) {
  console.error("s1e07-mon-eod-sip already present — abort");
  process.exit(1);
}

for (const bookRow of booksAfter) {
  const row = season.survivors.find((s) => s.id === bookRow.id);
  if (!row || row.status !== "active") continue;
  row.positions = bookRow.positions;
  row.cashUsd = bookRow.cashUsd;
  row.tickersSummary = bookRow.tickersSummary;
  if (row.position) {
    row.position = {
      action: "HOLD",
      ticker: bookRow.tickersSummary.replace(/\+/g, " / "),
      sizeUsd: bookRow.bookUsd,
      status: "filled",
      note: bookRow.tickersSummary.toLowerCase().replace(/\+cash/g, "").replace(/\+/g, " / ")
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
  const host = LIVING[row.name];
  if (!host) continue;

  const priorMarkUsd = stripMark.recorded[row.id]?.priorMarkUsd ?? row.priorMarkUsd;
  const eodMarkUsd = host.bookUsd;
  const bookUsd = host.bookUsd;
  const weekPct = host.weekPct;
  const dayPct = host.dayPct;
  const monthPct = host.monthPct;

  sipRecorded[row.id] = {
    bookUsd,
    weekPct,
    monthPct,
    dayPct,
    priorMarkUsd,
    eodMarkUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = dayPct;
  row.priorMarkUsd = priorMarkUsd;
  row.eodMarkUsd = eodMarkUsd;
  row.immune = host.immune;
  row.lastSource = remake.quoteSource;
  row.lastSession = LAST_SESSION;

  if (row.tribeId === "bidu") {
    biduWeek += weekPct;
    biduDay += dayPct;
    biduCount += 1;
  }
  if (row.tribeId === "askara") {
    askaraWeek += weekPct;
    askaraDay += dayPct;
    askaraCount += 1;
  }
}

for (const [ticker, last] of Object.entries(SIP_CLOSES)) {
  const q = season.quotes[ticker] || {};
  const prior = remake.sipPriorFri[ticker] ?? q.priorClose;
  season.quotes[ticker] = {
    ...q,
    last,
    close: last,
    sip: last,
    source: remake.quoteSource,
    session: LAST_SESSION,
    date: remake.officialCloseDate,
    asOf: MARK_AT,
    priorClose: prior,
    priorCloseDate: "2026-09-18",
    priorCloseSource: "robinhood-last-trade (Fri tribal RTH)",
    interpolated: false
  };
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 4;
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

season.events.push({
  type: "mark",
  id: "s1e07-mon-eod-sip",
  kind: "close",
  at: MARK_AT,
  throughAt: MARK_AT,
  lastSession: LAST_SESSION,
  label: remake.markLabel,
  dayPctPriorOfficial: true,
  dayPctPriorCloseDate: "2026-09-18",
  quoteSource: remake.quoteSource,
  sipMissing: remake.sipMissing,
  officialCloseDate: remake.officialCloseDate,
  interpolated: remake.interpolated,
  upgradesSnapshotId: remake.upgrades,
  marks: SIP_CLOSES,
  immunity: remake.immunity,
  potUsd: POT_USD,
  fillsSinceLastHour: remake.fillsSinceLastHour,
  fillsSinceOpen: "unchanged — see s1e07-mon-open / mid / lasthour / strip",
  recorded: sipRecorded
});

season.liveSnapshotId = remake.snapshotId;
season.islandPotUsd = POT_USD;
season.markedAt = MARK_AT;
season.markLabel = remake.markLabel;
season.statusLabel = remake.statusLabel;
season.lastSource = remake.quoteSource;
season.lastSession = LAST_SESSION;
season.immunity = { ...remake.immunity };
delete season.sipMissingBanner;
season.notes =
  "Season live. S1E07 live Mon Sep 21 – Tue Sep 22. MERGED. Five living. Mon official SIP list-exchange close 2026-09-21 (catch-up after strip). Given $361.93. Pot $384.72. GPT-5.6 Luna leads −0.33% and wears immunity. Composer 2.5 worst −2.40%. Comics paused. Audience only. Tribal Tue Sep 22 2:00 PM PT.";

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e07-mon-eod-sip · islandPotUsd", season.islandPotUsd, "· immunity GPT-5.6 Luna -0.33%");
