import { z } from "zod";

export const recognitionResultSchema = z.object({
  version: z.literal("1.0"),
  context: z.enum(["fridge", "cupboard", "table", "mixed", "unknown"]),
  ingredients: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    confidence: z.number().min(0).max(1)
  }).strict()).max(60),
  warnings: z.array(z.string().trim().min(1).max(160)).max(8)
}).strict();

export const recognitionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    version: { type: "string", enum: ["1.0"] },
    context: { type: "string", enum: ["fridge", "cupboard", "table", "mixed", "unknown"] },
    ingredients: {
      type: "array", maxItems: 60,
      items: {
        type: "object", additionalProperties: false,
        properties: { name: { type: "string", maxLength: 80 }, confidence: { type: "number", minimum: 0, maximum: 1 } },
        required: ["name", "confidence"]
      }
    },
    warnings: { type: "array", maxItems: 8, items: { type: "string", maxLength: 160 } }
  },
  required: ["version", "context", "ingredients", "warnings"]
};
