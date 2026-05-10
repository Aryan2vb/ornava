import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERATION_QUEUE_NAME,
  buildGeneratingPagePath,
  buildGenerationJobId,
  validateRetryGenerationRequest,
  validateCreateGenerationRequest,
} from "./generation";

test("validateCreateGenerationRequest accepts a valid generation request", () => {
  const request = validateCreateGenerationRequest({
    imageId: "f24dc312-5e49-494c-b07b-ccdb1766adef",
    mode: "studio",
    clientRequestId: "upload-flow-1",
  });

  assert.equal(request.mode, "studio");
});

test("validateCreateGenerationRequest rejects unsupported modes", () => {
  assert.throws(
    () =>
      validateCreateGenerationRequest({
        imageId: "f24dc312-5e49-494c-b07b-ccdb1766adef",
        mode: "portrait",
        clientRequestId: "upload-flow-1",
      }),
    /Invalid enum value/,
  );
});

test("buildGenerationJobId uses the generation id for idempotent queueing", () => {
  assert.equal(
    buildGenerationJobId("43ea4b81-25ad-4a19-8c6d-037a41758b58"),
    "generation-43ea4b81-25ad-4a19-8c6d-037a41758b58",
  );
  assert.equal(GENERATION_QUEUE_NAME, "ornava-generation");
});

test("validateRetryGenerationRequest accepts client request ids for retry idempotency", () => {
  const request = validateRetryGenerationRequest({
    clientRequestId: "retry-486cef5b",
  });

  assert.equal(request.clientRequestId, "retry-486cef5b");
});

test("buildGeneratingPagePath links retry jobs to the polling screen", () => {
  assert.equal(
    buildGeneratingPagePath({
      imageId: "d452ae9a-7377-42f3-a951-61a6f37231ad",
      generationId: "486cef5b-89c3-4240-a156-cf2540571631",
    }),
    "/generating?imageId=d452ae9a-7377-42f3-a951-61a6f37231ad&generationId=486cef5b-89c3-4240-a156-cf2540571631",
  );
});
