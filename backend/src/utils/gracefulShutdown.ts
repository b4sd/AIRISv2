/**
 * Graceful Shutdown Utility
 * Handles clean shutdown of the server and all connections
 */

import { FastifyInstance } from "fastify";
import { logger } from "./logger";

export interface ShutdownHandler {
  name: string;
  handler: () => Promise<void>;
}

class GracefulShutdown {
  private server: FastifyInstance | null = null;
  private shutdownHandlers: ShutdownHandler[] = [];
  private isShuttingDown = false;

  public setServer(server: FastifyInstance) {
    this.server = server;
    this.setupSignalHandlers();
  }

  public addShutdownHandler(handler: ShutdownHandler) {
    this.shutdownHandlers.push(handler);
  }

  private setupSignalHandlers() {
    const signals = ["SIGTERM", "SIGINT", "SIGUSR2"] as const;

    signals.forEach((signal) => {
      process.on(signal, async () => {
        if (this.isShuttingDown) {
          logger.warn(`Received ${signal} during shutdown, forcing exit...`);
          process.exit(1);
        }

        logger.info(`Received ${signal}, starting graceful shutdown...`);
        await this.shutdown();
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection", {
        reason: String(reason),
        promise: String(promise),
      });
      process.exit(1);
    });
  }

  private async shutdown() {
    this.isShuttingDown = true;

    try {
      // Run custom shutdown handlers
      for (const handler of this.shutdownHandlers) {
        try {
          logger.info(`Running shutdown handler: ${handler.name}`);
          await handler.handler();
          logger.info(`✅ Shutdown handler completed: ${handler.name}`);
        } catch (error) {
          logger.error(`❌ Shutdown handler failed: ${handler.name}`, {
            error,
          });
        }
      }

      // Close Fastify server
      if (this.server) {
        logger.info("Closing Fastify server...");
        await this.server.close();
        logger.info("✅ Fastify server closed");
      }

      logger.info("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Error during graceful shutdown", { error });
      process.exit(1);
    }
  }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdown();

// Helper function to setup graceful shutdown for a server
export function setupGracefulShutdown(server: FastifyInstance) {
  gracefulShutdown.setServer(server);

  // Add default shutdown handlers
  gracefulShutdown.addShutdownHandler({
    name: "cleanup-temp-files",
    handler: async () => {
      // Cleanup temporary files, close file handles, etc.
      logger.info("Cleaning up temporary resources...");
    },
  });

  return gracefulShutdown;
}
