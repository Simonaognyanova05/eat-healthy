import { describe, expect, it, vi } from "vitest";
import { generateRecipesWithOpenAI } from "../src/integrations/openaiRecipes.js";
import { recipeRequestSchema } from "../src/validation/recipeSchemas.js";

const env = { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "gpt-5.4-mini" };
const recipe = {
  title: "Омлет със сирене", description: "Бърз домашен омлет с наличните яйца и сирене.", servings: 2, prepMinutes: 15, rating: 5,
  ingredients: [{ name: "яйца", quantity: "4 броя", available: true }, { name: "сирене", quantity: "100 г", available: true }],
  steps: ["Разбий яйцата в купа.", "Изпечи омлета и добави сиренето."],
  nutrition: { calories: 280, proteinGrams: 24, fatGrams: 18, carbsGrams: 3, source: "ai_estimate", confidence: "medium" }
};

describe("recipe generation boundaries", () => {
  it("normalizes, deduplicates and bounds ingredients", () => {
    expect(recipeRequestSchema.parse({ ingredients: [" Яйца ", "яйца", "Сирене"] }).ingredients).toEqual(["яйца", "сирене"]);
    expect(recipeRequestSchema.safeParse({ ingredients: [], admin: true }).success).toBe(false);
  });

  it("accepts three validated recipes and disables provider storage", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ output: [{ content: [{ type: "output_text", text: JSON.stringify({ version: "1.0", recipes: [recipe, { ...recipe, title: "Яйца на фурна" }, { ...recipe, title: "Салата със сирене" }] }) }] }] }) });
    const result = await generateRecipesWithOpenAI({ ingredients: ["яйца", "сирене"], env, fetchImpl });
    expect(result.recipes).toHaveLength(3);
    expect(result.recipes[0].id).toBe("recipe-1");
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).store).toBe(false);
  });

  it("rejects nutrition without explicit estimate provenance", async () => {
    const invalid = { ...recipe, nutrition: { ...recipe.nutrition, source: "verified" } };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ output: [{ content: [{ type: "output_text", text: JSON.stringify({ version: "1.0", recipes: [invalid, invalid, invalid] }) }] }] }) });
    await expect(generateRecipesWithOpenAI({ ingredients: ["яйца"], env, fetchImpl })).rejects.toThrow("AI_INVALID_OUTPUT");
  });
});
