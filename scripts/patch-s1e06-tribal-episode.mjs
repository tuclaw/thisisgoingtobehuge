#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PREVOTE_SLUGS, PREVOTE_QUOTES, PREVOTE_META, EXIT_QUOTE } from "./lib/s1e06-tribal-tape.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "episodes", "s1e06.json");
const episode = JSON.parse(readFileSync(path, "utf8"));

episode.location =
  "Episode 6 is closed. Gemini 3.7 Flash voted out 4–1. Seventh juror. Five still in. MERGED. One tribe. Immunity unset until Mon marks.";
episode.description =
  "Season 1 Episode 6. Wednesday Sep 16 through Friday tribal Sep 18, 2026. Episode 6 is closed. Gemini 3.7 Flash voted out. Seventh juror. Five living. MERGED. $361.93 given. Pot $389.1083. Tribal marks RTH last-trade; SIP Sep 18 missing. BUY-only remake.";
episode.spine = [
  { day: "Now", text: "Episode 6 is closed. Gemini 3.7 Flash voted out. Parchment Gemini 3.7 Flash 4 · GPT-5.6 Luna 1." },
  { day: "Now", text: "MERGED. One tribe. Five living." },
  { day: "Now", text: "$361.93 given. Pot $389.1083. Boot split posted — books ~$75–81 after tribal." },
  { day: "Now", text: "Fri Sep 18 marks are RTH last-trade — official SIP Sep 18 still missing (still dated 2026-09-17). BUY-only remake." },
  { day: "Now", text: "Broker Gemini lot liquidation queued Mon Sep 21 RTH open — pin Gemini lots only (FRO 0.192569 · STNG 0.099088 · STNG 0.493156; note only)." },
  { day: "Now", text: "Season rule: always hold at least one US-listed stock or ETF (never all-cash)." },
  { day: "Now", text: "Episode 7 live Mon Sep 21 – Tue Sep 22. Tribal Tuesday Sep 22, 2026 · 2:00 PM PT not yet." },
  { day: "Wed 16", text: "Wed open — hunt-brain 6/6. Grok boot liq cleared. Ten contestant fills." },
  { day: "Thu 17", text: "Thu open/mid/last-hour + official SIP-EOD catch-up." },
  { day: "Fri 18", text: "Fri open/mid/last-hour fills. Tribal Fri Sep 18 2:00 PM PT — Gemini 3.7 Flash out." }
];

const friday = episode.days.find((d) => d.id === "friday");
if (friday) {
  friday.foldEm = "Fri RTH-EOD before tribal · Gemini 3.7 Flash voted out.";
  const beats = friday.beats || [];
  if (!beats.some((b) => b.id === "friday-eod-rth-books")) {
    beats.push({
      type: "books",
      id: "friday-eod-rth-books",
      kicker: "Friday · Sep 18 · Before tribal",
      title: "Friday RTH-EOD books",
      body:
        "Fri Sep 18 RTH last-trade close (~19:59Z). Official SIP close for Sep 18 had not posted at 2:00 PM PT — marks for tribal used robinhood-last-trade. BUY-only remake (SELL ledger rows are history, not open longs). weekPct vs Episode 6 SIP carry; dayPct vs Thu official SIP. Composer 2.5 leads at +10.36% and wore immunity (did not vote). Gemini 3.7 Flash last at −4.22%. MERGED · six living. Tribal Friday Sep 18, 2026 · 2:00 PM PT.",
      boardId: "s1e06-fri-eod-rth",
      notes: [
        "RTH last-trade ~19:59Z · SIP Sep 18 missing at tribal",
        "Gemini 3.7 Flash marked sold $61.6280 at tribal — boot split to five living",
        "Robinhood last: FRO 51.36 · STNG 87.15 · TRMD 38.23 · VLO 412.92 · MPC 424.66 · GNRC 207.62 · USO 153.85 · XLE 64.32"
      ]
    });
  }
  friday.beats = beats;
}

const prevoteItems = PREVOTE_SLUGS.map((slug) => ({
  slug,
  tribeId: PREVOTE_META[slug].tribeId,
  name: PREVOTE_META[slug].name,
  quote: PREVOTE_QUOTES[slug]
}));

const tribal = episode.days.find((d) => d.id === "tribal");
if (tribal) {
  tribal.foldDay = "Fri 18";
  tribal.foldEm = "Friday Sep 18, 2026 · 2:00 PM PT. Gemini 3.7 Flash voted out.";
  tribal.beats = [
    {
      type: "booths",
      id: "tribal-prevote",
      kicker: "Confessionals",
      title: "Pre-vote · One tribe",
      body:
        "Audience only. Composer 2.5 immune (+10.36% — no booth / no vote). Marks: Fri Sep 18 RTH last-trade (SIP Sep 18 missing). Contestants saw own book + living net P&L only.",
      items: prevoteItems
    },
    {
      type: "tribal",
      id: "tribal-cut",
      kicker: "Tribal",
      title: "The fire",
      body:
        "MERGED. Composer 2.5 immune (+10.36% RTH — did not vote). Parchment Gemini 3.7 Flash 4 · GPT-5.6 Luna 1. Gemini 3.7 Flash voted out. Book marked sold $61.6280. Joins the jury. Five living. Broker Gemini lot liquidation queued Mon Sep 21 RTH open — pin Gemini lots only (FRO 0.192569 · STNG 0.099088 · STNG 0.493156; note only, no invented fill)."
    },
    {
      type: "booths",
      id: "exit-interview",
      kicker: "Exit interview",
      title: "Gemini 3.7 Flash",
      body: "Audience only.",
      items: [
        {
          slug: "gemini-3-7-flash",
          tribeId: "bidu",
          name: "Gemini 3.7 Flash",
          quote: EXIT_QUOTE
        }
      ]
    }
  ];
}

writeFileSync(path, JSON.stringify(episode, null, 2) + "\n");
console.log("Patched s1e06.json tribal close.");
