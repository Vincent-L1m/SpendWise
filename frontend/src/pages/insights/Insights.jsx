import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { transactionApi, budgetApi, walletApi } from "../../services/api";

const fmtRp = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);

// ── Hitung skor kesehatan keuangan (0–100) ─────────────────────
const calcHealthScore = ({ income, expense, budgets, savingsRate }) => {
  let score = 100;
  const reasons = [];

  // Rasio pengeluaran vs pemasukan
  if (income > 0) {
    const ratio = expense / income;
    if (ratio > 1)      { score -= 40; reasons.push({ type:"bad",  text:`Pengeluaran melebihi pemasukan (${Math.round(ratio*100)}%)` }); }
    else if (ratio > 0.9){ score -= 25; reasons.push({ type:"warn", text:`Pengeluaran sangat tinggi (${Math.round(ratio*100)}% dari pemasukan)` }); }
    else if (ratio > 0.7){ score -= 15; reasons.push({ type:"warn", text:`Pengeluaran cukup tinggi (${Math.round(ratio*100)}% dari pemasukan)` }); }
    else                  { reasons.push({ type:"good", text:`Pengeluaran terkendali (${Math.round(ratio*100)}% dari pemasukan)` }); }
  } else {
    score -= 20; reasons.push({ type:"warn", text:"Tidak ada pemasukan bulan ini" });
  }

  // Budget overrun
  const overBudget = budgets.filter(b => b.percent >= 100).length;
  const nearBudget = budgets.filter(b => b.percent >= 80 && b.percent < 100).length;
  if (overBudget > 0) { score -= overBudget * 8; reasons.push({ type:"bad",  text:`${overBudget} kategori melewati budget` }); }
  if (nearBudget > 0) { score -= nearBudget * 3; reasons.push({ type:"warn", text:`${nearBudget} kategori mendekati batas budget` }); }
  if (overBudget === 0 && budgets.length > 0) reasons.push({ type:"good", text:"Semua kategori masih dalam budget" });

  // Tabungan
  if (savingsRate >= 20)      reasons.push({ type:"good", text:`Tingkat tabungan bagus (${Math.round(savingsRate)}%)` });
  else if (savingsRate >= 10) { score -= 5;  reasons.push({ type:"warn", text:`Tabungan bisa ditingkatkan (${Math.round(savingsRate)}%)` }); }
  else if (savingsRate > 0)   { score -= 10; reasons.push({ type:"bad",  text:`Tabungan sangat rendah (${Math.round(savingsRate)}%)` }); }
  else                        { score -= 15; reasons.push({ type:"bad",  text:"Tidak ada tabungan bulan ini" }); }

  return { score: Math.max(0, Math.min(100, score)), reasons };
};

// ── Generate AI tips berdasarkan data ─────────────────────────
const generateTips = ({ income, expense, budgets, topCategory }) => {
  const tips = [];
  if (income > 0 && expense / income > 0.8)
    tips.push({ icon:"💡", text:"Coba terapkan aturan 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan." });
  if (topCategory)
    tips.push({ icon:"🎯", text:`Pengeluaran terbesar kamu bulan ini adalah <strong>${topCategory}</strong>. Coba evaluasi apakah bisa dikurangi.` });
  if (expense > income)
    tips.push({ icon:"🚨", text:"Pengeluaran melebihi pemasukan! Pertimbangkan untuk mengurangi pengeluaran tidak perlu." });
  tips.push({ icon:"📊", text:"Rutin pantau keuangan setiap minggu agar bisa deteksi masalah lebih awal." });
  if (budgets.length === 0)
    tips.push({ icon:"📋", text:"Buat anggaran (budget) per kategori agar pengeluaran lebih terkontrol." });
  const saved = income - expense;
  if (saved > 0)
    tips.push({ icon:"💰", text:`Bulan ini kamu berhasil menyisihkan <strong>${fmtRp(saved)}</strong>. Pertimbangkan investasi jangka panjang.` });
  return tips;
};

export default function Insights() {
  const now    = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [summary, budgets, wallets] = await Promise.all([
        transactionApi.getSummary({ month, year }),
        budgetApi.getAll({ month, year }),
        walletApi.getAll(),
      ]);
      const s  = summary.data.data || {};
      const b  = budgets.data.data || [];
      const w  = wallets.data.data || {};
      const income  = Number(s.total_income  || 0);
      const expense = Number(s.total_expense || 0);
      const saved   = income - expense;
      const savingsRate = income > 0 ? (saved / income) * 100 : 0;
      const topCat  = (s.expense_by_category || [])[0]?.name || null;
      const health  = calcHealthScore({ income, expense, budgets: b, savingsRate });
      const tips    = generateTips({ income, expense, budgets: b, topCategory: topCat });
      setData({ income, expense, saved, savingsRate, budgets: b, health, tips, totalBalance: Number(w.total_balance||0), topCat });
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year]);

  const MONTHS = ["","Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const scoreColor = (s) => s >= 80 ? "#00e5a0" : s >= 60 ? "#f59e0b" : "#ef4444";
  const scoreLabel = (s) => s >= 80 ? "Sangat Sehat 🎉" : s >= 60 ? "Cukup Baik 👍" : s >= 40 ? "Perlu Perhatian ⚠️" : "Kritis 🚨";

  return (
    <DashboardLayout>
      <div style={s.page}>
        {/* Header */}
        <div style={s.topBar}>
          <div>
            <h1 style={s.title}>Analisis Keuangan</h1>
            <p style={s.subtitle}>Skor kesehatan dan rekomendasi AI</p>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <select value={month} onChange={e=>setMonth(Number(e.target.value))} style={s.select}>
              {MONTHS.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e=>setYear(Number(e.target.value))} style={s.select}>
              {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {loading ? <p style={{ color:"var(--text-3)", textAlign:"center", marginTop:"60px" }}>Menganalisis keuangan kamu...</p>
        : !data ? <p style={{ color:"var(--text-3)", textAlign:"center", marginTop:"60px" }}>Gagal memuat data.</p>
        : (
          <div style={s.grid}>
            {/* Skor Kesehatan */}
            <div style={s.scoreCard}>
              <h2 style={s.cardTitle}>🏥 Skor Kesehatan Keuangan</h2>
              <div style={s.scoreRing}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="65" fill="none" stroke="var(--bg-subtle)" strokeWidth="14"/>
                  <circle cx="80" cy="80" r="65" fill="none"
                    stroke={scoreColor(data.health.score)} strokeWidth="14"
                    strokeDasharray={`${(data.health.score/100)*408.4} 408.4`}
                    strokeLinecap="round" transform="rotate(-90 80 80)"
                    style={{ transition:"stroke-dasharray 1s ease" }}/>
                </svg>
                <div style={s.scoreCenter}>
                  <span style={{ ...s.scoreNum, color: scoreColor(data.health.score) }}>{data.health.score}</span>
                  <span style={s.scoreMax}>/100</span>
                </div>
              </div>
              <p style={{ textAlign:"center", fontSize:"16px", fontWeight:700, color: scoreColor(data.health.score), marginBottom:"20px" }}>
                {scoreLabel(data.health.score)}
              </p>
              <div style={s.reasonList}>
                {data.health.reasons.map((r, i) => (
                  <div key={i} style={{ ...s.reasonItem, borderLeft:`3px solid ${r.type==="good"?"#00e5a0":r.type==="warn"?"#f59e0b":"#ef4444"}` }}>
                    <span style={{ marginRight:"8px" }}>{r.type==="good"?"✅":r.type==="warn"?"⚠️":"❌"}</span>
                    <span style={{ fontSize:"13px", color:"var(--text-3)" }}>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ringkasan Bulan */}
            <div style={s.summaryCard}>
              <h2 style={s.cardTitle}>📊 Ringkasan {MONTHS[month]} {year}</h2>
              <div style={s.statList}>
                {[
                  { label:"Pemasukan", value: fmtRp(data.income), color:"#00e5a0" },
                  { label:"Pengeluaran", value: fmtRp(data.expense), color:"#ef4444" },
                  { label:"Selisih", value: fmtRp(Math.abs(data.saved)), color: data.saved >= 0 ? "#00e5a0" : "#ef4444", prefix: data.saved >= 0 ? "+" : "-" },
                  { label:"Tingkat Tabungan", value: `${Math.round(Math.max(0,data.savingsRate))}%`, color:"#00d4ff" },
                  { label:"Total Saldo", value: fmtRp(data.totalBalance), color:"#f59e0b" },
                ].map((item,i) => (
                  <div key={i} style={s.statRow}>
                    <span style={{ fontSize:"14px", color:"var(--text-3)" }}>{item.label}</span>
                    <span style={{ fontSize:"15px", fontWeight:700, color:item.color }}>{item.prefix||""}{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Spending ratio bar */}
              {data.income > 0 && (
                <div style={{ marginTop:"20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                    <span style={{ fontSize:"12px", color:"var(--text-3)" }}>Rasio Pengeluaran</span>
                    <span style={{ fontSize:"12px", fontWeight:600, color: data.expense/data.income > 0.8 ? "#ef4444" : "#00e5a0" }}>
                      {Math.round((data.expense/data.income)*100)}%
                    </span>
                  </div>
                  <div style={{ background:"var(--bg-subtle)", borderRadius:"99px", height:"8px" }}>
                    <div style={{ background: data.expense/data.income > 0.8 ? "#ef4444" : "#00e5a0", width:`${Math.min((data.expense/data.income)*100,100)}%`, height:"8px", borderRadius:"99px", transition:"width .8s" }}/>
                  </div>
                </div>
              )}
            </div>

            {/* AI Tips */}
            <div style={{ ...s.tipsCard, gridColumn:"1/-1" }}>
              <h2 style={s.cardTitle}>🤖 Rekomendasi AI untuk Kamu</h2>
              <div style={s.tipsList}>
                {data.tips.map((tip, i) => (
                  <div key={i} style={s.tipItem}>
                    <span style={s.tipIcon}>{tip.icon}</span>
                    <p style={s.tipText} dangerouslySetInnerHTML={{ __html: tip.text }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Status */}
            {data.budgets.length > 0 && (
              <div style={{ ...s.budgetCard, gridColumn:"1/-1" }}>
                <h2 style={s.cardTitle}>🎯 Status Budget Bulan Ini</h2>
                <div style={s.budgetList}>
                  {data.budgets.map(b => (
                    <div key={b.id} style={s.budgetRow}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                        <span style={{ fontSize:"14px", color:"var(--text)" }}>{b.category_name}</span>
                        <span style={{ fontSize:"13px", color: b.percent>=100?"#ef4444":b.percent>=80?"#f59e0b":"#00e5a0", fontWeight:600 }}>
                          {b.percent}% • {fmtRp(b.spent)} / {fmtRp(b.amount)}
                        </span>
                      </div>
                      <div style={{ background:"var(--bg-subtle)", borderRadius:"99px", height:"6px" }}>
                        <div style={{ background: b.percent>=100?"#ef4444":b.percent>=80?"#f59e0b":"#00e5a0", width:`${Math.min(b.percent,100)}%`, height:"6px", borderRadius:"99px" }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const s = {
  page: { padding:"24px", maxWidth:"1000px" },
  topBar: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", flexWrap:"wrap", gap:"12px" },
  title: { fontSize:"24px", fontWeight:700, color:"var(--text)", margin:0 },
  subtitle: { color:"var(--text-3)", fontSize:"14px", marginTop:"4px" },
  select: { padding:"8px 12px", background:"var(--bg-subtle)", border:"1px solid #334155", borderRadius:"8px", color:"var(--text)", fontSize:"14px", cursor:"pointer" },
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"16px" },
  scoreCard: { background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"12px", padding:"24px" },
  summaryCard: { background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"12px", padding:"24px" },
  tipsCard: { background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"12px", padding:"24px" },
  budgetCard: { background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"12px", padding:"24px" },
  cardTitle: { fontSize:"16px", fontWeight:700, color:"var(--text)", margin:"0 0 20px" },
  scoreRing: { position:"relative", width:"160px", height:"160px", margin:"0 auto 16px" },
  scoreCenter: { position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" },
  scoreNum: { fontSize:"40px", fontWeight:800, lineHeight:1 },
  scoreMax: { fontSize:"14px", color:"var(--text-3)" },
  reasonList: { display:"flex", flexDirection:"column", gap:"8px" },
  reasonItem: { display:"flex", alignItems:"center", padding:"8px 12px", background:"var(--bg)", borderRadius:"6px" },
  statList: { display:"flex", flexDirection:"column", gap:"12px" },
  statRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #1e293b" },
  tipsList: { display:"flex", flexDirection:"column", gap:"12px" },
  tipItem: { display:"flex", gap:"12px", alignItems:"flex-start", padding:"14px", background:"var(--bg)", borderRadius:"8px" },
  tipIcon: { fontSize:"20px", flexShrink:0 },
  tipText: { margin:0, fontSize:"14px", color:"var(--text-3)", lineHeight:1.6 },
  budgetList: { display:"flex", flexDirection:"column", gap:"14px" },
  budgetRow: {},
};
