import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getSession } from "../services/sessionService.js";
import { generateRecipesWithOpenAI } from "../integrations/openaiRecipes.js";
import { recipeRequestSchema } from "../validation/recipeSchemas.js";

const router = Router();
const generationLimit = rateLimit({ windowMs: 24 * 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

router.post("/generate", generationLimit, async (req, res, next) => {
  try {
    const session = await getSession(req.cookies.eh_session, req.app.locals.env.SESSION_SECRET);
    if (!session?.userId || session.userId.status !== "active") return res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Влез в профила си, за да генерираш рецепти." } });
    const parsed = recipeRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_INGREDIENTS", message: "Добави поне един валиден продукт." } });
    const result = await generateRecipesWithOpenAI({ ingredients: parsed.data.ingredients, env: req.app.locals.env });
    return res.json({ data: result });
  } catch (error) { next(error); }
});

export default router;
