import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const resetDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    console.log("MongoDB Connected");

    // FIX: add null check
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection not available");
    }

    const collections = await db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`Cleared: ${collection.collectionName}`);
    }

    console.log("Database Reset Complete");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

resetDB();