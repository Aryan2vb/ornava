import assert from "node:assert/strict";
import test from "node:test";
import {
  feedbackReasonLabels,
  validateSubmitFeedbackRequest,
} from "./feedback";

test("validateSubmitFeedbackRequest allows usable feedback without a reason", () => {
  const request = validateSubmitFeedbackRequest({
    rating: "usable",
  });

  assert.equal(request.rating, "usable");
  assert.equal(request.reason, undefined);
});

test("validateSubmitFeedbackRequest requires a reason for not usable feedback", () => {
  assert.throws(
    () =>
      validateSubmitFeedbackRequest({
        rating: "not_usable",
      }),
    /reason/i,
  );
});

test("feedbackReasonLabels covers beta failure reasons", () => {
  assert.equal(feedbackReasonLabels.design_changed, "Design changed");
  assert.equal(feedbackReasonLabels.stone_or_detail_changed, "Stone or detail changed");
  assert.equal(feedbackReasonLabels.other, "Other");
});
