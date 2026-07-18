import { Router, raw } from "express";
import rateLimit from "express-rate-limit";
import { getSession } from "../services/sessionService.js";
import { MAX_BYTES, validateImage } from "../services/imageValidationService.js";
import { recognizeImage } from "../integrations/openaiRecognition.js";

const router = Router();
const recognitionLimit = rateLimit({ windowMs: 24 * 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false });
const imageBody = raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: MAX_BYTES });

router.post("/", recognitionLimit, imageBody, async (req, res, next) => {
  try {
    const session = await getSession(req.cookies.eh_session, req.app.locals.env.SESSION_SECRET);
    if (!session?.userId || session.userId.status !== "active") {
      return res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Влез в профила си, за да разпознаеш продуктите." } });
    }
    const metadata = validateImage(req.body, req.get("content-type")?.split(";")[0]);
    if (!metadata) return res.status(415).json({ error: { code: "INVALID_IMAGE", message: "Избери валидна JPG, PNG или WebP снимка до 10 MB." } });
    const result = await recognizeImage({ image: req.body, mime: metadata.mime, env: req.app.locals.env });
    return res.json({ data: result });
  } catch (error) { next(error); }
});

export default router;
