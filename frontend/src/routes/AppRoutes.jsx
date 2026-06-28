import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute, PublicRoute } from "../components/ProtectedRoute";

import Landing      from "../pages/landing/Landing";
import Login        from "../pages/auth/Login";
import Register     from "../pages/auth/Register";
import Dashboard    from "../pages/dashboard/Dashboard";
import Transactions from "../pages/transactions/Transactions";
import Wallets      from "../pages/wallets/Wallets";
import Categories   from "../pages/categories/Categories";
import Reports      from "../pages/reports/Reports";
import Budgets      from "../pages/budgets/Budgets";
import Reminders    from "../pages/reminders/Reminders";
import Recurring    from "../pages/recurring/Recurring";
import Profile      from "../pages/profile/Profile";
import Savings      from "../pages/savings/Savings";
import SplitBill    from "../pages/splitbill/SplitBill";
import Insights     from "../pages/insights/Insights";
import Export       from "../pages/export/Export";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public landing — always accessible */}
      <Route path="/"         element={<Landing />} />

      {/* Auth — redirect to dashboard if already logged in */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* App — require login */}
      <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
      <Route path="/wallets"      element={<PrivateRoute><Wallets /></PrivateRoute>} />
      <Route path="/categories"   element={<PrivateRoute><Categories /></PrivateRoute>} />
      <Route path="/reports"      element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/budgets"      element={<PrivateRoute><Budgets /></PrivateRoute>} />
      <Route path="/reminders"    element={<PrivateRoute><Reminders /></PrivateRoute>} />
      <Route path="/recurring"    element={<PrivateRoute><Recurring /></PrivateRoute>} />
      <Route path="/profile"      element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/savings"      element={<PrivateRoute><Savings /></PrivateRoute>} />
      <Route path="/split-bill"   element={<PrivateRoute><SplitBill /></PrivateRoute>} />
      <Route path="/insights"     element={<PrivateRoute><Insights /></PrivateRoute>} />
      <Route path="/export"       element={<PrivateRoute><Export /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
