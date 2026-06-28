import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { userApi } from "../services/api";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext(null);

const ACCENTS = [
  { id:"blue",    label:"Biru",    hex:"#1B4FD8" },
  { id:"indigo",  label:"Indigo",  hex:"#4F46E5" },
  { id:"violet",  label:"Violet",  hex:"#7C3AED" },
  { id:"emerald", label:"Hijau",   hex:"#059669" },
  { id:"rose",    label:"Merah",   hex:"#E11D48" },
  { id:"amber",   label:"Amber",   hex:"#D97706" },
  { id:"slate",   label:"Abu",     hex:"var(--text-2)" },
];

export function ThemeProvider({ children }) {
  const { user } = useAuth();

  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem("sw_theme") || "light"; } catch { return "light"; }
  });

  const [accent, setAccentState] = useState(() => {
    try { return localStorage.getItem("sw_accent") || "blue"; } catch { return "blue"; }
  });

  // Sync with user preference from server
  useEffect(() => {
    if (user?.theme_preference) setThemeState(user.theme_preference);
  }, [user?.theme_preference]);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("sw_theme", theme); } catch {}
  }, [theme]);

  // Apply accent to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    try { localStorage.setItem("sw_accent", accent); } catch {}
  }, [accent]);

  const toggleTheme = useCallback(async () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    try { await userApi.updateTheme({ theme: next }); } catch {}
  }, [theme]);

  const setTheme = useCallback(async (t) => {
    setThemeState(t);
    try { await userApi.updateTheme({ theme: t }); } catch {}
  }, []);

  const setAccent = useCallback((a) => {
    setAccentState(a);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, accent, setAccent, ACCENTS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
