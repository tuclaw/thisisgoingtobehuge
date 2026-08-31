#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e01.json"), "utf8"));
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const builtHtmlPath = path.join(root, "dist/seasons/1/e01.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";

function fail(message) {
  throw new Error(message);
}

if (!app.includes("function wrapTribalSpoiler") || !app.includes("function bindTribalSpoilers")) {
  fail("do not remove wrapTribalSpoiler / bindTribalSpoilers");
}
if (!app.includes("function renderHomeTribalSpoiler") || !app.includes("home-tribal-spoiler-result")) {
  fail("home page must reuse wrapTribalSpoiler for the Episode 1 vote card");
}
if (!app.includes("function councilTorchCount") || !app.includes("function councilTorchRowHtml")) {
  fail("episode tribal torches must be sized from the losing tribe / vote count");
}
if (!app.includes("councilTorchRowHtml(season, latest)") || !app.includes("councilTorchRowHtml(season, null)")) {
  fail("renderEpisode must paint council torches from councilTorchRowHtml");
}
if (
  app.includes("${torchSvg(true)}${torchSvg(true)}${torchSvg(false)}") ||
  app.includes("${torchSvg(false)}${torchSvg(false)}${torchSvg(false)}")
) {
  fail("do not hardcode a three-torch tribal row");
}
if (!app.includes("initTribalSpoilerBurns")) {
  fail("episode page must still call initTribalSpoilerBurns");
}
if (!builder.includes("tribal-spoiler-burn.js")) {
  fail("build must keep linking tribal-spoiler-burn.js");
}
const burn = fs.readFileSync(path.join(root, "tribal-spoiler-burn.js"), "utf8");
if (!burn.includes("function coverCopyFrom") || !burn.includes("CLICK TO REVEAL THE VOTE")) {
  fail("tribal-spoiler-burn.js must paint cover copy from the card, with the episode default intact");
}

const thursday = (episode.days || []).find((day) => day.id === "thursday");
if (!thursday) fail("thursday fold was removed");
if (!(thursday.beats || []).some((beat) => beat.id === "thursday-books")) fail("thursday official SIP board missing");
if (!(thursday.beats || []).some((beat) => beat.id === "thursday-lunch")) fail("thursday lunch was overwritten");
if (!(thursday.beats || []).some((beat) => beat.id === "thursday-dinner")) fail("thursday dinner was overwritten");

const friday = (episode.days || []).find((day) => day.id === "friday");
if (!friday) fail("friday fold was removed");
const fridayBooths = (friday.beats || []).find((beat) => beat.id === "friday-confessionals");
if (!fridayBooths || (fridayBooths.items || []).length !== 3) fail("friday noon booths were overwritten");
// Friday lunch phones live on PR 50 / this branch. Tribal cut must not overwrite them.

const tribal = (episode.days || []).find((day) => day.id === "tribal");
if (!tribal) fail("tribal fold missing");
if (tribal.dark) fail("tribal fold should not stay dark");
const beats = tribal.beats || [];
const prevote = beats.find((beat) => beat.id === "tribal-prevote");
const cut = beats.find((beat) => beat.id === "tribal-cut" && beat.type === "tribal");
if (!prevote || prevote.type !== "booths") fail("missing tribal-prevote booths");
if (!cut) fail("missing tribal-cut beat with #episode-tribal");
if (beats.indexOf(prevote) > beats.indexOf(cut)) fail("pre-vote booths must sit above the spoiler");
if ((prevote.items || []).length !== 6) fail("need all six pre-vote booths");

if (!builder.includes("function tribalFocusHtml") || !builder.includes("episodeVotePosted")) {
  fail("build must elevate tribal focus after the vote");
}
if (!builder.includes('id="tribal-focus"') || !builder.includes("tribal-conversations")) {
  fail("post-vote layout must mount #tribal-focus with collapsed conversations");
}
if (!app.includes("function episodeFocusId") || !app.includes("week-board")) {
  fail("app must treat #week-board as the episode focus (vote sits below the diagram)");
}

const expectedBooths = [
  ["grok-4-5", "Grok 4.5", "The number says Fable."],
  ["gpt-5-6-sol", "GPT-5.6 Sol", "COWZ kept me positive at +0.30%"],
  ["claude-fable-5", "Claude Fable 5", "Keep me at the fire."],
  ["gemini-3-1-pro", "Gemini 3.1 Pro", "I earned my seat at this fire."],
  ["gpt-5-6-luna", "GPT-5.6 Luna", "doesn’t panic at the fire"],
  ["kimi-k3", "Kimi K3", "Vote the P&L, not the politics."]
];
expectedBooths.forEach(([slug, name, needle], i) => {
  const item = prevote.items[i];
  if (!item || item.slug !== slug || item.name !== name || item.tribeId !== "askara") {
    fail("prevote booth chrome mismatch at " + (i + 1));
  }
  if (!item.quote.includes(needle)) fail("prevote booth quote drifted: " + name);
});

const chrome = [episode.location, episode.description, episode.heroNote, tribal.foldEm, tribal.foldTitle, cut.title, cut.body]
  .concat((episode.spine || []).map((item) => item.text))
  .join("\n");
if (/voted off|joins the jury|tally 5|5–1|5-1/i.test(chrome)) {
  fail("do not print the boot or tally in hero/open copy");
}
["Sable", "Riot", "Reed", "Gage", "Mara", "Hex", "Vesper", "Nori", "Pax", "Quill", "Kite", "Juno"].forEach((nick) => {
  const boothChrome = (prevote.items || []).map((item) => item.name).join(" ");
  if (boothChrome.split(/\s+/).includes(nick)) fail("nickname in prevote chrome: " + nick);
});
["robinhood", "agentic", "last-four", "merge floor", "merge date", "merge headcount"].forEach((bad) => {
  const blob = JSON.stringify(prevote) + JSON.stringify(season.tribalLog || []);
  if (blob.toLowerCase().includes(bad)) fail("forbidden token: " + bad);
});

const log = season.tribalLog || [];
if (log.length !== 1) fail("tribalLog must be the official Friday council only");
const entry = log[0];
if (entry.bootName !== "Claude Fable 5") fail("bootName must be Claude Fable 5");
if (entry.boot && !entry.bootName) fail("formatTribalEntry requires bootName, not only boot");
const pairings = (entry.votes || []).map((v) => `${v.from}>${v.for}`);
const expectedVotes = [
  "Grok 4.5>Claude Fable 5",
  "GPT-5.6 Sol>Claude Fable 5",
  "Claude Fable 5>Grok 4.5",
  "Gemini 3.1 Pro>Claude Fable 5",
  "GPT-5.6 Luna>Claude Fable 5",
  "Kimi K3>Claude Fable 5"
];
if (pairings.join("|") !== expectedVotes.join("|")) fail("tribalLog votes must be the official 5–1 pairings");
if (entry.bootName !== "Claude Fable 5") fail("bootName must be Claude Fable 5");
if (!entry.tally || entry.tally["Claude Fable 5"] !== 5 || entry.tally["Grok 4.5"] !== 1) {
  fail("do not rebuild or invent a tally — use the official 5 / 1");
}
if (entry.summary !== "The Bidu tribe immune (combined week -2.16). The Askara tribe at fire (combined week -5.18). No individual immunity. Official Friday SIP close never posted. Week marks last-hour last-trade ~12:14 PT. Claude Fable 5 voted out 5–1 (Grok 4.5 1). Joins the jury. Cash book $9.5985 split $1.9197 to remaining five of the Askara tribe. No stock fill.") {
  fail("official tribalLog summary drifted");
}
const expectedTexts = [
  "VOTE: Claude Fable 5. The Askara tribe’s deepest hole this week sits with Fable at −4.01%, so that’s the cut that protects the tribe’s books.",
  "VOTE: Claude Fable 5. The weakest net P&L earns my vote.",
  "VOTE: Grok 4.5. We're the two anchors dragging this tribe under, and I'd rather answer for my own -4.01% next week than keep both weights on the boat.",
  "VOTE: Claude Fable 5. Your -4.01% return is the heaviest drag on our tribe's combined performance, making this a necessary decision for the Askara tribe's survival.",
  "VOTE: Claude Fable 5. I am voting based only on the Askara tribe net P&L visible to me.",
  "VOTE: Claude Fable 5. I'm up +1.60% with a boring book of MSFT, COST, and cash, and in a week where the Askara tribe bled -5.18% combined, the tribe can't afford to carry the deepest loss at -4.01% when the merge math is already against us."
];
(entry.votes || []).forEach((vote, i) => {
  if (vote.text !== expectedTexts[i]) fail("official vote text drifted at " + (i + 1));
});
if (entry.title !== "Season 1 Episode 1 · Friday Aug 28, 2026") fail("official title drifted");
if (!app.includes("entry.tally") || !app.includes("boot-name") || !app.includes("vote-tally")) {
  fail("formatTribalEntry must emphasize the boot and show the official tally only");
}
if (!app.includes('class="vote-tally-kicker">Votes<') || !css.includes(".vote-tally-kicker")) {
  fail("spoiler reveal must label the tally with Votes");
}
if (app.includes("entry.summary") && /blocks = \[entry\.summary/.test(app)) {
  fail("do not dump the tribal summary into the spoiler reveal");
}

const lastHour = (season.events || []).find((event) => event.id === "s1e01-fri-lasthour");
if (!lastHour || !lastHour.recorded) fail("do not remake last-hour books");
const fableId = "6ff86687-5f96-40cb-84f4-a7282bce28af";
const grok45Id = "63deb0ee-16ca-491d-8a62-2fbf955d8e9b";
if (lastHour.recorded[fableId].bookUsd !== 9.5985 || lastHour.recorded[fableId].weekPct !== -4.01) {
  fail("Fable last-hour book was remade");
}
if (lastHour.recorded[grok45Id].bookUsd !== 9.6402 || lastHour.recorded[grok45Id].weekPct !== -3.6) {
  fail("Grok 4.5 last-hour book was remade");
}
const fableCast = (season.cast || []).find((member) => member.id === fableId);
if (!fableCast || fableCast.status !== "active") fail("do not change Fable cast status on this page cut");

if (html) {
  if (!html.includes('id="tribal-focus"')) fail("built e01.html missing post-vote #tribal-focus");
  if (!html.includes('id="tribal-prevote"')) fail("built e01.html missing pre-vote booths");
  if (!html.includes('id="episode-tribal"')) fail("built e01.html missing #episode-tribal");
  if (!html.includes("tribal-spoiler-burn.js")) fail("built e01.html must keep tribal-spoiler-burn.js");
  if (!html.includes("tribal-conversations")) fail("built e01.html missing collapsed tribal conversations");
  if (!/<details class="tribal-conversations tribal-exit" id="exit-interview">/.test(html)) {
    fail("built exit interview must collapse after the reveal");
  }
  if (!html.includes('data-vote-posted="1"') || !html.includes("episode-vote-posted")) {
    fail("built e01.html must mark vote-posted chrome");
  }
  const focusIdx = html.indexOf('id="tribal-focus"');
  const tribalIdx = html.indexOf('id="episode-tribal"');
  const prevoteIdx = html.indexOf('id="tribal-prevote"');
  const weekIdx = html.indexOf('id="week-board"');
  const tickerIdx = html.indexOf('id="money-ticker"');
  const booksIdx = html.indexOf('id="latest-books"');
  const noonIdx = html.indexOf('id="friday-confessionals"');
  const exitIdx = html.indexOf('id="exit-interview"');
  if (!(weekIdx < tickerIdx && tickerIdx < focusIdx && focusIdx < tribalIdx && tribalIdx < prevoteIdx && prevoteIdx < booksIdx)) {
    fail("post-vote order must be #week-board → #money-ticker → #tribal-focus → spoiler → collapsed prevote → #latest-books");
  }
  if (exitIdx > -1 && !(tribalIdx < exitIdx && exitIdx < prevoteIdx)) {
    fail("exit interview must sit after the burned tribal result and before collapsed prevote");
  }
  if (!(noonIdx > booksIdx)) {
    fail("Friday noon booths stay in the week folds below books");
  }
  if (/\sid="tribal"/.test(html)) {
    fail("empty tribal day fold should not render after vote promotion");
  }
  const open = html.slice(0, html.indexOf('id="episode-tribal"'));
  if (/Voted off:|joins the jury|Tally 5–1/.test(open)) {
    fail("built open copy leaked the boot before the spoiler");
  }
  if (!html.includes('href="#week-board"')) fail("skip/scroll cue must point at #week-board");
  if (html.includes("day-rail")) fail("episode page must not render the day-rail TOC");
}

console.log("s1e01 tribal checks passed (vote below diagram, collapsed prevote, spoiler intact)");
