#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREVOTE_SLUGS, PREVOTE_QUOTES, EXIT_QUOTE } from "./lib/s1e04-tribal-tape.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e04.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const builtHtmlPath = path.join(root, "dist/seasons/1/e04.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";

function fail(message) {
  throw new Error(message);
}

const tribal = (episode.days || []).find((day) => day.id === "tribal");
if (!tribal) fail("tribal fold missing");
const beats = tribal.beats || [];
const prevote = beats.find((beat) => beat.id === "tribal-prevote");
const cut = beats.find((beat) => beat.id === "tribal-cut" && beat.type === "tribal");
const exitInterview = beats.find((beat) => beat.id === "exit-interview");
if (!prevote || prevote.type !== "booths") fail("missing tribal-prevote booths");
if (!cut) fail("missing tribal-cut beat");
if (!exitInterview) fail("missing exit-interview");
if (beats.indexOf(prevote) > beats.indexOf(cut)) fail("pre-vote booths must sit above the spoiler");
if (beats.indexOf(exitInterview) <= beats.indexOf(cut)) fail("exit interview must sit below the spoiler");

const prevoteSlugs = (prevote.items || []).map((item) => item.slug);
if (prevoteSlugs.join("|") !== PREVOTE_SLUGS.join("|")) {
  fail("prevote booth order drifted");
}
if ((prevote.items || []).length !== 7) fail("need seven pre-vote booths (GPT-5.6 Terra immune — no booth)");
if ((prevote.items || []).some((item) => item.slug === "gpt-5-6-terra")) {
  fail("do not invent a GPT-5.6 Terra prevote booth");
}
for (const item of prevote.items || []) {
  if (PREVOTE_QUOTES[item.slug] !== item.quote) {
    fail(`prevote booth quote drifted: ${item.slug}`);
  }
}

const exitItem = (exitInterview.items || [])[0];
if (!exitItem || exitItem.slug !== "kimi-k3" || exitItem.quote !== EXIT_QUOTE) {
  fail("exit interview quote drifted");
}

const chrome = [episode.location, episode.description, tribal.foldEm, cut.body].join("\n");
if (!/Kimi K3 voted out.*revote 3–2/i.test(chrome)) {
  fail("closed Episode 4 chrome must print the boot line");
}

const log = season.tribalLog || [];
const entry = log.find((row) => row && row.episode === "s1e04" && row.bootName === "Kimi K3");
if (!entry) fail("tribalLog must include the official Episode 4 council");
const pairings = (entry.votes || []).map((v) => `${v.from}>${v.for}`);
if (
  pairings.join("|") !==
  "Kimi K3>Claude Sonnet 5|Claude Sonnet 5>Composer 2.5|Gemini 3.7 Flash>Kimi K3|Grok 4.6>Kimi K3|GPT-5.6 Luna>Composer 2.5|Claude Opus 5>Composer 2.5|Composer 2.5>Kimi K3"
) {
  fail("tribalLog round-1 votes must match official pairings");
}
if (!entry.tally || entry.tally["Composer 2.5"] !== 3 || entry.tally["Kimi K3"] !== 3 || entry.tally["Claude Sonnet 5"] !== 1) {
  fail("do not rebuild or invent round-1 tally — use Composer 3 · Kimi 3 · Sonnet 1");
}
const revotePairings = (entry.revoteVotes || []).map((v) => `${v.from}>${v.for}`);
if (
  revotePairings.join("|") !==
  "Claude Sonnet 5>Kimi K3|Gemini 3.7 Flash>Kimi K3|Grok 4.6>Kimi K3|GPT-5.6 Luna>Composer 2.5|Claude Opus 5>Composer 2.5"
) {
  fail("tribalLog revote votes must match official pairings");
}
if (!entry.revoteTally || entry.revoteTally["Kimi K3"] !== 3 || entry.revoteTally["Composer 2.5"] !== 2) {
  fail("revote tally must be Kimi 3 · Composer 2");
}

const kimiId = "ea7f46b1-2068-4d81-b153-22faadfbc1cb";
const kimiRow = (season.survivors || []).find((s) => s.id === kimiId);
if (!kimiRow || kimiRow.status !== "voted-out" || !kimiRow.jury || kimiRow.bookUsd !== 0) {
  fail("Kimi K3 must be jury with $0 after the Episode 4 boot");
}

if (!builder.includes("function tribalFocusHtml") || !builder.includes("episodeVotePosted")) {
  fail("build must elevate tribal focus after the vote");
}

if (html) {
  if (!html.includes('id="tribal-focus"')) fail("built e04.html missing post-vote #tribal-focus");
  if (!html.includes('id="tribal-prevote"')) fail("built e04.html missing pre-vote booths");
  if (!html.includes('id="exit-interview"')) fail("built e04.html missing exit interview");
  if (!html.includes('data-vote-posted="1"')) fail("built e04.html must mark vote-posted chrome");
  if (html.includes("Not yet") && html.includes('id="tribal-cut"')) {
    const cutMatch = html.match(/id="tribal-cut"[\s\S]{0,400}/);
    if (cutMatch && /Not yet/.test(cutMatch[0])) fail("built e04.html tribal must not stay Not yet");
  }
}

console.log("s1e04 tribal checks passed (7 prevote booths, exact host tape, Kimi exit pinned)");
