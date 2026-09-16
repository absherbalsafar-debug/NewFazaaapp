import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGoogleAuthPayload,
  getPostAuthPath,
  getRegistrationRole,
} from "./registration";

test("phone registration keeps both selected roles and destination paths", () => {
  assert.equal(getRegistrationRole("?role=client"), "client");
  assert.equal(getPostAuthPath("client"), "/");

  assert.equal(getRegistrationRole("?role=provider"), "provider");
  assert.equal(getPostAuthPath("provider"), "/provider-dashboard");
});

test("email registration reads the role from the welcome link", () => {
  assert.equal(getRegistrationRole("?role=provider&source=welcome"), "provider");
  assert.equal(getRegistrationRole("?role=unknown"), "client");
});

test("Google registration sends the selected provider role", () => {
  assert.deepEqual(
    buildGoogleAuthPayload(
      {
        sub: "google-user-1",
        email: "provider@example.com",
        name: "Provider",
        picture: "https://example.com/avatar.png",
      },
      "provider",
    ),
    {
      googleId: "google-user-1",
      email: "provider@example.com",
      name: "Provider",
      avatarUrl: "https://example.com/avatar.png",
      role: "provider",
    },
  );
});