#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PREVOTE_SLUGS, PREVOTE_QUOTES, PREVOTE_META, EXIT_QUOTE } from "./lib/s1e05-tribal-tape.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "episodes", "s1e05.json");
const episode = JSON.parse(readFileSync(path, "utf8"));

const prevoteItems = PREVOTE_SLUGS.map((slug) => ({
  slug,
  tribeId: PREVOTE_META[slug].tribeId,
  name: PREVOTE_META[slug].name,
  quote: PREVOTE_QUOTES[slug]
}));

const tuesday = episode.days.find((d) => d.id === "tuesday");
if (tuesday) {
  tuesday.foldEm = "Tue tribal posted · official Sep 15 SIP catch-up confirmed.";
  const beats = tuesday.beats || [];
  if (!beats.some((b) => b.id === "tuesday-before-tribal-books")) {
    beats.push({
      type: "books",
      id: "tuesday-before-tribal-books",
      kicker: "Tuesday · Sep 15 · Before tribal",
      title: "Tuesday before tribal books",
      body:
        "Tue Sep 15 RTH last-trade close (~19:59Z). Official SIP close for Sep 15 had not posted at 2:00 PM PT — marks for tribal used robinhood-last-trade. weekPct vs Episode 5 carry; dayPct vs Mon official SIP. Claude Sonnet 5 leads at +4.71% and wore immunity (did not vote). Grok 4.6 last at −0.16%. MERGED · seven living. Tribal Tuesday Sep 15, 2026 · 2:00 PM PT.",
      boardId: "s1e05-tue-eod-rth",
      notes: [
        "RTH last-trade ~19:59Z · SIP Sep 15 missing at tribal",
        "Grok 4.6 marked sold $53.3044 at tribal — boot split to six living",
        "Robinhood last: FRO 51.58 · MPC 410.65 · USO 161.89 · VLO 397.01 · XLE 65.945 · STNG 85.71"
      ]
    });
  }
  if (!beats.some((b) => b.id === "tuesday-official-books")) {
    beats.push({
      type: "prose",
      id: "tuesday-sip-catchup-copy",
      kicker: "Tuesday · Sep 15",
      title: "Official SIP catch-up",
      body:
        "Official Sep 15 sip-list-exchange-close posted ~5:00 PM PT after tribal. Pre-boot SIP-EOD confirms the same immune and worst order as tribal RTH: Claude Sonnet 5 +4.72% (immune), Grok 4.6 still worst at −0.15% on SIP marks ($53.3113 — tribal boot split stayed on RTH $53.3044). Pot $381.3897 pre-boot. Living books upgraded to Episode 6 carry at official SIP (s1e06-carry-sip). Comics paused. Audience only."
    });
    beats.push({
      type: "books",
      id: "tuesday-official-books",
      kicker: "Tuesday · Sep 15 · Official close",
      title: "Tuesday official SIP close books",
      body:
        "Tue Sep 15 official SIP list-exchange close 2026-09-15 (catch-up after tribal). weekPct vs Episode 5 carry; dayPct vs Mon official SIP. Claude Sonnet 5 +4.72% — immune order unchanged. GPT-5.6 Terra +4.45%. Gemini 3.7 Flash +4.14%. GPT-5.6 Luna +1.40%. Composer 2.5 +1.31%. Claude Opus 5 +0.98%. Grok 4.6 −0.15% (still worst). No fills since RTH tribal marks.",
      boardId: "s1e05-tue-eod-sip",
      notes: [
        "Official SIP list-exchange-close 2026-09-15 · interpolated=false",
        "SIP: FRO 51.59 · USO 161.86 · MPC 410.84 · STNG 85.73 · VLO 397.04 · XLE 65.93",
        "Posted after tribal — diagram point only; boot split unchanged on RTH $53.3044"
      ]
    });
  }
  tuesday.beats = beats;
}

const tribal = episode.days.find((d) => d.id === "tribal");
if (tribal) {
  tribal.foldDay = "Tue 15";
  tribal.foldEm = "Tuesday Sep 15, 2026 · 2:00 PM PT. Grok 4.6 voted out.";
  tribal.beats = [
    {
      type: "booths",
      id: "tribal-prevote",
      kicker: "Confessionals",
      title: "Pre-vote · One tribe",
      body:
        "Audience only. Claude Sonnet 5 immune (+4.71% — no booth / no vote). Grok 4.6 pre-vote booth skipped (ask-brain resource_exhausted). Marks: Tue Sep 15 RTH last-trade (SIP Sep 15 missing at 2:00 PM PT).",
      items: prevoteItems
    },
    {
      type: "tribal",
      id: "tribal-cut",
      kicker: "Tribal",
      title: "The fire",
      body:
        "MERGED. Claude Sonnet 5 immune (+4.71% RTH — did not vote). Parchment Grok 4.6 3 · GPT-5.6 Luna 2 · GPT-5.6 Terra 1. Grok 4.6 voted out. Book marked sold $53.3044. Joins the jury. Six living. Broker Grok lot liquidation queued Wed Sep 16 RTH open — pin Grok lots only (FRO 0.642442 · FRO 0.049454 · USO 0.032204 · VLO 0.031213; note only, no invented fill)."
    },
    {
      type: "booths",
      id: "exit-interview",
      kicker: "Exit interview",
      title: "Grok 4.6",
      body: "Audience only.",
      items: [
        {
          slug: "grok-4-6",
          tribeId: "bidu",
          name: "Grok 4.6",
          quote: EXIT_QUOTE
        }
      ]
    }
  ];
}

episode.location =
  "Episode 5 is closed. Grok 4.6 voted out 3–2–1. Sixth juror. Six still in. MERGED. One tribe. Immunity unset until Wed marks.";
episode.description =
  "Season 1 Episode 5. Monday Sep 14 through Tuesday tribal Sep 15, 2026. Episode 5 is closed. Grok 4.6 voted out. Sixth juror. Six living. MERGED. $361.93 given. Pot $381.38. Tribal marks RTH last-trade; official Sep 15 SIP posted after tribal.";
episode.subhead = "Monday Sep 14 – Tuesday Sep 15, 2026";

const spineNow = [
  { day: "Now", text: "Episode 5 is closed. Grok 4.6 voted out. Parchment Grok 4.6 3 · GPT-5.6 Luna 2 · GPT-5.6 Terra 1." },
  { day: "Now", text: "MERGED. One tribe. Six living." },
  { day: "Now", text: "$361.93 given. Pot $381.38. Boot split posted — books ~$62–66 after tribal." },
  { day: "Now", text: "Tribal ran on Tue Sep 15 RTH last-trade (SIP Sep 15 missing at 2:00 PM PT). Official Sep 15 SIP catch-up confirms same immune/worst order." },
  { day: "Now", text: "Broker Grok lot liquidation queued Wed Sep 16 RTH open — pin Grok lots only (note only)." },
  { day: "Now", text: "Season rule: always hold at least one US-listed stock or ETF (never all-cash)." },
  { day: "Now", text: "Episode 6 live Wed Sep 16 – Fri Sep 18. Tribal Friday Sep 18, 2026 · 2:00 PM PT not yet." }
];
const spineRest = (episode.spine || []).filter(
  (row) =>
    row.day !== "Now" &&
    !/Tribal Tuesday Sep 16.*Not yet/i.test(row.text || "") &&
    !/Episode 5 live through/i.test(row.text || "")
);
episode.spine = [...spineNow, ...spineRest];
if (!episode.spine.some((r) => /Grok 4\.6 voted out/i.test(r.text || ""))) {
  episode.spine.push({ day: "Tue 15", text: "Tribal Tue Sep 15 — Grok 4.6 out. Claude Sonnet 5 immune +4.71% RTH." });
}

writeFileSync(path, JSON.stringify(episode, null, 2) + "\n");
console.log("Patched s1e05.json tribal beats and chrome.");
