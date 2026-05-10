import assert from "node:assert/strict";
import test from "node:test";
import {
  downloadGeneratedImage,
  extractFalImageResult,
} from "./fal-image-edit";

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
