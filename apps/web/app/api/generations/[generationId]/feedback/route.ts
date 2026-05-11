import type { SubmitFeedbackResponse } from "@ornava/shared";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  createGenerationFeedback,
  getCompletedGenerationResultForUser,
} from "@/lib/db";
import { logAnalyticsEventSafe } from "@/lib/events";
import { validateSubmitFeedbackRequest } from "@/lib/feedback";
import { getRequiredUserId } from "@/lib/session";

const paramsSchema = z.object({
  generationId: z.string().uuid(),
});

type RouteParams = {
  params: Promise<{
    generationId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const userId = await getRequiredUserId();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const parsedParams = paramsSchema.parse(await params);
    const feedbackRequest = validateSubmitFeedbackRequest(await request.json());
    const generation = await getCompletedGenerationResultForUser({
      userId,
      generationId: parsedParams.generationId,
    });

    if (!generation) {
      return NextResponse.json({ error: "result_not_found" }, { status: 404 });
    }

    const feedback = await createGenerationFeedback({
      userId,
      generationId: generation.id,
      rating: feedbackRequest.rating,
      reason: feedbackRequest.reason,
      freeText: feedbackRequest.freeText,
    });

    const response: SubmitFeedbackResponse = {
      feedbackId: feedback.id,
    };
    await logAnalyticsEventSafe({
      userId,
      name: "feedback_submitted",
      properties: {
        generationId: generation.id,
        imageId: generation.image_id,
        mode: generation.mode,
        rating: feedback.rating,
        reason: feedback.reason,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_feedback", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("[generations:feedback]", error);
    return NextResponse.json({ error: "feedback_submit_failed" }, { status: 500 });
  }
}
