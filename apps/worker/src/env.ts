import { fileURLToPath } from "node:url";
import { z } from "zod";
import { config } from "dotenv";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_ORIGINALS_BUCKET: z.string().min(1).default("ornava-originals"),
  R2_GENERATED_BUCKET: z.string().min(1).default("ornava-generated"),
  IMAGE_MODEL_DEFAULT: z.string().min(1).default("ornava-default-v1"),
  IMAGE_MODEL_STUDIO: z.string().optional(),
  IMAGE_MODEL_ON_MODEL: z.string().optional(),
  IMAGE_MODEL_CLOSE_UP: z.string().optional(),
  FAL_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse({
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
  FAL_KEY: process.env.FAL_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
});
