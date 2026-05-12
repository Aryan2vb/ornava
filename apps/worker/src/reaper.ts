import { fal } from "@fal-ai/client";
import { getPool } from "./db";
import { env } from "./env";
import { putGeneratedImageObject, buildGeneratedObjectKey, contentTypeForOutputFormat } from "./storage";
import { extractFalImageResult, downloadGeneratedImage } from "./adapters/fal-image-edit";

/**
 * Reaper for stuck generations.
 *
 * Problem: When a generation is submitted async via webhook mode, we rely on
 * Fal.ai calling our /api/webhooks/fal endpoint. If the webhook call fails
 * (network blip, server restart, signature mismatch), the generation is
 * stuck in `processing` forever.
 *
 * Solution: Every 30 seconds, find generations that have been in `processing`
 * status for > 60s and have a `provider_job_id`. Poll Fal directly for their
 * status. If Fal says COMPLETED, download the output and mark our generation
 * complete — same as the webhook would have. If Fal says failed or older
 * than 5 minutes, mark our generation failed.
 */

const STUCK_AFTER_MS = 60_000; // 1 minute — Fal typically takes 20-25s
const GIVE_UP_AFTER_MS = 5 * 60_000; // 5 minutes — mark failed if no progress
const REAPER_INTERVAL_MS = 30_000; // Check every 30s

type StuckGeneration = {
  id: string;
  user_id: string;
  image_id: string;
  mode: string;
  provider_model_id: string;
  provider_job_id: string;
  started_at: string;
  age_ms: number;
};

async function findStuckGenerations(): Promise<StuckGeneration[]> {
  const result = await getPool().query<StuckGeneration>(
    `
      select
        id,
        user_id,
        image_id,
        mode::text,
        provider_model_id,
        provider_job_id,
        started_at::text,
        extract(epoch from (now() - started_at))::int * 1000 as age_ms
      from generations
      where status = 'processing'
        and provider = 'fal'
        and provider_job_id is not null
        and started_at is not null
        and started_at < now() - ($1::int || ' milliseconds')::interval
      order by started_at asc
      limit 20
    `,
    [STUCK_AFTER_MS],
  );

  return result.rows;
}

async function markGenerationCompletedByReaper(
  generationId: string,
  outputObjectKey: string,
  durationMs: number,
) {
  await getPool().query(
    `
      update generations
      set
        status = 'completed',
        output_object_key = $2,
        generation_duration_ms = $3,
        completed_at = now(),
        updated_at = now()
      where id = $1
        and status = 'processing'
    `,
    [generationId, outputObjectKey, durationMs],
  );
}

async function markGenerationFailedByReaper(
  generationId: string,
  failureCode: string,
  message: string,
) {
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
        and status = 'processing'
    `,
    [generationId, failureCode, message],
  );
}

async function checkAndRecoverGeneration(gen: StuckGeneration) {
  if (!env.FAL_KEY) return;

  fal.config({ credentials: env.FAL_KEY });

  try {
    // Ask Fal for the current status of this request_id
    const status = await fal.queue.status(gen.provider_model_id, {
      requestId: gen.provider_job_id,
    });

    if (status.status === "COMPLETED") {
      // Fal is done but our webhook didn't complete us. Finish the job now.
      console.info(
        `[reaper] generation ${gen.id} completed on fal but webhook missed. Recovering.`,
      );

      const result = await fal.queue.result(gen.provider_model_id, {
        requestId: gen.provider_job_id,
      });

      const image = extractFalImageResult(result.data);
      const bytes = await downloadGeneratedImage(image.url);
      const objectKey = buildGeneratedObjectKey({
        userId: gen.user_id,
        generationId: gen.id,
        format: "jpeg",
      });

      await putGeneratedImageObject({
        objectKey,
        bytes,
        contentType: contentTypeForOutputFormat("jpeg"),
      });

      await markGenerationCompletedByReaper(gen.id, objectKey, gen.age_ms);
      return;
    }

    // Still processing on Fal's side. If it's been too long, give up.
    if (gen.age_ms > GIVE_UP_AFTER_MS) {
      console.warn(
        `[reaper] generation ${gen.id} exceeded ${GIVE_UP_AFTER_MS}ms on fal (status=${status.status}), marking failed`,
      );
      await markGenerationFailedByReaper(
        gen.id,
        "provider_timeout",
        "Image generation took too long. Please retry.",
      );
    }
    // Otherwise, leave it alone and let the webhook arrive
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[reaper] failed to check ${gen.id}:`, message);

    // If we can't reach Fal at all for a job >5min old, fail it
    if (gen.age_ms > GIVE_UP_AFTER_MS) {
      await markGenerationFailedByReaper(
        gen.id,
        "provider_unavailable",
        "Could not reach image generation service. Please retry.",
      );
    }
  }
}

let reaperTimer: NodeJS.Timeout | undefined;

export function startReaper() {
  // Only run the reaper if we're in async webhook mode — no point otherwise.
  if (!env.WEBHOOK_BASE_URL) {
    console.info("[reaper] webhook mode not configured, reaper disabled");
    return;
  }

  console.info(
    `[reaper] started — checking every ${REAPER_INTERVAL_MS}ms for jobs stuck > ${STUCK_AFTER_MS}ms`,
  );

  const run = async () => {
    try {
      const stuck = await findStuckGenerations();
      if (stuck.length === 0) return;

      console.info(`[reaper] found ${stuck.length} stuck generations`);
      // Process sequentially to avoid hammering Fal with status checks
      for (const gen of stuck) {
        await checkAndRecoverGeneration(gen);
      }
    } catch (error) {
      console.error("[reaper] cycle failed:", error);
    }
  };

  // Run once on start, then on interval
  void run();
  reaperTimer = setInterval(() => void run(), REAPER_INTERVAL_MS);
}

export function stopReaper() {
  if (reaperTimer) {
    clearInterval(reaperTimer);
    reaperTimer = undefined;
  }
}
