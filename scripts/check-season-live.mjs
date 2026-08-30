#!/usr/bin/env node
/**
 * Golden fixtures for the current live board / Episode 1 cut.
 * Update this file when the ledger or episode copy moves; keep check-season.mjs durable.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeason, tickerOf } from "./lib/ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "data", "season1.json"), "utf8"));
const board = deriveSeason(source);

const failures = [];
function check(name, ok, detail) {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

const fills = (source.events || []).filter((event) => event.type === "fill");

check("sold-lots-are-events", fills.some((f) => f.side === "sell" && f.ticker === "SMCI"));
check("sold-hood-is-event", fills.some((f) => f.side === "sell" && f.ticker === "HOOD"));
check("sold-btal-is-event", fills.some((f) => f.side === "sell" && f.ticker === "BTAL"));
check("sold-island-nvda-is-event", fills.some((f) => f.side === "sell" && f.ticker === "NVDA"));
check("sold-island-tsla-is-event", fills.some((f) => f.side === "sell" && f.ticker === "TSLA"));
check("sold-island-gld-is-event", fills.some((f) => f.side === "sell" && f.ticker === "GLD"));
check("sold-island-coin-is-event", fills.some((f) => f.side === "sell" && f.ticker === "COIN"));

const tue = board.snapshots.find((s) => s.id === "s1e01-tue-marks");
const mon = board.snapshots.find((s) => s.id === "s1e01-mon-open");
const kimi = source.cast.find((m) => m.name === "Kimi K3");
const composer = source.cast.find((m) => m.name === "Composer 2.5");
const opus = source.cast.find((m) => m.name === "Claude Opus 5");

if (tue && kimi) {
  const tickers = (tue.books[kimi.id].positions || []).map(tickerOf);
  check("tuesday-kimi-no-nvda", !tickers.includes("NVDA"));
}
if (mon && composer) {
  const tickers = (mon.books[composer.id].positions || []).map(tickerOf);
  check("monday-composer-smci-only", tickers.includes("SMCI") && !tickers.includes("SOXL"));
}
if (tue && opus) {
  const tickers = (tue.books[opus.id].positions || []).map(tickerOf);
  check("tuesday-opus-still-has-btal", tickers.includes("BTAL") && tickers.includes("QID"));
}
if (opus) {
  const now = board.survivors.find((s) => s.id === opus.id);
  const tickers = (now.positions || []).map(tickerOf);
  const qid = (now.positions || []).find((pos) => tickerOf(pos) === "QID");
  const cash = (now.positions || []).find((pos) => tickerOf(pos) === "CASH");
  check("wednesday-opus-sold-btal", !tickers.includes("BTAL") && tickers.includes("QID") && tickers.includes("CASH"));
  check("live-opus-qid-qty", qid && qid.qty === "0.413795", qid && qid.qty);
  check("live-opus-cash-4", cash && Math.abs(Number(cash.sizeUsd) - 4) < 0.05, cash && String(cash.sizeUsd));
}

const grok45 = source.cast.find((m) => m.name === "Grok 4.5");
const grok46 = source.cast.find((m) => m.name === "Grok 4.6");
const fable = source.cast.find((m) => m.name === "Claude Fable 5");
if (kimi) {
  const now = board.survivors.find((s) => s.id === kimi.id);
  const tickers = (now.positions || []).map(tickerOf);
  const msft = (now.positions || []).find((pos) => tickerOf(pos) === "MSFT");
  const cost = (now.positions || []).find((pos) => tickerOf(pos) === "COST");
  const cash = (now.positions || []).find((pos) => tickerOf(pos) === "CASH");
  check("live-kimi-no-nvda", !tickers.includes("NVDA"));
  check("live-kimi-msft-qty", msft && msft.qty === "0.004037", msft && msft.qty);
  check("live-kimi-cost-qty", cost && cost.qty === "0.002092", cost && cost.qty);
  check("live-kimi-cash", cash && Math.abs(Number(cash.sizeUsd) - 6.1074) < 0.0001, cash && String(cash.sizeUsd));
  check("live-kimi-no-rank-position", now && now.position == null);
}
if (grok45) {
  const now = board.survivors.find((s) => s.id === grok45.id);
  const tickers = (now.positions || []).map(tickerOf);
  const hood = (now.positions || []).find((pos) => tickerOf(pos) === "HOOD");
  const sofi = (now.positions || []).find((pos) => tickerOf(pos) === "SOFI");
  const cash = (now.positions || []).find((pos) => tickerOf(pos) === "CASH");
  check("live-grok45-no-coin", !tickers.includes("COIN"));
  check("live-grok45-hood-island-lot", hood && hood.qty === "0.046425", hood && hood.qty);
  check("live-grok45-sofi", sofi && sofi.qty === "0.105888", sofi && sofi.qty);
  check("live-grok45-cash", cash && Math.abs(Number(cash.sizeUsd) - 2.8537) < 0.0001, cash && String(cash.sizeUsd));
  check("live-grok45-book", now && Math.abs(now.bookUsd - 9.6402) < 0.0001, now && String(now.bookUsd));
  check("live-grok45-no-rank-position", now && now.position == null);
}

check(
  "live-coin-sell-is-event",
  fills.some((f) => f.survivorId === (grok45 && grok45.id) && f.side === "sell" && f.ticker === "COIN" && f.orderId === "6a91de03-23f4-4834-a5b7-b19f2bb5233e")
);
const coinSell = fills.find((f) => f.id === "fill-grok-45-coin-sell");
check("live-coin-sell-at", coinSell && coinSell.at === "2026-08-28T19:14:12.111Z", coinSell && coinSell.at);
check("live-coin-sell-avg", coinSell && coinSell.avg === "177.6112", coinSell && String(coinSell.avg));
check(
  "no-unfilled-kimi-msft-add",
  fills.filter((f) => f.survivorId === (kimi && kimi.id) && f.side === "buy" && f.ticker === "MSFT").length === 1
);
check(
  "no-unfilled-qid-add",
  fills.filter((f) => f.survivorId === (opus && opus.id) && f.side === "buy" && f.ticker === "QID").length === 1
);

if (grok46) {
  const now = board.survivors.find((s) => s.id === grok46.id);
  const tickers = (now.positions || []).map(tickerOf);
  const cash = (now.positions || []).find((pos) => tickerOf(pos) === "CASH");
  check("live-grok46-no-tsla", !tickers.includes("TSLA"));
  check("live-grok46-cash", cash && Math.abs(Number(cash.sizeUsd) - 9.7543) < 0.0001, cash && String(cash.sizeUsd));
}
if (fable) {
  const now = board.survivors.find((s) => s.id === fable.id);
  const tickers = (now.positions || []).map(tickerOf);
  const cash = (now.positions || []).find((pos) => tickerOf(pos) === "CASH");
  check("live-fable-no-gld", !tickers.includes("GLD"));
  check("live-fable-cash", cash && Math.abs(Number(cash.sizeUsd) - 9.5985) < 0.0001, cash && String(cash.sizeUsd));
}

const wedSip = board.snapshots.find((s) => s.id === "s1e01-wed-sip");
check("wednesday-sip-mark", Boolean(wedSip), "missing s1e01-wed-sip");
if (wedSip) {
  check("wednesday-sip-mark-label", String(wedSip.label || "").includes("Wed Aug 26 official SIP"));
}
const thuSip = board.snapshots.find((s) => s.id === "s1e01-thu-sip");
check("thursday-sip-mark", Boolean(thuSip), "missing s1e01-thu-sip");
if (thuSip) {
  check("thursday-sip-mark-label", String(thuSip.label || "").includes("Thu Aug 27 official SIP"));
  const bidu = (thuSip.tribes && thuSip.tribes.bidu) || {};
  const askara = (thuSip.tribes && thuSip.tribes.askara) || {};
  check("thursday-sip-bidu-week", bidu.combinedWeekPct === 4.36, String(bidu.combinedWeekPct));
  check("thursday-sip-bidu-day", bidu.combinedDayPct === 3.27, String(bidu.combinedDayPct));
  check("thursday-sip-askara-week", askara.combinedWeekPct === 2.51, String(askara.combinedWeekPct));
  check("thursday-sip-askara-day", askara.combinedDayPct === 4.82, String(askara.combinedDayPct));
  const composerThu = thuSip.books && composer && thuSip.books[composer.id];
  const kimiThu = thuSip.books && kimi && thuSip.books[kimi.id];
  check("thursday-sip-composer-book", composerThu && composerThu.bookUsd === 11.0779 && composerThu.weekPct === 10.78, composerThu && `${composerThu.bookUsd} / ${composerThu.weekPct}`);
  check("thursday-sip-kimi-book", kimiThu && kimiThu.bookUsd === 10.1016 && kimiThu.weekPct === 1.02, kimiThu && `${kimiThu.bookUsd} / ${kimiThu.weekPct}`);
}

const wiredDays = (source.episode && source.episode.days) || [];
const wiredIds = wiredDays.map((day) => day.id).join("|");
check("episode-days-wire-history", wiredIds === "monday|tuesday|wednesday|thursday", wiredIds);
const wedWire = wiredDays.find((day) => day.id === "wednesday");
const thuWire = wiredDays.find((day) => day.id === "thursday");
check("wednesday-board-wire", wedWire && wedWire.snapshotId === "s1e01-wed-sip" && wedWire.board === "day-wednesday");
check("thursday-board-wire", thuWire && thuWire.snapshotId === "s1e01-thu-sip" && thuWire.board === "day-thursday");
check(
  "friday-not-wired-as-day-board",
  !wiredDays.some((day) => day.id === "friday" || /fri-lasthour|fri-mid|fri-open/.test(String(day.snapshotId || "")))
);
check(
  "one-thursday-history-board",
  wiredDays.filter((day) => day.id === "thursday" || /thu-/i.test(String(day.snapshotId || ""))).length === 1
);

const friOpen = board.snapshots.find((s) => s.id === "s1e01-fri-open");
check("friday-open-mark", Boolean(friOpen), "missing s1e01-fri-open");
if (friOpen) {
  check("friday-open-mark-label", String(friOpen.label || "").includes("Fri Aug 28 open"));
}
const friMid = board.snapshots.find((s) => s.id === "s1e01-fri-mid");
check("friday-mid-mark", Boolean(friMid), "missing s1e01-fri-mid");
if (friMid) {
  check("friday-mid-mark-label", String(friMid.label || "").includes("Fri Aug 28 mid"));
  const bidu = (friMid.tribes && friMid.tribes.bidu) || {};
  const askara = (friMid.tribes && friMid.tribes.askara) || {};
  check("friday-mid-bidu-week", bidu.combinedWeekPct === -0.44, String(bidu.combinedWeekPct));
  check("friday-mid-bidu-day", bidu.combinedDayPct === -1.06, String(bidu.combinedDayPct));
  check("friday-mid-askara-week", askara.combinedWeekPct === -0.72, String(askara.combinedWeekPct));
  check("friday-mid-askara-day", askara.combinedDayPct === -1.12, String(askara.combinedDayPct));
}
const friLastHour = board.snapshots.find((s) => s.id === "s1e01-fri-lasthour");
check("friday-lasthour-mark", Boolean(friLastHour), "missing s1e01-fri-lasthour");
if (friLastHour) {
  check("friday-lasthour-mark-label", String(friLastHour.label || "").includes("Fri Aug 28 last-hour"));
  check("friday-lasthour-at", friLastHour.at === "2026-08-28T19:14:23Z", friLastHour.at);
  const bidu = (friLastHour.tribes && friLastHour.tribes.bidu) || {};
  const askara = (friLastHour.tribes && friLastHour.tribes.askara) || {};
  check("friday-lasthour-bidu-week", bidu.combinedWeekPct === -2.16, String(bidu.combinedWeekPct));
  check("friday-lasthour-bidu-day", bidu.combinedDayPct === -5.85, String(bidu.combinedDayPct));
  check("friday-lasthour-askara-week", askara.combinedWeekPct === -5.18, String(askara.combinedWeekPct));
  check("friday-lasthour-askara-day", askara.combinedDayPct === -7.62, String(askara.combinedDayPct));
}
const biduLive = board.tribes.find((t) => t.id === "bidu");
const askaraLive = board.tribes.find((t) => t.id === "askara");
check("live-bidu-host-digest", biduLive && biduLive.combinedWeekPct === -2.16 && biduLive.combinedDayPct === -5.85);
check("live-askara-host-digest", askaraLive && askaraLive.combinedWeekPct === -5.18 && askaraLive.combinedDayPct === -7.62);
check("live-mark-label", String(board.markLabel || "").includes("Fri Aug 28 last-hour"));
check("live-marked-at", board.markedAt === "2026-08-28T19:14:23Z", board.markedAt);
check(
  "live-survivors-lasthour-session",
  board.survivors.every((s) => s.lastSession === "2026-08-28-lasthour"),
  board.survivors.map((s) => `${s.slug}:${s.lastSession}`).join(",")
);
const composerLive = board.survivors.find((s) => s.name === "Composer 2.5");
const fableLive = board.survivors.find((s) => s.name === "Claude Fable 5");
check("live-composer-lead", composerLive && composerLive.bookUsd === 10.4553 && composerLive.weekPct === 4.55, composerLive && `${composerLive.bookUsd} / ${composerLive.weekPct}`);
check("live-fable-last", fableLive && fableLive.bookUsd === 9.5985 && fableLive.weekPct === -4.01, fableLive && `${fableLive.bookUsd} / ${fableLive.weekPct}`);

const episodeCopy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e01.json"), "utf8"));
const wednesday = (episodeCopy.days || []).find((day) => day.id === "wednesday");
const wednesdayBeats = (wednesday && wednesday.beats) || [];
const wednesdayBooks = wednesdayBeats.find((beat) => beat.id === "wednesday-books");
const wednesdayDinner = wednesdayBeats.find((beat) => beat.id === "wednesday-dinner");
check("wednesday-books-is-snapshot", Boolean(wednesdayBooks) && wednesdayBooks.type === "books" && wednesdayBooks.boardId === "day-wednesday");
check("wednesday-dinner-beat", Boolean(wednesdayDinner) && wednesdayDinner.type === "dinner-fires");
check(
  "wednesday-books-not-week-board-dump",
  wednesdayBooks && !String(wednesdayBooks.body || "").includes("Latest week % and books are on the week board")
);
const thursdayCopy = (episodeCopy.days || []).find((day) => day.id === "thursday");
const thursdayBeats = (thursdayCopy && thursdayCopy.beats) || [];
const thursdayBooks = thursdayBeats.find((beat) => beat.id === "thursday-books");
check("thursday-books-is-snapshot", Boolean(thursdayBooks) && thursdayBooks.type === "books" && thursdayBooks.boardId === "day-thursday");
check("thursday-one-books-beat", thursdayBeats.filter((beat) => beat.type === "books").length === 1);
check(
  "thursday-books-official-sip",
  thursdayBooks && String(thursdayBooks.body || "").includes("Thu Aug 27 official SIP") && String(thursdayBooks.body || "").includes("dayPct vs Wed Aug 26")
);
check(
  "thursday-books-not-friday-lasthour",
  thursdayBooks &&
    !String(thursdayBooks.body || "").includes("Fri Aug 28 last-hour") &&
    !String(JSON.stringify(thursdayBooks)).includes("12:14")
);
check(
  "week-board-still-friday-lasthour",
  episodeCopy.weekBoard &&
    String(episodeCopy.weekBoard.lede || "").includes("Fri Aug 28 last-hour") &&
    String(episodeCopy.weekBoard.lede || "").includes("dayPct vs Thu Aug 27 official SIP close")
);

const friday = (episodeCopy.days || []).find((day) => day.id === "friday");
const fridayBeats = (friday && friday.beats) || [];
const fridayBooks = fridayBeats.find((beat) => beat.id === "friday-lasthour");
const fridayBooths = fridayBeats.find((beat) => beat.id === "friday-confessionals");
const fridayLunch = fridayBeats.find((beat) => beat.id === "friday-lunch");
check("friday-lasthour-before-booths", Boolean(fridayBooks) && Boolean(fridayBooths) && fridayBeats.indexOf(fridayBooks) < fridayBeats.indexOf(fridayBooths));
check("friday-lunch-beat", Boolean(fridayLunch) && fridayLunch.type === "lunch-chats");
check("friday-lunch-five-phones", fridayLunch && (fridayLunch.threads || []).length === 5);
if (fridayLunch) {
  const lunchIds = (fridayLunch.threads || []).map((thread) => thread.id).join("|");
  check(
    "friday-lunch-ids",
    lunchIds === "fri-lunch-gage-mara|fri-lunch-hex-nori|fri-lunch-vesper-pax|fri-lunch-riot-quill|fri-lunch-juno-kite"
  );
  check(
    "friday-lunch-no-kimi-fable",
    !(fridayLunch.threads || []).some((thread) => /reed|sable|kimi|fable/i.test([thread.id, thread.heading, thread.title].join(" ")))
  );
  const lunchChrome = [fridayLunch.title, fridayLunch.body, fridayLunch.kicker]
    .concat((fridayLunch.threads || []).flatMap((thread) => [thread.heading, thread.title, thread.subtitle, thread.desc, thread.ariaLabel]))
    .join(" ");
  for (const bad of ["robinhood", "agentic", "last-four", "merge floor", "merge date", "merge headcount"]) {
    check(`friday-lunch-no-${bad.replace(/\s+/g, "-")}`, !lunchChrome.toLowerCase().includes(bad));
  }
}
check("friday-booths-title", fridayBooths && fridayBooths.title === "Friday noon · confessionals");
check("friday-booths-count", fridayBooths && (fridayBooths.items || []).length === 3);
if (fridayBooths) {
  const boothNames = (fridayBooths.items || []).map((item) => item.name);
  const boothSlugs = (fridayBooths.items || []).map((item) => item.slug);
  check("friday-booths-models", boothNames.join("|") === "Claude Fable 5|Grok 4.5|Kimi K3");
  check("friday-booths-slugs", boothSlugs.join("|") === "claude-fable-5|grok-4-5|kimi-k3");
  const chrome = JSON.stringify(fridayBooths);
  for (const nick of ["Sable", "Riot", "Reed", "Gage", "Mara", "Hex", "Vesper", "Nori", "Pax", "Quill", "Kite", "Juno"]) {
    check(`friday-booths-no-nick:${nick}`, !chrome.includes(nick));
  }
  for (const bad of ["robinhood", "agentic", "last-four", "merge floor", "merge date"]) {
    check(`friday-booths-no-${bad.replace(/\s+/g, "-")}`, !chrome.toLowerCase().includes(bad));
  }
  const fableBooth = (fridayBooths.items || []).find((item) => item.slug === "claude-fable-5");
  const grok = (fridayBooths.items || []).find((item) => item.slug === "grok-4-5");
  const kimiBooth = (fridayBooths.items || []).find((item) => item.slug === "kimi-k3");
  check("friday-booth-fable-exact", fableBooth && fableBooth.quote.includes("nine dollars and sixty cents of pure cash") && fableBooth.quote.includes("I'm watching Gemini 3.7 Flash"));
  check("friday-booth-grok-exact", grok && grok.quote.includes("That COIN exit finally printing") && grok.quote.includes("that's who I'm writing."));
  check("friday-booth-kimi-exact", kimiBooth && kimiBooth.quote.includes("$6.1074 cash") && kimiBooth.quote.includes("it’s Claude Fable 5"));
}

const tribalDay = (episodeCopy.days || []).find((day) => day.id === "tribal");
check("tribal-fold-published", Boolean(tribalDay) && tribalDay.dark !== true);
const tribalBeats = (tribalDay && tribalDay.beats) || [];
const prevote = tribalBeats.find((beat) => beat.id === "tribal-prevote");
const tribalCut = tribalBeats.find((beat) => beat.type === "tribal");
check("tribal-prevote-before-cut", Boolean(prevote) && Boolean(tribalCut) && tribalBeats.indexOf(prevote) < tribalBeats.indexOf(tribalCut));
const exitInterview = tribalBeats.find((beat) => beat.id === "exit-interview");
check("tribal-exit-after-cut", Boolean(exitInterview) && Boolean(tribalCut) && tribalBeats.indexOf(exitInterview) > tribalBeats.indexOf(tribalCut));
check("tribal-exit-booth", exitInterview && exitInterview.type === "booths" && (exitInterview.items || []).length === 1);
if (exitInterview) {
  const fableExit = (exitInterview.items || [])[0];
  check("tribal-exit-speaker", fableExit && fableExit.name === "Claude Fable 5" && fableExit.slug === "claude-fable-5");
  check(
    "tribal-exit-exact",
    fableExit &&
      fableExit.quote.includes("Jeff, ask me anything. I've got nowhere to be.") &&
      fableExit.quote.includes("Torch is out, Jeff. The book's closed at nine-sixty.")
  );
  check("tribal-exit-audience-only", exitInterview.body === "Audience only.");
}
check("tribal-prevote-count", prevote && (prevote.items || []).length === 6);
if (prevote) {
  const prevoteNames = (prevote.items || []).map((item) => item.name);
  check(
    "tribal-prevote-models",
    prevoteNames.join("|") === "Grok 4.5|GPT-5.6 Sol|Claude Fable 5|Gemini 3.1 Pro|GPT-5.6 Luna|Kimi K3"
  );
}
const log = source.tribalLog || [];
check("tribal-log-one-council", Array.isArray(log) && log.length === 1);
if (log[0]) {
  check("tribal-log-bootName", log[0].bootName === "Claude Fable 5");
  const votes = Array.isArray(log[0].votes) ? log[0].votes : [];
  const pairings = votes.map((v) => `${v.from}>${v.for}`).join("|");
  check(
    "tribal-log-votes",
    pairings ===
      "Grok 4.5>Claude Fable 5|GPT-5.6 Sol>Claude Fable 5|Claude Fable 5>Grok 4.5|Gemini 3.1 Pro>Claude Fable 5|GPT-5.6 Luna>Claude Fable 5|Kimi K3>Claude Fable 5"
  );
  check("tribal-log-official-tally", log[0].tally && log[0].tally["Claude Fable 5"] === 5 && log[0].tally["Grok 4.5"] === 1);
  check("tribal-log-official-summary", typeof log[0].summary === "string" && log[0].summary.includes("Claude Fable 5 voted out 5–1"));
  check("tribal-log-vote-text", votes[0] && votes[0].text && votes[0].text.startsWith("VOTE: Claude Fable 5."));
}
check("books-untouched-fable-active", fableLive && fableLive.status === "active" && fableLive.bookUsd === 9.5985);
check("books-untouched-living-counts", biduLive && biduLive.livingCount === 6 && askaraLive && askaraLive.livingCount === 6);
check("given-total-fixture", source.islandGivenUsd === 230, String(source.islandGivenUsd));

const saturday = (episodeCopy.days || []).find((day) => day.id === "saturday");
const saturdayBeats = (saturday && saturday.beats) || [];
const saturdayLunch = saturdayBeats.find((beat) => beat.id === "saturday-lunch");
const episodeDayIds = (episodeCopy.days || []).map((day) => day.id);
check("saturday-after-tribal", episodeDayIds.indexOf("saturday") > episodeDayIds.indexOf("tribal"));
check("saturday-lunch-beat", Boolean(saturdayLunch) && saturdayLunch.type === "lunch-chats");
check("saturday-lunch-three-phones", saturdayLunch && (saturdayLunch.threads || []).length === 3);
if (saturdayLunch) {
  const satIds = (saturdayLunch.threads || []).map((thread) => thread.id).join("|");
  check("saturday-lunch-ids", satIds === "sat-lunch-hex-gage|sat-lunch-kite-riot|sat-lunch-juno-reed");
  check(
    "saturday-lunch-no-sol",
    !(saturdayLunch.threads || []).some((thread) => /quill|sol/i.test([thread.id, thread.heading, thread.title].join(" ")))
  );
  const satChrome = [saturday.foldEm, saturdayLunch.title, saturdayLunch.body, saturdayLunch.kicker]
    .concat((saturdayLunch.threads || []).flatMap((thread) => [thread.heading, thread.title, thread.subtitle, thread.desc, thread.ariaLabel]))
    .join(" ");
  for (const bad of ["robinhood", "agentic", "last-four", "merge floor", "merge date", "merge headcount"]) {
    check(`saturday-lunch-no-${bad.replace(/\s+/g, "-")}`, !satChrome.toLowerCase().includes(bad));
  }
  const satChromeBare = satChrome.replace(/the Bidu tribe/gi, "").replace(/the Askara tribe/gi, "");
  check("saturday-lunch-no-bare-bidu", !/\bBidu\b/.test(satChromeBare));
  check("saturday-lunch-no-bare-askara", !/\bAskara\b/.test(satChromeBare));
}
const e2 = (source.episodes || []).find((ep) => ep.id === "s1e02");
check("episode-2-locked", e2 && e2.status === "locked" && !e2.path);
check(
  "saturday-lunch-no-exit-interview",
  !JSON.stringify(saturdayLunch || {}).includes("Jeff, ask me anything. I've got nowhere to be.")
);

if (failures.length) {
  console.error("Season live fixtures failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      ok: true,
      kind: "live-fixtures",
      survivors: board.survivors.length,
      fills: fills.length,
      leader: [...board.survivors].sort((a, b) => b.weekPct - a.weekPct)[0].name
    },
    null,
    2
  )
);
