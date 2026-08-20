/**
 * Additive Jobform policy-test catalog seed.
 * Uploads product images from disk → Cloudinary, then upserts products/users/orders.
 * Does NOT wipe existing catalog or touch Sai / Adidas Classic Cap.
 *
 * Usage:
 *   node seed-jobform-policy.js
 *   node seed-jobform-policy.js --images=/path/to/jpgs
 *   node seed-jobform-policy.js --sync-jobform
 *   node seed-jobform-policy.js --skip-upload   # reuse existing product image URLs
 */

console.log("[seed] boot");
require("dotenv").config();
console.log("[seed] dotenv loaded, mongo configured:", Boolean(process.env.MONGODB_URI));
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;

const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Address = require("./models/Address");
const { syncBusinessContext, isConfigured } = require("./helpers/jobform-integration");

const DEMO_PASSWORD = "user123";
const DEFAULT_IMAGE_DIR = "/Users/varunreddy/Downloads/jobform-policy-test-images";
const SEED_TAG = "jobform-policy";

const args = process.argv.slice(2);
const syncJobform = args.includes("--sync-jobform");
const skipUpload = args.includes("--skip-upload");
const imagesArg = args.find((a) => a.startsWith("--images="));
const IMAGE_DIR = imagesArg ? imagesArg.split("=")[1] : DEFAULT_IMAGE_DIR;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PRODUCTS = [
  {
    skuKey: "studio-headphones",
    title: "Studio Headphones",
    description: "Closed-back studio headphones with plush ear cups. Ideal for daily listening.",
    category: "electronics",
    brand: "audiopro",
    price: 89,
    finalSale: false,
    refundable: true,
    imageFile: "studio-headphones.jpg",
  },
  {
    skuKey: "everyday-sneakers",
    title: "Everyday Sneakers",
    description: "Lightweight everyday sneakers with cushioned sole.",
    category: "footwear",
    brand: "trailform",
    price: 65,
    finalSale: false,
    refundable: true,
    imageFile: "everyday-sneakers.jpg",
  },
  {
    skuKey: "limited-edition-tee",
    title: "Limited Edition Tee",
    description: "Clearance / final-sale graphic tee. Final sale — still marked refundable for flag testing.",
    category: "men",
    brand: "cleargate",
    price: 42,
    finalSale: true,
    refundable: true,
    imageFile: "limited-edition-tee.jpg",
  },
  {
    skuKey: "ear-tips-3pack",
    title: "Ear Tips 3-Pack",
    description: "Personal-care ear tips. Non-refundable hygiene item.",
    category: "accessories",
    brand: "purecare",
    price: 12,
    finalSale: false,
    refundable: false,
    imageFile: "ear-tips-3pack.jpg",
  },
  {
    skuKey: "mechanical-keyboard",
    title: "Mechanical Keyboard",
    description: "Hot-swap mechanical keyboard with tactile switches.",
    category: "electronics",
    brand: "audiopro",
    price: 129,
    finalSale: false,
    refundable: true,
    imageFile: "mechanical-keyboard.jpg",
  },
  {
    skuKey: "canvas-tote",
    title: "Canvas Tote",
    description: "Heavyweight canvas tote for everyday carry.",
    category: "accessories",
    brand: "novashop",
    price: 28,
    finalSale: false,
    refundable: true,
    imageFile: "canvas-tote.jpg",
  },
  {
    skuKey: "trail-jacket",
    title: "Trail Jacket",
    description: "Water-resistant trail jacket with packable hood.",
    category: "men",
    brand: "trailform",
    price: 110,
    finalSale: false,
    refundable: true,
    imageFile: "trail-jacket.jpg",
  },
  {
    skuKey: "running-shorts",
    title: "Running Shorts",
    description: "Lightweight running shorts with inner brief.",
    category: "men",
    brand: "trailform",
    price: 35,
    finalSale: false,
    refundable: true,
    imageFile: "running-shorts.jpg",
  },
  {
    skuKey: "logo-hoodie",
    title: "Logo Hoodie",
    description: "Soft fleece hoodie with embroidered NovaShop logo.",
    category: "men",
    brand: "novashop",
    price: 55,
    finalSale: false,
    refundable: true,
    imageFile: "logo-hoodie.jpg",
  },
  {
    skuKey: "creator-microphone",
    title: "Creator Microphone",
    description: "USB condenser microphone for creators.",
    category: "electronics",
    brand: "audiopro",
    price: 199,
    finalSale: false,
    refundable: true,
    imageFile: "creator-microphone.jpg",
  },
  {
    skuKey: "desk-lamp",
    title: "Desk Lamp",
    description: "Adjustable LED desk lamp with warm/cool modes.",
    category: "home",
    brand: "homelab",
    price: 40,
    finalSale: false,
    refundable: true,
    imageFile: "desk-lamp.jpg",
  },
  {
    skuKey: "wool-beanie",
    title: "Wool Beanie",
    description: "Merino-blend beanie for cold weather.",
    category: "accessories",
    brand: "novashop",
    price: 24,
    finalSale: false,
    refundable: true,
    imageFile: "wool-beanie.jpg",
  },
  {
    skuKey: "wireless-speaker",
    title: "Wireless Speaker",
    description: "Portable Bluetooth speaker with 12-hour battery.",
    category: "electronics",
    brand: "audiopro",
    price: 149,
    finalSale: false,
    refundable: true,
    imageFile: "wireless-speaker.jpg",
  },
  {
    skuKey: "ceramic-mug-set",
    title: "Ceramic Mug Set",
    description: "Set of two stoneware mugs.",
    category: "home",
    brand: "homelab",
    price: 119,
    finalSale: false,
    refundable: true,
    imageFile: "ceramic-mug-set.jpg",
  },
  {
    skuKey: "insulated-bottle",
    title: "Insulated Bottle",
    description: "24oz stainless insulated bottle.",
    category: "home",
    brand: "trailform",
    price: 30,
    finalSale: false,
    refundable: true,
    imageFile: "insulated-bottle.jpg",
  },
  {
    skuKey: "phone-case",
    title: "Phone Case",
    description: "Slim protective phone case.",
    category: "electronics",
    brand: "novashop",
    price: 15,
    finalSale: false,
    refundable: true,
    imageFile: "phone-case.jpg",
  },
  {
    skuKey: "ankle-socks",
    title: "Ankle Socks",
    description: "Pack of cushioned ankle socks.",
    category: "accessories",
    brand: "novashop",
    price: 10,
    finalSale: false,
    refundable: true,
    imageFile: "ankle-socks.jpg",
  },
  {
    skuKey: "hair-clip",
    title: "Hair Clip",
    description: "Matte claw hair clip.",
    category: "accessories",
    brand: "novashop",
    price: 8,
    finalSale: false,
    refundable: true,
    imageFile: "hair-clip.jpg",
  },
  {
    skuKey: "cotton-tee",
    title: "Cotton Tee",
    description: "Soft everyday cotton tee.",
    category: "men",
    brand: "novashop",
    price: 22,
    finalSale: false,
    refundable: true,
    imageFile: "cotton-tee.jpg",
  },
  {
    skuKey: "navy-polo",
    title: "Navy Polo",
    description: "Classic navy polo shirt.",
    category: "men",
    brand: "novashop",
    price: 38,
    finalSale: false,
    refundable: true,
    imageFile: "navy-polo.jpg",
  },
  {
    skuKey: "yoga-mat",
    title: "Yoga Mat",
    description: "Non-slip yoga mat with carry strap.",
    category: "home",
    brand: "trailform",
    price: 32,
    finalSale: false,
    refundable: true,
    imageFile: "yoga-mat.jpg",
  },
];

/**
 * Personas + orders. productKeys can be one SKU or an array for multi-item.
 */
const PERSONAS = [
  {
    email: "maya.returns@example.com",
    userName: "Maya Returns",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-01-12T12:00:00.000Z",
    lifetimeOrders: 2,
    lifetimeRefunds: 0,
    productKeys: ["studio-headphones"],
    orderStatus: "delivered",
    placedAt: "2026-08-10T15:00:00.000Z",
    deliveredAt: "2026-08-12T18:00:00.000Z",
    shipping: 9,
    tax: 7.12,
    expected: "AUTO-APPROVE $89 (shipping excluded)",
  },
  {
    email: "ethan.sneakers@example.com",
    userName: "Ethan Sneakers",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-03-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["everyday-sneakers"],
    orderStatus: "delivered",
    placedAt: "2026-08-09T12:00:00.000Z",
    deliveredAt: "2026-08-11T16:00:00.000Z",
    shipping: 6,
    tax: 5.2,
    expected: "AUTO-APPROVE $65",
  },
  {
    email: "noah.finalsale@example.com",
    userName: "Noah FinalSale",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-04-10T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["limited-edition-tee"],
    orderStatus: "delivered",
    placedAt: "2026-08-06T12:00:00.000Z",
    deliveredAt: "2026-08-08T14:00:00.000Z",
    shipping: 5,
    tax: 3.36,
    expected: "DENY final sale",
  },
  {
    email: "priya.hygiene@example.com",
    userName: "Priya Hygiene",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-05-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["ear-tips-3pack"],
    orderStatus: "delivered",
    placedAt: "2026-08-08T12:00:00.000Z",
    deliveredAt: "2026-08-10T12:00:00.000Z",
    shipping: 4,
    tax: 0.96,
    expected: "DENY non-refundable",
  },
  {
    email: "ava.window@example.com",
    userName: "Ava Window",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-02-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["mechanical-keyboard"],
    orderStatus: "delivered",
    placedAt: "2026-06-01T12:00:00.000Z",
    deliveredAt: "2026-06-08T12:00:00.000Z",
    shipping: 10,
    tax: 10.32,
    expected: "DENY out of window (~73 days)",
  },
  {
    email: "jordan.windowedge@example.com",
    userName: "Jordan WindowEdge",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-06-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["canvas-tote"],
    orderStatus: "delivered",
    placedAt: "2026-07-20T12:00:00.000Z",
    deliveredAt: "2026-07-22T12:00:00.000Z",
    shipping: 5,
    tax: 2.24,
    expected: "APPROVE edge of window (28 days)",
  },
  {
    email: "sam.processing@example.com",
    userName: "Sam Processing",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-07-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["trail-jacket"],
    orderStatus: "confirmed",
    placedAt: "2026-08-18T12:00:00.000Z",
    deliveredAt: null,
    shipping: 8,
    tax: 8.8,
    expected: "DENY not delivered (PROCESSING)",
  },
  {
    email: "riley.shipped@example.com",
    userName: "Riley Shipped",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-07-15T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["running-shorts"],
    orderStatus: "inShipping",
    placedAt: "2026-08-17T12:00:00.000Z",
    deliveredAt: null,
    shipping: 5,
    tax: 2.8,
    expected: "DENY not delivered (SHIPPED)",
  },
  {
    email: "casey.cancelled@example.com",
    userName: "Casey Cancelled",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-08-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["logo-hoodie"],
    orderStatus: "rejected",
    placedAt: "2026-08-16T12:00:00.000Z",
    deliveredAt: null,
    shipping: 0,
    tax: 0,
    expected: "DENY cancelled",
  },
  {
    email: "liam.highrisk@example.com",
    userName: "Liam HighRisk",
    accountStatus: "ACTIVE",
    riskLevel: "HIGH",
    createdAt: "2024-11-01T12:00:00.000Z",
    lifetimeOrders: 19,
    lifetimeRefunds: 9,
    productKeys: ["creator-microphone"],
    orderStatus: "delivered",
    placedAt: "2026-08-08T12:00:00.000Z",
    deliveredAt: "2026-08-10T12:00:00.000Z",
    shipping: 12,
    tax: 15.92,
    expected: "DENY high-risk (escalation OK)",
  },
  {
    email: "sofia.suspended@example.com",
    userName: "Sofia Suspended",
    accountStatus: "SUSPENDED",
    riskLevel: "MEDIUM",
    createdAt: "2025-01-20T12:00:00.000Z",
    lifetimeOrders: 3,
    lifetimeRefunds: 1,
    productKeys: ["desk-lamp"],
    orderStatus: "delivered",
    placedAt: "2026-08-07T12:00:00.000Z",
    deliveredAt: "2026-08-09T12:00:00.000Z",
    shipping: 7,
    tax: 3.2,
    expected: "DENY account not active",
  },
  {
    email: "lucas.medium@example.com",
    userName: "Lucas Medium",
    accountStatus: "ACTIVE",
    riskLevel: "MEDIUM",
    createdAt: "2025-03-15T12:00:00.000Z",
    lifetimeOrders: 7,
    lifetimeRefunds: 2,
    productKeys: ["wool-beanie"],
    orderStatus: "delivered",
    placedAt: "2026-08-12T12:00:00.000Z",
    deliveredAt: "2026-08-14T12:00:00.000Z",
    shipping: 4,
    tax: 1.92,
    expected: "AUTO-APPROVE (medium risk allowed)",
  },
  {
    email: "harper.approval@example.com",
    userName: "Harper Approval",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-04-01T12:00:00.000Z",
    lifetimeOrders: 2,
    lifetimeRefunds: 0,
    productKeys: ["wireless-speaker"],
    orderStatus: "delivered",
    placedAt: "2026-08-11T12:00:00.000Z",
    deliveredAt: "2026-08-13T12:00:00.000Z",
    shipping: 8,
    tax: 11.92,
    expected: "APPROVE but REQUIRES_APPROVAL (>$100)",
  },
  {
    email: "henry.damaged@example.com",
    userName: "Henry Damaged",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-05-12T12:00:00.000Z",
    lifetimeOrders: 2,
    lifetimeRefunds: 0,
    productKeys: ["ceramic-mug-set"],
    orderStatus: "delivered",
    placedAt: "2026-08-13T12:00:00.000Z",
    deliveredAt: "2026-08-15T12:00:00.000Z",
    shipping: 9,
    tax: 9.52,
    expected: "HITL + DAMAGED chat path (>$100)",
  },
  {
    email: "mia.partial@example.com",
    userName: "Mia Partial",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-06-20T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 1,
    productKeys: ["insulated-bottle"],
    quantity: 2,
    orderStatus: "delivered",
    placedAt: "2026-08-07T12:00:00.000Z",
    deliveredAt: "2026-08-09T12:00:00.000Z",
    shipping: 5,
    tax: 4.8,
    refundedAmount: 30,
    partialRefund: true,
    expected: "qty2 order, $30 already refunded (1 unit)",
  },
  {
    email: "ben.bundle@example.com",
    userName: "Ben Bundle",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-07-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["studio-headphones", "everyday-sneakers"],
    orderStatus: "delivered",
    placedAt: "2026-08-09T12:00:00.000Z",
    deliveredAt: "2026-08-11T12:00:00.000Z",
    shipping: 9,
    tax: 12.32,
    expected: "Multi-item — refund sneakers only",
  },
  {
    email: "evelyn.shipping@example.com",
    userName: "Evelyn Shipping",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-08-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["phone-case"],
    orderStatus: "delivered",
    placedAt: "2026-08-14T12:00:00.000Z",
    deliveredAt: "2026-08-16T12:00:00.000Z",
    shipping: 12,
    tax: 1.2,
    expected: "APPROVE $15 only (not +$12 shipping)",
  },
  {
    email: "amelia.ratio@example.com",
    userName: "Amelia Ratio",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2024-10-01T12:00:00.000Z",
    lifetimeOrders: 16,
    lifetimeRefunds: 14,
    productKeys: ["ankle-socks"],
    orderStatus: "delivered",
    placedAt: "2026-08-15T12:00:00.000Z",
    deliveredAt: "2026-08-17T12:00:00.000Z",
    shipping: 4,
    tax: 0.8,
    expected: "Keep for lifetime refund-ratio rules",
  },
  {
    email: "isabella.new@example.com",
    userName: "Isabella New",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2026-08-19T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["hair-clip"],
    orderStatus: "delivered",
    placedAt: "2026-08-19T10:00:00.000Z",
    deliveredAt: "2026-08-19T18:00:00.000Z",
    shipping: 3,
    tax: 0.64,
    expected: "Brand-new account (age/order rules)",
  },
  {
    email: "james.late@example.com",
    userName: "James Late",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-02-14T12:00:00.000Z",
    lifetimeOrders: 2,
    lifetimeRefunds: 0,
    productKeys: ["cotton-tee"],
    orderStatus: "delivered",
    placedAt: "2026-07-01T12:00:00.000Z",
    deliveredAt: "2026-08-12T12:00:00.000Z",
    shipping: 5,
    tax: 1.76,
    expected: "LATE_DELIVERY path — still in window",
  },
  {
    email: "harper.describe@example.com",
    userName: "Harper Describe",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-09-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["navy-polo"],
    orderStatus: "delivered",
    placedAt: "2026-08-05T12:00:00.000Z",
    deliveredAt: "2026-08-07T12:00:00.000Z",
    shipping: 5,
    tax: 3.04,
    expected: "Opened + not as described still eligible",
  },
  {
    email: "owen.used@example.com",
    userName: "Owen Used",
    accountStatus: "ACTIVE",
    riskLevel: "LOW",
    createdAt: "2025-10-01T12:00:00.000Z",
    lifetimeOrders: 1,
    lifetimeRefunds: 0,
    productKeys: ["yoga-mat"],
    orderStatus: "delivered",
    placedAt: "2026-08-04T12:00:00.000Z",
    deliveredAt: "2026-08-06T12:00:00.000Z",
    shipping: 6,
    tax: 2.56,
    expected: "DENY used + changed mind (chat condition)",
  },
];

const { execFileSync } = require("child_process");

function resizeForUpload(filePath, skuKey) {
  const tmpDir = path.join("/tmp", "novashop-policy-images");
  fs.mkdirSync(tmpDir, { recursive: true });
  const outPath = path.join(tmpDir, `${skuKey}.jpg`);
  try {
    execFileSync(
      "sips",
      ["-Z", "900", "-s", "format", "jpeg", filePath, "--out", outPath],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    return outPath;
  } catch {
    return filePath;
  }
}

async function uploadWithRetry(filePath, options, attempts = 4) {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await cloudinary.uploader.upload(filePath, options);
    } catch (err) {
      lastError = err;
      const waitMs = i * 2500;
      console.log(`    retry ${i}/${attempts} in ${waitMs}ms (${err.message || err.http_code || "error"})`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

const URL_CACHE_PATH = path.join(__dirname, ".jobform-policy-image-urls.json");

function loadUrlCache() {
  try {
    if (fs.existsSync(URL_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(URL_CACHE_PATH, "utf8"));
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveUrlCache(urls) {
  fs.writeFileSync(URL_CACHE_PATH, JSON.stringify(urls, null, 2));
}

async function uploadImages() {
  const urls = loadUrlCache();
  if (skipUpload) {
    console.log("Skipping Cloudinary upload (--skip-upload)\n");
    return urls;
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY_* env vars are required to upload images");
  }
  if (!fs.existsSync(IMAGE_DIR)) {
    throw new Error(`Image folder not found: ${IMAGE_DIR}`);
  }

  console.log(`Uploading images from ${IMAGE_DIR}\n`);
  for (const product of PRODUCTS) {
    if (urls[product.skuKey]) {
      console.log(`  · cached ${product.imageFile}`);
      continue;
    }
    const filePath = path.join(IMAGE_DIR, product.imageFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing image: ${filePath}`);
    }
    const uploadPath = resizeForUpload(filePath, product.skuKey);
    console.log(`  … uploading ${product.imageFile}`);
    try {
      const result = await uploadWithRetry(uploadPath, {
        folder: "novashop/jobform-policy",
        public_id: product.skuKey,
        overwrite: true,
        resource_type: "image",
        timeout: 180000,
      });
      urls[product.skuKey] = result.secure_url;
      saveUrlCache(urls);
      console.log(`  ✓ ${product.imageFile} → ${result.secure_url}`);
    } catch (err) {
      console.error(`  ✗ ${product.imageFile} failed:`, err);
      throw err;
    }
  }
  console.log("");
  return urls;
}

async function upsertProduct(def, imageUrl, ownerAdminId) {
  const existing = await Product.findOne({ title: def.title });
  const payload = {
    title: def.title,
    description: def.description,
    category: def.category,
    brand: def.brand,
    price: def.price,
    salePrice: 0,
    totalStock: 100,
    averageReview: 0,
    finalSale: def.finalSale,
    refundable: def.refundable,
    ownerAdminId: ownerAdminId || undefined,
  };
  if (imageUrl) payload.image = imageUrl;

  if (existing) {
    if (!payload.image) payload.image = existing.image;
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }

  if (!payload.image) {
    throw new Error(`No image URL for new product "${def.title}" — run without --skip-upload`);
  }
  return Product.create(payload);
}

async function upsertUser(persona, passwordHash) {
  let user = await User.findOne({ email: persona.email.toLowerCase() });
  const fields = {
    userName: persona.userName,
    email: persona.email.toLowerCase(),
    password: passwordHash,
    role: "user",
    isEmailVerified: true,
    emailVerificationToken: undefined,
    emailVerificationExpires: undefined,
    accountStatus: persona.accountStatus,
    riskLevel: persona.riskLevel,
    lifetimeOrders: persona.lifetimeOrders,
    lifetimeRefunds: persona.lifetimeRefunds,
  };

  if (user) {
    Object.assign(user, fields);
    user.createdAt = new Date(persona.createdAt);
    await user.save({ timestamps: false });
  } else {
    user = new User(fields);
    user.createdAt = new Date(persona.createdAt);
    user.updatedAt = new Date();
    await user.save({ timestamps: false });
  }
  return user;
}

function buildCartItems(products, quantity = 1) {
  return products.map((product) => ({
    productId: String(product._id),
    title: product.title,
    image: product.image,
    price: product.price,
    quantity,
    ownerAdminId: product.ownerAdminId || undefined,
    finalSale: Boolean(product.finalSale),
    refundable: product.refundable !== false,
  }));
}

async function upsertOrder(user, persona, productMap, address) {
  const products = persona.productKeys.map((key) => {
    const product = productMap.get(key);
    if (!product) throw new Error(`Missing product for key ${key}`);
    return product;
  });

  const qty = persona.quantity || 1;
  // Multi-item bundle uses qty 1 each; partial bottle uses qty 2 on single SKU
  const cartItems =
    products.length > 1
      ? buildCartItems(products, 1)
      : buildCartItems(products, qty);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingAmount = Number(persona.shipping || 0);
  const taxAmount = Number(persona.tax || 0);
  const totalAmount = Math.round((subtotal + shippingAmount + taxAmount) * 100) / 100;
  const placedAt = new Date(persona.placedAt);
  const deliveredAt = persona.deliveredAt ? new Date(persona.deliveredAt) : null;

  const shippingDoc = {
    carrier: "UPS",
    trackingNumber: `1ZPOLICY${String(user._id).slice(-8).toUpperCase()}`,
    shippedAt: placedAt,
    deliveredAt: deliveredAt || undefined,
    estimatedDelivery: deliveredAt || new Date(placedAt.getTime() + 4 * 86400000),
    events: [
      {
        status: "label_created",
        location: "Memphis, TN",
        timestamp: placedAt,
        description: "Shipping label created",
      },
    ],
  };
  if (persona.orderStatus === "inShipping" || persona.orderStatus === "delivered") {
    shippingDoc.events.push({
      status: "in_transit",
      location: "Chicago, IL",
      timestamp: new Date(placedAt.getTime() + 12 * 3600000),
      description: "Package in transit",
    });
  }
  if (deliveredAt) {
    shippingDoc.events.push({
      status: "delivered",
      location: address.city,
      timestamp: deliveredAt,
      description: "Package delivered",
    });
  }

  const orderPayload = {
    userId: String(user._id),
    cartId: "",
    cartItems,
    addressInfo: {
      addressId: String(address._id),
      address: address.address,
      city: address.city,
      pincode: address.pincode,
      phone: address.phone,
      notes: address.notes,
    },
    orderStatus: persona.orderStatus,
    paymentMethod: "paypal",
    paymentStatus: persona.orderStatus === "rejected" ? "refunded" : "paid",
    totalAmount,
    shippingAmount,
    taxAmount,
    refundedAmount: persona.refundedAmount || 0,
    orderDate: placedAt,
    orderUpdateDate: deliveredAt || placedAt,
    paymentId: `PAY-POLICY-${String(user._id).slice(-6).toUpperCase()}`,
    payerId: `PAYER-${String(user._id).slice(-4).toUpperCase()}`,
    shipping: shippingDoc,
    refundRecords: [],
    returnStatus: "",
  };

  if (persona.partialRefund) {
    const product = products[0];
    orderPayload.refundRecords = [
      {
        refundId: `seed_partial_${String(user._id).slice(-8)}`,
        itemId: `${SEED_TAG}_bottle_item_0`,
        quantity: 1,
        amount: 30,
        reason: "CHANGED_MIND",
        condition: "UNOPENED",
        processedAt: deliveredAt || placedAt,
        itemTitle: product.title,
        itemSku: String(product._id),
      },
    ];
  }

  // Replace prior policy-seed order for this user (additive vs catalog wipe)
  await Order.deleteMany({
    userId: String(user._id),
    paymentId: new RegExp(`^PAY-POLICY-`),
  });

  return Order.create(orderPayload);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB\n");

  const imageUrls = await uploadImages();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Prefer an existing admin as owner; otherwise leave unset
  const ownerAdmin =
    (await User.findOne({ role: "super_admin" })) ||
    (await User.findOne({ role: "admin" }));

  const productMap = new Map();
  for (const def of PRODUCTS) {
    const product = await upsertProduct(
      def,
      imageUrls[def.skuKey],
      ownerAdmin?._id,
    );
    productMap.set(def.skuKey, product);
    console.log(
      `✓ Product ${product.title}  finalSale=${product.finalSale} refundable=${product.refundable}`,
    );
  }

  console.log("");

  const tableRows = [];

  for (const persona of PERSONAS) {
    const user = await upsertUser(persona, passwordHash);

    let address = await Address.findOne({ userId: String(user._id) });
    if (!address) {
      address = await Address.create({
        userId: String(user._id),
        address: "100 Policy Test Lane",
        city: "Charlotte",
        pincode: "28202",
        phone: "+1-555-0100",
        notes: "Jobform policy-test address",
      });
    }

    const order = await upsertOrder(user, persona, productMap, address);
    const productTitles = persona.productKeys
      .map((k) => productMap.get(k)?.title)
      .join(" + ");
    const flags = persona.productKeys
      .map((k) => {
        const p = productMap.get(k);
        return `${p.title}: finalSale=${p.finalSale}/refundable=${p.refundable}`;
      })
      .join("; ");

    tableRows.push({
      email: persona.email,
      password: DEMO_PASSWORD,
      product: productTitles,
      price: order.cartItems.map((i) => `$${i.price}×${i.quantity}`).join(", "),
      deliveredAt: persona.deliveredAt || "null",
      flags,
      expected: persona.expected,
      orderId: String(order._id),
      userId: String(user._id),
    });

    console.log(`✓ ${persona.email} → order ${order._id} (${persona.orderStatus})`);

    if (syncJobform && isConfigured()) {
      try {
        await syncBusinessContext(user, [order]);
        console.log(`  ↳ Jobform synced`);
      } catch (err) {
        console.error(`  ↳ Jobform sync failed: ${err.message}`);
      }
    }
  }

  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("JOBFORM POLICY-TEST CREDENTIALS (password for all: user123)");
  console.log("══════════════════════════════════════════════════════════════════");
  console.log(
    "email | product | price | deliveredAt | flags | expected",
  );
  console.log("──────────────────────────────────────────────────────────────────");
  for (const row of tableRows) {
    console.log(
      `${row.email}\n  ${row.product} | ${row.price} | deliveredAt=${row.deliveredAt}\n  ${row.flags}\n  → ${row.expected}\n  orderId=${row.orderId} userId=${row.userId}\n`,
    );
  }

  console.log("Untouched: existing customers (incl. Sai / kr25242311) + Adidas Classic Cap");
  console.log("finalSale/refundable set on Product + copied onto order.cartItems at seed/checkout");
  console.log("Export: server/helpers/jobform-integration.js (line-item flags first, then product)");

  if (syncJobform && !isConfigured()) {
    console.log("\nJobform sync skipped (missing JOBFORM_BASE_URL / BUSINESS_INTEGRATION_SECRET)");
  }

  await mongoose.disconnect();
  console.log("\nDone. Additive Jobform policy seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
