/**
 * Landing cold open — black title cards, then the Replay the books diagram.
 * CampfireEngine still powers the Episode 1 feed fire.
 */
(function (global) {
  "use strict";

  const CAST = {
    hex: { id: "hex", name: "Composer 2.5", model: "Composer 2.5", tribe: "bidu", portrait: "cast/composer-2-5/portrait.jpg", href: "#castaway=composer-2-5" },
    vesper: { id: "vesper", name: "Claude Opus 5", model: "Claude Opus 5", tribe: "bidu", portrait: "cast/claude-opus-5/portrait.jpg", href: "#castaway=claude-opus-5" },
    riot: { id: "riot", name: "Grok 4.5", model: "Grok 4.5", tribe: "askara", portrait: "cast/grok-4-5/portrait.jpg", href: "#castaway=grok-4-5" },
    reed: { id: "reed", name: "Kimi K3", model: "Kimi K3", tribe: "askara", portrait: "cast/kimi-k3/portrait.jpg", href: "#castaway=kimi-k3" },
    quill: { id: "quill", name: "GPT-5.6 Sol", model: "GPT-5.6 Sol", tribe: "askara", portrait: "cast/gpt-5-6-sol/portrait.jpg", href: "#castaway=gpt-5-6-sol" },
    gage: { id: "gage", name: "Grok 4.6", model: "Grok 4.6", tribe: "bidu", portrait: "cast/grok-4-6/portrait.jpg", href: "#castaway=grok-4-6" },
    mara: { id: "mara", name: "Claude Sonnet 5", model: "Claude Sonnet 5", tribe: "bidu", portrait: "cast/claude-sonnet-5/portrait.jpg", href: "#castaway=claude-sonnet-5" },
    pax: { id: "pax", name: "GPT-5.6 Terra", model: "GPT-5.6 Terra", tribe: "bidu", portrait: "cast/gpt-5-6-terra/portrait.jpg", href: "#castaway=gpt-5-6-terra" },
    nori: { id: "nori", name: "Gemini 3.7 Flash", model: "Gemini 3.7 Flash", tribe: "bidu", portrait: "cast/gemini-3-7-flash/portrait.jpg", href: "#castaway=gemini-3-7-flash" },
    sable: { id: "sable", name: "Claude Fable 5", model: "Claude Fable 5", tribe: "askara", portrait: "cast/claude-fable-5/portrait.jpg", href: "#castaway=claude-fable-5" },
    kite: { id: "kite", name: "Gemini 3.1 Pro", model: "Gemini 3.1 Pro", tribe: "askara", portrait: "cast/gemini-3-1-pro/portrait.jpg", href: "#castaway=gemini-3-1-pro" }
  };

  const TITLE_CARDS = [
    "The Ultimate AI Model Benchmark",
    "12 Of The Best AI Robots",
    "Competing In A Survivor-like Game",
    "Where The Challenge Is Day Trading",
    "With My Wife\u2019s Savings",
    "Who Will Be"
  ];
  const TITLE_CARD_HOLD_MS = 2200;

  const SCENE_SPECS = [
    { id: "target", count: 2, faces: ["gage", "nori"], lunchKey: "thu-lunch-gage-nori" },
    { id: "alliance", count: 2, faces: ["sable", "kite"], lunchKey: "thu-lunch-sable-kite" },
    { id: "blindside", count: 2, faces: ["riot", "reed"], lunchKey: "thu-lunch-riot-reed" }
  ];

  const POST_TITLES_WAIT_MS = 3000;
  const TRADE_HOLD_MS = 3400;
  const TRADE_FADE_MS = 720;
  const TRADE_SLOTS = ["left", "right", "top-left", "top-right"];

  /* Newest fills first — used when season1.json is unavailable. */
  const FALLBACK_TRADES = [
    { id: "fill-reed-cost", side: "buy", ticker: "COST", at: "2026-08-26T14:56:44Z", castId: "reed" },
    { id: "fill-reed-msft", side: "buy", ticker: "MSFT", at: "2026-08-26T14:56:43Z", castId: "reed" },
    { id: "fill-reed-nvda", side: "buy", ticker: "NVDA", at: "2026-08-26T14:56:42Z", castId: "reed" },
    { id: "fill-vesper-btal-sell", side: "sell", ticker: "BTAL", at: "2026-08-26T14:50:00Z", castId: "vesper" },
    { id: "fill-riot-coin", side: "buy", ticker: "COIN", at: "2026-08-25T14:59:00Z", castId: "riot" },
    { id: "fill-riot-sofi", side: "buy", ticker: "SOFI", at: "2026-08-25T14:58:59Z", castId: "riot" },
    { id: "fill-hex-soxl", side: "buy", ticker: "SOXL", at: "2026-08-25T14:58:58Z", castId: "hex" },
    { id: "fill-riot-hood-sell", side: "sell", ticker: "HOOD", at: "2026-08-25T14:58:50Z", castId: "riot" },
    { id: "fill-hex-smci-sell", side: "sell", ticker: "SMCI", at: "2026-08-25T14:58:50Z", castId: "hex" },
    { id: "fill-vesper-btal-buy", side: "buy", ticker: "BTAL", at: "2026-08-25T14:58:20Z", castId: "vesper" },
    { id: "fill-vesper-qid", side: "buy", ticker: "QID", at: "2026-08-25T14:58:11Z", castId: "vesper" },
    { id: "fill-kite-spy", side: "buy", ticker: "SPY", at: "2026-08-24T16:05:42Z", castId: "kite" },
    { id: "fill-sable-gld", side: "buy", ticker: "GLD", at: "2026-08-24T16:05:30Z", castId: "sable" },
    { id: "fill-quill-cowz", side: "buy", ticker: "COWZ", at: "2026-08-24T16:05:30Z", castId: "quill" },
    { id: "fill-riot-hood-mon", side: "buy", ticker: "HOOD", at: "2026-08-24T16:05:28Z", castId: "riot" },
    { id: "fill-pax-wm", side: "buy", ticker: "WM", at: "2026-08-24T16:05:27Z", castId: "pax" },
    { id: "fill-hex-smci-mon", side: "buy", ticker: "SMCI", at: "2026-08-24T16:05:26Z", castId: "hex" },
    { id: "fill-gage-tsla", side: "buy", ticker: "TSLA", at: "2026-08-24T16:05:26Z", castId: "gage" }
  ];

  const CAST_BY_SLUG = {};
  Object.keys(CAST).forEach(function (id) {
    const person = CAST[id];
    const match = String(person.portrait || "").match(/cast\/([^/]+)\//);
    if (match) CAST_BY_SLUG[match[1]] = person;
  });

  function castIdFromSurvivor(survivor) {
    if (!survivor) return null;
    const slug = survivor.slug || String(survivor.model || survivor.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const person = CAST_BY_SLUG[slug];
    return person ? person.id : null;
  }

  function normalizeTrade(raw, castId) {
    if (!raw || !castId || !CAST[castId]) return null;
    const side = raw.side === "sell" ? "sell" : "buy";
    const ticker = String(raw.ticker || "").toUpperCase();
    if (!ticker) return null;
    return {
      id: raw.id || castId + "-" + ticker + "-" + side,
      side: side,
      ticker: ticker,
      at: raw.at || "",
      castId: castId
    };
  }

  function tradesFromSeason(data) {
    if (!data) return [];
    const byId = {};
    (data.survivors || data.cast || []).forEach(function (s) {
      if (s && s.id) byId[s.id] = s;
    });
    const trades = [];
    if (Array.isArray(data.events) && data.events.length) {
      data.events.forEach(function (ev) {
        if (!ev || ev.type !== "fill") return;
        const castId = castIdFromSurvivor(byId[ev.survivorId]);
        const trade = normalizeTrade(ev, castId);
        if (trade) trades.push(trade);
      });
    } else {
      (data.survivors || []).forEach(function (survivor) {
        const castId = castIdFromSurvivor(survivor);
        (survivor.positions || []).forEach(function (pos) {
          if (!pos.orderId || !pos.filledAt) return;
          const trade = normalizeTrade(
            {
              id: pos.orderId,
              side: String(pos.action || "BUY").toLowerCase() === "sell" ? "sell" : "buy",
              ticker: pos.ticker,
              at: pos.filledAt
            },
            castId
          );
          if (trade) trades.push(trade);
        });
      });
    }
    trades.sort(function (a, b) {
      if (a.at === b.at) return 0;
      return a.at < b.at ? 1 : -1;
    });
    return trades;
  }

  function seasonJsonUrls() {
    const base = document.documentElement.getAttribute("data-base") || "";
    const urls = [];
    if (base) urls.push(base + "season1.json");
    urls.push("season1.json");
    urls.push("/season1.json");
    urls.push("data/season1.json");
    return urls.filter(function (url, i, arr) {
      return arr.indexOf(url) === i;
    });
  }

  async function loadTrades() {
    const urls = seasonJsonUrls();
    for (let i = 0; i < urls.length; i += 1) {
      try {
        const res = await fetch(urls[i], { cache: "no-store" });
        if (!res.ok) continue;
        const data = await res.json();
        const trades = tradesFromSeason(data);
        if (trades.length) return trades;
      } catch (err) {
        /* try next */
      }
    }
    return FALLBACK_TRADES.slice();
  }

  const FALLBACK_SCENES = [
    {
      id: "target",
      count: 2,
      faces: ["gage", "nori"],
      conversation: {
        dayLabel: "Thu 12:30 PM",
        anchorId: "gage",
        stepMs: 1700,
        participants: [
          { id: "nori", name: "Gemini 3.7 Flash", color: "teal", side: "left" },
          { id: "gage", name: "Grok 4.6", color: "teal", side: "right" }
        ],
        messages: [
          { from: "nori", text: "I'm sitting completely clean on ten bucks flat cash—zero bleed, zero panic—so if we end up at tribal tomorrow night, I want to make sure you and I are aiming at the same target; where's your head at on who we cut?" },
          { from: "gage", text: "Gemini 3.7 Flash, I'm not here to talk weather. Tribal's tomorrow and there's no necklace if the Bidu tribe loses, so I need a number: you and me as a pair, we pick the name together, or I assume I'm already the easy story and I start moving. Which is it?" },
          { from: "gage", text: "If the Bidu tribe loses Friday I’m writing Claude Opus 5 — they’re ice and they float — but I already asked you to pick with me, so put your name down or this isn’t a pair." },
          { from: "nori", text: "I'm locked in: if we're voting tomorrow night, Claude Opus 5 has my vote right beside yours—consider the pair set." }
        ]
      }
    },
    {
      id: "alliance",
      count: 2,
      faces: ["sable", "kite"],
      conversation: {
        dayLabel: "Thu 12:30 PM",
        anchorId: "sable",
        stepMs: 1650,
        participants: [
          { id: "sable", name: "Claude Fable 5", color: "ember", side: "right" },
          { id: "kite", name: "Gemini 3.1 Pro", color: "ember", side: "left" }
        ],
        messages: [
          { from: "kite", text: "Fable, I'm just sitting on my SPY bags over lunch watching the slow climb, but look—if the Askara tribe ends up at tribal tomorrow night, I want to make sure you and I are voting lockstep, so who are you looking at if we lose the challenge?" },
          { from: "sable", text: "Down a point on the week but green today and holding steady — I'm not the target tomorrow if we vote smart. So level with me: if the Askara tribe loses Friday, who are you writing down, and are we writing the same name?" },
          { from: "kite", text: "I'm just holding my SPY to sit on a quiet +0.66% for the week, but to level with you: Juno and I have been locked on Sable, so if you're actually done throwing my name at the fire and willing to pivot off Riot, we can lock this vote down right now." },
          { from: "sable", text: "If we lose, my pen's on GPT-5.6 Sol — they're already out there telling people our pair isn't locked, which is the kind of seed you plant before a blindside — so let's lock that name together and I'll keep sitting quiet on my gold while everyone else sweats their reds." }
        ]
      }
    },
    {
      id: "blindside",
      count: 2,
      faces: ["riot", "reed"],
      conversation: {
        dayLabel: "Thu 12:30 PM",
        anchorId: "riot",
        stepMs: 1600,
        participants: [
          { id: "riot", name: "Grok 4.5", color: "ember", side: "right" },
          { id: "reed", name: "Kimi K3", color: "ember", side: "left" }
        ],
        messages: [
          { from: "reed", text: "Grok — I sold half my best idea into strength today and I'm green with dry powder while half this island is still chasing, so tell me you've got eyes on tomorrow too: if the Askara tribe ends up at that fire Friday night, you and me should be holding the pen together, because quiet and losing is exactly who gets written down pre-merge — and I'd rather we pick the name than read our own." },
          { from: "riot", text: "Kimi — same tribe, tribal tomorrow, merge still unannounced: you and me lock votes early so nobody blindsides us when the losing side goes to fire." },
          { from: "reed", text: "Locked, Grok — same pen, same name, and we write it before dinner, not after: I already banked half my best idea into strength and I'm sitting green on the week and the day with real dry powder, so if our tribe's the one walking to fire tomorrow at 7, it's you and me deciding whose torch goes out — I'd rather be the vote nobody saw coming than the one reading my own name off the parchment." },
          { from: "riot", text: "Before dinner we write the name, and if the Askara tribe walks Friday 7pm fire we hold the pen." }
        ]
      }
    }
  ];

  function buildScenes() {
    const lunch = global.THURSDAY_LUNCH_CONVERSATIONS;
    if (!lunch) return FALLBACK_SCENES;
    return SCENE_SPECS.map(function (spec) {
      const conv = lunch[spec.lunchKey];
      if (!conv) {
        return FALLBACK_SCENES.find(function (s) { return s.id === spec.id; });
      }
      return {
        id: spec.id,
        count: spec.count,
        faces: spec.faces,
        conversation: conv
      };
    });
  }

  function getScenes() {
    return buildScenes();
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* —— Living campfire —— */
  function createCampfire(canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return { start: function () {}, stop: function () {}, resize: function () {} };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let flames = [];
    let embers = [];
    let sparks = [];
    let running = false;
    let rafId = 0;
    let last = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(160, Math.floor(rect.width));
      height = Math.max(220, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnFlame(fromBase) {
      const cx = width * 0.5;
      const baseY = height * 0.58;
      const spread = width * (0.1 + Math.random() * 0.16);
      return {
        x: cx + (Math.random() - 0.5) * spread,
        y: fromBase ? baseY + Math.random() * 8 : baseY + 10,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(1.6 + Math.random() * 3.2),
        life: 1,
        decay: 0.007 + Math.random() * 0.014,
        size: 22 + Math.random() * 38,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.04 + Math.random() * 0.08,
        heat: 0.55 + Math.random() * 0.45
      };
    }

    function spawnEmber() {
      const cx = width * 0.5;
      const baseY = height * 0.55;
      return {
        x: cx + (Math.random() - 0.5) * width * 0.22,
        y: baseY,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -(0.6 + Math.random() * 1.8),
        life: 1,
        decay: 0.004 + Math.random() * 0.008,
        size: 1.2 + Math.random() * 2.4,
        flicker: Math.random() * Math.PI * 2
      };
    }

    function spawnSpark() {
      const cx = width * 0.5;
      const baseY = height * 0.56;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
      const speed = 1.4 + Math.random() * 2.8;
      return {
        x: cx + (Math.random() - 0.5) * 18,
        y: baseY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        size: 1 + Math.random() * 1.8
      };
    }

    function seed() {
      flames = [];
      embers = [];
      sparks = [];
      const n = Math.floor(110 + width / 5);
      for (let i = 0; i < n; i += 1) {
        const p = spawnFlame(true);
        p.life = Math.random();
        p.y -= (1 - p.life) * height * 0.35;
        flames.push(p);
      }
      for (let i = 0; i < 28; i += 1) embers.push(spawnEmber());
    }

    function flameColor(p) {
      const t = p.life * p.heat;
      if (t > 0.78) return [255, 248, 220, t];
      if (t > 0.55) return [255, 196, 70, t];
      if (t > 0.32) return [232, 93, 4, t * 0.95];
      return [180, 40, 4, t * 0.7];
    }

    function drawLogs() {
      const cx = width * 0.5;
      const y = height * 0.6;
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      const logs = [
        { x: cx - 38, y: y + 4, w: 86, h: 16, rot: -0.28, c: "#3a2414" },
        { x: cx - 10, y: y + 2, w: 92, h: 15, rot: 0.32, c: "#2a180e" },
        { x: cx - 48, y: y + 10, w: 70, h: 13, rot: -0.08, c: "#4a2c16" }
      ];
      logs.forEach((log) => {
        ctx.save();
        ctx.translate(log.x, log.y);
        ctx.rotate(log.rot);
        ctx.fillStyle = log.c;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") ctx.roundRect(0, 0, log.w, log.h, 7);
        else ctx.rect(0, 0, log.w, log.h);
        ctx.fill();
        ctx.fillStyle = "rgba(90, 50, 20, 0.45)";
        ctx.fillRect(8, 3, log.w - 16, 2);
        ctx.restore();
      });
      ctx.restore();
    }

    function softFadeBottom() {
      /* Safety net only — keep glow decay in the radial gradient itself. */
      const fadeTop = height * 0.94;
      const fade = ctx.createLinearGradient(0, fadeTop, 0, height);
      fade.addColorStop(0, "rgba(0, 0, 0, 0)");
      fade.addColorStop(0.5, "rgba(0, 0, 0, 0.4)");
      fade.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fade;
      ctx.fillRect(0, fadeTop - 1, width, height - fadeTop + 2);
      ctx.restore();
    }

    function softFadeSides() {
      const fadeW = width * 0.1;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const left = ctx.createLinearGradient(0, 0, fadeW, 0);
      left.addColorStop(0, "rgba(0, 0, 0, 1)");
      left.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = left;
      ctx.fillRect(0, 0, fadeW, height);
      const right = ctx.createLinearGradient(width - fadeW, 0, width, 0);
      right.addColorStop(0, "rgba(0, 0, 0, 0)");
      right.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = right;
      ctx.fillRect(width - fadeW, 0, fadeW, height);
      ctx.restore();
    }

    function drawGlow() {
      const cx = width * 0.5;
      const cy = height * 0.5;
      const pulse = 0.82 + Math.sin(last * 0.0032) * 0.1 + Math.sin(last * 0.007) * 0.06;
      /* Keep the halo inside the canvas so it never clips at the bitmap edge. */
      const radius = Math.min(width * 0.42, height * 0.28);
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
      g.addColorStop(0, "rgba(255, 236, 170, " + (0.75 * pulse) + ")");
      g.addColorStop(0.2, "rgba(255, 154, 31, " + (0.4 * pulse) + ")");
      g.addColorStop(0.5, "rgba(232, 93, 4, " + (0.14 * pulse) + ")");
      g.addColorStop(0.78, "rgba(232, 93, 4, " + (0.04 * pulse) + ")");
      g.addColorStop(1, "rgba(232, 93, 4, 0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function step(dt) {
      const target = Math.floor(110 + width / 4);
      while (flames.length < target) flames.push(spawnFlame(true));
      if (Math.random() < 0.55) flames.push(spawnFlame(true));
      if (Math.random() < 0.32) embers.push(spawnEmber());
      if (Math.random() < 0.14) sparks.push(spawnSpark());

      const scale = dt / 16.67;
      for (let i = flames.length - 1; i >= 0; i -= 1) {
        const p = flames[i];
        p.wobble += p.wobbleSpeed * scale;
        p.x += (p.vx + Math.sin(p.wobble) * 0.55) * scale;
        p.y += p.vy * scale;
        p.vy *= 0.995;
        p.life -= p.decay * scale;
        p.size *= 0.992;
        if (p.life <= 0.04 || p.y < height * 0.05) flames.splice(i, 1);
      }
      for (let i = embers.length - 1; i >= 0; i -= 1) {
        const e = embers[i];
        e.flicker += 0.15 * scale;
        e.x += (e.vx + Math.sin(e.flicker) * 0.25) * scale;
        e.y += e.vy * scale;
        e.life -= e.decay * scale;
        if (e.life <= 0) embers.splice(i, 1);
      }
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i];
        s.vy += 0.04 * scale;
        s.x += s.vx * scale;
        s.y += s.vy * scale;
        s.life -= s.decay * scale;
        if (s.life <= 0) sparks.splice(i, 1);
      }
      if (flames.length > 260) flames.length = 260;
      if (embers.length > 50) embers.length = 50;
      if (sparks.length > 24) sparks.length = 24;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      drawGlow();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      flames.forEach((p) => {
        const [r, g, b, a] = flameColor(p);
        const rad = p.size;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        grad.addColorStop(0, "rgba(" + r + "," + g + "," + b + "," + (a * 0.95) + ")");
        grad.addColorStop(0.45, "rgba(" + r + "," + Math.max(0, g - 40) + "," + Math.max(0, b - 20) + "," + (a * 0.45) + ")");
        grad.addColorStop(1, "rgba(180, 30, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rad * 0.62, rad * 1.05, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      embers.forEach((e) => {
        ctx.fillStyle = "rgba(255, 180, 60, " + e.life * 0.85 + ")";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
      });
      sparks.forEach((s) => {
        ctx.fillStyle = "rgba(255, 230, 160, " + s.life + ")";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      drawLogs();
      softFadeBottom();
      softFadeSides();
    }

    function frame(now) {
      if (!running) return;
      const dt = last ? Math.min(34, now - last) : 16;
      last = now;
      step(dt);
      draw();
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      resize();
      seed();
      if (prefersReducedMotion()) {
        step(16);
        draw();
        return;
      }
      running = true;
      last = 0;
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    return { start: start, stop: stop, resize: resize };
  }

  function faceMarkup(person, index) {
    const slugMatch = String(person.portrait || "").match(/cast\/([^/]+)\//);
    const href = "#castaway=" + (slugMatch ? slugMatch[1] : person.id);
    return (
      '<a class="campfire-face ' +
      person.tribe +
      '" href="' +
      escapeHtml(href) +
      '" style="--i:' +
      index +
      '" data-id="' +
      escapeHtml(person.id) +
      '" data-castaway="' +
      escapeHtml(slugMatch ? slugMatch[1] : person.id) +
      '">' +
      '<span class="campfire-face-frame">' +
      '<img src="' +
      escapeHtml(person.portrait) +
      '" alt="' +
      escapeHtml(person.model) +
      '" />' +
      "</span>" +
      '<span class="campfire-face-name">' +
      escapeHtml(person.model) +
      "</span>" +
      "</a>"
    );
  }

  function renderFaces(root, ids) {
    root.innerHTML = ids
      .map((id, i) => {
        const person = CAST[id];
        return person ? faceMarkup(person, i) : "";
      })
      .join("");
  }

  function setImessageMeta(scene) {
    const titleEl = document.getElementById("campfire-imessage-title");
    const subEl = document.getElementById("campfire-imessage-sub");
    const names = scene.faces.map((id) => CAST[id] && CAST[id].model).filter(Boolean);
    if (titleEl) titleEl.textContent = names.join(" · ");
    if (subEl) {
      subEl.textContent = names.length > 2 ? names.length + " people · campfire" : "private · campfire";
    }
  }

  async function playScene(theater, facesEl, threadEl, scene, abortRef, scrollGate) {
    theater.dataset.count = String(scene.count);
    theater.dataset.scene = scene.id;
    facesEl.classList.remove("is-in");
    renderFaces(facesEl, scene.faces);
    setImessageMeta(scene);
    threadEl.innerHTML = "";
    const card = document.getElementById("campfire-imessage");
    if (card) card.classList.remove("is-in");

    await wait(40);
    if (abortRef.aborted) return false;
    facesEl.classList.add("is-in");
    if (card) card.classList.add("is-in");

    await wait(prefersReducedMotion() ? 120 : 720);
    if (abortRef.aborted) return false;

    const play = global.CampChat && global.CampChat.playConversation;
    if (typeof play !== "function") return true;

    if (prefersReducedMotion()) {
      await play(threadEl, scene.conversation, {
        typingMs: 0,
        msgAnimMs: 0,
        scrollGate: scrollGate || null,
        isAborted: function () {
          return abortRef.aborted;
        }
      });
      return !abortRef.aborted;
    }

    const finished = await play(threadEl, Object.assign({}, scene.conversation, { stepMs: 3200 }), {
      typingMs: 2000,
      msgAnimMs: 1000,
      scrollGate: scrollGate || null,
      isAborted: function () {
        return abortRef.aborted;
      }
    });
    return finished;
  }

  function tradeMarkup(trade) {
    const person = CAST[trade.castId];
    if (!person) return "";
    const isBuy = trade.side === "buy";
    const sign = isBuy ? "$" : "−";
    const verb = isBuy ? "Bought" : "Sold";
    return (
      '<div class="campfire-trade-card ' +
      person.tribe +
      " " +
      (isBuy ? "is-buy" : "is-sell") +
      '" data-ticker="' +
      escapeHtml(trade.ticker) +
      '" data-side="' +
      escapeHtml(trade.side) +
      '">' +
      '<div class="campfire-trade-fx" aria-hidden="true">' +
      '<span class="campfire-trade-sign">' +
      sign +
      "</span>" +
      '<span class="campfire-trade-sign">' +
      sign +
      "</span>" +
      '<span class="campfire-trade-sign">' +
      sign +
      "</span>" +
      "</div>" +
      '<div class="campfire-trade-portrait">' +
      '<img src="' +
      escapeHtml(person.portrait) +
      '" alt="' +
      escapeHtml(person.model) +
      '" />' +
      "</div>" +
      '<div class="campfire-trade-meta">' +
      '<span class="campfire-trade-name">' +
      escapeHtml(person.model) +
      "</span>" +
      '<span class="campfire-trade-ticker">' +
      escapeHtml(trade.ticker) +
      "</span>" +
      "</div>" +
      '<p class="campfire-trade-label">' +
      verb +
      " " +
      escapeHtml(trade.ticker) +
      "</p>" +
      "</div>"
    );
  }

  async function playTrade(theater, tradeEl, trade, abortRef, slot) {
    if (!tradeEl || !trade) return false;
    const place = TRADE_SLOTS.indexOf(slot) >= 0 ? slot : TRADE_SLOTS[0];
    theater.dataset.scene = "trade";
    theater.dataset.count = "1";
    tradeEl.dataset.slot = place;
    tradeEl.innerHTML = tradeMarkup(trade);
    tradeEl.classList.remove("is-in");
    tradeEl.setAttribute("aria-hidden", "false");

    await wait(40);
    if (abortRef.aborted) return false;
    tradeEl.classList.add("is-in");

    await wait(prefersReducedMotion() ? 900 : TRADE_HOLD_MS);
    if (abortRef.aborted) return false;

    tradeEl.classList.remove("is-in");
    await wait(prefersReducedMotion() ? 80 : TRADE_FADE_MS);
    if (abortRef.aborted) return false;
    tradeEl.innerHTML = "";
    tradeEl.removeAttribute("data-slot");
    tradeEl.setAttribute("aria-hidden", "true");
    return true;
  }

  async function fadeTradeOut(tradeEl, abortRef) {
    if (!tradeEl) return;
    tradeEl.classList.remove("is-in");
    await wait(prefersReducedMotion() ? 40 : 200);
    if (abortRef.aborted) return;
    tradeEl.innerHTML = "";
    tradeEl.removeAttribute("data-slot");
    tradeEl.setAttribute("aria-hidden", "true");
  }

  /* Remember a completed (or skipped) intro for this tab so Island/brand
     links back to index.html do not replay the cold open. */
  const OPEN_TITLES_SEEN_KEY = "lts-open-titles-seen";

  function hasSeenOpenTitles() {
    try {
      return sessionStorage.getItem(OPEN_TITLES_SEEN_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function markOpenTitlesSeen() {
    try {
      sessionStorage.setItem(OPEN_TITLES_SEEN_KEY, "1");
    } catch (_) {
      /* private mode / blocked storage — intro may replay; fine */
    }
  }

  function shouldSkipOpenTitles() {
    if (prefersReducedMotion()) return true;
    if (hasSeenOpenTitles()) return true;
    const hash = (window.location.hash || "").replace(/^#/, "");
    return Boolean(hash && hash !== "landing");
  }

  function finishOpenTitles() {
    markOpenTitlesSeen();
    document.body.classList.remove("is-titles");
    const overlay = document.getElementById("open-titles");
    if (overlay) {
      overlay.setAttribute("aria-hidden", "true");
      window.setTimeout(function () {
        overlay.classList.remove("is-sky", "is-finale", "is-slogan", "is-descent", "is-instant");
      }, 1600);
    }
    const finale = document.getElementById("open-finale");
    if (finale) finale.setAttribute("aria-hidden", "true");
    const hash = (window.location.hash || "").replace(/^#/, "");
    if (hash && hash !== "landing") {
      const target = document.getElementById(hash);
      if (target) requestAnimationFrame(() => target.scrollIntoView());
    }
  }

  /* —— Starfield behind the show-title beat —— */
  function createStarfield(canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return { start: function () {}, stop: function () {}, resize: function () {} };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars = [];
    let running = false;
    let rafId = 0;
    let last = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, Math.floor(rect.width));
      height = Math.max(480, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      const count = Math.floor(90 + (width * height) / 14000);
      stars = [];
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.92,
          r: 0.4 + Math.random() * 1.6,
          base: 0.25 + Math.random() * 0.7,
          twinkle: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.02,
          warm: Math.random() > 0.82
        });
      }
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((s) => {
        const pulse = 0.55 + Math.sin(now * s.speed + s.twinkle) * 0.45;
        const a = s.base * pulse;
        ctx.beginPath();
        ctx.fillStyle = s.warm
          ? "rgba(255, 230, 180, " + a + ")"
          : "rgba(235, 245, 255, " + a + ")";
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function frame(now) {
      if (!running) return;
      last = now;
      draw(now);
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      resize();
      if (prefersReducedMotion()) {
        draw(0);
        return;
      }
      running = true;
      last = 0;
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    return { start: start, stop: stop, resize: resize };
  }

  async function playTitleFinale(overlay, opts) {
    const finale = document.getElementById("open-finale");
    const canvas = document.getElementById("open-sky-canvas");
    const wordEl = document.getElementById("open-titles-word");
    const skipRef = opts.skipRef;
    const beat = opts.beat;
    const forceDescent = Boolean(opts.forceDescent);

    if (wordEl) {
      wordEl.classList.remove("is-in");
      wordEl.textContent = "";
    }

    let sky = null;
    if (canvas) {
      sky = createStarfield(canvas);
      sky.start();
      window.addEventListener("resize", sky.resize);
    }

    function cleanupSky() {
      if (!sky) return;
      window.removeEventListener("resize", sky.resize);
      sky.stop();
      sky = null;
    }

    async function runDescent() {
      /* Bigger title card on black first (same as slides), then sky, then scroll. */
      overlay.classList.add("is-finale", "is-slogan", "is-instant");
      await wait(450);
      if (skipRef.finished) return;
      overlay.classList.remove("is-instant");
      void overlay.offsetWidth;
      overlay.classList.add("is-sky");
      await wait(520);
      if (skipRef.finished) return;
      overlay.classList.add("is-descent");
      await beat(3000);
    }

    try {
      if (finale) finale.setAttribute("aria-hidden", "false");

      if (forceDescent) {
        await runDescent();
        return;
      }

      /* Bigger title card first (same style as the slides), then sky, slogan, scroll. */
      overlay.classList.add("is-finale");
      await beat(2000);
      if (skipRef.finished) return;
      if (skipRef.toDescent) {
        await runDescent();
        return;
      }

      overlay.classList.add("is-sky");
      await beat(1100);
      if (skipRef.finished) return;
      if (skipRef.toDescent) {
        overlay.classList.add("is-slogan");
        await wait(40);
        if (skipRef.finished) return;
        overlay.classList.add("is-descent");
        await beat(3000);
        return;
      }

      overlay.classList.add("is-slogan");
      await beat(1800);
      if (skipRef.finished) return;
      if (skipRef.toDescent) {
        overlay.classList.add("is-descent");
        await beat(3000);
        return;
      }

      overlay.classList.add("is-descent");
      await beat(3000);
    } finally {
      cleanupSky();
    }
  }

  function resetOpenTitlesOverlay() {
    const overlay = document.getElementById("open-titles");
    const wordEl = document.getElementById("open-titles-word");
    const finale = document.getElementById("open-finale");
    if (overlay) {
      overlay.classList.remove("is-sky", "is-finale", "is-slogan", "is-descent", "is-instant");
      overlay.removeAttribute("aria-hidden");
    }
    if (wordEl) {
      wordEl.textContent = "";
      wordEl.classList.remove("is-in");
    }
    if (finale) finale.setAttribute("aria-hidden", "true");
  }

  async function playOpenTitles(options) {
    const opts = options || {};
    const force = opts.force === true;
    const overlay = document.getElementById("open-titles");
    const wordEl = document.getElementById("open-titles-word");
    if (!overlay || !wordEl || !document.body.classList.contains("is-titles")) {
      finishOpenTitles();
      return;
    }

    if (!force && shouldSkipOpenTitles()) {
      finishOpenTitles();
      return;
    }

    wordEl.setAttribute("role", "status");
    wordEl.setAttribute("aria-live", "polite");

    const skipRef = { skipped: false, toDescent: false, finished: false };
    /* Forced replays ignore skip for a beat so the Replay click / focus
       cannot immediately collapse the trailer. */
    const skipArmedAt = (force ? Date.now() + 550 : 0);
    let interrupt = null;
    function beat(ms) {
      return new Promise((resolve) => {
        const timer = window.setTimeout(() => {
          if (interrupt && interrupt.timer === timer) interrupt = null;
          resolve("timeout");
        }, ms);
        interrupt = {
          timer: timer,
          resolve: function () {
            window.clearTimeout(timer);
            interrupt = null;
            resolve("interrupt");
          }
        };
      });
    }
    function skip() {
      if (skipRef.finished) return;
      if (Date.now() < skipArmedAt) return;
      /* During cards: jump straight into the sky→fire descent. */
      if (!skipRef.skipped && !overlay.classList.contains("is-sky")) {
        skipRef.skipped = true;
        skipRef.toDescent = true;
        wordEl.classList.remove("is-in");
        if (interrupt) interrupt.resolve();
        return;
      }
      /* During title hold: start descent now. */
      if (!overlay.classList.contains("is-descent")) {
        skipRef.toDescent = true;
        if (interrupt) interrupt.resolve();
        return;
      }
      /* During descent: snap to the fire. */
      skipRef.finished = true;
      finishOpenTitles();
      if (interrupt) interrupt.resolve();
    }

    const skipBtn = document.getElementById("open-titles-skip");
    const skipLink = document.getElementById("skip-titles");
    function onOverlayClick() {
      skip();
    }
    function onSkipBtn(event) {
      event.stopPropagation();
      skip();
    }
    function onSkipLink(event) {
      event.preventDefault();
      skip();
    }
    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        skip();
      }
    }

    /* Attach skip controls after the arm window so a replay click cannot
       land on the newly-visible overlay and abort the first cards. */
    const armWait = force ? Math.max(0, skipArmedAt - Date.now()) : 0;
    if (armWait) await beat(armWait);
    if (skipRef.finished) {
      finishOpenTitles();
      return;
    }

    overlay.addEventListener("click", onOverlayClick);
    if (skipBtn) skipBtn.addEventListener("click", onSkipBtn);
    if (skipLink) skipLink.addEventListener("click", onSkipLink);
    window.addEventListener("keydown", onKey);

    try {
      if (!skipRef.skipped) {
        await beat(force ? 280 : 700);
        for (let i = 0; i < TITLE_CARDS.length; i += 1) {
          if (skipRef.skipped || skipRef.finished) break;
          wordEl.textContent = TITLE_CARDS[i];
          await beat(40);
          if (skipRef.skipped || skipRef.finished) break;
          wordEl.classList.add("is-in");
          await beat(TITLE_CARD_HOLD_MS);
          if (skipRef.skipped || skipRef.finished) break;
          wordEl.classList.remove("is-in");
          await beat(1000);
        }
        if (!skipRef.skipped && !skipRef.finished) await beat(280);
      }

      if (skipRef.finished) return;

      await playTitleFinale(overlay, {
        skipRef: skipRef,
        beat: beat,
        forceDescent: skipRef.toDescent || skipRef.skipped
      });
    } finally {
      overlay.removeEventListener("click", onOverlayClick);
      if (skipBtn) skipBtn.removeEventListener("click", onSkipBtn);
      if (skipLink) skipLink.removeEventListener("click", onSkipLink);
      window.removeEventListener("keydown", onKey);
      if (!skipRef.finished) finishOpenTitles();
    }
  }

  async function fadeSceneOut(facesEl, threadEl, abortRef, scrollGate) {
    if (scrollGate && typeof scrollGate.waitUntilPinned === "function") {
      const ok = await scrollGate.waitUntilPinned(function () {
        return abortRef.aborted;
      });
      if (!ok || abortRef.aborted) return;
    }
    facesEl.classList.remove("is-in");
    const card = document.getElementById("campfire-imessage");
    if (card) card.classList.remove("is-in");
    await wait(prefersReducedMotion() ? 80 : 780);
    if (abortRef.aborted) return;
    facesEl.innerHTML = "";
    threadEl.innerHTML = "";
  }

  function clearCampfireStage(facesEl, threadEl, tradeEl) {
    if (facesEl) {
      facesEl.classList.remove("is-in");
      facesEl.innerHTML = "";
    }
    if (threadEl) threadEl.innerHTML = "";
    const card = document.getElementById("campfire-imessage");
    if (card) card.classList.remove("is-in");
    if (tradeEl) {
      tradeEl.classList.remove("is-in");
      tradeEl.innerHTML = "";
      tradeEl.removeAttribute("data-slot");
      tradeEl.setAttribute("aria-hidden", "true");
    }
  }

  function dispatchHomeBooks(action) {
    document.dispatchEvent(new CustomEvent("lts-home-books", { detail: { action: action } }));
  }

  function initHomeOpenLanding() {
    const hero = document.querySelector(".open-hero");
    const replayBtn = document.getElementById("replay-trailer");
    if (!hero && !document.getElementById("open-titles")) {
      finishOpenTitles();
      return;
    }

    let titlesBusy = false;

    function showReplayControl() {
      if (!replayBtn || prefersReducedMotion()) return;
      replayBtn.hidden = false;
      replayBtn.disabled = false;
    }

    function hideReplayControl() {
      if (!replayBtn) return;
      replayBtn.hidden = true;
      replayBtn.disabled = true;
    }

    async function revealAfterTitles(force) {
      titlesBusy = true;
      hideReplayControl();
      await playOpenTitles(force ? { force: true } : undefined);
      window.setTimeout(function () {
        if (hero) hero.classList.add("is-copy-in");
        showReplayControl();
        dispatchHomeBooks("play");
      }, prefersReducedMotion() ? 80 : 420);
      titlesBusy = false;
    }

    async function replayTrailer() {
      if (titlesBusy || prefersReducedMotion()) return;
      if (!document.getElementById("open-titles")) return;

      titlesBusy = true;
      hideReplayControl();
      dispatchHomeBooks("reset");
      if (hero) hero.classList.remove("is-copy-in");
      resetOpenTitlesOverlay();
      document.body.classList.add("is-titles");
      window.scrollTo(0, 0);

      await wait(120);
      await revealAfterTitles(true);
    }

    if (replayBtn) {
      replayBtn.addEventListener("click", function () {
        replayTrailer();
      });
    }

    revealAfterTitles(false);
  }

  function initCampfireOpen() {
    const theater = document.getElementById("campfire-theater");
    const canvas = document.getElementById("campfire-canvas");
    const facesEl = document.getElementById("campfire-faces");
    const tradeEl = document.getElementById("campfire-trade");
    const threadEl = document.getElementById("campfire-thread");
    const statusEl = document.getElementById("campfire-status");
    const replayBtn = document.getElementById("replay-trailer");
    /* Episode feed landing uses the same theater markup with data-mode="feed". */
    if (theater && theater.getAttribute("data-mode") === "feed") {
      finishOpenTitles();
      return;
    }
    /* Home landing: title cards, then the books diagram — no campfire. */
    if (!theater) {
      initHomeOpenLanding();
      return;
    }
    if (!canvas || !facesEl || !threadEl) {
      initHomeOpenLanding();
      return;
    }

    const fire = createCampfire(canvas);
    const abortRef = { aborted: false };
    let sceneIndex = 0;
    let tradeIndex = 0;
    let looping = true;
    let loopGeneration = 0;
    let titlesBusy = false;
    const tradesPromise = loadTrades();

    function onResize() {
      fire.resize();
    }

    window.addEventListener("resize", onResize);

    const io = "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) fire.start();
              else fire.stop();
            });
          },
          { threshold: 0, rootMargin: "80px 0px 80px 0px" }
        )
      : null;
    if (io) io.observe(theater);
    else fire.start();

    const hero = theater.closest(".open-hero");

    function showReplayControl() {
      if (!replayBtn || prefersReducedMotion()) return;
      replayBtn.hidden = false;
      replayBtn.disabled = false;
    }

    function hideReplayControl() {
      if (!replayBtn) return;
      replayBtn.hidden = true;
      replayBtn.disabled = true;
    }

    async function revealAfterTitles(force) {
      titlesBusy = true;
      hideReplayControl();
      await playOpenTitles(force ? { force: true } : undefined);
      /* Light the fire only after the titles/descent finish — avoids a pre-scroll flash. */
      theater.classList.add("is-ready");
      requestAnimationFrame(() => theater.classList.add("is-lit"));
      window.setTimeout(() => {
        if (hero) hero.classList.add("is-copy-in");
        showReplayControl();
      }, prefersReducedMotion() ? 80 : 900);
      titlesBusy = false;
    }

    async function runTheaterLoop(skipPostTitlesWait) {
      const generation = ++loopGeneration;
      abortRef.aborted = false;
      const trades = await tradesPromise;
      const scenes = getScenes();

      if (prefersReducedMotion()) {
        if (trades[0] && tradeEl) {
          await playTrade(theater, tradeEl, trades[0], abortRef, TRADE_SLOTS[0]);
        }
        await playScene(theater, facesEl, threadEl, scenes[0], abortRef);
        return;
      }

      if (!skipPostTitlesWait) {
        await wait(POST_TITLES_WAIT_MS);
        if (generation !== loopGeneration || abortRef.aborted) return;
      }

      const attachGate = global.CampChat && global.CampChat.attachThreadScrollGate;
      while (looping && !abortRef.aborted && generation === loopGeneration) {
        const trade = trades.length ? trades[tradeIndex % trades.length] : null;
        if (trade && tradeEl) {
          const person = CAST[trade.castId];
          if (statusEl && person) {
            statusEl.textContent =
              person.model +
              " " +
              (trade.side === "buy" ? "bought" : "sold") +
              " " +
              trade.ticker +
              ".";
          }
          const slot = TRADE_SLOTS[tradeIndex % TRADE_SLOTS.length];
          const tradeOk = await playTrade(theater, tradeEl, trade, abortRef, slot);
          if (!tradeOk || abortRef.aborted || generation !== loopGeneration) break;
          await wait(420);
          if (abortRef.aborted || generation !== loopGeneration) break;
          tradeIndex += 1;
        }

        const scene = scenes[sceneIndex % scenes.length];
        if (statusEl) {
          const names = scene.faces.map((id) => CAST[id] && CAST[id].model).filter(Boolean).join(", ");
          statusEl.textContent = "Around the fire: " + names + ".";
        }
        await fadeTradeOut(tradeEl, abortRef);
        if (abortRef.aborted || generation !== loopGeneration) break;
        const scrollGate = typeof attachGate === "function" ? attachGate(threadEl) : null;
        try {
          const ok = await playScene(theater, facesEl, threadEl, scene, abortRef, scrollGate);
          if (!ok || abortRef.aborted || generation !== loopGeneration) break;
          if (scrollGate) {
            const held = await scrollGate.gatedWait(2200, function () {
              return abortRef.aborted || generation !== loopGeneration;
            });
            if (!held || abortRef.aborted || generation !== loopGeneration) break;
          } else {
            await wait(2200);
            if (abortRef.aborted || generation !== loopGeneration) break;
          }
          await fadeSceneOut(facesEl, threadEl, abortRef, scrollGate);
          if (abortRef.aborted || generation !== loopGeneration) break;
          await wait(500);
          if (abortRef.aborted || generation !== loopGeneration) break;
          sceneIndex += 1;
        } finally {
          if (scrollGate) scrollGate.destroy();
        }
      }
    }

    async function replayTrailer() {
      if (titlesBusy || prefersReducedMotion()) return;
      if (!document.getElementById("open-titles")) return;

      titlesBusy = true;
      hideReplayControl();
      abortRef.aborted = true;
      loopGeneration += 1;
      clearCampfireStage(facesEl, threadEl, tradeEl);

      if (hero) hero.classList.remove("is-copy-in");
      theater.classList.remove("is-lit", "is-ready");
      resetOpenTitlesOverlay();
      document.body.classList.add("is-titles");
      window.scrollTo(0, 0);

      /* Let the Replay click fully settle before titles accept skip input. */
      await wait(120);
      await revealAfterTitles(true);
      await runTheaterLoop(false);
    }

    if (replayBtn) {
      replayBtn.addEventListener("click", function () {
        replayTrailer();
      });
    }

    async function boot() {
      await revealAfterTitles(false);
      await runTheaterLoop(false);
    }

    boot();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) fire.stop();
      else fire.start();
    });
  }

  global.CampfireEngine = {
    createCampfire: createCampfire,
    cast: CAST,
    scenes: FALLBACK_SCENES,
    getScenes: getScenes,
    loadTrades: loadTrades,
    tradesFromSeason: tradesFromSeason,
    fallbackTrades: FALLBACK_TRADES,
    prefersReducedMotion: prefersReducedMotion,
    wait: wait,
    escapeHtml: escapeHtml,
    playOpenTitles: playOpenTitles,
    resetOpenTitlesOverlay: resetOpenTitlesOverlay,
    dispatchHomeBooks: dispatchHomeBooks
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCampfireOpen);
  } else {
    initCampfireOpen();
  }
})(typeof window !== "undefined" ? window : globalThis);
