import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDeviceCacheFetchUrl,
  buildDeviceCacheUrl,
  isDeviceCacheEntryFresh,
  isDeviceCacheRequestForSource,
} from "./device-cache";

test("buildDeviceCacheUrl normalizes stable app URLs and cache versions", () => {
  assert.equal(
    buildDeviceCacheUrl("/api/generations/abc/preview", "v1", "https://ornava.test"),
    "https://ornava.test/api/generations/abc/preview?cacheVersion=v1",
  );

  assert.equal(
    buildDeviceCacheUrl("/api/profile/logo/image?size=small", "shop-logo", "https://ornava.test"),
    "https://ornava.test/api/profile/logo/image?size=small&cacheVersion=shop-logo",
  );
});

test("buildDeviceCacheFetchUrl busts same-origin browser cache but leaves signed external URLs untouched", () => {
  assert.equal(
    buildDeviceCacheFetchUrl("/api/profile/logo/image", "logo-v2", "https://ornava.test"),
    "https://ornava.test/api/profile/logo/image?cacheVersion=logo-v2",
  );

  assert.equal(
    buildDeviceCacheFetchUrl(
      "https://ornava-originals.r2.cloudflarestorage.com/logo.png?X-Amz-Signature=abc",
      "logo-v2",
      "https://ornava.test",
    ),
    "https://ornava-originals.r2.cloudflarestorage.com/logo.png?X-Amz-Signature=abc",
  );
});

test("isDeviceCacheEntryFresh respects max age and missing timestamps", () => {
  assert.equal(isDeviceCacheEntryFresh(null, 10_000, 20_000), false);
  assert.equal(isDeviceCacheEntryFresh("not-a-number", 10_000, 20_000), false);
  assert.equal(isDeviceCacheEntryFresh("12000", 10_000, 20_000), true);
  assert.equal(isDeviceCacheEntryFresh("1000", 30_000, 20_000), false);
});

test("isDeviceCacheRequestForSource matches all versioned entries for a source URL", () => {
  assert.equal(
    isDeviceCacheRequestForSource(
      "https://ornava.test/api/profile/logo/image?cacheVersion=old",
      "/api/profile/logo/image",
      "https://ornava.test",
    ),
    true,
  );

  assert.equal(
    isDeviceCacheRequestForSource(
      "https://ornava.test/api/generations/123/preview?cacheVersion=old",
      "/api/profile/logo/image",
      "https://ornava.test",
    ),
    false,
  );
});
