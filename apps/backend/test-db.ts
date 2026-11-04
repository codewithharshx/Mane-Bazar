import dotenv from "dotenv";
dotenv.config();
console.log("DATABASE_URL:", process.env.DATABASE_URL);

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL");

    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);

    const productCount = await prisma.product.count();
    console.log(`Products: ${productCount}`);

    const categoryCount = await prisma.category.count();
    console.log(`Categories: ${categoryCount}`);

    const orderCount = await prisma.order.count();
    console.log(`Orders: ${orderCount}`);

    await prisma.$disconnect();
    console.log("✅ Disconnected");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
