import { describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/services/authService.js", () => ({
  registerWithEmail: vi.fn().mockResolvedValue(null),
  authenticateWithEmail: vi.fn(),
  findOrCreateOAuthUser: vi.fn()
}));

import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";

const env = loadEnv({
  NODE_ENV: "test",
  PORT: "4000",
  MONGODB_URI: "mongodb://localhost/test",
  APP_ORIGIN: "http://localhost:3000",
  SESSION_SECRET: "a-secure-test-secret-that-is-long-enough",
  OPENAI_API_KEY: "test-openai-key-that-is-long-enough",
  OPENAI_MODEL: "gpt-5.4-mini"
});

describe("duplicate registration response", () => {
  it("does not report a duplicate registration as successful", async () => {
    const agent = request.agent(createApp(env));
    const bootstrap = await agent.get("/");
    const csrfCookie = bootstrap.headers["set-cookie"].find((cookie) => cookie.startsWith("eh_csrf="));
    const csrfToken = csrfCookie.match(/^eh_csrf=([^;]+)/)[1];

    const response = await agent
      .post("/api/v1/auth/register")
      .set("x-csrf-token", csrfToken)
      .send({
        displayName: "Ива",
        email: "iva@example.com",
        password: "correct horse battery staple",
        passwordConfirmation: "correct horse battery staple"
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("REGISTRATION_NOT_COMPLETED");
    expect(response.body.data).toBeUndefined();
  });
});
