import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeRegistrationRole,
  shouldCreateProviderProfile,
} from "./auth-roles";

test("Google and OTP registration normalize only the provider role", () => {
  assert.equal(normalizeRegistrationRole("provider"), "provider");
  assert.equal(normalizeRegistrationRole("client"), "client");
  assert.equal(normalizeRegistrationRole(undefined), "client");
});

test("a new provider account gets a provider profile", () => {
  assert.equal(shouldCreateProviderProfile("provider"), true);
  assert.equal(shouldCreateProviderProfile("client"), false);
});