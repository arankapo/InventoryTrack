const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { signToken } = require("../utils/jwt");
const { AppError, asyncHandler } = require("../utils/AppError");

// POST /api/auth/register
// Only an authenticated ADMIN can create new accounts — this keeps user
// provisioning under control instead of exposing open public sign-up.
// (The very first admin is created via the seed script — see prisma/seed.js)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, warehouseId } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("An account with that email already exists.", 409);

  if (warehouseId) {
    const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!wh) throw new AppError("Selected warehouse doesn't exist.", 404);
  }

  const hashed = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: { name, email, password: hashed, role: role || "STAFF", warehouseId: warehouseId || null },
    select: { id: true, name: true, email: true, role: true, warehouseId: true, createdAt: true },
  });

  res.status(201).json({ success: true, data: newUser });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError("Invalid email or password.", 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError("Invalid email or password.", 401);

  const token = signToken({ id: user.id, role: user.role });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        warehouseId: user.warehouseId,
      },
    },
  });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      warehouseId: true,
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });
  res.json({ success: true, data: user });
});

module.exports = { register, login, me };
