import "dotenv/config";
import mongoose from "mongoose";

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  const users = mongoose.connection.collection("users");
  const indexes = await users.indexes();
  const duplicates = await users.aggregate([
    { $match: { email: { $type: "string" } } },
    { $group: { _id: { $toLower: { $trim: { input: "$email" } } }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $group: { _id: null, groups: { $sum: 1 }, documents: { $sum: "$count" }, largest: { $max: "$count" } } }
  ]).toArray();

  console.log({
    indexes: indexes.map(({ name, unique, key }) => ({ name, unique: Boolean(unique), key })),
    duplicateSummary: duplicates[0] || { groups: 0, documents: 0, largest: 0 }
  });
} catch (error) {
  console.error({ name: error.name, code: error.code, codeName: error.codeName });
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
