const { AppError } = require("../utils/AppError");

// Usage: router.post("/", validate(schema), controller.create)
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = `${firstIssue.path.join(".")}: ${firstIssue.message}`;
    return next(new AppError(message, 422));
  }

  req.body = result.data;
  next();
};

module.exports = validate;
