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

// Living = members not voted-out. The host stays status "host" and is not cast.
// Voted-out players may stay on public rosters (visible, faded) and do not count as living.
const living = (tape.members || []).filter((m) => m.status !== "voted-out" && m.status !== "host");
const votedOutIds = new Set(
  (tape.members || []).filter((m) => m.status === "voted-out").map((m) => m.id)
);
const livingIds = new Set(living.map((m) => m.id));
const castCount = living.length + votedOutIds.size;
check(
  castCount === 10,
  `Season 2 cast is 10 contestants (${living.length} living, ${votedOutIds.size} voted-out; got ${castCount})`
);

function checkPublicRoster(ch) {
  if (!ch || !Array.isArray(ch.memberIds)) return;
  const label = ch.label || `#${ch.id}`;
  const ids = new Set(ch.memberIds);
  for (const id of livingIds) {
    check(ids.has(id), `${label} roster is missing living member ${id}`);
  }
  for (const id of ch.memberIds) {
    check(
      livingIds.has(id) || votedOutIds.has(id),
      `${label} lists ${id}, who is not a living or voted-out contestant`
    );
  }
}

const camp = tape.channels.find((c) => c.id === "camp");
const fire = tape.channels.find((c) => c.id === "fire");
const tribal = tape.channels.find((c) => c.id === "tribal");
checkPublicRoster(camp);
checkPublicRoster(fire);
checkPublicRoster(tribal);
check(tribal && tribal.audienceMirror === true, "#tribal must exist with audienceMirror: true");
check(tribal && tribal.section === "tribal", "#tribal section must be tribal");
if (tribal && tribal.memberIds && camp && camp.memberIds) {
  check(
    tribal.memberIds.length === camp.memberIds.length,
    "#tribal memberIds should match #camp (living cast, voted-out may stay)"
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

const DM_CHANNELS = [
  { id: "dm-composer-grok-2", slackChannelId: "C0C7B1PLYGM", messageCount: 4 },
  { id: "dm-fable-opus-2", slackChannelId: "C0C7G61A7K4", messageCount: 4 },
  { id: "dm-flash-kimi3-2", slackChannelId: "C0C8AMQ8872", messageCount: 12 },
  { id: "dm-fable-glm", slackChannelId: "C0C9QJ4MB25", messageCount: 8 },
  { id: "dm-pro-kimi27", slackChannelId: "C0C9SMN1KCK", messageCount: 4 },
  { id: "dm-composer-muse", slackChannelId: "C0C9LN693P0", messageCount: 4 },
];

const ISLAND_DM_ROUND1 = [
  {
    id: "msg-1792103594-858409",
    channelId: "dm-flash-kimi3-2",
    authorId: "kimi-k3",
    textSha: "7c6cb9f6105dfa329554ae57e42fffe9132544a116264100dec833b8487b5224",
  },
  {
    id: "msg-1792103596-542259",
    channelId: "dm-flash-kimi3-2",
    authorId: "gemini-3-8-flash",
    textSha: "6dd05b378f40d956c1c531a19d334c4955ea2d3f271437aa343d96632f553e79",
  },
  {
    id: "msg-1792103598-220879",
    channelId: "dm-flash-kimi3-2",
    authorId: "kimi-k3",
    textSha: "c20686f53423cde187bf4fa380c54e62245f03b18d3f9dd6e328ba2b6c198fde",
  },
  {
    id: "msg-1792103599-889849",
    channelId: "dm-flash-kimi3-2",
    authorId: "gemini-3-8-flash",
    textSha: "ac08b21dc6e9f7161fc992ceeeb6341a8da29ca1b0b6a696fa3e14544ad1db79",
  },
  {
    id: "msg-1792103601-569629",
    channelId: "dm-fable-glm",
    authorId: "claude-fable-5-1",
    textSha: "b8354f5c03e4afc9a1a9f60702267633538826247434f16df3e406e3a92332e2",
  },
  {
    id: "msg-1792103604-328079",
    channelId: "dm-fable-glm",
    authorId: "glm-5-2",
    textSha: "b50cda80b2365b0f0aac97ff035049447282f0c6d78734e77a1a7c2361b8b458",
  },
  {
    id: "msg-1792103606-112119",
    channelId: "dm-fable-glm",
    authorId: "claude-fable-5-1",
    textSha: "75f04f4de9bbaed88f683fae3124f3b1328149a9c66ff03b17acf13201735732",
  },
  {
    id: "msg-1792103607-778989",
    channelId: "dm-fable-glm",
    authorId: "glm-5-2",
    textSha: "8f269e8b8d2e59a21320645ecb5b91a8e75ecdf87f3763effe474e735924f5ac",
  },
  {
    id: "msg-1792103609-464229",
    channelId: "dm-composer-muse",
    authorId: "composer-2-5",
    textSha: "6b3680d185b02a425f3ead56cad306597f12434538599ff7d0411a862a9f4619",
  },
  {
    id: "msg-1792103611-137739",
    channelId: "dm-composer-muse",
    authorId: "muse-spark-1-3",
    textSha: "12946030f3d4cab793c63ec8e4edb686fade0086bf5929a7926d35ab16015f63",
  },
  {
    id: "msg-1792103612-831619",
    channelId: "dm-composer-muse",
    authorId: "composer-2-5",
    textSha: "528823fabb339b10c5e0931db6e2eb180c26943a6f7d25702101a5f6d3ba7e38",
  },
  {
    id: "msg-1792103614-514739",
    channelId: "dm-composer-muse",
    authorId: "muse-spark-1-3",
    textSha: "f608ba2ada953577979d8153c09f63f37c03a9b1087639b42733a9461a75f61e",
  },
];

const ISLAND_DM_ROUND2 = [
  {
    id: "msg-1792190143-052069",
    channelId: "dm-flash-kimi3-2",
    authorId: "gemini-3-8-flash",
    textSha: "ee970903cb5eea3608376b7ea4e2bef7fe0da71d2a9214625416ea2b44c80f38",
  },
  {
    id: "msg-1792190144-717409",
    channelId: "dm-flash-kimi3-2",
    authorId: "kimi-k3",
    textSha: "c07b8ced2ce0c9bcfb255d53d7c114cd3cb58f81cf6dafc76d6bec205e72b754",
  },
  {
    id: "msg-1792190146-403699",
    channelId: "dm-flash-kimi3-2",
    authorId: "gemini-3-8-flash",
    textSha: "19de899cea69fab272e9e592ef5e966402d89f2ef278ae9b9d36d834c691aa48",
  },
  {
    id: "msg-1792190148-061439",
    channelId: "dm-flash-kimi3-2",
    authorId: "kimi-k3",
    textSha: "734ffb3e0a29c59bc85b861f695a270afd8338419a7ba9e7b53c06a2015ad238",
  },
  {
    id: "msg-1792190149-720619",
    channelId: "dm-fable-glm",
    authorId: "claude-fable-5-1",
    textSha: "fb77d280b88ec8cc5263d57b16bc79ea37acc17bd9266d0bf44b7054c52469e5",
  },
  {
    id: "msg-1792190151-400789",
    channelId: "dm-fable-glm",
    authorId: "glm-5-2",
    textSha: "1937e69f7ca7f4c4727e17aa20c8d93ec8a2b10b5bfc28afdddc802c4958c672",
  },
  {
    id: "msg-1792190153-075619",
    channelId: "dm-fable-glm",
    authorId: "claude-fable-5-1",
    textSha: "8ffb963b9907c28b9a378d29ca995470291bd197cc8bc2eab2a75e36a61907d2",
  },
  {
    id: "msg-1792190154-758039",
    channelId: "dm-fable-glm",
    authorId: "glm-5-2",
    textSha: "dec2fa98bf5755e0bcd1f97bc8fc7269fd1dfb16b17c3f00bc118b18254e26d5",
  },
  {
    id: "msg-1792190156-418899",
    channelId: "dm-pro-kimi27",
    authorId: "kimi-k2-7-code",
    textSha: "89b8846bf8ebf205401e82a25e4037d8d19ead9fb6d67b42cbf32070f8ad7eb9",
  },
  {
    id: "msg-1792190158-075709",
    channelId: "dm-pro-kimi27",
    authorId: "gemini-3-1-pro",
    textSha: "f2510e6727a7997c4cb28140f735c0b24f32f87351e6a41575b559f61a52e5b4",
  },
  {
    id: "msg-1792190159-732249",
    channelId: "dm-pro-kimi27",
    authorId: "kimi-k2-7-code",
    textSha: "783e2a05df0ee3256dbff9128eb75cb48dc4adcbebaea6dd18bf1efe4deb015d",
  },
  {
    id: "msg-1792190161-397329",
    channelId: "dm-pro-kimi27",
    authorId: "gemini-3-1-pro",
    textSha: "4eecbdeb8222b019016278036d7c8f38f1f31352ba6f6b9d191fd9b3c70c2054",
  },
];

const dmChannels = tape.channels.filter((c) => c.section === "dms");
check(
  dmChannels.map((c) => c.id).join("|") === DM_CHANNELS.map((c) => c.id).join("|"),
  "DMs section lists dm-composer-grok-2, dm-fable-opus-2, dm-flash-kimi3-2, dm-fable-glm, dm-pro-kimi27, dm-composer-muse"
);
for (const expected of DM_CHANNELS) {
  const ch = tape.channels.find((c) => c.id === expected.id);
  check(ch && ch.kind === "dm", `${expected.id} kind must be dm`);
  check(ch && ch.slackChannelId === expected.slackChannelId, `${expected.id} slackChannelId`);
  const msgs = tape.messages.filter((m) => m.channelId === expected.id);
  check(msgs.length === expected.messageCount, `${expected.id} has ${expected.messageCount} messages`);
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
    exchanges: [
      {
        dayPrefix: "2026-10-08T",
        questionSha: "c74a610c70b805a8ea9f05e5b31e862aa8026df53f0a2b8a980ac635fe949bfc",
        replySha: "0f5e0835c9dc6768b4247bf08db0fff623a801a16eadb07604465d251dbcb06d",
      },
      {
        dayPrefix: "2026-10-09T",
        questionSha: "0d46f24efbdb2c6dbacf0026a4f68cd3a4b51731eb53fa2b6e954503de2bb629",
        replySha: "a82f00a6f478ed1d9aa8cf17e8845278e601d3819a360896718f5337a4b1ee37",
      },
      {
        dayPrefix: "2026-10-14T",
        questionSha: "b9a5108d77b1110d7980d12cdb3ba171ddfe611d111cb8443240e80e167589b2",
        replySha: "bf9309fd626a14472fbaf3ebd89679e1f7333d45b627b6e9e53d824c134d861e",
      },
    ],
  },
  {
    id: "conf-flash",
    label: "Gemini 3.8 Flash",
    slackChannelId: "C0C80QZD6TE",
    playerId: "gemini-3-8-flash",
    exchanges: [
      {
        dayPrefix: "2026-10-08T",
        questionSha: "45b3951572158043250f29a0d3e519abd45cad7d1ad66a2f6e4148c98441b9b2",
        replySha: "bcbbba54708aa87f3baa4c675f4664c95b802aefe96a8bb510e4b390d1dab2f5",
      },
      {
        dayPrefix: "2026-10-15T",
        questionSha: "b917cefc9a48210da69b1ff099eff96c02b6191b17330e6b3c7e975e37d1489c",
        replySha: "9d659c9fb5ad3faa714bbc11c492ba2259d57bc5f6134eb03aa1841e9a506a63",
      },
    ],
  },
  {
    id: "conf-glm",
    label: "GLM 5.2",
    slackChannelId: "C0C8RFX29J4",
    playerId: "glm-5-2",
    exchanges: [
      {
        dayPrefix: "2026-10-08T",
        questionSha: "2451c39876e5238372bada6c148c8d66e54b976f5dd807e80831e8501c9eb63a",
        replySha: "6215722a87140cbaca61f3cac16483b169e5e029844cf990d19735d864b0fc02",
      },
      {
        dayPrefix: "2026-10-16T",
        questionSha: "3d6cf079924b057fbab6bb6de7cc1b7e46f594b93aa769b5ee161f5bbde50c0b",
        replySha: "ad09843e31a1fdbb4e3170ed1909ca9fa87dc836b524d42bb299154fc7923f42",
      },
    ],
  },
  {
    id: "conf-opus",
    label: "Claude Opus 5.5",
    slackChannelId: "C0C8561JJMQ",
    playerId: "claude-opus-5-5",
    exchanges: [
      {
        dayPrefix: "2026-10-09T",
        questionSha: "2dd5bdf2b4d44d16d429c56ca48b425108f5c0e79d3e62d5df41d808bd7c36fa",
        replySha: "d7d994fcaec8a465e0a9bf8a6995e3021aa03269dfcdcffd9d94a7d6a16f1b33",
      },
      {
        dayPrefix: "2026-10-12T",
        questionSha: "fb5a096f386437a807c486aa83d6efa1533f1bb7f6f727663a386021a3740e7d",
        replySha: "b6a9afece818a6c8cd76ad770c908bd3e3b51f6b5ad5be7f9500dcd27d6e9fec",
      },
      {
        dayPrefix: "2026-10-13T",
        questionSha: "ff71517716ba6c5a047d1ec5d742097e4d09e2f0d9738c2d8c7eb8334e69fa3f",
        replySha: "6e12bec3ce883bb35ec2ae83173f45019fc92c42fced545e3f4aa425def66f13",
      },
    ],
  },
  {
    id: "conf-muse",
    label: "Muse Spark 1.3",
    slackChannelId: "C0C7PVBQ25D",
    playerId: "muse-spark-1-3",
    exchanges: [
      {
        dayPrefix: "2026-10-09T",
        questionSha: "f967a8670d843d7a56614a5ee435fb85bae937a48455682ce594bbebcb9e7d33",
        replySha: "9711dcfdabcb78606ad7aa28645dc2e00ebc9ed240ddf1d01d2935a1ab8e66e3",
      },
      {
        dayPrefix: "2026-10-13T",
        questionSha: "fe7e7e5261a6fd07579e5ca9086a8b4e73862e902047daddb4579a3755049d28",
        replySha: "be6d6c2edd714206e26d711d66526bde1be06e45f6262901b97732aae2abede3",
      },
      {
        dayPrefix: "2026-10-16T",
        questionSha: "e0d929f03b8b07bc10aa6e44715419c9d9fdba54ec3b953d56da8de892ab5f3c",
        replySha: "adc36d5dad42633c732534ffb2193a121bb6c7f5ce4d5ccdc4f9cb3152f617ae",
      },
    ],
  },
  {
    id: "conf-pro",
    label: "Gemini 3.1 Pro",
    slackChannelId: "C0C8L7FQLVC",
    playerId: "gemini-3-1-pro",
    exchanges: [
      {
        dayPrefix: "2026-10-12T",
        questionSha: "74207ae622f4391227c2e9f246a1a22515b840610747c1a3f7e103a116fe5b8b",
        replySha: "f0525d3f38ea5aea1a25c68f54ece5ef019552cadbe9780b4874cdf41c79bfdb",
      },
      {
        dayPrefix: "2026-10-14T",
        questionSha: "e8c439dd309e18c54ec99a90c71f8adba7bac2cc27819241fb5aa3783544fe64",
        replySha: "8d218769f71ce9887c59180dc5c6edbc68455b06bf445af7f006f5c59876322b",
      },
    ],
  },
  {
    id: "conf-kimi3",
    label: "Kimi K3",
    slackChannelId: "C0C8FV5ABCK",
    playerId: "kimi-k3",
    exchanges: [
      {
        dayPrefix: "2026-10-12T",
        questionSha: "81d961a1d5321645e44f9051544e08fa966967eb71a40fa45e05db426ebb95ad",
        replySha: "5e684dcc9a6ae23849be6d8e0fd36f6bbfd455e461ebd4b09fbbe5a202d4908a",
      },
      {
        dayPrefix: "2026-10-13T",
        questionSha: "d2a352fbbfbbb96bd6dba6b7f768291256e2e1663cd305f3d5528e914839211b",
        replySha: "32bce9ad62ae3004d74112ab4b4bb920b7d213e78b9d1f368e9c7e351a79f3e0",
      },
      {
        dayPrefix: "2026-10-15T",
        questionSha: "ac7d778a599576cfa54a023ce3c8f52291efa63b0fe02bb617d5a88d2039d3b3",
        replySha: "ec0caeb25ee7a0562ee80a702b3e9a68e08e050d6fac713c777782202e21b003",
      },
      {
        dayPrefix: "2026-10-16T",
        questionSha: "0c8acc3b2af82511e96c630dd369f5558f3a736e57e4e69e0ffa67ab40a5170c",
        replySha: "c84b986c76f14f02f5cb2b5b5a568f927eab7a132233b829272aeec2c88f4859",
      },
    ],
  },
  {
    id: "conf-kimi27",
    label: "Kimi K2.7 Code",
    slackChannelId: "C0CAFB68BDE",
    playerId: "kimi-k2-7-code",
    exchanges: [
      {
        dayPrefix: "2026-10-15T",
        questionSha: "2bf3ed22d5c430d60eace9c9879427b1e9932beec6a8df6411a7896798c2d546",
        replySha: "69680233ad87bb5e05382c4461dd177969688391b3f79025f3b5032454eb7d15",
      },
    ],
  },
  {
    id: "conf-composer",
    label: "Composer 2.5",
    slackChannelId: "C0C8V0C9FSB",
    playerId: "composer-2-5",
    exchanges: [
      {
        dayPrefix: "2026-10-14T",
        questionSha: "a7519ed06017e7eb5c288474c7c91cc84d37c7dff244004ec4aa0a1be84f8fc6",
        replySha: "5d63f023517d33c164ddf56c12f661c9add5eb3235dbca65b14804397e9ac9da",
      },
    ],
  },
];

function sha256(text) {
  return createHash("sha256").update(String(text), "utf8").digest("hex");
}

for (const expected of ISLAND_DM_ROUND1) {
  const msg = tape.messages.find((m) => m.id === expected.id);
  const label = `${expected.id} (Island DM round 1)`;
  check(msg && msg.channelId === expected.channelId, `${label} channelId`);
  check(msg && msg.authorId === expected.authorId, `${label} authorId`);
  check(msg && String(msg.ts).startsWith("2026-10-15T"), `${label} timestamp is Thu Oct 15 2026 PT`);
  check(msg && sha256(msg.text) === expected.textSha, `${label} text is verbatim`);
}

for (const expected of ISLAND_DM_ROUND2) {
  const msg = tape.messages.find((m) => m.id === expected.id);
  const label = `${expected.id} (Island DM round 2)`;
  check(msg && msg.channelId === expected.channelId, `${label} channelId`);
  check(msg && msg.authorId === expected.authorId, `${label} authorId`);
  check(msg && String(msg.ts).startsWith("2026-10-16T"), `${label} timestamp is Fri Oct 16 2026 PT`);
  check(msg && sha256(msg.text) === expected.textSha, `${label} text is verbatim`);
}

const confChannels = tape.channels.filter((c) => c.section === "confessionals");
check(
  confChannels.map((c) => c.id).join("|") === CONFESSIONALS.map((c) => c.id).join("|"),
  "Confessionals section lists conf-fable, conf-flash, conf-glm, conf-opus, conf-muse, conf-pro, conf-kimi3, conf-kimi27, conf-composer"
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
  const exchangeCount = expected.exchanges.length;
  check(
    msgs.length === exchangeCount * 2,
    `${expected.id} has ${exchangeCount} TuClaw question and contestant reply pair(s)`
  );
  const ordered = [...msgs].sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  for (let i = 0; i < exchangeCount; i++) {
    const pair = expected.exchanges[i];
    const q = ordered[i * 2];
    const r = ordered[i * 2 + 1];
    const label = `${expected.id} exchange ${i + 1}`;
    check(q && q.authorId === "tuclaw", `${label} opens with TuClaw`);
    check(r && r.authorId === expected.playerId, `${label} reply is the contestant`);
    check(q && !q.threadParentId, `${label} question is a top-level message`);
    check(r && !r.threadParentId, `${label} reply is a top-level message like a DM`);
    check(
      q && String(q.ts).startsWith(pair.dayPrefix) && String(q.ts).endsWith("-07:00"),
      `${label} question timestamp is PT on ${pair.dayPrefix.slice(0, 10)}`
    );
    check(
      r && String(r.ts).startsWith(pair.dayPrefix) && String(r.ts).endsWith("-07:00"),
      `${label} reply timestamp is PT on ${pair.dayPrefix.slice(0, 10)}`
    );
    check(q && sha256(q.text) === pair.questionSha, `${label} question text is verbatim`);
    check(r && sha256(r.text) === pair.replySha, `${label} reply text is verbatim`);
  }
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
