import assert from "node:assert/strict";
import test from "node:test";
import {
  getPosePresetsForJewelryType,
  getPoseTemplatePreview,
} from "../../../../packages/shared/src/generation-brief";

test("bracelet pose choices use visual-first buyer-facing template copy", () => {
  const braceletPresets = getPosePresetsForJewelryType("bracelet_bangle");

  assert.equal(braceletPresets[0]?.label, "Classic wrist");
  assert.ok(
    braceletPresets.every((preset) => preset.label !== "Full circular studio"),
  );
  assert.deepEqual(
    braceletPresets.map((preset) => getPoseTemplatePreview(preset.id)),
    [
      {
        scene: "wrist",
        title: "Classic wrist",
        subtitle: "Empty wrist pose",
        placement: "Your bracelet appears here",
      },
      {
        scene: "studio-round",
        title: "White studio",
        subtitle: "Clean bangle catalog",
        placement: "Your bangle stays circular",
      },
    ],
  );
});
