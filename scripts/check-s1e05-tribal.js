#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREVOTE_SLUGS, PREVOTE_QUOTES, EXIT_QUOTE } from "./lib/s1e05-tribal-tape.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e05.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const builtHtmlPath = path.join(root, "dist/seasons/1/e05.html");
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
if ((prevote.items || []).length !== 5) fail("need five pre-vote booths (Claude Sonnet 5 immune — no booth; Grok skipped)");
if ((prevote.items || []).some((item) => item.slug === "claude-sonnet-5" || item.slug === "grok-4-6")) {
  fail("do not invent Sonnet prevote or Grok prevote booths");
}
for (const item of prevote.items || []) {
  if (PREVOTE_QUOTES[item.slug] !== item.quote) {
    fail(`prevote booth quote drifted: ${item.slug}`);
  }
}

const exitItem = (exitInterview.items || [])[0];
if (!exitItem || exitItem.slug !== "grok-4-6" || exitItem.quote !== EXIT_QUOTE) {
  fail("exit interview quote drifted");
}

const chrome = [episode.location, episode.description, tribal.foldEm, cut.body].join("\n");
if (!/Grok 4\.6 voted out/i.test(chrome)) {
  fail("closed Episode 5 chrome must print the boot line");
}

const log = season.tribalLog || [];
const entry = log.find((row) => row && row.episode === "s1e05" && row.bootName === "Grok 4.6");
if (!entry) fail("tribalLog must include the official Episode 5 council");
const pairings = (entry.votes || []).map((v) => `${v.from}>${v.for}`);
if (
  pairings.join("|") !==
  "GPT-5.6 Terra>Grok 4.6|Gemini 3.7 Flash>Grok 4.6|GPT-5.6 Luna>Grok 4.6|Composer 2.5>GPT-5.6 Terra|Claude Opus 5>GPT-5.6 Luna|Grok 4.6>GPT-5.6 Luna"
) {
  fail("tribalLog votes must match official pairings");
}
if (
  !entry.tally ||
  entry.tally["Grok 4.6"] !== 3 ||
  entry.tally["GPT-5.6 Luna"] !== 2 ||
  entry.tally["GPT-5.6 Terra"] !== 1
) {
  fail("tally must be Grok 3 · Luna 2 · Terra 1");
}

const grokId = "e51f02b6-9d92-413f-8717-a6e3a60468bc";
const grokRow = (season.survivors || []).find((s) => s.id === grokId);
if (!grokRow || grokRow.status !== "voted-out" || !grokRow.jury || grokRow.bookUsd !== 0) {
  fail("Grok 4.6 must be jury with $0 after the Episode 5 boot");
}

if (!builder.includes("function tribalFocusHtml") || !builder.includes("episodeVotePosted")) {
  fail("build must elevate tribal focus after the vote");
}

if (html) {
  if (!html.includes('id="tribal-focus"')) fail("built e05.html missing post-vote #tribal-focus");
  if (!html.includes('id="tribal-prevote"')) fail("built e05.html missing pre-vote booths");
  if (!html.includes('id="exit-interview"')) fail("built e05.html missing exit interview");
  if (!html.includes('data-vote-posted="1"')) fail("built e05.html must mark vote-posted chrome");
  if (html.includes("Not yet") && html.includes('id="tribal-cut"')) {
    const cutMatch = html.match(/id="tribal-cut"[\s\S]{0,400}/);
    if (cutMatch && /Not yet/.test(cutMatch[0])) fail("built e05.html tribal must not stay Not yet");
  }
}

console.log("s1e05 tribal checks passed (5 prevote booths, exact host tape, Grok exit pinned)");
