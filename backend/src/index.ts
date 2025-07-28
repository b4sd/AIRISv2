import { config } from "@/config";
import { createServer } from "@/server";
import { logger } from "@/utils/logger";
import { setupGracefulShutdown } from "@/utils/gracefulShutdown";

async function start() {
  try {
    const server = await createServer();

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    await server.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(`🚀 Server running on http://${config.host}:${config.port}`);
    logger.info(`📚 Environment: ${config.nodeEnv}`);
    logger.info(
      `📖 API Documentation: http://${config.host}:${config.port}/docs`
    );
    logger.info(`🔍 Health Check: http://${config.host}:${config.port}/health`);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
