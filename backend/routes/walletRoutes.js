const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/walletController");

router.use(auth);
router.get("/",                    ctrl.getAll);
router.post("/",                   ctrl.create);
router.delete("/:id",              ctrl.remove);
router.put("/:id/adjust",          ctrl.adjustBalance);
router.get("/:id/transactions",    ctrl.getTransactions);

module.exports = router;
