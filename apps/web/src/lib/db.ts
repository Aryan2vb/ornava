import { Pool } from "pg";
import type {
  FeedbackRating,
  FeedbackReason,
  GenerationBrief,
  GenerationMode,
  GenerationStatus,
  GenerationStatusResponse,
  JsonValue,
  OverlayText,
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
  overlay_text?: OverlayText | null;
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
  overlay_text?: OverlayText | null;
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

export async function findAppUserByEmail(rawEmail: string | null | undefined) {
  const email = normalizeEmail(rawEmail);

  if (!email) {
    return null;
  }

  const result = await getPool().query<AppUserRow>(
    `select id, email, name, avatar_url, beta_cohort, invite_code_id from app_users where email = $1`,
    [email],
  );

  return result.rows[0] ?? null;
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
  batchId?: string;
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
        height,
        batch_id
      )
      values ($1, $2, $3, 'created', $4, $5, $6, $7, $8)
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
      input.batchId ?? null,
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
        , overlay_text
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
  batchId?: string;
  overlayText?: OverlayText | null;
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
        previous_generation_id,
        batch_id,
        overlay_text
      )
      values ($1, $2, $3, 'queued', $4, $5::jsonb, $6, $7, $8, $9, $10::jsonb)
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
        generation_duration_ms,
        overlay_text
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
      input.batchId ?? null,
      input.overlayText ? JSON.stringify(input.overlayText) : null,
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

export async function refundCredits(input: { userId: string; amount: number }) {
  await getPool().query(
    `update app_users set credits = credits + $2 where id = $1`,
    [input.userId, input.amount],
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
  overlay_text: OverlayText | null;
  feedback_rating: FeedbackRating | null;
  feedback_reason: FeedbackReason | null;
  generation_duration_ms: number | null;
  completed_at: string | null;
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
        g.overlay_text,
        gf.rating as feedback_rating,
        gf.reason as feedback_reason,
        g.generation_duration_ms,
        g.completed_at::text,
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

export type ShowcaseRow = {
  id: string;
  user_id: string;
  title: string;
  public_code: string;
  created_at: string;
  updated_at: string;
};

export type UserShowcaseSummaryRow = {
  id: string;
  title: string;
  public_code: string;
  item_count: number;
  created_at: string;
  updated_at: string;
};

export type PublicShowcaseRow = {
  id: string;
  title: string;
  user_id: string;
  jeweler_name: string | null;
  jeweler_phone: string | null;
  logo_object_key: string | null;
  logo_position: OverlayText["position"] | null;
  logo_size_percent: number | null;
};

export type PublicShowcaseItemRow = {
  generation_id: string;
  mode: GenerationMode;
  generation_brief: GenerationBrief;
  overlay_text: OverlayText | null;
  output_object_key: string;
  position: number;
};

export async function createShowcaseForUser(input: {
  userId: string;
  title: string;
  generationIds: string[];
}) {
  const client = await getPool().connect();

  try {
    await client.query("begin");

    const generationResult = await client.query<{ id: string }>(
      `
        select id
        from generations
        where user_id = $1
          and id = any($2::uuid[])
          and status = 'completed'
          and output_object_key is not null
      `,
      [input.userId, input.generationIds],
    );
    const validIds = new Set(generationResult.rows.map((row) => row.id));

    if (validIds.size !== input.generationIds.length) {
      await client.query("rollback");
      return null;
    }

    const showcaseResult = await client.query<ShowcaseRow>(
      `
        insert into showcases (user_id, title)
        values ($1, $2)
        returning id, user_id, title, public_code, created_at::text, updated_at::text
      `,
      [input.userId, input.title],
    );
    const showcase = showcaseResult.rows[0];

    await client.query(
      `
        insert into showcase_items (showcase_id, generation_id, position)
        select $1, item.generation_id, item.position::int - 1
        from unnest($2::uuid[]) with ordinality as item(generation_id, position)
      `,
      [showcase.id, input.generationIds],
    );

    await client.query("commit");
    return showcase;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listShowcasesForUser(userId: string) {
  const result = await getPool().query<UserShowcaseSummaryRow>(
    `
      select
        s.id,
        s.title,
        s.public_code,
        count(si.generation_id)::int as item_count,
        s.created_at::text,
        s.updated_at::text
      from showcases s
      left join showcase_items si on si.showcase_id = s.id
      where s.user_id = $1
      group by s.id
      order by s.created_at desc
    `,
    [userId],
  );

  return result.rows;
}

export async function updateShowcaseForUser(input: {
  userId: string;
  showcaseId: string;
  title: string;
}) {
  const result = await getPool().query<UserShowcaseSummaryRow>(
    `
      with updated_showcase as (
        update showcases
        set title = $3,
            updated_at = now()
        where id = $2
          and user_id = $1
        returning id, title, public_code, created_at, updated_at
      )
      select
        us.id,
        us.title,
        us.public_code,
        count(si.generation_id)::int as item_count,
        us.created_at::text,
        us.updated_at::text
      from updated_showcase us
      left join showcase_items si on si.showcase_id = us.id
      group by us.id, us.title, us.public_code, us.created_at, us.updated_at
    `,
    [input.userId, input.showcaseId, input.title],
  );

  return result.rows[0] ?? null;
}

export async function deleteShowcaseForUser(input: {
  userId: string;
  showcaseId: string;
}) {
  const client = await getPool().connect();

  try {
    await client.query("begin");

    const showcaseResult = await client.query<{ id: string }>(
      `
        select id
        from showcases
        where id = $2
          and user_id = $1
      `,
      [input.userId, input.showcaseId],
    );

    if (!showcaseResult.rows[0]) {
      await client.query("rollback");
      return false;
    }

    await client.query(
      `
        delete from showcase_items
        where showcase_id = $1
      `,
      [input.showcaseId],
    );
    await client.query(
      `
        delete from showcases
        where id = $2
          and user_id = $1
      `,
      [input.userId, input.showcaseId],
    );

    await client.query("commit");
    return true;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPublicShowcase(showcaseLocator: string) {
  const showcaseResult = await getPool().query<PublicShowcaseRow>(
    `
      select
        s.id,
        s.title,
        s.user_id,
        u.name as jeweler_name,
        u.phone as jeweler_phone,
        logo.logo_object_key,
        logo.position as logo_position,
        logo.size_percent as logo_size_percent
      from showcases s
      join app_users u on u.id = s.user_id
      left join user_logo_settings logo
        on logo.user_id = s.user_id
       and logo.enabled = true
      where s.id::text = $1
         or s.public_code = $1
    `,
    [showcaseLocator],
  );
  const showcase = showcaseResult.rows[0];

  if (!showcase) {
    return null;
  }

  const itemResult = await getPool().query<PublicShowcaseItemRow>(
    `
      select
        g.id as generation_id,
        g.mode,
        g.generation_brief,
        g.overlay_text,
        g.output_object_key,
        si.position
      from showcase_items si
      join generations g on g.id = si.generation_id
      where si.showcase_id = $1
        and g.status = 'completed'
        and g.output_object_key is not null
      order by si.position asc, g.created_at asc
    `,
    [showcase.id],
  );

  return {
    showcase,
    items: itemResult.rows,
  };
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
  batch_id: string | null;
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
        raw_provider_metadata,
        batch_id
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

// ===== Batch DB helpers =====

export type BatchRow = {
  id: string;
  user_id: string;
  status: string;
  generation_brief: GenerationBrief | null;
  image_count: number;
  generated_count: number;
  completed_count: number;
  failed_count: number;
  created_at: string;
};

export type BatchImageRow = {
  id: string;
  status: "created" | "uploaded" | "failed";
  original_object_key: string;
  overlay_text: OverlayText | null;
};

export type BatchGenerationRow = {
  id: string;
  image_id: string;
  status: GenerationStatus;
  failure_code: string | null;
  failure_message_safe: string | null;
  generation_duration_ms: number | null;
  completed_at: string | null;
  overlay_text: OverlayText | null;
};

export async function createBatch(input: { userId: string }) {
  const result = await getPool().query<BatchRow>(
    `INSERT INTO batches (user_id) VALUES ($1)
     RETURNING id, user_id, status, generation_brief, image_count, generated_count, completed_count, failed_count, created_at::text`,
    [input.userId],
  );
  return result.rows[0];
}

export async function getActiveBatchForUser(userId: string) {
  const result = await getPool().query<BatchRow>(
    `SELECT id, user_id, status, generation_brief, image_count, generated_count, completed_count, failed_count, created_at::text
     FROM batches
     WHERE user_id = $1 AND status IN ('uploading', 'ready', 'generating')
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function getBatchForUser(input: { userId: string; batchId: string }) {
  const result = await getPool().query<BatchRow>(
    `SELECT id, user_id, status, generation_brief, image_count, generated_count, completed_count, failed_count, created_at::text
     FROM batches WHERE id = $1 AND user_id = $2`,
    [input.batchId, input.userId],
  );
  return result.rows[0] ?? null;
}

export async function getBatchImages(batchId: string) {
  const result = await getPool().query<BatchImageRow>(
    `SELECT id, status, original_object_key, overlay_text FROM images WHERE batch_id = $1 ORDER BY created_at ASC`,
    [batchId],
  );
  return result.rows;
}

export async function updateImageOverlayTextForUser(input: {
  userId: string;
  imageId: string;
  overlayText: OverlayText;
}) {
  const result = await getPool().query<{ id: string }>(
    `
      update images
      set overlay_text = $3::jsonb,
          updated_at = now()
      where id = $1
        and user_id = $2
        and status in ('created', 'uploaded')
        and not exists (
          select 1 from generations
          where generations.image_id = images.id
        )
      returning id
    `,
    [input.imageId, input.userId, JSON.stringify(input.overlayText)],
  );
  return result.rows[0] ?? null;
}

export async function clearImageOverlayTextForUser(input: {
  userId: string;
  imageId: string;
}) {
  const result = await getPool().query<{ id: string }>(
    `
      update images
      set overlay_text = null,
          updated_at = now()
      where id = $1
        and user_id = $2
        and status in ('created', 'uploaded')
        and not exists (
          select 1 from generations
          where generations.image_id = images.id
        )
      returning id
    `,
    [input.imageId, input.userId],
  );
  return result.rows[0] ?? null;
}

export async function removeBatchImageForUser(input: {
  userId: string;
  batchId: string;
  imageId: string;
}) {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await client.query<{ id: string; status: BatchImageRow["status"] }>(
      `
        update images
        set status = 'deleted',
            batch_id = null,
            updated_at = now()
        where id = $1
          and user_id = $2
          and batch_id = $3
          and status in ('created', 'uploaded', 'failed')
          and not exists (
            select 1 from generations
            where generations.image_id = images.id
          )
        returning id, status
      `,
      [input.imageId, input.userId, input.batchId],
    );
    const removed = result.rows[0] ?? null;
    if (removed?.status === "uploaded") {
      await client.query(
        `
          update batches
          set image_count = greatest(image_count - 1, 0)
          where id = $1
        `,
        [input.batchId],
      );
    }
    await client.query("commit");
    return removed;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getBatchGenerations(batchId: string) {
  const result = await getPool().query<BatchGenerationRow>(
    `SELECT id, image_id, status, failure_code, failure_message_safe, generation_duration_ms, completed_at::text, overlay_text
     FROM generations WHERE batch_id = $1 ORDER BY created_at ASC`,
    [batchId],
  );
  return result.rows;
}

export async function updateBatchStatus(input: { batchId: string; status: string }) {
  await getPool().query(
    `UPDATE batches SET status = $2 WHERE id = $1`,
    [input.batchId, input.status],
  );
}

export async function saveBatchBrief(input: { batchId: string; brief: GenerationBrief }) {
  await getPool().query(
    `UPDATE batches SET generation_brief = $2::jsonb, status = 'ready' WHERE id = $1`,
    [input.batchId, JSON.stringify(input.brief)],
  );
}

export async function setBatchGeneratedCount(input: { batchId: string; count: number }) {
  await getPool().query(
    `UPDATE batches SET generated_count = $2, status = 'generating' WHERE id = $1`,
    [input.batchId, input.count],
  );
}

export async function deductCreditsAtomic(input: { userId: string; amount: number }) {
  const result = await getPool().query<{ credits: number }>(
    `UPDATE app_users SET credits = credits - $2 WHERE id = $1 AND credits >= $2 RETURNING credits`,
    [input.userId, input.amount],
  );
  return result.rows[0] ?? null;
}

export async function deductAvailableCreditsAtomic(input: { userId: string; maxAmount: number }) {
  const result = await getPool().query<{ credits: number; deducted: number }>(
    `
      WITH target AS (
        SELECT id, LEAST(credits, $2)::int AS deducted
        FROM app_users
        WHERE id = $1
          AND credits > 0
        FOR UPDATE
      )
      UPDATE app_users
      SET credits = app_users.credits - target.deducted
      FROM target
      WHERE app_users.id = target.id
      RETURNING app_users.credits, target.deducted
    `,
    [input.userId, input.maxAmount],
  );
  return result.rows[0] ?? null;
}

export async function incrementBatchCompleted(batchId: string) {
  const result = await getPool().query<{ completed_count: number; failed_count: number; generated_count: number }>(
    `UPDATE batches SET completed_count = completed_count + 1
     WHERE id = $1
     RETURNING completed_count, failed_count, generated_count`,
    [batchId],
  );
  const row = result.rows[0];
  if (row && row.completed_count + row.failed_count >= row.generated_count) {
    await updateBatchStatus({ batchId, status: "completed" });
  }
}

export async function incrementBatchFailed(batchId: string) {
  const result = await getPool().query<{ completed_count: number; failed_count: number; generated_count: number }>(
    `UPDATE batches SET failed_count = failed_count + 1
     WHERE id = $1
     RETURNING completed_count, failed_count, generated_count`,
    [batchId],
  );
  const row = result.rows[0];
  if (row && row.completed_count + row.failed_count >= row.generated_count) {
    await updateBatchStatus({ batchId, status: "completed" });
  }
}
