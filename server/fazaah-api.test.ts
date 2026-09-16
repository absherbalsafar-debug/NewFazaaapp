import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { registerFazaahApi } from "./fazaah-api";

const servers: Array<ReturnType<express.Application["listen"]>> = [];

async function createTestBaseUrl() {
  const app = express();
  app.use(express.json());
  registerFazaahApi(app);
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))));
});

describe("Fazaah OTP authentication", () => {
  it("returns a development OTP and completes first-time registration", async () => {
    const baseUrl = await createTestBaseUrl();
    const send = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "777999101" }),
    });
    expect(send.status).toBe(200);
    const sendBody = await send.json() as { otp?: string };
    expect(sendBody.otp).toMatch(/^\d{6}$/);

    const firstVerify = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "777999101", code: sendBody.otp }),
    });
    expect(firstVerify.status).toBe(200);
    await expect(firstVerify.json()).resolves.toEqual({ needsRegistration: true, phone: "777999101" });

    const complete = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "777999101", code: sendBody.otp, name: "مستخدم اختبار", role: "client" }),
    });
    expect(complete.status).toBe(200);
    const completeBody = await complete.json() as { token: string; user: { phone: string; name: string } };
    expect(completeBody.token).toEqual(expect.any(String));
    expect(completeBody.user).toMatchObject({ phone: "777999101", name: "مستخدم اختبار" });

    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { authorization: `Bearer ${completeBody.token}` } });
    expect(me.status).toBe(200);
    await expect(me.json()).resolves.toMatchObject({ phone: "777999101", name: "مستخدم اختبار" });
  });
});


describe("Fazaah OTP display flag", () => {
  it("returns OTP when FAZAAH_SHOW_DEV_OTP is enabled even in production mode", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousFlag = process.env.FAZAAH_SHOW_DEV_OTP;
    process.env.NODE_ENV = "production";
    process.env.FAZAAH_SHOW_DEV_OTP = "true";
    try {
      const baseUrl = await createTestBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: "777999202" }),
      });
      expect(response.status).toBe(200);
      const body = await response.json() as { otp?: string };
      expect(body.otp).toMatch(/^\d{6}$/);
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      if (previousFlag === undefined) delete process.env.FAZAAH_SHOW_DEV_OTP;
      else process.env.FAZAAH_SHOW_DEV_OTP = previousFlag;
    }
  });
});
