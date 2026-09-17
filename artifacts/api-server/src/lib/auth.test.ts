import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, needsPasswordRehash, verifyPassword } from "./auth";

const legacyHash = "8f3f8e2b1c9d2c5a4b6d7e8f901234567890abcdef1234567890abcdef123456";

test("passwords are stored as salted scrypt hashes", () => {
  const hash = hashPassword("correct horse battery staple");
  assert.match(hash, /^scrypt\$16384\$8\$1\$/);
  assert.equal(verifyPassword("correct horse battery staple", hash), true);
  assert.equal(verifyPassword("wrong password", hash), false);
  assert.equal(needsPasswordRehash(hash), false);
});

test("short passwords are rejected", () => {
  assert.throws(() => hashPassword("short"), /at least 8/);
});

test("legacy hashes are marked for upgrade", () => {
  assert.equal(needsPasswordRehash(legacyHash), true);
});
