const express = require("express");
const router  = express.Router();
const { getAll, create, addFunds, remove } = require("../controllers/savingsController");
const auth = require("../middleware/authMiddleware");

router.use(auth);
router.get("/",              getAll);
router.post("/",             create);
router.put("/:id/add-funds", addFunds);
router.delete("/:id",        remove);

module.exports = router;
