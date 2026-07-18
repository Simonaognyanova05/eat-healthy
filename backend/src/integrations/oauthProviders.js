import * as arctic from "arctic";
import { createRemoteJWKSet, jwtVerify } from "jose";

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const appleKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export function providerClient(provider, env) {
  if (provider === "google" && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI) {
    return new arctic.Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
  }
  if (provider === "apple" && env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY_BASE64 && env.APPLE_REDIRECT_URI) {
    return new arctic.Apple(env.APPLE_CLIENT_ID, env.APPLE_TEAM_ID, env.APPLE_KEY_ID, Buffer.from(env.APPLE_PRIVATE_KEY_BASE64, "base64"), env.APPLE_REDIRECT_URI);
  }
  return null;
}

export async function verifiedClaims(provider, idToken, nonce, env) {
  const google = provider === "google";
  const { payload } = await jwtVerify(idToken, google ? googleKeys : appleKeys, {
    issuer: google ? ["https://accounts.google.com", "accounts.google.com"] : "https://appleid.apple.com",
    audience: google ? env.GOOGLE_CLIENT_ID : env.APPLE_CLIENT_ID,
    maxTokenAge: "10m"
  });
  if (payload.nonce !== nonce || !payload.sub) throw new Error("invalid_nonce");
  return payload;
}
