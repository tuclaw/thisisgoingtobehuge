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

const camp = tape.channels.find((c) => c.id === "camp");
if (camp && camp.memberIds) {
  check(
    camp.memberIds.length >= 10,
    "#camp should list at least 10 living members for mid-season launch framing"
  );
}

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
