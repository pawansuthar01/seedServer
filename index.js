import "dotenv/config";
import express from "express";
const { default: main } = await import("./seed-lagar.ts");

const app = express();
const clients = [];

// Override console.log to broadcast to SSE clients
const originalConsoleLog = console.log;
console.log = (...args) => {
  const message = args.join(" ");
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  originalConsoleLog(logEntry);

  // Broadcast to all SSE clients
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify({ message, timestamp })}\n\n`);
  });

  // Push log to URL if configured and not localhost
  if (process.env.PUSH_URL && !process.env.PUSH_URL.includes("localhost")) {
    fetch(process.env.PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, timestamp }),
    }).catch((err) => originalConsoleError("Push failed:", err));
  }
};

// Override console.error to broadcast to SSE clients
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = "ERROR: " + args.join(" ");
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  originalConsoleError(logEntry);

  // Broadcast to all SSE clients
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify({ message, timestamp })}\n\n`);
  });

  // Push log to URL if configured and not localhost
  if (process.env.PUSH_URL && !process.env.PUSH_URL.includes("localhost")) {
    fetch(process.env.PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, timestamp }),
    }).catch((err) => originalConsoleError("Push failed:", err));
  }
};

app.use(express.json());

// Real-time logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    body: req.method !== "GET" ? req.body : undefined,
  };

  console.log(`${req.method} ${req.url} - IP: ${logData.ip}`);

  next();
});

// SSE route for real-time logs
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

// HTML page for logs
app.get("/logs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Real-Time Logs</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #logs { border: 1px solid #ccc; padding: 10px; height: 400px; overflow-y: scroll; background: #f9f9f9; }
        .log-entry { margin: 5px 0; padding: 5px; border-bottom: 1px solid #eee; }
        .timestamp { color: #666; font-size: 0.9em; }
        .progress { margin-top: 20px; }
        .progress-bar { width: 100%; background: #eee; height: 20px; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #4CAF50; width: 0%; transition: width 0.3s; }
      </style>
    </head>
    <body>
      <h1>Real-Time Database Seeding Logs</h1>
      <div id="logs"></div>
      <div class="progress">
        <div>Progress: <span id="progress-text">0%</span></div>
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div>Estimated Time: <span id="estimated-time">Calculating...</span></div>
      </div>
      <script>
        const eventSource = new EventSource('/events');
        const logsDiv = document.getElementById('logs');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const estimatedTime = document.getElementById('estimated-time');
        let startTime = null;
        let totalSteps = 100; // Approximate
        let currentStep = 0;

        eventSource.onmessage = function(event) {
          const data = JSON.parse(event.data);
          const logEntry = document.createElement('div');
          logEntry.className = 'log-entry';
          logEntry.innerHTML = '<span class="timestamp">' + data.timestamp + '</span> ' + data.message;
          logsDiv.appendChild(logEntry);
          logsDiv.scrollTop = logsDiv.scrollHeight;

          // Update progress based on log messages
          if (data.message.includes('Creating')) currentStep++;
          if (data.message.includes('✅ Created')) currentStep += 10;
          if (data.message.includes('COMPLETED')) currentStep = totalSteps;

          const progress = Math.min((currentStep / totalSteps) * 100, 100);
          progressFill.style.width = progress + '%';
          progressText.textContent = Math.round(progress) + '%';

          if (startTime) {
            const elapsed = (new Date() - startTime) / 1000;
            const remaining = (elapsed / progress) * (100 - progress);
            estimatedTime.textContent = remaining > 0 ? Math.round(remaining) + 's remaining' : 'Completed';
          }
        };

        // Start seeding when page loads
        window.onload = function() {
          startTime = new Date();
          fetch('/push-in-db');
        };
      </script>
    </body>
    </html>
  `);
});

app.get("/", (req, res) => {
  res.send("Hello World! Go to /logs to see real-time seeding.");
});

app.get("/push-in-db", async (req, res) => {
  console.log("🌱 Starting database seeding...");
  try {
    await main();
    console.log("🎉 Database seeding completed successfully!");
    res.send("Database seeding completed successfully.");
  } catch (e) {
    console.error("❌ Lagar seed failed:", e);
    res.status(500).send("Database seeding failed.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
