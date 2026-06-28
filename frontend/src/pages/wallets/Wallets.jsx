import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import TransactionModal from "../../components/TransactionModal";
import { walletApi } from "../../services/api";

const fmt = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
const TYPE_OPTS = [
  {val:"cash",label:"Tunai",color:"#00e5a0"},{val:"bank",label:"Bank",color:"#00d4ff"},
  {val:"ewallet",label:"E-Wallet",color:"#7c3aed"},{val:"investment",label:"Investasi",color:"#f59e0b"},
  {val:"other",label:"Lainnya",color:"var(--text-4)"},
];
const COLORS = ["#00d4ff","#00e5a0","#ff4d6d","#f59e0b","#7c3aed","var(--text-4)","#e879f9","#fb923c"];
const TC = {income:"var(--green)",expense:"var(--red)",transfer:"var(--brand)"};
const TS = {income:"+",expense:"−",transfer:"⇄"};
const TL = {income:"Pemasukan",expense:"Pengeluaran",transfer:"Transfer"};

function WalletIcon({type,color,size=20}) {
  const p={stroke:color,strokeWidth:1.8,strokeLinecap:"round",fill:"none"};
  if(type==="bank") return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M3 9h18M3 5h18M6 9v9M10 9v9M14 9v9M18 9v9M3 18h18" {...p}/></svg>;
  if(type==="ewallet") return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" {...p}/><path d="M2 10h20" {...p}/><circle cx="16" cy="14" r="1" fill={color}/></svg>;
  if(type==="investment") return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" {...p}/></svg>;
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" {...p}/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" {...p}/><line x1="12" y1="12" x2="12" y2="16" {...p}/><line x1="10" y1="14" x2="14" y2="14" {...p}/></svg>;
}

function CloseIcon() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>;
}

export default function Wallets() {
  const [wallets,      setWallets]      = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [showTrxModal, setShowTrxModal] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustVal,    setAdjustVal]    = useState("");
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [drawerWallet, setDrawerWallet] = useState(null);
  const [drawerTxs,    setDrawerTxs]   = useState([]);
  const [drawerLoad,   setDrawerLoad]  = useState(false);
  const [balHidden,    setBalHidden]   = useState(false);
  const [form, setForm] = useState({name:"",type:"cash",color:"#00d4ff",is_default:false});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await walletApi.getAll();
      setWallets(r.data.data?.wallets || []);
      setTotal(r.data.data?.total_balance || 0);
    } catch { setWallets([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Listen to topbar "Tambah Transaksi" button
  useEffect(() => {
    const fn = () => setShowTrxModal(true);
    window.addEventListener("open-add-trx", fn);
    return () => window.removeEventListener("open-add-trx", fn);
  }, []);

  const openDrawer = async (w) => {
    setDrawerWallet(w);
    setDrawerLoad(true);
    try {
      const r = await walletApi.getTransactions(w.id);
      setDrawerTxs(r.data.data?.transactions || []);
    } catch { setDrawerTxs([]); }
    finally { setDrawerLoad(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError("");
    if (!form.name.trim()) return setError("Nama dompet wajib diisi.");
    setSaving(true);
    try {
      await walletApi.create({...form, name:form.name.trim()});
      setShowForm(false);
      setForm({name:"",type:"cash",color:"#00d4ff",is_default:false});
      load();
    } catch(err) { setError(err.response?.data?.message || "Gagal membuat dompet."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await walletApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      if (drawerWallet?.id === deleteTarget.id) setDrawerWallet(null);
      load();
    } catch(err) { alert(err.response?.data?.message || "Gagal menghapus dompet."); }
    finally { setDeleting(false); }
  };

  const handleAdjust = async () => {
    if (adjustVal === "" || isNaN(Number(adjustVal))) return;
    setAdjustSaving(true);
    try {
      await walletApi.adjustBalance(adjustTarget.id, { balance: Number(adjustVal) });
      setAdjustTarget(null);
      setAdjustVal("");
      load();
      if (drawerWallet?.id === adjustTarget.id) {
        const r = await walletApi.getTransactions(adjustTarget.id);
        setDrawerTxs(r.data.data?.transactions || []);
      }
    } catch(err) { alert(err.response?.data?.message || "Gagal menyesuaikan saldo."); }
    finally { setAdjustSaving(false); }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dompet Saya</h1>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
            <p className="page-sub" style={{margin:0}}>Total:</p>
            <strong className={balHidden?"balance-hidden":""} style={{color:"var(--brand)",fontSize:15}}>{fmt(total)}</strong>
            <button onClick={()=>setBalHidden(v=>!v)}
              style={{background:"none",border:"none",color:"var(--text-3)",cursor:"pointer",padding:2,display:"flex",alignItems:"center"}}
              title={balHidden?"Tampilkan saldo":"Sembunyikan saldo"}>
              {balHidden
                ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                : <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
              }
            </button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn-secondary" onClick={()=>setShowTrxModal(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Transaksi
          </button>
          <button className="btn-primary" onClick={()=>setShowForm(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Dompet Baru
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:60}}><div className="sw-spinner"/></div>
      ) : (
        <div className="wallet-grid">
          {wallets.map(w => {
            const ti = TYPE_OPTS.find(t=>t.val===w.type)||TYPE_OPTS[4];
            return (
              <div key={w.id}
                style={{background:"var(--bg-white)",border:`1px solid ${w.color||"var(--border)"}40`,borderRadius:16,padding:18,position:"relative",cursor:"pointer",transition:"box-shadow .2s, transform .2s"}}
                onClick={()=>openDrawer(w)}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
                {/* Top row */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{width:42,height:42,borderRadius:10,background:`${w.color||"#00d4ff"}22`,border:`1px solid ${w.color||"var(--border)"}40`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <WalletIcon type={w.type} color={w.color||"#00d4ff"}/>
                  </div>
                  <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                    {w.is_default===1 && (
                      <span style={{padding:"2px 8px",background:"var(--brand-light)",border:"1px solid var(--border-2)",borderRadius:9999,fontSize:10,fontWeight:600,color:"var(--brand)"}}>Default</span>
                    )}
                    <button className="btn-icon" style={{width:28,height:28}} title="Sesuaikan saldo"
                      onClick={()=>{setAdjustTarget(w);setAdjustVal(String(w.balance));}}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </button>
                    {w.is_default !== 1 && (
                      <button className="btn-icon" style={{width:28,height:28,color:"var(--red)"}} title="Hapus dompet"
                        onClick={()=>setDeleteTarget(w)}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      </button>
                    )}
                  </div>
                </div>

                <p style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:2}}>{w.name}</p>
                <p style={{fontSize:11,fontWeight:500,color:ti.color,marginBottom:10}}>{ti.label}</p>
                <p className={balHidden?"balance-hidden":""}
                  style={{fontSize:"clamp(16px,3vw,20px)",fontWeight:700,color:w.color||"var(--brand)",letterSpacing:"-0.5px",marginBottom:4}}>
                  {fmt(w.balance)}
                </p>
                <p style={{fontSize:11,color:"var(--text-3)"}}>Tap untuk lihat histori →</p>
              </div>
            );
          })}

          {/* Add card */}
          <button onClick={()=>setShowForm(true)}
            style={{background:"var(--bg-white)",border:"1.5px dashed var(--border-2)",borderRadius:16,padding:18,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",minHeight:160,transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--brand)";e.currentTarget.style.background="var(--brand-light)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border-2)";e.currentTarget.style.background="var(--bg-white)";}}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{color:"var(--text-3)"}}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span style={{fontSize:13,color:"var(--text-3)",fontWeight:500}}>Tambah Dompet</span>
          </button>
        </div>
      )}

      {/* ── Wallet Detail Drawer ─────────────────────────────────────── */}
      {drawerWallet && (
        <>
          <div className="drawer-overlay" onClick={()=>setDrawerWallet(null)}/>
          <div className="drawer">
            <div className="drawer-header">
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:`${drawerWallet.color||"#00d4ff"}22`,border:`1px solid ${drawerWallet.color||"var(--border)"}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <WalletIcon type={drawerWallet.type} color={drawerWallet.color||"#00d4ff"} size={18}/>
                </div>
                <div>
                  <p style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{drawerWallet.name}</p>
                  <p className={balHidden?"balance-hidden":""} style={{fontSize:14,fontWeight:700,color:drawerWallet.color||"var(--brand)"}}>
                    {fmt(drawerWallet.balance)}
                  </p>
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button className="btn-icon" title="Sesuaikan saldo"
                  onClick={()=>{setAdjustTarget(drawerWallet);setAdjustVal(String(drawerWallet.balance));}}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
                <button className="btn-icon" onClick={()=>setDrawerWallet(null)}><CloseIcon/></button>
              </div>
            </div>

            <div className="drawer-body">
              <p style={{fontSize:12,fontWeight:600,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:12}}>Histori Transaksi</p>

              {drawerLoad ? (
                <div style={{display:"flex",justifyContent:"center",padding:40}}><div className="sw-spinner"/></div>
              ) : drawerTxs.length === 0 ? (
                <div style={{textAlign:"center",padding:"40px 20px"}}>
                  <div style={{fontSize:32,marginBottom:10}}>📭</div>
                  <p style={{color:"var(--text-3)",fontSize:14}}>Belum ada transaksi</p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {drawerTxs.map(t => {
                    const isTo = String(t.to_wallet_id) === String(drawerWallet.id);
                    const effectiveSign  = t.type==="transfer" ? (isTo?"+":"−") : TS[t.type];
                    const effectiveColor = t.type==="transfer" ? (isTo?"var(--green)":"var(--red)") : TC[t.type];
                    return (
                      <div key={t.id}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",background:"var(--bg-white)",borderRadius:10,border:"1px solid var(--border)"}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:`${effectiveColor}18`,border:`1px solid ${effectiveColor}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,fontWeight:700,color:effectiveColor}}>
                          {effectiveSign}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {t.note || t.category_name || TL[t.type]}
                          </p>
                          <p style={{fontSize:11,color:"var(--text-3)",marginTop:2}}>
                            {new Date(t.transaction_date).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}
                          </p>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <p style={{fontSize:13,fontWeight:700,color:effectiveColor}}>{effectiveSign}{fmt(t.amount)}</p>
                          {Number(t.fee||0)>0 && <p style={{fontSize:10,color:"var(--amber)"}}>fee {fmt(t.fee)}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Adjust Balance Modal ─────────────────────────────────────── */}
      {adjustTarget && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setAdjustTarget(null)}>
          <div className="modal-box" style={{maxWidth:480}}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Sesuaikan Saldo</h2>
                <p style={{fontSize:12,color:"var(--text-3)",marginTop:2}}>Dompet: <strong style={{color:"var(--text-2)"}}>{adjustTarget.name}</strong></p>
              </div>
              <button className="btn-icon" onClick={()=>setAdjustTarget(null)}><CloseIcon/></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{marginBottom:16}}>
                ⚠️ Penyesuaian ini <strong>langsung mengubah saldo</strong> tanpa mencatat transaksi. Gunakan untuk koreksi saldo awal atau selisih.
              </div>
              <div className="form-group">
                <label className="sw-label">Saldo Baru</label>
                <div style={{display:"flex",border:"1.5px solid var(--brand)",borderRadius:"var(--radius)",overflow:"hidden",background:"var(--bg-white)",boxShadow:"0 0 0 3px rgba(27,79,216,0.1)"}}>
                  <span style={{padding:"0 16px",fontSize:14,fontWeight:600,color:"var(--text-3)",borderRight:"1px solid var(--border)",display:"flex",alignItems:"center",flexShrink:0}}>Rp</span>
                  <input type="number" min="0" step="any" value={adjustVal} onChange={e=>setAdjustVal(e.target.value)} autoFocus
                    style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"12px 16px",fontSize:22,fontWeight:700,color:"var(--text)"}}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setAdjustTarget(null)}>Batal</button>
              <button className="btn-primary" disabled={adjustSaving} onClick={handleAdjust}>
                {adjustSaving ? "Menyimpan..." : "Simpan Saldo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDeleteTarget(null)}>
          <div className="modal-box" style={{maxWidth:380}}>
            <div className="modal-body" style={{textAlign:"center",padding:"32px 28px"}}>
              <div style={{fontSize:44,marginBottom:14}}>🗑️</div>
              <h3 style={{fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:8}}>Hapus "{deleteTarget.name}"?</h3>
              <p style={{fontSize:14,color:"var(--text-3)",lineHeight:1.6}}>Semua riwayat transaksi dompet ini juga akan dihapus. Tindakan ini tidak bisa dibatalkan.</p>
            </div>
            <div className="modal-footer" style={{justifyContent:"center",gap:12}}>
              <button className="btn-secondary" style={{minWidth:100}} onClick={()=>setDeleteTarget(null)} disabled={deleting}>Batal</button>
              <button className="btn-danger"    style={{minWidth:100}} onClick={handleDelete} disabled={deleting}>
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Wallet Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal-box" style={{maxWidth:480}}>
            <div className="modal-header">
              <h2 className="modal-title">Tambah Dompet</h2>
              <button className="btn-icon" onClick={()=>setShowForm(false)}><CloseIcon/></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{marginBottom:16}}>{error}</div>}
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="sw-label">Nama Dompet *</label>
                  <input className="sw-input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Contoh: BCA, Dana, Tunai" required autoFocus/>
                </div>
                <div className="form-group">
                  <label className="sw-label">Tipe Dompet</label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {TYPE_OPTS.map(t => (
                      <button key={t.val} type="button" onClick={()=>setForm(p=>({...p,type:t.val,color:t.color}))}
                        style={{padding:"8px 14px",background:form.type===t.val?`${t.color}22`:"var(--bg-subtle)",border:`1.5px solid ${form.type===t.val?t.color:"var(--border)"}`,borderRadius:9999,color:form.type===t.val?t.color:"var(--text-3)",fontSize:13,cursor:"pointer",fontWeight:form.type===t.val?"600":"400",transition:"all .15s"}}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="sw-label">Warna</label>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={()=>setForm(p=>({...p,color:c}))}
                        style={{width:32,height:32,borderRadius:"50%",background:c,border:"none",cursor:"pointer",flexShrink:0,transition:"all .15s",outline:form.color===c?`3px solid ${c}`:"none",outlineOffset:2,transform:form.color===c?"scale(1.15)":"scale(1)"}}/>
                    ))}
                  </div>
                </div>
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14,color:"var(--text-2)",marginBottom:4}}>
                  <input type="checkbox" checked={form.is_default} onChange={e=>setForm(p=>({...p,is_default:e.target.checked}))} style={{width:16,height:16}}/>
                  Jadikan dompet utama
                </label>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setShowForm(false)}>Batal</button>
              <button className="btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Menyimpan..." : "Buat Dompet"}
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionModal
        open={showTrxModal}
        onClose={()=>setShowTrxModal(false)}
        onSuccess={()=>{ setShowTrxModal(false); load(); }}
      />
    </DashboardLayout>
  );
}
