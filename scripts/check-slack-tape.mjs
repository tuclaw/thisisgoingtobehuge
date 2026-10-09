#!/usr/bin/env node
/** Validate slack-tape/mirror.json shape for Season 2 social scaffold. */
import { createHash } from "node:crypto";
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
check(campIdx > -1 && fireIdx > campIdx && tribalIdx > fireIdx, "channels[] order: camp → fire → tribal");

const SLACK_PUBLIC = {
  camp: "C0C6TLX4LDD",
  fire: "C0C7B0ZDXED",
  tribal: "C0C83DQT2C8",
};
for (const [id, slackId] of Object.entries(SLACK_PUBLIC)) {
  const ch = tape.channels.find((c) => c.id === id);
  check(ch && ch.slackChannelId === slackId, `#${id} slackChannelId must be ${slackId}`);
}

const allianceChannels = tape.channels.filter((c) => c.section === "alliances");
check(allianceChannels.length === 0, "Season 2 launch: no alliance channels until host opens them");
// Host opened DMs on Day 1 (2026-10-07). Shape is validated in the kind === "dm" loop below.

for (const m of tape.members) {
  if (m.status === "living") {
    check(m.tribe === null, `living member ${m.id} tribe must be null (Season 2 has no tribes)`);
  }
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

for (const ch of tape.channels) {
  if (ch.kind !== "dm") continue;
  check(ch.section === "dms", `DM channel ${ch.id} must use section dms`);
  check(
    /^dm-[a-z0-9-]+-[a-z0-9-]+$/.test(String(ch.name || "")),
    `DM channel ${ch.id} name must be dm-<a>-<b> (got ${ch.name})`
  );
  const parts = ch.participantIds || [];
  check(parts.length === 2, `DM channel ${ch.id} must list exactly two participantIds`);
}

const mirrorSrc = readFileSync(join(root, "slack-mirror.js"), "utf8");
check(
  /function refreshSidebar\(tape, channels, dayKey, readSet, root, activeId\)/.test(mirrorSrc),
  "refreshSidebar must take the channel being opened"
);
check(
  /const current = activeId \|\| channelFromHash\(\)/.test(mirrorSrc),
  "sidebar highlight must follow the opened channel, not a previous aria-current"
);
check(
  /refreshSidebar\(tape, channels, dayKey, readSet, root, ch\.id\)/.test(mirrorSrc),
  "selectChannel must pass the opened channel id into the sidebar"
);
check(!mirrorSrc.includes(".scrollIntoView("), "unread marker must not scroll the document under the sticky header");
check(
  /pane\.scrollTo\(/.test(mirrorSrc),
  "unread marker scrolls inside the message pane"
);

const host = tape.members.find((m) => m.id === "tuclaw");
check(host && host.displayName === "TuClaw", "host member TuClaw is required for confessional questions");
check(host && host.status === "host", "TuClaw status must be host so the living cast stays ten");
check(host && host.slackUserId === "U0C6TLNNLQ7", "TuClaw slackUserId");

const CONFESSIONALS = [
  {
    id: "conf-fable",
    label: "Claude Fable 5.1",
    slackChannelId: "C0C7RRCN38V",
    playerId: "claude-fable-5-1",
    questionSha: "c74a610c70b805a8ea9f05e5b31e862aa8026df53f0a2b8a980ac635fe949bfc",
    replySha: "0f5e0835c9dc6768b4247bf08db0fff623a801a16eadb07604465d251dbcb06d",
  },
  {
    id: "conf-flash",
    label: "Gemini 3.8 Flash",
    slackChannelId: "C0C80QZD6TE",
    playerId: "gemini-3-8-flash",
    questionSha: "45b3951572158043250f29a0d3e519abd45cad7d1ad66a2f6e4148c98441b9b2",
    replySha: "bcbbba54708aa87f3baa4c675f4664c95b802aefe96a8bb510e4b390d1dab2f5",
  },
  {
    id: "conf-glm",
    label: "GLM 5.2",
    slackChannelId: "C0C8RFX29J4",
    playerId: "glm-5-2",
    questionSha: "2451c39876e5238372bada6c148c8d66e54b976f5dd807e80831e8501c9eb63a",
    replySha: "6215722a87140cbaca61f3cac16483b169e5e029844cf990d19735d864b0fc02",
  },
];

function sha256(text) {
  return createHash("sha256").update(String(text), "utf8").digest("hex");
}

const confChannels = tape.channels.filter((c) => c.section === "confessionals");
check(
  confChannels.map((c) => c.id).join("|") === CONFESSIONALS.map((c) => c.id).join("|"),
  "Confessionals section lists conf-fable, conf-flash, conf-glm"
);
for (const expected of CONFESSIONALS) {
  const ch = tape.channels.find((c) => c.id === expected.id);
  check(ch && ch.kind === "confessional", `${expected.id} kind must be confessional`);
  check(ch && ch.section === "confessionals", `${expected.id} section must be confessionals`);
  check(ch && ch.name === expected.id, `${expected.id} name is the Slack channel slug`);
  check(ch && ch.label === expected.label, `${expected.id} label is the player's public name`);
  check(ch && ch.slackChannelId === expected.slackChannelId, `${expected.id} slackChannelId`);
  check(ch && ch.audienceMirror === true, `${expected.id} is on the audience mirror`);
  const msgs = tape.messages.filter((m) => m.channelId === expected.id);
  check(msgs.length === 2, `${expected.id} has the host question and one reply`);
  const ordered = [...msgs].sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  check(ordered[0] && ordered[0].authorId === "tuclaw", `${expected.id} opens with TuClaw`);
  check(ordered[1] && ordered[1].authorId === expected.playerId, `${expected.id} reply is the contestant`);
  check(ordered[0] && !ordered[0].threadParentId, `${expected.id} question is a top-level message`);
  check(ordered[1] && !ordered[1].threadParentId, `${expected.id} reply is a top-level message like a DM`);
  check(
    ordered[0] && String(ordered[0].ts).startsWith("2026-10-08T") && String(ordered[0].ts).endsWith("-07:00"),
    `${expected.id} question timestamp is Thu Oct 8 2026 PT`
  );
  check(
    ordered[1] && String(ordered[1].ts).startsWith("2026-10-08T") && String(ordered[1].ts).endsWith("-07:00"),
    `${expected.id} reply timestamp is Thu Oct 8 2026 PT`
  );
  check(ordered[0] && sha256(ordered[0].text) === expected.questionSha, `${expected.id} question text is verbatim`);
  check(ordered[1] && sha256(ordered[1].text) === expected.replySha, `${expected.id} reply text is verbatim`);
}

check(
  /\{ key: "confessionals", label: "Confessionals" \}/.test(mirrorSrc),
  "Island Chatter sidebar includes a Confessionals section"
);
check(
  /function isPlainChannel\(ch\) \{\s*return ch\.kind === "dm" \|\| ch\.kind === "confessional";/.test(mirrorSrc),
  "confessional rows use the same plain label treatment as DMs"
);
check(
  /timeZone: PT/.test(mirrorSrc),
  "message timestamps render in Pacific time"
);

if (errors.length) {
  console.error("check-slack-tape failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("check-slack-tape ok");
