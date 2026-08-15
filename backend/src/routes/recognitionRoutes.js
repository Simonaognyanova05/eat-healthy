import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { getSession } from "../services/sessionService.js";
import { MAX_BYTES, validateImage } from "../services/imageValidationService.js";
import { recognizeImages } from "../integrations/openaiRecognition.js";
import { getRecognitionUsage, releaseRecognition, reserveRecognition } from "../services/entitlementService.js";

const router = Router();
const abuseLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => req.authUser._id.toString(),
  standardHeaders: true,
  legacyHeaders: false
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: MAX_BYTES, fields: 0, parts: 5 },
  fileFilter: (_req, file, callback) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return callback(null, true);
    const error = new Error("INVALID_FILE_TYPE"); error.code = "INVALID_FILE_TYPE"; return callback(error);
  }
});

async function requireActiveUser(req, res, next) {
  try {
    const session = await getSession(req.cookies.eh_session, req.app.locals.env.SESSION_SECRET);
    if (!session?.userId || session.userId.status !== "active") {
      return res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Влез в профила си, за да разпознаеш продуктите." } });
    }
    req.authUser = session.userId;
    return next();
  } catch (error) { return next(error); }
}

router.get("/usage", requireActiveUser, async (req, res, next) => {
  try {
    return res.json({ data: await getRecognitionUsage(req.authUser) });
  } catch (error) { return next(error); }
});

router.post("/", requireActiveUser, abuseLimit, upload.array("images", 5), async (req, res, next) => {
  let reservation;
  try {
    if (!req.files?.length) return res.status(400).json({ error: { code: "IMAGES_REQUIRED", message: "Добави поне една снимка." } });
    const images = req.files.map((file) => {
      const metadata = validateImage(file.buffer, file.mimetype);
      return metadata && { buffer: file.buffer, mime: metadata.mime };
    });
    if (images.some((image) => !image)) return res.status(415).json({ error: { code: "INVALID_IMAGE", message: "Всички файлове трябва да са валидни JPG, PNG или WebP снимки до 10 MB." } });
    reservation = await reserveRecognition(req.authUser, images.length);
    if (!reservation.allowed) {
      return res.status(429).json({
        error: {
          code: "MONTHLY_IMAGE_LIMIT",
          message: reservation.usage.plan === "free"
            ? "Използва безплатната си месечна квота от 50 снимки."
            : "Достигна месечната квота на своя план.",
          details: { usage: reservation.usage }
        }
      });
    }
    const result = await recognizeImages({ images, env: req.app.locals.env });
    return res.json({ data: { ...result, usage: reservation.usage } });
  } catch (error) {
    if (reservation?.allowed) {
      try { await releaseRecognition(req.authUser, reservation.periodStart, req.files?.length || 1); }
      catch (releaseError) { console.error("recognition_usage_release_failed", { errorName: releaseError.name }); }
    }
    return next(error);
  }
});

export default router;
