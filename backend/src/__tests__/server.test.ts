/**
 * Server Integration Tests
 * Tests the basic server functionality and endpoints
 */

import { createServer } from "../server";
import { FastifyInstance } from "fastify";

describe("Server", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe("Health Check", () => {
    test("should respond to health check", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.status).toBe("ok");
      expect(payload).toHaveProperty("timestamp");
      expect(payload).toHaveProperty("uptime");
      expect(payload).toHaveProperty("environment");
    });
  });

  describe("API Info", () => {
    test("should respond to API info endpoint", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/v1/",
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.name).toBe("Voice Reading App API");
      expect(payload.version).toBe("1.0.0");
      expect(payload).toHaveProperty("description");
      expect(payload).toHaveProperty("timestamp");
    });
  });

  describe("Placeholder Routes", () => {
    test("should respond to auth status", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/v1/auth/status",
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.status).toBe("placeholder");
      expect(payload.message).toContain("Authentication endpoints");
    });

    test("should respond to books endpoint", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/v1/books/",
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.status).toBe("placeholder");
      expect(payload.message).toContain("Book management endpoints");
    });

    test("should respond to AI status", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/v1/ai/status",
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.status).toBe("placeholder");
      expect(payload.message).toContain("AI processing endpoints");
    });

    test("should respond to sync status", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/v1/sync/status",
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.status).toBe("placeholder");
      expect(payload.message).toContain("Data synchronization endpoints");
    });
  });

  describe("Error Handling", () => {
    test("should handle 404 errors", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/v1/nonexistent",
      });

      expect(response.statusCode).toBe(404);
    });

    test("should handle invalid methods", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/health",
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("Security Headers", () => {
    test("should include security headers", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.headers).toHaveProperty("x-frame-options");
      expect(response.headers).toHaveProperty("x-content-type-options");
    });
  });

  describe("CORS", () => {
    test("should handle CORS preflight requests", async () => {
      const response = await server.inject({
        method: "OPTIONS",
        url: "/api/v1/",
        headers: {
          origin: "http://localhost:3000",
          "access-control-request-method": "GET",
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers).toHaveProperty("access-control-allow-origin");
    });
  });
});
