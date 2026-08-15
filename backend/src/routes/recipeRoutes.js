import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getSession } from "../services/sessionService.js";
import { generateRecipesWithOpenAI } from "../integrations/openaiRecipes.js";
import { recipeRequestSchema } from "../validation/recipeSchemas.js";
import { NutritionProfile } from "../models/NutritionProfile.js";

const router = Router();
const generationLimit = rateLimit({ windowMs: 24 * 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

router.post("/generate", generationLimit, async (req, res, next) => {
  try {
    const session = await getSession(req.cookies.eh_session, req.app.locals.env.SESSION_SECRET);
    if (!session?.userId || session.userId.status !== "active") return res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Влез в профила си, за да генерираш рецепти." } });
    const parsed = recipeRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_INGREDIENTS", message: "Добави поне един валиден продукт." } });
    const profile = await NutritionProfile.findOne({ owner: session.userId._id }).select("goal targets").lean();
    if (!profile) return res.status(409).json({ error: { code: "PROFILE_REQUIRED", message: "Попълни профила и целта си, за да създадем подходящи рецепти." } });
    const personalization = { goal: profile.goal, dailyTargets: profile.targets };
    const result = await generateRecipesWithOpenAI({ ingredients: parsed.data.ingredients, personalization, env: req.app.locals.env });
    return res.json({ data: result });
  } catch (error) { next(error); }
});

export default router;
