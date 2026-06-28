const express = require("express");
const router  = express.Router();

const authMiddleware      = require("../middleware/authMiddleware");
const securityController  = require("../controllers/securityController");

// All routes require authentication
router.use(authMiddleware);

router.get( "/status",            securityController.getStatus);
router.post("/create-pin",        securityController.createPin);
router.post("/verify-pin",        securityController.verifyPin);
router.put( "/change-pin",        securityController.changePin);
router.put( "/remove-pin",        securityController.removePin);
router.put( "/enable-biometric",  securityController.enableBiometric);
router.put( "/disable-biometric", securityController.disableBiometric);

module.exports = router;
