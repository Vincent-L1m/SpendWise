import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { categoryApi } from "../../services/api";

const ICON_LIST=["tag","coffee","truck","shopping-bag","heart","film","book","file-text","home","zap","briefcase","gift","code","trending-up","phone","music","camera","globe","sun","moon","star","smile","map-pin","package","scissors","tool","umbrella","watch","wifi","more-horizontal"];
const COLORS=["#00d4ff","#00e5a0","#ff4d6d","#f59e0b","#7c3aed","var(--text-4)","#e879f9","#fb923c","#34d399","#f43f5e","#a78bfa"];
const ICON_SYM={"tag":"🏷","coffee":"☕","truck":"🚛","shopping-bag":"🛍","heart":"❤️","film":"🎬","book":"📚","file-text":"📄","home":"🏠","zap":"⚡","briefcase":"💼","gift":"🎁","code":"💻","trending-up":"📈","phone":"📱","music":"🎵","camera":"📷","globe":"🌐","sun":"☀️","moon":"🌙","star":"⭐","smile":"😊","map-pin":"📍","package":"📦","scissors":"✂️","tool":"🔧","umbrella":"☂️","watch":"⌚","wifi":"📶","more-horizontal":"⋯"};
const TL={income:"Pemasukan",expense:"Pengeluaran",both:"Keduanya"};

export default function Categories(){
  const [cats,      setCats]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editData,  setEditData]  = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [filter,    setFilter]    = useState("all");
  const [form,setForm]=useState({name:"",type:"expense",icon:"tag",color:"#ff4d6d"});

  const load=useCallback(async()=>{
    setLoading(true);
    try{const r=await categoryApi.getAll();setCats(r.data.data||[]);}
    catch{setCats([]);}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);

  const openAdd=()=>{setEditData(null);setForm({name:"",type:"expense",icon:"tag",color:"#ff4d6d"});setError("");setShowForm(true);};
  const openEdit=(c)=>{setEditData(c);setForm({name:c.name,type:c.type,icon:c.icon||"tag",color:c.color||"#00d4ff"});setError("");setShowForm(true);};

  const handleSave=async(e)=>{
    e.preventDefault();setError("");
    if(!form.name.trim())return setError("Nama kategori wajib diisi.");
    setSaving(true);
    try{
      if(editData)await categoryApi.update(editData.id,form);
      else await categoryApi.create(form);
      setShowForm(false);load();
    }catch(err){setError(err.response?.data?.message||"Gagal menyimpan.");}
    finally{setSaving(false);}
  };

  const handleDelete=async()=>{
    setDeleting(true);
    try{await categoryApi.remove(deleteId);setDeleteId(null);load();}
    catch(err){alert(err.response?.data?.message||"Gagal menghapus.");setDeleteId(null);}
    finally{setDeleting(false);}
  };

  const FILTER_TABS=[["all","Semua"],["income","Pemasukan"],["expense","Pengeluaran"],["custom","Kustom"],["default","Bawaan"]];
  const filtered=cats.filter(c=>{
    if(filter==="all")     return true;
    if(filter==="custom")  return c.is_custom;
    if(filter==="default") return !c.is_custom;
    return c.type===filter;
  });

  return(
    <DashboardLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori</h1>
          <p className="page-sub">{cats.length} total · {cats.filter(c=>c.is_custom).length} kustom</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Tambah
        </button>
      </div>

      {/* Filter tabs — scrollable on mobile */}
      <div style={{display:"flex",gap:"6px",marginBottom:"16px",overflowX:"auto",paddingBottom:"4px"}}>
        {FILTER_TABS.map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            style={{padding:"7px 14px",background:filter===v?"var(--brand-light)":"var(--bg-white)",border:`1px solid ${filter===v?"var(--brand)":"var(--border)"}`,borderRadius:"9999px",color:filter===v?"var(--brand)":"var(--text-3)",fontSize:"12px",fontWeight:filter===v?"600":"400",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all .15s ease"}}>
            {l}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading?(
        <div style={{display:"flex",justifyContent:"center",padding:"60px"}}><div className="sw-spinner"/></div>
      ):(
        <div className="cat-grid">
          {filtered.map(cat=>(
            <div key={cat.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 14px",background:"var(--bg-white)",border:`1px solid ${cat.color||"var(--border)"}40`,borderRadius:"var(--radius-lg)"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"var(--radius)",background:`${cat.color||"#00d4ff"}18`,border:`1px solid ${cat.color||"var(--border)"}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"18px"}}>
                {ICON_SYM[cat.icon]||"🏷"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:"13px",fontWeight:"600",color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.name}</p>
                <div style={{display:"flex",gap:"4px",marginTop:"3px",flexWrap:"wrap"}}>
                  <span style={{padding:"1px 7px",borderRadius:"9999px",fontSize:"10px",fontWeight:"500",background:`${cat.color||"#00d4ff"}18`,color:cat.color||"var(--brand)"}}>{TL[cat.type]}</span>
                  {cat.is_custom
                    ?<span style={{padding:"1px 7px",borderRadius:"9999px",fontSize:"10px",fontWeight:"500",background:"var(--brand-light)",color:"var(--brand)"}}>Kustom</span>
                    :<span style={{padding:"1px 7px",borderRadius:"9999px",fontSize:"10px",background:"var(--bg-subtle)",color:"var(--text-3)"}}>Bawaan</span>
                  }
                </div>
              </div>
              {cat.is_custom&&(
                <div style={{display:"flex",gap:"5px",flexShrink:0}}>
                  <button className="btn-icon" style={{width:"28px",height:"28px"}} onClick={()=>openEdit(cat)}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                  <button className="btn-icon" style={{width:"28px",height:"28px",color:"var(--red)"}} onClick={()=>setDeleteId(cat.id)}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
          <button onClick={openAdd} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"6px",padding:"14px",background:"var(--bg-white)",border:"1px dashed var(--border-2)",borderRadius:"var(--radius-lg)",cursor:"pointer",minHeight:"72px"}}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{color:"var(--text-3)"}}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span style={{fontSize:"12px",color:"var(--text-3)"}}>Kategori Baru</span>
          </button>
        </div>
      )}

      {/* Form modal */}
      {showForm&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal-box" style={{maxWidth:"520px"}}>
            
            <div className="modal-header">
              <h2 className="modal-title">{editData?"Edit":"Tambah"} Kategori</h2>
              <button className="btn-icon" onClick={()=>setShowForm(false)}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="modal-body">

            {/* Preview */}
            <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px",background:"var(--bg-white)",borderRadius:"var(--radius)",marginBottom:"16px",border:"1px solid var(--border)"}}>
              <div style={{width:"44px",height:"44px",borderRadius:"var(--radius)",background:`${form.color}22`,border:`1px solid ${form.color}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}>
                {ICON_SYM[form.icon]||"🏷"}
              </div>
              <div>
                <p style={{fontFamily:"inherit",fontSize:"15px",fontWeight:"700",color:"var(--text)"}}>{form.name||"Nama Kategori"}</p>
                <span style={{padding:"2px 8px",borderRadius:"9999px",fontSize:"10px",fontWeight:"500",background:`${form.color}22`,color:form.color}}>{TL[form.type]}</span>
              </div>
            </div>

            {error&&<div style={{padding:"9px 12px",background:"var(--red-bg)",border:"1px solid rgba(255,77,109,.3)",borderRadius:"var(--radius)",color:"var(--red)",fontSize:"13px",marginBottom:"12px"}}>{error}</div>}

            <form onSubmit={handleSave}>
              <div style={{marginBottom:"14px"}}>
                <label className="sw-label">Nama Kategori *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  placeholder="Contoh: Belanja Online" required className="sw-input" autoFocus/>
              </div>
              <div style={{marginBottom:"14px"}}>
                <label className="sw-label">Tipe</label>
                <div style={{display:"flex",gap:"6px"}}>
                  {[["income","Pemasukan"],["expense","Pengeluaran"],["both","Keduanya"]].map(([v,l])=>(
                    <button key={v} type="button" onClick={()=>setForm(p=>({...p,type:v}))}
                      style={{flex:1,padding:"8px 6px",background:form.type===v?"var(--brand-light)":"var(--bg-white)",border:`1px solid ${form.type===v?"var(--brand)":"var(--border)"}`,borderRadius:"var(--radius)",color:form.type===v?"var(--brand)":"var(--text-3)",fontSize:"12px",fontWeight:form.type===v?"600":"400",cursor:"pointer"}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:"14px"}}>
                <label className="sw-label">Ikon</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:"5px"}}>
                  {ICON_LIST.map(ic=>(
                    <button key={ic} type="button" onClick={()=>setForm(p=>({...p,icon:ic}))} title={ic}
                      style={{width:"36px",height:"36px",background:form.icon===ic?`${form.color}22`:"var(--bg-white)",border:`${form.icon===ic?2:1}px solid ${form.icon===ic?form.color:"var(--border)"}`,borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:"15px"}}>
                      {ICON_SYM[ic]||"🏷"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:"18px"}}>
                <label className="sw-label">Warna</label>
                <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                  {COLORS.map(c=>(
                    <button key={c} type="button" onClick={()=>setForm(p=>({...p,color:c}))}
                      style={{width:"26px",height:"26px",borderRadius:"50%",background:c,border:form.color===c?"3px solid white":"2px solid transparent",cursor:"pointer",flexShrink:0}}/>
                  ))}
                </div>
              </div>
            </form>
            </div>{/* end modal-body */}
            <div className="modal-footer">
              <button className="btn-secondary" onClick={()=>setShowForm(false)}>Batal</button>
              <button className="btn-primary" disabled={saving} onClick={()=>handleSave({preventDefault:()=>{}})}>
                {saving?"Menyimpan...":editData?"Simpan Perubahan":"Buat Kategori"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDeleteId(null)}>
          <div className="modal-box" style={{maxWidth:380}}>
            <div className="modal-body" style={{textAlign:"center",padding:"32px 28px"}}>
              <div style={{fontSize:44,marginBottom:14}}>🗑️</div>
              <h3 style={{fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:8}}>Hapus Kategori?</h3>
              <p style={{fontSize:14,color:"var(--text-3)",lineHeight:1.6}}>Transaksi yang sudah dicatat tidak terhapus, namun tidak akan memiliki kategori.</p>
            </div>
            <div className="modal-footer" style={{justifyContent:"center",gap:12}}>
              <button className="btn-secondary" style={{minWidth:100}} onClick={()=>setDeleteId(null)} disabled={deleting}>Batal</button>
              <button className="btn-danger"    style={{minWidth:100}} onClick={handleDelete} disabled={deleting}>{deleting?"Menghapus...":"Ya, Hapus"}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
