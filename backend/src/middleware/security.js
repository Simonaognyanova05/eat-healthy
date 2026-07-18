import { randomToken } from "../utils/crypto.js";

export function csrfCookie(req, res, next) {
  let token = req.cookies.eh_csrf;
  if (!token) {
    token = randomToken(24);
    res.cookie("eh_csrf", token, { httpOnly: false, secure: req.app.locals.env.NODE_ENV === "production", sameSite: "strict", path: "/" });
  }
  req.csrfToken = token;
  next();
}
export function requireCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.path.startsWith("/oauth/")) return next();
  if (!req.csrfToken || req.get("x-csrf-token") !== req.csrfToken) {
    return res.status(403).json({ error: { code: "CSRF_INVALID", message: "Сесията изтече. Опитай отново." } });
  }
  next();
}
