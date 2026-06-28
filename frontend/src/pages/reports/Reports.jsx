import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DashboardLayout from "../../layouts/DashboardLayout";
import { transactionApi, walletApi } from "../../services/api";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const fmtC = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",notation:"compact",maximumFractionDigits:1}).format(n||0);
const fmtF = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);

const fillMonths = (data) => {
  const map={};
  data.forEach(r=>{map[Number(r.month)]=r;});
  return Array.from({length:12},(_,i)=>({name:MONTHS[i],income:Number(map[i+1]?.income||0),expense:Number(map[i+1]?.expense||0)}));
};

const TTip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"var(--bg-subtle)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"10px 14px"}}>
      <p style={{color:"var(--text-3)",fontSize:"12px",marginBottom:"6px"}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,fontSize:"13px",fontWeight:"600"}}>{p.name}: {fmtF(p.value)}</p>)}
    </div>
  );
};

export default function Reports() {
  const [data,       setData]       = useState(null);
  const [totalBal,   setTotalBal]   = useState(0);
  const [prevBal,    setPrevBal]    = useState(null); // simulate previous period
  const [loading,    setLoading]    = useState(true);
  const [balHidden,  setBalHidden]  = useState(false);
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [month,      setMonth]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rep, wal] = await Promise.all([
        transactionApi.getReport({year,month:month||""}),
        walletApi.getAll(),
      ]);
      setData(rep.data.data);
      setTotalBal(wal.data.data?.total_balance || 0);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const barData  = data ? fillMonths(data.yearly_data) : [];
  const pieData  = (data?.expense_by_category||[]).map(c=>({name:c.name||"Lainnya",value:Number(c.total),color:c.color||"#00d4ff"}));
  const totInc   = barData.reduce((a,b)=>a+b.income, 0);
  const totExp   = barData.reduce((a,b)=>a+b.expense,0);
  const netPnL   = totInc - totExp;
  const pnlPct   = totInc > 0 ? ((netPnL / totInc) * 100).toFixed(1) : 0;
  const yearOpts = Array.from({length:5},(_,i)=>new Date().getFullYear()-i);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan</h1>
          <p className="page-sub">Analisis keuangan kamu</p>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setBalHidden(v=>!v)} title={balHidden?"Tampilkan":"Sembunyikan"}
            style={{width:"34px",height:"34px",background:"var(--bg-white)",border:"1px solid var(--border)",borderRadius:"var(--radius)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text-3)"}}>
            {balHidden
              ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              : <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
            }
          </button>
          <select className="sw-select" value={year} onChange={e=>setYear(Number(e.target.value))}>
            {yearOpts.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <select className="sw-select" value={month||""} onChange={e=>setMonth(e.target.value?Number(e.target.value):null)}>
            <option value="">Semua Bulan</option>
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"80px"}}><div className="sw-spinner"/></div>
      ) : (
        <>
          {/* ── PnL Hero Card ─────────────────────────── */}
          <div style={{background:"linear-gradient(135deg, var(--bg-white) 0%, var(--bg-subtle) 100%)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"24px 28px", marginBottom:"20px", position:"relative", overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${netPnL>=0?"var(--green)":"var(--red)"},transparent)`,opacity:0.8}}/>
            {/* Glow orb */}
            <div style={{position:"absolute",right:"-30px",top:"-30px",width:"160px",height:"160px",borderRadius:"50%",background:`radial-gradient(circle, ${netPnL>=0?"rgba(0,229,160,0.08)":"rgba(255,77,109,0.08)"} 0%, transparent 70%)`,pointerEvents:"none"}}/>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"16px"}}>
              <div>
                <p style={{fontSize:"12px",fontWeight:"600",color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:"6px"}}>
                  Total Balance
                </p>
                <p className={balHidden?"balance-hidden":""} style={{fontFamily:"inherit",fontSize:"clamp(24px,4vw,36px)",fontWeight:"700",color:"var(--text)",letterSpacing:"-1px",marginBottom:"6px"}}>
                  {fmtF(totalBal)}
                </p>
                <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                  <span style={{padding:"4px 12px",borderRadius:"9999px",background:netPnL>=0?"rgba(0,229,160,0.15)":"rgba(255,77,109,0.15)",border:`1px solid ${netPnL>=0?"var(--green)":"var(--red)"}`,color:netPnL>=0?"var(--green)":"var(--red)",fontSize:"13px",fontWeight:"700"}}>
                    {netPnL>=0?"▲":"▼"} {netPnL>=0?"+":""}{fmtC(netPnL)} ({netPnL>=0?"+":""}{pnlPct}%)
                  </span>
                  <span style={{fontSize:"12px",color:"var(--text-3)"}}>
                    {month ? `${MONTHS[month-1]} ${year}` : `Sepanjang ${year}`}
                  </span>
                </div>
              </div>
              {/* Quick stats */}
              <div style={{display:"flex",gap:"20px",flexWrap:"wrap"}}>
                {[
                  {label:"Pemasukan",val:totInc,color:"var(--green)",icon:"📈"},
                  {label:"Pengeluaran",val:totExp,color:"var(--red)",icon:"📉"},
                ].map(s=>(
                  <div key={s.label} style={{textAlign:"right"}}>
                    <p style={{fontSize:"11px",color:"var(--text-3)",marginBottom:"2px"}}>{s.icon} {s.label}</p>
                    <p className={balHidden?"balance-hidden":""} style={{fontFamily:"inherit",fontSize:"16px",fontWeight:"700",color:s.color}}>{fmtF(s.val)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Summary cards ─────────────────────────── */}
          <div className="report-summary-grid" style={{marginBottom:"20px"}}>
            {[
              {label:"Total Pemasukan",val:totInc,color:"var(--green)",bg:"rgba(0,229,160,0.08)",icon:"↑"},
              {label:"Total Pengeluaran",val:totExp,color:"var(--red)",bg:"rgba(255,77,109,0.08)",icon:"↓"},
              {label:"Net P&L",val:netPnL,color:netPnL>=0?"var(--brand)":"var(--red)",bg:"rgba(0,212,255,0.08)",icon:netPnL>=0?"✓":"✗"},
              {label:"Rasio Pengeluaran",val:null,color:"var(--amber)",bg:"rgba(245,158,11,0.08)",icon:"%",
               display: totInc>0 ? `${Math.round(totExp/totInc*100)}%` : "—"},
            ].map(c=>(
              <div key={c.label} className="stat-card hover-lift" style={{background:c.bg}}>
                <div className="stat-icon" style={{background:"var(--bg-white)",fontSize:"16px",color:c.color,fontWeight:"700"}}>{c.icon}</div>
                <div style={{minWidth:0}}>
                  <p className="stat-label">{c.label}</p>
                  <p className={`stat-value ${balHidden?"balance-hidden":""}`} style={{color:c.color,fontSize:"clamp(12px,2.5vw,15px)"}}>
                    {c.display || fmtF(c.val)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Bar chart ─────────────────────────────── */}
          <div className="sw-card" style={{marginBottom:"16px"}}>
            <h3 style={{fontFamily:"inherit",fontSize:"14px",fontWeight:"700",color:"var(--text)",marginBottom:"18px"}}>
              Pemasukan vs Pengeluaran — {year}
            </h3>
            <div style={{height:250}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{top:4,right:4,left:0,bottom:0}} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:"#667085",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={fmtC} tick={{fill:"#667085",fontSize:10}} axisLine={false} tickLine={false} width={65}/>
                  <Tooltip content={<TTip/>}/>
                  <Bar dataKey="income"  name="Pemasukan"  fill="#00e5a0" radius={[4,4,0,0]}/>
                  <Bar dataKey="expense" name="Pengeluaran" fill="#ff4d6d" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:"16px",marginTop:"10px"}}>
              {[["#00e5a0","Pemasukan"],["#ff4d6d","Pengeluaran"]].map(([c,l])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:c}}/>
                  <span style={{fontSize:"12px",color:"var(--text-3)"}}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pie chart ─────────────────────────────── */}
          {pieData.length > 0 && (
            <div className="sw-card" style={{marginBottom:"16px"}}>
              <h3 style={{fontFamily:"inherit",fontSize:"14px",fontWeight:"700",color:"var(--text)",marginBottom:"18px"}}>
                Pengeluaran per Kategori{month ? ` — ${MONTHS[month-1]} ${year}` : ` — ${year}`}
              </h3>
              <div style={{display:"flex",gap:"20px",flexWrap:"wrap",alignItems:"flex-start"}}>
                <div style={{flex:"0 0 220px",height:220,margin:"0 auto"}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" paddingAngle={3}>
                        {pieData.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
                      </Pie>
                      <Tooltip formatter={v=>fmtF(v)} contentStyle={{background:"var(--bg-subtle)",border:"1px solid var(--border)",borderRadius:"var(--radius)",color:"var(--text)"}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{flex:1,minWidth:"200px",display:"flex",flexDirection:"column",gap:"8px"}}>
                  {pieData.map((c,i)=>{
                    const pct = totExp>0 ? Math.round(c.value/totExp*100) : 0;
                    return (
                      <div key={i} className="hover-lift" style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 8px",borderRadius:"var(--radius)"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:c.color,flexShrink:0}}/>
                        <span style={{fontSize:"12px",color:"var(--text-2)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                        <div style={{width:"70px",height:"4px",background:"var(--bg-subtle)",borderRadius:"9999px",overflow:"hidden",flexShrink:0}}>
                          <div style={{width:`${pct}%`,height:"100%",background:c.color,borderRadius:"9999px"}}/>
                        </div>
                        <span style={{fontSize:"11px",color:"var(--text-3)",width:"28px",textAlign:"right",flexShrink:0}}>{pct}%</span>
                        <span className={balHidden?"balance-hidden":""} style={{fontSize:"12px",fontWeight:"600",color:c.color,width:"90px",textAlign:"right",fontFamily:"inherit",flexShrink:0}}>{fmtC(c.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <ExportSection year={year} month={month}/>
        </>
      )}
    </DashboardLayout>
  );
}

function ExportSection({year,month}) {
  const [exp,setExp] = useState(false);
  const range = () => {
    if(month){const m=String(month).padStart(2,"0"),last=new Date(year,month,0).getDate();return{start:`${year}-${m}-01`,end:`${year}-${m}-${last}`};}
    return{start:`${year}-01-01`,end:`${year}-12-31`};
  };
  const exportCSV = async () => {
    setExp(true);
    try {
      const{start,end}=range();
      const res=await transactionApi.getExport({start_date:start,end_date:end});
      const rows=res.data.data||[];
      if(!rows.length){alert("Tidak ada data.");return;}
      const hdr=["Tanggal","Tipe","Nominal","Biaya","Catatan","Kategori","Dompet","Dompet Tujuan"];
      const lines=[hdr.join(",")];
      rows.forEach(r=>lines.push([r.transaction_date,r.type,r.amount,r.fee||0,`"${(r.note||"").replace(/"/g,'""')}"`,r.category||"",r.wallet||"",r.to_wallet||""].join(",")));
      const blob=new Blob(["\uFEFF"+lines.join("\n")],{type:"text/csv;charset=utf-8;"});
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`SpendWise_${year}${month?`_${String(month).padStart(2,"0")}`:""}.csv`;a.click();URL.revokeObjectURL(url);
    }catch{alert("Gagal export CSV.");}finally{setExp(false);}
  };
  const exportPDF = async () => {
    setExp(true);
    try {
      const{start,end}=range();
      const res=await transactionApi.getExport({start_date:start,end_date:end});
      const rows=res.data.data||[];
      if(!rows.length){alert("Tidak ada data.");return;}
      const{default:jsPDF}=await import("jspdf");
      const{default:autoTable}=await import("jspdf-autotable");
      const doc=new jsPDF({orientation:"landscape"});
      doc.setFontSize(18);doc.setTextColor(0,212,255);doc.text("SpendWise — Laporan Keuangan",14,18);
      doc.setFontSize(10);doc.setTextColor(120,130,160);
      doc.text(`Periode: ${month?`${MONTHS[month-1]} ${year}`:`Tahun ${year}`}`,14,26);
      doc.text(`Diekspor: ${new Date().toLocaleDateString("id-ID")}`,14,32);
      autoTable(doc,{
        startY:38,
        head:[["Tanggal","Tipe","Nominal","Biaya","Catatan","Kategori","Dompet"]],
        body:rows.map(r=>[new Date(r.transaction_date).toLocaleDateString("id-ID"),r.type==="income"?"Pemasukan":r.type==="expense"?"Pengeluaran":"Transfer",fmtF(r.amount),r.fee>0?fmtF(r.fee):"-",r.note||"-",r.category||"-",r.wallet+(r.to_wallet?` → ${r.to_wallet}`:"")]),
        styles:{fontSize:9,cellPadding:4},
        headStyles:{fillColor:[13,21,38],textColor:[0,212,255],fontStyle:"bold"},
        alternateRowStyles:{fillColor:[17,29,53]},
        bodyStyles:{textColor:[200,210,230],fillColor:[13,21,38]},
        columnStyles:{2:{halign:"right"},3:{halign:"right"}},
      });
      doc.save(`SpendWise_${year}${month?`_${String(month).padStart(2,"0")}`:""}.pdf`);
    }catch(e){console.error(e);alert("Gagal PDF.");}finally{setExp(false);}
  };
  return (
    <div className="sw-card" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"14px",flexWrap:"wrap",padding:"18px 22px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{color:"var(--brand)",flexShrink:0}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8"/></svg>
        <div>
          <p style={{fontSize:"14px",fontWeight:"600",color:"var(--text)",marginBottom:"2px"}}>Export Data</p>
          <p style={{fontSize:"12px",color:"var(--text-3)"}}>Unduh laporan keuangan kamu</p>
        </div>
      </div>
      <div style={{display:"flex",gap:"8px"}}>
        <button onClick={exportCSV} disabled={exp} className="btn-secondary" style={{padding:"9px 16px",fontSize:"13px"}}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          CSV
        </button>
        <button onClick={exportPDF} disabled={exp} className="btn-primary" style={{padding:"9px 16px",fontSize:"13px"}}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          PDF
        </button>
      </div>
    </div>
  );
}
