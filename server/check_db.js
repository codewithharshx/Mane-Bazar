const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const checkData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log("Checking URI:", mongoUri);
    if (mongoUri.includes("localhost") || process.env.USE_MEMORY_DB === "true") {
      console.log("Using memory DB, cannot check from outside.");
      process.exit(0);
    }
    await mongoose.connect(mongoUri);
    const Product = mongoose.model("Product", new mongoose.Schema({}));
    const count = await Product.countDocuments();
    console.log("Product count:", count);
    process.exit(0);
  } catch (error) {
    console.error("Check failed:", error.message);
    process.exit(1);
  }
};

checkData();
