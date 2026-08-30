#!/usr/bin/env node
/** Durable season invariants (shape, math, GAME.md). Episode board fixtures live in check-season-live.mjs. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveSeason,
  heldTickers,
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
const names = new Set();
for (const member of source.cast) {
  requireKeys(member, ["id", "name", "slug", "tribeId", "model", "portrait"], `cast.${member && member.name}`);
  check(`unique-id:${member.id}`, !ids.has(member.id));
  check(`unique-slug:${member.slug}`, !slugs.has(member.slug));
  check(`unique-name:${member.name}`, !names.has(member.name));
  ids.add(member.id);
  slugs.add(member.slug);
  names.add(member.name);
  check(`slug-matches:${member.slug}`, member.slug === slugify(member.model || member.name));
}

const fills = (source.events || []).filter((event) => event.type === "fill");
const marks = (source.events || []).filter((event) => event.type === "mark");
check("has-fills", fills.length > 0);
check("has-marks", marks.length > 0);

const fillIds = new Set();
for (const fill of fills) {
  requireKeys(fill, ["id", "survivorId", "side", "ticker", "qty", "avg", "at"], `fill.${fill.id}`);
  check(`fill-unique-id:${fill.id}`, !fillIds.has(fill.id));
  fillIds.add(fill.id);
  check(`fill-known-survivor:${fill.id}`, ids.has(fill.survivorId));
  check(`fill-side:${fill.id}`, fill.side === "buy" || fill.side === "sell");
  check(`fill-qty:${fill.id}`, Number.isFinite(parseFloat(fill.qty)) && parseFloat(fill.qty) > 0);
  check(`fill-avg:${fill.id}`, Number.isFinite(parseFloat(fill.avg)) && parseFloat(fill.avg) > 0);
}

const markIds = new Set();
for (const mark of marks) {
  requireKeys(mark, ["id", "at"], `mark.${mark && mark.id}`);
  check(`mark-unique-id:${mark.id}`, !markIds.has(mark.id));
  markIds.add(mark.id);
}

const liveHeld = heldTickers(source);
const boardHeld = [
  ...new Set(
    board.survivors.flatMap((s) => (s.positions || []).filter((pos) => !isCashLeg(pos)).map(tickerOf)).filter(Boolean)
  )
].sort();
check("held-tickers-match-board", JSON.stringify(liveHeld) === JSON.stringify(boardHeld), `${liveHeld} vs ${boardHeld}`);

check("board-survivors", Array.isArray(board.survivors) && board.survivors.length === source.cast.length);
check("no-dual-position", board.survivors.every((s) => !s.position));
check("has-positions", board.survivors.every((s) => Array.isArray(s.positions) && s.positions.length > 0));
check("snapshots", Array.isArray(board.snapshots) && board.snapshots.length === marks.length);

const start = board.startingBookUsd;
check("pot-is-sleeves", board.islandPotUsd === start * source.cast.length);
check("given-total", typeof source.islandGivenUsd === "number" && source.islandGivenUsd > 0, String(source.islandGivenUsd));
check("board-given-total", board.islandGivenUsd === source.islandGivenUsd, String(board.islandGivenUsd));
check("given-is-not-sleeves", source.islandGivenUsd !== start * source.cast.length);

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

const log = source.tribalLog || [];
check("tribal-log-is-array", Array.isArray(log));
for (const [i, council] of log.entries()) {
  requireKeys(council, ["bootName", "votes", "tally"], `tribalLog[${i}]`);
  check(`tribal-boot-known:${i}`, names.has(council.bootName), council.bootName);
  const votes = Array.isArray(council.votes) ? council.votes : [];
  check(`tribal-votes-nonempty:${i}`, votes.length > 0);
  for (const [j, vote] of votes.entries()) {
    check(`tribal-vote-from:${i}.${j}`, names.has(vote.from), vote.from);
    check(`tribal-vote-for:${i}.${j}`, names.has(vote.for), vote.for);
  }
  const tally = council.tally || {};
  const tallySum = Object.values(tally).reduce((sum, n) => sum + Number(n || 0), 0);
  check(`tribal-tally-sums:${i}`, tallySum === votes.length, `${tallySum} vs ${votes.length}`);
  check(`tribal-tally-boot:${i}`, Number(tally[council.bootName] || 0) >= 1);
  check(`tribal-summary:${i}`, typeof council.summary === "string" && council.summary.includes(council.bootName));
}

if (failures.length) {
  console.error("Season checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      ok: true,
      kind: "invariants",
      survivors: board.survivors.length,
      fills: fills.length,
      snapshots: board.snapshots.map((s) => s.id),
      leader: [...board.survivors].sort((a, b) => b.weekPct - a.weekPct)[0].name
    },
    null,
    2
  )
);
