import type { BatchGenerateResponse } from "@ornava/shared";
import { GENERATION_MODES, ASPECT_RATIOS, BACKGROUND_PRESETS, GUIDED_PROMPT_TEMPLATE_VERSION, JEWELRY_TYPES } from "@ornava/shared";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  createGeneration,
  deductAvailableCreditsAtomic,
  getBatchForUser,
  getBatchImages,
  refundCredits,
  setBatchGeneratedCount,
  saveBatchBrief,
  updateBatchStatus,
} from "@/lib/db";
import { resolveModelRouteForMode } from "@/lib/generation";
import { enqueueGenerationJob } from "@/lib/queue";
import { getRequiredUserId } from "@/lib/session";

const paramsSchema = z.object({ batchId: z.string().uuid() });

const bodySchema = z.object({
  mode: z.enum(GENERATION_MODES),
  generationBrief: z.object({
    jewelryType: z.enum(JEWELRY_TYPES),
    generationMode: z.enum(GENERATION_MODES),
    modelPresetId: z.string().min(1).max(80),
    posePresetId: z.string().min(1).max(120),
    backgroundPresetId: z.enum(BACKGROUND_PRESETS),
    aspectRatio: z.enum(ASPECT_RATIOS),
    promptTemplateVersion: z.literal(GUIDED_PROMPT_TEMPLATE_VERSION),
  }),
  clientRequestId: z.string().min(1).max(120),
});

type RouteParams = { params: Promise<{ batchId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { batchId } = paramsSchema.parse(await params);
    const body = bodySchema.parse(await request.json());

    const batch = await getBatchForUser({ userId, batchId });
    if (!batch) return NextResponse.json({ error: "batch_not_found" }, { status: 404 });
    if (batch.status === "generating" || batch.status === "completed") {
      return NextResponse.json({ error: "batch_already_generating" }, { status: 409 });
    }

    const images = await getBatchImages(batchId);
    const uploadedImages = images.filter((img) => img.status === "uploaded");
    if (uploadedImages.length === 0) {
      return NextResponse.json({ error: "no_uploaded_images" }, { status: 400 });
    }
    if (uploadedImages.length > 10) {
      return NextResponse.json(
        { error: "batch_too_large", message: "Remove images until the batch has 10 or fewer photos." },
        { status: 409 },
      );
    }

    // Atomically reserve as many credits as possible for this batch. This keeps
    // partial batch generation working even if credits changed moments ago.
    const reservedCredits = await deductAvailableCreditsAtomic({
      userId,
      maxAmount: uploadedImages.length,
    });
    if (!reservedCredits) {
      return NextResponse.json({ error: "no_credits", message: "No credits remaining" }, { status: 403 });
    }
    const jobCount = reservedCredits.deducted;

    // Save brief and update batch
    await saveBatchBrief({ batchId, brief: body.generationBrief });
    await setBatchGeneratedCount({ batchId, count: jobCount });

    const modelRoute = resolveModelRouteForMode(body.mode);
    const generations: BatchGenerateResponse["generations"] = [];

    try {
      for (let i = 0; i < uploadedImages.length; i++) {
        const img = uploadedImages[i];
        if (i < jobCount) {
          const gen = await createGeneration({
            userId,
            imageId: img.id,
            mode: body.mode,
            modelRoute,
            generationBrief: body.generationBrief,
            clientRequestId: `${body.clientRequestId}_${i}`,
            batchId,
            overlayText: img.overlay_text,
          });
          await enqueueGenerationJob({
            generationId: gen.id,
            userId,
            imageId: img.id,
            mode: gen.mode,
            modelRoute: gen.model_route,
            batchId,
          });
          generations.push({ generationId: gen.id, imageId: img.id, status: "queued" });
        } else {
          generations.push({ generationId: "", imageId: img.id, status: "skipped_no_credits" });
        }
      }
    } catch (error) {
      const queuedCount = generations.filter((generation) => generation.status === "queued").length;
      const unusedCredits = Math.max(jobCount - queuedCount, 0);
      if (unusedCredits > 0) {
        await refundCredits({ userId, amount: unusedCredits });
      }
      if (queuedCount > 0) {
        await setBatchGeneratedCount({ batchId, count: queuedCount });
      } else {
        await updateBatchStatus({ batchId, status: "ready" });
      }
      throw error;
    }

    const response: BatchGenerateResponse = {
      batchId,
      generations,
      creditsDeducted: jobCount,
      creditsRemaining: reservedCredits.credits,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("[batches:generate]", error);
    return NextResponse.json({ error: "batch_generate_failed" }, { status: 500 });
  }
}
