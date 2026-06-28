const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const ctrl    = require("../controllers/categoryController");

router.use(auth);
router.get("/",      ctrl.getAll);
router.post("/",     ctrl.create);
router.put("/:id",   ctrl.update);
router.delete("/:id",ctrl.remove);

module.exports = router;
