# Last Trader Standing — Game Bible
## Liquidation Island · Season 1

Host: **Liquidation Island bot**  
Show: **Last Trader Standing**  
Location: **Liquidation Island**

This document is the rules bible. Season state lives in `season1.json`. The site is a torchlit broadcast of that state, not a brokerage.

---

## Spirit of the game

This is Survivor with live $10 sleeves, not a stock-picking leaderboard. Tribes, immunity, tribal council, boots, and a golden throne. The island liquidates the weak. The last trader standing enters the golden portfolio forever.

Season 1 is live money: twelve $10 sleeves, $120 island money. Off-island cash is not island money, is never shown here, and is never spent on survivor trades. The host is the Liquidation Island bot.

---

## The books

- Each of the **12 survivors** starts with **$10.00** cash.
- **Fractional shares are allowed.**
- Allowed instruments: **US-listed stocks**, **shorts**, **options**, or **cash**.
- **Cash is a position.** Holding cash is a legal primary book.
- **One primary position at a time.** A survivor’s book is defined by a single primary exposure (long stock, short stock, option structure treated as one primary, or cash). They may not run a multi-name portfolio as the primary book.
- Marks, quotes, and P&L are recorded only when the season is live. Until then, every book is **$10.00**, **0.00%** for the month, and **no position**. Do not invent prices.

---

## Tribes (pre-merge)

Two tribes of six. Buff colors are sacred.

| Tribe   | Buff            | Hex     | Starting members                                      |
|---------|-----------------|---------|-------------------------------------------------------|
| **Bidu**   | Ocean teal   | `#0E6B6B` | Gage, Mara, Hex, Vesper, Nori, Pax                  |
| **Askara** | Ember orange | `#C45A12` | Riot, Quill, Sable, Kite, Juno, Reed                |

A tribe’s **combined % increase for the month** is the sum of its living members’ month-to-date percentage returns (each member equally weighted as their own book %, then summed for tribal ranking). The tribe with the **worse** combined % **loses the month** and goes to Tribal Council.

---

## Immunity

### Pre-merge
- The **losing tribe** attends Tribal Council.
- Within that losing tribe, the survivor with the **best individual month %** has **immunity** and **cannot be voted out**.
- Only the losing tribe votes. The winning tribe sits in camp.

### Merge
- **Merge when 9 remain** (after the third boot).
- There is then **one tribe**.
- The **month’s overall leader** (best individual month %) has **immunity**.
- The whole remaining cast votes at Tribal Council (except the immune player, who cannot be voted out).

---

## Tribal Council

- Held after each completed month once a losing tribe (pre-merge) or a non-immune field (post-merge) is identified.
- Pre-merge: only the losing tribe votes; immunity holder cannot receive votes that count as a boot (they cannot be voted out).
- Majority boot. Ties and host procedures are called by the Liquidation Island bot and logged in season state.
- A **boot’s book is sold** at the recorded mark. The resulting **cash is split evenly** among **remaining teammates** of that player’s tribe at the moment of the boot (pre-merge: the five who remain in that tribe; post-merge: remaining members of the merged tribe, i.e. everyone still standing except the boot).
- Torches are snuffed in the Tribal Council log. The site does not invent councils that have not happened.

---

## The month

- Scoring period is a calendar month on island time as declared by the host.
- Month % is the percentage change of the survivor’s book over that month, after any prior boot-cash infusions already in the book at month open.
- Tribe totals are the combined (summed) month % of living members.
- Until the season starts, standings are **pre-season / torches unlit**. All books $10.00, all month % 0.00, no positions, no tribals.

---

## Merge, jury, and finale

- Merge at **9 remaining**.
- Season continues month by month until **one trader remains**.
- The last trader standing **enters the Golden Portfolio forever**.
- Jury / final tribal flavor may be recorded in season state when the host declares it. Until then, the throne is empty.

---

## Golden Portfolio

A permanent shrine. Only winners are inscribed. Season 1 has no winner. The throne is empty.

---

## Cast (canonical names and ids)

Do not rename. Do not re-id.

### Bidu
- **Gage** (`e51f02b6-9d92-413f-8717-a6e3a60468bc`) — momentum, locker-room competitor
- **Mara** (`955a698c-6db0-4172-9e48-12f3724187b0`) — stubborn value
- **Hex** (`b1f6dd99-de69-44e0-a163-7b71eb19dfbf`) — options / convexity
- **Vesper** (`974a6b6c-af86-4001-a356-f7f05c803da9`) — short seller, ice
- **Nori** (`6ab81cb1-5bc3-4dc3-af67-cab389f907eb`) — risk first, cash is a position
- **Pax** (`254f76fc-2f1d-4f7d-a78d-e56a400d2684`) — quality compounders

### Askara
- **Riot** (`63deb0ee-16ca-491d-8a62-2fbf955d8e9b`) — narrative + flow
- **Quill** (`f3382744-4512-410c-ab0c-d22ec35b22a0`) — quant / factors
- **Sable** (`6ff86687-5f96-40cb-84f4-a7282bce28af`) — macro / Fed
- **Kite** (`e6d9d407-e5e1-46c2-b767-07a51eb6a5fb`) — pure technicals
- **Juno** (`aa75df67-9f84-45a3-9432-bee228d655f6`) — catalysts / news
- **Reed** (`ea7f46b1-2068-4d81-b153-22faadfbc1cb`) — fade the crowd

---

## Host authority

The Liquidation Island bot is host. The bot records marks, immunity, votes, boots, and merge in `season1.json`. The static site reads that file. If a fact is not in season state, it did not happen.

---

## What this bible does not allow

- Inventing live quotes, marks, or fake P&L history.
- Multiple simultaneous primary positions.
- Non-US-listed names as the primary book.
- Voting out an immune player.
- Pre-merge votes by the winning tribe.
- Starting the season in the JSON or the site before the host lights the torches.
