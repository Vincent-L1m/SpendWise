/**
 * budgetNotifier.js
 * Cek semua budget user, kirim email jika 80% atau 100% terpakai
 * Dipanggil setelah setiap transaksi expense dibuat
 */
const db = require("../config/database");
const { sendBudgetEmail } = require("./emailTemplates");

const checkBudgetAndNotify = async (userId) => {
  try {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    // Ambil semua budget bulan ini beserta pengeluaran aktual
    const [budgets] = await db.execute(`
      SELECT b.id, b.amount, b.notified_80, b.notified_100,
             c.name AS category_name,
             u.email, u.fullname,
             COALESCE((
               SELECT SUM(t.amount + t.fee)
               FROM transactions t
               WHERE t.user_id = b.user_id AND t.category_id = b.category_id
                 AND t.type = 'expense'
                 AND MONTH(t.transaction_date) = b.month
                 AND YEAR(t.transaction_date)  = b.year
             ), 0) AS spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      JOIN users u ON b.user_id = u.id
      WHERE b.user_id = ? AND b.month = ? AND b.year = ?
    `, [userId, month, year]);

    for (const budget of budgets) {
      const percent = (Number(budget.spent) / Number(budget.amount)) * 100;

      if (percent >= 100 && !budget.notified_100) {
        await sendBudgetEmail(budget.email, budget.fullname, {
          category: budget.category_name,
          spent:    Number(budget.spent),
          limit:    Number(budget.amount),
          percent:  Math.round(percent),
          level:    "100",
        });
        await db.execute("UPDATE budgets SET notified_100=1 WHERE id=?", [budget.id]);

      } else if (percent >= 80 && !budget.notified_80) {
        await sendBudgetEmail(budget.email, budget.fullname, {
          category: budget.category_name,
          spent:    Number(budget.spent),
          limit:    Number(budget.amount),
          percent:  Math.round(percent),
          level:    "80",
        });
        await db.execute("UPDATE budgets SET notified_80=1 WHERE id=?", [budget.id]);
      }
    }
  } catch (err) {
    console.error("Budget notifier error:", err.message);
  }
};

module.exports = { checkBudgetAndNotify };
