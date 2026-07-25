import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { loginSchema, registerSchema } from "../src/validation/authSchemas.js";

const env = loadEnv({
  NODE_ENV: "test", PORT: "4000", MONGODB_URI: "mongodb://localhost/test",
  APP_ORIGIN: "http://localhost:5173", SESSION_SECRET: "a-secure-test-secret-that-is-long-enough"
  , OPENAI_API_KEY: "test-openai-key-that-is-long-enough", OPENAI_MODEL: "gpt-5.4-mini"
});

describe("registration boundaries", () => {
  it("rejects weak and malformed registration data", () => {
    expect(registerSchema.safeParse({ displayName: "А", email: "not-email", password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ displayName: "Ива", email: "iva@example.com", password: "correct horse battery staple", admin: true }).success).toBe(false);
  });

  it("requires matching passwords during registration", () => {
    const valid = { displayName: "Ива", email: "iva@example.com", password: "correct horse battery staple" };
    expect(registerSchema.safeParse({ ...valid, passwordConfirmation: valid.password }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, passwordConfirmation: "a different secure passphrase" }).success).toBe(false);
  });

  it("accepts only bounded login credentials and rejects extra privilege fields", () => {
    expect(loginSchema.safeParse({ email: "iva@example.com", password: "a password", admin: true }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "not-email", password: "a password" }).success).toBe(false);
  });

  it("rejects state changes without a CSRF token", async () => {
    const response = await request(createApp(env)).post("/api/v1/auth/register").send({
      displayName: "Ива", email: "iva@example.com", password: "correct horse battery staple"
    });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_INVALID");
  });

  it("protects login with CSRF", async () => {
    const response = await request(createApp(env)).post("/api/v1/auth/login").send({ email: "iva@example.com", password: "a password" });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_INVALID");
  });

  it("does not expose framework identity", async () => {
    const response = await request(createApp(env)).get("/missing");
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("reports API readiness at the service root", async () => {
    const response = await request(createApp(env)).get("/");
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ service: "FitFridge API", status: "ok" });
  });

  it("allows the production CSRF cookie on the separately hosted frontend", async () => {
    const productionEnv = { ...env, NODE_ENV: "production" };
    const response = await request(createApp(productionEnv)).get("/");
    const csrfCookie = response.headers["set-cookie"]?.find((cookie) => cookie.startsWith("eh_csrf="));
    expect(csrfCookie).toContain("Secure");
    expect(csrfCookie).toContain("SameSite=None");
  });

  it("keeps unknown API routes as JSON in production", async () => {
    const productionEnv = { ...env, NODE_ENV: "production" };
    const response = await request(createApp(productionEnv)).get("/api/v1/missing");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("does not expose the deferred Apple OAuth provider", async () => {
    const response = await request(createApp(env)).get("/api/v1/auth/oauth/apple/start");
    expect(response.status).toBe(404);
  });
});
