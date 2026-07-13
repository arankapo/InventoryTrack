const express = require("express");
const ctrl = require("../controllers/warehouse.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { warehouse } = require("../validators/schemas");

const router = express.Router();

router.use(protect);

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/", authorize("ADMIN"), validate(warehouse.create), ctrl.create);
router.patch("/:id", authorize("ADMIN"), validate(warehouse.update), ctrl.update);
router.delete("/:id", authorize("ADMIN"), ctrl.remove);

module.exports = router;
