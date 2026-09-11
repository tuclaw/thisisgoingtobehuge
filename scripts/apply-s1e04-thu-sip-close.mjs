#!/usr/bin/env node
/** Thu Sep 10 2026 official SIP close — upgrade living marks only (late). No fills since last-hour. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const SIP_AT = "2026-09-11T02:15:00Z";
const HOST_MARKED_AT = "2026-09-11T00:11:37Z";
const SIP_SESSION = "2026-09-10-eod";

const SIP_CLOSES = {
  FRO: 48.4,
  MPC: 392.42,
  USO: 158.38,
  VLO: 385.43
};

const IDS = {
  "Grok 4.6": "e51f02b6-9d92-413f-8717-a6e3a60468bc"
};

/** Official SIP living books · week% vs E4 open · day% vs Wed SIP eodMarkUsd. */
const LIVING = {
  "Grok 4.6": { bookUsd: 48.808, weekPct: 6.92, dayPct: 4.74, immune: true },
  "GPT-5.6 Terra": { bookUsd: 48.093, weekPct: 6.4, dayPct: 4.91, immune: false },
  "Kimi K3": { bookUsd: 47.8828, weekPct: 6.02, dayPct: 3.59, immune: false },
  "Gemini 3.7 Flash": { bookUsd: 47.6222, weekPct: 5.19, dayPct: 3.4, immune: false },
  "GPT-5.6 Luna": { bookUsd: 46.8613, weekPct: 3.76, dayPct: 1.19, immune: false },
  "Composer 2.5": { bookUsd: 46.8402, weekPct: 3.18, dayPct: 1.89, immune: false },
  "Claude Opus 5": { bookUsd: 46.8094, weekPct: 3.07, dayPct: 1.75, immune: false },
  "Claude Sonnet 5": { bookUsd: 46.1636, weekPct: 2.05, dayPct: 0.9, immune: false }
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

const thuLasthour = (season.events || []).find((e) => e && e.id === "s1e04-thu-lasthour");
if (!thuLasthour || !thuLasthour.recorded) {
  console.error("s1e04-thu-lasthour mark missing");
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

  const priorMarkUsd = thuLasthour.recorded[row.id]?.bookUsd ?? row.bookUsd;
  const bookUsd = host.bookUsd;
  const weekPct = host.weekPct;
  const dayPct = host.dayPct;
  const monthPct = monthPctFromWeek(weekPct);

  sipRecorded[row.id] = {
    bookUsd,
    weekPct,
    monthPct,
    dayPct,
    priorMarkUsd,
    eodMarkUsd: thuLasthour.recorded[row.id]?.eodMarkUsd ?? row.eodMarkUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = dayPct;
  row.priorMarkUsd = priorMarkUsd;
  row.eodMarkUsd = sipRecorded[row.id].eodMarkUsd;
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
  const priorCloseDate = q.priorCloseDate || "2026-09-09";
  const priorCloseSource = q.priorCloseSource || "sip-list-exchange-close";
  season.quotes[ticker] = {
    ...q,
    last: close,
    close,
    source: "sip-list-exchange-close",
    session: SIP_SESSION,
    date: "2026-09-10",
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

season.islandPotUsd = 379.0806;
season.markedAt = HOST_MARKED_AT;
season.markLabel = "Thu Sep 10 2026 EOD · official SIP list-exchange close 2026-09-10";
season.statusLabel =
  "Live · S1E04 · MERGED · eight living · Thu official SIP close · leader Grok 4.6";
season.lastSource = "sip-list-exchange-close";
season.lastSession = SIP_SESSION;
season.weekPctBasis =
  "vs Tue Sep 8 official SIP list-exchange close 2026-09-08 (Episode 4 open)";
season.dayPctBasis =
  "vs Wed Sep 9 official SIP list-exchange close 2026-09-09 (Episode 4 eodMarkUsd)";
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E03 closed Tue Sep 8 tribal — GPT-5.6 Sol voted out 7–1. S1E04 live Wed Sep 9 – Fri Sep 11. MERGED. Eight living. Given $361.93. Pot $379.0806. Grok 4.6 leads +6.92% and wears immunity. Comics paused. Audience only.";

season.events = (season.events || []).filter((e) => e && e.id !== "s1e04-thu-sip");

season.events.push({
  type: "mark",
  id: "s1e04-thu-sip",
  kind: "close",
  at: SIP_AT,
  throughAt: "2026-09-10T23:59:59Z",
  lastSession: SIP_SESSION,
  label: "Thu Sep 10 official SIP list-exchange close 2026-09-10 · living marks only",
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

season.liveSnapshotId = "s1e04-thu-sip";
season.immunity = {
  survivorId: IDS["Grok 4.6"],
  name: "Grok 4.6",
  weekPct: 6.92,
  at: HOST_MARKED_AT,
  snapshotId: "s1e04-thu-sip"
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log("Applied s1e04-thu-sip close · islandPotUsd", season.islandPotUsd, "· immunity Grok 4.6 +6.92%");
