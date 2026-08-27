#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const js = fs.readFileSync(path.join(root, "campfire-open.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const chat = fs.readFileSync(path.join(root, "camp-chat.js"), "utf8");

const requiredIds = ["campfire-theater", "campfire-canvas", "campfire-faces", "campfire-thread", "campfire-imessage"];
requiredIds.forEach((id) => {
  if (!html.includes('id="' + id + '"')) {
    throw new Error("index.html missing #" + id);
  }
});

if (!html.includes('campfire-open.js')) {
  throw new Error("index.html does not load campfire-open.js");
}
if (!html.includes('camp-chat.js')) {
  throw new Error("index.html does not load camp-chat.js");
}
if (!chat.includes("playConversation")) {
  throw new Error("camp-chat.js missing playConversation export");
}

const portraits = ["hex", "vesper", "riot", "reed", "quill", "gage", "mara", "pax", "nori"];
portraits.forEach((name) => {
  const file = path.join(root, "cast", name, "portrait.jpg");
  if (!fs.existsSync(file)) throw new Error("missing portrait " + file);
});

["target", "alliance", "blindside"].forEach((id) => {
  if (!js.includes('id: "' + id + '"')) throw new Error("missing scene " + id);
});

if (!js.includes("createCampfire")) {
  throw new Error("campfire-open.js missing fire engine");
}

console.log("campfire open checks passed");
