import { Router } from "express";
import rateLimit from "express-rate-limit";
import { NutritionProfile } from "../models/NutritionProfile.js";
import { getSession } from "../services/sessionService.js";
import { calculateNutritionTargets } from "../services/nutritionTargetService.js";
import { profileSchema } from "../validation/profileSchemas.js";

const router = Router();
const updateLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

async function requireUser(req, res, next) {
  try {
    const session = await getSession(req.cookies.eh_session, req.app.locals.env.SESSION_SECRET);
    if (!session?.userId || session.userId.status !== "active") {
      return res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Влез в профила си." } });
    }
    req.authUser = session.userId;
    return next();
  } catch (error) { return next(error); }
}

router.get("/", requireUser, async (req, res, next) => {
  try {
    const profile = await NutritionProfile.findOne({ owner: req.authUser._id }).lean();
    return res.json({ data: { profile: profile ? serializeProfile(profile) : null } });
  } catch (error) { return next(error); }
});

router.put("/", requireUser, updateLimit, async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_PROFILE", message: "Провери данните в профила." } });
    const targets = calculateNutritionTargets(parsed.data);
    const profile = await NutritionProfile.findOneAndUpdate(
      { owner: req.authUser._id },
      { $set: { ...parsed.data, targets }, $setOnInsert: { owner: req.authUser._id } },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    return res.json({ data: { profile: serializeProfile(profile) } });
  } catch (error) { return next(error); }
});

function serializeProfile(profile) {
  return {
    sex: profile.sex,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    activity: profile.activity,
    goal: profile.goal,
    targets: profile.targets,
    updatedAt: profile.updatedAt
  };
}

export default router;
