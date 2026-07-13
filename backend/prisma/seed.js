const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // --- Warehouses -----------------------------------------------------
  const jakarta = await prisma.warehouse.upsert({
    where: { code: "WH-JKT" },
    update: {},
    create: { name: "Gudang Jakarta", code: "WH-JKT", address: "Jl. Industri Raya No. 12, Jakarta" },
  });

  const surabaya = await prisma.warehouse.upsert({
    where: { code: "WH-SBY" },
    update: {},
    create: { name: "Gudang Surabaya", code: "WH-SBY", address: "Jl. Rungkut Industri, Surabaya" },
  });

  const bandung = await prisma.warehouse.upsert({
    where: { code: "WH-BDG" },
    update: {},
    create: { name: "Gudang Bandung", code: "WH-BDG", address: "Jl. Soekarno Hatta, Bandung" },
  });

  // --- Users ------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@inventrack.dev" },
    update: {},
    create: {
      name: "Admin Utama",
      email: "admin@inventrack.dev",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager.jkt@inventrack.dev" },
    update: {},
    create: {
      name: "Manager Jakarta",
      email: "manager.jkt@inventrack.dev",
      password: passwordHash,
      role: "MANAGER",
      warehouseId: jakarta.id,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff.jkt@inventrack.dev" },
    update: {},
    create: {
      name: "Staff Jakarta",
      email: "staff.jkt@inventrack.dev",
      password: passwordHash,
      role: "STAFF",
      warehouseId: jakarta.id,
    },
  });

  // --- Categories ---------------------------------------------------------
  const categoryNames = ["Elektronik", "Alat Tulis Kantor", "Peralatan Rumah Tangga", "Bahan Baku"];
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // --- Products -----------------------------------------------------------
  const productData = [
    { sku: "ELK-001", name: "Kabel HDMI 2m", category: "Elektronik", unit: "pcs", price: 45000, reorderPoint: 20 },
    { sku: "ELK-002", name: "Power Bank 10000mAh", category: "Elektronik", unit: "pcs", price: 150000, reorderPoint: 15 },
    { sku: "ELK-003", name: "Mouse Wireless", category: "Elektronik", unit: "pcs", price: 85000, reorderPoint: 25 },
    { sku: "ATK-001", name: "Kertas A4 80gsm", category: "Alat Tulis Kantor", unit: "rim", price: 52000, reorderPoint: 30 },
    { sku: "ATK-002", name: "Pulpen Hitam", category: "Alat Tulis Kantor", unit: "box", price: 25000, reorderPoint: 40 },
    { sku: "RT-001", name: "Sapu Lantai", category: "Peralatan Rumah Tangga", unit: "pcs", price: 22000, reorderPoint: 10 },
    { sku: "RT-002", name: "Ember Plastik 10L", category: "Peralatan Rumah Tangga", unit: "pcs", price: 18000, reorderPoint: 15 },
    { sku: "BB-001", name: "Plastik Kemasan 1kg", category: "Bahan Baku", unit: "kg", price: 32000, reorderPoint: 50 },
  ];

  const products = [];
  for (const p of productData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        price: p.price,
        reorderPoint: p.reorderPoint,
        categoryId: categories[p.category].id,
      },
    });
    products.push(product);
  }

  // --- Initial stock across warehouses -------------------------------------
  const warehouses = [jakarta, surabaya, bandung];
  for (const product of products) {
    for (const wh of warehouses) {
      const qty = Math.floor(Math.random() * 80) + 5; // 5..85
      await prisma.stock.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId: wh.id } },
        update: {},
        create: { productId: product.id, warehouseId: wh.id, quantity: qty },
      });
    }
  }

  // --- A bit of movement history so the dashboard isn't empty on first login
  const existingMovements = await prisma.stockMovement.count();
  if (existingMovements === 0) {
    const now = Date.now();
    const sampleMovements = [];
    for (let day = 13; day >= 0; day--) {
      const product = products[Math.floor(Math.random() * products.length)];
      const type = Math.random() > 0.45 ? "IN" : "OUT";
      sampleMovements.push({
        productId: product.id,
        warehouseId: jakarta.id,
        type,
        quantity: Math.floor(Math.random() * 15) + 1,
        note: type === "IN" ? "Restock dari supplier" : "Pengeluaran barang",
        userId: day % 2 === 0 ? staff.id : manager.id,
        createdAt: new Date(now - day * 24 * 60 * 60 * 1000),
      });
    }
    await prisma.stockMovement.createMany({ data: sampleMovements });
  }

  console.log("Seed selesai:");
  console.log(`  Admin   -> admin@inventrack.dev / password123`);
  console.log(`  Manager -> manager.jkt@inventrack.dev / password123`);
  console.log(`  Staff   -> staff.jkt@inventrack.dev / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
