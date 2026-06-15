import assert from "node:assert/strict";
import test from "node:test";
import {
  buildShopLogoObjectKey,
  isSupportedShopLogoType,
  validateShopLogoUploadRequest,
} from "./shop-logo";

test("shop logos accept PNG, JPEG, and WebP images", () => {
  for (const fileType of ["image/png", "image/jpeg", "image/webp"]) {
    assert.equal(isSupportedShopLogoType(fileType), true);
    assert.equal(
      validateShopLogoUploadRequest({
        fileType,
        fileSizeBytes: 500_000,
        width: 800,
        height: 400,
      }).fileType,
      fileType,
    );
  }

  assert.equal(isSupportedShopLogoType("image/svg+xml"), false);
});

test("shop logos accept files larger than 2MB up to the 10MB limit", () => {
  assert.doesNotThrow(() =>
    validateShopLogoUploadRequest({
      fileType: "image/jpeg",
      fileSizeBytes: 5 * 1024 * 1024,
      width: 1200,
      height: 800,
    }),
  );

  assert.throws(() =>
    validateShopLogoUploadRequest({
      fileType: "image/jpeg",
      fileSizeBytes: 10 * 1024 * 1024 + 1,
      width: 1200,
      height: 800,
    }),
  );
});

test("buildShopLogoObjectKey uses the uploaded image format", () => {
  assert.equal(
    buildShopLogoObjectKey("user-1", "image/png"),
    "users/user-1/branding/logo.png",
  );
  assert.equal(
    buildShopLogoObjectKey("user-1", "image/jpeg"),
    "users/user-1/branding/logo.jpg",
  );
  assert.equal(
    buildShopLogoObjectKey("user-1", "image/webp"),
    "users/user-1/branding/logo.webp",
  );
});
