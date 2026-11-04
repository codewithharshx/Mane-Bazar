const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Order = require("../models/Order");

let memoryServer;

const READY_STATE_LABELS = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};

const isPlaceholderUri = (uri = "") =>
  !uri ||
  uri.includes("your_mongodb_connection_string");

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // Use in-memory MongoDB if explicitly enabled or if URI is placeholder/missing
    const useMemoryDB = 
      process.env.MONGODB_MEMORY_SERVER === "true" || 
      isPlaceholderUri(mongoUri);

    if (useMemoryDB) {
      memoryServer = await MongoMemoryReplSet.create({
        replSet: { count: 1 }
      });
      mongoUri = memoryServer.getUri();
      process.env.MONGO_URI = mongoUri;
      process.env.USE_MEMORY_DB = "true";
      console.log("✅ Using in-memory MongoDB for local development");
    } else {
      console.log("✅ Using MongoDB Atlas connection");
    }

    const connection = await mongoose.connect(mongoUri);

    try {
      const indexes = await Order.collection.indexes();
      const pendingTtlIndex = indexes.find(
        (index) =>
          index.key?.pendingPaymentExpiry === 1 &&
          index.expireAfterSeconds === 0
      );

      if (pendingTtlIndex?.name) {
        await Order.collection.dropIndex(pendingTtlIndex.name);
        console.log(`✅ Dropped legacy index: ${pendingTtlIndex.name}`);
      }
    } catch (error) {
      console.warn("⚠️ Could not verify/drop legacy pending payment TTL index:", error.message);
    }

    console.log(`✅ MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

const getDbHealth = () => {
  const state = mongoose.connection.readyState;
  return {
    readyState: state,
    state: READY_STATE_LABELS[state] || "unknown",
    host: mongoose.connection.host || "",
    name: mongoose.connection.name || ""
  };
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getDbHealth
};
