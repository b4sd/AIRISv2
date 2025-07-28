import { z } from "zod";
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    preferences: z.ZodObject<{
        language: z.ZodEnum<{
            vi: "vi";
            en: "en";
        }>;
        theme: z.ZodEnum<{
            light: "light";
            dark: "dark";
            system: "system";
        }>;
        voice: z.ZodObject<{
            rate: z.ZodNumber;
            volume: z.ZodNumber;
            pitch: z.ZodNumber;
            voiceId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        ai: z.ZodObject<{
            summaryLength: z.ZodEnum<{
                short: "short";
                medium: "medium";
                long: "long";
            }>;
            summaryStyle: z.ZodEnum<{
                bullet: "bullet";
                paragraph: "paragraph";
            }>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const bookSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    title: z.ZodString;
    author: z.ZodOptional<z.ZodString>;
    format: z.ZodEnum<{
        pdf: "pdf";
        epub: "epub";
        txt: "txt";
    }>;
    fileUrl: z.ZodString;
    fileSize: z.ZodOptional<z.ZodNumber>;
    textContent: z.ZodOptional<z.ZodString>;
    metadata: z.ZodObject<{
        isbn: z.ZodOptional<z.ZodString>;
        publisher: z.ZodOptional<z.ZodString>;
        publishedDate: z.ZodOptional<z.ZodString>;
        language: z.ZodString;
        pageCount: z.ZodOptional<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
        coverImage: z.ZodOptional<z.ZodString>;
        source: z.ZodOptional<z.ZodString>;
        originalUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const bookUploadSchema: z.ZodObject<{
    title: z.ZodString;
    author: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const noteSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    bookId: z.ZodString;
    content: z.ZodString;
    position: z.ZodOptional<z.ZodObject<{
        bookId: z.ZodString;
        chapter: z.ZodOptional<z.ZodNumber>;
        page: z.ZodOptional<z.ZodNumber>;
        position: z.ZodNumber;
        percentage: z.ZodNumber;
        timestamp: z.ZodDate;
    }, z.core.$strip>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const createNoteSchema: z.ZodObject<{
    bookId: z.ZodString;
    content: z.ZodString;
    position: z.ZodOptional<z.ZodObject<{
        chapter: z.ZodOptional<z.ZodNumber>;
        page: z.ZodOptional<z.ZodNumber>;
        position: z.ZodNumber;
        percentage: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const readingPositionSchema: z.ZodObject<{
    bookId: z.ZodString;
    chapter: z.ZodOptional<z.ZodNumber>;
    page: z.ZodOptional<z.ZodNumber>;
    position: z.ZodNumber;
    percentage: z.ZodNumber;
    timestamp: z.ZodDate;
}, z.core.$strip>;
export declare const summaryOptionsSchema: z.ZodObject<{
    language: z.ZodDefault<z.ZodEnum<{
        vi: "vi";
        en: "en";
    }>>;
    length: z.ZodDefault<z.ZodEnum<{
        short: "short";
        medium: "medium";
        long: "long";
    }>>;
    style: z.ZodDefault<z.ZodEnum<{
        bullet: "bullet";
        paragraph: "paragraph";
    }>>;
}, z.core.$strip>;
export declare const summarizeRequestSchema: z.ZodObject<{
    content: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        language: z.ZodDefault<z.ZodEnum<{
            vi: "vi";
            en: "en";
        }>>;
        length: z.ZodDefault<z.ZodEnum<{
            short: "short";
            medium: "medium";
            long: "long";
        }>>;
        style: z.ZodDefault<z.ZodEnum<{
            bullet: "bullet";
            paragraph: "paragraph";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const apiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, z.core.$strip>>;
    meta: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type UserInput = z.infer<typeof userSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type BookUploadInput = z.infer<typeof bookUploadSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type ReadingPositionInput = z.infer<typeof readingPositionSchema>;
export type SummaryOptionsInput = z.infer<typeof summaryOptionsSchema>;
export type SummarizeRequestInput = z.infer<typeof summarizeRequestSchema>;
export type ApiResponseInput = z.infer<typeof apiResponseSchema>;
//# sourceMappingURL=index.d.ts.map