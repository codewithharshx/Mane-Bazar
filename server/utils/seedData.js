const fs = require('fs');
const path = require('path');
const Category = require("../models/Category");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const Store = require("../models/Store");
const User = require("../models/User");

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stockForIndex = (index) => 20 + ((index * 17) % 181);

const categorySeeds = [
  { name: "Rice & Grains", slug: "rice-grains", icon: "grain", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400" },
  { name: "Atta & Flour", slug: "atta-flour", icon: "wheat", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400" },
  { name: "Pulses & Dal", slug: "pulses-dal", icon: "beans", image: "https://images.unsplash.com/photo-1600626337887-21a8cd34842a?auto=format&fit=crop&q=80&w=400" },
  { name: "Cooking Oil & Ghee", slug: "cooking-oil-ghee", icon: "droplet", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400" },
  { name: "Spices & Masala", slug: "spices-masala", icon: "pepper", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400" },
  { name: "Packaged Foods", slug: "packaged-foods", icon: "package", image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=400" },
  { name: "Snacks & Biscuits", slug: "snacks-biscuits", icon: "cookie", image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=400" },
  { name: "Beverages", slug: "beverages", icon: "cup-soda", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400" },
  { name: "Dairy Products", slug: "dairy-products", icon: "milk", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400" },
  { name: "Dry Fruits & Nuts", slug: "dry-fruits-nuts", icon: "nut", image: "https://images.unsplash.com/photo-1599557434557-418ca100b21a?auto=format&fit=crop&q=80&w=400" },
  { name: "Household Essentials", slug: "household-essentials", icon: "home", image: "https://images.unsplash.com/photo-1584824486516-0555a07fc511?auto=format&fit=crop&q=80&w=400" },
  { name: "Personal Care", slug: "personal-care", icon: "sparkles", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=400" }
];

const productBlueprints = [
  { category: "rice-grains", items: [["India Gate Basmati Rice 5kg", "India Gate", 699, 799, ["basmati", "premium", "rice"]], ["Sona Masoori Rice 5kg", "24 Mantra", 445, 520, ["sona masoori", "daily", "rice"]], ["Aval Poha Thick 1kg", "Tata Sampann", 79, 95, ["poha", "breakfast", "flattened rice"]], ["Fine Rava Semolina 1kg", "Pillsbury", 62, 72, ["semolina", "rava", "upma"]], ["Brown Rice 1kg", "Daawat", 129, 149, ["brown rice", "healthy", "grains"]]] },
  { category: "atta-flour", items: [["Aashirvaad Whole Wheat Atta 5kg", "Aashirvaad", 289, 335, ["atta", "wheat flour", "chapati"]], ["Fortune Chakki Fresh Atta 5kg", "Fortune", 275, 320, ["atta", "fresh", "roti"]], ["Besan Gram Flour 1kg", "Tata Sampann", 108, 125, ["besan", "gram flour", "pakora"]], ["Maida Refined Flour 1kg", "Pillsbury", 68, 80, ["maida", "baking", "refined flour"]], ["Ragi Flour 500g", "24 Mantra", 74, 90, ["ragi", "millet", "healthy flour"]]] },
  { category: "pulses-dal", items: [["Toor Dal 1kg", "Tata Sampann", 164, 185, ["toor dal", "arhar", "protein"]], ["Moong Dal 1kg", "Fortune", 138, 158, ["moong dal", "yellow dal", "protein"]], ["Chana Dal 1kg", "BB Royal", 92, 108, ["chana dal", "dal", "lentils"]], ["Rajma Chitra 1kg", "Organic Tattva", 152, 175, ["rajma", "beans", "kidney beans"]], ["Kabuli Chana 1kg", "Tata Sampann", 140, 162, ["kabuli chana", "chickpeas", "protein"]]] },
  { category: "cooking-oil-ghee", items: [["Saffola Gold Oil 1L", "Saffola", 189, 220, ["oil", "heart care", "refined"]], ["Fortune Sunlite Oil 1L", "Fortune", 162, 190, ["sunflower oil", "cooking oil"]], ["Amul Pure Ghee 1L", "Amul", 679, 755, ["ghee", "desi ghee", "pure"]], ["Parachute Coconut Oil 500ml", "Parachute", 198, 225, ["coconut oil", "cooking", "multipurpose"]], ["Dhara Mustard Oil 1L", "Dhara", 186, 210, ["mustard oil", "kachi ghani", "cooking"]]] },
  { category: "spices-masala", items: [["MDH Garam Masala 100g", "MDH", 82, 95, ["garam masala", "spices"]], ["Everest Turmeric Powder 200g", "Everest", 56, 65, ["turmeric", "haldi"]], ["Tata Salt 1kg", "Tata", 28, 32, ["salt", "iodized"]], ["Red Chilli Powder 200g", "Aachi", 74, 88, ["red chilli", "spice"]], ["Coriander Powder 200g", "Catch", 68, 78, ["coriander", "dhania powder"]]] },
  { category: "packaged-foods", items: [["Maggi 2-Minute Noodles 12 Pack", "Maggi", 168, 180, ["noodles", "instant food"]], ["MTR Ready To Eat Rajma Chawal", "MTR", 98, 115, ["ready meal", "rajma chawal"]], ["Haldiram Moong Dal Namkeen 400g", "Haldiram", 118, 135, ["namkeen", "packaged"]], ["Kellogg's Corn Flakes 875g", "Kellogg's", 359, 399, ["breakfast cereal", "corn flakes"]], ["Top Ramen Curry Noodles 6 Pack", "Top Ramen", 88, 102, ["ramen", "instant noodles"]]] },
  { category: "snacks-biscuits", items: [["Parle-G Gold Biscuits 1kg", "Parle", 142, 160, ["biscuits", "tea snack"]], ["Oreo Vanilla Creme Pack", "Oreo", 38, 45, ["oreo", "cookies"]], ["Lay's Magic Masala 82g", "Lay's", 46, 50, ["chips", "snacks"]], ["Kurkure Masala Munch 90g", "Kurkure", 22, 25, ["kurkure", "snacks"]], ["Britannia Good Day Butter 600g", "Britannia", 138, 155, ["good day", "biscuits"]]] },
  { category: "beverages", items: [["Tata Tea Gold 500g", "Tata Tea", 298, 335, ["tea", "leaf tea"]], ["Nescafe Classic 200g", "Nescafe", 345, 379, ["coffee", "instant coffee"]], ["Bru Instant Coffee 100g", "Bru", 188, 215, ["coffee", "bru"]], ["Pepsi PET Bottle 2.25L", "Pepsi", 99, 110, ["soft drink", "cola"]], ["Real Mixed Fruit Juice 1L", "Real", 122, 135, ["juice", "fruit drink"]]] },
  { category: "dairy-products", items: [["Amul Taaza Milk 1L", "Amul", 68, 72, ["milk", "dairy"]], ["Amul Fresh Curd 400g", "Amul", 42, 48, ["curd", "dahi"]], ["Amul Paneer 200g", "Amul", 92, 102, ["paneer", "protein"]], ["Amul Butter 500g", "Amul", 292, 320, ["butter", "salted"]], ["Amul Cheese Slices 200g", "Amul", 128, 142, ["cheese", "slices"]]] },
  { category: "dry-fruits-nuts", items: [["Whole Cashews 500g", "Nutraj", 448, 520, ["cashews", "dry fruits"]], ["California Almonds 500g", "Happilo", 429, 499, ["almonds", "nuts"]], ["Raisins Premium 250g", "Tulsi", 118, 136, ["raisins", "kishmish"]], ["Pistachios Roasted 250g", "Happilo", 298, 345, ["pistachios", "nuts"]], ["Walnut Kernels 250g", "Nutraj", 312, 360, ["walnuts", "brain food"]]] },
  { category: "household-essentials", items: [["Surf Excel Easy Wash 1kg", "Surf Excel", 238, 265, ["detergent", "laundry"]], ["Vim Dishwash Gel 750ml", "Vim", 168, 185, ["dishwash", "kitchen care"]], ["Harpic Toilet Cleaner 1L", "Harpic", 188, 210, ["toilet cleaner", "bathroom"]], ["Lizol Citrus Floor Cleaner 1L", "Lizol", 176, 198, ["floor cleaner", "disinfectant"]], ["Colin Glass Cleaner 500ml", "Colin", 96, 110, ["glass cleaner", "home care"]]] },
  { category: "personal-care", items: [["Dove Cream Beauty Bathing Bar 4 Pack", "Dove", 224, 260, ["soap", "beauty bar"]], ["Head & Shoulders Anti Dandruff Shampoo 340ml", "Head & Shoulders", 298, 340, ["shampoo", "anti dandruff"]], ["Colgate Strong Teeth Toothpaste 500g", "Colgate", 189, 215, ["toothpaste", "oral care"]], ["Vaseline Deep Moisture Lotion 400ml", "Vaseline", 268, 299, ["body lotion", "moisturizer"]], ["Pears Pure And Gentle Soap 3 Pack", "Pears", 142, 165, ["soap", "glycerine"]]] }
];

const couponSeeds = [
  { code: "WELCOME50", discountType: "flat", discountValue: 50, minOrderAmount: 499, maxUses: 200, usedCount: 0, expiresAt: new Date("2027-12-31"), isActive: true },
  { code: "FRESH10", discountType: "percent", discountValue: 10, minOrderAmount: 799, maxUses: 300, usedCount: 0, expiresAt: new Date("2027-12-31"), isActive: true },
  { code: "SAVE25", discountType: "flat", discountValue: 25, minOrderAmount: 299, maxUses: 500, usedCount: 0, expiresAt: new Date("2027-12-31"), isActive: true }
];

const catJSONMap = {
  "Rice": "rice-grains",
  "Spices": "spices-masala",
  "Pulses & Grains": "pulses-dal",
  "Packaged Foods": "packaged-foods",
  "Dairy & Bakery": "dairy-products",
  "Beverages": "beverages",
  "Snacks": "snacks-biscuits",
  "Oils & Ghee": "cooking-oil-ghee"
};

const createProductSeeds = (categoryMap, storeId) => {
  const items = [];
  const slugify = (str) => str.toLowerCase().replace(/[^\w-]+/g, '-').replace(/-+/g, '-');
  
  // Try loading from new products.seed.json first
  const productsPath = path.join(__dirname, '..', 'data', 'products.seed.json');
  if (fs.existsSync(productsPath)) {
    try {
      const rawData = fs.readFileSync(productsPath);
      const seedData = JSON.parse(rawData);
      
      if (seedData.products && Array.isArray(seedData.products)) {
        const categoryMapping = {
          'cat_fruits': 'fruits',
          'cat_vegetables': 'fruits',
          'cat_dairy': 'dairy-products',
          'cat_grains': 'pulses-dal',
          'cat_packaged': 'packaged-foods',
          'cat_bakery': 'packaged-foods'
        };
        
        seedData.products.forEach((product, index) => {
          const mappedCategory = categoryMapping[product.category] || 'packaged-foods';
          let catId = categoryMap.get(mappedCategory);
          
          if (!catId) {
            for (const [slug, id] of categoryMap.entries()) {
              if (slug.includes(mappedCategory.split('-')[0])) {
                catId = id;
                break;
              }
            }
          }
          
          if (!catId) {
            catId = categoryMap.values().next().value;
          }
          
          items.push({
            name: product.name,
            brand: product.brand || 'Mane Bazar',
            category: catId,
            storeId,
            slug: product.slug || (slugify(product.name) + "-" + index),
            price: product.price,
            mrp: product.originalPrice || product.price,
            discount: product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
            stock: product.stock,
            lowStockThreshold: 10,
            image: product.image,
            images: [product.image],
            description: product.description,
            tags: product.tags || [],
            rating: product.rating || 0,
            reviews: product.reviews || 0,
            isActive: true
          });
        });
        console.log(`✅ Loaded ${items.length} products from products.seed.json`);
        return items;
      }
    } catch (error) {
      console.warn("Failed to load products.seed.json:", error.message);
    }
  }
  
  return items;
};

const clearDatabase = async () => {
  await Promise.all([
    User.deleteMany(),
    Store.deleteMany(),
    Category.deleteMany(),
    Product.deleteMany(),
    Coupon.deleteMany()
  ]);
};

const seedDatabase = async ({ clearExisting = true } = {}) => {
  if (clearExisting) {
    await clearDatabase();
  }

  const categories = await Category.insertMany(categorySeeds);
  const categoryMap = new Map(categories.map((category) => [category.slug, category._id]));

  await Coupon.insertMany(couponSeeds);

  const admin = await User.create({
    name: "Mane Bazar Admin",
    email: "admin@manebazar.com",
    password: "Admin@123",
    role: "admin",
    isVerified: true,
    addresses: [
      {
        label: "Store",
        street: "Kasegaon Main Road",
        city: "Kasegaon, Sangli",
        pincode: "415404",
        phone: "9876543210",
        isDefault: true
      }
    ]
  });

  const defaultStore = await Store.create({
    name: "Mane Bazar",
    slug: "mane-bazar",
    description: "Trusted neighborhood grocery with daily essentials, dairy, snacks, and quick reliable delivery. Managed by Atul Mane.",
    address: "Kasegaon, Kasegaon, Sangli-415404",
    city: "Kasegaon, Maharashtra",
    pincode: "415404",
    location: {
      type: "Point",
      coordinates: [74.187859, 17.125265]
    },
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
    owner: admin._id
  });

  await Product.insertMany(createProductSeeds(categoryMap, defaultStore._id));
};

const ensureSeeded = async () => {
  const hasProducts = await Product.exists({});
  const hasStores = await Store.exists({});

  if (!hasProducts || !hasStores) {
    await seedDatabase({ clearExisting: false });
  }
  console.log("✅ Database seed check complete.");
};

module.exports = {
  seedDatabase,
  ensureSeeded
};
