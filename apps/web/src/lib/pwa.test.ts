import assert from "node:assert/strict";
import test from "node:test";
import { pwaManifest } from "./pwa";

test("pwaManifest exposes installable Ornava metadata", () => {
  assert.equal(pwaManifest.name, "Ornava");
  assert.equal(pwaManifest.short_name, "Ornava");
  assert.equal(pwaManifest.start_url, "/dashboard");
  assert.equal(pwaManifest.display, "standalone");
  assert.equal(pwaManifest.theme_color, "#1A1A1A");
  assert.ok(
    pwaManifest.icons?.some(
      (icon) => icon.src === "/icons/ornava.svg" && icon.purpose === "maskable",
    ),
  );
});
