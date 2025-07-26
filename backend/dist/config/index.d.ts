export declare const config: {
    nodeEnv: "development" | "production" | "test";
    port: number;
    host: string;
    databaseUrl: string;
    redisUrl: string;
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    openai: {
        apiKey: string;
        model: string;
    };
    storage: {
        bucket: string;
        region: string;
        accessKey: string;
        secretKey: string;
        endpoint?: string | undefined;
    };
    email: {
        provider?: "sendgrid" | "ses" | "smtp" | undefined;
        apiKey?: string | undefined;
        from?: string | undefined;
    };
    logLevel: "error" | "warn" | "info" | "debug";
    enableMetrics: boolean;
    rateLimit: {
        max: number;
        window: string;
    };
};
//# sourceMappingURL=index.d.ts.map