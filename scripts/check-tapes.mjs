#!/usr/bin/env node
/** Shared host-tape checks driven by data/tapes.json. */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MODEL_NAMES,
  NICK_NAMES,
  chromeFieldsFromBeat,
  containsForbiddenToken,
  hasBareTribeName,
  listTapeFiles,
  loadTapeConversations,
  loadTapeManifest,
  tapeMetaFromFilename
} from "./lib/tapes.mjs";
import { tapesFixture, diffValues } from "./lib/fixtures.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
function check(name, ok, detail) {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

const manifest = loadTapeManifest(root);
const files = listTapeFiles(join(root, "seasons/1"));
const manifestFiles = new Set(manifest.map((tape) => tape.file));
check("manifest-covers-glob", files.every((file) => manifestFiles.has(file)), files.filter((file) => !manifestFiles.has(file)).join(","));
check("glob-covers-manifest", manifest.every((tape) => files.includes(tape.file)), manifest.filter((tape) => !files.includes(tape.file)).map((tape) => tape.file).join(","));

const builder = readFileSync(join(root, "scripts/build.mjs"), "utf8");
check("build-globs-tapes", builder.includes("listTapeFiles") && builder.includes("tapeScriptsForEpisode"));
check("build-does-not-hardcode-e02-route", !builder.includes('episode.id === "s1e02"'));

const campChat = readFileSync(join(root, "camp-chat.js"), "utf8");
check("camp-chat-group-contract", campChat.includes("SAMPLE_CONVERSATIONS") && campChat.includes("participants.length > 2"));

const episodeCampfire = readFileSync(join(root, "episode-campfire.js"), "utf8");
check("campfire-reads-injected-globals", episodeCampfire.includes("EPISODE_TAPE_GLOBALS"));

const season = JSON.parse(readFileSync(join(root, "data/season1.json"), "utf8"));
const seasonRaw = readFileSync(join(root, "data/season1.json"), "utf8");
const feed = JSON.parse(readFileSync(join(root, "seasons/1/conversations.json"), "utf8"));
const episodeCache = {};
function episodeCopy(id) {
  if (!episodeCache[id]) {
    episodeCache[id] = JSON.parse(readFileSync(join(root, "data/episodes", `${id}.json`), "utf8"));
  }
  return episodeCache[id];
}

const frozen = JSON.parse(readFileSync(join(root, "data/fixtures/tapes.json"), "utf8"));
const generated = tapesFixture(root, manifest);
const tapeDiffs = diffValues(frozen, generated);
check("tape-fixtures-match", tapeDiffs.length === 0, tapeDiffs.slice(0, 12).join("; "));

for (const tape of manifest) {
  const label = tape.file;
  const fromName = tapeMetaFromFilename(tape.file);
  check(`${label}:filename`, Boolean(fromName));
  const episode = episodeCopy(tape.episodeId);
  const day = (episode.days || []).find((row) => row.id === tape.dayId);
  check(`${label}:day`, Boolean(day), tape.dayId);
  const beats = (day && day.beats) || [];
  const beat = beats.find((row) => row.id === tape.beatId);
  check(`${label}:beat`, Boolean(beat), tape.beatId);
  if (beat && tape.kind) {
    check(`${label}:type`, beat.type === tape.kind, `${beat.type} != ${tape.kind}`);
  }
  const beatIds = beats.map((row) => row.id);
  for (const prior of tape.afterBeatIds || []) {
    check(
      `${label}:after:${prior}`,
      beatIds.indexOf(prior) > -1 && beatIds.indexOf(tape.beatId) > beatIds.indexOf(prior)
    );
  }
  for (const next of tape.beforeBeatIds || []) {
    check(
      `${label}:before:${next}`,
      beatIds.indexOf(next) > -1 && beatIds.indexOf(tape.beatId) > -1 && beatIds.indexOf(tape.beatId) < beatIds.indexOf(next)
    );
  }
  const dayIds = (episode.days || []).map((row) => row.id);
  for (const priorDay of tape.afterDayIds || []) {
    check(
      `${label}:after-day:${priorDay}`,
      dayIds.indexOf(priorDay) > -1 && dayIds.indexOf(tape.dayId) > dayIds.indexOf(priorDay)
    );
  }
  if (Array.isArray(tape.foldOnlyBeatIds)) {
    check(
      `${label}:fold-only`,
      beats.every((row) => tape.foldOnlyBeatIds.includes(row.id)),
      beatIds.join("|")
    );
  }

  const loaded = loadTapeConversations(root, tape.file);
  check(`${label}:global`, loaded.global === tape.global, `${loaded.global} != ${tape.global}`);
  const threadIds = (beat && beat.threads ? beat.threads : []).map((thread) => thread.id);
  check(`${label}:thread-count`, threadIds.length > 0 && threadIds.every((id) => loaded.byId[id]), threadIds.join("|"));
  check(
    `${label}:exported-threads`,
    Object.keys(loaded.byId).sort().join("|") === threadIds.slice().sort().join("|"),
    Object.keys(loaded.byId).join("|")
  );

  const expectedSize = tape.kind === "dinner-fires" ? 3 : tape.kind === "lunch-chats" ? 2 : null;
  for (const id of threadIds) {
    const convo = loaded.byId[id];
    if (!convo) continue;
    if (expectedSize) {
      check(`${label}:${id}:size`, (convo.participants || []).length === expectedSize, String((convo.participants || []).length));
    }
    for (const person of convo.participants || []) {
      check(`${label}:${id}:model-name:${person.id}`, MODEL_NAMES.includes(person.name), person.name);
      check(`${label}:${id}:nick-name:${person.id}`, !NICK_NAMES.includes(person.name), person.name);
    }
  }

  if (tape.forbidThreadPattern) {
    const re = new RegExp(tape.forbidThreadPattern, "i");
    const hay = (beat.threads || []).map((thread) => [thread.id, thread.heading, thread.title].join(" ")).join(" ");
    check(`${label}:forbid-threads`, !re.test(hay) && !Object.keys(loaded.byId).some((id) => re.test(id)));
  }

  const chrome = chromeFieldsFromBeat(beat, day ? [day.foldDay, day.foldTitle, day.foldEm] : []);
  chrome.forEach((field) => {
    if (hasBareTribeName(field)) check(`${label}:bare-tribe`, false, String(field));
  });
  NICK_NAMES.forEach((nick) => {
    if (chrome.some((field) => typeof field === "string" && field.split(/[^\w-]+/).includes(nick))) {
      check(`${label}:nick-chrome:${nick}`, false);
    }
    if (new RegExp('name:\\s*"' + nick + '"').test(loaded.src)) {
      check(`${label}:nick-participant:${nick}`, false);
    }
  });
  const forbidden = containsForbiddenToken(loaded.src + JSON.stringify(beat || {}));
  check(`${label}:forbidden`, !forbidden, forbidden);

  check(`${label}:not-in-ledger`, !seasonRaw.includes(tape.global), tape.global);
  if (tape.campfireFeed === false) {
    check(
      `${label}:comics-paused-feed`,
      !(feed.conversations || []).some((row) => threadIds.includes(row && row.id))
    );
  }
  if (episode.conversationFeed === false) {
    check(`${label}:conversationFeed-false`, episode.conversationFeed === false);
  }

  for (const otherId of tape.isolateFromEpisodes || []) {
    const other = episodeCopy(otherId);
    check(`${label}:isolate-file:${otherId}`, !JSON.stringify(other).includes(tape.file));
  }

  const listed = (season.episodes || []).find((ep) => ep.id === tape.episodeId);
  if (listed && listed.path) {
    check(`${label}:listed-path`, typeof listed.path === "string");
  }

  const htmlPath = join(root, "dist", listed && listed.path ? listed.path : `seasons/1/${tape.episodePrefix}.html`);
  if (existsSync(htmlPath)) {
    const html = readFileSync(htmlPath, "utf8");
    check(`${label}:html-beat`, html.includes(`id="${tape.beatId}"`));
    check(`${label}:html-script`, html.includes(tape.file));
    if (tape.campfireFeed) {
      check(`${label}:html-feed-global`, html.includes(tape.global));
    }
    if (episode.conversationFeed === false) {
      check(`${label}:html-no-whispers`, !html.includes('id="camp-whispers"') && !html.includes("data-conversation-feed"));
    }
    if (tape.whisperFeed) {
      check(`${label}:html-whispers`, html.includes('id="camp-whispers"'));
    }
    for (const id of threadIds) {
      check(`${label}:html-thread:${id}`, html.includes(`id="${id}"`));
    }
    for (const prior of tape.afterBeatIds || []) {
      const priorIdx = html.indexOf(`id="${prior}"`);
      const beatIdx = html.indexOf(`id="${tape.beatId}"`);
      check(`${label}:html-after:${prior}`, priorIdx > -1 && beatIdx > priorIdx);
    }
  }
  for (const otherId of tape.isolateFromEpisodes || []) {
    const otherListed = (season.episodes || []).find((ep) => ep.id === otherId);
    const otherPath = join(root, "dist", otherListed && otherListed.path ? otherListed.path : "");
    if (otherPath && existsSync(otherPath)) {
      const otherHtml = readFileSync(otherPath, "utf8");
      check(`${label}:html-not-on:${otherId}`, !otherHtml.includes(tape.file));
    }
  }
}

if (failures.length) {
  console.error("Tape checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      ok: true,
      kind: "tapes",
      tapes: manifest.length,
      files: files.length
    },
    null,
    2
  )
);
