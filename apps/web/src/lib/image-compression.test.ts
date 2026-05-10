import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERATION_INPUT_POLICY,
  buildCompressedFileName,
  planGenerationInputCompression,
} from "./image-compression";

test("planGenerationInputCompression scales large landscape images to the beta max edge", () => {
  const plan = planGenerationInputCompression({
    fileName: "necklace.png",
    fileType: "image/png",
    fileSizeBytes: 8_000_000,
    width: 4000,
    height: 3000,
  });

  assert.equal(plan.shouldCompress, true);
  assert.equal(plan.targetWidth, 1600);
  assert.equal(plan.targetHeight, 1200);
  assert.equal(plan.outputType, "image/jpeg");
  assert.equal(plan.quality, GENERATION_INPUT_POLICY.jpegQuality);
});

test("planGenerationInputCompression scales large portrait images without changing aspect ratio", () => {
  const plan = planGenerationInputCompression({
    fileName: "model.jpg",
    fileType: "image/jpeg",
    fileSizeBytes: 5_000_000,
    width: 3000,
    height: 4500,
  });

  assert.equal(plan.shouldCompress, true);
  assert.equal(plan.targetWidth, 1067);
  assert.equal(plan.targetHeight, 1600);
});

test("planGenerationInputCompression keeps small jpeg dimensions when already beta-ready", () => {
  const plan = planGenerationInputCompression({
    fileName: "ring.jpg",
    fileType: "image/jpeg",
    fileSizeBytes: 900_000,
    width: 1200,
    height: 900,
  });

  assert.equal(plan.shouldCompress, false);
  assert.equal(plan.targetWidth, 1200);
  assert.equal(plan.targetHeight, 900);
});

test("planGenerationInputCompression recompresses png files even when dimensions are small", () => {
  const plan = planGenerationInputCompression({
    fileName: "ring.png",
    fileType: "image/png",
    fileSizeBytes: 900_000,
    width: 1200,
    height: 900,
  });

  assert.equal(plan.shouldCompress, true);
  assert.equal(plan.targetWidth, 1200);
  assert.equal(plan.targetHeight, 900);
});

test("buildCompressedFileName replaces the extension with jpg", () => {
  assert.equal(buildCompressedFileName("Heavy Bridal Set.PNG"), "Heavy Bridal Set.jpg");
  assert.equal(buildCompressedFileName("photo"), "photo.jpg");
});
