import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { reminderApi } from "../../services/api";

const fmtRp = (n) => n ? new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n) : null;
const REPEAT_LABEL = { none:"Sekali", monthly:"Bulanan", weekly:"Mingguan", yearly:"Tahunan" };

function CloseIcon() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>;
}

export default function Reminders() {
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [filter,   setFilter]   = useState("upcoming");
  const [form, setForm] = useState({ title:"", amount:"", due_date:"", repeat_type:"none", notes:"" });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await reminderApi.getAll({ upcoming: filter === "upcoming" }); setList(r.data.data || []); }
    catch { setList([]); } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditData(null); setForm({ title:"", amount:"", due_date:"", repeat_type:"none", notes:"" }); setError(""); setShowForm(true); };
  const openEdit = (r) => { setEditData(r); setForm({ title:r.title, amount:r.amount||"", due_date:r.due_date.slice(0,10), repeat_type:r.repeat_type, notes:r.notes||"" }); setError(""); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setError("");
    if (!form.title.trim()) return setError("Judul tagihan wajib diisi.");
    if (!form.due_date) return setError("Tanggal jatuh tempo wajib diisi.");
    setSaving(true);
    try {
      const payload = { title:form.title.trim(), amount:form.amount?Number(form.amount):null, due_date:form.due_date, repeat_type:form.repeat_type, notes:form.notes||null };
      if (editData) await reminderApi.update(editData.id, payload);
      else          await reminderApi.create(payload);
      setShowForm(false); load();
    } catch(err) { setError(err.response?.data?.message || "Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const togglePaid = async (r) => {
    try { await reminderApi.markPaid(r.id, { is_paid: !r.is_paid }); load(); } catch {}
  };

  const handleDelete = async () => {
    try { await reminderApi.remove(deleteId); setDeleteId(null); load(); } catch {}
  };

  const overdueCount = list.filter(r => r.is_overdue).length;
  const dueSoonCount = list.filter(r => !r.is_paid && r.days_left >= 0 && r.days_left <= 3).length;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminder Tagihan</h1>
          <p className="page-sub">{list.length} reminder · {overdueCount} terlambat</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Tambah Reminder
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="alert alert-error" style={{ marginBottom:12 }}>
          ⚠️ <strong>{overdueCount} tagihan terlambat</strong> — segera selesaikan!
        </div>
      )}
      {dueSoonCount > 0 && (
        <div className="alert alert-warning" style={{ marginBottom:16 }}>
          🔔 <strong>{dueSoonCount} tagihan</strong> akan jatuh tempo dalam 3 hari
        </div>
      )}

      {/* Filter */}
      <div style={{ display:"flex", gap:6, marginBottom:18 }}>
        {[["upcoming","Belum Dibayar"],["all","Semua"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding:"7px 16px", borderRadius:9999, border:`1.5px solid ${filter===v?"var(--brand)":"var(--border)"}`, background:filter===v?"var(--brand)":"var(--bg-white)", color:filter===v?"#fff":"var(--text-3)", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .15s" }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:60 }}><div className="sw-spinner"/></div>
      ) : list.length === 0 ? (
        <div className="sw-card" style={{ textAlign:"center", padding:"56px 24px" }}>
          <div style={{ fontSize:48, marginBottom:14 }}>🔔</div>
          <p style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Belum ada reminder</p>
          <p style={{ fontSize:14, color:"var(--text-3)", marginBottom:24 }}>Buat reminder agar tidak lupa membayar tagihan</p>
          <button className="btn-primary" onClick={openAdd}>+ Tambah Reminder</button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {list.map(r => {
            const overdue = r.is_overdue;
            const soon = !r.is_paid && r.days_left >= 0 && r.days_left <= 3;
            const statusColor = r.is_paid ? "var(--text-4)" : overdue ? "var(--red)" : soon ? "var(--amber)" : "var(--brand)";
            const statusText = overdue ? `⚠ Terlambat ${Math.abs(r.days_left)} hari` : r.is_paid ? "✓ Sudah dibayar" : r.days_left === 0 ? "Jatuh tempo hari ini!" : `${r.days_left} hari lagi`;
            return (
              <div key={r.id} className="sw-card" style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", opacity:r.is_paid?0.65:1, borderLeft:`3px solid ${statusColor}`, transition:"opacity .2s" }}>
                {/* Checkbox */}
                <button onClick={() => togglePaid(r)} style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${r.is_paid?"var(--green)":"var(--border-2)"}`, background:r.is_paid?"var(--green)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all .15s" }}>
                  {r.is_paid && <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>}
                </button>

                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:15, fontWeight:700, color:"var(--text)", textDecoration:r.is_paid?"line-through":"none", marginBottom:4 }}>{r.title}</p>
                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:12, fontWeight:600, color:statusColor }}>{statusText}</span>
                    <span style={{ fontSize:12, color:"var(--text-4)" }}>·</span>
                    <span style={{ fontSize:12, color:"var(--text-3)" }}>{new Date(r.due_date).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</span>
                    {r.repeat_type !== "none" && (
                      <span style={{ padding:"2px 8px", borderRadius:9999, fontSize:11, background:"var(--brand-light)", color:"var(--brand)", fontWeight:600 }}>
                        🔁 {REPEAT_LABEL[r.repeat_type]}
                      </span>
                    )}
                  </div>
                  {r.notes && <p style={{ fontSize:12, color:"var(--text-3)", marginTop:4, fontStyle:"italic" }}>{r.notes}</p>}
                </div>

                {r.amount && <p style={{ fontSize:15, fontWeight:700, color:"var(--text)", flexShrink:0, marginRight:8 }}>{fmtRp(r.amount)}</p>}

                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <button className="btn-icon" onClick={() => openEdit(r)} title="Edit">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                  <button className="btn-icon" style={{ color:"var(--red)" }} onClick={() => setDeleteId(r.id)} title="Hapus">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">{editData ? "Edit" : "Tambah"} Reminder</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><CloseIcon/></button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom:18 }}>{error}</div>}

              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="sw-label">Judul Tagihan *</label>
                  <input className="sw-input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Contoh: Bayar Listrik, Cicilan Motor" required autoFocus/>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="sw-label">Nominal <span style={{ fontWeight:400, color:"var(--text-4)" }}>(opsional)</span></label>
                    <input type="number" min="0" className="sw-input" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0"/>
                  </div>
                  <div className="form-group">
                    <label className="sw-label">Jatuh Tempo *</label>
                    <input type="date" className="sw-input" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))} required/>
                  </div>
                </div>

                <div className="form-group">
                  <label className="sw-label">Pengulangan</label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                    {[["none","Sekali"],["weekly","Mingguan"],["monthly","Bulanan"],["yearly","Tahunan"]].map(([v,l]) => (
                      <button key={v} type="button" onClick={() => setForm(p=>({...p,repeat_type:v}))}
                        style={{ padding:"10px 6px", background:form.repeat_type===v?"var(--brand)":"var(--bg-subtle)", border:`1.5px solid ${form.repeat_type===v?"var(--brand)":"var(--border)"}`, borderRadius:8, color:form.repeat_type===v?"#fff":"var(--text-2)", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .15s", textAlign:"center" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="sw-label">Catatan <span style={{ fontWeight:400, color:"var(--text-4)" }}>(opsional)</span></label>
                  <input className="sw-input" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Tambahkan catatan..."/>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : editData ? "Simpan Perubahan" : "Buat Reminder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth:360 }}>
            <div className="modal-body" style={{ textAlign:"center", padding:"32px 28px" }}>
              <div style={{ fontSize:44, marginBottom:14 }}>🗑️</div>
              <h3 style={{ fontSize:17, fontWeight:700, color:"var(--text)", marginBottom:8 }}>Hapus Reminder?</h3>
              <p style={{ fontSize:14, color:"var(--text-3)" }}>Reminder ini akan dihapus permanen.</p>
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
