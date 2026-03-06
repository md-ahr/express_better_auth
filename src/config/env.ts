const getEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`❌ Missing Environment Variable: ${key}`);
    }
    return value;
};

export const ENV = {
    NODE_ENV: getEnv('NODE_ENV'),
    PORT: Number(getEnv('PORT')),
    ALLOWED_ORIGINS: getEnv('ALLOWED_ORIGINS').split(','),
    DATABASE_URL: getEnv('DATABASE_URL'),
} as const;
