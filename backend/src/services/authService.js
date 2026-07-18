import argon2 from "argon2";
import { User } from "../models/User.js";

const hashOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
export async function registerWithEmail({ email, password, displayName }) {
  const existing = await User.findOne({ email }).select("+passwordHash");
  if (existing) {
    await argon2.hash(password, hashOptions);
    return null;
  }
  const passwordHash = await argon2.hash(password, hashOptions);
  try {
    return await User.create({
      email, displayName, passwordHash, emailVerified: false,
      identities: [{ provider: "email", subject: email, email, emailVerified: false }]
    });
  } catch (error) {
    if (error?.code === 11000) return null;
    throw error;
  }
}

export async function findOrCreateOAuthUser({ provider, subject, email, emailVerified, displayName }) {
  const linked = await User.findOne({ identities: { $elemMatch: { provider, subject } } });
  if (linked) return linked;
  if (email && await User.exists({ email })) {
    const error = new Error("identity_link_required");
    error.code = "IDENTITY_LINK_REQUIRED";
    throw error;
  }
  return User.create({
    email, emailVerified, displayName,
    identities: [{ provider, subject, email, emailVerified }]
  });
}
