import "dotenv/config";
import { z } from "zod";

const blankToUndefined = (value) => value === "" ? undefined : value;
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().min(1),
  APP_ORIGIN: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().min(20),
  OPENAI_MODEL: z.literal("gpt-5.4-mini").default("gpt-5.4-mini"),
  GOOGLE_CLIENT_ID: z.preprocess(blankToUndefined, z.string().optional()),
  GOOGLE_CLIENT_SECRET: z.preprocess(blankToUndefined, z.string().optional()),
  GOOGLE_REDIRECT_URI: z.preprocess(blankToUndefined, z.string().url().optional())
});

export function loadEnv(source = process.env) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const invalidKeys = [...new Set(result.error.issues.map((issue) => issue.path.join(".") || "environment"))];
    throw new Error(`Невалидна сървърна конфигурация. Провери: ${invalidKeys.join(", ")}.`);
  }
  return result.data;
}
