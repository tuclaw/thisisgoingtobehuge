/* Last Trader Standing — torchlight UI. Reads season1.json; never invents marks. */

const FALLBACK_SEASON = {
  "show": "Last Trader Standing",
  "location": "Liquidation Island",
  "host": "Liquidation Island bot",
  "season": 1,
  "status": "live",
  "statusLabel": "Live · season started Mon Aug 24 · seven $10 buys filled · five cash",
  "started": true,
  "merged": false,
  "mergeAtRemaining": 9,
  "startingBookUsd": 10.0,
  "month": "2026-08",
  "monthLabel": "August 2026",
  "notes": "Season live morning of Mon Aug 24 PT. Seven $10 buys filled. Five books cash (Mara/Nori by rec; Vesper/Juno/Reed shorts blocked, no fractional short). Multiple names OK if the $10 book is not exceeded. Contestants do not see other books. monthPct 0 until marked to market. No invented P&L.",
  "tribes": [
    {
      "id": "bidu",
      "name": "Bidu",
      "buff": "ocean teal",
      "color": "#0E6B6B",
      "combinedMonthPct": 0.0,
      "livingCount": 6
    },
    {
      "id": "askara",
      "name": "Askara",
      "buff": "ember orange",
      "color": "#C45A12",
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
      ]
    },
    {
      "id": "955a698c-6db0-4172-9e48-12f3724187b0",
      "name": "Mara",
      "tribeId": "bidu",
      "archetype": "stubborn value",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    },
    {
      "id": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
      "name": "Hex",
      "tribeId": "bidu",
      "archetype": "options / convexity",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    },
    {
      "id": "974a6b6c-af86-4001-a356-f7f05c803da9",
      "name": "Vesper",
      "tribeId": "bidu",
      "archetype": "short seller, ice",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    },
    {
      "id": "6ab81cb1-5bc3-4dc3-af67-cab389f907eb",
      "name": "Nori",
      "tribeId": "bidu",
      "archetype": "risk first, cash is a position",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    },
    {
      "id": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
      "name": "Pax",
      "tribeId": "bidu",
      "archetype": "quality compounders",
      "status": "active",
      "bookUsd": 10.0,
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
          "filledAt": "2026-08-24T16:05:27Z"
        }
      ]
    },
    {
      "id": "63deb0ee-16ca-491d-8a62-2fbf955d8e9b",
      "name": "Riot",
      "tribeId": "askara",
      "archetype": "narrative + flow",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    },
    {
      "id": "f3382744-4512-410c-ab0c-d22ec35b22a0",
      "name": "Quill",
      "tribeId": "askara",
      "archetype": "quant / factors",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    },
    {
      "id": "6ff86687-5f96-40cb-84f4-a7282bce28af",
      "name": "Sable",
      "tribeId": "askara",
      "archetype": "macro / Fed",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    },
    {
      "id": "e6d9d407-e5e1-46c2-b767-07a51eb6a5fb",
      "name": "Kite",
      "tribeId": "askara",
      "archetype": "pure technicals",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    },
    {
      "id": "aa75df67-9f84-45a3-9432-bee228d655f6",
      "name": "Juno",
      "tribeId": "askara",
      "archetype": "catalysts / news",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    },
    {
      "id": "ea7f46b1-2068-4d81-b153-22faadfbc1cb",
      "name": "Reed",
      "tribeId": "askara",
      "archetype": "fade the crowd",
      "status": "active",
      "bookUsd": 10.0,
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
      ]
    }
  ],
  "tribalLog": [],
  "goldenPortfolio": [],
  "immunity": null,
  "winnerId": null
};

const JSON_PATHS = ["season1.json", "../season1.json"];

function tribeById(season, id) {
  return season.tribes.find((t) => t.id === id);
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

function hasIntendedRecs(season) {
  return (season.survivors || []).some((s) => {
    const pos = s.position;
    return pos && typeof pos === "object" && (pos.action || pos.ticker);
  });
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

function formatPositionBrief(pos, tribeId) {
  if (pos == null || pos === "" || typeof pos !== "object") return "";
  const action = String(pos.action || "").toUpperCase();
  const ticker = String(pos.ticker || "").toUpperCase();
  if (!action && !ticker) return "";
  const holdCash = action === "HOLD" || ticker === "CASH";
  const line = holdCash
    ? "CASH · HOLD"
    : `${escapeHtml(action)} ${escapeHtml(ticker)}`;
  const tribeClass = tribeId === "askara" ? " askara" : tribeId === "bidu" ? " bidu" : "";
  const chip = positionChip(pos);
  const intended = pos.intended
    ? `<span class="pos-intended-note">${escapeHtml(pos.intended)}</span>`
    : "";
  return `<p class="cast-intent pos-intended${tribeClass}"><span class="pos-line">${line}</span>${chip}${intended}</p>`;
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

function renderLandingNames(season) {
  const bidu = document.getElementById("bidu-names");
  const askara = document.getElementById("askara-names");
  bidu.innerHTML = "";
  askara.innerHTML = "";
  season.survivors.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s.name;
    (s.tribeId === "askara" ? askara : bidu).appendChild(li);
  });
}

function renderCast(season) {
  const grid = document.getElementById("cast-grid");
  grid.innerHTML = season.survivors
    .map((s) => {
      const tribe = tribeById(season, s.tribeId);
      const tribeName = tribe ? tribe.name : s.tribeId;
      const intent = formatPositionBrief(s.position, s.tribeId);
      const hasPortrait = Boolean(s.portrait);
      const hasCamp = Boolean(s.camp);
      const face = hasPortrait
        ? `<img class="portrait photo" src="${escapeHtml(s.portrait)}" alt="${escapeHtml(s.name)}">`
        : totemSvg(s, tribe);
      const caption = s.caption ? `<p class="cast-caption">${escapeHtml(s.caption)}</p>` : "";
      const bio = s.bio ? `<p class="cast-bio">${escapeHtml(s.bio)}</p>` : "";
      const artClass = hasPortrait || hasCamp ? " has-art" : "";
      const campStyle = hasCamp
        ? ` style="--camp:url('${escapeHtml(s.camp)}')"`
        : "";
      return `<article class="cast-card ${s.tribeId}${artClass}"${campStyle}>
        ${face}
        ${caption}
        <h3>${s.name}</h3>
        <p class="archetype">${s.archetype}</p>
        ${bio}
        ${intent}
        <div class="meta-row">
          <span>${tribeName}</span>
          <span>${s.status === "active" ? "In the game" : s.status}</span>
        </div>
      </article>`;
    })
    .join("");
}

function renderHero(season) {
  const note = document.getElementById("hero-note");
  if (!note) return;
  if (season.started) {
    note.textContent = season.notes || "Season 1 is live. Marks come only from recorded data.";
    return;
  }
  if (hasIntendedRecs(season)) {
    note.textContent =
      "Island books are funded at $10.00 even. Opening recs are intended positions pending host review — not fills. No marks. No invented P&L. Combined month percent stays 0.00 until real data.";
  } else {
    note.textContent =
      "Season 1 has not begun. The beach is quiet. Books sit at ten dollars even. No marks. No votes. The torches are not yet lit.";
  }
}

function renderStandings(season) {
  const banner = document.getElementById("season-banner");
  const pill = document.getElementById("status-pill");
  const label = season.statusLabel || "Pre-season · torches unlit";
  const intended = hasIntendedRecs(season);
  if (season.started) {
    banner.textContent = label;
  } else if (intended) {
    banner.textContent =
      label + " · every book $10.00 even · 0.00% until marks · intended recs pending host review";
  } else {
    banner.textContent = label + " · every book $10.00 · no positions · 0.00%";
  }
  pill.textContent = label;

  const totals = document.getElementById("tribe-totals");
  totals.innerHTML = season.tribes
    .map((t) => {
      return `<div class="total-card ${t.id}">
        <h3>${t.name}</h3>
        <p class="pct">${pct(t.combinedMonthPct)}</p>
        <p>${t.livingCount} standing · combined month %</p>
      </div>`;
    })
    .join("");

  const body = document.getElementById("books-body");
  const rows = season.survivors.map((s) => {
    const tribe = tribeById(season, s.tribeId);
    const pos = formatPosition(s.position, s.tribeId);
    const immune = s.immune ? " · immune" : "";
    return `<tr>
      <td><span class="dot ${s.tribeId}"></span>${s.name}</td>
      <td>${tribe ? tribe.name : s.tribeId}</td>
      <td class="num">${money(s.bookUsd)}</td>
      <td class="num">${pct(s.monthPct)}</td>
      <td>${pos}</td>
      <td>${s.status}${immune}</td>
    </tr>`;
  });
  body.innerHTML = rows.join("");
}

function renderCouncil(season) {
  const stage = document.getElementById("council-stage");
  const log = Array.isArray(season.tribalLog) ? season.tribalLog : [];
  if (log.length === 0) {
    stage.innerHTML = `
      <div class="torches">${torchSvg(false)}${torchSvg(false)}${torchSvg(false)}</div>
      <div class="council-empty">
        <h3>No council has been called</h3>
        <p>The urn is closed. The losing tribe has not walked in. Pre-merge, only the tribe with the worst combined month percent votes — and their best book cannot be snuffed.</p>
      </div>`;
    return;
  }
  const items = log
    .map((entry) => {
      const title = entry.title || `Month ${entry.month || "?"}`;
      const boot = entry.bootName || entry.bootId || "—";
      const votes = entry.votes ? JSON.stringify(entry.votes) : "recorded";
      return `<li><strong>${title}</strong> — boot: ${boot}. ${entry.summary || votes}</li>`;
    })
    .join("");
  stage.innerHTML = `
    <div class="torches">${torchSvg(true)}${torchSvg(true)}${torchSvg(false)}</div>
    <ul class="log-list">${items}</ul>`;
}

function renderGolden(season) {
  const throne = document.getElementById("throne");
  const winners = Array.isArray(season.goldenPortfolio) ? season.goldenPortfolio : [];
  if (!season.winnerId && winners.length === 0) {
    throne.innerHTML = `
      <svg viewBox="0 0 120 70" width="140" aria-hidden="true">
        <path d="M20 58h80L88 28H32z" fill="#1a120c" stroke="#d4a017" stroke-width="1.6"/>
        <rect x="14" y="58" width="92" height="6" fill="#d4a017"/>
        <circle cx="60" cy="22" r="10" fill="#120c08" stroke="#d4a017"/>
      </svg>
      <h3>The throne is empty</h3>
      <p>No trader has entered the golden portfolio. The winner of Season 1 will sit here forever.</p>`;
    return;
  }
  const names = winners
    .map((w) => `<li>${w.name || w.id}${w.season ? " · Season " + w.season : ""}</li>`)
    .join("");
  throne.innerHTML = `<h3>Inscribed forever</h3><ul class="winners">${names}</ul>`;
}

function render(season, sourceNote) {
  renderLandingNames(season);
  renderHero(season);
  renderCast(season);
  renderStandings(season);
  renderCouncil(season);
  renderGolden(season);
  const miss = document.getElementById("json-miss");
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
    note: "Could not fetch season1.json (open via a local server to live-reload). Showing the live-season fallback baked into the page — started, seven $10 fills, five cash, monthPct 0.00, no invented P&L."
  };
}

loadSeason().then(({ season, note }) => render(season, note));
