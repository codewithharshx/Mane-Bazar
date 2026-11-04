const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'data', 'catalog.seed.json');

const ensureOutputDirectory = () => {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
};

const generateDataset = () => {
    const dataset = [];

    const categories = {
        "Rice": {
            brands: ["India Gate", "Daawat", "Kohinoor", "Organic Tattva", "24 Mantra", "Patanjali", "Fortune", "Local"],
            items: [
                "Basmati Rice", "Kolam Rice", "Sona Masoori", "Brown Rice",
                "Black Rice", "Red Rice", "Jasmine Rice", "Sticky Rice",
                "Idli Rice", "Ponni Rice", "Organic Rice", "Broken Rice",
                "Dubraj Rice", "Gobindobhog Rice", "Matta Rice", "Wada Kolam Rice",
                "Jeera Samba Rice", "Bamboo Rice", "Banskathi Rice", "Miniket Rice",
                "Indrayani Rice", "Ambemohar Rice", "Seeraga Samba Rice", "HMT Kolam Rice"
            ],
            units: ["1kg", "5kg", "10kg", "25kg"],
            priceRange: [60, 250],
            images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600"]
        },
        "Spices": {
            brands: ["Everest", "MDH", "Catch", "Suhana", "Ramdev", "Patanjali", "Tata Sampann", "Organic India"],
            items: [
                "Turmeric Powder", "Red Chilli Powder", "Garam Masala", "Cumin Seeds",
                "Coriander Powder", "Mustard Seeds", "Black Pepper", "Cardamom",
                "Cloves", "Cinnamon", "Asafoetida (Hing)", "Kashmiri Chilli Powder",
                "Meat Masala", "Chicken Masala", "Biryani Masala", "Chaat Masala",
                "Fenugreek Seeds", "Fennel Seeds", "Kasuri Methi", "Nutmeg",
                "Mace (Javitri)", "Star Anise", "Black Salt", "Rock Salt",
                "Amchur Powder", "Cumin Powder", "Saffron"
            ],
            units: ["50g", "100g", "200g", "500g"],
            priceRange: [30, 300],
            images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600"]
        },
        "Pulses & Grains": {
            brands: ["Tata Sampann", "Fortune", "Rajdhani", "Pro Nature", "24 Mantra", "Local", "Tenali"],
            items: [
                "Toor Dal", "Moong Dal", "Chana Dal", "Urad Dal", "Rajma",
                "Kabuli Chana", "Masoor Dal", "Lobia", "Green Moong", "Moth Bean",
                "Wheat Flour (Atta)", "Maida", "Besan", "Sooji (Rava)", "Dalia",
                "Poha", "Sabudana", "Jowar Flour", "Bajra Flour", "Ragi Flour",
                "Oats", "Millet", "Quinoa", "Soya Chunks"
            ],
            units: ["500g", "1kg", "5kg"],
            priceRange: [50, 250],
            images: ["https://images.unsplash.com/photo-1600626337887-21a8cd34842a?auto=format&fit=crop&q=80&w=600"]
        },
        "Packaged Foods": {
            brands: ["Maggi", "Sunfeast", "Britannia", "ITC Aashirvaad", "Haldiram's", "MTR", "Knorr", "Bikano"],
            items: [
                "Instant Noodles", "Pasta", "Macaroni", "Ready-to-eat Paneer Butter Masala",
                "Ready-to-eat Dal Makhani", "Instant Upma", "Instant Poha", "Tomato Ketchup",
                "Mixed Fruit Jam", "Peanut Butter", "Mayonnaise", "Soya Sauce",
                "Chilli Sauce", "Pickle (Mango)", "Pickle (Lemon)", "Papad",
                "Soup (Tomato)", "Soup (Sweet Corn)", "Oats (Masala)", "Corn Flakes",
                "Muesli", "Chocos", "Wheat Flakes"
            ],
            units: ["1 pack", "200g", "500g"],
            priceRange: [10, 150],
            images: ["https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=600"]
        },
        "Dairy & Bakery": {
            brands: ["Amul", "Britannia", "Mother Dairy", "Nandini", "English Oven", "Local", "Govardhan"],
            items: [
                "Toned Milk", "Full Cream Milk", "Double Toned Milk", "Cow Milk",
                "Butter", "Cheese Cubes", "Cheese Slices", "Processed Cheese",
                "Paneer", "Fresh Cream", "Curd (Dahi)", "Mishti Doi", "Lassi",
                "Buttermilk (Chaas)", "White Bread", "Brown Bread", "Multigrain Bread",
                "Pav", "Burger Buns", "Pizza Base", "Muffin", "Cake Rusk",
                "Khari", "Croissant", "Garlic Bread"
            ],
            units: ["500ml", "1L", "200g", "400g", "1 pack"],
            priceRange: [25, 200],
            images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600"]
        },
        "Beverages": {
            brands: ["Taj Mahal", "Red Label", "Nescafe", "Bru", "Coca-Cola", "Pepsi", "Real", "Tropicana", "Tata Tea", "Lipton"],
            items: [
                "Dust Tea", "Green Tea", "Lemon Tea", "Instant Coffee", "Filter Coffee",
                "Cola", "Orange Soda", "Lemon Soda", "Clear Soda", "Energy Drink",
                "Mixed Fruit Juice", "Orange Juice", "Apple Juice", "Guava Juice",
                "Mango Drink", "Coconut Water", "Mineral Water", "Sparkling Water",
                "Squash (Orange)", "Squash (Lemon)", "Rose Syrup", "Chocolate Syrup"
            ],
            units: ["250ml", "500ml", "1L", "2L", "250g", "500g"],
            priceRange: [20, 250],
            images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600"]
        },
        "Snacks": {
            brands: ["Lays", "Kurkure", "Haldiram's", "Bingo", "Balaji", "Cadbury", "Nestle", "Parle", "Britannia"],
            items: [
                "Potato Chips", "Corn Puffs", "Aloo Bhujia", "Moong Dal (Fried)",
                "Navratan Mix", "Khatta Meetha", "Salted Peanuts", "Bhujia Sev",
                "Milk Chocolate", "Dark Chocolate", "Wafer Biscuit", "Cream Biscuit",
                "Digestive Biscuit", "Cookies", "Namkeen", "Mathri", "Chikki",
                "Popcorn", "Nachos", "Mixture", "Dry Fruits Mix"
            ],
            units: ["1 pack", "150g", "400g"],
            priceRange: [10, 150],
            images: ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=600"]
        },
        "Oils & Ghee": {
            brands: ["Fortune", "Saffola", "Dhara", "Patanjali", "Amul", "Gowardhan", "Emami", "Borges", "Figaro"],
            items: [
                "Sunflower Oil", "Mustard Oil", "Olive Oil", "Desi Ghee",
                "Cow Ghee", "Groundnut Oil", "Rice Bran Oil", "Soyabean Oil",
                "Blended Oil", "Sesame Oil", "Extra Virgin Olive Oil", "Palm Oil",
                "Coconut Oil", "Canola Oil", "Cold Pressed Mustard Oil"
            ],
            units: ["500ml", "1L", "5L", "500g", "1kg"],
            priceRange: [80, 800],
            images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600"]
        }
    };

    let idTracker = 1;
    
    // Generate items
    for (const [categoryName, data] of Object.entries(categories)) {
        // To reach 300+ items, we want around 40-50 per category
        const targetPerCategory = 45; 
        let generatedForCat = 0;
        
        while(generatedForCat < targetPerCategory) {
            const itemBase = data.items[Math.floor(Math.random() * data.items.length)];
            const brand = data.brands[Math.floor(Math.random() * data.brands.length)];
            const unit = data.units[Math.floor(Math.random() * data.units.length)];
            const basePrice = Math.floor(Math.random() * (data.priceRange[1] - data.priceRange[0])) + data.priceRange[0];
            const stock = Math.floor(Math.random() * 400) + 20; // 20 to 420 stock
            
            // Adjust name to be somewhat unique
            const isPremium = Math.random() > 0.8 ? "Premium " : (Math.random() > 0.8 ? "Classic " : "");
            const isOrganic = Math.random() > 0.9 ? "Organic " : "";
            
            const variantWords = ["Original", "Special", "Authentic", "Natural"];
            let suffix = "";
            if (categoryName === "Rice" || categoryName === "Spices" || categoryName === "Pulses & Grains") {
                if (Math.random() > 0.7) suffix = " - " + variantWords[Math.floor(Math.random() * variantWords.length)];
            }
            
            const fullName = `${isPremium}${isOrganic}${brand} ${itemBase}${suffix}`;
            
            // check if exists
            if (!dataset.find(i => i.name === fullName && i.unit === unit)) {
                dataset.push({
                    name: fullName,
                    category: categoryName,
                    price: basePrice,
                    brand: brand,
                    stock: stock,
                    unit: unit,
                    image: data.images[0]
                });
                generatedForCat++;
                idTracker++;
            }
        }
    }

    ensureOutputDirectory();
    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 4));
    console.log(`Generated ${dataset.length} items successfully and wrote to ${outputPath}`);
};

generateDataset();
