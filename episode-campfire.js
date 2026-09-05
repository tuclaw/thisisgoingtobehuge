/**
 * Episode landing campfire — same living fire as the island open,
 * with host-bot conversation bubbles that fade around the pit.
 * Click a bubble to play the real thread; nothing autoplays.
 */
(function (global) {
  "use strict";

  const SLOT_POSITIONS = [
    { left: "16%", top: "36%" },
    { left: "84%", top: "34%" },
    { left: "18%", top: "68%" },
    { left: "82%", top: "66%" },
    { left: "50%", top: "16%" }
  ];

  const MAX_VISIBLE = 2;
  const FIRST_BUBBLE_DELAY_MS = 10000;
  const NEXT_BUBBLE_DELAY_MS = 60000;
  const FADE_IN_STAGGER_MS = 900;
  const REVEAL_AFTER_CLOSE_MS = 5000;
  const BUBBLE_HOLD_MS = 32000;
  const MAX_PING_FACES = 3;
  const FEED_PATHS = [
    "conversations.json",
    "./conversations.json",
    "seasons/1/conversations.json"
  ];
  /* Day-tape maps published by episode beat scripts (newest first preference).
   * Build injects window.EPISODE_TAPE_GLOBALS from data/tapes.json campfireFeed. */
  function liveFeedGlobalNames() {
    if (Array.isArray(global.EPISODE_TAPE_GLOBALS)) return global.EPISODE_TAPE_GLOBALS;
    return ["FRIDAY_LUNCH_CONVERSATIONS", "THURSDAY_DINNER_CONVERSATIONS", "THURSDAY_LUNCH_CONVERSATIONS"];
  }
  const DOW = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

  function prefersReducedMotion() {
    if (global.CampfireEngine && typeof global.CampfireEngine.prefersReducedMotion === "function") {
      return global.CampfireEngine.prefersReducedMotion();
    }
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function escapeHtml(str) {
    if (global.CampfireEngine && typeof global.CampfireEngine.escapeHtml === "function") {
      return global.CampfireEngine.escapeHtml(str);
    }
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function assetBase() {
    const raw = document.documentElement.getAttribute("data-base");
    return raw == null ? "" : raw;
  }

  function castMap() {
    return (global.CampfireEngine && global.CampfireEngine.cast) || {};
  }

  function isSafePublicPath(path) {
    const raw = String(path || "").trim();
    if (!raw) return false;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return false;
    if (raw.startsWith("//") || raw.startsWith("\\")) return false;
    if (raw.includes("..") || raw.includes("\\")) return false;
    return true;
  }

  function portraitFor(participant) {
    if (!participant) return "";
    if (participant.portrait) {
      const p = String(participant.portrait).trim();
      if (!isSafePublicPath(p)) return "";
      if (p.startsWith("/") || (assetBase() && p.indexOf(assetBase()) === 0)) return p;
      return assetBase() + p;
    }
    const person = castMap()[participant.id];
    if (person && isSafePublicPath(person.portrait)) return assetBase() + person.portrait;
    return "";
  }

  function tribeFor(participant) {
    if (participant && participant.tribe) return participant.tribe;
    const person = castMap()[participant && participant.id];
    return (person && person.tribe) || "";
  }

  function enrichConversation(conversation) {
    const c = Object.assign({}, conversation);
    c.participants = (conversation.participants || []).map((p) => {
      const next = Object.assign({}, p);
      next.portrait = portraitFor(p);
      next.tribe = tribeFor(p);
      return next;
    });
    return c;
  }

  function isEpisodePage() {
    return document.documentElement.dataset.page === "episode";
  }

  function allowSampleFallback() {
    /* Demo tapes stay on camp-chat.html. Episode pages with no host feed stay empty. */
    return !isEpisodePage();
  }

  function resolveFeedPaths() {
    const base = assetBase();
    const custom = document.querySelector("[data-conversation-feed]");
    const fromAttr = custom && custom.getAttribute("data-conversation-feed");
    const paths = [];
    if (fromAttr) paths.push(fromAttr);
    if (global.EPISODE_CONVERSATIONS) return paths;
    if (isEpisodePage() && !fromAttr) return paths;
    FEED_PATHS.forEach((p) => {
      if (p.indexOf("seasons/") === 0) paths.push(base + p);
      else paths.push(p);
    });
    return paths;
  }

  function conversationTimeScore(conversation) {
    if (conversation && typeof conversation.at === "string") {
      const parsed = Date.parse(conversation.at);
      if (!isNaN(parsed)) return parsed;
    }
    const raw = String((conversation && conversation.dayLabel) || "")
      .split("·")[0]
      .trim();
    const match = raw.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b(?:\s+(.+))?$/i);
    if (!match) return 0;
    const day = DOW[match[1].toLowerCase()] || 0;
    const rest = String(match[2] || "")
      .trim()
      .toLowerCase();
    let mins = 0;
    if (rest === "dinner") mins = 19 * 60;
    else if (rest === "lunch") mins = 12 * 60 + 30;
    else {
      const time = rest.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
      if (time) {
        let hour = parseInt(time[1], 10);
        const minute = parseInt(time[2], 10);
        const ap = String(time[3] || "").toLowerCase();
        if (ap === "pm" && hour < 12) hour += 12;
        if (ap === "am" && hour === 12) hour = 0;
        mins = hour * 60 + minute;
      }
    }
    /* Episode-week relative score: later weekday + clock wins. */
    return day * 1440 + mins;
  }

  function sortNewestFirst(list) {
    return (list || []).slice().sort(function (a, b) {
      const diff = conversationTimeScore(b) - conversationTimeScore(a);
      if (diff !== 0) return diff;
      return String((b && b.id) || "").localeCompare(String((a && a.id) || ""));
    });
  }

  function latestDayConversations(list) {
    const sorted = sortNewestFirst(list);
    if (!sorted.length) return sorted;
    const topDay = Math.floor(conversationTimeScore(sorted[0]) / 1440);
    return sorted.filter(function (c) {
      return Math.floor(conversationTimeScore(c) / 1440) === topDay;
    });
  }

  function collectLiveConversations() {
    const out = [];
    liveFeedGlobalNames().forEach(function (key) {
      const map = global[key];
      if (!map || typeof map !== "object") return;
      Object.keys(map).forEach(function (id) {
        const raw = map[id];
        if (!raw || typeof raw !== "object") return;
        const next = Object.assign({}, raw);
        if (!next.id) next.id = id;
        if (!Array.isArray(next.messages) || !next.messages.length) return;
        out.push(next);
      });
    });
    return out;
  }

  function mergeConversations(feedList, liveList) {
    const byId = {};
    const order = [];
    function add(conversation) {
      if (!conversation || !conversation.id) return;
      if (!byId[conversation.id]) order.push(conversation.id);
      byId[conversation.id] = conversation;
    }
    (feedList || []).forEach(add);
    /* Live day tapes win on id collision — they are the exact host cut. */
    (liveList || []).forEach(add);
    return order.map(function (id) {
      return byId[id];
    });
  }

  function resolveLatestConversations(feedList) {
    return latestDayConversations(mergeConversations(feedList, collectLiveConversations()));
  }

  async function loadFeed() {
    if (global.EPISODE_CONVERSATIONS && Array.isArray(global.EPISODE_CONVERSATIONS.conversations)) {
      return global.EPISODE_CONVERSATIONS;
    }
    const paths = resolveFeedPaths();
    for (let i = 0; i < paths.length; i += 1) {
      try {
        const res = await fetch(paths[i], { cache: "no-store" });
        if (!res.ok) continue;
        const data = await res.json();
        if (data && Array.isArray(data.conversations)) return data;
      } catch (_) {
        /* try next */
      }
    }
    if (allowSampleFallback() && global.CampChat && global.CampChat.samples) {
      const samples = global.CampChat.samples;
      return {
        updatedAt: null,
        source: "fallback-samples",
        conversations: [samples.dm, samples.alliance, samples.group].filter(Boolean)
      };
    }
    return { conversations: [] };
  }

  function facesMarkup(participants) {
    const list = participants || [];
    const shown = list.slice(0, MAX_PING_FACES);
    const extra = list.length - shown.length;
    const faces = shown
      .map((p, i) => {
        const src = portraitFor(p);
        const tribe = tribeFor(p);
        const name = p.name || p.id || "Contestant";
        if (!src) {
          return (
            '<span class="campfire-ping-face fallback ' +
            escapeHtml(tribe) +
            '" style="--f:' +
            i +
            '" title="' +
            escapeHtml(name) +
            '">' +
            escapeHtml((name || "?").slice(0, 1)) +
            "</span>"
          );
        }
        return (
          '<img class="campfire-ping-face ' +
          escapeHtml(tribe) +
          '" style="--f:' +
          i +
          '" src="' +
          escapeHtml(src) +
          '" alt="' +
          escapeHtml(name) +
          '" decoding="async" />'
        );
      })
      .join("");
    const more =
      extra > 0
        ? '<span class="campfire-ping-more" aria-hidden="true">+' + extra + "</span>"
        : "";
    return faces + more;
  }

  function createBubbleButton(conversation, index) {
    const slot = typeof conversation.slot === "number" ? conversation.slot : index;
    const pos = SLOT_POSITIONS[slot % SLOT_POSITIONS.length];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "campfire-ping";
    btn.style.left = pos.left;
    btn.style.top = pos.top;
    btn.style.setProperty("--i", String(index));
    btn.dataset.id = conversation.id || ("thread-" + index);
    btn.dataset.slot = String(slot % SLOT_POSITIONS.length);
    const names = (conversation.participants || []).map((p) => p.name || p.id).filter(Boolean);
    btn.setAttribute(
      "aria-label",
      (conversation.triggerLabel || "New messages") +
        ". " +
        (names.join(", ") || conversation.subtitle || conversation.title || "Camp thread") +
        (conversation.dayLabel ? ". " + conversation.dayLabel : "")
    );

    const unread = conversation.unread !== false;
    const count = (conversation.participants || []).length;
    btn.innerHTML =
      '<span class="campfire-ping-stack' +
      (count > 2 ? " is-group" : "") +
      '" aria-hidden="true">' +
      facesMarkup(conversation.participants) +
      '<span class="campfire-ping-badge">' +
      '<svg viewBox="0 0 32 32" width="12" height="12" focusable="false">' +
      '<path fill="currentColor" d="M6 7.5c0-1.4 1.1-2.5 2.5-2.5h15c1.4 0 2.5 1.1 2.5 2.5v11c0 1.4-1.1 2.5-2.5 2.5H14.2L9 24.8c-.55.4-1.3-.05-1.2-.7l.55-3.1H8.5C7.1 21 6 19.9 6 18.5v-11z"/>' +
      "</svg>" +
      '<span class="campfire-ping-pulse' +
      (unread ? "" : " is-hidden") +
      '"></span>' +
      "</span>" +
      "</span>" +
      '<span class="campfire-ping-meta">' +
      '<span class="campfire-ping-time">' +
      escapeHtml(conversation.dayLabel || "") +
      "</span>" +
      '<span class="campfire-ping-who">' +
      escapeHtml(names.slice(0, 2).join(" · ") || conversation.title || "Thread") +
      (names.length > 2 ? " +" + (names.length - 2) : "") +
      "</span>" +
      "</span>";

    if (!unread) btn.classList.add("is-read");
    return btn;
  }

  function setPanelMeta(conversation) {
    const titleEl = document.getElementById("campfire-imessage-title");
    const subEl = document.getElementById("campfire-imessage-sub");
    const facesEl = document.getElementById("campfire-imessage-faces");
    if (titleEl) titleEl.textContent = conversation.title || "Messages";
    if (subEl) {
      const stamp = conversation.dayLabel ? " · " + conversation.dayLabel : "";
      subEl.textContent = (conversation.subtitle || "private thread") + stamp;
    }
    if (facesEl) {
      facesEl.innerHTML = facesMarkup(conversation.participants);
    }
  }

  function initEpisodeCampfire() {
    const theater = document.getElementById("campfire-theater");
    if (!theater || theater.getAttribute("data-mode") !== "feed") return;

    const canvas = document.getElementById("campfire-canvas");
    const pingsEl = document.getElementById("campfire-pings");
    const threadEl = document.getElementById("campfire-thread");
    const card = document.getElementById("campfire-imessage");
    const statusEl = document.getElementById("campfire-status");
    const closeBtn = document.getElementById("campfire-imessage-close");
    const hero = theater.closest(".episode-campfire-hero") || theater.closest(".episode-hero");
    if (!canvas || !pingsEl || !threadEl || !card) return;

    const engine = global.CampfireEngine;
    if (!engine || typeof engine.createCampfire !== "function") {
      console.warn("CampfireEngine missing — load campfire-open.js before episode-campfire.js");
      return;
    }

    const fire = engine.createCampfire(canvas);
    const reduce = prefersReducedMotion();
    let conversations = [];
    let abortToken = 0;
    let openId = null;
    let lastViewedId = null;
    let visibleIds = [];
    let revealTimer = 0;
    let holdTimer = 0;
    let bootToken = 0;

    function onResize() {
      fire.resize();
    }
    window.addEventListener("resize", onResize);

    const io =
      "IntersectionObserver" in window
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

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) fire.stop();
      else fire.start();
    });

    theater.classList.add("is-ready");
    requestAnimationFrame(() => theater.classList.add("is-lit"));
    window.setTimeout(
      () => {
        if (hero) hero.classList.add("is-copy-in");
      },
      reduce ? 80 : 900
    );

    function clearThread() {
      threadEl.innerHTML = "";
    }

    function clearRevealTimer() {
      if (revealTimer) {
        window.clearTimeout(revealTimer);
        revealTimer = 0;
      }
    }

    function clearHoldTimer() {
      if (holdTimer) {
        window.clearTimeout(holdTimer);
        holdTimer = 0;
      }
    }

    function syncPingDom() {
      const idSet = {};
      visibleIds.forEach((id) => {
        idSet[id] = true;
      });
      pingsEl.querySelectorAll(".campfire-ping").forEach((btn) => {
        const on = !!idSet[btn.dataset.id];
        const active = openId && btn.dataset.id === openId;
        btn.classList.toggle("is-in", on);
        btn.classList.toggle("is-active", !!active);
        btn.tabIndex = on ? 0 : -1;
        btn.setAttribute("aria-hidden", on ? "false" : "true");
        btn.setAttribute("aria-expanded", active ? "true" : "false");
      });
    }

    function conversationById(id) {
      return conversations.find((c) => c.id === id);
    }

    function nextHiddenId(preferUnread) {
      const hidden = conversations.filter((c) => visibleIds.indexOf(c.id) === -1);
      if (!hidden.length) return null;
      if (preferUnread) {
        const unread = hidden.find((c) => c.unread !== false);
        if (unread) return unread.id;
      }
      return hidden[0].id;
    }

    async function fadeInIds(ids, token, visibleCap) {
      const cap = typeof visibleCap === "number" ? visibleCap : MAX_VISIBLE;
      for (let i = 0; i < ids.length; i += 1) {
        if (token !== bootToken || openId) return;
        const id = ids[i];
        if (visibleIds.indexOf(id) === -1) visibleIds.push(id);
        while (visibleIds.length > cap) visibleIds.shift();
        syncPingDom();
        if (!reduce) await wait(FADE_IN_STAGGER_MS);
      }
    }

    function scheduleHoldRotate() {
      clearHoldTimer();
      if (reduce || openId || conversations.length <= MAX_VISIBLE) return;
      holdTimer = window.setTimeout(() => {
        holdTimer = 0;
        if (openId) return;
        softRotatePair();
      }, BUBBLE_HOLD_MS);
    }

    async function softRotatePair() {
      if (openId || conversations.length <= MAX_VISIBLE) return;
      const token = ++bootToken;
      const keep = visibleIds.slice(0, 1);
      const incoming = nextHiddenId(true);
      if (!incoming) return;
      visibleIds = keep.slice();
      syncPingDom();
      await wait(reduce ? 40 : 900);
      if (token !== bootToken || openId) return;
      await fadeInIds([incoming], token);
      if (token !== bootToken || openId) return;
      scheduleHoldRotate();
    }

    async function bootSequentialBubbles() {
      const token = ++bootToken;
      visibleIds = [];
      syncPingDom();
      const revealCap = conversations.length;

      for (let i = 0; i < conversations.length; i += 1) {
        if (token !== bootToken || openId) return;
        const delay =
          i === 0 ? (reduce ? 80 : FIRST_BUBBLE_DELAY_MS) : reduce ? 40 : NEXT_BUBBLE_DELAY_MS;
        await wait(delay);
        if (token !== bootToken || openId) return;
        await fadeInIds([conversations[i].id], token, revealCap);
      }

      if (token !== bootToken || openId) return;
      scheduleHoldRotate();
    }

    function revealReplacementAfterView() {
      clearRevealTimer();
      const token = bootToken;
      revealTimer = window.setTimeout(async () => {
        revealTimer = 0;
        if (openId || token !== bootToken) return;

        /* Drop the just-viewed bubble from the pair if still present, then fade in another. */
        if (lastViewedId) {
          visibleIds = visibleIds.filter((id) => id !== lastViewedId);
          syncPingDom();
        }

        const incoming = nextHiddenId(true);
        if (!incoming) {
          /* If nothing new, keep companion(s) and refill from remaining if under 2. */
          if (visibleIds.length < MAX_VISIBLE) {
            const fill = nextHiddenId(false);
            if (fill) await fadeInIds([fill], token);
          }
          scheduleHoldRotate();
          return;
        }

        await wait(reduce ? 40 : 600);
        if (openId || token !== bootToken) return;
        await fadeInIds([incoming], token);
        if (openId || token !== bootToken) return;
        /* Ensure we still have a companion when possible */
        if (visibleIds.length < MAX_VISIBLE) {
          const fill = nextHiddenId(false);
          if (fill) await fadeInIds([fill], token);
        }
        scheduleHoldRotate();
      }, reduce ? 80 : REVEAL_AFTER_CLOSE_MS);
    }

    function closePanel() {
      if (!openId && !card.classList.contains("is-in")) return;
      abortToken += 1;
      const viewed = openId || lastViewedId;
      openId = null;
      card.classList.remove("is-in");
      theater.classList.remove("is-reading");
      clearThread();
      pingsEl.querySelectorAll(".campfire-ping").forEach((btn) => {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-expanded", "false");
      });

      /* Keep the other bubble(s) — do not wipe the constellation. */
      if (viewed && visibleIds.indexOf(viewed) === -1) {
        /* viewed id already tracked */
      }
      syncPingDom();
      lastViewedId = viewed;
      revealReplacementAfterView();
    }

    async function openConversation(conversation, btn) {
      if (!conversation) return;
      clearRevealTimer();
      clearHoldTimer();
      abortToken += 1;
      const token = abortToken;
      openId = conversation.id;
      lastViewedId = conversation.id;
      bootToken += 1;

      if (visibleIds.indexOf(conversation.id) === -1) {
        visibleIds.push(conversation.id);
        while (visibleIds.length > MAX_VISIBLE) visibleIds.shift();
      }
      syncPingDom();

      btn.classList.add("is-read", "is-in");
      const pulse = btn.querySelector(".campfire-ping-pulse");
      if (pulse) pulse.classList.add("is-hidden");
      conversation.unread = false;

      theater.classList.add("is-reading");
      setPanelMeta(conversation);
      clearThread();
      card.classList.add("is-in");

      if (statusEl) {
        statusEl.textContent =
          "Playing " +
          (conversation.title || "thread") +
          (conversation.dayLabel ? " · " + conversation.dayLabel : "") +
          ".";
      }

      const play = global.CampChat && global.CampChat.playConversation;
      if (typeof play !== "function") return;

      await wait(reduce ? 40 : 420);
      if (token !== abortToken) return;

      await play(threadEl, conversation, {
        typingMs: reduce ? 0 : typeof conversation.typingMs === "number" ? conversation.typingMs : 1200,
        msgAnimMs: reduce ? 0 : 780,
        isAborted: function () {
          return token !== abortToken;
        }
      });
    }

    function tribeClassFor(conversation) {
      const tribes = (conversation.participants || [])
        .map((p) => p.tribe)
        .filter(Boolean);
      if (!tribes.length) return "mixed";
      const first = tribes[0];
      return tribes.every((t) => t === first) ? first : "mixed";
    }

    function createCampSceneCard(conversation, index) {
      const panelId = "panel-whisper-" + (conversation.id || "thread-" + index);
      const names = (conversation.participants || []).map((p) => p.name || p.id).filter(Boolean);
      const heading =
        names.length > 2
          ? names.slice(0, 2).join(" · ") + " +" + (names.length - 2)
          : names.join(" ↔ ") || conversation.title || "Camp thread";
      const desc = conversation.dayLabel
        ? conversation.dayLabel + " · " + (conversation.subtitle || "private thread")
        : conversation.subtitle || "private thread";
      const root = document.createElement("article");
      root.className = "camp-scene " + tribeClassFor(conversation);
      root.id = "whisper-" + (conversation.id || "thread-" + index);
      root.innerHTML =
        '<div class="camp-scene-embers" aria-hidden="true"></div>' +
        '<div class="camp-scene-body">' +
        '<p class="camp-scene-kicker">Camp whisper</p>' +
        "<h3>" +
        escapeHtml(heading) +
        "</h3>" +
        '<p class="camp-scene-desc">' +
        escapeHtml(desc) +
        "</p>" +
        "</div>" +
        '<div class="camp-chat-trigger-wrap">' +
        '<button type="button" class="camp-chat-trigger" aria-expanded="false" aria-controls="' +
        escapeHtml(panelId) +
        '">' +
        '<span class="camp-chat-trigger-icon" aria-hidden="true">💬</span>' +
        '<span class="camp-chat-trigger-label">' +
        escapeHtml(conversation.triggerLabel || "New thread") +
        "</span>" +
        '<span class="camp-chat-trigger-pulse' +
        (conversation.unread !== false ? "" : " is-hidden") +
        '" aria-hidden="true"></span>' +
        "</button>" +
        "</div>" +
        '<div class="camp-chat-panel" id="' +
        escapeHtml(panelId) +
        '" role="dialog" aria-label="' +
        escapeHtml(heading + " private thread") +
        '">' +
        '<div class="camp-chat-header">' +
        '<button type="button" class="camp-chat-back" aria-label="Close thread">‹</button>' +
        '<div class="camp-chat-header-meta">' +
        '<p class="camp-chat-title">' +
        escapeHtml(conversation.title || "Messages") +
        "</p>" +
        '<p class="camp-chat-subtitle">' +
        escapeHtml(conversation.subtitle || names.join(", ") || "private thread") +
        "</p>" +
        "</div>" +
        "</div>" +
        '<div class="camp-chat-thread"></div>' +
        '<div class="camp-chat-footer">' +
        '<button type="button" class="camp-chat-replay">Replay thread</button>' +
        "</div>" +
        "</div>";
      return root;
    }

    function mountRecentConversations(list) {
      const feed = document.getElementById("camp-whispers-feed");
      if (!feed) return;
      feed.innerHTML = "";
      list.forEach((conversation, index) => {
        const card = createCampSceneCard(conversation, index);
        feed.appendChild(card);
        if (global.CampChat && typeof global.CampChat.mount === "function") {
          global.CampChat.mount(card, conversation);
        }
      });
    }

    function renderPingButtons(list) {
      pingsEl.innerHTML = "";
      list.forEach((conversation, index) => {
        const btn = createBubbleButton(conversation, index);
        btn.addEventListener("click", (event) => {
          event.stopPropagation();
          if (openId === conversation.id && card.classList.contains("is-in")) {
            closePanel();
            return;
          }
          openConversation(conversation, btn);
        });
        pingsEl.appendChild(btn);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        closePanel();
      });
    }

    /* Tap/click outside the message card dismisses it. */
    document.addEventListener("click", (event) => {
      if (!card.classList.contains("is-in")) return;
      if (card.contains(event.target)) return;
      if (event.target.closest && event.target.closest(".campfire-ping")) return;
      closePanel();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && openId) closePanel();
    });

    loadFeed().then((feed) => {
      conversations = resolveLatestConversations(feed.conversations || []).map(enrichConversation);
      if (!conversations.length) {
        if (statusEl) statusEl.textContent = "Campfire is lit. No threads yet.";
        return;
      }

      renderPingButtons(conversations);
      mountRecentConversations(conversations);

      if (statusEl) {
        const stamp = feed.updatedAt ? " Updated " + feed.updatedAt + "." : "";
        statusEl.textContent =
          "Campfire feed: " +
          conversations.length +
          " threads." +
          stamp +
          " New bubbles appear slowly around the fire — click one to listen.";
      }

      if (reduce) {
        visibleIds = conversations.map((c) => c.id);
        syncPingDom();
        return;
      }

      bootSequentialBubbles();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEpisodeCampfire);
  } else {
    initEpisodeCampfire();
  }
})(typeof window !== "undefined" ? window : globalThis);
