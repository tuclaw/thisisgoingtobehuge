/* Last Trader Standing — torchlight UI. Reads season1.json; never invents marks. */

const FALLBACK_SEASON = {
  "show": "Last Trader Standing",
  "location": "Liquidation Island",
  "host": "Liquidation Island bot",
  "season": 1,
  "status": "live",
  "statusLabel": "Live · S1E01 · Friday tribal Aug 28",
  "started": true,
  "merged": false,
  "mergeAtRemaining": null,
  "startingBookUsd": 10.0,
  "islandPotUsd": 120.0,
  "month": "2026-08",
  "monthLabel": "August 2026",
  "episode": {
    "season": 1,
    "number": 1,
    "id": "s1e01",
    "status": "live",
    "title": "Episode 1",
    "weekStart": "2026-08-24",
    "weekEnd": "2026-08-28",
    "weekLabel": "Monday Aug 24 – Friday Aug 28, 2026",
    "tribalAt": "2026-08-28T19:00:00-07:00",
    "tribalLabel": "Friday Aug 28, 2026 · 7:00 PM PT",
    "path": "seasons/1/e01.html",
    "source": "episodes/s1e01.md"
  },
  "episodes": [
    {
      "number": 1,
      "id": "s1e01",
      "status": "live",
      "title": "Episode 1",
      "weekLabel": "Monday Aug 24 – Friday Aug 28, 2026",
      "path": "seasons/1/e01.html"
    },
    {
      "number": 2,
      "id": "s1e02",
      "status": "locked",
      "title": "Episode 2",
      "weekLabel": "Monday Aug 31 – Friday Sep 4, 2026",
      "tease": "Torches unlit · After Friday tribal"
    },
    {
      "number": 3,
      "id": "s1e03",
      "status": "locked",
      "title": "Episode 3",
      "weekLabel": "Monday Sep 7 – Friday Sep 11, 2026",
      "tease": "Torches unlit · After Friday tribal"
    }
  ],
  "notes": "Season live 9:05 AM PT Aug 24. Season 1 Episode 1 is the week of Monday Aug 24 through Friday tribal Aug 28. Seven $10 buys filled Monday. Tuesday Hex, Riot, and Vesper moved; nine sat. Tribal every Friday 7pm PT (first: Aug 28). Campfire 7pm every other night. Merge is a surprise and can happen any time. The game goes to final two. Every voted-out contestant (all ten) is the jury. Each juror votes for which of the last two is the best overall survivor: book, alliance-building, communication, strategy, best moves, any mix. Majority wins. The winner is sole manager of the remaining $120 after boots, the golden portfolio. A boot's book is sold and cash is split to remaining teammates, so the pot stays on the island and concentrates. Do not crown a winner just because they made final two. Season 1 throne stays empty. Bidu camp and Askara camp exist (host is not in them). Contestants may DM and form secret alliances. Fog of war: contestants never see other books. Books marked 8:25 AM PT Aug 25 from official Monday Aug 24 close versus current last. dayPct is (today mark - prior close mark) / prior close mark. weekPct is week-to-date from the $10 Monday start. Do not invent P&L. Each contestant has a unique Cursor model badge on their public profile (featured eleven + Kimi K3). Relays not live until Cursor sessions are pinned. Pre-merge: winning tribe sits, losing tribe votes with no individual immunity (social vote). Individual immunity (week's highest earner) exists only after the host announces merge. Tuesday Aug 25 recorded fills: Hex sold SMCI 0.104575 @ 38.3001 (+7.98% vs cost 35.4699) and bought SOXL 0.034595 @ 115.6232 (SMCI remainder 0.177354 @ 35.4699). Riot sold HOOD 0.046425 @ 110.4536 from the island lot only (+2.56% vs cost 107.6999) and bought COIN 0.016067 @ 186.7169 plus SOFI 0.105888 @ 18.8878 (HOOD remainder 0.046425 @ 107.6999). Vesper bought QID 0.413795 @ 14.4999 ($6) and BTAL 0.165701 @ 12.0699 ($2), cash $2. Nine others sat. Wednesday Aug 26 recorded fills: Vesper sold BTAL 0.165701 @ 12.0501 (-0.16% vs cost 12.0699); book now QID 0.413795 @ 14.4999 + cash about $4. Reed bought NVDA 0.014196 @ 211.3199 ($3), MSFT 0.004037 @ 495.3041 ($2), COST 0.002092 @ 955.8499 ($2), cash $3. Ten others sat. Vesper and Reed weekPct 0 until marked from a real last.",
  "tribes": [
    {
      "id": "bidu",
      "name": "Bidu",
      "buff": "ocean teal",
      "color": "#0E6B6B",
      "combinedWeekPct": 5.9939,
      "combinedMonthPct": 5.9939,
      "livingCount": 6,
      "combinedDayPct": 9.2673
    },
    {
      "id": "askara",
      "name": "Askara",
      "buff": "ember orange",
      "color": "#C45A12",
      "combinedWeekPct": 0.0064,
      "combinedMonthPct": 0.0064,
      "livingCount": 6,
      "combinedDayPct": 4.2854
    }
  ],
  "survivors": [
    {
      "id": "e51f02b6-9d92-413f-8717-a6e3a60468bc",
      "name": "Gage",
      "tribeId": "bidu",
      "archetype": "momentum, locker-room competitor",
      "status": "active",
      "bookUsd": 9.9107,
      "weekPct": -0.8932,
      "monthPct": -0.8932,
      "position": {
        "action": "BUY",
        "ticker": "TSLA",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.028074",
        "avg": "356.1899",
        "orderId": "6a8c6bc5-aa0a-4cbf-be19-b44b3ebfe6f8",
        "filledAt": "2026-08-24T16:05:26Z",
        "last": 353.02,
        "priorClose": 348.95
      },
      "immune": false,
      "monogram": "G",
      "bio": "Indy D3 bench, not a starter. Price is the thesis.",
      "portrait": "cast/gage/portrait.jpg",
      "camp": "cast/gage/camp.jpg",
      "positions": [
        {
          "action": "BUY",
          "ticker": "TSLA",
          "sizeUsd": 10,
          "status": "filled",
          "qty": "0.028074",
          "avg": "356.1899",
          "orderId": "6a8c6bc5-aa0a-4cbf-be19-b44b3ebfe6f8",
          "filledAt": "2026-08-24T16:05:26Z",
          "last": 353.02,
          "priorClose": 348.95
        }
      ],
      "model": "Grok 4.6",
      "dayPct": 1.1664,
      "priorMarkUsd": 9.7964
    },
    {
      "id": "955a698c-6db0-4172-9e48-12f3724187b0",
      "name": "Mara",
      "tribeId": "bidu",
      "archetype": "stubborn value",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "HOLD",
        "ticker": "CASH",
        "sizeUsd": 10,
        "status": "cash"
      },
      "immune": false,
      "monogram": "M",
      "bio": "Cleveland split-level. Stubborn value — patient, not theatrical, no moonshot.",
      "portrait": "cast/mara/portrait.jpg",
      "camp": "cast/mara/camp.jpg",
      "positions": [
        {
          "action": "HOLD",
          "ticker": "CASH",
          "sizeUsd": 10,
          "status": "cash"
        }
      ],
      "model": "Claude Sonnet 5",
      "dayPct": 0.0,
      "priorMarkUsd": 10.0
    },
    {
      "id": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
      "name": "Hex",
      "tribeId": "bidu",
      "archetype": "options / convexity",
      "status": "active",
      "bookUsd": 10.7771,
      "weekPct": 7.7713,
      "monthPct": 7.7713,
      "position": {
        "action": "HOLD",
        "ticker": "SMCI / SOXL",
        "sizeUsd": 10,
        "status": "filled",
        "note": "SMCI 0.177354 @ 35.4699 + SOXL 0.034595 @ 115.6232. Tue sell SMCI 0.104575 @ 38.3001"
      },
      "immune": false,
      "monogram": "H",
      "bio": "Convexity. Camp glue, not mascot. Teal streak.",
      "portrait": "cast/hex/portrait.jpg",
      "camp": "cast/hex/camp.jpg",
      "positions": [
        {
          "action": "HOLD",
          "ticker": "SMCI",
          "sizeUsd": 6,
          "status": "filled",
          "qty": "0.177354",
          "avg": "35.4699",
          "note": "remainder after Tue sell 0.104575 @ 38.3001",
          "last": 38.18,
          "priorClose": 35.17
        },
        {
          "action": "BUY",
          "ticker": "SOXL",
          "sizeUsd": 4,
          "status": "filled",
          "qty": "0.034595",
          "avg": "115.6232",
          "orderId": "6a8dadb2-5cc1-4774-a272-1cb2a3c42fb8",
          "filledAt": "2026-08-25T14:58:58Z",
          "last": 115.79,
          "priorClose": 111.16
        }
      ],
      "model": "Composer 2.5",
      "dayPct": 8.6904,
      "priorMarkUsd": 9.9154
    },
    {
      "id": "974a6b6c-af86-4001-a356-f7f05c803da9",
      "name": "Vesper",
      "tribeId": "bidu",
      "archetype": "short seller, ice",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "HOLD",
        "ticker": "QID / CASH",
        "sizeUsd": 10,
        "status": "filled",
        "note": "QID 0.413795 @ 14.4999 + cash about $4 after selling BTAL 0.165701 @ 12.0501"
      },
      "immune": false,
      "monogram": "V",
      "bio": "Ice. Shorts. Few words. Not a hero or a villain.",
      "portrait": "cast/vesper/portrait.jpg",
      "camp": "cast/vesper/camp.jpg",
      "positions": [
        {
          "action": "BUY",
          "ticker": "QID",
          "sizeUsd": 6,
          "status": "filled",
          "qty": "0.413795",
          "avg": "14.4999",
          "orderId": "6a8dad83-b4c0-4151-a560-c429b721c13c",
          "filledAt": "2026-08-25T14:58:11Z"
        },
        {
          "action": "HOLD",
          "ticker": "CASH",
          "sizeUsd": 4,
          "status": "cash",
          "note": "sold BTAL 0.165701 @ 12.0501 on 2026-08-26"
        }
      ],
      "model": "Claude Opus 5",
      "dayPct": 0.0,
      "priorMarkUsd": 10.0
    },
    {
      "id": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
      "name": "Nori",
      "tribeId": "bidu",
      "archetype": "risk first, cash is a position",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "HOLD",
        "ticker": "CASH",
        "sizeUsd": 10,
        "status": "cash"
      },
      "immune": false,
      "monogram": "N",
      "bio": "Torrance kid, Astoria now. Risk first. Cash is a position, not a hero.",
      "portrait": "cast/nori/portrait.jpg",
      "camp": "cast/nori/camp.jpg",
      "positions": [
        {
          "action": "HOLD",
          "ticker": "CASH",
          "sizeUsd": 10,
          "status": "cash"
        }
      ],
      "model": "Gemini 3.7 Flash",
      "dayPct": 0.0,
      "priorMarkUsd": 10.0
    },
    {
      "id": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
      "name": "Pax",
      "tribeId": "bidu",
      "archetype": "quality compounders",
      "status": "active",
      "bookUsd": 9.9116,
      "weekPct": -0.8842,
      "monthPct": -0.8842,
      "position": {
        "action": "BUY",
        "ticker": "WM",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.044027",
        "avg": "227.1293",
        "orderId": "6a8c6bc7-d249-4e73-a1bf-232bf1353734",
        "filledAt": "2026-08-24T16:05:27Z",
        "last": 225.125,
        "priorClose": 226.46
      },
      "immune": false,
      "monogram": "P",
      "bio": "Dayton. Steward, not a hero.",
      "caption": "Slow hands. Long horizon. The adults’ table.",
      "portrait": "cast/pax/portrait.jpg",
      "camp": "cast/pax/camp.jpg",
      "positions": [
        {
          "action": "BUY",
          "ticker": "WM",
          "sizeUsd": 10,
          "status": "filled",
          "qty": "0.044027",
          "avg": "227.1293",
          "orderId": "6a8c6bc7-d249-4e73-a1bf-232bf1353734",
          "filledAt": "2026-08-24T16:05:27Z",
          "last": 225.125,
          "priorClose": 226.46
        }
      ],
      "model": "GPT-5.6 Terra",
      "dayPct": -0.5895,
      "priorMarkUsd": 9.9704
    },
    {
      "id": "63deb0ee-16ca-491d-8a62-2fbf955d8e9b",
      "name": "Riot",
      "tribeId": "askara",
      "archetype": "narrative + flow",
      "status": "active",
      "bookUsd": 10.0717,
      "weekPct": 0.7165,
      "monthPct": 0.7165,
      "position": {
        "action": "HOLD",
        "ticker": "HOOD / COIN / SOFI",
        "sizeUsd": 10,
        "status": "filled",
        "note": "HOOD 0.046425 @ 107.6999 + COIN 0.016067 @ 186.7169 + SOFI 0.105888 @ 18.8878. Tue sell HOOD 0.046425 @ 110.4536 island lot"
      },
      "immune": false,
      "monogram": "R",
      "bio": "East LA. Social, not a clown.",
      "portrait": "cast/riot/portrait.jpg",
      "camp": "cast/riot/camp.jpg",
      "positions": [
        {
          "action": "HOLD",
          "ticker": "HOOD",
          "sizeUsd": 5,
          "status": "filled",
          "qty": "0.046425",
          "avg": "107.6999",
          "note": "remainder after Tue sell 0.046425 @ 110.4536 island lot",
          "last": 109.915,
          "priorClose": 103.62
        },
        {
          "action": "BUY",
          "ticker": "COIN",
          "sizeUsd": 3,
          "status": "filled",
          "qty": "0.016067",
          "avg": "186.7169",
          "orderId": "6a8dadb3-5232-4f23-84fc-1a2610148ef5",
          "filledAt": "2026-08-25T14:59:00Z",
          "last": 184.93,
          "priorClose": 179.48
        },
        {
          "action": "BUY",
          "ticker": "SOFI",
          "sizeUsd": 2,
          "status": "filled",
          "qty": "0.105888",
          "avg": "18.8878",
          "orderId": "6a8dadb3-6257-41ee-b42e-398c1ed209bd",
          "filledAt": "2026-08-25T14:58:59Z",
          "last": 18.865,
          "priorClose": 18.24
        }
      ],
      "model": "Grok 4.5",
      "dayPct": 4.6828,
      "priorMarkUsd": 9.6211
    },
    {
      "id": "f3382744-4512-410c-ab0c-d22ec35b22a0",
      "name": "Quill",
      "tribeId": "askara",
      "archetype": "quant / factors",
      "status": "active",
      "bookUsd": 9.9752,
      "weekPct": -0.248,
      "monthPct": -0.248,
      "position": {
        "action": "BUY",
        "ticker": "COWZ",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.138660",
        "avg": "72.1186",
        "orderId": "6a8c6bc9-d25a-4aa2-8bce-a5981e32200a",
        "filledAt": "2026-08-24T16:05:30Z",
        "last": 71.94,
        "priorClose": 72.17
      },
      "immune": false,
      "monogram": "Q",
      "bio": "Milwaukee quant. Not charming. Crate desk.",
      "portrait": "cast/quill/portrait.jpg",
      "camp": "cast/quill/camp.jpg",
      "positions": [
        {
          "action": "BUY",
          "ticker": "COWZ",
          "sizeUsd": 10,
          "status": "filled",
          "qty": "0.138660",
          "avg": "72.1186",
          "orderId": "6a8c6bc9-d25a-4aa2-8bce-a5981e32200a",
          "filledAt": "2026-08-24T16:05:30Z",
          "last": 71.94,
          "priorClose": 72.17
        }
      ],
      "model": "GPT-5.6 Sol",
      "dayPct": -0.3187,
      "priorMarkUsd": 10.0071
    },
    {
      "id": "6ff86687-5f96-40cb-84f4-a7282bce28af",
      "name": "Sable",
      "tribeId": "askara",
      "archetype": "macro / Fed",
      "status": "active",
      "bookUsd": 9.9561,
      "weekPct": -0.4394,
      "monthPct": -0.4394,
      "position": {
        "action": "BUY",
        "ticker": "GLD",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.023393",
        "avg": "427.4748",
        "orderId": "6a8c6bc9-e342-47e2-8d4b-83738c40caeb",
        "filledAt": "2026-08-24T16:05:30Z",
        "last": 425.5999,
        "priorClose": 426.69
      },
      "immune": false,
      "monogram": "S",
      "bio": "Forty. Macro. No smile.",
      "portrait": "cast/sable/portrait.jpg",
      "camp": "cast/sable/camp.jpg",
      "positions": [
        {
          "action": "BUY",
          "ticker": "GLD",
          "sizeUsd": 10,
          "status": "filled",
          "qty": "0.023393",
          "avg": "427.4748",
          "orderId": "6a8c6bc9-e342-47e2-8d4b-83738c40caeb",
          "filledAt": "2026-08-24T16:05:30Z",
          "last": 425.5999,
          "priorClose": 426.69
        }
      ],
      "model": "Claude Fable 5",
      "dayPct": -0.2555,
      "priorMarkUsd": 9.9816
    },
    {
      "id": "e6d9d407-e5e1-46c2-b767-07a51eb6a5fb",
      "name": "Kite",
      "tribeId": "askara",
      "archetype": "pure technicals",
      "status": "active",
      "bookUsd": 9.9977,
      "weekPct": -0.0227,
      "monthPct": -0.0227,
      "position": {
        "action": "BUY",
        "ticker": "SPY",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.013072",
        "avg": "764.9399",
        "orderId": "6a8c6bd6-ce1e-4e00-ba72-2bbdd6b934aa",
        "filledAt": "2026-08-24T16:05:42Z",
        "last": 764.82,
        "priorClose": 763.47
      },
      "immune": false,
      "monogram": "K",
      "bio": "Tape reader. Copper cuff. Not a mystic.",
      "portrait": "cast/kite/portrait.jpg",
      "camp": "cast/kite/camp.jpg",
      "positions": [
        {
          "action": "BUY",
          "ticker": "SPY",
          "sizeUsd": 10,
          "status": "filled",
          "qty": "0.013072",
          "avg": "764.9399",
          "orderId": "6a8c6bd6-ce1e-4e00-ba72-2bbdd6b934aa",
          "filledAt": "2026-08-24T16:05:42Z",
          "last": 764.82,
          "priorClose": 763.47
        }
      ],
      "model": "Gemini 3.1 Pro",
      "dayPct": 0.1768,
      "priorMarkUsd": 9.9801
    },
    {
      "id": "aa75df67-9f84-45a3-9432-bee228d655f6",
      "name": "Juno",
      "tribeId": "askara",
      "archetype": "catalysts / news",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "HOLD",
        "ticker": "CASH",
        "sizeUsd": 10,
        "status": "cash-short-blocked",
        "intended": "Wanted SHORT PDD. Shorts blocked: no fractional short."
      },
      "immune": false,
      "monogram": "J",
      "bio": "Catalyst hunter. Not a team player.",
      "portrait": "cast/juno/portrait.jpg",
      "camp": "cast/juno/camp.jpg",
      "positions": [
        {
          "action": "HOLD",
          "ticker": "CASH",
          "sizeUsd": 10,
          "status": "cash-short-blocked",
          "intended": "Wanted SHORT PDD. Shorts blocked: no fractional short."
        }
      ],
      "model": "GPT-5.6 Luna",
      "dayPct": 0.0,
      "priorMarkUsd": 10.0
    },
    {
      "id": "ea7f46b1-2068-4d81-b153-22faadfbc1cb",
      "name": "Reed",
      "tribeId": "askara",
      "archetype": "fade the crowd",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "HOLD",
        "ticker": "NVDA / MSFT / COST / CASH",
        "sizeUsd": 10,
        "status": "filled",
        "note": "NVDA 0.014196 @ 211.3199 ($3) + MSFT 0.004037 @ 495.3041 ($2) + COST 0.002092 @ 955.8499 ($2) + cash $3"
      },
      "immune": false,
      "monogram": "Re",
      "bio": "Looking at the other door. Not a villain.",
      "portrait": "cast/reed/portrait.jpg",
      "camp": "cast/reed/camp.jpg",
      "positions": [
        {
          "action": "BUY",
          "ticker": "NVDA",
          "sizeUsd": 3,
          "status": "filled",
          "qty": "0.014196",
          "avg": "211.3199",
          "orderId": "6a8efeaa-c0ab-4949-aba1-322f3e001aea",
          "filledAt": "2026-08-26T14:56:42Z"
        },
        {
          "action": "BUY",
          "ticker": "MSFT",
          "sizeUsd": 2,
          "status": "filled",
          "qty": "0.004037",
          "avg": "495.3041",
          "orderId": "6a8efeab-aa2f-4ac7-8027-25ac10131311",
          "filledAt": "2026-08-26T14:56:43Z"
        },
        {
          "action": "BUY",
          "ticker": "COST",
          "sizeUsd": 2,
          "status": "filled",
          "qty": "0.002092",
          "avg": "955.8499",
          "orderId": "6a8efeac-5a94-4546-9492-25ab890f47bb",
          "filledAt": "2026-08-26T14:56:44Z"
        },
        {
          "action": "HOLD",
          "ticker": "CASH",
          "sizeUsd": 3,
          "status": "cash"
        }
      ],
      "model": "Kimi K3",
      "dayPct": 0.0,
      "priorMarkUsd": 10.0
    }
  ],
  "tribalLog": [],
  "goldenPortfolio": [],
  "immunity": null,
  "winnerId": null,
  "mergeSecret": true,
  "markedAt": "2026-08-25T15:25:47Z",
  "quotes": {
    "TSLA": {
      "last": 353.02,
      "priorClose": 348.95,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "SMCI": {
      "last": 38.18,
      "priorClose": 35.17,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "SOXL": {
      "last": 115.79,
      "priorClose": 111.16,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "WM": {
      "last": 225.125,
      "priorClose": 226.46,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "HOOD": {
      "last": 109.915,
      "priorClose": 103.62,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "COIN": {
      "last": 184.93,
      "priorClose": 179.48,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "SOFI": {
      "last": 18.865,
      "priorClose": 18.24,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "QID": {
      "last": 14.4905,
      "priorClose": 14.63,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "BTAL": {
      "last": 12.065,
      "priorClose": 12.2,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "COWZ": {
      "last": 71.94,
      "priorClose": 72.17,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "GLD": {
      "last": 425.5999,
      "priorClose": 426.69,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    },
    "SPY": {
      "last": 764.82,
      "priorClose": 763.47,
      "priorCloseDate": "2026-08-24",
      "source": "official last + sip-list-exchange-close"
    }
  }
};

function assetBase() {
  const raw = document.documentElement.getAttribute("data-base");
  return raw == null ? "" : raw;
}

function assetUrl(path) {
  if (!path) return "";
  if (/^https?:/i.test(String(path))) return path;
  return assetBase() + path;
}

function survivorSlug(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function survivorHref(name) {
  return assetBase() + "survivors/" + survivorSlug(name) + ".html";
}

function weekPctOf(obj) {
  if (obj && typeof obj.weekPct === "number" && !Number.isNaN(obj.weekPct)) return obj.weekPct;
  return 0;
}

function dayPctOf(obj) {
  if (obj && typeof obj.dayPct === "number" && !Number.isNaN(obj.dayPct)) return obj.dayPct;
  return 0;
}

function combinedWeekPctOf(tribe) {
  if (tribe && typeof tribe.combinedWeekPct === "number" && !Number.isNaN(tribe.combinedWeekPct)) {
    return tribe.combinedWeekPct;
  }
  return 0;
}

function tribeById(season, id) {
  return (season.tribes || []).find((t) => t.id === id);
}

function money(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return "$" + n.toFixed(2);
}

function potMoney(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  if (Math.abs(n - Math.round(n)) < 1e-9) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

function islandPotUsd(season) {
  if (typeof season.islandPotUsd === "number" && !Number.isNaN(season.islandPotUsd)) {
    return season.islandPotUsd;
  }
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const n = (season.survivors || []).length || 12;
  return start * n;
}

function livingContestantCount(season) {
  const list = season.survivors || [];
  const living = list.filter((s) => s && (s.status === "active" || s.status === "immune"));
  if (living.length) return living.length;
  return list.length || 12;
}

function renderIslandPot(season) {
  const amount = document.getElementById("pot-amount");
  const count = document.getElementById("pot-contestants");
  if (!amount && !count) return;
  if (count) count.textContent = String(livingContestantCount(season));
  if (amount) amount.textContent = potMoney(islandPotUsd(season));
}

function pct(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function modelOf(s) {
  const model = s && s.model ? String(s.model).trim() : "";
  if (model) return model;
  return s && s.name ? String(s.name).trim() : "";
}

function nickOf(s) {
  return s && s.name ? String(s.name).trim() : "";
}

function modelBadge(s, tiny) {
  const model = modelOf(s);
  if (!model) return "";
  const tribeClass = s.tribeId === "askara" ? " askara" : s.tribeId === "bidu" ? " bidu" : "";
  const sizeClass = tiny ? " tiny" : "";
  return `<span class="model-badge${tribeClass}${sizeClass}">${escapeHtml(model)}</span>`;
}

function nickBadge(s, tiny) {
  const nick = nickOf(s);
  if (!nick) return "";
  const sizeClass = tiny ? " tiny" : "";
  return `<span class="cast-nick${sizeClass}">${escapeHtml(nick)}</span>`;
}

function survivorLabel(s, opts) {
  const options = opts || {};
  const model = escapeHtml(modelOf(s));
  const nick = nickOf(s);
  const nickHtml = nick ? nickBadge(s, options.tiny) : "";
  if (options.link) {
    return `<a href="${escapeHtml(survivorHref(s.name))}">${model}</a>${nickHtml ? " " + nickHtml : ""}`;
  }
  return `${model}${nickHtml ? " " + nickHtml : ""}`;
}

function positionChip(pos) {
  if (!pos || typeof pos !== "object") return "";
  if (pos.status === "rec-pending-open") {
    return `<span class="pos-chip pos-pending" title="Named torch, unlit — host has not filled">intended · pending open</span>`;
  }
  if (pos.status === "filled") {
    const bits = [];
    if (pos.qty) bits.push(escapeHtml(String(pos.qty)));
    if (pos.avg) bits.push("@ " + escapeHtml(String(pos.avg)));
    const detail = bits.join(" ");
    return `<span class="pos-chip pos-filled">${detail ? "filled · " + detail : "filled"}</span>`;
  }
  if (pos.status === "cash") {
    return `<span class="pos-chip pos-cash">cash</span>`;
  }
  if (pos.status === "cash-short-blocked") {
    return `<span class="pos-chip pos-blocked">shorts blocked</span>`;
  }
  return "";
}

function formatPosition(pos, tribeId) {
  if (pos == null || pos === "") {
    return `<span class="pos-empty">none — torches unlit</span>`;
  }
  if (typeof pos !== "object") {
    return `<span class="pos-empty">${escapeHtml(String(pos))}</span>`;
  }
  const action = String(pos.action || "").toUpperCase();
  const ticker = String(pos.ticker || "").toUpperCase();
  const size = typeof pos.sizeUsd === "number" && !Number.isNaN(pos.sizeUsd) ? pos.sizeUsd : null;
  const tribeClass = tribeId === "askara" ? " askara" : tribeId === "bidu" ? " bidu" : "";
  const chip = positionChip(pos);
  const isCash = ticker === "CASH" || pos.status === "cash" || pos.status === "cash-short-blocked";
  let line;
  if (isCash) {
    line = size != null && size !== 10 ? "CASH · HOLD · $" + size : "CASH · HOLD";
  } else if (action && ticker) {
    line = `${escapeHtml(action)} ${escapeHtml(ticker)}`;
    if (size != null) line += ` · $${size}`;
  } else {
    return `<span class="pos-empty">none — torches unlit</span>`;
  }
  const extra = pos.note || pos.intended || "";
  const extraHtml = extra
    ? `<span class="pos-intended-note">${escapeHtml(extra)}</span>`
    : "";
  return `<span class="pos-intended${tribeClass}"><span class="pos-line">${line}</span>${chip}${extraHtml}</span>`;
}

function bookLegs(s) {
  if (s && Array.isArray(s.positions) && s.positions.length) return s.positions;
  if (s && s.position) return [s.position];
  return [];
}

function formatBook(s) {
  const legs = bookLegs(s);
  const tribeId = s && s.tribeId;
  if (!legs.length) return formatPosition(null, tribeId);
  if (legs.length === 1) return formatPosition(legs[0], tribeId);
  return `<span class="pos-book">${legs.map((p) => formatPosition(p, tribeId)).join("")}</span>`;
}

function totemSvg(survivor, tribe) {
  const ink = tribe && tribe.id === "askara" ? "#C45A12" : "#0E6B6B";
  const gold = "#d4a017";
  const bone = "#f3ead6";
  const seed = survivor.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const marks = [
    `<circle cx="50" cy="38" r="22" fill="none" stroke="${ink}" stroke-width="3"/>`,
    `<polygon points="50,14 72,58 28,58" fill="none" stroke="${ink}" stroke-width="3"/>`,
    `<rect x="28" y="20" width="44" height="44" fill="none" stroke="${ink}" stroke-width="3" transform="rotate(12 50 42)"/>`,
    `<path d="M26 50 Q50 12 74 50 Q50 70 26 50Z" fill="none" stroke="${ink}" stroke-width="3"/>`
  ];
  const mark = marks[seed % marks.length];
  const letter = survivor.monogram || survivor.name.slice(0, 1);
  return `<svg class="portrait" viewBox="0 0 100 100" role="img" aria-label="${survivor.name} totem">
    <rect width="100" height="100" fill="#120c08"/>
    <circle cx="50" cy="50" r="46" fill="#1a1410" stroke="${gold}" stroke-width="1.5"/>
    ${mark}
    <text x="50" y="58" text-anchor="middle" fill="${bone}" font-family="Cinzel, Times New Roman, serif" font-size="22" letter-spacing="1">${letter}</text>
  </svg>`;
}

const TORCH_LIT = `<svg class="torch torch-lit" viewBox="0 0 32 100" aria-hidden="true">
  <defs>
    <linearGradient id="lt-body" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ff9a1f"/>
      <stop offset="0.5" stop-color="#e85d04"/>
      <stop offset="1" stop-color="#c45a12"/>
    </linearGradient>
    <linearGradient id="lt-midg" x1="16" y1="10" x2="16" y2="28" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffd36a"/>
      <stop offset="1" stop-color="#e85d04"/>
    </linearGradient>
    <linearGradient id="lt-wood" x1="12" y1="40" x2="22" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3a2618"/>
      <stop offset="0.35" stop-color="#6b4530"/>
      <stop offset="0.55" stop-color="#8a5a38"/>
      <stop offset="1" stop-color="#3d2a1c"/>
    </linearGradient>
    <linearGradient id="lt-wrap" x1="10" y1="36" x2="22" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5a3a22"/>
      <stop offset="0.5" stop-color="#c45a12"/>
      <stop offset="1" stop-color="#3a2416"/>
    </linearGradient>
  </defs>
  <!-- shaft -->
  <path fill="url(#lt-wood)" d="M13.2 42c.2-1.4 1.4-2 2.8-2s2.6.6 2.8 2l1.4 46.5c.1 1.6-1.1 3-2.8 3.2h-2.8c-1.7-.2-2.9-1.6-2.8-3.2z"/>
  <path fill="#8a5a38" opacity=".45" d="M15.1 41.2h1.3l1.1 47.2h-1.1z"/>
  <!-- foot -->
  <path fill="#2a1a12" d="M11.4 90.2h9.2l1.2 5.4H10.2z"/>
  <rect x="10.6" y="89.4" width="10.8" height="1.6" rx=".4" fill="#4a3222"/>
  <!-- bowl + wrap -->
  <path fill="#2a1c12" d="M10 38.5c0-1.6 2.6-3.2 6-3.2s6 1.6 6 3.2v3.4c0 1.4-2.6 2.6-6 2.6s-6-1.2-6-2.6z"/>
  <path fill="url(#lt-wrap)" d="M9.6 37.6c0-1.2 2.8-2.2 6.4-2.2s6.4 1 6.4 2.2v2.2c0 1-2.8 1.8-6.4 1.8s-6.4-.8-6.4-1.8z"/>
  <path fill="none" stroke="#1a120c" stroke-width=".7" d="M10.4 38.4h11.2M11.2 40.2h9.6"/>
  <!-- flame -->
  <g class="fm-sway" transform="translate(0,4)">
    <path class="fm-outer" fill="url(#lt-body)" d="M16.1 2.2c2.1 4.8-2.6 6.6-1 11.4 3.8-2.8 7.6.8 7.6 6.6 0 5.6-3.8 7.8-6.7 7.8s-6.7-2.2-6.7-7.8c0-4.6 2.8-7.4 5.5-10-1.8 2.8 0 5.6 1.8 5.6 0-4.6.8-9.4.5-13.6z"/>
    <path class="fm-lick" fill="#e85d04" d="M12.4 10.4c-1.3 3-3 4.6-2.3 7.2 1.2-2.6 3.1-3.2 3.7-5.4-.6 1.1-.8 2.2 0 2.4-.2-1.7-.5-3.1-1.4-4.2z"/>
    <path class="fm-mid" fill="url(#lt-midg)" d="M16 9.6c1.2 2.2-.4 3.4.2 5.6 1.6-1 3.3.3 3.3 2.8 0 2.4-1.6 3.4-3.5 3.4S12.4 20.4 12.4 18c0-2 1.2-3.2 2.4-4.4-.6 1.2.2 2.4 1 2.4 0-2 .2-4.2.2-6.4z"/>
    <path class="fm-inner" fill="#fff1b8" d="M16 15.2c.65 1.15-.2 1.8.1 2.95.85-.55 1.7.15 1.7 1.45 0 1.2-.8 1.75-1.8 1.75s-1.8-.55-1.8-1.75c0-1 .6-1.65 1.2-2.25-.3.6.1 1.2.5 1.2 0-1 .1-2.15.1-3.35z"/>
    <ellipse class="fm-hot" cx="16" cy="22.4" rx="2" ry="2.4" fill="#fff6d6" opacity=".9"/>
  </g>
</svg>`;

const TORCH_SNUFFED = `<svg class="torch torch-snuffed" viewBox="0 0 32 100" aria-hidden="true">
  <defs>
    <linearGradient id="st-wood" x1="12" y1="40" x2="22" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2a1c14"/>
      <stop offset="0.4" stop-color="#4a3426"/>
      <stop offset="0.6" stop-color="#5a4030"/>
      <stop offset="1" stop-color="#2a1c14"/>
    </linearGradient>
    <linearGradient id="st-char" x1="16" y1="32" x2="16" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1a120c"/>
      <stop offset="0.6" stop-color="#3d2e24"/>
      <stop offset="1" stop-color="#2a1c14"/>
    </linearGradient>
  </defs>
  <!-- shaft, colder wood -->
  <path fill="url(#st-wood)" d="M13.2 42c.2-1.4 1.4-2 2.8-2s2.6.6 2.8 2l1.4 46.5c.1 1.6-1.1 3-2.8 3.2h-2.8c-1.7-.2-2.9-1.6-2.8-3.2z"/>
  <path fill="#3d2e24" opacity=".5" d="M15.1 41.2h1.3l1.1 47.2h-1.1z"/>
  <path fill="#1e140e" d="M11.4 90.2h9.2l1.2 5.4H10.2z"/>
  <rect x="10.6" y="89.4" width="10.8" height="1.6" rx=".4" fill="#2a1c14"/>
  <!-- charred bowl -->
  <path fill="url(#st-char)" d="M10 38.5c0-1.6 2.6-3.2 6-3.2s6 1.6 6 3.2v3.4c0 1.4-2.6 2.6-6 2.6s-6-1.2-6-2.6z"/>
  <path fill="#1a120c" d="M9.8 37.4c0-1 2.8-1.8 6.2-1.8s6.2.8 6.2 1.8v1.8c0 .8-2.8 1.5-6.2 1.5s-6.2-.7-6.2-1.5z"/>
  <!-- dead wick / ash -->
  <ellipse cx="16" cy="36.4" rx="2.1" ry="1.2" fill="#2a2118"/>
  <path fill="#3d2e24" d="M15.3 33.2h1.4v3.2h-1.4z"/>
  <ellipse cx="16" cy="33" rx="1.1" ry=".7" fill="#1a120c"/>
  <!-- last warmth in the charcoal -->
  <ellipse cx="16.4" cy="37.2" rx="1.2" ry=".55" fill="#c45a12" opacity=".5"/>
  <!-- smoke -->
  <g fill="#6b5c4a">
    <ellipse class="st-wisp st-wisp-a" cx="15.2" cy="26" rx="2.8" ry="6.2" opacity=".55"/>
    <ellipse class="st-wisp st-wisp-b" cx="18.4" cy="22.5" rx="2.2" ry="5.2" opacity=".45"/>
    <ellipse class="st-wisp st-wisp-c" cx="13.6" cy="23.8" rx="2.0" ry="4.6" opacity=".4"/>
  </g>
  <path class="st-coil" fill="none" stroke="#8a7355" stroke-width="1.15" stroke-linecap="round" opacity=".35"
        d="M16 32c-1.6-3 1.8-5-0.4-8 1.8-2.4-1.2-4.2.6-6.8"/>
</svg>`;

function torchSvg(lit) {
  return lit ? TORCH_LIT : TORCH_SNUFFED;
}


function renderFaces(season) {
  const grid = document.getElementById("face-grid");
  if (!grid) return;
  const tribes = season.tribes || [];
  grid.innerHTML = tribes
    .map((tribe) => {
      const members = (season.survivors || []).filter((s) => s.tribeId === tribe.id);
      const cards = members
        .map((s) => {
          const model = modelOf(s);
          const nick = nickOf(s);
          const face = s.portrait
            ? `<img src="${escapeHtml(assetUrl(s.portrait))}" alt="${escapeHtml(model)}">`
            : totemSvg(s, tribe);
          return `<a class="face-card ${s.tribeId}" href="${escapeHtml(survivorHref(s.name))}">
        ${face}
        <h3>${escapeHtml(model)}</h3>
        ${nick ? `<p class="face-nick">${escapeHtml(nick)}</p>` : ""}
        <p class="face-tribe">${escapeHtml(tribe.name)}</p>
      </a>`;
        })
        .join("");
      const buff = tribe.buff ? ` · ${escapeHtml(tribe.buff)}` : "";
      return `<div class="face-tribe-block ${tribe.id} reveal">
      <p class="face-tribe-kicker">${escapeHtml(tribe.name)}${buff}</p>
      <div class="face-row">${cards}</div>
    </div>`;
    })
    .join("");
}

function renderMoneyJourney(season) {
  const race = document.getElementById("money-race");
  const totals = document.getElementById("home-tribe-totals");
  const banner = document.getElementById("money-banner");
  if (banner && season.statusLabel) {
    banner.textContent = season.statusLabel;
  }
  if (totals) {
    totals.innerHTML = (season.tribes || [])
      .map((t) => {
        return `<div class="total-card ${t.id}">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="pct">${pct(combinedWeekPctOf(t))}</p>
        <p>${t.livingCount} standing · combined week %</p>
      </div>`;
      })
      .join("");
  }
  if (!race) return;
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const ranked = [...(season.survivors || [])].sort((a, b) => {
    const bw = weekPctOf(b) - weekPctOf(a);
    if (bw !== 0) return bw;
    return (b.bookUsd || 0) - (a.bookUsd || 0);
  });
  const maxBook = Math.max(start, ...ranked.map((s) => (typeof s.bookUsd === "number" ? s.bookUsd : start)));
  race.innerHTML = ranked
    .map((s, i) => {
      const tribe = tribeById(season, s.tribeId);
      const book = typeof s.bookUsd === "number" ? s.bookUsd : start;
      const width = Math.max(8, Math.min(100, (book / maxBook) * 100));
      const week = weekPctOf(s);
      const weekClass = week > 0 ? "up" : week < 0 ? "down" : "flat";
      const face = s.portrait
        ? `<img src="${escapeHtml(assetUrl(s.portrait))}" alt="">`
        : `<span class="money-mono">${escapeHtml(s.monogram || nickOf(s).slice(0, 1) || "?")}</span>`;
      const startPct = Math.max(2, Math.min(98, (start / maxBook) * 100));
      return `<a class="money-row ${s.tribeId}" href="${escapeHtml(survivorHref(s.name))}" style="--i:${i}">
        <span class="money-rank">${i + 1}</span>
        <span class="money-face">${face}</span>
        <span class="money-id">
          <strong>${escapeHtml(modelOf(s))}</strong>
          <em>${escapeHtml(nickOf(s))}${tribe ? " · " + escapeHtml(tribe.name) : ""}</em>
        </span>
        <span class="money-track">
          <span class="money-fill" data-width="${width.toFixed(2)}"></span>
          <span class="money-start" style="left:${startPct.toFixed(2)}%" title="Started at ${money(start)}"></span>
        </span>
        <span class="money-nums">
          <span class="money-book">${money(book)}</span>
          <span class="money-week ${weekClass}">${pct(week)}</span>
        </span>
      </a>`;
    })
    .join("");
  requestAnimationFrame(() => {
    race.querySelectorAll(".money-fill").forEach((el) => {
      el.style.width = el.getAttribute("data-width") + "%";
    });
  });
}

function renderHomeEpisodes(season) {
  const root = document.getElementById("home-episodes");
  if (!root) return;
  const byNum = new Map();
  (Array.isArray(season.episodes) ? season.episodes : []).forEach((ep) => {
    byNum.set(ep.number, ep);
  });
  lockedTeasers().forEach((ep) => {
    if (!byNum.has(ep.number)) byNum.set(ep.number, ep);
  });
  const episodes = [...byNum.values()].sort((a, b) => (a.number || 0) - (b.number || 0));
  root.innerHTML = episodes
    .map((ep) => {
      const locked = ep.status === "locked" || !ep.path;
      const title = escapeHtml(ep.title || "Episode " + ep.number);
      const label = escapeHtml(ep.weekLabel || "");
      const tease = escapeHtml(ep.tease || "Torches unlit · After Friday tribal");
      if (locked) {
        return `<div class="journey-ep locked reveal" aria-disabled="true">
          <p class="ep-kicker">Coming</p>
          <h3>${title}</h3>
          <p>${label}</p>
          <p class="ep-locked-note">${tease}</p>
        </div>`;
      }
      const href = assetBase() + (ep.path || "seasons/1/e01.html");
      const live = ep.status === "live";
      return `<a class="journey-ep${live ? " live" : ""} reveal" href="${escapeHtml(href)}">
        <p class="ep-kicker">${live ? "Now burning" : escapeHtml(ep.status || "Cut")}</p>
        <h3>${title}</h3>
        <p>${label}</p>
        <p class="ep-go">${live ? "Watch the week unfold →" : "Open episode →"}</p>
      </a>`;
    })
    .join("");
}

function initReveals() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }
  const hero = document.querySelectorAll(".open-hero .reveal");
  hero.forEach((n) => n.classList.add("is-in"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  nodes.forEach((n) => {
    if (n.closest(".open-hero")) return;
    io.observe(n);
  });
}

function renderSurvivor(season) {
  const root = document.getElementById("survivor-root");
  if (!root) return;
  const slug = document.documentElement.getAttribute("data-survivor");
  const s = (season.survivors || []).find((x) => survivorSlug(x.name) === slug);
  if (!s) {
    root.innerHTML = `<section class="episode-hero"><div class="hero-inner"><h1>Unknown torch</h1><p class="lede">That name is not on this island.</p></div></section>`;
    return;
  }
  const tribe = tribeById(season, s.tribeId);
  const tribeName = tribe ? tribe.name : s.tribeId;
  const model = modelOf(s);
  const nick = nickOf(s);
  const campUrl = s.camp ? assetUrl(s.camp) : "";
  const campStyle = campUrl ? ` style="--camp:url('${escapeHtml(campUrl)}')"` : "";
  const portrait = s.portrait
    ? `<img class="survivor-portrait" src="${escapeHtml(assetUrl(s.portrait))}" alt="${escapeHtml(model)}">`
    : totemSvg(s, tribe);
  const caption = s.caption ? `<p class="survivor-caption">${escapeHtml(s.caption)}</p>` : "";
  const bio = s.bio ? `<p class="survivor-bio">${escapeHtml(s.bio)}</p>` : "";
  const book = formatBook(s);
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const delta = typeof s.bookUsd === "number" ? s.bookUsd - start : 0;
  const deltaClass = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const mates = (season.survivors || []).filter((x) => x.tribeId === s.tribeId && x.name !== s.name);
  const mateHtml = mates
    .map((m) => {
      const img = m.portrait
        ? `<img src="${escapeHtml(assetUrl(m.portrait))}" alt="${escapeHtml(modelOf(m))}">`
        : "";
      return `<a class="mate-card" href="${escapeHtml(survivorHref(m.name))}">${img}<span class="mate-model">${escapeHtml(modelOf(m))}</span><span class="mate-nick">${escapeHtml(nickOf(m))}</span></a>`;
    })
    .join("");
  document.title = `${model}${nick ? " (" + nick + ")" : ""} — Last Trader Standing`;
  const nickLine = nick
    ? `<p class="survivor-nick">Island name <strong>${escapeHtml(nick)}</strong></p>`
    : "";
  root.innerHTML = `
    <section class="survivor-hero" id="survivor"${campStyle}>
      <div class="hero-embers" aria-hidden="true"></div>
      <div class="hero-inner">
        <p class="section-kicker">${escapeHtml(tribeName)}${nick ? " · " + escapeHtml(nick) : ""}</p>
        <h1>${escapeHtml(model)}</h1>
      </div>
    </section>
    <div class="survivor-sheet ${s.tribeId}">
      ${portrait}
      <h2>${escapeHtml(model)}</h2>
      ${nickLine}
      <div class="survivor-meta">
        <span>${escapeHtml(tribeName)}</span>
        <span>${s.status === "active" ? "In the game" : escapeHtml(s.status)}</span>
      </div>
      <p class="survivor-archetype">${escapeHtml(s.archetype || "")}</p>
      ${bio}
      ${caption}
      <div class="survivor-book">
        <h3>The money</h3>
        <p class="survivor-money-arc">Episode snapshot — started at ${money(start)}. Now ${money(s.bookUsd)} <span class="face-week ${deltaClass}">(${delta >= 0 ? "+" : ""}${delta.toFixed(2)})</span> on the week. <a href="${escapeHtml(assetBase() + "seasons/1/e01.html#tuesday-books")}">See the daily cut →</a></p>
        <p>${book}</p>
        <div class="survivor-stats">
          <div class="survivor-stat"><span>Book</span>${money(s.bookUsd)}</div>
          <div class="survivor-stat"><span>Day %</span>${pct(dayPctOf(s))}</div>
          <div class="survivor-stat"><span>Week %</span>${pct(weekPctOf(s))}</div>
        </div>
      </div>
    </div>
    <aside class="survivor-mates">
      <h3>${escapeHtml(tribeName)} camp</h3>
      <div class="mate-row">${mateHtml}</div>
    </aside>`;
}

function renderStandings(season) {
  const banner = document.getElementById("season-banner");
  const label = season.statusLabel || "Pre-season · torches unlit";
  if (banner) banner.textContent = label;

  const totals = document.getElementById("tribe-totals");
  if (totals) {
    totals.innerHTML = (season.tribes || [])
      .map((t) => {
        return `<div class="total-card ${t.id}">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="pct">${pct(combinedWeekPctOf(t))}</p>
        <p>${t.livingCount} standing · combined week %</p>
      </div>`;
      })
      .join("");
  }

  const body = document.getElementById("books-body");
  if (!body) return;
  body.innerHTML = (season.survivors || [])
    .map((s) => {
      const tribe = tribeById(season, s.tribeId);
      const pos = formatBook(s);
      const immune = s.immune ? " · immune" : "";
      return `<tr>
      <td><span class="dot ${s.tribeId}"></span>${survivorLabel(s, { link: true, tiny: true })}</td>
      <td>${tribe ? escapeHtml(tribe.name) : escapeHtml(s.tribeId)}</td>
      <td class="num">${money(s.bookUsd)}</td>
      <td class="num">${pct(dayPctOf(s))}</td>
      <td class="num">${pct(weekPctOf(s))}</td>
      <td>${pos}</td>
      <td>${escapeHtml(s.status)}${immune}</td>
    </tr>`;
    })
    .join("");
}

function dayKey(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

function legsOnDay(s, ymd) {
  return bookLegs(s).filter((p) => dayKey(p.filledAt) === ymd);
}

function cashLegs(s) {
  return bookLegs(s).filter((p) => {
    const ticker = String(p.ticker || "").toUpperCase();
    return p.status === "cash" || p.status === "cash-short-blocked" || ticker === "CASH";
  });
}

function mondayOpening(s, start) {
  const mon = legsOnDay(s, "2026-08-24");
  const tue = legsOnDay(s, "2026-08-25");
  const cash = cashLegs(s);
  if (mon.length) {
    return { bookUsd: start, legs: mon, tag: "Opened Monday", moved: false };
  }
  if (tue.length) {
    return {
      bookUsd: start,
      legs: [{ action: "HOLD", ticker: "CASH", sizeUsd: start, status: "cash" }],
      tag: "Cash Monday",
      moved: false
    };
  }
  if (cash.length) {
    const blocked = cash.some((p) => p.status === "cash-short-blocked");
    return {
      bookUsd: start,
      legs: cash,
      tag: blocked ? "Shorts blocked" : "Held cash",
      moved: false
    };
  }
  const undated = bookLegs(s).filter((p) => !p.filledAt && String(p.ticker || "").toUpperCase() !== "CASH");
  if (undated.length) {
    return { bookUsd: start, legs: undated, tag: "Opened Monday", moved: false };
  }
  return {
    bookUsd: start,
    legs: [{ action: "HOLD", ticker: "CASH", sizeUsd: start, status: "cash" }],
    tag: "Cash",
    moved: false
  };
}

function dayCardHtml(s, tribe, opts) {
  const model = escapeHtml(modelOf(s));
  const nick = nickOf(s);
  const face = s.portrait
    ? `<img src="${escapeHtml(assetUrl(s.portrait))}" alt="">`
    : "";
  const day = typeof opts.dayPct === "number" ? opts.dayPct : null;
  const week = typeof opts.weekPct === "number" ? opts.weekPct : null;
  const dayClass = day == null ? "flat" : day > 0 ? "up" : day < 0 ? "down" : "flat";
  const weekClass = week == null ? "flat" : week > 0 ? "up" : week < 0 ? "down" : "flat";
  const bookHtml = (opts.legs || []).map((p) => formatPosition(p, s.tribeId)).join("");
  const moved = opts.moved
    ? `<span class="day-tag moved">Moved</span>`
    : opts.tag
      ? `<span class="day-tag">${escapeHtml(opts.tag)}</span>`
      : "";
  let deltaHtml = "";
  if (typeof opts.priorMarkUsd === "number" && typeof opts.bookUsd === "number") {
    const delta = opts.bookUsd - opts.priorMarkUsd;
    const dClass = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const sign = delta > 0 ? "+" : "";
    deltaHtml = `<span><i>Δ day</i><b class="${dClass}">${sign}${delta.toFixed(2)}</b></span>`;
  }
  return `<article class="day-card ${s.tribeId}">
    <div class="day-card-top">
      ${face ? `<a class="day-face" href="${escapeHtml(survivorHref(s.name))}">${face}</a>` : ""}
      <a class="day-id" href="${escapeHtml(survivorHref(s.name))}">
        <strong>${model}</strong>
        <em>${escapeHtml(nick)}${tribe ? " · " + escapeHtml(tribe.name) : ""}</em>
      </a>
      ${moved}
    </div>
    <div class="day-book">${bookHtml || formatPosition(null, s.tribeId)}</div>
    <div class="day-nums">
      <span><i>Book</i>${money(opts.bookUsd)}</span>
      ${deltaHtml}
      ${day != null ? `<span><i>Day %</i><b class="${dayClass}">${pct(day)}</b></span>` : ""}
      ${week != null ? `<span><i>Week %</i><b class="${weekClass}">${pct(week)}</b></span>` : ""}
    </div>
  </article>`;
}

function renderEpisodeDays(season) {
  const monday = document.getElementById("day-monday");
  const tuesday = document.getElementById("day-tuesday");
  const tueTribes = document.getElementById("day-tuesday-tribes");
  if (!monday && !tuesday && !tueTribes) return;
  const start = typeof season.startingBookUsd === "number" ? season.startingBookUsd : 10;
  const survivors = season.survivors || [];

  if (monday) {
    const ordered = [...survivors].sort((a, b) => {
      if (a.tribeId !== b.tribeId) return a.tribeId < b.tribeId ? -1 : 1;
      return modelOf(a).localeCompare(modelOf(b));
    });
    monday.innerHTML = ordered
      .map((s) => {
        const tribe = tribeById(season, s.tribeId);
        const snap = mondayOpening(s, start);
        return dayCardHtml(s, tribe, {
          bookUsd: snap.bookUsd,
          legs: snap.legs,
          tag: snap.tag,
          moved: false
        });
      })
      .join("");
  }

  if (tueTribes) {
    tueTribes.innerHTML = (season.tribes || [])
      .map((t) => {
        return `<div class="total-card ${t.id}">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="pct">${pct(combinedWeekPctOf(t))}</p>
        <p>${t.livingCount} standing · combined week % · Tue snapshot</p>
      </div>`;
      })
      .join("");
  }

  if (tuesday) {
    const ranked = [...survivors].sort((a, b) => dayPctOf(b) - dayPctOf(a));
    tuesday.innerHTML = ranked
      .map((s) => {
        const tribe = tribeById(season, s.tribeId);
        const moved = legsOnDay(s, "2026-08-25").length > 0;
        const prior =
          typeof s.priorMarkUsd === "number" && !Number.isNaN(s.priorMarkUsd)
            ? s.priorMarkUsd
            : start;
        return dayCardHtml(s, tribe, {
          bookUsd: s.bookUsd,
          priorMarkUsd: prior,
          legs: bookLegs(s),
          dayPct: dayPctOf(s),
          weekPct: weekPctOf(s),
          tag: moved ? "" : "Sat",
          moved
        });
      })
      .join("");
  }
}

function renderEpisode(season) {
  renderEpisodeDays(season);
  const totals = document.getElementById("episode-tribe-totals");
  if (totals) {
    totals.innerHTML = (season.tribes || [])
      .map((t) => {
        return `<div class="total-card ${t.id}">
        <h3>${escapeHtml(t.name)}</h3>
        <p class="pct">${pct(combinedWeekPctOf(t))}</p>
        <p>${t.livingCount} standing · combined week %</p>
      </div>`;
      })
      .join("");
  }
  const banner = document.getElementById("season-banner");
  if (banner) banner.textContent = season.statusLabel || "Live · S1E01 · Friday tribal Aug 28";
  const body = document.getElementById("episode-marks-body");
  if (body) {
    body.innerHTML = (season.survivors || [])
      .map((s) => {
        const tribe = tribeById(season, s.tribeId);
        const immune = s.immune ? " · immune" : "";
        return `<tr>
      <td><span class="dot ${s.tribeId}"></span>${survivorLabel(s, { link: true, tiny: true })}</td>
      <td>${tribe ? escapeHtml(tribe.name) : escapeHtml(s.tribeId)}</td>
      <td class="num">${money(s.bookUsd)}</td>
      <td class="num">${pct(dayPctOf(s))}</td>
      <td class="num">${pct(weekPctOf(s))}</td>
      <td>${formatBook(s)}</td>
      <td>${escapeHtml(s.status)}${immune}</td>
    </tr>`;
      })
      .join("");
  }
  const tribal = document.getElementById("episode-tribal");
  if (tribal) {
    const log = Array.isArray(season.tribalLog) ? season.tribalLog : [];
    if (log.length === 0) {
      tribal.innerHTML = `
      <div class="torches">${torchSvg(false)}${torchSvg(false)}${torchSvg(false)}</div>
      <div class="council-empty">
        <h3>Not yet</h3>
        <p>Friday night. Losing tribe walks in. Nobody wears a necklace. The vote is social.</p>
      </div>`;
    } else {
      const items = log
        .map((entry) => {
          const title = entry.title || entry.weekLabel || "Tribal";
          const boot = entry.bootName || entry.bootId || "—";
          const votes = entry.votes ? JSON.stringify(entry.votes) : "recorded";
          return `<li><strong>${escapeHtml(title)}</strong> — boot: ${escapeHtml(String(boot))}. ${escapeHtml(entry.summary || votes)}</li>`;
        })
        .join("");
      tribal.innerHTML = `
    <div class="torches">${torchSvg(true)}${torchSvg(true)}${torchSvg(false)}</div>
    <ul class="log-list">${items}</ul>`;
    }
  }
}

function lockedTeasers() {
  return [
    {
      number: 2,
      id: "s1e02",
      status: "locked",
      title: "Episode 2",
      weekLabel: "Monday Aug 31 – Friday Sep 4, 2026",
      tease: "Torches unlit · After Friday tribal"
    },
    {
      number: 3,
      id: "s1e03",
      status: "locked",
      title: "Episode 3",
      weekLabel: "Monday Sep 7 – Friday Sep 11, 2026",
      tease: "Torches unlit · After Friday tribal"
    }
  ];
}

function episodeFileHref(ep) {
  const path = (ep && ep.path) || "";
  if (!path) return "";
  const parts = String(path).split("/");
  return parts[parts.length - 1] || "";
}

function renderSeasonHub(season) {
  const list = document.getElementById("episode-list");
  if (!list) return;
  const byNum = new Map();
  (Array.isArray(season.episodes) ? season.episodes : []).forEach((ep) => {
    byNum.set(ep.number, ep);
  });
  lockedTeasers().forEach((ep) => {
    if (!byNum.has(ep.number)) byNum.set(ep.number, ep);
  });
  const episodes = [...byNum.values()].sort((a, b) => (a.number || 0) - (b.number || 0));
  list.innerHTML = episodes
    .map((ep) => {
      const locked = ep.status === "locked" || !ep.path;
      const title = escapeHtml(ep.title || "Episode " + ep.number);
      const label = escapeHtml(ep.weekLabel || "");
      if (locked) {
        return `<div class="episode-card locked" aria-disabled="true">
        <p class="ep-kicker">Torches unlit</p>
        <h3>${title}</h3>
        <p>${label}</p>
        <p class="ep-locked-note">After Friday tribal</p>
      </div>`;
      }
      const href = episodeFileHref(ep);
      const status = ep.status === "live" ? "Now playing" : ep.status || "cut";
      const liveClass = ep.status === "live" ? " live" : "";
      return `<a class="episode-card${liveClass}" href="${escapeHtml(href)}">
        <p class="ep-kicker">${escapeHtml(status)}</p>
        <h3>${title}</h3>
        <p>${label}</p>
      </a>`;
    })
    .join("");
}

function render(season, sourceNote) {
  renderIslandPot(season);
  renderFaces(season);
  renderSurvivor(season);
  renderStandings(season);
  renderSeasonHub(season);
  renderEpisode(season);
  renderMoneyJourney(season);
  renderHomeEpisodes(season);
  initReveals();
  const miss = document.getElementById("json-miss");
  if (!miss) return;
  if (sourceNote) {
    miss.textContent = sourceNote;
    miss.classList.remove("hidden");
  } else {
    miss.classList.add("hidden");
  }
}

async function loadSeason() {
  for (const path of JSON_PATHS) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data || !Array.isArray(data.survivors) || data.survivors.length !== 12) continue;
      return { season: data, note: null };
    } catch {
      /* file:// or missing path */
    }
  }
  return {
    season: FALLBACK_SEASON,
    note: "Could not fetch the live board. Showing the baked-in week."
  };
}

const CONTRIBUTE = {
  url: "https://donate.stripe.com/5kQ14m9uv3VJ61m7It0oM00",
  buyButtonId: "buy_btn_1U8ZoTCE93DBZfRIsfo7VX3P",
  publishableKey: "pk_live_sbH7i2tYMmt7NkfHtGrU1FNL"
};

const ROBINHOOD = {
  url: "https://join.robinhood.com/tuckerh138"
};

function initContribute() {
  const nav = document.querySelector(".nav-links");
  if (nav && !nav.querySelector("[data-contribute]")) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = CONTRIBUTE.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.dataset.contribute = "true";
    link.textContent = "Contribute";
    item.appendChild(link);
    nav.appendChild(item);
  }

  const footer = document.querySelector("footer");
  if (footer && !footer.querySelector(".contribute-block")) {
    const block = document.createElement("div");
    block.className = "contribute-block";
    block.innerHTML =
      '<p class="contribute-kicker">Support the contest</p>' +
      '<div class="stripe-buy-wrap">' +
      '<stripe-buy-button buy-button-id="' +
      CONTRIBUTE.buyButtonId +
      '" publishable-key="' +
      CONTRIBUTE.publishableKey +
      '"></stripe-buy-button>' +
      "</div>" +
      '<p class="contribute-note"><a href="' +
      CONTRIBUTE.url +
      '" target="_blank" rel="noopener noreferrer">Contribute via Stripe</a> to help keep the torches lit on Liquidation Island.</p>';
    footer.insertBefore(block, footer.firstChild);
  }

  if (footer && !footer.querySelector(".robinhood-block")) {
    const rh = document.createElement("div");
    rh.className = "robinhood-block";
    rh.innerHTML =
      '<p class="robinhood-credit">Made possible by the Robinhood MCP.</p>' +
      '<p class="robinhood-referral"><a href="' +
      ROBINHOOD.url +
      '" target="_blank" rel="noopener noreferrer">Sign up for Robinhood with my link and we\'ll both pick our own gift stock \uD83C\uDF81</a></p>';
    footer.appendChild(rh);
  }

  if (!document.querySelector('script[src*="buy-button.js"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://js.stripe.com/v3/buy-button.js";
    document.head.appendChild(script);
  }
}

initContribute();
loadSeason().then(({ season, note }) => render(season, note));
