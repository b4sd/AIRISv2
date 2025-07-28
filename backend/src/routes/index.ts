/**
 * Main Routes Registration
 * Registers all API routes with proper prefixes and middleware
 */

import { FastifyInstance } from "fastify";
import { logger } from "@/utils/logger";

export async function registerRoutes(server: FastifyInstance) {
  // Register API v1 routes
  await server.register(
    async function (server) {
      // API info endpoint
      server.get(
        "/",
        {
          schema: {
            description: "API information",
            tags: ["info"],
            response: {
              200: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  version: { type: "string" },
                  description: { type: "string" },
                  environment: { type: "string" },
                  timestamp: { type: "string" },
                  documentation: { type: "string" },
                },
              },
            },
          },
        },
        async (request, reply) => {
          return {
            name: "Voice Reading App API",
            version: "1.0.0",
            description:
              "Backend API for voice-interactive reading application with Vietnamese support",
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            documentation: "/docs",
          };
        }
      );

      // Placeholder routes for future implementation
      await server.register(
        async function (server) {
          server.get("/status", async (request, reply) => {
            return {
              message: "Authentication endpoints will be implemented in Task 5",
              status: "placeholder",
            };
          });
        },
        { prefix: "/auth" }
      );

      await server.register(
        async function (server) {
          server.get("/", async (request, reply) => {
            return {
              message:
                "User management endpoints will be implemented in Task 5",
              status: "placeholder",
            };
          });
        },
        { prefix: "/users" }
      );

      await server.register(
        async function (server) {
          server.get("/", async (request, reply) => {
            return {
              message:
                "Book management endpoints will be implemented in Task 7",
              status: "placeholder",
            };
          });
        },
        { prefix: "/books" }
      );

      await server.register(
        async function (server) {
          server.get("/status", async (request, reply) => {
            return {
              message:
                "Data synchronization endpoints will be implemented in Task 10",
              status: "placeholder",
            };
          });
        },
        { prefix: "/sync" }
      );

      await server.register(
        async function (server) {
          server.get("/status", async (request, reply) => {
            return {
              message: "AI processing endpoints will be implemented in Task 9",
              status: "placeholder",
            };
          });
        },
        { prefix: "/ai" }
      );

      await server.register(
        async function (server) {
          server.get("/", async (request, reply) => {
            return {
              message:
                "File management endpoints will be implemented in Task 6",
              status: "placeholder",
            };
          });
        },
        { prefix: "/files" }
      );
    },
    { prefix: "/api/v1" }
  );

  logger.info("✅ All routes registered successfully");
}
