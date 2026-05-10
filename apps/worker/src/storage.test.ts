import assert from "node:assert/strict";
import test from "node:test";
import { buildGeneratedObjectKey, contentTypeForOutputFormat } from "./storage";

test("buildGeneratedObjectKey stores outputs under the user and generation", () => {
  assert.equal(
    buildGeneratedObjectKey({
      userId: "838c59eb-bdb9-4263-84a8-8196341c25bd",
      generationId: "f24dc312-5e49-494c-b07b-ccdb1766adef",
      format: "jpeg",
    }),
    "users/838c59eb-bdb9-4263-84a8-8196341c25bd/generated/f24dc312-5e49-494c-b07b-ccdb1766adef/output.jpg",
  );
});

test("contentTypeForOutputFormat maps worker output formats to upload types", () => {
  assert.equal(contentTypeForOutputFormat("jpeg"), "image/jpeg");
  assert.equal(contentTypeForOutputFormat("png"), "image/png");
  assert.equal(contentTypeForOutputFormat("webp"), "image/webp");
});
