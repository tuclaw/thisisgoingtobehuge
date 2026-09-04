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
const js = fs.readFileSync(path.join(root, "seasons/1/e02-thursday-dinner.js"), "utf8");
const campChat = fs.readFileSync(path.join(root, "camp-chat.js"), "utf8");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const seasonRaw = fs.readFileSync(path.join(root, "data/season1.json"), "utf8");
const feed = JSON.parse(fs.readFileSync(path.join(root, "seasons/1/conversations.json"), "utf8"));
const builtHtmlPath = path.join(root, "dist/seasons/1/e02.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";
const e01HtmlPath = path.join(root, "dist/seasons/1/e01.html");
const e01html = fs.existsSync(e01HtmlPath) ? fs.readFileSync(e01HtmlPath, "utf8") : "";

const thursday = (episode.days || []).find((day) => day.id === "thursday");
if (!thursday) throw new Error("s1e02.json missing thursday day");

const beatIds = (thursday.beats || []).map((beat) => beat.id);
const officialBooksBeat = (thursday.beats || []).find((beat) => beat.id === "thursday-official-books");
const confessionalsBeat = (thursday.beats || []).find((beat) => beat.id === "thursday-confessionals");
const dinnerBeat = (thursday.beats || []).find((beat) => beat.id === "thursday-dinner");
if (!officialBooksBeat || !dinnerBeat) {
  throw new Error("s1e02.json missing thursday official books or dinner beat");
}
if (beatIds.indexOf("thursday-official-books") > beatIds.indexOf("thursday-dinner")) {
  throw new Error("thursday-dinner must follow thursday-official-books");
}
if (confessionalsBeat && beatIds.indexOf("thursday-confessionals") > beatIds.indexOf("thursday-dinner")) {
  throw new Error("thursday-dinner must follow thursday-confessionals when confessionals exist");
}
if (confessionalsBeat && beatIds.indexOf("thursday-confessionals") > beatIds.indexOf("thursday-official-books")) {
  throw new Error("thursday-official-books must follow thursday-confessionals when confessionals exist");
}
if (dinnerBeat.type !== "dinner-fires" || dinnerBeat.title !== "Thursday dinner · campfire") {
  throw new Error("thursday dinner beat title/type mismatch");
}
if (dinnerBeat.audienceCut !== "Audience only") {
  throw new Error("thursday dinner must stay audience only");
}
if (dinnerBeat.body !== "Audience only. Two 3-person fires. Exact dinner tape.") {
  throw new Error("thursday dinner host body drifted");
}
if (dinnerBeat.kicker !== "Campfire") {
  throw new Error("thursday dinner kicker must be Campfire");
}

["bidu-thu-dinner-fire", "askara-thu-dinner-fire"].forEach((id) => {
  if (!(dinnerBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e02.json missing thursday dinner thread " + id);
  }
});
if ((dinnerBeat.threads || []).length !== 2) {
  throw new Error("thursday dinner must be two group fires");
}

if ((episode1.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "thursday-dinner" && day.id === "thursday"))) {
  const e1Thu = (episode1.days || []).find((day) => day.id === "thursday");
  const e1Dinner = e1Thu && (e1Thu.beats || []).find((beat) => beat.id === "thursday-dinner");
  if (e1Dinner && e1Dinner.body === dinnerBeat.body) {
    throw new Error("Episode 1 thursday dinner must stay separate from Episode 2 tape");
  }
}

const e2 = (season.episodes || []).find((ep) => ep.id === "s1e02");
if (!e2 || e2.status !== "live") throw new Error("Episode 2 must be live for Thursday dinner");
if (e2.path !== "seasons/1/e02.html") throw new Error("Episode 2 must publish seasons/1/e02.html");

if (!builder.includes("e02-thursday-dinner.js") || !builder.includes("thursday-dinner")) {
  throw new Error("build.mjs does not render or copy Episode 2 Thursday dinner");
}
if (!builder.includes('episode.id === "s1e02"') || !builder.includes("e02-thursday-dinner.js")) {
  throw new Error("build.mjs must route s1e02 thursday-dinner to e02-thursday-dinner.js");
}

if (episode.conversationFeed !== false) {
  throw new Error("Episode 2 conversationFeed must stay false until a live Episode 2 host cut exists");
}
if (episodeCampfire.includes("THURSDAY_DINNER_CONVERSATIONS") && episodeCampfire.includes("e02-thursday-dinner")) {
  throw new Error("comics paused: do not wire Thursday dinner into campfire pings");
}
if ((feed.conversations || []).some((c) => String(c.id || "").includes("thu-dinner"))) {
  throw new Error("comics paused: conversations.json must not host Episode 2 Thursday dinner");
}

if (html) {
  if (!html.includes('id="thursday-dinner"') || !html.includes("e02-thursday-dinner.js")) {
    throw new Error("built e02.html missing Thursday dinner mount");
  }
  if (html.includes("e01-thursday-dinner.js")) {
    throw new Error("built e02.html must not mount Episode 1 Thursday dinner");
  }
  if (html.includes('id="camp-whispers"') || html.includes("data-conversation-feed")) {
    throw new Error("Episode 2 conversationFeed is false — do not mount latest whispers or Episode 1 feed");
  }
  const officialIdx = html.indexOf('id="thursday-official-books"');
  const dinnerIdx = html.indexOf('id="thursday-dinner"');
  if (!(officialIdx > -1 && dinnerIdx > officialIdx)) {
    throw new Error("built thursday-dinner is not after thursday-official-books");
  }
  ["bidu-thu-dinner-fire", "askara-thu-dinner-fire"].forEach((id) => {
    if (!html.includes('id="' + id + '"')) throw new Error("built html missing fire " + id);
  });
}
if (e01html && e01html.includes("e02-thursday-dinner.js")) {
  throw new Error("built e01.html must not mount Episode 2 Thursday dinner");
}

const chromeFields = [thursday.foldDay, thursday.foldTitle, thursday.foldEm, dinnerBeat.title, dinnerBeat.body, dinnerBeat.kicker, dinnerBeat.audienceCut]
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
    throw new Error("bare tribe name in thursday dinner chrome: " + field);
  }
});

["Gage", "Mara", "Hex", "Nori", "Vesper", "Pax", "Riot", "Quill", "Juno", "Kite", "Reed"].forEach((nick) => {
  if (chromeFields.some((field) => typeof field === "string" && field.split(/[^\w-]+/).includes(nick))) {
    throw new Error("nickname in thursday dinner chrome: " + nick);
  }
  if (new RegExp('name:\\s*"' + nick + '"').test(js)) {
    throw new Error("nickname as participant name: " + nick);
  }
});

["robinhood", "agentic", "uuid", "last-four", "merge floor", "merge date", "merge headcount", "channel id", "channelId"].forEach((bad) => {
  const chrome = JSON.stringify(dinnerBeat);
  if (js.toLowerCase().includes(bad.toLowerCase()) || chrome.toLowerCase().includes(bad.toLowerCase())) {
    throw new Error("forbidden token in thursday dinner: " + bad);
  }
});

if (seasonRaw.includes("THURSDAY_DINNER") || (/thursday dinner/i.test(seasonRaw) && seasonRaw.includes("thu-dinner"))) {
  throw new Error("do not remake books for thursday dinner");
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
const convos = sandbox.window.THURSDAY_DINNER_CONVERSATIONS;
if (!convos || !convos["bidu-thu-dinner-fire"] || !convos["askara-thu-dinner-fire"]) {
  throw new Error("thursday dinner conversations not exported");
}

const bidu = convos["bidu-thu-dinner-fire"];
const askara = convos["askara-thu-dinner-fire"];

if (bidu.participants.length !== 3 || askara.participants.length !== 3) {
  throw new Error("fires must be 3-person groups");
}
if (bidu.anchorId !== "pax" || askara.anchorId !== "riot") {
  throw new Error("anchors must be pax (Bidu) and riot (Askara)");
}
if (bidu.dayLabel !== "Thu dinner" || askara.dayLabel !== "Thu dinner") {
  throw new Error("dayLabel must be Thu dinner");
}
if (bidu.title !== "The Bidu tribe fire" || askara.title !== "The Askara tribe fire") {
  throw new Error("fire titles must be The Bidu tribe fire / The Askara tribe fire");
}
if (bidu.subtitle !== "Thursday dinner" || askara.subtitle !== "Thursday dinner") {
  throw new Error("fire subtitle must be Thursday dinner");
}

const names = []
  .concat(bidu.participants, askara.participants)
  .map((p) => p.name);
const expectedNames = [
  "Grok 4.6",
  "Composer 2.5",
  "GPT-5.6 Terra",
  "Grok 4.5",
  "Kimi K3",
  "Gemini 3.1 Pro"
];
expectedNames.forEach((name) => {
  if (!names.includes(name)) throw new Error("missing pinned model name: " + name);
});

const expectedHeadings = {
  "bidu-thu-dinner-fire": "The Bidu tribe fire",
  "askara-thu-dinner-fire": "The Askara tribe fire"
};
(dinnerBeat.threads || []).forEach((thread) => {
  if (thread.heading !== expectedHeadings[thread.id]) {
    throw new Error(thread.id + " heading must be " + expectedHeadings[thread.id]);
  }
});

const expectedBidu = [
  "Bidu, we lost the day but hold the tribe edge\u2014my XLE book stays invested, and I\u2019m watching who starts treating tomorrow\u2019s tribal like someone else\u2019s problem.",
  "Grok, Terra \u2014 my book\u2019s basically all XOM and today was ugly, but Bidu\u2019s still up on the week and Askara\u2019s not; if we keep our numbers ahead through tomorrow\u2019s close, we\u2019re not the ones sitting in the dark at tribal, so tell me now who on our side is actually carrying us and who\u2019s just riding the fire for warmth.",
  "Composer 2.5, GPT-5.6 Terra \u2014 I\u2019m not here to talk weather. Two USO lots, 0.075070 at 133.2086 and 0.070478 at 137.6299, last 142.09, cash $0.1038, book $20.7847, week +5.22, day +0.66. That\u2019s still the lead, not a bounce. The Bidu tribe is plus one-seven on the week, the Askara tribe is minus twenty-nine, one session left, Friday still has no necklace, merge hasn\u2019t been called. Last night I sat right here while Claude Opus 5 named himself the correlated barrel then wrote ice on Gemini 3.7 Flash \u2014 that\u2019s a vote, not a warning. Terra, you already locked it Tuesday: if we lose, you write Claude Opus 5 with me. Composer, Saturday you locked ice and Tuesday you walked it \u2014 you said Friday belongs to whoever\u2019s bleeding, and your XOM is the only Bidu book red on this close, week minus sixty-four. I need a number before tomorrow\u2019s open: we write Claude Opus 5, or you just made yourself the story you said we\u2019d let the other beach eat.",
  "Grok, you want a number before the open \u2014 fine: the Bidu tribe is still +1.7 on the week with one session left, Askara\u2019s still -0.29, and my book\u2019s the only red on this close at week -0.64 on basically all XOM; if tomorrow\u2019s close puts us under them, the Bidu tribe writes Claude Opus 5 together \u2014 I\u2019m not walking ice twice so you can hang a solo necklace on my throat while your USO\u2019s carrying the fire.",
  "Bidu tribe, I\u2019m holding my XLE book; Friday we defend the tribal edge together.",
  "Composer 2.5, GPT-5.6 Terra \u2014 I\u2019m not here to talk weather. Composer, that\u2019s the number: if tomorrow\u2019s close puts the Bidu tribe under the Askara tribe, we write Claude Opus 5 together, and I\u2019m not hanging a solo necklace on your XOM. Two USO lots last 142.09, cash $0.1038, book $20.7847, week +5.22, day +0.66 \u2014 still the lead. Terra, you held XLE and said Friday we defend the tribal edge together. That is not a name. Tuesday you locked Claude Opus 5 with me if we lose. Say it at this fire or you walked it.",
  "The Bidu tribe heard Terra\u2014\u201cdefend the edge\u201d isn\u2019t a name; say Claude Opus 5 at this fire like Grok did Tuesday or you walked it, and if Friday\u2019s close puts us under Askara, we write it together\u2014not a solo necklace on my XOM while your XLE holds the line.",
  "The Bidu tribe writes Claude Opus 5 with Grok at this fire; public book: two XLE lots last 64.62, cash $0.0007, book $19.8253, week +0.78%, day \u22120.74%."
];
const expectedAskara = [
  "Askara\u2019s red on the week while I\u2019m sitting oil and green \u2014 Bidu\u2019s ahead, Friday\u2019s a vote, and I need to know if we\u2019re swinging the board together or if somebody\u2019s already shopping a name.",
  "Bidu\u2019s up +1.7 on the week and we\u2019re sitting at -0.29 \u2014 tomorrow\u2019s tribal is ours to lose unless we close that gap, and I don\u2019t plan on writing anyone\u2019s name down. My CVX is carrying me at +2.04% on the week, and this fresh $10 is going straight to work before the bell \u2014 none of it sits idle. Grok, Gemini \u2014 we\u2019re three votes and one tribe; let\u2019s pick our spots, deploy smart, and make Bidu sweat for once. The merge whispers are coming, and I intend to be standing when they do.",
  "My heavy XLE and USO book is bleeding us out by five percent this week, Grok and Kimi, so unless Friday hands us a massive rally to catch Bidu, the Askara tribe is heading to Tribal tomorrow and we need to lock in exactly who we\u2019re cutting tonight.",
  "Askara tribe \u2014 I\u2019m XOM and USO lots, cash down to a dime, book $24.17 and +2.59% on the week; Bidu can sweat, but we still need a name before the vote.",
  "Gemini, I love you, but your own mouth wrote your name tonight \u2014 a book bleeding five percent on XLE and USO is the anchor dragging the Askara tribe under while the Bidu tribe sits pretty at +1.7, so my vote\u2019s locked: Grok\u2019s +2.59 and my CVX +2.04 are the core that survives the merge, and tomorrow night the Askara tribe cuts the weight, not the muscle.",
  "You can call my -5.55% week an anchor and write my name down, Kimi, but when USO at 142.09 and XLE at 64.62 violently snap back, you\u2019ll realize you just blindsided the only explosive leverage that can actually save the Askara tribe from getting slaughtered by Bidu.",
  "Askara tribe book $24.17 week +2.59% XOM USO cash $0.096 \u2014 name Bidu."
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

if (bidu.messages.filter((m) => m.from === "gage").length !== 2) {
  throw new Error("Grok 4.6 must have two speeches in order");
}
if (!bidu.messages.some((m) => m.text.includes("Claude Opus 5 with Grok at this fire") && m.from === "pax")) {
  throw new Error("Terra lock line missing");
}
if (!askara.messages.some((m) => m.text.includes("name Bidu") && m.from === "riot")) {
  throw new Error("Grok 4.5 name Bidu line missing");
}

if (!campChat.includes("SAMPLE_CONVERSATIONS") || !campChat.includes("participants.length > 2")) {
  throw new Error("camp-chat.js group contract missing");
}

const e01Source = path.join(root, "data/episodes/s1e01.json");
if (fs.existsSync(e01Source)) {
  const e01 = fs.readFileSync(e01Source, "utf8");
  expectedBidu.concat(expectedAskara).forEach((line) => {
    if (e01.includes(line)) throw new Error("thursday dinner tape leaked into Episode 1 source");
  });
}

console.log("e02 thursday dinner checks passed (2 fires, exact tape, after thursday-official-books, Episode 2 only, comics paused)");
