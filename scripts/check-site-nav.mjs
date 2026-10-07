#!/usr/bin/env node
/** Every public page stamps the same header from templates/partials/site-nav.html. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function check(ok, message) {
  if (!ok) errors.push(message);
}

const EXPECTED = [
  {
    label: "Island",
    test: (href) => href.endsWith("index.html") && !href.includes("seasons/")
  },
  {
    label: "Seasons",
    test: (href) => href.endsWith("seasons/") || href.endsWith("seasons/index.html")
  },
  {
    label: "Season 2",
    test: (href) => href.endsWith("seasons/2/index.html")
  },
  {
    label: "Island Chatter",
    test: (href) => href.endsWith("seasons/2/social.html")
  },
  {
    label: "Rules",
    test: (href) => href.endsWith("rules.html")
  }
];

const SHELLS = [
  "templates/island.html",
  "templates/rules.html",
  "templates/season.html",
  "templates/season2-index.html",
  "templates/slack-mirror.html",
  "templates/survivor.html",
  "demos/camp-chat.html",
  "demos/logo-faces.html"
];

const siteNav = readFileSync(join(root, "templates", "partials", "site-nav.html"), "utf8");
const flame = readFileSync(join(root, "templates", "partials", "flame.svg"), "utf8");
const buildSrc = readFileSync(join(root, "scripts", "build.mjs"), "utf8");
const appSrc = readFileSync(join(root, "app.js"), "utf8");
const styles = readFileSync(join(root, "styles.css"), "utf8");
const slackCss = readFileSync(join(root, "slack-mirror.css"), "utf8");

check(siteNav.includes("{{partial:flame}}"), "site nav must use the shared flame partial");
check(siteNav.includes("Last Trader Standing"), "site nav must keep the Last Trader Standing wordmark");
check(flame.includes('class="fm-mid"'), "shared flame must be the full mark (inner flame), not the outer-only stub");
check(!siteNav.includes(">Cast<") && !siteNav.includes("data-nav-watch"), "site nav must not revive Cast or Watch");
check(!/>\s*Contribute\s*</.test(siteNav), "site nav must not include a Contribute link");

const partialLinks = navLinks(siteNav.replaceAll("{{base}}", ""));
check(
  partialLinks.length === EXPECTED.length &&
    partialLinks.every((link, i) => link.text === EXPECTED[i].label && EXPECTED[i].test(link.href)),
  "site-nav.html links must be Island, Seasons, Season 2, Island Chatter, Rules in that order"
);
check(
  siteNav.includes('class="nav-chatter"') && siteNav.includes("nav-chatter-dot") && siteNav.includes("data-nav-chatter"),
  "site nav Island Chatter link must keep the notification dot"
);

for (const rel of SHELLS) {
  const html = readFileSync(join(root, rel), "utf8");
  check(html.includes("{{partial:site-nav}}"), `${rel} must include {{partial:site-nav}}`);
  check(html.includes("{{partial:chatter-ping}}"), `${rel} must include {{partial:chatter-ping}}`);
  check(!html.includes('<ul class="nav-links">'), `${rel} must not keep a hand-written nav list`);
}

check(buildSrc.includes("siteNavHtml("), "episode renderer must stamp siteNavHtml");
check(buildSrc.includes("chatterPingHtml("), "episode renderer must stamp the Island Chatter ping");
check(!buildSrc.includes('<ul class="nav-links">'), "build.mjs must not keep a second hand-written nav");
check(!appSrc.includes('link.textContent = "Contribute"'), "app.js must not append Contribute onto the shared nav");
check(!styles.includes(".open-page .torch-nav"), "homepage must not restyle .torch-nav");
check(!slackCss.includes(".slack-mirror-page .torch-nav"), "Island Chatter must not restyle .torch-nav");

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name.endsWith(".html")) out.push(path);
  }
  return out;
}

function torchHeader(html) {
  const start = html.indexOf('<header class="torch-nav">');
  if (start < 0) return "";
  const end = html.indexOf("</header>", start);
  if (end < 0) return "";
  return html.slice(start, end + "</header>".length);
}

function navLinks(header) {
  const ulStart = header.indexOf('<ul class="nav-links">');
  const ulEnd = header.indexOf("</ul>", ulStart);
  if (ulStart < 0 || ulEnd < 0) return [];
  const ul = header.slice(ulStart, ulEnd);
  const links = [];
  for (const match of ul.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = match[1];
    const href = (attrs.match(/href="([^"]*)"/) || [])[1] || "";
    const text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    links.push({
      href,
      text,
      current: /aria-current="page"/.test(attrs)
    });
  }
  return links;
}

const dist = join(root, "dist");
const pages = walk(dist);
check(pages.length > 0, "dist/ must exist so built headers can be compared (run npm run build)");
let stamped = 0;
for (const path of pages) {
  const html = readFileSync(path, "utf8");
  const header = torchHeader(html);
  if (!header) continue;
  stamped += 1;
  const rel = relative(root, path);
  const links = navLinks(header);
  const currents = links.filter((link) => link.current).length;
  check(currents <= 1, `${rel} header has ${currents} active links`);
  check(header.includes('class="fm-mid"'), `${rel} header must use the full flame mark`);
  check(header.includes("Last Trader Standing"), `${rel} header missing wordmark`);
  const ok =
    links.length === EXPECTED.length &&
    links.every((link, i) => link.text === EXPECTED[i].label && EXPECTED[i].test(link.href));
  check(ok, `${rel} nav is ${links.map((link) => link.text).join(" · ") || "(empty)"}`);
}
check(stamped >= 8, `expected shared headers on built pages, found ${stamped}`);

if (errors.length) {
  console.error("check-site-nav failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`check-site-nav ok (${stamped} pages)`);
