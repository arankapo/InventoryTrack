const prisma = require("../config/prisma");
const { AppError, asyncHandler } = require("../utils/AppError");

const getAll = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  res.json({ success: true, data: categories });
});

const create = asyncHandler(async (req, res) => {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json({ success: true, data: category });
});

const update = asyncHandler(async (req, res) => {
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: category });
});

const remove = asyncHandler(async (req, res) => {
  const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (productCount > 0) {
    throw new AppError("Can't delete a category that still has products assigned.", 409);
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "Category deleted." });
});

module.exports = { getAll, create, update, remove };
