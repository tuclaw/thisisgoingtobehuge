/** Collect host-tape conversations from day scripts + conversations.json. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listTapeFiles, loadTapeWindow, conversationsFromWindow } from "./tapes.mjs";

function conversationKind(conversation) {
  const count = (conversation && conversation.participants ? conversation.participants : []).length;
  return count > 2 ? "group" : "dm";
}

function normalizeConversation(raw, fallbackId) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || fallbackId || "").trim();
  if (!id) return null;
  if (!Array.isArray(raw.messages) || !raw.messages.length) return null;
  const participants = Array.isArray(raw.participants) ? raw.participants : [];
  return {
    id,
    title: raw.title || "",
    subtitle: raw.subtitle || "",
    triggerLabel: raw.triggerLabel || "",
    dayLabel: raw.dayLabel || "",
    anchorId: raw.anchorId || (participants[0] && participants[0].id) || "",
    stepMs: typeof raw.stepMs === "number" ? raw.stepMs : undefined,
    typingMs: typeof raw.typingMs === "number" ? raw.typingMs : undefined,
    participants,
    messages: raw.messages,
    kind: conversationKind({ participants })
  };
}

function addConversation(byId, order, conversation, fallbackId) {
  const next = normalizeConversation(conversation, fallbackId);
  if (!next) return;
  let id = next.id;
  if (byId[id] && fallbackId && fallbackId !== id) {
    id = fallbackId;
    next.id = id;
  } else if (byId[id]) {
    return;
  }
  if (!byId[id]) order.push(id);
  byId[id] = next;
}

function collectFromMap(byId, order, map, fileStem) {
  if (!map || typeof map !== "object") return;
  Object.keys(map).forEach((key) => {
    const prefixed = fileStem ? `${fileStem}:${key}` : key;
    addConversation(byId, order, map[key], byId[key] ? prefixed : key);
  });
}

export function collectThreads(rootDir) {
  const byId = {};
  const order = [];

  const feedPath = join(rootDir, "seasons/1/conversations.json");
  try {
    const feed = JSON.parse(readFileSync(feedPath, "utf8"));
    (feed.conversations || []).forEach((conversation) => {
      addConversation(byId, order, conversation, conversation && conversation.id);
    });
  } catch {
    /* optional feed */
  }

  const seasonDir = join(rootDir, "seasons/1");
  for (const file of listTapeFiles(seasonDir)) {
    let src = "";
    try {
      src = readFileSync(join(seasonDir, file), "utf8");
    } catch {
      continue;
    }
    const win = loadTapeWindow(src, file);
    const stem = file.replace(/\.js$/, "");
    conversationsFromWindow(win).forEach((entry) => {
      collectFromMap(byId, order, entry.map, stem);
    });
  }

  return order.map((id) => byId[id]);
}
