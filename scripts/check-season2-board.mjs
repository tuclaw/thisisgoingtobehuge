/** Season 2 pre-launch board invariants ($200 books, locked cast). */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalCastAsset } from "./lib/ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season2.json");

const LOCKED_MODELS = [
  "Grok 4.7",
  "Claude Opus 5.5",
  "Claude Fable 5.1",
  "Composer 2.5",
  "Gemini 3.8 Flash",
  "Gemini 3.1 Pro",
  "Muse Spark 1.3",
  "GLM 5.2",
  "Kimi K2.7 Code",
  "Kimi K3"
];

let data;
try {
  data = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error("check-season2-board: cannot read season2.json:", e.message);
  process.exit(1);
}

const errors = [];

function check(ok, msg) {
  if (!ok) errors.push(msg);
}

check(data.season === 2, "season must be 2");
check(data.startingBookUsd === 200, "startingBookUsd must be 200");
check(data.islandGivenUsd === 2000, "islandGivenUsd must be 2000");
check(data.islandPotUsd === 2000, "islandPotUsd must be 2000");
check(data.startingBookUsd !== 100, "must not use $100 starting book");
check(data.islandGivenUsd !== 1000, "must not use $1,000 island given");

const survivors = Array.isArray(data.survivors) ? data.survivors : [];
check(survivors.length === 10, `expected 10 survivors (got ${survivors.length})`);

const models = survivors.map((s) => s.model).sort();
const expected = [...LOCKED_MODELS].sort();
check(
  JSON.stringify(models) === JSON.stringify(expected),
  `cast models must match locked list (got ${models.join(", ")})`
);

const S1_LEFTOVER_FOLDERS = [
  "claude-opus-5",
  "claude-fable-5",
  "gemini-3-7-flash",
  "grok-4-5",
  "grok-4-6"
];

for (const s of survivors) {
  check(!s.tribeId, `${s.model}: Season 2 has no tribes (tribeId must be absent)`);
  const portrait = canonicalCastAsset(s.slug, "portrait");
  const camp = canonicalCastAsset(s.slug, "camp");
  check(s.portrait === portrait, `${s.model}: portrait must be ${portrait} (got ${s.portrait})`);
  check(s.camp === camp, `${s.model}: camp must be ${camp} (got ${s.camp})`);
  check(existsSync(join(root, portrait)), `${s.model}: missing ${portrait}`);
  check(existsSync(join(root, camp)), `${s.model}: missing ${camp}`);
  for (const folder of S1_LEFTOVER_FOLDERS) {
    check(
      !String(s.portrait || "").includes(`cast/${folder}/`) && !String(s.camp || "").includes(`cast/${folder}/`),
      `${s.model}: must not point at Season 1 folder cast/${folder}/`
    );
  }
}

const episodes = Array.isArray(data.episodes) ? data.episodes : [];
const e1 = episodes.find((ep) => ep && ep.id === "s2e01");
check(e1, "episodes must list s2e01");
if (e1) {
  check(e1.status === "live", "s2e01 must be live");
  check(e1.path === "seasons/2/e01.html", "s2e01 path must be seasons/2/e01.html");
  check(e1.source === "data/episodes/s2e01.json", "s2e01 source must be data/episodes/s2e01.json");
  check(e1.weekBoardSnapshotId === "s2e01-wed-open", "s2e01 weekBoardSnapshotId must be s2e01-wed-open");
  check(e1.liveSnapshotId === "s2e01-wed-open", "s2e01 liveSnapshotId must be s2e01-wed-open");
  check(e1.diagramStartSnapshotId === "s2e01-carry", "s2e01 diagramStartSnapshotId must stay s2e01-carry");
  check(e1.weekEnd === "2026-10-09", "s2e01 weekEnd must be 2026-10-09");
  check(e1.tribalAt === "2026-10-09T14:00:00-07:00", "s2e01 tribalAt must be Fri Oct 9 2026 2:00 PM PT");
  check(
    e1.tribalLabel === "Friday Oct 9, 2026 · 2:00 PM PT",
    "s2e01 tribalLabel must be Friday Oct 9, 2026 · 2:00 PM PT"
  );
}
const carry = (Array.isArray(data.snapshots) ? data.snapshots : []).find((s) => s && s.id === "s2e01-carry");
check(carry && carry.kind === "carry", "snapshots must include s2e01-carry carry row");
const wedOpen = (Array.isArray(data.snapshots) ? data.snapshots : []).find((s) => s && s.id === "s2e01-wed-open");
check(wedOpen && wedOpen.kind === "open", "snapshots must include s2e01-wed-open open row");
if (carry && carry.books) {
  for (const s of survivors) {
    const row = carry.books[s.id];
    check(row && row.bookUsd === 200, `s2e01-carry ${s.model}: bookUsd must be 200`);
  }
}
const e1CopyPath = join(root, "data", "episodes", "s2e01.json");
try {
  const e1Copy = JSON.parse(readFileSync(e1CopyPath, "utf8"));
  check(e1Copy.season === 2 && e1Copy.number === 1, "s2e01.json season/number");
  check(e1Copy.subhead === "Wednesday Oct 7 – Friday Oct 9, 2026", "s2e01 subhead week range");
  check(
    e1Copy.weekBoard && e1Copy.weekBoard.snapshotId === "s2e01-wed-open",
    "s2e01 weekBoard.snapshotId must be s2e01-wed-open"
  );
  const wedBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "wed-open-books")
  );
  check(wedBooks, "s2e01 must include wed-open-books beat");
  check(e1Copy.conversationFeed === false, "s2e01 must not enable beach iMessage conversationFeed");
  const hasSocial = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "social" && String(b.href || "").includes("social.html"))
  );
  check(hasSocial, "s2e01 must point social beats at Island Chatter (social.html)");
} catch (e) {
  check(false, "data/episodes/s2e01.json must exist: " + e.message);
}

const appJs = readFileSync(join(root, "app.js"), "utf8");
const rangeStart = appJs.indexOf("function tickerSnapIsOpeningBooks");
const rangeEnd = appJs.indexOf("function candidateStroke");
if (!(rangeStart > -1 && rangeEnd > rangeStart)) {
  check(false, "app.js missing tickerSnapIsOpeningBooks / snapshotsForTickerRange");
} else {
  const seasonRangeFn = new Function(`
    function getLiveEpisode(season) {
      return (season.episodes || []).find((ep) => ep.status === "live") || null;
    }
    function episodeIsClosed(ep) {
      return ep && (ep.status === "closed" || ep.status === "cut");
    }
    function episodeWatchReady(season, episode) {
      if (!episode || !episode.path) return false;
      if (episodeIsClosed(episode)) return true;
      return (season.snapshots || []).some((snap) => {
        return String(snap.id || "").startsWith(String(episode.id || "")) && snap.kind && snap.kind !== "carry";
      });
    }
    function tickerEpisodeForRange() { return null; }
    function currentPageEpisode() { return null; }
    function snapshotsInTickerRange(snapshots) { return snapshots; }
    ${appJs.slice(rangeStart, rangeEnd)}
    return snapshotsForTickerRange;
  `)();
  const homeTape = seasonRangeFn(data, "season");
  check(
    Array.isArray(homeTape) && homeTape.some((snap) => snap && snap.id === "s2e01-carry"),
    "home season ticker must keep s2e01-carry before first RTH mark (not wipe #money-ticker)"
  );
  check(homeTape.length > 0, "home season ticker must not receive zero frames while snapshots exist");
}

const islandPath = join(root, "templates", "island.html");
try {
  const home = readFileSync(islandPath, "utf8");
  check(home.includes('data-season="2"'), "homepage must set data-season=2");
  check(!home.includes('id="season"'), "homepage must not keep season journey / episode teaser block");
  check(!home.includes('id="home-episodes"'), "homepage must not mount home-episodes");
  check(home.includes("seasons/2/social.html"), "homepage must link Island Chatter");
} catch (e) {
  check(false, "templates/island.html: " + e.message);
}

if (errors.length) {
  console.error("check-season2-board failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("check-season2-board ok");
