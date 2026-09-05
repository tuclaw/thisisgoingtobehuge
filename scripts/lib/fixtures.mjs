/** Generated live-board and tape fixtures. */
import { createHash } from "node:crypto";
import { tickerOf, isCashLeg } from "./ledger.mjs";
import { loadTapeConversations } from "./tapes.mjs";

function round4(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return n;
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

export function cashUsd(positions) {
  return round4(
    (positions || [])
      .filter((pos) => isCashLeg(pos) || tickerOf(pos) === "CASH")
      .reduce((sum, pos) => sum + (Number(pos.sizeUsd) || 0), 0)
  );
}

export function publicLots(positions) {
  return (positions || [])
    .map((pos) => ({
      ticker: tickerOf(pos),
      qty: pos.qty == null ? null : String(pos.qty),
      sizeUsd: round4(Number(pos.sizeUsd) || 0)
    }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker) || String(a.qty).localeCompare(String(b.qty)));
}

function tribeDigest(tribe) {
  if (!tribe) return null;
  return {
    combinedWeekPct: tribe.combinedWeekPct ?? 0,
    combinedDayPct: tribe.combinedDayPct ?? 0,
    livingCount: tribe.livingCount ?? null
  };
}

function snapshotBookDigest(books, idToSlug) {
  const out = {};
  for (const [id, book] of Object.entries(books || {})) {
    const slug = idToSlug.get(id) || id;
    out[slug] = {
      bookUsd: book.bookUsd,
      weekPct: book.weekPct,
      dayPct: book.dayPct
    };
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

export function liveBoardFixture(source, board) {
  const idToSlug = new Map((board.survivors || []).map((row) => [row.id, row.slug]));
  const survivors = [...(board.survivors || [])]
    .sort((a, b) => String(a.slug).localeCompare(String(b.slug)))
    .map((row) => ({
      slug: row.slug,
      status: row.status,
      bookUsd: row.bookUsd,
      weekPct: row.weekPct,
      dayPct: row.dayPct,
      cashUsd: cashUsd(row.positions),
      lots: publicLots(row.positions)
    }));
  const snapshotDigests = {};
  for (const snap of board.snapshots || []) {
    snapshotDigests[snap.id] = {
      at: snap.at || null,
      givenUsd: typeof snap.givenUsd === "number" ? snap.givenUsd : null,
      tribes: {
        bidu: tribeDigest(snap.tribes && snap.tribes.bidu),
        askara: tribeDigest(snap.tribes && snap.tribes.askara)
      },
      books: snapshotBookDigest(snap.books, idToSlug)
    };
  }
  return {
    liveSnapshotId: source.liveSnapshotId || null,
    markedAt: board.markedAt || null,
    markLabel: board.markLabel || null,
    lastSession: source.lastSession || null,
    liveEpisodeId: source.episode && source.episode.id ? source.episode.id : null,
    islandGivenUsd: source.islandGivenUsd,
    islandPotUsd: source.islandPotUsd,
    tribes: (board.tribes || []).map((tribe) => ({
      id: tribe.id,
      combinedWeekPct: tribe.combinedWeekPct,
      combinedDayPct: tribe.combinedDayPct,
      livingCount: tribe.livingCount
    })),
    survivors,
    snapshotIds: (board.snapshots || []).map((snap) => snap.id),
    snapshotDigests,
    fillIds: (source.events || [])
      .filter((event) => event && event.type === "fill")
      .map((event) => event.id)
      .sort()
  };
}

export function tapeMessageHash(messages) {
  const payload = (messages || []).map((msg) => ({ from: msg && msg.from, text: msg && msg.text }));
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function tapesFixture(rootDir, manifest) {
  const out = {};
  for (const tape of manifest) {
    const loaded = loadTapeConversations(rootDir, tape.file);
    const threads = {};
    for (const id of Object.keys(loaded.byId).sort()) {
      const convo = loaded.byId[id];
      threads[id] = {
        count: (convo.messages || []).length,
        from: (convo.messages || []).map((msg) => msg.from),
        hash: tapeMessageHash(convo.messages)
      };
    }
    out[tape.file] = {
      global: loaded.global || tape.global || null,
      threadIds: Object.keys(threads),
      threads
    };
  }
  return out;
}

export function diffValues(expected, actual, path = "") {
  const diffs = [];
  if (Object.is(expected, actual)) return diffs;
  const expType = expected === null ? "null" : Array.isArray(expected) ? "array" : typeof expected;
  const actType = actual === null ? "null" : Array.isArray(actual) ? "array" : typeof actual;
  if (expType !== actType) {
    diffs.push(`${path || "$"}: expected ${expType}, got ${actType}`);
    return diffs;
  }
  if (expType !== "object" && expType !== "array") {
    diffs.push(`${path || "$"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    return diffs;
  }
  if (expType === "array") {
    if (expected.length !== actual.length) {
      diffs.push(`${path || "$"}: length ${actual.length} != ${expected.length}`);
    }
    const n = Math.max(expected.length, actual.length);
    for (let i = 0; i < n; i += 1) {
      diffs.push(...diffValues(expected[i], actual[i], `${path}[${i}]`));
    }
    return diffs;
  }
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const key of [...keys].sort()) {
    if (!(key in expected)) {
      diffs.push(`${path ? path + "." : ""}${key}: unexpected`);
      continue;
    }
    if (!(key in actual)) {
      diffs.push(`${path ? path + "." : ""}${key}: missing`);
      continue;
    }
    diffs.push(...diffValues(expected[key], actual[key], path ? `${path}.${key}` : key));
  }
  return diffs;
}
