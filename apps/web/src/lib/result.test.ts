import assert from "node:assert/strict";
import test from "node:test";
import type { GenerationResultRow } from "./result";
import {
  buildResultPagePath,
  toGenerationResultResponse,
} from "./result";

const completedRow: GenerationResultRow = {
  id: "486cef5b-89c3-4240-a156-cf2540571631",
  image_id: "d452ae9a-7377-42f3-a951-61a6f37231ad",
  mode: "on_model",
  status: "completed",
  model_route: "ornava-default-v1",
  provider: "fal",
  provider_model_id: "openai/gpt-image-2/edit",
  provider_job_id: "019e1259-be1e-7e61-8cf8-71c9029fdf80",
  generation_duration_ms: 172_853,
  original_object_key:
    "users/user-1/originals/image-1/kundan-ring.jpg",
  output_object_key:
    "users/user-1/generated/486cef5b-89c3-4240-a156-cf2540571631/output.jpg",
};

test("buildResultPagePath links directly to a generation result", () => {
  assert.equal(
    buildResultPagePath("486cef5b-89c3-4240-a156-cf2540571631"),
    "/result?generationId=486cef5b-89c3-4240-a156-cf2540571631",
  );
});

test("toGenerationResultResponse maps a completed generation to signed assets", () => {
  const response = toGenerationResultResponse(completedRow, {
    originalUrl: "https://r2.example.com/original",
    generatedUrl: "https://r2.example.com/generated",
    expiresAt: "2026-05-10T15:30:00.000Z",
  });

  assert.equal(response.generationId, completedRow.id);
  assert.equal(response.status, "completed");
  assert.equal(response.assets.original.url, "https://r2.example.com/original");
  assert.equal(response.assets.generated.url, "https://r2.example.com/generated");
  assert.equal(response.assets.generated.objectKey, completedRow.output_object_key);
  assert.equal(response.providerJobId, completedRow.provider_job_id);
});
