"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load environment variables
dotenv_1.default.config();
const configSchema = zod_1.z.object({
    nodeEnv: zod_1.z.enum(["development", "production", "test"]).default("development"),
    port: zod_1.z.coerce.number().default(8000),
    host: zod_1.z.string().default("0.0.0.0"),
    // Database
    databaseUrl: zod_1.z.string().min(1, "DATABASE_URL is required"),
    // Redis
    redisUrl: zod_1.z.string().default("redis://localhost:6379"),
    // JWT
    jwt: zod_1.z.object({
        secret: zod_1.z.string().min(32, "JWT_SECRET must be at least 32 characters"),
        expiresIn: zod_1.z.string().default("15m"),
        refreshExpiresIn: zod_1.z.string().default("7d"),
    }),
    // OpenAI
    openai: zod_1.z.object({
        apiKey: zod_1.z.string().min(1, "OPENAI_API_KEY is required"),
        model: zod_1.z.string().default("gpt-4"),
    }),
    // File Storage
    storage: zod_1.z.object({
        bucket: zod_1.z.string().min(1, "S3_BUCKET is required"),
        region: zod_1.z.string().default("us-east-1"),
        accessKey: zod_1.z.string().min(1, "S3_ACCESS_KEY is required"),
        secretKey: zod_1.z.string().min(1, "S3_SECRET_KEY is required"),
        endpoint: zod_1.z.string().optional(),
    }),
    // Email (optional)
    email: zod_1.z.object({
        provider: zod_1.z.enum(["sendgrid", "ses", "smtp"]).optional(),
        apiKey: zod_1.z.string().optional(),
        from: zod_1.z.string().email().optional(),
    }),
    // Monitoring
    logLevel: zod_1.z.enum(["error", "warn", "info", "debug"]).default("info"),
    enableMetrics: zod_1.z.coerce.boolean().default(true),
    // Rate Limiting
    rateLimit: zod_1.z.object({
        max: zod_1.z.coerce.number().default(100),
        window: zod_1.z.string().default("15m"),
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
exports.config = configSchema.parse(rawConfig);
//# sourceMappingURL=index.js.map