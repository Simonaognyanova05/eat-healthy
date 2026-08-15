import { Usage } from "../models/Usage.js";

export const MONTHLY_IMAGE_LIMITS = Object.freeze({
  free: 50,
  starter: 200,
  pro: 1000
});

export function recognitionPeriod(now = new Date()) {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { periodStart, periodEnd };
}

export function effectivePlan(user, now = new Date()) {
  const activeUntil = user?.planExpiresAt ? new Date(user.planExpiresAt) : null;
  return ["starter", "pro"].includes(user?.plan)
    && user?.planStatus === "active"
    && activeUntil > now
    ? user.plan
    : "free";
}

export function usageSnapshot(user, count = 0, now = new Date()) {
  const plan = effectivePlan(user, now);
  const { periodEnd } = recognitionPeriod(now);
  const limit = MONTHLY_IMAGE_LIMITS[plan];
  return {
    plan,
    used: count,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt: periodEnd.toISOString()
  };
}

export async function getRecognitionUsage(user, now = new Date()) {
  const { periodStart } = recognitionPeriod(now);
  const usage = await Usage.findOne({ owner: user._id, feature: "recognition", periodStart }).lean();
  return usageSnapshot(user, usage?.count || 0, now);
}

export async function reserveRecognition(user, amount = 1, now = new Date()) {
  const { periodStart, periodEnd } = recognitionPeriod(now);
  const limit = MONTHLY_IMAGE_LIMITS[effectivePlan(user, now)];
  try {
    const usage = await Usage.findOneAndUpdate(
      { owner: user._id, feature: "recognition", periodStart, count: { $lte: limit - amount } },
      { $inc: { count: amount }, $setOnInsert: { periodEnd } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return { allowed: true, usage: usageSnapshot(user, usage.count, now), periodStart };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const usage = await getRecognitionUsage(user, now);
    return { allowed: false, usage, periodStart };
  }
}

export async function releaseRecognition(user, periodStart, amount = 1) {
  await Usage.updateOne(
    { owner: user._id, feature: "recognition", periodStart, count: { $gt: 0 } },
    { $inc: { count: -amount } }
  );
}
