import type { CreateGenerationResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createGeneration,
  getUploadedImageForUser,
} from "@/lib/db";
import {
  resolveModelRouteForMode,
  validateCreateGenerationRequest,
} from "@/lib/generation";
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

    const modelRoute = resolveModelRouteForMode(generationRequest.mode);
    const generation = await createGeneration({
      userId,
      imageId: image.id,
      mode: generationRequest.mode,
      modelRoute,
      clientRequestId: generationRequest.clientRequestId,
    });

    await enqueueGenerationJob({
      generationId: generation.id,
      userId,
      imageId: image.id,
      mode: generation.mode,
      modelRoute: generation.model_route,
    });

    const response: CreateGenerationResponse = {
      generationId: generation.id,
      status: generation.status === "processing" ? "processing" : "queued",
      modelRoute: generation.model_route,
    };

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
