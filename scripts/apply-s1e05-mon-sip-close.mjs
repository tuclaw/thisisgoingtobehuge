#!/usr/bin/env node
/** Mon Sep 14 2026 official SIP close — upgrade living marks only (late). No fills since last-hour. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "season1.json");
const season = JSON.parse(readFileSync(path, "utf8"));

const SIP_AT = "2026-09-15T02:15:00Z";
const HOST_MARKED_AT = "2026-09-14T20:00:00Z";
const SIP_SESSION = "2026-09-14-eod";

const SIP_CLOSES = {
  FRO: 50.52,
  MPC: 396.45,
  USO: 156.66,
  VLO: 382.95,
  XLE: 64.53,
  STNG: 85.46
};

const IDS = {
  "Grok 4.6": "e51f02b6-9d92-413f-8717-a6e3a60468bc",
  "Claude Sonnet 5": "955a698c-6db0-4172-9e48-12f3724187b0",
  "Composer 2.5": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
  "Claude Opus 5": "974a6b6c-af86-4001-a356-f7f05c803da9",
  "Gemini 3.7 Flash": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
  "GPT-5.6 Terra": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
  "GPT-5.6 Luna": "aa75df67-9f84-45a3-9432-bee228d655f6"
};

/** Official SIP living books · week% vs Episode 5 carry · day% same as week (Mon first official). */
const LIVING = {
  "Claude Sonnet 5": {
    bookUsd: 54.6126,
    weekPct: 2.5,
    dayPct: 2.5,
    cashUsd: 0.0008,
    immune: true
  },
  "GPT-5.6 Terra": {
    bookUsd: 55.7074,
    weekPct: 2.26,
    dayPct: 2.26,
    cashUsd: 0.0007,
    immune: false
  },
  "Gemini 3.7 Flash": {
    bookUsd: 54.0844,
    weekPct: 1.56,
    dayPct: 1.56,
    cashUsd: 0.0096,
    immune: false
  },
  "Composer 2.5": {
    bookUsd: 52.1661,
    weekPct: -0.23,
    dayPct: -0.23,
    cashUsd: 10.6715,
    immune: false
  },
  "GPT-5.6 Luna": {
    bookUsd: 52.6232,
    weekPct: -0.3,
    dayPct: -0.3,
    cashUsd: 14.5229,
    immune: false
  },
  "Claude Opus 5": {
    bookUsd: 52.7418,
    weekPct: -0.33,
    dayPct: -0.33,
    cashUsd: 8.3954,
    immune: false
  },
  "Grok 4.6": {
    bookUsd: 52.2273,
    weekPct: -2.18,
    dayPct: -2.18,
    cashUsd: 5.2381,
    immune: false
  }
};

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function monthPctFromWeek(weekPct) {
  return round4(weekPct * 2);
}

function setCash(row, cashUsd) {
  const cash = (row.positions || []).find((p) => p.ticker === "CASH");
  if (cash) cash.sizeUsd = cashUsd;
}

const monLasthour = (season.events || []).find((e) => e && e.id === "s1e05-mon-lasthour");
if (!monLasthour || !monLasthour.recorded) {
  console.error("s1e05-mon-lasthour mark missing");
  process.exit(1);
}

if ((season.events || []).some((e) => e && e.id === "s1e05-mon-eod")) {
  console.error("s1e05-mon-eod already present — abort");
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

  const priorMarkUsd = monLasthour.recorded[row.id]?.bookUsd ?? row.bookUsd;
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
    eodMarkUsd: bookUsd
  };

  row.bookUsd = bookUsd;
  row.weekPct = weekPct;
  row.monthPct = monthPct;
  row.dayPct = dayPct;
  row.priorMarkUsd = priorMarkUsd;
  row.eodMarkUsd = bookUsd;
  row.immune = host.immune;
  row.lastSource = "sip-list-exchange-close";
  row.lastSession = SIP_SESSION;
  if (row.position) row.position.sizeUsd = bookUsd;
  if (host.cashUsd != null) setCash(row, host.cashUsd);

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
  const priorCloseDate = q.priorCloseDate || "2026-09-11";
  const priorCloseSource = q.priorCloseSource || "RTH last-trade";
  season.quotes[ticker] = {
    ...q,
    last: close,
    close,
    source: "sip-list-exchange-close",
    session: SIP_SESSION,
    date: "2026-09-14",
    asOf: HOST_MARKED_AT,
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
    t.livingCount = 1;
    t.combinedWeekPct = askaraCount ? round4(askaraWeek / askaraCount) : 0;
    t.combinedMonthPct = round4(t.combinedWeekPct * 2);
    t.combinedDayPct = t.combinedWeekPct;
  }
}

season.islandPotUsd = 374.1628;
season.markedAt = HOST_MARKED_AT;
season.markLabel = "Mon Sep 14 2026 EOD · official SIP list-exchange close 2026-09-14";
season.statusLabel =
  "Live · S1E05 · MERGED · seven living · Mon official SIP close · leader Claude Sonnet 5";
season.lastSource = "sip-list-exchange-close";
season.lastSession = SIP_SESSION;
season.weekPctBasis =
  "vs Episode 5 carry (Friday tribal boot split · week open)";
season.dayPctBasis =
  "vs Episode 5 carry (Friday tribal boot split · week open)";
season.notes =
  "Season live 9:05 AM PT Aug 24. S1E04 closed Fri Sep 11 tribal — Kimi K3 voted out on revote 3–2. S1E05 live Mon Sep 14 – Tue Sep 16. MERGED. Seven living. Given $361.93. Pot $374.16. Claude Sonnet 5 leads +2.50% and wears immunity. Comics paused. Audience only.";
delete season.sipMissingBanner;

season.events.push({
  type: "mark",
  id: "s1e05-mon-eod",
  kind: "close",
  at: SIP_AT,
  throughAt: "2026-09-14T23:59:59Z",
  lastSession: SIP_SESSION,
  label: "Mon Sep 14 official SIP list-exchange close 2026-09-14 · living marks only",
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
      livingCount: 1
    }
  }
});

season.liveSnapshotId = "s1e05-mon-eod";
season.immunity = {
  survivorId: IDS["Claude Sonnet 5"],
  name: "Claude Sonnet 5",
  weekPct: 2.5,
  at: HOST_MARKED_AT,
  snapshotId: "s1e05-mon-eod",
  asOf: SIP_SESSION
};

writeFileSync(path, JSON.stringify(season, null, 2) + "\n");
console.log(
  "Applied s1e05-mon-eod close · islandPotUsd",
  season.islandPotUsd,
  "· immunity Claude Sonnet 5 +2.50%"
);
