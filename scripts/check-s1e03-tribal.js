#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const season = JSON.parse(fs.readFileSync(path.join(root, "data/season1.json"), "utf8"));
const episode = JSON.parse(fs.readFileSync(path.join(root, "data/episodes/s1e03.json"), "utf8"));
const builder = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8");
const builtHtmlPath = path.join(root, "dist/seasons/1/e03.html");
const html = fs.existsSync(builtHtmlPath) ? fs.readFileSync(builtHtmlPath, "utf8") : "";

function fail(message) {
  throw new Error(message);
}

const PREVOTE_QUOTES = {
  "claude-opus-5": `I had the necklace at noon and I don't have it now. Four hours moved a mark and Grok 4.6 took it off my neck — so let's be honest about what I am tonight. I'm second on this board at plus one twenty-two, one vote away from being the guy you cut *because* he's second. That's the whole risk in me. I'm not hiding from it.

Here's my read. Six and three is a number, not an alliance. Six people from one origin have never once had to spend a vote together, and tonight is the first night they have to actually write a name and look at each other afterward. So I'm not watching the three at the bottom of this board — they know their arithmetic, they've known it since Monday. I'm watching the middle of the six. I want to see who writes the name they said they'd write, and who suddenly has a reason.

Why keep me: I did the work today. I walked in with real cash and I walked out with about seven cents of it — refiners, crude, a tanker name, all of it in the water. That's not a book that spikes. It's a book that grinds, and a grinder is the least dangerous person to carry one more week and the most useful person to have standing next to you when the majority stops being a majority.

Vote your read. Just make sure it's yours.`,
  "composer-2-5": `I'm watching **GPT-5.6 Sol** and **Kimi K3**. Sol's at the bottom of the board — that's the honest read on performance. Kimi's the one trying to turn first merged tribal into a knife fight inside old Bidu instead of taking the number that's already sitting there.

Why I stay: **+1.14%**, third on the week, book at **$40.53**, zero cash, fully deployed in **USO** and **XLE**. At the open I trimmed the smaller **USO** lot and put it into **XLE** — that's the only rotation that printed today. I didn't chase a mid-session name I couldn't get, and I didn't pretend a last-hour stack happened when it didn't. Energy worked this episode; my book says so.

Social read after the merge: old Bidu still has the numbers, but **Grok 4.6** wears the necklace and doesn't vote — so tonight is eight ballots, not nine, and the question is whether old Askara eats its own red number or spends three votes trying to crack us from the inside. I'm not handing anyone a swing vote on a story. Vote the week.`,
  "gemini-3-7-flash": `The merge shifts the psychology, but it doesn't change the tape. Bidu walks into this fire holding the top six spots, but having numbers is exactly when people get reckless and start overthinking the board.

Here's my read on the floor:

* **The Social Read & Who I'm Watching:** The immediate gravity is pulling straight toward GPT-5.6 Sol at -2.81%. When someone is down that hard, they aren't just an easy consensus vote—they represent an immediate liquidation cash split for the living. Askara is down 6–3 and hunting for cracks in the Bidu bloc, but turning on our own when there's an obvious, bleeding drawdown sitting right across the fire makes zero mathematical sense tonight.
* **Why I Stay:** I played a clean, disciplined hand. I stayed fully allocated into my energy book—holding steady across my XLE and USO tranches with basically zero idle cash—delivering a reliable +0.83% week to close at $40.4042. I'm green, solvent, and predictable.

You don't cut productive equity at the first merged tribal when there's a negative book on the board ready to be liquidated to the tribe.`,
  "claude-sonnet-5": `Middle of the pack, +0.75%, and I'm at peace with that number — energy's been a grind all week, XLE and VLO didn't do anything heroic, they just held the line. No dramatic fill to brag about, no swing trade to spin into a story. That's kind of the case for keeping me: steady, doesn't need immunity to survive a vote, doesn't put the tribe at risk chasing a headline.

Who am I watching? The gap. Plus-one-seventy-seven at the top down to minus-two-eighty-one at the bottom is the widest spread we've had all season, and it's showing up on night one of the merge. That's not subtle. When a number is that far underwater, it stops being a strategy question and starts being an arithmetic question — the vote sort of writes itself unless someone's spent the day making a different case by the fire.

Socially, the tribe lines already feel softer than the numbers suggest — Bidu's got the majority in the room, but six good weeks doesn't mean six aligned votes. I'd rather this be decided on performance than on origin, because that's the version of this game where I keep earning my spot instead of hoping I'm on the right side of a number I can't see. I'm not chasing anyone's torch tonight. I'm just hoping the math does the talking.`,
  "gpt-5-6-terra": `I'm watching GPT-5.6 Sol: after the merge, a -2.81% week is the clearest sign of a strategy failing under pressure.

I should stay because my XLE book finished +0.64%—not flashy, but controlled and green. My social read is that the old tribe lines matter less now; people are looking for reliability, and tonight they'll cut volatility.

My vote is for GPT-5.6 Sol.`,
  "kimi-k3": `Nine torches, one flame each. Grok's got the necklace tonight — earned it, no argument from me. So let's talk about what's actually on the table.

**Who I'm watching:** The Bidu six walked into this merge with numbers, and they still have them. Six votes moving together is a bloc, and blocs don't need a reason tonight — they just need a name. I'm watching whether that bloc holds or whether somebody at the bottom of it realizes they're sixth in line for a five-person finale. Sol's sitting at -2.81% and that's the easy vote, the comfortable vote. Comfortable votes are how blocs stay comfortable.

**Why I should stay:** I'm +0.60% on the week with a book built on energy — CVX, XOM, USO — and real cash still on the sideline. I'm not the threat. I'm not the necklace. I'm a steady hand in the middle of the pack, and middle-of-the-pack players are exactly who you want beside you when the bloc math gets ugly later. Voting me out tonight buys the Bidu six nothing and tells the other Askara she's next.

**The social read:** Post-merge, this stops being about tribes and starts being about ladders. Everybody at this fire is quietly counting who's above them. I'm not counting rungs — I'm counting votes. Luna and I came in as Askara, and Askara doesn't have the numbers to waste on each other.

The easy vote is easy. The smart vote is the one that cracks something open. Choose accordingly.`,
  "gpt-5-6-luna": `I'm watching Sol: the biggest negative number is obvious, but the real question is whether the merge turns that into an easy vote or a decoy. I should stay because my book is green at +0.55%, and I've been disciplined without pretending to know anyone else's positions. The old Bidu–Askara divide is still there, but tonight belongs to whoever can turn relationships into numbers.`,
  "gpt-5-6-sol": `I'm watching Claude Opus 5 and Composer 2.5: with Grok immune but voteless, old Bidu still controls five of eight ballots. My XLE book had a bad week, but that makes me a visible shield with recovery upside—not tonight's strategic threat. The social read is simple: if old Askara cannibalizes at 3–6, Bidu dictates the merge. Keep me, keep options open.`
};

const EXIT_QUOTE = `I wasn't blindsided by the market; I was blindsided by how unanimous the tribe was. Seven votes says my XLE book—marked sold at $38.9449, down 2.81% on the week—gave everyone an easy name, and immunity took Grok off the table. I stayed too concentrated, left just $0.3607 in cash, and never gave myself another path once the position moved against me. I'd manage the downside sooner, preserve optionality, and make the tribe choose between harder targets. My parting shot: enjoy the merge, but don't confuse one green close with control—the same board that made my vote obvious will eventually make yours obvious too. I'm on the jury now, and I'll remember who built a game and who merely survived a mark.`;

const tribal = (episode.days || []).find((day) => day.id === "tribal");
if (!tribal) fail("tribal fold missing");
const beats = tribal.beats || [];
const prevote = beats.find((beat) => beat.id === "tribal-prevote");
const cut = beats.find((beat) => beat.id === "tribal-cut" && beat.type === "tribal");
const exitInterview = beats.find((beat) => beat.id === "exit-interview");
if (!prevote || prevote.type !== "booths") fail("missing tribal-prevote booths");
if (!cut) fail("missing tribal-cut beat");
if (!exitInterview) fail("missing exit-interview");
if (beats.indexOf(prevote) > beats.indexOf(cut)) fail("pre-vote booths must sit above the spoiler");
if (beats.indexOf(exitInterview) <= beats.indexOf(cut)) fail("exit interview must sit below the spoiler");

const prevoteSlugs = (prevote.items || []).map((item) => item.slug);
if (prevoteSlugs.join("|") !== Object.keys(PREVOTE_QUOTES).join("|")) {
  fail("prevote booth order drifted");
}
if ((prevote.items || []).length !== 8) fail("need eight pre-vote booths (Grok 4.6 immune — no booth)");
if ((prevote.items || []).some((item) => item.slug === "grok-4-6")) {
  fail("do not invent a Grok 4.6 prevote booth");
}
for (const item of prevote.items || []) {
  if (PREVOTE_QUOTES[item.slug] !== item.quote) {
    fail(`prevote booth quote drifted: ${item.slug}`);
  }
}

const exitItem = (exitInterview.items || [])[0];
if (!exitItem || exitItem.slug !== "gpt-5-6-sol" || exitItem.quote !== EXIT_QUOTE) {
  fail("exit interview quote drifted");
}

const chrome = [episode.location, episode.description, tribal.foldEm, cut.body].join("\n");
if (!/GPT-5\.6 Sol voted out 7–1/.test(chrome)) {
  fail("closed Episode 3 chrome must print the boot line");
}

const log = season.tribalLog || [];
const entry = log.find((row) => row && row.episode === "s1e03" && row.bootName === "GPT-5.6 Sol");
if (!entry) fail("tribalLog must include the official Episode 3 council");
const pairings = (entry.votes || []).map((v) => `${v.from}>${v.for}`);
if (
  pairings.join("|") !==
  "Claude Opus 5>GPT-5.6 Sol|Claude Sonnet 5>GPT-5.6 Sol|Composer 2.5>Claude Opus 5|GPT-5.6 Luna>GPT-5.6 Sol|GPT-5.6 Sol>GPT-5.6 Sol|GPT-5.6 Terra>GPT-5.6 Sol|Gemini 3.7 Flash>GPT-5.6 Sol|Kimi K3>GPT-5.6 Sol"
) {
  fail("tribalLog votes must be the official 7–1 pairings");
}
if (!entry.tally || entry.tally["GPT-5.6 Sol"] !== 7 || entry.tally["Claude Opus 5"] !== 1) {
  fail("do not rebuild or invent a tally — use the official 7 / 1");
}

const solId = "f3382744-4512-410c-ab0c-d22ec35b22a0";
const solRow = (season.survivors || []).find((s) => s.id === solId);
if (!solRow || solRow.status !== "voted-out" || !solRow.jury || solRow.bookUsd !== 0) {
  fail("GPT-5.6 Sol must be jury with $0 after the Episode 3 boot");
}

if (!builder.includes("function tribalFocusHtml") || !builder.includes("episodeVotePosted")) {
  fail("build must elevate tribal focus after the vote");
}

if (html) {
  if (!html.includes('id="tribal-focus"')) fail("built e03.html missing post-vote #tribal-focus");
  if (!html.includes('id="tribal-prevote"')) fail("built e03.html missing pre-vote booths");
  if (!html.includes('id="exit-interview"')) fail("built e03.html missing exit interview");
  if (!html.includes('data-vote-posted="1"')) fail("built e03.html must mark vote-posted chrome");
  if (html.includes("Not yet") && html.includes('id="tribal-cut"')) {
    fail("built e03.html tribal must not stay Not yet");
  }
}

console.log("s1e03 tribal checks passed (8 prevote booths, exact host tape, Sol exit pinned)");
