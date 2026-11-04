const dotenv = require("dotenv");
const { connectDB } = require("../config/db");
const { seedDatabase: runSeedData } = require("../utils/seedData");

dotenv.config();

const seedDatabase = async () => {
  await connectDB();
  await runSeedData({ clearExisting: true });
  console.log("Seed data inserted successfully");
  process.exit(0);
};

seedDatabase().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
