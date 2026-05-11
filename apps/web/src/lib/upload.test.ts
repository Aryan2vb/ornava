import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUploadProxyPath,
  buildOriginalObjectKey,
  isBrowserUploadNetworkError,
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

test("buildUploadProxyPath targets the image-scoped server upload route", () => {
  assert.equal(
    buildUploadProxyPath("486cef5b-89c3-4240-a156-cf2540571631"),
    "/api/uploads/486cef5b-89c3-4240-a156-cf2540571631/proxy",
  );
});

test("isBrowserUploadNetworkError detects failed direct browser uploads", () => {
  assert.equal(isBrowserUploadNetworkError(new TypeError("Failed to fetch")), true);
  assert.equal(isBrowserUploadNetworkError(new TypeError("Load failed")), true);
  assert.equal(isBrowserUploadNetworkError(new Error("R2 upload failed.")), false);
});
