import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";
import { getRequiredUserId } from "@/lib/session";
import { createOriginalUploadUrl } from "@/lib/storage";

const LOGO_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const LOGO_OBJECT_PREFIX = "users";

function buildLogoObjectKey(userId: string) {
  return `${LOGO_OBJECT_PREFIX}/${userId}/branding/logo.png`;
}

// GET /api/profile/logo — return current logo settings + stable image endpoint
export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await getPool().query(
    `select logo_object_key, position, size_percent, enabled, width, height, updated_at::text
     from user_logo_settings where user_id = $1`,
    [userId],
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ hasLogo: false });
  }

  const row = result.rows[0];

  return NextResponse.json({
    hasLogo: true,
    logoUrl: "/api/profile/logo/image",
    logoCacheVersion: row.updated_at,
    position: row.position,
    sizePercent: row.size_percent,
    enabled: row.enabled,
    width: row.width,
    height: row.height,
  });
}

// POST /api/profile/logo — get presigned upload URL for logo
const uploadSchema = z.object({
  fileSizeBytes: z.number().int().min(1).max(LOGO_MAX_SIZE),
  width: z.number().int().min(100).max(2000),
  height: z.number().int().min(100).max(2000),
});

export async function POST(request: Request) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = uploadSchema.parse(await request.json());
    const objectKey = buildLogoObjectKey(userId);

    const { uploadUrl, expiresAt } = await createOriginalUploadUrl({
      objectKey,
      fileType: "image/png",
    });

    // Upsert logo settings
    const result = await getPool().query<{ updated_at: string }>(
      `insert into user_logo_settings (user_id, logo_object_key, file_size_bytes, width, height)
       values ($1, $2, $3, $4, $5)
       on conflict (user_id) do update set
         logo_object_key = excluded.logo_object_key,
         file_size_bytes = excluded.file_size_bytes,
         width = excluded.width,
         height = excluded.height,
         enabled = true
       returning updated_at::text`,
      [userId, objectKey, body.fileSizeBytes, body.width, body.height],
    );

    return NextResponse.json(
      { uploadUrl, expiresAt, logoCacheVersion: result.rows[0]?.updated_at },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "invalid_request", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    console.error("[logo:upload]", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}

// PATCH /api/profile/logo — update position, size, or enabled
const patchSchema = z.object({
  position: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right", "bottom-center"])
    .optional(),
  sizePercent: z.number().int().min(8).max(40).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = patchSchema.parse(await request.json());

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.position !== undefined) {
      sets.push(`position = $${++idx}`);
      values.push(body.position);
    }
    if (body.sizePercent !== undefined) {
      sets.push(`size_percent = $${++idx}`);
      values.push(body.sizePercent);
    }
    if (body.enabled !== undefined) {
      sets.push(`enabled = $${++idx}`);
      values.push(body.enabled);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "no_fields" }, { status: 400 });
    }

    const result = await getPool().query(
      `update user_logo_settings set ${sets.join(", ")} where user_id = $1 returning position, size_percent, enabled`,
      [userId, ...values],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "no_logo_uploaded" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      position: row.position,
      sizePercent: row.size_percent,
      enabled: row.enabled,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "invalid_request", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    console.error("[logo:patch]", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
