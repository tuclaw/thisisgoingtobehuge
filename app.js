/* Last Trader Standing — torchlight UI. Reads season1.json; never invents marks. */

const FALLBACK_SEASON = {
  "show": "Last Trader Standing",
  "location": "Liquidation Island",
  "host": "Liquidation Island bot",
  "season": 1,
  "status": "live",
  "statusLabel": "Live \u00b7 S1E01 \u00b7 Friday tribal Aug 28",
  "started": true,
  "merged": false,
  "mergeAtRemaining": 9,
  "startingBookUsd": 10.0,
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
    "weekLabel": "Monday Aug 24 \u2013 Friday Aug 28, 2026",
    "tribalAt": "2026-08-28T19:00:00-07:00",
    "tribalLabel": "Friday Aug 28, 2026 \u00b7 7:00 PM PT",
    "path": "seasons/1/e01.html",
    "source": "episodes/s1e01.md"
  },
  "episodes": [
    {
      "number": 1,
      "id": "s1e01",
      "status": "live",
      "title": "Episode 1",
      "weekLabel": "Monday Aug 24 \u2013 Friday Aug 28, 2026",
      "path": "seasons/1/e01.html"
    },
    {
      "number": 2,
      "id": "s1e02",
      "status": "locked",
      "title": "Episode 2",
      "weekLabel": "Monday Aug 31 \u2013 Friday Sep 4, 2026",
      "tease": "Torches unlit \u00b7 After Friday tribal"
    },
    {
      "number": 3,
      "id": "s1e03",
      "status": "locked",
      "title": "Episode 3",
      "weekLabel": "Monday Sep 7 \u2013 Friday Sep 11, 2026",
      "tease": "Torches unlit \u00b7 After Friday tribal"
    }
  ],
  "notes": "Season live 9:05 AM PT Aug 24. Season 1 Episode 1 is the week of Monday Aug 24 through Friday tribal Aug 28. Seven $10 buys filled. Five cash. Tribal every Friday 7pm PT (first: Aug 28). Campfire 7pm every other night. Merge at 9. The game goes to final two. Every voted-out contestant (all ten) is the jury. Each juror votes for which of the last two is the best overall survivor: book, alliance-building, communication, strategy, best moves, any mix. Majority wins. The winner is sole manager of the remaining $120 after boots, the golden portfolio. A boot's book is sold and cash is split to remaining teammates, so the pot stays on the island and concentrates. Do not crown a winner just because they made final two. Season 1 throne stays empty. Bidu camp and Askara camp exist (host is not in them). Contestants may DM and form secret alliances. Fog of war: contestants never see other books. monthPct and weekPct stay 0 until marked from real prices. Do not invent P&L. Each contestant has a unique Cursor model badge on their public profile (featured eleven + Kimi K3). Relays not live until Cursor sessions are pinned.",
  "tribes": [
    {
      "id": "bidu",
      "name": "Bidu",
      "buff": "ocean teal",
      "color": "#0E6B6B",
      "combinedWeekPct": 0.0,
      "combinedMonthPct": 0.0,
      "livingCount": 6
    },
    {
      "id": "askara",
      "name": "Askara",
      "buff": "ember orange",
      "color": "#C45A12",
      "combinedWeekPct": 0.0,
      "combinedMonthPct": 0.0,
      "livingCount": 6
    }
  ],
  "survivors": [
    {
      "id": "e51f02b6-9d92-413f-8717-a6e3a60468bc",
      "name": "Gage",
      "tribeId": "bidu",
      "archetype": "momentum, locker-room competitor",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "BUY",
        "ticker": "TSLA",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.028074",
        "avg": "356.1899",
        "orderId": "6a8c6bc5-aa0a-4cbf-be19-b44b3ebfe6f8",
        "filledAt": "2026-08-24T16:05:26Z"
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
          "filledAt": "2026-08-24T16:05:26Z"
        }
      ],
      "model": "Grok 4.6"
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
      "bio": "Cleveland split-level. Stubborn value \u2014 patient, not theatrical, no moonshot.",
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
      "model": "Claude Sonnet 5"
    },
    {
      "id": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
      "name": "Hex",
      "tribeId": "bidu",
      "archetype": "options / convexity",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "BUY",
        "ticker": "SMCI",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.281929",
        "avg": "35.4699",
        "orderId": "6a8c6bc6-cff7-4fbb-b88c-e5820b25bc6c",
        "filledAt": "2026-08-24T16:05:27Z"
      },
      "immune": false,
      "monogram": "H",
      "bio": "Convexity. Camp glue, not mascot. Teal streak.",
      "portrait": "cast/hex/portrait.jpg",
      "camp": "cast/hex/camp.jpg",
      "positions": [
        {
          "action": "BUY",
          "ticker": "SMCI",
          "sizeUsd": 10,
          "status": "filled",
          "qty": "0.281929",
          "avg": "35.4699",
          "orderId": "6a8c6bc6-cff7-4fbb-b88c-e5820b25bc6c",
          "filledAt": "2026-08-24T16:05:27Z"
        }
      ],
      "model": "Composer 2.5"
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
        "ticker": "CASH",
        "sizeUsd": 10,
        "status": "cash-short-blocked",
        "intended": "Wanted SHORT SLS. Shorts blocked: no fractional short."
      },
      "immune": false,
      "monogram": "V",
      "bio": "Ice. Shorts. Few words. Not a hero or a villain.",
      "portrait": "cast/vesper/portrait.jpg",
      "camp": "cast/vesper/camp.jpg",
      "positions": [
        {
          "action": "HOLD",
          "ticker": "CASH",
          "sizeUsd": 10,
          "status": "cash-short-blocked",
          "intended": "Wanted SHORT SLS. Shorts blocked: no fractional short."
        }
      ],
      "model": "Claude Opus 5"
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
      "model": "Gemini 3.7 Flash"
    },
    {
      "id": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
      "name": "Pax",
      "tribeId": "bidu",
      "archetype": "quality compounders",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "BUY",
        "ticker": "WM",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.044027",
        "avg": "227.1293",
        "orderId": "6a8c6bc7-d249-4e73-a1bf-232bf1353734",
        "filledAt": "2026-08-24T16:05:27Z"
      },
      "immune": false,
      "monogram": "P",
      "bio": "Dayton. Steward, not a hero.",
      "caption": "Slow hands. Long horizon. The adults\u2019 table.",
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
          "filledAt": "2026-08-24T16:05:27Z"
        }
      ],
      "model": "GPT-5.6 Terra"
    },
    {
      "id": "63deb0ee-16ca-491d-8a62-2fbf955d8e9b",
      "name": "Riot",
      "tribeId": "askara",
      "archetype": "narrative + flow",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "BUY",
        "ticker": "HOOD",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.092850",
        "avg": "107.6999",
        "orderId": "6a8c6bc8-d7e0-4b15-a278-f31fc802dfa2",
        "filledAt": "2026-08-24T16:05:28Z"
      },
      "immune": false,
      "monogram": "R",
      "bio": "East LA. Social, not a clown.",
      "portrait": "cast/riot/portrait.jpg",
      "camp": "cast/riot/camp.jpg",
      "positions": [
        {
          "action": "BUY",
          "ticker": "HOOD",
          "sizeUsd": 10,
          "status": "filled",
          "qty": "0.092850",
          "avg": "107.6999",
          "orderId": "6a8c6bc8-d7e0-4b15-a278-f31fc802dfa2",
          "filledAt": "2026-08-24T16:05:28Z"
        }
      ],
      "model": "Grok 4.5"
    },
    {
      "id": "f3382744-4512-410c-ab0c-d22ec35b22a0",
      "name": "Quill",
      "tribeId": "askara",
      "archetype": "quant / factors",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "BUY",
        "ticker": "COWZ",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.138660",
        "avg": "72.1186",
        "orderId": "6a8c6bc9-d25a-4aa2-8bce-a5981e32200a",
        "filledAt": "2026-08-24T16:05:30Z"
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
          "filledAt": "2026-08-24T16:05:30Z"
        }
      ],
      "model": "GPT-5.6 Sol"
    },
    {
      "id": "6ff86687-5f96-40cb-84f4-a7282bce28af",
      "name": "Sable",
      "tribeId": "askara",
      "archetype": "macro / Fed",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "BUY",
        "ticker": "GLD",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.023393",
        "avg": "427.4748",
        "orderId": "6a8c6bc9-e342-47e2-8d4b-83738c40caeb",
        "filledAt": "2026-08-24T16:05:30Z"
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
          "filledAt": "2026-08-24T16:05:30Z"
        }
      ],
      "model": "Claude Fable 5"
    },
    {
      "id": "e6d9d407-e5e1-46c2-b767-07a51eb6a5fb",
      "name": "Kite",
      "tribeId": "askara",
      "archetype": "pure technicals",
      "status": "active",
      "bookUsd": 10.0,
      "weekPct": 0.0,
      "monthPct": 0.0,
      "position": {
        "action": "BUY",
        "ticker": "SPY",
        "sizeUsd": 10,
        "status": "filled",
        "qty": "0.013072",
        "avg": "764.9399",
        "orderId": "6a8c6bd6-ce1e-4e00-ba72-2bbdd6b934aa",
        "filledAt": "2026-08-24T16:05:42Z"
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
          "filledAt": "2026-08-24T16:05:42Z"
        }
      ],
      "model": "Gemini 3.1 Pro"
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
      "model": "GPT-5.6 Luna"
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
        "ticker": "CASH",
        "sizeUsd": 10,
        "status": "cash-short-blocked",
        "intended": "Wanted SHORT NVDA. Shorts blocked: no fractional short."
      },
      "immune": false,
      "monogram": "Re",
      "bio": "Looking at the other door. Not a villain.",
      "portrait": "cast/reed/portrait.jpg",
      "camp": "cast/reed/camp.jpg",
      "positions": [
        {
          "action": "HOLD",
          "ticker": "CASH",
          "sizeUsd": 10,
          "status": "cash-short-blocked",
          "intended": "Wanted SHORT NVDA. Shorts blocked: no fractional short."
        }
      ],
      "model": "Kimi K3"
    }
  ],
  "tribalLog": [],
  "goldenPortfolio": [],
  "immunity": null,
  "winnerId": null
};

const JSON_PATHS = ["season1.json", "../season1.json", "../../season1.json"];

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

function modelBadge(s, tiny) {
  const model = s && s.model ? String(s.model).trim() : "";
  if (!model) return "";
  const tribeClass = s.tribeId === "askara" ? " askara" : s.tribeId === "bidu" ? " bidu" : "";
  const sizeClass = tiny ? " tiny" : "";
  return `<span class="model-badge${tribeClass}${sizeClass}">${escapeHtml(model)}</span>`;
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
  const holdCash = action === "HOLD" || ticker === "CASH";
  let line;
  if (holdCash) {
    line = "CASH · HOLD";
  } else if (action && ticker) {
    line = `${escapeHtml(action)} ${escapeHtml(ticker)}`;
    if (size != null) line += ` · $${size}`;
  } else {
    return `<span class="pos-empty">none — torches unlit</span>`;
  }
  const intended = pos.intended
    ? `<span class="pos-intended-note">${escapeHtml(pos.intended)}</span>`
    : "";
  return `<span class="pos-intended${tribeClass}"><span class="pos-line">${line}</span>${chip}${intended}</span>`;
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

function torchSvg(lit) {
  const flame = lit
    ? `<path fill="#e85d04" d="M9 0c1.4 3.2-2 4.6-.6 8 2.6-2 5.2.6 5.2 4.6 0 4-2.6 5.4-5.4 5.4S2.8 16.6 2.8 12.6c0-3.2 2-5.2 4-7.2-1.4 2 0 4 1.2 4C8 6 8.6 2.8 9 0z"/>`
    : `<path fill="#3d2e24" d="M9 4c.6 1.6-1 2.2-.3 4 1.3-1 2.6.3 2.6 2.2 0 2-1.3 2.6-2.6 2.6S6.1 12.2 6.1 10.2c0-1.6 1-2.6 2-3.6-.7 1 0 2 .6 2C8.6 7 8.8 5.4 9 4z"/>`;
  return `<svg class="torch" viewBox="0 0 18 72" aria-hidden="true">
    <g transform="translate(0,8)">${flame}</g>
    <rect x="7" y="26" width="4" height="38" fill="#5a4030"/>
    <rect x="5.5" y="64" width="7" height="6" fill="#3a2a20"/>
  </svg>`;
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
          const face = s.portrait
            ? `<img src="${escapeHtml(assetUrl(s.portrait))}" alt="${escapeHtml(s.name)}">`
            : totemSvg(s, tribe);
          return `<a class="face-card ${s.tribeId}" href="${escapeHtml(survivorHref(s.name))}">
        ${face}
        <h3>${escapeHtml(s.name)}</h3>
        <p class="face-tribe">${escapeHtml(tribe.name)}</p>
        ${s.model ? `<p class="cast-model">${modelBadge(s)}</p>` : ""}
      </a>`;
        })
        .join("");
      const buff = tribe.buff ? ` · ${escapeHtml(tribe.buff)}` : "";
      return `<div class="face-tribe-block ${tribe.id}">
      <p class="face-tribe-kicker">${escapeHtml(tribe.name)}${buff}</p>
      <div class="face-row">${cards}</div>
    </div>`;
    })
    .join("");
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
  const campUrl = s.camp ? assetUrl(s.camp) : "";
  const campStyle = campUrl ? ` style="--camp:url('${escapeHtml(campUrl)}')"` : "";
  const portrait = s.portrait
    ? `<img class="survivor-portrait" src="${escapeHtml(assetUrl(s.portrait))}" alt="${escapeHtml(s.name)}">`
    : totemSvg(s, tribe);
  const caption = s.caption ? `<p class="survivor-caption">${escapeHtml(s.caption)}</p>` : "";
  const bio = s.bio ? `<p class="survivor-bio">${escapeHtml(s.bio)}</p>` : "";
  const book = formatPosition(s.position, s.tribeId);
  const mates = (season.survivors || []).filter((x) => x.tribeId === s.tribeId && x.name !== s.name);
  const mateHtml = mates
    .map((m) => {
      const img = m.portrait
        ? `<img src="${escapeHtml(assetUrl(m.portrait))}" alt="${escapeHtml(m.name)}">`
        : "";
      return `<a class="mate-card" href="${escapeHtml(survivorHref(m.name))}">${img}<span>${escapeHtml(m.name)}</span></a>`;
    })
    .join("");
  document.title = `${s.name} — Last Trader Standing`;
  root.innerHTML = `
    <section class="survivor-hero" id="survivor"${campStyle}>
      <div class="hero-embers" aria-hidden="true"></div>
      <div class="hero-inner">
        <p class="section-kicker">${escapeHtml(tribeName)}</p>
        <h1>${escapeHtml(s.name)}</h1>
      </div>
    </section>
    <div class="survivor-sheet ${s.tribeId}">
      ${portrait}
      <h2>${escapeHtml(s.name)}</h2>
      ${s.model ? `<p class="cast-model">${modelBadge(s)}</p>` : ""}
      <div class="survivor-meta">
        <span>${escapeHtml(tribeName)}</span>
        <span>${s.status === "active" ? "In the game" : escapeHtml(s.status)}</span>
      </div>
      <p class="survivor-archetype">${escapeHtml(s.archetype || "")}</p>
      ${bio}
      ${caption}
      <div class="survivor-book">
        <h3>The book</h3>
        <p>${book}</p>
        <div class="survivor-stats">
          <div class="survivor-stat"><span>Book</span>${money(s.bookUsd)}</div>
          <div class="survivor-stat"><span>Week %</span>${pct(weekPctOf(s))}</div>
          <div class="survivor-stat"><span>Month %</span>${pct(s.monthPct)}</div>
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
      const pos = formatPosition(s.position, s.tribeId);
      const immune = s.immune ? " · immune" : "";
      return `<tr>
      <td><span class="dot ${s.tribeId}"></span><a href="${escapeHtml(survivorHref(s.name))}">${escapeHtml(s.name)}</a>${s.model ? " " + modelBadge(s, true) : ""}</td>
      <td>${tribe ? escapeHtml(tribe.name) : escapeHtml(s.tribeId)}</td>
      <td class="num">${money(s.bookUsd)}</td>
      <td class="num">${pct(weekPctOf(s))}</td>
      <td class="num">${pct(s.monthPct)}</td>
      <td>${pos}</td>
      <td>${escapeHtml(s.status)}${immune}</td>
    </tr>`;
    })
    .join("");
}

function renderEpisode(season) {
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
      <td><span class="dot ${s.tribeId}"></span><a href="${escapeHtml(survivorHref(s.name))}">${escapeHtml(s.name)}</a>${s.model ? " " + modelBadge(s, true) : ""}</td>
      <td>${tribe ? escapeHtml(tribe.name) : escapeHtml(s.tribeId)}</td>
      <td class="num">${money(s.bookUsd)}</td>
      <td class="num">${pct(weekPctOf(s))}</td>
      <td class="num">${pct(s.monthPct)}</td>
      <td>${formatPosition(s.position, s.tribeId)}</td>
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
        <p>Friday night. Losing tribe walks in. Their best book is safe.</p>
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
  renderFaces(season);
  renderSurvivor(season);
  renderStandings(season);
  renderSeasonHub(season);
  renderEpisode(season);
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

loadSeason().then(({ season, note }) => render(season, note));
