/**
 * Migration — add movie-level taxPercentage (default 0)
 * Run once: cd server && npx tsx scripts/migrateTaxPercentage.ts
 *
 * - Sets taxPercentage = 0 on every movie that does not have the field yet
 * - Does NOT touch movies that already have a value
 * - Does NOT touch purchases: completed orders keep their original amounts
 * - Safe to re-run
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    const moviesCol = mongoose.connection.db!.collection("movies");
    const result = await moviesCol.updateMany(
        { taxPercentage: { $exists: false } },
        { $set: { taxPercentage: 0 } }
    );

    console.log(`Matched ${result.matchedCount}, updated ${result.modifiedCount} movie(s) -> taxPercentage: 0`);
    await mongoose.disconnect();
}

migrate().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
