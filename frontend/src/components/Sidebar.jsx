import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { to:"/dashboard",    icon:"📊", label:"Dashboard"       },
  { to:"/transactions", icon:"💸", label:"Transaksi"       },
  { to:"/wallets",      icon:"👛", label:"Wallet"          },
  { to:"/budgets",      icon:"🎯", label:"Anggaran"        },
  { to:"/savings",      icon:"🏦", label:"Target Tabungan" },
  { to:"/split-bill",   icon:"🧾", label:"Split Bill"      },
  { to:"/insights",     icon:"🤖", label:"Analisis AI"     },
  { to:"/reports",      icon:"📈", label:"Laporan"         },
  { to:"/categories",   icon:"🏷️", label:"Kategori"       },
  { to:"/reminders",    icon:"🔔", label:"Pengingat"       },
  { to:"/recurring",    icon:"🔁", label:"Berulang"        },
  { to:"/export",      icon:"📥", label:"Export"         },
  { to:"/profile",      icon:"👤", label:"Profil"          },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { logout }   = useAuth();

  return (
    <div style={s.sidebar}>
      <div style={s.logo}>
        <span style={s.logoText}>💰 SpendWise</span>
      </div>
      <nav style={s.nav}>
        {menuItems.map(({ to, icon, label }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} style={{ textDecoration:"none" }}>
              <div style={{ ...s.item, ...(active ? s.itemActive : {}) }}>
                <span style={s.icon}>{icon}</span>
                <span style={{ ...s.label, color: active ? "#00e5a0" : "#94a3b8" }}>{label}</span>
                {active && <div style={s.activeDot}/>}
              </div>
            </Link>
          );
        })}
      </nav>
      <div style={s.bottom}>
        <button onClick={logout} style={s.logoutBtn}>
          <span>🚪</span><span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

const s = {
  sidebar:    { width:"220px", minHeight:"100vh", background:"var(--bg)", borderRight:"1px solid #1e293b", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, zIndex:100 },
  logo:       { padding:"24px 20px 20px", borderBottom:"1px solid #1e293b" },
  logoText:   { fontSize:"17px", fontWeight:800, color:"var(--text)", letterSpacing:"-0.3px" },
  nav:        { flex:1, padding:"12px 10px", overflowY:"auto" },
  item:       { display:"flex", alignItems:"center", gap:"10px", padding:"9px 12px", borderRadius:"8px", cursor:"pointer", marginBottom:"2px", position:"relative", transition:"background .15s" },
  itemActive: { background:"rgba(0,229,160,0.08)" },
  icon:       { fontSize:"15px", width:"20px", textAlign:"center" },
  label:      { fontSize:"13px", fontWeight:500 },
  activeDot:  { position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:"3px", height:"20px", background:"#00e5a0", borderRadius:"0 3px 3px 0" },
  bottom:     { padding:"12px 10px 20px", borderTop:"1px solid #1e293b" },
  logoutBtn:  { width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"9px 12px", borderRadius:"8px", background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", fontSize:"13px", fontWeight:500 },
};
