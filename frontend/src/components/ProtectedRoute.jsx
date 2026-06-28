import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PageLoader() {
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
      <div style={{ width:32, height:32, border:"3px solid #E4E7EC", borderTopColor:"var(--brand)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
      <p style={{ color:"var(--text-3)", fontSize:13 }}>Memuat...</p>
    </div>
  );
}

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}
