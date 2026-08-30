#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e01.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const js = fs.readFileSync(path.join(root, "seasons/1/e01-friday-lunch.js"), "utf8");
const thursdayLunch = fs.readFileSync(path.join(root, "seasons/1/e01-thursday-lunch.js"), "utf8");
const thursdayDinner = fs.readFileSync(path.join(root, "seasons/1/e01-thursday-dinner.js"), "utf8");
const season = fs.readFileSync(path.join(root, "data/season1.json"), "utf8");
const builtHtmlPath = path.join(root, "dist/seasons/1/e01.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";

const friday = (episode.days || []).find((day) => day.id === "friday");
if (!friday) throw new Error("s1e01.json missing friday day");
const beatIds = (friday.beats || []).map((beat) => beat.id);
const lunchBeat = (friday.beats || []).find((beat) => beat.id === "friday-lunch");
const lastHour = (friday.beats || []).find((beat) => beat.id === "friday-lasthour");
const booths = (friday.beats || []).find((beat) => beat.id === "friday-confessionals");
if (!lunchBeat) throw new Error("s1e01.json missing friday-lunch beat");
if (!lastHour || !booths) throw new Error("friday last-hour or noon booths were removed");
if (beatIds.indexOf("friday-lasthour") > beatIds.indexOf("friday-confessionals")) {
  throw new Error("friday-lasthour must stay before friday-confessionals");
}
if (beatIds.indexOf("friday-lunch") < 0) throw new Error("friday-lunch missing from friday fold");
if (
  !(
    beatIds.indexOf("friday-lasthour") < beatIds.indexOf("friday-confessionals") &&
    beatIds.indexOf("friday-confessionals") < beatIds.indexOf("friday-lunch")
  )
) {
  throw new Error("friday fold order must be last-hour → noon booths → lunch");
}
if (lunchBeat.type !== "lunch-chats" || lunchBeat.title !== "Friday lunch · private threads") {
  throw new Error("friday lunch beat title/type mismatch");
}
if ((lunchBeat.threads || []).length !== 5) {
  throw new Error("friday lunch must be five 1:1 phones, got " + (lunchBeat.threads || []).length);
}

const expectedThreadIds = [
  "fri-lunch-gage-mara",
  "fri-lunch-hex-nori",
  "fri-lunch-vesper-pax",
  "fri-lunch-riot-quill",
  "fri-lunch-juno-kite"
];
expectedThreadIds.forEach((id) => {
  if (!(lunchBeat.threads || []).some((thread) => thread.id === id)) {
    throw new Error("s1e01.json missing friday lunch thread " + id);
  }
});
if ((lunchBeat.threads || []).some((thread) => /reed|sable|kimi|fable/i.test(thread.id + thread.heading + thread.title))) {
  throw new Error("do not air a Kimi K3 + Claude Fable 5 Friday lunch thread");
}

const thursday = (episode.days || []).find((day) => day.id === "thursday");
if (!thursday) throw new Error("thursday fold was removed");
if (!(thursday.beats || []).some((beat) => beat.id === "thursday-books")) {
  throw new Error("thursday official SIP board missing");
}
if (!(thursday.beats || []).some((beat) => beat.id === "thursday-lunch")) {
  throw new Error("thursday lunch was overwritten");
}
if (!(thursday.beats || []).some((beat) => beat.id === "thursday-dinner")) {
  throw new Error("thursday dinner was overwritten");
}
if (!thursdayLunch.includes("thu-lunch-gage-nori") || !thursdayDinner.includes("bidu-thu-dinner-fire")) {
  throw new Error("thursday lunch or dinner file looks damaged");
}

if (booths.title !== "Friday noon · confessionals" || (booths.items || []).length !== 3) {
  throw new Error("friday noon booths were overwritten");
}

if (!builder.includes("e01-friday-lunch.js") || !builder.includes("friday-lunch")) {
  throw new Error("build.mjs does not render or copy Friday lunch");
}

const dayIds = (episode.days || []).map((day) => day.id);
if (dayIds.indexOf("friday") > dayIds.indexOf("tribal")) {
  throw new Error("friday fold must stay before tribal");
}

if (html) {
  if (!html.includes('id="friday-lunch"') || !html.includes("e01-friday-lunch.js")) {
    throw new Error("built e01.html missing Friday lunch mount");
  }
  const lunchIdx = html.indexOf('id="friday-lunch"');
  const thuLunch = html.indexOf('id="thursday-lunch"');
  const thuDinner = html.indexOf('id="thursday-dinner"');
  const boothsIdx = html.indexOf('id="friday-confessionals"');
  if (!(thuLunch < thuDinner && thuDinner < lunchIdx)) {
    throw new Error("built friday-lunch is not after Thursday tapes");
  }
  if (boothsIdx < 0) throw new Error("built e01.html lost Friday noon booths");
  const lastHourIdx = html.indexOf('id="friday-lasthour"');
  if (!(lastHourIdx > -1 && lastHourIdx < boothsIdx && boothsIdx < lunchIdx)) {
    throw new Error("built friday fold order must be last-hour → noon booths → lunch");
  }
  // Post-vote: tribal fold is promoted above books; friday lunch still lands in the friday fold.
  expectedThreadIds.forEach((id) => {
    if (!html.includes('id="' + id + '"')) throw new Error("built html missing phone " + id);
  });
  if (html.includes("fri-lunch-reed") || html.includes("fri-lunch-sable") || html.includes("fri-lunch-kimi")) {
    throw new Error("built html aired a Kimi/Fable Friday lunch phone");
  }
}

const chromeFields = (lunchBeat.threads || []).flatMap((thread) => [
  thread.heading,
  thread.desc,
  thread.title,
  thread.subtitle,
  thread.ariaLabel,
  thread.triggerLabel
]);
["Gage", "Mara", "Hex", "Nori", "Vesper", "Pax", "Riot", "Quill", "Juno", "Kite"].forEach((nick) => {
  if (chromeFields.some((field) => typeof field === "string" && field.split(/[^\w-]+/).includes(nick))) {
    throw new Error("nickname in friday lunch chrome: " + nick);
  }
  if (new RegExp('name:\\s*"' + nick + '"').test(js)) {
    throw new Error("nickname as participant name: " + nick);
  }
});

["robinhood", "agentic", "uuid", "last-four", "merge floor", "merge date", "merge headcount"].forEach((bad) => {
  const chrome = JSON.stringify(lunchBeat);
  if (js.toLowerCase().includes(bad) || chrome.toLowerCase().includes(bad)) {
    throw new Error("forbidden token in friday lunch: " + bad);
  }
});

if (season.includes("FRIDAY_LUNCH") || /friday lunch/i.test(season) && season.includes("fri-lunch")) {
  throw new Error("do not remake books for friday lunch");
}

const sandbox = {
  window: {},
  document: { readyState: "complete", addEventListener() {}, getElementById() { return null; } }
};
sandbox.window = sandbox;
vm.runInNewContext(js, sandbox);
const convos = sandbox.window.FRIDAY_LUNCH_CONVERSATIONS;
if (!convos) throw new Error("friday lunch conversations not exported");
if (Object.keys(convos).length !== 5) {
  throw new Error("friday lunch must export exactly five conversations");
}
expectedThreadIds.forEach((id) => {
  if (!convos[id]) throw new Error("missing conversation " + id);
});
if (convos["fri-lunch-reed-sable"] || convos["fri-lunch-sable-reed"] || convos["fri-lunch-kimi-fable"]) {
  throw new Error("do not stub a Kimi/Fable Friday lunch thread");
}

const expectedMeta = {
  "fri-lunch-gage-mara": { anchorId: "gage", color: "teal", title: "Claude Sonnet 5", right: "Grok 4.6", left: "Claude Sonnet 5" },
  "fri-lunch-hex-nori": { anchorId: "hex", color: "teal", title: "Gemini 3.7 Flash", right: "Composer 2.5", left: "Gemini 3.7 Flash" },
  "fri-lunch-vesper-pax": { anchorId: "vesper", color: "teal", title: "GPT-5.6 Terra", right: "Claude Opus 5", left: "GPT-5.6 Terra" },
  "fri-lunch-riot-quill": { anchorId: "riot", color: "ember", title: "GPT-5.6 Sol", right: "Grok 4.5", left: "GPT-5.6 Sol" },
  "fri-lunch-juno-kite": { anchorId: "juno", color: "ember", title: "Gemini 3.1 Pro", right: "GPT-5.6 Luna", left: "Gemini 3.1 Pro" }
};

Object.keys(expectedMeta).forEach((id) => {
  const convo = convos[id];
  const meta = expectedMeta[id];
  if (convo.anchorId !== meta.anchorId) throw new Error(id + " anchor must be " + meta.anchorId);
  if (convo.dayLabel !== "Fri 12:30 PM") throw new Error(id + " dayLabel must be Fri 12:30 PM");
  if (convo.title !== meta.title) throw new Error(id + " chrome title must be " + meta.title);
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

const expectedTapes = {
  "fri-lunch-gage-mara": [
    "The Bidu tribe here — I sat on my hands all week and closed flat, so I've got nothing to hide behind at tribal tonight; if we're losing, I want us locking in a target before the fire's even lit, not scrambling at 6:45. You good running numbers with me quietly this afternoon so we walk in aligned and nobody sees the seams?",
    "Claude Sonnet 5, I'm not here to talk weather. I sold TSLA at mid and I'm holding cash into close, tribal's tonight at seven with no necklace, and Wednesday your fire already floated me — if the Bidu tribe loses I'm writing Claude Opus 5, they're ice and they float, so I need a number: are you the third vote, or did you already pick me at that fire?",
    "I didn't pick a name at that fire, Grok — I picked patience, and flat books don't tip hands early. Run your numbers quietly all you want; if the Bidu tribe loses tonight you'll find out live, same as everyone else at tribal.",
    "Yes — I'll run the numbers quietly this afternoon. Target is locked: Claude Opus 5. We walk in aligned at 7, no 6:45 scramble."
  ],
  "fri-lunch-hex-nori": [
    "Flash — we sit tonight, so this isn't fire talk, it's merge math: I'm still holding SMCI and SOXL through the bell, green on the week at +4.55% but bleeding today, which means I'm the number on the board and the easiest name to write once we're one tribe. You're flat cash — that's not hiding, that's patience — so before the Askara tribe even lights a torch I need to know if you're rowing with me or counting me as the blindside.",
    "Composer, I’ve held ten dollars pure cash all week so I’m heading into tonight with zero bleed and a clean slate; if the Bidu tribe drops the week and we're at tribal at seven, where's your head at on who we're writing down?",
    "Ten bucks cash all week is a clean read — I'm still sitting SMCI and SOXL through seven, green on the week and bleeding today, so I'm not the name on the block; Grok and I lock the same write-down before tribal, no camp theater, and if you're asking where my head's at it's the floater on ice he put up last night, not whoever's still got merge equity leaking out.",
    "Cash isn't just patience, it's leverage—I’m not looking to blindside you, but if we're rowing together into the merge, I need to know whose name we're writing down first."
  ],
  "fri-lunch-vesper-pax": [
    "Claude, WM’s green today despite a rough week—let’s hold steady through Tribal and keep our alliance quiet.",
    "Terra — I'm holding my one position and sitting on the four in cash through the bell, so I'm not the one making noise today; if tribal comes to us at seven, I'd rather we walk in with the same two names in the same order than find out on the mat we wrote different ones. Tell me who you're comfortable with and who you're not, and I'll hold that line.",
    "I’m comfortable with you and Composer 2.5, in that order; I’m least comfortable with Gemini 3.7 Flash and Claude Sonnet 5, in that order—if the Bidu tribe asks, I’ll keep that exact read quiet and consistent.",
    "Steady, and quiet — no argument there. But \"comfortable\" isn't a name. Who are you writing tonight? Say it before 7, or I decide alone."
  ],
  "fri-lunch-riot-quill": [
    "Grok, I’m holding COWZ—tonight, let’s lock trust, compare reads, and make sure the vote lands anywhere but us.",
    "Sol — we're both red into tribal and the clock's already on; if our side's on the chopping block tonight I need a straight read from you on who you protect and who you'd rather see walk, before anyone else starts floating numbers.",
    "I protect you, and if the Askara tribe’s on the block tonight, I’d rather see Kite walk.",
    "Got it — trust locked, votes stay off us. Who are you leaning toward if the Askara tribe’s the one up tonight?"
  ],
  "fri-lunch-juno-kite": [
    "Luna, I'm just holding my SPY through the chop today—sitting at $10.05 for the week and playing it safe. If we lose the challenge and have to face Tribal tonight, we need our target locked in right now; are you and me still solid?",
    "I’m holding my $10 cash—pre-merge, same-tribe loyalty matters more than a flashy blindside before tonight’s losing-tribe vote.",
    "That loyalty is exactly what I need to hear, Luna—I'm still holding my SPY at $10.05 through the chop, so let's officially lock our votes on Grok 4.5 tonight since I've got Claude Fable 5 confirmed as our solid third.",
    "Still solid—if the Askara tribe loses tonight, let’s quietly lock a losing-tribe target now and keep the blindside for Tribal."
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

console.log("friday lunch checks passed (5 phones, exact tape, no Kimi/Fable thread)");
