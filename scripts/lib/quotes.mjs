/** Public last-trade fetch. Skip a name if the source has no real price. */

const UA = "LastTraderStanding/1.0 (+https://thisisgoingtobehuge.com)";
const YAHOO_HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

function isUsListed(meta) {
  const currency = String((meta && meta.currency) || "USD").toUpperCase();
  return currency === "USD";
}

function priorCloseDateFromChart(result) {
  const stamps = Array.isArray(result && result.timestamp) ? result.timestamp : [];
  if (stamps.length < 2) return undefined;
  const prior = stamps[stamps.length - 2];
  if (!Number.isFinite(prior)) return undefined;
  const date = new Date(prior * 1000);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : undefined;
}

function parseYahooChart(ticker, payload) {
  const result = payload && payload.chart && payload.chart.result && payload.chart.result[0];
  if (!result || !result.meta) return null;
  const meta = result.meta;
  if (!isUsListed(meta)) return null;
  const last = meta.regularMarketPrice;
  if (typeof last !== "number" || !Number.isFinite(last) || last <= 0) return null;
  const priorClose = meta.chartPreviousClose;
  const quote = {
    last,
    source: "yahoo-chart last"
  };
  if (typeof priorClose === "number" && Number.isFinite(priorClose) && priorClose > 0) {
    quote.priorClose = priorClose;
  }
  const priorCloseDate = priorCloseDateFromChart(result);
  if (priorCloseDate) quote.priorCloseDate = priorCloseDate;
  if (Number.isFinite(meta.regularMarketTime)) {
    quote.marketTime = new Date(meta.regularMarketTime * 1000).toISOString();
  }
  return quote;
}

async function getJson(url, timeoutMs) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { Accept: "application/json", "User-Agent": UA }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYahooTicker(ticker, timeoutMs) {
  const path = `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
  for (const host of YAHOO_HOSTS) {
    const payload = await getJson(host + path, timeoutMs);
    const quote = parseYahooChart(ticker, payload);
    if (quote) return quote;
  }
  return null;
}

/** Fetch last prices for `tickers`. Missing/failed names are omitted — never invented. */
export async function fetchPublicQuotes(tickers, opts = {}) {
  const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : 12000;
  const out = {};
  const skipped = [];
  for (const raw of tickers || []) {
    const ticker = String(raw || "")
      .toUpperCase()
      .trim();
    if (!ticker) continue;
    const quote = await fetchYahooTicker(ticker, timeoutMs);
    if (quote) out[ticker] = quote;
    else skipped.push(ticker);
  }
  return { quotes: out, skipped };
}
