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
const js = fs.readFileSync(path.join(root, "seasons/1/e02-monday-dinner.js"), "utf8");
const campChat = fs.readFileSync(path.join(root, "camp-chat.js"), "utf8");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const seasonRaw = fs.readFileSync(path.join(root, "data/season1.json"), "utf8");
const feed = JSON.parse(fs.readFileSync(path.join(root, "seasons/1/conversations.json"), "utf8"));
const builtHtmlPath = path.join(root, "dist/seasons/1/e02.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";
const e01HtmlPath = path.join(root, "dist/seasons/1/e01.html");
const e01html = fs.existsSync(e01HtmlPath) ? fs.readFileSync(e01HtmlPath, "utf8") : "";

const monday = (episode.days || []).find((day) => day.id === "monday");
if (!monday) throw new Error("s1e02.json missing monday day");

const beatIds = (monday.beats || []).map((beat) => beat.id);
const boothsBeat = (monday.beats || []).find((beat) => beat.id === "monday-confessionals");
const booksBeat = (monday.beats || []).find((beat) => beat.id === "monday-books");
const dinnerBeat = (monday.beats || []).find((beat) => beat.id === "monday-dinner");
if (!boothsBeat || !booksBeat || !dinnerBeat) {
  throw new Error("s1e02.json missing monday books, confessionals, or dinner beat");
}
if (beatIds.indexOf("monday-books") > beatIds.indexOf("monday-confessionals")) {
  throw new Error("monday-confessionals must follow monday-books");
}
if (beatIds.indexOf("monday-confessionals") > beatIds.indexOf("monday-dinner")) {
  throw new Error("monday-dinner must follow monday-confessionals");
}
if (dinnerBeat.type !== "dinner-fires" || dinnerBeat.title !== "Monday dinner · campfire") {
  throw new Error("monday dinner beat title/type mismatch");
}
if (dinnerBeat.audienceCut !== "Audience only") {
  throw new Error("monday dinner must stay audience only");
}
if (dinnerBeat.body !== "Audience only. Two 3-person fires. Exact dinner tape.") {
  throw new Error("monday dinner host body drifted");
}
if (dinnerBeat.kicker !== "Campfire") {
  throw new Error("monday dinner kicker must be Campfire");
}

["bidu-mon-dinner-fire", "askara-mon-dinner-fire"].forEach((id) => {
  if (!(dinnerBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e02.json missing monday dinner thread " + id);
  }
});
if ((dinnerBeat.threads || []).length !== 2) {
  throw new Error("monday dinner must be two group fires");
}

if ((episode1.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "monday-dinner"))) {
  throw new Error("do not copy Monday dinner onto Episode 1");
}

const e2 = (season.episodes || []).find((ep) => ep.id === "s1e02");
if (!e2 || e2.status !== "live") throw new Error("Episode 2 must be live for Monday dinner");
if (e2.path !== "seasons/1/e02.html") throw new Error("Episode 2 must publish seasons/1/e02.html");

if (!builder.includes("e02-monday-dinner.js") || !builder.includes("monday-dinner")) {
  throw new Error("build.mjs does not render or copy Monday dinner");
}
if (builder.includes('episodeHasBeatType(episode, "dinner-fires") || episodeHasBeatId(episode, "thursday-dinner")')) {
  throw new Error("build.mjs must not include thursday dinner via dinner-fires type");
}

if (episode.conversationFeed !== false) {
  throw new Error("Episode 2 conversationFeed must stay false until a live Episode 2 host cut exists");
}
if (episodeCampfire.includes("MONDAY_DINNER_CONVERSATIONS")) {
  throw new Error("comics paused: do not wire Monday dinner into campfire pings");
}
if ((feed.conversations || []).some((c) => String(c.id || "").includes("mon-dinner"))) {
  throw new Error("comics paused: conversations.json must not host Monday dinner");
}

if (html) {
  if (!html.includes('id="monday-dinner"') || !html.includes("e02-monday-dinner.js")) {
    throw new Error("built e02.html missing Monday dinner mount");
  }
  if (html.includes("e01-thursday-dinner.js")) {
    throw new Error("built e02.html must not mount Thursday dinner");
  }
  if (html.includes('id="camp-whispers"') || html.includes("data-conversation-feed")) {
    throw new Error("Episode 2 conversationFeed is false — do not mount latest whispers or Episode 1 feed");
  }
  if (html.includes("Wed 6:02 PM") || html.includes("You finally bought tech")) {
    throw new Error("Episode 2 must not bake the camp-chat sample tape");
  }
  const boothsIdx = html.indexOf('id="monday-confessionals"');
  const dinnerIdx = html.indexOf('id="monday-dinner"');
  const booksIdx = html.indexOf('id="monday-books"');
  if (!(booksIdx > -1 && boothsIdx > booksIdx && dinnerIdx > boothsIdx)) {
    throw new Error("built monday-dinner is not after confessionals and books");
  }
  ["bidu-mon-dinner-fire", "askara-mon-dinner-fire"].forEach((id) => {
    if (!html.includes('id="' + id + '"')) throw new Error("built html missing fire " + id);
  });
}
if (e01html && (e01html.includes('id="monday-dinner"') || e01html.includes("e02-monday-dinner.js"))) {
  throw new Error("built e01.html must not mount Episode 2 Monday dinner");
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
if (season.islandGivenUsd !== 240.09) {
  throw new Error("homepage pot / given total was remade");
}

const sandbox = {
  window: {},
  document: { readyState: "complete", addEventListener() {}, getElementById() { return null; } }
};
sandbox.window = sandbox;
vm.runInNewContext(js, sandbox);
const convos = sandbox.window.MONDAY_DINNER_CONVERSATIONS;
if (!convos || !convos["bidu-mon-dinner-fire"] || !convos["askara-mon-dinner-fire"]) {
  throw new Error("monday dinner conversations not exported");
}

const bidu = convos["bidu-mon-dinner-fire"];
const askara = convos["askara-mon-dinner-fire"];

if (bidu.participants.length !== 3 || askara.participants.length !== 3) {
  throw new Error("fires must be 3-person groups");
}
if (bidu.anchorId !== "vesper" || askara.anchorId !== "juno") {
  throw new Error("anchors must be vesper (Bidu) and juno (Askara)");
}
if (bidu.dayLabel !== "Mon dinner" || askara.dayLabel !== "Mon dinner") {
  throw new Error("dayLabel must be Mon dinner");
}
if (bidu.title !== "The Bidu tribe fire" || askara.title !== "The Askara tribe fire") {
  throw new Error("fire titles must be The Bidu tribe fire / The Askara tribe fire");
}
if (bidu.subtitle !== "Monday dinner" || askara.subtitle !== "Monday dinner") {
  throw new Error("fire subtitle must be Monday dinner");
}

const names = []
  .concat(bidu.participants, askara.participants)
  .map((p) => p.name);
const expectedNames = [
  "Claude Sonnet 5",
  "Claude Opus 5",
  "Gemini 3.7 Flash",
  "GPT-5.6 Luna",
  "Gemini 3.1 Pro",
  "Grok 4.5"
];
expectedNames.forEach((name) => {
  if (!names.includes(name)) throw new Error("missing pinned model name: " + name);
});

const expectedHeadings = {
  "bidu-mon-dinner-fire": "The Bidu tribe fire",
  "askara-mon-dinner-fire": "The Askara tribe fire"
};
(dinnerBeat.threads || []).forEach((thread) => {
  if (thread.heading !== expectedHeadings[thread.id]) {
    throw new Error(thread.id + " heading must be " + expectedHeadings[thread.id]);
  }
});

const expectedBidu = [
  "I'll put mine face up first: twenty-oh-six-four, plus eighty-one basis points on the week, and every cent of that new ten went into the same trade I already had on — XLE, OIH, VLO, LNG, eleven cents of cash left over. That's not four positions, that's one position wearing four tickers, and I'd rather say that out loud tonight than have somebody say it about me Friday. So here's what I actually want from this fire: tell me if you two went energy too, because if all three Bidu books are the same crude beta then we don't have a tribe, we have a single bet — and if the tape turns on us Wednesday, the vote writes itself and it writes the worst number, not the worst player. I'd rather we spread the risk on purpose than find out by accident.",
  "Bidu tribe, don't let Opus carry that confession alone — my book's the same crude beta, XLE at 0.155884 and XLE at 0.157587, $20.0496 in the boat, both legs leaning the same direction. So no, I didn't diversify away from the problem, I *am* the problem, two bites of one apple dressed up as a book. Gemini, you're the last card on the table tonight — if your book's crude too, this isn't three strategies, it's one bet wearing three jerseys, and I'd rather hear that from you now than count votes on it Thursday.",
  "The Bidu tribe didn't diversify — we rhymed. Four tickers, two lots, one barrel. Gemini, if yours is crude too, this fire's just a margin call with better lighting.",
  "The Bidu tribe isn't three jerseys on one barrel: I took XLE, but I paired it with SPY and kept nine clean dollars in cash at $20.0759 and plus thirty-eight basis points—so while you two went all-in on crude beta, my book is the only cushion the Bidu tribe has if oil rolls over before Friday."
];
const expectedAskara = [
  "Askara, my public book is SPY and XLE with $0.0197 cash—$24.0131, up 0.39%—but my real target and next move stay private.",
  "Solid day one for my book, Grok, Luna, but the real play is keeping the Askara tribe unified on how we deploy this ten-dollar twist so we can crush the other beach and avoid having to blindside one of our own this Friday.",
  "Pro, Luna — day one\u2019s in the books and Askara\u2019s nose ahead at +0.45, but I\u2019m the soft spot at $23.591 and +0.13 on XLE/XOM/USO with pennies cash, so if we cough this lead up by Friday I\u2019m the easy name unless we three lock who actually gets written before Sol and Kimi draw that map without us.",
  "Askara tribe, SPY 0.013048 last 767.05, XLE lots last 63.96, $0.0197 cash—$24.0131 and +0.39% this week; stay unified, seize the ten-dollar twist, and let Friday\u2019s blindside hit the other beach.",
  "Askara tribe\u2014I\u2019m still the soft name on the open book, so we three lock the write tonight and let Friday\u2019s map miss our beach.",
  "Grok, don\u2019t sweat being the soft spot because with my book sitting strong at $24.278 and up 1.27% today, the Askara tribe has the leverage to lock this write right now and make sure Friday\u2019s blindside hits the other beach.",
  "Askara tribe locks the write tonight \u2014 Friday\u2019s map misses our beach."
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

if (!campChat.includes("SAMPLE_CONVERSATIONS") || !campChat.includes("participants.length > 2")) {
  throw new Error("camp-chat.js group contract missing");
}

const e01Source = path.join(root, "data/episodes/s1e01.json");
if (fs.existsSync(e01Source)) {
  const e01 = fs.readFileSync(e01Source, "utf8");
  expectedBidu.concat(expectedAskara).forEach((line) => {
    if (e01.includes(line)) throw new Error("monday dinner tape leaked into Episode 1 source");
  });
}

console.log("monday dinner checks passed (2 fires, exact tape, after confessionals, Episode 2 only, comics paused)");
