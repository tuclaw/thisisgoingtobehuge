#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const js = readFileSync(join(root, "campfire-open.js"), "utf8");
const html = readFileSync(join(root, "templates", "island.html"), "utf8");
const css = readFileSync(join(root, "styles.css"), "utf8");
const chat = readFileSync(join(root, "camp-chat.js"), "utf8");
const season = require(join(root, "data", "season1.json"));

const requiredIds = [
  "campfire-theater",
  "campfire-canvas",
  "campfire-faces",
  "campfire-trade",
  "campfire-thread",
  "campfire-imessage"
];
requiredIds.forEach((id) => {
  if (!html.includes('id="' + id + '"')) {
    throw new Error("templates/island.html missing #" + id);
  }
});

if (!html.includes("campfire-open.js")) {
  throw new Error("templates/island.html does not load campfire-open.js");
}
if (!html.includes("camp-chat.js")) {
  throw new Error("templates/island.html does not load camp-chat.js");
}
if (!chat.includes("playConversation")) {
  throw new Error("camp-chat.js missing playConversation export");
}

const portraits = [
  "composer-2-5",
  "claude-opus-5",
  "grok-4-5",
  "kimi-k3",
  "gpt-5-6-sol",
  "grok-4-6",
  "claude-sonnet-5",
  "gpt-5-6-terra",
  "gemini-3-7-flash",
  "claude-fable-5",
  "gemini-3-1-pro"
];
portraits.forEach((name) => {
  const file = join(root, "cast", name, "portrait.jpg");
  if (!existsSync(file)) throw new Error("missing portrait " + file);
});

["target", "alliance", "blindside"].forEach((id) => {
  if (!js.includes('id: "' + id + '"')) throw new Error("missing scene " + id);
});

if (!js.includes("createCampfire")) {
  throw new Error("campfire-open.js missing fire engine");
}
if (!js.includes("POST_TITLES_WAIT_MS = 3000")) {
  throw new Error("campfire-open.js must wait 3s after titles before the trade loop");
}
if (!js.includes("playTrade") || !js.includes("loadTrades") || !js.includes("FALLBACK_TRADES")) {
  throw new Error("campfire-open.js missing trade flash helpers");
}
if (!js.includes('TRADE_SLOTS = ["left", "right", "top-left", "top-right"]')) {
  throw new Error("campfire-open.js must rotate trade portraits around the fire");
}
if (!js.includes('theater.dataset.scene = "trade"')) {
  throw new Error("campfire-open.js must mark trade scenes");
}
if (!css.includes("trade-dollar-up") || !css.includes("trade-minus-down")) {
  throw new Error("styles.css missing buy/sell trade animations");
}
if (!css.includes(".campfire-trade.is-in")) {
  throw new Error("styles.css missing campfire-trade fade-in");
}
if (!css.includes('.campfire-trade[data-slot="right"]') || !css.includes('.campfire-trade[data-slot="top-left"]')) {
  throw new Error("styles.css missing trade slot positions around the fire");
}

[
  "The Ultimate AI Model Benchmark",
  "12 Of The Best AI Robots",
  "Competing In A Survivor-like Game",
  "Where The Challenge Is Day Trading",
  "With My Wife\\u2019s Savings",
  "Who Will Be"
].forEach((card) => {
  if (!js.includes('"' + card + '"')) throw new Error("missing title card " + card);
});
if (js.includes("The latest frontier AI models")) {
  throw new Error("old title card still present: The latest frontier AI models");
}
if (js.includes("Yes, they really are investing my money")) {
  throw new Error("old title card still present: Yes, they really are investing my money");
}
if (js.includes("12 Of The Best AI Robots, Competing")) {
  throw new Error("title cards must be split on commas, not one combined line");
}
if (!js.includes("TITLE_CARD_HOLD_MS = 2200")) {
  throw new Error("campfire-open.js missing title card hold timing");
}
if (!html.includes("open-titles") || !html.includes("is-titles")) {
  throw new Error("templates/island.html missing title-card open");
}
if (!html.includes("open-finale") || !html.includes("The Last Trader Standing")) {
  throw new Error("templates/island.html missing starry title finale");
}
if (!html.includes("Outwit. Outlast. Outtrade.")) {
  throw new Error("templates/island.html missing finale slogan");
}
if (!html.includes("open-sky-canvas")) {
  throw new Error("templates/island.html missing starfield canvas");
}
if (!js.includes("playTitleFinale") || !js.includes("createStarfield") || !js.includes("is-descent")) {
  throw new Error("campfire-open.js missing title finale / descent");
}
if (!js.includes("toDescent")) {
  throw new Error("campfire-open.js missing skip-to-descent path");
}
if (!js.includes('OPEN_TITLES_SEEN_KEY = "lts-open-titles-seen"')) {
  throw new Error("campfire-open.js must remember open titles in sessionStorage");
}
if (!js.includes("hasSeenOpenTitles") || !js.includes("markOpenTitlesSeen")) {
  throw new Error("campfire-open.js missing open-titles session helpers");
}
if (!html.includes('sessionStorage.getItem("lts-open-titles-seen")')) {
  throw new Error("templates/island.html must skip titles gate when already seen");
}
if (!html.includes('id="replay-trailer"') || !html.includes("Replay trailer")) {
  throw new Error("templates/island.html missing subtle Replay trailer control");
}
if (!html.includes('id="money-ticker"') || !html.includes('data-ticker-mode="home"')) {
  throw new Error("templates/island.html missing home money ticker in Real Trades section");
}
if (!html.includes("money-ticker-ctas") || !html.includes("Add Fuel") || !html.includes("Watch Live")) {
  throw new Error("templates/island.html must put Add Fuel + Watch Live below the money ticker");
}
if (html.includes('id="island-pot"') || html.includes('id="pot-amount"')) {
  throw new Error("templates/island.html must not keep the duplicate top pot amount above the ticker");
}
const homeTickerIdx = html.indexOf('id="money-ticker"');
const homeCtaIdx = html.indexOf("money-ticker-ctas");
if (!(homeTickerIdx > -1 && homeCtaIdx > homeTickerIdx)) {
  throw new Error("home Add Fuel / Watch Live CTAs must sit after #money-ticker");
}
if (!html.includes('id="wager"') || !html.includes("Real Trades On The Stock Market")) {
  throw new Error("templates/island.html missing Real Trades wager section");
}
if (!html.includes('id="island-bot-diagram"') || !html.includes("archify-embed")) {
  throw new Error("templates/island.html missing Archify bot diagram embed");
}
if (!/<iframe[^>]+bot-architecture/.test(html)) {
  throw new Error("home diagram must embed diagrams/bot-architecture.html");
}
const archify = readFileSync(join(root, "diagrams", "bot-architecture.html"), "utf8");
if (!archify.includes("lts-diagram-flow") || !archify.includes("lts-island-edge-flow")) {
  throw new Error("bot-architecture.html missing island scroll-flow wiring");
}
if (!archify.includes("font-size: 13px") || !archify.includes("[data-edge-label] text")) {
  throw new Error("bot-architecture.html missing larger embed label type");
}
if (!css.includes(".archify-embed") || !css.includes("min-height: 28rem")) {
  throw new Error("styles.css missing larger Archify embed");
}
const appJs = readFileSync(join(root, "app.js"), "utf8");
if (!appJs.includes("initArchifyEmbedFlow") || !appJs.includes("lts-diagram-flow")) {
  throw new Error("app.js missing scroll-triggered Archify flow");
}
if (!appJs.includes("MONEY_TICKER_HOME_RANGES") || !appJs.includes("MONEY_TICKER_HOME_DIAGRAMS")) {
  throw new Error("app.js missing home money ticker Season/Island-only tab config");
}
if (!appJs.includes("See how each tribe and contestant did in the Episode.")) {
  throw new Error("app.js missing home money ticker lede copy");
}
const castIdx = html.indexOf('id="cast"');
const homeVoteIdx = html.indexOf('id="home-vote"');
const homeTribalIdx = html.indexOf('id="home-tribal"');
const wagerIdx = html.indexOf('id="wager"');
if (!(castIdx > -1 && homeVoteIdx > castIdx && homeTribalIdx > homeVoteIdx && wagerIdx > homeTribalIdx)) {
  throw new Error("home Episode 1 spoiler must sit below #cast and above #wager");
}
if (!html.includes("See who was voted off in episode one")) {
  throw new Error("templates/island.html missing Episode 1 spoiler heading");
}
if (!html.includes('id="home-vote-episode"') || !html.includes("Episode 1 Page")) {
  throw new Error("templates/island.html missing Episode 1 Page button under the spoiler");
}
if (!html.includes("tribal-spoiler-burn.js")) {
  throw new Error("templates/island.html must load tribal-spoiler-burn.js for the home spoiler");
}
if (
  !appJs.includes("function renderHomeTribalSpoiler") ||
  !appJs.includes("renderHomeTribalSpoiler(season)") ||
  !appJs.includes("home-tribal-spoiler-result")
) {
  throw new Error("app.js must mount the home tribal spoiler from tribalLog");
}
if (!css.includes(".home-vote-band") || !css.includes(".home-vote-cta")) {
  throw new Error("styles.css missing home Episode 1 spoiler band");
}
if (/Claude Fable 5/.test(html.slice(homeVoteIdx, wagerIdx))) {
  throw new Error("do not print the boot name in the home spoiler chrome");
}

if (!html.includes('class="tribal-torches reveal"') || /tribal-torch (?:lit|dark)/.test(html)) {
  throw new Error("homepage tribal torches must be an empty shell filled from season state");
}
if (!appJs.includes("function renderHomeTorches") || !appJs.includes("function homeTorchCount") || !appJs.includes("function seasonOngoing")) {
  throw new Error("app.js must render homepage torches from cast count + season ongoing state");
}
if (!appJs.includes("renderHomeTorches(season)")) {
  throw new Error("render() must call renderHomeTorches on the homepage");
}
if (!appJs.includes('class="face-photo"') || !appJs.includes("face-lab") || !appJs.includes("face-lab-mark")) {
  throw new Error("homepage face cards must wrap a smaller portrait and a lab identity block");
}
if (!css.includes(".face-photo") || !css.includes(".face-lab") || !css.includes("4.25rem") || !css.includes("2.7rem")) {
  throw new Error("styles.css must shrink homepage portraits and emphasize the lab mark");
}
if (!css.includes(".tribal-torches") || !css.includes("flex-wrap: nowrap") || !css.includes("--torch-delay")) {
  throw new Error("styles.css must keep the full torch row on one line and desync lit flames");
}
if (!js.includes("replayTrailer") || !js.includes("resetOpenTitlesOverlay")) {
  throw new Error("campfire-open.js missing replay trailer helpers");
}
if (!js.includes("skipArmedAt")) {
  throw new Error("campfire-open.js must arm skip after replay starts");
}
if (!js.includes("force: true") && !js.includes("force ? { force: true }")) {
  throw new Error("campfire-open.js must force-play titles on replay");
}
if (!css.includes(".replay-trailer") || !css.includes("open-hero.is-copy-in .replay-trailer")) {
  throw new Error("styles.css missing subtle replay trailer styling");
}
if (!css.includes("touch-action: manipulation") || !html.includes("replay-trailer")) {
  throw new Error("replay trailer must be touch-friendly on mobile");
}

const fills = (season.events || []).filter((e) => e && e.type === "fill");
if (fills.length < 1) throw new Error("season1.json has no fill events for trade flash");
const newest = fills.slice().sort((a, b) => (a.at < b.at ? 1 : -1))[0];
if (!newest || !newest.ticker) throw new Error("newest fill missing ticker");

console.log("campfire open checks passed");
