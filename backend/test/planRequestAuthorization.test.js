import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { sessionUser, createPlanRequest } = vi.hoisted(() => ({
  sessionUser: {
    _id: "507f1f77bcf86cd799439011",
    status: "active",
    role: "user",
    plan: "free",
    planStatus: "inactive"
  },
  createPlanRequest: vi.fn()
}));

vi.mock("../src/services/sessionService.js", () => ({
  getSession: vi.fn(async () => ({ userId: sessionUser }))
}));
vi.mock("../src/models/PlanRequest.js", () => ({
  PlanRequest: {
    create: createPlanRequest,
    findOne: vi.fn(),
    find: vi.fn()
  }
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

async function csrfAgent() {
  const agent = request.agent(createApp(env));
  const bootstrap = await agent.get("/");
  const cookie = bootstrap.headers["set-cookie"].find((item) => item.startsWith("eh_csrf="));
  return { agent, csrf: cookie.match(/^eh_csrf=([^;]+)/)[1] };
}

describe("plan request authorization", () => {
  beforeEach(() => {
    sessionUser.role = "user";
    createPlanRequest.mockReset();
  });

  it("denies the admin queue to a normal user", async () => {
    const { agent } = await csrfAgent();
    const response = await agent.get("/api/v1/plan-requests/admin");
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ADMIN_REQUIRED");
  });

  it("rejects client-controlled prices and unknown fields", async () => {
    const { agent, csrf } = await csrfAgent();
    const response = await agent.post("/api/v1/plan-requests")
      .set("x-csrf-token", csrf)
      .send({ plan: "starter", priceCents: 1 });
    expect(response.status).toBe(400);
    expect(createPlanRequest).not.toHaveBeenCalled();
  });

  it("assigns the trusted server price", async () => {
    createPlanRequest.mockImplementation(async (values) => ({
      _id: "507f191e810c19729de860ea",
      ...values,
      currency: "eur",
      status: "pending",
      createdAt: new Date("2026-07-27T10:00:00.000Z"),
      decidedAt: null
    }));
    const { agent, csrf } = await csrfAgent();
    const response = await agent.post("/api/v1/plan-requests")
      .set("x-csrf-token", csrf)
      .send({ plan: "starter" });
    expect(response.status).toBe(201);
    expect(createPlanRequest).toHaveBeenCalledWith(expect.objectContaining({ priceCents: 1500 }));
  });
});
