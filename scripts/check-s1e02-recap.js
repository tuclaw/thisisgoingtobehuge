#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e02.json"), "utf8"));
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const builtE01 = path.join(root, "dist/seasons/1/e01.html");
const builtE02 = path.join(root, "dist/seasons/1/e02.html");
const e01Html = fs.existsSync(builtE01) ? fs.readFileSync(builtE01, "utf8") : "";
const e02Html = fs.existsSync(builtE02) ? fs.readFileSync(builtE02, "utf8") : "";

function fail(message) {
  throw new Error(message);
}

if (!app.includes("function priorTribalLog") || !app.includes("function renderEpisodeRecapSpoiler")) {
  fail("app.js must keep priorTribalLog / renderEpisodeRecapSpoiler");
}
if (!app.includes("renderEpisodeRecapSpoiler(season)")) {
  fail("renderEpisode must mount the prior-episode recap spoiler");
}
if (!app.includes("episode-recap-spoiler-result")) {
  fail("recap spoiler must use a unique result id");
}
if (!app.includes('kicker: "RECAP"')) {
  fail("Episode 2 recap spoiler kicker must be RECAP");
}
if (!app.includes("Reveal the results of the Episode 1 tribal council vote")) {
  fail("recap spoiler must use the Episode 1 tribal council reveal line");
}
if (!app.includes("entry.episode !== ep.id")) {
  fail("priorTribalLog must exclude the current episode's tribal");
}
if (app.includes("Claude Fable 5") && /renderEpisodeRecapSpoiler[\s\S]*Claude Fable 5/.test(app)) {
  fail("do not print the boot name in recap spoiler chrome");
}

if (!builder.includes('id="episode-recap"') || !builder.includes('id="episode-recap-stage"')) {
  fail("build must mount #episode-recap under the week diagram");
}
const recapIdx = builder.indexOf('id="episode-recap"');
const tickerIdx = builder.indexOf('id="money-ticker"');
const booksIdx = builder.indexOf('id="latest-books"');
if (!(tickerIdx > -1 && recapIdx > tickerIdx && booksIdx > recapIdx)) {
  fail("recap mount must sit after #money-ticker and before #latest-books");
}

if (!css.includes(".episode-recap") || !css.includes(".episode-recap[hidden]")) {
  fail("styles.css missing .episode-recap recap band");
}

const tribal = (episode.days || []).find((day) => day.id === "tribal");
if (!tribal) fail("Episode 2 tribal fold missing");
if (!/Not yet/.test(String(tribal.foldEm || "") + JSON.stringify(tribal.beats || []))) {
  fail("Episode 2 tribal must stay Not yet — recap is last week's vote, not this Friday");
}

const log = season.tribalLog || [];
if (!log.some((entry) => entry && entry.episode === "s1e01" && entry.bootName === "Claude Fable 5")) {
  fail("recap must read the official Episode 1 tribalLog entry");
}
if (log.some((entry) => entry && entry.episode === "s1e02")) {
  fail("do not invent an Episode 2 tribal for the recap");
}

if (e02Html) {
  if (e02Html.includes("hero-listen") || e02Html.includes("Replay the books")) {
    fail("e02.html must not print the hero listen line or Replay the books ticker copy");
  }
  if (e02Html.includes("holdings-kicker") || e02Html.includes("season-banner")) {
    fail("e02.html must not print the ranked-by-week kicker or status banner");
  }
  const booksStart = e02Html.indexOf('id="latest-books"');
  const booksEnd = booksStart > -1 ? e02Html.indexOf("</article>", booksStart) : -1;
  const booksChunk = booksStart > -1 ? e02Html.slice(booksStart, booksEnd > booksStart ? booksEnd : booksStart + 800) : "";
  if (
    booksChunk.includes("Marks only") ||
    booksChunk.includes("leads the week") ||
    booksChunk.includes("weekPct vs") ||
    booksChunk.includes("Tue Sep 1 open")
  ) {
    fail("e02.html latest books must not print the mark-status lede");
  }
  if (!e02Html.includes('id="episode-recap"')) fail("built e02.html missing #episode-recap");
  if (!e02Html.includes("tribal-spoiler-burn.js")) fail("built e02.html must keep tribal-spoiler-burn.js");
  const e2Ticker = e02Html.indexOf('id="money-ticker"');
  const e2Recap = e02Html.indexOf('id="episode-recap"');
  const e2Books = e02Html.indexOf('id="latest-books"');
  const e2Tribal = e02Html.indexOf('id="episode-tribal"');
  if (!(e2Ticker < e2Recap && e2Recap < e2Books)) {
    fail("built e02.html order must be #money-ticker → #episode-recap → #latest-books");
  }
  if (e2Tribal > -1 && e2Tribal < e2Books) {
    fail("Episode 2 this-week tribal must stay in the Friday fold, not under the diagram");
  }
  const recapChrome = e02Html.slice(e2Recap, e2Books);
  if (/Claude Fable 5/.test(recapChrome)) {
    fail("do not print the boot name in the Episode 2 recap chrome");
  }
}

if (e01Html) {
  const e1Recap = e01Html.indexOf('id="episode-recap"');
  const e1Focus = e01Html.indexOf('id="tribal-focus"');
  const e1Tribal = e01Html.indexOf('id="episode-tribal"');
  if (e1Recap > -1 && e1Focus > -1 && !(e1Recap < e1Focus)) {
    fail("Episode 1 recap mount must stay above #tribal-focus when present");
  }
  if (e1Recap > -1 && e1Tribal > -1 && e1Recap < e1Tribal) {
    const recapChunk = e01Html.slice(e1Recap, e1Tribal);
    if (!/\shidden/.test(recapChunk) && !/hidden>/.test(recapChunk)) {
      fail("Episode 1 recap mount must stay hidden — that page has its own vote");
    }
  }
}

console.log("s1e02 recap checks passed (Episode 1 vote under the Episode 2 diagram)");
