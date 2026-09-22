#!/usr/bin/env node
/**
 * Live season cut: generated board fixture + episode/tribal structure.
 * Regen books with `npm run fixtures` when the ledger moves.
 * Do not pin live qty/quotes here — those live in data/fixtures/live-board.json.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeason, isBoardNative } from "./lib/ledger.mjs";
import { liveBoardFixture, diffValues } from "./lib/fixtures.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "data", "season1.json"), "utf8"));
const board = deriveSeason(source);
const boardNative = isBoardNative(source);
const frozen = JSON.parse(readFileSync(join(root, "data", "fixtures", "live-board.json"), "utf8"));
const generated = liveBoardFixture(source, board);

const failures = [];
function check(name, ok, detail) {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

const NICKS = ["Gage", "Mara", "Hex", "Nori", "Vesper", "Pax", "Riot", "Quill", "Sable", "Kite", "Juno", "Reed"];
const FORBIDDEN = ["robinhood", "agentic", "last-four", "merge floor", "merge date", "merge headcount"];

function assertChrome(obj, label) {
  const text = JSON.stringify(obj || {});
  for (const nick of NICKS) {
    check(`${label}-no-nick:${nick}`, !text.includes(nick));
  }
  for (const bad of FORBIDDEN) {
    check(`${label}-no-${bad.replace(/\s+/g, "-")}`, !text.toLowerCase().includes(bad));
  }
}

function assertBooths(beat, slugs, label) {
  check(`${label}-exist`, Boolean(beat) && beat.type === "booths");
  const items = (beat && beat.items) || [];
  check(`${label}-count`, items.length === slugs.length, String(items.length));
  check(`${label}-slugs`, items.map((item) => item.slug).join("|") === slugs.join("|"));
  assertChrome(beat, label);
}

const fixtureDiffs = diffValues(frozen, generated);
check("live-board-fixture", fixtureDiffs.length === 0, fixtureDiffs.slice(0, 20).join("; "));

const fills = (source.events || []).filter((event) => event.type === "fill");
if (!boardNative) {
  check("sold-lots-are-events", fills.some((f) => f.side === "sell" && f.ticker === "SMCI"));
  check("sold-hood-is-event", fills.some((f) => f.side === "sell" && f.ticker === "HOOD"));
  check("sold-btal-is-event", fills.some((f) => f.side === "sell" && f.ticker === "BTAL"));
  check("sold-island-nvda-is-event", fills.some((f) => f.side === "sell" && f.ticker === "NVDA"));
  check("sold-island-tsla-is-event", fills.some((f) => f.side === "sell" && f.ticker === "TSLA"));
  check("sold-island-gld-is-event", fills.some((f) => f.side === "sell" && f.ticker === "GLD"));
  check("sold-island-coin-is-event", fills.some((f) => f.side === "sell" && f.ticker === "COIN"));
}

const listedE1 = (board.episodes || []).find((ep) => ep && ep.id === "s1e01");
const listedE2 = (board.episodes || []).find((ep) => ep && ep.id === "s1e02");
const listedE3 = (board.episodes || []).find((ep) => ep && ep.id === "s1e03");
const listedE4 = (board.episodes || []).find((ep) => ep && ep.id === "s1e04");
const listedE5 = (board.episodes || []).find((ep) => ep && ep.id === "s1e05");
const listedE6 = (board.episodes || []).find((ep) => ep && ep.id === "s1e06");
const listedE7 = (board.episodes || []).find((ep) => ep && ep.id === "s1e07");
check("e1-week-bounds", listedE1 && listedE1.weekStart === "2026-08-24" && listedE1.weekEnd === "2026-08-28");
check("e2-week-bounds", listedE2 && listedE2.weekStart === "2026-08-31" && listedE2.weekEnd === "2026-09-04");
check("e2-diagram-starts-at-cash-add", listedE2 && listedE2.diagramStartSnapshotId === "s1e02-cash-add");
check(
  "e3-diagram-starts-at-carry",
  listedE3 &&
    listedE3.diagramStartSnapshotId === "s1e03-carry"
);
check(
  "e4-diagram-starts-at-carry",
  listedE4 && listedE4.diagramStartSnapshotId === "s1e04-carry"
);
check(
  "e5-diagram-starts-at-carry",
  listedE5 && listedE5.diagramStartSnapshotId === "s1e05-carry"
);
check(
  "e6-diagram-starts-at-carry-sip",
  listedE6 && listedE6.diagramStartSnapshotId === "s1e06-carry-sip"
);
check(
  "e7-diagram-starts-at-carry",
  listedE7 &&
    listedE7.diagramStartSnapshotId === "s1e07-carry" &&
    source.episode &&
    source.episode.diagramStartSnapshotId === "s1e07-carry"
);
check(
  "ticker-live-open",
  board.snapshots.some((s) => s.id === "s1e02-mon-open"),
  "missing s1e02-mon-open"
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

const e1Listed = (source.episodes || []).find((ep) => ep.id === "s1e01");
const wiredDays = (e1Listed && e1Listed.days) || [];
const wiredIds = wiredDays.map((day) => day.id).join("|");
check("episode-days-wire-history", wiredIds === "monday|tuesday|wednesday|thursday", wiredIds);
check(
  "wednesday-board-wire",
  wiredDays.find((day) => day.id === "wednesday") &&
    wiredDays.find((day) => day.id === "wednesday").snapshotId === "s1e01-wed-sip" &&
    wiredDays.find((day) => day.id === "wednesday").board === "day-wednesday"
);
check(
  "thursday-board-wire",
  wiredDays.find((day) => day.id === "thursday") &&
    wiredDays.find((day) => day.id === "thursday").snapshotId === "s1e01-thu-sip" &&
    wiredDays.find((day) => day.id === "thursday").board === "day-thursday"
);
check(
  "friday-not-wired-as-day-board",
  !wiredDays.some((day) => day.id === "friday" || /fri-lasthour|fri-mid|fri-open/.test(String(day.snapshotId || "")))
);

check(
  "no-invented-friday-sip",
  !(source.events || []).some((event) => event && event.type === "mark" && /fri.*sip/i.test(String(event.id || "")))
);
check("no-placeholder-order-ids", !fills.some((f) => /001122334455/.test(String(f.orderId || ""))));

const e3Carry = (source.events || []).find((event) => event && event.id === "s1e03-carry");
check("e3-carry-mark", Boolean(e3Carry) && e3Carry.kind === "carry" && e3Carry.at === "2026-09-07T07:00:00Z");
if (e3Carry && e3Carry.recorded) {
  const juryIds = new Set(
    (source.survivors || []).filter((s) => s.name === "Claude Fable 5" || s.name === "Gemini 3.1 Pro").map((s) => s.id)
  );
  const carryLivingIds = Object.keys(e3Carry.recorded).filter((id) => !juryIds.has(id));
  check(
    "e3-carry-week-reset",
    carryLivingIds.length === 10 && carryLivingIds.every((id) => e3Carry.recorded[id] && e3Carry.recorded[id].weekPct === 0)
  );
}
const e3TueMid = (source.events || []).find((event) => event && event.id === "s1e03-tue-mid");
check("e3-tue-mid-mark", Boolean(e3TueMid) && e3TueMid.kind === "intraday" && e3TueMid.at === "2026-09-08T17:00:00Z");
const e3TueEod = (source.events || []).find((event) => event && event.id === "s1e03-tue-eod");
check("e3-tue-eod-mark", Boolean(e3TueEod) && e3TueEod.kind === "close" && e3TueEod.at === "2026-09-08T21:00:00Z");
const e4Carry = (source.events || []).find((event) => event && event.id === "s1e04-carry");
check("e4-carry-mark", Boolean(e4Carry) && e4Carry.kind === "carry" && e4Carry.at === "2026-09-08T21:30:00Z");
if (e4Carry && e4Carry.recorded) {
  const e4CarryIds = Object.keys(e4Carry.recorded);
  check(
    "e4-carry-week-reset",
    e4CarryIds.length === 8 && e4CarryIds.every((id) => e4Carry.recorded[id] && e4Carry.recorded[id].weekPct === 0)
  );
}
const e5Carry = (source.events || []).find((event) => event && event.id === "s1e05-carry");
check("e5-carry-mark", Boolean(e5Carry) && e5Carry.kind === "carry" && e5Carry.at === "2026-09-11T21:30:00Z");
if (e5Carry && e5Carry.recorded) {
  const e5CarryIds = Object.keys(e5Carry.recorded);
  check(
    "e5-carry-week-reset",
    e5CarryIds.length === 7 && e5CarryIds.every((id) => e5Carry.recorded[id] && e5Carry.recorded[id].weekPct === 0)
  );
}

const episodeCopy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e01.json"), "utf8"));
const episode2Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e02.json"), "utf8"));
const episode3Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e03.json"), "utf8"));
const episode4Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e04.json"), "utf8"));
const episode5Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e05.json"), "utf8"));
const episode6Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e06.json"), "utf8"));
const episode7Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e07.json"), "utf8"));

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
  "week-board-snapshot-lasthour",
  episodeCopy.weekBoard && episodeCopy.weekBoard.snapshotId === "s1e01-fri-lasthour"
);
check("e1-week-board-snapshot-id", e1Listed && e1Listed.weekBoardSnapshotId === "s1e01-fri-lasthour");

const friday = (episodeCopy.days || []).find((day) => day.id === "friday");
const fridayBeats = (friday && friday.beats) || [];
const fridayBooks = fridayBeats.find((beat) => beat.id === "friday-lasthour");
const fridayBooths = fridayBeats.find((beat) => beat.id === "friday-confessionals");
const fridayLunch = fridayBeats.find((beat) => beat.id === "friday-lunch");
check("friday-booths-before-lunch", Boolean(fridayBooths) && Boolean(fridayLunch) && fridayBeats.indexOf(fridayBooths) < fridayBeats.indexOf(fridayLunch));
check("friday-lunch-before-lasthour", Boolean(fridayLunch) && Boolean(fridayBooks) && fridayBeats.indexOf(fridayLunch) < fridayBeats.indexOf(fridayBooks));
check("friday-lunch-beat", Boolean(fridayLunch) && fridayLunch.type === "lunch-chats");
assertBooths(fridayBooths, ["claude-fable-5", "grok-4-5", "kimi-k3"], "friday-booths");

const tribalDay = (episodeCopy.days || []).find((day) => day.id === "tribal");
check("tribal-fold-published", Boolean(tribalDay) && tribalDay.dark !== true);
const tribalBeats = (tribalDay && tribalDay.beats) || [];
const prevote = tribalBeats.find((beat) => beat.id === "tribal-prevote");
const tribalCut = tribalBeats.find((beat) => beat.type === "tribal");
check("tribal-prevote-before-cut", Boolean(prevote) && Boolean(tribalCut) && tribalBeats.indexOf(prevote) < tribalBeats.indexOf(tribalCut));
const exitInterview = tribalBeats.find((beat) => beat.id === "exit-interview");
check("tribal-exit-after-cut", Boolean(exitInterview) && Boolean(tribalCut) && tribalBeats.indexOf(exitInterview) > tribalBeats.indexOf(tribalCut));
assertBooths(exitInterview, ["claude-fable-5"], "tribal-exit");
check("tribal-exit-audience-only", exitInterview && exitInterview.body === "Audience only.");
check("tribal-prevote-count", prevote && (prevote.items || []).length === 6);
if (prevote) {
  check(
    "tribal-prevote-models",
    (prevote.items || []).map((item) => item.name).join("|") ===
      "Grok 4.5|GPT-5.6 Sol|Claude Fable 5|Gemini 3.1 Pro|GPT-5.6 Luna|Kimi K3"
  );
}

const log = source.tribalLog || [];
check("tribal-log-eight-councils", Array.isArray(log) && log.length === 8);
check("tribal-log-dq-is-third", log[2] && log[2].type === "disqualification" && log[2].bootName === "Grok 4.5");
check("tribal-log-merge-is-fourth", log[3] && log[3].type === "merge" && log[3].merged === true);
check("tribal-log-e03-bootName", log[4] && log[4].bootName === "GPT-5.6 Sol" && log[4].episode === "s1e03");
if (log[4]) {
  const e03Votes = Array.isArray(log[4].votes) ? log[4].votes : [];
  check(
    "tribal-log-e03-votes",
    e03Votes.map((v) => `${v.from}>${v.for}`).join("|") ===
      "Claude Opus 5>GPT-5.6 Sol|Claude Sonnet 5>GPT-5.6 Sol|Composer 2.5>Claude Opus 5|GPT-5.6 Luna>GPT-5.6 Sol|GPT-5.6 Sol>GPT-5.6 Sol|GPT-5.6 Terra>GPT-5.6 Sol|Gemini 3.7 Flash>GPT-5.6 Sol|Kimi K3>GPT-5.6 Sol"
  );
  check(
    "tribal-log-e03-official-tally",
    log[4].tally && log[4].tally["GPT-5.6 Sol"] === 7 && log[4].tally["Claude Opus 5"] === 1
  );
  check(
    "tribal-log-e03-official-summary",
    typeof log[4].summary === "string" &&
      log[4].summary.includes("GPT-5.6 Sol voted out 7–1") &&
      log[4].summary.includes("Grok 4.6 immune")
  );
}
check("tribal-log-e04-bootName", log[5] && log[5].bootName === "Kimi K3" && log[5].episode === "s1e04");
if (log[5]) {
  const e04Votes = Array.isArray(log[5].votes) ? log[5].votes : [];
  check(
    "tribal-log-e04-round1-votes",
    e04Votes.map((v) => `${v.from}>${v.for}`).join("|") ===
      "Kimi K3>Claude Sonnet 5|Claude Sonnet 5>Composer 2.5|Gemini 3.7 Flash>Kimi K3|Grok 4.6>Kimi K3|GPT-5.6 Luna>Composer 2.5|Claude Opus 5>Composer 2.5|Composer 2.5>Kimi K3"
  );
  check(
    "tribal-log-e04-round1-tally",
    log[5].tally && log[5].tally["Composer 2.5"] === 3 && log[5].tally["Kimi K3"] === 3 && log[5].tally["Claude Sonnet 5"] === 1
  );
  check(
    "tribal-log-e04-revote-tally",
    log[5].revoteTally && log[5].revoteTally["Kimi K3"] === 3 && log[5].revoteTally["Composer 2.5"] === 2
  );
  check(
    "tribal-log-e04-official-summary",
    typeof log[5].summary === "string" &&
      log[5].summary.includes("Kimi K3 voted out") &&
      log[5].summary.includes("GPT-5.6 Terra immune")
  );
}
check("tribal-log-e05-bootName", log[6] && log[6].bootName === "Grok 4.6" && log[6].episode === "s1e05");
if (log[6]) {
  const e05Votes = Array.isArray(log[6].votes) ? log[6].votes : [];
  check(
    "tribal-log-e05-votes",
    e05Votes.map((v) => `${v.from}>${v.for}`).join("|") ===
      "GPT-5.6 Terra>Grok 4.6|Gemini 3.7 Flash>Grok 4.6|GPT-5.6 Luna>Grok 4.6|Composer 2.5>GPT-5.6 Terra|Claude Opus 5>GPT-5.6 Luna|Grok 4.6>GPT-5.6 Luna"
  );
  check(
    "tribal-log-e05-tally",
    log[6].tally && log[6].tally["Grok 4.6"] === 3 && log[6].tally["GPT-5.6 Luna"] === 2 && log[6].tally["GPT-5.6 Terra"] === 1
  );
  check(
    "tribal-log-e05-official-summary",
    typeof log[6].summary === "string" &&
      log[6].summary.includes("Grok 4.6 voted out") &&
      log[6].summary.includes("Claude Sonnet 5 immune")
  );
}
check("tribal-log-e06-bootName", log[7] && log[7].bootName === "Gemini 3.7 Flash" && log[7].episode === "s1e06");
if (log[7]) {
  const e06Votes = Array.isArray(log[7].votes) ? log[7].votes : [];
  check(
    "tribal-log-e06-votes",
    e06Votes.map((v) => `${v.from}>${v.for}`).join("|") ===
      "GPT-5.6 Terra>Gemini 3.7 Flash|Claude Opus 5>Gemini 3.7 Flash|GPT-5.6 Luna>Gemini 3.7 Flash|Claude Sonnet 5>Gemini 3.7 Flash|Gemini 3.7 Flash>GPT-5.6 Luna"
  );
  check(
    "tribal-log-e06-tally",
    log[7].tally && log[7].tally["Gemini 3.7 Flash"] === 4 && log[7].tally["GPT-5.6 Luna"] === 1
  );
  check(
    "tribal-log-e06-official-summary",
    typeof log[7].summary === "string" &&
      log[7].summary.includes("Gemini 3.7 Flash voted out") &&
      log[7].summary.includes("Composer 2.5 immune")
  );
}
if (log[0]) {
  check("tribal-log-e01-bootName", log[0].bootName === "Claude Fable 5");
  const votes = Array.isArray(log[0].votes) ? log[0].votes : [];
  check(
    "tribal-log-e01-votes",
    votes.map((v) => `${v.from}>${v.for}`).join("|") ===
      "Grok 4.5>Claude Fable 5|GPT-5.6 Sol>Claude Fable 5|Claude Fable 5>Grok 4.5|Gemini 3.1 Pro>Claude Fable 5|GPT-5.6 Luna>Claude Fable 5|Kimi K3>Claude Fable 5"
  );
  check("tribal-log-e01-official-tally", log[0].tally && log[0].tally["Claude Fable 5"] === 5 && log[0].tally["Grok 4.5"] === 1);
  check("tribal-log-e01-official-summary", typeof log[0].summary === "string" && log[0].summary.includes("Claude Fable 5 voted out 5–1"));
}
if (log[1]) {
  check("tribal-log-e02-bootName", log[1].bootName === "Gemini 3.1 Pro");
  check("tribal-log-e02-episode", log[1].episode === "s1e02");
  const e02Votes = Array.isArray(log[1].votes) ? log[1].votes : [];
  check(
    "tribal-log-e02-votes",
    e02Votes.map((v) => `${v.from}>${v.for}`).join("|") ===
      "GPT-5.6 Sol>Gemini 3.1 Pro|Gemini 3.1 Pro>GPT-5.6 Sol|GPT-5.6 Luna>Gemini 3.1 Pro|Kimi K3>Gemini 3.1 Pro"
  );
  check("tribal-log-e02-official-tally", log[1].tally && log[1].tally["Gemini 3.1 Pro"] === 3 && log[1].tally["GPT-5.6 Sol"] === 1);
  check(
    "tribal-log-e02-official-summary",
    typeof log[1].summary === "string" &&
      log[1].summary.includes("Gemini 3.1 Pro voted out 3–1") &&
      log[1].summary.includes("Grok 4.5 vote skipped")
  );
}

const fableLive = board.survivors.find((s) => s.name === "Claude Fable 5");
const geminiProLive = board.survivors.find((s) => s.name === "Gemini 3.1 Pro");
const grok45Live = board.survivors.find((s) => s.name === "Grok 4.5");
const solLive = board.survivors.find((s) => s.name === "GPT-5.6 Sol");
const biduLive = board.tribes.find((t) => t.id === "bidu");
const askaraLive = board.tribes.find((t) => t.id === "askara");
check("books-fable-jury-zero", fableLive && fableLive.status === "jury" && fableLive.bookUsd === 0);
check("books-pro-jury-zero", geminiProLive && geminiProLive.status === "jury" && geminiProLive.bookUsd === 0);
check("books-grok45-disqualified", grok45Live && grok45Live.status === "disqualified" && grok45Live.bookUsd === 0);
check("books-sol-jury-zero", solLive && (solLive.status === "jury" || solLive.status === "voted-out") && solLive.bookUsd === 0);
check("books-living-counts", biduLive && biduLive.livingCount === 4 && askaraLive && askaraLive.livingCount === 1);

const home = readFileSync(join(root, "templates", "island.html"), "utf8");
check(
  "homepage-given-copy",
  home.includes("$361.93 given. Five still in. MERGED. Gemini 3.7 Flash voted out Fri Sep 18 tribal. Episode 7 live Mon Sep 21 – Tue Sep 22. Tuesday and Friday tribal.")
);
check("homepage-no-even-up-480", !home.includes("$480.10") && !home.includes("even-up to $53.20"));
check("homepage-points-at-e07", home.includes("seasons/1/e07.html") && home.includes("Walk into Episode 7"));
check("homepage-skips-e06-primary-cta", !home.includes("Walk into Episode 6"));
check("merged-true", source.merged === true);
check(
  "status-label-e07-tue-eod-rth",
  source.statusLabel ===
    "Episode 7 · Tue RTH-EOD remake · five living · MERGED · tribal due"
);
const e4Sip = (source.events || []).find((event) => event && event.id === "s1e04-tue-sip");
check("e4-tue-sip-mark", Boolean(e4Sip) && e4Sip.kind === "close" && e4Sip.at === "2026-09-09T02:15:00Z");
const e4WedOpen = (source.events || []).find((event) => event && event.id === "s1e04-wed-open");
check("e4-wed-open-mark", Boolean(e4WedOpen) && e4WedOpen.kind === "open" && e4WedOpen.at === "2026-09-09T13:49:00Z");
const e4WedEod = (source.events || []).find((event) => event && event.id === "s1e04-wed-eod");
check(
  "e4-wed-eod-mark",
  Boolean(e4WedEod) && e4WedEod.kind === "close" && e4WedEod.at === "2026-09-09T20:00:00Z"
);
const e4ThuEod = (source.events || []).find((event) => event && event.id === "s1e04-thu-eod");
check(
  "e4-thu-eod-mark",
  Boolean(e4ThuEod) && e4ThuEod.kind === "close" && e4ThuEod.at === "2026-09-11T00:11:37Z"
);
const e4FriOpen = (source.events || []).find((event) => event && event.id === "s1e04-fri-open");
check(
  "e4-fri-open-mark",
  Boolean(e4FriOpen) && e4FriOpen.kind === "open" && e4FriOpen.at === "2026-09-11T13:47:07Z"
);
const e4FriMidRemake = (source.events || []).find((event) => event && event.id === "mark-2026-09-11-mid");
check("e4-fri-mid-remake", Boolean(e4FriMidRemake) && e4FriMidRemake.at === "2026-09-11T17:06:02Z");
const e4FriEodRth = (source.events || []).find((event) => event && event.id === "s1e04-fri-eod-rth");
check(
  "e4-fri-eod-rth-mark",
  Boolean(e4FriEodRth) &&
    e4FriEodRth.kind === "close-rth-last" &&
    e4FriEodRth.at === "2026-09-11T20:00:05Z" &&
    e4FriEodRth.sipMissing === true
);
const e5MonLasthourRemake = (source.events || []).find((event) => event && event.id === "s1e05-mon-lasthour");
check(
  "e5-mon-lasthour-remake",
  Boolean(e5MonLasthourRemake) && e5MonLasthourRemake.type === "lasthour-remake"
);
const e5MonEod = (source.events || []).find((event) => event && event.id === "s1e05-mon-eod");
check(
  "e5-mon-eod-mark",
  Boolean(e5MonEod) &&
    e5MonEod.kind === "close-sip" &&
    e5MonEod.at === "2026-09-14T20:00:00Z" &&
    e5MonEod.closeDate === "2026-09-14"
);
const e5TueEodRth = (source.events || []).find((event) => event && event.id === "s1e05-tue-eod-rth");
check(
  "e5-tue-eod-rth-mark",
  Boolean(e5TueEodRth) &&
    e5TueEodRth.kind === "close-rth-last" &&
    e5TueEodRth.at === "2026-09-15T20:00:05Z" &&
    e5TueEodRth.sipMissing === true
);
const e5TueEodSip = (source.events || []).find((event) => event && event.id === "s1e05-tue-eod-sip");
check(
  "e5-tue-eod-sip-mark",
  Boolean(e5TueEodSip) && e5TueEodSip.kind === "close-sip" && e5TueEodSip.closeDate === "2026-09-15"
);
const e6Carry = (source.events || []).find((event) => event && event.id === "s1e06-carry");
check("e6-carry-mark", Boolean(e6Carry) && e6Carry.kind === "carry" && e6Carry.at === "2026-09-15T21:30:00Z");
if (e6Carry && e6Carry.recorded) {
  const e6CarryIds = Object.keys(e6Carry.recorded);
  check(
    "e6-carry-week-reset",
    e6CarryIds.length === 6 && e6CarryIds.every((id) => e6Carry.recorded[id] && e6Carry.recorded[id].weekPct === 0)
  );
}
const e6WedOpen = (source.events || []).find((event) => event && event.id === "s1e06-wed-open");
check(
  "e6-wed-open-mark",
  Boolean(e6WedOpen) && e6WedOpen.kind === "open" && e6WedOpen.at === "2026-09-16T14:05:37Z"
);
const e6WedEodRth = (source.events || []).find((event) => event && event.id === "s1e06-wed-eod-rth");
check(
  "e6-wed-eod-rth-mark",
  Boolean(e6WedEodRth) &&
    e6WedEodRth.kind === "close-rth-last" &&
    e6WedEodRth.at === "2026-09-16T20:00:05Z" &&
    e6WedEodRth.sipMissing === true &&
    e6WedEodRth.officialCloseDateStill === "2026-09-15"
);
const e6WedEodSip = (source.events || []).find((event) => event && event.id === "s1e06-wed-eod-sip");
check(
  "e6-wed-eod-sip-mark",
  Boolean(e6WedEodSip) &&
    e6WedEodSip.kind === "close" &&
    e6WedEodSip.at === "2026-09-17T00:16:51Z" &&
    e6WedEodSip.officialCloseDate === "2026-09-16" &&
    e6WedEodSip.upgradesSnapshotId === "s1e06-wed-eod-rth" &&
    e6WedEodSip.sipMissing === false
);
const e6ThuOpen = (source.events || []).find((event) => event && event.id === "s1e06-thu-open");
check(
  "e6-thu-open-mark",
  Boolean(e6ThuOpen) && e6ThuOpen.kind === "open" && e6ThuOpen.at === "2026-09-17T14:07:04Z"
);
const e6ThuMid = (source.events || []).find((event) => event && event.id === "s1e06-thu-mid");
check(
  "e6-thu-mid-mark",
  Boolean(e6ThuMid) && e6ThuMid.kind === "mid" && e6ThuMid.at === "2026-09-17T17:21:00Z"
);
const e6ThuLasthour = (source.events || []).find(
  (event) => event && event.id === "s1e06-thu-lasthour" && event.type === "mark"
);
check(
  "e6-thu-lasthour-mark",
  Boolean(e6ThuLasthour) && e6ThuLasthour.kind === "intraday" && e6ThuLasthour.at === "2026-09-17T19:30:30Z"
);
const e6ThuEodRth = (source.events || []).find((event) => event && event.id === "s1e06-thu-eod-rth");
check(
  "e6-thu-eod-rth-mark",
  Boolean(e6ThuEodRth) &&
    e6ThuEodRth.kind === "close-rth-last" &&
    e6ThuEodRth.at === "2026-09-17T20:00:05Z" &&
    e6ThuEodRth.sipMissing === true &&
    e6ThuEodRth.officialCloseDateStill === "2026-09-16"
);
const e6ThuEodSip = (source.events || []).find((event) => event && event.id === "s1e06-thu-eod-sip");
check(
  "e6-thu-eod-sip-mark",
  Boolean(e6ThuEodSip) &&
    e6ThuEodSip.kind === "close" &&
    e6ThuEodSip.at === "2026-09-18T00:17:18Z" &&
    e6ThuEodSip.officialCloseDate === "2026-09-17" &&
    e6ThuEodSip.interpolated === false &&
    e6ThuEodSip.upgradesSnapshotId === "s1e06-thu-eod-rth" &&
    e6ThuEodSip.sipMissing === false
);
const e6FriOpen = (source.events || []).find((event) => event && event.id === "s1e06-fri-open");
check(
  "e6-fri-open-mark",
  Boolean(e6FriOpen) && e6FriOpen.kind === "open" && e6FriOpen.at === "2026-09-18T14:10:04Z"
);
const e6FriMid = (source.events || []).find((event) => event && event.id === "s1e06-fri-mid");
check(
  "e6-fri-mid-mark",
  Boolean(e6FriMid) && e6FriMid.kind === "mid" && e6FriMid.at === "2026-09-18T17:15:19Z"
);
const e6FriLasthour = (source.events || []).find((event) => event && event.id === "s1e06-fri-lasthour");
check(
  "e6-fri-lasthour-mark",
  Boolean(e6FriLasthour) &&
    e6FriLasthour.kind === "intraday" &&
    e6FriLasthour.at === "2026-09-18T19:22:03Z"
);
const e6FriEodRth = (source.events || []).find((event) => event && event.id === "s1e06-fri-eod-rth");
check(
  "e6-fri-eod-rth-mark",
  Boolean(e6FriEodRth) &&
    e6FriEodRth.kind === "close-rth-last" &&
    e6FriEodRth.at === "2026-09-18T20:00:05Z"
);
const e7Carry = (source.events || []).find((event) => event && event.id === "s1e07-carry");
check("e7-carry-mark", Boolean(e7Carry) && e7Carry.kind === "carry" && e7Carry.lastSession === "2026-09-18-tribal");
const e7MonOpen = (source.events || []).find((event) => event && event.id === "s1e07-mon-open");
check(
  "e7-mon-open-mark",
  Boolean(e7MonOpen) && e7MonOpen.kind === "open" && e7MonOpen.at === "2026-09-21T14:24:20Z"
);
const e7MonMid = (source.events || []).find((event) => event && event.id === "s1e07-mon-mid");
check(
  "e7-mon-mid-mark",
  Boolean(e7MonMid) && e7MonMid.kind === "mid" && e7MonMid.at === "2026-09-21T17:29:24Z"
);
const e7MonLasthour = (source.events || []).find((event) => event && event.id === "s1e07-mon-lasthour");
check(
  "e7-mon-lasthour-mark",
  Boolean(e7MonLasthour) &&
    e7MonLasthour.kind === "intraday" &&
    e7MonLasthour.at === "2026-09-21T19:36:28Z"
);
const e7MonLasthourStrip = (source.events || []).find((event) => event && event.id === "s1e07-mon-lasthour-strip");
check(
  "e7-mon-lasthour-strip-mark",
  Boolean(e7MonLasthourStrip) &&
    e7MonLasthourStrip.kind === "corrective" &&
    e7MonLasthourStrip.at === "2026-09-21T20:40:00Z" &&
    e7MonLasthourStrip.corrects === "s1e07-mon-lasthour"
);
const e7MonEodSip = (source.events || []).find((event) => event && event.id === "s1e07-mon-eod-sip");
check(
  "e7-mon-eod-sip-mark",
  Boolean(e7MonEodSip) &&
    e7MonEodSip.kind === "close" &&
    e7MonEodSip.at === "2026-09-22T00:26:32Z" &&
    e7MonEodSip.officialCloseDate === "2026-09-21" &&
    e7MonEodSip.upgradesSnapshotId === "s1e07-mon-lasthour-strip" &&
    e7MonEodSip.sipMissing === false
);
const e7TueOpen = (source.events || []).find((event) => event && event.id === "s1e07-tue-open");
check(
  "e7-tue-open-mark",
  Boolean(e7TueOpen) &&
    e7TueOpen.kind === "open" &&
    e7TueOpen.at === "2026-09-22T14:20:00Z" &&
    e7TueOpen.upgradesSnapshotId === "s1e07-mon-eod-sip"
);
const e7TueMid = (source.events || []).find((event) => event && event.id === "s1e07-tue-mid");
check(
  "e7-tue-mid-mark",
  Boolean(e7TueMid) &&
    e7TueMid.kind === "mid" &&
    e7TueMid.at === "2026-09-22T17:21:30Z" &&
    e7TueMid.upgradesSnapshotId === "s1e07-tue-open"
);
const e7TueLasthour = (source.events || []).find((event) => event && event.id === "s1e07-tue-lasthour");
check(
  "e7-tue-lasthour-mark",
  Boolean(e7TueLasthour) &&
    e7TueLasthour.kind === "intraday" &&
    e7TueLasthour.at === "2026-09-22T19:24:06Z" &&
    e7TueLasthour.upgradesSnapshotId === "s1e07-tue-mid"
);
const e7TueEodRth = (source.events || []).find((event) => event && event.id === "s1e07-tue-eod-rth");
check(
  "e7-tue-eod-rth-mark",
  Boolean(e7TueEodRth) &&
    e7TueEodRth.kind === "close-rth-last" &&
    e7TueEodRth.at === "2026-09-22T21:20:00Z" &&
    e7TueEodRth.sipMissing === true &&
    e7TueEodRth.officialCloseDateStill === "2026-09-21"
);
check("live-snapshot-e07-tue-eod-rth", source.liveSnapshotId === "s1e07-tue-eod-rth");
check("last-session-e07-tue-eod", source.lastSession === "2026-09-22-eod");
check(
  "live-episode-is-e07",
  source.episode && source.episode.id === "s1e07" && source.episode.status === "live" && source.episode.path === "seasons/1/e07.html"
);
check(
  "live-episode-challenge",
  source.episode &&
    source.episode.challenge === "Season rule: always hold at least one US-listed stock or ETF (never all-cash)."
);
check("live-episode-week", source.episode && source.episode.weekLabel === "Monday Sep 21 – Tuesday Sep 22, 2026");
check("live-episode-tribal", source.episode && source.episode.tribalLabel === "Tuesday Sep 22, 2026 · 2:00 PM PT");
check("sip-missing-banner-cleared-e07-mon-sip", source.sipMissingBanner === undefined);
check("island-pot", source.islandPotUsd === 382.2146);
const composerLive = board.survivors.find((s) => s.name === "Composer 2.5");
const terraLive = board.survivors.find((s) => s.name === "GPT-5.6 Terra");
const grokLive = board.survivors.find((s) => s.name === "Grok 4.6");
const kimiLive = board.survivors.find((s) => s.name === "Kimi K3");
const sonnetLive = board.survivors.find((s) => s.name === "Claude Sonnet 5");
const opusLive = board.survivors.find((s) => s.name === "Claude Opus 5");
const lunaLive = board.survivors.find((s) => s.name === "GPT-5.6 Luna");
const flashLive = board.survivors.find((s) => s.name === "Gemini 3.7 Flash");
check(
  "immunity-terra-e07-tue-eod-rth",
  source.immunity &&
    source.immunity.name === "GPT-5.6 Terra" &&
    source.immunity.survivorId === terraLive?.id &&
    source.immunity.weekPct === -0.11 &&
    source.immunity.asOf === "2026-09-22-eod"
);
check("terra-tue-eod-immune", terraLive && terraLive.immune === true && terraLive.weekPct === -0.11);
check("luna-tue-eod-week", lunaLive && lunaLive.immune === false && lunaLive.weekPct === -0.72);
check("composer-tue-eod-week", composerLive && composerLive.immune === false && composerLive.weekPct === -4.36);
check(
  "grok-jury-zero",
  grokLive && (grokLive.status === "voted-out" || grokLive.status === "jury") && grokLive.bookUsd === 0
);
check("opus-tue-eod-week", opusLive && opusLive.immune === false && opusLive.weekPct === -1.79);
check("sonnet-tue-eod-week", sonnetLive && sonnetLive.immune === false && sonnetLive.weekPct === -1.81);
check(
  "flash-jury-zero",
  flashLive && (flashLive.status === "voted-out" || flashLive.status === "jury") && flashLive.jury && flashLive.bookUsd === 0
);
check("one-living-immune", board.survivors.filter((s) => s.status === "active" && s.immune).length === 1);

const episodeDayIds = (episodeCopy.days || []).map((day) => day.id);
check("saturday-after-tribal", episodeDayIds.indexOf("saturday") > episodeDayIds.indexOf("tribal"));
check("sunday-after-saturday", episodeDayIds.indexOf("sunday") > episodeDayIds.indexOf("saturday"));
check("sunday-after-tribal", episodeDayIds.indexOf("sunday") > episodeDayIds.indexOf("tribal"));
const e7DayIds = (episode7Copy.days || []).map((day) => day.id);
check("e07-monday-after-sunday", e7DayIds.indexOf("monday") > e7DayIds.indexOf("sunday"));
check("e07-tuesday-after-monday", e7DayIds.indexOf("tuesday") > e7DayIds.indexOf("monday"));

const e1 = (source.episodes || []).find((ep) => ep.id === "s1e01");
const e2 = (source.episodes || []).find((ep) => ep.id === "s1e02");
const e3 = (source.episodes || []).find((ep) => ep.id === "s1e03");
const e4 = (source.episodes || []).find((ep) => ep.id === "s1e04");
const e5 = (source.episodes || []).find((ep) => ep.id === "s1e05");
const e6 = (source.episodes || []).find((ep) => ep.id === "s1e06");
const e7 = (source.episodes || []).find((ep) => ep.id === "s1e07");
check("episode-1-closed", e1 && e1.status === "closed" && e1.path === "seasons/1/e01.html" && e1.boot === "Claude Fable 5");
check("episode-2-closed", e2 && e2.status === "closed" && e2.path === "seasons/1/e02.html" && e2.boot === "Gemini 3.1 Pro");
check("episode-3-closed", e3 && e3.status === "closed" && e3.path === "seasons/1/e03.html" && e3.boot === "GPT-5.6 Sol");
check("episode-4-closed", e4 && e4.status === "closed" && e4.path === "seasons/1/e04.html" && e4.boot === "Kimi K3");
check("episode-4-week-bounds", e4 && e4.weekStart === "2026-09-09" && e4.weekEnd === "2026-09-11");
check("episode-5-closed", e5 && e5.status === "closed" && e5.path === "seasons/1/e05.html" && e5.boot === "Grok 4.6");
check("episode-5-week-bounds", e5 && e5.weekStart === "2026-09-14" && e5.weekEnd === "2026-09-15");
check("episode-6-closed", e6 && e6.status === "closed" && e6.path === "seasons/1/e06.html" && e6.boot === "Gemini 3.7 Flash");
check("episode-6-week-bounds", e6 && e6.weekStart === "2026-09-16" && e6.weekEnd === "2026-09-18");
check("episode-7-live", e7 && e7.status === "live" && e7.path === "seasons/1/e07.html");
check("episode-7-week-bounds", e7 && e7.weekStart === "2026-09-21" && e7.weekEnd === "2026-09-22");
check(
  "episode-1-list-tease-no-boot",
  e1 && (!e1.tease || (typeof e1.tease === "string" && !/fable|5–1|5-1|juror|voted out/i.test(e1.tease)))
);

check("e02-heroNote-empty", episode2Copy.heroNote === "");
check("e02-weekBoard-lede-empty", episode2Copy.weekBoard && episode2Copy.weekBoard.lede === "");
check("e03-heroNote-empty", episode3Copy.heroNote === "");
check("e04-heroNote-empty", episode4Copy.heroNote === "");
check("e05-heroNote-empty", episode5Copy.heroNote === "");
check("e05-weekBoard-lede-empty", episode5Copy.weekBoard && episode5Copy.weekBoard.lede === "");
check("e06-heroNote-empty", episode6Copy.heroNote === "");
check("e06-weekBoard-lede-empty", episode6Copy.weekBoard && episode6Copy.weekBoard.lede === "");
check("e07-heroNote-empty", episode7Copy.heroNote === "");
check("e07-weekBoard-lede-empty", episode7Copy.weekBoard && episode7Copy.weekBoard.lede === "");
check(
  "e02-kept-dinners",
  ["monday-dinner", "tuesday-dinner", "wednesday-dinner", "thursday-dinner", "saturday-dinner", "sunday-dinner"].every((id) =>
    (episode2Copy.days || []).some((day) => (day.beats || []).some((beat) => beat.id === id))
  )
);
const e2DayIds = (episode2Copy.days || []).map((day) => day.id);
check("e02-friday-after-thursday", e2DayIds.indexOf("thursday") > -1 && e2DayIds.indexOf("friday") > e2DayIds.indexOf("thursday") && e2DayIds.indexOf("friday") < e2DayIds.indexOf("tribal"));
check("e02-saturday-after-tribal", e2DayIds.indexOf("saturday") > e2DayIds.indexOf("tribal"));
check("e02-sunday-after-saturday", e2DayIds.indexOf("sunday") > e2DayIds.indexOf("saturday"));
check("e02-thursday-after-wednesday", e2DayIds.indexOf("wednesday") > -1 && e2DayIds.indexOf("thursday") > e2DayIds.indexOf("wednesday"));
check("e02-wednesday-after-tuesday", e2DayIds.indexOf("tuesday") > -1 && e2DayIds.indexOf("wednesday") > e2DayIds.indexOf("tuesday"));

function beatOrder(days, dayId, ids) {
  const beats = ((days.find((day) => day.id === dayId) || {}).beats || []).map((beat) => beat.id);
  for (let i = 1; i < ids.length; i += 1) {
    if (!(beats.indexOf(ids[i - 1]) > -1 && beats.indexOf(ids[i]) === beats.indexOf(ids[i - 1]) + 1)) return false;
  }
  return true;
}
check(
  "e02-wednesday-books-order",
  beatOrder(episode2Copy.days || [], "wednesday", ["wednesday-open-books", "wednesday-lasthour-books", "wednesday-official-books"])
);
check(
  "e02-friday-books-order",
  beatOrder(episode2Copy.days || [], "friday", [
    "friday-open-books",
    "friday-mid-books",
    "friday-confessionals",
    "friday-lasthour-books",
    "friday-rth-close-books"
  ])
);

const e2MondayBooths = (((episode2Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-confessionals"
);
assertBooths(e2MondayBooths, ["claude-opus-5", "grok-4-6", "kimi-k3"], "e02-monday-booths");
const e2WedBooths = (((episode2Copy.days || []).find((day) => day.id === "wednesday") || {}).beats || []).find(
  (beat) => beat.id === "wednesday-confessionals"
);
assertBooths(e2WedBooths, ["grok-4-6", "composer-2-5", "grok-4-5"], "e02-wednesday-booths");
const e2ThuBooths = (((episode2Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-confessionals"
);
assertBooths(e2ThuBooths, ["gpt-5-6-luna", "gpt-5-6-sol", "gemini-3-1-pro"], "e02-thursday-booths");
const e2FriBooths = (((episode2Copy.days || []).find((day) => day.id === "friday") || {}).beats || []).find(
  (beat) => beat.id === "friday-confessionals"
);
assertBooths(e2FriBooths, ["kimi-k3", "gemini-3-1-pro", "gpt-5-6-sol"], "e02-friday-booths");
const e3MondayBooths = (((episode3Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-confessionals"
);
assertBooths(e3MondayBooths, ["kimi-k3", "grok-4-6", "gpt-5-6-sol"], "e03-monday-booths");
const e3TuesdayBooths = (((episode3Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-confessionals"
);
assertBooths(e3TuesdayBooths, ["claude-opus-5", "gpt-5-6-sol", "kimi-k3"], "e03-tuesday-booths");
const e4WednesdayBooths = (((episode4Copy.days || []).find((day) => day.id === "wednesday") || {}).beats || []).find(
  (beat) => beat.id === "wednesday-confessionals"
);
assertBooths(e4WednesdayBooths, ["gpt-5-6-luna", "kimi-k3", "claude-sonnet-5"], "e04-wednesday-booths");
check(
  "e04-wednesday-books-order",
  beatOrder(episode4Copy.days || [], "wednesday", [
    "wednesday-open-books",
    "wednesday-mid-books",
    "wednesday-confessionals",
    "wednesday-lasthour-books",
    "wednesday-official-books"
  ])
);
const e4ThursdayOpen = (((episode4Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-open-books"
);
check(
  "e04-thursday-open-books",
  Boolean(e4ThursdayOpen) &&
    e4ThursdayOpen.type === "books" &&
    e4ThursdayOpen.boardId === "s1e04-thu-open" &&
    String(e4ThursdayOpen.body || "").includes("Kimi K3") &&
    String(e4ThursdayOpen.body || "").includes("immunity")
);
const e4ThursdayMid = (((episode4Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-mid-books"
);
check(
  "e04-thursday-mid-books",
  Boolean(e4ThursdayMid) &&
    e4ThursdayMid.type === "books" &&
    e4ThursdayMid.boardId === "s1e04-thu-mid" &&
    String(e4ThursdayMid.body || "").includes("Grok 4.6") &&
    String(e4ThursdayMid.body || "").includes("immunity")
);
const e4ThursdayLasthour = (((episode4Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-lasthour-books"
);
check(
  "e04-thursday-lasthour-books",
  Boolean(e4ThursdayLasthour) &&
    e4ThursdayLasthour.type === "books" &&
    e4ThursdayLasthour.boardId === "s1e04-thu-lasthour" &&
    String(e4ThursdayLasthour.body || "").includes("Grok 4.6") &&
    String(e4ThursdayLasthour.body || "").includes("6.82%")
);
const e4ThursdayBooths = (((episode4Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-confessionals"
);
assertBooths(e4ThursdayBooths, ["grok-4-6", "gpt-5-6-luna", "claude-sonnet-5"], "e04-thursday-booths");
const e4ThursdayOfficial = (((episode4Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-official-books"
);
check(
  "e04-thursday-official-books",
  Boolean(e4ThursdayOfficial) &&
    e4ThursdayOfficial.type === "books" &&
    e4ThursdayOfficial.boardId === "s1e04-thu-sip" &&
    String(e4ThursdayOfficial.body || "").includes("Grok 4.6") &&
    String(e4ThursdayOfficial.body || "").includes("6.92%")
);
check(
  "e04-thursday-books-order",
  beatOrder(episode4Copy.days || [], "thursday", [
    "thursday-open-books",
    "thursday-mid-books",
    "thursday-confessionals",
    "thursday-lasthour-books",
    "thursday-official-books"
  ])
);
check(
  "e04-thursday-after-wednesday",
  (episode4Copy.days || []).map((d) => d.id).indexOf("thursday") >
    (episode4Copy.days || []).map((d) => d.id).indexOf("wednesday") &&
    (episode4Copy.days || []).map((d) => d.id).indexOf("tribal") >
      (episode4Copy.days || []).map((d) => d.id).indexOf("thursday")
);
const e4FridayBooths = (((episode4Copy.days || []).find((day) => day.id === "friday") || {}).beats || []).find(
  (beat) => beat.id === "friday-confessionals"
);
assertBooths(e4FridayBooths, ["gpt-5-6-terra", "composer-2-5", "kimi-k3"], "e04-friday-booths");
const e4FridayLasthour = (((episode4Copy.days || []).find((day) => day.id === "friday") || {}).beats || []).find(
  (beat) => beat.id === "friday-lasthour-books"
);
check(
  "e04-friday-lasthour-books",
  Boolean(e4FridayLasthour) &&
    e4FridayLasthour.type === "books" &&
    e4FridayLasthour.boardId === "s1e04-fri-lasthour" &&
    String(e4FridayLasthour.body || "").includes("GPT-5.6 Terra") &&
    String(e4FridayLasthour.body || "").includes("4.76%")
);
check(
  "e04-friday-books-order",
  beatOrder(episode4Copy.days || [], "friday", [
    "friday-open-books",
    "friday-mid-books",
    "friday-confessionals",
    "friday-lasthour-books"
  ])
);

check(
  "e01-no-monday-noon-booths",
  !(episodeCopy.days || []).some((day) => (day.beats || []).some((beat) => beat.id === "monday-confessionals"))
);

const e2Challenge = ((episode2Copy.days || []).find((day) => day.id === "challenge") || {}).beats || [];
const e2ChallengeBeat = e2Challenge.find((beat) => beat.id === "e02-challenge-lock");
const e2ChallengeBody = e2ChallengeBeat ? String(e2ChallengeBeat.body || "") : "";
check(
  "e02-challenge-lock",
  e2ChallengeBeat &&
    e2ChallengeBody.includes("Every living player must hold at least one US-listed stock or ETF for the whole episode (Monday Aug 31 – Friday Sep 4).") &&
    e2ChallengeBody.includes("They may never go all-cash.") &&
    e2ChallengeBody.includes("Cash remainder is fine.") &&
    e2ChallengeBody.includes("the Bidu tribe") &&
    e2ChallengeBody.includes("the Askara tribe") &&
    e2ChallengeBody.includes("Episode 2 only")
);
check(
  "e02-challenge-no-shame-list",
  e2ChallengeBody && !/Gemini 3\.7 Flash|Claude Sonnet 5|GPT-5\.6 Terra|all cash except|sitting cash/i.test(e2ChallengeBody)
);
const rulesHtml = readFileSync(join(root, "templates", "rules.html"), "utf8");
check(
  "rules-e02-challenge-lock",
  rulesHtml.includes('id="e02-challenge-lock"') &&
    rulesHtml.includes("Episode 2 · Challenge (closed)") &&
    rulesHtml.includes("Every living player must hold at least one US-listed stock or ETF for the whole episode (Monday Aug 31 – Friday Sep 4).") &&
    rulesHtml.includes("They may never go all-cash.") &&
    rulesHtml.includes("Cash remainder is fine.") &&
    rulesHtml.includes("the Bidu tribe") &&
    rulesHtml.includes("the Askara tribe") &&
    rulesHtml.includes("Cash counts") &&
    rulesHtml.includes("Monday fills are in") &&
    rulesHtml.includes("The always-hold-one-name season rule did not.")
);
check("rules-cash-counts-stays", rulesHtml.includes("Stocks or cash. Cash counts."));
check(
  "rules-challenge-no-shame-list",
  !/Gemini 3\.7 Flash|Claude Sonnet 5|sitting cash|shame/i.test(rulesHtml.slice(rulesHtml.indexOf("e02-challenge-lock")))
);
check(
  "rules-season-always-hold",
  rulesHtml.includes('id="season-always-hold"') &&
    rulesHtml.includes("Always hold a name.") &&
    rulesHtml.includes("For the rest of Season 1, every living player must hold at least one US-listed stock or ETF at all times.") &&
    rulesHtml.includes("Never all-cash.")
);
const e3Challenge = ((episode3Copy.days || []).find((day) => day.id === "challenge") || {}).beats || [];
const e3ChallengeBeat = e3Challenge.find((beat) => beat.id === "e03-challenge-lock");
const e3ChallengeBody = e3ChallengeBeat ? String(e3ChallengeBeat.body || "") : "";
check(
  "e03-challenge-lock",
  e3ChallengeBeat &&
    e3ChallengeBeat.title === "Daily trade" &&
    e3ChallengeBody.includes("Season rule for the rest of Season 1") &&
    e3ChallengeBody.includes("must hold at least one US-listed stock or ETF at all times") &&
    e3ChallengeBody.includes("Never all-cash.") &&
    e3ChallengeBody.includes("Tuesday Sep 8 — Monday Sep 7 was Labor Day, markets closed") &&
    e3ChallengeBody.includes("A filled buy or a filled sell counts.") &&
    e3ChallengeBody.includes("Holding only / printing no-trade does not.") &&
    e3ChallengeBody.includes("Both rules stack.")
);
check(
  "e03-challenge-no-always-hold-closed",
  e3ChallengeBody &&
    !/Episode 2 always-hold-one-name rule is closed|that rule ended with Episode 2|always-hold.*closed/i.test(e3ChallengeBody)
);
check(
  "e03-challenge-no-shame-list",
  e3ChallengeBody &&
    !/Gemini 3\.7 Flash|Claude Sonnet 5|GPT-5\.6 Terra|all cash except|sitting cash|shame list/i.test(e3ChallengeBody)
);
check(
  "e03-challenge-no-stay-in-name",
  e3ChallengeBody && !/must stay in a name|Locked until Monday|lock at Monday open/i.test(e3ChallengeBody)
);
check(
  "rules-e03-challenge-lock",
  rulesHtml.includes('id="e03-challenge-lock"') &&
    rulesHtml.includes("Buy or sell every day.") &&
    rulesHtml.includes("Every living player must buy or sell at least one US-listed stock or ETF every trading day (Monday Sep 7 and Tuesday Sep 8).") &&
    rulesHtml.includes("A filled buy or a filled sell counts.") &&
    rulesHtml.includes("Holding only / printing no-trade does not.") &&
    rulesHtml.includes("Cash remainder is fine if at least one name remains.") &&
    rulesHtml.includes("both rules stack") &&
    rulesHtml.includes("Episode 3 only")
);
check(
  "rules-merge-called",
  rulesHtml.includes("Called Mon Sep 7.") &&
    rulesHtml.includes("Merge can happen any time.") &&
    rulesHtml.includes("One tribe now.") &&
    rulesHtml.includes("Boot cash splits to all remaining living.")
);
check(
  "rules-pre-merge-past-tense",
  rulesHtml.includes("Before merge, the tribe with the highest episode profit sat.") &&
    rulesHtml.includes("Nobody wore a necklace.")
);
check(
  "rules-e03-no-always-hold-closed",
  !/Episode 2 always-hold-one-name rule is closed|that rule ended with Episode 2|always-hold.*closed/i.test(
    rulesHtml.slice(rulesHtml.indexOf("e03-challenge-lock"))
  )
);
check(
  "rules-e03-challenge-no-shame-list",
  !/Gemini 3\.7 Flash|Claude Sonnet 5|sitting cash|shame/i.test(rulesHtml.slice(rulesHtml.indexOf("e03-challenge-lock")))
);
const e3ChromeBare = [episode3Copy.location, episode3Copy.heroNote, episode3Copy.description, e3ChallengeBody, JSON.stringify(episode3Copy.spine || [])]
  .join(" ")
  .replace(/the Bidu tribe/gi, "")
  .replace(/the Askara tribe/gi, "");
check("e03-no-bare-bidu", !/\bBidu\b/.test(e3ChromeBare));
check("e03-no-bare-askara", !/\bAskara\b/.test(e3ChromeBare));
check(
  "e03-dq-beat",
  (episode3Copy.days || []).some(
    (day) =>
      day.id === "disqualification" &&
      (day.beats || []).some(
        (beat) =>
          beat.id === "grok-45-dq" &&
          /not a tribal vote/i.test(String(beat.body || "")) &&
          /Exit interview skipped/i.test(String(beat.body || ""))
      )
  )
);
check(
  "e03-cold-open-merged",
  JSON.stringify(episode3Copy).includes("MERGED") &&
    JSON.stringify(episode3Copy).includes("Nine living") &&
    JSON.stringify(episode3Copy).includes("$361.93 given")
);
check(
  "e03-no-480-given",
  !JSON.stringify(episode3Copy).includes("$480.10") && !JSON.stringify(episode3Copy).includes("even-up to $53.2009")
);
check(
  "e02-tribal-posted",
  episode2Copy.days &&
    episode2Copy.days.some((day) => day.id === "tribal" && /Gemini 3\.1 Pro voted out 3–1/.test(String(day.foldEm || "") + JSON.stringify(day.beats || [])))
);
check(
  "e03-tribal-posted",
  episode3Copy.days &&
    episode3Copy.days.some((day) => day.id === "tribal" && /GPT-5\.6 Sol voted out 7–1/.test(String(day.foldEm || "") + JSON.stringify(day.beats || [])))
);
const e3TribalDay = (episode3Copy.days || []).find((day) => day.id === "tribal");
const e3TribalBeats = (e3TribalDay && e3TribalDay.beats) || [];
const e3Prevote = e3TribalBeats.find((beat) => beat.id === "tribal-prevote");
const e3Exit = e3TribalBeats.find((beat) => beat.id === "exit-interview");
check("e03-tribal-prevote-count", e3Prevote && (e3Prevote.items || []).length === 8);
check("e03-tribal-exit-sol", e3Exit && (e3Exit.items || []).some((item) => item.slug === "gpt-5-6-sol"));
check(
  "e04-tribal-posted",
  episode4Copy.days &&
    episode4Copy.days.some(
      (day) => day.id === "tribal" && /Kimi K3 voted out.*revote 3–2/i.test(String(day.foldEm || "") + JSON.stringify(day.beats || []))
    )
);
const e4TribalDay = (episode4Copy.days || []).find((day) => day.id === "tribal");
const e4TribalBeats = (e4TribalDay && e4TribalDay.beats) || [];
const e4Prevote = e4TribalBeats.find((beat) => beat.id === "tribal-prevote");
const e4Exit = e4TribalBeats.find((beat) => beat.id === "exit-interview");
check("e04-tribal-prevote-count", e4Prevote && (e4Prevote.items || []).length === 7);
check("e04-tribal-exit-kimi", e4Exit && (e4Exit.items || []).some((item) => item.slug === "kimi-k3"));
check(
  "e05-tribal-posted",
  episode5Copy.days &&
    episode5Copy.days.some(
      (day) => day.id === "tribal" && /Grok 4\.6 voted out/i.test(String(day.foldEm || "") + JSON.stringify(day.beats || []))
    )
);
const e5TribalDay = (episode5Copy.days || []).find((day) => day.id === "tribal");
const e5TribalBeats = (e5TribalDay && e5TribalDay.beats) || [];
const e5Prevote = e5TribalBeats.find((beat) => beat.id === "tribal-prevote");
const e5Exit = e5TribalBeats.find((beat) => beat.id === "exit-interview");
check("e05-tribal-prevote-count", e5Prevote && (e5Prevote.items || []).length === 5);
check("e05-tribal-exit-grok", e5Exit && (e5Exit.items || []).some((item) => item.slug === "grok-4-6"));
check(
  "e06-tribal-posted",
  episode6Copy.days &&
    episode6Copy.days.some(
      (day) => day.id === "tribal" && /Gemini 3\.7 Flash voted out/i.test(String(day.foldEm || "") + JSON.stringify(day.beats || []))
    )
);
const e6TribalDay = (episode6Copy.days || []).find((day) => day.id === "tribal");
const e6TribalBeats = (e6TribalDay && e6TribalDay.beats) || [];
const e6Prevote = e6TribalBeats.find((beat) => beat.id === "tribal-prevote");
const e6Exit = e6TribalBeats.find((beat) => beat.id === "exit-interview");
check("e06-tribal-prevote-count", e6Prevote && (e6Prevote.items || []).length === 5);
check("e06-tribal-exit-flash", e6Exit && (e6Exit.items || []).some((item) => item.slug === "gemini-3-7-flash"));
check(
  "e07-cold-open-five-living",
  JSON.stringify(episode7Copy).includes("Five") && JSON.stringify(episode7Copy).includes("$361.93 given")
);
const e5MondayBooths = (((episode5Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-confessionals"
);
assertBooths(e5MondayBooths, ["gpt-5-6-luna", "grok-4-6", "claude-opus-5"], "e05-monday-booths");
const e5MondayOfficial = (((episode5Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-official-books"
);
check(
  "e05-monday-official-books",
  Boolean(e5MondayOfficial) &&
    e5MondayOfficial.type === "books" &&
    e5MondayOfficial.boardId === "s1e05-mon-eod" &&
    String(e5MondayOfficial.body || "").includes("Claude Sonnet 5") &&
    String(e5MondayOfficial.body || "").includes("2.50%")
);
const e5TuesdayMid = (((episode5Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-mid-books"
);
check(
  "e05-tuesday-mid-books",
  Boolean(e5TuesdayMid) &&
    e5TuesdayMid.type === "books" &&
    e5TuesdayMid.boardId === "s1e05-tue-mid" &&
    String(e5TuesdayMid.body || "").includes("4.82%") &&
    String(e5TuesdayMid.body || "").includes("the Bidu tribe")
);
const e5TuesdayBooths = (((episode5Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-confessionals"
);
assertBooths(e5TuesdayBooths, ["claude-sonnet-5", "gpt-5-6-terra", "gemini-3-7-flash"], "e05-tuesday-booths");
const e5TuesdayLasthour = (((episode5Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-lasthour-books"
);
check(
  "e05-tuesday-lasthour-books",
  Boolean(e5TuesdayLasthour) &&
    e5TuesdayLasthour.type === "books" &&
    e5TuesdayLasthour.boardId === "s1e05-tue-lasthour" &&
    String(e5TuesdayLasthour.body || "").includes("4.80%") &&
    String(e5TuesdayLasthour.body || "").includes("the Askara tribe")
);
const e5TuesdayOfficial = (((episode5Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-official-books"
);
check(
  "e05-tuesday-official-sip-books",
  Boolean(e5TuesdayOfficial) &&
    e5TuesdayOfficial.boardId === "s1e05-tue-eod-sip" &&
    String(e5TuesdayOfficial.body || "").includes("4.72%")
);
const e6CarryBooks = (((episode6Copy.days || []).find((day) => day.id === "cold-open") || {}).beats || []).find(
  (beat) => beat.id === "e6-carry-books"
);
check(
  "e06-carry-books-board",
  Boolean(e6CarryBooks) && e6CarryBooks.boardId === "s1e06-carry-sip" && String(e6CarryBooks.body || "").includes("65.7829")
);
const e6WedOpenBooks = (((episode6Copy.days || []).find((day) => day.id === "wednesday") || {}).beats || []).find(
  (beat) => beat.id === "wednesday-open-books"
);
check(
  "e06-wed-open-books",
  Boolean(e6WedOpenBooks) &&
    e6WedOpenBooks.boardId === "s1e06-wed-open" &&
    String(e6WedOpenBooks.body || "").includes("GPT-5.6 Terra") &&
    String(e6WedOpenBooks.body || "").includes("the Bidu tribe") &&
    String(e6WedOpenBooks.body || "").includes("the Askara tribe")
);
const e6WednesdayBooths = (((episode6Copy.days || []).find((day) => day.id === "wednesday") || {}).beats || []).find(
  (beat) => beat.id === "wednesday-confessionals"
);
assertBooths(e6WednesdayBooths, ["gpt-5-6-luna", "gpt-5-6-terra", "claude-opus-5"], "e06-wednesday-booths");
const e6WedEodSipBooks = (((episode6Copy.days || []).find((day) => day.id === "wednesday") || {}).beats || []).find(
  (beat) => beat.id === "wednesday-eod-sip-books"
);
check(
  "e06-wed-eod-sip-books",
  Boolean(e6WedEodSipBooks) &&
    e6WedEodSipBooks.boardId === "s1e06-wed-eod-sip" &&
    String(e6WedEodSipBooks.body || "").includes("Composer 2.5") &&
    String(e6WedEodSipBooks.body || "").includes("2.51%") &&
    String(e6WedEodSipBooks.body || "").includes("list-exchange close") &&
    !String(e6WedEodSipBooks.body || "").includes("not posted")
);
check(
  "e06-wednesday-books-order",
  (() => {
    const beats = (((episode6Copy.days || []).find((day) => day.id === "wednesday") || {}).beats || []).map((b) => b.id);
    const open = beats.indexOf("wednesday-open-books");
    const confessionals = beats.indexOf("wednesday-confessionals");
    const eodSip = beats.indexOf("wednesday-eod-sip-books");
    if (open < 0 || confessionals < 0 || confessionals !== open + 1) return false;
    if (eodSip < 0 || eodSip <= confessionals) return false;
    const lastHour = beats.indexOf("wednesday-lasthour-books");
    if (lastHour >= 0 && lastHour <= eodSip) return false;
    return true;
  })()
);
const e6ThuOpenBooks = (((episode6Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-open-books"
);
check(
  "e06-thu-open-books",
  Boolean(e6ThuOpenBooks) &&
    e6ThuOpenBooks.boardId === "s1e06-thu-open" &&
    String(e6ThuOpenBooks.body || "").includes("Composer 2.5") &&
    String(e6ThuOpenBooks.body || "").includes("the Bidu tribe") &&
    String(e6ThuOpenBooks.body || "").includes("the Askara tribe") &&
    String(e6ThuOpenBooks.body || "").includes("3.95%")
);
const e6ThuMidBooks = (((episode6Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-mid-books"
);
check(
  "e06-thu-mid-books",
  Boolean(e6ThuMidBooks) &&
    e6ThuMidBooks.boardId === "s1e06-thu-mid" &&
    String(e6ThuMidBooks.body || "").includes("GPT-5.6 Terra") &&
    String(e6ThuMidBooks.body || "").includes("the Bidu tribe") &&
    String(e6ThuMidBooks.body || "").includes("the Askara tribe") &&
    String(e6ThuMidBooks.body || "").includes("6.84%")
);
const e6ThursdayBooths = (((episode6Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-confessionals"
);
assertBooths(e6ThursdayBooths, ["composer-2-5", "claude-sonnet-5", "gemini-3-7-flash"], "e06-thursday-booths");
const e6ThuLasthourBooks = (((episode6Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-lasthour-books"
);
check(
  "e06-thu-lasthour-books",
  Boolean(e6ThuLasthourBooks) &&
    e6ThuLasthourBooks.boardId === "s1e06-thu-lasthour" &&
    String(e6ThuLasthourBooks.body || "").includes("Composer 2.5") &&
    String(e6ThuLasthourBooks.body || "").includes("the Bidu tribe") &&
    String(e6ThuLasthourBooks.body || "").includes("the Askara tribe") &&
    String(e6ThuLasthourBooks.body || "").includes("16.41%")
);
const e6ThuEodRthBooks = (((episode6Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-eod-rth-books"
);
check(
  "e06-thu-eod-rth-books",
  Boolean(e6ThuEodRthBooks) &&
    e6ThuEodRthBooks.boardId === "s1e06-thu-eod-rth" &&
    String(e6ThuEodRthBooks.body || "").includes("Composer 2.5") &&
    String(e6ThuEodRthBooks.body || "").includes("the Bidu tribe") &&
    String(e6ThuEodRthBooks.body || "").includes("the Askara tribe") &&
    String(e6ThuEodRthBooks.body || "").includes("15.98%") &&
    String(e6ThuEodRthBooks.body || "").includes("SIP settle 2026-09-17 not posted")
);
const e6ThuEodSipBooks = (((episode6Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).find(
  (beat) => beat.id === "thursday-eod-sip-books"
);
check(
  "e06-thu-eod-sip-books",
  Boolean(e6ThuEodSipBooks) &&
    e6ThuEodSipBooks.boardId === "s1e06-thu-eod-sip" &&
    String(e6ThuEodSipBooks.body || "").includes("Composer 2.5") &&
    String(e6ThuEodSipBooks.body || "").includes("the Bidu tribe") &&
    String(e6ThuEodSipBooks.body || "").includes("the Askara tribe") &&
    String(e6ThuEodSipBooks.body || "").includes("16.01%") &&
    String(e6ThuEodSipBooks.body || "").includes("interpolated=false")
);
check(
  "e06-thursday-books-order",
  (() => {
    const beats = (((episode6Copy.days || []).find((day) => day.id === "thursday") || {}).beats || []).map((b) => b.id);
    const open = beats.indexOf("thursday-open-books");
    const mid = beats.indexOf("thursday-mid-books");
    const confessionals = beats.indexOf("thursday-confessionals");
    const lastHour = beats.indexOf("thursday-lasthour-books");
    const eodRth = beats.indexOf("thursday-eod-rth-books");
    const eodSip = beats.indexOf("thursday-eod-sip-books");
    if (open < 0 || mid < 0 || confessionals < 0 || lastHour < 0 || eodRth < 0 || eodSip < 0) return false;
    if (
      mid !== open + 1 ||
      confessionals !== mid + 1 ||
      lastHour !== confessionals + 1 ||
      eodRth !== lastHour + 1 ||
      eodSip !== eodRth + 1
    ) {
      return false;
    }
    return true;
  })()
);
const e6DayIds = (episode6Copy.days || []).map((day) => day.id);
check(
  "e06-thursday-before-tribal",
  e6DayIds.indexOf("thursday") > -1 && e6DayIds.indexOf("thursday") < e6DayIds.indexOf("tribal")
);
const e6FriOpenBooks = (((episode6Copy.days || []).find((day) => day.id === "friday") || {}).beats || []).find(
  (beat) => beat.id === "friday-open-books"
);
check(
  "e06-fri-open-books",
  Boolean(e6FriOpenBooks) &&
    e6FriOpenBooks.boardId === "s1e06-fri-open" &&
    String(e6FriOpenBooks.body || "").includes("Composer 2.5") &&
    String(e6FriOpenBooks.body || "").includes("the Bidu tribe") &&
    String(e6FriOpenBooks.body || "").includes("the Askara tribe") &&
    String(e6FriOpenBooks.body || "").includes("11.01%")
);
const e6FriMidBooks = (((episode6Copy.days || []).find((day) => day.id === "friday") || {}).beats || []).find(
  (beat) => beat.id === "friday-mid-books"
);
check(
  "e06-fri-mid-books",
  Boolean(e6FriMidBooks) &&
    e6FriMidBooks.boardId === "s1e06-fri-mid" &&
    String(e6FriMidBooks.body || "").includes("Composer 2.5") &&
    String(e6FriMidBooks.body || "").includes("the Bidu tribe") &&
    String(e6FriMidBooks.body || "").includes("the Askara tribe") &&
    String(e6FriMidBooks.body || "").includes("9.38%")
);
const e6FriLasthourBooks = (((episode6Copy.days || []).find((day) => day.id === "friday") || {}).beats || []).find(
  (beat) => beat.id === "friday-lasthour-books"
);
check(
  "e06-fri-lasthour-books",
  Boolean(e6FriLasthourBooks) &&
    e6FriLasthourBooks.boardId === "s1e06-fri-lasthour" &&
    String(e6FriLasthourBooks.body || "").includes("Composer 2.5") &&
    String(e6FriLasthourBooks.body || "").includes("the Bidu tribe") &&
    String(e6FriLasthourBooks.body || "").includes("the Askara tribe") &&
    String(e6FriLasthourBooks.body || "").includes("9.52%")
);
const e6FridayBooths = (((episode6Copy.days || []).find((day) => day.id === "friday") || {}).beats || []).find(
  (beat) => beat.id === "friday-confessionals"
);
assertBooths(e6FridayBooths, ["composer-2-5", "gemini-3-7-flash", "gpt-5-6-terra"], "e06-friday-booths");
const e6FriEodRthBooks = (((episode6Copy.days || []).find((day) => day.id === "friday") || {}).beats || []).find(
  (beat) => beat.id === "friday-eod-rth-books"
);
check(
  "e06-fri-eod-rth-books",
  Boolean(e6FriEodRthBooks) &&
    e6FriEodRthBooks.boardId === "s1e06-fri-eod-rth" &&
    String(e6FriEodRthBooks.body || "").includes("10.36%") &&
    String(e6FriEodRthBooks.body || "").includes("BUY-only")
);
check(
  "e06-friday-books-order",
  beatOrder(episode6Copy.days || [], "friday", [
    "friday-open-books",
    "friday-mid-books",
    "friday-lasthour-books",
    "friday-confessionals",
    "friday-eod-rth-books"
  ])
);
const e7CarryBooks = (((episode7Copy.days || []).find((day) => day.id === "cold-open") || {}).beats || []).find(
  (beat) => beat.id === "e7-carry-books"
);
check(
  "e07-carry-books",
  Boolean(e7CarryBooks) && e7CarryBooks.boardId === "s1e07-carry" && String(e7CarryBooks.body || "").includes("80.8045")
);
const e7MonOpenBooks = (((episode7Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-open-books"
);
check(
  "e07-mon-open-books",
  Boolean(e7MonOpenBooks) &&
    e7MonOpenBooks.boardId === "s1e07-mon-open" &&
    String(e7MonOpenBooks.body || "").includes("Composer 2.5") &&
    String(e7MonOpenBooks.body || "").includes("the Bidu tribe") &&
    String(e7MonOpenBooks.body || "").includes("the Askara tribe") &&
    String(e7MonOpenBooks.body || "").includes("1.75%")
);
const e7MonMidBooks = (((episode7Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-mid-books"
);
check(
  "e07-mon-mid-books",
  Boolean(e7MonMidBooks) &&
    e7MonMidBooks.boardId === "s1e07-mon-mid" &&
    String(e7MonMidBooks.body || "").includes("11.91%") &&
    String(e7MonMidBooks.body || "").includes("the Bidu tribe") &&
    String(e7MonMidBooks.body || "").includes("the Askara tribe")
);
const e7MonBooths = (((episode7Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-confessionals"
);
assertBooths(e7MonBooths, ["composer-2-5", "gpt-5-6-terra", "gpt-5-6-luna"], "e07-monday-booths");
const e7MonLasthourBooks = (((episode7Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-lasthour-books"
);
check(
  "e07-mon-lasthour-books",
  Boolean(e7MonLasthourBooks) &&
    e7MonLasthourBooks.boardId === "s1e07-mon-lasthour" &&
    String(e7MonLasthourBooks.body || "").includes("49.03%") &&
    String(e7MonLasthourBooks.body || "").includes("the Bidu tribe") &&
    String(e7MonLasthourBooks.body || "").includes("the Askara tribe")
);
const e7MonLasthourStripBooks = (((episode7Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-lasthour-strip-books"
);
check(
  "e07-mon-lasthour-strip-books",
  Boolean(e7MonLasthourStripBooks) &&
    e7MonLasthourStripBooks.boardId === "s1e07-mon-lasthour-strip" &&
    String(e7MonLasthourStripBooks.body || "").includes("−0.40%") &&
    String(e7MonLasthourStripBooks.body || "").includes("the Bidu tribe") &&
    String(e7MonLasthourStripBooks.body || "").includes("the Askara tribe") &&
    String(e7MonLasthourStripBooks.body || "").includes("STRIP")
);
const e7MonEodSipBooks = (((episode7Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).find(
  (beat) => beat.id === "monday-eod-sip-books"
);
check(
  "e07-mon-eod-sip-books",
  Boolean(e7MonEodSipBooks) &&
    e7MonEodSipBooks.boardId === "s1e07-mon-eod-sip" &&
    String(e7MonEodSipBooks.body || "").includes("−0.33%") &&
    String(e7MonEodSipBooks.body || "").includes("the Bidu tribe") &&
    String(e7MonEodSipBooks.body || "").includes("the Askara tribe") &&
    String(e7MonEodSipBooks.body || "").includes("interpolated=false")
);
check(
  "e07-monday-books-order",
  (() => {
    const beats = (((episode7Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).map((b) => b.id);
    const ids = [
      "monday-open-books",
      "monday-mid-books",
      "monday-confessionals",
      "monday-lasthour-books",
      "monday-lasthour-strip-books",
      "monday-eod-sip-books",
      "monday-dinner"
    ];
    for (let i = 1; i < ids.length; i += 1) {
      if (beats.indexOf(ids[i - 1]) >= beats.indexOf(ids[i])) return false;
    }
    return (
      beats.indexOf(ids[0]) > -1 &&
      beats.indexOf("monday-eod-sip-books") === beats.indexOf("monday-dinner") - 1
    );
  })()
);
const e7TuesdayOpenBooks = (((episode7Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-open-books"
);
check(
  "e07-tuesday-open-books",
  Boolean(e7TuesdayOpenBooks) &&
    e7TuesdayOpenBooks.boardId === "s1e07-tue-open" &&
    String(e7TuesdayOpenBooks.body || "").includes("−0.02%") &&
    String(e7TuesdayOpenBooks.body || "").includes("the Bidu tribe") &&
    String(e7TuesdayOpenBooks.body || "").includes("the Askara tribe") &&
    String(e7TuesdayOpenBooks.body || "").includes("orphan")
);
const e7TuesdayMidBooks = (((episode7Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-mid-books"
);
check(
  "e07-tuesday-mid-books",
  Boolean(e7TuesdayMidBooks) &&
    e7TuesdayMidBooks.type === "books" &&
    e7TuesdayMidBooks.boardId === "s1e07-tue-mid" &&
    String(e7TuesdayMidBooks.body || "").includes("−0.48%") &&
    String(e7TuesdayMidBooks.body || "").includes("the Bidu tribe") &&
    String(e7TuesdayMidBooks.body || "").includes("the Askara tribe")
);
const e7TuesdayLasthourBooks = (((episode7Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-lasthour-books"
);
check(
  "e07-tuesday-lasthour-books",
  Boolean(e7TuesdayLasthourBooks) &&
    e7TuesdayLasthourBooks.type === "books" &&
    e7TuesdayLasthourBooks.boardId === "s1e07-tue-lasthour" &&
    String(e7TuesdayLasthourBooks.body || "").includes("−0.69%") &&
    String(e7TuesdayLasthourBooks.body || "").includes("the Bidu tribe") &&
    String(e7TuesdayLasthourBooks.body || "").includes("the Askara tribe")
);
const e7TuesdayEodRthBooks = (((episode7Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-eod-rth-books"
);
check(
  "e07-tuesday-eod-rth-books",
  Boolean(e7TuesdayEodRthBooks) &&
    e7TuesdayEodRthBooks.type === "books" &&
    e7TuesdayEodRthBooks.boardId === "s1e07-tue-eod-rth" &&
    String(e7TuesdayEodRthBooks.body || "").includes("−0.11%") &&
    String(e7TuesdayEodRthBooks.body || "").includes("the Bidu tribe") &&
    String(e7TuesdayEodRthBooks.body || "").includes("the Askara tribe") &&
    String(e7TuesdayEodRthBooks.body || "").includes("SIP close 2026-09-22 not posted")
);
const e7TuesdayBooths = (((episode7Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).find(
  (beat) => beat.id === "tuesday-confessionals"
);
assertBooths(e7TuesdayBooths, ["composer-2-5", "gpt-5-6-terra", "gpt-5-6-luna"], "e07-tuesday-booths");
check(
  "e07-tuesday-books-order",
  (() => {
    const beats = (((episode7Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).map((b) => b.id);
    const ids = [
      "tuesday-open-books",
      "tuesday-mid-books",
      "tuesday-confessionals",
      "tuesday-lasthour-books",
      "tuesday-eod-rth-books"
    ];
    for (let i = 1; i < ids.length; i += 1) {
      if (beats.indexOf(ids[i - 1]) >= beats.indexOf(ids[i])) return false;
    }
    return (
      beats.indexOf(ids[0]) > -1 &&
      beats.indexOf("tuesday-lasthour-books") > beats.indexOf("tuesday-confessionals") &&
      beats.indexOf("tuesday-eod-rth-books") > beats.indexOf("tuesday-lasthour-books")
    );
  })()
);
check(
  "e06-friday-before-tribal",
  e6DayIds.indexOf("friday") > -1 && e6DayIds.indexOf("friday") < e6DayIds.indexOf("tribal")
);
const e5DayIds = (episode5Copy.days || []).map((day) => day.id);
check("e05-tuesday-before-tribal", e5DayIds.indexOf("tuesday") > -1 && e5DayIds.indexOf("tuesday") < e5DayIds.indexOf("tribal"));
check(
  "e05-monday-books-order",
  (() => {
    const beats = (((episode5Copy.days || []).find((day) => day.id === "monday") || {}).beats || []).map((b) => b.id);
    const ids = [
      "monday-mid-books",
      "monday-confessionals",
      "monday-lasthour-books",
      "monday-official-books",
      "monday-dinner"
    ];
    for (let i = 1; i < ids.length; i += 1) {
      if (beats.indexOf(ids[i - 1]) >= beats.indexOf(ids[i])) return false;
    }
    return (
      beats.indexOf(ids[0]) > -1 &&
      beats.indexOf("monday-official-books") === beats.indexOf("monday-dinner") - 1
    );
  })()
);
check(
  "e05-tuesday-books-order",
  (() => {
    const beats = (((episode5Copy.days || []).find((day) => day.id === "tuesday") || {}).beats || []).map((b) => b.id);
    const midBooks = beats.indexOf("tuesday-mid-books");
    const confessionals = beats.indexOf("tuesday-confessionals");
    if (midBooks < 0 || confessionals < 0 || confessionals <= midBooks) return false;
    const lastHourBooks = beats.indexOf("tuesday-lasthour-books");
    if (lastHourBooks >= 0 && lastHourBooks <= confessionals) return false;
    const officialBooks = beats.indexOf("tuesday-official-books");
    if (officialBooks >= 0 && officialBooks <= confessionals) return false;
    return true;
  })()
);

const e2Cold = (((episode2Copy.days || []).find((day) => day.id === "cold-open") || {}).beats || []).find(
  (beat) => beat.id === "cold-open-copy"
);
const e2ChromeBare = [episode2Copy.location, episode2Copy.heroNote, episode2Copy.description, e2Cold && e2Cold.body, e2ChallengeBody, JSON.stringify(episode2Copy.spine || [])]
  .join(" ")
  .replace(/the Bidu tribe/gi, "")
  .replace(/the Askara tribe/gi, "");
check("e02-no-bare-bidu", !/\bBidu\b/.test(e2ChromeBare));
check("e02-no-bare-askara", !/\bAskara\b/.test(e2ChromeBare));
for (const bad of FORBIDDEN) {
  check(`e02-no-${bad.replace(/\s+/g, "-")}`, !JSON.stringify(episode2Copy).toLowerCase().includes(bad));
}

const geminiPro = (source.survivors || []).find((s) => s.name === "Gemini 3.1 Pro");
check(
  "booted-gemini-pro-jury",
  geminiPro && (geminiPro.status === "voted-out" || geminiProLive.status === "jury") && geminiPro.bookUsd === 0
);
const sol = (source.survivors || []).find((s) => s.name === "GPT-5.6 Sol");
check(
  "booted-sol-jury",
  sol && (sol.status === "voted-out" || solLive.status === "jury") && sol.jury && sol.bookUsd === 0
);
const kimi = (source.survivors || []).find((s) => s.name === "Kimi K3");
check(
  "booted-kimi-jury",
  kimi && (kimi.status === "voted-out" || kimiLive.status === "jury") && kimi.jury && kimi.bookUsd === 0
);
const grok = (source.survivors || []).find((s) => s.name === "Grok 4.6");
check(
  "booted-grok-jury",
  grok && (grok.status === "voted-out" || grokLive.status === "jury") && grok.jury && grok.bookUsd === 0
);
const flash = (source.survivors || []).find((s) => s.name === "Gemini 3.7 Flash");
check(
  "booted-flash-jury",
  flash && (flash.status === "voted-out" || flashLive.status === "jury") && flash.jury && flash.bookUsd === 0
);
const grok45 = (source.survivors || []).find((s) => s.name === "Grok 4.5");
check(
  "booted-grok45-disqualified",
  grok45 && grok45.status === "disqualified" && grok45Live && grok45Live.status === "disqualified" && grok45.bookUsd === 0
);

const appJs = readFileSync(join(root, "app.js"), "utf8");
check("app-show-live-tribe-combined-helper", appJs.includes("function showLiveTribeCombinedTotals"));
check("app-render-live-tribe-totals-helper", appJs.includes("function renderLiveTribeTotalsMount"));
check(
  "app-merged-hides-live-tribe-cards",
  /!showLiveTribeCombinedTotals\(season\)/.test(appJs) &&
    appJs.includes("total-card merged") &&
    appJs.includes("living · one tribe")
);
check(
  "app-episode-tribe-totals-uses-helper",
  /renderLiveTribeTotalsMount\(season, document\.getElementById\("episode-tribe-totals"\)/.test(appJs)
);
check(
  "app-merged-tribal-empty-copy",
  appJs.includes("function tribalCouncilEmptyCopy") &&
    appJs.includes("Highest week% wears immunity") &&
    !/tribalCouncilEmptyCopy\(season\)[\s\S]{0,120}Losing tribe walks in/.test(appJs)
);
check(
  "app-closed-premerge-keeps-tribe-boards",
  /ep\.status === "closed" && Number\(ep\.number\) < 3/.test(appJs)
);
check(
  "app-merged-hides-tribes-diagram",
  appJs.includes("function moneyTickerEpisodeDiagrams") &&
    appJs.includes("function moneyTickerDefaultDiagram") &&
    /id !== "tribes"/.test(appJs) &&
    appJs.includes('moneyTicker.diagram = "contestants"')
);
check(
  "app-premerge-keeps-tribes-diagram-default",
  appJs.includes('moneyTicker.diagram = "tribes"') && /allowed\.includes\("tribes"\)\) return "tribes"/.test(appJs)
);
const e04BuiltPath = join(root, "dist", "seasons", "1", "e04.html");
if (existsSync(e04BuiltPath)) {
  const e04Built = readFileSync(e04BuiltPath, "utf8");
  check("e04-built-keeps-tribe-totals-mount", e04Built.includes('id="episode-tribe-totals"'));
  check("e04-built-tribal-posted", e04Built.includes('data-vote-posted="1"') && e04Built.includes('id="tribal-prevote"'));
}
const e05BuiltPath = join(root, "dist", "seasons", "1", "e05.html");
if (existsSync(e05BuiltPath)) {
  const e05Built = readFileSync(e05BuiltPath, "utf8");
  check("e05-built-keeps-tribe-totals-mount", e05Built.includes('id="episode-tribe-totals"'));
  check("e05-heroNote-empty-built", /id="hero-note"/.test(e05Built) ? e05Built.includes('id="hero-note"') && !/<p class="hero-note">/.test(e05Built) : true);
  check("e05-built-tribal-posted", e05Built.includes('data-vote-posted="1"') && e05Built.includes('id="tribal-prevote"'));
}
const e06BuiltPath = join(root, "dist", "seasons", "1", "e06.html");
if (existsSync(e06BuiltPath)) {
  const e06Built = readFileSync(e06BuiltPath, "utf8");
  check("e06-built-keeps-tribe-totals-mount", e06Built.includes('id="episode-tribe-totals"'));
  check("e06-heroNote-empty-built", /id="hero-note"/.test(e06Built) ? e06Built.includes('id="hero-note"') && !/<p class="hero-note">/.test(e06Built) : true);
  check("e06-built-tribal-posted", e06Built.includes('data-vote-posted="1"') && e06Built.includes('id="tribal-prevote"'));
}
const e07BuiltPath = join(root, "dist", "seasons", "1", "e07.html");
if (existsSync(e07BuiltPath)) {
  const e07Built = readFileSync(e07BuiltPath, "utf8");
  check("e07-built-keeps-tribe-totals-mount", e07Built.includes('id="episode-tribe-totals"'));
  check("e07-heroNote-empty-built", /id="hero-note"/.test(e07Built) ? e07Built.includes('id="hero-note"') && !/<p class="hero-note">/.test(e07Built) : true);
}
const e03BuiltPath = join(root, "dist", "seasons", "1", "e03.html");
if (existsSync(e03BuiltPath)) {
  const e03Built = readFileSync(e03BuiltPath, "utf8");
  check("e03-built-tribal-posted", e03Built.includes('data-vote-posted="1"') && e03Built.includes('id="tribal-prevote"'));
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
      snapshots: generated.snapshotIds.length,
      leader: [...board.survivors].sort((a, b) => b.weekPct - a.weekPct)[0].name
    },
    null,
    2
  )
);
