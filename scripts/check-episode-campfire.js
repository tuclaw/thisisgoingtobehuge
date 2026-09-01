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
if (!appJs.includes('lineLabel: "even"') || !appJs.includes('labelClass: "is-putin"') || !appJs.includes('label: "0%"')) {
  throw new Error("app.js money ticker must draw a 0% even line, not a money put-in bar");
}
if (appJs.includes("function buildTickerChapters") || appJs.includes("data-ticker-chapter") || appJs.includes("function advanceTickerChapter")) {
  throw new Error("app.js season ticker must play one combined percentage tape, not episode chapters");
}
if (!appJs.includes("Season plays every episode on one percentage tape") || !appJs.includes("as week %")) {
  throw new Error("app.js must say Season plays every episode on one percentage tape");
}
if (appJs.includes("money-ticker-host-add") && appJs.includes("Island pot over recorded marks. Both dotted lines stay on")) {
  throw new Error("app.js island diagram must not plot host-add money bars on the percentage axis");
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
if (!appJs.includes("function moneyTickerLiveNowX") || !appJs.includes("data-ticker-live-now")) {
  throw new Error("app.js money ticker must draw a live vertical line for the current point in the week");
}
if (appJs.includes("frame.axisT = weekdaySlotT") || appJs.includes("function weekdaySlotT")) {
  throw new Error("app.js must space ticker marks by tape order so same-day frames travel, not calendar weekday slots");
}

const axisStart = appJs.indexOf("function pacificDateParts");
const axisEnd = appJs.indexOf("function pacificHourDecimal");
if (!(axisStart > -1 && axisEnd > axisStart)) {
  throw new Error("app.js missing Pacific weekday helpers before pacificHourDecimal");
}
const axisHelpers = new Function(`
  const moneyTicker = { axisMax: 5, range: "week", frames: [] };
  ${appJs.slice(axisStart, axisEnd)}
  return {
    formatPacificDateRange,
    parseEpisodeWeekLabel,
    episodeWeekBounds,
    moneyTickerWeekdayTicks,
    moneyTickerAssignAxis,
    moneyTickerXFromAxisT,
    survivorBootAtMs,
    survivorLivingAt,
    axisMax: () => moneyTicker.axisMax
  };
`)();
if (axisHelpers.formatPacificDateRange("2026-08-24T16:06:00Z", "2026-08-28T19:14:23Z") !== "Aug 24–28") {
  throw new Error("formatPacificDateRange should compact a same-month span to Aug 24–28");
}
if (axisHelpers.formatPacificDateRange("2026-08-31T16:00:00Z", "2026-09-04T19:00:00Z") !== "Aug 31–Sep 4") {
  throw new Error("formatPacificDateRange should keep both months when a span crosses months");
}
if (JSON.stringify(axisHelpers.parseEpisodeWeekLabel("Monday Aug 24 – Friday Aug 28, 2026")) !== JSON.stringify({ weekStart: "2026-08-24", weekEnd: "2026-08-28" })) {
  throw new Error("parseEpisodeWeekLabel should read Episode 1 as Aug 24–28");
}
if (JSON.stringify(axisHelpers.parseEpisodeWeekLabel("Monday Aug 31 – Friday Sep 4, 2026")) !== JSON.stringify({ weekStart: "2026-08-31", weekEnd: "2026-09-04" })) {
  throw new Error("parseEpisodeWeekLabel should read Episode 2 as Aug 31–Sep 4");
}
const weekAxis = axisHelpers.moneyTickerWeekdayTicks([], "week").map((tick) => tick.label);
if (weekAxis.join(" | ") !== "Monday | Tuesday | Wednesday | Thursday | Friday") {
  throw new Error("Week diagram must note Monday through Friday as points, got " + weekAxis.join(" | "));
}
const seasonAxis = axisHelpers.moneyTickerWeekdayTicks(
  [
    { at: "2026-08-24T16:06:00Z" },
    { at: "2026-08-25T15:25:47Z" },
    { at: "2026-08-26T20:00:00Z" },
    { at: "2026-08-28T00:13:00Z" },
    { at: "2026-08-28T19:14:23Z" }
  ],
  "season"
).map((tick) => tick.label);
if (seasonAxis.join(" | ") !== "Monday | Tuesday | Wednesday | Thursday | Friday") {
  throw new Error("Season diagram should still name Mon–Fri when one trading week is on tape, got " + seasonAxis.join(" | "));
}
const twoWeekAxis = axisHelpers.moneyTickerWeekdayTicks(
  [
    { at: "2026-08-24T16:06:00Z", axisT: 0 },
    { at: "2026-08-28T19:14:23Z", axisT: 4 },
    { at: "2026-08-31T16:00:00Z", axisT: 8 }
  ],
  "season"
).map((tick) => tick.label);
if (twoWeekAxis.join(" | ") !== "Mon 24 | Fri 28 | Mon 31") {
  throw new Error("Combined season tape should label each trading day, got " + twoWeekAxis.join(" | "));
}

const pctHelpStart = appJs.indexOf("function tickerAxisPct");
const pctHelpEnd = appJs.indexOf("function moneyTickerAssignAxis");
if (!(pctHelpStart > -1 && pctHelpEnd > pctHelpStart)) {
  throw new Error("app.js missing tickerAxisPct / bookWeekPctFromSnap");
}
const pctHelpers = new Function(`
  function pct(n) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    const sign = n > 0 ? "+" : "";
    return sign + n.toFixed(2) + "%";
  }
  ${appJs.slice(pctHelpStart, pctHelpEnd)}
  return { tickerAxisPct, bookWeekPctFromSnap };
`)();
if (pctHelpers.tickerAxisPct(0) !== "0%") {
  throw new Error("tickerAxisPct(0) should be 0%, got " + pctHelpers.tickerAxisPct(0));
}
if (pctHelpers.tickerAxisPct(-2.16) !== "-2.16%") {
  throw new Error("tickerAxisPct should keep signed percentages, got " + pctHelpers.tickerAxisPct(-2.16));
}
if (pctHelpers.tickerAxisPct(1.27) !== "+1.27%") {
  throw new Error("tickerAxisPct should prefix plus on gains, got " + pctHelpers.tickerAxisPct(1.27));
}
if (pctHelpers.bookWeekPctFromSnap({ weekPct: 1.27, bookUsd: 24.278 }) !== 1.27) {
  throw new Error("bookWeekPctFromSnap must read the ledger weekPct, not a money amount");
}
if (pctHelpers.bookWeekPctFromSnap({ bookUsd: 10 }) != null) {
  throw new Error("bookWeekPctFromSnap must not invent a percentage from bookUsd");
}

const scaleStart = appJs.indexOf("function tickerPctScale");
const scaleEnd = appJs.indexOf("function moneyTickerDiagramSeries");
if (!(scaleStart > -1 && scaleEnd > scaleStart)) {
  throw new Error("app.js missing tickerPctScale");
}
const scaleHelpers = new Function(`
  ${appJs.slice(scaleStart, scaleEnd)}
  return { tickerPctScale, tickerEvenGuide };
`)();
const scale = scaleHelpers.tickerPctScale([-5.18, 1.27], 1.2);
if (!(scale.min < -5.18 && scale.max > 1.27 && scale.min < 0 && scale.max > 0)) {
  throw new Error("tickerPctScale must keep 0% on the y-axis and pad the tape, got " + JSON.stringify(scale));
}
if (scaleHelpers.tickerEvenGuide().value !== 0 || scaleHelpers.tickerEvenGuide().label !== "0%") {
  throw new Error("tickerEvenGuide must be the 0% even line");
}

const mondayTape = [
  { at: "2026-08-31T16:00:00Z" },
  { at: "2026-08-31T17:02:51Z" },
  { at: "2026-08-31T17:35:00Z" },
  { at: "2026-08-31T19:36:30Z" }
];
axisHelpers.moneyTickerAssignAxis(mondayTape, "week");
if (mondayTape.map((frame) => frame.axisT).join(",") !== "0,1,2,3") {
  throw new Error(
    "Week tape must space same-day marks across the plot, got " + mondayTape.map((frame) => frame.axisT).join(",")
  );
}
if (axisHelpers.axisMax() !== 3) {
  throw new Error("Monday-only week axisMax should be last-frame index 3, got " + axisHelpers.axisMax());
}
const mondaySpan =
  axisHelpers.moneyTickerXFromAxisT(mondayTape[3].axisT) - axisHelpers.moneyTickerXFromAxisT(mondayTape[0].axisT);
if (mondaySpan < 500) {
  throw new Error("Monday-only week marks must travel most of the plot, span was " + mondaySpan.toFixed(1));
}

const fable = { id: "6ff86687-5f96-40cb-84f4-a7282bce28af", name: "Claude Fable 5", status: "jury" };
const bootSeason = {
  tribalLog: [
    {
      at: "2026-08-28T19:00:00-07:00",
      bootId: "6ff86687-5f96-40cb-84f4-a7282bce28af",
      boot: "Claude Fable 5",
      bootName: "Claude Fable 5"
    }
  ]
};
if (!axisHelpers.survivorLivingAt(bootSeason, fable, "2026-08-28T19:14:23Z")) {
  throw new Error("Claude Fable 5 must still be on the Episode 1 diagram through Friday last-hour");
}
if (axisHelpers.survivorLivingAt(bootSeason, fable, "2026-08-29T02:00:01Z")) {
  throw new Error("Claude Fable 5 must drop from the diagram after Friday tribal");
}
if (axisHelpers.survivorLivingAt(bootSeason, fable, "2026-08-31T12:00:00-07:00")) {
  throw new Error("Claude Fable 5 must stay off the Episode 2 diagram after the vote");
}

const givenStart = appJs.indexOf("function islandGivenUsd");
const givenEnd = appJs.indexOf("function livingContestantCount");
const hostStart = appJs.indexOf("function tickerIsEpisodeTwo");
const hostEnd = appJs.indexOf("function snapshotTotal");
if (!(givenStart > -1 && givenEnd > givenStart && hostStart > -1 && hostEnd > hostStart)) {
  throw new Error("app.js missing island given / host-add helpers");
}
const hostHelpers = new Function(`
  ${appJs.slice(givenStart, givenEnd)}
  ${appJs.slice(hostStart, hostEnd)}
  return { islandHostAddUsd, islandHostAddEpisodeLabel, moneyPutInTotal };
`)();
const seasonSource = JSON.parse(readFileSync(join(root, "data", "season1.json"), "utf8"));
if (hostHelpers.moneyPutInTotal(seasonSource) !== 120) {
  throw new Error("moneyPutInTotal should stay $120 season start");
}
if (hostHelpers.islandHostAddUsd(seasonSource) !== 120.09) {
  throw new Error("islandHostAddUsd should be Episode 2 host +$120.09, got " + hostHelpers.islandHostAddUsd(seasonSource));
}
if (hostHelpers.islandHostAddEpisodeLabel(seasonSource) !== "E2") {
  throw new Error("islandHostAddEpisodeLabel should be E2");
}
if (hostHelpers.islandHostAddUsd({ startingBookUsd: 10, islandGivenUsd: 120, cast: new Array(12).fill({}) }) != null) {
  throw new Error("islandHostAddUsd must stay hidden when given equals the opening $120");
}

const groupStart = appJs.indexOf("function listedTickerEpisodes");
const groupEnd = appJs.indexOf("function snapshotsForTickerRange");
if (!(groupStart > -1 && groupEnd > groupStart)) {
  throw new Error("app.js missing season episode-chapter grouping helpers");
}
const chapterHelpers = new Function(`
  ${appJs.slice(groupStart, groupEnd)}
  return { listedTickerEpisodes, groupSnapshotsByEpisode, snapshotMatchesEpisode };
`)();
const chapterEps = chapterHelpers.listedTickerEpisodes(seasonSource);
if (chapterEps.map((ep) => ep.id).join("|") !== "s1e01|s1e02") {
  throw new Error("listedTickerEpisodes should keep closed + live episodes, got " + chapterEps.map((ep) => ep.id).join("|"));
}
const grouped = chapterHelpers.groupSnapshotsByEpisode(seasonSource, [
  { id: "s1e01-mon-open", at: "2026-08-24T16:06:00Z" },
  { id: "s1e01-fri-lasthour", at: "2026-08-28T19:14:23Z" },
  { id: "s1e02-carry", at: "2026-08-29T02:00:01Z" },
  { id: "s1e02-cash-add", at: "2026-08-31T16:00:00Z" },
  { id: "s1e02-mon-mid-gift", at: "2026-08-31T17:35:00Z" }
]);
if (grouped.length !== 2) {
  throw new Error("groupSnapshotsByEpisode should make two chapters, got " + grouped.length);
}
if (grouped[0].episode.id !== "s1e01" || grouped[0].snaps.some((s) => String(s.id).startsWith("s1e02"))) {
  throw new Error("Episode 1 chapter leaked Episode 2 snaps");
}
if (grouped[1].episode.id !== "s1e02" || !grouped[1].snaps.some((s) => s.id === "s1e02-cash-add")) {
  throw new Error("Episode 2 chapter must include the cash-add snap");
}
const startSliceStart = appJs.indexOf("function episodeDiagramStartId");
const startSliceEnd = appJs.indexOf("function snapshotsInTickerRange");
if (!(startSliceStart > -1 && startSliceEnd > startSliceStart)) {
  throw new Error("app.js missing Episode 2 diagram-start slice helpers");
}
const startSlice = new Function(`
  function tickerIsEpisodeTwo(episode) {
    return Boolean(episode && (episode.id === "s1e02" || Number(episode.number) === 2));
  }
  ${appJs.slice(startSliceStart, startSliceEnd)}
  return { snapshotsFromEpisodeStart, episodeDiagramStartId };
`)();
const e2ChapterSnaps = startSlice.snapshotsFromEpisodeStart(grouped[1].snaps, {
  id: "s1e02",
  number: 2,
  diagramStartSnapshotId: "s1e02-cash-add"
});
if (e2ChapterSnaps[0].id !== "s1e02-cash-add" || e2ChapterSnaps.some((s) => s.id === "s1e02-carry")) {
  throw new Error("Episode 2 chapter must start at the cash-add so every living book already has the extra $10");
}
if (
  !appJs.includes("function tickerIsEpisodeTwo") ||
  !appJs.includes("function tickerSleevePutIn") ||
  !appJs.includes("function snapshotsInTickerRange") ||
  !appJs.includes("diagramStartSnapshotId") ||
  !appJs.includes("s1e02-cash-add")
) {
  throw new Error("app.js must start Episode 2 week at the cash-add with the funded given / $20 put-in");
}

const tickerStart = appJs.indexOf("function tickerIsEpisodeTwo");
const tickerEnd = appJs.indexOf("function islandHostAddUsd");
if (!(tickerStart > -1 && tickerEnd > tickerStart)) {
  throw new Error("app.js missing Episode 2 ticker put-in / week-start helpers");
}
const tickerHelpers = new Function(`
  ${appJs.slice(tickerStart, tickerEnd)}
  return { tickerIsEpisodeTwo, moneyPutInTotal, tickerSleevePutIn, snapshotsInTickerRange };
`)();
const e2Season = {
  startingBookUsd: 10,
  islandGivenUsd: 240.09,
  islandGivenStartUsd: 120,
  islandEpisode2TopUpEachUsd: 10,
  survivors: Array.from({ length: 12 }, (_, i) => ({ id: "s" + i })),
  snapshots: [
    { id: "s1e02-mon-mid", at: "2026-08-31T14:11:24Z" },
    { id: "s1e02-mon-open", at: "2026-08-31T15:02:51Z" },
    { id: "s1e02-cash-add", at: "2026-08-31T16:00:00Z" }
  ]
};
const e2Ep = {
  id: "s1e02",
  number: 2,
  weekStart: "2026-08-31",
  weekEnd: "2026-09-04",
  diagramStartSnapshotId: "s1e02-cash-add"
};
const e1Ep = { id: "s1e01", number: 1, weekStart: "2026-08-24", weekEnd: "2026-08-28" };
if (!tickerHelpers.tickerIsEpisodeTwo(e2Ep) || tickerHelpers.tickerIsEpisodeTwo(e1Ep)) {
  throw new Error("tickerIsEpisodeTwo should match Episode 2 only");
}
if (tickerHelpers.moneyPutInTotal(e2Season, e2Ep, "week") !== 240.09) {
  throw new Error("Episode 2 week island bar must be $240.09 given");
}
if (tickerHelpers.moneyPutInTotal(e2Season, e2Ep, "season") !== 120) {
  throw new Error("Episode 2 season bar must stay the $120 open");
}
if (tickerHelpers.moneyPutInTotal(e2Season, e1Ep, "week") !== 120) {
  throw new Error("Episode 1 week island bar must stay $120");
}
if (tickerHelpers.tickerSleevePutIn(e2Season, e2Ep, "week") !== 20) {
  throw new Error("Episode 2 week sleeves must start at $20 (original $10 + extra $10)");
}
if (tickerHelpers.tickerSleevePutIn(e2Season, e2Ep, "season") !== 20) {
  throw new Error("Episode 2 season sleeves must start at $20 once the extra $10 is on the books");
}
if (tickerHelpers.tickerSleevePutIn(e2Season, e1Ep, "week") !== 10) {
  throw new Error("Episode 1 week sleeves must stay $10");
}
const e2Week = tickerHelpers.snapshotsInTickerRange(e2Season.snapshots, e2Ep, "week");
if (e2Week.length !== 1 || e2Week[0].id !== "s1e02-cash-add") {
  throw new Error("Episode 2 week must start at s1e02-cash-add, got " + e2Week.map((s) => s.id).join(","));
}
const e1Week = tickerHelpers.snapshotsInTickerRange(
  [
    { id: "s1e01-mon-open", at: "2026-08-24T16:06:00Z" },
    { id: "s1e01-fri-lasthour", at: "2026-08-28T19:14:23Z" },
    { id: "s1e02-cash-add", at: "2026-08-31T16:00:00Z" }
  ],
  e1Ep,
  "week"
);
if (e1Week.length !== 2 || e1Week.some((s) => s.id === "s1e02-cash-add")) {
  throw new Error("Episode 1 week must keep E1 marks and exclude the Episode 2 cash-add");
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
if (!stylesCss.includes(".money-ticker-putin") || !stylesCss.includes(".money-ticker-guide-label")) {
  throw new Error("styles.css missing the even / 0% reference line");
}
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
if (
  !episodeJs.includes("function allowSampleFallback") ||
  !episodeJs.includes("function isEpisodePage") ||
  !episodeJs.includes("allowSampleFallback() && global.CampChat")
) {
  throw new Error("episode pages must not fall back to CampChat sample tapes");
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

if (!appJs.includes("function holdBookWasted") || !appJs.includes('class="hold-wasted"') || !appJs.includes("WASTED")) {
  throw new Error("app.js must stamp a GTA WASTED overlay on Episode 2+ jury books");
}
if (!appJs.includes("wasted ? [] : bookLegs(s)")) {
  throw new Error("wasted books must drop holdings chips and expandable legs");
}
if (!appJs.includes("is-wasted") || !stylesCss.includes(".hold-book.is-wasted") || !stylesCss.includes(".hold-wasted")) {
  throw new Error("styles.css missing Episode 2 wasted book treatment");
}
if (!stylesCss.includes("--font-wasted") || !episodeHtml.includes("family=Anton")) {
  throw new Error("Episode 2 wasted stamp must load Anton for the GTA lettering");
}
const wastedStart = appJs.indexOf("function holdBookWasted");
const wastedEnd = appJs.indexOf("function holdBookHtml");
if (!(wastedStart > -1 && wastedEnd > wastedStart)) {
  throw new Error("app.js missing holdBookWasted before holdBookHtml");
}
const wastedFn = new Function(`
  let pageEp = null;
  function currentPageEpisode() { return pageEp; }
  ${appJs.slice(wastedStart, wastedEnd)}
  return {
    setPage(ep) { pageEp = ep; },
    holdBookWasted
  };
`)();
wastedFn.setPage({ id: "s1e02", number: 2 });
if (!wastedFn.holdBookWasted({ status: "jury" })) {
  throw new Error("Episode 2 jury row must be wasted");
}
if (wastedFn.holdBookWasted({ status: "active" })) {
  throw new Error("living Episode 2 books must keep their numbers");
}
wastedFn.setPage({ id: "s1e01", number: 1 });
if (wastedFn.holdBookWasted({ status: "jury" })) {
  throw new Error("Episode 1 must still show the boot's numbers");
}

console.log("episode campfire checks passed (" + feed.conversations.length + " latest threads)");
