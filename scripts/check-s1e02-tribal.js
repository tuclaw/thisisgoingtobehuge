#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isBoardNative } from "./lib/ledger.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const boardNative = isBoardNative(season);
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e02.json"), "utf8"));
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const builtHtmlPath = path.join(root, "dist/seasons/1/e02.html");
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
if (!cut) fail("missing tribal-cut beat with #episode-tribal");
if (!exitInterview) fail("missing exit-interview");
if (beats.indexOf(prevote) > beats.indexOf(cut)) fail("pre-vote booths must sit above the spoiler");
if ((prevote.items || []).length !== 4) fail("need four pre-vote booths (no Grok 4.5 booth)");

const prevoteNames = (prevote.items || []).map((item) => item.name);
if (prevoteNames.join("|") !== "GPT-5.6 Sol|Gemini 3.1 Pro|GPT-5.6 Luna|Kimi K3") {
  fail("prevote booth models drifted");
}
if ((prevote.items || []).some((item) => item.slug === "grok-4-5")) {
  fail("do not invent a Grok 4.5 prevote booth");
}

const chrome = [episode.location, episode.description, tribal.foldEm, cut.body].join("\n");
if (!/Gemini 3\.1 Pro voted out 3–1/.test(chrome)) {
  fail("closed Episode 2 chrome must print the boot line");
}

const log = season.tribalLog || [];
const entry = log.find((row) => row && row.episode === "s1e02");
if (!entry) fail("tribalLog must include the official Episode 2 council");
if (entry.bootName !== "Gemini 3.1 Pro") fail("bootName must be Gemini 3.1 Pro");
const pairings = (entry.votes || []).map((v) => `${v.from}>${v.for}`);
if (pairings.join("|") !== "GPT-5.6 Sol>Gemini 3.1 Pro|Gemini 3.1 Pro>GPT-5.6 Sol|GPT-5.6 Luna>Gemini 3.1 Pro|Kimi K3>Gemini 3.1 Pro") {
  fail("tribalLog votes must be the official 3–1 pairings");
}
if (!entry.tally || entry.tally["Gemini 3.1 Pro"] !== 3 || entry.tally["GPT-5.6 Sol"] !== 1) {
  fail("do not rebuild or invent a tally — use the official 3 / 1");
}
if (!entry.summary || !entry.summary.includes("Grok 4.5 vote skipped")) {
  fail("official tribalLog summary drifted");
}

const proId = "e6d9d407-e5e1-46c2-b767-07a51eb6a5fb";
const proRow = (season.survivors || []).find((s) => s.id === proId);
if (!proRow || proRow.status !== "voted-out" || !proRow.jury || proRow.bookUsd !== 0) {
  fail("Gemini 3.1 Pro must be jury with $0 after the Episode 2 boot");
}

if (!builder.includes("function tribalFocusHtml") || !builder.includes("episodeVotePosted")) {
  fail("build must elevate tribal focus after the vote");
}

if (html) {
  if (!html.includes('id="tribal-focus"')) fail("built e02.html missing post-vote #tribal-focus");
  if (!html.includes('id="tribal-prevote"')) fail("built e02.html missing pre-vote booths");
  if (!html.includes('id="exit-interview"')) fail("built e02.html missing exit interview");
  if (!html.includes('data-vote-posted="1"')) fail("built e02.html must mark vote-posted chrome");
  if (html.includes("Not yet") && html.includes('id="tribal-cut"')) {
    fail("built e02.html tribal must not stay Not yet");
  }
}

console.log("s1e02 tribal checks passed (vote below diagram, collapsed prevote, spoiler intact)");
