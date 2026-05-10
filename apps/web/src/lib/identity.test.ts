import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEmail } from "./identity";

test("normalizeEmail lowercases and trims email identity", () => {
  assert.equal(normalizeEmail("  Aryan@Example.COM "), "aryan@example.com");
});

test("normalizeEmail returns null for blank or missing values", () => {
  assert.equal(normalizeEmail(""), null);
  assert.equal(normalizeEmail("   "), null);
  assert.equal(normalizeEmail(null), null);
  assert.equal(normalizeEmail(undefined), null);
});
