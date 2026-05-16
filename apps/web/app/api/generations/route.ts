import type { CreateGenerationResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createGeneration,
  deductCreditsAtomic,
  getUploadedImageForUser,
  refundCredits,
} from "@/lib/db";
import {
  resolveModelRouteForMode,
  validateCreateGenerationRequest,
} from "@/lib/generation";
import { logAnalyticsEventSafe } from "@/lib/events";
import { enqueueGenerationJob } from "@/lib/queue";
import { getRequiredUserId } from "@/lib/session";

export async function POST(request: Request) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const generationRequest = validateCreateGenerationRequest(await request.json());
    const image = await getUploadedImageForUser({
      userId,
      imageId: generationRequest.imageId,
    });

    if (!image) {
      return NextResponse.json({ error: "image_not_found" }, { status: 404 });
    }

    // Deduct after validation, but before enqueueing, so concurrent requests
    // cannot overdraw credits.
    const deducted = await deductCreditsAtomic({ userId, amount: 1 });
    if (!deducted) {
      return NextResponse.json({ error: "no_credits", message: "No credits remaining" }, { status: 403 });
    }

    const modelRoute = resolveModelRouteForMode(generationRequest.mode);
    let generation: Awaited<ReturnType<typeof createGeneration>>;

    try {
      generation = await createGeneration({
        userId,
        imageId: image.id,
        mode: generationRequest.mode,
        modelRoute,
        generationBrief: generationRequest.generationBrief,
        clientRequestId: generationRequest.clientRequestId,
        overlayText: image.overlay_text,
      });

      await enqueueGenerationJob({
        generationId: generation.id,
        userId,
        imageId: image.id,
        mode: generation.mode,
        modelRoute: generation.model_route,
      });
    } catch (error) {
      await refundCredits({ userId, amount: 1 });
      throw error;
    }
    await logAnalyticsEventSafe({
      userId,
      name: "generation_requested",
      properties: {
        generationId: generation.id,
        imageId: image.id,
        mode: generation.mode,
        modelRoute: generation.model_route,
        jewelryType: generation.generation_brief.jewelryType,
        posePresetId: generation.generation_brief.posePresetId,
        backgroundPresetId: generation.generation_brief.backgroundPresetId,
        aspectRatio: generation.generation_brief.aspectRatio,
        promptTemplateVersion: generation.generation_brief.promptTemplateVersion,
      },
    });

    const response: CreateGenerationResponse = {
      generationId: generation.id,
      status: generation.status === "processing" ? "processing" : "queued",
    };

    console.info("[generation:create]", {
      generationId: generation.id,
      userId,
      imageId: image.id,
      mode: generation.mode,
      modelRoute,
      creditsRemaining: deducted.credits,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_generation", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("[generations:create]", error);
    return NextResponse.json({ error: "generation_create_failed" }, { status: 500 });
  }
}
