/* Sanity-check episode holdings ranking and marked equity from season1.json. */
import { readFileSync } from "node:fs";

const season = JSON.parse(readFileSync(new URL("../season1.json", import.meta.url), "utf8"));

function weekPctOf(obj) {
  return obj && typeof obj.weekPct === "number" && !Number.isNaN(obj.weekPct) ? obj.weekPct : 0;
}

function tickerOf(pos) {
  return String((pos && pos.ticker) || "").toUpperCase().split("/")[0].trim();
}

function isCash(pos) {
  const ticker = tickerOf(pos);
  return ticker === "CASH" || pos.status === "cash" || pos.status === "cash-short-blocked";
}

function lastOf(pos, season) {
  if (typeof pos.last === "number") return pos.last;
  const q = season.quotes && season.quotes[tickerOf(pos)];
  return q && typeof q.last === "number" ? q.last : null;
}

function markedEquity(pos, season) {
  if (isCash(pos) && typeof pos.sizeUsd === "number") return pos.sizeUsd;
  const qty = parseFloat(pos.qty);
  const last = lastOf(pos, season);
  if (Number.isFinite(qty) && last != null) return qty * last;
  return null;
}

const ranked = [...season.survivors].sort((a, b) => weekPctOf(b) - weekPctOf(a));
const leader = ranked[0];
const hex = season.survivors.find((s) => s.name === "Hex");
const reed = season.survivors.find((s) => s.name === "Reed");
const hexEquity = (hex.positions || []).reduce((sum, p) => sum + (markedEquity(p, season) || 0), 0);
const reedTickers = (reed.positions || []).map((p) => tickerOf(p) || "CASH");
const unmarked = reed.positions.filter((p) => !isCash(p) && markedEquity(p, season) == null);

const checks = {
  twelve: season.survivors.length === 12,
  leaderIsHex: leader.name === "Hex",
  hexWeek: hex.weekPct > 7,
  hexHasSmciSoxl: hex.positions.map((p) => p.ticker).join(",") === "SMCI,SOXL",
  hexEquityNearBook: Math.abs(hexEquity - hex.bookUsd) < 0.05,
  reedTickers: reedTickers.join(",") === "NVDA,MSFT,COST,CASH",
  reedUnmarkedUntilLast: unmarked.length === 3,
  noInventedReedLast: unmarked.every((p) => p.last == null)
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({ leader: leader.name, hexEquity: Number(hexEquity.toFixed(4)), checks }, null, 2));
if (failed.length) {
  console.error("Failed:", failed.map(([k]) => k).join(", "));
  process.exit(1);
}
console.log("holdings checks passed");
