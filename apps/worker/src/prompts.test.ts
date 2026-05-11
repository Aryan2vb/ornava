import assert from "node:assert/strict";
import test from "node:test";
import { getDefaultGenerationBrief } from "@ornava/shared";
import { buildGenerationPrompt, PROMPT_TEMPLATE_VERSION } from "./prompts";

test("buildGenerationPrompt creates a studio catalog prompt for jewelry", () => {
  const prompt = buildGenerationPrompt("studio", {
    jewelryType: "ring",
    generationMode: "studio",
    modelPresetId: "studio_none",
    posePresetId: "ring_standing_studio",
    backgroundPresetId: "warm_ivory",
    aspectRatio: "1:1",
    promptTemplateVersion: "guided-v2",
  });

  assert.equal(PROMPT_TEMPLATE_VERSION, "guided-v2");
  assert.match(prompt, /studio catalog/i);
  assert.match(prompt, /ring/i);
  assert.match(prompt, /warm ivory/i);
  assert.match(prompt, /1:1/i);
  assert.match(prompt, /jewelry/i);
  assert.match(prompt, /preserve/i);
});

test("buildGenerationPrompt creates a distinct close-up prompt", () => {
  const prompt = buildGenerationPrompt("close_up", {
    jewelryType: "pendant",
    generationMode: "close_up",
    modelPresetId: "studio_none",
    posePresetId: "pendant_macro",
    backgroundPresetId: "marble",
    aspectRatio: "3:4",
    promptTemplateVersion: "guided-v2",
  });

  assert.match(prompt, /close-up/i);
  assert.match(prompt, /pendant/i);
  assert.match(prompt, /marble/i);
  assert.match(prompt, /stone/i);
  assert.doesNotMatch(prompt, /model wearing/i);
});

test("buildGenerationPrompt includes zero-typing pose selections", () => {
  const prompt = buildGenerationPrompt("on_model", {
    jewelryType: "necklace",
    generationMode: "on_model",
    modelPresetId: "model_neck",
    posePresetId: "necklace_traditional_saree",
    backgroundPresetId: "deep_red_luxury",
    aspectRatio: "4:5",
    promptTemplateVersion: "guided-v2",
  });

  assert.match(prompt, /necklace/i);
  assert.match(prompt, /traditional blouse or saree/i);
  assert.match(prompt, /deep red luxury/i);
  assert.match(prompt, /4:5/i);
});

test("bracelet and bangle defaults protect rigid circular product identity", () => {
  const brief = getDefaultGenerationBrief("bracelet_bangle");
  const prompt = buildGenerationPrompt(brief.generationMode, brief);

  assert.equal(brief.posePresetId, "bracelet_studio_circular");
  assert.equal(brief.generationMode, "studio");
  assert.match(prompt, /closed circular bangle/i);
  assert.match(prompt, /do not convert it to an open cuff/i);
  assert.match(prompt, /centerpiece/i);
});
