import { z } from "zod";

const ingredientName = z.string().trim().min(1).max(80);

export const recipeRequestSchema = z.object({
  ingredients: z.array(ingredientName).min(1).max(40)
    .transform((items) => [...new Set(items.map((item) => item.toLocaleLowerCase("bg")))])
}).strict();

const recipeIngredientSchema = z.object({
  name: ingredientName,
  quantity: z.string().trim().min(1).max(60),
  available: z.boolean()
}).strict();

const recipeSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(240),
  servings: z.number().int().min(1).max(8),
  prepMinutes: z.number().int().min(5).max(240),
  rating: z.number().int().min(1).max(5),
  ingredients: z.array(recipeIngredientSchema).min(2).max(20),
  steps: z.array(z.string().trim().min(5).max(400)).min(2).max(12),
  nutrition: z.object({
    calories: z.number().int().min(20).max(2500),
    proteinGrams: z.number().min(0).max(300),
    fatGrams: z.number().min(0).max(300),
    carbsGrams: z.number().min(0).max(500),
    source: z.literal("ai_estimate"),
    confidence: z.enum(["low", "medium"])
  }).strict()
}).strict();

export const recipeResultSchema = z.object({
  version: z.literal("1.0"),
  recipes: z.array(recipeSchema).min(3).max(5)
}).strict();

export const recipeJsonSchema = {
  type: "object", additionalProperties: false,
  properties: {
    version: { type: "string", enum: ["1.0"] },
    recipes: { type: "array", minItems: 3, maxItems: 3, items: {
      type: "object", additionalProperties: false,
      properties: {
        title: { type: "string", minLength: 3, maxLength: 100 },
        description: { type: "string", minLength: 10, maxLength: 240 },
        servings: { type: "integer", minimum: 1, maximum: 8 },
        prepMinutes: { type: "integer", minimum: 5, maximum: 240 },
        rating: { type: "integer", minimum: 1, maximum: 5 },
        ingredients: { type: "array", minItems: 2, maxItems: 20, items: {
          type: "object", additionalProperties: false,
          properties: { name: { type: "string", maxLength: 80 }, quantity: { type: "string", maxLength: 60 }, available: { type: "boolean" } },
          required: ["name", "quantity", "available"]
        } },
        steps: { type: "array", minItems: 2, maxItems: 12, items: { type: "string", maxLength: 400 } },
        nutrition: { type: "object", additionalProperties: false,
          properties: {
            calories: { type: "integer", minimum: 20, maximum: 2500 },
            proteinGrams: { type: "number", minimum: 0, maximum: 300 },
            fatGrams: { type: "number", minimum: 0, maximum: 300 },
            carbsGrams: { type: "number", minimum: 0, maximum: 500 },
            source: { type: "string", enum: ["ai_estimate"] },
            confidence: { type: "string", enum: ["low", "medium"] }
          }, required: ["calories", "proteinGrams", "fatGrams", "carbsGrams", "source", "confidence"]
        }
      }, required: ["title", "description", "servings", "prepMinutes", "rating", "ingredients", "steps", "nutrition"]
    } }
  }, required: ["version", "recipes"]
};
