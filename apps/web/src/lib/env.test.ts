import assert from "node:assert/strict";
import test from "node:test";
import { getRequiredAuthSecret, parseWebEnv } from "./env";

test("parseWebEnv treats empty optional values as unset", () => {
  const env = parseWebEnv({
    GOOGLE_CLIENT_ID: "",
    DEV_AUTH_EMAIL: "",
    IMAGE_MODEL_DEFAULT: "",
  });

  assert.equal(env.GOOGLE_CLIENT_ID, undefined);
  assert.equal(env.DEV_AUTH_EMAIL, undefined);
  assert.equal(env.IMAGE_MODEL_DEFAULT, "ornava-default-v1");
});

test("getRequiredAuthSecret rejects missing production secrets", () => {
  assert.throws(
    () => getRequiredAuthSecret({ NODE_ENV: "production" }),
    /NEXTAUTH_SECRET or AUTH_SECRET is required in production/,
  );
});

test("getRequiredAuthSecret allows development fallback only outside production", () => {
  assert.equal(getRequiredAuthSecret({ NODE_ENV: "development" }), "ornava-dev-secret");
});
