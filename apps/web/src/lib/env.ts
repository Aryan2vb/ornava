import { z } from "zod";

const emptyStringToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_POSTHOG_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  NEXT_PUBLIC_POSTHOG_HOST: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default("https://app.posthog.com"),
  ),
  NEXTAUTH_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default("http://localhost:3000"),
  ),
  NEXTAUTH_SECRET: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  AUTH_SECRET: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  AUTH_TRUST_HOST: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  GOOGLE_CLIENT_ID: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  GOOGLE_CLIENT_SECRET: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  DEV_AUTH_EMAIL: z.preprocess(
    emptyStringToUndefined,
    z.string().email().optional(),
  ),
  DEV_AUTH_CODE: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  ADMIN_EMAILS: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  DATABASE_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  REDIS_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  IMAGE_MODEL_DEFAULT: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).default("ornava-default-v1"),
  ),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  DEV_AUTH_EMAIL: process.env.DEV_AUTH_EMAIL,
  DEV_AUTH_CODE: process.env.DEV_AUTH_CODE,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  IMAGE_MODEL_DEFAULT: process.env.IMAGE_MODEL_DEFAULT,
});
