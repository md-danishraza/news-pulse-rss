const { MongoClient } = require("mongodb");
require("dotenv").config();

let client = null;
let db = null;

async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    // Get database name from env or use default
    const dbName = process.env.DATABASE_NAME || "news_pulse";
    db = client.db(dbName);

    console.log(`✅ Connected to MongoDB database: ${dbName}`);
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

module.exports = { connectDB, getDB };
