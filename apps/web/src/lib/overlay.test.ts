import assert from "node:assert/strict";
import test from "node:test";
import { overlayTextLabel, parseOverlayText } from "./overlay";

test("parseOverlayText accepts jewelry purity and weight metadata", () => {
  const overlay = parseOverlayText({
    purity: "22K",
    weightGm: "4.25",
  });

  assert.equal(overlay.purity, "22K");
  assert.equal(overlay.weightGm, "4.25");
  assert.equal(overlay.position, "bottom-left");
  assert.equal(overlay.size, "medium");
});

test("parseOverlayText rejects malformed weight", () => {
  assert.throws(
    () => parseOverlayText({ purity: "22K", weightGm: "4.253" }),
    /Enter weight like 4.2/,
  );
});

test("overlayTextLabel formats compact batch card metadata", () => {
  assert.equal(overlayTextLabel({ purity: "18K", weightGm: "7.5" }), "18K · 7.5gm");
});
