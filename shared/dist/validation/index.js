"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiResponseSchema = exports.summarizeRequestSchema = exports.summaryOptionsSchema = exports.readingPositionSchema = exports.createNoteSchema = exports.noteSchema = exports.bookUploadSchema = exports.bookSchema = exports.loginSchema = exports.registerSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
// User validation schemas
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    preferences: zod_1.z.object({
        language: zod_1.z.enum(["vi", "en"]),
        theme: zod_1.z.enum(["light", "dark", "system"]),
        voice: zod_1.z.object({
            rate: zod_1.z.number().min(0.1).max(3),
            volume: zod_1.z.number().min(0).max(1),
            pitch: zod_1.z.number().min(0).max(2),
            voiceId: zod_1.z.string().optional(),
        }),
        ai: zod_1.z.object({
            summaryLength: zod_1.z.enum(["short", "medium", "long"]),
            summaryStyle: zod_1.z.enum(["bullet", "paragraph"]),
        }),
    }),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    name: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
// Book validation schemas
exports.bookSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1, "Title is required"),
    author: zod_1.z.string().optional(),
    format: zod_1.z.enum(["pdf", "epub", "txt"]),
    fileUrl: zod_1.z.string().url(),
    fileSize: zod_1.z.number().positive().optional(),
    textContent: zod_1.z.string().optional(),
    metadata: zod_1.z.object({
        isbn: zod_1.z.string().optional(),
        publisher: zod_1.z.string().optional(),
        publishedDate: zod_1.z.string().optional(),
        language: zod_1.z.string(),
        pageCount: zod_1.z.number().positive().optional(),
        description: zod_1.z.string().optional(),
        coverImage: zod_1.z.string().url().optional(),
        source: zod_1.z.string().optional(),
        originalUrl: zod_1.z.string().url().optional(),
    }),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.bookUploadSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    author: zod_1.z.string().optional(),
    language: zod_1.z.string().default("vi"),
});
// Note validation schemas
exports.noteSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    bookId: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1, "Note content is required"),
    position: zod_1.z
        .object({
        bookId: zod_1.z.string().uuid(),
        chapter: zod_1.z.number().optional(),
        page: zod_1.z.number().optional(),
        position: zod_1.z.number(),
        percentage: zod_1.z.number().min(0).max(100),
        timestamp: zod_1.z.date(),
    })
        .optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.createNoteSchema = zod_1.z.object({
    bookId: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1, "Note content is required"),
    position: zod_1.z
        .object({
        chapter: zod_1.z.number().optional(),
        page: zod_1.z.number().optional(),
        position: zod_1.z.number(),
        percentage: zod_1.z.number().min(0).max(100),
    })
        .optional(),
});
// Reading position validation
exports.readingPositionSchema = zod_1.z.object({
    bookId: zod_1.z.string().uuid(),
    chapter: zod_1.z.number().optional(),
    page: zod_1.z.number().optional(),
    position: zod_1.z.number(),
    percentage: zod_1.z.number().min(0).max(100),
    timestamp: zod_1.z.date(),
});
// AI validation schemas
exports.summaryOptionsSchema = zod_1.z.object({
    language: zod_1.z.enum(["vi", "en"]).default("vi"),
    length: zod_1.z.enum(["short", "medium", "long"]).default("medium"),
    style: zod_1.z.enum(["bullet", "paragraph"]).default("paragraph"),
});
exports.summarizeRequestSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Content is required"),
    options: exports.summaryOptionsSchema.optional(),
});
// API response validation
exports.apiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.any().optional(),
    error: zod_1.z
        .object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.any().optional(),
    })
        .optional(),
    meta: zod_1.z
        .object({
        page: zod_1.z.number().optional(),
        limit: zod_1.z.number().optional(),
        total: zod_1.z.number().optional(),
    })
        .optional(),
});
//# sourceMappingURL=index.js.map