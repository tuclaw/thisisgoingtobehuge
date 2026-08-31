#!/usr/bin/env node
/** Durable season invariants (shape, math, GAME.md). Episode board fixtures live in check-season-live.mjs. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  castFromSource,
  deriveSeason,
  isBoardNative,
  isCashLeg,
  markedEquity,
  pctRound,
  slugify,
  tickerOf
} from "./lib/ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "data", "season1.json"), "utf8"));
const board = deriveSeason(source);
const boardNative = isBoardNative(source);
const cast = castFromSource(source);

const failures = [];
function check(name, ok, detail) {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

function requireKeys(obj, keys, label) {
  for (const key of keys) {
    check(`${label}.${key}`, obj && obj[key] !== undefined && obj[key] !== null, "missing");
  }
}

requireKeys(source, ["show", "season", "tribes", "quotes", "episodes"], "source");
check(
  "cast-or-survivors",
  (Array.isArray(source.cast) && source.cast.length >= 2) ||
    (Array.isArray(source.survivors) && source.survivors.length >= 2),
  String((source.cast && source.cast.length) || (source.survivors && source.survivors.length))
);
check("exactly-one-live-episode-or-none", (source.episodes || []).filter((ep) => ep.status === "live").length <= 1);

const ids = new Set();
const slugs = new Set();
const names = new Set();
for (const member of cast) {
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
if (!boardNative) {
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
}

function jsonHasOrderId(value) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, "orderId")) return true;
  return Object.values(value).some(jsonHasOrderId);
}

check("public-board-strips-orderId", !jsonHasOrderId(board));
if (!boardNative) {
  const publicFills = (board.events || []).filter((event) => event && event.type === "fill");
  check("public-fills-keep-tape", publicFills.length === fills.length);
  for (const fill of publicFills) {
    check(`public-fill-no-brokerage:${fill.id}`, fill.orderId == null && fill.qty == null && fill.avg == null);
    check(`public-fill-ticker:${fill.id}`, Boolean(fill.ticker) && (fill.side === "buy" || fill.side === "sell"));
  }
  for (const mark of board.events || []) {
    if (!mark || mark.type !== "mark") continue;
    check(`public-mark-no-recorded:${mark.id}`, mark.recorded == null && mark.quotes == null);
  }
}

check("board-survivors", Array.isArray(board.survivors) && board.survivors.length === cast.length);
check("no-dual-position", board.survivors.every((s) => !s.position));
check("has-positions", board.survivors.every((s) => Array.isArray(s.positions) && s.positions.length > 0));
if (!boardNative) {
  check("snapshots", Array.isArray(board.snapshots) && board.snapshots.length === marks.length);
}

const start = board.startingBookUsd;
if (boardNative) {
  check("given-total", source.islandGivenUsd === 230, String(source.islandGivenUsd));
  check("pot-matches-given", source.islandPotUsd === 230, String(source.islandPotUsd));
} else {
  check("pot-is-sleeves", board.islandPotUsd === start * cast.length);
  check("given-total", typeof source.islandGivenUsd === "number" && source.islandGivenUsd > 0, String(source.islandGivenUsd));
  check("given-is-not-sleeves", source.islandGivenUsd !== start * cast.length);
}
check("board-given-total", board.islandGivenUsd === source.islandGivenUsd, String(board.islandGivenUsd));
check("merged-stays-false-or-true", source.merged === true || source.merged === false);

const firstBoot = (source.events || []).find((event) => event && event.type === "boot");
const carryMark = (source.events || []).find((event) => event && event.type === "mark" && event.kind === "carry");
const lastPreBootMark = firstBoot
  ? [...(source.events || [])]
      .filter((event) => event && event.type === "mark" && Date.parse(event.at || "") < Date.parse(firstBoot.at || ""))
      .pop()
  : null;

for (const s of board.survivors) {
  const sourceRow = (source.survivors || []).find((row) => row.id === s.id);
  const preBoot =
    lastPreBootMark && lastPreBootMark.recorded && typeof lastPreBootMark.recorded[s.id]?.bookUsd === "number"
      ? lastPreBootMark.recorded[s.id].bookUsd
      : null;
  const carryBook =
    carryMark && carryMark.recorded && typeof carryMark.recorded[s.id]?.bookUsd === "number"
      ? carryMark.recorded[s.id].bookUsd
      : boardNative && sourceRow && typeof sourceRow.priorMarkUsd === "number"
        ? sourceRow.priorMarkUsd
        : null;
  let computedWeek;
  if (boardNative && (s.status === "jury" || sourceRow?.status === "voted-out")) {
    computedWeek = s.weekPct;
  } else if (s.status === "jury" && preBoot != null) {
    computedWeek = pctRound(((preBoot - start) / start) * 100);
  } else if (s.status === "jury" && boardNative && sourceRow && typeof sourceRow.priorMarkUsd === "number") {
    computedWeek = pctRound(((sourceRow.priorMarkUsd - start) / start) * 100);
  } else if (carryBook != null && carryBook > 0) {
    computedWeek = pctRound(((s.bookUsd - carryBook) / carryBook) * 100);
  } else if (preBoot != null) {
    computedWeek = pctRound(((preBoot - start) / start) * 100);
  } else {
    computedWeek = pctRound(((s.bookUsd - start) / start) * 100);
  }
  check(
    `weekPct:${s.slug}`,
    Math.abs(computedWeek - s.weekPct) <= 0.02,
    `${s.weekPct} vs computed ${computedWeek} on basis ${carryBook ?? preBoot ?? s.bookUsd} (book ${s.bookUsd})`
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
  const gotBootSplit = carryBook != null && carryBook > start + 0.1;
  const sleeveCap = gotBootSplit && s.status !== "jury" ? carryBook + 0.05 : start + 0.05;
  check(`sleeve:${s.slug}`, sleeve <= sleeveCap, String(sleeve));
}

for (const tribe of board.tribes) {
  const living = board.survivors.filter((s) => s.tribeId === tribe.id && (s.status === "active" || s.status === "immune"));
  check(`living-count:${tribe.id}`, tribe.livingCount === living.length);
}

const live = (board.episodes || []).filter((ep) => ep.status === "live");
if (live.length === 1) {
  check("live-episode-has-path", Boolean(live[0].path));
}

if (!boardNative) {
  const snapIds = new Set(board.snapshots.map((snap) => snap.id));
  for (const ep of source.episodes || []) {
    for (const day of ep.days || []) {
      if (day.snapshotId) {
        check(`episode-day-snapshot:${ep.id}:${day.id}`, snapIds.has(day.snapshotId), day.snapshotId);
      }
    }
  }
  for (const day of (source.episode && source.episode.days) || []) {
    if (day.snapshotId) {
      check(`live-episode-day-snapshot:${day.id}`, snapIds.has(day.snapshotId), day.snapshotId);
    }
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

const listingCopy = (source.episodes || [])
  .map((ep) => [ep.title, ep.weekLabel, ep.tease].filter(Boolean).join(" "))
  .join("\n");
const seasonHub = readFileSync(join(root, "templates", "season.html"), "utf8");
const appJs = readFileSync(join(root, "app.js"), "utf8");
const listStart = seasonHub.indexOf('id="episode-list"');
const listBlock = listStart >= 0 ? seasonHub.slice(listStart, listStart + 1200) : seasonHub;
for (const name of (source.tribalLog || []).map((entry) => entry && entry.bootName).filter(Boolean)) {
  check(`episode-list-tease-no-boot:${name}`, !listingCopy.includes(name), name);
  check(`season-hub-list-no-boot:${name}`, !listBlock.includes(name), name);
}
check(
  "episode-list-no-boot-recap",
  !appJs.includes("closedNote") && !appJs.includes("bootLine")
);

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
