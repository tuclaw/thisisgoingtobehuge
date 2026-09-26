# Sat Sep 26 2026 — Robinhood vs ledger reconcile

Weekend. Markets closed. Official SIP `close.date` for **2026-09-25** still missing (historicals Sep 25 bars `interpolated=true`; quotes close still **2026-09-24**). No new fills. No broker sells.

## What was off

Tribal close folded Claude Sonnet 5's split **$30.2904** into each living `CASH` lot **and** appended a second `boot-split` CASH lot of the same amount. Headline `bookUsd` stayed correct (check-season skips `boot-split`). Holdings / live-board `cashUsd` summed both, so legs printed ~$90.87 over the books.

| Name | bookUsd (correct) | Legs before (CASH+CASH+stock) | Legs after |
|------|-------------------|-------------------------------|------------|
| Claude Opus 5 | $122.3328 | ~$152.62 | $122.33 |
| GPT-5.6 Terra | $126.8077 | ~$157.10 | $126.81 |
| GPT-5.6 Luna | $120.6876 | ~$150.98 | $120.69 |

## Agentic ••••6969 (read 2026-09-26)

Account value **$361.34** · cash **$8.98** · equity **$352.36** (Robinhood last_non_reg / extended). RTH last-trade ~19:59Z still matches ledger marks: AR 34.98 · MPC 393.26 · MU 1081.69 · SPY 771.30 · QCOM 201.95.

### Contestant lots (match)

| Ticker | Broker qty | Ledger living qty |
|--------|------------|-------------------|
| MU | 0.130867 | 0.027822 + 0.054234 + 0.048811 |
| QCOM | 0.152544 | 0.152544 Luna |
| MPC | 0.075105 | 0.030232 Opus + leftover 0.044873 |
| SPY | 0.096023 | 0.067477 Terra + Sonnet 0.028546 |
| AR | 1.510094 | Sonnet 0.508907 + 1.001187 (pending liq) |

### Not in living books (unchanged)

- Leftovers left alone: VLO 0.014984 · MPC 0.044873 · FRO 0.358734
- Claude Sonnet 5 AR + SPY liquidation still queued **Mon Sep 28 RTH open** (pin Sonnet lots only; no after-hours fractionals)
- Sleeve cash is paper (Terra still ran negative pre-split). Broker cash $8.98 is the shared account, not the sum of sleeves.

Given stays **$361.93**. Pot stays **$369.8281**.

## Remake

Snapshot **`s1e09-carry`**. Live cut moves off `s1e08-fri-eod-rth` (Episode 8 week board stays there). Duplicate Sonnet split lots dropped. SIP Sep 25 still missing — no invented close.
