const express = require("express");
const ctrl = require("../controllers/auth.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { auth } = require("../validators/schemas");

const router = express.Router();

router.post("/login", validate(auth.login), ctrl.login);
// Only an already-logged-in ADMIN can provision new accounts.
router.post("/register", protect, authorize("ADMIN"), validate(auth.register), ctrl.register);
router.get("/me", protect, ctrl.me);

module.exports = router;
