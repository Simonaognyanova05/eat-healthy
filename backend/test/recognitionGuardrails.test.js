import { describe, expect, it, vi } from "vitest";
import { validateImage } from "../src/services/imageValidationService.js";
import { recognizeImage, recognizeImages } from "../src/integrations/openaiRecognition.js";

const env = { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "gpt-5.4-mini" };

describe("recognition guardrails", () => {
  it("rejects mismatched and malformed image bytes", () => {
    expect(validateImage(Buffer.from("not an image"), "image/jpeg")).toBeNull();
    expect(validateImage(Buffer.from([0xff, 0xd8, 0xff, 0x00]), "image/png")).toBeNull();
  });

  it("sends all images in one provider request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ output: [{ content: [{ type: "output_text", text: JSON.stringify({ version: "1.0", context: "mixed", ingredients: [], warnings: [] }) }] }] }) });
    await recognizeImages({ images: [{ buffer: Buffer.from([0xff]), mime: "image/jpeg" }, { buffer: Buffer.from([137]), mime: "image/png" }], env, fetchImpl });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.input[0].content.filter(({ type }) => type === "input_image")).toHaveLength(2);
  });

  it("accepts validated structured provider output", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ output: [{ content: [{ type: "output_text", text: JSON.stringify({ version: "1.0", context: "fridge", ingredients: [{ name: "яйца", confidence: 0.96 }], warnings: [] }) }] }] }) });
    const result = await recognizeImage({ image: Buffer.from([0xff, 0xd8, 0xff]), mime: "image/jpeg", env, fetchImpl });
    expect(result.ingredients[0].name).toBe("яйца");
    expect(result.model).toBe("gpt-5.4-mini");
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).store).toBe(false);
  });

  it("rejects malformed AI output", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ output: [{ content: [{ type: "output_text", text: '{"ingredients":"unsafe"}' }] }] }) });
    await expect(recognizeImage({ image: Buffer.from([0xff]), mime: "image/jpeg", env, fetchImpl })).rejects.toThrow("AI_INVALID_OUTPUT");
  });
});
