/**
 * Headless check: scrolling an iMessage thread away from the bottom pauses
 * playback timing; returning to the bottom resumes it.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME_PATH || "google-chrome";

const conversation = {
  dayLabel: "Test",
  anchorId: "a",
  stepMs: 800,
  participants: [
    { id: "a", name: "A", color: "teal", side: "right" },
    { id: "b", name: "B", color: "teal", side: "left" }
  ],
  messages: [
    { from: "b", text: "First message that should stay visible while you scroll." },
    { from: "a", text: "Second message — pause should hold before this arrives if scrolled." },
    { from: "b", text: "Third message after resume." },
    { from: "a", text: "Fourth message near the end of the thread." },
    { from: "b", text: "Fifth message to ensure overflow in the panel." },
    { from: "a", text: "Sixth and final message for the scroll pause check." }
  ]
};

function mime(path) {
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  return "text/html";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="/camp-chat.css" />
  <style>
    body { margin: 0; background: #111; }
    .camp-chat-panel.trailer-frame {
      position: relative; width: 320px; height: 280px; max-height: 280px;
      opacity: 1; visibility: visible; transform: none; pointer-events: auto;
      border-radius: 22px; margin: 24px;
      display: flex; flex-direction: column;
    }
    .camp-chat-thread { max-height: 180px; }
  </style>
</head>
<body data-phase="boot">
  <div class="camp-chat-panel trailer-frame is-open">
    <div class="camp-chat-header"><div class="camp-chat-header-meta">
      <p class="camp-chat-title">Scroll pause test</p>
      <p class="camp-chat-subtitle">automated</p>
    </div></div>
    <div class="camp-chat-thread" id="thread"></div>
  </div>
  <script src="/camp-chat.js"></script>
  <script>
    (async function () {
      function publish(result) {
        document.body.setAttribute("data-phase", result.ok ? "done" : "err");
        document.body.setAttribute("data-result", JSON.stringify(result));
      }
      try {
        const thread = document.getElementById("thread");
        const conv = ${JSON.stringify(conversation)};
        const gate = CampChat.attachThreadScrollGate(thread);
        const started = performance.now();

        const playPromise = CampChat.playConversation(thread, conv, {
          typingMs: 120,
          msgAnimMs: 120,
          scrollGate: gate,
          isAborted: function () { return false; }
        });

        for (let i = 0; i < 100; i++) {
          await new Promise((r) => setTimeout(r, 50));
          const rows = thread.querySelectorAll(".camp-chat-row").length;
          if (rows >= 3 && thread.scrollHeight > thread.clientHeight + 24) break;
        }

        if (!(thread.scrollHeight > thread.clientHeight + 8)) {
          publish({
            ok: false,
            error: "thread never overflowed",
            scrollHeight: thread.scrollHeight,
            clientHeight: thread.clientHeight,
            rows: thread.querySelectorAll(".camp-chat-row").length
          });
          return;
        }

        thread.scrollTop = 0;
        await new Promise((r) => setTimeout(r, 40));
        if (gate.isPinned()) {
          publish({
            ok: false,
            error: "expected unpinned after scrollTop=0",
            scrollTop: thread.scrollTop,
            scrollHeight: thread.scrollHeight,
            clientHeight: thread.clientHeight
          });
          return;
        }

        const midCount = thread.querySelectorAll(".camp-chat-row").length;
        await new Promise((r) => setTimeout(r, 900));
        const pausedCount = thread.querySelectorAll(".camp-chat-row").length;
        if (pausedCount !== midCount) {
          publish({
            ok: false,
            error: "messages kept arriving while scrolled up",
            midCount: midCount,
            pausedCount: pausedCount
          });
          return;
        }

        thread.scrollTop = thread.scrollHeight;
        await new Promise((r) => setTimeout(r, 40));
        if (!gate.isPinned()) {
          publish({ ok: false, error: "expected pinned after scroll to bottom" });
          return;
        }

        const finished = await playPromise;
        const finalCount = thread.querySelectorAll(".camp-chat-row").length;
        gate.destroy();
        publish({
          ok: finished === true && finalCount === conv.messages.length && pausedCount === midCount,
          finished: finished,
          midCount: midCount,
          pausedCount: pausedCount,
          finalCount: finalCount,
          expected: conv.messages.length,
          elapsedMs: Math.round(performance.now() - started)
        });
      } catch (err) {
        publish({ ok: false, error: String(err && err.stack || err) });
      }
    })();
  </script>
</body>
</html>`;

const server = createServer((req, res) => {
  const url = req.url.split("?")[0];
  try {
    if (url === "/" || url === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
      return;
    }
    const file = join(ROOT, url.replace(/^\//, ""));
    const body = readFileSync(file);
    res.writeHead(200, { "Content-Type": mime(file) });
    res.end(body);
  } catch (err) {
    res.writeHead(404);
    res.end(String(err));
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const pageUrl = `http://127.0.0.1:${port}/`;
const userDataDir = `/tmp/imessage-scroll-check-${process.pid}`;

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--user-data-dir=${userDataDir}`,
    "--remote-debugging-port=0",
    pageUrl
  ],
  { stdio: ["ignore", "pipe", "pipe"] }
);

let debugPort = null;
let stderr = "";
chrome.stderr.on("data", (chunk) => {
  const text = String(chunk);
  stderr += text;
  const match = text.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
  if (match) debugPort = Number(match[1]);
});

for (let i = 0; i < 50 && !debugPort; i += 1) await sleep(100);
if (!debugPort) {
  chrome.kill("SIGKILL");
  server.close();
  throw new Error("Chrome DevTools port not found\n" + stderr);
}

const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((r) => r.json());
const page = targets.find((t) => t.type === "page") || targets[0];
if (!page || !page.webSocketDebuggerUrl) {
  chrome.kill("SIGKILL");
  server.close();
  throw new Error("No Chrome page target");
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", () => resolve(), { once: true });
  ws.addEventListener("error", (event) => reject(event.error || new Error("WebSocket error")), { once: true });
});

let nextId = 1;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(String(event.data));
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await send("Runtime.enable");

let result = null;
for (let i = 0; i < 120; i += 1) {
  const evaluated = await send("Runtime.evaluate", {
    expression: "document.body.getAttribute('data-result')",
    returnByValue: true
  });
  const value = evaluated.result && evaluated.result.value;
  if (value) {
    result = JSON.parse(value);
    break;
  }
  await sleep(150);
}

ws.close();
chrome.kill("SIGKILL");
server.close();

if (!result || !result.ok) {
  console.error("imessage scroll pause check failed:", result);
  process.exit(1);
}

console.log("imessage scroll pause checks passed", result);
