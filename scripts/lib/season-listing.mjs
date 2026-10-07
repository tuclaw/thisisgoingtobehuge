/** Spoiler-free season / episode listing HTML for the public seasons index. */

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function seasonListingStatus(season) {
  const status = season && season.status;
  if (status === "ended" || status === "closed") return "Closed";
  if (status === "live") return "Live";
  return "";
}

export function episodeListingStatus(ep) {
  if (!ep || ep.status === "locked" || !ep.path) return { locked: true, live: false, label: "Unlit" };
  if (ep.status === "live") return { locked: false, live: true, label: "Now playing" };
  if (ep.status === "closed" || ep.status === "cut") return { locked: false, live: false, label: "Closed" };
  return { locked: false, live: false, label: ep.status || "Cut" };
}

export function episodePublicHref(ep) {
  const path = String((ep && ep.path) || "").replace(/^\//, "");
  return path ? "/" + path : "";
}

function uniqueEpisodes(season) {
  const byNum = new Map();
  const rows = Array.isArray(season && season.episodes) ? season.episodes : [];
  rows.forEach((ep) => {
    if (ep && ep.number != null) byNum.set(ep.number, ep);
  });
  return [...byNum.values()].sort((a, b) => (a.number || 0) - (b.number || 0));
}

export function episodeFoldHtml(ep, href) {
  const title = escapeHtml((ep && ep.title) || "Episode " + ((ep && ep.number) || ""));
  const label = escapeHtml((ep && ep.weekLabel) || "");
  const status = episodeListingStatus(ep);
  const meta = [status.label, label].filter(Boolean).join(" · ");
  if (status.locked) {
    return `<details class="episode-fold">
      <summary>
        <span class="ep-fold-title">${title}</span>
        <span class="ep-fold-meta">${escapeHtml(meta)}</span>
      </summary>
      <div class="episode-card locked" aria-disabled="true">
        <p class="ep-kicker">Torches unlit</p>
        <h3>${title}</h3>
        ${label ? `<p>${label}</p>` : ""}
        <p class="ep-locked-note">After Friday tribal</p>
      </div>
    </details>`;
  }
  const liveClass = status.live ? " live" : " closed";
  const safeHref = escapeHtml(href || episodePublicHref(ep));
  return `<details class="episode-fold">
    <summary>
      <span class="ep-fold-title">${title}</span>
      <span class="ep-fold-meta">${escapeHtml(meta)}</span>
    </summary>
    <a class="episode-card${liveClass}" href="${safeHref}">
      <p class="ep-kicker">${escapeHtml(status.label)}</p>
      <h3>${title}</h3>
      ${label ? `<p>${label}</p>` : ""}
    </a>
  </details>`;
}

export function episodeFoldsHtml(season, hrefFor = episodePublicHref) {
  return uniqueEpisodes(season)
    .map((ep) => episodeFoldHtml(ep, hrefFor(ep)))
    .join("");
}

export function seasonFoldHtml(season, { id, title, episodesHtml }) {
  const number = season && season.season != null ? season.season : "";
  const heading = escapeHtml(title || (number ? "Season " + number : "Season"));
  const status = escapeHtml(seasonListingStatus(season));
  const foldId = id || (number ? "season-" + number : "season");
  return `<details class="season-fold" id="${escapeHtml(foldId)}">
    <summary>
      <span class="season-fold-title">${heading}</span>
      ${status ? `<span class="season-fold-meta">${status}</span>` : ""}
    </summary>
    <div class="episode-list" data-season-episodes="${escapeHtml(String(number))}">
      ${episodesHtml}
    </div>
  </details>`;
}
