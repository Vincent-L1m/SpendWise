const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/userController");
const { updateProfileValidation, changePasswordValidation } = require("../validators/userValidator");

router.use(auth);
router.get("/profile",         ctrl.getProfile);
router.put("/profile",         updateProfileValidation, ctrl.updateProfile);
router.put("/change-password", changePasswordValidation, ctrl.changePassword);
router.put("/salary-cycle",    ctrl.updateSalaryCycle);
router.put("/theme",           ctrl.updateTheme);

module.exports = router;
