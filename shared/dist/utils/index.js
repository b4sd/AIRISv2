"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateText = exports.calculateReadingTime = exports.sanitizeFilename = exports.isValidEmail = exports.formatFileSize = exports.createSlug = exports.generateId = void 0;
// Shared utility functions
const generateId = () => {
    return crypto.randomUUID();
};
exports.generateId = generateId;
const createSlug = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};
exports.createSlug = createSlug;
const formatFileSize = (bytes) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0)
        return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};
exports.formatFileSize = formatFileSize;
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-z0-9.-]/gi, "_").toLowerCase();
};
exports.sanitizeFilename = sanitizeFilename;
const calculateReadingTime = (wordCount) => {
    // Average reading speed: 200 words per minute
    return Math.ceil(wordCount / 200);
};
exports.calculateReadingTime = calculateReadingTime;
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength).trim() + "...";
};
exports.truncateText = truncateText;
//# sourceMappingURL=index.js.map