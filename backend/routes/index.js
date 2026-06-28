const express = require("express");
const router  = express.Router();

router.use("/auth",         require("./authRoutes"));
router.use("/users",        require("./userRoutes"));
router.use("/security",     require("./securityRoutes"));
router.use("/wallets",      require("./walletRoutes"));
router.use("/categories",   require("./categoryRoutes"));
router.use("/transactions", require("./transactionRoutes"));
router.use("/budgets",      require("./budgetRoutes"));
router.use("/reminders",    require("./reminderRoutes"));
router.use("/recurring",    require("./recurringRoutes"));
router.use("/savings",      require("./savingsRoutes"));
router.use("/split-bills",  require("./splitBillRoutes"));

module.exports = router;
