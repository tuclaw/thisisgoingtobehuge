#!/usr/bin/env node
/** Wed Sep 9 2026 official SIP close — upgrade living marks only (late). No fills since last-hour. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const SIP_AT = "2026-09-10T02:15:00Z";
const SIP_SESSION = "2026-09-09-sip";

const SIP_CLOSES = {
  USO: 149.97,
  XLE: 65.31,
  VLO: 388.95,
  FRO: 47.21,
  CVX: 213.81,
  XOM: 164.23
};

/** Post-split living books · E3 week% vs even-up open · eodMark excludes boot-split cash. */
const LIVING = {
  "GPT-5.6 Luna": { bookUsd: 46.3084, eodMarkUsd: 40.2946, weekPct: 2.54, immune: true },
  "Kimi K3": { bookUsd: 46.2238, eodMarkUsd: 40.2967, weekPct: 2.34, immune: false },
  "Grok 4.6": { bookUsd: 46.5988, eodMarkUsd: 40.7801, weekPct: 2.08, immune: false },
  "Gemini 3.7 Flash": { bookUsd: 46.058, eodMarkUsd: 40.4057, weekPct: 1.73, immune: false },
  "GPT-5.6 Terra": { bookUsd: 45.842, eodMarkUsd: 40.3307, weekPct: 1.42, immune: false },
  "Claude Opus 5": { bookUsd: 46.003, eodMarkUsd: 40.5481, weekPct: 1.29, immune: false },
  "Composer 2.5": { bookUsd: 45.971, eodMarkUsd: 40.5299, weekPct: 1.26, immune: false },
  "Claude Sonnet 5": { bookUsd: 45.7525, eodMarkUsd: 40.3679, weekPct: 1.14, immune: false }
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

const wedLasthour = (season.events || []).find((e) => e && e.id === "s1e04-wed-lasthour");
if (!wedLasthour || !wedLasthour.recorded) {
  console.error("s1e04-wed-lasthour mark missing");
  process.exit(1);
}

const sipRecorded = {};
let biduWeek = 0;
let askaraWeek = 0;
let biduCount = 0;
let askaraCount = 0;

for (const row of season.survivors || []) {
  if (row.status !== "active") continue;
  const host = LIVING[row.name];
  if (!host) continue;

  const priorMarkUsd = wedLasthour.recorded[row.id]?.bookUsd ?? row.bookUsd;
  const bookUsd = host.bookUsd;
  const weekPct = host.weekPct;
  const monthPct = monthPctFromWeek(weekPct);

  sipRecorded[row.id] = {
    bookUsd,
    weekPct,
    monthPct,
    dayPct: weekPct,
    priorMarkUsd,
    eodMarkUsd: host.eodMarkUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = weekPct;
  row.priorMarkUsd = priorMarkUsd;
  row.eodMarkUsd = host.eodMarkUsd;
  row.immune = host.immune;
  row.lastSource = "sip-list-exchange-close";
  row.lastSession = SIP_SESSION;
  if (row.position) row.position.sizeUsd = bookUsd;

  for (const pos of row.positions || []) {
    if (pos.ticker && SIP_CLOSES[pos.ticker]) {
      pos.last = SIP_CLOSES[pos.ticker];
      pos.lastSource = "sip-list-exchange-close";
      pos.lastSession = SIP_SESSION;
    }
  }

  if (row.tribeId === "bidu") {
    biduWeek += weekPct;
    biduCount += 1;
  }
  if (row.tribeId === "askara") {
    askaraWeek += weekPct;
    askaraCount += 1;
  }
}

for (const [ticker, close] of Object.entries(SIP_CLOSES)) {
  const q = season.quotes[ticker] || {};
  const priorCloseDate = q.priorCloseDate || "2026-09-08";
  const priorCloseSource = q.priorCloseSource || "sip-list-exchange-close";
  season.quotes[ticker] = {
    ...q,
    last: close,
    close,
    source: "sip-list-exchange-close",
    session: SIP_SESSION,
    date: "2026-09-09",
    asOf: SIP_AT,
    priorCloseDate,
    priorCloseSource,
    interpolated: false
  };
}

for (const t of season.tribes || []) {
  if (t.id === "bidu") {
    t.livingCount = 6;
    t.combinedWeekPct = biduCount ? round4(biduWeek / biduCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = t.combinedWeekPct;
  }
  if (t.id === "askara") {
    t.livingCount = 2;
    t.combinedWeekPct = askaraCount ? round4(askaraWeek / askaraCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = t.combinedWeekPct;
  }
}

season.islandPotUsd = 368.7575;
season.markedAt = SIP_AT;
season.markLabel = "Wed Sep 9 2026 EOD · official SIP list-exchange close 2026-09-09";
season.statusLabel = "Live · S1E04 · MERGED · eight living · Wed official SIP close · leader GPT-5.6 Luna";
season.lastSource = "sip-list-exchange-close";
season.lastSession = SIP_SESSION;
season.weekPctBasis =
  "vs Episode 3 even-up open (post-split living book); Tue Sep 8 official SIP list-exchange close 2026-09-08";
season.dayPctBasis = "vs Fri Sep 4 open mark (eodMarkUsd)";
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E03 closed Tue Sep 8 tribal — GPT-5.6 Sol voted out 7–1. S1E04 live Wed Sep 9 – Fri Sep 11. MERGED. Eight living. Given $361.93. Pot $368.7575. GPT-5.6 Luna leads +2.54% and wears immunity. Comics paused. Audience only.";

season.events = (season.events || []).filter((e) => e && e.id !== "s1e04-wed-sip");

season.events.push({
  type: "mark",
  id: "s1e04-wed-sip",
  kind: "close",
  at: SIP_AT,
  throughAt: "2026-09-09T23:59:59Z",
  lastSession: SIP_SESSION,
  label: "Wed Sep 9 official SIP list-exchange close 2026-09-09 · living marks only",
  dayPctPriorOfficial: true,
  recorded: sipRecorded,
  tribes: {
    bidu: {
      combinedWeekPct: biduCount ? round4(biduWeek / biduCount) : 0,
      combinedMonthPct: biduCount ? round4((biduWeek / biduCount) * 2) : 0,
      combinedDayPct: biduCount ? round4(biduWeek / biduCount) : 0,
      livingCount: 6
    },
    askara: {
      combinedWeekPct: askaraCount ? round4(askaraWeek / askaraCount) : 0,
      combinedMonthPct: askaraCount ? round4((askaraWeek / askaraCount) * 2) : 0,
      combinedDayPct: askaraCount ? round4(askaraWeek / askaraCount) : 0,
      livingCount: 2
    }
  }
});

season.liveSnapshotId = "s1e04-wed-sip";
season.immunity = {
  survivorId: (season.survivors || []).find((s) => s.name === "GPT-5.6 Luna")?.id,
  name: "GPT-5.6 Luna",
  weekPct: 2.54,
  at: SIP_AT,
  snapshotId: "s1e04-wed-sip"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e04-wed-sip close · islandPotUsd", season.islandPotUsd, "· immunity GPT-5.6 Luna +2.54%");
