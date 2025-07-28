import winston from "winston";
import { config } from "@/config";

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  defaultMeta: {
    service: "voice-reading-api",
    environment: config.nodeEnv,
  },
  transports: [
    new winston.transports.Console({
      format:
        config.nodeEnv === "development"
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          : logFormat,
    }),
  ],
});

// Add file transport in production
if (config.nodeEnv === "production") {
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    })
  );

  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
    })
  );
}
