import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { orchestrate } from "../orchestrator.js";
import type { PRScanJobData } from "./types.js";

// ─── Redis Connection ──────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let workerInstance: Worker<PRScanJobData> | null = null;

// ─── Job Processor ────────────────────────────────────────────────────────────

/**
 * Processes one PR scan job at a time from the Redis queue.
 * BullMQ handles retries with exponential backoff automatically.
 */
async function processPRScanJob(job: Job<PRScanJobData>): Promise<void> {
  const data = job.data;
  console.log(
    `[Queue Worker] Processing job ${job.id}: ${data.repoFullName}#${data.prNumber} (attempt ${job.attemptsMade + 1})`
  );

  await orchestrate({
    installationId: data.installationId,
    owner: data.owner,
    repo: data.repo,
    repoFullName: data.repoFullName,
    prNumber: data.prNumber,
    prTitle: data.prTitle,
    prDescription: data.prDescription,
    headSha: data.headSha,
    orgName: data.orgName,
  });

  console.log(
    `[Queue Worker] Completed job ${job.id}: ${data.repoFullName}#${data.prNumber}`
  );
}

// ─── Start Worker ─────────────────────────────────────────────────────────────

/**
 * Starts the BullMQ worker that consumes PR scan jobs from Redis queue.
 * Processes ONE job at a time (concurrency: 1) to avoid Gemini AI rate limits.
 */
export function startQueueWorker(): void {
  if (workerInstance) return; // Already running

  const redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  redisConnection.on("error", (err) => {
    console.error("[Queue Worker] Redis connection error:", err.message);
  });

  workerInstance = new Worker<PRScanJobData>("pr-scan", processPRScanJob, {
    connection: redisConnection,
    concurrency: 1, // Process ONE PR at a time — avoids Gemini AI rate limits
  });

  workerInstance.on("completed", (job) => {
    console.log(
      `[Queue Worker] ✅ Job ${job.id} completed: ${job.data.repoFullName}#${job.data.prNumber}`
    );
  });

  workerInstance.on("failed", (job, err) => {
    console.error(
      `[Queue Worker] ❌ Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts}): ${err.message}`
    );
  });

  workerInstance.on("error", (err) => {
    console.error("[Queue Worker] Worker error:", err.message);
  });

  console.log("[Queue Worker] 🚀 PR scan worker started (concurrency: 1)");
}

/**
 * Gracefully stops the BullMQ worker on server shutdown.
 */
export async function stopQueueWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
    console.log("[Queue Worker] Worker stopped gracefully.");
  }
}
