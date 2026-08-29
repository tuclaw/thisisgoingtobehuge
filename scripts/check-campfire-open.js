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
  "12 Of The Best AI Robots",
  "Competing In A Survivor-like Game",
  "Where The Challenge Is Day Trading",
  "With My Wife\\u2019s Savings"
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
if (!js.includes("replayTrailer") || !js.includes("resetOpenTitlesOverlay")) {
  throw new Error("campfire-open.js missing replay trailer helpers");
}
if (!js.includes("force: true") && !js.includes("force ? { force: true }")) {
  throw new Error("campfire-open.js must force-play titles on replay");
}
if (!css.includes(".replay-trailer") || !css.includes("open-hero.is-copy-in .replay-trailer")) {
  throw new Error("styles.css missing subtle replay trailer styling");
}

const fills = (season.events || []).filter((e) => e && e.type === "fill");
if (fills.length < 1) throw new Error("season1.json has no fill events for trade flash");
const newest = fills.slice().sort((a, b) => (a.at < b.at ? 1 : -1))[0];
if (!newest || !newest.ticker) throw new Error("newest fill missing ticker");

console.log("campfire open checks passed");
