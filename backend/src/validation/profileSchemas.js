import { z } from "zod";

export const profileSchema = z.object({
  sex: z.enum(["female", "male"]),
  age: z.coerce.number().int().min(18).max(80),
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(35).max(300),
  activity: z.enum(["low", "moderate", "high"]),
  goal: z.enum(["lose", "gain", "maintain"])
}).strict();
