import { z } from "zod";

export const createPlanRequestSchema = z.object({
  plan: z.enum(["starter", "pro"])
}).strict();

export const decidePlanRequestSchema = z.object({
  decision: z.enum(["approved", "rejected"])
}).strict();
