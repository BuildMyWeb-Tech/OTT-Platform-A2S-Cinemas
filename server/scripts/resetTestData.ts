/**
 * resetTestData.ts — Run before Playwright tests to ensure clean state
 * Usage: cd server && npx tsx scripts/resetTestData.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function resetTestData() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("🔌 Connected to MongoDB");

  // Remove test movies created by Playwright (titles starting with "PW ")
  const Movie = mongoose.model("Movie", new mongoose.Schema({}, { strict: false }));
  const deleted = await Movie.deleteMany({ title: { $regex: /^PW /i } });
  console.log(`🗑️  Deleted ${deleted.deletedCount} test movies`);

  // Ensure testuser@a2s.com is unblocked
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  await User.updateOne({ email: "testuser@a2s.com" }, { $set: { isBlocked: false } });
  console.log("✅ Unblocked testuser@a2s.com");

  // Remove test categories (starting with "PW-Cat" or "E2E Cat")
  const Category = mongoose.model("Category", new mongoose.Schema({}, { strict: false }));
  const deletedCats = await Category.deleteMany({
    name: { $regex: /^(PW-Cat|E2E Cat|Playwright)/i }
  });
  console.log(`🗑️  Deleted ${deletedCats.deletedCount} test categories`);

  await mongoose.disconnect();
  console.log("✅ Test data reset complete — ready for Playwright");
}

resetTestData().catch((e) => {
  console.error("❌ Reset failed:", e);
  process.exit(1);
});