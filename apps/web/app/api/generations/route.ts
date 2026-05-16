import type { CreateGenerationResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createGeneration,
  deductCredit,
  getUserCredits,
  getUploadedImageForUser,
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
    const credits = await getUserCredits(userId);

    if (credits <= 0) {
      return NextResponse.json({ error: "no_credits", message: "No credits remaining" }, { status: 403 });
    }

    const generationRequest = validateCreateGenerationRequest(await request.json());
    const image = await getUploadedImageForUser({
      userId,
      imageId: generationRequest.imageId,
    });

    if (!image) {
      return NextResponse.json({ error: "image_not_found" }, { status: 404 });
    }

    const modelRoute = resolveModelRouteForMode(generationRequest.mode);
    const generation = await createGeneration({
      userId,
      imageId: image.id,
      mode: generationRequest.mode,
      modelRoute,
      generationBrief: generationRequest.generationBrief,
      clientRequestId: generationRequest.clientRequestId,
    });

    await enqueueGenerationJob({
      generationId: generation.id,
      userId,
      imageId: image.id,
      mode: generation.mode,
      modelRoute: generation.model_route,
    });
    await deductCredit(userId);
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
    await logAnalyticsEventSafe({
      userId,
      name: "brief_completed",
      properties: {
        generationId: generation.id,
        imageId: image.id,
        mode: generation.mode,
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
      brief: {
        jewelryType: generation.generation_brief.jewelryType,
        posePresetId: generation.generation_brief.posePresetId,
        backgroundPresetId: generation.generation_brief.backgroundPresetId,
        aspectRatio: generation.generation_brief.aspectRatio,
      },
      creditsRemaining: credits - 1,
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
