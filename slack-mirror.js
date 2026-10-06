/**
 * Season 2 — read-only Slack-style mirror. Loads data/slack-tape/mirror.json.
 */
(function (global) {
  "use strict";

  const SECTION_ORDER = [
    { key: "camp", label: "Camp" },
    { key: "fire", label: "Fire" },
    { key: "alliances", label: "Alliances" },
    { key: "dms", label: "Direct messages" },
    { key: "control", label: "Control room" }
  ];

  function basePath() {
    const b = document.documentElement.getAttribute("data-base");
    return b == null ? "" : b;
  }

  function tapeUrl() {
    const el = document.getElementById("slack-mirror-root");
    const path = el && el.getAttribute("data-tape");
    return (path || "data/slack-tape/mirror.json").replace(/^\//, "");
  }

  function portraitUrl(slug) {
    return `${basePath()}cast/${slug}/portrait.jpg`;
  }

  function formatTs(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch (e) {
      return iso;
    }
  }

  function channelPrefix(ch) {
    if (ch.kind === "dm") return "";
    if (ch.section === "alliances" || ch.section === "control") return "🔒 ";
    return "#";
  }

  function filterChannels(tape) {
    const showControl = tape.options && tape.options.includeControlRoom === true;
    return (tape.channels || []).filter((ch) => {
      if (ch.audienceMirror === false && !showControl) return false;
      return true;
    });
  }

  function memberMap(tape) {
    const map = new Map();
    for (const m of tape.members || []) {
      map.set(m.id, m);
    }
    return map;
  }

  function messagesForChannel(tape, channelId) {
    return (tape.messages || []).filter((m) => m.channelId === channelId);
  }

  function topLevelMessages(msgs) {
    return msgs.filter((m) => !m.threadParentId);
  }

  function repliesFor(msgs, parentId) {
    return msgs
      .filter((m) => m.threadParentId === parentId)
      .sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  }

  function avatarHtml(member, base) {
    const slug = member.slug || member.id;
    const tribe = member.tribe || "";
    const initial = (member.displayName || "?").charAt(0);
    const src = portraitUrl(slug);
    return (
      '<img class="slack-mirror-avatar' +
      (tribe ? " " + tribe : "") +
      '" src="' +
      base +
      "cast/" +
      slug +
      '/portrait.jpg" alt="" width="36" height="36" loading="lazy" decoding="async" ' +
      'onerror="this.replaceWith((function(){var s=document.createElement(\'span\');s.className=\'slack-mirror-avatar fallback' +
      (tribe ? " " + tribe : "") +
      "';s.textContent='" +
      initial.replace(/'/g, "") +
      "';return s;})())\" />"
    );
  }

  function messageRow(member, msg, base, opts) {
    const tribe = member && member.tribe ? member.tribe : "";
    const name = member ? member.displayName : msg.authorId;
    return (
      '<article class="slack-mirror-msg" data-msg-id="' +
      msg.id +
      '">' +
      avatarHtml(member || { id: msg.authorId, displayName: "?", slug: "composer-2-5" }, base) +
      '<div class="slack-mirror-msg-inner">' +
      '<div class="slack-mirror-msg-head">' +
      '<span class="slack-mirror-msg-name' +
      (tribe ? " " + tribe : "") +
      '">' +
      escapeHtml(name) +
      "</span>" +
      '<time class="slack-mirror-msg-time" datetime="' +
      escapeHtml(msg.ts) +
      '">' +
      escapeHtml(formatTs(msg.ts)) +
      "</time>" +
      "</div>" +
      '<p class="slack-mirror-msg-body">' +
      escapeHtml(msg.text) +
      "</p>" +
      (opts.threadToggle || "") +
      (opts.threadBlock || "") +
      "</div></article>"
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderMessages(tape, channel, members, base) {
    const all = messagesForChannel(tape, channel.id);
    const tops = topLevelMessages(all).sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
    if (!tops.length) {
      return '<p class="slack-mirror-empty">No messages in this channel yet.</p>';
    }
    let html = "";
    for (const msg of tops) {
      const author = members.get(msg.authorId);
      const replies = repliesFor(all, msg.id);
      const count = msg.replyCount != null ? msg.replyCount : replies.length;
      let threadToggle = "";
      let threadBlock = "";
      if (count > 0 && replies.length) {
        threadToggle =
          '<button type="button" class="slack-mirror-thread-toggle" data-thread="' +
          msg.id +
          '" aria-expanded="false">' +
          count +
          " repl" +
          (count === 1 ? "y" : "ies") +
          "</button>";
        threadBlock =
          '<div class="slack-mirror-thread" hidden data-thread-panel="' +
          msg.id +
          '">' +
          replies
            .map((r) => messageRow(members.get(r.authorId), r, base, {}))
            .join("") +
          "</div>";
      }
      html += messageRow(author, msg, base, { threadToggle, threadBlock });
    }
    return html;
  }

  function renderChannelList(channels) {
    const bySection = new Map();
    for (const ch of channels) {
      const sec = ch.section || "camp";
      if (!bySection.has(sec)) bySection.set(sec, []);
      bySection.get(sec).push(ch);
    }
    let html = '<p class="slack-mirror-workspace">Liquidation Island</p>';
    for (const { key, label } of SECTION_ORDER) {
      const list = bySection.get(key);
      if (!list || !list.length) continue;
      html += '<p class="slack-mirror-section-label">' + escapeHtml(label) + "</p>";
      for (const ch of list) {
        const display = ch.label || ch.name;
        const name =
          ch.kind === "dm" ? display : String(display).replace(/^#/, "");
        html +=
          '<button type="button" class="slack-mirror-channel" data-channel-id="' +
          escapeHtml(ch.id) +
          '">' +
          (ch.kind === "dm"
            ? ""
            : '<span class="slack-mirror-channel-prefix">' +
              escapeHtml(channelPrefix(ch)) +
              "</span>") +
          '<span class="slack-mirror-channel-name">' +
          escapeHtml(name) +
          "</span></button>";
      }
    }
    return html;
  }

  function setHash(channelId) {
    const next = "channel=" + encodeURIComponent(channelId);
    if (location.hash.replace(/^#/, "") !== next) {
      history.replaceState(null, "", "#" + next);
    }
  }

  function channelFromHash() {
    const m = location.hash.replace(/^#/, "").match(/(?:^|&)channel=([^&]+)/);
    if (m) return decodeURIComponent(m[1]);
    const p = new URLSearchParams(location.hash.replace(/^#/, ""));
    return p.get("channel");
  }

  function bindThreadToggles(root) {
    root.querySelectorAll(".slack-mirror-thread-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-thread");
        const panel = root.querySelector('[data-thread-panel="' + id + '"]');
        if (!panel) return;
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        panel.hidden = open;
      });
    });
  }

  function selectChannel(tape, channels, channelId, members, base, root) {
    const ch = channels.find((c) => c.id === channelId) || channels[0];
    if (!ch) return;
    setHash(ch.id);
    root.querySelectorAll(".slack-mirror-channel").forEach((btn) => {
      btn.setAttribute("aria-current", btn.getAttribute("data-channel-id") === ch.id ? "true" : "false");
    });
    const title = document.getElementById("slack-mirror-channel-title");
    const topic = document.getElementById("slack-mirror-channel-topic");
    if (title) {
      title.textContent =
        ch.kind === "dm" ? ch.label : (ch.label || "#" + ch.name).replace(/^#?/, "#");
    }
    if (topic) {
      topic.textContent = ch.topic || "";
      topic.hidden = !ch.topic;
    }
    const pane = document.getElementById("slack-mirror-messages");
    if (pane) {
      pane.innerHTML = renderMessages(tape, ch, members, base);
      bindThreadToggles(pane);
    }
  }

  function init() {
    const root = document.getElementById("slack-mirror-root");
    if (!root) return;
    const base = basePath();
    const url = base + tapeUrl();
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((tape) => {
        const channels = filterChannels(tape);
        const members = memberMap(tape);
        const sidebar = document.getElementById("slack-mirror-sidebar");
        if (sidebar) sidebar.innerHTML = renderChannelList(channels);
        const wanted = channelFromHash();
        const startId = wanted && channels.some((c) => c.id === wanted) ? wanted : channels[0]?.id;
        selectChannel(tape, channels, startId, members, base, root);
        root.querySelectorAll(".slack-mirror-channel").forEach((btn) => {
          btn.addEventListener("click", () => {
            selectChannel(tape, channels, btn.getAttribute("data-channel-id"), members, base, root);
          });
        });
        global.addEventListener("hashchange", () => {
          const id = channelFromHash();
          if (id && channels.some((c) => c.id === id)) {
            selectChannel(tape, channels, id, members, base, root);
          }
        });
      })
      .catch((err) => {
        const pane = document.getElementById("slack-mirror-messages");
        if (pane) {
          pane.innerHTML =
            '<p class="slack-mirror-error">Could not load slack tape: ' + escapeHtml(err.message) + "</p>";
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
