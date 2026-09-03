#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectThreads } from "./lib/collect-threads.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appJs = readFileSync(join(root, "app.js"), "utf8");
const stylesCss = readFileSync(join(root, "styles.css"), "utf8");
const openJs = readFileSync(join(root, "campfire-open.js"), "utf8");
const buildJs = readFileSync(join(root, "scripts", "build.mjs"), "utf8");

function fail(message) {
  throw new Error(message);
}

[
  "function initCastawaySheet",
  "function ensureCastawaySheet",
  "function closeCastawaySheet",
  'root.id = "castaway-sheet"',
  "data-castaway-view",
  "data-castaway-thread",
  "data-castaway-dismiss",
  "#castaway=",
  "phoneIconSvg",
  "groupIconSvg",
  "seasons/1/threads.json",
  "function castawayTapeHtml",
  "castawayTapeHtml(season, survivor)"
].forEach((needle) => {
  if (!appJs.includes(needle)) fail("app.js missing castaway overlay piece: " + needle);
});

if (appJs.includes("castaway-archetype") || appJs.includes("castaway-bio") || appJs.includes("castaway-status")) {
  fail("castaway sheet must not print status/archetype/bio copy");
}
if (appJs.includes('survivors/" + slug + ".html')) {
  fail("app.js still sends portraits to survivors/*.html");
}
if (!appJs.includes('return "#castaway=" + encodeURIComponent(slug)')) {
  fail("island/episode portrait links must stay on-page via #castaway=");
}

[
  ".castaway-sheet",
  ".castaway-sheet-close",
  ".castaway-msg-icon.is-phone",
  ".castaway-msg-icon.is-group",
  ".castaway-thread-list",
  ".castaway-tape",
  ".castaway-tape-block"
].forEach((needle) => {
  if (!stylesCss.includes(needle)) fail("styles.css missing " + needle);
});

if (openJs.includes("survivors/composer-2-5.html") || openJs.includes('href: "survivors/')) {
  fail("campfire-open.js still points campfire faces at survivor pages");
}
if (!openJs.includes("#castaway=") || !openJs.includes("data-castaway=")) {
  fail("campfire-open.js must hash-link campfire faces into the overlay");
}

if (!buildJs.includes("collectThreads") || !buildJs.includes("threads.json")) {
  fail("build.mjs must stamp seasons/1/threads.json from the host tape");
}
if (!buildJs.includes("survivorRedirectHtml") || !buildJs.includes("#castaway=")) {
  fail("build.mjs must redirect leftover /survivors/*.html URLs to the island overlay");
}
if (buildJs.includes('location.replace("/survivors/"')) {
  fail("404 must not send legacy nicknames to /survivors/");
}

const threads = collectThreads(root);
const dms = threads.filter((t) => t.kind === "dm");
const groups = threads.filter((t) => t.kind === "group");
if (threads.length < 20) fail("expected the full Episode 1 tape in threads.json collector, got " + threads.length);
if (dms.length < 10) fail("expected private DMs on the tape, got " + dms.length);
if (groups.length < 4) fail("expected group fires on the tape, got " + groups.length);

const gageDms = dms.filter((t) => (t.participants || []).some((p) => p.id === "gage"));
const gageGroups = groups.filter((t) => (t.participants || []).some((p) => p.id === "gage"));
if (!gageDms.length || !gageGroups.length) {
  fail("Grok 4.6 should have both private DMs and group fires on the tape");
}

const invented = threads.some((t) => t.id === "group-bidu-camp" || t.id === "dm-hex-vesper");
if (invented) fail("collector must not include CampChat sample threads");

console.log(
  "castaway sheet checks passed (" + threads.length + " threads, " + dms.length + " DMs, " + groups.length + " groups)"
);
