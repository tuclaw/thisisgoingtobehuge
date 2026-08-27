#!/usr/bin/env node
/** Derive the board and stamp the public GitHub Pages tree into dist/. */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LEGACY_SLUGS, deriveSeason } from "./lib/ledger.mjs";
import { writeBoard } from "./derive-board.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const templates = join(root, "templates");

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function render(template, vars) {
  let out = template.replace(/\{\{partial:([\w-]+)\}\}/g, (_, name) => {
    const file = name === "flame" ? join(templates, "partials", "flame.svg") : join(templates, "partials", `${name}.html`);
    return read(file);
  });
  out = out.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => (vars[key] ? inner : ""));
  out = out.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] == null ? "" : String(vars[key])));
  return out;
}

function injectFallback(html, base) {
  const tag = `<script src="${base}season.fallback.js"></script>\n`;
  if (html.includes("season.fallback.js")) return html;
  if (html.includes('src="app.js"')) return html.replace('<script src="app.js"></script>', `${tag}<script src="app.js"></script>`);
  if (html.includes('src="../app.js"')) {
    return html.replace('<script src="../app.js"></script>', `${tag}<script src="../app.js"></script>`);
  }
  if (html.includes('src="../../app.js"')) {
    return html.replace('<script src="../../app.js"></script>', `${tag}<script src="../../app.js"></script>`);
  }
  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function portraitFor(slug, base) {
  return `${base}cast/${slug}/portrait.jpg`;
}

function notesHtml(notes) {
  if (!Array.isArray(notes) || !notes.length) return "";
  return `<div class="beat-note">${notes.map((line) => `<p>${line}</p>`).join("")}</div>`;
}

function boothsHtml(items, base) {
  return `<div class="booths">${items
    .map((item) => {
      return `<article class="booth ${escapeHtml(item.tribeId)}">
              <div class="buff-strip" aria-hidden="true"></div>
              <img class="booth-portrait" src="${portraitFor(item.slug, base)}" alt="${escapeHtml(item.name)}" />
              <p class="booth-tribe">${item.tribeId === "askara" ? "Askara" : "Bidu"}</p>
              <h3>${escapeHtml(item.name)}</h3>
              <blockquote>
                <p>${escapeHtml(item.quote)}</p>
              </blockquote>
            </article>`;
    })
    .join("\n")}</div>`;
}

function beatHtml(beat, base) {
  const id = beat.id ? ` id="${escapeHtml(beat.id)}"` : "";
  const kicker = beat.kicker ? `<p class="section-kicker">${escapeHtml(beat.kicker)}</p>` : "";
  const title = beat.title ? `<h2>${escapeHtml(beat.title)}</h2>` : "";
  const body = beat.body ? `<p>${beat.body}</p>` : "";
  if (beat.type === "camp") {
    return `<article class="beat"${id}>
          ${kicker}
          ${title}
          ${body}
          <div class="tribe-split camp-split">
            <article class="tribe-banner bidu">
              <div class="buff-strip" aria-hidden="true"></div>
              <p class="buff-name">Ocean teal</p>
              <h3>Bidu camp</h3>
              <p>Open. I stay out.</p>
            </article>
            <article class="tribe-banner askara">
              <div class="buff-strip" aria-hidden="true"></div>
              <p class="buff-name">Ember orange</p>
              <h3>Askara camp</h3>
              <p>Open. I stay out.</p>
            </article>
          </div>
        </article>`;
  }
  if (beat.type === "books") {
    const tribes = beat.tribesId ? `<div class="tribe-totals" id="${escapeHtml(beat.tribesId)}"></div>` : "";
    const board = beat.boardId ? `<div class="day-board" id="${escapeHtml(beat.boardId)}"></div>` : "";
    return `<article class="beat"${id}>
          ${kicker}
          ${title}
          ${body}
          ${tribes}
          ${board}
          ${notesHtml(beat.notes)}
        </article>`;
  }
  if (beat.type === "booths") {
    return `<article class="beat"${id}>
          ${kicker}
          ${title}
          ${body}
          ${boothsHtml(beat.items || [], base)}
        </article>`;
  }
  if (beat.type === "tribal") {
    return `<article class="beat beat-dark"${id}>
          ${kicker}
          ${title}
          ${body}
          <div class="council-stage" id="episode-tribal">
            <p>Friday night. Losing tribe walks in. Nobody wears a necklace. The vote is social.</p>
          </div>
        </article>`;
  }
  if (beat.type === "lunch-chats") {
    const audience = beat.audienceCut ? `<p class="audience-cut">${escapeHtml(beat.audienceCut)}</p>` : "";
    const threads = (beat.threads || [])
      .map((thread) => {
        return `<article class="camp-scene ${escapeHtml(thread.tribeId)}" id="${escapeHtml(thread.id)}">
              <div class="camp-scene-embers" aria-hidden="true"></div>
              <div class="camp-scene-body">
                <p class="camp-scene-kicker">Audience only</p>
                <h3>${escapeHtml(thread.heading)}</h3>
                <p class="camp-scene-desc">${escapeHtml(thread.desc)}</p>
              </div>
              <div class="camp-chat-trigger-wrap">
                <button type="button" class="camp-chat-trigger" aria-expanded="false" aria-controls="${escapeHtml(thread.panelId)}">
                  <span class="camp-chat-trigger-icon" aria-hidden="true">💬</span>
                  <span class="camp-chat-trigger-label">${escapeHtml(thread.triggerLabel)}</span>
                  <span class="camp-chat-trigger-pulse" aria-hidden="true"></span>
                </button>
              </div>
              <div class="camp-chat-panel" id="${escapeHtml(thread.panelId)}" role="dialog" aria-label="${escapeHtml(thread.ariaLabel)}">
                <div class="camp-chat-header">
                  <button type="button" class="camp-chat-back" aria-label="Close thread">‹</button>
                  <div class="camp-chat-header-meta">
                    <p class="camp-chat-title">${escapeHtml(thread.title)}</p>
                    <p class="camp-chat-subtitle">${escapeHtml(thread.subtitle)}</p>
                  </div>
                </div>
                <div class="camp-chat-thread"></div>
                <div class="camp-chat-footer">
                  <button type="button" class="camp-chat-replay">Replay thread</button>
                </div>
              </div>
            </article>`;
      })
      .join("\n\n            ");
    return `<article class="beat"${id}>
          ${audience}
          ${kicker}
          ${title}
          ${body}
          <div class="camp-chat-demo lunch-chats">
            ${threads}
          </div>
        </article>`;
  }
  return `<article class="beat"${id}>
          ${kicker}
          ${title}
          ${body}
          ${notesHtml(beat.notes)}
        </article>`;
}

function episodeHasLunchChats(episode) {
  return (episode.days || []).some((day) => (day.beats || []).some((beat) => beat.type === "lunch-chats"));
}

function renderEpisodePage(episode, season, base) {
  const flame = read(join(templates, "partials", "flame.svg"));
  const lunchChats = episodeHasLunchChats(episode);
  const lunchCss = lunchChats ? `\n  <link rel="stylesheet" href="${base}camp-chat.css" />` : "";
  const lunchScripts = lunchChats
    ? `\n  <script src="${base}camp-chat.js"></script>\n  <script src="e01-thursday-lunch.js"></script>`
    : "";
  const rail = (episode.rail || [])
    .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.day)}<span>${escapeHtml(item.sub)}</span></a>`)
    .join("\n      ");
  const spine = (episode.spine || [])
    .map((item) => `<li><span>${escapeHtml(item.day)}</span> ${escapeHtml(item.text)}</li>`)
    .join("\n      ");
  const days = (episode.days || [])
    .map((day) => {
      const dark = day.dark ? " day-fold-dark" : "";
      const beats = (day.beats || []).map((beat) => beatHtml(beat, base)).join("\n\n        ");
      return `<details class="day-fold${dark}" id="${escapeHtml(day.id)}">
      <summary>
        <span class="fold-day">${escapeHtml(day.foldDay)}</span>
        <span class="fold-copy">
          <strong>${escapeHtml(day.foldTitle)}</strong>
          <em>${escapeHtml(day.foldEm)}</em>
        </span>
      </summary>
      <div class="fold-body">
        ${beats}
      </div>
    </details>`;
    })
    .join("\n\n    ");

  return `<!DOCTYPE html>
<html lang="en" data-page="episode" data-season="${episode.season || season.season}" data-episode="${episode.number}" data-base="${base}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=IM+Fell+English:ital@0;1&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <title>Season ${episode.season || season.season} ${escapeHtml(episode.title)} — Last Trader Standing</title>
  <meta name="description" content="${escapeHtml(episode.description || episode.location || "")}" />
  <link rel="stylesheet" href="${base}styles.css" />${lunchCss}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</head>
<body class="episode-page">
  <a class="skip" href="#episode">Skip to episode</a>
  <header class="torch-nav">
    <a class="brand" href="${base}index.html">
      ${flame}
      Last Trader Standing
    </a>
    <nav>
      <ul class="nav-links">
        <li><a href="${base}index.html">Island</a></li>
        <li><a href="${base}seasons/${episode.season || season.season}/">Season ${episode.season || season.season}</a></li>
        <li><a href="${base}index.html#cast">Cast</a></li>
        <li><a href="${base}rules.html">Rules</a></li>
      </ul>
    </nav>
  </header>

  <section class="episode-hero" id="episode">
    <div class="hero-embers" aria-hidden="true"></div>
    <div class="hero-inner">
      <p class="eyebrow">${escapeHtml(episode.kicker)}</p>
      <h1>${escapeHtml(episode.title)}<span>${escapeHtml(episode.subhead)}</span></h1>
      <p class="location">${escapeHtml(episode.location)}</p>
      <p class="host-line">Hosted by Liquidation Island</p>
      <p class="hero-note">${escapeHtml(episode.heroNote || "")}</p>
    </div>
  </section>

  <div class="wrap" id="episode-root">
    <nav class="day-rail" aria-label="Episode days">
      ${rail}
    </nav>

    <article class="beat beat-gold" id="week-board">
      <p class="section-kicker">${escapeHtml(episode.weekBoard.kicker)}</p>
      <h2>${escapeHtml(episode.weekBoard.title)}</h2>
      <p>${episode.weekBoard.lede}</p>
      <div class="preseason-banner" id="season-banner">${escapeHtml(season.statusLabel || "")}</div>
      <div class="tribe-totals" id="episode-tribe-totals"></div>
      <p class="holdings-kicker" id="holdings-kicker">${escapeHtml(episode.weekBoard.lede)}</p>
      <div class="holdings" id="episode-holdings"></div>
      <p class="json-miss hidden" id="json-miss"></p>
    </article>

    <ol class="week-spine visually-hidden" id="week-spine" aria-label="This week">
      ${spine}
    </ol>

    ${days}
  </div>

  <footer>
    <p><strong>Last Trader Standing</strong> · Season ${episode.season || season.season} ${escapeHtml(episode.title)} · Liquidation Island</p>
    <p>The week is the episode.</p>
  </footer>

  <script src="${base}season.fallback.js"></script>
  <script src="${base}tribal-spoiler-burn.js"></script>
  <script src="${base}app.js"></script>${lunchScripts}
</body>
</html>
`;
}

function copyStatic() {
  const files = [
    "app.js",
    "styles.css",
    "camp-chat.js",
    "camp-chat.css",
    "campfire-open.js",
    "tribal-spoiler-burn.js",
    "CNAME",
    ".nojekyll",
    "favicon.svg",
    "favicon-32.png",
    "favicon.ico",
    "apple-touch-icon.png"
  ];
  for (const file of files) {
    const src = join(root, file);
    if (existsSync(src)) cpSync(src, join(dist, file));
  }
  cpSync(join(root, "cast"), join(dist, "cast"), { recursive: true });
  const thursdayLunch = join(root, "seasons/1/e01-thursday-lunch.js");
  if (existsSync(thursdayLunch)) {
    mkdirSync(join(dist, "seasons/1"), { recursive: true });
    cpSync(thursdayLunch, join(dist, "seasons/1/e01-thursday-lunch.js"));
  }
}

function render404(cast) {
  const map = { ...LEGACY_SLUGS };
  const entries = Object.entries(map)
    .map(([legacy, slug]) => `    "${legacy}": "${slug}.html"`)
    .join(",\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Last Trader Standing</title>
  <script>
    (function () {
      var map = {
${entries}
      };
      var parts = location.pathname.replace(/\\/+$/, "").split("/");
      var last = (parts[parts.length - 1] || "").replace(/\\.html$/i, "");
      if (map[last]) {
        location.replace("/survivors/" + map[last] + location.search + location.hash);
        return;
      }
      location.replace("/index.html");
    })();
  </script>
</head>
<body>
  <p><a href="/index.html">Last Trader Standing</a></p>
</body>
</html>
`;
}

export function build(rootDir = root, destDir = dist) {
  const source = JSON.parse(read(join(rootDir, "data", "season1.json")));
  const board = deriveSeason(source);
  if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true });
  mkdirSync(destDir, { recursive: true });
  writeBoard(board, join(destDir, "season1.json"));
  write(join(destDir, "season.fallback.js"), `window.__SEASON_FALLBACK__ = ${JSON.stringify(board)};\n`);

  write(join(destDir, "index.html"), injectFallback(read(join(templates, "island.html")), ""));
  write(join(destDir, "rules.html"), injectFallback(read(join(templates, "rules.html")), ""));
  write(join(destDir, "seasons/1/index.html"), injectFallback(read(join(templates, "season.html")), "../../"));

  const episode = JSON.parse(read(join(rootDir, "data", "episodes", "s1e01.json")));
  write(join(destDir, "seasons/1/e01.html"), renderEpisodePage(episode, board, "../../"));

  const survivorTpl = read(join(templates, "survivor.html"));
  const redirectTpl = read(join(templates, "redirect.html"));
  for (const member of source.cast) {
    write(
      join(destDir, "survivors", `${member.slug}.html`),
      render(survivorTpl, { slug: member.slug, name: member.name, base: "../" })
    );
  }
  for (const [legacy, slug] of Object.entries(LEGACY_SLUGS)) {
    const member = source.cast.find((c) => c.slug === slug);
    write(
      join(destDir, "survivors", `${legacy}.html`),
      render(redirectTpl, { target: `${slug}.html`, name: member ? member.name : slug })
    );
  }
  write(join(destDir, "404.html"), render404(source.cast));
  copyStatic();
  return { destDir, survivors: board.survivors.length, snapshots: board.snapshots.length };
}

if (process.argv[1] && process.argv[1].endsWith("build.mjs")) {
  const result = build();
  console.log(`built ${result.destDir} (${result.survivors} survivors, ${result.snapshots} snapshots)`);
}
