import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { normalizeLogoBufferForCompositing } from "./logo";

test("normalizeLogoBufferForCompositing trims transparent padding around logos", async () => {
  const paddedLogo = await sharp({
    create: {
      width: 120,
      height: 120,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: 40,
            height: 30,
            channels: 4,
            background: { r: 184, g: 134, b: 11, alpha: 1 },
          },
        })
          .png()
          .toBuffer(),
        left: 40,
        top: 45,
      },
    ])
    .png()
    .toBuffer();

  const normalized = await normalizeLogoBufferForCompositing(paddedLogo);
  const metadata = await sharp(normalized).metadata();

  assert.equal(metadata.width, 40);
  assert.equal(metadata.height, 30);
});
