const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/budgetController");

router.use(auth);
router.get("/",       ctrl.getAll);
router.post("/",      ctrl.upsert);
router.delete("/:id", ctrl.remove);

module.exports = router;
