#!/usr/bin/env node
/** Tue Sep 8 2026 official SIP close — upgrade living marks only (late). */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const SIP_AT = "2026-09-09T02:15:00Z";
const SIP_SESSION = "2026-09-08-sip";

const SIP_CLOSES = {
  USO: 146.03,
  XLE: 64.77,
  VLO: 382.85,
  MPC: 397.77,
  FRO: 46.62,
  CVX: 209.8,
  XOM: 160.66
};

/** Post-split living books · E3 week% vs even-up open · eodMark excludes boot-split cash. */
const LIVING = {
  "Grok 4.6": { bookUsd: 45.6483, eodMarkUsd: 40.7801, weekPct: 1.77 },
  "Claude Opus 5": { bookUsd: 45.4162, eodMarkUsd: 40.5481, weekPct: 1.19 },
  "Composer 2.5": { bookUsd: 45.398, eodMarkUsd: 40.5299, weekPct: 1.15 },
  "Gemini 3.7 Flash": { bookUsd: 45.2738, eodMarkUsd: 40.4057, weekPct: 0.84 },
  "Claude Sonnet 5": { bookUsd: 45.236, eodMarkUsd: 40.3679, weekPct: 0.74 },
  "GPT-5.6 Terra": { bookUsd: 45.1988, eodMarkUsd: 40.3307, weekPct: 0.65 },
  "GPT-5.6 Luna": { bookUsd: 45.1627, eodMarkUsd: 40.2946, weekPct: 0.56 },
  "Kimi K3": { bookUsd: 45.1648, eodMarkUsd: 40.2967, weekPct: 0.56 }
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

const carry = (season.events || []).find((e) => e && e.id === "s1e04-carry");
if (!carry || !carry.recorded) {
  console.error("s1e04-carry mark missing");
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

  const priorMarkUsd = carry.recorded[row.id]?.bookUsd ?? row.bookUsd;
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
  const priorCloseDate = q.priorCloseDate || "2026-09-04";
  const priorCloseSource = q.priorCloseSource || "sip-list-exchange-close";
  season.quotes[ticker] = {
    ...q,
    last: close,
    close,
    source: "sip-list-exchange-close",
    session: SIP_SESSION,
    date: "2026-09-08",
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

season.islandPotUsd = 362.4986;
season.markedAt = SIP_AT;
season.markLabel = "Tue Sep 8 official SIP list-exchange close 2026-09-08 (late)";
season.statusLabel = "Live · S1E04 · MERGED · eight living · Tue Sep 8 SIP close (late)";
season.lastSource = "sip-list-exchange-close";
season.lastSession = SIP_SESSION;
season.weekPctBasis =
  "vs Episode 3 even-up open (post-split living book); Tue Sep 8 official SIP list-exchange close 2026-09-08";
season.dayPctBasis = "vs Fri Sep 4 open mark (eodMarkUsd)";

season.events = (season.events || []).filter((e) => e && e.id !== "s1e04-tue-sip");

season.events.push({
  type: "mark",
  id: "s1e04-tue-sip",
  kind: "close",
  at: SIP_AT,
  throughAt: "2026-09-08T23:59:59Z",
  lastSession: SIP_SESSION,
  label: "Tue Sep 8 official SIP list-exchange close 2026-09-08 (late) · living marks only",
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

season.liveSnapshotId = "s1e04-tue-sip";

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e04-tue-sip close · islandPotUsd", season.islandPotUsd);
