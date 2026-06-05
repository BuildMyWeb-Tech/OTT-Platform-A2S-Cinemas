/**
 * Phase 9A Migration — Populate categories from genre field
 * Run once: cd server && npx tsx scripts/migrateCategories.ts
 *
 * What it does:
 * 1. Creates Category documents for each unique genre that exists in movies
 * 2. Sets movie.categories = [categoryId] mapped from movie.genre
 * 3. Preserves all existing genre fields (backward compat)
 * 4. Safe to re-run — skips already-migrated movies
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("🔌 Connected to MongoDB\n");

    const db = mongoose.connection.db!;
    const moviesCol = db.collection("movies");
    const categoriesCol = db.collection("categories");

    // 1. Find all unique genres in existing movies
    const genres: string[] = await moviesCol.distinct("genre");
    console.log(`Found ${genres.length} unique genres:`, genres);

    // 2. Create Category documents for each genre (if not already existing)
    const genreToCategoryId: Record<string, mongoose.Types.ObjectId> = {};

    for (const genre of genres) {
        if (!genre) continue;

        const slug = genre
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");

        const existing = await categoriesCol.findOne({ name: genre });
        if (existing) {
            genreToCategoryId[genre] = existing._id as mongoose.Types.ObjectId;
            console.log(`  ⚠️  Category "${genre}" already exists — reusing`);
        } else {
            const result = await categoriesCol.insertOne({
                name: genre,
                slug,
                description: `${genre} movies`,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            genreToCategoryId[genre] = result.insertedId as mongoose.Types.ObjectId;
            console.log(`  ✅ Created category "${genre}" (${result.insertedId})`);
        }
    }

    // 3. Update movies — set categories array from genre
    let updated = 0;
    let skipped = 0;

    const movies = await moviesCol.find({}).toArray();

    for (const movie of movies) {
        // Skip if already has categories array
        if (movie.categories && movie.categories.length > 0) {
            skipped++;
            continue;
        }

        if (!movie.genre || !genreToCategoryId[movie.genre]) {
            console.log(`  ⚠️  Movie "${movie.title}" has no genre — skipping`);
            skipped++;
            continue;
        }

        await moviesCol.updateOne(
            { _id: movie._id },
            {
                $set: {
                    categories: [genreToCategoryId[movie.genre]],
                    updatedAt: new Date(),
                },
            }
        );
        updated++;
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  Categories created/reused: ${Object.keys(genreToCategoryId).length}`);
    console.log(`  Movies updated: ${updated}`);
    console.log(`  Movies skipped (already migrated): ${skipped}`);
    console.log(`\n✅ Migration complete — safe to re-run`);

    await mongoose.disconnect();
}

migrate().catch((e) => {
    console.error("❌ Migration failed:", e.message);
    process.exit(1);
});
