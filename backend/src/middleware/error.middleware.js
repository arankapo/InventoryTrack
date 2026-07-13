// Catches every error forwarded via next(err) or thrown inside asyncHandler.
// Must be registered LAST, after all routes, in app.js.
function errorMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong on the server.";

  // Prisma-specific error shapes, translated into friendlier messages.
  if (err.code === "P2002") {
    statusCode = 409;
    const field = err.meta?.target?.[0] || "field";
    message = `A record with that ${field} already exists.`;
  }
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found.";
  }
  if (err.code === "P2003") {
    statusCode = 409;
    message = "This action would violate a related record's constraints.";
  }

  if (process.env.NODE_ENV === "development" && !err.isOperational && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

function notFoundMiddleware(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
}

module.exports = { errorMiddleware, notFoundMiddleware };
