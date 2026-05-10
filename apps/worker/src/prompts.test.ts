import assert from "node:assert/strict";
import test from "node:test";
import { buildGenerationPrompt, PROMPT_TEMPLATE_VERSION } from "./prompts";

test("buildGenerationPrompt creates a studio catalog prompt for jewelry", () => {
  const prompt = buildGenerationPrompt("studio");

  assert.equal(PROMPT_TEMPLATE_VERSION, "phase1-v1");
  assert.match(prompt, /studio catalog/i);
  assert.match(prompt, /jewelry/i);
  assert.match(prompt, /preserve/i);
});

test("buildGenerationPrompt creates a distinct close-up prompt", () => {
  const prompt = buildGenerationPrompt("close_up");

  assert.match(prompt, /close-up/i);
  assert.match(prompt, /stone/i);
  assert.doesNotMatch(prompt, /model wearing/i);
});
