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
if (!episodeHtml.includes("hero-listen") || !episodeHtml.includes("Stay a while and listen")) {
  throw new Error("episode renderer missing subtle stay-a-while listen line");
}
if (!episodeHtml.includes('id="week-board"')) {
  throw new Error("episode renderer lost week-board structure below landing");
}
if (!episodeHtml.includes('id="camp-whispers"') || !episodeHtml.includes("camp-whispers-feed")) {
  throw new Error("episode renderer missing recent camp whispers section below week-board");
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
if (!appJs.includes("jaggedSeriesSamples")) {
  throw new Error("app.js money ticker must use jagged Robinhood-style paths, not boxy step H/V");
}
if (/\.push\(`H \$\{/.test(appJs) || appJs.includes("out.push(`H ${")) {
  throw new Error("app.js money ticker still builds boxy step paths");
}
if (!appJs.includes("armMoneyTickerAutoplay") || !appJs.includes("startMoneyTickerPlayback")) {
  throw new Error("app.js money ticker must autoplay from the start on first scroll into view");
}
if (!appJs.includes('moneyTicker.diagram = "tribes"') || !appJs.includes("setMoneyTickerSpeed(0.5)")) {
  throw new Error("app.js money ticker scroll autoplay must start on Tribes at 0.5x");
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

if (!openJs.includes("CampfireEngine")) {
  throw new Error("campfire-open.js missing CampfireEngine export");
}
if (!openJs.includes('portrait: "cast/claude-fable-5/portrait.jpg"')) {
  throw new Error("campfire-open.js missing sable slug portrait");
}
if (!openJs.includes('portrait: "cast/gemini-3-1-pro/portrait.jpg"')) {
  throw new Error("campfire-open.js missing kite slug portrait");
}
if (openJs.includes("cast/hex/portrait.jpg") || openJs.includes("cast/sable/portrait.jpg")) {
  throw new Error("campfire-open.js still points at nickname portrait folders");
}
if (!episodeJs.includes("data-mode") || !episodeJs.includes("campfire-ping")) {
  throw new Error("episode-campfire.js missing feed mode / ping UI");
}
if (!episodeJs.includes("campfire-ping-face") || !episodeJs.includes("32000")) {
  throw new Error("episode-campfire.js missing portrait faces or 30s hold");
}
if (
  !episodeJs.includes("FIRST_BUBBLE_DELAY_MS = 10000") ||
  !episodeJs.includes("NEXT_BUBBLE_DELAY_MS = 60000")
) {
  throw new Error("episode-campfire.js missing delayed bubble reveal timing");
}
if (!episodeJs.includes("MAX_VISIBLE = 2") || !episodeJs.includes("REVEAL_AFTER_CLOSE_MS = 5000")) {
  throw new Error("episode-campfire.js missing 2-at-a-time / 5s reveal behavior");
}
if (!episodeJs.includes("dataset.slot") || !episodeJs.includes('btn.dataset.slot')) {
  throw new Error("episode-campfire.js must stamp data-slot on ping buttons for mobile layout");
}
const stylesCss = readFileSync(join(root, "styles.css"), "utf8");
if (stylesCss.includes('campfire-ping[style*="68%"]') || stylesCss.includes('campfire-ping[style*="66%"]')) {
  throw new Error("styles.css must not park lower pings to top:18% via inline style matching (overlaps portraits/meta on mobile)");
}
if (!stylesCss.includes("--ping-anchor-y") || !stylesCss.includes('.campfire-ping[data-slot="2"]')) {
  throw new Error("styles.css missing face-anchored ping layout / data-slot mobile spacing");
}
if (!stylesCss.includes(".campfire-theater.is-reading .campfire-ping[data-slot=\"2\"]")) {
  throw new Error("styles.css must only park lower pings while reading, not always on mobile");
}
if (!episodeJs.includes("camp-whispers-feed") || !episodeJs.includes("mountRecentConversations")) {
  throw new Error("episode-campfire.js missing recent whispers section mount");
}
if (/#camp-whispers \.camp-scene\s*\{[^}]*min-height:\s*([1-9]\d{2,}|[3-9]\d)px/.test(stylesCss)) {
  throw new Error("#camp-whispers cards must stay compact; do not reserve a standing min-height");
}
if (!stylesCss.includes("#camp-whispers .camp-whispers-feed") || !stylesCss.includes("align-items: start")) {
  throw new Error("#camp-whispers feed must align-items:start so a closed neighbor does not stretch");
}
if (!stylesCss.includes("#camp-whispers .camp-chat-panel.is-open")) {
  throw new Error("#camp-whispers chat panel must grow in-flow when the thread is opened");
}
if (!stylesCss.includes("grid-template-columns: minmax(0, 1fr) auto")) {
  throw new Error("#camp-whispers cards must keep the 4 messages trigger on the heading row");
}
if (
  !episodeJs.includes("resolveLatestConversations") ||
  !episodeJs.includes("latestDayConversations") ||
  !episodeJs.includes("sortNewestFirst") ||
  !episodeJs.includes("FRIDAY_LUNCH_CONVERSATIONS")
) {
  throw new Error("episode-campfire.js missing latest-first conversation resolution");
}
if (!readFileSync(join(root, "camp-chat.js"), "utf8").includes("camp-chat-avatar")) {
  throw new Error("camp-chat.js missing contestant avatar bubbles");
}

if (!Array.isArray(feed.conversations) || feed.conversations.length < 1) {
  throw new Error("conversations.json needs at least one conversation");
}
feed.conversations.forEach((c, i) => {
  if (!c.id || !c.dayLabel || !Array.isArray(c.messages) || !c.messages.length) {
    throw new Error("conversations[" + i + "] incomplete host feed shape");
  }
});

const fridayIds = [...fridayLunchJs.matchAll(/id:\s*"(fri-lunch-[^"]+)"/g)].map((m) => m[1]);
if (fridayIds.length < 1) {
  throw new Error("friday lunch script missing fri-lunch conversation ids");
}
const feedIds = feed.conversations.map((c) => c.id);
fridayIds.forEach((id) => {
  if (!feedIds.includes(id)) {
    throw new Error("conversations.json missing latest friday lunch thread " + id);
  }
});
const stale = feedIds.find((id) => !String(id).startsWith("fri-lunch-"));
if (stale) {
  throw new Error("conversations.json still hosts stale thread instead of latest: " + stale);
}
feed.conversations.forEach((c) => {
  if (!String(c.dayLabel).startsWith("Fri")) {
    throw new Error("host feed dayLabel must be latest Friday cut, got " + c.dayLabel);
  }
});

/* Pure sort/filter check mirroring episode-campfire scoring. */
const DOW = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
function conversationTimeScore(conversation) {
  const raw = String((conversation && conversation.dayLabel) || "")
    .split("·")[0]
    .trim();
  const match = raw.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b(?:\s+(.+))?$/i);
  if (!match) return 0;
  const day = DOW[match[1].toLowerCase()] || 0;
  const rest = String(match[2] || "")
    .trim()
    .toLowerCase();
  let mins = 0;
  if (rest === "dinner") mins = 19 * 60;
  else if (rest === "lunch") mins = 12 * 60 + 30;
  else {
    const time = rest.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (time) {
      let hour = parseInt(time[1], 10);
      const minute = parseInt(time[2], 10);
      const ap = String(time[3] || "").toLowerCase();
      if (ap === "pm" && hour < 12) hour += 12;
      if (ap === "am" && hour === 12) hour = 0;
      mins = hour * 60 + minute;
    }
  }
  return day * 1440 + mins;
}
function latestDayConversations(list) {
  const sorted = list.slice().sort((a, b) => conversationTimeScore(b) - conversationTimeScore(a));
  const topDay = Math.floor(conversationTimeScore(sorted[0]) / 1440);
  return sorted.filter((c) => Math.floor(conversationTimeScore(c) / 1440) === topDay);
}
const mixed = [
  { id: "old-mon", dayLabel: "Mon 9:48 PM" },
  { id: "mid-thu", dayLabel: "Thu dinner" },
  { id: "new-fri-a", dayLabel: "Fri 12:30 PM" },
  { id: "new-fri-b", dayLabel: "Fri 12:30 PM" },
  { id: "wed", dayLabel: "Wed 8:03 PM" }
];
const latest = latestDayConversations(mixed);
if (latest.length !== 2 || latest.some((c) => !c.id.startsWith("new-fri"))) {
  throw new Error("latest-day filter should keep only Friday threads");
}

console.log("episode campfire checks passed (" + feed.conversations.length + " latest threads)");
