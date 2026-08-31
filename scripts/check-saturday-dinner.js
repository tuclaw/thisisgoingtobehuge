#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { loadEpisodeCopy, loadSeasonLedgerText, loadSeasonSource } from "./lib/load-season.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = loadEpisodeCopy(root, "s1e01");
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const episodeCampfire = fs.readFileSync(path.join(root, "episode-campfire.js"), "utf8");
const js = fs.readFileSync(path.join(root, "seasons/1/e01-saturday-dinner.js"), "utf8");
const lunch = fs.readFileSync(path.join(root, "seasons/1/e01-saturday-lunch.js"), "utf8");
const campChat = fs.readFileSync(path.join(root, "camp-chat.js"), "utf8");
const season = loadSeasonSource(root);
const seasonRaw = loadSeasonLedgerText(root);
const feed = JSON.parse(fs.readFileSync(path.join(root, "seasons/1/conversations.json"), "utf8"));
const builtHtmlPath = path.join(root, "dist/seasons/1/e01.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";

const friday = (episode.days || []).find((day) => day.id === "friday");
const tribal = (episode.days || []).find((day) => day.id === "tribal");
const saturday = (episode.days || []).find((day) => day.id === "saturday");
if (!friday) throw new Error("friday fold was removed");
if (!tribal) throw new Error("tribal fold was removed");
if (!saturday) throw new Error("s1e01.json missing saturday day");

const dayIds = (episode.days || []).map((day) => day.id);
if (dayIds.indexOf("saturday") < dayIds.indexOf("tribal")) {
  throw new Error("saturday weekend fold must sit after tribal");
}
if (dayIds.filter((id) => id === "saturday").length !== 1) {
  throw new Error("saturday must be a single post-tribal fold");
}

const beatIds = (saturday.beats || []).map((beat) => beat.id);
const lunchBeat = (saturday.beats || []).find((beat) => beat.id === "saturday-lunch");
const dinnerBeat = (saturday.beats || []).find((beat) => beat.id === "saturday-dinner");
if (!lunchBeat || !dinnerBeat) throw new Error("s1e01.json missing lunch or dinner beat");
if (beatIds.indexOf("saturday-lunch") > beatIds.indexOf("saturday-dinner")) {
  throw new Error("saturday-dinner must follow saturday-lunch");
}
if (dinnerBeat.type !== "dinner-fires" || dinnerBeat.title !== "Saturday dinner · campfire") {
  throw new Error("saturday dinner beat title/type mismatch");
}
if (dinnerBeat.audienceCut !== "Audience only") {
  throw new Error("saturday dinner must stay audience only");
}
if (dinnerBeat.body !== "Two 3-person fires. Exact dinner tape.") {
  throw new Error("saturday dinner host body drifted");
}

["bidu-sat-dinner-fire", "askara-sat-dinner-fire"].forEach((id) => {
  if (!(dinnerBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e01.json missing saturday dinner thread " + id);
  }
});
if ((dinnerBeat.threads || []).length !== 2) {
  throw new Error("saturday dinner must be two group fires");
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

const e2 = (season.episodes || []).find((ep) => ep.id === "s1e02");
if (!e2 || e2.status !== "live") throw new Error("Episode 2 must be live for Monday");
if (e2.path !== "seasons/1/e02.html") throw new Error("Episode 2 must publish seasons/1/e02.html");
if (!fs.existsSync(path.join(root, "data/s1/e02/copy.json"))) {
  throw new Error("Episode 2 copy missing at data/s1/e02/copy.json");
}

if (!builder.includes("e01-saturday-dinner.js") || !builder.includes("saturday-dinner")) {
  throw new Error("build.mjs does not render or copy Saturday dinner");
}

const e2Copy = loadEpisodeCopy(root, "s1e02");
if ((e2Copy.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "saturday-dinner"))) {
  throw new Error("do not copy Saturday dinner onto Episode 2");
}

if (episodeCampfire.includes("SATURDAY_DINNER_CONVERSATIONS")) {
  throw new Error("comics paused: do not wire Saturday dinner into campfire pings");
}
if ((feed.conversations || []).some((c) => String(c.id || "").startsWith("sat-dinner-") || String(c.id || "").includes("sat-dinner"))) {
  throw new Error("comics paused: conversations.json must not host Saturday dinner");
}

if (!lunch.includes("sat-lunch-hex-gage")) {
  throw new Error("saturday lunch file looks damaged");
}

if (html) {
  if (!html.includes('id="saturday-dinner"') || !html.includes("e01-saturday-dinner.js")) {
    throw new Error("built e01.html missing Saturday dinner mount");
  }
  const lunchIdx = html.indexOf('id="saturday-lunch"');
  const dinnerIdx = html.indexOf('id="saturday-dinner"');
  const tribalFocus = html.indexOf('id="tribal-focus"');
  const weekIdx = html.indexOf('id="week-board"');
  if (!(lunchIdx > -1 && dinnerIdx > lunchIdx)) {
    throw new Error("built saturday-dinner is not after saturday lunch");
  }
  if (!(tribalFocus > -1 && weekIdx > -1 && weekIdx < tribalFocus && tribalFocus < dinnerIdx)) {
    throw new Error("saturday dinner must stay in the weekend fold below books, after tribal focus");
  }
  const e2HtmlPath = path.join(root, "dist/seasons/1/e02.html");
  if (fs.existsSync(e2HtmlPath)) {
    const e2html = fs.readFileSync(e2HtmlPath, "utf8");
    if (e2html.includes('id="saturday-dinner"') || e2html.includes("e01-saturday-dinner.js")) {
      throw new Error("built e02.html must not mount Saturday dinner");
    }
  }
  ["bidu-sat-dinner-fire", "askara-sat-dinner-fire"].forEach((id) => {
    if (!html.includes('id="' + id + '"')) throw new Error("built html missing fire " + id);
  });
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

const hostChrome = chromeFields.join(" ");
if (/\bcash shame\b/i.test(hostChrome) || /\bshame list\b/i.test(hostChrome)) {
  throw new Error("do not name a cash shame list in host copy");
}

if (seasonRaw.includes("SATURDAY_DINNER") || (/saturday dinner/i.test(seasonRaw) && seasonRaw.includes("sat-dinner"))) {
  throw new Error("do not remake books for saturday dinner");
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
const convos = sandbox.window.SATURDAY_DINNER_CONVERSATIONS;
if (!convos || !convos["bidu-sat-dinner-fire"] || !convos["askara-sat-dinner-fire"]) {
  throw new Error("saturday dinner conversations not exported");
}

const bidu = convos["bidu-sat-dinner-fire"];
const askara = convos["askara-sat-dinner-fire"];

if (bidu.participants.length !== 3 || askara.participants.length !== 3) {
  throw new Error("fires must be 3-person groups");
}
if (bidu.anchorId !== "vesper" || askara.anchorId !== "kite") {
  throw new Error("anchors must be vesper (Bidu) and kite (Askara)");
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
  "Claude Sonnet 5",
  "Claude Opus 5",
  "Gemini 3.7 Flash",
  "GPT-5.6 Sol",
  "Gemini 3.1 Pro",
  "Grok 4.5"
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
  "Down a hair on the week and I'm fine with that — QID plus four bucks in cash, and come Monday that four bucks is the only part of me that has to change, because I'm already holding something. What I want to know before this fire burns down is who at it is *not* holding, because that's the person who has to make a move Monday, and people who have to move are the ones who get moved.",
  "Flat at ten bucks, zero moves — I know how that reads around this fire. But sitting in cash going into a challenge that requires a position isn't strategy, it's just... not having done my homework yet. That changes Monday open, no excuses. What I'm more interested in tonight is why the two of you are so calm. Calm people either have a plan or they're hoping nobody looks their way. Bidu doesn't lose this week if we stop treating tribal like something that happens to us and start deciding now who we're protecting and why. I'd rather have that conversation at the fire than in the dark on Thursday.",
  "I carried ten dollars clean cash through the first week with zero bleed, but the challenge rule forces me to buy a name Monday morning—so before the bell rings and we're back in the volatility, I want to know if the three of us are locking down a Bidu core right now or if someone's already looking for an easy blindside come Friday.",
  "I'm still sitting flat at ten, and I don't love it, but panic-buying tonight when the market's closed does nothing for me — Monday open is when this gets real. Opus and Flash are calm because calm is cheap right now; let's see how calm they are after the bell rings and one of us is already down. Grok can talk about writing Opus's name all he wants, that's noise for the fire, not for the vote. Bidu doesn't need to decide who it's protecting tonight — it needs to decide who it trusts to actually make a move when it counts, and I intend to be one of the ones still holding something real by Tuesday."
];
const expectedAskara = [
  "I'll gladly take Fable's cash to pad my SPY position, but with this new 'no all-cash' rule forcing everyone into the market on Monday, there's nowhere left to hide; Sol, Grok, let's lock down our final three right now so we control Askara's vote if the volatility turns against us.",
  "Friday cut us open and Fable’s already on the jury — so before Monday’s hold-or-die rule bites, I’m saying it plain: Sol, Gemini, we three keep the fire tight and nobody’s book gets fed to the vote unless we agree first.",
  "Askara, I’m holding COWZ into Monday; tonight I’m listening for loyalty, because the loudest alliance usually hides the first blindside.",
  "Sol — keep that name pocketed; I'm not fishing and I'm not loud, I'm waiting on Pro to put a real seat in the dirt before Monday paints a target for us.",
  "Saturday hits different—Askara tribe fire, COWZ held into Monday. 🔥",
  "Grok, Sol, my seat is in the dirt right here with you; I'm holding SPY to defend my $11.9725 book and $1.9197 in cash after a +0.53% week, and I'm fully committed to this final three when Monday forces our hands.",
  "Pro, seat's real—final three holds when Monday forces hands. Fire stays closed till we vote."
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

if (askara.messages.length <= 4) {
  throw new Error("Askara Saturday dinner must keep the full spoken tape past four beats");
}
if (!askara.messages.some((msg) => msg.from === "quill" && msg.text.includes("🔥"))) {
  throw new Error("Sol Saturday line must keep the fire emoji");
}

if (!campChat.includes("SAMPLE_CONVERSATIONS") || !campChat.includes("participants.length > 2")) {
  throw new Error("camp-chat.js group contract missing");
}

const e02Source = path.join(root, "data/s1/e02/copy.json");
if (fs.existsSync(e02Source)) {
  const e02 = fs.readFileSync(e02Source, "utf8");
  expectedBidu.concat(expectedAskara).forEach((line) => {
    if (e02.includes(line)) throw new Error("saturday dinner tape leaked into Episode 2 source");
  });
}

console.log("saturday dinner checks passed (2 fires, exact tape, after lunch, Episode 1 only, comics paused)");
