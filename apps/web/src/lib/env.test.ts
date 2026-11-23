import assert from "node:assert/strict";
import test from "node:test";
import { parseWebEnv } from "./env";

test("parseWebEnv treats empty optional values as unset", () => {
  const env = parseWebEnv({
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    IMAGE_MODEL_DEFAULT: "",
  });

  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, undefined);
  assert.equal(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, undefined);
  assert.equal(env.IMAGE_MODEL_DEFAULT, "ornava-default-v1");
  assert.equal(env.R2_GENERATED_BUCKET, "ornava-generated");
});
