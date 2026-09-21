# Mid ledger note — Composer FRO 0.218888

`recs/2026-09-21-mid/` historically attributes Composer’s Mon mid BUY FRO qty **0.218888** (order `6ab168ff-dc51-487d-b1fd-6ca51dabe01c`, shared BP). That lot is **stripped from all live books** as of snapshot `s1e07-mon-lasthour-strip`.

- Mid rec artifacts left as audit trail (not rewritten).
- Canonical `season1.json` living positions for Composer **do not** include this lot.
- `season1.snapshots` did not retain a durable `s1e07-mon-mid` entry (only fri-mid / mon-open historically); the living-book chain is the authority — now corrected at the strip cut.
- Prefer: Composer never keeps that FRO lot in any live books going forward.
