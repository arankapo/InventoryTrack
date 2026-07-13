const prisma = require("../config/prisma");
const { asyncHandler } = require("../utils/AppError");

// GET /api/dashboard/summary
// Admin sees data across every warehouse. Manager/Staff only see their own.
const getSummary = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const scope = isAdmin ? {} : { warehouseId: req.user.warehouseId || "none" };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalProducts, totalWarehouses, stocks, recentMovements, trendMovements] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    isAdmin
      ? prisma.warehouse.count({ where: { isActive: true } })
      : Promise.resolve(req.user.warehouseId ? 1 : 0),
    prisma.stock.findMany({
      where: scope,
      include: {
        product: { select: { price: true, reorderPoint: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    }),
    prisma.stockMovement.findMany({
      where: scope,
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.stockMovement.findMany({
      where: { ...scope, createdAt: { gte: thirtyDaysAgo } },
      select: { type: true, quantity: true, createdAt: true },
    }),
  ]);

  const totalUnits = stocks.reduce((sum, s) => sum + s.quantity, 0);
  const totalStockValue = stocks.reduce((sum, s) => sum + s.quantity * s.product.price, 0);

  const lowStockItems = stocks
    .filter((s) => s.quantity <= s.product.reorderPoint)
    .map((s) => ({
      productName: s.product.name,
      sku: s.product.sku,
      warehouse: s.warehouse.name,
      quantity: s.quantity,
      reorderPoint: s.product.reorderPoint,
    }))
    .sort((a, b) => a.quantity - b.quantity);

  const stockByWarehouseMap = new Map();
  for (const s of stocks) {
    const key = s.warehouse.name;
    stockByWarehouseMap.set(key, (stockByWarehouseMap.get(key) || 0) + s.quantity);
  }
  const stockByWarehouse = Array.from(stockByWarehouseMap, ([warehouse, quantity]) => ({
    warehouse,
    quantity,
  }));

  const trendMap = new Map();
  for (const m of trendMovements) {
    const day = m.createdAt.toISOString().slice(0, 10);
    if (!trendMap.has(day)) trendMap.set(day, { date: day, in: 0, out: 0 });
    const bucket = trendMap.get(day);
    if (m.type === "IN") bucket.in += m.quantity;
    else if (m.type === "OUT" || m.type === "TRANSFER") bucket.out += Math.abs(m.quantity);
    else if (m.type === "ADJUSTMENT") {
      if (m.quantity >= 0) bucket.in += m.quantity;
      else bucket.out += Math.abs(m.quantity);
    }
  }
  const movementTrend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    success: true,
    data: {
      totalProducts,
      totalWarehouses,
      totalUnits,
      totalStockValue,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 10),
      recentMovements,
      stockByWarehouse,
      movementTrend,
    },
  });
});

module.exports = { getSummary };
