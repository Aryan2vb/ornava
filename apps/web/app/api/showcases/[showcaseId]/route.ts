import type {
  DeleteShowcaseResponse,
  UpdateShowcaseRequest,
  UpdateShowcaseResponse,
} from "@ornava/shared";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { deleteShowcaseForUser, updateShowcaseForUser } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";
import {
  buildShowcasePublicPath,
  normalizeUpdateShowcaseInput,
} from "@/lib/showcase";

const paramsSchema = z.object({
  showcaseId: z.string().uuid(),
});

type RouteParams = {
  params: Promise<{
    showcaseId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_showcase" }, { status: 400 });
  }

  try {
    const body = normalizeUpdateShowcaseInput(
      (await request.json()) as UpdateShowcaseRequest,
    );
    const showcase = await updateShowcaseForUser({
      userId,
      showcaseId: parsedParams.data.showcaseId,
      title: body.title,
    });

    if (!showcase) {
      return NextResponse.json({ error: "showcase_not_found" }, { status: 404 });
    }

    const response: UpdateShowcaseResponse = {
      showcaseId: showcase.id,
      title: showcase.title,
      publicPath: buildShowcasePublicPath(showcase.public_code),
      itemCount: showcase.item_count,
      createdAt: showcase.created_at,
      updatedAt: showcase.updated_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_showcase", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("[showcases:update]", error);
    return NextResponse.json({ error: "showcase_update_failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_showcase" }, { status: 400 });
  }

  try {
    const deleted = await deleteShowcaseForUser({
      userId,
      showcaseId: parsedParams.data.showcaseId,
    });

    if (!deleted) {
      return NextResponse.json({ error: "showcase_not_found" }, { status: 404 });
    }

    const response: DeleteShowcaseResponse = {
      showcaseId: parsedParams.data.showcaseId,
      deleted: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[showcases:delete]", error);
    return NextResponse.json({ error: "showcase_delete_failed" }, { status: 500 });
  }
}
