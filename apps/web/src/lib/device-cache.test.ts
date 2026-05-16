import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDeviceCacheUrl,
  isDeviceCacheEntryFresh,
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

test("isDeviceCacheEntryFresh respects max age and missing timestamps", () => {
  assert.equal(isDeviceCacheEntryFresh(null, 10_000, 20_000), false);
  assert.equal(isDeviceCacheEntryFresh("not-a-number", 10_000, 20_000), false);
  assert.equal(isDeviceCacheEntryFresh("12000", 10_000, 20_000), true);
  assert.equal(isDeviceCacheEntryFresh("1000", 30_000, 20_000), false);
});
