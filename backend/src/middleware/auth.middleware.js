const { verifyToken } = require("../utils/jwt");
const { AppError, asyncHandler } = require("../utils/AppError");
const prisma = require("../config/prisma");

// Verifies the Bearer token and attaches the authenticated user to req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Not authenticated. Please log in.", 401);
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new AppError("Invalid or expired token.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      warehouseId: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError("This account no longer has access.", 401);
  }

  req.user = user;
  next();
});

// Restricts a route to specific roles, e.g. authorize("ADMIN", "MANAGER")
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError("You don't have permission to perform this action.", 403);
  }
  next();
};

// For MANAGER/STAFF, forces any warehouseId in the request to match their
// own assigned warehouse. ADMIN is unrestricted and can act on any warehouse.
// Returns the warehouseId that should actually be used for the query.
function resolveWarehouseScope(req, requestedWarehouseId) {
  if (req.user.role === "ADMIN") {
    return requestedWarehouseId || undefined;
  }

  if (!req.user.warehouseId) {
    throw new AppError("Your account isn't assigned to a warehouse yet.", 403);
  }

  if (requestedWarehouseId && requestedWarehouseId !== req.user.warehouseId) {
    throw new AppError("You can only access your own warehouse's data.", 403);
  }

  return req.user.warehouseId;
}

module.exports = { protect, authorize, resolveWarehouseScope };
