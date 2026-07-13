const express = require("express");
const ctrl = require("../controllers/category.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { category } = require("../validators/schemas");

const router = express.Router();

router.use(protect);

router.get("/", ctrl.getAll);
router.post("/", authorize("ADMIN", "MANAGER"), validate(category.create), ctrl.create);
router.patch("/:id", authorize("ADMIN", "MANAGER"), validate(category.update), ctrl.update);
router.delete("/:id", authorize("ADMIN"), ctrl.remove);

module.exports = router;
