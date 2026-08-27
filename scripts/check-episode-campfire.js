#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const episodeHtml = fs.readFileSync(path.join(root, "seasons/1/e01.html"), "utf8");
const episodeJs = fs.readFileSync(path.join(root, "episode-campfire.js"), "utf8");
const openJs = fs.readFileSync(path.join(root, "campfire-open.js"), "utf8");
const feed = JSON.parse(fs.readFileSync(path.join(root, "seasons/1/conversations.json"), "utf8"));

const requiredIds = [
  "campfire-theater",
  "campfire-canvas",
  "campfire-pings",
  "campfire-thread",
  "campfire-imessage",
  "campfire-imessage-close"
];
requiredIds.forEach((id) => {
  if (!episodeHtml.includes('id="' + id + '"')) {
    throw new Error("e01.html missing #" + id);
  }
});

["camp-chat.js", "campfire-open.js", "episode-campfire.js"].forEach((src) => {
  if (!episodeHtml.includes(src)) {
    throw new Error("e01.html does not load " + src);
  }
});

if (!episodeHtml.includes('data-mode="feed"')) {
  throw new Error("e01.html campfire theater missing data-mode=feed");
}
if (!episodeHtml.includes("episode-campfire-hero")) {
  throw new Error("e01.html missing episode-campfire-hero landing");
}
if (!episodeHtml.includes('id="week-board"')) {
  throw new Error("e01.html lost week-board structure below landing");
}

if (!openJs.includes("CampfireEngine")) {
  throw new Error("campfire-open.js missing CampfireEngine export");
}
if (!episodeJs.includes("data-mode") || !episodeJs.includes("campfire-ping")) {
  throw new Error("episode-campfire.js missing feed mode / ping UI");
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
