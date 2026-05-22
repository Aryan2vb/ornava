import assert from "node:assert/strict";
import test from "node:test";
import {
  buildShowcasePublicPath,
  buildShowcaseWhatsappShareText,
  buildShowcaseWhatsappInquiryUrl,
  DEFAULT_SHOWCASE_TITLE,
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

test("buildShowcaseWhatsappInquiryUrl targets the jeweler phone with buyer context", () => {
  const url = buildShowcaseWhatsappInquiryUrl({
    phone: "+91 98765 43210",
    showcaseUrl: "https://ornava.test/showcase/abc",
    imageUrl: "https://images.test/item.jpg",
  });

  assert.equal(
    url,
    "https://wa.me/919876543210?text=Hi!%20I%20am%20interested%20in%20this%20design%20from%20your%20showcase%3A%20https%3A%2F%2Fimages.test%2Fitem.jpg%0A%0AShowcase%3A%20https%3A%2F%2Fornava.test%2Fshowcase%2Fabc",
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
