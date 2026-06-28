const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/recurringController");

router.use(auth);
router.get("/",            ctrl.getAll);
router.post("/",           ctrl.create);
router.post("/run-due",    ctrl.runDue);
router.put("/:id",         ctrl.update);
router.put("/:id/toggle",  ctrl.toggleActive);
router.delete("/:id",      ctrl.remove);

module.exports = router;
