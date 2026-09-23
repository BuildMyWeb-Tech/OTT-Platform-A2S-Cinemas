/**
 * prelaunchCleanup.ts — One-time wipe of test data before real launch.
 *
 * Deletes ALL documents from: movies, purchases, licenses, reviews,
 * notifications, users (except admin@a2s.com). Categories are left untouched.
 *
 * This is destructive and was run once, deliberately, with the user's explicit
 * confirmation of scope. Not meant to be re-run casually — kept for the record.
 *
 * Usage: cd server && npx tsx scripts/prelaunchCleanup.ts
 */
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const KEEP_ADMIN_EMAIL = "admin@a2s.com";

async function cleanup() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    const db = mongoose.connection.db!;

    const results: Record<string, number> = {};

    for (const col of ["movies", "purchases", "licenses", "reviews", "notifications"]) {
        const res = await db.collection(col).deleteMany({});
        results[col] = res.deletedCount;
    }

    const usersRes = await db.collection("users").deleteMany({ email: { $ne: KEEP_ADMIN_EMAIL } });
    results["users (non-admin)"] = usersRes.deletedCount;

    console.log("Deleted counts:");
    for (const [k, v] of Object.entries(results)) console.log(`  ${k}: ${v}`);

    const remainingUsers = await db.collection("users").find({}, { projection: { email: 1, role: 1 } }).toArray();
    console.log("Remaining users:", JSON.stringify(remainingUsers));

    const catCount = await db.collection("categories").countDocuments();
    console.log("Categories untouched, count:", catCount);

    await mongoose.disconnect();
    console.log("Done.");
}

cleanup().catch((err) => {
    console.error("Cleanup failed:", err.message);
    process.exit(1);
});
