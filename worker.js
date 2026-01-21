import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const { default: main } = await import("./seed-lagar.ts");

const prisma = new PrismaClient();
console.log("🧠 Worker started");

while (true) {
  const job = await prisma.backgroundJob.findFirst({
    where: { type: "LAGAR_SEED", status: "PENDING" },
  });

  if (!job) {
    await sleep(5000);
    continue;
  }

  console.log("🚀 Running job", job.id);

  await prisma.backgroundJob.update({
    where: { id: job.id },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  try {
    await main({
      onProgress: async (p, t, msg) => {
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: { progress: p, total: t },
        });
        console.log(msg);
      },
    });

    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "DONE",
        progress: 100,
        finishedAt: new Date(),
      },
    });

    console.log("🎉 Job completed");
  } catch (e) {
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: String(e) },
    });
    console.error("❌ Job failed", e);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
