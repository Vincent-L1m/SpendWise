import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme, accent, setAccent, ACCENTS } = useTheme();
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";

  if (compact) {
    // Just icon button for topbar
    return (
      <button
        onClick={toggleTheme}
        title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
        style={{
          width: 34, height: 34,
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg-white)",
          color: "var(--text-3)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s",
          flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-3)"; }}
      >
        {isDark ? (
          // Sun
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          // Moon
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>
    );
  }

  // Full panel (for settings/profile page)
  return (
    <div>
      {/* Theme mode */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
          Mode Tampilan
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { val:"light", label:"Terang", icon:"☀️" },
            { val:"dark",  label:"Gelap",  icon:"🌙" },
          ].map(opt => (
            <button key={opt.val} onClick={() => { if (theme !== opt.val) toggleTheme(); }}
              style={{
                flex: 1, padding: "12px 8px",
                borderRadius: 10,
                border: `2px solid ${theme === opt.val ? "var(--brand)" : "var(--border)"}`,
                background: theme === opt.val ? "var(--brand-light)" : "var(--bg-subtle)",
                cursor: "pointer", transition: "all .15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}>
              <span style={{ fontSize: 22 }}>{opt.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme === opt.val ? "var(--brand)" : "var(--text-3)" }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
          Warna Aksen
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {ACCENTS.map(a => (
            <button key={a.id} onClick={() => setAccent(a.id)}
              title={a.label}
              style={{
                width: 36, height: 36,
                borderRadius: "50%",
                background: a.hex,
                border: accent === a.id ? `3px solid var(--text)` : "3px solid transparent",
                cursor: "pointer",
                outline: accent === a.id ? `2px solid ${a.hex}` : "none",
                outlineOffset: 2,
                transition: "all .15s",
                transform: accent === a.id ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 8 }}>
          Warna dipilih: <strong style={{ color: "var(--brand)" }}>{ACCENTS.find(a => a.id === accent)?.label}</strong>
        </p>
      </div>
    </div>
  );
}
