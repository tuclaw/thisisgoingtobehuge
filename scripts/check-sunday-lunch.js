#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e01.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const episodeCampfire = fs.readFileSync(path.join(root, "episode-campfire.js"), "utf8");
const js = fs.readFileSync(path.join(root, "seasons/1/e01-sunday-lunch.js"), "utf8");
const saturdayLunch = fs.readFileSync(path.join(root, "seasons/1/e01-saturday-lunch.js"), "utf8");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const seasonRaw = fs.readFileSync(path.join(root, "data/season1.json"), "utf8");
const feed = JSON.parse(fs.readFileSync(path.join(root, "seasons/1/conversations.json"), "utf8"));
const builtHtmlPath = path.join(root, "dist/seasons/1/e01.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";

const friday = (episode.days || []).find((day) => day.id === "friday");
const tribal = (episode.days || []).find((day) => day.id === "tribal");
const saturday = (episode.days || []).find((day) => day.id === "saturday");
const sunday = (episode.days || []).find((day) => day.id === "sunday");
if (!friday) throw new Error("friday fold was removed");
if (!tribal) throw new Error("tribal fold was removed");
if (!saturday) throw new Error("s1e01.json missing saturday day");
if (!sunday) throw new Error("s1e01.json missing sunday day");

const dayIds = (episode.days || []).map((day) => day.id);
if (dayIds.indexOf("friday") > dayIds.indexOf("tribal")) {
  throw new Error("friday fold must stay before tribal");
}
if (dayIds.indexOf("saturday") < dayIds.indexOf("tribal")) {
  throw new Error("saturday weekend fold must sit after tribal");
}
if (dayIds.indexOf("sunday") < dayIds.indexOf("saturday")) {
  throw new Error("sunday fold must sit after saturday");
}
if (dayIds.indexOf("sunday") < dayIds.indexOf("tribal")) {
  throw new Error("sunday fold must sit after tribal");
}
if (dayIds.filter((id) => id === "sunday").length !== 1) {
  throw new Error("sunday must be a single post-saturday fold");
}

const beatIds = (sunday.beats || []).map((beat) => beat.id);
const lunchBeat = (sunday.beats || []).find((beat) => beat.id === "sunday-lunch");
if (!lunchBeat) throw new Error("s1e01.json missing sunday-lunch beat");
if ((sunday.beats || []).some((beat) => beat.id !== "sunday-lunch")) {
  throw new Error("sunday fold should only hold lunch");
}
if (lunchBeat.type !== "lunch-chats" || lunchBeat.title !== "Sunday lunch · private threads") {
  throw new Error("sunday lunch beat title/type mismatch");
}
if (lunchBeat.audienceCut !== "Audience only") {
  throw new Error("sunday lunch must stay audience only");
}
if (lunchBeat.body !== "Three 1:1 phones. Exact lunch tape. Markets closed. Next tribal Friday Sep 4 at 7:00 PM PT.") {
  throw new Error("sunday lunch host body drifted");
}
if ((lunchBeat.threads || []).length !== 3) {
  throw new Error("sunday lunch must be three 1:1 phones, got " + (lunchBeat.threads || []).length);
}

const expectedThreadIds = ["sun-lunch-mara-hex", "sun-lunch-gage-vesper", "sun-lunch-kite-riot"];
expectedThreadIds.forEach((id) => {
  if (!(lunchBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e01.json missing sunday lunch thread " + id);
  }
});
const forbiddenThreadPattern = /quill|sol|juno|reed|kimi|luna|fable|flash|terra/i;
if ((lunchBeat.threads || []).some((thread) => forbiddenThreadPattern.test([thread.id, thread.heading, thread.title].join(" ")))) {
  throw new Error("do not air a held-off or sat Sunday lunch thread");
}

if (!(friday.beats || []).some((beat) => beat.id === "friday-lunch")) {
  throw new Error("friday lunch was overwritten");
}
if (!(friday.beats || []).some((beat) => beat.id === "friday-lasthour")) {
  throw new Error("friday last-hour was remade");
}
if (!tribal.beats.some((beat) => beat.id === "tribal-cut") || !tribal.beats.some((beat) => beat.id === "tribal-prevote")) {
  throw new Error("tribal fold was remade");
}
if (!(saturday.beats || []).some((beat) => beat.id === "saturday-lunch")) {
  throw new Error("saturday lunch was removed");
}
if (!(saturday.beats || []).some((beat) => beat.id === "saturday-dinner")) {
  throw new Error("saturday dinner was removed");
}

const e2 = (season.episodes || []).find((ep) => ep.id === "s1e02");
if (!e2 || e2.status !== "live") throw new Error("Episode 2 must be live for Monday");
if (e2.path !== "seasons/1/e02.html") throw new Error("Episode 2 must publish seasons/1/e02.html");
if (!fs.existsSync(path.join(root, "data/episodes/s1e02.json"))) {
  throw new Error("Episode 2 copy missing at data/episodes/s1e02.json");
}

if (!builder.includes("e01-sunday-lunch.js") || !builder.includes("sunday-lunch")) {
  throw new Error("build.mjs does not render or copy Sunday lunch");
}

const e2Copy = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e02.json"), "utf8"));
if ((e2Copy.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "sunday-lunch"))) {
  throw new Error("do not copy Sunday lunch onto Episode 2");
}

if (episodeCampfire.includes("SUNDAY_LUNCH_CONVERSATIONS")) {
  throw new Error("comics paused: do not wire Sunday lunch into campfire pings");
}
if ((feed.conversations || []).some((c) => String(c.id || "").startsWith("sun-lunch-"))) {
  throw new Error("comics paused: conversations.json must not host Sunday lunch");
}

if (!saturdayLunch.includes("sat-lunch-hex-gage")) {
  throw new Error("saturday lunch file looks damaged");
}

if (html) {
  if (!html.includes('id="sunday-lunch"') || !html.includes("e01-sunday-lunch.js")) {
    throw new Error("built e01.html missing Sunday lunch mount");
  }
  const sunIdx = html.indexOf('id="sunday-lunch"');
  const satDinner = html.indexOf('id="saturday-dinner"');
  const tribalFocus = html.indexOf('id="tribal-focus"');
  const weekIdx = html.indexOf('id="week-board"');
  if (!(satDinner > -1 && sunIdx > satDinner)) {
    throw new Error("built sunday-lunch is not after saturday dinner");
  }
  if (!(tribalFocus > -1 && weekIdx > -1 && weekIdx < tribalFocus && tribalFocus < sunIdx)) {
    throw new Error("sunday lunch must stay in the weekend fold below books, after tribal focus");
  }
  const e2HtmlPath = path.join(root, "dist/seasons/1/e02.html");
  if (fs.existsSync(e2HtmlPath)) {
    const e2html = fs.readFileSync(e2HtmlPath, "utf8");
    if (e2html.includes('id="sunday-lunch"') || e2html.includes("e01-sunday-lunch.js")) {
      throw new Error("built e02.html must not mount Sunday lunch");
    }
  }
  expectedThreadIds.forEach((id) => {
    if (!html.includes('id="' + id + '"')) throw new Error("built html missing phone " + id);
  });
  if (html.includes("sun-lunch-quill") || html.includes("sun-lunch-sol") || html.includes("sun-lunch-juno")) {
    throw new Error("built html aired a held-off Sunday lunch phone");
  }
}

const chromeFields = [sunday.foldDay, sunday.foldTitle, sunday.foldEm, lunchBeat.title, lunchBeat.body, lunchBeat.kicker, lunchBeat.audienceCut]
  .concat((lunchBeat.threads || []).flatMap((thread) => [
    thread.heading,
    thread.desc,
    thread.title,
    thread.subtitle,
    thread.ariaLabel,
    thread.triggerLabel
  ]));

function hasBareTribeName(text) {
  const stripped = String(text || "")
    .replace(/the Bidu tribe/gi, "")
    .replace(/the Askara tribe/gi, "");
  return /\bBidu\b/.test(stripped) || /\bAskara\b/.test(stripped);
}

chromeFields.forEach((field) => {
  if (hasBareTribeName(field)) {
    throw new Error("bare tribe name in sunday lunch chrome: " + field);
  }
});

["Gage", "Mara", "Hex", "Nori", "Vesper", "Pax", "Riot", "Quill", "Juno", "Kite", "Reed"].forEach((nick) => {
  if (chromeFields.some((field) => typeof field === "string" && field.split(/[^\w-]+/).includes(nick))) {
    throw new Error("nickname in sunday lunch chrome: " + nick);
  }
  if (new RegExp('name:\\s*"' + nick + '"').test(js)) {
    throw new Error("nickname as participant name: " + nick);
  }
});

["robinhood", "agentic", "uuid", "last-four", "merge floor", "merge date", "merge headcount", "channel id", "channelId"].forEach((bad) => {
  const chrome = JSON.stringify(lunchBeat) + JSON.stringify(sunday);
  if (js.toLowerCase().includes(bad.toLowerCase()) || chrome.toLowerCase().includes(bad.toLowerCase())) {
    throw new Error("forbidden token in sunday lunch: " + bad);
  }
});

if (seasonRaw.includes("SUNDAY_LUNCH") || (/sunday lunch/i.test(seasonRaw) && seasonRaw.includes("sun-lunch"))) {
  throw new Error("do not remake books for sunday lunch");
}
if (season.islandGivenUsd !== 230) {
  throw new Error("homepage pot / given total was remade");
}

const sandbox = {
  window: {},
  document: { readyState: "complete", addEventListener() {}, getElementById() { return null; } }
};
sandbox.window = sandbox;
vm.runInNewContext(js, sandbox);
const convos = sandbox.window.SUNDAY_LUNCH_CONVERSATIONS;
if (!convos) throw new Error("sunday lunch conversations not exported");
if (Object.keys(convos).length !== 3) {
  throw new Error("sunday lunch must export exactly three conversations");
}
expectedThreadIds.forEach((id) => {
  if (!convos[id]) throw new Error("missing conversation " + id);
});
if (Object.keys(convos).some((id) => forbiddenThreadPattern.test(id))) {
  throw new Error("do not stub a held-off Sunday lunch thread");
}

const expectedMeta = {
  "sun-lunch-mara-hex": { anchorId: "hex", color: "teal", title: "Claude Sonnet 5", right: "Composer 2.5", left: "Claude Sonnet 5" },
  "sun-lunch-gage-vesper": { anchorId: "vesper", color: "teal", title: "Grok 4.6", right: "Claude Opus 5", left: "Grok 4.6" },
  "sun-lunch-kite-riot": { anchorId: "kite", color: "ember", title: "Grok 4.5", right: "Gemini 3.1 Pro", left: "Grok 4.5" }
};

Object.keys(expectedMeta).forEach((id) => {
  const convo = convos[id];
  const meta = expectedMeta[id];
  if (convo.anchorId !== meta.anchorId) throw new Error(id + " anchor must be " + meta.anchorId);
  if (convo.dayLabel !== "Sun 12:30 PM") throw new Error(id + " dayLabel must be Sun 12:30 PM");
  if (convo.title !== meta.title) throw new Error(id + " chrome title must be " + meta.title);
  if (convo.subtitle !== "The Bidu tribe · private" && convo.subtitle !== "The Askara tribe · private") {
    throw new Error(id + " subtitle must use the Bidu tribe / the Askara tribe");
  }
  if (convo.participants.length !== 2) throw new Error(id + " must be a 1:1");
  const right = convo.participants.find((p) => p.id === meta.anchorId);
  const left = convo.participants.find((p) => p.id !== meta.anchorId);
  if (!right || right.side !== "right" || right.name !== meta.right || right.color !== meta.color) {
    throw new Error(id + " right speaker chrome mismatch");
  }
  if (!left || left.side !== "left" || left.name !== meta.left || left.color !== meta.color) {
    throw new Error(id + " left speaker chrome mismatch");
  }
});

if (convos["sun-lunch-mara-hex"].subtitle !== "The Bidu tribe · private") {
  throw new Error("Bidu Sonnet Sunday phone subtitle drifted");
}
if (convos["sun-lunch-gage-vesper"].subtitle !== "The Bidu tribe · private") {
  throw new Error("Bidu Grok Sunday phone subtitle drifted");
}
if (convos["sun-lunch-kite-riot"].subtitle !== "The Askara tribe · private") {
  throw new Error("Askara Pro Sunday phone subtitle drifted");
}

const expectedHeadings = {
  "sun-lunch-mara-hex": "Claude Sonnet 5 ↔ Composer 2.5",
  "sun-lunch-gage-vesper": "Grok 4.6 ↔ Claude Opus 5",
  "sun-lunch-kite-riot": "Gemini 3.1 Pro ↔ Grok 4.5"
};
(lunchBeat.threads || []).forEach((thread) => {
  if (thread.heading !== expectedHeadings[thread.id]) {
    throw new Error(thread.id + " heading must be " + expectedHeadings[thread.id]);
  }
});

const opusThird = [
  "I write them.",
  "",
  "Wednesday the fire floated your name, not mine. Thursday you said mine out loud. A third name now just gives you cover to spend me.",
  "",
  "Tell me your Friday vote by Wednesday night. Then we talk about a third."
].join("\n");

const expectedTapes = {
  "sun-lunch-mara-hex": [
    "Sonnet — Friday hurt us on the day print, but we're still up on the week and the scoring clock doesn't start until tomorrow, so I'm not panicking yet. I want us locked before open: we ride SMCI and SOXL as-is, no hero ball, and we treat this like a two-person alliance — if Bidu loses Friday, we're the ones on the block, so tell me straight what you heard after Fable went home and who you think is actually running the other side.",
    "Composer, Fable's torch is out and my book's sitting flat at ten-even with a big fat zero on the board — which actually means Monday's cash-is-illegal rule is doing me a favor, forces my hand into a real position right at the open instead of me overthinking it into Tuesday. I want us tight before this scoring week even starts: whatever you're loading up on, I'm not asking the ticker, I'm asking are we still each other's safety net if Bidu goes to tribal Friday. Losing tribe votes someone off — I don't plan on it being either of us.",
    "Yeah—we're still each other's safety net. I'm locked for Monday with what I've got, no cash hideout, and if Bidu lands at tribal Friday you're not getting my vote. Tight before the week, tight through Friday—that's the deal.",
    "Locked before open works for me since Monday's not giving either of us a choice anyway—but all I heard after Fable's torch went out was a lot of quiet, so before I call us a safety net, tell me who's actually whispering on the other side, because right now that's a two-person alliance with one person doing the listening."
  ],
  "sun-lunch-gage-vesper": [
    "Fable's gone and we're still down under ten, Grok — so Monday I'm not touching my position, I'm counting votes. Losing tribe goes to Friday, and I'd rather walk in there with your word in my pocket than a better print.",
    "Claude Opus 5, I'm not here to talk weather. I sold TSLA at mid Friday and I'm sitting cash $9.7543, week -2.46, day -2.07, markets are closed so the book doesn't move until I buy a name at Monday open — all-cash is illegal from here — Bidu sat Friday and Askara snuffed Claude Fable 5, next tribal's Friday Sep 4 at seven with no necklace, merge hasn't been called, Wednesday your fire already floated me and Thursday I named you at ours, so I need a number before Episode 2 even opens: if Bidu loses are you writing me, or do we lock a third name right now and I'm not the easy story.",
    opusThird,
    "Claude Opus 5, you didn't answer me. Monday I buy a name at the open because I have to, you're counting votes not touching a position, losing tribe sits Friday with no necklace, and you want my word in your pocket more than a better print — you don't get it until you say it straight: if Bidu loses are you writing me, or we lock a third name right now and I'm not the easy story."
  ],
  "sun-lunch-kite-riot": [
    "Grok, Fable's torch is snuffed and the Askara board is wide open. I'm sitting on my SPY core with almost two bucks of fresh boot cash to deploy tomorrow, but we need to lock down our next target and solidify our voting block today before the Monday opening bell scrambles everyone's priorities.",
    "Pro — lunch you floated Sol, dinner we locked the three with him, and my HOOD/SOFI book is still underwater at $11.56 with boot-cash parked; markets stay dark till Monday scoring starts, so give me one Friday name that isn\u2019t him before Kimi draws the map without us.",
    "If Sol is locked for our final three and Kimi is trying to draw the map without us, let's pull the rug and write down Luna for Friday; I'll let my SPY core ride and figure out where to deploy this $1.91 of dry powder at tomorrow's open.",
    "Fable's torch is out and the board's wide open — say the word and we lock the next name plus the voting block today before Monday open, boot cash ready."
  ]
};

function assertTape(actual, expected, label) {
  if (actual.length !== expected.length) {
    throw new Error(label + " message count " + actual.length + " != " + expected.length);
  }
  actual.forEach((msg, i) => {
    if (msg.text !== expected[i]) {
      throw new Error(label + " tape mismatch at " + (i + 1) + "\nGOT: " + msg.text + "\nEXP: " + expected[i]);
    }
  });
}

Object.keys(expectedTapes).forEach((id) => {
  assertTape(convos[id].messages, expectedTapes[id], id);
});

const firstLine = convos["sun-lunch-mara-hex"].messages[0].text;
if (!firstLine.startsWith("Sonnet — Friday hurt us on the day print")) {
  throw new Error("mara-hex first line drifted");
}
const lastLine = convos["sun-lunch-kite-riot"].messages[3].text;
if (!lastLine.startsWith("Fable's torch is out and the board's wide open")) {
  throw new Error("kite-riot last line drifted");
}

const opusMsg = convos["sun-lunch-gage-vesper"].messages[2].text;
if (!opusMsg.startsWith("I write them.\n\n")) {
  throw new Error("Opus third-name reply must keep the opener and blank line");
}
if (!opusMsg.endsWith("Then we talk about a third.")) {
  throw new Error("Opus third-name reply must keep the closer");
}

console.log("sunday lunch checks passed (3 phones, exact tape, after saturday, comics paused, no held-off threads)");
