import { describe, expect, it } from "vitest";
import { calculateNutritionTargets } from "../src/services/nutritionTargetService.js";
import { profileSchema } from "../src/validation/profileSchemas.js";

describe("nutrition target calculation", () => {
  it("calculates reproducible targets with formula provenance", () => {
    expect(calculateNutritionTargets({ sex: "female", age: 30, heightCm: 165, weightKg: 75, activity: "moderate", goal: "lose" }))
      .toEqual({ calories: 1800, proteinGrams: 120, fatGrams: 50, formula: "mifflin_st_jeor_v1" });
  });

  it("rejects minors, extreme values and unknown fields", () => {
    const base = { sex: "male", age: 17, heightCm: 180, weightKg: 80, activity: "low", goal: "maintain" };
    expect(profileSchema.safeParse(base).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, age: 30, role: "admin" }).success).toBe(false);
  });
});
