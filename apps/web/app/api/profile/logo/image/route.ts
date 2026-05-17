import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { fetchLogoBuffer } from "@/lib/logo";
import { getRequiredUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await getPool().query<{ logo_object_key: string; updated_at: string }>(
    `select logo_object_key, updated_at::text from user_logo_settings where user_id = $1`,
    [userId],
  );

  const row = result.rows[0];
  if (!row) {
    return NextResponse.json({ error: "logo_not_found" }, { status: 404 });
  }

  const logoBuffer = await fetchLogoBuffer(row.logo_object_key, row.updated_at);

  return new NextResponse(new Uint8Array(logoBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
    },
  });
}
