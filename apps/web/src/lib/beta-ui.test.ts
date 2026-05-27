import assert from "node:assert/strict";
import test from "node:test";
import {
  betaNavItems,
  generationModeCards,
  getGenerationProgressPercent,
  getUploadStepProgress,
} from "./beta-ui";

test("generationModeCards exposes buyer-facing mode copy", () => {
  assert.equal(generationModeCards.on_model.title, "On model");
  assert.match(generationModeCards.on_model.description, /scale and styling/);
  assert.equal(generationModeCards.studio.title, "Studio catalog");
  assert.equal(generationModeCards.close_up.title, "Close-up detail");
});

test("betaNavItems matches the phase 1 mobile shell", () => {
  assert.deepEqual(
    betaNavItems.map((item) => item.label),
    ["Home", "Create", "Gallery", "Profile"],
  );
});

test("getUploadStepProgress moves through real upload work", () => {
  assert.equal(getUploadStepProgress("reading"), 12);
  assert.equal(getUploadStepProgress("uploading"), 82);
  assert.equal(getUploadStepProgress("uploaded"), 100);
});

test("getGenerationProgressPercent advances without fake fixed values", () => {
  assert.equal(getGenerationProgressPercent("queued", 0), 10);
  assert.equal(getGenerationProgressPercent("processing", 120), 89);
  assert.equal(getGenerationProgressPercent("completed", 0), 100);
});
