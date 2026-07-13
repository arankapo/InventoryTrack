const { z } = require("zod");

const auth = {
  register: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "MANAGER", "STAFF"]).optional(),
    warehouseId: z.string().uuid().optional().nullable(),
  }),
  login: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
};

const warehouse = {
  create: z.object({
    name: z.string().min(2),
    code: z.string().min(2).max(20),
    address: z.string().optional(),
  }),
  update: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).max(20).optional(),
    address: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};

const category = {
  create: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
  }),
  update: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
};

const product = {
  create: z.object({
    sku: z.string().min(1),
    name: z.string().min(2),
    description: z.string().optional(),
    unit: z.string().default("pcs"),
    price: z.number().int().nonnegative().default(0),
    reorderPoint: z.number().int().nonnegative().default(10),
    categoryId: z.string().uuid().optional().nullable(),
  }),
  update: z.object({
    sku: z.string().min(1).optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    price: z.number().int().nonnegative().optional(),
    reorderPoint: z.number().int().nonnegative().optional(),
    categoryId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
};

const stock = {
  movement: z
    .object({
      productId: z.string().uuid(),
      warehouseId: z.string().uuid().optional(), // ignored for STAFF/MANAGER, forced to their own
      type: z.enum(["IN", "OUT", "TRANSFER", "ADJUSTMENT"]),
      // Positive for IN/OUT/TRANSFER. ADJUSTMENT may be negative (a signed delta).
      quantity: z.number().int().refine((v) => v !== 0, "Quantity can't be zero"),
      note: z.string().optional(),
      destinationWarehouseId: z.string().uuid().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type !== "ADJUSTMENT" && data.quantity < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quantity must be positive for this movement type",
          path: ["quantity"],
        });
      }
      if (data.type === "TRANSFER" && !data.destinationWarehouseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "destinationWarehouseId is required for TRANSFER movements",
          path: ["destinationWarehouseId"],
        });
      }
    }),
};

const user = {
  update: z.object({
    name: z.string().min(2).optional(),
    role: z.enum(["ADMIN", "MANAGER", "STAFF"]).optional(),
    warehouseId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
    password: z.string().min(6).optional(),
  }),
};

module.exports = { auth, warehouse, category, product, stock, user };
