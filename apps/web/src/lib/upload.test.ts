import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOriginalObjectKey,
  validateUploadInitRequest,
} from "./upload";

test("validateUploadInitRequest accepts supported image metadata", () => {
  const request = validateUploadInitRequest({
    fileName: "Ring.JPG",
    fileType: "image/jpeg",
    fileSizeBytes: 2_500_000,
    width: 1200,
    height: 1600,
  });

  assert.equal(request.fileType, "image/jpeg");
  assert.equal(request.fileSizeBytes, 2_500_000);
});

test("validateUploadInitRequest rejects files over 20MB", () => {
  assert.throws(
    () =>
      validateUploadInitRequest({
        fileName: "large.jpg",
        fileType: "image/jpeg",
        fileSizeBytes: 20_000_001,
      }),
    /File must be 20MB or smaller/,
  );
});

test("buildOriginalObjectKey scopes uploads by user and image id", () => {
  assert.equal(
    buildOriginalObjectKey({
      userId: "user-1",
      imageId: "image-1",
      fileName: "Kundan Ring.JPG",
      fileType: "image/jpeg",
    }),
    "users/user-1/originals/image-1/kundan-ring.jpg",
  );
});
