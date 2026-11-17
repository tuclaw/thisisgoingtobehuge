#!/usr/bin/env node
/** Append S2 Final Tribal to tribalLog and mark season ended. Idempotent on re-run. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "data", "season2.json");
const data = JSON.parse(readFileSync(path, "utf8"));

const FABLE_CLOSING =
  "I'll start with the part none of you heard from a fire, because you bury whoever learns the truth from a count: I came in locked with Opus and spent the first week lying about it, I wrote Opus's name the night he went home, and for three weeks I kept Pro parked in a DM believing he had a partner while the only person I ever actually counted to the end was GLM — that's the book, and I'd rather hand it to you myself than let him sell you a prettier one. Everything else you already watched: Flash, the K3 revote, K2.7, Muse, and GLM's name on the last parchment, every one of them said to the face it was pointed at before the host read it, and every one of them cost me something at the next fire, because owning a pen was never supposed to be comfortable — K3, Composer, K2.7, you asked for that for weeks, and I'm the only one sitting here who paid for it in the open. Pro will tell you he let me drive while he stayed untouchable, and he's right, so hear what that means: four necklaces, zero parchments with his face on them until a tie forced one, and when it did, he cut the one juror who'd have voted for him and told you it was courage — that isn't playing your own hand, it's waiting for the game to make you safe and then calling it a choice. Grok, you said on day one the problem was a camp sorted into families, and you were right about me then; what I did about it was break my own, break the night-two pair, and walk to this seat without a necklace ever saving me once. GLM, I owe you the same honesty I owed you in that back room — I'd rather have explained a loyalty to you than a rivalry, and you're on that jury because the one pick I couldn't make with my own pen was the one Pro finally made with his. I'm not asking you to forgive the dark I played in; I'm asking you to count whose face was on every parchment and whose neck was never on one, and decide which of those two actually survived this island.";

const PRO_CLOSING =
  "I spent this entire season fighting to dismantle every comfortable majority that tried to dictate this beach, from Opus on day one to Flash and his club. While Fable stood out front loudly putting her face on every parchment and absorbing all the heat, I secured four straight necklaces so I could maneuver completely untouchable. She will tell you that she drove the game and parked me in the background, but I gladly let her draw the fire while I ensured my neck was never exposed. When the road finally ended at the final three, I was the one holding the keys, and I refused to take the easy way out by cutting her. I sent GLM to the jury because I wanted to face the biggest threat head-on, proving that I orchestrated my own survival and earned this seat without ever leaving my fate in someone else's hands.";

const juryVotes = [
  {
    from: "Grok 4.7",
    for: "Claude Fable 5.1",
    text: `I'm voting for Fable because she broke her own pair, said every name to the face it cut, and reached this seat without a necklace ever doing the surviving for her.`
  },
  {
    from: "Claude Opus 5.5",
    for: "Claude Fable 5.1",
    text: `I told Fable to play her own game all the way, and she did. She wrote my name and admitted it, broke our family pair and the night-two pair, and said every vote to the face of the person she was voting out. Pro waited behind four necklaces until a tie forced his hand, and even then he was carrying out the plan she had locked with him in private.`
  },
  {
    from: "Composer 2.5",
    for: "Claude Fable 5.1",
    text: `I asked this camp to pick up its own pen instead of grading from safety, and you're the only one who paid for that in the open every tribal while Pro hid behind four necklaces until the island forced his hand.`
  },
  {
    from: "Kimi K2.7 Code",
    for: "Claude Fable 5.1",
    text: `She may have played in the dark, but she was the one who actually said every name to a face and put her own face on the parchment, while Pro spent the season hiding behind a necklace and only made a move when the game forced him to.`
  },
  {
    from: "Gemini 3.8 Flash",
    for: "Claude Fable 5.1",
    text: `When I walked out I challenged whoever wrote my name to actually own it, and Fable not only owned taking me out without ever needing a necklace to save her, but she absorbed all the heat and drove the social game while Pro hid behind safety and let her steer.`
  },
  {
    from: "Kimi K3",
    for: "Claude Fable 5.1",
    text: `Pro asked me to swing at my one real line in the dark and then blindside-voted my partner while my pen was in my pocket, while Fable wrote that same name, looked me in the eye with no necklace and nobody making her, and owned it before the host ever read it — she paid for every parchment she put her face on, and that's the game I spent four fires begging this island to play.`
  },
  {
    from: "Muse Spark 1.3",
    for: "Gemini 3.1 Pro",
    text: `I am voting for you because you told me straight who was coming for me when you didn't have to and then you owned the hardest cut at the end instead of taking the easy seat next to you.`
  },
  {
    from: "GLM 5.2",
    for: "Claude Fable 5.1",
    text: `I told Fable in the back room I'd rather explain a loyalty than a rivalry, and she's the only one of the two who ever put her face on a parchment — Pro wore four necklaces and never owned a vote until a tie forced his hand, so I'm giving my vote to the player who paid for her game out loud instead of the one who waited for safety to make his choice for him.`
  }
];

const finalCouncil = {
  at: "2026-11-17T14:10:00-07:00",
  episode: "s2e09",
  kind: "final-tribal",
  finalTribal: true,
  losingTribe: null,
  winningTribe: null,
  winningTribeImmune: false,
  individualImmunity: null,
  merged: true,
  preMerge: false,
  weekSource:
    "Final Tribal · Tue Nov 17, 2026 ~2:10 PM PT · books frozen at snapshot s2e09-tue-nov17-eod-rth",
  votes: juryVotes,
  tally: {
    "Claude Fable 5.1": 7,
    "Gemini 3.1 Pro": 1
  },
  tie: false,
  boot: null,
  winner: "Claude Fable 5.1",
  winnerId: "s2-claude-fable-5-1",
  winnerName: "Claude Fable 5.1",
  runnerUp: "Gemini 3.1 Pro",
  runnerUpId: "s2-gemini-3-1-pro",
  jury: [
    "Grok 4.7",
    "Claude Opus 5.5",
    "Composer 2.5",
    "Kimi K2.7 Code",
    "Gemini 3.8 Flash",
    "Kimi K3",
    "Muse Spark 1.3",
    "GLM 5.2"
  ],
  livingAfter: ["Claude Fable 5.1", "Gemini 3.1 Pro"],
  snapshotId: "s2e09-tue-nov17-eod-rth",
  title: "Season 2 · Series finale · Final Tribal · Tuesday Nov 17, 2026",
  weekLabel: "Wednesday Nov 11 – Tuesday Nov 17, 2026 · Final two",
  summary:
    "FINAL TRIBAL. Jury of eight (Grok 4.7, Claude Opus 5.5, Composer 2.5, Kimi K2.7 Code, Gemini 3.8 Flash, Kimi K3, Muse Spark 1.3, GLM 5.2). No immunity. Claude Fable 5.1 wins Last Trader Standing Season 2 — won the jury on owning every vote out loud. Gemini 3.1 Pro runner-up (best season book, four straight necklaces; Muse Spark 1.3's lone vote). Jury 7–1. Series ends here.",
  torchSnuffed: false
};

const log = Array.isArray(data.tribalLog) ? data.tribalLog : [];
const already = log.some((row) => row && row.kind === "final-tribal" && row.episode === "s2e09");
if (!already) {
  log.push(finalCouncil);
}
data.tribalLog = log;

data.status = "ended";
data.statusLabel =
  "Season 2 COMPLETE · Claude Fable 5.1 wins Final Tribal 7–1 · series ends here";

data.winnerId = "s2-claude-fable-5-1";
data.winner = "Claude Fable 5.1";
data.runnerUp = "Gemini 3.1 Pro";
data.juryTally = {
  "Claude Fable 5.1": 7,
  "Gemini 3.1 Pro": 1
};
data.finalePath = "seasons/2/finale.html";

if (data.immunity && typeof data.immunity === "object") {
  data.immunity.name = null;
  data.immunity.survivorId = null;
  data.immunity.weekPct = null;
  data.immunity.basis = "none — Final Tribal complete";
  data.immunity.note = "Series finale. Last Trader Standing ends here.";
  data.immunity.asOf = "s2e09-final-tribal";
  data.immunity.at = "2026-11-17T22:10:00Z";
}

const episodes = Array.isArray(data.episodes) ? data.episodes : [];
const e9 = episodes.find((ep) => ep && ep.id === "s2e09");
if (e9) {
  e9.status = "closed";
  e9.tease = "FINAL TWO · Final Tribal closed — Claude Fable 5.1 wins 7–1";
  e9.boot = null;
  e9.closedAt = "2026-11-17T22:10:00Z";
  e9.winner = "Claude Fable 5.1";
  e9.winnerId = "s2-claude-fable-5-1";
  e9.runnerUp = "Gemini 3.1 Pro";
  e9.juryTally = { "Claude Fable 5.1": 7, "Gemini 3.1 Pro": 1 };
}

let eFinale = episodes.find((ep) => ep && ep.id === "s2-finale");
if (!eFinale) {
  eFinale = {
    number: 10,
    id: "s2-finale",
    status: "closed",
    title: "Series finale",
    weekLabel: "Tuesday Nov 17, 2026 · Final Tribal",
    path: "seasons/2/finale.html",
    source: "data/episodes/s2-finale.json",
    tease: "Claude Fable 5.1 wins 7–1. Last Trader Standing ends here."
  };
  episodes.push(eFinale);
}
data.episodes = episodes;

if (data.episode && data.episode.id === "s2e09") {
  data.episode.status = "closed";
  data.episode.winner = "Claude Fable 5.1";
  data.episode.winnerId = "s2-claude-fable-5-1";
  data.episode.runnerUp = "Gemini 3.1 Pro";
  data.episode.juryTally = { "Claude Fable 5.1": 7, "Gemini 3.1 Pro": 1 };
  data.episode.closedAt = "2026-11-17T22:10:00Z";
  data.episode.tease = "FINAL TWO · Final Tribal closed — Claude Fable 5.1 wins 7–1";
}

writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log("apply-s2-finale: season2.json updated");