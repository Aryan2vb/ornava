import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFalEditInput,
  downloadGeneratedImage,
  extractFalImageResult,
  falImageSizeForMode,
  falQualityForOutputQuality,
} from "./fal-image-edit";

test("buildFalEditInput keeps jpeg as fal's documented output format enum", () => {
  const input = buildFalEditInput({
    mode: "studio",
    prompt: "Create a catalog image",
    inputImageUrl: "https://fal.media/input.jpg",
    outputFormat: "jpeg",
    outputQuality: "standard",
  });

  assert.equal(input.output_format, "jpeg");
});

test("buildFalEditInput uses beta speed defaults", () => {
  const input = buildFalEditInput({
    mode: "studio",
    prompt: "Create a catalog image",
    inputImageUrl: "https://fal.media/input.jpg",
    outputFormat: "jpeg",
    outputQuality: "standard",
  });

  assert.equal(input.image_size, "square_hd");
  assert.equal(input.quality, "medium");
});

test("falImageSizeForMode maps modes to WhatsApp-ready presets", () => {
  assert.equal(falImageSizeForMode("studio"), "square_hd");
  assert.equal(falImageSizeForMode("close_up"), "square_hd");
  assert.equal(falImageSizeForMode("on_model"), "portrait_4_3");
});

test("falQualityForOutputQuality maps internal quality to fal quality", () => {
  assert.equal(falQualityForOutputQuality("draft"), "low");
  assert.equal(falQualityForOutputQuality("standard"), "medium");
  assert.equal(falQualityForOutputQuality("high"), "high");
});

test("extractFalImageResult reads the first image from fal image arrays", () => {
  const result = extractFalImageResult({
    images: [
      {
        url: "https://cdn.example.com/result.png",
        width: 1024,
        height: 1024,
      },
    ],
  });

  assert.deepEqual(result, {
    url: "https://cdn.example.com/result.png",
    width: 1024,
    height: 1024,
  });
});

test("extractFalImageResult fails clearly when no URL is present", () => {
  assert.throws(
    () => extractFalImageResult({ images: [{}] }),
    /did not include an output image URL/,
  );
});

test("downloadGeneratedImage rejects failed downloads", async () => {
  const fetcher: typeof fetch = async () =>
    new Response("missing", { status: 404, statusText: "Not Found" });

  await assert.rejects(
    () => downloadGeneratedImage("https://cdn.example.com/missing.png", fetcher),
    /Failed to download generated image/,
  );
});
