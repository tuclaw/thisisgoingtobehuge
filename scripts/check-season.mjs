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
  const sleeve = s.positions.reduce((sum, pos) => sum + (Number(pos.sizeUsd) || 0), 0);
  check(`sleeve:${s.slug}`, sleeve <= start + 0.05, String(sleeve));
}

for (const tribe of board.tribes) {
  const living = board.survivors.filter((s) => s.tribeId === tribe.id && (s.status === "active" || s.status === "immune"));
  const sum = pctRound(living.reduce((n, s) => n + s.weekPct, 0));
  check(
    `tribe-week:${tribe.id}`,
    Math.abs(sum - tribe.combinedWeekPct) <= 0.05,
    `${tribe.combinedWeekPct} vs sum ${sum}`
  );
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
  check("wednesday-opus-sold-btal", !tickers.includes("BTAL") && tickers.includes("QID") && tickers.includes("CASH"));
}

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
