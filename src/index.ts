import "dotenv/config"; // ← must be first — loads .env before any other module runs
import Fastify from "fastify";
import { healthRoute } from "./routes/health.js";
import { webhookRoute } from "./webhook/handler.js";


const PORT = parseInt(process.env.PORT ?? "3000", 10);
const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";

const app = Fastify({
  logger: {
    level: LOG_LEVEL,
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  },
});

import fastifyCookie from "@fastify/cookie";
import { registerDashboardRoutes } from "./dashboard/routes.js";

// ─── Routes & Plugins ─────────────────────────────────────────────────────────
app.register(fastifyCookie);
app.register(healthRoute);
app.register(webhookRoute);
app.register(registerDashboardRoutes);

// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`AI Code Risk Monitor listening on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down gracefully...`);
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
