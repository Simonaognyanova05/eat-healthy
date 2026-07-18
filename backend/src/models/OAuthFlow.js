import mongoose from "mongoose";
const schema = new mongoose.Schema({
  stateHash: { type: String, unique: true, required: true },
  provider: { type: String, enum: ["google"], required: true },
  codeVerifier: { type: String, required: true },
  nonce: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });
export const OAuthFlow = mongoose.model("OAuthFlow", schema);
