import { useState, useEffect, useCallback } from "react";
import { walletApi, categoryApi, transactionApi } from "../services/api";

const EMPTY = { type:"expense", wallet_id:"", to_wallet_id:"", category_id:"", amount:"", fee:"", note:"", date:"" };
const today = () => new Date().toISOString().split("T")[0];

// Supports both prop conventions:
// Old: open, onClose, onSuccess
// New: onClose, onSaved, editData
export default function TransactionModal({ open, onClose, onSuccess, onSaved, editData = null }) {
  const isOpen    = open !== undefined ? open : true;
  const handleClose  = onClose  || (() => {});
  const handleSaved  = onSaved  || onSuccess || (() => {});

  const [form,       setForm]       = useState({ ...EMPTY, date: today() });
  const [wallets,    setWallets]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [showFee,    setShowFee]    = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [w, c] = await Promise.all([walletApi.getAll(), categoryApi.getAll()]);
      setWallets(w.data.data?.wallets || []);
      setCategories(c.data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadData();
    if (editData) {
      const hasFee = Number(editData.fee || 0) > 0;
      setShowFee(hasFee || editData.type === "transfer");
      setForm({ type:editData.type||"expense", wallet_id:String(editData.wallet_id||""), to_wallet_id:String(editData.to_wallet_id||""), category_id:String(editData.category_id||""), amount:String(editData.amount||""), fee:hasFee?String(editData.fee):"", note:editData.note||"", date:editData.transaction_date||today() });
    } else {
      setForm({ ...EMPTY, date: today() });
      setShowFee(false);
    }
    setError("");
  }, [isOpen, editData, loadData]);

  useEffect(() => { if (form.type === "transfer") setShowFee(true); }, [form.type]);

  if (!isOpen) return null;

  const filteredCats = categories.filter(c => c.type === form.type || c.type === "both");
  const ch = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value, ...(name==="type" ? {category_id:"", to_wallet_id:""} : {}) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.wallet_id) return setError("Pilih dompet.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Masukkan nominal yang valid.");
    if (form.type === "transfer" && !form.to_wallet_id) return setError("Pilih dompet tujuan.");
    if (form.type === "transfer" && form.wallet_id === form.to_wallet_id) return setError("Dompet asal dan tujuan tidak boleh sama.");
    try {
      setLoading(true);
      const payload = {
        type:form.type, wallet_id:Number(form.wallet_id),
        category_id:form.category_id?Number(form.category_id):null,
        amount:Number(form.amount), fee:Number(form.fee||0),
        note:form.note||null, date:form.date||today(),
        ...(form.type==="transfer" ? {to_wallet_id:Number(form.to_wallet_id)} : {}),
      };
      if (editData) await transactionApi.update(editData.id, payload);
      else          await transactionApi.create(payload);
      handleSaved();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menyimpan transaksi.");
    } finally { setLoading(false); }
  };

  const TYPE_OPTS = [
    { val:"expense",  label:"Pengeluaran" },
    { val:"income",   label:"Pemasukan"   },
    { val:"transfer", label:"Transfer"    },
  ];

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", animation:"fadeIn .15s" }}
      onClick={e => e.target===e.currentTarget && handleClose()}
    >
      <div style={{ width:"100%", maxWidth:"480px", background:"var(--bg-white)", borderRadius:"16px", boxShadow:"0 12px 32px rgba(16,24,40,0.18)", maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", animation:"slideUp .2s" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px 16px", borderBottom:"1px solid #E4E7EC" }}>
          <h2 style={{ fontSize:"16px", fontWeight:700, color:"var(--text)", margin:0 }}>
            {editData ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>
          <button onClick={handleClose} style={{ width:32, height:32, borderRadius:8, border:"1px solid #E4E7EC", background:"var(--bg)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ padding:"20px 24px", overflowY:"auto", flex:1 }}>
          {/* Type tabs */}
          <div style={{ display:"flex", background:"var(--bg-subtle)", borderRadius:8, padding:3, marginBottom:18 }}>
            {TYPE_OPTS.map(t => (
              <button key={t.val} type="button" onClick={() => setForm(p=>({...p,type:t.val,category_id:"",to_wallet_id:""}))}
                style={{ flex:1, padding:"7px 4px", borderRadius:6, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, transition:"all .15s",
                  background: form.type===t.val ? "var(--bg-white)" : "transparent",
                  color:      form.type===t.val ? "var(--text)" : "var(--text-3)",
                  boxShadow:  form.type===t.val ? "0 1px 3px rgba(16,24,40,0.1)" : "none",
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ display:"flex", gap:8, padding:"10px 12px", background:"var(--red-bg)", border:"1px solid #FECDCA", borderRadius:8, color:"var(--red)", fontSize:13, marginBottom:14 }}>
              ⚠ {error}
            </div>
          )}

          {/* Amount */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-2)", marginBottom:6 }}>Nominal</label>
            <div style={{ display:"flex", border:"1px solid #D0D5DD", borderRadius:8, overflow:"hidden", background:"var(--bg-white)", transition:"border .15s" }}>
              <span style={{ padding:"10px 14px", background:"var(--bg)", borderRight:"1px solid #E4E7EC", color:"var(--text-3)", fontSize:14, fontWeight:500, flexShrink:0 }}>Rp</span>
              <input name="amount" type="number" min="1" value={form.amount} onChange={ch} placeholder="0" required autoFocus
                style={{ flex:1, border:"none", outline:"none", padding:"10px 14px", fontSize:20, fontWeight:700, color:"var(--text)", background:"transparent" }}/>
            </div>
          </div>

          {/* Wallet & category */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-2)", marginBottom:6 }}>Dompet</label>
              <select name="wallet_id" value={form.wallet_id} onChange={ch} required
                style={{ width:"100%", padding:"9px 12px", border:"1px solid #D0D5DD", borderRadius:8, background:"var(--bg-white)", color:"var(--text)", fontSize:14, outline:"none" }}>
                <option value="">Pilih dompet</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            {form.type === "transfer" ? (
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-2)", marginBottom:6 }}>Tujuan</label>
                <select name="to_wallet_id" value={form.to_wallet_id} onChange={ch} required
                  style={{ width:"100%", padding:"9px 12px", border:"1px solid #D0D5DD", borderRadius:8, background:"var(--bg-white)", color:"var(--text)", fontSize:14, outline:"none" }}>
                  <option value="">Pilih tujuan</option>
                  {wallets.filter(w=>String(w.id)!==form.wallet_id).map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-2)", marginBottom:6 }}>Kategori</label>
                <select name="category_id" value={form.category_id} onChange={ch}
                  style={{ width:"100%", padding:"9px 12px", border:"1px solid #D0D5DD", borderRadius:8, background:"var(--bg-white)", color:"var(--text)", fontSize:14, outline:"none" }}>
                  <option value="">Pilih kategori</option>
                  {filteredCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Date & note */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-2)", marginBottom:6 }}>Tanggal</label>
              <input name="date" type="date" value={form.date} onChange={ch} required
                style={{ width:"100%", padding:"9px 12px", border:"1px solid #D0D5DD", borderRadius:8, background:"var(--bg-white)", color:"var(--text)", fontSize:14, outline:"none" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-2)", marginBottom:6 }}>Catatan <span style={{fontWeight:400,color:"var(--text-4)"}}>(opsional)</span></label>
              <input name="note" type="text" value={form.note} onChange={ch} placeholder="Keterangan" maxLength={255}
                style={{ width:"100%", padding:"9px 12px", border:"1px solid #D0D5DD", borderRadius:8, background:"var(--bg-white)", color:"var(--text)", fontSize:14, outline:"none" }}/>
            </div>
          </div>

          {/* Fee toggle */}
          {form.type !== "transfer" && (
            <button type="button" onClick={()=>{setShowFee(v=>!v); if(showFee) setForm(p=>({...p,fee:""}));}}
              style={{ background:"none", border:"none", color:"var(--brand)", fontSize:13, cursor:"pointer", fontWeight:500, padding:0, marginBottom: showFee ? 12 : 0 }}>
              {showFee ? "— Hapus biaya tambahan" : "+ Tambah biaya"}
            </button>
          )}
          {showFee && (
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text-2)", marginBottom:6 }}>
                {form.type==="transfer" ? "Biaya transfer" : "Biaya tambahan"}
              </label>
              <div style={{ display:"flex", border:"1px solid #D0D5DD", borderRadius:8, overflow:"hidden", background:"var(--bg-white)" }}>
                <span style={{ padding:"9px 12px", background:"var(--bg)", borderRight:"1px solid #E4E7EC", color:"var(--text-3)", fontSize:14, flexShrink:0 }}>Rp</span>
                <input name="fee" type="number" min="0" value={form.fee} onChange={ch} placeholder="0"
                  style={{ flex:1, border:"none", outline:"none", padding:"9px 12px", fontSize:15, fontWeight:600, color:"var(--text)", background:"transparent" }}/>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:"1px solid #E4E7EC" }}>
          <button onClick={handleClose} style={{ padding:"9px 18px", background:"var(--bg-white)", border:"1px solid #D0D5DD", borderRadius:8, color:"var(--text-2)", fontSize:14, fontWeight:600, cursor:"pointer" }}>
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding:"9px 20px", background: loading ? "var(--brand)" : "var(--brand)", border:"none", borderRadius:8, color:"#fff", fontSize:14, fontWeight:600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Menyimpan..." : editData ? "Simpan perubahan" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
