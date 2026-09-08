/** Season 1 host tapes: glob, parse, and load conversation maps. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { LEGACY_SLUGS, MODEL_SLUGS } from "./ledger.mjs";

export const TAPE_FILE_RE = /^e\d+-.+\.js$/;
export const NICK_NAMES = Object.keys(LEGACY_SLUGS).map((nick) => nick.charAt(0).toUpperCase() + nick.slice(1));
export const MODEL_NAMES = Object.keys(MODEL_SLUGS);
export const FORBIDDEN_TAPE_TOKENS = [
  "robinhood",
  "agentic",
  "uuid",
  "last-four",
  "merge floor",
  "merge date",
  "merge headcount",
  "channel id",
  "channelid"
];

export function listTapeFiles(seasonDir) {
  return readdirSync(seasonDir)
    .filter((name) => TAPE_FILE_RE.test(name))
    .sort();
}

export function tapeMetaFromFilename(file) {
  const match = String(file || "").match(/^(e(\d+))-(.+)\.js$/);
  if (!match) return null;
  const episodeNum = Number(match[2]);
  const beatId = match[3];
  const kind = beatId.endsWith("-dinner") ? "dinner-fires" : beatId.endsWith("-lunch") ? "lunch-chats" : null;
  return {
    file,
    stem: match[1] + "-" + beatId,
    episodePrefix: match[1],
    episodeNum,
    episodeId: `s1e${String(episodeNum).padStart(2, "0")}`,
    beatId,
    kind
  };
}

export function loadTapeManifest(rootDir) {
  const path = join(rootDir, "data", "tapes.json");
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const tapes = Array.isArray(raw.tapes) ? raw.tapes : [];
  return tapes.map((row) => {
    const fromFile = tapeMetaFromFilename(row.file);
    if (!fromFile) throw new Error(`tapes.json: bad file name ${row.file}`);
    return { ...fromFile, ...row, file: fromFile.file, beatId: row.beatId || fromFile.beatId, episodeId: row.episodeId || fromFile.episodeId };
  });
}

export function loadTapeWindow(src, filename) {
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

export function conversationsFromWindow(windowObj) {
  const maps = [];
  Object.keys(windowObj || {}).forEach((key) => {
    if (!/_CONVERSATIONS$/.test(key)) return;
    maps.push({ global: key, map: windowObj[key] });
  });
  return maps;
}

export function loadTapeConversations(rootDir, file) {
  const src = readFileSync(join(rootDir, "seasons/1", file), "utf8");
  const win = loadTapeWindow(src, file);
  const maps = conversationsFromWindow(win);
  const byId = {};
  for (const entry of maps) {
    if (!entry.map || typeof entry.map !== "object") continue;
    Object.keys(entry.map).forEach((id) => {
      const raw = entry.map[id];
      if (!raw || typeof raw !== "object") return;
      byId[id] = { ...raw, id: raw.id || id };
    });
  }
  return { src, window: win, maps, byId, global: maps[0] && maps[0].global };
}

export function hasBareTribeName(text) {
  const stripped = String(text || "")
    .replace(/the Bidu tribe/gi, "")
    .replace(/the Askara tribe/gi, "");
  return /\bBidu\b/.test(stripped) || /\bAskara\b/.test(stripped);
}

export function chromeFieldsFromBeat(beat, extra = []) {
  const threadFields = (beat && beat.threads ? beat.threads : []).flatMap((thread) => [
    thread.heading,
    thread.desc,
    thread.title,
    thread.subtitle,
    thread.ariaLabel,
    thread.triggerLabel
  ]);
  return extra.concat([beat && beat.title, beat && beat.body, beat && beat.kicker, beat && beat.audienceCut], threadFields);
}

export function containsForbiddenToken(text) {
  const hay = String(text || "").toLowerCase();
  return FORBIDDEN_TAPE_TOKENS.find((token) => hay.includes(token.toLowerCase()));
}
