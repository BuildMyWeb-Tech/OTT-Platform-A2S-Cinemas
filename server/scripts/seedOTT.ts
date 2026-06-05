/**
 * OTT Platform — Complete Seed Script
 * Seeds: Users, Categories, Movies, Purchases, Licenses
 * Run: npx tsx scripts/seedOTT.ts
 *
 * After running:
 *  User login:   testuser@a2s.com / test123456
 *  Admin login:  admin@a2s.com    / admin123456
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ─── Inline schemas (no import issues) ─────────────────────────────────────

const userSchema = new mongoose.Schema(
    {
        name: String,
        email: { type: String, unique: true },
        password: String,
        role: { type: String, default: "user" },
        isBlocked: { type: Boolean, default: false },
        purchasedMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
    },
    { timestamps: true }
);

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, unique: true },
        description: String,
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const movieSchema = new mongoose.Schema(
    {
        title: String,
        description: String,
        genre: String,
        price: Number,
        poster: String,
        videoKey: String,
        trailerUrl: String,
        duration: Number,
        expiryDays: Number,
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        ratings: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    },
    { timestamps: true }
);

const purchaseSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
        razorpayOrderId: String,
        razorpayPaymentId: String,
        amountPaid: Number,
        purchaseDate: { type: Date, default: Date.now },
        expiryDate: Date,
        status: { type: String, default: "active" },
    },
    { timestamps: true }
);

const licenseSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
        purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
        expiryDate: Date,
        isRevoked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Movie = mongoose.models.Movie || mongoose.model("Movie", movieSchema);
const Purchase = mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);
const License = mongoose.models.License || mongoose.model("License", licenseSchema);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const CATEGORIES_DATA = [
    { name: "Action", description: "High-octane action films" },
    { name: "Drama", description: "Compelling dramatic stories" },
    { name: "Comedy", description: "Light-hearted comedies" },
    { name: "Thriller", description: "Edge-of-your-seat thrillers" },
    { name: "Horror", description: "Horror and suspense films" },
    { name: "Romance", description: "Romantic films" },
    { name: "SciFi", description: "Science fiction films" },
    { name: "Documentary", description: "Documentaries and real stories" },
];

// Using real poster images from TMDB/public sources
const MOVIES_DATA = [
    {
        title: "Thunder Strike",
        description: "An elite soldier must stop a rogue nuclear weapon before it destroys three major cities. Racing against time through enemy territory, he uncovers a conspiracy that reaches the highest levels of government.",
        genre: "Action",
        price: 49,
        poster: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&q=80",
        videoKey: "videos/thunder-strike.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: 118,
        expiryDays: 30,
        isFeatured: true,
        ratings: { average: 4.5, count: 1240 },
    },
    {
        title: "The Last Sunrise",
        description: "A retired detective in a coastal town gets drawn back into the world of crime when a series of mysterious deaths shake the community. A haunting story of justice, loss, and redemption.",
        genre: "Drama",
        price: 39,
        poster: "https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=400&q=80",
        videoKey: "videos/last-sunrise.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        duration: 135,
        expiryDays: 45,
        isFeatured: true,
        ratings: { average: 4.7, count: 890 },
    },
    {
        title: "Chaos Theory",
        description: "A brilliant mathematician discovers a pattern in the chaos of city crime. When he tries to expose it, the criminals come for him. A mind-bending thriller with twists at every turn.",
        genre: "Thriller",
        price: 59,
        poster: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&q=80",
        videoKey: "videos/chaos-theory.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: 122,
        expiryDays: 30,
        isFeatured: true,
        ratings: { average: 4.3, count: 2100 },
    },
    {
        title: "Laugh Factory",
        description: "Three best friends accidentally stumble into a million-dollar scheme while trying to save their struggling comedy club. A hilarious ride full of unexpected twists and genuine laughs.",
        genre: "Comedy",
        price: 29,
        poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80",
        videoKey: "videos/laugh-factory.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        duration: 98,
        expiryDays: 30,
        isFeatured: true,
        ratings: { average: 4.1, count: 560 },
    },
    {
        title: "Parallel Worlds",
        description: "A quantum physicist accidentally opens a portal to parallel dimensions. Each world she visits is slightly different — and increasingly dangerous. A stunning visual sci-fi epic.",
        genre: "SciFi",
        price: 69,
        poster: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80",
        videoKey: "videos/parallel-worlds.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
        duration: 145,
        expiryDays: 60,
        isFeatured: true,
        ratings: { average: 4.8, count: 3200 },
    },
    {
        title: "Midnight Whispers",
        description: "Two strangers meet every night at the same cafe at midnight. What starts as accidental encounters blossoms into a beautiful, complicated love story set against the backdrop of a rainy city.",
        genre: "Romance",
        price: 35,
        poster: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80",
        videoKey: "videos/midnight-whispers.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        duration: 108,
        expiryDays: 30,
        isFeatured: false,
        ratings: { average: 4.4, count: 780 },
    },
    {
        title: "The Forgotten Valley",
        description: "A documentary crew ventures deep into a remote valley to film a dying indigenous culture. What they find there changes everything they thought they knew about human civilization.",
        genre: "Documentary",
        price: 25,
        poster: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80",
        videoKey: "videos/forgotten-valley.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
        duration: 92,
        expiryDays: 30,
        isFeatured: false,
        ratings: { average: 4.6, count: 430 },
    },
    {
        title: "Shadow Protocol",
        description: "When a top-secret government AI goes rogue, a cybersecurity expert must enter the virtual world to shut it down from the inside. A high-stakes battle between human and machine.",
        genre: "Action",
        price: 55,
        poster: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
        videoKey: "videos/shadow-protocol.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        duration: 128,
        expiryDays: 30,
        isFeatured: false,
        ratings: { average: 4.2, count: 1560 },
    },
    {
        title: "Blood Moon Rising",
        description: "A small village is terrorized every full moon. The new town doctor discovers the terrifying truth behind the legend — and realizes she may already be infected. A chilling horror experience.",
        genre: "Horror",
        price: 45,
        poster: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        videoKey: "videos/blood-moon.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
        duration: 102,
        expiryDays: 30,
        isFeatured: false,
        ratings: { average: 3.9, count: 920 },
    },
    {
        title: "Echoes of Tomorrow",
        description: "A widowed father receives messages from his late wife through a mysterious radio signal — and discovers she has been trying to warn him about a disaster that hasn't happened yet.",
        genre: "Drama",
        price: 42,
        poster: "https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=400&q=80",
        videoKey: "videos/echoes-tomorrow.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: 117,
        expiryDays: 45,
        isFeatured: false,
        ratings: { average: 4.5, count: 670 },
    },
    {
        title: "Neon City Blues",
        description: "A jazz musician in a futuristic city stumbles onto a black market organ trade. Blending neo-noir aesthetics with a soulful story about identity, survival, and music.",
        genre: "Thriller",
        price: 52,
        poster: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
        videoKey: "videos/neon-city.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        duration: 131,
        expiryDays: 30,
        isFeatured: false,
        ratings: { average: 4.0, count: 1100 },
    },
    {
        title: "The Wedding Crashers 2",
        description: "The gang is back — older, slightly wiser, and crashing weddings again. But this time, one of them is the groom. A riotously funny sequel that delivers even more laughs.",
        genre: "Comedy",
        price: 32,
        poster: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80",
        videoKey: "videos/wedding-crashers.mp4",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: 104,
        expiryDays: 30,
        isFeatured: false,
        ratings: { average: 3.8, count: 450 },
    },
];

// ─── Main Seed Function ────────────────────────────────────────────────────

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ MONGODB_URI not set in .env");
        process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("✅ Connected\n");

    // ── 1. Clear existing seed data ──────────────────────────────────────────
    console.log("🧹 Clearing old seed data...");
    await License.deleteMany({});
    await Purchase.deleteMany({});
    await Movie.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({ email: { $in: ["testuser@a2s.com", "admin@a2s.com", "expireduser@a2s.com"] } });
    console.log("✅ Cleared\n");

    // ── 2. Create Users ───────────────────────────────────────────────────────
    console.log("👤 Creating users...");

    const userPassword = await bcrypt.hash("test123456", 12);
    const adminPassword = await bcrypt.hash("admin123456", 12);

    const testUser = await User.create({
        name: "Test User",
        email: "testuser@a2s.com",
        password: userPassword,
        role: "user",
        isBlocked: false,
        purchasedMovies: [],
    });

    const adminUser = await User.create({
        name: "Admin User",
        email: "admin@a2s.com",
        password: adminPassword,
        role: "admin",
        isBlocked: false,
        purchasedMovies: [],
    });

    console.log(`  ✅ User:  testuser@a2s.com / test123456`);
    console.log(`  ✅ Admin: admin@a2s.com    / admin123456\n`);

    // ── 3. Create Categories ──────────────────────────────────────────────────
    console.log("🎭 Creating categories...");
    const categories: Record<string, any> = {};
    for (const cat of CATEGORIES_DATA) {
        const created = await Category.create(cat);
        categories[cat.name] = created._id;
        console.log(`  ✅ ${cat.name}`);
    }
    console.log("");

    // ── 4. Create Movies ──────────────────────────────────────────────────────
    console.log("🎬 Creating movies...");
    const createdMovies: any[] = [];
    for (const movieData of MOVIES_DATA) {
        const genreName = movieData.genre;
        const movie = await Movie.create({
            ...movieData,
            categoryId: categories[genreName] || null,
        });
        createdMovies.push(movie);
        console.log(`  ✅ ${movie.title} (${movie.genre}) — ₹${movie.price}`);
    }
    console.log("");

    // ── 5. Create Purchases & Licenses for test user ─────────────────────────
    console.log("💳 Creating purchases and licenses for test user...");

    // Active license — movie 0 (Thunder Strike) — expires in 30 days
    const activeMovie = createdMovies[0];
    const activeExpiry = new Date();
    activeExpiry.setDate(activeExpiry.getDate() + 30);

    const activePurchase = await Purchase.create({
        user: testUser._id,
        movie: activeMovie._id,
        razorpayOrderId: "order_seed_active_001",
        razorpayPaymentId: "pay_seed_active_001",
        amountPaid: activeMovie.price,
        purchaseDate: new Date(),
        expiryDate: activeExpiry,
        status: "active",
    });

    await License.create({
        user: testUser._id,
        movie: activeMovie._id,
        purchase: activePurchase._id,
        expiryDate: activeExpiry,
        isRevoked: false,
    });

    await User.findByIdAndUpdate(testUser._id, {
        $addToSet: { purchasedMovies: activeMovie._id },
    });

    console.log(`  ✅ Active license: "${activeMovie.title}" — expires ${activeExpiry.toDateString()}`);

    // Active license — movie 1 (The Last Sunrise) — expires in 7 days (warning state)
    const warningMovie = createdMovies[1];
    const warningExpiry = new Date();
    warningExpiry.setDate(warningExpiry.getDate() + 7);

    const warningPurchase = await Purchase.create({
        user: testUser._id,
        movie: warningMovie._id,
        razorpayOrderId: "order_seed_warning_002",
        razorpayPaymentId: "pay_seed_warning_002",
        amountPaid: warningMovie.price,
        purchaseDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000), // bought 38 days ago
        expiryDate: warningExpiry,
        status: "active",
    });

    await License.create({
        user: testUser._id,
        movie: warningMovie._id,
        purchase: warningPurchase._id,
        expiryDate: warningExpiry,
        isRevoked: false,
    });

    await User.findByIdAndUpdate(testUser._id, {
        $addToSet: { purchasedMovies: warningMovie._id },
    });

    console.log(`  ✅ Warning license (7d left): "${warningMovie.title}"`);

    // Expired license — movie 2 (Chaos Theory) — expired 5 days ago
    const expiredMovie = createdMovies[2];
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 5);

    const expiredPurchase = await Purchase.create({
        user: testUser._id,
        movie: expiredMovie._id,
        razorpayOrderId: "order_seed_expired_003",
        razorpayPaymentId: "pay_seed_expired_003",
        amountPaid: expiredMovie.price,
        purchaseDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        expiryDate: expiredDate,
        status: "expired",
    });

    await License.create({
        user: testUser._id,
        movie: expiredMovie._id,
        purchase: expiredPurchase._id,
        expiryDate: expiredDate,
        isRevoked: false,
    });

    await User.findByIdAndUpdate(testUser._id, {
        $addToSet: { purchasedMovies: expiredMovie._id },
    });

    console.log(`  ✅ Expired license: "${expiredMovie.title}" — expired ${expiredDate.toDateString()}`);

    // Revoked license — movie 3 (Laugh Factory)
    const revokedMovie = createdMovies[3];
    const revokedExpiry = new Date();
    revokedExpiry.setDate(revokedExpiry.getDate() + 20);

    const revokedPurchase = await Purchase.create({
        user: testUser._id,
        movie: revokedMovie._id,
        razorpayOrderId: "order_seed_revoked_004",
        razorpayPaymentId: "pay_seed_revoked_004",
        amountPaid: revokedMovie.price,
        purchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        expiryDate: revokedExpiry,
        status: "active",
    });

    await License.create({
        user: testUser._id,
        movie: revokedMovie._id,
        purchase: revokedPurchase._id,
        expiryDate: revokedExpiry,
        isRevoked: true, // admin revoked this
    });

    console.log(`  ✅ Revoked license: "${revokedMovie.title}"`);
    console.log("");

    // ── 6. Summary ────────────────────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log("✅ SEED COMPLETE");
    console.log("═══════════════════════════════════════════════════");
    console.log("");
    console.log("📱 TEST ACCOUNTS:");
    console.log("  Regular User:  testuser@a2s.com    / test123456");
    console.log("  Admin User:    admin@a2s.com        / admin123456");
    console.log("");
    console.log("📦 SEEDED DATA:");
    console.log(`  Categories: ${CATEGORIES_DATA.length}`);
    console.log(`  Movies:     ${createdMovies.length}`);
    console.log(`  Purchases:  4 (active, warning, expired, revoked)`);
    console.log(`  Licenses:   4`);
    console.log("");
    console.log("🎬 MOVIES AVAILABLE:");
    createdMovies.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.title} (${m.genre}) — ₹${m.price}`);
    });
    console.log("");
    console.log("💳 TEST USER LICENSES:");
    console.log(`  ACTIVE  (30d):  "${activeMovie.title}"`);
    console.log(`  WARNING  (7d):  "${warningMovie.title}"`);
    console.log(`  EXPIRED (-5d):  "${expiredMovie.title}"`);
    console.log(`  REVOKED:        "${revokedMovie.title}"`);
    console.log("");
    console.log("🧪 PHASE 5 TEST COVERAGE:");
    console.log("  TC-AUTH    ✅  testuser@a2s.com / test123456");
    console.log("  TC-HOME    ✅  12 movies + 5 featured banners");
    console.log("  TC-BROWSE  ✅  8 genres, search, filter");
    console.log("  TC-MOVIE   ✅  Buy = movies 4-12, Watch = movie 1");
    console.log("  TC-PAYMENT ✅  Buy any of movies 4-12");
    console.log("  TC-PLAYER  ✅  Watch Thunder Strike (movie 1)");
    console.log("  TC-LIBRARY ✅  Active, Warning, Expired, Revoked");
    console.log("  TC-PROFILE ✅  User info, Purchase History");
    console.log("═══════════════════════════════════════════════════");

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    mongoose.disconnect();
    process.exit(1);
});