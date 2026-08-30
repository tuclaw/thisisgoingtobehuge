#!/usr/bin/env node
/**
 * Keep the no-LLM quote refresh coupled to the live ledger.
 * Universe must come from current holdings, not a stale watchlist.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  booksFromFills,
  buildMarkEvent,
  deriveSeason,
  heldTickers,
  isCashLeg,
  isNewTradingDay,
  isUsCashSession,
  latestMark,
  mergeQuotes,
  quotesMoved,
  tickerOf
} from "./lib/ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "data", "season1.json"), "utf8"));
const board = deriveSeason(source);
const refreshSrc = readFileSync(join(root, "scripts", "refresh-quotes.mjs"), "utf8");
const quotesSrc = readFileSync(join(root, "scripts", "lib", "quotes.mjs"), "utf8");
const workflowSrc = readFileSync(join(root, ".github", "workflows", "refresh-quotes.yml"), "utf8");
const agentsSrc = readFileSync(join(root, "AGENTS.md"), "utf8");

const failures = [];
function check(name, ok, detail) {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

const fromBooks = heldTickers(source);
const fromBoard = [
  ...new Set(
    board.survivors.flatMap((s) => (s.positions || []).filter((pos) => !isCashLeg(pos)).map(tickerOf)).filter(Boolean)
  )
].sort();
check("held-matches-board", JSON.stringify(fromBooks) === JSON.stringify(fromBoard), `${fromBooks} vs ${fromBoard}`);
check("held-excludes-cash", !fromBooks.includes("CASH"));
check(
  "held-excludes-sold-lots",
  fromBooks.every((ticker) =>
    board.survivors.some((s) => (s.positions || []).some((pos) => !isCashLeg(pos) && tickerOf(pos) === ticker))
  )
);

const fixture = {
  startingBookUsd: 10,
  cast: [{ id: "a", name: "A", slug: "a", model: "A", tribeId: "t" }],
  events: [
    {
      type: "fill",
      id: "f1",
      survivorId: "a",
      side: "buy",
      ticker: "OLD",
      qty: "1",
      avg: "2",
      at: "2026-01-01T15:00:00Z"
    },
    {
      type: "fill",
      id: "f2",
      survivorId: "a",
      side: "sell",
      ticker: "OLD",
      qty: "1",
      avg: "2",
      at: "2026-01-02T15:00:00Z"
    },
    {
      type: "fill",
      id: "f3",
      survivorId: "a",
      side: "buy",
      ticker: "NEW",
      qty: "1",
      avg: "4",
      at: "2026-01-03T15:00:00Z"
    }
  ]
};
check("held-follows-fills", JSON.stringify(heldTickers(fixture)) === JSON.stringify(["NEW"]), String(heldTickers(fixture)));

const starting = source.startingBookUsd;
const liveBooks = booksFromFills(source.cast, source.events, starting);
const lastMark = latestMark(source.events);
const rebuilt = buildMarkEvent(source, source.quotes, {
  id: "check-rebuild",
  at: lastMark.at,
  throughAt: lastMark.throughAt || lastMark.at,
  label: lastMark.label,
  lastSession: lastMark.lastSession,
  kind: lastMark.kind
});
for (const member of source.cast) {
  const rec = lastMark.recorded && lastMark.recorded[member.id];
  const got = rebuilt.recorded[member.id];
  if (!rec || !got) {
    check(`rebuild-recorded:${member.id}`, false, "missing");
    continue;
  }
  check(
    `rebuild-book:${member.slug || member.id}`,
    Math.abs(rec.bookUsd - got.bookUsd) < 0.05,
    `${rec.bookUsd} vs ${got.bookUsd}`
  );
}

check("quotes-moved-same", quotesMoved({ AAA: { last: 1 } }, { AAA: { last: 1 } }, ["AAA"]) === false);
check("quotes-moved-diff", quotesMoved({ AAA: { last: 1 } }, { AAA: { last: 1.01 } }, ["AAA"]) === true);
check("quotes-moved-skips-missing", quotesMoved({ AAA: { last: 1 } }, {}, ["AAA"]) === false);

const merged = mergeQuotes({ AAA: { last: 1, source: "old" } }, { AAA: { last: 2, source: "yahoo-chart last" } }, {
  at: "2026-09-01T14:00:00Z",
  lastSession: "2026-09-01-rth"
});
check("merge-updates-fetched", merged.AAA.last === 2 && merged.AAA.asOf === "2026-09-01T14:00:00Z");

check("new-day-friday-to-monday", isNewTradingDay("2026-08-28T19:14:23Z", "2026-08-31T14:35:00Z") === true);
check("same-day-session", isNewTradingDay("2026-08-28T14:01:56Z", "2026-08-28T19:14:23Z") === false);
check("rth-friday-lasthour", isUsCashSession(new Date("2026-08-28T19:14:23Z")) === true);
check("rth-sunday", isUsCashSession(new Date("2026-08-30T18:00:00Z")) === false);
check("rth-before-open", isUsCashSession(new Date("2026-08-28T13:00:00Z")) === false);

check("script-imports-heldTickers", /heldTickers/.test(refreshSrc));
check("script-imports-buildMarkEvent", /buildMarkEvent/.test(refreshSrc));
check("script-imports-fetchPublicQuotes", /fetchPublicQuotes/.test(refreshSrc));
check("script-no-watchlist-const", !/\b(WATCHLIST|TICKER_UNIVERSE|HARDCODED_TICKERS)\b/.test(refreshSrc));
check("quotes-lib-no-watchlist", !/\b(WATCHLIST|TICKER_UNIVERSE)\b/.test(quotesSrc));
check("script-skips-failed-fetch", refreshSrc.includes("skipped") && quotesSrc.includes("never invented"));
check("script-rebuilds-on-apply", refreshSrc.includes("build.mjs"));
check("workflow-runs-script", workflowSrc.includes("scripts/refresh-quotes.mjs"));
check("workflow-no-commit-when-quiet", workflowSrc.includes("git diff --quiet"));
check("workflow-weekday-hours", /cron:/.test(workflowSrc) && workflowSrc.includes("1-5"));
check("agents-doc-requires-same-pr", /refresh-quotes/.test(agentsSrc) && /same (PR|change)/i.test(agentsSrc));

const printed = execFileSync(process.execPath, [join(root, "scripts", "refresh-quotes.mjs"), "--universe"], {
  encoding: "utf8"
});
const universe = JSON.parse(printed);
check(
  "cli-universe-matches-ledger",
  JSON.stringify(universe.tickers) === JSON.stringify(fromBooks),
  `${universe.tickers} vs ${fromBooks}`
);
check("cli-universe-nonempty-or-all-cash", Array.isArray(universe.tickers));
check("live-books-exist", liveBooks.size === source.cast.length);

if (failures.length) {
  console.error("Quote refresh checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      ok: true,
      kind: "quote-refresh",
      tickers: fromBooks
    },
    null,
    2
  )
);
