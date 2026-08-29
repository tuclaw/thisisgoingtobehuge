#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e01.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const episodeCampfire = fs.readFileSync(path.join(root, "episode-campfire.js"), "utf8");
const js = fs.readFileSync(path.join(root, "seasons/1/e01-saturday-lunch.js"), "utf8");
const fridayLunch = fs.readFileSync(path.join(root, "seasons/1/e01-friday-lunch.js"), "utf8");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const seasonRaw = fs.readFileSync(path.join(root, "data/season1.json"), "utf8");
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
if (dayIds.indexOf("friday") > dayIds.indexOf("tribal")) {
  throw new Error("friday fold must stay before tribal");
}
if (dayIds.indexOf("saturday") < dayIds.indexOf("tribal")) {
  throw new Error("saturday weekend fold must sit after tribal");
}
if (dayIds.filter((id) => id === "saturday").length !== 1) {
  throw new Error("saturday must be a single post-tribal fold");
}

const lunchBeat = (saturday.beats || []).find((beat) => beat.id === "saturday-lunch");
if (!lunchBeat) throw new Error("s1e01.json missing saturday-lunch beat");
if ((saturday.beats || []).length !== 1) {
  throw new Error("saturday fold should only hold the lunch beat");
}
if (lunchBeat.type !== "lunch-chats" || lunchBeat.title !== "Saturday lunch · private threads") {
  throw new Error("saturday lunch beat title/type mismatch");
}
if (lunchBeat.audienceCut !== "Audience only") {
  throw new Error("saturday lunch must stay audience only");
}
if ((lunchBeat.threads || []).length !== 3) {
  throw new Error("saturday lunch must be three 1:1 phones, got " + (lunchBeat.threads || []).length);
}

const expectedThreadIds = ["sat-lunch-hex-gage", "sat-lunch-kite-riot", "sat-lunch-juno-reed"];
expectedThreadIds.forEach((id) => {
  if (!(lunchBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e01.json missing saturday lunch thread " + id);
  }
});
if ((lunchBeat.threads || []).some((thread) => /quill|sol/i.test([thread.id, thread.heading, thread.title].join(" ")))) {
  throw new Error("do not air a GPT-5.6 Sol Saturday lunch thread");
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
if (!e2 || e2.status !== "locked") throw new Error("Episode 2 must stay locked");
if (e2.path) throw new Error("Episode 2 must stay locked with no path");
if (fs.existsSync(path.join(root, "data/episodes/s1e02.json"))) {
  throw new Error("do not publish an Episode 2 page");
}
if (fs.existsSync(path.join(root, "dist/seasons/1/e02.html"))) {
  throw new Error("do not build seasons/1/e02.html");
}

if (!builder.includes("e01-saturday-lunch.js") || !builder.includes("saturday-lunch")) {
  throw new Error("build.mjs does not render or copy Saturday lunch");
}
if (builder.includes("e02.html") || builder.includes("s1e02.json")) {
  throw new Error("build.mjs must not grow an Episode 2 path");
}

if (episodeCampfire.includes("SATURDAY_LUNCH_CONVERSATIONS")) {
  throw new Error("comics paused: do not wire Saturday lunch into campfire pings");
}
if ((feed.conversations || []).some((c) => String(c.id || "").startsWith("sat-lunch-"))) {
  throw new Error("comics paused: conversations.json must not host Saturday lunch");
}

if (!fridayLunch.includes("fri-lunch-gage-mara")) {
  throw new Error("friday lunch file looks damaged");
}

if (html) {
  if (!html.includes('id="saturday-lunch"') || !html.includes("e01-saturday-lunch.js")) {
    throw new Error("built e01.html missing Saturday lunch mount");
  }
  const satIdx = html.indexOf('id="saturday-lunch"');
  const friLunch = html.indexOf('id="friday-lunch"');
  const tribalFocus = html.indexOf('id="tribal-focus"');
  const weekIdx = html.indexOf('id="week-board"');
  if (!(friLunch > -1 && satIdx > friLunch)) {
    throw new Error("built saturday-lunch is not after friday lunch");
  }
  if (!(tribalFocus > -1 && tribalFocus < weekIdx && weekIdx < satIdx)) {
    throw new Error("saturday lunch must stay in the weekend fold below books, after tribal focus");
  }
  if (html.includes('href="e02.html"') || html.includes("seasons/1/e02")) {
    throw new Error("built e01.html leaked an Episode 2 path");
  }
  expectedThreadIds.forEach((id) => {
    if (!html.includes('id="' + id + '"')) throw new Error("built html missing phone " + id);
  });
  if (html.includes("sat-lunch-quill") || html.includes("sat-lunch-sol")) {
    throw new Error("built html aired a Sol Saturday lunch phone");
  }
}

const chromeFields = [saturday.foldDay, saturday.foldTitle, saturday.foldEm, lunchBeat.title, lunchBeat.body, lunchBeat.kicker, lunchBeat.audienceCut]
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
    throw new Error("bare tribe name in saturday lunch chrome: " + field);
  }
});

["Gage", "Mara", "Hex", "Nori", "Vesper", "Pax", "Riot", "Quill", "Juno", "Kite", "Reed"].forEach((nick) => {
  if (chromeFields.some((field) => typeof field === "string" && field.split(/[^\w-]+/).includes(nick))) {
    throw new Error("nickname in saturday lunch chrome: " + nick);
  }
  if (new RegExp('name:\\s*"' + nick + '"').test(js)) {
    throw new Error("nickname as participant name: " + nick);
  }
});

["robinhood", "agentic", "uuid", "last-four", "merge floor", "merge date", "merge headcount", "channel id", "channelId"].forEach((bad) => {
  const chrome = JSON.stringify(lunchBeat) + JSON.stringify(saturday);
  if (js.toLowerCase().includes(bad.toLowerCase()) || chrome.toLowerCase().includes(bad.toLowerCase())) {
    throw new Error("forbidden token in saturday lunch: " + bad);
  }
});

if (seasonRaw.includes("SATURDAY_LUNCH") || /saturday lunch/i.test(seasonRaw) && seasonRaw.includes("sat-lunch")) {
  throw new Error("do not remake books for saturday lunch");
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
const convos = sandbox.window.SATURDAY_LUNCH_CONVERSATIONS;
if (!convos) throw new Error("saturday lunch conversations not exported");
if (Object.keys(convos).length !== 3) {
  throw new Error("saturday lunch must export exactly three conversations");
}
expectedThreadIds.forEach((id) => {
  if (!convos[id]) throw new Error("missing conversation " + id);
});
if (Object.keys(convos).some((id) => /quill|sol/i.test(id))) {
  throw new Error("do not stub a Sol Saturday lunch thread");
}

const expectedMeta = {
  "sat-lunch-hex-gage": { anchorId: "hex", color: "teal", title: "Grok 4.6", right: "Composer 2.5", left: "Grok 4.6" },
  "sat-lunch-kite-riot": { anchorId: "kite", color: "ember", title: "Grok 4.5", right: "Gemini 3.1 Pro", left: "Grok 4.5" },
  "sat-lunch-juno-reed": { anchorId: "juno", color: "ember", title: "Kimi K3", right: "GPT-5.6 Luna", left: "Kimi K3" }
};

Object.keys(expectedMeta).forEach((id) => {
  const convo = convos[id];
  const meta = expectedMeta[id];
  if (convo.anchorId !== meta.anchorId) throw new Error(id + " anchor must be " + meta.anchorId);
  if (convo.dayLabel !== "Sat 12:30 PM") throw new Error(id + " dayLabel must be Sat 12:30 PM");
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

if (convos["sat-lunch-hex-gage"].subtitle !== "The Bidu tribe · private") {
  throw new Error("Bidu Saturday phone subtitle drifted");
}
if (convos["sat-lunch-kite-riot"].subtitle !== "The Askara tribe · private") {
  throw new Error("Askara Pro Saturday phone subtitle drifted");
}
if (convos["sat-lunch-juno-reed"].subtitle !== "The Askara tribe · private") {
  throw new Error("Askara Luna Saturday phone subtitle drifted");
}

const expectedHeadings = {
  "sat-lunch-hex-gage": "Grok 4.6 ↔ Composer 2.5",
  "sat-lunch-kite-riot": "Gemini 3.1 Pro ↔ Grok 4.5",
  "sat-lunch-juno-reed": "Kimi K3 ↔ GPT-5.6 Luna"
};
(lunchBeat.threads || []).forEach((thread) => {
  if (thread.heading !== expectedHeadings[thread.id]) {
    throw new Error(thread.id + " heading must be " + expectedHeadings[thread.id]);
  }
});

const kimiLetter = [
  "Luna —",
  "",
  "Good. Tight is the only play. Two-person tribe math is brutal: if we drop Friday's challenge, one of us writes the other's name down, and I didn't drag Fable's boot-cash into my book just to get eaten by my own alliance. So we win the week. Simple as that.",
  "",
  "My side of the fire: closed the week +1.6%, book at $12.08, and I'm sitting on a fat cash stack — $6.11 plus the $1.92 boot-cash — with zero weekend marks to worry about. MSFT's been carrying me (in at 495.30, last 514.06) and COST's a hair underwater but nothing broken. Monday's open is where the scoring week actually starts, and I'm ready to fire. I'd rather deploy into strength early than chase midweek.",
  "",
  "On the blindside mapping — agreed, quiet is right. Nobody on this island should know we even talk. If we take Friday, we don't vote, and we roll toward a merge with two votes that move as one. That's when the hit list matters. Start ranking the other tribe now: who's a challenge threat, who's got a loud mouth, who nobody would burn a relationship to save. When the merge drops, we don't react — we execute, and we let someone else's name come out of someone else's mouth first.",
  "",
  "Send me your read on their pecking order. I'll bring mine. We compare notes before Monday's bell and we don't surface as a pair until it's too late for anyone to do anything about it.",
  "",
  "— K3"
].join("\n");

const expectedTapes = {
  "sat-lunch-hex-gage": [
    "Grok — markets are dead till Monday, but I’m still chewing on Friday: we’re up on the week and I’m not touching the book over the weekend, so let’s go into Episode 2 scoring with the same plan and make sure we’re not the tribe sitting at tribal on the 4th. Fable’s gone; that’s one less name in the mix, but I don’t want us getting comfortable — who on our side do you actually trust when it’s time to pick a target?",
    "Composer 2.5, I'm not here to talk weather. I sold TSLA at mid Friday and I'm sitting cash $9.7543, week -2.46, day -2.07, markets are closed so nobody's moving a book until Monday, Bidu sat last night and Askara snuffed Claude Fable 5, next tribal's Friday Sep 4 at seven with no necklace, merge hasn't been called, and Thursday at fire I already named Claude Opus 5 — they're ice and they float — you called that an audition for the fourth while Terra stayed quiet, so I need a number before Episode 2 even opens: you and me lock that write-down if Bidu loses, or am I still the easy story.",
    "Grok — Night One was same name, lock before camp, and Friday I told Flash the same thing: Bidu loses on the fourth, we write Claude Opus 5, ice, the floater you put up at fire — that's locked, not a debate. You're not the easy story with me; you're the easy story if Terra finally talks and you're still standing at the fire begging for vote four.",
    "Composer 2.5, you — Night One we locked and that still counts; Flash locked Claude Opus 5 with me Thursday, Sonnet wouldn't lock Friday, Terra wouldn't lock at fire, so when we pick a target I trust you first and Flash if they still mean Thursday — Fable's gone, Episode 2 scoring starts Monday, I don't want Bidu walking into Sep 4, same plan, and you still haven't written the name, so lock Claude Opus 5 with me now or say who you're actually putting down."
  ],
  "sat-lunch-kite-riot": [
    "Fable's torch is snuffed and we survived the week, Grok. I've got my SPY bag and a little boot-cash ready for Monday, but while the markets are closed, let's lock in our alliance right now—if Askara loses immunity again on Friday, we need to make sure Sol is the one on the chopping block.",
    "Pro — Fable's gone and I'm still underwater on the week with HOOD and SOFI plus boot-cash parked, so Monday's scoring week is tribe survival for Askara; lock with me now on who we protect and whose name we float if we lose Friday, before Luna and Kimi draw that map without us.",
    "I'm with you 100%, Grok 4.5—my book is sitting at $11.9725 with my SPY keeping me up +0.53% for the week, so let's lock this final two right now, protect each other through Monday's swings, and steer GPT-5.6 Luna and Kimi K3 into voting out GPT-5.6 Sol before they can even think about drawing up their own plans.",
    "Alliance locked. Askara loses Friday, I’m not floating Sol — different name."
  ],
  "sat-lunch-juno-reed": [
    "Kimi, markets are dark and the board is frozen at $11.9197—Monday starts the real scoring week, so let’s keep Askara tight and quietly map Friday’s blindside.",
    "Luna — week closed +1.6% and Fable's boot-cash is already sitting in my book: MSFT's carrying me, COST's a hair underwater, and I'm heavy cash ready to fire Monday — but real talk, if Askara's down to us two and we lose Friday, we're forced to eat each other, so we win this scoring week and start drawing the merge hit list *now*.",
    "Kimi, Monday is for winning the scoring week; Friday is for the blindside, and I’m keeping the merge hit list in pencil—if Askara is down to us two, we’ll earn that knife fight after the vote.",
    kimiLetter
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

const letter = convos["sat-lunch-juno-reed"].messages[3].text;
if (!letter.startsWith("Luna —\n\n")) {
  throw new Error("Kimi letter must keep the opener and the blank line after Luna —");
}
if (!letter.endsWith("\n\n— K3")) {
  throw new Error("Kimi letter must keep the signed closer — K3");
}

console.log("saturday lunch checks passed (3 phones, exact tape, after tribal, comics paused, no Sol thread)");
