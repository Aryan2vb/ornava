import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  IMAGE_MODEL_DEFAULT: z.string().min(1).default("ornava-default-v1"),
  IMAGE_MODEL_STUDIO: z.string().optional(),
  IMAGE_MODEL_ON_MODEL: z.string().optional(),
  IMAGE_MODEL_CLOSE_UP: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  IMAGE_MODEL_DEFAULT: process.env.IMAGE_MODEL_DEFAULT,
  IMAGE_MODEL_STUDIO: process.env.IMAGE_MODEL_STUDIO,
  IMAGE_MODEL_ON_MODEL: process.env.IMAGE_MODEL_ON_MODEL,
  IMAGE_MODEL_CLOSE_UP: process.env.IMAGE_MODEL_CLOSE_UP,
  SENTRY_DSN: process.env.SENTRY_DSN,
});
