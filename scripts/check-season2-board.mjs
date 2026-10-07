/** Season 2 pre-launch board invariants ($200 books, locked cast). */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

for (const s of survivors) {
  check(s.bookUsd === 200, `${s.model}: bookUsd must be 200`);
  check(!s.tribeId, `${s.model}: Season 2 has no tribes (tribeId must be absent)`);
}

if (errors.length) {
  console.error("check-season2-board failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("check-season2-board ok");
