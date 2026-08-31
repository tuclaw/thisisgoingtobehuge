#!/usr/bin/env node
/** One-shot: chop data/season1.json + episode copy + tapes into data/s1/. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import {
  LIVE_KEYS,
  conversationKind,
  episodeDir,
  eventEpisodeId,
  seasonPackDir
} from "./lib/load-season.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(join(root, "data", "season1.json"))) {
  console.log("data/season1.json already removed; pack lives at data/s1/");
  process.exit(0);
}
const TAPE_SCENES = [
  ["e01-wednesday-dinner.js", "wednesday-dinner"],
  ["e01-thursday-lunch.js", "thursday-lunch"],
  ["e01-thursday-dinner.js", "thursday-dinner"],
  ["e01-friday-lunch.js", "friday-lunch"],
  ["e01-saturday-lunch.js", "saturday-lunch"],
  ["e01-saturday-dinner.js", "saturday-dinner"],
  ["e01-sunday-lunch.js", "sunday-lunch"]
];

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function loadTapeWindow(src, filename) {
  const windowObj = {};
  const sandbox = {
    window: windowObj,
    document: {
      readyState: "complete",
      getElementById() {
        return null;
      },
      addEventListener() {},
      querySelector() {
        return null;
      }
    },
    console,
    setTimeout,
    clearTimeout
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(src, sandbox, { filename, timeout: 2000 });
  return windowObj;
}

function collectChats() {
  const byId = {};
  const order = [];

  function add(raw, scene, extra = {}) {
    if (!raw || typeof raw !== "object") return;
    const id = String(raw.id || "").trim();
    if (!id || !Array.isArray(raw.messages) || !raw.messages.length) return;
    if (!byId[id]) order.push(id);
    const next = {
      ...raw,
      id,
      scene: raw.scene || scene,
      kind: raw.kind || conversationKind(raw),
      ...extra
    };
    byId[id] = { ...byId[id], ...next };
  }

  const feedPath = join(root, "seasons/1/conversations.json");
  let feed = null;
  if (existsSync(feedPath)) {
    feed = JSON.parse(readFileSync(feedPath, "utf8"));
    for (const conversation of feed.conversations || []) {
      add(conversation, "feed", { feed: true });
    }
  }

  for (const [file, scene] of TAPE_SCENES) {
    const path = join(root, "seasons/1", file);
    if (!existsSync(path)) continue;
    const win = loadTapeWindow(readFileSync(path, "utf8"), file);
    for (const key of Object.keys(win)) {
      if (!/_CONVERSATIONS$/.test(key)) continue;
      const map = win[key];
      if (!map || typeof map !== "object") continue;
      for (const convKey of Object.keys(map)) {
        add({ ...map[convKey], id: map[convKey].id || convKey }, scene);
      }
    }
  }

  return {
    feed,
    conversations: order.map((id) => byId[id])
  };
}

const source = JSON.parse(readFileSync(join(root, "data", "season1.json"), "utf8"));
const episodes = source.episodes || [];
const pack = seasonPackDir(root);

const live = {};
for (const key of LIVE_KEYS) {
  if (source[key] !== undefined) live[key] = source[key];
}
if (Array.isArray(source.tribes)) live.tribes = source.tribes;

const season = { ...source };
for (const key of [...LIVE_KEYS, "events", "tribalLog", "tribes"]) {
  delete season[key];
}
season.tribes = (source.tribes || []).map((tribe) => ({
  id: tribe.id,
  name: tribe.name,
  buff: tribe.buff,
  color: tribe.color
}));

if (season.episode) {
  season.episode = {
    ...season.episode,
    source: season.episode.id ? `data/s1/${episodeDir(root, season.episode.id).split("/").pop()}/copy.json` : season.episode.source
  };
}
season.episodes = (episodes || []).map((episode) => {
  if (!episode || !episode.id) return episode;
  const folder = episodeDir(root, episode.id).split("/").pop();
  if (episode.status === "locked" && !episode.source) return episode;
  return { ...episode, source: `data/s1/${folder}/copy.json` };
});

writeJson(join(pack, "season.json"), season);
writeJson(join(pack, "live.json"), live);

const eventsByEpisode = {};
for (const event of source.events || []) {
  const id = eventEpisodeId(event, episodes);
  if (!eventsByEpisode[id]) eventsByEpisode[id] = [];
  eventsByEpisode[id].push(event);
}

const tribalByEpisode = {};
for (const entry of source.tribalLog || []) {
  const id = entry.episode || "s1e01";
  if (!tribalByEpisode[id]) tribalByEpisode[id] = [];
  tribalByEpisode[id].push(entry);
}

const copyIds = new Set(
  (episodes || []).filter((episode) => episode && episode.id && episode.status !== "locked").map((episode) => episode.id)
);
for (const id of Object.keys(eventsByEpisode)) copyIds.add(id);
for (const id of Object.keys(tribalByEpisode)) copyIds.add(id);
copyIds.add("s1e01");
copyIds.add("s1e02");

const { feed, conversations } = collectChats();
const chatsByEpisode = { s1e01: conversations, s1e02: [] };

for (const episodeId of [...copyIds].sort()) {
  const dir = episodeDir(root, episodeId);
  mkdirSync(dir, { recursive: true });
  writeJson(join(dir, "events.json"), {
    episodeId,
    events: eventsByEpisode[episodeId] || []
  });
  if (tribalByEpisode[episodeId]) {
    writeJson(join(dir, "tribal.json"), {
      episodeId,
      tribalLog: tribalByEpisode[episodeId]
    });
  }
  const legacyCopy = join(root, "data", "episodes", `${episodeId}.json`);
  if (existsSync(legacyCopy)) {
    writeJson(join(dir, "copy.json"), JSON.parse(readFileSync(legacyCopy, "utf8")));
  }
  const chats = chatsByEpisode[episodeId] || [];
  const chatPack = { episodeId, conversations: chats };
  if (episodeId === "s1e01" && feed) {
    chatPack.feed = {
      updatedAt: feed.updatedAt,
      source: feed.source,
      note: feed.note,
      ids: (feed.conversations || []).map((item) => item.id).filter(Boolean)
    };
  }
  writeJson(join(dir, "chats.json"), chatPack);
}

console.log("wrote data/s1", {
  episodes: [...copyIds].sort(),
  events: Object.fromEntries(Object.entries(eventsByEpisode).map(([id, list]) => [id, list.length])),
  chats: conversations.length
});
