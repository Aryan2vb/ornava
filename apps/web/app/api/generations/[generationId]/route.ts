import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getGenerationForUser,
  toGenerationStatusResponse,
} from "@/lib/db";
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

  const generation = await getGenerationForUser({
    userId,
    generationId: parsedParams.data.generationId,
  });

  if (!generation) {
    return NextResponse.json({ error: "generation_not_found" }, { status: 404 });
  }

  return NextResponse.json(toGenerationStatusResponse(generation));
}
