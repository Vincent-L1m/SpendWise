import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { budgetApi, categoryApi } from "../../services/api";

const fmt = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [budgets,    setBudgets]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [deleteId,   setDeleteId]   = useState(null);
  const [form, setForm] = useState({ category_id:"", amount:"" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        budgetApi.getAll({ month, year }),
        categoryApi.getAll("expense"),
      ]);
      setBudgets(b.data.data || []);
      setCategories(c.data.data || []);
    } catch { setBudgets([]); }
    finally { setLoading(false); }
  }, [month, year]);
  useEffect(() => { load(); }, [load]);

  const usedCategoryIds = budgets.map(b => b.category_id);
  const availableCats = categories.filter(c => !usedCategoryIds.includes(c.id));

  const handleSave = async (e) => {
    e.preventDefault(); setError("");
    if (!form.category_id) return setError("Pilih kategori.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Nominal budget harus lebih dari 0.");
    setSaving(true);
    try {
      await budgetApi.upsert({ category_id: Number(form.category_id), amount: Number(form.amount), month, year });
      setShowForm(false);
      setForm({ category_id:"", amount:"" });
      load();
    } catch(err) { setError(err.response?.data?.message || "Gagal menyimpan budget."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await budgetApi.remove(deleteId); setDeleteId(null); load(); } catch { /**/ }
  };

  const totalBudget = budgets.reduce((a,b)=>a+b.amount,0);
  const totalSpent   = budgets.reduce((a,b)=>a+b.spent,0);
  const yearOpts = Array.from({length:3},(_,i)=>now.getFullYear()-1+i);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget Limit</h1>
          <p className="page-sub">Atur batas pengeluaran per kategori</p>
        </div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <select className="sw-select" value={month} onChange={e=>setMonth(Number(e.target.value))}>
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="sw-select" value={year} onChange={e=>setYear(Number(e.target.value))}>
            {yearOpts.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-primary" onClick={()=>{setShowForm(true);setError("");}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Tambah Budget
          </button>
        </div>
      </div>

      {/* Overall summary */}
      {!loading && budgets.length > 0 && (
        <div className="sw-card" style={{ marginBottom:"20px", padding:"18px 22px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
            <div>
              <p style={{ fontSize:"12px", color:"var(--text-3)" }}>Total Budget Bulan Ini</p>
              <p style={{ fontFamily:"inherit", fontSize:"20px", fontWeight:"700", color:"var(--text)" }}>{fmt(totalBudget)}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:"12px", color:"var(--text-3)" }}>Terpakai</p>
              <p style={{ fontFamily:"inherit", fontSize:"20px", fontWeight:"700", color: totalSpent > totalBudget ? "var(--red)" : "var(--brand)" }}>{fmt(totalSpent)}</p>
            </div>
          </div>
          <div style={{ height:"8px", background:"var(--bg-subtle)", borderRadius:"9999px", overflow:"hidden" }}>
            <div style={{ width:`${Math.min(100, totalBudget>0?(totalSpent/totalBudget*100):0)}%`, height:"100%", background: totalSpent > totalBudget ? "var(--red)" : "linear-gradient(90deg,var(--brand),var(--green))", borderRadius:"9999px", transition:"width 0.4s ease" }}/>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"60px"}}><div className="sw-spinner"/></div>
      ) : budgets.length === 0 ? (
        <div className="sw-card" style={{ textAlign:"center", padding:"48px 20px" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🎯</div>
          <p style={{ fontSize:"15px", fontWeight:"600", color:"var(--text)", marginBottom:"6px" }}>Belum ada budget</p>
          <p style={{ fontSize:"13px", color:"var(--text-3)", marginBottom:"20px" }}>Atur batas pengeluaran per kategori agar keuangan lebih terkontrol</p>
          <button className="btn-primary" onClick={()=>setShowForm(true)} style={{ padding:"9px 20px", fontSize:"13px" }}>+ Buat Budget</button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {budgets.map(b => {
            const pct = Math.min(100, b.percent);
            const over = b.spent > b.amount;
            const color = over ? "var(--red)" : pct > 80 ? "var(--amber)" : "var(--green)";
            return (
              <div key={b.id} className="hover-lift sw-card" style={{ padding:"16px 18px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{ width:"36px", height:"36px", borderRadius:"var(--radius)", background:`${b.category_color||"#00d4ff"}18`, border:`1px solid ${b.category_color||"var(--border)"}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🎯</div>
                    <div>
                      <p style={{ fontSize:"14px", fontWeight:"700", color:"var(--text)" }}>{b.category_name || "Tanpa Kategori"}</p>
                      <p style={{ fontSize:"11px", color:"var(--text-3)" }}>Batas: {fmt(b.amount)}</p>
                    </div>
                  </div>
                  <button className="btn-icon" style={{ color:"var(--red)" }} onClick={()=>setDeleteId(b.id)}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                </div>
                <div style={{ height:"8px", background:"var(--bg-subtle)", borderRadius:"9999px", overflow:"hidden", marginBottom:"8px" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:"9999px", transition:"width 0.4s ease" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:"12px", color:"var(--text-2)" }}>
                    Terpakai: <strong style={{ color }}>{fmt(b.spent)}</strong>
                  </span>
                  <span style={{ fontSize:"12px", fontWeight:"700", color: over ? "var(--red)" : "var(--text-3)" }}>
                    {over ? `Lebih ${fmt(b.spent - b.amount)}` : `Sisa ${fmt(b.remaining)}`}
                  </span>
                </div>
                {over && (
                  <p style={{ fontSize:"11px", color:"var(--red)", marginTop:"6px", fontWeight:"600" }}>⚠️ Budget terlampaui!</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add budget modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal-box" style={{maxWidth:480}}>
            <div className="modal-header">
              <h2 className="modal-title">Tambah Budget</h2>
              <button className="btn-icon" onClick={()=>setShowForm(false)}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{marginBottom:16}}>{error}</div>}
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="sw-label">Kategori *</label>
                  <select className="sw-select" value={form.category_id} onChange={e=>setForm(p=>({...p,category_id:e.target.value}))} required>
                    <option value="">— Pilih Kategori —</option>
                    {availableCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {availableCats.length === 0 && <p style={{fontSize:12,color:"var(--text-3)",marginTop:6}}>Semua kategori sudah punya budget bulan ini</p>}
                </div>
                <div className="form-group">
                  <label className="sw-label">Batas Pengeluaran (Rp) *</label>
                  <div style={{display:"flex",border:"1.5px solid var(--brand)",borderRadius:"var(--radius)",overflow:"hidden",background:"var(--bg-white)",boxShadow:"0 0 0 3px rgba(27,79,216,0.1)"}}>
                    <span style={{padding:"0 16px",fontSize:14,fontWeight:600,color:"var(--text-3)",borderRight:"1px solid var(--border)",display:"flex",alignItems:"center",flexShrink:0}}>Rp</span>
                    <input type="number" min="1" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}
                      placeholder="500.000" required autoFocus
                      style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"12px 16px",fontSize:22,fontWeight:700,color:"var(--text)"}}/>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setShowForm(false)}>Batal</button>
              <button className="btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Menyimpan..." : "Buat Budget"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-box" style={{maxWidth:"380px"}}>
            <div className="modal-body" style={{textAlign:"center",padding:"32px 28px"}}>
              <div style={{fontSize:44,marginBottom:14}}>🗑️</div>
              <h3 style={{fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:8}}>Hapus Budget Ini?</h3>
              <p style={{fontSize:14,color:"var(--text-3)"}}>Batas pengeluaran untuk kategori ini akan dihapus permanen.</p>
            </div>
            <div className="modal-footer" style={{justifyContent:"center",gap:12}}>
              <button className="btn-secondary" style={{minWidth:100}} onClick={()=>setDeleteId(null)}>Batal</button>
              <button className="btn-danger"    style={{minWidth:100}} onClick={handleDelete}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
