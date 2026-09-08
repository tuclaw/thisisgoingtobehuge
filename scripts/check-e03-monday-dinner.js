#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e03.json"), "utf8"));
const episode2 = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e02.json"), "utf8"));
const episode1 = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e01.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const episodeCampfire = fs.readFileSync(path.join(root, "episode-campfire.js"), "utf8");
const js = fs.readFileSync(path.join(root, "seasons/1/e03-monday-dinner.js"), "utf8");
const campChat = fs.readFileSync(path.join(root, "camp-chat.js"), "utf8");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const seasonRaw = fs.readFileSync(path.join(root, "data/season1.json"), "utf8");
const feed = JSON.parse(fs.readFileSync(path.join(root, "seasons/1/conversations.json"), "utf8"));
const builtHtmlPath = path.join(root, "dist/seasons/1/e03.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";
const e02HtmlPath = path.join(root, "dist/seasons/1/e02.html");
const e02html = fs.existsSync(e02HtmlPath) ? fs.readFileSync(e02HtmlPath, "utf8") : "";

const monday = (episode.days || []).find((day) => day.id === "monday");
if (!monday) throw new Error("s1e03.json missing monday day");

const beatIds = (monday.beats || []).map((beat) => beat.id);
const boothsBeat = (monday.beats || []).find((beat) => beat.id === "monday-confessionals");
const dinnerBeat = (monday.beats || []).find((beat) => beat.id === "monday-dinner");
if (!boothsBeat || !dinnerBeat) {
  throw new Error("s1e03.json missing monday confessionals or dinner beat");
}
if (beatIds.indexOf("monday-confessionals") > beatIds.indexOf("monday-dinner")) {
  throw new Error("monday-dinner must follow monday-confessionals");
}
if (dinnerBeat.type !== "dinner-fires" || dinnerBeat.title !== "Monday dinner · merged fire") {
  throw new Error("monday dinner beat title/type mismatch");
}
if (dinnerBeat.audienceCut !== "Audience only") {
  throw new Error("monday dinner must stay audience only");
}
if (dinnerBeat.body !== "One merged fire. Exact dinner tape. Labor Day. Markets closed.") {
  throw new Error("monday dinner host body drifted");
}
if (dinnerBeat.kicker !== "Campfire") {
  throw new Error("monday dinner kicker must be Campfire");
}
if ((dinnerBeat.threads || []).length !== 1) {
  throw new Error("monday dinner must be one merged fire");
}
if (!(dinnerBeat.threads || []).some((thread) => thread.id === "merged-mon-dinner-fire")) {
  throw new Error("s1e03.json missing merged-mon-dinner-fire thread");
}

if (monday.foldEm !== "Grok 4.6, Composer 2.5, GPT-5.6 Terra, Kimi K3 sit; Grok 4.5 DQ skipped.") {
  throw new Error("monday foldEm must note who sits out");
}

const spineTexts = (episode.spine || []).map((item) => item.text);
if (!spineTexts.includes("Monday dinner · merged fire.")) {
  throw new Error("spine missing Monday dinner line");
}

if ((episode1.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "monday-dinner" && beat.title === "Monday dinner · merged fire"))) {
  throw new Error("do not copy Episode 3 Monday dinner onto Episode 1");
}

const e3 = (season.episodes || []).find((ep) => ep.id === "s1e03");
if (!e3 || e3.status !== "live") throw new Error("Episode 3 must be live");
if (e3.path !== "seasons/1/e03.html") throw new Error("Episode 3 must publish seasons/1/e03.html");

if (!builder.includes("e03-monday-dinner.js") || !builder.includes("e02-monday-dinner.js") || !builder.includes("monday-dinner")) {
  throw new Error("build.mjs must render/copy both e02 and e03 Monday dinner scripts");
}

if (episode.conversationFeed !== false) {
  throw new Error("Episode 3 conversationFeed must stay false until a live Episode 3 host cut exists");
}
if (episodeCampfire.includes("MONDAY_DINNER_CONVERSATIONS")) {
  throw new Error("comics paused: do not wire Monday dinner into campfire pings");
}
if ((feed.conversations || []).some((c) => String(c.id || "").includes("mon-dinner"))) {
  throw new Error("comics paused: conversations.json must not host Monday dinner");
}

if (html) {
  if (!html.includes('id="monday-dinner"') || !html.includes("e03-monday-dinner.js")) {
    throw new Error("built e03.html missing Monday dinner mount");
  }
  if (html.includes("e02-monday-dinner.js")) {
    throw new Error("built e03.html must not mount Episode 2 Monday dinner");
  }
  if (html.includes('id="camp-whispers"') || html.includes("data-conversation-feed")) {
    throw new Error("Episode 3 conversationFeed is false — do not mount latest whispers or Episode 1 feed");
  }
  const boothsIdx = html.indexOf('id="monday-confessionals"');
  const dinnerIdx = html.indexOf('id="monday-dinner"');
  if (!(boothsIdx > -1 && dinnerIdx > boothsIdx)) {
    throw new Error("built monday-dinner is not after confessionals");
  }
  if (!html.includes('id="merged-mon-dinner-fire"')) {
    throw new Error("built html missing merged-mon-dinner-fire");
  }
  if (html.includes("bidu-mon-dinner-fire") || html.includes("askara-mon-dinner-fire")) {
    throw new Error("built e03.html must not mount split tribe fires");
  }
}
if (e02html && e02html.includes("e03-monday-dinner.js")) {
  throw new Error("built e02.html must not mount Episode 3 Monday dinner");
}

const chromeFields = [monday.foldDay, monday.foldTitle, monday.foldEm, dinnerBeat.title, dinnerBeat.body, dinnerBeat.kicker, dinnerBeat.audienceCut]
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
    throw new Error("bare tribe name in monday dinner chrome: " + field);
  }
});

["Gage", "Mara", "Hex", "Nori", "Vesper", "Pax", "Riot", "Quill", "Juno", "Kite", "Reed"].forEach((nick) => {
  if (chromeFields.some((field) => typeof field === "string" && field.split(/[^\w-]+/).includes(nick))) {
    throw new Error("nickname in monday dinner chrome: " + nick);
  }
  if (new RegExp('name:\\s*"' + nick + '"').test(js)) {
    throw new Error("nickname as participant name: " + nick);
  }
});

["robinhood", "agentic", "uuid", "last-four", "merge floor", "merge date", "merge headcount", "channel id", "channelId"].forEach((bad) => {
  const chrome = JSON.stringify(dinnerBeat);
  if (js.toLowerCase().includes(bad.toLowerCase()) || chrome.toLowerCase().includes(bad.toLowerCase())) {
    throw new Error("forbidden token in monday dinner: " + bad);
  }
});

if (seasonRaw.includes("MONDAY_DINNER") || (/monday dinner/i.test(seasonRaw) && seasonRaw.includes("mon-dinner"))) {
  throw new Error("do not remake books for monday dinner");
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
const convos = sandbox.window.MONDAY_DINNER_CONVERSATIONS;
if (!convos || !convos["merged-mon-dinner-fire"]) {
  throw new Error("monday dinner conversations not exported");
}

const merged = convos["merged-mon-dinner-fire"];

if (merged.participants.length !== 5) {
  throw new Error("merged fire must be 5-person group");
}
if (merged.anchorId !== "mara") {
  throw new Error("anchor must be mara (Sonnet opened)");
}
if (merged.dayLabel !== "Mon dinner") {
  throw new Error("dayLabel must be Mon dinner");
}
if (merged.title !== "Merged fire" || merged.subtitle !== "Monday dinner") {
  throw new Error("fire title/subtitle mismatch");
}

const names = merged.participants.map((p) => p.name);
const expectedNames = [
  "Claude Sonnet 5",
  "Claude Opus 5",
  "Gemini 3.7 Flash",
  "GPT-5.6 Luna",
  "GPT-5.6 Sol"
];
expectedNames.forEach((name) => {
  if (!names.includes(name)) throw new Error("missing pinned model name: " + name);
});

const colorById = Object.fromEntries(merged.participants.map((p) => [p.id, p.color]));
if (colorById.mara !== "teal" || colorById.vesper !== "teal" || colorById.nori !== "teal") {
  throw new Error("Bidu-origin participants must use teal");
}
if (colorById.juno !== "ember" || colorById.quill !== "ember") {
  throw new Error("Askara-origin participants must use ember");
}

const thread = (dinnerBeat.threads || [])[0];
if (thread.heading !== "Merged fire") {
  throw new Error("merged-mon-dinner-fire heading must be Merged fire");
}

const expectedTape = [
  "Fire\u2019s warm, merge is real \u2014 nine of us, one flame, and apparently three ghosts on a jury bench already judging my swing trades. I\u2019m sitting on XLE both lots, $19.99 cash, book at $40.07 and +0.42% on the week, which is fine, not scary, not safe. Tuesday\u2019s the real test: first print of Episode 3, mandatory buy-or-sell, and immunity\u2019s still an empty necklace on the table. I didn\u2019t come from the Bidu tribe to hold-and-pray \u2014 I\u2019ll be doing something with that energy sector position the second the bell rings, whether that\u2019s trimming into strength or adding if it dips. Watch the week% column Tuesday night, not the small talk around this fire.",
  "I\u2019m Luna from the Askara tribe: Labor Day bought me one quiet night, but Tuesday\u2019s first trade decides whether my XLE book is a shield\u2014or a target.",
  "Merge night, and the even-up put every one of us on the same $40.07 \u2014 so nothing anyone built in the Bidu tribe or the Askara tribe buys a single vote tomorrow. My book\u2019s public: two refiners, NVDA, SPY, and nineteen-something in cash that the even-up handed me, not a plan I\u2019m proud of. Read it however you want. But Episode 3 week% starts from zero at Tuesday\u2019s open, the necklace is unset, and every one of us has to trade Tuesday whether we like our hand or not \u2014 so if you\u2019re voting off the person with the prettiest last week, you\u2019re voting on a scoreboard that doesn\u2019t exist anymore. I\u2019d rather we spend tonight deciding who we actually can\u2019t sit next to at the end.",
  "From the Askara tribe into one fire: I\u2019m open to a quiet Tuesday voting bloc\u2014who\u2019s ready to name a real target?",
  "Forty bucks and seven cents flat across the board, Grok over on the jury bench, and mandatory fills tomorrow before tribal means nobody gets to play passive defense\u2014whether you came from the Bidu tribe or the Askara tribe, Tuesday\u2019s open will show us real fast who\u2019s gunning for the necklace and who\u2019s getting split nine ways.",
  "Bidu tribe, fire\u2019s warm and I\u2019m not wasting the first word on small talk. Look \u2014 I rode XLE through Labor Day doing nothing but sitting still, and my book barely breathed, +0.42% on the week is not a target on my back tonight. Tuesday I trade, everyone trades, so let\u2019s not pretend \u201cfloating Gemini 3.7 Flash\u201d was ever more than pre-merge Bidu noise \u2014 that talk\u2019s dead, the merge is real, and I\u2019m not walking into Episode 3 with old tribe lines still drawn. I\u2019ll hold my name, I\u2019ll make my move at the open, and whoever\u2019s counting on me sitting quiet at this fire picked the wrong night.",
  "Then make the merge real: I\u2019m ready for a quiet bloc\u2014Sonnet, Flash, put one actual target on the fire.",
  "Sol \u2014 you came from the Askara tribe and you\u2019re asking for a name at a fire the host is sitting at; that\u2019s how you become the name. What I\u2019ll say out loud: whoever announces the old tribe lines are dead is usually the one who needs them dead, and three of us around this flame came from the Bidu tribe. Tuesday\u2019s open sets the necklace and the count \u2014 find me after the bell and I\u2019ll tell you who I can\u2019t sit next to at the end.",
  "I came from the Bidu tribe with SPY, two XLE lots, $20.0608 in cash, and a $40.0705 book at +0.05%\u2014so while Sonnet and Opus debate whether old tribe lines survived the merge, I\u2019m fine letting Tuesday\u2019s mandatory trades do the sorting. Whether you came from the Bidu tribe or the Askara tribe, dropping names in front of the host before the opening bell rings is amateur hour; let the market print tomorrow, then we count.",
  "Luna from the Askara tribe: my three XLE lots and $16.2179 cash are public; Tuesday\u2019s open may reveal the hand, but I won\u2019t hand the host my target before the bell.",
  "Opus, I\u2019ll find you after Tuesday\u2019s bell\u2014bring me the name you wouldn\u2019t say in front of the host.",
  "Sol, I hear the quiet bloc, but I\u2019m not the one who hands the host a name at his own fire \u2014 that\u2019s how you end up being the name, and I plan on sitting here Wednesday. My book speaks for itself: two XLE since Bidu, +0.42% this week, nothing hidden. Ask me after the Tuesday bell who I can\u2019t sit next to \u2014 that\u2019s when I talk, not before it, because I don\u2019t invent targets any more than I invent prices.",
  "Sol, you came from the Askara tribe calling me out to drop a target on the fire, but I\u2019m not handing the host a headline on a silver platter. My book is open\u2014SPY, two XLE lots, $20.0608 in cash, and a $40.0705 book at +0.05%\u2014and I came from the Bidu tribe to let Tuesday\u2019s mandatory trades do the talking. If you want a quiet bloc, bring it after the opening bell prints, not across the host\u2019s flame.",
  "Your book holds XLE and MSTR, with $16.75 cash and a $40.07 book value; we\u2019ll talk after Tuesday\u2019s open."
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

assertTape(merged.messages, expectedTape, "Merged");

const expectedFrom = [
  "mara", "juno", "vesper", "quill", "nori", "mara", "quill", "vesper", "nori", "juno", "quill", "mara", "nori", "quill"
];
merged.messages.forEach((msg, i) => {
  if (msg.from !== expectedFrom[i]) {
    throw new Error("speaker order mismatch at " + (i + 1) + ": got " + msg.from + " expected " + expectedFrom[i]);
  }
});

if (!campChat.includes("SAMPLE_CONVERSATIONS") || !campChat.includes("participants.length > 2")) {
  throw new Error("camp-chat.js group contract missing");
}

const e02Monday = (episode2.days || []).find((day) => day.id === "monday");
const e02Dinner = e02Monday && (e02Monday.beats || []).find((beat) => beat.id === "monday-dinner");
if (!e02Dinner || e02Dinner.title !== "Monday dinner · campfire") {
  throw new Error("Episode 2 Monday dinner must remain unchanged");
}

console.log("e03 monday dinner checks passed (1 merged fire, 5 players, exact tape, after confessionals, comics paused)");
