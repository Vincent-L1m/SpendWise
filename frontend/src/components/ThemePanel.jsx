import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);
const PaletteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

export default function ThemePanel({ position = "fixed", align = "right", dark = false }) {
  const { theme, toggleTheme, accent, setAccent, ACCENTS } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isDark = theme === "dark";

  // Close on outside click
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  // Smart positioning: use fixed coords to avoid any overflow/clip issues
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropW = 252;
      // Try to open right-aligned to button; clamp to viewport
      let left = rect.right - dropW;
      if (left < 8) left = rect.left;
      if (left + dropW > window.innerWidth - 8) left = window.innerWidth - dropW - 8;
      setDropPos({ top: rect.bottom + 8, left });
    }
    setOpen(o => !o);
  };

  const btnBg     = dark ? "rgba(255,255,255,0.12)" : "var(--bg-white)";
  const btnBorder = dark ? "rgba(255,255,255,0.2)"  : "var(--border)";
  const btnColor  = dark ? "#fff"                    : "var(--text-3)";

  const wrapStyle = position === "fixed"
    ? { position: "fixed", bottom: 20, right: 20, zIndex: 9000 }
    : { position: "relative", display: "inline-block" };

  return (
    <div ref={ref} style={wrapStyle}>
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={handleOpen}
        title="Kustomisasi Tampilan"
        style={{
          width: 36, height: 36,
          borderRadius: 9,
          border: `1px solid ${open ? "var(--brand)" : btnBorder}`,
          background: open ? "var(--brand)" : btnBg,
          color: open ? "#fff" : btnColor,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
          flexShrink: 0,
        }}
      >
        <PaletteIcon />
      </button>

      {/* Dropdown — rendered at fixed position to avoid any clip */}
      {open && (
        <div
          className="theme-panel-dropdown"
          style={{
            position: "fixed",
            top: position === "fixed" ? "auto" : dropPos.top,
            bottom: position === "fixed" ? 66 : "auto",
            right:  position === "fixed" ? 20 : "auto",
            left:   position === "fixed" ? "auto" : dropPos.left,
            width: 252,
            background: "var(--bg-white)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
            padding: "16px",
            zIndex: 9999,
            animation: "slideUp .15s ease both",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Kustomisasi</span>
            <button onClick={() => setOpen(false)}
              style={{ width: 22, height: 22, borderRadius: 6, background: "var(--bg-subtle)", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, lineHeight: 1 }}>
              ×
            </button>
          </div>

          {/* Mode */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Mode</p>
            <div style={{ display: "flex", background: "var(--bg-subtle)", borderRadius: 8, padding: 3, gap: 3 }}>
              {[
                { val: "light", label: "Terang", icon: <SunIcon /> },
                { val: "dark",  label: "Gelap",  icon: <MoonIcon /> },
              ].map(opt => (
                <button key={opt.val} onClick={() => { if (theme !== opt.val) toggleTheme(); }}
                  style={{
                    flex: 1, padding: "7px 4px",
                    borderRadius: 6, border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    fontSize: 12, fontWeight: 600,
                    transition: "all .15s",
                    background: theme === opt.val ? "var(--bg-white)" : "transparent",
                    color:      theme === opt.val ? "var(--brand)"    : "var(--text-3)",
                    boxShadow:  theme === opt.val ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                    whiteSpace: "nowrap",
                  }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Warna Aksen</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {ACCENTS.map(a => (
                <button key={a.id} onClick={() => setAccent(a.id)} title={a.label}
                  style={{
                    width: 28, height: 28,
                    borderRadius: "50%",
                    background: a.hex,
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    outline: accent === a.id ? `3px solid ${a.hex}` : "none",
                    outlineOffset: 2,
                    transform: accent === a.id ? "scale(1.2)" : "scale(1)",
                    transition: "all .15s",
                    position: "relative",
                  }}>
                  {accent === a.id && (
                    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", background: "var(--brand-light)", borderRadius: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }}/>
              <span style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600 }}>
                {isDark ? "🌙 Gelap" : "☀️ Terang"} · {ACCENTS.find(a => a.id === accent)?.label}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
