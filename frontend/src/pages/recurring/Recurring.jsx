import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { recurringApi, walletApi, categoryApi } from "../../services/api";

const fmt = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
const FREQ_LABEL = { daily:"Harian", weekly:"Mingguan", monthly:"Bulanan", yearly:"Tahunan" };
const TC = { income:"var(--green)", expense:"var(--red)", transfer:"var(--brand)" };
const TL = { income:"Pemasukan", expense:"Pengeluaran", transfer:"Transfer" };
const today = () => new Date().toISOString().split("T")[0];
const EMPTY = { type:"expense", wallet_id:"", to_wallet_id:"", category_id:"", amount:"", fee:"", note:"", frequency:"monthly", interval_count:1, start_date:today(), end_date:"" };

function CloseIcon() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>;
}

export default function Recurring() {
  const [list,       setList]       = useState([]);
  const [wallets,    setWallets]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editData,   setEditData]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [deleteId,   setDeleteId]   = useState(null);
  const [running,    setRunning]    = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, w, c] = await Promise.all([recurringApi.getAll(), walletApi.getAll(), categoryApi.getAll()]);
      setList(r.data.data || []);
      setWallets(w.data.data?.wallets || []);
      setCategories(c.data.data || []);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditData(null); setForm(EMPTY); setError(""); setShowForm(true); };
  const openEdit = (r) => {
    setEditData(r);
    setForm({
      type:r.type, wallet_id:String(r.wallet_id), to_wallet_id:String(r.to_wallet_id||""),
      category_id:String(r.category_id||""), amount:String(r.amount), fee:String(r.fee||""),
      note:r.note||"", frequency:r.frequency, interval_count:r.interval_count,
      start_date:r.start_date?.slice(0,10), end_date:r.end_date?r.end_date.slice(0,10):"",
    });
    setError(""); setShowForm(true);
  };

  const filteredCats = categories.filter(c => c.type === form.type || c.type === "both");

  const handleSave = async (e) => {
    e.preventDefault(); setError("");
    if (!form.wallet_id) return setError("Pilih dompet.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Nominal harus lebih dari 0.");
    if (form.type === "transfer" && !form.to_wallet_id) return setError("Pilih dompet tujuan.");
    setSaving(true);
    try {
      const payload = {
        type:form.type, wallet_id:Number(form.wallet_id),
        to_wallet_id: form.type==="transfer" ? Number(form.to_wallet_id) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        amount:Number(form.amount), fee:Number(form.fee||0), note:form.note||null,
        frequency:form.frequency, interval_count:Number(form.interval_count)||1,
        start_date:form.start_date, end_date:form.end_date||null,
      };
      if (editData) await recurringApi.update(editData.id, payload);
      else          await recurringApi.create(payload);
      setShowForm(false); load();
    } catch(err) { setError(err.response?.data?.message || "Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const toggleActive = async (r) => {
    try { await recurringApi.toggleActive(r.id, { is_active: !r.is_active }); load(); } catch {}
  };

  const handleDelete = async () => {
    try { await recurringApi.remove(deleteId); setDeleteId(null); load(); } catch {}
  };

  const runDue = async () => {
    setRunning(true);
    try {
      const res = await recurringApi.runDue();
      alert(res.data.message || "Selesai.");
      load();
      window.dispatchEvent(new Event("sw:reload"));
    } catch { alert("Gagal menjalankan transaksi otomatis."); }
    finally { setRunning(false); }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaksi Berulang</h1>
          <p className="page-sub">{list.length} jadwal · {list.filter(r=>r.is_active).length} aktif</p>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button className="btn-secondary" onClick={runDue} disabled={running}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            {running ? "Memproses..." : "Jalankan Sekarang"}
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Tambah Jadwal
          </button>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom:18 }}>
        💡 Transaksi otomatis dibuat saat kamu klik <strong>"Jalankan Sekarang"</strong>. Cocok untuk gaji bulanan, subscription, atau cicilan rutin.
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:60 }}><div className="sw-spinner"/></div>
      ) : list.length === 0 ? (
        <div className="sw-card" style={{ textAlign:"center", padding:"56px 24px" }}>
          <div style={{ fontSize:48, marginBottom:14 }}>🔁</div>
          <p style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Belum ada transaksi berulang</p>
          <p style={{ fontSize:14, color:"var(--text-3)", marginBottom:24 }}>Otomatisasi gaji, subscription, atau cicilan rutin kamu</p>
          <button className="btn-primary" onClick={openAdd}>+ Buat Jadwal</button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {list.map(r => (
            <div key={r.id} className="sw-card" style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", opacity:r.is_active?1:0.55 }}>
              <div style={{ width:38, height:38, borderRadius:"50%", background:`${TC[r.type]}18`, border:`1.5px solid ${TC[r.type]}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16, fontWeight:700, color:TC[r.type] }}>
                {r.type==="income"?"+":r.type==="expense"?"−":"⇄"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:4 }}>{r.note || r.category_name || TL[r.type]}</p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ padding:"2px 8px", borderRadius:9999, fontSize:11, background:"var(--brand-light)", color:"var(--brand)", fontWeight:600 }}>
                    🔁 {FREQ_LABEL[r.frequency]}{r.interval_count>1?` ×${r.interval_count}`:""}
                  </span>
                  <span style={{ fontSize:12, color:"var(--text-3)" }}>Berikutnya: {new Date(r.next_run_date).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</span>
                  <span style={{ fontSize:12, color:"var(--text-4)" }}>· {r.wallet_name}</span>
                </div>
              </div>
              <p style={{ fontSize:15, fontWeight:700, color:TC[r.type], flexShrink:0 }}>{fmt(r.amount)}</p>
              {/* Toggle switch */}
              <button onClick={() => toggleActive(r)} title={r.is_active?"Nonaktifkan":"Aktifkan"}
                style={{ width:40, height:22, borderRadius:9999, background:r.is_active?"var(--brand)":"var(--bg-subtle)", border:`1px solid ${r.is_active?"var(--brand)":"var(--border)"}`, cursor:"pointer", position:"relative", flexShrink:0, transition:"background .15s" }}>
                <div style={{ width:16, height:16, borderRadius:"50%", background:"white", position:"absolute", top:2, left:r.is_active?21:3, transition:"left .15s" }}/>
              </button>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button className="btn-icon" onClick={() => openEdit(r)} title="Edit">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
                <button className="btn-icon" style={{ color:"var(--red)" }} onClick={() => setDeleteId(r.id)} title="Hapus">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="modal-box" style={{ maxWidth:520 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editData ? "Edit" : "Tambah"} Transaksi Berulang</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><CloseIcon/></button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom:18 }}>{error}</div>}

              {/* Type tabs */}
              <div className="form-group">
                <div style={{ display:"flex", background:"var(--bg-subtle)", borderRadius:8, padding:3 }}>
                  {[["income","Pemasukan"],["expense","Pengeluaran"],["transfer","Transfer"]].map(([v,l]) => (
                    <button key={v} type="button" onClick={() => setForm(p=>({...p,type:v,category_id:""}))}
                      style={{ flex:1, padding:"8px 6px", borderRadius:6, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, transition:"all .15s",
                        background: form.type===v ? "var(--bg-white)" : "transparent",
                        color:      form.type===v ? TC[v]             : "var(--text-3)",
                        boxShadow:  form.type===v ? "var(--shadow)"   : "none",
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="sw-label">Nominal *</label>
                <div style={{ display:"flex", border:"1.5px solid var(--brand)", borderRadius:"var(--radius)", overflow:"hidden", background:"var(--bg-white)", boxShadow:"0 0 0 3px rgba(27,79,216,0.1)" }}>
                  <span style={{ padding:"0 16px", fontSize:14, fontWeight:600, color:"var(--text-3)", borderRight:"1px solid var(--border)", display:"flex", alignItems:"center", flexShrink:0 }}>Rp</span>
                  <input type="number" min="1" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0" required autoFocus
                    style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"12px 16px", fontSize:20, fontWeight:700, color:"var(--text)" }}/>
                </div>
              </div>

              {/* Wallet + cat/to_wallet */}
              <div className="form-row">
                <div className="form-group">
                  <label className="sw-label">Dompet *</label>
                  <select className="sw-select" value={form.wallet_id} onChange={e=>setForm(p=>({...p,wallet_id:e.target.value}))} required>
                    <option value="">— Pilih —</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                {form.type === "transfer" ? (
                  <div className="form-group">
                    <label className="sw-label">Dompet Tujuan *</label>
                    <select className="sw-select" value={form.to_wallet_id} onChange={e=>setForm(p=>({...p,to_wallet_id:e.target.value}))} required>
                      <option value="">— Pilih —</option>
                      {wallets.filter(w=>String(w.id)!==form.wallet_id).map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="sw-label">Kategori</label>
                    <select className="sw-select" value={form.category_id} onChange={e=>setForm(p=>({...p,category_id:e.target.value}))}>
                      <option value="">— Pilih —</option>
                      {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Frequency + interval */}
              <div className="form-row">
                <div className="form-group">
                  <label className="sw-label">Frekuensi</label>
                  <select className="sw-select" value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))}>
                    {Object.entries(FREQ_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="sw-label">Setiap (interval)</label>
                  <input type="number" min="1" className="sw-input" value={form.interval_count} onChange={e=>setForm(p=>({...p,interval_count:e.target.value}))}/>
                </div>
              </div>

              {/* Dates */}
              <div className="form-row">
                <div className="form-group">
                  <label className="sw-label">Tanggal Mulai *</label>
                  <input type="date" className="sw-input" value={form.start_date} onChange={e=>setForm(p=>({...p,start_date:e.target.value}))} required/>
                </div>
                <div className="form-group">
                  <label className="sw-label">Tanggal Berakhir <span style={{ fontWeight:400, color:"var(--text-4)" }}>(opsional)</span></label>
                  <input type="date" className="sw-input" value={form.end_date} onChange={e=>setForm(p=>({...p,end_date:e.target.value}))}/>
                </div>
              </div>

              <div className="form-group">
                <label className="sw-label">Catatan <span style={{ fontWeight:400, color:"var(--text-4)" }}>(opsional)</span></label>
                <input className="sw-input" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Contoh: Gaji bulanan, Netflix" maxLength={255}/>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Buat Jadwal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth:380 }}>
            <div className="modal-body" style={{ textAlign:"center", padding:"32px 28px" }}>
              <div style={{ fontSize:44, marginBottom:14 }}>🗑️</div>
              <h3 style={{ fontSize:17, fontWeight:700, color:"var(--text)", marginBottom:8 }}>Hapus Jadwal Ini?</h3>
              <p style={{ fontSize:14, color:"var(--text-3)" }}>Transaksi yang sudah dibuat sebelumnya tidak akan terhapus.</p>
            </div>
            <div className="modal-footer" style={{ justifyContent:"center", gap:12 }}>
              <button className="btn-secondary" style={{ minWidth:100 }} onClick={() => setDeleteId(null)}>Batal</button>
              <button className="btn-danger"    style={{ minWidth:100 }} onClick={handleDelete}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
