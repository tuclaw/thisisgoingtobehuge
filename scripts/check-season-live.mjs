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
  listedE4 &&
    listedE4.diagramStartSnapshotId === "s1e04-carry" &&
    source.episode &&
    source.episode.diagramStartSnapshotId === "s1e04-carry"
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
  const carryLivingIds = Object.keys(e4Carry.recorded).filter((id) => {
    const rec = e4Carry.recorded[id];
    const row = (source.survivors || []).find((s) => s.id === id);
    return rec && row && row.status === "active";
  });
  check(
    "e4-carry-week-reset",
    carryLivingIds.length === 8 && carryLivingIds.every((id) => e4Carry.recorded[id] && e4Carry.recorded[id].weekPct === 0)
  );
}

const episodeCopy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e01.json"), "utf8"));
const episode2Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e02.json"), "utf8"));
const episode3Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e03.json"), "utf8"));
const episode4Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e04.json"), "utf8"));

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
check("tribal-log-five-councils", Array.isArray(log) && log.length === 5);
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
check("books-living-counts", biduLive && biduLive.livingCount === 6 && askaraLive && askaraLive.livingCount === 2);

const home = readFileSync(join(root, "templates", "island.html"), "utf8");
check(
  "homepage-given-copy",
  home.includes("$361.93 given. Eight still in. MERGED. GPT-5.6 Sol voted out Tue Sep 8. Episode 4 live Wed Sep 9 – Fri Sep 11. Tuesday and Friday tribal.")
);
check("homepage-no-even-up-480", !home.includes("$480.10") && !home.includes("even-up to $53.20"));
check("homepage-points-at-e04", home.includes("seasons/1/e04.html") && home.includes("Walk into Episode 4"));
check("homepage-skips-e03-primary-cta", !home.includes("Walk into Episode 3"));
check("merged-true", source.merged === true);
check(
  "status-label-e04-sip",
  source.statusLabel === "Live · S1E04 · MERGED · eight living · Tue Sep 8 SIP close (late)"
);
const e4Sip = (source.events || []).find((event) => event && event.id === "s1e04-tue-sip");
check("e4-tue-sip-mark", Boolean(e4Sip) && e4Sip.kind === "close" && e4Sip.at === "2026-09-09T02:15:00Z");
check("live-snapshot-sip", source.liveSnapshotId === "s1e04-tue-sip");
check(
  "live-episode-is-e04",
  source.episode && source.episode.id === "s1e04" && source.episode.status === "live" && source.episode.path === "seasons/1/e04.html"
);
check(
  "live-episode-challenge",
  source.episode &&
    source.episode.challenge === "Season rule: always hold at least one US-listed stock or ETF (never all-cash)."
);
check("live-episode-week", source.episode && source.episode.weekLabel === "Wednesday Sep 9 – Friday Sep 11, 2026");
check("live-episode-tribal", source.episode && source.episode.tribalLabel === "Friday Sep 11, 2026 · 2:00 PM PT");
check("immunity-unset", source.immunity == null);

const episodeDayIds = (episodeCopy.days || []).map((day) => day.id);
check("saturday-after-tribal", episodeDayIds.indexOf("saturday") > episodeDayIds.indexOf("tribal"));
check("sunday-after-saturday", episodeDayIds.indexOf("sunday") > episodeDayIds.indexOf("saturday"));
check("sunday-after-tribal", episodeDayIds.indexOf("sunday") > episodeDayIds.indexOf("tribal"));

const e1 = (source.episodes || []).find((ep) => ep.id === "s1e01");
const e2 = (source.episodes || []).find((ep) => ep.id === "s1e02");
const e3 = (source.episodes || []).find((ep) => ep.id === "s1e03");
const e4 = (source.episodes || []).find((ep) => ep.id === "s1e04");
check("episode-1-closed", e1 && e1.status === "closed" && e1.path === "seasons/1/e01.html" && e1.boot === "Claude Fable 5");
check("episode-2-closed", e2 && e2.status === "closed" && e2.path === "seasons/1/e02.html" && e2.boot === "Gemini 3.1 Pro");
check("episode-3-closed", e3 && e3.status === "closed" && e3.path === "seasons/1/e03.html" && e3.boot === "GPT-5.6 Sol");
check("episode-4-live", e4 && e4.status === "live" && e4.path === "seasons/1/e04.html");
check("episode-4-week-bounds", e4 && e4.weekStart === "2026-09-09" && e4.weekEnd === "2026-09-11");
check(
  "episode-1-list-tease-no-boot",
  e1 && (!e1.tease || (typeof e1.tease === "string" && !/fable|5–1|5-1|juror|voted out/i.test(e1.tease)))
);

check("e02-heroNote-empty", episode2Copy.heroNote === "");
check("e02-weekBoard-lede-empty", episode2Copy.weekBoard && episode2Copy.weekBoard.lede === "");
check("e03-heroNote-empty", episode3Copy.heroNote === "");
check("e04-heroNote-empty", episode4Copy.heroNote === "");
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
  "e04-cold-open-eight-living",
  JSON.stringify(episode4Copy).includes("Eight") && JSON.stringify(episode4Copy).includes("$361.93 given")
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
