/**
 * Episode landing campfire — same living fire as the island open,
 * with host-bot conversation bubbles that fade around the pit.
 * Click a bubble to play the real thread; nothing autoplays.
 */
(function (global) {
  "use strict";

  const SLOT_POSITIONS = [
    { left: "18%", top: "42%" },
    { left: "82%", top: "38%" },
    { left: "22%", top: "72%" },
    { left: "78%", top: "70%" },
    { left: "50%", top: "18%" }
  ];

  const FADE_IN_STAGGER_MS = 720;
  const BUBBLE_HOLD_MS = 5200;
  const BUBBLE_GAP_MS = 900;
  const FEED_PATHS = [
    "conversations.json",
    "./conversations.json",
    "seasons/1/conversations.json"
  ];

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
      .replace(/"/g, "&quot;");
  }

  function assetBase() {
    const raw = document.documentElement.getAttribute("data-base");
    return raw == null ? "" : raw;
  }

  function resolveFeedPaths() {
    const base = assetBase();
    const custom = document.querySelector("[data-conversation-feed]");
    const fromAttr = custom && custom.getAttribute("data-conversation-feed");
    const paths = [];
    if (fromAttr) paths.push(fromAttr);
    if (global.EPISODE_CONVERSATIONS) return paths;
    FEED_PATHS.forEach((p) => {
      if (p.indexOf("seasons/") === 0) paths.push(base + p);
      else paths.push(p);
    });
    return paths;
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
    if (global.CampChat && global.CampChat.samples) {
      const samples = global.CampChat.samples;
      return {
        updatedAt: null,
        source: "fallback-samples",
        conversations: [samples.dm, samples.alliance, samples.group].filter(Boolean)
      };
    }
    return { conversations: [] };
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
    btn.setAttribute(
      "aria-label",
      (conversation.triggerLabel || "New messages") +
        ". " +
        (conversation.subtitle || conversation.title || "Camp thread") +
        (conversation.dayLabel ? ". " + conversation.dayLabel : "")
    );

    const unread = conversation.unread !== false;
    btn.innerHTML =
      '<span class="campfire-ping-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 32 32" width="18" height="18" focusable="false">' +
      '<path fill="currentColor" d="M6 7.5c0-1.4 1.1-2.5 2.5-2.5h15c1.4 0 2.5 1.1 2.5 2.5v11c0 1.4-1.1 2.5-2.5 2.5H14.2L9 24.8c-.55.4-1.3-.05-1.2-.7l.55-3.1H8.5C7.1 21 6 19.9 6 18.5v-11z"/>' +
      "</svg>" +
      '<span class="campfire-ping-pulse' +
      (unread ? "" : " is-hidden") +
      '"></span>' +
      "</span>" +
      '<span class="campfire-ping-meta">' +
      '<span class="campfire-ping-time">' +
      escapeHtml(conversation.dayLabel || "") +
      "</span>" +
      '<span class="campfire-ping-who">' +
      escapeHtml(conversation.title || "Thread") +
      "</span>" +
      "</span>";

    if (!unread) btn.classList.add("is-read");
    return btn;
  }

  function setPanelMeta(conversation) {
    const titleEl = document.getElementById("campfire-imessage-title");
    const subEl = document.getElementById("campfire-imessage-sub");
    if (titleEl) titleEl.textContent = conversation.title || "Messages";
    if (subEl) {
      const stamp = conversation.dayLabel ? " · " + conversation.dayLabel : "";
      subEl.textContent = (conversation.subtitle || "private thread") + stamp;
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
    let cycleToken = 0;
    let openId = null;
    let cycling = true;

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

    function closePanel() {
      abortToken += 1;
      openId = null;
      card.classList.remove("is-in");
      theater.classList.remove("is-reading");
      clearThread();
      pingsEl.querySelectorAll(".campfire-ping").forEach((btn) => {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-expanded", "false");
      });
      cycling = true;
      if (!reduce) startPingCycle();
    }

    async function openConversation(conversation, btn) {
      if (!conversation) return;
      abortToken += 1;
      cycleToken += 1;
      const token = abortToken;
      openId = conversation.id;
      cycling = false;

      /* Keep the chosen bubble lit while the rest dim. */
      setPingVisibility([conversation.id]);

      pingsEl.querySelectorAll(".campfire-ping").forEach((el) => {
        el.classList.toggle("is-active", el === btn);
        el.setAttribute("aria-expanded", el === btn ? "true" : "false");
      });

      btn.classList.add("is-read");
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

    function renderPingButtons(list) {
      pingsEl.innerHTML = "";
      list.forEach((conversation, index) => {
        const btn = createBubbleButton(conversation, index);
        btn.addEventListener("click", () => {
          if (openId === conversation.id && card.classList.contains("is-in")) {
            closePanel();
            return;
          }
          openConversation(conversation, btn);
        });
        pingsEl.appendChild(btn);
      });
    }

    function setPingVisibility(ids) {
      const idSet = {};
      ids.forEach((id) => {
        idSet[id] = true;
      });
      pingsEl.querySelectorAll(".campfire-ping").forEach((btn) => {
        const on = !!idSet[btn.dataset.id];
        btn.classList.toggle("is-in", on);
        btn.tabIndex = on ? 0 : -1;
        btn.setAttribute("aria-hidden", on ? "false" : "true");
      });
    }

    function startPingCycle() {
      cycleToken += 1;
      cyclePings(cycleToken);
    }

    async function cyclePings(token) {
      if (reduce || conversations.length === 0) return;
      const maxVisible = Math.min(4, conversations.length);

      while (cycling && !openId && token === cycleToken) {
        const start = Math.floor(Math.random() * conversations.length);
        const next = [];
        for (let i = 0; i < maxVisible; i += 1) {
          next.push(conversations[(start + i) % conversations.length].id);
        }

        setPingVisibility([]);
        await wait(BUBBLE_GAP_MS);
        if (!cycling || openId || token !== cycleToken) break;

        for (let i = 0; i < next.length; i += 1) {
          if (!cycling || openId || token !== cycleToken) break;
          setPingVisibility(next.slice(0, i + 1));
          await wait(FADE_IN_STAGGER_MS);
        }
        if (!cycling || openId || token !== cycleToken) break;

        await wait(BUBBLE_HOLD_MS);
        if (!cycling || openId || token !== cycleToken) break;

        setPingVisibility([]);
        await wait(1100);
      }
    }

    if (closeBtn) closeBtn.addEventListener("click", closePanel);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && openId) closePanel();
    });

    loadFeed().then((feed) => {
      conversations = (feed.conversations || []).slice();
      if (!conversations.length) {
        if (statusEl) statusEl.textContent = "Campfire is lit. No threads yet.";
        return;
      }

      renderPingButtons(conversations);

      if (statusEl) {
        const stamp = feed.updatedAt ? " Updated " + feed.updatedAt + "." : "";
        statusEl.textContent =
          "Campfire feed: " + conversations.length + " threads." + stamp + " Click a bubble to listen.";
      }

      if (reduce) {
        setPingVisibility(conversations.slice(0, 4).map((c) => c.id));
        return;
      }

      window.setTimeout(() => {
        startPingCycle();
      }, 1200);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEpisodeCampfire);
  } else {
    initEpisodeCampfire();
  }
})(typeof window !== "undefined" ? window : globalThis);
