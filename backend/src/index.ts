import { config } from "@/config";
import { createServer } from "@/server";
import { logger } from "@/utils/logger";

async function start() {
  try {
    const server = await createServer();

    await server.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(`🚀 Server running on http://${config.host}:${config.port}`);
    logger.info(`📚 Environment: ${config.nodeEnv}`);
    logger.info(
      `📖 API Documentation: http://${config.host}:${config.port}/docs`
    );
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

start();
