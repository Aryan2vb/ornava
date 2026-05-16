import { NextResponse } from "next/server";
import {
  getGenerationByProviderJobId,
  incrementBatchCompleted,
  incrementBatchFailed,
  markGenerationCompletedFromWebhook,
  markGenerationFailedFromWebhook,
} from "@/lib/db";
import {
  extractFalWebhookHeaders,
  verifyFalWebhook,
} from "@/lib/fal-webhook-verify";
import { logAnalyticsEventSafe } from "@/lib/events";
import { putGeneratedImageObject } from "@/lib/storage";

// Export runtime as nodejs - we use Node crypto for ED25519 verification
// and need raw body bytes (not parsed JSON) to validate the signature.
export const runtime = "nodejs";
// Don't cache or prerender — this is a side-effecting webhook
export const dynamic = "force-dynamic";

// Fal.ai webhook payload shape:
//   { request_id, gateway_request_id, status: "OK" | "ERROR", payload }
// Signature verification is done separately via headers + body hash + ED25519.
type FalWebhookPayload = {
  request_id?: string;
  gateway_request_id?: string;
  status?: "OK" | "ERROR";
  payload?: {
    images?: Array<{ url?: string; width?: number; height?: number }>;
    image?: { url?: string };
    error?: string;
    [key: string]: unknown;
  };
  error?: string;
};

export async function POST(request: Request) {
  // Read body as text first — we need the raw bytes for signature verification
  const rawBody = await request.text();

  // Verify signature using Fal's ED25519 + JWKS scheme
  const headers = extractFalWebhookHeaders(request.headers);
  const verifyResult = await verifyFalWebhook({ rawBody, headers });

  if (!verifyResult.ok) {
    console.warn(
      `[fal-webhook] rejected: ${verifyResult.reason} (request_id=${headers.requestId ?? "unknown"})`,
    );
    return NextResponse.json(
      { error: "invalid_signature", reason: verifyResult.reason },
      { status: 401 },
    );
  }

  let body: FalWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const providerJobId = body.request_id ?? body.gateway_request_id;
  if (!providerJobId) {
    return NextResponse.json({ error: "missing_request_id" }, { status: 400 });
  }

  // Look up the generation this webhook corresponds to
  const generation = await getGenerationByProviderJobId(providerJobId);
  if (!generation) {
    // Unknown request_id — log it but return 200 so Fal doesn't retry forever
    console.warn(`[fal-webhook] no generation found for ${providerJobId}`);
    return NextResponse.json({ ok: true, ignored: "unknown_request" });
  }

  // Idempotency — if this generation is already completed/failed, we've
  // already processed this (or a duplicate) webhook. Return 200 as a no-op.
  if (generation.status !== "processing") {
    console.info(
      `[fal-webhook] ${providerJobId} already in status ${generation.status}, skipping`,
    );
    return NextResponse.json({ ok: true, ignored: "already_processed" });
  }

  // Handle error status from Fal
  if (body.status === "ERROR") {
    const errorMsg = body.error ?? body.payload?.error ?? "Provider reported error";
    const failed = await markGenerationFailedFromWebhook({
      generationId: generation.id,
      failureCode: "provider_unavailable",
      failureMessageSafe: "Image generation failed. Please retry.",
    });
    if (failed && generation.batch_id) await incrementBatchFailed(generation.batch_id);
    await logAnalyticsEventSafe({
      userId: generation.user_id,
      name: "generation_failed",
      properties: {
        generationId: generation.id,
        imageId: generation.image_id,
        mode: generation.mode,
        failureCode: "provider_unavailable",
        rawMessage: errorMsg,
        source: "webhook",
      },
    });
    return NextResponse.json({ ok: true, status: "failed" });
  }

  // Extract the output image URL from Fal's response payload
  const outputUrl =
    body.payload?.images?.[0]?.url ?? body.payload?.image?.url;

  if (!outputUrl) {
    const failed = await markGenerationFailedFromWebhook({
      generationId: generation.id,
      failureCode: "unknown",
      failureMessageSafe: "Image generation completed but output was empty.",
    });
    if (failed && generation.batch_id) await incrementBatchFailed(generation.batch_id);
    return NextResponse.json({ ok: true, status: "failed_no_output" });
  }

  // Download the generated image from Fal's CDN and store it in our R2 bucket.
  // This is the same transfer that was previously done synchronously in the worker.
  try {
    const downloadRes = await fetch(outputUrl);
    if (!downloadRes.ok) {
      throw new Error(`Download failed: HTTP ${downloadRes.status}`);
    }
    const bytes = new Uint8Array(await downloadRes.arrayBuffer());

    // Use the same key format as before so admin/result pages still work
    const objectKey = `users/${generation.user_id}/generated/${generation.id}/output.jpg`;

    await putGeneratedImageObject({
      objectKey,
      bytes,
      contentType: "image/jpeg",
    });

    // Compute duration from started_at (when worker submitted the job)
    const startedAt = generation.started_at ? new Date(generation.started_at).getTime() : Date.now();
    const durationMs = Date.now() - startedAt;

    const completed = await markGenerationCompletedFromWebhook({
      generationId: generation.id,
      outputObjectKey: objectKey,
      generationDurationMs: durationMs,
      rawProviderMetadata: {
        ...(generation.raw_provider_metadata ?? {}),
        webhookCompletedAt: new Date().toISOString(),
        falOutputUrl: outputUrl,
      },
    });

    if (completed && generation.batch_id) await incrementBatchCompleted(generation.batch_id);

    await logAnalyticsEventSafe({
      userId: generation.user_id,
      name: "generation_completed",
      properties: {
        generationId: generation.id,
        imageId: generation.image_id,
        mode: generation.mode,
        modelRoute: generation.model_route,
        generationDurationMs: durationMs,
        source: "webhook",
      },
    });

    return NextResponse.json({ ok: true, status: "completed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[fal-webhook] failed to process ${providerJobId}:`, message);

    const failed = await markGenerationFailedFromWebhook({
      generationId: generation.id,
      failureCode: "storage_write_failed",
      failureMessageSafe: "Could not save generated image. Please retry.",
    });

    if (failed && generation.batch_id) await incrementBatchFailed(generation.batch_id);

    return NextResponse.json(
      { ok: true, status: "failed", error: "storage_write_failed" },
      // Return 200 even on error so Fal doesn't retry — we've marked the job
      // as failed in our DB and the user will see the failure state.
      { status: 200 },
    );
  }
}
