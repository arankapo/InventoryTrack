const express = require("express");
const ctrl = require("../controllers/stock.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { stock } = require("../validators/schemas");

const router = express.Router();

router.use(protect);

// All three roles can view stock & record movements — scope to their own
// warehouse happens inside the controller via resolveWarehouseScope.
router.get("/", ctrl.getLevels);
router.get("/movements", ctrl.getMovements);
router.post("/movements", validate(stock.movement), ctrl.createMovement);

module.exports = router;
