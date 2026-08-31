/** Collect host-tape conversations from the episode pack, then day scripts. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { hasSeasonPack, loadAllEpisodeChats } from "./load-season.mjs";

const TAPE_FILES = [
  "e01-wednesday-dinner.js",
  "e01-thursday-lunch.js",
  "e01-thursday-dinner.js",
  "e01-friday-lunch.js",
  "e01-saturday-lunch.js",
  "e01-saturday-dinner.js",
  "e01-sunday-lunch.js"
];

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
  if (!byId[next.id]) order.push(next.id);
  byId[next.id] = next;
}

function collectFromMap(byId, order, map) {
  if (!map || typeof map !== "object") return;
  Object.keys(map).forEach((key) => {
    addConversation(byId, order, map[key], key);
  });
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

export function collectThreads(rootDir) {
  const byId = {};
  const order = [];

  if (hasSeasonPack(rootDir)) {
    for (const conversation of loadAllEpisodeChats(rootDir)) {
      addConversation(byId, order, conversation, conversation && conversation.id);
    }
    if (order.length) return order.map((id) => byId[id]);
  }

  const feedPath = join(rootDir, "seasons/1/conversations.json");
  try {
    const feed = JSON.parse(readFileSync(feedPath, "utf8"));
    (feed.conversations || []).forEach((conversation) => {
      addConversation(byId, order, conversation, conversation && conversation.id);
    });
  } catch {
    /* optional feed */
  }

  TAPE_FILES.forEach((file) => {
    const path = join(rootDir, "seasons/1", file);
    let src = "";
    try {
      src = readFileSync(path, "utf8");
    } catch {
      return;
    }
    const win = loadTapeWindow(src, file);
    Object.keys(win).forEach((key) => {
      if (!/_CONVERSATIONS$/.test(key)) return;
      collectFromMap(byId, order, win[key]);
    });
  });

  return order.map((id) => byId[id]);
}
