#!/usr/bin/env node
/** Host/dev cloud agents pin Cursor Grok or Composer. Other models are ask-brain only. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function check(name, ok, detail) {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
}

const ALLOWED_MODEL = /^(cursor-grok-4\.[56](-high)?(-fast)?|composer-2\.5(-fast)?)(\[[^\]]*\])?$/;
const BANNED_SONNET = /claude-sonnet-4|sonnet-4\.5|sonnet 4\.5|claude-4-sonnet/i;

const requiredAgents = [
  "explore.md",
  "bash.md",
  "browser.md",
  "computer-use.md",
  "video-review.md",
  "debugger.md"
];

const agentsDir = join(root, ".cursor", "agents");
check("agents-dir", existsSync(agentsDir));

for (const file of requiredAgents) {
  check(`exists:${file}`, existsSync(join(agentsDir, file)));
}

if (existsSync(agentsDir)) {
  const files = readdirSync(agentsDir).filter((name) => name.endsWith(".md"));
  check("has-pinned-agents", files.length > 0);
  for (const file of files) {
    const text = readFileSync(join(agentsDir, file), "utf8");
    const match = text.match(/^model:\s*(\S+)/m);
    const model = match && match[1].trim();
    check(`model-present:${file}`, Boolean(model));
    check(`model-allowed:${file}`, Boolean(model && ALLOWED_MODEL.test(model)), model || "missing");
    check(`no-inherit:${file}`, model !== "inherit");
    check(`no-sonnet-slug:${file}`, !BANNED_SONNET.test(text));
  }
}

const rulePath = join(root, ".cursor", "rules", "cloud-agent-models.mdc");
check("rule-exists", existsSync(rulePath));
if (existsSync(rulePath)) {
  const rule = readFileSync(rulePath, "utf8");
  check("rule-always-apply", /alwaysApply:\s*true/.test(rule));
  check("rule-requires-task-model", /pass `model`/i.test(rule) || /Task tool/.test(rule));
  check("rule-names-grok", /cursor-grok-4\.6-high-fast/.test(rule));
  check("rule-names-composer", /composer-2\.5/.test(rule));
  check("rule-bans-sonnet", /Sonnet 4\.x/.test(rule) || /Sonnet 4\.5/.test(rule));
  check("rule-ask-brain-only", /ask-brain/.test(rule));
}

const agentsMd = readFileSync(join(root, "AGENTS.md"), "utf8");
check("agents-md-section", /## Cloud Agent models/.test(agentsMd));
check("agents-md-task-explicit", /always pass `model` explicitly/.test(agentsMd));
check("agents-md-bans-sonnet", /Never\*\* use Claude Sonnet 4\.5/.test(agentsMd) || /\*\*Never\*\* use Claude Sonnet 4\.5/.test(agentsMd));
check("agents-md-ask-brain-only", /only exception/.test(agentsMd) && /ask-brain/.test(agentsMd));

const gameMd = readFileSync(join(root, "GAME.md"), "utf8");
check("game-md-ask-brain-only", /ask-brain only/.test(gameMd));
check("game-md-host-stays-grok-composer", /Host, reviewer, and cloud sub-agents stay on Cursor Grok or Composer/.test(gameMd));

if (failures.length) {
  console.error("cloud-agent-models failed:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(`cloud-agent-models ok (${requiredAgents.length} pinned sub-agents)`);
