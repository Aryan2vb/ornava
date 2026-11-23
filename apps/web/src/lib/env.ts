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
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().optional(),
  ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.preprocess(
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
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
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

export const env = parseWebEnv({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
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
