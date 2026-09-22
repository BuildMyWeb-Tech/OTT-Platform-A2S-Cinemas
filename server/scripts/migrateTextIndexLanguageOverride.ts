/**
 * Migration — fix the movies text index colliding with the new `language` field
 *
 * MongoDB's text index reserves a field named "language" by default for its own
 * stemming rules, and only accepts a small fixed list of values — not e.g. "Tamil".
 * Movie.ts now creates the text index with `language_override: "textSearchLanguage"`
 * instead, but MongoDB won't let two indexes exist on the same keys with different
 * options, so the OLD text index must be dropped once before the new one can build.
 *
 * Safe to re-run. Run once per environment (including production):
 *   cd server && npx tsx scripts/migrateTextIndexLanguageOverride.ts
 */
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    const moviesCol = mongoose.connection.db!.collection("movies");
    const existing = await moviesCol.indexes();
    const textIndex = existing.find((idx: any) => idx.key && idx.key._fts === "text");

    if (!textIndex) {
        console.log("No existing text index found — nothing to drop.");
    } else if (textIndex.language_override === "textSearchLanguage") {
        console.log("Text index already uses the new language_override — nothing to do.");
    } else {
        const indexName = textIndex.name as string;
        console.log(`Dropping old text index: ${indexName}`);
        await moviesCol.dropIndex(indexName);
    }

    console.log("Creating text index with language_override: 'textSearchLanguage'...");
    await moviesCol.createIndex(
        { title: "text", description: "text" },
        { language_override: "textSearchLanguage" }
    );

    console.log("Done.");
    await mongoose.disconnect();
}

migrate().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
