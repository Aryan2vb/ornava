import type { RetryGenerationResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  createGeneration,
  getGenerationForUser,
  normalizeGenerationBrief,
} from "@/lib/db";
import {
  resolveModelRouteForMode,
  validateRetryGenerationRequest,
} from "@/lib/generation";
import { logAnalyticsEventSafe } from "@/lib/events";
import { enqueueGenerationJob } from "@/lib/queue";
import { getRequiredUserId } from "@/lib/session";

const paramsSchema = z.object({
  generationId: z.string().uuid(),
});

type RouteParams = {
  params: Promise<{
    generationId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const parsedParams = paramsSchema.parse(await params);
    const retryRequest = validateRetryGenerationRequest(await request.json());
    const previousGeneration = await getGenerationForUser({
      userId,
      generationId: parsedParams.generationId,
    });

    if (!previousGeneration) {
      return NextResponse.json({ error: "generation_not_found" }, { status: 404 });
    }

    const modelRoute = resolveModelRouteForMode(previousGeneration.mode);
    const generation = await createGeneration({
      userId,
      imageId: previousGeneration.image_id,
      mode: previousGeneration.mode,
      modelRoute,
      generationBrief: normalizeGenerationBrief(
        previousGeneration.generation_brief,
        previousGeneration.mode,
      ),
      clientRequestId: retryRequest.clientRequestId,
      previousGenerationId: previousGeneration.id,
    });

    await enqueueGenerationJob({
      generationId: generation.id,
      userId,
      imageId: generation.image_id,
      mode: generation.mode,
      modelRoute: generation.model_route,
    });
    await logAnalyticsEventSafe({
      userId,
      name: "retry_clicked",
      properties: {
        generationId: generation.id,
        previousGenerationId: previousGeneration.id,
        imageId: generation.image_id,
        mode: generation.mode,
        modelRoute: generation.model_route,
        jewelryType: generation.generation_brief.jewelryType,
        posePresetId: generation.generation_brief.posePresetId,
        backgroundPresetId: generation.generation_brief.backgroundPresetId,
        aspectRatio: generation.generation_brief.aspectRatio,
        promptTemplateVersion: generation.generation_brief.promptTemplateVersion,
      },
    });

    const response: RetryGenerationResponse = {
      generationId: generation.id,
      status: generation.status === "processing" ? "processing" : "queued",
      previousGenerationId: previousGeneration.id,
    };

    console.info("[generation:retry]", {
      generationId: generation.id,
      previousGenerationId: previousGeneration.id,
      userId,
      mode: generation.mode,
      modelRoute,
      previousFailureCode: previousGeneration.failure_code,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_retry", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("[generations:retry]", error);
    return NextResponse.json({ error: "generation_retry_failed" }, { status: 500 });
  }
}
