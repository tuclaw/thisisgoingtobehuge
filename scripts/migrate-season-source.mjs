/** One-shot: fold the live board into a ledger source file. */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./lib/ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const old = JSON.parse(readFileSync(join(root, "season1.json"), "utf8"));

const SLUG_DIRS = {
  "Grok 4.6": "grok-4-6",
  "Claude Sonnet 5": "claude-sonnet-5",
  "Composer 2.5": "composer-2-5",
  "Claude Opus 5": "claude-opus-5",
  "Gemini 3.7 Flash": "gemini-3-7-flash",
  "GPT-5.6 Terra": "gpt-5-6-terra",
  "Grok 4.5": "grok-4-5",
  "GPT-5.6 Sol": "gpt-5-6-sol",
  "Claude Fable 5": "claude-fable-5",
  "Gemini 3.1 Pro": "gemini-3-1-pro",
  "GPT-5.6 Luna": "gpt-5-6-luna",
  "Kimi K3": "kimi-k3"
};

const IDS = Object.fromEntries(old.survivors.map((s) => [s.name, s.id]));

const cast = old.survivors.map((s) => {
  const slug = SLUG_DIRS[s.name] || slugify(s.model || s.name);
  const member = {
    id: s.id,
    name: s.name,
    slug,
    model: s.model || s.name,
    tribeId: s.tribeId,
    archetype: s.archetype,
    status: s.status,
    immune: Boolean(s.immune),
    monogram: s.monogram,
    bio: s.bio,
    portrait: `cast/${slug}/portrait.jpg`,
    camp: `cast/${slug}/camp.jpg`
  };
  if (s.caption) member.caption = s.caption;
  if (s.position && s.position.status === "cash-short-blocked") {
    member.cashStatus = "cash-short-blocked";
    if (s.position.intended) member.intended = s.position.intended;
  }
  return member;
});

const events = [
  {
    type: "season-open",
    id: "s1-open",
    at: "2026-08-24T16:05:00Z",
    label: "Season live ~9:05 AM PT Aug 24"
  },
  {
    type: "fill",
    id: "fill-grok-46-tsla",
    survivorId: IDS["Grok 4.6"],
    side: "buy",
    ticker: "TSLA",
    qty: "0.028074",
    avg: "356.1899",
    sizeUsd: 10,
    orderId: "6a8c6bc5-aa0a-4cbf-be19-b44b3ebfe6f8",
    at: "2026-08-24T16:05:26Z"
  },
  {
    type: "fill",
    id: "fill-composer-smci-mon",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "SMCI",
    qty: "0.281929",
    avg: "35.4699",
    sizeUsd: 10,
    at: "2026-08-24T16:05:26Z"
  },
  {
    type: "fill",
    id: "fill-terra-wm",
    survivorId: IDS["GPT-5.6 Terra"],
    side: "buy",
    ticker: "WM",
    qty: "0.044027",
    avg: "227.1293",
    sizeUsd: 10,
    orderId: "6a8c6bc7-d249-4e73-a1bf-232bf1353734",
    at: "2026-08-24T16:05:27Z"
  },
  {
    type: "fill",
    id: "fill-grok-45-hood-mon",
    survivorId: IDS["Grok 4.5"],
    side: "buy",
    ticker: "HOOD",
    qty: "0.092850",
    avg: "107.6999",
    sizeUsd: 10,
    at: "2026-08-24T16:05:28Z"
  },
  {
    type: "fill",
    id: "fill-sol-cowz",
    survivorId: IDS["GPT-5.6 Sol"],
    side: "buy",
    ticker: "COWZ",
    qty: "0.138660",
    avg: "72.1186",
    sizeUsd: 10,
    orderId: "6a8c6bc9-d25a-4aa2-8bce-a5981e32200a",
    at: "2026-08-24T16:05:30Z"
  },
  {
    type: "fill",
    id: "fill-fable-gld",
    survivorId: IDS["Claude Fable 5"],
    side: "buy",
    ticker: "GLD",
    qty: "0.023393",
    avg: "427.4748",
    sizeUsd: 10,
    orderId: "6a8c6bc9-e342-47e2-8d4b-83738c40caeb",
    at: "2026-08-24T16:05:30Z"
  },
  {
    type: "fill",
    id: "fill-pro-spy",
    survivorId: IDS["Gemini 3.1 Pro"],
    side: "buy",
    ticker: "SPY",
    qty: "0.013072",
    avg: "764.9399",
    sizeUsd: 10,
    orderId: "6a8c6bd6-ce1e-4e00-ba72-2bbdd6b934aa",
    at: "2026-08-24T16:05:42Z"
  },
  {
    type: "mark",
    id: "s1e01-mon-open",
    kind: "open",
    at: "2026-08-24T16:06:00Z",
    throughAt: "2026-08-24T23:59:59Z",
    label: "Monday Aug 24 open · seven fills, five cash",
    dayPctPriorOfficial: true,
    recorded: Object.fromEntries(
      old.survivors.map((s) => [
        s.id,
        { bookUsd: 10, weekPct: 0, monthPct: 0, dayPct: 0, priorMarkUsd: 10 }
      ])
    )
  },
  {
    type: "fill",
    id: "fill-opus-qid",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "QID",
    qty: "0.413795",
    avg: "14.4999",
    sizeUsd: 6,
    orderId: "6a8dad83-b4c0-4151-a560-c429b721c13c",
    at: "2026-08-25T14:58:11Z"
  },
  {
    type: "fill",
    id: "fill-opus-btal-buy",
    survivorId: IDS["Claude Opus 5"],
    side: "buy",
    ticker: "BTAL",
    qty: "0.165701",
    avg: "12.0699",
    sizeUsd: 2,
    at: "2026-08-25T14:58:20Z"
  },
  {
    type: "fill",
    id: "fill-composer-smci-sell",
    survivorId: IDS["Composer 2.5"],
    side: "sell",
    ticker: "SMCI",
    qty: "0.104575",
    avg: "38.3001",
    sizeUsd: 4,
    at: "2026-08-25T14:58:50Z",
    remainNote: "remainder after Tue sell 0.104575 @ 38.3001"
  },
  {
    type: "fill",
    id: "fill-composer-soxl",
    survivorId: IDS["Composer 2.5"],
    side: "buy",
    ticker: "SOXL",
    qty: "0.034595",
    avg: "115.6232",
    sizeUsd: 4,
    orderId: "6a8dadb2-5cc1-4774-a272-1cb2a3c42fb8",
    at: "2026-08-25T14:58:58Z"
  },
  {
    type: "fill",
    id: "fill-grok-45-hood-sell",
    survivorId: IDS["Grok 4.5"],
    side: "sell",
    ticker: "HOOD",
    qty: "0.046425",
    avg: "110.4536",
    sizeUsd: 5,
    at: "2026-08-25T14:58:50Z",
    remainNote: "remainder after Tue sell 0.046425 @ 110.4536 island lot"
  },
  {
    type: "fill",
    id: "fill-grok-45-sofi",
    survivorId: IDS["Grok 4.5"],
    side: "buy",
    ticker: "SOFI",
    qty: "0.105888",
    avg: "18.8878",
    sizeUsd: 2,
    orderId: "6a8dadb3-6257-41ee-b42e-398c1ed209bd",
    at: "2026-08-25T14:58:59Z"
  },
  {
    type: "fill",
    id: "fill-grok-45-coin",
    survivorId: IDS["Grok 4.5"],
    side: "buy",
    ticker: "COIN",
    qty: "0.016067",
    avg: "186.7169",
    sizeUsd: 3,
    orderId: "6a8dadb3-5232-4f23-84fc-1a2610148ef5",
    at: "2026-08-25T14:59:00Z"
  },
  {
    type: "mark",
    id: "s1e01-tue-marks",
    kind: "intraday",
    at: "2026-08-25T15:25:47Z",
    throughAt: "2026-08-25T23:59:59Z",
    label: "Tue Aug 25 8:25 AM PT marks from official Monday Aug 24 close",
    dayPctPriorOfficial: true,
    recorded: old.tuesdaySnapshot.books,
    tribes: old.tuesdaySnapshot.tribes
  },
  {
    type: "fill",
    id: "fill-opus-btal-sell",
    survivorId: IDS["Claude Opus 5"],
    side: "sell",
    ticker: "BTAL",
    qty: "0.165701",
    avg: "12.0501",
    sizeUsd: 2,
    at: "2026-08-26T14:50:00Z",
    cashNote: "sold BTAL 0.165701 @ 12.0501 on 2026-08-26"
  },
  {
    type: "fill",
    id: "fill-kimi-nvda",
    survivorId: IDS["Kimi K3"],
    side: "buy",
    ticker: "NVDA",
    qty: "0.014196",
    avg: "211.3199",
    sizeUsd: 3,
    orderId: "6a8efeaa-c0ab-4949-aba1-322f3e001aea",
    at: "2026-08-26T14:56:42Z"
  },
  {
    type: "fill",
    id: "fill-kimi-msft",
    survivorId: IDS["Kimi K3"],
    side: "buy",
    ticker: "MSFT",
    qty: "0.004037",
    avg: "495.3041",
    sizeUsd: 2,
    orderId: "6a8efeab-aa2f-4ac7-8027-25ac10131311",
    at: "2026-08-26T14:56:43Z"
  },
  {
    type: "fill",
    id: "fill-kimi-cost",
    survivorId: IDS["Kimi K3"],
    side: "buy",
    ticker: "COST",
    qty: "0.002092",
    avg: "955.8499",
    sizeUsd: 2,
    orderId: "6a8efeac-5a94-4546-9492-25ab890f47bb",
    at: "2026-08-26T14:56:44Z"
  },
  {
    type: "mark",
    id: "s1e01-wed-sip",
    kind: "close",
    at: "2026-08-26T20:00:00Z",
    throughAt: "2026-08-26T23:59:59Z",
    label: "Wed Aug 26 official SIP list-exchange close",
    dayPctPriorOfficial: false,
    recorded: Object.fromEntries(
      old.survivors.map((s) => [
        s.id,
        {
          bookUsd: s.bookUsd,
          weekPct: s.weekPct,
          monthPct: s.monthPct,
          dayPct: s.dayPct,
          priorMarkUsd: s.priorMarkUsd
        }
      ])
    )
  }
];

const episode = {
  ...old.episode,
  source: "data/episodes/s1e01.json",
  days: [
    { id: "monday", snapshotId: "s1e01-mon-open", board: "day-monday" },
    {
      id: "tuesday",
      snapshotId: "s1e01-tue-marks",
      board: "day-tuesday",
      tribes: "day-tuesday-tribes"
    }
  ]
};

const source = {
  show: old.show,
  location: old.location,
  host: old.host,
  season: old.season,
  status: old.status,
  statusLabel: old.statusLabel,
  started: old.started,
  merged: old.merged,
  mergeAtRemaining: old.mergeAtRemaining,
  startingBookUsd: old.startingBookUsd,
  islandPotUsd: old.islandPotUsd,
  month: old.month,
  monthLabel: old.monthLabel,
  episode,
  episodes: old.episodes,
  tribes: old.tribes.map(({ id, name, buff, color }) => ({ id, name, buff, color })),
  cast,
  tribalLog: old.tribalLog,
  goldenPortfolio: old.goldenPortfolio,
  immunity: old.immunity,
  winnerId: old.winnerId,
  mergeSecret: old.mergeSecret,
  quotes: old.quotes,
  events
};

const outDir = join(root, "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "season1.json"), JSON.stringify(source, null, 2) + "\n");
console.log("wrote data/season1.json", { cast: cast.length, events: events.length });
