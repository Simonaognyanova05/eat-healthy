import mongoose from "mongoose";
const schema = new mongoose.Schema({
  tokenHash: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });
export const Session = mongoose.model("Session", schema);
