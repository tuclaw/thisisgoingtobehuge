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

      this.clearThread();
      const c = this.conversation;
      const participants = c.participants || [];
      const isGroup = participants.length > 2;
      const anchorId = c.anchorId || participants[0] && participants[0].id;
      const stepMs = typeof c.stepMs === "number" ? c.stepMs : DEFAULT_STEP_MS;

      if (c.dayLabel) {
        const day = document.createElement("div");
        day.className = "camp-chat-day";
        day.textContent = c.dayLabel;
        this.thread.appendChild(day);
      }

      for (let i = 0; i < (c.messages || []).length; i += 1) {
        if (token !== this.abortToken) return;

        const msg = c.messages[i];
        const showTyping = msg.typing !== false && i < c.messages.length - 1;
        const typingEl = this.appendTyping();
        await this.wait(TYPING_MS, token);
        if (token !== this.abortToken) return;
        typingEl.remove();

        const row = document.createElement("div");
        const side = sideForMessage(msg, participants, anchorId);
        row.className = "camp-chat-row from-" + side;

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

        this.thread.appendChild(row);
        requestAnimationFrame(() => row.classList.add("is-visible"));
        this.thread.scrollTop = this.thread.scrollHeight;

        await this.wait(MSG_ANIM_MS, token);
        if (token !== this.abortToken) return;

        const delay = typeof msg.delay === "number" ? msg.delay : stepMs;
        if (showTyping || i < c.messages.length - 1) {
          await this.wait(delay, token);
        }
      }

      if (token !== this.abortToken) return;
      this.isPlaying = false;
      if (this.replayBtn) this.replayBtn.disabled = false;
    }

    appendTyping() {
      const el = document.createElement("div");
      el.className = "camp-chat-typing";
      el.innerHTML = "<span></span><span></span><span></span>";
      this.thread.appendChild(el);
      requestAnimationFrame(() => el.classList.add("is-active"));
      this.thread.scrollTop = this.thread.scrollHeight;
      return el;
    }

    wait(ms, token) {
      return new Promise((resolve) => {
        const t = setTimeout(() => {
          if (token === this.abortToken) resolve();
        }, ms);
      });
    }
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

  function mountCampChat(root, conversation) {
    const player = new CampChatPlayer(root, conversation);
    root._campChatPlayer = player;
    return player;
  }

  function initCampChatDemos() {
    document.querySelectorAll("[data-camp-chat]").forEach((root) => {
      const key = root.getAttribute("data-camp-chat");
      const conv = SAMPLE_CONVERSATIONS[key];
      if (!conv) return;
      mountCampChat(root, conv);
    });
  }

  global.CampChat = {
    mount: mountCampChat,
    samples: SAMPLE_CONVERSATIONS,
    CampChatPlayer
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCampChatDemos);
  } else {
    initCampChatDemos();
  }
})(typeof window !== "undefined" ? window : globalThis);
