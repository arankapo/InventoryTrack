const express = require("express");
const ctrl = require("../controllers/product.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { product } = require("../validators/schemas");

const router = express.Router();

router.use(protect);

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/", authorize("ADMIN", "MANAGER"), validate(product.create), ctrl.create);
router.patch("/:id", authorize("ADMIN", "MANAGER"), validate(product.update), ctrl.update);
router.delete("/:id", authorize("ADMIN"), ctrl.remove);

module.exports = router;
