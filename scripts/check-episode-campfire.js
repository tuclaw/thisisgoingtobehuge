#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const episodeHtml = readFileSync(join(root, "scripts", "build.mjs"), "utf8");
const episodeJs = readFileSync(join(root, "episode-campfire.js"), "utf8");
const openJs = readFileSync(join(root, "campfire-open.js"), "utf8");
const fridayLunchJs = readFileSync(join(root, "seasons/1/e01-friday-lunch.js"), "utf8");
const feed = JSON.parse(readFileSync(join(root, "seasons/1/conversations.json"), "utf8"));

const requiredIds = [
  "campfire-theater",
  "campfire-canvas",
  "campfire-pings",
  "campfire-thread",
  "campfire-imessage",
  "campfire-imessage-close",
  "campfire-imessage-faces"
];
requiredIds.forEach((id) => {
  if (!episodeHtml.includes('id="' + id + '"')) {
    throw new Error("episode renderer missing #" + id);
  }
});

["camp-chat.js", "campfire-open.js", "episode-campfire.js"].forEach((src) => {
  if (!episodeHtml.includes(src)) {
    throw new Error("episode renderer does not load " + src);
  }
});

const lunchBeforeCampfire =
  episodeHtml.indexOf("${lunchScripts}") >= 0 &&
  episodeHtml.indexOf("${lunchScripts}") < episodeHtml.indexOf("episode-campfire.js");
if (!lunchBeforeCampfire) {
  throw new Error("episode renderer must load day lunch/dinner scripts before episode-campfire.js");
}

if (!episodeHtml.includes('data-mode="feed"')) {
  throw new Error("episode renderer campfire theater missing data-mode=feed");
}
if (!episodeHtml.includes("episode-campfire-hero")) {
  throw new Error("episode renderer missing episode-campfire-hero landing");
}
if (!episodeHtml.includes('class="hero-head"')) {
  throw new Error("episode renderer missing hero-head above campfire theater");
}
if (episodeHtml.includes('class="location"') || episodeHtml.includes("host-line") || episodeHtml.includes("hero-note")) {
  throw new Error("episode renderer still prints location/host/hero-note chrome under the campfire");
}
if (!episodeHtml.includes("hero-listen") || !episodeHtml.includes("episode.heroNote")) {
  throw new Error("episode renderer must still support a hero listen line when an episode has a note");
}
if (episodeHtml.includes("Stay a while and listen")) {
  throw new Error("episode renderer must not force a stay-a-while listen fallback");
}
const episode1Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e01.json"), "utf8"));
const episode2Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e02.json"), "utf8"));
if (episode1Copy.heroNote !== "Stay a while and listen") {
  throw new Error("Episode 1 must keep its stay-a-while listen line");
}
if (episode2Copy.heroNote) {
  throw new Error("Episode 2 must not print a hero listen line");
}
if (episode2Copy.weekBoard && episode2Copy.weekBoard.lede) {
  throw new Error("Episode 2 must not print week-board lede, status banner, or ranked-by-week kicker");
}
const agentsGuide = readFileSync(join(root, "AGENTS.md"), "utf8");
if (!/Episode 2 chrome \(do not restore\)/.test(agentsGuide) || !/heroNote` stays `""`/.test(agentsGuide)) {
  throw new Error("AGENTS.md must keep the Episode 2 chrome do-not-restore rule");
}
const chromeRule = readFileSync(join(root, ".cursor", "rules", "episode-chrome.mdc"), "utf8");
if (!/alwaysApply:\s*true/.test(chromeRule) || !/heroNote` and `weekBoard.lede` as empty strings/.test(chromeRule)) {
  throw new Error("episode-chrome rule must stay always-on and forbid restoring E2 heroNote/lede");
}
if (!episodeHtml.includes("weekBoard.lede") || !episodeHtml.includes("holdings-kicker") || !episodeHtml.includes("season-banner")) {
  throw new Error("episode renderer must still support week-board lede, banner, and holdings kicker when an episode has copy");
}
if (!episodeHtml.includes('id="week-board"')) {
  throw new Error("episode renderer lost week-board structure below landing");
}
if (!episodeHtml.includes('id="trade-tape"') || !episodeHtml.includes("trade-tape-root") || !episodeHtml.includes("books-board-tabs")) {
  throw new Error("episode renderer missing books/tape tabs on latest books");
}
if (!episodeHtml.includes('id="camp-whispers"') || !episodeHtml.includes("camp-whispers-feed")) {
  throw new Error("episode renderer missing recent camp whispers section below week-board");
}
if (!episodeHtml.includes("wantsWhisperFeed") || !episodeHtml.includes("conversationFeed !== false")) {
  throw new Error("episode renderer must gate latest whispers on conversationFeed, not just dinner-fires");
}
if (!episodeHtml.includes('id="money-ticker"')) {
  throw new Error("episode renderer missing money ticker playback mount on week-board");
}
if (!episodeHtml.includes("money-ticker-ctas") || !episodeHtml.includes("Add Fuel")) {
  throw new Error("episode renderer must put Add Fuel below the money ticker");
}
const episodeCtaBlock = episodeHtml.slice(
  episodeHtml.indexOf("money-ticker-ctas"),
  episodeHtml.indexOf("money-ticker-ctas") + 400
);
if (episodeCtaBlock.includes("Watch Live") || episodeCtaBlock.includes("data-nav-watch")) {
  throw new Error("episode page must not show Watch Live under the money ticker");
}
const tickerIdx = episodeHtml.indexOf('id="money-ticker"');
const ctaIdx = episodeHtml.indexOf("money-ticker-ctas");
if (!(tickerIdx > -1 && ctaIdx > tickerIdx)) {
  throw new Error("episode Add Fuel CTA must sit after #money-ticker");
}
const appJs = readFileSync(join(root, "app.js"), "utf8");
if (!appJs.includes("mountMoneyTicker") || !appJs.includes("money-ticker-putin")) {
  throw new Error("app.js missing money ticker playback (mount + put-in dotted line)");
}
if (
  !appJs.includes("function tickerAxisPct") ||
  !appJs.includes("function tickerPctScale") ||
  !appJs.includes("function tickerEvenGuide") ||
  !appJs.includes("function bookWeekPctFromSnap")
) {
  throw new Error("app.js money ticker must plot week % on a percentage y-axis");
}
if (appJs.includes('lineLabel: "even"') || appJs.includes('{ label: "even"')) {
  throw new Error("app.js money ticker must not print the word even on the 0% guide");
}
if (!appJs.includes('labelClass: "is-putin"') || !appJs.includes('label: "0%"')) {
  throw new Error("app.js money ticker must draw a 0% guide, not a money put-in bar");
}
if (appJs.includes("function buildTickerChapters") || appJs.includes("data-ticker-chapter") || appJs.includes("function advanceTickerChapter")) {
  throw new Error("app.js season ticker must play one combined percentage tape, not episode chapters");
}
if (
  appJs.includes("Watch the island, the tribes") ||
  appJs.includes("Watch the island pot in dollars") ||
  appJs.includes("Season plays one episode at a time") ||
  appJs.includes("Season plays every episode on one percentage tape") ||
  appJs.includes("moves the island bar to")
) {
  throw new Error("app.js episode ticker must not print a long lede above the diagram");
}
if (appJs.includes("money-ticker-host-add") && appJs.includes("Island pot over recorded marks. Both dotted lines stay on")) {
  throw new Error("app.js island diagram must not plot host-add money bars on the percentage axis");
}
if (!appJs.includes("weekPct from this week's open — not last week's ending book")) {
  throw new Error("app.js holdings kicker must say weekPct is from this week's open");
}
if (
  !appJs.includes("function moneyTickerLiveFoot") ||
  !appJs.includes("live: potMoney(cash)")
) {
  throw new Error("app.js ticker foot must show island cash only");
}
if (
  !appJs.includes("function tickerPutInAt") ||
  !appJs.includes("function framePutIn") ||
  !appJs.includes("up from")
) {
  throw new Error("app.js ticker foot must say up from a host-add-aware funded pot");
}
if (appJs.includes("from ${potMoney(putIn)} put in")) {
  throw new Error("app.js ticker chg must not keep the static put-in phrase");
}
if (
  appJs.includes("${potMoney(potUsd)} · ${tickerAxisPct(totalPct)}") ||
  appJs.includes("${potMoney(cash)} · ${tickerAxisPct(totalPct)}") ||
  appJs.includes('liveKind: "tribes"') ||
  appJs.includes('liveKind: "pair"')
) {
  throw new Error("app.js ticker foot must not pair dollars with week % or tribe %");
}
if (!appJs.includes('MONEY_TICKER_RANGES = ["week", "season"]') &&
  (!appJs.includes('data-ticker-range="week"') || !appJs.includes('data-ticker-range="season"'))) {
  throw new Error("app.js money ticker must offer week and season ranges");
}
if (
  !appJs.includes('["island", "tribes", "contestants"]') &&
  !appJs.includes('["island", "Island"]')
) {
  throw new Error("app.js money ticker must offer Island / Tribes / Contestants diagrams");
}
if (!appJs.includes("data-ticker-diagram") || !appJs.includes("MONEY_TICKER_DIAGRAMS")) {
  throw new Error("app.js money ticker missing diagram tab wiring");
}
if (!appJs.includes("currentPageEpisode(season)") || !appJs.includes("Page episode, not the live week")) {
  throw new Error("app.js week ticker must filter snapshots by the page episode, not the live week");
}
if (!appJs.includes("jaggedSeriesSamples")) {
  throw new Error("app.js money ticker must use jagged Robinhood-style paths, not boxy step H/V");
}
if (/\.push\(`H \$\{/.test(appJs) || appJs.includes("out.push(`H ${")) {
  throw new Error("app.js money ticker still builds boxy step paths");
}
if (!appJs.includes("armMoneyTickerAutoplay") || !appJs.includes("startMoneyTickerPlayback")) {
  throw new Error("app.js money ticker must autoplay from the start on first scroll into view");
}
if (
  !appJs.includes("function moneyTickerDefaultDiagram") ||
  !appJs.includes("function moneyTickerEpisodeDiagrams") ||
  !appJs.includes('id !== "tribes"') ||
  !appJs.includes('moneyTicker.diagram = "tribes"') ||
  !appJs.includes('moneyTicker.diagram = "contestants"') ||
  !appJs.includes("setMoneyTickerSpeed(0.5)")
) {
  throw new Error("app.js money ticker must drop Tribes after merge and autoplay Contestants at 0.5x");
}
if (!appJs.includes("tickMoneyTickerPlayback") || !appJs.includes("setMoneyTickerProgress")) {
  throw new Error("app.js money ticker must reveal continuously left-to-right while playing");
}
if (appJs.includes("Jagged lines are for the ride")) {
  throw new Error("app.js must not keep the jagged-lines-for-the-ride copy");
}
if (!appJs.includes("data-ticker-sky") || !appJs.includes("syncMoneyTickerSky") || !appJs.includes("renderMoneyTickerSkySvg")) {
  throw new Error("app.js money ticker must offer a sun & moon sky toggle synced to playhead time");
}
if (!appJs.includes("money-ticker-palm")) {
  throw new Error("app.js money ticker sky must include a palm tree on the island");
}
if (
  !appJs.includes("function moneyTickerWeekdayTicks") ||
  !appJs.includes("data-ticker-x-weekday") ||
  !appJs.includes('label: "Monday"') ||
  !appJs.includes("money-ticker-day-full") ||
  !appJs.includes("money-ticker-day-short")
) {
  throw new Error("app.js money ticker x-axis must mark Monday through Friday as day points");
}
if (appJs.includes("function moneyTickerAxisRangeLabels") || appJs.includes("data-ticker-x-range")) {
  throw new Error("app.js money ticker x-axis must use weekday points, not date-range labels");
}
if (!appJs.includes("function survivorLivingAt") || !appJs.includes("Voted-out players drop after tribal")) {
  throw new Error("app.js money ticker must drop voted-out contestants after tribal");
}
if (appJs.includes("function moneyTickerLiveNowX") || appJs.includes("data-ticker-live-now")) {
  throw new Error("app.js money ticker must not draw a live vertical line at the end of the tape");
}
if (appJs.includes("live.textContent = tickerAxisPct") || appJs.includes("from even")) {
  throw new Error("app.js money ticker footer must show cash, not week % from even");
}
if (!appJs.includes("live.textContent = potMoney") || !appJs.includes("cash: snapshotTotal(snap)")) {
  throw new Error("app.js money ticker footer must show pot cash from each snapshot");
}
if (appJs.includes("frame.axisT = weekdaySlotT") || appJs.includes("function weekdaySlotT")) {
  throw new Error("app.js must not pin same-day marks to a single weekday slot x");
}
if (!appJs.includes("function pacificSessionU") || !appJs.includes("frame.axisT = slot + u")) {
  throw new Error("app.js must place ticker marks on weekday session time so Friday does not swallow the tape");
}
