#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const episodeHtml = readFileSync(join(root, "scripts", "build.mjs"), "utf8");
const episodeJs = readFileSync(join(root, "episode-campfire.js"), "utf8");
const openJs = readFileSync(join(root, "campfire-open.js"), "utf8");
const feed = JSON.parse(readFileSync(join(root, "seasons/1/conversations.json"), "utf8"));

const requiredIds = [
  "campfire-theater",
  "campfire-canvas",
  "campfire-pings",
  "campfire-thread",
  "campfire-imessage",
  "campfire-imessage-close",
  "campfire-imessage-faces"
];
requiredIds.forEach((id) => {
  if (!episodeHtml.includes('id="' + id + '"')) {
    throw new Error("episode renderer missing #" + id);
  }
});

["camp-chat.js", "campfire-open.js", "episode-campfire.js"].forEach((src) => {
  if (!episodeHtml.includes(src)) {
    throw new Error("episode renderer does not load " + src);
  }
});

if (!episodeHtml.includes('data-mode="feed"')) {
  throw new Error("episode renderer campfire theater missing data-mode=feed");
}
if (!episodeHtml.includes("episode-campfire-hero")) {
  throw new Error("episode renderer missing episode-campfire-hero landing");
}
if (!episodeHtml.includes('id="week-board"')) {
  throw new Error("episode renderer lost week-board structure below landing");
}

if (!openJs.includes("CampfireEngine")) {
  throw new Error("campfire-open.js missing CampfireEngine export");
}
if (!openJs.includes('portrait: "cast/claude-fable-5/portrait.jpg"')) {
  throw new Error("campfire-open.js missing sable slug portrait");
}
if (!openJs.includes('portrait: "cast/gemini-3-1-pro/portrait.jpg"')) {
  throw new Error("campfire-open.js missing kite slug portrait");
}
if (openJs.includes("cast/hex/portrait.jpg") || openJs.includes("cast/sable/portrait.jpg")) {
  throw new Error("campfire-open.js still points at nickname portrait folders");
}
if (!episodeJs.includes("data-mode") || !episodeJs.includes("campfire-ping")) {
  throw new Error("episode-campfire.js missing feed mode / ping UI");
}
if (!episodeJs.includes("campfire-ping-face") || !episodeJs.includes("32000")) {
  throw new Error("episode-campfire.js missing portrait faces or 30s hold");
}
if (!episodeJs.includes("MAX_VISIBLE = 2") || !episodeJs.includes("REVEAL_AFTER_CLOSE_MS = 5000")) {
  throw new Error("episode-campfire.js missing 2-at-a-time / 5s reveal behavior");
}
if (!readFileSync(join(root, "camp-chat.js"), "utf8").includes("camp-chat-avatar")) {
  throw new Error("camp-chat.js missing contestant avatar bubbles");
}

if (!Array.isArray(feed.conversations) || feed.conversations.length < 1) {
  throw new Error("conversations.json needs at least one conversation");
}
feed.conversations.forEach((c, i) => {
  if (!c.id || !c.dayLabel || !Array.isArray(c.messages) || !c.messages.length) {
    throw new Error("conversations[" + i + "] incomplete host feed shape");
  }
});

console.log("episode campfire checks passed (" + feed.conversations.length + " threads)");
