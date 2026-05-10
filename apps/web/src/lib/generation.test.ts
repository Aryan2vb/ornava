import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERATION_QUEUE_NAME,
  buildGenerationJobId,
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
