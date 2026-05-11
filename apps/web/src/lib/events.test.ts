import assert from "node:assert/strict";
import test from "node:test";
import { compactEventProperties } from "./events";

test("compactEventProperties removes undefined values but keeps explicit nulls", () => {
  assert.deepEqual(
    compactEventProperties({
      generationId: "generation-1",
      providerJobId: undefined,
      failureCode: null,
      durationMs: 1250,
    }),
    {
      generationId: "generation-1",
      failureCode: null,
      durationMs: 1250,
    },
  );
});
