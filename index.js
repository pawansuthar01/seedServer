import "dotenv/config";
import express from "express";

// dynamic import (important for ts seed file)
const { default: main } = await import("./seed-lagar.ts");

const app = express();
app.use(express.json());

/* ===================================================== */
/* GLOBAL STATE */
/* ===================================================== */

let isSeeding = false;
let seedStartedAt = null;

/* ===================================================== */
/* SSE CLIENTS */
/* ===================================================== */

const clients = [];

/* ===================================================== */
/* CONSOLE OVERRIDE (LOG + SSE + PUSH) */
/* ===================================================== */

const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  const message = args.join(" ");
  const timestamp = new Date().toISOString();
  originalLog(`[${timestamp}] ${message}`);

  clients.forEach((c) => {
    c.res.write(`data: ${JSON.stringify({ message, timestamp })}\n\n`);
  });

  if (process.env.PUSH_URL && !process.env.PUSH_URL.includes("localhost")) {
    fetch(process.env.PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, timestamp }),
    }).catch(() => {});
  }
};

console.error = (...args) => {
  const message = "ERROR: " + args.join(" ");
  const timestamp = new Date().toISOString();
  originalError(`[${timestamp}] ${message}`);

  clients.forEach((c) => {
    c.res.write(`data: ${JSON.stringify({ message, timestamp })}\n\n`);
  });
};

/* ===================================================== */
/* REQUEST LOGGER */
/* ===================================================== */

app.use((req, res, next) => {
  if (!["/events", "/logs"].includes(req.url)) {
    console.log(`${req.method} ${req.url} - IP: ${req.ip}`);
  }
  next();
});

/* ===================================================== */
/* SSE ENDPOINT */
/* ===================================================== */

app.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const client = { res };
  clients.push(client);

  req.on("close", () => {
    clients.splice(clients.indexOf(client), 1);
  });
});

/* ===================================================== */
/* LOG VIEWER PAGE */
/* ===================================================== */

app.get("/logs", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Lagar Seeding Logs</title>
  <style>
    body { font-family: Arial; margin: 20px; }
    #logs { height: 420px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background: #f9f9f9; }
    .log { font-size: 14px; margin-bottom: 6px; }
    .time { color: #666; }
    button { padding: 10px 16px; margin-top: 12px; cursor: pointer; }
  </style>
</head>
<body>
  <h2>Lagar Database Seeding</h2>
  <button onclick="startSeed()">Start Seed</button>
  <div id="status"></div>
  <div id="logs"></div>

<script>
  const logs = document.getElementById("logs");
  const status = document.getElementById("status");
  const es = new EventSource("/events");

  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    const div = document.createElement("div");
    div.className = "log";
    div.innerHTML = "<span class='time'>[" + data.timestamp + "]</span> " + data.message;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
  };

  function startSeed() {
    fetch("/push-in-db")
      .then(r => r.json())
      .then(d => {
        status.innerText = d.message;
      });
  }
</script>
</body>
</html>
`);
});

/* ===================================================== */
/* SEED STATUS */
/* ===================================================== */

app.get("/seed-status", (req, res) => {
  res.json({
    running: isSeeding,
    startedAt: seedStartedAt,
  });
});

/* ===================================================== */
/* 🔥 BACKGROUND SEED TRIGGER (IMPORTANT) */
/* ===================================================== */

app.get("/push-in-db", (req, res) => {
  if (isSeeding) {
    return res.status(409).json({
      message: "⚠️ Seeding already running",
      startedAt: seedStartedAt,
    });
  }

  console.log("🌱 Seed triggered by user");
  isSeeding = true;
  seedStartedAt = new Date();

  // 🚀 FIRE & FORGET (BACKGROUND)
  (async () => {
    try {
      await main();
      console.log("🎉 Lagar seed completed successfully");
    } catch (e) {
      console.error("❌ Seed failed", e);
    } finally {
      isSeeding = false;
      seedStartedAt = null;
    }
  })();

  // ⚡ RETURN IMMEDIATELY
  res.json({
    message: "✅ Seeding started in background. You may close this page.",
    startedAt: seedStartedAt,
  });
});

/* ===================================================== */
/* ROOT */
/* ===================================================== */

app.get("/", (req, res) => {
  res.send("Server running. Open /logs to view seeding progress.");
});

/* ===================================================== */
/* START SERVER */
/* ===================================================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
