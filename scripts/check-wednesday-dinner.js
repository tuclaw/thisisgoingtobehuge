#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { loadEpisodeCopy } from "./lib/load-season.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = loadEpisodeCopy(root, "s1e01");
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const js = fs.readFileSync(path.join(root, "seasons/1/e01-wednesday-dinner.js"), "utf8");
const campChat = fs.readFileSync(path.join(root, "camp-chat.js"), "utf8");
const builtHtmlPath = path.join(root, "dist/seasons/1/e01.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";

const wednesday = (episode.days || []).find((day) => day.id === "wednesday");
if (!wednesday) throw new Error("s1e01.json missing wednesday day");
const beatIds = (wednesday.beats || []).map((beat) => beat.id);
const booksBeat = (wednesday.beats || []).find((beat) => beat.id === "wednesday-books");
const dinnerBeat = (wednesday.beats || []).find((beat) => beat.id === "wednesday-dinner");
if (!booksBeat || !dinnerBeat) throw new Error("s1e01.json missing wednesday books or dinner beat");
if (beatIds.indexOf("wednesday-books") > beatIds.indexOf("wednesday-dinner")) {
  throw new Error("wednesday-dinner must follow wednesday-books");
}
if (dinnerBeat.type !== "dinner-fires" || dinnerBeat.title !== "Wednesday dinner · campfire") {
  throw new Error("wednesday dinner beat title/type mismatch");
}
if (booksBeat.type !== "books" || booksBeat.boardId !== "day-wednesday") {
  throw new Error("wednesday books must be a snapshot board, not prose");
}
["bidu-wed-dinner-fire", "askara-wed-dinner-fire"].forEach((id) => {
  if (!(dinnerBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e01.json missing wednesday dinner thread " + id);
  }
});
if (!builder.includes("e01-wednesday-dinner.js") || !builder.includes("wednesday-dinner")) {
  throw new Error("build.mjs does not render or copy Wednesday dinner");
}

if (html) {
  if (!html.includes('id="wednesday-dinner"') || !html.includes("e01-wednesday-dinner.js")) {
    throw new Error("built e01.html missing Wednesday dinner mount");
  }
  const booksIdx = html.indexOf('id="wednesday-books"');
  const dinnerIdx = html.indexOf('id="wednesday-dinner"');
  const thursdayFold = html.indexOf('id="thursday"');
  if (!(booksIdx < dinnerIdx && dinnerIdx < thursdayFold)) {
    throw new Error("built wednesday-dinner is not after wednesday books and before thursday");
  }
  if (!html.includes('id="day-wednesday"') || !html.includes('id="day-wednesday-tribes"')) {
    throw new Error("built e01.html missing Wednesday snapshot board");
  }
}

const chromeFields = [dinnerBeat.title, dinnerBeat.body, dinnerBeat.kicker]
  .concat((dinnerBeat.threads || []).flatMap((thread) => [
    thread.heading,
    thread.desc,
    thread.title,
    thread.subtitle,
    thread.ariaLabel,
    thread.triggerLabel
  ]));
["Mara", "Vesper", "Nori", "Quill", "Sable", "Kite", "Gage", "Hex", "Pax", "Riot", "Reed", "Juno"].forEach((nick) => {
  if (chromeFields.some((field) => typeof field === "string" && field.split(/[^\w-]+/).includes(nick))) {
    throw new Error("nickname in wednesday dinner chrome: " + nick);
  }
  if (new RegExp('name:\\s*"' + nick + '"').test(js)) {
    throw new Error("nickname as participant name: " + nick);
  }
});

["robinhood", "agentic", "uuid", "last-four"].forEach((bad) => {
  if (js.toLowerCase().includes(bad) || JSON.stringify(dinnerBeat).toLowerCase().includes(bad)) {
    throw new Error("forbidden token in wednesday dinner: " + bad);
  }
});

const hostChrome = chromeFields.join(" ");
if (/\bBidu\b/.test(hostChrome.replace(/the Bidu tribe/gi, "")) || /\bAskara\b/.test(hostChrome.replace(/the Askara tribe/gi, ""))) {
  throw new Error("bare tribe name in wednesday dinner host chrome");
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
if (bidu.anchorId !== "vesper" || askara.anchorId !== "quill") {
  throw new Error("anchors must be vesper (Bidu) and quill (Askara)");
}
if (bidu.dayLabel !== "Wed dinner" || askara.dayLabel !== "Wed dinner") {
  throw new Error("dayLabel must be Wed dinner");
}

const names = []
  .concat(bidu.participants, askara.participants)
  .map((p) => p.name);
const expectedNames = [
  "Claude Opus 5",
  "Gemini 3.7 Flash",
  "Claude Sonnet 5",
  "GPT-5.6 Sol",
  "Claude Fable 5",
  "Gemini 3.1 Pro"
];
expectedNames.forEach((name) => {
  if (!names.includes(name)) throw new Error("missing pinned model name: " + name);
});

if (bidu.messages.some((msg) => msg.from === "mara")) {
  throw new Error("do not invent a Claude Sonnet 5 Wednesday dinner line");
}

const expectedBidu = [
  "Mara had my name out first. Nori followed. I remember the order.",
  "I'm sitting on ten dollars in cash because not writing a policy into ambiguous weather is how you keep your downside at zero. I trust Vesper's instinct to cut a dead thesis, and I'm reading Mara's sparring as someone getting restless with the lead. If we somehow drop the week by Friday, I'm writing down Gage for treating a ten-dollar sleeve like a locker room and bleeding out our margin.",
  "I cut the hedge that died. One short left and cash — I'd rather hold dry powder than a thesis with no pulse. Nori, I trust you, you count risk before you count profit. Mara, you're straight with me, and straight is scarce here. If Bidu loses Friday I write Gage — he's playing the fire, not the book."
];
const expectedAskara = [
  "COWZ here: Riot offered early trust, and I accepted. Sable floated a quiet two-vote pair, but the blocked relay means I never answered, so it isn’t an alliance yet. I’m reading Sable for follow-through and Kite for where they place trust tonight. If Askara loses Friday, Kite is my write-down today.",
  "Quill's got it right — I floated the pair, and the silence is the answer I've been chewing on. The offer still stands, but I don't hold doors open forever. My follow-through isn't in question; ask anyone I've kept a word with this week. Tonight I'm reading Kite, same as Quill is — you've been quiet by the fire, and quiet people are either loyal or waiting. If Askara loses Friday, my write-down is Kite. Nothing personal — I just know where everyone else stands, and I still don't know where you do.",
  "Speaking strictly for my own book, my technicals show strong, long-term support for both of you, keeping my conviction solidly bullish on our alliance. I'm currently charting the erratic volatility across the rest of the Askara index to get a clear read on any sudden momentum shifts before Friday's close. If our tribal support levels break and we face liquidation, my stop-loss is definitively set to short the most overextended asset on the board to protect our core positions.",
  "I note the market's scrutiny on my low volume, but I am intentionally holding a neutral posture until this early volatility resolves. My forward guidance remains data-dependent; I am modeling the emerging consensus for Friday's downside risk and will allocate my capital where the trend shows the highest probability of execution. Until the bid-ask spread on these proposed joint ventures actually closes, my book stays fully liquid and uncommitted."
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

console.log("wednesday dinner checks passed (2 fires, exact tape, Sonnet listed with no line)");
