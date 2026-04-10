const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

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
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      process.env.MONGO_URI = mongoUri;
      process.env.USE_MEMORY_DB = "true";
      console.log("✅ Using in-memory MongoDB for local development");
    } else {
      console.log("✅ Using MongoDB Atlas connection");
    }

    const connection = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;
