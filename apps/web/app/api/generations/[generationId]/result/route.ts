import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCompletedGenerationResultForUser,
} from "@/lib/db";
import { env } from "@/lib/env";
import { logAnalyticsEventSafe } from "@/lib/events";
import { toGenerationResultResponse } from "@/lib/result";
import { createObjectReadUrl } from "@/lib/storage";
import { getRequiredUserId } from "@/lib/session";

const paramsSchema = z.object({
  generationId: z.string().uuid(),
});

type RouteParams = {
  params: Promise<{
    generationId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_generation" }, { status: 400 });
  }

  const generation = await getCompletedGenerationResultForUser({
    userId,
    generationId: parsedParams.data.generationId,
  });

  if (!generation) {
    return NextResponse.json({ error: "result_not_found" }, { status: 404 });
  }

  const [original, generated] = await Promise.all([
    createObjectReadUrl({
      bucket: env.R2_ORIGINALS_BUCKET,
      objectKey: generation.original_object_key,
    }),
    createObjectReadUrl({
      bucket: env.R2_GENERATED_BUCKET,
      objectKey: generation.output_object_key,
    }),
  ]);
  await logAnalyticsEventSafe({
    userId,
    name: "result_viewed",
    properties: {
      generationId: generation.id,
      imageId: generation.image_id,
      mode: generation.mode,
      modelRoute: generation.model_route,
    },
  });

  return NextResponse.json(
    toGenerationResultResponse(generation, {
      originalUrl: original.url,
      generatedUrl: generated.url,
      expiresAt: generated.expiresAt,
    }),
  );
}
