import { PrismaClient, Role, DiscountType } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDirectory, "../../..");

const categorySeeds = [
  { name: "Rice & Grains", slug: "rice-grains", icon: "grain", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400" },
  { name: "Atta & Flour", slug: "atta-flour", icon: "wheat", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400" },
  { name: "Pulses & Dal", slug: "pulses-dal", icon: "beans", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400" },
  { name: "Cooking Oil & Ghee", slug: "cooking-oil-ghee", icon: "droplet", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400" },
  { name: "Spices & Masala", slug: "spices-masala", icon: "pepper", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400" },
  { name: "Packaged Foods", slug: "packaged-foods", icon: "package", image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=400" },
  { name: "Snacks & Biscuits", slug: "snacks-biscuits", icon: "cookie", image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=400" },
  { name: "Beverages", slug: "beverages", icon: "cup-soda", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400" },
  { name: "Dairy Products", slug: "dairy-products", icon: "milk", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400" },
  { name: "Dry Fruits & Nuts", slug: "dry-fruits-nuts", icon: "nut", image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=400" },
  { name: "Household Essentials", slug: "household-essentials", icon: "home", image: "https://images.unsplash.com/photo-1584824486516-0555a07fc511?auto=format&fit=crop&q=80&w=400" },
  { name: "Personal Care", slug: "personal-care", icon: "sparkles", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=400" }
];

const couponSeeds = [
  { code: "WELCOME50", discountType: DiscountType.FLAT, discountValue: 50, minOrderAmount: 499, maxUses: 200, usedCount: 0, expiresAt: new Date("2027-12-31"), isActive: true },
  { code: "FRESH10", discountType: DiscountType.PERCENT, discountValue: 10, minOrderAmount: 799, maxUses: 300, usedCount: 0, expiresAt: new Date("2027-12-31"), isActive: true },
  { code: "SAVE25", discountType: DiscountType.FLAT, discountValue: 25, minOrderAmount: 299, maxUses: 500, usedCount: 0, expiresAt: new Date("2027-12-31"), isActive: true }
];

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Clear database
  console.log("Cleaning existing database records...");
  await prisma.adminAuditLog.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productRating.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storeReview.deleteMany();
  await prisma.store.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();

  // 2. Insert Categories
  console.log("Inserting categories...");
  const categories: any[] = [];
  for (const cat of categorySeeds) {
    const created = await prisma.category.create({
      data: cat,
    });
    categories.push(created);
  }
  const categoryMap = new Map<string, string>(categories.map((c) => [c.slug, c.id]));

  // 3. Insert Coupons
  console.log("Inserting coupons...");
  for (const coupon of couponSeeds) {
    await prisma.coupon.create({
      data: coupon,
    });
  }

  // 4. Create Admin and Customer Users
  console.log("Creating demo admin and customer users...");
  const admin = await prisma.user.create({
    data: {
      name: "Mane Bazar Admin",
      email: "admin@manebazar.com",
      password: "$2a$12$BzuHjeTlrL7kfRN6e2f4i.RhN7eqlw.Da3deVZyqr2s.aCFNDoKQ6", // Admin@123
      role: Role.ADMIN,
      isVerified: true,
      addresses: {
        create: {
          label: "Store Main",
          street: "Kasegaon Main Road",
          city: "Kasegaon, Sangli",
          pincode: "415404",
          phone: "9876543210",
          isDefault: true,
        },
      },
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Rahul Mane",
      email: "user@manebazar.com",
      password: "$2a$12$sIIbwLIB9WRhgccW8ASlzeD9snhLrswx5XhWHxIgxyP67ljaMVnxe", // User@123
      role: Role.USER,
      isVerified: true,
      addresses: {
        create: {
          label: "Home",
          street: "Flat 202, Green Park Apartments, Station Road",
          city: "Sangli, Maharashtra",
          pincode: "416416",
          phone: "9876543211",
          isDefault: true,
        },
      },
    },
  });

  // 5. Create Default Store
  console.log("Creating default store...");
  const defaultStore = await prisma.store.create({
    data: {
      name: "Mane Bazar",
      slug: "mane-bazar",
      description: "Trusted neighborhood grocery with daily essentials, dairy, snacks, and quick reliable delivery. Managed by Atul Mane.",
      address: "Kasegaon, Kasegaon, Sangli-415404",
      city: "Kasegaon, Maharashtra",
      pincode: "415404",
      lat: 17.125265,
      lng: 74.187859,
      phone: "+919011189191",
      whatsapp: "+919011189191",
      images: [
        "https://content.jdmagicbox.com/comp/sangli/r9/9999px233.x233.171230110027.g1r9/catalogue/mane-bazar-kasegaon-sangli-sangli-grocery-stores-z1ykg3aw97.jpg",
        "https://content.jdmagicbox.com/comp/sangli/r9/9999px233.x233.171230110027.g1r9/catalogue/mane-bazar-kasegaon-sangli-sangli-grocery-stores-fu0y2ieiw8.jpg",
        "https://content.jdmagicbox.com/comp/sangli/r9/9999px233.x233.171230110027.g1r9/catalogue/mane-bazar-kasegaon-sangli-sangli-grocery-stores-4lvcl54a5v.jpg"
      ],
      categories: ["grocery", "general store", "daily needs", "supermarket"],
      rating: 4.1,
      totalReviews: 24,
      openingHours: "Mon-Fri: 7:30 AM - 8:00 PM, Sat: 8:30 AM - 1:00 PM, Sun: 7:30 AM - 8:00 PM",
      isOpen: true,
      deliveryRadiusKm: 25,
      estimatedDeliveryMin: 15,
      estimatedDeliveryMax: 45,
      ownerId: admin.id,
    },
  });

  // 6. Read and Insert Products
  const localSeedPath = path.join(currentDirectory, "../data/products.seed.json");
  const productsSeedPath = fs.existsSync(localSeedPath)
    ? localSeedPath
    : path.join(repositoryRoot, "packages/database/data/products.seed.json");
  if (fs.existsSync(productsSeedPath)) {
    console.log(`Reading products from ${productsSeedPath}...`);
    const rawData = fs.readFileSync(productsSeedPath, "utf-8");
    const parsedData = JSON.parse(rawData);

    if (parsedData.products && Array.isArray(parsedData.products)) {
      const categoryMapping: Record<string, string> = {
        cat_dairy: "dairy-products",
        cat_grains: "rice-grains",
        cat_packaged: "packaged-foods",
        cat_bakery: "packaged-foods",
        cat_spices: "spices-masala",
        cat_beverages: "beverages",
        cat_snacks: "snacks-biscuits",
      };

      console.log(`Mapping and inserting ${parsedData.products.length} products...`);
      for (const p of parsedData.products) {
        const mappedSlug = categoryMapping[p.category] || "packaged-foods";
        const catId = categoryMap.get(mappedSlug) || categories[0].id;

        const discount = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

        await prisma.product.create({
          data: {
            name: p.name,
            brand: p.brand || "Mane Bazar",
            categoryId: catId,
            storeId: defaultStore.id,
            slug: p.slug,
            price: Number(p.price),
            mrp: Number(p.originalPrice || p.price),
            discount: Number(discount),
            stock: Number(p.stock),
            lowStockThreshold: 10,
            image: p.image || "",
            images: p.image ? [p.image] : [],
            description: p.description || p.name,
            tags: p.tags || [],
            isActive: true,
            isDeleted: false,
          },
        });
      }
      console.log(`✅ Loaded ${parsedData.products.length} products successfully.`);
    }
  } else {
    console.warn("⚠️ Warning: products.seed.json not found. Skipping product seeding.");
  }

  console.log("🌱 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
