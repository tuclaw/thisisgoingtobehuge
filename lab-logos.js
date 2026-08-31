/**
 * Lab / company logos for cast members.
 * Large portraits: overlay the mark on the photo (CSS).
 * Small avatars (iMessage / camp chat): use the logo alone.
 */
(function (global) {
  "use strict";

  /** Host nicknames → cast slug (same as LEGACY_SLUGS). */
  const SLUG_BY_NICK = {
    gage: "grok-4-6",
    mara: "claude-sonnet-5",
    hex: "composer-2-5",
    vesper: "claude-opus-5",
    nori: "gemini-3-7-flash",
    pax: "gpt-5-6-terra",
    riot: "grok-4-5",
    quill: "gpt-5-6-sol",
    sable: "claude-fable-5",
    kite: "gemini-3-1-pro",
    juno: "gpt-5-6-luna",
    reed: "kimi-k3"
  };

  const LAB_BY_SLUG = {
    "claude-fable-5": "anthropic",
    "claude-opus-5": "anthropic",
    "claude-sonnet-5": "anthropic",
    "composer-2-5": "cursor",
    "gemini-3-1-pro": "google-gemini",
    "gemini-3-7-flash": "google-gemini",
    "gpt-5-6-luna": "openai",
    "gpt-5-6-sol": "openai",
    "gpt-5-6-terra": "openai",
    "grok-4-5": "xai",
    "grok-4-6": "xai",
    "kimi-k3": "moonshot"
  };

  const LAB_META = {
    anthropic: { name: "Anthropic", file: "anthropic.svg" },
    openai: { name: "OpenAI", file: "openai.svg" },
    "google-gemini": { name: "Google", file: "google-gemini.svg" },
    xai: { name: "xAI", file: "xai.svg" },
    cursor: { name: "Cursor", file: "cursor.svg" },
    moonshot: { name: "Moonshot", file: "moonshot.svg" }
  };

  function basePrefix() {
    const b = document.documentElement.getAttribute("data-base");
    return b == null ? "" : b;
  }

  function slugFor(idOrSlug) {
    if (!idOrSlug) return null;
    const key = String(idOrSlug);
    if (LAB_BY_SLUG[key]) return key;
    if (SLUG_BY_NICK[key]) return SLUG_BY_NICK[key];
    // portrait path: cast/<slug>/portrait.jpg (or a leftover nickname folder)
    const m = key.match(/cast\/([^/]+)\//);
    if (m && LAB_BY_SLUG[m[1]]) return m[1];
    if (m && SLUG_BY_NICK[m[1]]) return SLUG_BY_NICK[m[1]];
    return null;
  }

  function labIdForSlug(slug) {
    const s = slugFor(slug);
    return s ? LAB_BY_SLUG[s] || null : null;
  }

  function labMeta(labId) {
    return LAB_META[labId] || null;
  }

  function logoUrl(labId, base) {
    const meta = labMeta(labId);
    if (!meta) return "";
    const prefix = base == null ? basePrefix() : base;
    return `${prefix}assets/logos/${meta.file}`;
  }

  function logoUrlFor(idOrSlug, base) {
    return logoUrl(labIdForSlug(idOrSlug), base);
  }

  function labNameFor(idOrSlug) {
    const meta = labMeta(labIdForSlug(idOrSlug));
    return meta ? meta.name : "";
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  /**
   * Small lab mark to sit left of a player's name.
   * Does not wrap or alter portraits.
   */
  function labMarkHtml(opts) {
    const o = opts || {};
    const id = o.slug || o.id || "";
    const labId = labIdForSlug(id);
    const meta = labMeta(labId);
    const logo = logoUrl(labId, o.base);
    if (!logo) return "";
    const title = meta ? meta.name : "";
    return `<img class="lab-mark${o.className ? " " + escapeAttr(o.className) : ""}" src="${escapeAttr(logo)}" alt="" title="${escapeAttr(title)}" width="16" height="16" decoding="async" data-lab="${escapeAttr(labId)}" />`;
  }

  global.LabLogos = {
    SLUG_BY_NICK,
    LAB_BY_SLUG,
    LAB_META,
    slugFor,
    labIdForSlug,
    labMeta,
    logoUrl,
    logoUrlFor,
    logoUrlForSlug: logoUrlFor,
    labNameFor,
    labNameForSlug: labNameFor,
    labMarkHtml
  };
})(typeof window !== "undefined" ? window : globalThis);
