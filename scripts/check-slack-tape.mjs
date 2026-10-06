#!/usr/bin/env node
/** Validate slack-tape/mirror.json shape for Season 2 social scaffold. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tapePath = join(root, "data", "slack-tape", "mirror.json");

const errors = [];
function check(cond, msg) {
  if (!cond) errors.push(msg);
}

let tape;
try {
  tape = JSON.parse(readFileSync(tapePath, "utf8"));
} catch (e) {
  console.error("check-slack-tape: cannot read mirror.json:", e.message);
  process.exit(1);
}

check(tape.schemaVersion === 1, "schemaVersion must be 1");
check(tape.season === 2, "season must be 2");
check(Array.isArray(tape.members) && tape.members.length >= 1, "members[] required");
check(Array.isArray(tape.channels) && tape.channels.length >= 1, "channels[] required");
check(Array.isArray(tape.messages), "messages[] required");

const memberIds = new Set();
for (const m of tape.members) {
  check(m.id && m.displayName, `member missing id/displayName: ${JSON.stringify(m)}`);
  memberIds.add(m.id);
}

const channelIds = new Set();
for (const ch of tape.channels) {
  check(ch.id && ch.section && ch.label, `channel missing id/section/label: ${ch.id || "?"}`);
  channelIds.add(ch.id);
  const refs = ch.participantIds || ch.memberIds || [];
  for (const id of refs) {
    check(memberIds.has(id), `channel ${ch.id} references unknown member ${id}`);
  }
}

const living = (tape.members || []).filter((m) => m.status === "living");
check(living.length === 10, `Season 2 launch expects 10 living members (got ${living.length})`);

const camp = tape.channels.find((c) => c.id === "camp");
const tribal = tape.channels.find((c) => c.id === "tribal");
if (camp && camp.memberIds) {
  check(
    camp.memberIds.length === living.length,
    "#camp memberIds should match all living members"
  );
  const livingIds = new Set(living.map((m) => m.id));
  for (const id of camp.memberIds) {
    check(livingIds.has(id), `#camp lists non-living or unknown member ${id}`);
  }
}
check(tribal && tribal.audienceMirror === true, "#tribal must exist with audienceMirror: true");
check(tribal && tribal.section === "tribal", "#tribal section must be tribal");
if (tribal && tribal.memberIds && camp && camp.memberIds) {
  check(
    tribal.memberIds.length === camp.memberIds.length,
    "#tribal memberIds should match #camp (all living)"
  );
  const campSet = new Set(camp.memberIds);
  for (const id of tribal.memberIds) {
    check(campSet.has(id), `#tribal member ${id} not in #camp roster`);
  }
}

const campIdx = tape.channels.findIndex((c) => c.id === "camp");
const fireIdx = tape.channels.findIndex((c) => c.id === "fire");
const tribalIdx = tape.channels.findIndex((c) => c.id === "tribal");
const allianceIdx = tape.channels.findIndex((c) => c.id === "alliance-tide-line");
check(campIdx > -1 && fireIdx > campIdx && tribalIdx > fireIdx && allianceIdx > tribalIdx, "channels[] order: camp → fire → tribal → alliances");

for (const msg of tape.messages) {
  check(msg.id && msg.channelId && msg.authorId && msg.ts && msg.text != null, `bad message ${msg.id || "?"}`);
  check(channelIds.has(msg.channelId), `message ${msg.id} unknown channelId`);
  check(memberIds.has(msg.authorId), `message ${msg.id} unknown authorId`);
  if (msg.threadParentId) {
    check(
      tape.messages.some((m) => m.id === msg.threadParentId),
      `message ${msg.id} threadParentId not found`
    );
  }
}

const control = tape.channels.filter((c) => c.section === "control");
for (const ch of control) {
  check(ch.audienceMirror === false, `control channel ${ch.id} should set audienceMirror: false`);
}

if (errors.length) {
  console.error("check-slack-tape failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("check-slack-tape ok");
