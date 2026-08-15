import { describe, expect, it, vi } from "vitest";
import request from "supertest";

const recognizeImages = vi.hoisted(() => vi.fn(async () => ({
  context: "fridge",
  ingredients: [{ name: "домати", confidence: 0.94 }],
  warnings: []
})));
vi.mock("../src/integrations/openaiRecognition.js", () => ({ recognizeImages }));

import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";

const env = loadEnv({
  NODE_ENV: "test", PORT: "4000", MONGODB_URI: "mongodb://localhost/test",
  APP_ORIGIN: "http://localhost:3000", SESSION_SECRET: "a-secure-test-secret-that-is-long-enough",
  OPENAI_API_KEY: "test-openai-key-that-is-long-enough", OPENAI_MODEL: "gpt-5.4-mini"
});

describe("guest recognition", () => {
  it("allows one bounded recognition without an account", async () => {
    const agent = request.agent(createApp(env));
    const bootstrap = await agent.get("/");
    const csrfCookie = bootstrap.headers["set-cookie"].find((cookie) => cookie.startsWith("eh_csrf="));
    const csrf = csrfCookie.match(/^eh_csrf=([^;]+)/)[1];
    const response = await agent.post("/api/v1/recognitions/guest")
      .set("x-csrf-token", csrf)
      .attach("image", Buffer.from([0xff, 0xd8, 0xff]), { filename: "fridge.jpg", contentType: "image/jpeg" });
    expect(response.status).toBe(200);
    expect(response.body.data.ingredients[0].name).toBe("домати");
    expect(response.body.data.trial.remaining).toBe(0);
    expect(recognizeImages).toHaveBeenCalledTimes(1);
  });

  it("still requires CSRF for the public trial", async () => {
    const response = await request(createApp(env)).post("/api/v1/recognitions/guest")
      .attach("image", Buffer.from([0xff, 0xd8, 0xff]), { filename: "fridge.jpg", contentType: "image/jpeg" });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_INVALID");
  });
});
