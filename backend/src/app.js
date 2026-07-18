import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import recognitionRoutes from "./routes/recognitionRoutes.js";
import { csrfCookie, requireCsrf } from "./middleware/security.js";

export function createApp(env) {
  const app = express();
  app.locals.env = env;
  app.disable("x-powered-by");
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.APP_ORIGIN, credentials: true, methods: ["GET", "POST"] }));
  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));
  app.use(cookieParser());
  app.use(csrfCookie);
  app.use("/api/v1/auth", requireCsrf, authRoutes);
  app.use("/api/v1/recognitions", requireCsrf, recognitionRoutes);
  app.get("/api/v1/health", (_req, res) => res.json({ data: { status: "ok" } }));
  app.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Ресурсът не е намерен." } }));
  app.use((error, _req, res, _next) => {
    if (env.NODE_ENV !== "test") console.error("request_failed", { name: error?.name });
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Нещо се обърка. Опитай отново." } });
  });
  return app;
}
