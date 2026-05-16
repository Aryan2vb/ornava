import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";

const paramsSchema = z.object({
  generationId: z.string().uuid(),
});

const overlaySchema = z.object({
  purity: z.enum(["24K", "22K", "20K", "18K"]),
  weightGm: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter weight like 4.2"),
  position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right", "bottom-center"]),
  size: z.enum(["small", "medium", "large"]).default("medium"),
});

type RouteParams = {
  params: Promise<{ generationId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_generation" }, { status: 400 });
  }

  try {
    const body = overlaySchema.parse(await request.json());

    const result = await getPool().query(
      `update generations set overlay_text = $3::jsonb
       where id = $1 and user_id = $2
       returning id`,
      [parsedParams.data.generationId, userId, JSON.stringify(body)],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "generation_not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_overlay", issues: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("[overlay:patch]", error);
    return NextResponse.json({ error: "overlay_save_failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_generation" }, { status: 400 });
  }

  await getPool().query(
    `update generations set overlay_text = null where id = $1 and user_id = $2`,
    [parsedParams.data.generationId, userId],
  );

  return NextResponse.json({ ok: true });
}
