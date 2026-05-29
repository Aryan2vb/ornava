import type { PublicShowcaseResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicShowcase } from "@/lib/db";
import { env } from "@/lib/env";
import { createObjectReadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.union([z.string().uuid(), z.string().regex(/^[a-f0-9]{12}$/)]),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_showcase" }, { status: 400 });
  }

  try {
    const publicShowcase = await getPublicShowcase(parsedParams.data.id);

    if (!publicShowcase || publicShowcase.items.length === 0) {
      return NextResponse.json({ error: "showcase_not_found" }, { status: 404 });
    }

    const [signedItems, signedLogo] = await Promise.all([
      Promise.all(
        publicShowcase.items.map((item) =>
          createObjectReadUrl({
            bucket: env.R2_GENERATED_BUCKET,
            objectKey: item.output_object_key,
          }),
        ),
      ),
      publicShowcase.showcase.logo_object_key
        ? createObjectReadUrl({
            bucket: env.R2_ORIGINALS_BUCKET,
            objectKey: publicShowcase.showcase.logo_object_key,
          })
        : Promise.resolve(null),
    ]);

    const response: PublicShowcaseResponse = {
      showcaseId: publicShowcase.showcase.id,
      title: publicShowcase.showcase.title,
      jeweler: {
        name: publicShowcase.showcase.jeweler_name ?? undefined,
        phone: publicShowcase.showcase.jeweler_phone ?? undefined,
        logo: signedLogo
          ? {
              url: signedLogo.url,
              expiresAt: signedLogo.expiresAt,
              position:
                publicShowcase.showcase.logo_position ?? "bottom-right",
              sizePercent:
                publicShowcase.showcase.logo_size_percent ?? 12,
            }
          : undefined,
      },
      items: publicShowcase.items.map((item, index) => ({
        generationId: item.generation_id,
        mode: item.mode,
        jewelryType: item.generation_brief.jewelryType,
        overlayText: item.overlay_text,
        image: {
          url: signedItems[index].url,
          expiresAt: signedItems[index].expiresAt,
        },
      })),
    };

    return NextResponse.json(response, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[showcases:public]", error);
    return NextResponse.json({ error: "showcase_load_failed" }, { status: 500 });
  }
}
