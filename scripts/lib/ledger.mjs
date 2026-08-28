/** Season ledger: apply fills, mark books, derive the public board. */

export const LEGACY_SLUGS = {
  gage: "grok-4-6",
  mara: "claude-sonnet-5",
  hex: "composer-2-5",
  vesper: "claude-opus-5",
  nori: "gemini-3-7-flash",
  pax: "gpt-5-6-terra",
  riot: "grok-4-5",
  quill: "gpt-5-6-sol",
  sable: "claude-fable-5",
  kite: "gemini-3-1-pro",
  juno: "gpt-5-6-luna",
  reed: "kimi-k3"
};

export function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function round(n, digits = 4) {
  if (typeof n !== "number" || Number.isNaN(n)) return n;
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function pctRound(n) {
  return round(n, 2);
}

export function isCashLeg(pos) {
  if (!pos) return false;
  const ticker = String(pos.ticker || "").toUpperCase();
  return ticker === "CASH" || pos.status === "cash" || pos.status === "cash-short-blocked";
}

export function tickerOf(pos) {
  return String((pos && pos.ticker) || "")
    .toUpperCase()
    .split("/")[0]
    .trim();
}

function cashPosition(member, sizeUsd) {
  const pos = {
    action: "HOLD",
    ticker: "CASH",
    sizeUsd,
    status: member.cashStatus || "cash"
  };
  if (member.intended) pos.intended = member.intended;
  return pos;
}

function cloneLot(lot) {
  const copy = { ...lot };
  return copy;
}

export function emptyBook(member, startingBookUsd) {
  return {
    id: member.id,
    cashStatus: member.cashStatus || "cash",
    intended: member.intended || undefined,
    cash: startingBookUsd,
    lots: [],
    positions: [cashPosition(member, startingBookUsd)],
    bookUsd: startingBookUsd,
    weekPct: 0,
    monthPct: 0,
    dayPct: 0,
    priorMarkUsd: startingBookUsd
  };
}

function positionsFromLots(book, lots, cash, startingBookUsd) {
  const positions = lots.map(cloneLot);
  if (!positions.length) {
    return [cashPosition(book, startingBookUsd)];
  }
  if (cash > 0.049) {
    const cashPos = {
      action: "HOLD",
      ticker: "CASH",
      sizeUsd: round(cash, 2),
      status: "cash"
    };
    if (book.cashNote) cashPos.note = book.cashNote;
    positions.push(cashPos);
  }
  return positions;
}

export function applyFill(book, fill, startingBookUsd) {
  const qty = parseFloat(fill.qty);
  const avg = parseFloat(fill.avg);
  const sizeUsd =
    typeof fill.sizeUsd === "number" && !Number.isNaN(fill.sizeUsd) ? fill.sizeUsd : qty * avg;
  const ticker = String(fill.ticker || "").toUpperCase();
  const lots = book.lots.map(cloneLot);
  let cash = book.cash;
  let cashNote = book.cashNote;

  if (fill.side === "buy") {
    cash = round(cash - sizeUsd, 4);
    const lot = {
      action: "BUY",
      ticker,
      sizeUsd,
      status: "filled",
      qty: String(fill.qty),
      avg: String(fill.avg)
    };
    if (fill.orderId) lot.orderId = fill.orderId;
    if (fill.at) lot.filledAt = fill.at;
    if (fill.note) lot.note = fill.note;
    lots.push(lot);
  } else if (fill.side === "sell") {
    const idx = lots.findIndex((lot) => tickerOf(lot) === ticker);
    cash = round(cash + sizeUsd, 4);
    if (idx >= 0) {
      const lot = lots[idx];
      const lotQty = parseFloat(lot.qty);
      const remain = round(lotQty - qty, 6);
      if (remain <= 1e-8) {
        lots.splice(idx, 1);
      } else {
        lot.qty = String(remain);
        lot.action = "HOLD";
        const soldUsd = Number.isFinite(sizeUsd) ? sizeUsd : (Number(lot.sizeUsd) || 0) * (qty / lotQty);
        lot.sizeUsd = round(Math.max(0, (Number(lot.sizeUsd) || 0) - soldUsd), 4);
        lot.note = fill.remainNote || `remainder after sell ${fill.qty} @ ${fill.avg}`;
      }
    }
    if (fill.cashNote) cashNote = fill.cashNote;
  }

  if (cash < 0 && cash > -0.05) cash = 0;

  return {
    ...book,
    cash,
    cashNote,
    lots,
    positions: positionsFromLots({ ...book, cashNote }, lots, cash, startingBookUsd)
  };
}

export function fillsThrough(events, throughAt) {
  const fills = (events || []).filter((event) => event && event.type === "fill");
  if (!throughAt) return fills.slice();
  const end = Date.parse(throughAt);
  return fills.filter((event) => {
    const at = Date.parse(event.at || "");
    return Number.isFinite(at) && at <= end;
  });
}

export function booksFromFills(cast, events, startingBookUsd, throughAt) {
  const books = new Map();
  for (const member of cast) {
    books.set(member.id, emptyBook(member, startingBookUsd));
  }
  for (const fill of fillsThrough(events, throughAt)) {
    const book = books.get(fill.survivorId);
    if (!book) continue;
    books.set(fill.survivorId, applyFill(book, fill, startingBookUsd));
  }
  return books;
}

function lastOf(pos, quotes) {
  if (typeof pos.last === "number") return pos.last;
  const quote = quotes && quotes[tickerOf(pos)];
  return quote && typeof quote.last === "number" ? quote.last : null;
}

export function markedEquity(pos, quotes) {
  if (isCashLeg(pos) && typeof pos.sizeUsd === "number") return pos.sizeUsd;
  const qty = parseFloat(pos.qty);
  const last = lastOf(pos, quotes);
  if (Number.isFinite(qty) && last != null) return qty * last;
  return null;
}

export function markBook(book, quotes, opts = {}) {
  const starting = opts.startingBookUsd ?? 10;
  const recorded = opts.recorded || {};
  let equity = 0;
  let unmarked = false;
  const positions = (book.positions || []).map((pos) => {
    const copy = { ...pos };
    if (isCashLeg(pos)) {
      equity += Number(pos.sizeUsd) || 0;
      return copy;
    }
    const ticker = tickerOf(pos);
    const quote = (quotes && quotes[ticker]) || {};
    if (typeof quote.last === "number") copy.last = quote.last;
    if (typeof quote.priorClose === "number") copy.priorClose = quote.priorClose;
    const value = markedEquity(copy, quotes);
    if (value == null) unmarked = true;
    else equity += value;
    return copy;
  });

  const computedUsd = unmarked ? null : round(equity, 4);
  const bookUsd =
    typeof recorded.bookUsd === "number" ? recorded.bookUsd : computedUsd != null ? computedUsd : book.bookUsd;
  const weekPct =
    typeof recorded.weekPct === "number"
      ? recorded.weekPct
      : pctRound(((bookUsd - starting) / starting) * 100);
  const prior =
    typeof recorded.priorMarkUsd === "number" ? recorded.priorMarkUsd : opts.priorMarkUsd ?? book.priorMarkUsd ?? starting;
  const dayPct =
    typeof recorded.dayPct === "number"
      ? recorded.dayPct
      : prior > 0
        ? pctRound(((bookUsd - prior) / prior) * 100)
        : 0;

  return {
    ...book,
    positions,
    bookUsd,
    weekPct,
    monthPct: typeof recorded.monthPct === "number" ? recorded.monthPct : weekPct,
    dayPct,
    priorMarkUsd: prior,
    computedUsd
  };
}

function snapshotBook(member, book) {
  return {
    bookUsd: book.bookUsd,
    weekPct: book.weekPct,
    monthPct: book.monthPct,
    dayPct: book.dayPct,
    priorMarkUsd: book.priorMarkUsd,
    positions: (book.positions || []).map((pos) => {
      const copy = { ...pos };
      delete copy.last;
      delete copy.priorClose;
      return copy;
    })
  };
}

export function tribeTotals(cast, books) {
  const totals = {};
  for (const member of cast) {
    if (member.status && member.status !== "active" && member.status !== "immune") continue;
    const tribeId = member.tribeId;
    if (!totals[tribeId]) {
      totals[tribeId] = { combinedWeekPct: 0, combinedMonthPct: 0, combinedDayPct: 0, livingCount: 0 };
    }
    const book = books.get(member.id);
    totals[tribeId].combinedWeekPct += book.weekPct || 0;
    totals[tribeId].combinedMonthPct += book.monthPct || 0;
    totals[tribeId].combinedDayPct += book.dayPct || 0;
    totals[tribeId].livingCount += 1;
  }
  for (const tribeId of Object.keys(totals)) {
    totals[tribeId].combinedWeekPct = pctRound(totals[tribeId].combinedWeekPct);
    totals[tribeId].combinedMonthPct = pctRound(totals[tribeId].combinedMonthPct);
    totals[tribeId].combinedDayPct = pctRound(totals[tribeId].combinedDayPct);
  }
  return totals;
}

function publicSurvivor(member, book) {
  const slug = member.slug || slugify(member.model || member.name);
  return {
    id: member.id,
    name: member.name,
    slug,
    tribeId: member.tribeId,
    archetype: member.archetype,
    status: member.status || "active",
    bookUsd: book.bookUsd,
    weekPct: book.weekPct,
    monthPct: book.monthPct,
    dayPct: book.dayPct,
    priorMarkUsd: book.priorMarkUsd,
    immune: Boolean(member.immune),
    monogram: member.monogram,
    bio: member.bio,
    caption: member.caption,
    portrait: member.portrait,
    camp: member.camp,
    model: member.model || member.name,
    positions: book.positions
  };
}

export function latestMark(events) {
  const marks = (events || []).filter((event) => event && event.type === "mark");
  return marks.length ? marks[marks.length - 1] : null;
}

export function deriveSeason(source) {
  const starting = typeof source.startingBookUsd === "number" ? source.startingBookUsd : 10;
  const cast = source.cast || [];
  const events = source.events || [];
  const quotes = source.quotes || {};
  const snapshots = [];

  for (const event of events) {
    if (!event || event.type !== "mark") continue;
    const books = booksFromFills(cast, events, starting, event.throughAt || event.at);
    const recorded = event.recorded || {};
    const marked = new Map();
    for (const member of cast) {
      const prior =
        recorded[member.id] && typeof recorded[member.id].priorMarkUsd === "number"
          ? recorded[member.id].priorMarkUsd
          : starting;
      marked.set(
        member.id,
        markBook(books.get(member.id), event.quotes || quotes, {
          startingBookUsd: starting,
          priorMarkUsd: prior,
          recorded: recorded[member.id]
        })
      );
    }
    const tribes = event.tribes || tribeTotals(cast, marked);
    const booksOut = {};
    for (const member of cast) {
      booksOut[member.id] = snapshotBook(member, marked.get(member.id));
    }
    snapshots.push({
      id: event.id,
      at: event.at,
      label: event.label,
      kind: event.kind || "mark",
      dayPctPriorOfficial: Boolean(event.dayPctPriorOfficial),
      tribes,
      books: booksOut
    });
  }

  const last = snapshots[snapshots.length - 1];
  const lastMark = latestMark(events);
  const currentBooks = booksFromFills(cast, events, starting, lastMark && lastMark.throughAt ? lastMark.throughAt : undefined);
  const recorded = (lastMark && lastMark.recorded) || {};
  const marked = new Map();
  for (const member of cast) {
    marked.set(
      member.id,
      markBook(currentBooks.get(member.id), quotes, {
        startingBookUsd: starting,
        priorMarkUsd: recorded[member.id] && recorded[member.id].priorMarkUsd,
        recorded: recorded[member.id]
      })
    );
  }

  const tribeMeta = source.tribes || [];
  const totals = (last && last.tribes) || tribeTotals(cast, marked);
  const tribes = tribeMeta.map((tribe) => {
    const tot = totals[tribe.id] || {};
    return {
      id: tribe.id,
      name: tribe.name,
      buff: tribe.buff,
      color: tribe.color,
      combinedWeekPct: tot.combinedWeekPct ?? 0,
      combinedMonthPct: tot.combinedMonthPct ?? 0,
      combinedDayPct: tot.combinedDayPct ?? 0,
      livingCount: tot.livingCount ?? cast.filter((m) => m.tribeId === tribe.id).length
    };
  });

  const survivors = cast.map((member) => publicSurvivor(member, marked.get(member.id)));
  const liveEpisode = (source.episodes || []).find((ep) => ep.status === "live") || source.episode || null;

  return {
    show: source.show,
    location: source.location,
    host: source.host,
    season: source.season,
    status: source.status,
    statusLabel: source.statusLabel,
    started: source.started,
    merged: source.merged,
    mergeAtRemaining: source.mergeAtRemaining,
    startingBookUsd: starting,
    islandPotUsd: source.islandPotUsd,
    month: source.month,
    monthLabel: source.monthLabel,
    episode: source.episode || liveEpisode,
    episodes: source.episodes || [],
    tribes,
    survivors,
    tribalLog: source.tribalLog || [],
    goldenPortfolio: source.goldenPortfolio || [],
    immunity: source.immunity ?? null,
    winnerId: source.winnerId ?? null,
    mergeSecret: source.mergeSecret !== false,
    markedAt: lastMark ? lastMark.at : source.markedAt,
    markLabel: lastMark ? lastMark.label : source.markLabel,
    dayPctPriorOfficial: lastMark ? Boolean(lastMark.dayPctPriorOfficial) : false,
    quotes,
    snapshots,
    events: events.map((event) => {
      if (event.type === "mark") {
        const { recorded, quotes: markQuotes, ...rest } = event;
        return rest;
      }
      return event;
    })
  };
}
