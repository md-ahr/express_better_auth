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
    BETTER_AUTH_SECRET: getEnv('BETTER_AUTH_SECRET'),
    BETTER_AUTH_URL: getEnv('BETTER_AUTH_URL'),
    SMTP_HOST: getEnv('SMTP_HOST'),
    SMTP_PORT: Number(getEnv('SMTP_PORT')),
    SMTP_SECURE: getEnv('SMTP_SECURE'),
    SMTP_USER: getEnv('SMTP_USER'),
    SMTP_PASS: getEnv('SMTP_PASS'),
    EMAIL_FROM: getEnv('EMAIL_FROM'),

} as const;
