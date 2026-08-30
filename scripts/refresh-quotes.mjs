#!/usr/bin/env node
/**
 * No-LLM quote refresh. Universe = current ledger holdings (heldTickers).
 * Fetches public last prices, appends a mark only when a fetched last moved,
 * rebuilds. Never invents a price. Does not ping contestants.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildMarkEvent,
  heldTickers,
  isUsCashSession,
  mergeQuotes,
  nyDate,
  quotesMoved,
  round
} from "./lib/ledger.mjs";
import { fetchPublicQuotes } from "./lib/quotes.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultSource = join(root, "data", "season1.json");

function arg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  if (i < 0) return fallback;
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) return true;
  return next;
}

function compactId(at) {
  return String(at)
    .replace(/\.\d+Z$/, "Z")
    .replace(/[-:]/g, "")
    .replace(/Z$/, "Z");
}

function ptParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return {
    weekday: get("weekday"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    dayPeriod: (get("dayPeriod") || "").toUpperCase()
  };
}

function markMeta(source, at) {
  const date = new Date(at);
  const pt = ptParts(date);
  const ids = new Set((source.events || []).map((event) => event && event.id));
  let id = `auto-rth-${compactId(at)}`;
  let n = 2;
  while (ids.has(id)) {
    id = `auto-rth-${compactId(at)}-${n}`;
    n += 1;
  }
  return {
    id,
    at,
    throughAt: at,
    kind: "intraday",
    lastSession: `${nyDate(date)}-rth`,
    label: `${pt.weekday} ${pt.month} ${pt.day} ~${pt.hour}:${pt.minute} ${pt.dayPeriod} PT last`,
    dayPctPriorOfficial: true
  };
}

function roundQuote(quote) {
  const out = { ...quote, last: round(quote.last, 4) };
  if (typeof quote.priorClose === "number") out.priorClose = round(quote.priorClose, 4);
  return out;
}

function loadSource(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function rebuild() {
  const built = spawnSync(process.execPath, [join(root, "scripts", "build.mjs")], {
    cwd: root,
    stdio: "inherit"
  });
  if (built.status !== 0) {
    throw new Error(`build failed (${built.status})`);
  }
}

async function main() {
  const universeOnly = Boolean(arg("--universe"));
  const apply = Boolean(arg("--apply"));
  const force = Boolean(arg("--force"));
  const sourcePath = arg("--source") === true || !arg("--source") ? defaultSource : arg("--source");
  const source = loadSource(sourcePath);
  const tickers = heldTickers(source);

  if (universeOnly) {
    console.log(JSON.stringify({ tickers }, null, 2));
    return { mode: "universe", tickers };
  }

  const now = new Date();
  const inSession = isUsCashSession(now);
  if (apply && !force && !inSession) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          wrote: false,
          reason: "outside-us-cash-session",
          tickers
        },
        null,
        2
      )
    );
    return { mode: "skip-hours", tickers };
  }

  if (!tickers.length) {
    console.log(JSON.stringify({ ok: true, wrote: false, reason: "no-stock-holdings", tickers }, null, 2));
    return { mode: "empty", tickers };
  }

  const fetched = await fetchPublicQuotes(tickers);
  const quotes = {};
  for (const [ticker, quote] of Object.entries(fetched.quotes)) {
    quotes[ticker] = roundQuote(quote);
  }
  const moved = quotesMoved(source.quotes || {}, quotes, Object.keys(quotes));

  const report = {
    ok: true,
    wrote: false,
    tickers,
    fetched: Object.keys(quotes).sort(),
    skipped: fetched.skipped,
    moved,
    apply
  };

  if (!Object.keys(quotes).length) {
    report.reason = "no-quotes-fetched";
    console.log(JSON.stringify(report, null, 2));
    return report;
  }
  if (!moved) {
    report.reason = "prices-unchanged";
    console.log(JSON.stringify(report, null, 2));
    return report;
  }
  if (!apply) {
    report.reason = "dry-run";
    report.wouldMark = Object.fromEntries(Object.entries(quotes).map(([t, q]) => [t, q.last]));
    console.log(JSON.stringify(report, null, 2));
    return report;
  }

  const at = new Date(Math.floor(now.getTime() / 1000) * 1000).toISOString();
  const meta = markMeta(source, at);
  const merged = mergeQuotes(source.quotes || {}, quotes, meta);
  const mark = buildMarkEvent(source, merged, meta);
  source.quotes = merged;
  source.events = [...(source.events || []), mark];
  writeFileSync(sourcePath, JSON.stringify(source, null, 2) + "\n");
  rebuild();
  report.wrote = true;
  report.markId = mark.id;
  report.at = mark.at;
  report.label = mark.label;
  console.log(JSON.stringify(report, null, 2));
  return report;
}

const isMain = import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && process.argv[1].endsWith("refresh-quotes.mjs"));
if (isMain) {
  main().catch((err) => {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
}

export { main, markMeta };
