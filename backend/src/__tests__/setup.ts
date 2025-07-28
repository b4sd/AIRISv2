/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.PORT = "8001";
process.env.HOST = "127.0.0.1";
process.env.DATABASE_URL =
  "postgresql://test:test@localhost:5432/voice_reading_test";
process.env.REDIS_URL = "redis://localhost:6379/1";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only-32-chars";
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.S3_BUCKET = "test-bucket";
process.env.S3_ACCESS_KEY = "test-access-key";
process.env.S3_SECRET_KEY = "test-secret-key";
process.env.LOG_LEVEL = "error"; // Reduce log noise during tests

// Global test timeout
jest.setTimeout(10000);

// Mock external services
jest.mock("openai", () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Mocked AI response" } }],
        }),
      },
    },
  })),
}));

// Mock Redis
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    disconnect: jest.fn(),
  }));
});

// Mock Bull queue
jest.mock("bull", () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    process: jest.fn(),
    close: jest.fn(),
  }));
});

// Suppress console logs during tests unless LOG_LEVEL is debug
if (process.env.LOG_LEVEL !== "debug") {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}
