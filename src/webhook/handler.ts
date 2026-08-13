import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHmac, timingSafeEqual } from "crypto";
import { orchestrate } from "../orchestrator.js";
import { enqueuePRScan } from "../queue/producer.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PullRequestPayload {
  action: string;
  number: number;
  pull_request: {
    title: string;
    body?: string;
    head: { sha: string };
  };
  repository: {
    id: number;
    full_name: string;
    owner: { login: string };
    name: string;
  };
  installation?: {
    id: number;
  };
  organization?: {
    login: string;
  };
  sender: {
    login: string;
  };
}

// ─── HMAC Verification ────────────────────────────────────────────────────────

function verifyWebhookSignature(
  payload: Buffer,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) return false;

  const expected = `sha256=${createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    // buffers of different length throw — means signature is invalid
    return false;
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

// Extend Fastify request to hold the raw body for HMAC verification
declare module "fastify" {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

export async function webhookRoute(app: FastifyInstance) {
  // ── Capture raw body BEFORE Fastify parses JSON ─────────────────────────
  // This avoids the 415 "Unsupported Media Type" error caused by overriding
  // the default JSON content-type parser inside a plugin scope.
  app.addHook("preParsing", async (request, _reply, payload) => {
    const chunks: Buffer[] = [];
    for await (const chunk of payload) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks);
    request.rawBody = rawBody;

    // Return a new readable stream for Fastify's default JSON parser
    const { Readable } = await import("stream");
    return Readable.from(rawBody);
  });

  const handleWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
      const secret = process.env.GITHUB_WEBHOOK_SECRET;
      if (!secret) {
        request.log.error("GITHUB_WEBHOOK_SECRET is not set");
        return reply.status(500).send({ error: "Server misconfiguration" });
      }

      // ── 1. Verify HMAC signature (security-critical) ──────────────────────
      const rawBody = request.rawBody;
      if (!rawBody) {
        request.log.error("Raw body not captured — cannot verify signature");
        return reply.status(500).send({ error: "Internal error" });
      }

      const signature = request.headers["x-hub-signature-256"] as
        | string
        | undefined;

      if (!verifyWebhookSignature(rawBody, signature, secret)) {
        request.log.warn(
          { ip: request.ip },
          "Webhook signature verification failed — rejecting request"
        );
        return reply.status(401).send({ error: "Invalid signature" });
      }

      // ── 2. Parse event type ────────────────────────────────────────────────
      const event = request.headers["x-github-event"] as string | undefined;
      const deliveryId = request.headers["x-github-delivery"] as
        | string
        | undefined;

      request.log.info({ event, deliveryId }, "Webhook received");

      // ── 3. Only process pull_request events ───────────────────────────────
      if (event !== "pull_request") {
        return reply.status(200).send({ message: "Event ignored" });
      }

      // Body is already parsed as JSON by Fastify's default parser
      const payload = request.body as PullRequestPayload;

      if (!payload || !payload.action) {
        request.log.error("Invalid or missing webhook payload");
        return reply.status(400).send({ error: "Invalid payload" });
      }

      // Only handle opened, synchronize, or reopened
      if (!["opened", "synchronize", "reopened"].includes(payload.action)) {
        return reply.status(200).send({ message: "Action ignored" });
      }

      if (!payload.installation?.id) {
        request.log.warn("No installation ID in payload — cannot authenticate");
        return reply.status(200).send({ message: "No installation ID" });
      }

      // ── 4. Respond immediately (GitHub expects < 10s response) ────────────
      reply.status(202).send({ message: "Accepted" });

      // ── 5. Enqueue PR scan job into Redis queue (with direct fallback) ────
      const orgName =
        payload.organization?.login ?? payload.repository.owner.login;

      const jobData = {
        installationId: payload.installation.id,
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        repoFullName: payload.repository.full_name,
        prNumber: payload.number,
        prTitle: payload.pull_request.title,
        prDescription: payload.pull_request.body ?? "",
        headSha: payload.pull_request.head.sha,
        orgName,
        deliveryId,
      };

      // Try queue first — fall back to direct orchestration if Redis unavailable
      enqueuePRScan(jobData).catch((queueErr: unknown) => {
        request.log.warn(
          { queueErr },
          "Redis queue unavailable — falling back to direct orchestration"
        );
        orchestrate(jobData).catch((err: unknown) => {
          request.log.error(
            { err, deliveryId },
            "Orchestration failed for PR event"
          );
        });
      });
    };

  app.post("/webhook", handleWebhook);
  app.post("/", handleWebhook);
}
