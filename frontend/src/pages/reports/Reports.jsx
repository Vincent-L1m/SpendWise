import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { transactionApi, walletApi } from "../../services/api";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const fmtC = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",notation:"compact",maximumFractionDigits:1}).format(n||0);
const fmtF = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);

const fillMonths = (data) => {
  const map={};
  (data||[]).forEach(r=>{map[Number(r.month)]=r;});
  return Array.from({length:12},(_,i)=>({name:MONTHS[i],income:Number(map[i+1]?.income||0),expense:Number(map[i+1]?.expense||0)}));
};

export default function Reports() {
  const [chartData,  setChartData]  = useState(null);
  const [totalBal,   setTotalBal]   = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [balHidden,  setBalHidden]  = useState(false);
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [month,      setMonth]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [chartRes, walRes] = await Promise.all([
        transactionApi.getChart({ range: "monthly", year }),
        walletApi.getAll(),
      ]);
      setChartData(chartRes.data.data?.data || []);
      setTotalBal(walRes.data.data?.total_balance || 0);
    } catch(e) {
      console.error("Reports load error:", e);
      setError(e?.response?.data?.message || "Gagal memuat data laporan.");
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const barData  = fillMonths(chartData || []);
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
      ) : error ? (
        <div style={{textAlign:"center",padding:"60px 20px",color:"var(--red)",fontSize:"14px"}}>
          <div style={{fontSize:"32px",marginBottom:"12px"}}>⚠️</div>
          <p style={{fontWeight:"600",marginBottom:"6px"}}>Gagal memuat laporan</p>
          <p style={{color:"var(--text-3)",marginBottom:"20px"}}>{error}</p>
          <button className="btn-primary" onClick={load} style={{padding:"9px 20px",fontSize:"13px"}}>Coba Lagi</button>
        </div>
      ) : (
        <>
          {/* ── PnL Hero Card ─────────────────────────── */}
          <div style={{background:"linear-gradient(135deg, var(--bg-white) 0%, var(--bg-subtle) 100%)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"24px 28px", marginBottom:"20px", position:"relative", overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${netPnL>=0?"var(--green)":"var(--red)"},transparent)`,opacity:0.8}}/>
            <div style={{position:"absolute",right:"-30px",top:"-30px",width:"160px",height:"160px",borderRadius:"50%",background:`radial-gradient(circle, ${netPnL>=0?"rgba(0,229,160,0.08)":"rgba(255,77,109,0.08)"} 0%, transparent 70%)`,pointerEvents:"none"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"16px"}}>
              <div>
                <p style={{fontSize:"12px",fontWeight:"600",color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:"6px"}}>Total Balance</p>
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
        </>
      )}
    </DashboardLayout>
  );
}
