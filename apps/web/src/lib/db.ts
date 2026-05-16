import { Pool } from "pg";
import type {
  FeedbackRating,
  FeedbackReason,
  GenerationBrief,
  GenerationMode,
  GenerationStatus,
  GenerationStatusResponse,
  JsonValue,
} from "@ornava/shared";
import { GUIDED_PROMPT_TEMPLATE_VERSION } from "@ornava/shared";
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
  invite_code_id: string | null;
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
  generation_brief: GenerationBrief;
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

export type AdminGenerationDebugRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  image_id: string;
  mode: GenerationMode;
  status: GenerationStatus;
  model_route: string;
  generation_brief: GenerationBrief;
  provider: string | null;
  provider_model_id: string | null;
  provider_job_id: string | null;
  attempt_count: number;
  failure_code: string | null;
  failure_message_safe: string | null;
  generation_duration_ms: number | null;
  queue_wait_ms: number | null;
  raw_provider_metadata: Record<string, JsonValue>;
  feedback_rating: FeedbackRating | null;
  feedback_reason: FeedbackReason | null;
  event_count: number;
  latest_event_name: string | null;
  latest_event_at: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export function normalizeGenerationBrief(
  value: unknown,
  mode: GenerationMode,
): GenerationBrief {
  if (
    value &&
    typeof value === "object" &&
    "jewelryType" in value &&
    "generationMode" in value &&
    "modelPresetId" in value &&
    "posePresetId" in value &&
    "backgroundPresetId" in value &&
    "aspectRatio" in value &&
    "promptTemplateVersion" in value
  ) {
    return value as GenerationBrief;
  }

  if (mode === "close_up") {
    return {
      jewelryType: "ring",
      generationMode: "close_up",
      modelPresetId: "studio_none",
      posePresetId: "ring_stone_macro",
      backgroundPresetId: "charcoal_black",
      aspectRatio: "1:1",
      promptTemplateVersion: GUIDED_PROMPT_TEMPLATE_VERSION,
    };
  }

  if (mode === "studio") {
    return {
      jewelryType: "other",
      generationMode: "studio",
      modelPresetId: "studio_none",
      posePresetId: "other_studio_catalog",
      backgroundPresetId: "warm_ivory",
      aspectRatio: "1:1",
      promptTemplateVersion: GUIDED_PROMPT_TEMPLATE_VERSION,
    };
  }

  return {
    jewelryType: "necklace",
    generationMode: "on_model",
    modelPresetId: "model_neck",
    posePresetId: "necklace_front_neck_crop",
    backgroundPresetId: "warm_ivory",
    aspectRatio: "4:5",
    promptTemplateVersion: GUIDED_PROMPT_TEMPLATE_VERSION,
  };
}

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
      returning id, email, name, avatar_url, beta_cohort, invite_code_id
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
  generationBrief: GenerationBrief;
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
        generation_brief,
        prompt_template_version,
        client_request_id,
        previous_generation_id
      )
      values ($1, $2, $3, 'queued', $4, $5::jsonb, $6, $7, $8)
      on conflict (user_id, client_request_id)
      do update set updated_at = now()
      returning
        id,
        user_id,
        image_id,
        mode,
        status,
        model_route,
        generation_brief,
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
      JSON.stringify(input.generationBrief),
      input.generationBrief.promptTemplateVersion,
      input.clientRequestId,
      input.previousGenerationId ?? null,
    ],
  );

  return result.rows[0];
}

export async function listAdminGenerationDebugRows(limit = 25) {
  const result = await getPool().query<AdminGenerationDebugRow>(
    `
      select
        g.id,
        g.user_id,
        u.email as user_email,
        g.image_id,
        g.mode,
        g.status,
        g.model_route,
        g.generation_brief,
        g.provider,
        g.provider_model_id,
        g.provider_job_id,
        g.attempt_count,
        g.failure_code,
        g.failure_message_safe,
        g.generation_duration_ms,
        g.queue_wait_ms,
        g.raw_provider_metadata,
        gf.rating as feedback_rating,
        gf.reason as feedback_reason,
        coalesce(ev.event_count, 0)::int as event_count,
        ev.latest_event_name,
        ev.latest_event_at,
        g.created_at::text,
        g.started_at::text,
        g.completed_at::text
      from generations g
      join app_users u on u.id = g.user_id
      left join lateral (
        select rating, reason
        from generation_feedback
        where generation_id = g.id
        order by created_at desc
        limit 1
      ) gf on true
      left join lateral (
        select
          count(*) as event_count,
          (array_agg(event_name order by created_at desc))[1] as latest_event_name,
          max(created_at)::text as latest_event_at
        from events
        where properties->>'generationId' = g.id::text
      ) ev on true
      order by g.created_at desc
      limit $1
    `,
    [limit],
  );

  return result.rows;
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
        generation_brief,
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
        g.generation_brief,
        g.provider,
        g.provider_model_id,
        g.provider_job_id,
        g.generation_duration_ms,
        g.overlay_text,
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

export async function getUserCredits(userId: string) {
  const result = await getPool().query<{ credits: number }>(
    `select credits from app_users where id = $1`,
    [userId],
  );
  return result.rows[0]?.credits ?? 0;
}

export async function deductCredit(userId: string) {
  const result = await getPool().query<{ credits: number }>(
    `update app_users set credits = credits - 1 where id = $1 and credits > 0 returning credits`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function grantCredits(userId: string, amount: number) {
  await getPool().query(
    `update app_users set credits = credits + $2 where id = $1`,
    [userId, amount],
  );
}

export type InviteCodeRow = {
  id: string;
  code: string;
  created_by: string | null;
  max_uses: number;
  use_count: number;
  created_at: string;
};

export async function validateAndClaimInviteCode(input: {
  code: string;
  userId: string;
}) {
  const result = await getPool().query<InviteCodeRow>(
    `
      update invite_codes
      set use_count = use_count + 1,
          used_by = $2,
          used_at = now()
      where code = $1
        and use_count < max_uses
      returning id, code, created_by, max_uses, use_count, created_at::text
    `,
    [input.code.trim().toLowerCase(), input.userId],
  );

  return result.rows[0] ?? null;
}

export async function checkInviteCodeValid(code: string) {
  const result = await getPool().query<{ id: string }>(
    `select id from invite_codes where code = $1 and use_count < max_uses`,
    [code.trim().toLowerCase()],
  );
  return result.rows[0] ?? null;
}

export async function linkInviteCodeToUser(input: {
  userId: string;
  inviteCodeId: string;
}) {
  await getPool().query(
    `update app_users set invite_code_id = $2 where id = $1`,
    [input.userId, input.inviteCodeId],
  );
}

export async function userHasInviteCode(userId: string) {
  const result = await getPool().query<{ invite_code_id: string | null }>(
    `select invite_code_id from app_users where id = $1`,
    [userId],
  );
  return Boolean(result.rows[0]?.invite_code_id);
}

export async function createInviteCode(input: {
  code: string;
  createdBy: string;
  maxUses?: number;
}) {
  const result = await getPool().query<InviteCodeRow>(
    `
      insert into invite_codes (code, created_by, max_uses)
      values ($1, $2, $3)
      returning id, code, created_by, max_uses, use_count, created_at::text
    `,
    [input.code.trim().toLowerCase(), input.createdBy, input.maxUses ?? 1],
  );
  return result.rows[0];
}

export async function listInviteCodesForUser(userId: string) {
  const result = await getPool().query<InviteCodeRow>(
    `
      select id, code, created_by, max_uses, use_count, created_at::text
      from invite_codes
      where created_by = $1
      order by created_at desc
    `,
    [userId],
  );
  return result.rows;
}

export type UserGenerationHistoryRow = {
  id: string;
  image_id: string;
  mode: GenerationMode;
  status: GenerationStatus;
  generation_brief: GenerationBrief;
  output_object_key: string | null;
  feedback_rating: FeedbackRating | null;
  feedback_reason: FeedbackReason | null;
  generation_duration_ms: number | null;
  created_at: string;
};

export async function listUserGenerations(userId: string, limit = 50) {
  const result = await getPool().query<UserGenerationHistoryRow>(
    `
      select
        g.id,
        g.image_id,
        g.mode,
        g.status,
        g.generation_brief,
        g.output_object_key,
        gf.rating as feedback_rating,
        gf.reason as feedback_reason,
        g.generation_duration_ms,
        g.created_at::text
      from generations g
      left join lateral (
        select rating, reason
        from generation_feedback
        where generation_id = g.id
        order by created_at desc
        limit 1
      ) gf on true
      where g.user_id = $1
      order by g.created_at desc
      limit $2
    `,
    [userId, limit],
  );
  return result.rows;
}

export function toGenerationStatusResponse(
  generation: GenerationRow,
): GenerationStatusResponse {
  return {
    generationId: generation.id,
    imageId: generation.image_id,
    mode: generation.mode,
    status: generation.status,
    failureCode: generation.failure_code ?? undefined,
    failureMessage: generation.failure_message_safe ?? undefined,
    generationDurationMs: generation.generation_duration_ms ?? undefined,
  };
}

// ===== Webhook Handler DB helpers =====
// Called from /api/webhooks/fal when Fal.ai POSTs a completion notification.
// We look up the generation by provider_job_id (unique per request) and
// complete or fail it idempotently — duplicate webhooks are safe to handle.

export type GenerationForWebhookRow = {
  id: string;
  user_id: string;
  image_id: string;
  mode: GenerationMode;
  model_route: string;
  status: GenerationStatus;
  provider: string | null;
  provider_model_id: string | null;
  adapter_version: string | null;
  started_at: string | null;
  raw_provider_metadata: Record<string, JsonValue>;
};

export async function getGenerationByProviderJobId(providerJobId: string) {
  const result = await getPool().query<GenerationForWebhookRow>(
    `
      select
        id,
        user_id,
        image_id,
        mode,
        model_route,
        status,
        provider,
        provider_model_id,
        adapter_version,
        started_at::text,
        raw_provider_metadata
      from generations
      where provider_job_id = $1
    `,
    [providerJobId],
  );

  return result.rows[0] ?? null;
}

export async function markGenerationCompletedFromWebhook(input: {
  generationId: string;
  outputObjectKey: string;
  generationDurationMs: number;
  rawProviderMetadata?: Record<string, JsonValue>;
}) {
  // WHERE clause prevents double-completion. If another webhook/reaper already
  // completed this job, our update becomes a no-op (0 rows affected).
  const result = await getPool().query<{ id: string }>(
    `
      update generations
      set
        status = 'completed',
        output_object_key = $2,
        generation_duration_ms = $3,
        raw_provider_metadata = $4::jsonb,
        failure_code = null,
        failure_message_safe = null,
        completed_at = now(),
        updated_at = now()
      where id = $1
        and status = 'processing'
      returning id
    `,
    [
      input.generationId,
      input.outputObjectKey,
      input.generationDurationMs,
      JSON.stringify(input.rawProviderMetadata ?? {}),
    ],
  );

  return result.rows[0] ?? null;
}

export async function markGenerationFailedFromWebhook(input: {
  generationId: string;
  failureCode: string;
  failureMessageSafe: string;
}) {
  const result = await getPool().query<{ id: string }>(
    `
      update generations
      set
        status = 'failed',
        failure_code = $2,
        failure_message_safe = $3,
        completed_at = now(),
        updated_at = now()
      where id = $1
        and status = 'processing'
      returning id
    `,
    [input.generationId, input.failureCode, input.failureMessageSafe],
  );

  return result.rows[0] ?? null;
}
