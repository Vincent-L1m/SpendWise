import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { securityApi } from "../services/api";
import { useAuth } from "./AuthContext";

const PinContext = createContext(null);

export function PinProvider({ children }) {
  const { user } = useAuth();
  const [locked,   setLocked]   = useState(false);   // show PIN lock screen?
  const [hasPin,   setHasPin]   = useState(false);
  const [checked,  setChecked]  = useState(false);

  // Check if user has PIN set
  const checkPin = useCallback(async () => {
    if (!user) { setChecked(true); return; }
    try {
      const res = await securityApi.getStatus();
      const hp = res.data.data?.has_pin || false;
      setHasPin(hp);
      // Lock on load if PIN exists and not yet unlocked in this session
      if (hp && !sessionStorage.getItem("sw_unlocked")) setLocked(true);
    } catch { /* ignore */ }
    finally { setChecked(true); }
  }, [user]);

  useEffect(() => { checkPin(); }, [checkPin]);

  const unlock = () => {
    sessionStorage.setItem("sw_unlocked", "1");
    setLocked(false);
  };

  const lock = () => {
    sessionStorage.removeItem("sw_unlocked");
    setLocked(true);
  };

  const refreshPinStatus = async () => {
    try {
      const res = await securityApi.getStatus();
      setHasPin(res.data.data?.has_pin || false);
    } catch { /* ignore */ }
  };

  return (
    <PinContext.Provider value={{ locked, hasPin, checked, unlock, lock, refreshPinStatus }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error("usePin must be used inside PinProvider");
  return ctx;
}
