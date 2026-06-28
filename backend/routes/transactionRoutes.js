const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/transactionController");

router.use(auth);
router.get("/summary", ctrl.getSummary);
router.get("/chart",   ctrl.getChart);
router.get("/report",  ctrl.getReport);
router.get("/export",  ctrl.getExport);
router.get("/",        ctrl.getAll);
router.post("/",       ctrl.create);
router.put("/:id",     ctrl.update);
router.delete("/:id",  ctrl.remove);

module.exports = router;
