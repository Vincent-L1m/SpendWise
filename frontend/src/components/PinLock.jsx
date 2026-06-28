import Logo from "./Logo";
import { useState, useEffect, useRef } from "react";
import { usePin  } from "../context/PinContext";
import { useAuth } from "../context/AuthContext";
import { securityApi } from "../services/api";

export default function PinLock() {
  const { unlock }       = usePin();
  const { user, logout } = useAuth();
  const [pin,     setPin]    = useState("");
  const [error,   setError]  = useState("");
  const [loading, setLoading]= useState(false);
  const [shake,   setShake]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const verify = async (p) => {
    setLoading(true); setError("");
    try {
      await securityApi.verifyPin({ pin: p });
      unlock();
    } catch {
      setError("PIN salah. Coba lagi.");
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); inputRef.current?.focus(); }, 600);
    } finally { setLoading(false); }
  };

  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(val); setError("");
    if (val.length === 6) verify(val);
  };

  const pressBtn = (d) => {
    if (loading) return;
    if (d === "del") { setPin(p => p.slice(0, -1)); inputRef.current?.focus(); return; }
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next); setError("");
    if (next.length === 6) verify(next);
    inputRef.current?.focus();
  };

  const KEYS = ["1","2","3","4","5","6","7","8","9","","0","del"];
  const firstName = user?.fullname?.split(" ")[0] || "kamu";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"var(--bg)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, flexDirection:"column",
    }}>
      <div style={{
        width:"100%", maxWidth:340,
        background:"var(--bg-white)",
        border:"1px solid #E4E7EC",
        borderRadius:20,
        padding:"32px 28px",
        boxShadow:"0 4px 24px rgba(16,24,40,0.1)",
        display:"flex", flexDirection:"column", alignItems:"center",
      }}>
        {/* Logo */}
        <div style={{ marginBottom:24, display:"flex", justifyContent:"center" }}>
          <Logo height={40} />
        </div>

        {/* Lock icon */}
        <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--brand-light)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>

        <h2 style={{ fontSize:18, fontWeight:700, color:"var(--text)", margin:0, marginBottom:4 }}>Masukkan PIN</h2>
        <p style={{ fontSize:13, color:"var(--text-3)", marginBottom:6, textAlign:"center" }}>
          Selamat datang kembali, <strong style={{ color:"var(--text)" }}>{firstName}</strong>
        </p>
        <p style={{ fontSize:12, color:"var(--text-4)", marginBottom:20 }}>Ketik langsung atau tekan tombol di bawah</p>

        {/* Hidden input captures keyboard */}
        <input
          ref={inputRef} type="tel" inputMode="numeric" pattern="[0-9]*"
          value={pin} onChange={handleInput} maxLength={6}
          style={{ position:"absolute", opacity:0, pointerEvents:"none", width:0, height:0 }}
        />

        {/* PIN dots */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{ display:"flex", gap:12, marginBottom:8, cursor:"text",
            animation: shake ? "shake .5s ease" : "none" }}
        >
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{
              width:14, height:14, borderRadius:"50%",
              background: i < pin.length ? "var(--brand)" : "transparent",
              border: `2px solid ${i < pin.length ? "var(--brand)" : "var(--border-2)"}`,
              transition:"all .15s",
            }}/>
          ))}
        </div>

        {error && (
          <p style={{ fontSize:12, color:"var(--red)", margin:"8px 0 4px", fontWeight:500 }}>{error}</p>
        )}

        {/* Numpad */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, width:"100%", marginTop:14 }}>
          {KEYS.map((d, i) => (
            <button key={i} onClick={() => pressBtn(d)}
              disabled={loading || (d !== "del" && d !== "" && pin.length >= 6)}
              style={{
                height:54,
                background: d === "" ? "transparent" : d === "del" ? "var(--bg)" : "var(--bg)",
                border: d === "" ? "none" : "1px solid #E4E7EC",
                borderRadius:10,
                color: d === "del" ? "var(--text-3)" : "var(--text)",
                fontSize: d === "del" ? 13 : 20,
                fontWeight: d === "del" ? 500 : 600,
                cursor: d === "" ? "default" : "pointer",
                transition:"background .1s",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
              onMouseDown={e => { if (d && d !== "") e.currentTarget.style.background = "var(--border)"; }}
              onMouseUp={e => { if (d && d !== "") e.currentTarget.style.background = "var(--bg)"; }}
              onMouseLeave={e => { if (d && d !== "") e.currentTarget.style.background = d===""?"transparent":"var(--bg)"; }}
            >
              {d === "del" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/>
                  <line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
                </svg>
              ) : d}
            </button>
          ))}
        </div>

        <button onClick={async () => { await logout(); window.location.href = "/login"; }}
          style={{ marginTop:20, background:"none", border:"none", color:"var(--text-4)", fontSize:13, cursor:"pointer" }}>
          Ganti akun
        </button>
      </div>
    </div>
  );
}
