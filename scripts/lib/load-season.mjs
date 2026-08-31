/** Load the Season 1 host pack and stitch it into one deriveSeason source. */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const LIVE_KEYS = [
  "survivors",
  "quotes",
  "markedAt",
  "markLabel",
  "dayPctBasis",
  "weekPctBasis",
  "liveSnapshotId",
  "notes"
];

export function seasonPackDir(rootDir) {
  return join(rootDir, "data", "s1");
}

export function episodeFolderName(episodeId) {
  const match = String(episodeId || "").match(/^s\d+e(\d+)$/i);
  if (match) return `e${String(Number(match[1])).padStart(2, "0")}`;
  return String(episodeId || "").trim();
}

export function episodeDir(rootDir, episodeId) {
  return join(seasonPackDir(rootDir), episodeFolderName(episodeId));
}

export function hasSeasonPack(rootDir) {
  return existsSync(join(seasonPackDir(rootDir), "season.json"));
}

export function listEpisodeFolders(rootDir) {
  const pack = seasonPackDir(rootDir);
  if (!existsSync(pack)) return [];
  return readdirSync(pack, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^e\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readJsonIf(path, fallback) {
  return existsSync(path) ? readJson(path) : fallback;
}

export function loadEpisodeCopy(rootDir, episodeId) {
  const packPath = join(episodeDir(rootDir, episodeId), "copy.json");
  if (existsSync(packPath)) return readJson(packPath);
  const legacy = join(rootDir, "data", "episodes", `${episodeId}.json`);
  if (existsSync(legacy)) return readJson(legacy);
  throw new Error(`episode copy missing for ${episodeId}`);
}

export function loadEpisodeChats(rootDir, episodeId) {
  return readJsonIf(join(episodeDir(rootDir, episodeId), "chats.json"), {
    episodeId,
    conversations: []
  });
}

export function loadAllEpisodeChats(rootDir) {
  return listEpisodeFolders(rootDir).flatMap((folder) => {
    const file = join(seasonPackDir(rootDir), folder, "chats.json");
    const pack = readJsonIf(file, { conversations: [] });
    return Array.isArray(pack.conversations) ? pack.conversations : [];
  });
}

function mergeTribes(seasonTribes, live) {
  if (Array.isArray(live.tribes) && live.tribes.length) return live.tribes;
  const totals = live.tribeTotals || {};
  return (seasonTribes || []).map((tribe) => ({ ...tribe, ...(totals[tribe.id] || {}) }));
}

function stitchSeasonPack(rootDir) {
  const pack = seasonPackDir(rootDir);
  const season = readJson(join(pack, "season.json"));
  const live = readJsonIf(join(pack, "live.json"), {});
  const events = [];
  const tribalLog = [];

  for (const folder of listEpisodeFolders(rootDir)) {
    const dir = join(pack, folder);
    const eventPack = readJsonIf(join(dir, "events.json"), { events: [] });
    if (Array.isArray(eventPack.events)) events.push(...eventPack.events);
    const tribalPack = readJsonIf(join(dir, "tribal.json"), { tribalLog: [] });
    if (Array.isArray(tribalPack.tribalLog)) tribalLog.push(...tribalPack.tribalLog);
  }

  const source = {
    ...season,
    ...Object.fromEntries(LIVE_KEYS.filter((key) => live[key] !== undefined).map((key) => [key, live[key]])),
    tribes: mergeTribes(season.tribes, live),
    events,
    tribalLog: tribalLog.length ? tribalLog : season.tribalLog || []
  };
  return source;
}

export function loadSeasonSource(rootDir) {
  if (hasSeasonPack(rootDir)) return stitchSeasonPack(rootDir);
  const legacy = join(rootDir, "data", "season1.json");
  if (existsSync(legacy)) return readJson(legacy);
  throw new Error("season source missing: expected data/s1/season.json or data/season1.json");
}

/** Ledger text only (no chats / episode copy) for forbidden-token checks. */
export function loadSeasonLedgerText(rootDir) {
  return JSON.stringify(loadSeasonSource(rootDir));
}

export function conversationKind(conversation) {
  const count = (conversation && conversation.participants ? conversation.participants : []).length;
  return count > 2 ? "group" : "dm";
}

function publicFeedConversation(conversation) {
  if (!conversation || typeof conversation !== "object") return conversation;
  const copy = { ...conversation };
  delete copy.scene;
  delete copy.kind;
  delete copy.feed;
  return copy;
}

export function conversationFeedFromPack(rootDir, episodeId = "s1e01") {
  const chats = loadEpisodeChats(rootDir, episodeId);
  const byId = new Map((chats.conversations || []).map((item) => [item.id, item]));
  const feedIds = Array.isArray(chats.feed && chats.feed.ids)
    ? chats.feed.ids
    : (chats.conversations || []).filter((item) => item && item.feed).map((item) => item.id);
  const conversations = (feedIds.length ? feedIds : (chats.conversations || []).map((item) => item.id))
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map(publicFeedConversation);
  return {
    episodeId: chats.episodeId || episodeId,
    updatedAt: (chats.feed && chats.feed.updatedAt) || undefined,
    source: (chats.feed && chats.feed.source) || "conversation-host",
    note: (chats.feed && chats.feed.note) || undefined,
    conversations
  };
}

export function writeConversationFeed(rootDir, destPath, episodeId = "s1e01") {
  mkdirSync(dirname(destPath), { recursive: true });
  const feed = conversationFeedFromPack(rootDir, episodeId);
  writeFileSync(destPath, JSON.stringify(feed, null, 2) + "\n");
  return feed;
}

export function eventEpisodeId(event, episodes = []) {
  if (event && event.episode) return event.episode;
  const id = String((event && event.id) || "");
  const prefixed = id.match(/^(s\d+e\d+)/i);
  if (prefixed) return prefixed[1].toLowerCase();
  if (id === "s1-open") return "s1e01";
  const at = Date.parse(event && event.at);
  let chosen = "s1e01";
  for (const episode of episodes) {
    if (!episode || !episode.weekStart || !episode.id) continue;
    const start = Date.parse(`${episode.weekStart}T00:00:00-07:00`);
    if (Number.isFinite(at) && Number.isFinite(start) && at >= start) chosen = episode.id;
  }
  return chosen;
}

export { LIVE_KEYS };
