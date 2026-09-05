#!/usr/bin/env node
/** Stamp committed live-board and tape fixtures from the ledger and host tapes. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeason } from "./lib/ledger.mjs";
import { liveBoardFixture, tapesFixture } from "./lib/fixtures.mjs";
import { loadTapeManifest } from "./lib/tapes.mjs";
import { loadSource } from "./derive-board.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destDir = join(root, "data", "fixtures");

const source = loadSource();
const board = deriveSeason(source);
const manifest = loadTapeManifest(root);
const live = liveBoardFixture(source, board);
const tapes = tapesFixture(root, manifest);

mkdirSync(destDir, { recursive: true });
writeFileSync(join(destDir, "live-board.json"), JSON.stringify(live, null, 2) + "\n");
writeFileSync(join(destDir, "tapes.json"), JSON.stringify(tapes, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      ok: true,
      liveSnapshotId: live.liveSnapshotId,
      survivors: live.survivors.length,
      snapshots: live.snapshotIds.length,
      fills: live.fillIds.length,
      tapes: Object.keys(tapes).length
    },
    null,
    2
  )
);
