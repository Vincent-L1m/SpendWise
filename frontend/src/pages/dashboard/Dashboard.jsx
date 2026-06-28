import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import DashboardLayout from "../../layouts/DashboardLayout";
import TransactionModal from "../../components/TransactionModal";
import { transactionApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const fmt  = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
const fmtC = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",notation:"compact",maximumFractionDigits:1}).format(n||0);
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const MONTHS_FULL  = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS_LABEL   = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

const fillMonths = (data) => {
  const map = {};
  data.forEach(r => { map[Number(r.month)] = r; });
  return Array.from({length:12},(_,i)=>({name:MONTHS_SHORT[i],income:Number(map[i+1]?.income||0),expense:Number(map[i+1]?.expense||0)}));
};
const buildWeekly = (data) => data.map(r => {
  const d = new Date(r.week_start);
  return {name:`${d.getDate()}/${d.getMonth()+1}`,income:Number(r.income||0),expense:Number(r.expense||0)};
});

const ChartTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"var(--bg-white)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"10px 14px",minWidth:"160px",boxShadow:"var(--shadow-md)"}}>
      <p style={{color:"var(--text-3)",fontSize:"12px",marginBottom:"6px"}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,fontSize:"13px",fontWeight:"600",marginBottom:"2px"}}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
};

/* ── Compact Calendar ─────────────────────────────────────────── */
function BigCalendar({ transactions, balHidden }) {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selDay,    setSelDay]    = useState(null);

  const daily = {};
  (transactions || []).forEach(t => {
    const d = t.transaction_date?.slice(0,10);
    if (!d) return;
    if (!daily[d]) daily[d] = { income:0, expense:0 };
    if (t.type === "income")  daily[d].income  += Number(t.amount);
    if (t.type === "expense") daily[d].expense += Number(t.amount) + Number(t.fee||0);
  });

  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMon = new Date(viewYear, viewMonth+1, 0).getDate();
  const prevDays  = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = firstDay-1; i >= 0; i--) cells.push({ d: prevDays-i, cur:false });
  for (let i = 1; i <= daysInMon; i++) cells.push({ d: i, cur:true });
  const rem = 42 - cells.length;
  for (let i = 1; i <= rem; i++) cells.push({ d: i, cur:false });

  const prevMonth = () => { setSelDay(null); if(viewMonth===0){setViewYear(y=>y-1);setViewMonth(11);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { setSelDay(null); if(viewMonth===11){setViewYear(y=>y+1);setViewMonth(0);}else setViewMonth(m=>m+1); };
  const isToday = (d,cur) => cur && d===now.getDate() && viewMonth===now.getMonth() && viewYear===now.getFullYear();

  const selDateStr = selDay ? `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(selDay).padStart(2,"0")}` : null;
  const selInfo = selDateStr ? daily[selDateStr] : null;
  const selPnL  = selInfo ? selInfo.income - selInfo.expense : 0;

  return (
    <div className="sw-card" style={{ padding:"16px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
        <h3 style={{ fontFamily:"inherit", fontSize:"14px", fontWeight:"700", color:"var(--text)" }}>Kalender Keuangan</h3>
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <button onClick={prevMonth} style={{ background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text-2)", cursor:"pointer", width:"26px", height:"26px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px" }}>‹</button>
          <span style={{ fontSize:"12px", fontWeight:"600", color:"var(--text)", minWidth:"110px", textAlign:"center" }}>{MONTHS_FULL[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={{ background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text-2)", cursor:"pointer", width:"26px", height:"26px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px" }}>›</button>
        </div>
      </div>

      <div style={{ display:"flex", gap:"16px", alignItems:"flex-start", flexWrap:"wrap" }}>
        {/* Calendar grid */}
        <div style={{ flex:"1", minWidth:"220px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"4px" }}>
            {DAYS_LABEL.map(d => <div key={d} style={{ textAlign:"center", fontSize:"10px", fontWeight:"600", color:"var(--text-3)" }}>{d}</div>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px" }}>
            {cells.map((cell, i) => {
              const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(cell.d).padStart(2,"0")}`;
              const info = cell.cur ? daily[dateStr] : null;
              const pnl  = info ? info.income - info.expense : 0;
              const today = isToday(cell.d, cell.cur);
              const selected = cell.cur && selDay === cell.d;
              return (
                <button key={i}
                  onClick={() => cell.cur && setSelDay(selDay===cell.d ? null : cell.d)}
                  disabled={!cell.cur}
                  className={cell.cur ? "hover-lift" : ""}
                  style={{
                    aspectRatio:"1", borderRadius:"var(--radius)",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                    gap:"1px", border: selected ? "2px solid var(--brand)" : today ? "1px solid var(--brand)" : "1px solid transparent",
                    background: selected ? "var(--brand-light)" : today ? "var(--brand-light)" : cell.cur ? "var(--bg-white)" : "transparent",
                    color: !cell.cur ? "var(--text-3)" : "var(--text)",
                    opacity: !cell.cur ? 0.3 : 1,
                    cursor: cell.cur ? "pointer" : "default",
                    fontSize:"11px", fontWeight: today ? "700" : "500",
                    padding:"2px",
                  }}>
                  <span>{cell.d}</span>
                  {info && (
                    <span style={{ fontSize:"7px", fontWeight:"700", color: pnl >= 0 ? "var(--green)" : "var(--red)", lineHeight:1 }}>
                      {pnl >= 0 ? "●" : "●"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:"12px", marginTop:"8px", justifyContent:"center" }}>
            {[["var(--green)","Surplus"],["var(--red)","Defisit"]].map(([c,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:c }}/>
                <span style={{ fontSize:"10px", color:"var(--text-3)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected day detail */}
        {selDay && (
          <div style={{ flex:"0 0 180px", background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"12px", animation:"fadeSlideIn 0.2s ease" }}>
            <p style={{ fontSize:"10px", fontWeight:"600", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:"8px" }}>
              {selDay} {MONTHS_SHORT[viewMonth]}
            </p>
            {selInfo ? (
              <>
                <div style={{ marginBottom:"8px" }}>
                  <p style={{ fontSize:"10px", color:"var(--text-3)", marginBottom:"2px" }}>Pemasukan</p>
                  <p className={balHidden?"balance-hidden":""} style={{ fontSize:"13px", fontWeight:"700", color:"var(--green)", fontFamily:"inherit" }}>{fmt(selInfo.income)}</p>
                </div>
                <div style={{ marginBottom:"8px" }}>
                  <p style={{ fontSize:"10px", color:"var(--text-3)", marginBottom:"2px" }}>Pengeluaran</p>
                  <p className={balHidden?"balance-hidden":""} style={{ fontSize:"13px", fontWeight:"700", color:"var(--red)", fontFamily:"inherit" }}>{fmt(selInfo.expense)}</p>
                </div>
                <div style={{ paddingTop:"8px", borderTop:"1px solid var(--border)" }}>
                  <p style={{ fontSize:"10px", color:"var(--text-3)", marginBottom:"2px" }}>Net P&L</p>
                  <p className={balHidden?"balance-hidden":""} style={{ fontSize:"14px", fontWeight:"700", color: selPnL>=0?"var(--brand)":"var(--red)", fontFamily:"inherit" }}>
                    {selPnL>=0?"+":""}{fmt(selPnL)}
                  </p>
                </div>
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"12px 0" }}>
                <div style={{ fontSize:"22px", marginBottom:"6px" }}>📭</div>
                <p style={{ fontSize:"11px", color:"var(--text-3)" }}>Tidak ada transaksi</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary,    setSummary]    = useState(null);
  const [chartData,  setChartData]  = useState(null);
  const [chartRange, setChartRange] = useState("monthly");
  const [chartType,  setChartType]  = useState("bar"); // "bar" | "line"
  const [showModal,  setShowModal]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [chartLoad,  setChartLoad]  = useState(false);
  const [balHidden,  setBalHidden]  = useState(false);
  const [chartWidth, setChartWidth] = useState(700);
  const chartRef = useRef(null);

  const loadSummary = useCallback(async () => {
    try { setLoading(true); const r = await transactionApi.getSummary(); setSummary(r.data.data); }
    catch { /**/ } finally { setLoading(false); }
  }, []);
  const loadChart = useCallback(async () => {
    try { setChartLoad(true); const r = await transactionApi.getChart({range:chartRange,weeks:10}); setChartData(r.data.data); }
    catch { /**/ } finally { setChartLoad(false); }
  }, [chartRange]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadChart();   }, [loadChart]);
  useEffect(() => {
    window.addEventListener("sw:reload", loadSummary);
    return () => window.removeEventListener("sw:reload", loadSummary);
  }, [loadSummary]);
  useEffect(() => {
    const openModal = () => setShowModal(true);
    window.addEventListener("open-add-trx", openModal);
    return () => window.removeEventListener("open-add-trx", openModal);
  }, []);
  useEffect(() => {
    const measure = () => { if (chartRef.current) setChartWidth(chartRef.current.offsetWidth || 700); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const sc = summary?.salary_cycle;
  const now = new Date();
  const greeting = now.getHours()<12?"Pagi":now.getHours()<17?"Siang":"Malam";
  const chartPoints = chartData ? (chartRange==="monthly" ? fillMonths(chartData.data) : buildWeekly(chartData.data)) : [];

  const totalBal = summary?.total_balance || 0;
  const income   = summary?.monthly_income  || 0;
  const expense  = summary?.monthly_expense || 0;
  const diff     = income - expense;
  const savingRate = income > 0 ? Math.round((diff/income)*100) : 0;

  return (
    <DashboardLayout showFab>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <p style={{fontFamily:"inherit",fontSize:"clamp(16px,3vw,21px)",fontWeight:"600",color:"var(--text)",marginBottom:"3px"}}>
            Selamat {greeting}, <strong style={{color:"var(--brand)"}}>{user?.fullname?.split(" ")[0]}</strong> 👋
          </p>
          {sc?.enabled ? (
            <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
              <span style={{fontSize:"12px",color:"var(--text-3)"}}>Periode:</span>
              <span style={{padding:"2px 10px",background:"var(--brand-light)",border:"1px solid var(--border-2)",borderRadius:"9999px",fontSize:"12px",fontWeight:"600",color:"var(--brand)"}}>
                💰 {new Date(sc.period_start+"T00:00:00").toLocaleDateString("id-ID",{day:"numeric",month:"short"})} – {new Date(sc.period_end+"T00:00:00").toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}
              </span>
            </div>
          ) : (
            <p className="page-sub">{now.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
          )}
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <button onClick={()=>setBalHidden(v=>!v)} title={balHidden?"Tampilkan saldo":"Sembunyikan saldo"}
            style={{width:"36px",height:"36px",background:"var(--bg-white)",border:"1px solid var(--border)",borderRadius:"var(--radius)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--text-3)",transition:"all .15s ease"}}>
            {balHidden
              ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              : <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
            }
          </button>
          <button className="btn-primary" onClick={()=>setShowModal(true)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Tambah
          </button>
        </div>
      </div>

      {loading ? <SkeletonAll/> : (
        <>
          {/* ── Stat cards ──────────────────────────────── */}
          <div className="stat-grid" style={{marginBottom:"20px"}}>
            {[
              { label:"Total Saldo", val:totalBal, color:"var(--brand)", bg:"rgba(0,212,255,0.08)", icon:"💳",
                sub: savingRate >= 0 ? `+${savingRate}% saving rate` : `${savingRate}% saving rate`,
                subColor: savingRate >= 0 ? "var(--green)" : "var(--red)" },
              { label:sc?.enabled?"Pemasukan Periode":"Pemasukan", val:income, color:"var(--green)", bg:"rgba(0,229,160,0.08)", icon:"📈",
                sub:"Total masuk", subColor:"var(--text-3)" },
              { label:sc?.enabled?"Pengeluaran Periode":"Pengeluaran", val:expense, color:"var(--red)", bg:"rgba(255,77,109,0.08)", icon:"📉",
                sub: income>0 ? `${Math.round(expense/income*100)}% dari pemasukan` : "0%",
                subColor:"var(--text-3)" },
              { label:"Sisa / Tabungan", val:diff, color:diff>=0?"var(--amber)":"var(--red)", bg:"rgba(245,158,11,0.08)", icon:"✨",
                sub: diff>=0 ? "Surplus 🎉" : "Defisit ⚠️",
                subColor: diff>=0 ? "var(--green)" : "var(--red)" },
            ].map(c => (
              <div key={c.label} className="stat-card hover-lift" style={{background:c.bg}}>
                <div className="stat-icon" style={{background:"var(--bg-white)",fontSize:"17px"}}>{c.icon}</div>
                <div style={{minWidth:0,flex:1}}>
                  <p className="stat-label">{c.label}</p>
                  <p className={`stat-value ${balHidden?"balance-hidden":""}`} style={{color:c.color,fontSize:"clamp(12px,2.5vw,15px)"}}>{fmt(c.val)}</p>
                  <p style={{fontSize:"11px",color:c.subColor,marginTop:"2px",fontWeight:"500"}}>{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Cash Flow chart ───────────────────────────── */}
          <div className="sw-card" style={{marginBottom:"20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"10px"}}>
              <div>
                <h3 style={{fontFamily:"var(--font-display)",fontSize:"15px",fontWeight:"700",color:"var(--text-primary)",marginBottom:"2px"}}>Cash Flow</h3>
                <p style={{fontSize:"12px",color:"var(--text-muted)"}}>{chartRange==="monthly"?`Sepanjang ${now.getFullYear()}`:"10 minggu terakhir"}</p>
              </div>
              {/* Controls: range + chart type */}
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                {/* Range toggle */}
                <div style={{display:"flex",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:"3px",gap:"2px"}}>
                  {[["monthly","Bulanan"],["weekly","Mingguan"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setChartRange(v)}
                      style={{padding:"5px 12px",border:"none",borderRadius:"var(--radius-sm)",background:chartRange===v?"var(--bg-elevated)":"transparent",color:chartRange===v?"var(--text-primary)":"var(--text-muted)",fontSize:"12px",fontWeight:chartRange===v?"600":"400",cursor:"pointer",transition:"all var(--transition)"}}>
                      {l}
                    </button>
                  ))}
                </div>
                {/* Chart type toggle */}
                <div style={{display:"flex",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:"3px",gap:"2px"}}>
                  <button onClick={()=>setChartType("bar")} title="Bar Chart"
                    style={{padding:"5px 10px",border:"none",borderRadius:"var(--radius-sm)",background:chartType==="bar"?"var(--bg-elevated)":"transparent",color:chartType==="bar"?"var(--text-primary)":"var(--text-muted)",cursor:"pointer",transition:"all var(--transition)",display:"flex",alignItems:"center"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="12" width="4" height="10" rx="1" fill="currentColor"/><rect x="10" y="6" width="4" height="16" rx="1" fill="currentColor"/><rect x="18" y="3" width="4" height="19" rx="1" fill="currentColor"/></svg>
                  </button>
                  <button onClick={()=>setChartType("line")} title="Line Chart"
                    style={{padding:"5px 10px",border:"none",borderRadius:"var(--radius-sm)",background:chartType==="line"?"var(--bg-elevated)":"transparent",color:chartType==="line"?"var(--text-primary)":"var(--text-muted)",cursor:"pointer",transition:"all var(--transition)",display:"flex",alignItems:"center"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="2,18 8,10 14,14 20,4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {chartLoad ? (
              <div style={{height:240,display:"flex",alignItems:"center",justifyContent:"center"}}><div className="sw-spinner"/></div>
            ) : chartPoints.length===0 ? (
              <div style={{height:240,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-muted)",fontSize:"13px"}}>Belum ada data transaksi</div>
            ) : (
              <div ref={chartRef} style={{height:240,width:"100%"}}>
                {chartType === "bar" ? (
                  <BarChart width={Math.max(chartWidth - 40, 300)} height={240} data={chartPoints} margin={{top:4,right:4,left:0,bottom:0}} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                    <XAxis dataKey="name" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={fmtC} tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false} width={62}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Legend formatter={v=>v==="income"?"Pemasukan":"Pengeluaran"} wrapperStyle={{fontSize:"12px",color:"#94a3b8"}}/>
                    <Bar dataKey="income"  name="income"  fill="#00e5a0" radius={[4,4,0,0]}/>
                    <Bar dataKey="expense" name="expense" fill="#ff4d6d" radius={[4,4,0,0]}/>
                  </BarChart>
                ) : (
                  <LineChart width={Math.max(chartWidth - 40, 300)} height={240} data={chartPoints} margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                    <XAxis dataKey="name" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={fmtC} tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false} width={62}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Legend formatter={v=>v==="income"?"Pemasukan":"Pengeluaran"} wrapperStyle={{fontSize:"12px",color:"#94a3b8"}}/>
                    <Line type="monotone" dataKey="income"  name="income"  stroke="#00e5a0" strokeWidth={2} dot={{fill:"#00e5a0",r:3}} activeDot={{r:5}}/>
                    <Line type="monotone" dataKey="expense" name="expense" stroke="#ff4d6d" strokeWidth={2} dot={{fill:"#ff4d6d",r:3}} activeDot={{r:5}}/>
                  </LineChart>
                )}
              </div>
            )}
          </div>

          {/* ── Wallets ──────────────────────────────────── */}
          {summary?.wallets?.length>0 && (
            <div style={{marginBottom:"20px"}}>
              <div className="section-head">
                <h3 className="section-title">Dompet</h3>
                <button className="link-btn" onClick={()=>navigate("/wallets")}>Kelola →</button>
              </div>
              <div className="wallet-grid">
                {summary.wallets.map(w=>(
                  <div key={w.id} className="hover-lift"
                    style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 14px",background:"var(--bg-white)",border:`1px solid ${w.color||"var(--border)"}`,borderRadius:"var(--radius-lg)",cursor:"pointer"}}
                    onClick={()=>navigate("/wallets")}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:w.color||"var(--brand)",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:"13px",fontWeight:"600",color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.name}</p>
                      <p style={{fontSize:"11px",color:"var(--text-3)"}}>{({cash:"Tunai",bank:"Bank",ewallet:"E-Wallet",investment:"Investasi",other:"Lainnya"})[w.type]}</p>
                    </div>
                    <p className={balHidden?"balance-hidden":""} style={{fontSize:"13px",fontWeight:"700",color:w.color||"var(--brand)",fontFamily:"inherit",whiteSpace:"nowrap"}}>{fmt(w.balance)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recent transactions ──────────────────────── */}
          <div style={{marginBottom:"20px"}}>
            <div className="section-head">
              <h3 className="section-title">Transaksi Terakhir</h3>
              <button className="link-btn" onClick={()=>navigate("/transactions")}>Lihat Semua →</button>
            </div>
            {!summary?.recent_transactions?.length
              ? <EmptyState onAdd={()=>setShowModal(true)}/>
              : <div style={{background:"var(--bg-white)",border:"1px solid var(--border)",borderRadius:"var(--radius-xl)",overflow:"hidden"}}>
                  {summary.recent_transactions.map(t=><TrxRow key={t.id} t={t} hidden={balHidden}/>)}
                </div>
            }
          </div>

          {/* ── Compact Calendar ─────────────────────────── */}
          <BigCalendar transactions={summary?.recent_transactions} balHidden={balHidden}/>
        </>
      )}

      <TransactionModal open={showModal} onClose={()=>setShowModal(false)} onSuccess={()=>{setShowModal(false);loadSummary();loadChart();}}/>
    </DashboardLayout>
  );
}

function TrxRow({t,hidden}) {
  const C={income:"var(--green)",expense:"var(--red)",transfer:"var(--brand)"};
  const S={income:"+",expense:"−",transfer:"⇄"};
  const c=C[t.type],s=S[t.type];
  return (
    <div className="trx-row-hover" style={{display:"flex",alignItems:"center",gap:"10px",padding:"13px 16px",borderBottom:"1px solid var(--border)"}}>
      <div style={{width:32,height:32,borderRadius:"50%",border:`1px solid ${c}`,background:`${c}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"13px",fontWeight:"700",color:c}}>{s}</div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:"13px",fontWeight:"500",color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.note||t.category_name||(t.type==="transfer"?"Transfer":t.type)}</p>
        <p style={{fontSize:"11px",color:"var(--text-3)"}}>{t.wallet_name} · {new Date(t.transaction_date).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</p>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <p className={hidden?"balance-hidden":""} style={{fontSize:"14px",fontWeight:"700",color:c,fontFamily:"inherit"}}>{s}{fmt(t.amount)}</p>
        {Number(t.fee||0)>0 && <p style={{fontSize:"10px",color:"var(--amber)"}}>+fee {fmt(t.fee)}</p>}
      </div>
    </div>
  );
}

function EmptyState({onAdd}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"36px 20px",background:"var(--bg-white)",border:"1px solid var(--border)",borderRadius:"var(--radius-xl)"}}>
      <div style={{fontSize:"40px",marginBottom:"12px"}}>📊</div>
      <p style={{fontSize:"15px",fontWeight:"600",color:"var(--text)",marginBottom:"6px"}}>Belum ada transaksi</p>
      <p style={{fontSize:"13px",color:"var(--text-3)",marginBottom:"20px",textAlign:"center"}}>Mulai catat pemasukan atau pengeluaran pertamamu</p>
      <button className="btn-primary" onClick={onAdd} style={{padding:"9px 20px",fontSize:"13px"}}>+ Tambah Sekarang</button>
    </div>
  );
}

function SkeletonAll() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px"}}>
        {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:"80px"}}/>)}
      </div>
      <div className="skeleton" style={{height:"260px"}}/>
      <div className="skeleton" style={{height:"200px"}}/>
      <div className="skeleton" style={{height:"280px"}}/>
    </div>
  );
}
