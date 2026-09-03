#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const js = readFileSync(join(root, "campfire-open.js"), "utf8");
const html = readFileSync(join(root, "templates", "island.html"), "utf8");
const css = readFileSync(join(root, "styles.css"), "utf8");
const chat = readFileSync(join(root, "camp-chat.js"), "utf8");
const season = require(join(root, "data", "season1.json"));

if (html.includes('id="campfire-theater"') || html.includes("campfire-canvas")) {
  throw new Error("templates/island.html must not keep the home campfire theater");
}

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
const taglineIdx = html.indexOf("Outwit. Outlast. Outtrade.");
const replayIdx = html.indexOf('id="replay-trailer"');
if (!(taglineIdx > -1 && replayIdx > taglineIdx && replayIdx < html.indexOf('id="money-ticker"'))) {
  throw new Error("Replay trailer must sit under the tagline, above the books chart");
}
if (!html.includes('id="money-ticker"') || !html.includes('data-ticker-mode="home"')) {
  throw new Error("templates/island.html missing home money ticker in the landing hero");
}
if (!html.includes("money-ticker-ctas") || !html.includes("Add Fuel") || !html.includes("Watch Live")) {
  throw new Error("templates/island.html must put Add Fuel + Watch Live below the money ticker");
}
if (html.includes('id="island-pot"') || html.includes('id="pot-amount"')) {
  throw new Error("templates/island.html must not keep the duplicate top pot amount above the ticker");
}
const markIdx = html.indexOf('class="brand-mark');
const homeTickerIdx = html.indexOf('id="money-ticker"');
const homeCtaIdx = html.indexOf("money-ticker-ctas");
const landingIdx = html.indexOf('id="landing"');
if (!(landingIdx > -1 && markIdx > landingIdx && homeTickerIdx > markIdx)) {
  throw new Error("home money ticker must sit under the Last Trader Standing title in the landing hero");
}
if (!(homeTickerIdx > -1 && homeCtaIdx > homeTickerIdx)) {
  throw new Error("home Add Fuel / Watch Live CTAs must sit after #money-ticker");
}
if (html.includes('id="wager"') || html.includes("Real Trades On The Stock Market")) {
  throw new Error("templates/island.html must not keep a separate Real Trades wager section");
}
const appJs = readFileSync(join(root, "app.js"), "utf8");
if (
  !html.includes('id="letters"') ||
  !html.includes("Will the contestants get their") ||
  !html.includes("Letters from home") ||
  !html.includes("Help me reach out*") ||
  !html.includes('id="letter-list"') ||
  !html.includes('id="letter-more"') ||
  !html.includes("Show more")
) {
  throw new Error("templates/island.html missing Letters from home section");
}
const lettersIdx = html.indexOf('id="letters"');
const castIdx = html.indexOf('id="cast"');
const seasonIdx = html.indexOf('id="season"');
const closeIdx = html.indexOf('id="close"');
if (!(seasonIdx > -1 && lettersIdx > seasonIdx && closeIdx > lettersIdx)) {
  throw new Error("Letters from home must sit after The journey is weekly and before the close");
}
const laughIdx = html.indexOf('id="laughs"');
if (!(closeIdx > -1 && laughIdx > closeIdx)) {
  throw new Error("laugh tracker must sit at the bottom of the home page after the close");
}
if (
  !html.includes("Laugh tracker") ||
  !html.includes("laugh-history.svg") ||
  !html.includes("300k") ||
  !html.includes("class=\"laugh-embed")
) {
  throw new Error("templates/island.html missing laugh tracker embed");
}
const laughSvg = readFileSync(join(root, "assets", "laugh-history.svg"), "utf8");
if (
  !laughSvg.includes("Laugh History") ||
  !laughSvg.includes(">Laughs<") ||
  !laughSvg.includes("300K") ||
  !laughSvg.includes("tuclaw/thisisgoingtobehuge")
) {
  throw new Error("assets/laugh-history.svg must be a 300K laugh-history chart");
}
const readme = readFileSync(join(root, "README.md"), "utf8");
if (!readme.includes("assets/laugh-history.svg") || !readme.includes("Laugh tracker")) {
  throw new Error("README.md must show the laugh-history chart");
}
if (
  !readme.includes("assets/bot-architecture.svg") ||
  !readme.includes("How the bots run the island") ||
  !readme.includes("diagrams/bot-architecture.html")
) {
  throw new Error("README.md must show the homepage bot-architecture diagram");
}
const botReadmeAt = readme.indexOf("assets/bot-architecture.svg");
const laughReadmeAt = readme.indexOf("assets/laugh-history.svg");
const liveNowAt = readme.indexOf("thisisgoingtobehuge.com)");
if (!(botReadmeAt > -1 && laughReadmeAt > botReadmeAt && liveNowAt > botReadmeAt)) {
  throw new Error("README.md must put the bot-architecture diagram above the pitch and laugh tracker");
}
const botSvg = readFileSync(join(root, "assets", "bot-architecture.svg"), "utf8");
if (
  !botSvg.includes("How the bots run the island") ||
  !botSvg.includes("Host bot") ||
  !botSvg.includes("Contestant bots") ||
  !botSvg.includes("Conversation bot") ||
  !botSvg.includes("Trade API")
) {
  throw new Error("assets/bot-architecture.svg must match the homepage bot diagram");
}
if (
  !html.includes("github.com/tuclaw/thisisgoingtobehuge") ||
  !html.includes("class=\"repo-link\"") ||
  !html.includes("class=\"github-mark\"")
) {
  throw new Error("templates/island.html footer must link the GitHub repo with the GitHub mark");
}
if (
  !appJs.includes("github.com/tuclaw/thisisgoingtobehuge") ||
  !appJs.includes("repo-link") ||
  !appJs.includes("github-mark")
) {
  throw new Error("app.js must inject a GitHub repo footer link on pages that lack one");
}
if (!appJs.includes("function renderLettersFromHome") || !appJs.includes("renderLettersFromHome(season)")) {
  throw new Error("app.js must render Letters from home from the cast + lab CEOs");
}
if (
  !appJs.includes("function initLettersMore") ||
  !appJs.includes("LETTERS_PREVIEW_ROWS = 2") ||
  !appJs.includes('textContent = "Show more"')
) {
  throw new Error("app.js must collapse Letters from home to two rows with a Show more control");
}
const labJs = readFileSync(join(root, "lab-logos.js"), "utf8");
[
  "elonmusk",
  "DarioAmodei",
  "mntruell",
  "demishassabis",
  "sama",
  "Kimi_Moonshot"
].forEach((handle) => {
  if (!labJs.includes('twitter: "' + handle + '"')) {
    throw new Error("lab-logos.js missing CEO twitter @" + handle);
  }
});
if (!labJs.includes("function ceoFor") || !labJs.includes("function twitterUrlFor")) {
  throw new Error("lab-logos.js missing CEO twitter helpers");
}
const labSandbox = {
  document: { documentElement: { getAttribute() { return ""; } } }
};
vm.createContext(labSandbox);
vm.runInContext(labJs, labSandbox);
const labs = labSandbox.LabLogos;
if (!labs || typeof labs.ceoFor !== "function") {
  throw new Error("lab-logos.js did not export LabLogos.ceoFor");
}
(season.cast || []).forEach((member) => {
  const ceo = labs.ceoFor(member.slug);
  if (!ceo || !ceo.name || !ceo.twitter) {
    throw new Error("lab-logos.js missing CEO twitter for " + member.slug);
  }
  const url = labs.twitterUrlFor(member.slug);
  if (!url || !url.startsWith("https://x.com/")) {
    throw new Error("lab-logos.js twitter URL must be https://x.com/ for " + member.slug);
  }
});
if (!css.includes(".letters-band") || !css.includes(".letter-list") || !css.includes(".letter-handle")) {
  throw new Error("styles.css missing Letters from home styles");
}
if (
  !css.includes(".letter-list:not(.is-open) .letter-item:nth-child(n + 5)") ||
  !css.includes(".letter-list:not(.is-open) .letter-item:nth-child(n + 3)") ||
  !css.includes(".letter-more-wrap")
) {
  throw new Error("styles.css must collapse Letters from home to two rows until Show more");
}
if (!css.includes(".laugh-band") || !css.includes(".laugh-embed") || !css.includes(".repo-link") || !css.includes(".github-mark")) {
  throw new Error("styles.css missing laugh tracker or GitHub footer repo link styles");
}

if (!html.includes('id="island-bot-diagram"') || !html.includes("archify-embed")) {
  throw new Error("templates/island.html missing Archify bot diagram embed");
}
if (!html.includes("archify-embed-frame") || !/<iframe[^>]+bot-architecture/.test(html)) {
  throw new Error("home diagram must embed diagrams/bot-architecture.html inside a sized frame");
}
const archify = readFileSync(join(root, "diagrams", "bot-architecture.html"), "utf8");
if (!archify.includes("lts-diagram-flow") || !archify.includes("lts-island-edge-flow")) {
  throw new Error("bot-architecture.html missing island scroll-flow wiring");
}
if (!archify.includes("font-size: 13px") || !archify.includes("[data-edge-label] text")) {
  throw new Error("bot-architecture.html missing larger embed label type");
}
if (
  !archify.includes('html[data-embed="true"] .diagram-container svg') ||
  !archify.includes("max-width: 100%") ||
  !archify.includes("height: auto")
) {
  throw new Error("bot-architecture.html embed SVG must scale to the iframe width");
}
const archSource = readFileSync(join(root, "diagrams", "bot-architecture.architecture.json"), "utf8");
if (/Monitors DMs|campfire \+ DMs|keeps the fire and DMs/.test(html + archify + archSource)) {
  throw new Error("conversation bot must stay out of DMs so contestant context stays isolated");
}
if (!archify.includes("isolated context") || !archSource.includes("isolated context")) {
  throw new Error("bot diagram must isolate each contestant context");
}
if (!html.includes("isolated context") || html.includes("keeps the fire and DMs")) {
  throw new Error("home diagram lede must say contestant bots keep isolated context");
}
if (!css.includes(".archify-embed") || !css.includes("min-height: 28rem")) {
  throw new Error("styles.css missing larger Archify embed");
}
const embedBlock = css.match(/\.archify-embed\s*\{[^}]+\}/);
if (
  !embedBlock ||
  !embedBlock[0].includes("width: 100%") ||
  !embedBlock[0].includes("max-width: 100%") ||
  !embedBlock[0].includes("min-width: 0")
) {
  throw new Error("styles.css Archify embed must stay within the parent column");
}
const frameBlock = css.match(/\.archify-embed-frame\s*\{[^}]+\}/);
if (
  !frameBlock ||
  !frameBlock[0].includes("width: 100%") ||
  !frameBlock[0].includes("max-width: 100%") ||
  !frameBlock[0].includes("min-width: 0") ||
  !frameBlock[0].includes("aspect-ratio: 1140 / 680")
) {
  throw new Error("styles.css Archify frame must size from column width, not a transferred min-width");
}
if (!/@media\s*\(min-width:\s*900px\)\s*\{[^}]*\.archify-embed-frame\s*\{[^}]*min-height:\s*28rem/.test(css)) {
  throw new Error("styles.css must keep the 28rem Archify floor only on wide screens");
}
if (!/\.diagram-band\s*\{[^}]*overflow-x:\s*clip/.test(css)) {
  throw new Error("styles.css diagram band must clip leftover horizontal overflow");
}
if (!appJs.includes("initArchifyEmbedFlow") || !appJs.includes("lts-diagram-flow")) {
  throw new Error("app.js missing scroll-triggered Archify flow");
}
if (!appJs.includes("MONEY_TICKER_HOME_RANGES") || !appJs.includes("MONEY_TICKER_HOME_DIAGRAMS")) {
  throw new Error("app.js missing home money ticker Season/Island-only tab config");
}
if (!appJs.includes("See how each tribe and contestant did in the Episode.")) {
  throw new Error("app.js missing home money ticker lede copy");
}
if (!appJs.includes("tickerHead") || !appJs.includes("homeMode")) {
  throw new Error("app.js must keep a home-only money ticker lede");
}
if (appJs.includes("Replay the books") || appJs.includes("Watch the island, the tribes")) {
  throw new Error("episode money ticker must not print Replay the books copy");
}
if (!js.includes("lts-home-books") || !js.includes("initHomeOpenLanding") || !js.includes('dispatchHomeBooks("play")')) {
  throw new Error("campfire-open.js must start the home books diagram after the title cards");
}
if (!appJs.includes("onHomeBooksEvent") || !appJs.includes('action === "play"') || !appJs.includes("kickoffMoneyTickerAutoplay")) {
  throw new Error("app.js must play the home books diagram when the title cards finish");
}
if (!css.includes(".open-hero .money-ticker") || !css.includes("max-width: min(64rem, 100%)")) {
  throw new Error("styles.css missing home hero books diagram layout");
}
if (!appJs.includes("tickerEvenGuide") || !appJs.includes('label: "0%"') || !css.includes(".money-ticker-putin")) {
  throw new Error("home books diagram must plot week % against a 0% even line");
}
const homeVoteIdx = html.indexOf('id="home-vote"');
const homeTribalIdx = html.indexOf('id="home-tribal"');
const beachIdx = html.indexOf('id="beach"');
if (!(castIdx > -1 && homeVoteIdx > castIdx && homeTribalIdx > homeVoteIdx && beachIdx > homeTribalIdx)) {
  throw new Error("home Episode 1 spoiler must sit below #cast and above #beach");
}
if (!html.includes("See who was voted off in episode one")) {
  throw new Error("templates/island.html missing Episode 1 spoiler heading");
}
if (!html.includes('id="home-vote-episode"') || !html.includes('href="seasons/1/e01.html">Episode 1 Page')) {
  throw new Error("templates/island.html Episode 1 Page button must link to seasons/1/e01.html");
}
const firstHrefFn = appJs.match(/function firstEpisodeHref\([\s\S]*?\n\}/);
if (!firstHrefFn) {
  throw new Error("app.js missing firstEpisodeHref for the home Episode 1 Page button");
}
if (!firstHrefFn[0].includes('item.id === "s1e01"') || !firstHrefFn[0].includes("item.number === 1")) {
  throw new Error("firstEpisodeHref must resolve Episode 1 from the episode list");
}
if (/season\.episode(?!s)/.test(firstHrefFn[0])) {
  throw new Error("firstEpisodeHref must not use season.episode (that is the live episode)");
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
if (/Claude Fable 5/.test(html.slice(homeVoteIdx, beachIdx))) {
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

let fills = (season.events || []).filter((e) => e && e.type === "fill");
if (!fills.length && Array.isArray(season.survivors)) {
  fills = season.survivors.flatMap((survivor) =>
    (survivor.positions || [])
      .filter((pos) => pos.orderId && pos.filledAt)
      .map((pos) => ({
        type: "fill",
        at: pos.filledAt,
        ticker: pos.ticker,
        side: String(pos.action || "BUY").toLowerCase() === "sell" ? "sell" : "buy"
      }))
  );
}
if (fills.length < 1) throw new Error("season1.json has no fill events for trade flash");
const newest = fills.slice().sort((a, b) => (a.at < b.at ? 1 : -1))[0];
if (!newest || !newest.ticker) throw new Error("newest fill missing ticker");

console.log("campfire open checks passed");
