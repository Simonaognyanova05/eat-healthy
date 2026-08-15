import mongoose from "mongoose";

const usageSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  feature: { type: String, enum: ["recognition"], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  count: { type: Number, min: 0, default: 0 }
}, { timestamps: true });

usageSchema.index({ owner: 1, feature: 1, periodStart: 1 }, { unique: true });

export const Usage = mongoose.model("Usage", usageSchema);
