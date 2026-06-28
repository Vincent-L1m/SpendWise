import { useAuth } from "./context/AuthContext";
import { usePin }  from "./context/PinContext";
import PinLock     from "./components/PinLock";
import AppRoutes   from "./routes/AppRoutes";

function App() {
  const { user }          = useAuth();
  const { locked, checked } = usePin();

  // Show PIN lock screen if user is logged in and app is locked
  if (user && checked && locked) return <PinLock />;

  return <AppRoutes />;
}

export default App;
