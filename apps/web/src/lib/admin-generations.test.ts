import assert from "node:assert/strict";
import test from "node:test";
import {
  formatAdminDuration,
  statusToneForGeneration,
} from "./admin-generations";

test("formatAdminDuration makes long provider runtimes scannable", () => {
  assert.equal(formatAdminDuration(172_853), "173s");
  assert.equal(formatAdminDuration(null), "n/a");
});

test("statusToneForGeneration maps generation status to admin severity", () => {
  assert.equal(statusToneForGeneration("completed"), "success");
  assert.equal(statusToneForGeneration("failed"), "danger");
  assert.equal(statusToneForGeneration("processing"), "active");
  assert.equal(statusToneForGeneration("queued"), "muted");
});
