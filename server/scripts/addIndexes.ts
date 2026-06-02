import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function createIndexesSafe(
  collection: any,
  indexes: any[],
  label: string
) {
  try {
    const existingIndexes = await collection.indexes();

    const existingKeys = existingIndexes.map(
      (idx: any) => JSON.stringify(idx.key)
    );

    const indexesToCreate = indexes.filter(
      (idx) => {
        const keyString = JSON.stringify(idx.key);

        return !existingKeys.includes(keyString);
      }
    );

    if (indexesToCreate.length === 0) {
      console.log(
        `⚠️ ${label}: All indexes already exist`
      );

      return;
    }

    await collection.createIndexes(
      indexesToCreate
    );

    console.log(
      `✅ ${label}: ${indexesToCreate.length} index(es) created`
    );
  } catch (error: any) {
    console.error(
      `❌ ${label}: Failed to create indexes`
    );

    console.error(error.message);
  }
}

async function addIndexes() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI missing in .env"
      );
    }

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      "🔌 Connected to MongoDB"
    );

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error(
        "Database connection unavailable"
      );
    }

    // ---------------------------------------------------
    // MOVIES
    // ---------------------------------------------------

    await createIndexesSafe(
      db.collection("movies"),
      [
        {
          key: { isActive: 1 },
          name: "movies_isActive",
        },
        {
          key: { genre: 1 },
          name: "movies_genre",
        },
        {
          key: { isFeatured: 1 },
          name: "movies_isFeatured",
        },
        {
          key: { createdAt: -1 },
          name: "movies_createdAt_desc",
        },
      ],
      "Movies"
    );

    // ---------------------------------------------------
    // LICENSES
    // ---------------------------------------------------

    await createIndexesSafe(
      db.collection("licenses"),
      [
        {
          key: {
            user: 1,
            movie: 1,
          },
          name: "licenses_user_movie",
        },
        {
          key: { user: 1 },
          name: "licenses_user",
        },
        {
          key: { expiryDate: 1 },
          name: "licenses_expiry",
        },
        {
          key: { isRevoked: 1 },
          name: "licenses_revoked",
        },
      ],
      "Licenses"
    );

    // ---------------------------------------------------
    // PURCHASES
    // ---------------------------------------------------

    await createIndexesSafe(
      db.collection("purchases"),
      [
        {
          key: { user: 1 },
          name: "purchases_user",
        },
        {
          key: { status: 1 },
          name: "purchases_status",
        },
        {
          key: { createdAt: -1 },
          name: "purchases_createdAt_desc",
        },
        {
          key: { razorpayOrderId: 1 },
          name: "purchases_orderId",
          unique: true,
          sparse: true,
        },
      ],
      "Purchases"
    );

    // ---------------------------------------------------
    // USERS
    // ---------------------------------------------------

    await createIndexesSafe(
      db.collection("users"),
      [
        {
          key: { email: 1 },
          name: "users_email",
          unique: true,
        },
        {
          key: { isBlocked: 1 },
          name: "users_isBlocked",
        },
      ],
      "Users"
    );

    // ---------------------------------------------------
    // CATEGORIES
    // ---------------------------------------------------

    await createIndexesSafe(
      db.collection("categories"),
      [
        {
          key: { isActive: 1 },
          name: "categories_isActive",
        },
      ],
      "Categories"
    );

    console.log(
      "\n🎉 MongoDB index setup completed successfully"
    );

    console.log(
      "Safe to run multiple times."
    );

    await mongoose.disconnect();

    console.log(
      "🔌 MongoDB disconnected"
    );
  } catch (error: any) {
    console.error(
      "\n❌ Index setup failed"
    );

    console.error(error.message);

    process.exit(1);
  }
}

addIndexes();
