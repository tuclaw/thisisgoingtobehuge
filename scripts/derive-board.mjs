#!/usr/bin/env node
/** Derive the public season board from data/season1.json. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeason } from "./lib/ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadSource(sourcePath = join(root, "data", "season1.json")) {
  return JSON.parse(readFileSync(sourcePath, "utf8"));
}

export function writeBoard(board, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, JSON.stringify(board, null, 2) + "\n");
}

export function deriveFromRepo(rootDir = root) {
  const source = loadSource(join(rootDir, "data", "season1.json"));
  const board = deriveSeason(source);
  return { source, board };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] && process.argv[1].endsWith("derive-board.mjs")) {
  const dest = process.argv[2] || join(root, "dist", "season1.json");
  const { board } = deriveFromRepo();
  writeBoard(board, dest);
  console.log(`wrote ${dest} (${board.survivors.length} survivors, ${board.snapshots.length} snapshots)`);
}
