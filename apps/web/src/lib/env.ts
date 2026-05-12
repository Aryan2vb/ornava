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
  R2_ACCOUNT_ID: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  R2_ACCESS_KEY_ID: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  R2_SECRET_ACCESS_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  R2_ORIGINALS_BUCKET: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).default("ornava-originals"),
  ),
  R2_GENERATED_BUCKET: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).default("ornava-generated"),
  ),
  IMAGE_MODEL_DEFAULT: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).default("ornava-default-v1"),
  ),
  IMAGE_MODEL_STUDIO: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  IMAGE_MODEL_ON_MODEL: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  IMAGE_MODEL_CLOSE_UP: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  FAL_WEBHOOK_SECRET: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
});

type RawWebEnv = {
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  AUTH_SECRET?: string;
  AUTH_TRUST_HOST?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DEV_AUTH_EMAIL?: string;
  DEV_AUTH_CODE?: string;
  ADMIN_EMAILS?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_ORIGINALS_BUCKET?: string;
  R2_GENERATED_BUCKET?: string;
  IMAGE_MODEL_DEFAULT?: string;
  IMAGE_MODEL_STUDIO?: string;
  IMAGE_MODEL_ON_MODEL?: string;
  IMAGE_MODEL_CLOSE_UP?: string;
  FAL_WEBHOOK_SECRET?: string;
};

export function parseWebEnv(rawEnv: RawWebEnv) {
  return envSchema.parse(rawEnv);
}

export function getRequiredAuthSecret(rawEnv: {
  NODE_ENV?: string;
  NEXTAUTH_SECRET?: string;
  AUTH_SECRET?: string;
}) {
  const secret = rawEnv.NEXTAUTH_SECRET || rawEnv.AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (rawEnv.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET or AUTH_SECRET is required in production.");
  }

  return "ornava-dev-secret";
}

export const env = parseWebEnv({
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
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_ORIGINALS_BUCKET: process.env.R2_ORIGINALS_BUCKET,
  R2_GENERATED_BUCKET: process.env.R2_GENERATED_BUCKET,
  IMAGE_MODEL_DEFAULT: process.env.IMAGE_MODEL_DEFAULT,
  IMAGE_MODEL_STUDIO: process.env.IMAGE_MODEL_STUDIO,
  IMAGE_MODEL_ON_MODEL: process.env.IMAGE_MODEL_ON_MODEL,
  IMAGE_MODEL_CLOSE_UP: process.env.IMAGE_MODEL_CLOSE_UP,
  FAL_WEBHOOK_SECRET: process.env.FAL_WEBHOOK_SECRET,
});
