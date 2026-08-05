import type { FastifyInstance } from "fastify";

export async function healthRoute(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    return reply.status(200).send({
      status: "ok",
      service: "ai-code-risk-monitor",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "unknown",
    });
  });
}
