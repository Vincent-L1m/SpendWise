import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import TransactionModal from "../../components/TransactionModal";
import { transactionApi } from "../../services/api";

const fmt  = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
const TC   = { income:"var(--green)", expense:"var(--red)", transfer:"var(--brand)" };
const TL   = { income:"Pemasukan", expense:"Pengeluaran", transfer:"Transfer" };
const TS   = { income:"+", expense:"−", transfer:"⇄" };

const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

// Build list of last 24 months for picker
const buildMonthOptions = () => {
  const now = new Date();
  const opts = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      label: `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`,
      year:  d.getFullYear(),
      month: d.getMonth() + 1,
      start: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`,
      end:   new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().split("T")[0],
    });
  }
  return opts;
};

const MONTH_OPTIONS = buildMonthOptions();

export default function Transactions() {
  const [list,      setList]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData,  setEditData]  = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  // Filter state
  const [filterMode, setFilterMode] = useState("month"); // "month" | "custom"
  const [selMonth,   setSelMonth]   = useState(0);       // index into MONTH_OPTIONS
  const [filters,    setFilters]    = useState({ type:"", search:"", start_date:"", end_date:"" });

  // Compute effective date range
  const getDateRange = () => {
    if (filterMode === "month") {
      const opt = MONTH_OPTIONS[selMonth];
      return { start_date: opt.start, end_date: opt.end };
    }
    return { start_date: filters.start_date, end_date: filters.end_date };
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { start_date, end_date } = getDateRange();
      const p = {};
      if (filters.type)  p.type   = filters.type;
      if (filters.search) p.search = filters.search;
      if (start_date)    p.start_date = start_date;
      if (end_date)      p.end_date   = end_date;
      const res = await transactionApi.getAll(p);
      setList(res.data.data || []);
    } catch { setList([]); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, selMonth, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    window.addEventListener("sw:reload", load);
    return () => window.removeEventListener("sw:reload", load);
  }, [load]);
  useEffect(() => {
    const openModal = () => { setShowModal(true); setEditData && setEditData(null); };
    window.addEventListener("open-add-trx", openModal);
    return () => window.removeEventListener("open-add-trx", openModal);
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try { await transactionApi.remove(deleteId); setDeleteId(null); load(); }
    catch { /**/ } finally { setDeleting(false); }
  };

  // Summary for current view
  const totalIncome  = list.filter(t=>t.type==="income") .reduce((a,t)=>a+Number(t.amount),0);
  const totalExpense = list.filter(t=>t.type==="expense").reduce((a,t)=>a+Number(t.amount)+Number(t.fee||0),0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaksi</h1>
          <p className="page-sub">{list.length} transaksi ditemukan</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditData(null); setShowModal(true); }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Tambah
        </button>
      </div>

      {/* ── Period selector ──────────────────────────── */}
      <div className="sw-card" style={{ marginBottom:"16px", padding:"14px 16px" }}>
        {/* Mode toggle */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
          {[["month","Per Bulan"],["custom","Rentang Kustom"]].map(([v,l]) => (
            <button key={v} onClick={() => setFilterMode(v)}
              style={{ padding:"6px 14px", borderRadius:"9999px", border:`1px solid ${filterMode===v?"var(--brand)":"var(--border)"}`, background:filterMode===v?"var(--brand-light)":"var(--bg-white)", color:filterMode===v?"var(--brand)":"var(--text-3)", fontSize:"12px", fontWeight:filterMode===v?"600":"400", cursor:"pointer", transition:"all .15s ease" }}>
              {l}
            </button>
          ))}
        </div>

        {filterMode === "month" ? (
          /* Month pills — scrollable */
          <div style={{ display:"flex", gap:"6px", overflowX:"auto", paddingBottom:"4px" }}>
            {MONTH_OPTIONS.map((opt, i) => (
              <button key={i} onClick={() => setSelMonth(i)}
                style={{ padding:"7px 14px", borderRadius:"9999px", border:`1px solid ${selMonth===i?"var(--brand)":"var(--border)"}`, background:selMonth===i?"var(--brand-light)":"var(--bg-white)", color:selMonth===i?"var(--brand)":"var(--text-2)", fontSize:"13px", fontWeight:selMonth===i?"600":"400", cursor:"pointer", flexShrink:0, transition:"all .15s ease", whiteSpace:"nowrap" }}>
                {i===0 ? "Bulan Ini" : opt.label}
              </button>
            ))}
          </div>
        ) : (
          /* Custom date range */
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <span style={{ fontSize:"13px", color:"var(--text-3)" }}>Dari</span>
            <input type="date" className="sw-input" style={{ width:"auto", padding:"8px 10px", fontSize:"13px" }}
              value={filters.start_date} onChange={e => setFilters(p=>({...p,start_date:e.target.value}))}/>
            <span style={{ fontSize:"13px", color:"var(--text-3)" }}>sampai</span>
            <input type="date" className="sw-input" style={{ width:"auto", padding:"8px 10px", fontSize:"13px" }}
              value={filters.end_date} onChange={e => setFilters(p=>({...p,end_date:e.target.value}))}/>
            {(filters.start_date||filters.end_date) && (
              <button className="btn-secondary" style={{ padding:"8px 12px", fontSize:"12px" }}
                onClick={() => setFilters(p=>({...p,start_date:"",end_date:""}))}>Reset</button>
            )}
          </div>
        )}
      </div>

      {/* ── Search + type filter ─────────────────────── */}
      <div className="filter-bar" style={{ marginBottom:"16px" }}>
        <div style={{ position:"relative", flex:"1 1 160px", background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"var(--radius)", display:"flex", alignItems:"center" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ position:"absolute", left:"11px", color:"var(--text-3)", pointerEvents:"none" }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input value={filters.search} onChange={e => setFilters(p=>({...p,search:e.target.value}))}
            placeholder="Cari catatan atau kategori..." className="sw-input"
            style={{ paddingLeft:"34px", background:"transparent", border:"none", outline:"none" }}/>
        </div>
        <select className="sw-select" value={filters.type} onChange={e => setFilters(p=>({...p,type:e.target.value}))}>
          <option value="">Semua Tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
          <option value="transfer">Transfer</option>
        </select>
        {filters.type && (
          <button className="btn-secondary" style={{ padding:"9px 12px", fontSize:"12px" }}
            onClick={() => setFilters(p=>({...p,type:""}))}>✕ Reset</button>
        )}
      </div>

      {/* ── Mini summary bar ─────────────────────────── */}
      {!loading && list.length > 0 && (
        <div style={{ display:"flex", gap:"10px", marginBottom:"14px", flexWrap:"wrap" }}>
          {[
            { label:"Total Pemasukan", val:fmt(totalIncome), color:"var(--green)" },
            { label:"Total Pengeluaran", val:fmt(totalExpense), color:"var(--red)" },
            { label:"Selisih", val:fmt(totalIncome-totalExpense), color:totalIncome>=totalExpense?"var(--brand)":"var(--red)" },
          ].map(s => (
            <div key={s.label} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 14px", background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"var(--radius)" }}>
              <span style={{ fontSize:"12px", color:"var(--text-3)" }}>{s.label}:</span>
              <span style={{ fontSize:"13px", fontWeight:"700", color:s.color, fontFamily:"inherit" }}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Desktop table ────────────────────────────── */}
      <div className="sw-card trx-table-wrap" style={{ padding:0 }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"48px" }}><div className="sw-spinner"/></div>
        ) : !list.length ? (
          <EmptyFiltered/>
        ) : (
          <table className="trx-table">
            <thead>
              <tr>{["Tanggal","Tipe","Catatan","Kategori","Dompet","Nominal","Biaya",""].map(h=>(
                <th key={h}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id}
                  onMouseEnter={e => e.currentTarget.style.background="var(--bg-card-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <td><span style={{ fontSize:"13px", fontWeight:"500" }}>{new Date(t.transaction_date).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"2-digit"})}</span></td>
                  <td><span style={{ padding:"3px 10px", borderRadius:"9999px", fontSize:"12px", fontWeight:"600", background:`${TC[t.type]}18`, color:TC[t.type] }}>{TL[t.type]}</span></td>
                  <td style={{ maxWidth:"150px" }}><p style={{ fontSize:"13px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.note||"—"}</p></td>
                  <td>{t.category_name
                    ? <span style={{ padding:"2px 8px", borderRadius:"9999px", fontSize:"11px", background:`${t.category_color||"#00d4ff"}18`, color:t.category_color||"var(--text-3)" }}>{t.category_name}</span>
                    : <span style={{ color:"var(--text-3)", fontSize:"13px" }}>—</span>}
                  </td>
                  <td>
                    <p style={{ fontSize:"12px", color:"var(--text-2)" }}>{t.wallet_name}</p>
                    {t.to_wallet_name && <p style={{ fontSize:"11px", color:"var(--text-3)" }}>→ {t.to_wallet_name}</p>}
                  </td>
                  <td style={{ textAlign:"right" }}>
                    <p style={{ fontWeight:"700", color:TC[t.type], fontFamily:"inherit", fontSize:"14px" }}>{TS[t.type]}{fmt(t.amount)}</p>
                  </td>
                  <td style={{ textAlign:"right" }}>
                    {Number(t.fee||0) > 0
                      ? <span style={{ fontSize:"12px", color:"var(--amber)", fontWeight:"600" }}>{fmt(t.fee)}</span>
                      : <span style={{ fontSize:"12px", color:"var(--text-3)" }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display:"flex", gap:"5px", justifyContent:"flex-end" }}>
                      <button className="btn-icon" onClick={() => { setEditData(t); setShowModal(true); }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      </button>
                      <button className="btn-icon" style={{ color:"var(--red)" }} onClick={() => setDeleteId(t.id)}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Mobile card list ──────────────────────────── */}
      <div className="trx-card-list">
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"40px" }}><div className="sw-spinner"/></div>
        ) : !list.length ? <EmptyFiltered/> :
          list.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", marginBottom:"6px" }}>
              <div style={{ width:34, height:34, borderRadius:"50%", border:`1px solid ${TC[t.type]}`, background:`${TC[t.type]}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"14px", fontWeight:"700", color:TC[t.type] }}>
                {TS[t.type]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:"13px", fontWeight:"600", color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {t.note || t.category_name || TL[t.type]}
                </p>
                <p style={{ fontSize:"11px", color:"var(--text-3)" }}>
                  {t.wallet_name}{t.to_wallet_name ? ` → ${t.to_wallet_name}` : ""} · {new Date(t.transaction_date).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}
                </p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px", flexShrink:0 }}>
                <p style={{ fontSize:"14px", fontWeight:"700", color:TC[t.type], fontFamily:"inherit" }}>{TS[t.type]}{fmt(t.amount)}</p>
                {Number(t.fee||0) > 0 && <p style={{ fontSize:"10px", color:"var(--amber)" }}>+fee {fmt(t.fee)}</p>}
                <div style={{ display:"flex", gap:"5px" }}>
                  <button className="btn-icon" style={{ width:"24px", height:"24px" }} onClick={() => { setEditData(t); setShowModal(true); }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                  <button className="btn-icon" style={{ width:"24px", height:"24px", color:"var(--red)" }} onClick={() => setDeleteId(t.id)}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth:"360px", textAlign:"center" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,var(--red),transparent)" }}/>
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>🗑️</div>
            <h3 style={{ fontFamily:"inherit", fontSize:"17px", fontWeight:"700", color:"var(--text)", marginBottom:"8px" }}>Hapus Transaksi?</h3>
            <p style={{ fontSize:"13px", color:"var(--text-2)", marginBottom:"24px", lineHeight:"1.6" }}>Saldo dompet akan dikembalikan. Tindakan ini tidak bisa dibatalkan.</p>
            <div style={{ display:"flex", gap:"10px" }}>
              <button className="btn-secondary" style={{ flex:1 }} onClick={() => setDeleteId(null)} disabled={deleting}>Batal</button>
              <button className="btn-danger" style={{ flex:1 }} onClick={handleDelete} disabled={deleting}>{deleting?"Menghapus...":"Ya, Hapus"}</button>
            </div>
          </div>
        </div>
      )}

      <TransactionModal open={showModal} editData={editData}
        onClose={() => { setShowModal(false); setEditData(null); }}
        onSuccess={() => { setShowModal(false); setEditData(null); load(); }}/>
    </DashboardLayout>
  );
}

function EmptyFiltered() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 24px" }}>
      <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔍</div>
      <p style={{ fontSize:"15px", fontWeight:"600", color:"var(--text)", marginBottom:"6px" }}>Tidak ada transaksi</p>
      <p style={{ fontSize:"13px", color:"var(--text-3)" }}>Coba pilih bulan lain atau ubah filter</p>
    </div>
  );
}
