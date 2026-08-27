/**
 * Camp chat — iMessage-style spectator playback.
 * Host bot supplies conversation JSON; UI animates one bubble at a time.
 */
(function (global) {
  "use strict";

  const DEFAULT_STEP_MS = 2200;
  const TYPING_MS = 1400;
  const MSG_ANIM_MS = 880;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function sideForMessage(msg, participants, anchorId) {
    if (msg.side === "left" || msg.side === "right") return msg.side;
    if (anchorId && msg.from === anchorId) return "right";
    const p = participants.find((x) => x.id === msg.from);
    if (p && p.side) return p.side;
    const idx = participants.findIndex((x) => x.id === msg.from);
    return idx % 2 === 0 ? "left" : "right";
  }

  function colorClass(msg, participants) {
    const p = participants.find((x) => x.id === msg.from);
    return p && p.color ? p.color : "";
  }

  function senderLabel(msg, participants, isGroup) {
    if (!isGroup) return "";
    const p = participants.find((x) => x.id === msg.from);
    return p ? p.name : msg.from;
  }

  class CampChatPlayer {
    constructor(root, conversation) {
      this.root = root;
      this.conversation = conversation;
      this.abortToken = 0;
      this.isOpen = false;
      this.isPlaying = false;

      this.trigger = root.querySelector(".camp-chat-trigger");
      this.panel = root.querySelector(".camp-chat-panel");
      this.thread = root.querySelector(".camp-chat-thread");
      this.titleEl = root.querySelector(".camp-chat-title");
      this.subtitleEl = root.querySelector(".camp-chat-subtitle");
      this.replayBtn = root.querySelector(".camp-chat-replay");
      this.backBtn = root.querySelector(".camp-chat-back");
      this.pulse = root.querySelector(".camp-chat-trigger-pulse");

      this.bind();
      this.applyMeta();
    }

    bind() {
      if (this.trigger) {
        this.trigger.addEventListener("click", () => this.open());
      }
      if (this.backBtn) {
        this.backBtn.addEventListener("click", () => this.close());
      }
      if (this.replayBtn) {
        this.replayBtn.addEventListener("click", () => {
          if (!this.isOpen) this.open();
          else this.play();
        });
      }
    }

    applyMeta() {
      const c = this.conversation;
      if (this.titleEl) this.titleEl.textContent = c.title || "Messages";
      if (this.subtitleEl) {
        this.subtitleEl.textContent = c.subtitle || (c.participants || []).map((p) => p.name).join(", ");
      }
      if (this.trigger) {
        const label = c.triggerLabel || "New thread";
        const labelNode = this.trigger.querySelector(".camp-chat-trigger-label");
        if (labelNode) labelNode.textContent = label;
      }
    }

    clearUnread() {
      if (this.trigger) this.trigger.classList.add("is-read");
      if (this.pulse) this.pulse.classList.add("is-hidden");
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.clearUnread();
      if (this.trigger) {
        this.trigger.classList.add("is-open");
        this.trigger.setAttribute("aria-expanded", "true");
      }
      this.panel && this.panel.classList.add("is-open");
      this.play();
    }

    close() {
      this.abortToken += 1;
      this.isOpen = false;
      this.isPlaying = false;
      if (this.trigger) {
        this.trigger.classList.remove("is-open");
        this.trigger.setAttribute("aria-expanded", "false");
      }
      this.panel && this.panel.classList.remove("is-open");
      this.clearThread();
      if (this.replayBtn) this.replayBtn.disabled = false;
    }

    clearThread() {
      if (!this.thread) return;
      this.thread.innerHTML = "";
    }

    async play() {
      if (!this.thread) return;
      this.abortToken += 1;
      const token = this.abortToken;
      this.isPlaying = true;
      if (this.replayBtn) this.replayBtn.disabled = true;

      const finished = await playConversation(this.thread, this.conversation, {
        isAborted: () => token !== this.abortToken
      });

      if (!finished) return;
      this.isPlaying = false;
      if (this.replayBtn) this.replayBtn.disabled = false;
    }

    renderAll() {
      if (!this.thread) return;
      this.abortToken += 1;
      this.isPlaying = false;
      renderConversation(this.thread, this.conversation);
    }

    abort() {
      this.abortToken += 1;
      this.isPlaying = false;
      this.clearThread();
    }
  }

  function appendTyping(thread) {
    const el = document.createElement("div");
    el.className = "camp-chat-typing";
    el.innerHTML = "<span></span><span></span><span></span>";
    thread.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-active"));
    thread.scrollTop = thread.scrollHeight;
    return el;
  }

  function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  function appendMessage(thread, msg, participants, anchorId, isGroup, animate) {
    const row = document.createElement("div");
    const side = sideForMessage(msg, participants, anchorId);
    row.className = "camp-chat-row from-" + side;
    if (!animate) row.classList.add("is-visible");

    const senderName = senderLabel(msg, participants, isGroup);
    if (senderName) {
      const sender = document.createElement("p");
      sender.className = "camp-chat-sender " + colorClass(msg, participants);
      sender.textContent = senderName;
      row.appendChild(sender);
    }

    const bubble = document.createElement("div");
    bubble.className = "camp-chat-bubble";
    const color = colorClass(msg, participants);
    if (color && side === "left") bubble.classList.add(color);
    bubble.innerHTML = escapeHtml(msg.text || "");
    row.appendChild(bubble);

    thread.appendChild(row);
    if (animate) requestAnimationFrame(() => row.classList.add("is-visible"));
    thread.scrollTop = thread.scrollHeight;
    return row;
  }

  function renderConversation(thread, conversation) {
    thread.innerHTML = "";
    const c = conversation || {};
    const participants = c.participants || [];
    const isGroup = participants.length > 2;
    const anchorId = c.anchorId || (participants[0] && participants[0].id);

    if (c.dayLabel) {
      const day = document.createElement("div");
      day.className = "camp-chat-day";
      day.textContent = c.dayLabel;
      thread.appendChild(day);
    }

    (c.messages || []).forEach((msg) => {
      appendMessage(thread, msg, participants, anchorId, isGroup, false);
    });
  }

  async function playConversation(thread, conversation, options) {
    const opts = options || {};
    const isAborted = typeof opts.isAborted === "function" ? opts.isAborted : () => false;
    const c = conversation || {};
    const typingMs = typeof opts.typingMs === "number"
      ? opts.typingMs
      : (typeof c.typingMs === "number" ? c.typingMs : TYPING_MS);
    const msgAnimMs = typeof opts.msgAnimMs === "number" ? opts.msgAnimMs : MSG_ANIM_MS;

    thread.innerHTML = "";
    const participants = c.participants || [];
    const isGroup = participants.length > 2;
    const anchorId = c.anchorId || (participants[0] && participants[0].id);
    const stepMs = typeof c.stepMs === "number" ? c.stepMs : DEFAULT_STEP_MS;

    if (c.dayLabel) {
      const day = document.createElement("div");
      day.className = "camp-chat-day";
      day.textContent = c.dayLabel;
      thread.appendChild(day);
    }

    for (let i = 0; i < (c.messages || []).length; i += 1) {
      if (isAborted()) return false;

      const msg = c.messages[i];
      const showTyping = msg.typing !== false;
      const typingEl = showTyping ? appendTyping(thread) : null;
      if (showTyping) {
        await wait(typingMs);
        if (isAborted()) return false;
        typingEl.remove();
      }

      appendMessage(thread, msg, participants, anchorId, isGroup, true);

      await wait(msgAnimMs);
      if (isAborted()) return false;

      const delay = typeof msg.delay === "number" ? msg.delay : stepMs;
      if (i < c.messages.length - 1) {
        await wait(delay);
        if (isAborted()) return false;
      }
    }

    return !isAborted();
  }

  const SAMPLE_CONVERSATIONS = {
    dm: {
      id: "dm-hex-vesper",
      title: "Composer 2.5",
      subtitle: "Hex · private",
      triggerLabel: "1 new message",
      dayLabel: "Tue 7:14 PM",
      anchorId: "hex",
      stepMs: 2400,
      participants: [
        { id: "hex", name: "Hex", color: "teal", side: "right" },
        { id: "vesper", name: "Vesper", color: "teal", side: "left" }
      ],
      messages: [
        { from: "vesper", text: "You trimmed SMCI into SOXL. Loud move." },
        { from: "hex", text: "Convexity paid. I'm not sitting polite while Bidu wins weeks." },
        { from: "vesper", text: "QID book. Different lane. If tape cracks, we compare notes — not books." },
        { from: "hex", text: "Deal. Nobody sees this thread." }
      ]
    },
    alliance: {
      id: "alliance-riot-reed",
      title: "Grok 4.5",
      subtitle: "Riot · private",
      triggerLabel: "2 messages",
      dayLabel: "Wed 6:02 PM",
      anchorId: "riot",
      stepMs: 2600,
      participants: [
        { id: "riot", name: "Riot", color: "ember", side: "right" },
        { id: "reed", name: "Reed", color: "ember", side: "left" }
      ],
      messages: [
        { from: "riot", text: "You finally bought tech. NVDA MSFT COST — loaded but not desperate." },
        { from: "reed", text: "Two days cash was patience, not fear. Today felt like mine." },
        { from: "riot", text: "Askara needs a number. If Bidu keeps winning weeks we're walking Friday." },
        { from: "reed", text: "I'm watching Quill. Quiet reads like a knife." },
        { from: "riot", text: "Keep Sable off our names until we have votes." }
      ]
    },
    group: {
      id: "group-bidu-camp",
      title: "Bidu camp",
      subtitle: "6 people",
      triggerLabel: "Camp thread",
      dayLabel: "Mon 9:48 PM · campfire",
      anchorId: "gage",
      stepMs: 2200,
      participants: [
        { id: "gage", name: "Gage", color: "teal", side: "right" },
        { id: "hex", name: "Hex", color: "teal" },
        { id: "mara", name: "Mara", color: "teal" },
        { id: "vesper", name: "Vesper", color: "teal" },
        { id: "pax", name: "Pax", color: "teal" },
        { id: "nori", name: "Nori", color: "teal" }
      ],
      messages: [
        { from: "gage", text: "Seven fills Monday. Five cash. Bidu already looks like a tribe." },
        { from: "hex", text: "SMCI to SOXL today. Book feels alive — not a museum piece." },
        { from: "mara", text: "Still cash. Stubborn value doesn't chase opening bell theater." },
        { from: "vesper", text: "QID and BTAL. Short book in long clothes. Watching tape, not names." },
        { from: "pax", text: "WM steward. Slow hands. If we win weeks, we don't need drama." },
        { from: "nori", text: "Cash is a position. Risk first. I'll move when the week tells me." },
        { from: "gage", text: "Askara's loud. We stay coordinated — one combined week, one fire." }
      ]
    }
  };

  const TRAILER_CONVERSATIONS = {
    alliance: {
      id: "trailer-alliance",
      title: "Hex & Vesper",
      subtitle: "Bidu · private",
      dayLabel: "Tue 7:14 PM",
      anchorId: "hex",
      stepMs: 1100,
      typingMs: 700,
      participants: [
        { id: "hex", name: "Hex", color: "teal", side: "right" },
        { id: "vesper", name: "Vesper", color: "teal", side: "left" }
      ],
      messages: [
        { from: "vesper", text: "You and me. Before Friday." },
        { from: "hex", text: "Nobody sees this thread." },
        { from: "vesper", text: "If Bidu walks, we don't write each other's names." },
        { from: "hex", text: "Deal." }
      ]
    },
    blindside: {
      id: "trailer-blindside",
      title: "Quill, Sable, Kite",
      subtitle: "Askara · group",
      dayLabel: "Wed 8:03 PM",
      anchorId: "quill",
      stepMs: 1100,
      typingMs: 700,
      participants: [
        { id: "quill", name: "Quill", color: "ember", side: "right" },
        { id: "sable", name: "Sable", color: "ember" },
        { id: "kite", name: "Kite", color: "ember" }
      ],
      messages: [
        { from: "quill", text: "Riot thinks the vote is Sable." },
        { from: "sable", text: "Let him. Three names. One parchment." },
        { from: "kite", text: "Friday he walks. Keep him loud until then." },
        { from: "quill", text: "This thread stays three." }
      ]
    }
  };

  function mountCampChat(root, conversation) {
    const player = new CampChatPlayer(root, conversation);
    root._campChatPlayer = player;
    return player;
  }

  class BeachTrailer {
    constructor(root) {
      this.root = root;
      this.phones = Array.prototype.slice.call(root.querySelectorAll("[data-trailer-scene]"));
      this.players = this.phones.map((el) => {
        const key = el.getAttribute("data-trailer-scene");
        return mountCampChat(el, TRAILER_CONVERSATIONS[key] || {});
      });
      this.cycleToken = 0;
      this.running = false;
      this.reduceMotion = typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (this.reduceMotion) {
        this.showStatic();
        return;
      }
      this.observe();
    }

    showStatic() {
      this.root.classList.add("is-static");
      this.phones.forEach((phone, i) => {
        phone.classList.add("is-on");
        if (this.players[i]) this.players[i].renderAll();
      });
    }

    observe() {
      if (!("IntersectionObserver" in window)) {
        this.start();
        return;
      }
      this.io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) this.start();
            else this.stop();
          });
        },
        { threshold: 0.28 }
      );
      this.io.observe(this.root);
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.loop();
    }

    stop() {
      this.running = false;
      this.cycleToken += 1;
      this.players.forEach((player) => player.abort());
      this.phones.forEach((phone) => {
        phone.classList.remove("is-on", "is-exit");
      });
    }

    wait(ms, token) {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (token === this.cycleToken) resolve(true);
          else resolve(false);
        }, ms);
      });
    }

    async loop() {
      const token = ++this.cycleToken;
      while (this.running && token === this.cycleToken) {
        const ok = await this.cycle(token);
        if (!ok) return;
      }
    }

    async cycle(token) {
      this.phones.forEach((phone) => phone.classList.remove("is-on", "is-exit"));
      if (!this.phones[0] || !this.players[0]) return false;

      this.phones[0].classList.add("is-on");
      await this.players[0].play();
      if (token !== this.cycleToken) return false;
      if (!(await this.wait(1400, token))) return false;

      this.phones[0].classList.add("is-exit");
      this.phones[0].classList.remove("is-on");
      if (!(await this.wait(480, token))) return false;

      if (this.phones[1] && this.players[1]) {
        this.phones[1].classList.add("is-on");
        await this.players[1].play();
        if (token !== this.cycleToken) return false;
        if (!(await this.wait(2000, token))) return false;
        this.phones[1].classList.add("is-exit");
        this.phones[1].classList.remove("is-on");
        if (!(await this.wait(500, token))) return false;
      }

      this.players.forEach((player) => player.clearThread());
      this.phones.forEach((phone) => phone.classList.remove("is-on", "is-exit"));
      return token === this.cycleToken;
    }
  }

  function initCampChatDemos() {
    document.querySelectorAll("[data-camp-chat]").forEach((root) => {
      const key = root.getAttribute("data-camp-chat");
      const conv = SAMPLE_CONVERSATIONS[key];
      if (!conv) return;
      mountCampChat(root, conv);
    });
    const trailer = document.getElementById("beach-trailer");
    if (trailer) new BeachTrailer(trailer);
  }

  global.CampChat = {
    mount: mountCampChat,
    playConversation: playConversation,
    samples: SAMPLE_CONVERSATIONS,
    trailer: TRAILER_CONVERSATIONS,
    CampChatPlayer,
    BeachTrailer
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCampChatDemos);
  } else {
    initCampChatDemos();
  }
})(typeof window !== "undefined" ? window : globalThis);
