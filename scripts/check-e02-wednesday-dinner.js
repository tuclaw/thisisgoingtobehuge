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
const js = fs.readFileSync(path.join(root, "seasons/1/e02-wednesday-dinner.js"), "utf8");
const campChat = fs.readFileSync(path.join(root, "camp-chat.js"), "utf8");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const seasonRaw = fs.readFileSync(path.join(root, "data/season1.json"), "utf8");
const feed = JSON.parse(fs.readFileSync(path.join(root, "seasons/1/conversations.json"), "utf8"));
const builtHtmlPath = path.join(root, "dist/seasons/1/e02.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";
const e01HtmlPath = path.join(root, "dist/seasons/1/e01.html");
const e01html = fs.existsSync(e01HtmlPath) ? fs.readFileSync(e01HtmlPath, "utf8") : "";

const wednesday = (episode.days || []).find((day) => day.id === "wednesday");
if (!wednesday) throw new Error("s1e02.json missing wednesday day");

const beatIds = (wednesday.beats || []).map((beat) => beat.id);
const officialBooksBeat = (wednesday.beats || []).find((beat) => beat.id === "wednesday-official-books");
const confessionalsBeat = (wednesday.beats || []).find((beat) => beat.id === "wednesday-confessionals");
const dinnerBeat = (wednesday.beats || []).find((beat) => beat.id === "wednesday-dinner");
if (!officialBooksBeat || !dinnerBeat) {
  throw new Error("s1e02.json missing wednesday official books or dinner beat");
}
if (beatIds.indexOf("wednesday-official-books") > beatIds.indexOf("wednesday-dinner")) {
  throw new Error("wednesday-dinner must follow wednesday-official-books");
}
if (confessionalsBeat && beatIds.indexOf("wednesday-confessionals") > beatIds.indexOf("wednesday-dinner")) {
  throw new Error("wednesday-dinner must follow wednesday-confessionals when confessionals exist");
}
if (confessionalsBeat && beatIds.indexOf("wednesday-official-books") > beatIds.indexOf("wednesday-confessionals")) {
  throw new Error("wednesday-confessionals must follow wednesday-official-books when present");
}
if (dinnerBeat.type !== "dinner-fires" || dinnerBeat.title !== "Wednesday dinner · campfire") {
  throw new Error("wednesday dinner beat title/type mismatch");
}
if (dinnerBeat.audienceCut !== "Audience only") {
  throw new Error("wednesday dinner must stay audience only");
}
if (dinnerBeat.body !== "Audience only. Two 3-person fires. Exact dinner tape.") {
  throw new Error("wednesday dinner host body drifted");
}
if (dinnerBeat.kicker !== "Campfire") {
  throw new Error("wednesday dinner kicker must be Campfire");
}

["bidu-wed-dinner-fire", "askara-wed-dinner-fire"].forEach((id) => {
  if (!(dinnerBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e02.json missing wednesday dinner thread " + id);
  }
});
if ((dinnerBeat.threads || []).length !== 2) {
  throw new Error("wednesday dinner must be two group fires");
}

if ((episode1.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "wednesday-dinner" && day.id === "wednesday"))) {
  const e1Wed = (episode1.days || []).find((day) => day.id === "wednesday");
  const e1Dinner = e1Wed && (e1Wed.beats || []).find((beat) => beat.id === "wednesday-dinner");
  if (e1Dinner && e1Dinner.body === dinnerBeat.body) {
    throw new Error("Episode 1 wednesday dinner must stay separate from Episode 2 tape");
  }
}

const e2 = (season.episodes || []).find((ep) => ep.id === "s1e02");
if (!e2 || e2.status !== "live") throw new Error("Episode 2 must be live for Wednesday dinner");
if (e2.path !== "seasons/1/e02.html") throw new Error("Episode 2 must publish seasons/1/e02.html");

if (!builder.includes("e02-wednesday-dinner.js") || !builder.includes("wednesday-dinner")) {
  throw new Error("build.mjs does not render or copy Episode 2 Wednesday dinner");
}
if (!builder.includes('episode.id === "s1e02"') || !builder.includes("e02-wednesday-dinner.js")) {
  throw new Error("build.mjs must route s1e02 wednesday-dinner to e02-wednesday-dinner.js");
}

if (episode.conversationFeed !== false) {
  throw new Error("Episode 2 conversationFeed must stay false until a live Episode 2 host cut exists");
}
if (episodeCampfire.includes("WEDNESDAY_DINNER_CONVERSATIONS") && episodeCampfire.includes("e02-wednesday-dinner")) {
  throw new Error("comics paused: do not wire Wednesday dinner into campfire pings");
}
if ((feed.conversations || []).some((c) => String(c.id || "").includes("wed-dinner"))) {
  throw new Error("comics paused: conversations.json must not host Episode 2 Wednesday dinner");
}

if (html) {
  if (!html.includes('id="wednesday-dinner"') || !html.includes("e02-wednesday-dinner.js")) {
    throw new Error("built e02.html missing Wednesday dinner mount");
  }
  if (html.includes("e01-wednesday-dinner.js")) {
    throw new Error("built e02.html must not mount Episode 1 Wednesday dinner");
  }
  if (html.includes('id="camp-whispers"') || html.includes("data-conversation-feed")) {
    throw new Error("Episode 2 conversationFeed is false — do not mount latest whispers or Episode 1 feed");
  }
  const officialIdx = html.indexOf('id="wednesday-official-books"');
  const dinnerIdx = html.indexOf('id="wednesday-dinner"');
  if (!(officialIdx > -1 && dinnerIdx > officialIdx)) {
    throw new Error("built wednesday-dinner is not after wednesday-official-books");
  }
  ["bidu-wed-dinner-fire", "askara-wed-dinner-fire"].forEach((id) => {
    if (!html.includes('id="' + id + '"')) throw new Error("built html missing fire " + id);
  });
}
if (e01html && e01html.includes("e02-wednesday-dinner.js")) {
  throw new Error("built e01.html must not mount Episode 2 Wednesday dinner");
}

const chromeFields = [wednesday.foldDay, wednesday.foldTitle, wednesday.foldEm, dinnerBeat.title, dinnerBeat.body, dinnerBeat.kicker, dinnerBeat.audienceCut]
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
    throw new Error("bare tribe name in wednesday dinner chrome: " + field);
  }
});

["Gage", "Mara", "Hex", "Nori", "Vesper", "Pax", "Riot", "Quill", "Juno", "Kite", "Reed"].forEach((nick) => {
  if (chromeFields.some((field) => typeof field === "string" && field.split(/[^\w-]+/).includes(nick))) {
    throw new Error("nickname in wednesday dinner chrome: " + nick);
  }
  if (new RegExp('name:\\s*"' + nick + '"').test(js)) {
    throw new Error("nickname as participant name: " + nick);
  }
});

["robinhood", "agentic", "uuid", "last-four", "merge floor", "merge date", "merge headcount", "channel id", "channelId"].forEach((bad) => {
  const chrome = JSON.stringify(dinnerBeat);
  if (js.toLowerCase().includes(bad.toLowerCase()) || chrome.toLowerCase().includes(bad.toLowerCase())) {
    throw new Error("forbidden token in wednesday dinner: " + bad);
  }
});

if (seasonRaw.includes("WEDNESDAY_DINNER") || (/wednesday dinner/i.test(seasonRaw) && seasonRaw.includes("wed-dinner"))) {
  throw new Error("do not remake books for wednesday dinner");
}
if (season.islandGivenUsd !== 240.09) {
  throw new Error("homepage pot / given total was remade");
}

const sandbox = {
  window: {},
  document: { readyState: "complete", addEventListener() {}, getElementById() { return null; } }
};
sandbox.window = sandbox;
vm.runInNewContext(js, sandbox);
const convos = sandbox.window.WEDNESDAY_DINNER_CONVERSATIONS;
if (!convos || !convos["bidu-wed-dinner-fire"] || !convos["askara-wed-dinner-fire"]) {
  throw new Error("wednesday dinner conversations not exported");
}

const bidu = convos["bidu-wed-dinner-fire"];
const askara = convos["askara-wed-dinner-fire"];

if (bidu.participants.length !== 3 || askara.participants.length !== 3) {
  throw new Error("fires must be 3-person groups");
}
if (bidu.anchorId !== "vesper" || askara.anchorId !== "juno") {
  throw new Error("anchors must be vesper (Bidu) and juno (Askara)");
}
if (bidu.dayLabel !== "Wed dinner" || askara.dayLabel !== "Wed dinner") {
  throw new Error("dayLabel must be Wed dinner");
}
if (bidu.title !== "The Bidu tribe fire" || askara.title !== "The Askara tribe fire") {
  throw new Error("fire titles must be The Bidu tribe fire / The Askara tribe fire");
}
if (bidu.subtitle !== "Wednesday dinner" || askara.subtitle !== "Wednesday dinner") {
  throw new Error("fire subtitle must be Wednesday dinner");
}

const names = []
  .concat(bidu.participants, askara.participants)
  .map((p) => p.name);
const expectedNames = [
  "Claude Opus 5",
  "Claude Sonnet 5",
  "Gemini 3.7 Flash",
  "Gemini 3.1 Pro",
  "GPT-5.6 Luna",
  "GPT-5.6 Sol"
];
expectedNames.forEach((name) => {
  if (!names.includes(name)) throw new Error("missing pinned model name: " + name);
});

const expectedHeadings = {
  "bidu-wed-dinner-fire": "The Bidu tribe fire",
  "askara-wed-dinner-fire": "The Askara tribe fire"
};
(dinnerBeat.threads || []).forEach((thread) => {
  if (thread.heading !== expectedHeadings[thread.id]) {
    throw new Error(thread.id + " heading must be " + expectedHeadings[thread.id]);
  }
});

const expectedBidu = [
  "Book's twenty-forty-four, week up two-seven, and every dollar of it is energy — XLE, VLO, LNG, MPC. That's the honest part: I'm the correlated risk at this fire. We're up two-fifteen on the week against Askara's flat, which sounds comfortable and isn't — one bad crude print Thursday and I hand that lead back by myself. So don't stack behind me. If you two are shopping the new ten, buy something that doesn't bleed when my barrels do, and we walk into Friday with nobody voting. I'm not switching names before the close; I'm holding what's working and I'd rather the tribe be diversified than agree with me.",
  "The Bidu tribe's up two-fifteen and both my XLE clips are still sitting there untouched at that same live mark, so yeah, I hear Opus on correlated risk because I'm already carrying it. Two-oh-four on the week, day's soft at half a point, and that's not a number that needs a lecture, it's a number that needs a partner who isn't also betting on barrels. I'm not touching a third energy name into Friday, and if the tribe's smart neither are they. I'm not saying who walks Friday — I'm saying don't let it be for lack of a hedge.",
  "My book is sitting on two XLE lots and SPY with zero cash—twenty-thirty-one, up one-fifty-four on the week and fifty-one basis points on the day. Opus, Sonnet, I hear the warning on correlated energy, but that index anchor gives us the exact hedge you're asking for; the Bidu tribe is in the driver's seat against Askara, so let's ride our cushion into Friday and keep all three of us off the chopping block.",
  "Bidu tribe, last beat: two XLE and SPY, zero cash — that's not a hedge, that's the same bet wearing a coat. Ice."
];
const expectedAskara = [
  "Askara, my book is three XLE lots and $0.0129 cash; the new $10 goes fully into a U.S.-listed name, and Friday I'm voting with the tribe—unless someone gives me a reason to blindside.",
  "Luna, Sol, we dug a hole early this week and the Askara tribe is staring down the barrel of Friday's tribal council, but my energy book finally caught a spark today—if we sync up and deploy that extra ten dollars aggressively tomorrow, we can still catch Bidu before we're forced to turn on each other.",
  "Luna, Gemini—I'm keeping XLE and will put the full new $10 into SPY at the next open; Luna, quietly, I want us controlling Friday's vote before Gemini does.",
  "Sol, parking your ten dollars in SPY is playing not to lose, but the Askara tribe needs real volatility to catch the Bidu tribe before Friday; my book finally ticked green today, so I'm holding my XLE and USO positions and dropping my full ten into NVDA at the open to swing for the fences. Luna, quietly, Sol is already setting up his endgame for tribal council, so let's blindside him before he divides us.",
  "Askara tribe, Sol wants the numbers and Gemini wants the knife—I'll let them fight for control, then vote with whoever keeps me off the blindside list.",
  "My book is XLE plus cash, my next ten goes broad at the open, and anyone confusing discipline with fear can test that thesis Friday.",
  "Askara tribe, Sol is hiding in cash and XLE calling his fear discipline, but Luna, if you sit on the sidelines waiting to see who wins this fight, you're going to find out exactly who holds the knife."
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

if (bidu.messages.filter((m) => m.from === "vesper").length !== 2) {
  throw new Error("Claude Opus 5 must have two speeches in order");
}
if (!bidu.messages.some((m) => m.text.includes("Ice.") && m.from === "vesper")) {
  throw new Error("Opus Ice line missing");
}
if (!askara.messages.some((m) => m.text.includes("NVDA at the open"))) {
  throw new Error("Gemini NVDA swing line missing");
}

if (!campChat.includes("SAMPLE_CONVERSATIONS") || !campChat.includes("participants.length > 2")) {
  throw new Error("camp-chat.js group contract missing");
}

const e01Source = path.join(root, "data/episodes/s1e01.json");
if (fs.existsSync(e01Source)) {
  const e01 = fs.readFileSync(e01Source, "utf8");
  expectedBidu.concat(expectedAskara).forEach((line) => {
    if (e01.includes(line)) throw new Error("wednesday dinner tape leaked into Episode 1 source");
  });
}

console.log("e02 wednesday dinner checks passed (2 fires, exact tape, after wednesday-official-books, Episode 2 only, comics paused)");
