"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@/config");
const server_1 = require("@/server");
const logger_1 = require("@/utils/logger");
async function start() {
    try {
        const server = await (0, server_1.createServer)();
        await server.listen({
            port: config_1.config.port,
            host: config_1.config.host,
        });
        logger_1.logger.info(`🚀 Server running on http://${config_1.config.host}:${config_1.config.port}`);
        logger_1.logger.info(`📚 Environment: ${config_1.config.nodeEnv}`);
        logger_1.logger.info(`📖 API Documentation: http://${config_1.config.host}:${config_1.config.port}/docs`);
    }
    catch (error) {
        logger_1.logger.error("Failed to start server:", error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on("SIGTERM", async () => {
    logger_1.logger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
});
process.on("SIGINT", async () => {
    logger_1.logger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
});
start();
//# sourceMappingURL=index.js.map