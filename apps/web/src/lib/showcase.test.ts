import assert from "node:assert/strict";
import test from "node:test";
import {
  buildShowcasePublicPath,
  buildShowcaseWhatsappShareText,
  buildShowcaseWhatsappInquiryUrl,
  DEFAULT_SHOWCASE_TITLE,
  formatShowcaseSummaryMeta,
  normalizeUpdateShowcaseInput,
  normalizeCreateShowcaseInput,
  shouldLoadShowcaseCandidates,
  toggleShowcaseGenerationSelection,
} from "./showcase";

const ids = [
  "486cef5b-89c3-4240-a156-cf2540571631",
  "f615b511-a9ff-4377-942b-7de06c5dc8f7",
] as const;

test("normalizeCreateShowcaseInput uses one-tap defaults and preserves selection order", () => {
  assert.deepEqual(
    normalizeCreateShowcaseInput({
      generationIds: [ids[0], ids[1], ids[0]],
    }),
    {
      title: DEFAULT_SHOWCASE_TITLE,
      generationIds: [ids[0], ids[1]],
    },
  );
});

test("normalizeCreateShowcaseInput rejects an empty showcase selection", () => {
  assert.throws(
    () => normalizeCreateShowcaseInput({ generationIds: [] }),
    /generationIds/,
  );
});

test("normalizeUpdateShowcaseInput trims required collection names", () => {
  assert.deepEqual(normalizeUpdateShowcaseInput({ title: "  Daily stock  " }), {
    title: "Daily stock",
  });
  assert.throws(() => normalizeUpdateShowcaseInput({ title: "" }), /title/);
});

test("buildShowcaseWhatsappInquiryUrl targets the jeweler phone with buyer context", () => {
  const url = buildShowcaseWhatsappInquiryUrl({
    phone: "+91 98765 43210",
    showcaseUrl: "https://ornava.test/showcase/abc",
    designNumber: 2,
  });

  assert.equal(
    url,
    "https://wa.me/919876543210?text=Hi!%20I%20am%20interested%20in%20this%20design%3A%0Ahttps%3A%2F%2Fornava.test%2Fshowcase%2Fabc%3Fd%3D2",
  );
});

test("buildShowcaseWhatsappInquiryUrl sends selected collection designs together", () => {
  const url = buildShowcaseWhatsappInquiryUrl({
    phone: "+91 98765 43210",
    showcaseUrl: "https://ornava.test/showcase/abc",
    designNumbers: [3, 1],
  });

  assert.equal(
    url,
    "https://wa.me/919876543210?text=Hi!%20I%20am%20interested%20in%20these%20designs%3A%0ADesign%201%3A%20https%3A%2F%2Fornava.test%2Fshowcase%2Fabc%3Fd%3D1%0ADesign%203%3A%20https%3A%2F%2Fornava.test%2Fshowcase%2Fabc%3Fd%3D3",
  );
});

test("buildShowcaseWhatsappShareText tells buyers what the collection link opens", () => {
  assert.equal(
    buildShowcaseWhatsappShareText("https://ornava.test/showcase/abc"),
    "New jewelry collection for you.\n\nView the selected designs: https://ornava.test/showcase/abc\n\nReply on WhatsApp to ask about any design.",
  );
});

test("buildShowcasePublicPath uses the short public collection route", () => {
  assert.equal(buildShowcasePublicPath("a1b2c3d4e5f6"), "/s/a1b2c3d4e5f6");
});

test("formatShowcaseSummaryMeta keeps collection cards compact", () => {
  assert.equal(
    formatShowcaseSummaryMeta({
      itemCount: 1,
      createdAt: "2026-05-29T10:30:00.000Z",
    }),
    "1 design · 29 May",
  );
  assert.equal(
    formatShowcaseSummaryMeta({
      itemCount: 12,
      createdAt: "2026-05-28T10:30:00.000Z",
    }),
    "12 designs · 28 May",
  );
});

test("shouldLoadShowcaseCandidates stops fetching after an empty history response loads", () => {
  assert.equal(
    shouldLoadShowcaseCandidates({
      open: true,
      loaded: true,
      loading: false,
    }),
    false,
  );
});

test("toggleShowcaseGenerationSelection adds and removes gallery selections", () => {
  assert.deepEqual(toggleShowcaseGenerationSelection([ids[0]], ids[1]), [
    ids[0],
    ids[1],
  ]);
  assert.deepEqual(toggleShowcaseGenerationSelection([ids[0], ids[1]], ids[0]), [
    ids[1],
  ]);
});
