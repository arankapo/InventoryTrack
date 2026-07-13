const prisma = require("../config/prisma");
const { AppError, asyncHandler } = require("../utils/AppError");

// Shapes a product + its stocks into a flat object with a computed
// totalQuantity and lowStock flag — convenient for the frontend table.
function withStockSummary(product) {
  const stocks = product.stocks || [];
  const totalQuantity = stocks.reduce((sum, s) => sum + s.quantity, 0);
  return {
    ...product,
    totalQuantity,
    lowStock: totalQuantity <= product.reorderPoint,
  };
}

// GET /api/products?search=&categoryId=&warehouseId=
const getAll = asyncHandler(async (req, res) => {
  const { search, categoryId } = req.query;

  const where = {
    isActive: true,
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  // Manager/Staff only see stock figures for their own warehouse.
  const warehouseFilter =
    req.user.role === "ADMIN" ? {} : { warehouseId: req.user.warehouseId || "none" };

  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      stocks: { where: warehouseFilter, select: { warehouseId: true, quantity: true } },
    },
    orderBy: { name: "asc" },
  });

  res.json({ success: true, data: products.map(withStockSummary) });
});

// GET /api/products/:id
const getOne = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: { select: { id: true, name: true } },
      stocks: { include: { warehouse: { select: { id: true, name: true, code: true } } } },
    },
  });
  if (!product) throw new AppError("Product not found.", 404);
  res.json({ success: true, data: withStockSummary(product) });
});

// POST /api/products  (ADMIN, MANAGER)
const create = asyncHandler(async (req, res) => {
  const product = await prisma.product.create({
    data: req.body,
    include: { category: { select: { id: true, name: true } }, stocks: true },
  });
  res.status(201).json({ success: true, data: withStockSummary(product) });
});

// PATCH /api/products/:id  (ADMIN, MANAGER)
const update = asyncHandler(async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
    include: { category: { select: { id: true, name: true } }, stocks: true },
  });
  res.json({ success: true, data: withStockSummary(product) });
});

// DELETE /api/products/:id  (ADMIN only) — soft delete
const remove = asyncHandler(async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, message: "Product archived." });
});

module.exports = { getAll, getOne, create, update, remove };
