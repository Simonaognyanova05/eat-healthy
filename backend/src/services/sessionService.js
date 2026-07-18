import { Session } from "../models/Session.js";
import { randomToken, tokenHash } from "../utils/crypto.js";

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
export async function createSession(userId, secret) {
  const token = randomToken();
  await Session.create({ tokenHash: tokenHash(token, secret), userId, expiresAt: new Date(Date.now() + DAYS_30) });
  return token;
}
export async function getSession(token, secret) {
  if (!token) return null;
  return Session.findOne({ tokenHash: tokenHash(token, secret), expiresAt: { $gt: new Date() } }).populate("userId");
}
export async function deleteSession(token, secret) {
  if (token) await Session.deleteOne({ tokenHash: tokenHash(token, secret) });
}
