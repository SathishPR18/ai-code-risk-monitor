import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHmac, timingSafeEqual } from "crypto";
import { orchestrate } from "../orchestrator.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PullRequestPayload {
  action: string;
  number: number;
  pull_request: {
    title: string;
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

export async function webhookRoute(app: FastifyInstance) {
  // Fastify parses body as JSON by default — we need the raw buffer for HMAC.
  // addContentTypeParser overrides for this route only.
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_req, body, done) => {
      done(null, body);
    }
  );

  const handleWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
      const secret = process.env.GITHUB_WEBHOOK_SECRET;
      if (!secret) {
        request.log.error("GITHUB_WEBHOOK_SECRET is not set");
        return reply.status(500).send({ error: "Server misconfiguration" });
      }

      // ── 1. Verify HMAC signature (security-critical) ──────────────────────
      const rawBody = request.body as Buffer;
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

      let payload: PullRequestPayload;
      try {
        payload = JSON.parse(rawBody.toString("utf-8")) as PullRequestPayload;
      } catch {
        request.log.error("Failed to parse webhook payload");
        return reply.status(400).send({ error: "Invalid JSON payload" });
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

      // ── 5. Run orchestration asynchronously ───────────────────────────────
      const orgName =
        payload.organization?.login ?? payload.repository.owner.login;

      orchestrate({
        installationId: payload.installation.id,
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        repoFullName: payload.repository.full_name,
        prNumber: payload.number,
        prTitle: payload.pull_request.title,
        headSha: payload.pull_request.head.sha,
        orgName,
      }).catch((err: unknown) => {
        request.log.error(
          { err, deliveryId },
          "Orchestration failed for PR event"
        );
      });
    };

  app.post("/webhook", handleWebhook);
  app.post("/", handleWebhook);
}
