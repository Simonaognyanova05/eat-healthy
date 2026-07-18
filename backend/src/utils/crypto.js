import { createHmac, randomBytes } from "node:crypto";
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const tokenHash = (token, secret) => createHmac("sha256", secret).update(token).digest("hex");
