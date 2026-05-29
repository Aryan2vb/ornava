import type {
  CreateShowcaseRequest,
  CreateShowcaseResponse,
  ListShowcasesResponse,
} from "@ornava/shared";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createShowcaseForUser, listShowcasesForUser } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";
import {
  buildShowcasePublicPath,
  normalizeCreateShowcaseInput,
} from "@/lib/showcase";

export async function GET() {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const showcases = await listShowcasesForUser(userId);
    const response: ListShowcasesResponse = {
      showcases: showcases.map((showcase) => ({
        showcaseId: showcase.id,
        title: showcase.title,
        publicPath: buildShowcasePublicPath(showcase.public_code),
        itemCount: showcase.item_count,
        createdAt: showcase.created_at,
        updatedAt: showcase.updated_at,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[showcases:list]", error);
    return NextResponse.json({ error: "showcase_list_failed" }, { status: 500 });
  }
}

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
      publicPath: buildShowcasePublicPath(showcase.public_code),
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
