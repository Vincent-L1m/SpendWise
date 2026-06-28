import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await authApi.profile();
      setUser(res.data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    setUser(res.data.data);
    return res.data;
  };

  // Register now just calls the API — OTP step is handled in the Register page
  const register = async (data) => {
    const res = await authApi.register(data);
    return res.data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.profile();
      setUser(res.data.data);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
