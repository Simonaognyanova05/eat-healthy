import "dotenv/config";
import mongoose from "mongoose";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !process.env.MONGODB_URI) {
  console.error("Usage: node scripts/promoteAdmin.js <email>");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  const result = await mongoose.connection.collection("users").updateOne(
    { email },
    { $set: { role: "admin" } }
  );
  if (!result.matchedCount) {
    console.error("User not found.");
    process.exitCode = 1;
  } else {
    console.log("Administrator role assigned.");
  }
} catch (error) {
  console.error({ name: error.name, code: error.code });
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
