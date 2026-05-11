import { Pool } from "pg";
import type {
  FeedbackRating,
  FeedbackReason,
  GenerationMode,
  GenerationStatus,
  GenerationStatusResponse,
} from "@ornava/shared";
import { env } from "./env";
import { normalizeEmail } from "./identity";
import type { GenerationResultRow } from "./result";

declare global {
  // eslint-disable-next-line no-var
  var __ornavaPool: Pool | undefined;
}

let pool: Pool | undefined;

export function getPool() {
  const connectionString = env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for the web app database layer.");
  }

  if (!pool) {
    pool =
      globalThis.__ornavaPool ??
      new Pool({
        connectionString,
      });

    if (process.env.NODE_ENV !== "production") {
      globalThis.__ornavaPool = pool;
    }
  }

  return pool;
}

export type AppUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  beta_cohort: string | null;
};

export type ImageRow = {
  id: string;
  user_id: string;
  original_object_key: string;
  status: "created" | "uploaded" | "failed" | "deleted";
};

export type GenerationRow = {
  id: string;
  user_id: string;
  image_id: string;
  mode: GenerationMode;
  status: GenerationStatus;
  model_route: string;
  provider: string | null;
  provider_model_id: string | null;
  output_object_key: string | null;
  failure_code: string | null;
  failure_message_safe: string | null;
  generation_duration_ms: number | null;
};

export type GenerationFeedbackRow = {
  id: string;
  user_id: string;
  generation_id: string;
  rating: FeedbackRating;
  reason: FeedbackReason | null;
  free_text: string | null;
};

export async function upsertUserFromOAuthProfile(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error("A non-empty email is required to upsert an app user.");
  }

  const result = await getPool().query<AppUserRow>(
    `
      insert into app_users (email, name, avatar_url, last_seen_at)
      values ($1, $2, $3, now())
      on conflict (email)
      do update set
        name = coalesce(excluded.name, app_users.name),
        avatar_url = coalesce(excluded.avatar_url, app_users.avatar_url),
        last_seen_at = now(),
        updated_at = now()
      returning id, email, name, avatar_url, beta_cohort
    `,
    [email, input.name ?? null, input.image ?? null],
  );

  return result.rows[0];
}

export async function createImageUpload(input: {
  imageId: string;
  userId: string;
  objectKey: string;
  fileType: "image/jpeg" | "image/png";
  fileSizeBytes: number;
  width?: number;
  height?: number;
}) {
  const result = await getPool().query<ImageRow>(
    `
      insert into images (
        id,
        user_id,
        original_object_key,
        status,
        file_type,
        file_size_bytes,
        width,
        height
      )
      values ($1, $2, $3, 'created', $4, $5, $6, $7)
      returning id, user_id, original_object_key, status
    `,
    [
      input.imageId,
      input.userId,
      input.objectKey,
      input.fileType,
      input.fileSizeBytes,
      input.width ?? null,
      input.height ?? null,
    ],
  );

  return result.rows[0];
}

export async function markImageUploaded(input: {
  userId: string;
  imageId: string;
  objectKey: string;
}) {
  const result = await getPool().query<ImageRow>(
    `
      update images
      set status = 'uploaded'
      where id = $1
        and user_id = $2
        and original_object_key = $3
        and status = 'created'
      returning id, user_id, original_object_key, status
    `,
    [input.imageId, input.userId, input.objectKey],
  );

  return result.rows[0] ?? null;
}

export async function getCreatedImageForUser(input: {
  userId: string;
  imageId: string;
  objectKey: string;
}) {
  const result = await getPool().query<ImageRow>(
    `
      select id, user_id, original_object_key, status
      from images
      where id = $1
        and user_id = $2
        and original_object_key = $3
        and status = 'created'
    `,
    [input.imageId, input.userId, input.objectKey],
  );

  return result.rows[0] ?? null;
}

export async function getUploadedImageForUser(input: {
  userId: string;
  imageId: string;
}) {
  const result = await getPool().query<ImageRow>(
    `
      select id, user_id, original_object_key, status
      from images
      where id = $1
        and user_id = $2
        and status = 'uploaded'
    `,
    [input.imageId, input.userId],
  );

  return result.rows[0] ?? null;
}

export async function createGeneration(input: {
  userId: string;
  imageId: string;
  mode: GenerationMode;
  modelRoute: string;
  clientRequestId: string;
  previousGenerationId?: string;
}) {
  const result = await getPool().query<GenerationRow>(
    `
      insert into generations (
        user_id,
        image_id,
        mode,
        status,
        model_route,
        prompt_template_version,
        client_request_id,
        previous_generation_id
      )
      values ($1, $2, $3, 'queued', $4, 'phase1-v1', $5, $6)
      on conflict (user_id, client_request_id)
      do update set updated_at = now()
      returning
        id,
        user_id,
        image_id,
        mode,
        status,
        model_route,
        provider,
        provider_model_id,
        output_object_key,
        failure_code,
        failure_message_safe,
        generation_duration_ms
    `,
    [
      input.userId,
      input.imageId,
      input.mode,
      input.modelRoute,
      input.clientRequestId,
      input.previousGenerationId ?? null,
    ],
  );

  return result.rows[0];
}

export async function getGenerationForUser(input: {
  userId: string;
  generationId: string;
}) {
  const result = await getPool().query<GenerationRow>(
    `
      select
        id,
        user_id,
        image_id,
        mode,
        status,
        model_route,
        provider,
        provider_model_id,
        output_object_key,
        failure_code,
        failure_message_safe,
        generation_duration_ms
      from generations
      where id = $1
        and user_id = $2
    `,
    [input.generationId, input.userId],
  );

  return result.rows[0] ?? null;
}

export async function getCompletedGenerationResultForUser(input: {
  userId: string;
  generationId: string;
}) {
  const result = await getPool().query<GenerationResultRow>(
    `
      select
        g.id,
        g.image_id,
        g.mode,
        g.status,
        g.model_route,
        g.provider,
        g.provider_model_id,
        g.provider_job_id,
        g.generation_duration_ms,
        i.original_object_key,
        g.output_object_key
      from generations g
      join images i on i.id = g.image_id
      where g.id = $1
        and g.user_id = $2
        and g.status = 'completed'
        and g.output_object_key is not null
    `,
    [input.generationId, input.userId],
  );

  return result.rows[0] ?? null;
}

export async function createGenerationFeedback(input: {
  userId: string;
  generationId: string;
  rating: FeedbackRating;
  reason?: FeedbackReason;
  freeText?: string;
}) {
  const result = await getPool().query<GenerationFeedbackRow>(
    `
      insert into generation_feedback (
        user_id,
        generation_id,
        rating,
        reason,
        free_text
      )
      values ($1, $2, $3, $4, $5)
      returning id, user_id, generation_id, rating, reason, free_text
    `,
    [
      input.userId,
      input.generationId,
      input.rating,
      input.reason ?? null,
      input.freeText ?? null,
    ],
  );

  return result.rows[0];
}

export function toGenerationStatusResponse(
  generation: GenerationRow,
): GenerationStatusResponse {
  return {
    generationId: generation.id,
    imageId: generation.image_id,
    mode: generation.mode,
    status: generation.status,
    modelRoute: generation.model_route,
    provider: generation.provider ?? undefined,
    providerModelId: generation.provider_model_id ?? undefined,
    outputUrl: generation.output_object_key ?? undefined,
    failureCode: generation.failure_code ?? undefined,
    failureMessage: generation.failure_message_safe ?? undefined,
    generationDurationMs: generation.generation_duration_ms ?? undefined,
  };
}
