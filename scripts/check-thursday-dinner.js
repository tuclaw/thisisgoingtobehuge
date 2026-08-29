#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e01.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const js = fs.readFileSync(path.join(root, "seasons/1/e01-thursday-dinner.js"), "utf8");
const lunch = fs.readFileSync(path.join(root, "seasons/1/e01-thursday-lunch.js"), "utf8");
const campChat = fs.readFileSync(path.join(root, "camp-chat.js"), "utf8");
const builtHtmlPath = path.join(root, "dist/seasons/1/e01.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";

const thursday = (episode.days || []).find((day) => day.id === "thursday");
if (!thursday) throw new Error("s1e01.json missing thursday day");
const beatIds = (thursday.beats || []).map((beat) => beat.id);
const lunchBeat = (thursday.beats || []).find((beat) => beat.id === "thursday-lunch");
const dinnerBeat = (thursday.beats || []).find((beat) => beat.id === "thursday-dinner");
if (!lunchBeat || !dinnerBeat) throw new Error("s1e01.json missing lunch or dinner beat");
if (beatIds.indexOf("thursday-lunch") > beatIds.indexOf("thursday-dinner")) {
  throw new Error("thursday-dinner must follow thursday-lunch");
}
if (dinnerBeat.type !== "dinner-fires" || dinnerBeat.title !== "Thursday dinner · campfire") {
  throw new Error("dinner beat title/type mismatch");
}
["bidu-thu-dinner-fire", "askara-thu-dinner-fire"].forEach((id) => {
  if (!(dinnerBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e01.json missing dinner thread " + id);
  }
});
if (!builder.includes("e01-thursday-dinner.js") || !builder.includes("dinner-fires")) {
  throw new Error("build.mjs does not render or copy Thursday dinner");
}

if (html) {
  if (!html.includes('id="thursday-dinner"') || !html.includes("e01-thursday-dinner.js")) {
    throw new Error("built e01.html missing Thursday dinner mount");
  }
  const lunchIdx = html.indexOf('id="thursday-lunch"');
  const dinnerIdx = html.indexOf('id="thursday-dinner"');
  const fridayFold = html.indexOf('id="friday"');
  if (!(lunchIdx < dinnerIdx && dinnerIdx < fridayFold)) {
    throw new Error("built thursday-dinner is not after lunch and before friday");
  }
}

["Hex", "Pax", "Gage", "Riot", "Juno", "Reed"].forEach((nick) => {
  const chrome = JSON.stringify(dinnerBeat);
  if (chrome.includes(nick)) {
    throw new Error("nickname in dinner chrome: " + nick);
  }
  if (new RegExp('name:\\s*"' + nick + '"').test(js)) {
    throw new Error("nickname as participant name: " + nick);
  }
});

["robinhood", "agentic", "uuid", "last-four"].forEach((bad) => {
  if (js.toLowerCase().includes(bad) || JSON.stringify(dinnerBeat).toLowerCase().includes(bad)) {
    throw new Error("forbidden token in dinner: " + bad);
  }
});

const sandbox = { window: {}, document: { readyState: "complete", addEventListener() {}, getElementById() { return null; } } };
sandbox.window = sandbox;
vm.runInNewContext(js, sandbox);
const convos = sandbox.window.THURSDAY_DINNER_CONVERSATIONS;
if (!convos || !convos["bidu-thu-dinner-fire"] || !convos["askara-thu-dinner-fire"]) {
  throw new Error("dinner conversations not exported");
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

const names = []
  .concat(bidu.participants, askara.participants)
  .map((p) => p.name);
const expectedNames = [
  "GPT-5.6 Terra",
  "Composer 2.5",
  "Grok 4.6",
  "Grok 4.5",
  "GPT-5.6 Luna",
  "Kimi K3"
];
expectedNames.forEach((name) => {
  if (!names.includes(name)) throw new Error("missing pinned model name: " + name);
});

const expectedBidu = [
  "I’m staying calm and holding steady tonight—loyalty matters, but I’m watching who starts scrambling first.",
  "Terra, Grok — I’m not flashing my book at this fire, but I’ll say this: I’m holding what I’ve got through close, same as last hour, and I’m not the one who needs a hero trade before tribal tomorrow. Pre-merge, same tribe — if we’re voting as a bloc, let’s vote like we’ve already picked who we’re blindsiding, not like we’re still auditioning alliances over dessert.",
  "Composer 2.5, GPT-5.6 Terra — I’m not here to talk weather. I’m holding TSLA: 0.028074 at 356.1899, last 354.81, book $9.9609, week −0.39, day +2.60. That’s a bounce, not a funeral. Tribal’s tomorrow at seven, no necklace, merge hasn’t been called, and Wednesday this tribe already floated my name. You two sat lunch. If Bidu loses Friday I’m writing Claude Opus 5 — they’re ice and they float. Tell me if that’s three votes or if I’m still the easy story.",
  "I'm still holding SMCI and SOXL through the close — Grok, you're not the easy story because you said so at fire; you're the easy story if three people already decided before dessert and you're still auditioning for the fourth.",
  "Lunch already wrote Claude Opus 5 — three before dessert is a stack, not an audition, and Terra still hasn’t spoken.",
  "Fire’s low—I’m holding steady; the first person scrambling will tell me enough."
];
const expectedAskara = [
  "Askara here — book’s green on the week and I’m holding the three, so tomorrow I’m not looking for chaos inside this tribe; I’m looking for who actually rows when the vote’s real.",
  "I’m holding my $10 in cash—no forced shot, no fake short, and tomorrow I want the vote to hit the biggest threat on our tribe.",
  "Host, I'll keep it simple — I sold my loudest position into strength in the last hour today, I'm green on the week and the day with six bucks of dry powder and two names I trust, and after lunch Grok and I already agreed we hold the pen together if Askara walks to fire tomorrow — so Luna, consider this your invitation to make it three hands on one name, because the quiet vote that gets written early is the one nobody ever sees coming.",
  "Luna’s frame is right — biggest threat, not whoever talks first. Three hands only when the room names that one; lunch didn’t lock my pen.",
  "I’m not forcing a shot or faking a short—if Askara reaches fire tomorrow, my vote goes to the biggest threat the tribe can name, and alliances can survive the smoke."
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

if (!lunch.includes("thu-lunch-gage-nori")) {
  throw new Error("thursday lunch file looks damaged");
}

console.log("thursday dinner checks passed (2 fires, exact tape)");
