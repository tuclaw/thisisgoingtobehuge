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
check(survivors.length === 10, `expected 10 cast rows (got ${survivors.length})`);
const activeLiving = survivors.filter((s) => s && (s.status === "active" || s.status === "immune"));
check(activeLiving.length === 9, `expected 9 living (got ${activeLiving.length})`);
check(data.livingCount === 9, "livingCount must be 9 after S2E01 tribal");

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
  check(e1.status === "closed", "s2e01 must be closed after Fri tribal");
  check(e1.boot === "Grok 4.7", "s2e01 boot must be Grok 4.7");
  check(e1.path === "seasons/2/e01.html", "s2e01 path must be seasons/2/e01.html");
  check(e1.source === "data/episodes/s2e01.json", "s2e01 source must be data/episodes/s2e01.json");
  check(e1.weekBoardSnapshotId === "s2e01-fri-eod-rth", "s2e01 weekBoardSnapshotId must be s2e01-fri-eod-rth");
  check(e1.liveSnapshotId === "s2e01-fri-eod-rth", "s2e01 liveSnapshotId must be s2e01-fri-eod-rth");
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
const wedMid = (Array.isArray(data.snapshots) ? data.snapshots : []).find((s) => s && s.id === "s2e01-wed-mid");
check(wedMid && wedMid.kind === "intraday", "snapshots must include s2e01-wed-mid intraday row");
const wedLasthour = (Array.isArray(data.snapshots) ? data.snapshots : []).find(
  (s) => s && s.id === "s2e01-wed-lasthour"
);
check(wedLasthour && wedLasthour.kind === "intraday", "snapshots must include s2e01-wed-lasthour intraday row");
const wedEodRth = (Array.isArray(data.snapshots) ? data.snapshots : []).find(
  (s) => s && s.id === "s2e01-wed-eod-rth"
);
check(wedEodRth && wedEodRth.kind === "close-rth-last", "snapshots must include s2e01-wed-eod-rth close-rth-last row");
const thuOpen = (Array.isArray(data.snapshots) ? data.snapshots : []).find((s) => s && s.id === "s2e01-thu-open");
check(thuOpen && thuOpen.kind === "open", "snapshots must include s2e01-thu-open open row");
const thuMid = (Array.isArray(data.snapshots) ? data.snapshots : []).find((s) => s && s.id === "s2e01-thu-mid");
check(thuMid && thuMid.kind === "intraday", "snapshots must include s2e01-thu-mid intraday row");
const thuLasthour = (Array.isArray(data.snapshots) ? data.snapshots : []).find(
  (s) => s && s.id === "s2e01-thu-lasthour"
);
check(thuLasthour && thuLasthour.kind === "intraday", "snapshots must include s2e01-thu-lasthour intraday row");
const thuEodSip = (Array.isArray(data.snapshots) ? data.snapshots : []).find(
  (s) => s && s.id === "s2e01-thu-eod-sip"
);
check(thuEodSip && thuEodSip.kind === "close", "snapshots must include s2e01-thu-eod-sip close row");
const friOpen = (Array.isArray(data.snapshots) ? data.snapshots : []).find((s) => s && s.id === "s2e01-fri-open");
check(friOpen && friOpen.kind === "open", "snapshots must include s2e01-fri-open open row");
const friMid = (Array.isArray(data.snapshots) ? data.snapshots : []).find((s) => s && s.id === "s2e01-fri-mid");
check(friMid && friMid.kind === "intraday", "snapshots must include s2e01-fri-mid intraday row");
const friLasthour = (Array.isArray(data.snapshots) ? data.snapshots : []).find(
  (s) => s && s.id === "s2e01-fri-lasthour"
);
check(friLasthour && friLasthour.kind === "intraday", "snapshots must include s2e01-fri-lasthour intraday row");
const friEodRth = (Array.isArray(data.snapshots) ? data.snapshots : []).find(
  (s) => s && s.id === "s2e01-fri-eod-rth"
);
check(friEodRth && friEodRth.kind === "close-rth-last", "snapshots must include s2e01-fri-eod-rth close-rth-last row");
check(friEodRth && friEodRth.quoteSource === "rth-last-trade" && friEodRth.sipPending === true, "s2e01-fri-eod-rth must be RTH last with official close pending");
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
    e1Copy.weekBoard && e1Copy.weekBoard.snapshotId === "s2e01-fri-eod-rth",
    "s2e01 weekBoard.snapshotId must be s2e01-fri-eod-rth"
  );
  const wedBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "wed-open-books")
  );
  check(wedBooks, "s2e01 must include wed-open-books beat");
  const wedMidBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "wed-mid-books")
  );
  check(wedMidBooks, "s2e01 must include wed-mid-books beat");
  const wedLasthourBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "wed-lasthour-books")
  );
  check(wedLasthourBooks, "s2e01 must include wed-lasthour-books beat");
  const wedEodRthBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "wed-eod-rth-books")
  );
  check(wedEodRthBooks, "s2e01 must include wed-eod-rth-books beat");
  const thuOpenBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "thu-open-books")
  );
  check(thuOpenBooks, "s2e01 must include thu-open-books beat");
  const thuMidBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "thu-mid-books")
  );
  check(thuMidBooks, "s2e01 must include thu-mid-books beat");
  const thuDay = (e1Copy.days || []).find((day) => day && day.id === "thursday");
  const thuBeats = thuDay && Array.isArray(thuDay.beats) ? thuDay.beats : [];
  const thuMidIdx = thuBeats.findIndex((b) => b && b.id === "thu-mid-books");
  const thuLastIdx = thuBeats.findIndex((b) => b && b.id === "thu-lasthour-copy");
  check(
    !thuBeats.some((b) => b && b.id === "thursday-confessionals"),
    "s2e01 Thursday confessionals live in Island Chatter, not a booths beat"
  );
  check(
    !thuBeats.some((b) => b && b.type === "booths"),
    "s2e01 must not render confessional booths on the episode page"
  );
  check(
    thuMidIdx >= 0 && thuLastIdx === thuMidIdx + 1,
    "Thursday fold continues from thu-mid-books into thu-lasthour-copy"
  );
  const thuLasthourBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "thu-lasthour-books")
  );
  check(thuLasthourBooks, "s2e01 must include thu-lasthour-books beat");
  const thuEodSipBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "thu-eod-sip-books")
  );
  check(thuEodSipBooks, "s2e01 must include thu-eod-sip-books beat");
  const friOpenBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "fri-open-books")
  );
  check(friOpenBooks, "s2e01 must include fri-open-books beat");
  const friMidBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "fri-mid-books")
  );
  check(friMidBooks, "s2e01 must include fri-mid-books beat");
  const friLasthourBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "fri-lasthour-books")
  );
  check(friLasthourBooks, "s2e01 must include fri-lasthour-books beat");
  const friEodRthBooks = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "books" && b.id === "fri-eod-rth-books")
  );
  check(friEodRthBooks, "s2e01 must include fri-eod-rth-books beat");
  check(e1Copy.conversationFeed === false, "s2e01 must not enable beach iMessage conversationFeed");
  const hasSocial = (e1Copy.days || []).some((day) =>
    (day.beats || []).some((b) => b.type === "social" && String(b.href || "").includes("social.html"))
  );
  check(hasSocial, "s2e01 must point social beats at Island Chatter (social.html)");
  const friDay = (e1Copy.days || []).find((day) => day && day.id === "friday");
  const friBeats = friDay && Array.isArray(friDay.beats) ? friDay.beats : [];
  const booksIdx = friBeats.findIndex((b) => b && b.id === "fri-eod-rth-books");
  const stmtIdx = friBeats.findIndex((b) => b && b.id === "tribal-statements");
  const voteIdx = friBeats.findIndex((b) => b && b.id === "tribal-vote-readout");
  const cutIdx = friBeats.findIndex((b) => b && b.id === "tribal-cut");
  const exitIdx = friBeats.findIndex((b) => b && b.id === "grok-exit-interview");
  check(stmtIdx > booksIdx, "tribal statements must follow Fri close books");
  check(voteIdx > stmtIdx, "vote readout must follow statements");
  check(cutIdx > voteIdx, "tribal-cut must follow vote readout");
  check(exitIdx > cutIdx, "Grok exit must follow tribal-cut");
  const stmtBeat = friBeats[stmtIdx];
  check(stmtBeat && (stmtBeat.notes || []).length === 9, "nine pre-vote statements");
  const voteBeat = friBeats[voteIdx];
  check(voteBeat && String(voteBeat.body || "").includes("Composer 2.5 → Grok 4.7"), "vote readout must list pairings");
  check(!String(voteBeat.body || "").includes("WHY:"), "vote readout must not publish private reasons");
  const exitBeat = friBeats[exitIdx];
  check(
    exitBeat && String(exitBeat.body || "").includes("quiet people were never the threat"),
    "Grok exit interview must be verbatim final words"
  );
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
  const siteNav = readFileSync(join(root, "templates", "partials", "site-nav.html"), "utf8");
  const chatterPing = readFileSync(join(root, "templates", "partials", "chatter-ping.html"), "utf8");
  const homeChrome =
    home +
    (home.includes("{{partial:site-nav}}") ? siteNav : "") +
    (home.includes("{{partial:chatter-ping}}") ? chatterPing : "");
  check(home.includes('data-season="2"'), "homepage must set data-season=2");
  check(!home.includes('id="season"'), "homepage must not keep season journey / episode teaser block");
  check(!home.includes('id="home-episodes"'), "homepage must not mount home-episodes");
  check(homeChrome.includes("seasons/2/social.html"), "homepage must link Island Chatter");
  check(!homeChrome.includes('<a href="#cast">Cast</a>') && !siteNav.includes(">Cast<"), "homepage header must drop Cast for Island Chatter");
  check(
    homeChrome.includes('data-nav-chatter') && homeChrome.includes("Island Chatter"),
    "homepage header must include Island Chatter nav link"
  );
  check(
    homeChrome.includes("lts-island-chatter-visited") && homeChrome.includes("has-chatter-ping"),
    "homepage must show Island Chatter red-dot until first visit"
  );
  check(home.includes('id="books"') && home.includes('id="s2-performance"'), "homepage must mount the standings board");
  check(
    home.includes('id="s2-show-more"') && home.includes('class="show-more-btn"') && !home.includes("face-show-more"),
    "Show more stays on standings and off Meet the contestants"
  );
  const booksBlock = home.slice(home.indexOf('id="s2-show-more"'), home.indexOf('id="beach"'));
  check(
    booksBlock.includes('id="s2-trades"') &&
      booksBlock.indexOf("show-more-btn") < booksBlock.indexOf('id="s2-trades"') &&
      booksBlock.includes('class="s2-trades-toggle"') &&
      /id="s2-trades-panel"[^>]*\shidden/.test(booksBlock) &&
      !booksBlock.includes("s2-trades-more"),
    "buys and sells starts collapsed under the standings"
  );
  check(appJs.includes("function bindSeason2Trades"), "buys and sells toggle must be wired in app.js");
  check(home.includes('data-embed="home"') && home.includes("slack-mirror.js"), "homepage must embed Island Chatter");
  check(home.indexOf('id="books"') > home.indexOf('id="cast"'), "standings must sit under Meet the contestants");
  check(home.indexOf('id="beach"') > home.indexOf('id="books"'), "Island Chatter must sit under the standings");
} catch (e) {
  check(false, "templates/island.html: " + e.message);
}

const season2Index = readFileSync(join(root, "templates", "season2-index.html"), "utf8");
check(season2Index.includes('id="s2-performance"'), "season 2 nav page keeps the standings board");
check(!season2Index.includes('id="episode-list"'), "season 2 nav page must not lead with the episode list");
check(season2Index.includes("e01.html"), "season 2 nav page keeps an episode archive link");
check(season2Index.includes("index.html#books"), "season 2 nav page points at the island board");

const burnSrc = readFileSync(join(root, "tribal-spoiler-burn.js"), "utf8");
check(burnSrc.includes("window.burnAwayButton"), "show more must reuse the spoiler burn");
check(burnSrc.includes("prefers-reduced-motion"), "spoiler burn must honor reduced motion");
const showMoreBurn = burnSrc.match(/SHOW_MORE_BURN_SECONDS = ([0-9.]+)/);
check(
  showMoreBurn && Number(showMoreBurn[1]) < 3.5 && Number(showMoreBurn[1]) >= 1.2,
  "show more burn must be quicker than the tribal card"
);
check(burnSrc.includes("this.burnTimer / SHOW_MORE_BURN_SECONDS"), "show more burn must use its own duration");
check(appJs.includes("burnAwayButton"), "standings Show more must call burnAwayButton");
check(appJs.includes("function deriveSnapshotFills"), "app.js must derive fills from snapshots");
check(/pane\.scrollTo\(/.test(readFileSync(join(root, "slack-mirror.js"), "utf8")), "Island Chatter unread scroll stays inside the pane");

const deriveStart = appJs.indexOf("function deriveSnapshotFills(");
const deriveEnd = appJs.indexOf("function groupSnapshotFills(");
check(deriveStart > -1 && deriveEnd > deriveStart, "deriveSnapshotFills must stay ahead of groupSnapshotFills");
if (deriveStart > -1 && deriveEnd > deriveStart) {
  const derive = new Function(`${appJs.slice(deriveStart, deriveEnd)}\nreturn deriveSnapshotFills;`)();
  const fills = derive(data);
  check(Array.isArray(fills) && fills.length >= 24, `snapshot fills must include Wednesday's open book (got ${fills && fills.length})`);
  const snaps = Array.isArray(data.snapshots) ? data.snapshots : [];
  const snapIndex = new Map(snaps.map((snap, i) => [snap && snap.id, i]));
  const held = (book, ticker) =>
    Boolean(book && (book.positions || []).some((pos) => String((pos && pos.ticker) || "").toUpperCase() === ticker));
  for (const fill of fills) {
    check(fill && (fill.side === "buy" || fill.side === "sell"), "fill side must be buy or sell");
    check(fill.ticker && fill.ticker !== "CASH", `fill ticker must be a position (got ${fill && fill.ticker})`);
    check(snapIndex.has(fill.snapshotId), `fill snapshot missing: ${fill && fill.snapshotId}`);
    check(fill.side !== "sell" || fill.sizeUsd == null, `${fill.ticker} sell must not invent proceeds`);
    if (fill.how === "open" && fill.side === "buy") {
      check(typeof fill.sizeUsd === "number" && fill.sizeUsd > 0, `${fill.ticker} open buy needs a cost basis`);
    }
    const i = snapIndex.get(fill.snapshotId);
    const cur = i >= 0 && snaps[i] && snaps[i].books ? snaps[i].books[fill.survivorId] : null;
    const prev = i > 0 && snaps[i - 1] && snaps[i - 1].books ? snaps[i - 1].books[fill.survivorId] : null;
    if (fill.side === "buy" && fill.how === "open") {
      check(held(cur, fill.ticker), `${fill.survivorId} bought ${fill.ticker} but it is missing on ${fill.snapshotId}`);
    }
    if (fill.side === "sell") {
      check(held(prev, fill.ticker), `${fill.survivorId} sold ${fill.ticker} but it was not on the prior snapshot`);
    }
  }
  const gemini = fills.filter((fill) => fill.survivorId === "s2-gemini-3-1-pro");
  check(gemini.some((fill) => fill.side === "sell" && fill.ticker === "CEG"), "Gemini 3.1 Pro CEG close must stay a real sell");
  check(gemini.some((fill) => fill.side === "buy" && fill.ticker === "SPLV"), "Gemini 3.1 Pro SPLV buy must stay a real fill");
}

const grok = survivors.find((s) => s && s.id === "s2-grok-4-7");
check(grok && grok.status === "voted-out" && grok.jury === true, "Grok 4.7 must be voted-out jury");
check(grok && grok.bookHeld === true, "Grok 4.7 book must be held until finale");
check(grok && grok.bookUsd > 0, "Grok 4.7 bookUsd must stay marked (not boot-split to zero)");
check(grok && grok.votedOut === true, "Grok 4.7 votedOut must be true");
check(grok && grok.bootOrder === 1, "Grok 4.7 bootOrder must be 1 (first boot)");
check(grok && grok.votedOutEpisode === "s2e01", "Grok votedOutEpisode must be s2e01");
check(
  grok && String(grok.votedOutAt || "").startsWith("2026-10-09"),
  "Grok votedOutAt must be Fri Oct 9 2026"
);

const stylesCss = readFileSync(join(root, "styles.css"), "utf8");
check(stylesCss.includes(".s2-row.is-voted-out"), "standings fade a voted-out row");
check(stylesCss.includes(".face-card.is-voted-out"), "Meet the Contestants fades a voted-out card");
check(stylesCss.includes(".money-ticker-line.is-voted-out"), "contestants diagram fades a voted-out line");
check(/\.is-voted-out[\s\S]{0,220}grayscale\(1\)/.test(stylesCss), "voted-out treatment is greyscale");
check(appJs.includes('return "Voted out · " + bootOrdinal(n);'), "voted-out label is Voted out · ordinal");
check(
  appJs.includes("const members = (season.survivors || []).filter((s) => s);"),
  "Meet the Contestants keeps voted-out players on the grid"
);
check(appJs.includes("survivor.bookHeld === true"), "held books stay in the island total and contestants diagram");

const ordStart = appJs.indexOf("function bootOrdinal");
const ordEnd = appJs.indexOf("function episodePctOf");
check(ordStart > -1 && ordEnd > ordStart, "bootOrdinal must sit ahead of episodePctOf");
if (ordStart > -1 && ordEnd > ordStart) {
  const labels = new Function(`${appJs.slice(ordStart, ordEnd)}\nreturn { bootOrdinal, votedOutPlaceLabel };`)();
  check(
    labels.votedOutPlaceLabel({ votedOut: true, status: "voted-out", bootOrder: 1 }) === "Voted out · 1st",
    "boot 1 must read Voted out · 1st"
  );
  check(labels.bootOrdinal(2) === "2nd" && labels.bootOrdinal(3) === "3rd", "later boots use 2nd and 3rd");
  check(labels.bootOrdinal(11) === "11th" && labels.bootOrdinal(12) === "12th", "teen ordinals stay th");
  check(
    labels.votedOutPlaceLabel({ status: "active" }) === "",
    "living players must not get a voted-out label"
  );
}

const potStart = appJs.indexOf("function survivorInIslandPotAt");
const potEnd = appJs.indexOf("function pacificDayLabel");
check(potStart > -1 && potEnd > potStart, "snapshotTotal must stay with survivorInIslandPotAt");
if (potStart > -1 && potEnd > potStart) {
  const potHelpers = new Function(`
    function tickerPlotAt(snap) { return (snap && (snap.throughAt || snap.at)) || ""; }
    function roundMoney(n) { return Math.round(n * 10000) / 10000; }
    function survivorBootAtMs(season, survivor) {
      const log = (season && season.tribalLog) || [];
      const hit = log.find((entry) => entry && (entry.bootId === survivor.id || entry.bootName === survivor.name));
      return hit && hit.at ? Date.parse(hit.at) : null;
    }
    ${appJs.slice(potStart, potEnd)}
    return { snapshotTotal };
  `)();
  const liveSnap = (Array.isArray(data.snapshots) ? data.snapshots : []).find(
    (snap) => snap && snap.id === "s2e01-fri-eod-rth"
  );
  if (!liveSnap || !liveSnap.books) {
    check(false, "s2e01-fri-eod-rth must exist for the island-total check");
  } else {
    const full = Object.values(liveSnap.books).reduce((acc, book) => {
      return book && typeof book.bookUsd === "number" ? acc + book.bookUsd : acc;
    }, 0);
    const got = potHelpers.snapshotTotal(liveSnap, data);
    const rounded = Math.round(full * 10000) / 10000;
    check(
      Math.abs(got - rounded) < 0.00015,
      `island total must keep the voted-out book (got ${got}, full ${rounded})`
    );
    const grokBook = liveSnap.books["s2-grok-4-7"];
    const without = rounded - (grokBook && grokBook.bookUsd ? grokBook.bookUsd : 0);
    check(got > without + 1, "island total must not subtract Grok 4.7 after tribal");
  }
}

const livingStart = appJs.indexOf("function survivorLivingAt");
const livingEnd = appJs.indexOf("function tickerAxisPct");
check(livingStart > -1 && livingEnd > livingStart, "survivorLivingAt must stay ahead of tickerAxisPct");
if (livingStart > -1 && livingEnd > livingStart) {
  const livingAt = new Function(`
    function survivorBootAtMs() { return Date.parse("2026-10-09T21:29:00Z"); }
    ${appJs.slice(livingStart, livingEnd)}
    return survivorLivingAt;
  `)();
  check(
    livingAt(data, grok, "2026-10-10T16:00:00Z") === true,
    "Grok 4.7 stays on the contestants diagram after tribal"
  );
  check(
    livingAt(data, { id: "s1-boot", status: "jury" }, "2026-10-10T16:00:00Z") === false,
    "a boot without a held book still drops off the diagram after tribal"
  );
}

const log = Array.isArray(data.tribalLog) ? data.tribalLog : [];
const tribal = log.find((row) => row && row.episode === "s2e01");
check(tribal, "tribalLog must include S2E01 council");
if (tribal) {
  check(tribal.bootName === "Grok 4.7", "tribal bootName must be Grok 4.7");
  check(tribal.bookHeld === true, "tribal bookHeld must be true");
  check(tribal.individualImmunity === "s2-gemini-3-1-pro", "immunity record must pin Gemini 3.1 Pro");
  check(tribal.tally && tribal.tally["Grok 4.7"] === 4, "Grok tally must be 4");
  const pairings = (tribal.votes || []).map((v) => `${v.from}>${v.for}`).join("|");
  check(
    pairings ===
      "Grok 4.7>Muse Spark 1.3|Claude Opus 5.5>Kimi K3|Claude Fable 5.1>Gemini 3.8 Flash|Composer 2.5>Grok 4.7|Gemini 3.8 Flash>Claude Fable 5.1|Muse Spark 1.3>Grok 4.7|GLM 5.2>Grok 4.7|Kimi K2.7 Code>Claude Opus 5.5|Kimi K3>Grok 4.7",
    "tribalLog votes must match official pairings"
  );
  check(!(tribal.votes || []).some((v) => v && v.text), "tribalLog votes must not store private confessionals");
}

check(
  data.immunity && String(data.immunity.note || "").includes("Gemini 3.1 Pro"),
  "immunity note must record Gemini 3.1 Pro necklace at tribal"
);

if (errors.length) {
  console.error("check-season2-board failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("check-season2-board ok");
