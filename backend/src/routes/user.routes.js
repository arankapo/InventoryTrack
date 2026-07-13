const express = require("express");
const ctrl = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { user } = require("../validators/schemas");

const router = express.Router();

router.use(protect, authorize("ADMIN"));

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.patch("/:id", validate(user.update), ctrl.update);
router.delete("/:id", ctrl.deactivate);

module.exports = router;
