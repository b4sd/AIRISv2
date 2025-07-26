"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const fastify_1 = __importDefault(require("fastify"));
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
async function createServer() {
    const server = (0, fastify_1.default)({
        logger: config_1.config.nodeEnv === "development"
            ? {
                transport: {
                    target: "pino-pretty",
                    options: {
                        colorize: true,
                    },
                },
            }
            : false,
    });
    // Register plugins
    await server.register(Promise.resolve().then(() => __importStar(require("@fastify/helmet"))), {
        contentSecurityPolicy: false,
    });
    await server.register(Promise.resolve().then(() => __importStar(require("@fastify/cors"))), {
        origin: config_1.config.nodeEnv === "development" ? true : ["http://localhost:3000"],
        credentials: true,
    });
    await server.register(Promise.resolve().then(() => __importStar(require("@fastify/rate-limit"))), {
        max: config_1.config.rateLimit.max,
        timeWindow: config_1.config.rateLimit.window,
    });
    // Swagger documentation
    if (config_1.config.nodeEnv === "development") {
        await server.register(Promise.resolve().then(() => __importStar(require("@fastify/swagger"))), {
            swagger: {
                info: {
                    title: "Voice Reading App API",
                    description: "Backend API for voice-interactive reading application",
                    version: "1.0.0",
                },
                host: `${config_1.config.host}:${config_1.config.port}`,
                schemes: ["http", "https"],
                consumes: ["application/json"],
                produces: ["application/json"],
                tags: [
                    { name: "auth", description: "Authentication endpoints" },
                    { name: "users", description: "User management endpoints" },
                    { name: "books", description: "Book management endpoints" },
                    { name: "sync", description: "Data synchronization endpoints" },
                    { name: "ai", description: "AI processing endpoints" },
                ],
            },
        });
        await server.register(Promise.resolve().then(() => __importStar(require("@fastify/swagger-ui"))), {
            routePrefix: "/docs",
            uiConfig: {
                docExpansion: "list",
                deepLinking: false,
            },
        });
    }
    // Health check endpoint
    server.get("/health", {
        schema: {
            description: "Health check endpoint",
            tags: ["health"],
            response: {
                200: {
                    type: "object",
                    properties: {
                        status: { type: "string" },
                        timestamp: { type: "string" },
                        uptime: { type: "number" },
                        environment: { type: "string" },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config_1.config.nodeEnv,
        };
    });
    // API routes will be registered here
    await server.register(async function (server) {
        server.get("/api/v1", async (request, reply) => {
            return {
                message: "Voice Reading App API v1",
                version: "1.0.0",
                documentation: config_1.config.nodeEnv === "development" ? "/docs" : undefined,
            };
        });
    });
    // Global error handler
    server.setErrorHandler(async (error, request, reply) => {
        logger_1.logger.error("Request error:", {
            error: error.message,
            stack: error.stack,
            url: request.url,
            method: request.method,
        });
        const statusCode = error.statusCode || 500;
        const message = statusCode === 500 ? "Internal Server Error" : error.message;
        return reply.status(statusCode).send({
            success: false,
            error: {
                code: error.code || "INTERNAL_ERROR",
                message,
                timestamp: new Date().toISOString(),
                requestId: request.id,
            },
        });
    });
    return server;
}
//# sourceMappingURL=server.js.map