const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { AppError, asyncHandler } = require("../utils/AppError");

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  warehouseId: true,
  warehouse: { select: { id: true, name: true, code: true } },
  createdAt: true,
};

// GET /api/users
const getAll = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: SAFE_SELECT,
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: users });
});

// GET /api/users/:id
const getOne = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: SAFE_SELECT,
  });
  if (!user) throw new AppError("User not found.", 404);
  res.json({ success: true, data: user });
});

// PATCH /api/users/:id
const update = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: SAFE_SELECT,
  });

  res.json({ success: true, data: updated });
});

// DELETE /api/users/:id  (soft delete — flips isActive to false)
const deactivate = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError("You can't deactivate your own account.", 400);
  }

  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true, message: "User deactivated." });
});

module.exports = { getAll, getOne, update, deactivate };
