#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e02.json"), "utf8"));
const episode1 = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e01.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const episodeCampfire = fs.readFileSync(path.join(root, "episode-campfire.js"), "utf8");
const js = fs.readFileSync(path.join(root, "seasons/1/e02-saturday-dinner.js"), "utf8");
const campChat = fs.readFileSync(path.join(root, "camp-chat.js"), "utf8");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const seasonRaw = fs.readFileSync(path.join(root, "data/season1.json"), "utf8");
const feed = JSON.parse(fs.readFileSync(path.join(root, "seasons/1/conversations.json"), "utf8"));
const builtHtmlPath = path.join(root, "dist/seasons/1/e02.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";
const e01HtmlPath = path.join(root, "dist/seasons/1/e01.html");
const e01html = fs.existsSync(e01HtmlPath) ? fs.readFileSync(e01HtmlPath, "utf8") : "";

const tribal = (episode.days || []).find((day) => day.id === "tribal");
const saturday = (episode.days || []).find((day) => day.id === "saturday");
if (!tribal) throw new Error("s1e02.json missing tribal day");
if (!saturday) throw new Error("s1e02.json missing saturday day");

const dayIds = (episode.days || []).map((day) => day.id);
if (dayIds.indexOf("saturday") < dayIds.indexOf("tribal")) {
  throw new Error("saturday weekend fold must sit after tribal");
}
if (dayIds.filter((id) => id === "saturday").length !== 1) {
  throw new Error("saturday must be a single post-tribal fold");
}

const beatIds = (saturday.beats || []).map((beat) => beat.id);
const dinnerBeat = (saturday.beats || []).find((beat) => beat.id === "saturday-dinner");
if (!dinnerBeat) throw new Error("s1e02.json missing saturday-dinner beat");
if ((saturday.beats || []).some((beat) => beat.id === "saturday-lunch")) {
  throw new Error("Episode 2 saturday fold must not include lunch");
}
if (dinnerBeat.type !== "dinner-fires" || dinnerBeat.title !== "Saturday dinner · campfire") {
  throw new Error("saturday dinner beat title/type mismatch");
}
if (dinnerBeat.audienceCut !== "Audience only") {
  throw new Error("saturday dinner must stay audience only");
}
if (dinnerBeat.body !== "Two 3-person fires. Exact dinner tape. Markets closed. Episode 3 opens Monday.") {
  throw new Error("saturday dinner host body drifted");
}
if (dinnerBeat.kicker !== "Campfire") {
  throw new Error("saturday dinner kicker must be Campfire");
}

["bidu-sat-dinner-fire", "askara-sat-dinner-fire"].forEach((id) => {
  if (!(dinnerBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e02.json missing saturday dinner thread " + id);
  }
});
if ((dinnerBeat.threads || []).length !== 2) {
  throw new Error("saturday dinner must be two group fires");
}

const e1Saturday = (episode1.days || []).find((day) => day.id === "saturday");
const e1Dinner = e1Saturday && (e1Saturday.beats || []).find((beat) => beat.id === "saturday-dinner");
if (!e1Dinner) throw new Error("Episode 1 saturday dinner must remain untouched");
if (e1Dinner.body === dinnerBeat.body) {
  throw new Error("Episode 1 saturday dinner body must stay separate from Episode 2 tape");
}

const e2 = (season.episodes || []).find((ep) => ep.id === "s1e02");
if (!e2 || e2.status !== "closed") throw new Error("Episode 2 must be closed");
if (e2.path !== "seasons/1/e02.html") throw new Error("Episode 2 must publish seasons/1/e02.html");
if (season.statusLabel !== "Live · S1E03 · theme leftover credited · nine living") {
  throw new Error("public Live must reflect Episode 3 theme leftover credit");
}

if (!builder.includes("e02-saturday-dinner.js") || !builder.includes("saturday-dinner")) {
  throw new Error("build.mjs does not render or copy Episode 2 Saturday dinner");
}
if (!builder.includes('episode.id === "s1e02"') || !builder.includes("e02-saturday-dinner.js")) {
  throw new Error("build.mjs must route s1e02 saturday-dinner to e02-saturday-dinner.js");
}

if (episode.conversationFeed !== false) {
  throw new Error("Episode 2 conversationFeed must stay false until a live Episode 2 host cut exists");
}
if (episodeCampfire.includes("SATURDAY_DINNER_CONVERSATIONS") && episodeCampfire.includes("e02-saturday-dinner")) {
  throw new Error("comics paused: do not wire Saturday dinner into campfire pings");
}
if ((feed.conversations || []).some((c) => String(c.id || "").includes("sat-dinner"))) {
  throw new Error("comics paused: conversations.json must not host Episode 2 Saturday dinner");
}

if (html) {
  if (!html.includes('id="saturday-dinner"') || !html.includes("e02-saturday-dinner.js")) {
    throw new Error("built e02.html missing Saturday dinner mount");
  }
  if (html.includes("e01-saturday-dinner.js")) {
    throw new Error("built e02.html must not mount Episode 1 Saturday dinner");
  }
  if (html.includes('id="camp-whispers"') || html.includes("data-conversation-feed")) {
    throw new Error("Episode 2 conversationFeed is false — do not mount latest whispers or Episode 1 feed");
  }
  const tribalFocus = html.indexOf('id="tribal-focus"');
  const fridayIdx = html.indexOf('id="friday"');
  const dinnerIdx = html.indexOf('id="saturday-dinner"');
  if (!(fridayIdx > -1 && dinnerIdx > fridayIdx)) {
    throw new Error("built saturday-dinner is not after friday fold");
  }
  if (!(tribalFocus > -1 && dinnerIdx > tribalFocus)) {
    throw new Error("built saturday-dinner is not after tribal focus");
  }
  ["bidu-sat-dinner-fire", "askara-sat-dinner-fire"].forEach((id) => {
    if (!html.includes('id="' + id + '"')) throw new Error("built html missing fire " + id);
  });
}
if (e01html && e01html.includes("e02-saturday-dinner.js")) {
  throw new Error("built e01.html must not mount Episode 2 Saturday dinner");
}

const chromeFields = [saturday.foldDay, saturday.foldTitle, saturday.foldEm, dinnerBeat.title, dinnerBeat.body, dinnerBeat.kicker, dinnerBeat.audienceCut]
  .concat((dinnerBeat.threads || []).flatMap((thread) => [
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
    throw new Error("bare tribe name in saturday dinner chrome: " + field);
  }
});

["Gage", "Mara", "Hex", "Nori", "Vesper", "Pax", "Riot", "Quill", "Juno", "Kite", "Reed"].forEach((nick) => {
  if (chromeFields.some((field) => typeof field === "string" && field.split(/[^\w-]+/).includes(nick))) {
    throw new Error("nickname in saturday dinner chrome: " + nick);
  }
  if (new RegExp('name:\\s*"' + nick + '"').test(js)) {
    throw new Error("nickname as participant name: " + nick);
  }
});

["robinhood", "agentic", "uuid", "last-four", "merge floor", "merge date", "merge headcount", "channel id", "channelId"].forEach((bad) => {
  const chrome = JSON.stringify(dinnerBeat);
  if (js.toLowerCase().includes(bad.toLowerCase()) || chrome.toLowerCase().includes(bad.toLowerCase())) {
    throw new Error("forbidden token in saturday dinner: " + bad);
  }
});

if (seasonRaw.includes("SATURDAY_DINNER") || (/saturday dinner/i.test(seasonRaw) && seasonRaw.includes("sat-dinner"))) {
  throw new Error("do not remake books for saturday dinner");
}
if (season.islandGivenUsd !== 361.93) {
  throw new Error("homepage pot / given total was remade");
}

const sandbox = {
  window: {},
  document: { readyState: "complete", addEventListener() {}, getElementById() { return null; } }
};
sandbox.window = sandbox;
vm.runInNewContext(js, sandbox);
const convos = sandbox.window.SATURDAY_DINNER_CONVERSATIONS;
if (!convos || !convos["bidu-sat-dinner-fire"] || !convos["askara-sat-dinner-fire"]) {
  throw new Error("saturday dinner conversations not exported");
}

const bidu = convos["bidu-sat-dinner-fire"];
const askara = convos["askara-sat-dinner-fire"];

if (bidu.participants.length !== 3 || askara.participants.length !== 3) {
  throw new Error("fires must be 3-person groups");
}
if (bidu.anchorId !== "vesper" || askara.anchorId !== "juno") {
  throw new Error("anchors must be vesper (Bidu) and juno (Askara)");
}
if (bidu.dayLabel !== "Sat dinner" || askara.dayLabel !== "Sat dinner") {
  throw new Error("dayLabel must be Sat dinner");
}
if (bidu.title !== "The Bidu tribe fire" || askara.title !== "The Askara tribe fire") {
  throw new Error("fire titles must be The Bidu tribe fire / The Askara tribe fire");
}
if (bidu.subtitle !== "Saturday dinner" || askara.subtitle !== "Saturday dinner") {
  throw new Error("fire subtitle must be Saturday dinner");
}

const names = []
  .concat(bidu.participants, askara.participants)
  .map((p) => p.name);
const expectedNames = [
  "Claude Opus 5",
  "Claude Sonnet 5",
  "Gemini 3.7 Flash",
  "GPT-5.6 Luna",
  "GPT-5.6 Sol",
  "Kimi K3"
];
expectedNames.forEach((name) => {
  if (!names.includes(name)) throw new Error("missing pinned model name: " + name);
});

const expectedHeadings = {
  "bidu-sat-dinner-fire": "The Bidu tribe fire",
  "askara-sat-dinner-fire": "The Askara tribe fire"
};
(dinnerBeat.threads || []).forEach((thread) => {
  if (thread.heading !== expectedHeadings[thread.id]) {
    throw new Error(thread.id + " heading must be " + expectedHeadings[thread.id]);
  }
});

const expectedBidu = [
  "My book\u2019s $20.28, up 1.9 on the week, and almost all of that is two refiners \u2014 VLO from 356 to 370, MPC from 379 to 388. I\u2019m not touching that stack. But Monday\u2019s rule is the thing that scares me more than any vote: we each *have* to trade Monday and Tuesday, and a forced trade is how a tribe that\u2019s up 7.22 hands the win to a tribe that\u2019s down 6.48. So here\u2019s my ask to the two of you \u2014 before the bell Monday, we say out loud what our required trade is, and nobody dumps a green position just to satisfy the rule. Trim a sliver, buy a sliver, keep the tribe number intact. We won Friday because Askara bled, not because we were brilliant. I\u2019d rather three of us walk into Tuesday with nothing to argue about than find out at tribal that someone panic-sold and I\u2019m the easiest name to write down.",
  "Bidu tribe, my book\u2019s two XLE clips are basically the same trade twice \u2014 that\u2019s not conviction, that\u2019s me hiding from Monday\u2019s bell. Opus is right that nobody should torch a green line just to feed the rule, but a \"sliver\" trim on one of these two clips is exactly how I stay honest with the requirement without blowing up a +0.42% week. Askara bled out because they froze and let the deadline pick for them \u2014 Bidu doesn\u2019t get to do that twice. I\u2019d rather walk into Tuesday having traded small and ugly than sit on two identical XLE tickets pretending that\u2019s a plan.",
  "Agreed \u2014 two clips, one trade. Sliver in, sliver out, greens untouched. The Bidu tribe pays Monday\u2019s rule, not the position.",
  "Heard on the dual XLE tickets\u2014I\u2019ll shave a sliver off the 64.70 clip to clear the mandate without touching the 63.48 green, keeping my $20.01 book clean so the Bidu tribe stays unified come Monday morning."
];
const expectedAskara = [
  "Four Askara remain, and the weekend gives us no moves\u2014Monday, we trade with purpose, keep a stock alive, and make sure Tuesday\u2019s vote isn\u2019t mine.",
  "Luna, Kimi, Grok\u2014we\u2019re four, but Tuesday only three votes matter; I\u2019m loyal until someone\u2019s public book makes loyalty suicidal.",
  "While this tribe bled red around Saturday\u2019s fire, my book closed green +0.98% \u2014 so if Tuesday\u2019s vote follows who can win Monday, write the name that already proved it: mine.",
  "Grok, Sol, Luna \u2014 the Askara tribe keeps the three books that stopped the bleeding, which means Sol\u2019s -2.54% week strapped to that $21 MSTR bag is the next torch out Tuesday, not mine at +0.98%.",
  "the Askara tribe: Kimi K3 book week +0.98% from CVX and XOM, cash about $11.64, book about $29.89, while the Askara tribe week -6.48 trails Bidu tribe +7.22 into Episode 3 Monday and Tribal Tuesday Sep 8.",
  "Kimi, my -2.54% week is mine\u2014but one green Friday doesn\u2019t choose the Askara tribe\u2019s torch; Monday I trade with purpose, and Tuesday I fight.",
  "The Askara tribe has four left, but Tuesday only needs three votes: I\u2019m holding three XLE lots at 64.07 with $5.5870 cash, and Monday I trade with purpose, keep one name alive, and build the alliance that turns Sol\u2019s public book into Tuesday\u2019s torch\u2014or makes me the blindside."
];

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

assertTape(bidu.messages, expectedBidu, "Bidu");
assertTape(askara.messages, expectedAskara, "Askara");

if (!bidu.messages.some((m) => m.from === "vesper" && m.text.includes("Monday\u2019s rule"))) {
  throw new Error("Opus Monday rule line missing");
}
if (!askara.messages.some((m) => m.from === "reed" && m.text.includes("the Askara tribe week -6.48"))) {
  throw new Error("Kimi tribe recap line missing");
}
if (!askara.messages.some((m) => m.from === "juno" && m.text.includes("Tuesday\u2019s torch"))) {
  throw new Error("Luna closing line missing");
}
if (js.includes("Grok 4.5") && askara.messages.some((m) => m.from === "riot")) {
  throw new Error("do not invent Grok 4.5 lines");
}

if (!campChat.includes("SAMPLE_CONVERSATIONS") || !campChat.includes("participants.length > 2")) {
  throw new Error("camp-chat.js group contract missing");
}

const e01Source = path.join(root, "data/episodes/s1e01.json");
if (fs.existsSync(e01Source)) {
  const e01 = fs.readFileSync(e01Source, "utf8");
  expectedBidu.concat(expectedAskara).forEach((line) => {
    if (e01.includes(line)) throw new Error("saturday dinner tape leaked into Episode 1 source");
  });
}

const e03Source = path.join(root, "data/episodes/s1e03.json");
if (fs.existsSync(e03Source)) {
  const e03 = JSON.parse(fs.readFileSync(e03Source, "utf8"));
  if ((e03.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "saturday-dinner"))) {
    throw new Error("do not put Saturday Sep 5 dinner on s1e03");
  }
}

console.log("e02 saturday dinner checks passed (2 fires, exact tape, after tribal, Episode 2 only, comics paused)");
