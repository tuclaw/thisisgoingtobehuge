#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeason } from "./lib/ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appJs = readFileSync(join(root, "app.js"), "utf8");
const stylesCss = readFileSync(join(root, "styles.css"), "utf8");
const builder = readFileSync(join(root, "scripts", "build.mjs"), "utf8");
const ledger = readFileSync(join(root, "scripts", "lib", "ledger.mjs"), "utf8");
const episode2Copy = JSON.parse(readFileSync(join(root, "data", "episodes", "s1e02.json"), "utf8"));
const source = JSON.parse(readFileSync(join(root, "data", "season1.json"), "utf8"));
const builtE02 = join(root, "dist", "seasons", "1", "e02.html");
const e02Html = existsSync(builtE02) ? readFileSync(builtE02, "utf8") : "";

function fail(message) {
  throw new Error(message);
}

[
  "function publicFills",
  "function fillsForTapeRange",
  "function tapeSummary",
  "function fillCountPhrase",
  "function renderTradeTape",
  "function bindTradeTape",
  "function castawayTapeHtml",
  "function tradeTapeFillKey",
  'data-tape-range="week"',
  'data-tape-range="season"',
  "castawayTapeHtml(season, survivor)"
].forEach((needle) => {
  if (!appJs.includes(needle)) fail("app.js missing trade tape piece: " + needle);
});

if (!appJs.includes("renderTradeTape(season)")) {
  fail("renderEpisode must mount the trade tape");
}
if (appJs.includes("leads the week") && /renderTradeTape[\s\S]{0,400}leads the week/.test(appJs)) {
  fail("trade tape must not dump leader/laggard recap into the board");
}

const booksIdx = builder.indexOf('id="latest-books"');
const tapeIdx = builder.indexOf('id="trade-tape"');
const whispersIdx = builder.indexOf('id="camp-whispers"');
if (!(booksIdx > -1 && tapeIdx > booksIdx)) {
  fail("episode renderer must put #trade-tape after #latest-books");
}
if (whispersIdx > -1 && !(tapeIdx < whispersIdx)) {
  fail("episode renderer must put #trade-tape before #camp-whispers");
}
if (!builder.includes("Each mark is a real fill. An empty lane means they sat.")) {
  fail("trade tape must keep the short sit-vs-trade lede");
}
if (
  builder.includes('id="trade-tape"') &&
  /id="trade-tape"[\s\S]{0,500}(weekPct|markLabel|leads the week|dayPct)/.test(builder)
) {
  fail("trade tape static copy must not restore mark-status chrome");
}

[
  ".trade-tape",
  ".tape-row",
  ".tape-dot.is-buy",
  ".tape-dot.is-sell",
  ".tape-bar",
  ".castaway-tape"
].forEach((needle) => {
  if (!stylesCss.includes(needle)) fail("styles.css missing " + needle);
});

if (!ledger.includes("out.sizeUsd = event.sizeUsd")) {
  fail("public fills must keep sizeUsd without qty/avg");
}

if (episode2Copy.heroNote) fail("Episode 2 heroNote must stay empty");
if (episode2Copy.weekBoard && episode2Copy.weekBoard.lede) {
  fail("Episode 2 weekBoard.lede must stay empty");
}

const board = deriveSeason(source);
const publicFills = (board.events || []).filter((event) => event && event.type === "fill");
const sourceFills = (source.events || []).filter((event) => event && event.type === "fill");
if (!publicFills.length) fail("derived board lost the fill tape");
const publicIds = new Set(publicFills.map((fill) => fill.id));
for (const fill of sourceFills) {
  if (!publicIds.has(fill.id)) fail("public board dropped host fill: " + fill.id);
}
for (const fill of publicFills) {
  if (fill.orderId != null || fill.qty != null || fill.avg != null) {
    fail("public fill leaked brokerage fields: " + fill.id);
  }
  if (!fill.ticker || (fill.side !== "buy" && fill.side !== "sell")) {
    fail("public fill missing ticker/side: " + fill.id);
  }
  const src = sourceFills.find((row) => row.id === fill.id);
  if (src && typeof src.sizeUsd === "number" && fill.sizeUsd !== src.sizeUsd) {
    fail("public fill dropped sizeUsd: " + fill.id);
  }
}

const byId = new Map();
for (const fill of publicFills) {
  if (!byId.has(fill.survivorId)) byId.set(fill.survivorId, []);
  byId.get(fill.survivorId).push(fill);
}
const opus = (board.survivors || []).find((s) => s.slug === "claude-opus-5");
const sonnet = (board.survivors || []).find((s) => s.slug === "claude-sonnet-5");
if (!opus || !sonnet) fail("expected Opus and Sonnet on the board");
const opusN = (byId.get(opus.id) || []).length;
const sonnetN = (byId.get(sonnet.id) || []).length;
if (!(opusN > sonnetN && sonnetN > 0)) {
  fail("tape should show Opus trading more than Sonnet (got " + opusN + " vs " + sonnetN + ")");
}

const keys = publicFills.map((fill) => [fill.survivorId, fill.side, fill.ticker, fill.at].join("|"));
const dupes = keys.filter((key, i) => keys.indexOf(key) !== i);
if (!appJs.includes("if (seen.has(key)) continue")) {
  fail("publicFills must drop duplicate survivor/side/ticker/at rows");
}
if (dupes.length && !appJs.includes("tradeTapeFillKey")) {
  fail("host tape has duplicate fill keys; UI must key-dedupe them");
}

if (e02Html) {
  if (!e02Html.includes('id="trade-tape"') || !e02Html.includes("trade-tape-root")) {
    fail("built e02.html missing the trade tape mount");
  }
  const e2Books = e02Html.indexOf('id="latest-books"');
  const e2Tape = e02Html.indexOf('id="trade-tape"');
  if (!(e2Books > -1 && e2Tape > e2Books)) {
    fail("built e02.html must place #trade-tape after #latest-books");
  }
  if (e02Html.includes("hero-listen")) {
    fail("e02.html must not print the hero listen line");
  }
}

console.log(
  "trade tape checks passed (" +
    publicFills.length +
    " public fills, Opus " +
    opusN +
    " / Sonnet " +
    sonnetN +
    ")"
);
