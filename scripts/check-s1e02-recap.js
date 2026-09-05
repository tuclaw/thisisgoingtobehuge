#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const episode2 = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e02.json"), "utf8"));
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const builtE01 = path.join(root, "dist/seasons/1/e01.html");
const builtE02 = path.join(root, "dist/seasons/1/e02.html");
const builtE03 = path.join(root, "dist/seasons/1/e03.html");
const e01Html = fs.existsSync(builtE01) ? fs.readFileSync(builtE01, "utf8") : "";
const e02Html = fs.existsSync(builtE02) ? fs.readFileSync(builtE02, "utf8") : "";
const e03Html = fs.existsSync(builtE03) ? fs.readFileSync(builtE03, "utf8") : "";

function fail(message) {
  throw new Error(message);
}

if (!app.includes("function priorTribalLog") || !app.includes("function renderEpisodeRecapSpoiler")) {
  fail("app.js must keep priorTribalLog / renderEpisodeRecapSpoiler");
}
if (!app.includes("renderEpisodeRecapSpoiler(season)")) {
  fail("renderEpisode must mount the prior-episode recap spoiler");
}
if (!app.includes("entry.episode !== ep.id")) {
  fail("priorTribalLog must exclude the current episode's tribal");
}

const tribalE2 = (episode2.days || []).find((day) => day.id === "tribal");
if (!tribalE2) fail("Episode 2 tribal fold missing");
if (/Not yet/.test(String(tribalE2.foldEm || "") + JSON.stringify(tribalE2.beats || []))) {
  fail("Episode 2 tribal must be posted — not Not yet");
}
if (!/Gemini 3\.1 Pro voted out 3–1/.test(JSON.stringify(tribalE2.beats || []))) {
  fail("Episode 2 tribal must print the official boot");
}

const log = season.tribalLog || [];
if (!log.some((entry) => entry && entry.episode === "s1e01" && entry.bootName === "Claude Fable 5")) {
  fail("recap must read the official Episode 1 tribalLog entry");
}
if (!log.some((entry) => entry && entry.episode === "s1e02" && entry.bootName === "Gemini 3.1 Pro")) {
  fail("Episode 2 tribalLog entry required for Episode 3 recap");
}

if (e02Html) {
  if (!e02Html.includes('id="tribal-focus"')) fail("built e02.html missing #tribal-focus after vote");
  if (e02Html.includes('id="episode-recap"')) {
    const recapChunk = e02Html.slice(e02Html.indexOf('id="episode-recap"'), e02Html.indexOf('id="latest-books"'));
    if (/Claude Fable 5/.test(recapChunk)) {
      fail("Episode 2 page recap chrome must not print the boot name");
    }
  }
}

if (e03Html) {
  if (!e03Html.includes('id="episode-recap"')) fail("built e03.html missing #episode-recap");
  if (!e03Html.includes("tribal-spoiler-burn.js")) fail("built e03.html must keep tribal-spoiler-burn.js");
  const e3Ticker = e03Html.indexOf('id="money-ticker"');
  const e3Recap = e03Html.indexOf('id="episode-recap"');
  const e3Books = e03Html.indexOf('id="latest-books"');
  if (!(e3Ticker < e3Recap && e3Recap < e3Books)) {
    fail("built e03.html order must be #money-ticker → #episode-recap → #latest-books");
  }
  const recapChrome = e03Html.slice(e3Recap, e3Books);
  if (/Gemini 3\.1 Pro/.test(recapChrome)) {
    fail("do not print the boot name in the Episode 3 recap chrome");
  }
}

if (e01Html) {
  const e1Recap = e01Html.indexOf('id="episode-recap"');
  const e1Focus = e01Html.indexOf('id="tribal-focus"');
  if (e1Recap > -1 && e1Focus > -1 && !(e1Recap < e1Focus)) {
    fail("Episode 1 recap mount must stay above #tribal-focus when present");
  }
}

console.log("s1e02 recap checks passed (Episode 1 vote under Episode 2; Episode 2 vote under Episode 3)");
