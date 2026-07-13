const express = require("express");

const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/warehouses", require("./warehouse.routes"));
router.use("/categories", require("./category.routes"));
router.use("/products", require("./product.routes"));
router.use("/stock", require("./stock.routes"));
router.use("/dashboard", require("./dashboard.routes"));

module.exports = router;
