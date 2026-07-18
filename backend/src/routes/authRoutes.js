import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as arctic from "arctic";
import { OAuthFlow } from "../models/OAuthFlow.js";
import { registerSchema } from "../validation/authSchemas.js";
import { registerWithEmail, findOrCreateOAuthUser } from "../services/authService.js";
import { createSession, deleteSession, getSession } from "../services/sessionService.js";
import { providerClient, verifiedClaims } from "../integrations/oauthProviders.js";
import { randomToken, tokenHash } from "../utils/crypto.js";

const router = Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });
const cookieOptions = (env) => ({ httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 * 1000 });
const publicUser = (user) => ({ id: user.id, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified });

router.get("/session", async (req, res, next) => {
  try {
    const session = await getSession(req.cookies.eh_session, req.app.locals.env.SESSION_SECRET);
    res.json({ data: { user: session?.userId?.status === "active" ? publicUser(session.userId) : null, csrfToken: req.csrfToken } });
  } catch (error) { next(error); }
});

router.post("/register", authLimit, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_REGISTRATION", message: "Провери въведените данни." } });
    const user = await registerWithEmail(parsed.data);
    if (user) {
      const token = await createSession(user.id, req.app.locals.env.SESSION_SECRET);
      res.cookie("eh_session", token, cookieOptions(req.app.locals.env));
    }
    res.status(201).json({ data: { accepted: true, user: user ? publicUser(user) : null } });
  } catch (error) { next(error); }
});

router.post("/logout", async (req, res, next) => {
  try {
    await deleteSession(req.cookies.eh_session, req.app.locals.env.SESSION_SECRET);
    res.clearCookie("eh_session", { path: "/" });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get("/oauth/:provider/start", authLimit, async (req, res, next) => {
  try {
    const { provider } = req.params;
    if (provider !== "google") return res.status(404).end();
    const env = req.app.locals.env;
    const client = providerClient(provider, env);
    if (!client) return res.redirect(`${env.APP_ORIGIN}/register?error=provider_unavailable`);
    const state = arctic.generateState();
    const codeVerifier = arctic.generateCodeVerifier();
    const nonce = randomToken(24);
    await OAuthFlow.create({ stateHash: tokenHash(state, env.SESSION_SECRET), provider, codeVerifier, nonce, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    const url = client.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);
    url.searchParams.set("nonce", nonce);
    res.redirect(url.toString());
  } catch (error) { next(error); }
});

async function oauthCallback(req, res) {
  const env = req.app.locals.env;
  const provider = req.params.provider;
  try {
    const state = req.body?.state || req.query.state;
    const code = req.body?.code || req.query.code;
    if (typeof state !== "string" || typeof code !== "string") throw new Error("invalid_callback");
    const flow = await OAuthFlow.findOneAndDelete({ stateHash: tokenHash(state, env.SESSION_SECRET), provider, expiresAt: { $gt: new Date() } });
    if (!flow) throw new Error("invalid_state");
    const client = providerClient(provider, env);
    if (!client) throw new Error("provider_unavailable");
    const tokens = await client.validateAuthorizationCode(code, flow.codeVerifier);
    const claims = await verifiedClaims(tokens.idToken(), flow.nonce, env);
    const email = typeof claims.email === "string" ? claims.email.toLowerCase() : undefined;
    const emailVerified = claims.email_verified === true || claims.email_verified === "true";
    const displayName = typeof claims.name === "string" ? claims.name : "Нов кулинар";
    const user = await findOrCreateOAuthUser({ provider, subject: claims.sub, email, emailVerified, displayName });
    const token = await createSession(user.id, env.SESSION_SECRET);
    res.cookie("eh_session", token, cookieOptions(env));
    return res.redirect(`${env.APP_ORIGIN}/register?success=1`);
  } catch (error) {
    let reason = "oauth_failed";
    if (error?.code === "IDENTITY_LINK_REQUIRED") reason = "link_required";
    else if (error instanceof arctic.OAuth2RequestError) reason = "provider_rejected";
    else if (error?.message === "invalid_state") reason = "oauth_session_expired";
    else if (typeof error?.code === "string" && /^(ERR_JWT|ERR_JWS|ERR_JOSE)/.test(error.code)) reason = "token_invalid";
    if (env.NODE_ENV !== "production") {
      console.error("oauth_callback_failed", {
        provider,
        category: reason,
        errorName: error?.name,
        errorCode: typeof error?.code === "string" ? error.code : undefined,
        rejectedClaim: typeof error?.claim === "string" ? error.claim : undefined
      });
    }
    return res.redirect(`${env.APP_ORIGIN}/register?error=${reason}`);
  }
}
router.get("/oauth/:provider/callback", oauthCallback);
export default router;
