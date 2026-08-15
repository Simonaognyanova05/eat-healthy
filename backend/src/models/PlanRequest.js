import mongoose from "mongoose";

const planRequestSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestedPlan: { type: String, enum: ["starter", "pro"], required: true },
  priceCents: { type: Number, enum: [1500, 4900], required: true },
  currency: { type: String, enum: ["eur"], default: "eur" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  decidedAt: { type: Date, default: null }
}, { timestamps: true });

planRequestSchema.index(
  { owner: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
planRequestSchema.index({ status: 1, createdAt: 1 });

export const PlanRequest = mongoose.model("PlanRequest", planRequestSchema);
