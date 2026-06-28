import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { transactionApi } from "../../services/api";

const fmtRp = (n) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "-";

export default function Export() {
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`);
  const [endDate,   setEndDate]   = useState(now.toISOString().split("T")[0]);
  const [loading,   setLoading]   = useState(false);
  const [rows,      setRows]      = useState(null);
  const [error,     setError]     = useState("");

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const r = await transactionApi.getExport({ start_date: startDate, end_date: endDate });
      setRows(r.data.data || []);
    } catch { setError("Gagal memuat data."); }
    finally { setLoading(false); }
  };

  // ── Export CSV ────────────────────────────────────────────────
  const downloadCSV = () => {
    if (!rows?.length) return;
    const headers = ["Tanggal","Tipe","Nominal","Biaya","Catatan","Kategori","Wallet","Wallet Tujuan"];
    const csvRows = [
      headers.join(","),
      ...rows.map(r => [
        r.transaction_date,
        r.type,
        r.amount,
        r.fee || 0,
        `"${(r.note||"").replace(/"/g,'""')}"`,
        r.category || "",
        r.wallet || "",
        r.to_wallet || "",
      ].join(","))
    ];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `SpendWise_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Print / PDF ───────────────────────────────────────────────
  const printReport = () => {
    if (!rows?.length) return;
    const totalIncome  = rows.filter(r=>r.type==="income").reduce((s,r)=>s+Number(r.amount),0);
    const totalExpense = rows.filter(r=>r.type==="expense").reduce((s,r)=>s+Number(r.amount)+Number(r.fee||0),0);
    const html = `
      <html><head><title>Laporan SpendWise</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#111;}
        h1{font-size:22px;margin-bottom:4px;}
        .period{color:#666;font-size:14px;margin-bottom:20px;}
        .summary{display:flex;gap:24px;margin-bottom:20px;}
        .sum-box{padding:14px 20px;border-radius:8px;min-width:140px;}
        table{width:100%;border-collapse:collapse;font-size:13px;}
        th{background:#f4f4f4;padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;}
        td{padding:7px 12px;border-bottom:1px solid #eee;}
        .income{color:#16a34a;} .expense{color:#dc2626;} .transfer{color:#2563eb;}
        .footer{margin-top:24px;font-size:11px;color:#999;text-align:center;}
        @media print{button{display:none;}}
      </style></head><body>
      <h1>💰 Laporan Keuangan SpendWise</h1>
      <p class="period">Periode: ${fmtDate(startDate)} – ${fmtDate(endDate)}</p>
      <div class="summary">
        <div class="sum-box" style="background:#f0fdf4;border:1px solid #86efac;">
          <div style="font-size:12px;color:#666;">Total Pemasukan</div>
          <div style="font-size:18px;font-weight:700;color:#16a34a;">${fmtRp(totalIncome)}</div>
        </div>
        <div class="sum-box" style="background:#fef2f2;border:1px solid #fca5a5;">
          <div style="font-size:12px;color:#666;">Total Pengeluaran</div>
          <div style="font-size:18px;font-weight:700;color:#dc2626;">${fmtRp(totalExpense)}</div>
        </div>
        <div class="sum-box" style="background:#eff6ff;border:1px solid #93c5fd;">
          <div style="font-size:12px;color:#666;">Selisih</div>
          <div style="font-size:18px;font-weight:700;color:#2563eb;">${fmtRp(totalIncome-totalExpense)}</div>
        </div>
      </div>
      <table>
        <thead><tr>
          <th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Wallet</th><th>Catatan</th><th>Nominal</th>
        </tr></thead>
        <tbody>
          ${rows.map(r=>`<tr>
            <td>${fmtDate(r.transaction_date)}</td>
            <td class="${r.type}">${r.type==="income"?"Pemasukan":r.type==="expense"?"Pengeluaran":"Transfer"}</td>
            <td>${r.category||"-"}</td>
            <td>${r.wallet||"-"}${r.to_wallet?` → ${r.to_wallet}`:""}</td>
            <td>${r.note||"-"}</td>
            <td style="font-weight:600;" class="${r.type}">${fmtRp(Number(r.amount)+(Number(r.fee)||0))}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      <div class="footer">Digenerate oleh SpendWise • ${new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</div>
      </body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const income  = rows ? rows.filter(r=>r.type==="income").reduce((s,r)=>s+Number(r.amount),0) : 0;
  const expense = rows ? rows.filter(r=>r.type==="expense").reduce((s,r)=>s+Number(r.amount)+Number(r.fee||0),0) : 0;

  return (
    <DashboardLayout>
      <div style={s.page}>
        <div style={{ marginBottom:"24px" }}>
          <h1 style={s.title}>Export Laporan</h1>
          <p style={s.subtitle}>Download laporan keuangan kamu dalam format CSV atau PDF</p>
        </div>

        {/* Filter */}
        <div style={s.filterCard}>
          <div style={s.filterRow}>
            <div style={{ flex:1 }}>
              <label style={s.label}>Dari Tanggal</label>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={s.input}/>
            </div>
            <div style={{ flex:1 }}>
              <label style={s.label}>Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={s.input}/>
            </div>
            <div style={{ display:"flex", alignItems:"flex-end" }}>
              <button onClick={loadData} disabled={loading} style={s.btnPrimary}>
                {loading ? "Memuat..." : "🔍 Tampilkan"}
              </button>
            </div>
          </div>
        </div>

        {error && <div style={s.alert}>{error}</div>}

        {rows !== null && (
          <>
            {/* Summary */}
            <div style={s.summaryRow}>
              {[
                { label:"Total Transaksi", value:`${rows.length} transaksi`, color:"#00d4ff" },
                { label:"Total Pemasukan", value: fmtRp(income), color:"#00e5a0" },
                { label:"Total Pengeluaran", value: fmtRp(expense), color:"#ef4444" },
                { label:"Selisih", value: fmtRp(income-expense), color: income>=expense?"#00e5a0":"#ef4444" },
              ].map((item,i) => (
                <div key={i} style={s.sumCard}>
                  <p style={{ ...s.sumVal, color:item.color }}>{item.value}</p>
                  <p style={s.sumLabel}>{item.label}</p>
                </div>
              ))}
            </div>

            {/* Export buttons */}
            <div style={{ display:"flex", gap:"12px", marginBottom:"20px" }}>
              <button onClick={downloadCSV} disabled={!rows.length} style={s.btnExport}>
                📊 Download CSV (Excel)
              </button>
              <button onClick={printReport} disabled={!rows.length} style={{ ...s.btnExport, background:"rgba(239,68,68,.1)", borderColor:"rgba(239,68,68,.3)", color:"#ef4444" }}>
                🖨️ Cetak / Simpan PDF
              </button>
            </div>

            {/* Preview table */}
            {rows.length === 0 ? (
              <div style={s.empty}>Tidak ada transaksi di periode ini.</div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>{["Tanggal","Tipe","Kategori","Wallet","Catatan","Nominal"].map(h=>(
                      <th key={h} style={s.th}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.map((r,i) => (
                      <tr key={i} style={{ background: i%2===0?"transparent":"rgba(255,255,255,.02)" }}>
                        <td style={s.td}>{fmtDate(r.transaction_date)}</td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: r.type==="income"?"rgba(0,229,160,.15)":r.type==="expense"?"rgba(239,68,68,.15)":"rgba(0,212,255,.15)", color: r.type==="income"?"#00e5a0":r.type==="expense"?"#ef4444":"#00d4ff" }}>
                            {r.type==="income"?"Pemasukan":r.type==="expense"?"Pengeluaran":"Transfer"}
                          </span>
                        </td>
                        <td style={s.td}>{r.category||"-"}</td>
                        <td style={s.td}>{r.wallet||"-"}{r.to_wallet?` → ${r.to_wallet}`:""}</td>
                        <td style={s.td}>{r.note||"-"}</td>
                        <td style={{ ...s.td, fontWeight:600, color: r.type==="income"?"#00e5a0":r.type==="expense"?"#ef4444":"#00d4ff" }}>
                          {fmtRp(Number(r.amount)+(Number(r.fee)||0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

const s = {
  page:       { padding:"24px", maxWidth:"1000px" },
  title:      { fontSize:"24px", fontWeight:700, color:"var(--text)", margin:0 },
  subtitle:   { color:"var(--text-3)", fontSize:"14px", marginTop:"4px" },
  filterCard: { background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"12px", padding:"20px", marginBottom:"20px" },
  filterRow:  { display:"flex", gap:"14px", alignItems:"flex-end", flexWrap:"wrap" },
  label:      { display:"block", fontSize:"13px", color:"var(--text-3)", marginBottom:"6px" },
  input:      { width:"100%", padding:"10px 12px", background:"var(--bg-subtle)", border:"1px solid #334155", borderRadius:"8px", color:"var(--text)", fontSize:"14px", boxSizing:"border-box", outline:"none" },
  btnPrimary: { padding:"10px 20px", background:"var(--brand)", border:"none", borderRadius:"8px", color:"#000", cursor:"pointer", fontSize:"14px", fontWeight:700, whiteSpace:"nowrap" },
  summaryRow: { display:"flex", gap:"12px", marginBottom:"16px", flexWrap:"wrap" },
  sumCard:    { flex:1, minWidth:"140px", background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"10px", padding:"14px 16px" },
  sumVal:     { fontSize:"16px", fontWeight:700, margin:0 },
  sumLabel:   { fontSize:"12px", color:"var(--text-3)", margin:"4px 0 0" },
  btnExport:  { padding:"10px 20px", background:"rgba(0,229,160,.1)", border:"1px solid rgba(0,229,160,.3)", borderRadius:"8px", color:"#00e5a0", cursor:"pointer", fontSize:"14px", fontWeight:600 },
  alert:      { background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:"8px", padding:"12px 14px", marginBottom:"16px", color:"var(--red)", fontSize:"14px" },
  empty:      { textAlign:"center", padding:"40px", color:"var(--text-3)" },
  tableWrap:  { background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"12px", overflow:"auto" },
  table:      { width:"100%", borderCollapse:"collapse", minWidth:"600px" },
  th:         { padding:"12px 16px", textAlign:"left", fontSize:"13px", fontWeight:600, color:"var(--text-3)", borderBottom:"1px solid var(--border)", background:"rgba(255,255,255,.02)" },
  td:         { padding:"11px 16px", fontSize:"13px", color:"var(--text)", borderBottom:"1px solid #1e293b" },
  badge:      { padding:"3px 10px", borderRadius:"99px", fontSize:"12px", fontWeight:600 },
};
