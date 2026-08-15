import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import recognitionRoutes from "./routes/recognitionRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import planRequestRoutes from "./routes/planRequestRoutes.js";
import { csrfCookie, requireCsrf } from "./middleware/security.js";

function isPrivateDevelopmentOrigin(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const privateHost = host === "localhost"
      || host === "127.0.0.1"
      || /^10\./.test(host)
      || /^192\.168\./.test(host)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
    return url.protocol === "http:" && url.port === "3000" && privateHost;
  } catch {
    return false;
  }
}

export function corsOrigin(env) {
  return (origin, callback) => {
    const allowed = !origin
      || origin === env.APP_ORIGIN
      || (env.NODE_ENV === "development" && isPrivateDevelopmentOrigin(origin));
    callback(allowed ? null : new Error("CORS_ORIGIN_DENIED"), allowed);
  };
}

export function createApp(env) {
  const app = express();
  app.locals.env = env;
  app.disable("x-powered-by");
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: corsOrigin(env), credentials: true, methods: ["GET", "POST", "PATCH"] }));
  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));
  app.use(cookieParser());
  app.use(csrfCookie);
  app.use("/api/v1/auth", requireCsrf, authRoutes);
  app.use("/api/v1/recognitions", requireCsrf, recognitionRoutes);
  app.use("/api/v1/recipes", requireCsrf, recipeRoutes);
  app.use("/api/v1/plan-requests", requireCsrf, planRequestRoutes);
  app.get("/", (_req, res) => res.json({ data: { service: "FitFridge API", status: "ok" } }));
  app.get("/api/v1/health", (_req, res) => res.json({ data: { status: "ok" } }));
  app.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Ресурсът не е намерен." } }));
  app.use((error, _req, res, _next) => {
    if (error?.code === "INVALID_FILE_TYPE") return res.status(415).json({ error: { code: "INVALID_IMAGE", message: "Избери само JPG, PNG или WebP снимки." } });
    if (error?.name === "MulterError") return res.status(413).json({ error: { code: "UPLOAD_LIMIT", message: "Качи до 5 снимки, всяка до 10 MB." } });
    if (env.NODE_ENV !== "test") console.error("request_failed", { name: error?.name });
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Нещо се обърка. Опитай отново." } });
  });
  return app;
}
