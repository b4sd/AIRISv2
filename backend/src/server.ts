import Fastify from "fastify";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { requestLogger } from "@/middleware/requestLogger";
import { errorHandler } from "@/middleware/errorHandler";
import { registerRoutes } from "@/routes";

export async function createServer() {
  const server = Fastify({
    logger:
      config.nodeEnv === "development"
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

  // Register security plugins
  await server.register(import("@fastify/helmet"), {
    contentSecurityPolicy: false,
  });

  await server.register(import("@fastify/cors"), {
    origin: config.nodeEnv === "development" ? true : ["http://localhost:3000"],
    credentials: true,
  });

  await server.register(import("@fastify/rate-limit"), {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Rate limit exceeded, retry in ${Math.round(
          context.ttl / 1000
        )} seconds`,
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    }),
  });

  // Register middleware
  server.addHook("onRequest", requestLogger);
  server.setErrorHandler(errorHandler);

  // Swagger documentation
  if (config.nodeEnv === "development") {
    await server.register(import("@fastify/swagger"), {
      swagger: {
        info: {
          title: "Voice Reading App API",
          description: "Backend API for voice-interactive reading application",
          version: "1.0.0",
        },
        host: `${config.host}:${config.port}`,
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

    await server.register(import("@fastify/swagger-ui"), {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
    });
  }

  // Health check endpoint
  server.get(
    "/health",
    {
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
    },
    async (request, reply) => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
      };
    }
  );

  // Register API routes
  await registerRoutes(server);

  return server;
}
