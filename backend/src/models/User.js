import mongoose from "mongoose";

const identitySchema = new mongoose.Schema({
  provider: { type: String, enum: ["email", "google"], required: true },
  subject: { type: String, required: true },
  email: { type: String },
  emailVerified: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, trim: true, lowercase: true },
  emailVerified: { type: Boolean, default: false },
  displayName: { type: String, trim: true, maxlength: 80 },
  passwordHash: { type: String, select: false },
  identities: { type: [identitySchema], default: [] },
  status: { type: String, enum: ["active", "blocked"], default: "active" }
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ "identities.provider": 1, "identities.subject": 1 }, { unique: true });
export const User = mongoose.model("User", userSchema);
