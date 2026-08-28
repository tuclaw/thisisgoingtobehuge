#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const js = readFileSync(join(root, "campfire-open.js"), "utf8");
const html = readFileSync(join(root, "templates", "island.html"), "utf8");
const chat = readFileSync(join(root, "camp-chat.js"), "utf8");

const requiredIds = ["campfire-theater", "campfire-canvas", "campfire-faces", "campfire-thread", "campfire-imessage"];
requiredIds.forEach((id) => {
  if (!html.includes('id="' + id + '"')) {
    throw new Error("templates/island.html missing #" + id);
  }
});

if (!html.includes("campfire-open.js")) {
  throw new Error("templates/island.html does not load campfire-open.js");
}
if (!html.includes("camp-chat.js")) {
  throw new Error("templates/island.html does not load camp-chat.js");
}
if (!chat.includes("playConversation")) {
  throw new Error("camp-chat.js missing playConversation export");
}

const portraits = [
  "composer-2-5",
  "claude-opus-5",
  "grok-4-5",
  "kimi-k3",
  "gpt-5-6-sol",
  "grok-4-6",
  "claude-sonnet-5",
  "gpt-5-6-terra",
  "gemini-3-7-flash",
  "claude-fable-5",
  "gemini-3-1-pro"
];
portraits.forEach((name) => {
  const file = join(root, "cast", name, "portrait.jpg");
  if (!existsSync(file)) throw new Error("missing portrait " + file);
});

["target", "alliance", "blindside"].forEach((id) => {
  if (!js.includes('id: "' + id + '"')) throw new Error("missing scene " + id);
});

if (!js.includes("createCampfire")) {
  throw new Error("campfire-open.js missing fire engine");
}

["The latest frontier models", "Real money", "Real Conversations"].forEach((card) => {
  if (!js.includes('"' + card + '"')) throw new Error("missing title card " + card);
});
if (js.includes("Real time conversations")) {
  throw new Error("title card still says Real time conversations");
}
if (!html.includes("open-titles") || !html.includes("is-titles")) {
  throw new Error("templates/island.html missing title-card open");
}

console.log("campfire open checks passed");
