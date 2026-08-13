import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { PRScanJobData } from "./types.js";

// ─── Redis Connection ──────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Shared Redis connection for the producer (reused across enqueue calls)
let redisConnection: IORedis | null = null;
let prScanQueue: Queue<PRScanJobData> | null = null;

function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
    redisConnection.on("error", (err) => {
      console.error("[Queue Producer] Redis connection error:", err.message);
    });
  }
  return redisConnection;
}

function getPRScanQueue(): Queue<PRScanJobData> {
  if (!prScanQueue) {
    prScanQueue = new Queue<PRScanJobData>("pr-scan", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,                     // Retry up to 3 times on failure
        backoff: {
          type: "exponential",
          delay: 30_000,                 // Start retry after 30s, then 60s, 120s
        },
        removeOnComplete: { count: 100 }, // Keep last 100 completed jobs for audit
        removeOnFail: { count: 50 },      // Keep last 50 failed jobs for debugging
      },
    });
  }
  return prScanQueue;
}

// ─── Enqueue PR Scan Job ───────────────────────────────────────────────────────

/**
 * Adds a PR scan job to the Redis queue.
 * Returns immediately (< 5ms) so the webhook handler can respond fast.
 */
export async function enqueuePRScan(data: PRScanJobData): Promise<void> {
  try {
    const queue = getPRScanQueue();
    const jobId = `pr-${data.repoFullName}-${data.prNumber}-${data.headSha.slice(0, 8)}`;

    await queue.add("pr-scan", data, {
      jobId, // Deduplicate: same PR + same SHA = same job (no double-processing)
    });

    console.log(
      `[Queue Producer] Enqueued PR scan job: ${jobId} (${data.repoFullName}#${data.prNumber})`
    );
  } catch (err) {
    // Log but don't crash the webhook handler — fall back to direct processing
    console.error("[Queue Producer] Failed to enqueue job:", err);
    throw err;
  }
}

/**
 * Gracefully close the Redis connection and queue on server shutdown.
 */
export async function closeQueue(): Promise<void> {
  if (prScanQueue) {
    await prScanQueue.close();
    prScanQueue = null;
  }
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}
