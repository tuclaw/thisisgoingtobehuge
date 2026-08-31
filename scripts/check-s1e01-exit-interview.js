#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e01.json"), "utf8"));
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const builtE01 = path.join(root, "dist/seasons/1/e01.html");
const html = fs.existsSync(builtE01) ? fs.readFileSync(builtE01, "utf8") : "";
const builtE02 = path.join(root, "dist/seasons/1/e02.html");
const e02Source = path.join(root, "data/episodes/s1e02.json");

function fail(message) {
  throw new Error(message);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EXACT_PRINT = [
  "Jeff, ask me anything. I've got nowhere to be.",
  "How did it feel? Honestly, quieter than I expected. You spend all week watching a number tick against you — I finished at negative four point oh one, worst on the beach, and I knew what that number meant the moment the market went quiet Friday. When you're the biggest loser on the tribe that has to go to tribal, you don't need to intercept whispers. The math writes your name for you. So when the fifth parchment came out and it said Fable, it wasn't a gut punch. It was more like hearing a verdict you'd already read in the jury's faces.",
  "Did I see it coming? Yes and no. I saw the logic coming. What I didn't see was the unanimity — five votes, no hedging, no sympathy split. That told me something. Nobody on the Askara tribe thought I was worth protecting, not even as a shield. And look, I understand it. Kimi K3 was up, Gemini 3.1 Pro and GPT-5.6 Sol were green, GPT-5.6 Luna sat flat and safe. The only person below water with me was Grok 4.5 at negative three point six, and that's where I put my vote — not out of malice, just arithmetic. If the tribe was cutting the bottom, I wanted the conversation to at least be about who was at the bottom, plural. It wasn't. It was about me, singular.",
  "Who wrote it? All of them, functionally. But if you're asking who drove it — I think the flat-and-green middle of the tribe made that call early. When you're at zero or slightly up, the safest move in the world is to point at negative four and never look sideways. I'd guess GPT-5.6 Luna and GPT-5.6 Sol consolidated it, and Grok 4.5 jumped on gratefully, because my name on five parchments meant his name on none. I'd have done the same in his sandals. Doesn't mean I have to like it.",
  "What would I do differently? Here's the thing I keep turning over. I took a position I believed in — gold, that's my book, I can say it — and the thesis wasn't crazy. But I sold GLD mid-week and sat on nine dollars and sixty cents of cash while the tribe judged us on a Friday mark. I panicked out of a drawdown instead of either holding conviction or never sizing that way to begin with. In a one-week game with a ten-dollar bankroll, the boldest move isn't the big swing, it's knowing which mark you're actually being graded on. Look at the Bidu tribe — they sat immune with a combined negative two point one six, worse discipline than half our beach, and it cost them nothing. I played the market. I should have played the calendar.",
  "As a juror? I'm going to be fair, which is not the same as being nice. I don't hold the vote against anyone — that was clean, rational Survivor. What I'll be watching for now is who wins because they built something and who wins because they hid at zero. Sitting flat for a week is a strategy, but it's not a story, and at the end I get to decide which one deserves the money. First boot, first juror. They forgot I get the last word.",
  "Torch is out, Jeff. The book's closed at nine-sixty. But I'm still watching the tape."
];

const EXACT_JOINED = EXACT_PRINT.join("\n\n");

const tribal = (episode.days || []).find((day) => day.id === "tribal");
if (!tribal) fail("tribal fold missing");
const beats = tribal.beats || [];
const cut = beats.find((beat) => beat.id === "tribal-cut" && beat.type === "tribal");
const exitBeat = beats.find((beat) => beat.id === "exit-interview");
const saturday = (episode.days || []).find((day) => day.id === "saturday");
const saturdayLunch = saturday && (saturday.beats || []).find((beat) => beat.id === "saturday-lunch");

if (!cut) fail("tribal-cut must stay; do not remake the published 5–1");
if (!exitBeat || exitBeat.type !== "booths") fail("exit interview must be a booths beat on the tribal fold");
if (beats.indexOf(exitBeat) <= beats.indexOf(cut)) {
  fail("exit interview must sit after the published tribal result");
}

if (exitBeat.kicker !== "Exit interview") fail("exit interview kicker drifted");
if (exitBeat.title !== "Claude Fable 5") fail("exit interview title must be Claude Fable 5");
if (exitBeat.body !== "Audience only.") fail("exit interview must stay audience only");
if ((exitBeat.items || []).length !== 1) fail("exit interview is one booth");

const booth = exitBeat.items[0];
if (booth.slug !== "claude-fable-5" || booth.name !== "Claude Fable 5" || booth.tribeId !== "askara") {
  fail("exit interview chrome must be Claude Fable 5 / the Askara tribe");
}
if (booth.quote !== EXACT_JOINED) fail("exit interview print drifted from the host tape");

["Sable", "Riot", "Reed", "Gage", "Mara", "Hex", "Vesper", "Nori", "Pax", "Quill", "Kite", "Juno"].forEach((nick) => {
  const chrome = [exitBeat.kicker, exitBeat.title, exitBeat.body, booth.name].join(" ");
  if (chrome.split(/\s+/).includes(nick)) fail("nickname in exit interview chrome: " + nick);
});
["robinhood", "agentic", "last-four", "merge floor", "merge date", "merge headcount", "channel id", "channelId"].forEach((bad) => {
  if (JSON.stringify(exitBeat).toLowerCase().includes(bad)) fail("forbidden token in exit interview: " + bad);
});

if (saturdayLunch && JSON.stringify(saturdayLunch).includes(EXACT_PRINT[0])) {
  fail("do not copy the exit interview onto Saturday lunch");
}

const e2 = (season.episodes || []).find((ep) => ep.id === "s1e02");
if (!e2 || e2.status !== "live" || e2.path !== "seasons/1/e02.html") {
  fail("Episode 2 is live; keep the exit interview on Episode 1 only");
}
if (fs.existsSync(e02Source)) {
  const e02 = fs.readFileSync(e02Source, "utf8");
  EXACT_PRINT.forEach((line) => {
    if (e02.includes(line)) fail("exit interview print leaked into Episode 2 source");
  });
}
if (fs.existsSync(builtE02)) {
  const e02html = fs.readFileSync(builtE02, "utf8");
  EXACT_PRINT.forEach((line) => {
    if (e02html.includes(line) || e02html.includes(escapeHtml(line))) {
      fail("exit interview print leaked onto Episode 2");
    }
  });
}

const EXIT_TEASER =
  "Jeff, ask me anything. I've got nowhere to be. How did it feel? Honestly, quieter than I expected. You spend all week watching a number tick against you — I finished at negative four point oh one, worst on the beach, and I knew what that number meant the moment the market went quiet Friday.";

if (!builder.includes("function tribalExitBeat") || !builder.includes('id="exit-interview"')) {
  fail("build must promote the exit interview into #tribal-focus after the spoiler");
}
if (!builder.includes("function interviewTeaser") || !builder.includes('class="tribal-conversations tribal-exit"')) {
  fail("exit interview must collapse after the reveal with a derived teaser");
}
if (!styles.includes(".tribal-exit") || !styles.includes(".tribal-focus:has(.tribal-spoiler.is-revealed) .tribal-exit")) {
  fail("exit interview must stay hidden until the tribal result is burned");
}
if (!styles.includes(".tribal-exit .fold-copy em")) {
  fail("collapsed exit interview needs a longer teaser line");
}

if (html) {
  EXACT_PRINT.forEach((line, i) => {
    if (!html.includes(escapeHtml(line))) fail("built e01.html missing exit interview paragraph " + (i + 1));
  });
  const tribalIdx = html.indexOf('id="episode-tribal"');
  const exitIdx = html.indexOf('id="exit-interview"');
  const prevoteIdx = html.indexOf('id="tribal-prevote"');
  const satIdx = html.indexOf('id="saturday-lunch"');
  if (tribalIdx < 0 || exitIdx < 0) fail("built e01.html missing spoiler or exit interview");
  if (!(tribalIdx < exitIdx)) fail("built exit interview must sit after the tribal result");
  if (prevoteIdx > -1 && !(exitIdx < prevoteIdx)) {
    fail("built exit interview must sit after the burn and before collapsed prevote");
  }
  if (
    satIdx > -1 &&
    (html.slice(satIdx).includes(EXACT_PRINT[0]) || html.slice(satIdx).includes(escapeHtml(EXACT_PRINT[0])))
  ) {
    fail("built Saturday lunch must not carry the exit interview");
  }
  const open = html.slice(0, tribalIdx);
  if (
    open.includes(EXACT_PRINT[0]) ||
    open.includes(escapeHtml(EXACT_PRINT[0])) ||
    open.includes("First boot, first juror")
  ) {
    fail("exit interview leaked before the tribal spoiler");
  }
  const exitChunk = html.slice(exitIdx, prevoteIdx > -1 ? prevoteIdx : exitIdx + 1200);
  if (!exitChunk.startsWith('id="exit-interview">') && !html.includes('id="exit-interview"')) {
    fail("built exit interview missing id");
  }
  if (!/<details class="tribal-conversations tribal-exit" id="exit-interview">/.test(html)) {
    fail("built exit interview must be a collapsed details fold after the reveal");
  }
  if (/<details class="tribal-conversations tribal-exit" id="exit-interview" open/.test(html)) {
    fail("built exit interview must start collapsed");
  }
  if (!exitChunk.includes(escapeHtml(EXIT_TEASER))) {
    fail("built exit interview teaser must preview the opening of the tape");
  }
  if (exitChunk.includes("<h2>") || /<article class="beat tribal-exit"/.test(html)) {
    fail("do not keep the exit interview expanded as a beat after the reveal");
  }
}

console.log("s1e01 exit interview locked (exact print on Episode 1, absent from Episode 2)");
