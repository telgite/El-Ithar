import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./lib/seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Start listening immediately so the health-check probe (/api/healthz) can
// respond before the DB is ready.  seedDatabase() runs right after — it
// completes within a second on warm connections, so real traffic (activities,
// galleries, etc.) is unaffected in practice.
await new Promise<void>((resolve) => {
  app.listen(port, () => {
    logger.info({ port }, "Server listening");
    resolve();
  });
});

// Run DB init (creates tables + seeds defaults) after the port is open.
await seedDatabase();
