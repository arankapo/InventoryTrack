const prisma = require("../config/prisma");
const { AppError, asyncHandler } = require("../utils/AppError");
const { resolveWarehouseScope } = require("../middleware/auth.middleware");

// GET /api/stock?warehouseId=&lowStockOnly=true
const getLevels = asyncHandler(async (req, res) => {
  const scopedWarehouseId = resolveWarehouseScope(req, req.query.warehouseId);

  const stocks = await prisma.stock.findMany({
    where: scopedWarehouseId ? { warehouseId: scopedWarehouseId } : {},
    include: {
      product: {
        select: { id: true, name: true, sku: true, unit: true, reorderPoint: true, price: true },
      },
      warehouse: { select: { id: true, name: true, code: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const shaped = stocks
    .map((s) => ({ ...s, lowStock: s.quantity <= s.product.reorderPoint }))
    .filter((s) => (req.query.lowStockOnly === "true" ? s.lowStock : true));

  res.json({ success: true, data: shaped });
});

// GET /api/stock/movements?warehouseId=&productId=&type=&limit=
const getMovements = asyncHandler(async (req, res) => {
  const { productId, type, limit } = req.query;
  const scopedWarehouseId = resolveWarehouseScope(req, req.query.warehouseId);

  const movements = await prisma.stockMovement.findMany({
    where: {
      ...(scopedWarehouseId && { warehouseId: scopedWarehouseId }),
      ...(productId && { productId }),
      ...(type && { type }),
    },
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      destinationWarehouse: { select: { id: true, name: true, code: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit ? parseInt(limit, 10) : 50,
  });

  res.json({ success: true, data: movements });
});

// POST /api/stock/movements
// The single entry point for every stock change. Wrapped in a DB transaction
// so the Stock balance and the StockMovement audit row never drift apart.
const createMovement = asyncHandler(async (req, res) => {
  const { productId, type, quantity, note, destinationWarehouseId } = req.body;
  const warehouseId = resolveWarehouseScope(req, req.body.warehouseId);

  if (!warehouseId) throw new AppError("warehouseId is required.", 422);

  const [product, warehouse] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.warehouse.findUnique({ where: { id: warehouseId } }),
  ]);
  if (!product) throw new AppError("Product not found.", 404);
  if (!warehouse) throw new AppError("Warehouse not found.", 404);

  if (type === "TRANSFER") {
    if (destinationWarehouseId === warehouseId) {
      throw new AppError("Source and destination warehouse can't be the same.", 422);
    }
    const dest = await prisma.warehouse.findUnique({ where: { id: destinationWarehouseId } });
    if (!dest) throw new AppError("Destination warehouse not found.", 404);
  }

  const movement = await prisma.$transaction(async (tx) => {
    const sourceStock = await tx.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
    const currentQty = sourceStock?.quantity || 0;

    if ((type === "OUT" || type === "TRANSFER") && currentQty < quantity) {
      throw new AppError(
        `Insufficient stock at ${warehouse.name}. Available: ${currentQty}, requested: ${quantity}.`,
        409
      );
    }
    if (type === "ADJUSTMENT" && currentQty + quantity < 0) {
      throw new AppError(`Adjustment would result in negative stock (current: ${currentQty}).`, 409);
    }

    const delta = type === "OUT" || type === "TRANSFER" ? -quantity : quantity;

    await tx.stock.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      update: { quantity: { increment: delta } },
      create: { productId, warehouseId, quantity: Math.max(delta, 0) },
    });

    if (type === "TRANSFER") {
      await tx.stock.upsert({
        where: { productId_warehouseId: { productId, warehouseId: destinationWarehouseId } },
        update: { quantity: { increment: quantity } },
        create: { productId, warehouseId: destinationWarehouseId, quantity },
      });
    }

    return tx.stockMovement.create({
      data: {
        productId,
        warehouseId,
        type,
        quantity,
        note,
        destinationWarehouseId: type === "TRANSFER" ? destinationWarehouseId : null,
        userId: req.user.id,
      },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        destinationWarehouse: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true } },
      },
    });
  });

  res.status(201).json({ success: true, data: movement });
});

module.exports = { getLevels, getMovements, createMovement };
