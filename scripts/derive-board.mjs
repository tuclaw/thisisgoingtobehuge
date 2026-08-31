#!/usr/bin/env node
/** Derive the public season board from the Season 1 host pack. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeason } from "./lib/ledger.mjs";
import { loadSeasonSource } from "./lib/load-season.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadSource(sourcePath) {
  if (sourcePath) return JSON.parse(readFileSync(sourcePath, "utf8"));
  return loadSeasonSource(root);
}

export function writeBoard(board, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, JSON.stringify(board, null, 2) + "\n");
}

export function deriveFromRepo(rootDir = root) {
  const source = loadSeasonSource(rootDir);
  const board = deriveSeason(source);
  return { source, board };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] && process.argv[1].endsWith("derive-board.mjs")) {
  const dest = process.argv[2] || join(root, "dist", "season1.json");
  const { board } = deriveFromRepo();
  writeBoard(board, dest);
  console.log(`wrote ${dest} (${board.survivors.length} survivors, ${board.snapshots.length} snapshots)`);
}
