/**
 * Seed script — populates the ecommerce database with sample products and users.
 *
 * Usage:
 *   1. Fill in your MONGODB_URI in server/.env
 *   2. Add matching product images inside:
 *        client/public/seed-products/
 *   3. Run: node seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Models (inline so the script is self-contained) ──────────────────────────

const UserSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
});
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const ProductSchema = new mongoose.Schema(
  {
    image: String,
    title: String,
    description: String,
    category: String,
    brand: String,
    price: Number,
    salePrice: Number,
    totalStock: Number,
    averageReview: Number,
    ownerAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
  },
  { timestamps: true }
);
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ brand: 1, price: 1 });
ProductSchema.index({ ownerAdminId: 1, createdAt: -1 });
const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

// Pull other real app models so we clear the same collections your app uses
const Order = require("./models/Order");
const Cart = require("./models/Cart");
const Address = require("./models/Address");
const Review = require("./models/Review");

// ── Local product image helper ───────────────────────────────────────────────
// Put matching files inside: client/public/seed-products/
function img(fileName) {
  return `/seed-products/${fileName}.jpg`;
}

// ── Sample products ──────────────────────────────────────────────────────────

const products = [
  // ─── MEN ───
  {
    title: "Nike Dri-FIT Running Tee",
    description:
      "Lightweight moisture-wicking crew neck tee built for daily runs. Breathable mesh panels keep you cool.",
    category: "men",
    brand: "nike",
    price: 45,
    salePrice: 35,
    totalStock: 80,
    image: img("nike-men-tee"),
  },
  {
    title: "Adidas Essentials Hoodie",
    description:
      "Classic fleece pullover hoodie with kangaroo pocket. Relaxed fit for layering.",
    category: "men",
    brand: "adidas",
    price: 65,
    salePrice: 0,
    totalStock: 50,
    image: img("adidas-men-hoodie"),
  },
  {
    title: "Puma Slim Fit Joggers",
    description:
      "Tapered joggers with elastic cuffs and side pockets. Soft French terry fabric.",
    category: "men",
    brand: "puma",
    price: 55,
    salePrice: 42,
    totalStock: 60,
    image: img("puma-men-joggers"),
  },
  {
    title: "Levi's 511 Slim Jeans",
    description:
      "Classic slim fit jeans in dark indigo wash. Stretch denim for comfortable all-day wear.",
    category: "men",
    brand: "levi",
    price: 89,
    salePrice: 69,
    totalStock: 45,
    image: img("levi-men-jeans"),
  },
  {
    title: "Zara Structured Blazer",
    description:
      "Slim-fit blazer with notch lapels. Ideal for smart casual occasions.",
    category: "men",
    brand: "zara",
    price: 120,
    salePrice: 0,
    totalStock: 25,
    image: img("zara-men-blazer"),
  },
  {
    title: "H&M Regular Fit Oxford Shirt",
    description:
      "Button-down collar oxford shirt in cotton. A wardrobe staple.",
    category: "men",
    brand: "h&m",
    price: 35,
    salePrice: 25,
    totalStock: 100,
    image: img("hm-men-oxford"),
  },

  // ─── WOMEN ───
  {
    title: "Nike Air Max Sports Bra",
    description:
      "Medium-support sports bra with Swoosh logo. Removable pads and racerback design.",
    category: "women",
    brand: "nike",
    price: 40,
    salePrice: 30,
    totalStock: 70,
    image: img("nike-women-bra"),
  },
  {
    title: "Adidas Ultraboost Leggings",
    description:
      "High-rise 7/8 leggings with side pocket. Made with Primegreen recycled materials.",
    category: "women",
    brand: "adidas",
    price: 75,
    salePrice: 55,
    totalStock: 40,
    image: img("adidas-women-leggings"),
  },
  {
    title: "Zara Floral Midi Dress",
    description:
      "Flowing midi dress with floral print and puff sleeves. V-neckline with tie detail.",
    category: "women",
    brand: "zara",
    price: 89,
    salePrice: 0,
    totalStock: 35,
    image: img("zara-women-dress"),
  },
  {
    title: "H&M Ribbed Knit Sweater",
    description:
      "Oversized ribbed sweater in soft knit. Dropped shoulders and relaxed fit.",
    category: "women",
    brand: "h&m",
    price: 45,
    salePrice: 32,
    totalStock: 55,
    image: img("hm-women-sweater"),
  },
  {
    title: "Levi's 721 High Rise Skinny",
    description:
      "High-rise skinny jeans that slim and flatter. Advanced stretch for ultimate comfort.",
    category: "women",
    brand: "levi",
    price: 98,
    salePrice: 75,
    totalStock: 30,
    image: img("levi-women-skinny"),
  },
  {
    title: "Puma Train Favorite Tee",
    description:
      "dryCELL moisture-wicking training tee. Relaxed fit with cat logo at chest.",
    category: "women",
    brand: "puma",
    price: 35,
    salePrice: 0,
    totalStock: 90,
    image: img("puma-women-tee"),
  },

  // ─── KIDS ───
  {
    title: "Nike Kids Air Force 1 Tee",
    description:
      "Soft cotton tee with bold Air Force 1 graphic. Standard fit for everyday play.",
    category: "kids",
    brand: "nike",
    price: 25,
    salePrice: 18,
    totalStock: 100,
    image: img("nike-kids-tee"),
  },
  {
    title: "Adidas Kids Track Pants",
    description:
      "Classic 3-stripes track pants with elastic waistband. Durable for active kids.",
    category: "kids",
    brand: "adidas",
    price: 35,
    salePrice: 0,
    totalStock: 75,
    image: img("adidas-kids-pants"),
  },
  {
    title: "H&M Kids Printed Hoodie",
    description:
      "Fleece hoodie with fun printed design. Kangaroo pocket and ribbed cuffs.",
    category: "kids",
    brand: "h&m",
    price: 22,
    salePrice: 15,
    totalStock: 85,
    image: img("hm-kids-hoodie"),
  },
  {
    title: "Zara Kids Denim Jacket",
    description:
      "Lightweight denim jacket with snap buttons. Perfect layering piece for spring.",
    category: "kids",
    brand: "zara",
    price: 45,
    salePrice: 35,
    totalStock: 40,
    image: img("zara-kids-denim"),
  },

  // ─── FOOTWEAR ───
  {
    title: "Nike Air Max 270",
    description:
      "Iconic lifestyle sneaker with visible Air unit for all-day cushioning. Mesh upper for breathability.",
    category: "footwear",
    brand: "nike",
    price: 150,
    salePrice: 120,
    totalStock: 35,
    image: img("nike-airmax270"),
  },
  {
    title: "Adidas Stan Smith Sneakers",
    description:
      "Timeless low-top tennis shoe in white leather with green heel tab. Clean and minimal.",
    category: "footwear",
    brand: "adidas",
    price: 110,
    salePrice: 85,
    totalStock: 45,
    image: img("adidas-stansmith"),
  },
  {
    title: "Puma RS-X Reinvention",
    description:
      "Chunky retro-inspired running shoe with bold color blocking. Softfoam+ sockliner.",
    category: "footwear",
    brand: "puma",
    price: 130,
    salePrice: 99,
    totalStock: 30,
    image: img("puma-rsx"),
  },
  {
    title: "Zara Leather Chelsea Boots",
    description:
      "Pull-on chelsea boots in genuine leather with elastic side panels. Sleek silhouette.",
    category: "footwear",
    brand: "zara",
    price: 99,
    salePrice: 0,
    totalStock: 20,
    image: img("zara-chelsea"),
  },

  // ─── ACCESSORIES ───
  {
    title: "Nike Heritage Backpack",
    description:
      "Spacious daypack with padded shoulder straps and laptop sleeve. 25L capacity.",
    category: "accessories",
    brand: "nike",
    price: 45,
    salePrice: 35,
    totalStock: 60,
    image: img("nike-backpack"),
  },
  {
    title: "Adidas Classic Cap",
    description:
      "6-panel baseball cap with embroidered Trefoil logo. Adjustable strap back.",
    category: "accessories",
    brand: "adidas",
    price: 25,
    salePrice: 0,
    totalStock: 120,
    image: img("adidas-cap"),
  },
  {
    title: "Puma Fundamentals Wallet",
    description:
      "Bi-fold wallet in textured faux leather. Multiple card slots and bill compartment.",
    category: "accessories",
    brand: "puma",
    price: 20,
    salePrice: 15,
    totalStock: 90,
    image: img("puma-wallet"),
  },
  {
    title: "Zara Leather Belt",
    description:
      "Classic leather belt with brushed metal buckle. 3.5cm width.",
    category: "accessories",
    brand: "zara",
    price: 35,
    salePrice: 0,
    totalStock: 70,
    image: img("zara-belt"),
  },
  {
    title: "H&M Canvas Tote Bag",
    description:
      "Sturdy canvas tote with inner pocket. Perfect for everyday use.",
    category: "accessories",
    brand: "h&m",
    price: 18,
    salePrice: 12,
    totalStock: 150,
    image: img("hm-tote"),
  },
];

// ── Seed function ────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear collections that are affected by the new ownership flow
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      Address.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log(
      "Cleared users, products, orders, carts, addresses, and reviews"
    );

    const adminPassword = await bcrypt.hash("admin123", 12);
    const userPassword = await bcrypt.hash("user123", 12);

    // Super admin — can see all products and orders across all admins
    await User.create({
      userName: "superadmin",
      email: "superadmin@ecommerce.com",
      password: adminPassword,
      role: "super_admin",
    });

    const [adminOne, adminTwo, adminThree] = await User.create([
      {
        userName: "admin1",
        email: "admin1@ecommerce.com",
        password: adminPassword,
        role: "admin",
      },
      {
        userName: "admin2",
        email: "admin2@ecommerce.com",
        password: adminPassword,
        role: "admin",
      },
      {
        userName: "admin3",
        email: "admin3@ecommerce.com",
        password: adminPassword,
        role: "admin",
      },
    ]);

    await User.create({
      userName: "testuser",
      email: "user@ecommerce.com",
      password: userPassword,
      role: "user",
    });

    console.log("Created users:");
    console.log("  Super   → superadmin@ecommerce.com / admin123 (sees everything)");
    console.log("  Admin1  → admin1@ecommerce.com / admin123");
    console.log("  Admin2  → admin2@ecommerce.com / admin123");
    console.log("  Admin3  → admin3@ecommerce.com / admin123");
    console.log("  User    → user@ecommerce.com / user123");

    const adminPool = [adminOne._id, adminTwo._id, adminThree._id];

    const seededProducts = products.map((product, index) => ({
      ...product,
      averageReview: 0,
      ownerAdminId: adminPool[index % adminPool.length],
    }));

    const inserted = await Product.insertMany(seededProducts);
    console.log(`\nInserted ${inserted.length} products`);

    const categories = [...new Set(products.map((p) => p.category))];
    for (const cat of categories) {
      const count = products.filter((p) => p.category === cat).length;
      console.log(`  ${cat}: ${count} products`);
    }

    const ownershipCounts = await Product.aggregate([
      {
        $group: {
          _id: "$ownerAdminId",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("\nProducts assigned to admins:");
    for (const item of ownershipCounts) {
      const owner = [adminOne, adminTwo, adminThree].find(
        (admin) => String(admin._id) === String(item._id)
      );
      console.log(`  ${owner?.email || item._id}: ${item.count} products`);
    }

    await mongoose.disconnect();
    console.log("\nDone! Your database is ready.");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();