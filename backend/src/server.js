import mongoose from "mongoose";
import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";

const env = loadEnv();
await mongoose.connect(env.MONGODB_URI);
const server = createApp(env).listen(env.PORT, () => console.log(`Eat Healthy API listening on :${env.PORT}`));
async function shutdown() {
  server.close(async () => { await mongoose.disconnect(); process.exit(0); });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
