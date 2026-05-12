import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { env } from "@/lib/env";
import { createObjectReadUrl } from "@/lib/storage";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getPool();
  const result = await pool.query<{
    id: string;
    original_object_key: string;
    output_object_key: string | null;
    mode: string;
    status: string;
    user_email: string | null;
    created_at: string;
  }>(`
    select
      g.id,
      i.original_object_key,
      g.output_object_key,
      g.mode::text,
      g.status::text,
      u.email as user_email,
      g.created_at::text
    from generations g
    join images i on i.id = g.image_id
    join app_users u on u.id = g.user_id
    where g.status = 'completed' and g.output_object_key is not null
    order by g.created_at desc
    limit 20
  `);

  const items = await Promise.all(
    result.rows.map(async (row) => {
      const [original, generated] = await Promise.all([
        createObjectReadUrl({ bucket: env.R2_ORIGINALS_BUCKET, objectKey: row.original_object_key }),
        row.output_object_key
          ? createObjectReadUrl({ bucket: env.R2_GENERATED_BUCKET, objectKey: row.output_object_key })
          : null,
      ]);
      return {
        id: row.id,
        mode: row.mode,
        status: row.status,
        userEmail: row.user_email,
        createdAt: row.created_at,
        originalUrl: original.url,
        generatedUrl: generated?.url ?? null,
      };
    }),
  );

  return NextResponse.json({ items });
}
