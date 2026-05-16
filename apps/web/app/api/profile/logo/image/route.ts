import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { env } from "@/lib/env";
import { getRequiredUserId } from "@/lib/session";
import { createObjectReadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await getPool().query<{ logo_object_key: string }>(
    `select logo_object_key from user_logo_settings where user_id = $1`,
    [userId],
  );

  const row = result.rows[0];
  if (!row) {
    return NextResponse.json({ error: "logo_not_found" }, { status: 404 });
  }

  const signed = await createObjectReadUrl({
    bucket: env.R2_ORIGINALS_BUCKET,
    objectKey: row.logo_object_key,
  });
  const r2Response = await fetch(signed.url);

  if (!r2Response.ok) {
    return NextResponse.json({ error: "r2_read_failed" }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(await r2Response.arrayBuffer()), {
    status: 200,
    headers: {
      "Content-Type": r2Response.headers.get("content-type") ?? "image/png",
      "Cache-Control": "private, max-age=900",
      "Content-Disposition": "inline",
    },
  });
}
