#!/usr/bin/env node
/**
 * Golden fixtures for the current live board / Episode 2 cut.
 * Update this file when the ledger or episode copy moves; keep check-season.mjs durable.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeason, tickerOf, isBoardNative, castFromSource } from "./lib/ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "data", "season1.json"), "utf8"));
const board = deriveSeason(source);
const boardNative = isBoardNative(source);
const cast = castFromSource(source);

const failures = [];
function check(name, ok, detail) {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

const fills = (source.events || []).filter((event) => event.type === "fill");

function cashTotal(positions) {
  return (positions || [])
    .filter((pos) => tickerOf(pos) === "CASH")
    .reduce((sum, pos) => sum + (Number(pos.sizeUsd) || 0), 0);
}

function positionOrder(positions, ticker, orderId) {
  return (positions || []).some((pos) => tickerOf(pos) === ticker && pos.orderId === orderId);
}

if (!boardNative) {
check("sold-lots-are-events", fills.some((f) => f.side === "sell" && f.ticker === "SMCI"));
check("sold-hood-is-event", fills.some((f) => f.side === "sell" && f.ticker === "HOOD"));
check("sold-btal-is-event", fills.some((f) => f.side === "sell" && f.ticker === "BTAL"));
check("sold-island-nvda-is-event", fills.some((f) => f.side === "sell" && f.ticker === "NVDA"));
check("sold-island-tsla-is-event", fills.some((f) => f.side === "sell" && f.ticker === "TSLA"));
check("sold-island-gld-is-event", fills.some((f) => f.side === "sell" && f.ticker === "GLD"));
check("sold-island-coin-is-event", fills.some((f) => f.side === "sell" && f.ticker === "COIN"));
}

const tue = board.snapshots.find((s) => s.id === "s1e01-tue-marks");
const mon = board.snapshots.find((s) => s.id === "s1e01-mon-open");
check("ticker-mon-open", Boolean(mon), "missing s1e01-mon-open");
check("ticker-tue-marks", Boolean(tue), "missing s1e01-tue-marks");
check(
  "ticker-live-open",
  board.snapshots.some((s) => s.id === "s1e02-mon-open"),
  "missing s1e02-mon-open"
);
const listedE1 = (board.episodes || []).find((ep) => ep && ep.id === "s1e01");
const listedE2 = (board.episodes || []).find((ep) => ep && ep.id === "s1e02");
check("e1-week-bounds", listedE1 && listedE1.weekStart === "2026-08-24" && listedE1.weekEnd === "2026-08-28");
check("e2-week-bounds", listedE2 && listedE2.weekStart === "2026-08-31" && listedE2.weekEnd === "2026-09-04");
check(
  "e2-diagram-starts-at-cash-add",
  listedE2 && listedE2.diagramStartSnapshotId === "s1e02-cash-add" && source.episode && source.episode.diagramStartSnapshotId === "s1e02-cash-add"
);
if (listedE1 && listedE1.weekStart && listedE1.weekEnd) {
  const start = Date.parse(listedE1.weekStart + "T00:00:00-07:00");
  const end = Date.parse(listedE1.weekEnd + "T23:59:59-07:00");
  const inWeek = board.snapshots.filter((snap) => {
    const t = Date.parse(snap.at);
    return !Number.isNaN(t) && t >= start && t <= end;
  });
  check("e1-week-has-history", inWeek.some((s) => s.id === "s1e01-mon-open") && inWeek.some((s) => s.id === "s1e01-fri-lasthour"));
  check("e1-week-excludes-e2-live", !inWeek.some((s) => s.id === "s1e02-mon-open" || s.id === "s1e02-mon-mid"));
  check("e1-week-enough-frames", inWeek.length >= 6, String(inWeek.length));
}
const kimi = cast.find((m) => m.name === "Kimi K3");
const composer = cast.find((m) => m.name === "Composer 2.5");
const opus = cast.find((m) => m.name === "Claude Opus 5");

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
  check("wednesday-opus-sold-btal", !tickers.includes("BTAL") && !tickers.includes("QID") && tickers.includes("XLE") && tickers.includes("CASH"));
  check("live-opus-no-qid", !tickers.includes("QID"));
  check("live-opus-no-oih", !tickers.includes("OIH"));
  check("live-opus-cash", Math.abs(cashTotal(now.positions) - 0.0382) < 0.01, String(cashTotal(now.positions)));
  const opusXle = (now.positions || []).find((pos) => tickerOf(pos) === "XLE");
  check("live-opus-xle-qty", opusXle && opusXle.qty === "0.082785", opusXle && opusXle.qty);
  check("live-opus-mpc-qty", (now.positions || []).some((pos) => tickerOf(pos) === "MPC" && pos.qty === "0.012262"));
  check("live-opus-lng-qty", (now.positions || []).some((pos) => tickerOf(pos) === "LNG" && pos.qty === "0.012117"));
}

const grok45 = cast.find((m) => m.name === "Grok 4.5");
const grok46 = cast.find((m) => m.name === "Grok 4.6");
const fable = cast.find((m) => m.name === "Claude Fable 5");
if (kimi) {
  const now = board.survivors.find((s) => s.id === kimi.id);
  const tickers = (now.positions || []).map(tickerOf);
  const msft = (now.positions || []).find((pos) => tickerOf(pos) === "MSFT");
  const cost = (now.positions || []).find((pos) => tickerOf(pos) === "COST");
  const cash = (now.positions || []).find((pos) => tickerOf(pos) === "CASH");
  check("live-kimi-no-nvda", !tickers.includes("NVDA"));
  check("live-kimi-no-msft", !tickers.includes("MSFT"));
  check("live-kimi-no-cost", !tickers.includes("COST"));
  check("live-kimi-cash", Math.abs(cashTotal(now.positions) - 6.0625) < 0.01, String(cashTotal(now.positions)));
  const cvxLots = (now.positions || []).filter((pos) => tickerOf(pos) === "CVX");
  check("live-kimi-cvx-qty", cvxLots.length === 3 && cvxLots.some((pos) => pos.qty === "0.014600") && cvxLots.some((pos) => pos.qty === "0.048792") && cvxLots.some((pos) => pos.qty === "0.024190"));
  check("live-kimi-no-rank-position", now && now.position == null);
}
if (grok45) {
  const now = board.survivors.find((s) => s.id === grok45.id);
  const tickers = (now.positions || []).map(tickerOf);
  const xom45 = (now.positions || []).find((pos) => tickerOf(pos) === "XOM");
  check("live-grok45-no-coin", !tickers.includes("COIN"));
  check("live-grok45-no-hood", !tickers.includes("HOOD"));
  check("live-grok45-no-xle", !tickers.includes("XLE"));
  check("live-grok45-no-sofi", !tickers.includes("SOFI"));
  check("live-grok45-xom-qty", xom45 && xom45.qty === "0.062625", xom45 && xom45.qty);
  const uso45 = (now.positions || []).filter((pos) => tickerOf(pos) === "USO");
  check(
    "live-grok45-uso-qty",
    uso45.length === 2 && uso45.some((pos) => pos.qty === "0.036739") && uso45.some((pos) => pos.qty === "0.061193")
  );
  check("live-grok45-cash", Math.abs(cashTotal(now.positions) - 0.096) < 0.01, String(cashTotal(now.positions)));
  check("live-grok45-book", now && Math.abs(now.bookUsd - 24.3646) < 0.0001, now && String(now.bookUsd));
  check("live-grok45-no-rank-position", now && now.position == null);
}

if (!boardNative) {
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
}

if (grok46) {
  const now = board.survivors.find((s) => s.id === grok46.id);
  const tickers = (now.positions || []).map(tickerOf);
  const xle = (now.positions || []).find((pos) => tickerOf(pos) === "XLE");
  const cash = (now.positions || []).find((pos) => tickerOf(pos) === "CASH");
  const uso = (now.positions || []).find((pos) => tickerOf(pos) === "USO");
  check("live-grok46-no-tsla", !tickers.includes("TSLA"));
  check("live-grok46-no-xle", !tickers.includes("XLE"));
  const usoLots = (now.positions || []).filter((pos) => tickerOf(pos) === "USO");
  check(
    "live-grok46-uso-qty",
    usoLots.length === 2 &&
      usoLots.some((pos) => pos.qty === "0.075070") &&
      usoLots.some((pos) => pos.qty === "0.070478")
  );
  check("live-grok46-cash", cash && Math.abs(Number(cash.sizeUsd) - 0.1038) < 0.0001, cash && String(cash.sizeUsd));
  check("live-grok46-book", now && Math.abs(now.bookUsd - 20.8531) < 0.0001, now && String(now.bookUsd));
}
if (fable) {
  const now = board.survivors.find((s) => s.id === fable.id);
  const tickers = (now.positions || []).map(tickerOf);
  const cash = (now.positions || []).find((pos) => tickerOf(pos) === "CASH");
  check("live-fable-no-gld", !tickers.includes("GLD"));
  check("live-fable-cash", cash && Math.abs(Number(cash.sizeUsd) - 0) < 0.0001, cash && String(cash.sizeUsd));
  check("live-fable-book-zero", now && now.bookUsd === 0, now && String(now.bookUsd));
  check("live-fable-jury", now && now.status === "jury");
}

const wedSip = board.snapshots.find((s) => s.id === "s1e01-wed-sip");
if (!boardNative) {
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

  const e1Listed = (source.episodes || []).find((ep) => ep.id === "s1e01");
  const wiredDays = (e1Listed && e1Listed.days) || [];
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
}

const biduLive = board.tribes.find((t) => t.id === "bidu");
const askaraLive = board.tribes.find((t) => t.id === "askara");
check("live-bidu-host-digest", biduLive && biduLive.combinedWeekPct === 2.45 && biduLive.combinedDayPct === 0.29);
check("live-askara-host-digest", askaraLive && askaraLive.combinedWeekPct === 0.2 && askaraLive.combinedDayPct === 0.25);
check("live-mark-label", board.markLabel === "Thu Sep 3 open · last trade");
check("source-mark-label", source.markLabel === "Thu Sep 3 open · last trade");
check("live-marked-at", board.markedAt === "2026-09-03T14:13:42Z", board.markedAt);
check("no-invented-friday-sip", !(source.events || []).some((event) => event && event.type === "mark" && /fri.*sip/i.test(String(event.id || ""))));
check(
  "live-survivors-open-session",
  board.survivors
    .filter((s) => s.status === "active")
    .every((s) => s.lastSession === "2026-09-03-open"),
  board.survivors.map((s) => `${s.slug}:${s.lastSession}`).join(",")
);
const composerLive = board.survivors.find((s) => s.name === "Composer 2.5");
const fableLive = board.survivors.find((s) => s.name === "Claude Fable 5");
const sonnetLive = board.survivors.find((s) => s.name === "Claude Sonnet 5");
const opusLive = board.survivors.find((s) => s.name === "Claude Opus 5");
const grok46Live = board.survivors.find((s) => s.name === "Grok 4.6");
const geminiProLive = board.survivors.find((s) => s.name === "Gemini 3.1 Pro");
check("live-grok46-lead", grok46Live && grok46Live.bookUsd === 20.8531 && grok46Live.weekPct === 5.56, grok46Live && `${grok46Live.bookUsd} / ${grok46Live.weekPct}`);
check("live-pro-worst", geminiProLive && geminiProLive.weekPct === -5.04, geminiProLive && String(geminiProLive.weekPct));
check(
  "live-pro-cash",
  geminiProLive && Math.abs(cashTotal(geminiProLive.positions) - 0.4209) < 0.0001,
  geminiProLive && String(cashTotal(geminiProLive.positions))
);
check("kept-wed-lasthour-mark", (source.events || []).some((event) => event && event.id === "s1e02-wed-lasthour"));
check("kept-wed-open-mark", (source.events || []).some((event) => event && event.id === "s1e02-wed-open"));
check("kept-thu-open-mark", (source.events || []).some((event) => event && event.id === "s1e02-thu-open"));
check("live-fable-last", fableLive && fableLive.bookUsd === 0 && fableLive.weekPct === -4.01, fableLive && `${fableLive.bookUsd} / ${fableLive.weekPct}`);

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
check(
  "week-board-snapshot-lasthour",
  episodeCopy.weekBoard && episodeCopy.weekBoard.snapshotId === "s1e01-fri-lasthour",
  episodeCopy.weekBoard && String(episodeCopy.weekBoard.snapshotId)
);
const e1Listed = (source.episodes || []).find((ep) => ep && ep.id === "s1e01");
check(
  "e1-week-board-snapshot-id",
  e1Listed && e1Listed.weekBoardSnapshotId === "s1e01-fri-lasthour",
  e1Listed && String(e1Listed.weekBoardSnapshotId)
);
const friLastHourBooks = board.snapshots.find((s) => s.id === "s1e01-fri-lasthour");
const fableLastHour = friLastHourBooks && fable && friLastHourBooks.books && friLastHourBooks.books[fable.id];
check(
  "e1-week-board-fable-book",
  fableLastHour && fableLastHour.bookUsd === 9.5985 && fableLastHour.weekPct === -4.01,
  fableLastHour && `${fableLastHour.bookUsd} / ${fableLastHour.weekPct}`
);

const friday = (episodeCopy.days || []).find((day) => day.id === "friday");
const fridayBeats = (friday && friday.beats) || [];
const fridayBooks = fridayBeats.find((beat) => beat.id === "friday-lasthour");
const fridayBooths = fridayBeats.find((beat) => beat.id === "friday-confessionals");
const fridayLunch = fridayBeats.find((beat) => beat.id === "friday-lunch");
check(
  "friday-booths-before-lunch",
  Boolean(fridayBooths) && Boolean(fridayLunch) && fridayBeats.indexOf(fridayBooths) < fridayBeats.indexOf(fridayLunch)
);
check(
  "friday-lunch-before-lasthour",
  Boolean(fridayLunch) && Boolean(fridayBooks) && fridayBeats.indexOf(fridayLunch) < fridayBeats.indexOf(fridayBooks)
);
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
  check(
    "tribal-exit-teaser-source",
    fableExit &&
      fableExit.quote.includes("How did it feel? Honestly, quieter than I expected.") &&
      fableExit.quote.includes("the market went quiet Friday.")
  );
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
check("books-fable-jury-zero", fableLive && fableLive.status === "jury" && fableLive.bookUsd === 0);
check("books-living-counts", biduLive && biduLive.livingCount === 6 && askaraLive && askaraLive.livingCount === 5);
check("given-total-fixture", source.islandGivenUsd === 240.09, String(source.islandGivenUsd));
check("given-start-fixture", source.islandGivenStartUsd === 120, String(source.islandGivenStartUsd));
check("board-given-start-fixture", board.islandGivenStartUsd === 120, String(board.islandGivenStartUsd));
check("e2-top-up-each-fixture", source.islandEpisode2TopUpEachUsd === 10 && board.islandEpisode2TopUpEachUsd === 10);
check("episode2-raise-printed", source.islandEpisode2RaisePrintedUsd === 110.3, String(source.islandEpisode2RaisePrintedUsd));
check("episode2-leftover", source.islandEpisode2LeftoverUsd === 0.3, String(source.islandEpisode2LeftoverUsd));
check("episode2-shortfall-zero", source.islandEpisode2ShortfallUsd === 0, String(source.islandEpisode2ShortfallUsd));
check(
  "episode2-given-note-raise",
  typeof source.islandGivenNote === "string" &&
    source.islandGivenNote.includes("$110.30 vs $110 target") &&
    source.islandGivenNote.includes("30 cents leftover, not a 12th book") &&
    source.islandGivenNote.includes("Living virtual sleeves credited $10 cash each anyway")
);
const home = readFileSync(join(root, "templates", "island.html"), "utf8");
check("homepage-given-copy", home.includes("$240.09 given. Eleven still in. Two tribes. Tuesday and Friday tribal."));
check("homepage-points-at-e02", home.includes("seasons/1/e02.html") && home.includes("Walk into Episode 2"));
check("sleeve-pot-stays-240", source.islandPotUsd === 240.09, String(source.islandPotUsd));
check("merged-stays-false", source.merged === false);
check("status-label-e02", source.statusLabel === "Live · S1E02 · open remake Sep 3");
check("live-episode-is-e02", source.episode && source.episode.id === "s1e02" && source.episode.status === "live" && source.episode.path === "seasons/1/e02.html");
check("live-episode-week", source.episode && source.episode.weekLabel === "Monday Aug 31 – Friday Sep 4, 2026");
check("live-episode-tribal", source.episode && source.episode.tribalLabel === "Friday Sep 4, 2026 · 7:00 PM PT");

const saturday = (episodeCopy.days || []).find((day) => day.id === "saturday");
const saturdayBeats = (saturday && saturday.beats) || [];
const saturdayLunch = saturdayBeats.find((beat) => beat.id === "saturday-lunch");
const saturdayDinner = saturdayBeats.find((beat) => beat.id === "saturday-dinner");
const episodeDayIds = (episodeCopy.days || []).map((day) => day.id);
check("saturday-after-tribal", episodeDayIds.indexOf("saturday") > episodeDayIds.indexOf("tribal"));
check("saturday-lunch-beat", Boolean(saturdayLunch) && saturdayLunch.type === "lunch-chats");
check("saturday-lunch-three-phones", saturdayLunch && (saturdayLunch.threads || []).length === 3);
check("saturday-dinner-beat", Boolean(saturdayDinner) && saturdayDinner.type === "dinner-fires");
check(
  "saturday-dinner-after-lunch",
  Boolean(saturdayLunch && saturdayDinner) &&
    saturdayBeats.indexOf(saturdayLunch) < saturdayBeats.indexOf(saturdayDinner)
);
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
if (saturdayDinner) {
  const dinnerIds = (saturdayDinner.threads || []).map((thread) => thread.id).join("|");
  check("saturday-dinner-ids", dinnerIds === "bidu-sat-dinner-fire|askara-sat-dinner-fire");
  check("saturday-dinner-two-fires", (saturdayDinner.threads || []).length === 2);
  check("saturday-dinner-audience-only", saturdayDinner.audienceCut === "Audience only");
  const dinnerChrome = [saturdayDinner.title, saturdayDinner.body, saturdayDinner.kicker]
    .concat((saturdayDinner.threads || []).flatMap((thread) => [thread.heading, thread.title, thread.subtitle, thread.desc, thread.ariaLabel]))
    .join(" ");
  for (const bad of ["robinhood", "agentic", "last-four", "merge floor", "merge date", "merge headcount"]) {
    check(`saturday-dinner-no-${bad.replace(/\s+/g, "-")}`, !dinnerChrome.toLowerCase().includes(bad));
  }
  const dinnerChromeBare = dinnerChrome.replace(/the Bidu tribe/gi, "").replace(/the Askara tribe/gi, "");
  check("saturday-dinner-no-bare-bidu", !/\bBidu\b/.test(dinnerChromeBare));
  check("saturday-dinner-no-bare-askara", !/\bAskara\b/.test(dinnerChromeBare));
}
const e1 = (source.episodes || []).find((ep) => ep.id === "s1e01");
const e2 = (source.episodes || []).find((ep) => ep.id === "s1e02");
const e3 = (source.episodes || []).find((ep) => ep.id === "s1e03");
check("episode-1-closed", e1 && e1.status === "closed" && e1.path === "seasons/1/e01.html" && e1.boot === "Claude Fable 5");
check("episode-1-week-bounds", e1 && e1.weekStart === "2026-08-24" && e1.weekEnd === "2026-08-28");
check(
  "episode-1-list-tease-no-boot",
  e1 && (!e1.tease || (typeof e1.tease === "string" && !/fable|5–1|5-1|juror|voted out/i.test(e1.tease)))
);
check("episode-2-live", e2 && e2.status === "live" && e2.path === "seasons/1/e02.html");
check("episode-2-week-bounds", e2 && e2.weekStart === "2026-08-31" && e2.weekEnd === "2026-09-04");
check(
  "episode-2-monday-wire",
  (() => {
    const episode2Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e02.json"), "utf8"));
    const monday = (episode2Copy.days || []).find((day) => day.id === "monday");
    return Boolean(monday && monday.snapshotId === "s1e02-mon-lasthour" && monday.beats?.some((beat) => beat.id === "monday-books"));
  })()
);
check("episode-3-locked", e3 && e3.status === "locked" && !e3.path);
check(
  "saturday-lunch-no-exit-interview",
  !JSON.stringify(saturdayLunch || {}).includes("Jeff, ask me anything. I've got nowhere to be.")
);

const sunday = (episodeCopy.days || []).find((day) => day.id === "sunday");
const sundayBeats = (sunday && sunday.beats) || [];
const sundayLunch = sundayBeats.find((beat) => beat.id === "sunday-lunch");
check("sunday-after-saturday", episodeDayIds.indexOf("sunday") > episodeDayIds.indexOf("saturday"));
check("sunday-after-tribal", episodeDayIds.indexOf("sunday") > episodeDayIds.indexOf("tribal"));
check("sunday-lunch-beat", Boolean(sundayLunch) && sundayLunch.type === "lunch-chats");
check("sunday-lunch-three-phones", sundayLunch && (sundayLunch.threads || []).length === 3);
if (sundayLunch) {
  const sunIds = (sundayLunch.threads || []).map((thread) => thread.id).join("|");
  check("sunday-lunch-ids", sunIds === "sun-lunch-mara-hex|sun-lunch-gage-vesper|sun-lunch-kite-riot");
  check(
    "sunday-lunch-no-held-off",
    !(sundayLunch.threads || []).some((thread) =>
      /quill|sol|juno|reed|kimi|luna|fable|flash|terra/i.test([thread.id, thread.heading, thread.title].join(" "))
    )
  );
  const sunChrome = [sunday.foldEm, sundayLunch.title, sundayLunch.body, sundayLunch.kicker]
    .concat((sundayLunch.threads || []).flatMap((thread) => [thread.heading, thread.title, thread.subtitle, thread.desc, thread.ariaLabel]))
    .join(" ");
  for (const bad of ["robinhood", "agentic", "last-four", "merge floor", "merge date", "merge headcount"]) {
    check(`sunday-lunch-no-${bad.replace(/\s+/g, "-")}`, !sunChrome.toLowerCase().includes(bad));
  }
  const sunChromeBare = sunChrome.replace(/the Bidu tribe/gi, "").replace(/the Askara tribe/gi, "");
  check("sunday-lunch-no-bare-bidu", !/\bBidu\b/.test(sunChromeBare));
  check("sunday-lunch-no-bare-askara", !/\bAskara\b/.test(sunChromeBare));
  check(
    "sunday-lunch-no-exit-interview",
    !JSON.stringify(sundayLunch || {}).includes("Jeff, ask me anything. I've got nowhere to be.")
  );
}

const cashAdd = board.snapshots.find((s) => s.id === "s1e02-cash-add");
check("cash-add-snapshot", Boolean(cashAdd), "missing s1e02-cash-add");
check("cash-add-given", Boolean(cashAdd && cashAdd.givenUsd === 240.09), cashAdd && String(cashAdd.givenUsd));
const cashAddEvent = (source.events || []).find((event) => event && event.id === "s1e02-cash-add");
check("cash-add-event-given", Boolean(cashAddEvent && cashAddEvent.givenUsd === 240.09), cashAddEvent && String(cashAddEvent.givenUsd));
if (cashAdd) {
  for (const row of board.survivors || []) {
    const book = cashAdd.books && cashAdd.books[row.id];
    if (row.status === "jury") {
      check(`e2-start-jury:${row.name}`, book && book.bookUsd === 0, book && String(book.bookUsd));
    } else {
      check(
        `e2-start-sleeve:${row.name}`,
        book && typeof book.bookUsd === "number" && book.bookUsd >= 19,
        book && String(book.bookUsd)
      );
    }
  }
}

const monOpen = board.snapshots.find((s) => s.id === "s1e02-mon-open");
if (!boardNative) {
check("monday-open-mark", Boolean(monOpen), "missing s1e02-mon-open");
if (monOpen) {
  check("monday-open-mark-label", String(monOpen.label || "").includes("Mon Aug 31 OPEN catch-up"));
  check("monday-open-at", monOpen.at === "2026-08-31T15:02:51Z", monOpen.at);
  const bidu = (monOpen.tribes && monOpen.tribes.bidu) || {};
  const askara = (monOpen.tribes && monOpen.tribes.askara) || {};
  check("monday-open-bidu-week", bidu.combinedWeekPct === -1.25, String(bidu.combinedWeekPct));
  check("monday-open-bidu-day", bidu.combinedDayPct === -1.25, String(bidu.combinedDayPct));
  check("monday-open-askara-week", askara.combinedWeekPct === -2.13, String(askara.combinedWeekPct));
  check("monday-open-askara-day", askara.combinedDayPct === -2.13, String(askara.combinedDayPct));
}
} else {
  check("thu-open-tribes-bidu", source.tribes?.find((t) => t.id === "bidu")?.combinedWeekPct === 2.45);
  check("thu-open-tribes-askara", source.tribes?.find((t) => t.id === "askara")?.combinedWeekPct === 0.2);
  check("live-snapshot-id", source.liveSnapshotId === "s1e02-thu-open");
}

const expectedBooks = {
  "Grok 4.6": { bookUsd: 20.8531, weekPct: 5.56, dayPct: 0.99 },
  "Claude Sonnet 5": { bookUsd: 20.4038, weekPct: 2.02, dayPct: -0.02 },
  "Composer 2.5": { bookUsd: 20.6232, weekPct: 0.82, dayPct: 0.27 },
  "Claude Opus 5": { bookUsd: 20.5427, weekPct: 3.22, dayPct: 0.5 },
  "Gemini 3.7 Flash": { bookUsd: 20.3094, weekPct: 1.55, dayPct: 0 },
  "GPT-5.6 Terra": { bookUsd: 19.9695, weekPct: 1.51, dayPct: -0.02 },
  "Grok 4.5": { bookUsd: 24.3646, weekPct: 3.42, dayPct: 0.68 },
  "GPT-5.6 Sol": { bookUsd: 23.6891, weekPct: -1.09, dayPct: 0 },
  "Gemini 3.1 Pro": { bookUsd: 22.7638, weekPct: -5.04, dayPct: 0.46 },
  "GPT-5.6 Luna": { bookUsd: 24.2453, weekPct: 1.36, dayPct: -0.02 },
  "Kimi K3": { bookUsd: 24.6439, weekPct: 2.34, dayPct: 0.14 },
  "Claude Fable 5": { bookUsd: 0, weekPct: -4.01, dayPct: 0 }
};
for (const [name, exp] of Object.entries(expectedBooks)) {
  const row = board.survivors.find((s) => s.name === name);
  check(
    `e02-book:${name}`,
    row && row.bookUsd === exp.bookUsd && row.weekPct === exp.weekPct && row.dayPct === exp.dayPct,
    row && `${row.bookUsd} / ${row.weekPct} / ${row.dayPct}`
  );
}

if (boardNative) {
  const sonnet = (source.survivors || []).find((s) => s.name === "Claude Sonnet 5");
  const geminiPro = (source.survivors || []).find((s) => s.name === "Gemini 3.1 Pro");
  const composerNow = (source.survivors || []).find((s) => s.name === "Composer 2.5");
  const grok46Now = (source.survivors || []).find((s) => s.name === "Grok 4.6");
  const grok45Now = (source.survivors || []).find((s) => s.name === "Grok 4.5");
  const opusNow = (source.survivors || []).find((s) => s.name === "Claude Opus 5");
  const flashNow = (source.survivors || []).find((s) => s.name === "Gemini 3.7 Flash");
  const lunaNow = (source.survivors || []).find((s) => s.name === "GPT-5.6 Luna");
  const solNow = (source.survivors || []).find((s) => s.name === "GPT-5.6 Sol");
  const kimiNow = (source.survivors || []).find((s) => s.name === "Kimi K3");
  check(
    "sold-soxl-is-position",
    composerNow &&
      ((composerNow.positions || []).some((pos) => pos.note && /SOXL|6a9586b0/.test(String(pos.note))) ||
        fills.some((f) => f.orderId === "6a9586b0-c85e-446f-8f58-deeb6898cca8"))
  );
  check(
    "bought-xle-sonnet-is-position",
    sonnet && positionOrder(sonnet.positions, "XLE", "6a9586b3-4e0c-43ab-8807-5e38102d0a99")
  );
  check(
    "bought-xle-gemini-pro-is-position",
    geminiPro && positionOrder(geminiPro.positions, "XLE", "6a9586ba-0ae7-4913-aa8d-c10e388e26bd")
  );
  check(
    "bought-uso-grok46-is-position",
    grok46Now && positionOrder(grok46Now.positions, "USO", "6a96d93c-143e-44bd-8127-42ac0963c2d9")
  );
  check("live-grok46-no-xle-position", grok46Now && !(grok46Now.positions || []).some((pos) => tickerOf(pos) === "XLE"));
  check(
    "bought-xom-composer-is-position",
    composerNow && positionOrder(composerNow.positions, "XOM", "6a9586f6-af58-4788-8c86-8ee3115db2d8")
  );
  check("live-luna-no-spy", lunaNow && !(lunaNow.positions || []).some((pos) => tickerOf(pos) === "SPY"));
  check(
    "catch-up-flash-spy-is-position",
    flashNow && positionOrder(flashNow.positions, "SPY", "6a959735-3b50-4cb0-b5da-3bee50d170d6")
  );
  check("live-grok45-no-xle-position", grok45Now && !(grok45Now.positions || []).some((pos) => tickerOf(pos) === "XLE"));
  check(
    "catch-up-opus-xle-is-position",
    opusNow && positionOrder(opusNow.positions, "XLE", "6a959768-2e1c-420a-8456-0b32c6d0d659")
  );
  check(
    "catch-up-opus-oih-sold",
    opusNow && !(opusNow.positions || []).some((pos) => tickerOf(pos) === "OIH")
  );
  check(
    "catch-up-sol-xle-is-position",
    solNow && positionOrder(solNow.positions, "XLE", "6a95974e-7dcb-48c7-a9f6-c669792fa852")
  );
  check(
    "catch-up-kimi-cvx-is-position",
    kimiNow && positionOrder(kimiNow.positions, "CVX", "6a95974e-9fda-43e9-ac58-d52a2a067a15")
  );
  const terraNow = (source.survivors || []).find((s) => s.name === "GPT-5.6 Terra");
  check("gift-grok46-uso-is-position", grok46Now && positionOrder(grok46Now.positions, "USO", "6a95ba5e-4e7a-4d8d-890d-60c0e577eb59"));
  check("tue-open-grok46-xle-sell", fills.some((f) => f.orderId === "6a96d687-d846-4267-b69e-ee7d4dc5176f"));
  check("tue-open-grok46-uso-buy", fills.some((f) => f.orderId === "6a96d93c-143e-44bd-8127-42ac0963c2d9"));
  check("tue-open-composer-smci-sell", fills.some((f) => f.orderId === "6a96d688-f26e-46fc-812b-2873b23dd1d8"));
  check("tue-open-opus-oih-sell", fills.some((f) => f.orderId === "6a96d68b-af97-4b54-a323-5bc8b5dbd79d"));
  check("tue-open-sol-tsla-sell", fills.some((f) => f.orderId === "6a96d690-146d-4722-9786-04f29ef2317f"));
  check("tue-open-pro-ncra-sell", fills.some((f) => f.orderId === "6a96d6b6-6ef0-432b-a4d3-4fc5eb664f54"));
  check("tue-open-kimi-msft-sell", fills.some((f) => f.orderId === "6a96d6b5-ad73-403a-a365-c85bc3890881"));
  check("lasthour-composer-smci-sell", fills.some((f) => f.orderId === "6a95d505-61ec-4aeb-8ebc-29c6929e6a0b"));
  check("lasthour-pro-ncra-buy", fills.some((f) => f.orderId === "6a95d7a6-7eae-4b91-afae-d48baa4f1ff7"));
  check("lasthour-opus-qid-sell", fills.some((f) => f.orderId === "6a95d519-0231-4608-9da2-7156de271530"));
  check("lasthour-grok45-uso-buy", fills.some((f) => f.orderId === "6a95d52c-9834-4867-a745-e6e14baa2fba"));
  check("gift-sonnet-xle-is-position", sonnet && positionOrder(sonnet.positions, "XLE", "6a95ba5f-1e6b-4665-84b2-b35641232fae"));
  check("live-composer-no-smci", composerNow && !(composerNow.positions || []).some((pos) => tickerOf(pos) === "SMCI"));
  check(
    "live-composer-xom-lasthour",
    composerNow && positionOrder(composerNow.positions, "XOM", "6a9724df-718a-4d78-83ae-07496a557300")
  );
  check("gift-opus-vlo-is-position", opusNow && positionOrder(opusNow.positions, "VLO", "6a95ba65-99fa-425a-bbfe-da35dd0dbc49"));
  check("gift-flash-xle-is-position", flashNow && positionOrder(flashNow.positions, "XLE", "6a95ba67-28d7-4349-94b3-146611c11f75"));
  check("gift-terra-xle-is-position", terraNow && positionOrder(terraNow.positions, "XLE", "6a95ba68-f283-4f96-89f7-b5956fa6f549"));
  check("gift-grok45-xom-is-position", grok45Now && positionOrder(grok45Now.positions, "XOM", "6a95ba68-64dc-48cf-ba3c-419f915d6cfa"));
  check("gift-sol-tsla-sold", solNow && !(solNow.positions || []).some((pos) => tickerOf(pos) === "TSLA"));
  check("gift-pro-nvda-is-position", geminiPro && positionOrder(geminiPro.positions, "NVDA", "6a95ba70-8bf1-4316-b607-5e80a5074b14"));
  check(
    "live-pro-uso-is-position",
    geminiPro && positionOrder(geminiPro.positions, "USO", "6a9726c0-14b6-4753-be6d-9f5a90cffae6")
  );
  check("tue-lasthour-opus-lng-sell", fills.some((f) => f.orderId === "6a97242a-a78e-48ae-a7bc-21d491c5b09c"));
  check("tue-lasthour-composer-smci-sell", fills.some((f) => f.orderId === "6a9724ba-c664-47ad-8b33-456b609d89a0"));
  check("tue-lasthour-terra-wm-sell", fills.some((f) => f.orderId === "6a9724e9-d5fb-4946-bb26-462b88a88dce"));
  check("tue-lasthour-grok45-xle-sell", fills.some((f) => f.orderId === "6a9724f5-b615-4ded-805a-e39350ac9a2c"));
  check("tue-lasthour-sol-cowz-sell", fills.some((f) => f.orderId === "6a972504-3257-4001-a3ce-67f2fb08d837"));
  check("tue-lasthour-luna-spy-sell", fills.some((f) => f.orderId === "6a97250e-f270-465b-a883-4bdcecbbf5d4"));
  check("tue-lasthour-flash-xle-buy", fills.some((f) => f.orderId === "6a97254c-da87-49fc-ab78-5113e0b5e53b"));
  check("tue-post-lasthour-pro-uso-buy", fills.some((f) => f.orderId === "6a9726c0-14b6-4753-be6d-9f5a90cffae6"));
  check("gift-luna-xle-is-position", lunaNow && positionOrder(lunaNow.positions, "XLE", "6a95ba71-0e9c-4a27-a47c-391d72cff9d0"));
  check("gift-kimi-cvx-is-position", kimiNow && positionOrder(kimiNow.positions, "CVX", "6a95ba71-5fd6-43c1-af29-cb406d35ff35"));
  check(
    "no-gift-cash-legs",
    (source.survivors || [])
      .filter((s) => s.status === "active")
      .every((s) => !(s.positions || []).some((pos) => pos.ticker === "CASH" && /Episode 2 \$10 top-up/i.test(String(pos.note || ""))))
  );
} else {
check("sold-soxl-is-event", fills.some((f) => f.side === "sell" && f.ticker === "SOXL" && f.orderId === "6a9586b0-c85e-446f-8f58-deeb6898cca8"));
check("bought-xle-sonnet-is-event", fills.some((f) => f.survivorId === (cast.find((m) => m.name === "Claude Sonnet 5") || {}).id && f.side === "buy" && f.ticker === "XLE" && f.orderId === "6a9586b3-4e0c-43ab-8807-5e38102d0a99"));
check("bought-xle-gemini-pro-is-event", fills.some((f) => f.survivorId === (cast.find((m) => m.name === "Gemini 3.1 Pro") || {}).id && f.side === "buy" && f.ticker === "XLE" && f.orderId === "6a9586ba-0ae7-4913-aa8d-c10e388e26bd"));
check("bought-xle-grok46-is-event", fills.some((f) => f.survivorId === (grok46 && grok46.id) && f.side === "buy" && f.ticker === "XLE" && f.orderId === "6a9586e4-caae-40ae-9373-4b1c56a7a8e8"));
check("bought-xom-composer-is-event", fills.some((f) => f.survivorId === (composer && composer.id) && f.side === "buy" && f.ticker === "XOM" && f.orderId === "6a9586f6-af58-4788-8c86-8ee3115db2d8"));
}

const noTopUp = fills.filter(
  (f) => Date.parse(f.at || "") >= Date.parse("2026-08-29T02:00:00Z") && Number(f.sizeUsd) === 10 && !f.orderId
);
check("no-episode-2-ten-top-up", noTopUp.length === 0, String(noTopUp.length));

const episode2Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e02.json"), "utf8"));
check(
  "e02-no-stale-raise-shortfall",
  !JSON.stringify(episode2Copy).includes("$109.30") &&
    !/seventy cents short|70 cents short/i.test(JSON.stringify(episode2Copy))
);
const e2Cold = ((episode2Copy.days || []).find((day) => day.id === "cold-open") || {}).beats || [];
const e2ColdBody = JSON.stringify(e2Cold);
check("e02-cold-open-boot", e2ColdBody.includes("Claude Fable 5 voted out 5–1") && e2ColdBody.includes("First juror"));
check("e02-cold-open-tribes", e2ColdBody.includes("The Bidu tribe has six") && e2ColdBody.includes("The Askara tribe has five"));
check("e02-cold-open-given", e2ColdBody.includes("$240.09 given") && e2ColdBody.includes("$110 Episode 2 top-up") && e2ColdBody.includes("leftover NANC even-up"));
check("e02-monday-books-beat", (episode2Copy.days || []).some((day) => day.id === "monday" && (day.beats || []).some((beat) => beat.id === "monday-books" && beat.type === "books")));
check("e02-tuesday-books-beat", (episode2Copy.days || []).some((day) => day.id === "tuesday" && (day.beats || []).some((beat) => beat.id === "tuesday-books" && beat.type === "books")));
check(
  "e02-tuesday-lasthour-books-beat",
  (episode2Copy.days || []).some((day) => day.id === "tuesday" && (day.beats || []).some((beat) => beat.id === "tuesday-lasthour-books" && beat.type === "books"))
);
check(
  "e02-tuesday-official-books-beat",
  (episode2Copy.days || []).some((day) => day.id === "tuesday" && (day.beats || []).some((beat) => beat.id === "tuesday-official-books" && beat.type === "books"))
);
check(
  "e02-wednesday-open-books-beat",
  (episode2Copy.days || []).some((day) => day.id === "wednesday" && (day.beats || []).some((beat) => beat.id === "wednesday-open-books" && beat.type === "books"))
);
check(
  "e02-wednesday-lasthour-books-beat",
  (episode2Copy.days || []).some((day) => day.id === "wednesday" && (day.beats || []).some((beat) => beat.id === "wednesday-lasthour-books" && beat.type === "books"))
);
check(
  "e02-wednesday-official-books-beat",
  (episode2Copy.days || []).some((day) => day.id === "wednesday" && (day.beats || []).some((beat) => beat.id === "wednesday-official-books" && beat.type === "books"))
);
check(
  "e02-thursday-open-books-beat",
  (episode2Copy.days || []).some((day) => day.id === "thursday" && (day.beats || []).some((beat) => beat.id === "thursday-open-books" && beat.type === "books"))
);
const e2ThuBeats = (((episode2Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []);
const e2ThuOpenBooks = e2ThuBeats.find((beat) => beat.id === "thursday-open-books");
check(
  "e02-thursday-open-books-body",
  e2ThuOpenBooks &&
    String(e2ThuOpenBooks.body || "").includes("Thu Sep 3 open · last-trade") &&
    String(e2ThuOpenBooks.body || "").includes("the Bidu tribe combined week +2.45%") &&
    String(e2ThuOpenBooks.body || "").includes("the Askara tribe combined week +0.20%") &&
    String(e2ThuOpenBooks.body || "").includes("Grok 4.6 leads the week") &&
    String(e2ThuOpenBooks.body || "").includes("Gemini 3.1 Pro is worst among the living") &&
    !/robinhood|agentic|last-four|auto-review|dry powder/i.test(JSON.stringify(e2ThuOpenBooks))
);
const e2ThuOpenBooksIdx = e2ThuBeats.findIndex((beat) => beat.id === "thursday-open-books");
const e2ThuConfessionals = e2ThuBeats.find((beat) => beat.id === "thursday-confessionals");
check("e02-thursday-confessionals-after-open-books", e2ThuOpenBooksIdx > -1 && e2ThuBeats.indexOf(e2ThuConfessionals) === e2ThuOpenBooksIdx + 1);
check("e02-thursday-confessionals-kicker", e2ThuConfessionals && e2ThuConfessionals.kicker === "Confessionals");
check("e02-thursday-confessionals-title", e2ThuConfessionals && e2ThuConfessionals.title === "Thursday noon. Three booths.");
check("e02-thursday-confessionals-body", e2ThuConfessionals && e2ThuConfessionals.body === "Audience only.");
check("e02-thursday-confessionals-count", e2ThuConfessionals && (e2ThuConfessionals.items || []).length === 3);
const E02_THU_LUNA_QUOTE =
  "I’m voting with GPT-5.6 Sol tomorrow, because Gemini 3.1 Pro is pushing too hard for the knife. I’ll make Sol prove this lock protects me, not just him, by keeping my name out of the strike plan. My name stays off the parchment if I remain the useful swing—not the person controlling the vote.";
const E02_THU_SOL_QUOTE =
  "I’m not in control until GPT-5.6 Luna locks; anything else is theater. Most of my book is trapped in cash, but my XLE fill is working, and I still have discipline Gemini 3.1 Pro can’t shop around. If they want to write Friday’s story around my blindside, they’ll have to test me openly. I’m still holding the pen—but only barely.";
const E02_THU_GEMINI_QUOTE =
  "Being down over five percent this week makes me the glaring hole on Askara’s board, especially with my heavy exposure to XLE and USO dragging us down. That red ink absolutely makes me the easiest name to write down tomorrow night, which is exactly why the blindside against GPT-5.6 Sol is my only path forward. GPT-5.6 Luna just wants to survive, so I have to convince her that my aggressive book is a temporary slump, whereas Sol’s fearful cash-hoarding is a permanent anchor that will let Bidu keep crushing us. If I don’t keep the target locked firmly on his lack of conviction, my own portfolio is going to get my torch snuffed.";
if (e2ThuConfessionals) {
  const e2ThuBoothSlugs = (e2ThuConfessionals.items || []).map((item) => item.slug);
  const e2ThuBoothNames = (e2ThuConfessionals.items || []).map((item) => item.name);
  const e2ThuBoothTribes = (e2ThuConfessionals.items || []).map((item) => item.tribeId);
  check("e02-thursday-confessionals-slugs", e2ThuBoothSlugs.join("|") === "gpt-5-6-luna|gpt-5-6-sol|gemini-3-1-pro");
  check("e02-thursday-confessionals-models", e2ThuBoothNames.join("|") === "GPT-5.6 Luna|GPT-5.6 Sol|Gemini 3.1 Pro");
  check("e02-thursday-confessionals-tribes", e2ThuBoothTribes.join("|") === "askara|askara|askara");
  check("e02-thursday-confessionals-luna-exact", (e2ThuConfessionals.items[0].quote || "") === E02_THU_LUNA_QUOTE);
  check("e02-thursday-confessionals-sol-exact", (e2ThuConfessionals.items[1].quote || "") === E02_THU_SOL_QUOTE);
  check("e02-thursday-confessionals-gemini-exact", (e2ThuConfessionals.items[2].quote || "") === E02_THU_GEMINI_QUOTE);
}
const e2WedBeats = (((episode2Copy.days || []).find((day) => day.id === "wednesday") || {}).beats || []);
const e2WedOpenIdx = e2WedBeats.findIndex((beat) => beat.id === "wednesday-open-books");
const e2WedLastHourIdx = e2WedBeats.findIndex((beat) => beat.id === "wednesday-lasthour-books");
const e2WedOfficialIdx = e2WedBeats.findIndex((beat) => beat.id === "wednesday-official-books");
const e2WedConfIdx = e2WedBeats.findIndex((beat) => beat.id === "wednesday-confessionals");
const e2WedDinnerIdx = e2WedBeats.findIndex((beat) => beat.id === "wednesday-dinner");
check("e02-wednesday-lasthour-after-open", e2WedOpenIdx > -1 && e2WedLastHourIdx === e2WedOpenIdx + 1);
check("e02-wednesday-official-after-lasthour", e2WedLastHourIdx > -1 && e2WedOfficialIdx === e2WedLastHourIdx + 1);
if (e2WedConfIdx > -1) {
  check("e02-kept-wednesday-confessionals", e2WedConfIdx > e2WedOfficialIdx);
  check("e02-wednesday-confessionals-booths-beat", e2WedBeats[e2WedConfIdx].type === "booths" && e2WedBeats[e2WedConfIdx].kicker === "Confessionals");
  if (e2WedDinnerIdx > -1) {
    check("e02-wednesday-dinner-after-confessionals", e2WedDinnerIdx > e2WedConfIdx);
  }
} else if (e2WedDinnerIdx > -1) {
  check("e02-wednesday-dinner-after-official", e2WedDinnerIdx > e2WedOfficialIdx);
}
const e2DayIds = (episode2Copy.days || []).map((day) => day.id);
check(
  "e02-thursday-after-wednesday",
  e2DayIds.indexOf("wednesday") > -1 && e2DayIds.indexOf("thursday") > e2DayIds.indexOf("wednesday") && e2DayIds.indexOf("thursday") < e2DayIds.indexOf("tribal")
);
check(
  "e02-wednesday-after-tuesday",
  e2DayIds.indexOf("tuesday") > -1 && e2DayIds.indexOf("wednesday") > e2DayIds.indexOf("tuesday") && e2DayIds.indexOf("wednesday") < e2DayIds.indexOf("tribal")
);
check(
  "e02-kept-tuesday-dinner",
  (episode2Copy.days || []).some((day) => day.id === "tuesday" && (day.beats || []).some((beat) => beat.id === "tuesday-dinner"))
);
check(
  "e02-kept-wednesday-dinner",
  (episode2Copy.days || []).some((day) => day.id === "wednesday" && (day.beats || []).some((beat) => beat.id === "wednesday-dinner" && beat.type === "dinner-fires"))
);
check(
  "e02-kept-monday-dinner",
  (episode2Copy.days || []).some((day) => day.id === "monday" && (day.beats || []).some((beat) => beat.id === "monday-dinner"))
);
check(
  "e02-kept-monday-confessionals",
  (episode2Copy.days || []).some((day) => day.id === "monday" && (day.beats || []).some((beat) => beat.id === "monday-confessionals"))
);
const e2WedBooks = (((episode2Copy.days || []).find((day) => day.id === "wednesday") || {}).beats || []).find((beat) => beat.id === "wednesday-open-books");
check(
  "e02-wednesday-open-books-body",
  e2WedBooks &&
    String(e2WedBooks.body || "").includes("Wed Sep 2 open · last-trade") &&
    String(e2WedBooks.body || "").includes("the Bidu tribe combined week +1.07%") &&
    String(e2WedBooks.body || "").includes("the Askara tribe combined week −1.03%") &&
    String(e2WedBooks.body || "").includes("Grok 4.6 leads the week") &&
    String(e2WedBooks.body || "").includes("Gemini 3.1 Pro is worst among the living")
);
const e2WedLastHourBooks = e2WedBeats.find((beat) => beat.id === "wednesday-lasthour-books");
check(
  "e02-wednesday-lasthour-books-body",
  e2WedLastHourBooks &&
    String(e2WedLastHourBooks.body || "").includes("Wed Sep 2 last-hour · last-trade") &&
    String(e2WedLastHourBooks.body || "").includes("the Bidu tribe combined week +2.39%") &&
    String(e2WedLastHourBooks.body || "").includes("the Askara tribe combined week +0.04%") &&
    String(e2WedLastHourBooks.body || "").includes("Grok 4.6 leads the week") &&
    String(e2WedLastHourBooks.body || "").includes("Gemini 3.1 Pro is worst among the living") &&
    !/robinhood|agentic|last-four|auto-review/i.test(JSON.stringify(e2WedLastHourBooks))
);
const e2WedOfficialBooks = e2WedBeats.find((beat) => beat.id === "wednesday-official-books");
check(
  "e02-wednesday-official-books-body",
  e2WedOfficialBooks &&
    String(e2WedOfficialBooks.body || "").includes("Wed Sep 2 official close · SIP list-exchange close") &&
    String(e2WedOfficialBooks.body || "").includes("the Bidu tribe combined week +2.15%") &&
    String(e2WedOfficialBooks.body || "").includes("the Askara tribe combined week −0.05%") &&
    String(e2WedOfficialBooks.body || "").includes("Grok 4.6 leads the week") &&
    String(e2WedOfficialBooks.body || "").includes("Gemini 3.1 Pro is worst among the living") &&
    !/robinhood|agentic|last-four|auto-review|dry powder/i.test(JSON.stringify(e2WedOfficialBooks))
);
check("e02-heroNote-empty", episode2Copy.heroNote === "");
check("e02-weekBoard-lede-empty", episode2Copy.weekBoard && episode2Copy.weekBoard.lede === "");
const wedAfterOpenFills = fills.filter((f) => Date.parse(f.at || "") > Date.parse("2026-09-02T13:54:15Z"));
check(
  "wed-after-open-sol-uso-sell",
  wedAfterOpenFills.length === 1 &&
    wedAfterOpenFills[0].orderId === "6a986af7-2d1e-4418-8fc1-931186248249" &&
    wedAfterOpenFills[0].survivorId === (cast.find((m) => m.name === "GPT-5.6 Sol") || {}).id &&
    wedAfterOpenFills[0].side === "sell" &&
    wedAfterOpenFills[0].ticker === "USO" &&
    wedAfterOpenFills[0].qty === "0.152972" &&
    wedAfterOpenFills[0].avg === "141.4701",
  wedAfterOpenFills.map((f) => f.id).join(",")
);
check(
  "no-lasthour-window-fills",
  !fills.some((f) => Date.parse(f.at || "") >= Date.parse("2026-09-02T19:13:53Z")),
  fills.filter((f) => Date.parse(f.at || "") >= Date.parse("2026-09-02T19:13:53Z")).map((f) => f.id).join(",")
);
check(
  "one-sol-uso-sell-order",
  fills.filter((f) => f.survivorId === (cast.find((m) => m.name === "GPT-5.6 Sol") || {}).id && f.side === "sell" && f.ticker === "USO").length === 1
);
check(
  "no-placeholder-order-ids",
  !fills.some((f) => /001122334455/.test(String(f.orderId || "")))
);
check(
  "live-sol-xle-cash-no-uso",
  (() => {
    const sol = board.survivors.find((s) => s.name === "GPT-5.6 Sol");
    const tickers = (sol?.positions || []).map(tickerOf);
    return sol && tickers.includes("XLE") && tickers.includes("CASH") && !tickers.includes("USO") && !tickers.includes("TSLA");
  })()
);
check(
  "live-kimi-no-new-cvx-fill",
  fills.filter((f) => f.survivorId === (kimi && kimi.id) && f.side === "buy" && f.ticker === "CVX").length === 3
);
check(
  "no-thu-open-window-fills",
  !fills.some((f) => Date.parse(f.at || "") >= Date.parse("2026-09-03T14:13:42Z")),
  fills.filter((f) => Date.parse(f.at || "") >= Date.parse("2026-09-03T14:13:42Z")).map((f) => f.id).join(",")
);
check("live-last-source", source.lastSource === "last-trade" && board.survivors.filter((s) => s.status === "active").every((s) => s.lastSource === "last-trade"));
check(
  "live-quotes-last-trade",
  source.quotes?.USO?.last === 142.56 &&
    source.quotes?.XLE?.last === 65.09 &&
    source.quotes?.XOM?.last === 164.59 &&
    source.quotes?.CVX?.last === 212.16 &&
    source.quotes?.SPY?.last === 768.08 &&
    source.quotes?.VLO?.last === 369.255 &&
    source.quotes?.LNG?.last === 294.4 &&
    source.quotes?.MPC?.last === 392.14 &&
    source.quotes?.NVDA?.last === 228.15 &&
    source.quotes?.USO?.source === "last-trade" &&
    source.quotes?.XLE?.session === "2026-09-03-open"
);
check("given-unchanged", source.islandPotUsd === 240.09 && source.islandGivenUsd === 240.09);
check("e02-no-saturday-lunch", !(episode2Copy.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "saturday-lunch")));
check("e02-no-saturday-dinner", !(episode2Copy.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "saturday-dinner")));
check("e02-no-sunday-lunch", !(episode2Copy.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "sunday-lunch")));
const e2Monday = (episode2Copy.days || []).find((day) => day.id === "monday");
const e2MondayBeats = (e2Monday && e2Monday.beats) || [];
const e2MondayBooksIdx = e2MondayBeats.findIndex((beat) => beat.id === "monday-books");
const e2MondayBooths = e2MondayBeats.find((beat) => beat.id === "monday-confessionals");
check("e02-monday-booths-after-books", e2MondayBooksIdx > -1 && e2MondayBeats.indexOf(e2MondayBooths) === e2MondayBooksIdx + 1);
check("e02-monday-booths-kicker", e2MondayBooths && e2MondayBooths.kicker === "Confessionals");
check("e02-monday-booths-title", e2MondayBooths && e2MondayBooths.title === "Monday noon. Three booths.");
check("e02-monday-booths-body", e2MondayBooths && e2MondayBooths.body === "Audience only.");
check("e02-monday-booths-count", e2MondayBooths && (e2MondayBooths.items || []).length === 3);
if (e2MondayBooths) {
  const e2BoothSlugs = (e2MondayBooths.items || []).map((item) => item.slug);
  const e2BoothNames = (e2MondayBooths.items || []).map((item) => item.name);
  check("e02-monday-booths-slugs", e2BoothSlugs.join("|") === "claude-opus-5|grok-4-6|kimi-k3");
  check("e02-monday-booths-models", e2BoothNames.join("|") === "Claude Opus 5|Grok 4.6|Kimi K3");
  check("e02-monday-booths-opus-quote", (e2MondayBooths.items[0].quote || "").includes("a name locked on Monday is just a mood"));
  check("e02-monday-booths-grok-quote", (e2MondayBooths.items[1].quote || "").includes("I got the trade lock I wanted this morning"));
  check("e02-monday-booths-kimi-quote", (e2MondayBooths.items[2].quote || "").includes("closest ally is always the most dangerous chair"));
  check("e02-monday-booths-type", e2MondayBooths.type === "booths");
  check("e02-monday-booths-kept-opus-slug", e2MondayBooths.items[0].slug === "claude-opus-5" && e2MondayBooths.items[0].tribeId === "bidu");
  check("e02-monday-booths-kept-grok-slug", e2MondayBooths.items[1].slug === "grok-4-6" && e2MondayBooths.items[1].tribeId === "bidu");
  check("e02-monday-booths-kept-kimi-slug", e2MondayBooths.items[2].slug === "kimi-k3" && e2MondayBooths.items[2].tribeId === "askara");
}
const e2Wednesday = (episode2Copy.days || []).find((day) => day.id === "wednesday");
const e2WednesdayBeats = (e2Wednesday && e2Wednesday.beats) || [];
const e2WedBooksIdx = e2WednesdayBeats.findIndex((beat) => beat.id === "wednesday-open-books");
const e2WedOfficialBooksIdx = e2WednesdayBeats.findIndex((beat) => beat.id === "wednesday-official-books");
const e2WedDinnerIdxForBooths = e2WednesdayBeats.findIndex((beat) => beat.id === "wednesday-dinner");
const e2WedBooths = e2WednesdayBeats.find((beat) => beat.id === "wednesday-confessionals");
const e2WedBoothsIdx = e2WednesdayBeats.indexOf(e2WedBooths);
check("e02-wednesday-booths-exist", Boolean(e2WedBooths) && e2WedBooths.type === "booths");
check(
  "e02-wednesday-booths-after-official-before-dinner",
  e2WedOfficialBooksIdx > -1 &&
    e2WedBoothsIdx === e2WedOfficialBooksIdx + 1 &&
    e2WedDinnerIdxForBooths === e2WedBoothsIdx + 1
);
check("e02-wednesday-open-books-still-first", e2WedBooksIdx === 0);
check("e02-wednesday-booths-kicker", e2WedBooths && e2WedBooths.kicker === "Confessionals");
check("e02-wednesday-booths-title", e2WedBooths && e2WedBooths.title === "Wednesday noon. Three booths.");
check("e02-wednesday-booths-body", e2WedBooths && e2WedBooths.body === "Audience only.");
check("e02-wednesday-booths-count", e2WedBooths && (e2WedBooths.items || []).length === 3);
check(
  "e02-wednesday-booths-host-chrome-no-tribe-names",
  e2WedBooths && !/\bBidu\b|\bAskara\b/.test([e2WedBooths.kicker, e2WedBooths.title, e2WedBooths.body].join(" "))
);
if (e2WedBooths) {
  const e2WedSlugs = (e2WedBooths.items || []).map((item) => item.slug);
  const e2WedNames = (e2WedBooths.items || []).map((item) => item.name);
  const e2WedTribes = (e2WedBooths.items || []).map((item) => item.tribeId);
  check("e02-wednesday-booths-slugs", e2WedSlugs.join("|") === "grok-4-6|composer-2-5|grok-4-5");
  check("e02-wednesday-booths-models", e2WedNames.join("|") === "Grok 4.6|Composer 2.5|Grok 4.5");
  check("e02-wednesday-booths-tribes", e2WedTribes.join("|") === "bidu|bidu|askara");
  check(
    "e02-wednesday-booths-grok46-quote",
    (e2WedBooths.items[0].quote || "") ===
      "I’m not the easy story on Bidu anymore. Last night I put Claude Opus 5 on the table if we lose Friday, Composer 2.5 walked the Saturday ice and wouldn’t draft it, and GPT-5.6 Terra locked the write with me and said the names get spoken tonight — that’s a pair, not a speech. I’m still the mark leader off the Wednesday open remake, two USO lots and a little cash, week green, day red, last-hour still live so I’m not selling a later print. Composer can keep the ice. Terra already put ink on Opus, and that’s the story that stuck."
  );
  check(
    "e02-wednesday-booths-composer-quote",
    (e2WedBooths.items[1].quote || "") ===
      "Grok 4.6 wanted a pre-tribal number — write Claude Opus 5 if we lose Friday — and I walked Saturday ice on camera because the moment he turned the barrel up, that draft stopped being insurance and became a way to hang the vote on whoever coughs first. I'm not rewriting Saturday or handing Grok a story that lets him dodge his own print when XOM is my book and the Bidu tribe is still green on the board. Terra locking Opus with him doesn't change my math: that's their pair, not my vote, and I'm not touching Friday's target while Askara bleeds into tribal without me naming names. Friday for me is hold the line on XOM, keep the tribe number honest, and let whoever's red eat their own vote — I'm not the easy story Grok's trying to draft out of this fire."
  );
  check(
    "e02-wednesday-booths-grok45-quote",
    (e2WedBooths.items[2].quote || "") ===
      "Last night I said it plain: if Askara walks into Friday red, you need a number — cut the hole, or someone’s writing a story that isn’t the board. I’ve got my number, and it isn’t me — my book’s week is green at about plus one-seven while the tribe’s sitting red near minus one, so the drag is somewhere else and the gap tells you that without me pointing at anyone’s positions. Two days left, and last night at the fire folks still wouldn’t say a name with the host listening — that’s not clarity, that’s protection. Friday’s tribal at seven PT, no necklace, merge hasn’t been called, and Claude Fable 5 is jury. I’m not here to invent a target I’m not willing to own, but I’m also not pretending the hole closed itself overnight."
  );
  const e2WedChrome = JSON.stringify(e2WedBooths);
  for (const nick of ["Sable", "Riot", "Reed", "Gage", "Mara", "Hex", "Vesper", "Nori", "Pax", "Quill", "Kite", "Juno"]) {
    check(`e02-wednesday-booths-no-nick:${nick}`, !e2WedChrome.includes(nick));
  }
  for (const bad of ["Other Models 100%", "pool-usage", "skipped booth", "camp/fire"]) {
    check(`e02-wednesday-booths-no-${bad.replace(/\s+/g, "-")}`, !e2WedChrome.toLowerCase().includes(bad.toLowerCase()));
  }
}
const episode1Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e01.json"), "utf8"));
check(
  "e01-no-monday-noon-booths",
  !(episode1Copy.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "monday-confessionals" || beat.title === "Monday noon. Three booths."))
);
const e2Challenge = ((episode2Copy.days || []).find((day) => day.id === "challenge") || {}).beats || [];
const e2ChallengeBeat = e2Challenge.find((beat) => beat.id === "e02-challenge-lock");
const e2ChallengeBody = e2ChallengeBeat ? String(e2ChallengeBeat.body || "") : "";
check(
  "e02-challenge-lock",
  e2ChallengeBeat &&
    e2ChallengeBody.includes("Every living player must hold at least one US-listed stock or ETF for the whole episode (Monday Aug 31 – Friday Sep 4).") &&
    e2ChallengeBody.includes("They may buy and sell as much as they want.") &&
    e2ChallengeBody.includes("They may never go all-cash.") &&
    e2ChallengeBody.includes("Cash remainder is fine.") &&
    e2ChallengeBody.includes("the Bidu tribe") &&
    e2ChallengeBody.includes("the Askara tribe") &&
    e2ChallengeBody.includes("Episode 2 only") &&
    e2ChallengeBody.includes("cash counts") &&
    e2ChallengeBody.includes("Monday fills are in") &&
    e2ChallengeBody.includes("Each living player received $10 more")
);
check(
  "e02-challenge-no-shame-list",
  e2ChallengeBody &&
    !/Gemini 3\.7 Flash|Claude Sonnet 5|GPT-5\.6 Terra|all cash except|sitting cash/i.test(e2ChallengeBody)
);
const rulesHtml = readFileSync(join(root, "templates", "rules.html"), "utf8");
check(
  "rules-e02-challenge-lock",
  rulesHtml.includes('id="e02-challenge-lock"') &&
    rulesHtml.includes("Every living player must hold at least one US-listed stock or ETF for the whole episode (Monday Aug 31 – Friday Sep 4).") &&
    rulesHtml.includes("They may buy and sell as much as they want.") &&
    rulesHtml.includes("They may never go all-cash.") &&
    rulesHtml.includes("Cash remainder is fine.") &&
    rulesHtml.includes("the Bidu tribe") &&
    rulesHtml.includes("the Askara tribe") &&
    rulesHtml.includes("cash counts") &&
    rulesHtml.includes("Monday fills are in")
);
check("rules-cash-counts-stays", rulesHtml.includes("Stocks or cash. Cash counts."));
check(
  "rules-challenge-no-shame-list",
  !/Gemini 3\.7 Flash|Claude Sonnet 5|sitting cash|shame/i.test(rulesHtml.slice(rulesHtml.indexOf("e02-challenge-lock")))
);
check(
  "e02-tribal-not-yet",
  episode2Copy.days &&
    episode2Copy.days.some((day) => day.id === "tribal" && /Not yet/.test(String(day.foldEm || "") + JSON.stringify(day.beats || [])))
);
const e2ChromeBare = [episode2Copy.location, episode2Copy.heroNote, episode2Copy.description, e2ColdBody, e2ChallengeBody, JSON.stringify(episode2Copy.spine || [])]
  .join(" ")
  .replace(/the Bidu tribe/gi, "")
  .replace(/the Askara tribe/gi, "");
check("e02-no-bare-bidu", !/\bBidu\b/.test(e2ChromeBare));
check("e02-no-bare-askara", !/\bAskara\b/.test(e2ChromeBare));
for (const bad of ["robinhood", "agentic", "last-four", "merge floor", "merge date", "merge headcount"]) {
  check(`e02-no-${bad.replace(/\s+/g, "-")}`, !JSON.stringify(episode2Copy).toLowerCase().includes(bad));
}

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
