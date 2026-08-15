const ACTIVITY_FACTORS = Object.freeze({ low: 1.2, moderate: 1.45, high: 1.7 });
const GOAL_FACTORS = Object.freeze({ lose: 0.85, maintain: 1, gain: 1.1 });
const PROTEIN_FACTORS = Object.freeze({ lose: 1.6, maintain: 1.2, gain: 1.6 });

export function calculateNutritionTargets({ sex, age, heightCm, weightKg, activity, goal }) {
  const sexAdjustment = sex === "male" ? 5 : -161;
  const restingEnergy = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + sexAdjustment;
  const calories = Math.round((restingEnergy * ACTIVITY_FACTORS[activity] * GOAL_FACTORS[goal]) / 50) * 50;
  return {
    calories,
    proteinGrams: Math.round(weightKg * PROTEIN_FACTORS[goal]),
    fatGrams: Math.round((calories * 0.25) / 9),
    formula: "mifflin_st_jeor_v1"
  };
}
