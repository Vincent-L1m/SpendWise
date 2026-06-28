import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { splitBillApi } from "../../services/api";

const fmtRp = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);

export default function SplitBill() {
  const [bills,    setBills]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error,    setError]    = useState("");
  const [form, setForm] = useState({ title:"", total_amount:"", note:"" });
  const [members, setMembers]   = useState([{ name:"", amount:"" }, { name:"", amount:"" }]);
  const [splitMode, setSplitMode] = useState("custom"); // custom | equal

  const load = async () => {
    setLoading(true);
    try { const r = await splitBillApi.getAll(); setBills(r.data.data || []); }
    catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const distributeEqual = () => {
    if (!form.total_amount || members.length === 0) return;
    const each = (Number(form.total_amount) / members.length).toFixed(0);
    setMembers(members.map(m => ({ ...m, amount: each })));
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError("");
    if (members.some(m => !m.name.trim())) return setError("Semua nama anggota wajib diisi.");
    const totalMember = members.reduce((s,m) => s + Number(m.amount||0), 0);
    if (totalMember === 0) return setError("Nominal tiap anggota wajib diisi.");
    try {
      await splitBillApi.create({ title: form.title, total_amount: Number(form.total_amount), note: form.note, members });
      setShowForm(false); setForm({ title:"", total_amount:"", note:"" }); setMembers([{name:"",amount:""},{name:"",amount:""}]);
      load();
    } catch(err) { setError(err.response?.data?.message || "Gagal membuat split bill."); }
  };

  const handleToggle = async (memberId) => {
    await splitBillApi.togglePaid(memberId); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus split bill ini?")) return;
    await splitBillApi.remove(id); load();
  };

  const addMember = () => setMembers([...members, { name:"", amount:"" }]);
  const removeMember = (i) => { if (members.length <= 2) return; setMembers(members.filter((_,idx) => idx !== i)); };
  const updateMember = (i, field, val) => setMembers(members.map((m,idx) => idx===i ? {...m,[field]:val} : m));

  return (
    <DashboardLayout>
      <div style={s.page}>
        <div style={s.topBar}>
          <div>
            <h1 style={s.title}>Split Bill</h1>
            <p style={s.subtitle}>Hitung dan kelola patungan dengan teman</p>
          </div>
          <button onClick={() => setShowForm(true)} style={s.btnPrimary}>+ Split Bill Baru</button>
        </div>

        {loading ? <p style={{ color:"var(--text-3)", textAlign:"center", marginTop:"40px" }}>Memuat...</p>
        : bills.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🧾</div>
            <p style={{ color:"var(--text-3)" }}>Belum ada split bill. Buat yang pertama!</p>
          </div>
        ) : (
          <div style={s.list}>
            {bills.map(bill => {
              const paid   = bill.members?.filter(m => m.is_paid).length || 0;
              const total  = bill.members?.length || 0;
              return (
                <div key={bill.id} style={{ ...s.card, opacity: bill.is_settled ? 0.8 : 1 }}>
                  <div style={s.cardTop}>
                    <div>
                      <h3 style={s.billTitle}>{bill.title}</h3>
                      <p style={s.billMeta}>{fmtRp(bill.total_amount)} • {paid}/{total} sudah bayar</p>
                      {bill.note && <p style={s.billNote}>{bill.note}</p>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      {bill.is_settled && <span style={s.badgeGreen}>✅ Lunas</span>}
                      <button onClick={() => handleDelete(bill.id)} style={s.btnDelete}>🗑</button>
                    </div>
                  </div>
                  <div style={s.memberList}>
                    {bill.members?.map(m => (
                      <div key={m.id} style={{ ...s.memberRow, opacity: m.is_paid ? 0.7 : 1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                          <div style={{ ...s.avatar, background: m.is_paid ? "#00e5a022" : "var(--border-2)" }}>
                            {m.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin:0, fontSize:"14px", fontWeight:600, color:"var(--text)", textDecoration: m.is_paid ? "line-through" : "none" }}>{m.name}</p>
                            <p style={{ margin:0, fontSize:"13px", color:"var(--text-3)" }}>{fmtRp(m.amount)}</p>
                          </div>
                        </div>
                        <button onClick={() => handleToggle(m.id)} style={{ ...s.btnPaidToggle, background: m.is_paid ? "rgba(0,229,160,.15)" : "var(--bg-subtle)", color: m.is_paid ? "#00e5a0" : "var(--text-3)", border: m.is_paid ? "1px solid rgba(0,229,160,.3)" : "1px solid #334155" }}>
                          {m.is_paid ? "✓ Lunas" : "Tandai Lunas"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Split Bill Baru</h2>
            {error && <div style={s.alert}>{error}</div>}
            <form onSubmit={handleCreate}>
              <label style={s.label}>Judul</label>
              <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Makan malam bareng" style={s.input} required />

              <label style={s.label}>Total Tagihan (Rp)</label>
              <input type="number" value={form.total_amount} onChange={e=>setForm({...form,total_amount:e.target.value})} placeholder="150000" style={s.input} required />

              <label style={s.label}>Catatan (Opsional)</label>
              <input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Restoran Padang, 20 Juni" style={s.input} />

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <label style={s.label}>Anggota ({members.length} orang)</label>
                <button type="button" onClick={distributeEqual} style={s.btnEq}>Bagi Rata</button>
              </div>

              {members.map((m, i) => (
                <div key={i} style={{ display:"flex", gap:"8px", marginBottom:"8px", alignItems:"center" }}>
                  <input value={m.name} onChange={e=>updateMember(i,"name",e.target.value)} placeholder={`Nama ${i+1}`} style={{ ...s.input, flex:1.5, marginBottom:0 }} />
                  <input type="number" value={m.amount} onChange={e=>updateMember(i,"amount",e.target.value)} placeholder="Rp" style={{ ...s.input, flex:1, marginBottom:0 }} />
                  {members.length > 2 && <button type="button" onClick={() => removeMember(i)} style={s.btnDel}>✕</button>}
                </div>
              ))}

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"4px", marginBottom:"20px" }}>
                <span style={{ fontSize:"12px", color:"var(--text-3)" }}>
                  Total dibagi: {fmtRp(members.reduce((s,m)=>s+Number(m.amount||0),0))}
                </span>
                <button type="button" onClick={addMember} style={s.btnAdd}>+ Tambah Orang</button>
              </div>

              <div style={{ display:"flex", gap:"10px" }}>
                <button type="button" onClick={() => setShowForm(false)} style={s.btnGhost}>Batal</button>
                <button type="submit" style={s.btnPrimary}>Buat Split Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const s = {
  page: { padding:"24px", maxWidth:"800px" },
  topBar: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" },
  title: { fontSize:"24px", fontWeight:700, color:"var(--text)", margin:0 },
  subtitle: { color:"var(--text-3)", fontSize:"14px", marginTop:"4px" },
  list: { display:"flex", flexDirection:"column", gap:"16px" },
  card: { background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"12px", padding:"20px" },
  cardTop: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" },
  billTitle: { fontSize:"16px", fontWeight:700, color:"var(--text)", margin:0 },
  billMeta: { fontSize:"13px", color:"var(--text-3)", margin:"4px 0 0" },
  billNote: { fontSize:"12px", color:"var(--text-3)", margin:"4px 0 0", fontStyle:"italic" },
  badgeGreen: { fontSize:"11px", background:"rgba(0,229,160,.15)", color:"#00e5a0", borderRadius:"99px", padding:"3px 10px" },
  btnDelete: { background:"none", border:"none", cursor:"pointer", fontSize:"16px" },
  memberList: { display:"flex", flexDirection:"column", gap:"10px" },
  memberRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"var(--bg)", borderRadius:"8px" },
  avatar: { width:"36px", height:"36px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#00e5a0", fontSize:"14px" },
  btnPaidToggle: { padding:"6px 14px", borderRadius:"6px", cursor:"pointer", fontSize:"12px", fontWeight:600 },
  empty: { textAlign:"center", padding:"60px 20px" },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"16px" },
  modal: { background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"16px", padding:"28px", width:"100%", maxWidth:"480px", maxHeight:"90vh", overflowY:"auto" },
  modalTitle: { fontSize:"20px", fontWeight:700, color:"var(--text)", margin:"0 0 20px" },
  alert: { background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:"8px", padding:"10px 14px", marginBottom:"16px", color:"var(--red)", fontSize:"14px" },
  label: { display:"block", fontSize:"13px", color:"var(--text-3)", marginBottom:"6px" },
  input: { width:"100%", padding:"10px 12px", background:"var(--bg-subtle)", border:"1px solid #334155", borderRadius:"8px", color:"var(--text)", fontSize:"14px", marginBottom:"14px", boxSizing:"border-box", outline:"none" },
  btnPrimary: { flex:2, padding:"10px 20px", background:"var(--brand)", border:"none", borderRadius:"8px", color:"#000", cursor:"pointer", fontSize:"14px", fontWeight:700 },
  btnGhost: { flex:1, padding:"10px", background:"none", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-3)", cursor:"pointer", fontSize:"14px" },
  btnEq: { padding:"4px 12px", background:"rgba(0,212,255,.1)", border:"1px solid rgba(0,212,255,.3)", borderRadius:"6px", color:"#00d4ff", cursor:"pointer", fontSize:"12px", fontWeight:600 },
  btnAdd: { padding:"4px 12px", background:"rgba(0,229,160,.1)", border:"1px solid rgba(0,229,160,.3)", borderRadius:"6px", color:"#00e5a0", cursor:"pointer", fontSize:"12px", fontWeight:600 },
  btnDel: { background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", fontSize:"16px", padding:"8px" },
};
