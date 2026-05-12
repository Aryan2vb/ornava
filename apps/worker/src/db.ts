import { Pool } from "pg";
import type {
  AnalyticsEventName,
  GenerationBrief,
  GenerationMode,
  JsonValue,
} from "@ornava/shared";
import { env } from "./env";

let pool: Pool | undefined;

export function getPool() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the worker database layer.");
  }

  pool ??= new Pool({
    connectionString: env.DATABASE_URL,
    // 15 connections per worker — covers 10 concurrent jobs + headroom for
    // event logging + status updates. With 2 worker replicas = 30 total
    // connections to Postgres, well under Supabase Pro's 500 limit.
    max: 15,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return pool;
}

export async function markGenerationProcessing(generationId: string) {
  await getPool().query(
    `
      update generations
      set
        status = 'processing',
        started_at = coalesce(started_at, now()),
        attempt_count = attempt_count + 1,
        updated_at = now()
      where id = $1
        and status in ('queued', 'failed')
    `,
    [generationId],
  );
}

export type GenerationWorkItem = {
  id: string;
  user_id: string;
  image_id: string;
  mode: GenerationMode;
  model_route: string;
  generation_brief: GenerationBrief;
  prompt_template_version: string;
  client_request_id: string;
  original_object_key: string;
  file_type: "image/jpeg" | "image/png" | "image/webp";
};

export async function getGenerationWorkItem(generationId: string) {
  const result = await getPool().query<GenerationWorkItem>(
    `
      select
        g.id,
        g.user_id,
        g.image_id,
        g.mode,
        g.model_route,
        g.generation_brief,
        g.prompt_template_version,
        g.client_request_id,
        i.original_object_key,
        i.file_type
      from generations g
      join images i on i.id = g.image_id
      where g.id = $1
        and g.status = 'processing'
        and i.status = 'uploaded'
    `,
    [generationId],
  );

  return result.rows[0] ?? null;
}

export async function markGenerationCompleted(input: {
  generationId: string;
  outputObjectKey: string;
  provider: string;
  providerModelId: string;
  providerJobId?: string;
  adapterVersion: string;
  generationDurationMs: number;
  estimatedCostMinor?: number;
  rawProviderMetadata?: Record<string, JsonValue>;
}) {
  await getPool().query(
    `
      update generations
      set
        status = 'completed',
        output_object_key = $2,
        provider = $3,
        provider_model_id = $4,
        provider_job_id = $5,
        adapter_version = $6,
        generation_duration_ms = $7,
        estimated_cost_minor = $8,
        raw_provider_metadata = $9::jsonb,
        failure_code = null,
        failure_message_safe = null,
        completed_at = now(),
        updated_at = now()
      where id = $1
    `,
    [
      input.generationId,
      input.outputObjectKey,
      input.provider,
      input.providerModelId,
      input.providerJobId ?? null,
      input.adapterVersion,
      input.generationDurationMs,
      input.estimatedCostMinor ?? null,
      JSON.stringify(input.rawProviderMetadata ?? {}),
    ],
  );
}

export async function markGenerationFailed(input: {
  generationId: string;
  failureCode: string;
  failureMessageSafe: string;
}) {
  await getPool().query(
    `
      update generations
      set
        status = 'failed',
        failure_code = $2,
        failure_message_safe = $3,
        completed_at = now(),
        updated_at = now()
      where id = $1
    `,
    [input.generationId, input.failureCode, input.failureMessageSafe],
  );
}

// Called after async submission to Fal. Stores the provider job ID so the
// webhook handler can look up this generation when Fal calls back. Also
// stores provider + model for admin visibility. Status stays 'processing'.
export async function markGenerationSubmittedAsync(input: {
  generationId: string;
  provider: string;
  providerModelId: string;
  providerJobId: string;
  adapterVersion: string;
  rawProviderMetadata?: Record<string, JsonValue>;
}) {
  await getPool().query(
    `
      update generations
      set
        provider = $2,
        provider_model_id = $3,
        provider_job_id = $4,
        adapter_version = $5,
        raw_provider_metadata = $6::jsonb,
        updated_at = now()
      where id = $1
    `,
    [
      input.generationId,
      input.provider,
      input.providerModelId,
      input.providerJobId,
      input.adapterVersion,
      JSON.stringify(input.rawProviderMetadata ?? {}),
    ],
  );
}

export async function logWorkerEventSafe(input: {
  userId?: string | null;
  name: AnalyticsEventName;
  properties?: Record<string, JsonValue | undefined>;
}) {
  try {
    const properties = Object.fromEntries(
      Object.entries(input.properties ?? {}).filter(
        ([, value]) => value !== undefined,
      ),
    );

    await getPool().query(
      `
        insert into events (user_id, event_name, properties)
        values ($1, $2, $3::jsonb)
      `,
      [input.userId ?? null, input.name, JSON.stringify(properties)],
    );
  } catch (error) {
    console.error("[worker:events]", error);
  }
}

export async function closePool() {
  await pool?.end();
  pool = undefined;
}
