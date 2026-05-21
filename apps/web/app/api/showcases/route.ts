import type {
  CreateShowcaseRequest,
  CreateShowcaseResponse,
} from "@ornava/shared";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createShowcaseForUser } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";
import { normalizeCreateShowcaseInput } from "@/lib/showcase";

export async function POST(request: Request) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = normalizeCreateShowcaseInput(
      (await request.json()) as CreateShowcaseRequest,
    );
    const showcase = await createShowcaseForUser({
      userId,
      title: body.title,
      generationIds: body.generationIds,
    });

    if (!showcase) {
      return NextResponse.json(
        { error: "showcase_generations_unavailable" },
        { status: 400 },
      );
    }

    const response: CreateShowcaseResponse = {
      showcaseId: showcase.id,
      title: showcase.title,
      publicPath: `/showcase/${showcase.id}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_showcase", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("[showcases:create]", error);
    return NextResponse.json({ error: "showcase_create_failed" }, { status: 500 });
  }
}
