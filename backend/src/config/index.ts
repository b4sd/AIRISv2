import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  port: z.coerce.number().default(8000),
  host: z.string().default("0.0.0.0"),

  // Database
  databaseUrl: z.string().min(1, "DATABASE_URL is required"),

  // Redis
  redisUrl: z.string().default("redis://localhost:6379"),

  // JWT
  jwt: z.object({
    secret: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    expiresIn: z.string().default("15m"),
    refreshExpiresIn: z.string().default("7d"),
  }),

  // OpenAI
  openai: z.object({
    apiKey: z.string().min(1, "OPENAI_API_KEY is required"),
    model: z.string().default("gpt-4"),
  }),

  // File Storage
  storage: z.object({
    bucket: z.string().min(1, "S3_BUCKET is required"),
    region: z.string().default("us-east-1"),
    accessKey: z.string().min(1, "S3_ACCESS_KEY is required"),
    secretKey: z.string().min(1, "S3_SECRET_KEY is required"),
    endpoint: z.string().optional(),
  }),

  // Email (optional)
  email: z.object({
    provider: z.enum(["sendgrid", "ses", "smtp"]).optional(),
    apiKey: z.string().optional(),
    from: z.string().email().optional(),
  }),

  // Monitoring
  logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
  enableMetrics: z.coerce.boolean().default(true),

  // Rate Limiting
  rateLimit: z.object({
    max: z.coerce.number().default(100),
    window: z.string().default("15m"),
  }),
});

const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  host: process.env.HOST,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
  },
  storage: {
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.S3_ENDPOINT,
  },
  email: {
    provider: process.env.EMAIL_PROVIDER,
    apiKey: process.env.EMAIL_API_KEY,
    from: process.env.EMAIL_FROM,
  },
  logLevel: process.env.LOG_LEVEL,
  enableMetrics: process.env.ENABLE_METRICS,
  rateLimit: {
    max: process.env.RATE_LIMIT_MAX,
    window: process.env.RATE_LIMIT_WINDOW,
  },
};

export const config = configSchema.parse(rawConfig);
