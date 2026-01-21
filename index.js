import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

/* ================= SSE ================= */

const clients = [];

const originalLog = console.log;
console.log = (...args) => {
  const msg = args.join(" ");
  const time = new Date().toISOString();
  originalLog(`[${time}] ${msg}`);
  clients.forEach((c) =>
    c.res.write(
      `data: ${JSON.stringify({ message: msg, timestamp: time })}\n\n`,
    ),
  );
};

app.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const client = { res };
  clients.push(client);
  req.on("close", () => clients.splice(clients.indexOf(client), 1));
});

/* ================= UI ================= */

app.get("/logs", (_, res) => {
  res.send(`
    <h2>Lagar Seed</h2>
    <button onclick="start()">Start Seed</button>
    <pre id="log"></pre>
    <script>
      const log = document.getElementById("log");
      new EventSource("/events").onmessage = e => {
        const d = JSON.parse(e.data);
        log.textContent += "[" + d.timestamp + "] " + d.message + "\\n";
      };
      function start() {
        fetch("/start-seed", { method: "POST" })
          .then(r => r.json())
          .then(console.log);
      }
    </script>
  `);
});

/* ================= API ================= */

app.get("/start-seed", async (_, res) => {
  const existing = await prisma.backgroundJob.findFirst({
    where: { type: "LAGAR_SEED", status: { in: ["PENDING", "RUNNING"] } },
  });

  if (existing) {
    return res.status(409).json({
      message: "Seed already running",
      jobId: existing.id,
    });
  }

  const job = await prisma.backgroundJob.create({
    data: {
      type: "LAGAR_SEED",
      status: "PENDING",
      progress: 0,
    },
  });

  console.log("🧾 Seed job created:", job.id);

  res.json({
    message: "Seed job queued. You can close the page.",
    jobId: job.id,
  });
});

/* ================= STATUS ================= */

app.get("/seed-status", async (_, res) => {
  const job = await prisma.backgroundJob.findFirst({
    where: { type: "LAGAR_SEED" },
    orderBy: { createdAt: "desc" },
  });
  res.json(job);
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000/logs");
});
