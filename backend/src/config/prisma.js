const { PrismaClient } = require("@prisma/client");

// Reuse a single PrismaClient instance (important with nodemon's hot reload,
// otherwise every reload opens a fresh pool of DB connections).
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
