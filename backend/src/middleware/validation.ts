/**
 * Request Validation Middleware
 * Validates request data using Zod schemas
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ValidationError } from "./errorHandler";

export interface ValidationSchemas {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
  headers?: z.ZodSchema;
}

export function createValidationMiddleware(schemas: ValidationSchemas) {
  return async function validation(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const errors: any[] = [];

    // Validate body
    if (schemas.body) {
      try {
        request.body = schemas.body.parse(request.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            field: "body",
            issues: error.issues,
          });
        }
      }
    }

    // Validate params
    if (schemas.params) {
      try {
        request.params = schemas.params.parse(request.params);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            field: "params",
            issues: error.issues,
          });
        }
      }
    }

    // Validate query
    if (schemas.query) {
      try {
        request.query = schemas.query.parse(request.query);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            field: "query",
            issues: error.issues,
          });
        }
      }
    }

    // Validate headers
    if (schemas.headers) {
      try {
        const validatedHeaders = schemas.headers.parse(request.headers);
        // Only update specific headers, not the entire headers object
        Object.assign(request.headers, validatedHeaders);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            field: "headers",
            issues: error.issues,
          });
        }
      }
    }

    // If there are validation errors, throw ValidationError
    if (errors.length > 0) {
      const message = `Validation failed: ${errors
        .map((e) =>
          e.issues
            .map(
              (issue: any) =>
                `${e.field}.${issue.path.join(".")}: ${issue.message}`
            )
            .join(", ")
        )
        .join("; ")}`;

      throw new ValidationError(message, errors);
    }
  };
}

// Common validation schemas
const paginationQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const commonSchemas = {
  // UUID parameter validation
  uuidParam: z.object({
    id: z.string().uuid("Invalid UUID format"),
  }),

  // Pagination query validation
  paginationQuery,

  // Search query validation
  searchQuery: z.object({
    q: z.string().min(1).max(255),
    ...paginationQuery.shape,
  }),
};

// Helper function to validate UUID
export function validateUuid(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
