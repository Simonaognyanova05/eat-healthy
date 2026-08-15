import mongoose from "mongoose";

const targetSchema = new mongoose.Schema({
  calories: { type: Number, required: true },
  proteinGrams: { type: Number, required: true },
  fatGrams: { type: Number, required: true },
  formula: { type: String, enum: ["mifflin_st_jeor_v1"], required: true }
}, { _id: false });

const nutritionProfileSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  sex: { type: String, enum: ["female", "male"], required: true },
  age: { type: Number, min: 18, max: 80, required: true },
  heightCm: { type: Number, min: 120, max: 230, required: true },
  weightKg: { type: Number, min: 35, max: 300, required: true },
  activity: { type: String, enum: ["low", "moderate", "high"], required: true },
  goal: { type: String, enum: ["lose", "gain", "maintain"], required: true },
  targets: { type: targetSchema, required: true }
}, { timestamps: true });

export const NutritionProfile = mongoose.model("NutritionProfile", nutritionProfileSchema);
