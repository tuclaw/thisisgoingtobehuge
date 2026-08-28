#!/usr/bin/env node
/** Schema-ish shape + GAME.md invariants. Never snapshot a week's leader. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveSeason,
  isCashLeg,
  markedEquity,
  pctRound,
  slugify,
  tickerOf
} from "./lib/ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "data", "season1.json"), "utf8"));
const board = deriveSeason(source);

const failures = [];
function check(name, ok, detail) {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

function requireKeys(obj, keys, label) {
  for (const key of keys) {
    check(`${label}.${key}`, obj && obj[key] !== undefined && obj[key] !== null, "missing");
  }
}

requireKeys(source, ["show", "season", "cast", "tribes", "events", "quotes", "episodes"], "source");
check("cast-size", Array.isArray(source.cast) && source.cast.length >= 2, String(source.cast && source.cast.length));
check("exactly-one-live-episode-or-none", (source.episodes || []).filter((ep) => ep.status === "live").length <= 1);

const ids = new Set();
const slugs = new Set();
for (const member of source.cast) {
  requireKeys(member, ["id", "name", "slug", "tribeId", "model", "portrait"], `cast.${member && member.name}`);
  check(`unique-id:${member.id}`, !ids.has(member.id));
  check(`unique-slug:${member.slug}`, !slugs.has(member.slug));
  ids.add(member.id);
  slugs.add(member.slug);
  check(`slug-matches:${member.slug}`, member.slug === slugify(member.model || member.name));
}

const fills = (source.events || []).filter((event) => event.type === "fill");
const marks = (source.events || []).filter((event) => event.type === "mark");
check("has-fills", fills.length > 0);
check("has-marks", marks.length > 0);

for (const fill of fills) {
  requireKeys(fill, ["id", "survivorId", "side", "ticker", "qty", "avg", "at"], `fill.${fill.id}`);
  check(`fill-known-survivor:${fill.id}`, ids.has(fill.survivorId));
  check(`fill-side:${fill.id}`, fill.side === "buy" || fill.side === "sell");
  check(`fill-qty:${fill.id}`, Number.isFinite(parseFloat(fill.qty)) && parseFloat(fill.qty) > 0);
  check(`fill-avg:${fill.id}`, Number.isFinite(parseFloat(fill.avg)) && parseFloat(fill.avg) > 0);
}

check("sold-lots-are-events", fills.some((f) => f.side === "sell" && f.ticker === "SMCI"));
check("sold-hood-is-event", fills.some((f) => f.side === "sell" && f.ticker === "HOOD"));
check("sold-btal-is-event", fills.some((f) => f.side === "sell" && f.ticker === "BTAL"));
check("sold-island-nvda-is-event", fills.some((f) => f.side === "sell" && f.ticker === "NVDA"));
check("sold-island-tsla-is-event", fills.some((f) => f.side === "sell" && f.ticker === "TSLA"));
check("sold-island-gld-is-event", fills.some((f) => f.side === "sell" && f.ticker === "GLD"));
check("sold-island-coin-is-event", fills.some((f) => f.side === "sell" && f.ticker === "COIN"));

check("board-survivors", Array.isArray(board.survivors) && board.survivors.length === source.cast.length);
check("no-dual-position", board.survivors.every((s) => !s.position));
check("has-positions", board.survivors.every((s) => Array.isArray(s.positions) && s.positions.length > 0));
check("snapshots", Array.isArray(board.snapshots) && board.snapshots.length === marks.length);

const start = board.startingBookUsd;
check("pot-is-sleeves", board.islandPotUsd === start * source.cast.length);

for (const s of board.survivors) {
  const computedWeek = pctRound(((s.bookUsd - start) / start) * 100);
  check(
    `weekPct:${s.slug}`,
    Math.abs(computedWeek - s.weekPct) <= 0.02,
    `${s.weekPct} vs computed ${computedWeek} on ${s.bookUsd}`
  );
  let equity = 0;
  let unmarked = false;
  for (const pos of s.positions) {
    const value = markedEquity(pos, board.quotes);
    if (isCashLeg(pos)) {
      equity += Number(pos.sizeUsd) || 0;
      continue;
    }
    if (value == null) {
      unmarked = true;
      check(`no-invented-last:${s.slug}:${tickerOf(pos)}`, pos.last == null);
    } else {
      equity += value;
    }
  }
  if (!unmarked) {
    check(`book-vs-marks:${s.slug}`, Math.abs(equity - s.bookUsd) < 0.05, `${equity.toFixed(4)} vs ${s.bookUsd}`);
  }
  const sleeve = s.positions.reduce((sum, pos) => (isCashLeg(pos) ? sum : sum + (Number(pos.sizeUsd) || 0)), 0);
  check(`sleeve:${s.slug}`, sleeve <= start + 0.05, String(sleeve));
}

for (const tribe of board.tribes) {
  const living = board.survivors.filter((s) => s.tribeId === tribe.id && (s.status === "active" || s.status === "immune"));
  check(`living-count:${tribe.id}`, tribe.livingCount === living.length);
}

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
const composerLive = board.survivors.find((s) => s.name === "Composer 2.5");
const fableLive = board.survivors.find((s) => s.name === "Claude Fable 5");
check("live-composer-lead", composerLive && composerLive.bookUsd === 10.4553 && composerLive.weekPct === 4.55, composerLive && `${composerLive.bookUsd} / ${composerLive.weekPct}`);
check("live-fable-last", fableLive && fableLive.bookUsd === 9.5985 && fableLive.weekPct === -4.01, fableLive && `${fableLive.bookUsd} / ${fableLive.weekPct}`);

const live = (board.episodes || []).filter((ep) => ep.status === "live");
if (live.length === 1) {
  check("live-episode-has-path", Boolean(live[0].path));
}

const episodeDays = (source.episode && source.episode.days) || [];
const snapIds = new Set(board.snapshots.map((snap) => snap.id));
for (const day of episodeDays) {
  if (day.snapshotId) {
    check(`episode-day-snapshot:${day.id}`, snapIds.has(day.snapshotId), day.snapshotId);
  }
}

if (failures.length) {
  console.error("Season checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      ok: true,
      survivors: board.survivors.length,
      fills: fills.length,
      snapshots: board.snapshots.map((s) => s.id),
      leader: [...board.survivors].sort((a, b) => b.weekPct - a.weekPct)[0].name
    },
    null,
    2
  )
);
