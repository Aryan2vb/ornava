import assert from "node:assert/strict";
import test from "node:test";
import { JEWELRY_TYPES } from "@ornava/shared";
import {
  getPosePresetsForJewelryType,
  getPoseTemplatePreview,
} from "../../../../packages/shared/src/generation-brief";

test("bracelet and bangle are separate jewelry type choices", () => {
  assert.ok(JEWELRY_TYPES.includes("bracelet"));
  assert.ok(JEWELRY_TYPES.includes("bangle"));
  assert.ok(!JEWELRY_TYPES.includes("bracelet_bangle" as never));
});

test("bracelet pose choices preserve flexible wrist jewelry", () => {
  const braceletPresets = getPosePresetsForJewelryType("bracelet");

  assert.equal(braceletPresets[0]?.label, "Classic wrist");
  assert.ok(braceletPresets.length > 0);
  assert.ok(braceletPresets.every((preset) => preset.jewelryTypes.includes("bracelet")));
  assert.ok(
    braceletPresets.every((preset) => !/bangle|kada/i.test(preset.promptFragment)),
  );
});

test("bangle pose choices preserve rigid circular jewelry", () => {
  const banglePresets = getPosePresetsForJewelryType("bangle");

  assert.equal(banglePresets[0]?.id, "bangle_straight_wrist");
  assert.ok(banglePresets.length > 0);
  assert.ok(banglePresets.every((preset) => preset.jewelryTypes.includes("bangle")));
  assert.ok(
    banglePresets.some((preset) => /bangle|kada|closed circular/i.test(preset.promptFragment)),
  );
  assert.deepEqual(
    getPoseTemplatePreview("bangle_studio_circular"),
    {
      scene: "studio-round",
      title: "Studio flat",
      subtitle: "Clean bangle catalog",
      placement: "Your bangle stays circular",
    },
  );
});
