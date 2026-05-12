import { NextResponse } from "next/server";
import { z } from "zod";
import { getCompletedGenerationResultForUser } from "@/lib/db";
import { env } from "@/lib/env";
import { createObjectReadUrl } from "@/lib/storage";
import { getRequiredUserId } from "@/lib/session";

// Runs on Node runtime — needs fetch() to R2 (Edge would work too but keep consistent)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  generationId: z.string().uuid(),
});

type RouteParams = {
  params: Promise<{
    generationId: string;
  }>;
};

/**
 * Same-origin download proxy for generated images.
 *
 * Why: Direct R2 signed URLs are cross-origin from our app domain. Browser
 * fetch() to them gets blocked by CORS unless R2 is configured to allow our
 * origin (which requires bucket-level CORS config). Proxying through our
 * own API makes the URL same-origin, which:
 *   1. Lets the Web Share API attach the file directly to WhatsApp
 *   2. Gives us a clean filename via Content-Disposition
 *   3. Keeps R2 credentials out of the browser
 */
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

  // Get a short-lived signed URL from R2 and fetch the bytes server-side
  const signed = await createObjectReadUrl({
    bucket: env.R2_GENERATED_BUCKET,
    objectKey: generation.output_object_key,
  });

  const r2Response = await fetch(signed.url);

  if (!r2Response.ok) {
    return NextResponse.json(
      { error: "r2_read_failed", status: r2Response.status },
      { status: 502 },
    );
  }

  // Stream the bytes back to the client with a friendly filename
  const fileName = `ornava-${generation.mode}-${generation.id.slice(0, 8)}.jpg`;

  return new NextResponse(r2Response.body, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
