/**
 * Global Error Handler Middleware
 * Handles all errors with proper logging and user-friendly responses
 */

import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { logger } from "@/utils/logger";
import { config } from "@/config";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  validation?: any[];
}

export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  code = "VALIDATION_ERROR";
  validation: any[];

  constructor(message: string, validation: any[] = []) {
    super(message);
    this.name = "ValidationError";
    this.validation = validation;
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  code = "NOT_FOUND";

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error implements ApiError {
  statusCode = 401;
  code = "UNAUTHORIZED";

  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error implements ApiError {
  statusCode = 403;
  code = "FORBIDDEN";

  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error implements ApiError {
  statusCode = 409;
  code = "CONFLICT";

  constructor(message: string = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends Error implements ApiError {
  statusCode = 429;
  code = "RATE_LIMIT_EXCEEDED";

  constructor(message: string = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class InternalServerError extends Error implements ApiError {
  statusCode = 500;
  code = "INTERNAL_SERVER_ERROR";

  constructor(message: string = "Internal server error") {
    super(message);
    this.name = "InternalServerError";
  }
}

export function createErrorHandler() {
  return async function errorHandler(
    error: FastifyError | ApiError,
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const requestId = request.id;
    const { method, url } = request;

    // Determine status code
    const statusCode = error.statusCode || 500;

    // Determine error code
    const errorCode =
      (error as ApiError).code || error.code || "INTERNAL_ERROR";

    // Log error with appropriate level
    const logLevel = statusCode >= 500 ? "error" : "warn";
    const logData = {
      requestId,
      method,
      url,
      statusCode,
      errorCode,
      message: error.message,
      stack: config.nodeEnv === "development" ? error.stack : undefined,
      validation: (error as ValidationError).validation,
    };

    logger[logLevel]("Request error", logData);

    // Prepare response
    const response = {
      success: false,
      error: {
        code: errorCode,
        message:
          statusCode === 500 && config.nodeEnv === "production"
            ? "Internal Server Error"
            : error.message,
        timestamp: new Date().toISOString(),
        requestId,
        ...(config.nodeEnv === "development" &&
          statusCode === 500 && {
            stack: error.stack,
          }),
        ...((error as ValidationError).validation && {
          validation: (error as ValidationError).validation,
        }),
      },
    };

    return reply.status(statusCode).send(response);
  };
}

// Default error handler
export const errorHandler = createErrorHandler();
