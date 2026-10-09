/**
 * Season 2 — read-only Slack-style mirror. Loads data/slack-tape/mirror.json.
 */
(function (global) {
  "use strict";

  const SECTION_ORDER = [
    { key: "camp", label: "Camp" },
    { key: "fire", label: "Fire" },
    { key: "tribal", label: "Tribal" },
    { key: "alliances", label: "Alliances" },
    { key: "dms", label: "DMs" },
    { key: "confessionals", label: "Confessionals" },
    { key: "control", label: "Control room" }
  ];

  const READ_STORAGE_KEY = "lts-slack-mirror-read";
  const VISITED_STORAGE_KEY = "lts-island-chatter-visited";
  const PT = "America/Los_Angeles";

  function markIslandChatterVisited() {
    try {
      localStorage.setItem(VISITED_STORAGE_KEY, "1");
    } catch (e) {}
    document.documentElement.classList.remove("has-chatter-ping");
  }

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

  function dayKeyPt(iso) {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: PT,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date(iso));
    } catch (e) {
      return "";
    }
  }

  function audienceDayKey(tape) {
    if (tape.audienceDay) return String(tape.audienceDay);
    return dayKeyPt(tape.updatedAt || new Date().toISOString());
  }

  function isOnAudienceDay(ts, dayKey) {
    return dayKeyPt(ts) === dayKey;
  }

  function readStorageKey(tape) {
    return READ_STORAGE_KEY + ":" + (tape.updatedAt || tape.audienceDay || "tape");
  }

  function loadReadChannels(tape) {
    try {
      const raw = sessionStorage.getItem(readStorageKey(tape));
      if (!raw) return new Set();
      const list = JSON.parse(raw);
      return new Set(Array.isArray(list) ? list : []);
    } catch (e) {
      return new Set();
    }
  }

  function markChannelRead(tape, channelId) {
    const read = loadReadChannels(tape);
    read.add(channelId);
    try {
      sessionStorage.setItem(readStorageKey(tape), JSON.stringify([...read]));
    } catch (e) {}
    return read;
  }

  function channelsWithTodayActivity(tape, channels, dayKey) {
    const ids = new Set();
    for (const msg of tape.messages || []) {
      if (!isOnAudienceDay(msg.ts, dayKey)) continue;
      if (channels.some((c) => c.id === msg.channelId)) ids.add(msg.channelId);
    }
    return ids;
  }

  function unreadChannelIds(tape, channels, dayKey, readSet) {
    const today = channelsWithTodayActivity(tape, channels, dayKey);
    const unread = new Set();
    for (const id of today) {
      if (!readSet.has(id)) unread.add(id);
    }
    return unread;
  }

  function unreadDividerHtml(dayKey) {
    const label = "New today · " + dayKey;
    return (
      '<div class="slack-mirror-unread-line" id="slack-mirror-unread-marker" role="separator" aria-label="' +
      escapeHtml(label) +
      '"><span class="slack-mirror-unread-label">' +
      escapeHtml(label) +
      "</span></div>"
    );
  }

  function formatTs(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        timeZone: PT,
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

  function isPlainChannel(ch) {
    return ch.kind === "dm" || ch.kind === "confessional";
  }

  function channelPrefix(ch) {
    if (isPlainChannel(ch)) return "";
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
    const todayClass = opts.isToday ? " slack-mirror-msg--today" : "";
    return (
      '<article class="slack-mirror-msg' +
      todayClass +
      '" data-msg-id="' +
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

  function renderMessages(tape, channel, members, base, dayKey) {
    const all = messagesForChannel(tape, channel.id);
    const tops = topLevelMessages(all).sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
    if (!tops.length) {
      return '<p class="slack-mirror-empty">No messages in this channel yet.</p>';
    }
    const firstTodayIdx = tops.findIndex((m) => isOnAudienceDay(m.ts, dayKey));
    const showDivider = firstTodayIdx > 0;
    let html = "";
    for (let i = 0; i < tops.length; i++) {
      const msg = tops[i];
      if (showDivider && i === firstTodayIdx) {
        html += unreadDividerHtml(dayKey);
      }
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
            .map((r) =>
              messageRow(members.get(r.authorId), r, base, {
                isToday: isOnAudienceDay(r.ts, dayKey)
              })
            )
            .join("") +
          "</div>";
      }
      html += messageRow(author, msg, base, {
        threadToggle,
        threadBlock,
        isToday: isOnAudienceDay(msg.ts, dayKey)
      });
    }
    if (firstTodayIdx === 0 && tops.some((m) => isOnAudienceDay(m.ts, dayKey))) {
      html = unreadDividerHtml(dayKey) + html;
    }
    return html;
  }

  function renderChannelList(channels, unreadIds) {
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
          isPlainChannel(ch) ? display : String(display).replace(/^#/, "");
        const hasUnread = unreadIds && unreadIds.has(ch.id);
        html +=
          '<button type="button" class="slack-mirror-channel' +
          (hasUnread ? " has-unread" : "") +
          '" data-channel-id="' +
          escapeHtml(ch.id) +
          '">' +
          (isPlainChannel(ch)
            ? ""
            : '<span class="slack-mirror-channel-prefix">' +
              escapeHtml(channelPrefix(ch)) +
              "</span>") +
          '<span class="slack-mirror-channel-name">' +
          escapeHtml(name) +
          "</span>" +
          (hasUnread
            ? '<span class="slack-mirror-unread-dot" aria-label="New messages today"></span>'
            : "") +
          "</button>";
      }
    }
    return html;
  }

  function mirrorRoot() {
    return document.getElementById("slack-mirror-root");
  }

  function mirrorIsEmbedded() {
    const root = mirrorRoot();
    return Boolean(root && root.getAttribute("data-embed") === "home");
  }

  function setHash(channelId) {
    if (mirrorIsEmbedded()) return;
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

  function refreshSidebar(tape, channels, dayKey, readSet, root, activeId) {
    const unreadIds = unreadChannelIds(tape, channels, dayKey, readSet);
    const sidebar = document.getElementById("slack-mirror-sidebar");
    if (!sidebar) return unreadIds;
    // The previous aria-current is still on the old row until this rebuild.
    // Prefer the channel being opened so the blue wash follows the pane.
    const current = activeId || channelFromHash();
    sidebar.innerHTML = renderChannelList(channels, unreadIds);
    root.querySelectorAll(".slack-mirror-channel").forEach((btn) => {
      const id = btn.getAttribute("data-channel-id");
      btn.setAttribute("aria-current", id === current ? "true" : "false");
      btn.addEventListener("click", () => {
        selectChannel(tape, channels, id, membersFromRoot(root), basePath(), root, dayKey);
      });
    });
    return unreadIds;
  }

  function membersFromRoot(root) {
    return root.__slackMembers || new Map();
  }

  function scrollToUnreadMarker(pane) {
    const marker = pane && pane.querySelector("#slack-mirror-unread-marker");
    if (!marker || !pane) return;
    // Scroll the message pane only. Moving the marker in the window also
    // scrolls the document, and on a phone the sticky header then covers the channel list.
    requestAnimationFrame(() => {
      if (pane.scrollHeight <= pane.clientHeight + 1) return;
      const paneRect = pane.getBoundingClientRect();
      const markerRect = marker.getBoundingClientRect();
      const delta = markerRect.top - paneRect.top - (pane.clientHeight - markerRect.height) / 2;
      pane.scrollTo({ top: Math.max(0, pane.scrollTop + delta), behavior: "smooth" });
    });
  }

  function selectChannel(tape, channels, channelId, members, base, root, dayKey) {
    const ch = channels.find((c) => c.id === channelId) || channels[0];
    if (!ch) return;
    setHash(ch.id);
    const readSet = markChannelRead(tape, ch.id);
    refreshSidebar(tape, channels, dayKey, readSet, root, ch.id);
    const title = document.getElementById("slack-mirror-channel-title");
    const topic = document.getElementById("slack-mirror-channel-topic");
    if (title) {
      title.textContent = isPlainChannel(ch)
        ? ch.label
        : (ch.label || "#" + ch.name).replace(/^#?/, "#");
    }
    if (topic) {
      topic.textContent = ch.topic || "";
      topic.hidden = !ch.topic;
    }
    const pane = document.getElementById("slack-mirror-messages");
    if (pane) {
      pane.innerHTML = renderMessages(tape, ch, members, base, dayKey);
      bindThreadToggles(pane);
      scrollToUnreadMarker(pane);
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
        const dayKey = audienceDayKey(tape);
        root.__slackMembers = members;
        const readSet = loadReadChannels(tape);
        refreshSidebar(tape, channels, dayKey, readSet, root);
        const wanted = mirrorIsEmbedded() ? "" : channelFromHash();
        const startId = wanted && channels.some((c) => c.id === wanted) ? wanted : channels[0]?.id;
        selectChannel(tape, channels, startId, members, base, root, dayKey);
        if (!mirrorIsEmbedded()) {
          global.addEventListener("hashchange", () => {
            const id = channelFromHash();
            if (id && channels.some((c) => c.id === id)) {
              selectChannel(tape, channels, id, members, base, root, dayKey);
            }
          });
        }
      })
      .catch((err) => {
        const pane = document.getElementById("slack-mirror-messages");
        if (pane) {
          pane.innerHTML =
            '<p class="slack-mirror-error">Could not load slack tape: ' + escapeHtml(err.message) + "</p>";
        }
      });
  }

  function boot() {
    if (!mirrorIsEmbedded()) markIslandChatterVisited();
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
