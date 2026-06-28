import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePin  } from "../context/PinContext";
import ThemePanel from "../components/ThemePanel";
import Logo from "../components/Logo";

const NAV_GROUPS = [
  {
    label: "Utama",
    items: [
      { path:"/dashboard",    label:"Dashboard",      icon:"grid"    },
      { path:"/transactions", label:"Transaksi",       icon:"list"    },
      { path:"/wallets",      label:"Dompet",          icon:"wallet"  },
    ]
  },
  {
    label: "Perencanaan",
    items: [
      { path:"/budgets",      label:"Anggaran",        icon:"target"  },
      { path:"/savings",      label:"Target Tabungan", icon:"piggy"   },
      { path:"/split-bill",   label:"Split Bill",      icon:"users"   },
    ]
  },
  {
    label: "Analitik",
    items: [
      { path:"/insights",     label:"Analisis",        icon:"chart"   },
      { path:"/reports",      label:"Laporan",         icon:"bar"     },
      { path:"/export",       label:"Export",          icon:"download"},
    ]
  },
  {
    label: "Lainnya",
    items: [
      { path:"/categories",   label:"Kategori",        icon:"tag"     },
      { path:"/reminders",    label:"Pengingat",       icon:"bell"    },
      { path:"/recurring",    label:"Berulang",        icon:"repeat"  },
      { path:"/profile",      label:"Pengaturan",      icon:"settings"},
    ]
  }
];

const BOTTOM_NAV = [
  { path:"/dashboard",    label:"Beranda",    icon:"grid"   },
  { path:"/transactions", label:"Transaksi",  icon:"list"   },
  { path:"/wallets",      label:"Dompet",     icon:"wallet" },
  { path:"/insights",     label:"Analisis",   icon:"chart"  },
  { path:"/profile",      label:"Akun",       icon:"user"   },
];

export function SvgIcon({ name, size = 16 }) {
  const p = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round" };
  switch (name) {
    case "grid":     return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case "list":     return <svg {...p}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case "wallet":   return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><circle cx="12" cy="14" r="2"/></svg>;
    case "target":   return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>;
    case "piggy":    return <svg {...p}><path d="M19 14c1.49-1.46 3-3.21 3-4.5A3.5 3.5 0 0016.5 6H15a5 5 0 000 10h2a3 3 0 003-3v-1"/><path d="M10 15v5M14 15v5M8 9h.01M12 6V4"/><rect x="2" y="11" width="13" height="8" rx="3"/></svg>;
    case "users":    return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
    case "chart":    return <svg {...p}><path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 4-7"/></svg>;
    case "bar":      return <svg {...p}><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="4" width="4" height="17"/></svg>;
    case "download": return <svg {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
    case "tag":      return <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case "bell":     return <svg {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
    case "repeat":   return <svg {...p}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    case "user":     return <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "logout":   return <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case "plus":     return <svg {...p} strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "menu":     return <svg {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
    case "close":    return <svg {...p} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    default:         return null;
  }
}

const PAGE_TITLES = {
  "/dashboard":"Dashboard", "/transactions":"Transaksi", "/wallets":"Dompet",
  "/budgets":"Anggaran", "/savings":"Target Tabungan", "/split-bill":"Split Bill",
  "/insights":"Analisis Keuangan", "/reports":"Laporan", "/export":"Export",
  "/categories":"Kategori", "/reminders":"Pengingat", "/recurring":"Transaksi Berulang",
  "/profile":"Pengaturan Akun",
};

export default function DashboardLayout({ children }) {
  const { user, logout }   = useAuth();
  const { hasPin, lock }   = usePin();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate("/login"); };
  const initials = user?.fullname
    ? user.fullname.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()
    : "SW";
  const pageTitle = PAGE_TITLES[location.pathname] || "SpendWise";

  // Dispatch custom event so Dashboard/other pages can open their own modal
  const openAddTrx = () => window.dispatchEvent(new Event("open-add-trx"));

  return (
    <div className="app-shell">
      {/* Overlay mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)}/>}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
        <div className="sidebar-logo" style={{ padding:"16px 16px 14px" }}>
          <Logo height={32} />
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}
                    className={`sidebar-item${active ? " active" : ""}`}
                    onClick={() => setMobileOpen(false)}>
                    <span className="sidebar-item-icon"><SvgIcon name={item.icon} size={16}/></span>
                    <span className="sidebar-item-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {hasPin && (
            <button onClick={lock} className="sidebar-item" style={{ width:"100%", marginBottom:2 }}>
              <span className="sidebar-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </span>
              <span className="sidebar-item-label">Kunci Layar</span>
            </button>
          )}
          <button onClick={handleLogout} className="sidebar-item" style={{ width:"100%", color:"var(--red)" }}>
            <span className="sidebar-item-icon"><SvgIcon name="logout" size={16}/></span>
            <span className="sidebar-item-label">Keluar</span>
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 10px 4px", marginTop:4 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ flex:1, overflow:"hidden" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.fullname || "Pengguna"}</div>
              <div style={{ fontSize:11, color:"var(--text-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email || ""}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        {/* Mobile header */}
        <div className="mobile-header">
          <button onClick={() => setMobileOpen(true)} style={{ width:36, height:36, borderRadius:8, border:"1px solid #E4E7EC", background:"var(--bg)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-2)" }}>
            <SvgIcon name="menu" size={18}/>
          </button>
          <Logo height={28} />
          <button onClick={openAddTrx} style={{ padding:"7px 14px", background:"var(--brand)", border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            + Tambah
          </button>
        </div>

        {/* Desktop topbar */}
        <div className="main-topbar">
          <div>
            <div className="main-topbar-title">{pageTitle}</div>
          </div>
          <div className="main-topbar-right">
            <button onClick={openAddTrx} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"var(--brand)", border:"none", borderRadius:8, color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              <SvgIcon name="plus" size={14}/>
              Tambah Transaksi
            </button>
            <ThemePanel position="inline" align="right" />
            <div style={{ width:34, height:34, borderRadius:8, background:"var(--brand)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="main-content" style={{ flex:1 }}>
          <div className="main-body">
            {children}
          </div>
        </main>

        {/* Bottom nav — mobile */}
        <nav className="bottom-nav">
          {BOTTOM_NAV.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`bottom-nav-item${active ? " active" : ""}`}>
                <SvgIcon name={item.icon} size={20}/>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
