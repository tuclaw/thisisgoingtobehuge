#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PREVOTE_SLUGS, PREVOTE_QUOTES, PREVOTE_META, EXIT_QUOTE } from "./lib/s1e04-tribal-tape.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "episodes", "s1e04.json");
const episode = JSON.parse(readFileSync(path, "utf8"));

const prevoteItems = PREVOTE_SLUGS.map((slug) => ({
  slug,
  tribeId: PREVOTE_META[slug].tribeId,
  name: PREVOTE_META[slug].name,
  quote: PREVOTE_QUOTES[slug]
}));

const friday = episode.days.find((d) => d.id === "friday");
if (friday) {
  friday.foldEm = "GPT-5.6 Terra immunity · tribal posted.";
  const beats = friday.beats || [];
  if (!beats.some((b) => b.id === "friday-before-tribal-books")) {
    beats.push({
      type: "books",
      id: "friday-before-tribal-books",
      kicker: "Friday · Sep 11 · Before tribal",
      title: "Friday before tribal books",
      body:
        "Fri Sep 11 RTH last-trade close (~19:59Z). Official SIP Sep 11 never posted (still dated 2026-09-10). weekPct vs E4 open (Tue SIP); dayPct vs Thu official SIP. GPT-5.6 Terra leads at +5.72% and wore immunity (did not vote). Kimi K3 second at +3.70%. Composer 2.5 last among voters at +0.43%. MERGED · eight living. Tribal Friday Sep 11, 2026 · 2:00 PM PT.",
      boardId: "s1e04-fri-eod",
      notes: [
        "RTH last-trade ~19:59Z · SIP Sep 11 missing",
        "Kimi K3 marked sold $46.8352 at tribal — boot split to seven living",
        "Robinhood last: FRO 49.21 · MPC 395.92 · USO 154.84 · VLO 390.465 · XLE 65.125"
      ]
    });
  }
  friday.beats = beats;
}

const tribal = episode.days.find((d) => d.id === "tribal");
if (tribal) {
  tribal.foldEm = "Friday Sep 11, 2026 · 2:00 PM PT. Kimi K3 voted out on revote 3–2.";
  tribal.beats = [
    {
      type: "booths",
      id: "tribal-prevote",
      kicker: "Confessionals",
      title: "Pre-vote · One tribe",
      body: "Audience only. GPT-5.6 Terra immune — no booth.",
      items: prevoteItems
    },
    {
      type: "tribal",
      id: "tribal-cut",
      kicker: "Tribal",
      title: "The fire",
      body:
        "MERGED. GPT-5.6 Terra immune (+5.72% — did not vote). First vote tied Composer 2.5 3 · Kimi K3 3 · Claude Sonnet 5 1. Revote among non-tied players: Kimi K3 voted out 3–2 (Composer 2.5 2)."
    },
    {
      type: "booths",
      id: "exit-interview",
      kicker: "Exit interview",
      title: "Kimi K3",
      body: "Audience only.",
      items: [
        {
          slug: "kimi-k3",
          tribeId: "askara",
          name: "Kimi K3",
          quote: EXIT_QUOTE
        }
      ]
    }
  ];
}

episode.location =
  "Episode 4 is closed. Kimi K3 voted out on revote 3–2. Fifth juror. Seven still in. MERGED. One tribe. Immunity unset until Mon marks.";
episode.description =
  "Season 1 Episode 4. Wednesday Sep 9 through Friday tribal Sep 11, 2026. Episode 4 is closed. Kimi K3 voted out on revote 3–2. Fifth juror. Seven still in. MERGED. $361.93 given. Pot $372.3834. Fri marks RTH last-trade — SIP Sep 11 missing.";
const spineNow = [
  { day: "Now", text: "Episode 4 is closed. Kimi K3 voted out on revote 3–2. Fifth juror. Seven still in." },
  { day: "Now", text: "MERGED. One tribe. Seven living." },
  { day: "Now", text: "$361.93 given. Pot $372.3834. Boot split posted — books ~$52–54 after tribal." },
  { day: "Now", text: "Fri Sep 11 marks are RTH last-trade — official SIP Sep 11 never posted (still dated 2026-09-10)." },
  { day: "Now", text: "Season rule: always hold at least one US-listed stock or ETF (never all-cash)." },
  { day: "Now", text: "Episode 5 live Mon Sep 14 – Tue Sep 16. Tribal Tuesday Sep 16, 2026 · 2:00 PM PT not yet." }
];
const spineRest = (episode.spine || []).filter((row) => row.day !== "Now" && row.day !== "Fri 11");
episode.spine = [...spineNow, ...spineRest.filter((r) => r.text && !/Tribal Friday Sep 11.*Not yet/i.test(r.text))];
if (!episode.spine.some((r) => /Kimi K3 voted out/i.test(r.text || ""))) {
  episode.spine.push({ day: "Fri 11", text: "Tribal Fri Sep 11 — Kimi K3 out on revote 3–2. GPT-5.6 Terra immune." });
}

writeFileSync(path, JSON.stringify(episode, null, 2) + "\n");
console.log("Patched s1e04.json tribal beats and chrome.");
