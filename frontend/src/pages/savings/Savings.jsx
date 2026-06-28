import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { savingsApi } from "../../services/api";

const fmtRp = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);

const ICONS = ["🎯","✈️","🏠","🚗","💻","📱","💍","🎓","🏋️","🎮","👶","🌴","💊","🐕","🎸"];
const COLORS = ["#00e5a0","#00d4ff","#f59e0b","#7c3aed","#ef4444","#ec4899","#10b981","#3b82f6"];

export default function Savings() {
  const [goals,   setGoals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addFundId, setAddFundId] = useState(null);
  const [fundAmount, setFundAmount] = useState("");
  const [form, setForm] = useState({ name:"", target_amount:"", target_date:"", icon:"🎯", color:"#00e5a0" });
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try { const r = await savingsApi.getAll(); setGoals(r.data.data || []); }
    catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setError("");
    try {
      await savingsApi.create({ ...form, target_amount: Number(form.target_amount) });
      setShowForm(false); setForm({ name:"", target_amount:"", target_date:"", icon:"🎯", color:"#00e5a0" });
      load();
    } catch(err) { setError(err.response?.data?.message || "Gagal membuat target."); }
  };

  const handleAddFund = async (id) => {
    if (!fundAmount || Number(fundAmount) <= 0) return;
    try { await savingsApi.addFunds(id, { amount: Number(fundAmount) }); setAddFundId(null); setFundAmount(""); load(); }
    catch { }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus target ini?")) return;
    await savingsApi.remove(id); load();
  };

  const totalTarget  = goals.reduce((s,g) => s + Number(g.target_amount), 0);
  const totalSaved   = goals.reduce((s,g) => s + Number(g.current_amount), 0);
  const completed    = goals.filter(g => g.is_completed).length;

  return (
    <DashboardLayout>
      <div style={s.page}>
        {/* Header */}
        <div style={s.topBar}>
          <div>
            <h1 style={s.title}>Target Tabungan</h1>
            <p style={s.subtitle}>Kelola tujuan keuangan kamu</p>
          </div>
          <button onClick={() => setShowForm(true)} style={s.btnPrimary}>+ Tambah Target</button>
        </div>

        {/* Summary */}
        <div style={s.summaryRow}>
          {[
            { label:"Total Target", value: fmtRp(totalTarget), color:"#00d4ff" },
            { label:"Total Tersimpan", value: fmtRp(totalSaved), color:"#00e5a0" },
            { label:"Target Selesai", value: `${completed} / ${goals.length}`, color:"#f59e0b" },
          ].map((item,i) => (
            <div key={i} style={s.summaryCard}>
              <p style={{ ...s.summaryVal, color: item.color }}>{item.value}</p>
              <p style={s.summaryLabel}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Goals Grid */}
        {loading ? <p style={{ color:"var(--text-3)", textAlign:"center", marginTop:"40px" }}>Memuat...</p> :
         goals.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🎯</div>
            <p style={{ color:"var(--text-3)" }}>Belum ada target tabungan. Yuk buat sekarang!</p>
          </div>
        ) : (
          <div style={s.grid}>
            {goals.map(goal => {
              const pct = Math.min(Number(goal.percent || 0), 100);
              return (
                <div key={goal.id} style={{ ...s.card, opacity: goal.is_completed ? 0.8 : 1 }}>
                  <div style={s.cardHeader}>
                    <div style={{ ...s.goalIcon, background: goal.color + "22", border:`1px solid ${goal.color}44` }}>
                      <span style={{ fontSize:"24px" }}>{goal.icon}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <h3 style={s.goalName}>{goal.name}</h3>
                        {goal.is_completed && <span style={s.badge}>✅ Tercapai</span>}
                      </div>
                      {goal.target_date && (
                        <p style={s.goalDate}>🗓 Target: {new Date(goal.target_date).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(goal.id)} style={s.btnDelete}>✕</button>
                  </div>

                  <div style={{ marginBottom:"8px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                      <span style={{ fontSize:"13px", color:"var(--text-3)" }}>{fmtRp(goal.current_amount)}</span>
                      <span style={{ fontSize:"13px", fontWeight:600, color: goal.color }}>{pct}%</span>
                    </div>
                    <div style={{ background:"var(--bg-subtle)", borderRadius:"99px", height:"8px" }}>
                      <div style={{ background: goal.color, width:`${pct}%`, height:"8px", borderRadius:"99px", transition:"width .5s" }} />
                    </div>
                    <p style={{ fontSize:"12px", color:"var(--text-3)", marginTop:"6px", textAlign:"right" }}>
                      dari {fmtRp(goal.target_amount)}
                    </p>
                  </div>

                  {!goal.is_completed && (
                    addFundId === goal.id ? (
                      <div style={{ display:"flex", gap:"8px", marginTop:"8px" }}>
                        <input type="number" value={fundAmount} onChange={e=>setFundAmount(e.target.value)}
                          placeholder="Nominal (Rp)" style={s.input} autoFocus />
                        <button onClick={() => handleAddFund(goal.id)} style={s.btnSmall}>Tambah</button>
                        <button onClick={() => setAddFundId(null)} style={s.btnSmallGhost}>Batal</button>
                      </div>
                    ) : (
                      <button onClick={() => { setAddFundId(goal.id); setFundAmount(""); }} style={s.btnAdd}>
                        + Tambah Dana
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Buat Target */}
      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Buat Target Tabungan</h2>
            {error && <div style={s.alert}>{error}</div>}
            <form onSubmit={handleCreate}>
              <label style={s.label}>Nama Target</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Contoh: Liburan ke Bali" style={s.input} required />

              <label style={s.label}>Target Jumlah (Rp)</label>
              <input type="number" value={form.target_amount} onChange={e=>setForm({...form,target_amount:e.target.value})} placeholder="5000000" style={s.input} required />

              <label style={s.label}>Tanggal Target (Opsional)</label>
              <input type="date" value={form.target_date} onChange={e=>setForm({...form,target_date:e.target.value})} style={s.input} />

              <label style={s.label}>Ikon</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"16px" }}>
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setForm({...form, icon:ic})}
                    style={{ ...s.iconBtn, border: form.icon===ic ? "2px solid var(--brand)" : "2px solid #334155", background: form.icon===ic ? "rgba(0,229,160,.1)" : "var(--bg-subtle)" }}>
                    {ic}
                  </button>
                ))}
              </div>

              <label style={s.label}>Warna</label>
              <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm({...form, color:c})}
                    style={{ width:"28px", height:"28px", borderRadius:"50%", background:c, border: form.color===c ? "3px solid #fff" : "2px solid transparent", cursor:"pointer" }} />
                ))}
              </div>

              <div style={{ display:"flex", gap:"10px" }}>
                <button type="button" onClick={() => setShowForm(false)} style={s.btnGhost}>Batal</button>
                <button type="submit" style={s.btnPrimary}>Buat Target</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const s = {
  page: { padding:"24px", maxWidth:"960px" },
  topBar: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" },
  title: { fontSize:"24px", fontWeight:700, color:"var(--text)", margin:0 },
  subtitle: { color:"var(--text-3)", fontSize:"14px", marginTop:"4px" },
  summaryRow: { display:"flex", gap:"16px", marginBottom:"24px", flexWrap:"wrap" },
  summaryCard: { flex:1, minWidth:"160px", background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:"12px", padding:"16px 20px" },
  summaryVal: { fontSize:"20px", fontWeight:700, margin:0 },
  summaryLabel: { fontSize:"12px", color:"var(--text-3)", margin:"4px 0 0" },
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"16px" },
  card: { background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:"12px", padding:"20px" },
  cardHeader: { display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"16px" },
  goalIcon: { width:"52px", height:"52px", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  goalName: { fontSize:"16px", fontWeight:600, color:"var(--text)", margin:0 },
  goalDate: { fontSize:"12px", color:"var(--text-3)", margin:"4px 0 0" },
  badge: { fontSize:"11px", background:"rgba(0,229,160,.15)", color:"#00e5a0", borderRadius:"99px", padding:"2px 8px" },
  btnDelete: { background:"none", border:"none", color:"var(--text-3)", cursor:"pointer", fontSize:"16px", padding:"4px", lineHeight:1 },
  btnAdd: { width:"100%", marginTop:"8px", padding:"8px", background:"rgba(0,229,160,.1)", border:"1px solid rgba(0,229,160,.3)", borderRadius:"8px", color:"#00e5a0", cursor:"pointer", fontSize:"13px", fontWeight:600 },
  btnSmall: { padding:"8px 14px", background:"var(--brand)", border:"none", borderRadius:"8px", color:"#000", cursor:"pointer", fontSize:"13px", fontWeight:600 },
  btnSmallGhost: { padding:"8px 14px", background:"none", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-3)", cursor:"pointer", fontSize:"13px" },
  empty: { textAlign:"center", padding:"60px 20px", color:"var(--text-3)" },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"16px" },
  modal: { background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:"16px", padding:"28px", width:"100%", maxWidth:"440px", maxHeight:"90vh", overflowY:"auto" },
  modalTitle: { fontSize:"20px", fontWeight:700, color:"var(--text)", margin:"0 0 20px" },
  alert: { background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:"8px", padding:"10px 14px", marginBottom:"16px", color:"var(--red)", fontSize:"14px" },
  label: { display:"block", fontSize:"13px", color:"var(--text-3)", marginBottom:"6px" },
  input: { width:"100%", padding:"10px 12px", background:"var(--bg-subtle)", border:"1px solid #334155", borderRadius:"8px", color:"var(--text)", fontSize:"14px", marginBottom:"14px", boxSizing:"border-box", outline:"none" },
  iconBtn: { width:"36px", height:"36px", borderRadius:"8px", cursor:"pointer", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center" },
  btnPrimary: { padding:"10px 20px", background:"var(--brand)", border:"none", borderRadius:"8px", color:"#000", cursor:"pointer", fontSize:"14px", fontWeight:700 },
  btnGhost: { flex:1, padding:"10px", background:"none", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-3)", cursor:"pointer", fontSize:"14px" },
};
