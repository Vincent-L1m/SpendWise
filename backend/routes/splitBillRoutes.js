const express = require("express");
const router  = express.Router();
const { getAll, create, togglePaid, remove } = require("../controllers/splitBillController");
const auth = require("../middleware/authMiddleware");

router.use(auth);
router.get("/",                       getAll);
router.post("/",                      create);
router.put("/members/:memberId/paid", togglePaid);
router.delete("/:id",                 remove);

module.exports = router;
