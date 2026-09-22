S1E07 Tue Sep 22 2026 OPEN books remake (FILE LOCK + PR workflow). Model: composer-2.5.

## Goal
Publish living books for Last Trader Standing **Episode 7** on https://github.com/tuclaw/thisisgoingtobehuge.
Apply Tue open remake: orphan clears + contestant fills (~7:12–7:20 AM PT), marks from Robinhood last (~7:20 AM PT). Snapshot id `s1e07-tue-open`.

Audience only. Public names are pinned models. Always say "the Bidu tribe" / "the Askara tribe" in public copy. Comics paused. No confessionals. No merge headcount or date. Post-merge Latest Books: one cast, no Bidu/Askara combined week cards on the public board (tribe fields on marks may still exist in data).
Keep Live on **Episode 7** (not Episode 3/5/6). Tribal TODAY Tue Sep 22 2:00 PM PT.

## Attached artifacts (read these; do not invent)
- uploads/FILLS.json — verified orphan clears + sells/buys/holds
- uploads/BOOKS.after.json — post-fill living books
- uploads/REMAKE.json — snapshot marks, pot, immunity, standings
- uploads/SUMMARY.md — host summary
- uploads/season1.after-open.json — post-open canonical copy

Also sync workspace canonical if present: box path `/workspace/liquidation-island/season1.json` is already post-open remake. Prefer attached FILLS + REMAKE + BOOKS.after as source of truth for the PR.

## Real fills summary (Agentic ••••6969)
Orphan clears (not contestant books; already stripped overnight): FRO 0.218888 @ 48.32; STNG 0.469991 @ 83.71.
Sells: Sonnet STNG 0.087073; Composer TRMD 0.312908 + FRO 0.415760 + FRO 0.120457; Opus TRMD 0.469503.
Buys: Sonnet INTC $7; Composer INTC $36; Opus INTC $16.50.
HOLD-only: GPT-5.6 Terra (INTC+STNG); GPT-5.6 Luna (INTC).
hunt-brain 5/5. No skips/blocks. No buy scaling.

## Remake targets
- Snapshot `s1e07-tue-open`
- Immunity: GPT-5.6 Luna -0.02%
- Pot: $381.2286 · Given $361.93
- Quotes last: FRO 48.52 · STNG 84.065 · TRMD 35.28 · INTC 122.32 · VLO 383.62 · MPC 393.3 · GNRC 205.065 · USO 145.929 · XLE 62.295

## FILE LOCK + PR workflow
1. Pull latest main. Do not force-push.
2. Create branch `remake/s1e07-tue-open` (or similar).
3. Update season1 / site data / Episode 7 live pages from FILLS + REMAKE + BOOKS.after only — never invent prices, fills, or P&L.
4. Keep comics paused. Audience-facing only.
5. Open a PR into main with a clear summary of fills + standings table.
6. Do not touch non-island theme money or other episodes' live status.

## Standings (post remake)
- GPT-5.6 Luna (the Askara tribe): book $75.0100 · week -0.02% · day +0.31% · cash $21.9128 · INTC+CASH
- GPT-5.6 Terra (the Bidu tribe): book $79.9194 · week -1.10% · day +0.33% · cash $13.2412 · INTC+STNG+CASH
- Claude Opus 5 (the Bidu tribe): book $74.2539 · week -1.58% · day -1.01% · cash $32.5102 · INTC+CASH
- Claude Sonnet 5 (the Bidu tribe): book $75.6729 · week -2.04% · day -1.24% · cash $30.1491 · INTC+STNG+CASH
- Composer 2.5 (the Bidu tribe): book $76.3724 · week -5.23% · day -2.90% · cash $1.5991 · FRO+INTC+STNG+CASH

## Verified fills JSON
```json
{
  "session": "2026-09-22-open",
  "account": "\u2022\u2022\u2022\u20226969",
  "orphanClears": [
    {
      "who": "orphan (Composer mid FRO stripped)",
      "symbol": "FRO",
      "qty": "0.218888",
      "avg": "48.320000",
      "orderId": "6ab28cce-e294-438c-85c1-08ed8bfd57c1",
      "notional": 10.5767,
      "at": "2026-09-22T14:12:30.967Z",
      "pin": "open_lot_id b4cf0ac2-7aa2-5f9d-9ae9-898ff735e32d",
      "state": "filled"
    },
    {
      "who": "orphan (Terra STNG stripped)",
      "symbol": "STNG",
      "qty": "0.469991",
      "avg": "83.710000",
      "orderId": "6ab28cce-40f6-4fab-a782-c2122ee044cf",
      "notional": 39.3429,
      "at": "2026-09-22T14:12:30.811Z",
      "pin": "open_lot_id fc3a9b9c-841e-5194-a33a-b697456322f2",
      "state": "filled"
    }
  ],
  "orphanNotional": 49.9196,
  "sells": [
    {
      "who": "Claude Sonnet 5",
      "symbol": "STNG",
      "qty": "0.087073",
      "avg": "83.954800",
      "orderId": "6ab28e5b-9709-4046-add1-b6e04dd9a0e7",
      "notional": 7.3102,
      "at": "2026-09-22T14:19:07.384Z",
      "pin": "open_lot_id 555e297a-cdc9-5712-a942-c0153483e14c"
    },
    {
      "who": "Composer 2.5",
      "symbol": "TRMD",
      "qty": "0.312908",
      "avg": "35.250100",
      "orderId": "6ab28e5b-4602-415c-b944-a71b0d85609b",
      "notional": 11.03,
      "at": "2026-09-22T14:19:07.79Z",
      "pin": "open_lot_id d8431b78-38ca-524c-b0c8-99f679d036f8"
    },
    {
      "who": "Composer 2.5",
      "symbol": "FRO",
      "qty": "0.415760",
      "avg": "48.488000",
      "orderId": "6ab28e5d-a0ec-41ab-9973-f7a182afafb0",
      "notional": 20.1594,
      "at": "2026-09-22T14:19:09.238Z",
      "pin": "open_lot_id f21e3b97-7091-5fa9-b63b-f4dc80fa8c9c"
    },
    {
      "who": "Composer 2.5",
      "symbol": "FRO",
      "qty": "0.120457",
      "avg": "48.488000",
      "orderId": "6ab28e5e-db4c-4cc3-8a72-8300d57b5a3d",
      "notional": 5.8407,
      "at": "2026-09-22T14:19:10.921Z",
      "pin": "open_lot_id 15689f6d-1d5c-5403-b745-2392cea1ddc0"
    },
    {
      "who": "Claude Opus 5",
      "symbol": "TRMD",
      "qty": "0.469503",
      "avg": "35.250100",
      "orderId": "6ab28e5f-0cd3-4d95-86a0-3e9f15c24b36",
      "notional": 16.55,
      "at": "2026-09-22T14:19:11.325Z",
      "pin": "open_lot_id 267f041a-5196-5659-9b4b-002b57705d09"
    }
  ],
  "buys": [
    {
      "who": "Claude Sonnet 5",
      "symbol": "INTC",
      "qty": "0.057245",
      "avg": "122.279900",
      "orderId": "6ab28e7d-d399-4811-b51b-a811a0ee8cf4",
      "notional": 7.0,
      "at": "2026-09-22T14:19:41.536Z",
      "dollar": 7.0,
      "open_lot_id": "9025b5b0-71a7-5995-850f-2bb145644c78"
    },
    {
      "who": "Composer 2.5",
      "symbol": "INTC",
      "qty": "0.294478",
      "avg": "122.249900",
      "orderId": "6ab28e7e-5ed2-4df2-923f-6a002e39cdee",
      "notional": 36.0,
      "at": "2026-09-22T14:19:43.173Z",
      "dollar": 36.0,
      "open_lot_id": "f1d06f2c-437a-526c-ad4d-f4e00b0ef355"
    },
    {
      "who": "Claude Opus 5",
      "symbol": "INTC",
      "qty": "0.134954",
      "avg": "122.263000",
      "orderId": "6ab28e82-7e95-4851-94c0-07fae0ddaef7",
      "notional": 16.5,
      "at": "2026-09-22T14:19:46.501Z",
      "dollar": 16.5,
      "open_lot_id": "eb7511d9-15b8-5ee5-b646-47ccc73216b9"
    }
  ],
  "holds": [
    "GPT-5.6 Terra",
    "GPT-5.6 Luna"
  ],
  "skips": [],
  "bpAfterOrphans": 50.49,
  "bpAfterSells": 111.38,
  "bpAfterBuys": 51.88,
  "buyScaling": "none \u2014 BP after sells $111.38 covered $7+$36+$16.50"
}
```

## Remake JSON
```json
{
  "snapshotId": "s1e07-tue-open",
  "asOf": "2026-09-22T14:20:00Z",
  "asOfLabel": "Tue Sep 22 ~7:20 AM PT",
  "quotes": {
    "FRO": 48.52,
    "STNG": 84.065,
    "TRMD": 35.28,
    "INTC": 122.32,
    "VLO": 383.62,
    "MPC": 393.3,
    "GNRC": 205.065,
    "USO": 145.929,
    "XLE": 62.295
  },
  "quoteSource": "robinhood-last",
  "immunity": {
    "name": "GPT-5.6 Luna",
    "weekPct": -0.02,
    "basis": "Episode 7 weekPct vs priorMarkUsd (post-boot-split carry)",
    "note": "Tue Sep 22 open remake",
    "asOf": "2026-09-22-open",
    "survivorId": "aa75df67-9f84-45a3-9432-bee228d655f6",
    "at": "2026-09-22T14:20:00Z"
  },
  "islandPotUsd": 381.2286,
  "islandGivenUsd": 361.93,
  "standings": [
    {
      "name": "GPT-5.6 Luna",
      "tribeId": "askara",
      "book": 75.01,
      "week": -0.02,
      "day": 0.31,
      "cash": 21.9128,
      "legs": "INTC+CASH",
      "prior": 75.0242,
      "eod": 74.7755,
      "id": "aa75df67-9f84-45a3-9432-bee228d655f6",
      "tribe": "the Askara tribe"
    },
    {
      "name": "GPT-5.6 Terra",
      "tribeId": "bidu",
      "book": 79.9194,
      "week": -1.1,
      "day": 0.33,
      "cash": 13.2412,
      "legs": "INTC+STNG+CASH",
      "prior": 80.8045,
      "eod": 79.6569,
      "id": "254f76fc-2f1d-4f7d-a78d-e56a400d2684",
      "tribe": "the Bidu tribe"
    },
    {
      "name": "Claude Opus 5",
      "tribeId": "bidu",
      "book": 74.2539,
      "week": -1.58,
      "day": -1.01,
      "cash": 32.5102,
      "legs": "INTC+CASH",
      "prior": 75.4472,
      "eod": 75.0129,
      "id": "974a6b6c-af86-4001-a356-f7f05c803da9",
      "tribe": "the Bidu tribe"
    },
    {
      "name": "Claude Sonnet 5",
      "tribeId": "bidu",
      "book": 75.6729,
      "week": -2.04,
      "day": -1.24,
      "cash": 30.1491,
      "legs": "INTC+STNG+CASH",
      "prior": 77.2463,
      "eod": 76.6234,
      "id": "955a698c-6db0-4172-9e48-12f3724187b0",
      "tribe": "the Bidu tribe"
    },
    {
      "name": "Composer 2.5",
      "tribeId": "bidu",
      "book": 76.3724,
      "week": -5.23,
      "day": -2.9,
      "cash": 1.5991,
      "legs": "FRO+INTC+STNG+CASH",
      "prior": 80.5861,
      "eod": 78.6494,
      "id": "b1f6dd99-de69-44e0-a163-7b71eb19dfbf",
      "tribe": "the Bidu tribe"
    }
  ],
  "weekPctBasis": "vs Episode 7 priorMarkUsd (post-boot-split carry)",
  "dayPctBasis": "vs Mon SIP-EOD eodMarkUsd"
}
```

## Constraints
- Always "the Bidu tribe" / "the Askara tribe"
- Comics paused
- Audience only
- No merge headcount or merge date
- Keep Live on Episode 7
- Mask broker as ••••6969
- Do not invent fills/prices
