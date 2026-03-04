/**
 * StoryTeller MongoDB helpers for Node serverless.
 *
 * Provides a cached MongoDB client and collection accessors.
 * This avoids reconnecting on every serverless invocation.
 */

import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

/**
 * Get or create a MongoDB client.
 *
 * @returns {Promise<MongoClient>} Connected MongoDB client
 * @throws {Error} If MONGODB_URL is missing or connection fails
 */
export async function getDbClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const mongodbUrl = process.env.MONGODB_URL;
  if (!mongodbUrl) {
    throw new Error("MONGODB_URL environment variable not set");
  }

  const timeoutMs = Number(process.env.MONGODB_TIMEOUT_MS || "30000");

  cachedClient = new MongoClient(mongodbUrl, {
    serverSelectionTimeoutMS: timeoutMs,
    connectTimeoutMS: timeoutMs,
    socketTimeoutMS: timeoutMs,
    retryWrites: true,
    maxPoolSize: 10,
  });

  await cachedClient.connect();
  await cachedClient.db("admin").command({ ping: 1 });

  return cachedClient;
}

/**
 * Get the storyteller database instance.
 *
 * @returns {Promise<import("mongodb").Db>} MongoDB database
 */
export async function getDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await getDbClient();
  cachedDb = client.db("storyteller");
  return cachedDb;
}

/**
 * Get users collection.
 *
 * @returns {Promise<import("mongodb").Collection>} Users collection
 */
export async function getUsersCollection() {
  const db = await getDatabase();
  return db.collection("users");
}

/**
 * Get stories collection.
 *
 * @returns {Promise<import("mongodb").Collection>} Stories collection
 */
export async function getStoriesCollection() {
  const db = await getDatabase();
  return db.collection("stories");
}
