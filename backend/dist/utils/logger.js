"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("@/config");
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logLevel,
    format: logFormat,
    defaultMeta: {
        service: "voice-reading-api",
        environment: config_1.config.nodeEnv,
    },
    transports: [
        new winston_1.default.transports.Console({
            format: config_1.config.nodeEnv === "development"
                ? winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                : logFormat,
        }),
    ],
});
// Add file transport in production
if (config_1.config.nodeEnv === "production") {
    exports.logger.add(new winston_1.default.transports.File({
        filename: "logs/error.log",
        level: "error",
    }));
    exports.logger.add(new winston_1.default.transports.File({
        filename: "logs/combined.log",
    }));
}
//# sourceMappingURL=logger.js.map