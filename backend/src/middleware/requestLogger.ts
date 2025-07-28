/**
 * Request Logging Middleware
 * Logs all incoming requests with correlation IDs for tracing
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "@/utils/logger";

export interface RequestLoggerOptions {
  logBody?: boolean;
  logHeaders?: boolean;
  excludePaths?: string[];
}

export function createRequestLogger(options: RequestLoggerOptions = {}) {
  const {
    logBody = false,
    logHeaders = false,
    excludePaths = ["/health", "/docs"],
  } = options;

  return async function requestLogger(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const startTime = Date.now();
    const requestId = request.id;
    const { method, url, ip } = request;

    // Skip logging for excluded paths
    if (excludePaths.some((path) => url.startsWith(path))) {
      return;
    }

    // Log request start
    const logData: any = {
      requestId,
      method,
      url,
      ip,
      userAgent: request.headers["user-agent"],
      type: "request_start",
    };

    if (logHeaders) {
      logData.headers = request.headers;
    }

    if (logBody && request.body) {
      logData.body = request.body;
    }

    logger.info("Request started", logData);

    // Hook into response to log completion
    reply.raw.on("finish", () => {
      const duration = Date.now() - startTime;
      const statusCode = reply.statusCode;

      logger.info("Request completed", {
        requestId,
        method,
        url,
        statusCode,
        duration,
        type: "request_complete",
      });
    });
  };
}

// Default request logger
export const requestLogger = createRequestLogger();
