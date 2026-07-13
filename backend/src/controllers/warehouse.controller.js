const prisma = require("../config/prisma");
const { AppError, asyncHandler } = require("../utils/AppError");

// GET /api/warehouses
// Admin sees all warehouses. Manager/Staff only see their own.
const getAll = asyncHandler(async (req, res) => {
  const where = req.user.role === "ADMIN" ? {} : { id: req.user.warehouseId || "none" };

  const warehouses = await prisma.warehouse.findMany({
    where,
    include: {
      _count: { select: { users: true, stocks: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  res.json({ success: true, data: warehouses });
});

// GET /api/warehouses/:id
const getOne = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN" && req.user.warehouseId !== req.params.id) {
    throw new AppError("You can only view your own warehouse.", 403);
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { users: true, stocks: true } } },
  });
  if (!warehouse) throw new AppError("Warehouse not found.", 404);

  res.json({ success: true, data: warehouse });
});

// POST /api/warehouses  (ADMIN only, enforced in route)
const create = asyncHandler(async (req, res) => {
  const warehouse = await prisma.warehouse.create({ data: req.body });
  res.status(201).json({ success: true, data: warehouse });
});

// PATCH /api/warehouses/:id  (ADMIN only)
const update = asyncHandler(async (req, res) => {
  const warehouse = await prisma.warehouse.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: warehouse });
});

// DELETE /api/warehouses/:id  (ADMIN only)
const remove = asyncHandler(async (req, res) => {
  const stockCount = await prisma.stock.count({ where: { warehouseId: req.params.id } });
  if (stockCount > 0) {
    throw new AppError("Can't delete a warehouse that still has stock records. Deactivate it instead.", 409);
  }
  await prisma.warehouse.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Warehouse deleted." });
});

module.exports = { getAll, getOne, create, update, remove };
