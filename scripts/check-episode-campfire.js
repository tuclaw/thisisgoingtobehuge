#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const episodeHtml = readFileSync(join(root, "scripts", "build.mjs"), "utf8");
const episodeJs = readFileSync(join(root, "episode-campfire.js"), "utf8");
const openJs = readFileSync(join(root, "campfire-open.js"), "utf8");
const fridayLunchJs = readFileSync(join(root, "seasons/1/e01-friday-lunch.js"), "utf8");
const feed = JSON.parse(readFileSync(join(root, "seasons/1/conversations.json"), "utf8"));
