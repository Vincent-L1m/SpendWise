import ThemePanel from "../../components/ThemePanel";
import Logo from "../../components/Logo";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* ── Animated counter ─────────────────────────────────────────── */
function CountUp({ target, prefix = "", suffix = "", duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(ease * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}{val.toLocaleString("id-ID")}{suffix}
    </span>
  );
}

/* ── Slide hero carousel ──────────────────────────────────────── */
const SLIDES = [
  {
    headline: "Kelola Keuangan\nLebih Cerdas",
    sub: "Catat setiap pemasukan dan pengeluaran, pantau anggaran, dan raih target tabungan kamu.",
    accent: "#1B4FD8",
    bg: "linear-gradient(135deg,#EBF0FF 0%,#F5F7FF 100%)",
    icon: "💰",
    stat: { label: "Transaksi tercatat", val: 12000, suffix: "+" },
  },
  {
    headline: "Pantau Budget\nSetiap Saat",
    sub: "Buat anggaran per kategori dan terima notifikasi email otomatis sebelum limit terlampaui.",
    accent: "#12A05C",
    bg: "linear-gradient(135deg,#EDFAF3 0%,#F5FFFB 100%)",
    icon: "🎯",
    stat: { label: "Budget dikelola", val: 3500, suffix: "+" },
  },
  {
    headline: "Multi Wallet\nSatu Tempat",
    sub: "Simpan semua rekening, dompet digital, dan investasi kamu dalam satu dashboard yang rapi.",
    accent: "#7C3AED",
    bg: "linear-gradient(135deg,#F5F3FF 0%,#FAF8FF 100%)",
    icon: "👛",
    stat: { label: "Wallet dikelola", val: 8200, suffix: "+" },
  },
  {
    headline: "Analisis AI\nKeuangan Kamu",
    sub: "Dapatkan skor kesehatan keuangan dan rekomendasi cerdas berdasarkan pola pengeluaran kamu.",
    accent: "#B45309",
    bg: "linear-gradient(135deg,#FFFBEB 0%,#FEFCE8 100%)",
    icon: "🤖",
    stat: { label: "Analisis dijalankan", val: 5600, suffix: "+" },
  },
];

function HeroSlider() {
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = (next) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setIdx(next); setAnimating(false); }, 350);
  };

  useEffect(() => {
    const t = setInterval(() => go((idx + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [idx]);

  const s = SLIDES[idx];

  return (
    <div style={{ position: "relative", background: s.bg, borderRadius: 24, padding: "48px 40px", overflow: "hidden", transition: "background 0.6s ease", minHeight: 420, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: s.accent + "15", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", bottom: -20, left: -20, width: 140, height: 140, borderRadius: "50%", background: s.accent + "10", pointerEvents: "none" }}/>

      <div style={{ opacity: animating ? 0 : 1, transition: "opacity 0.35s ease", position: "relative" }}>
        {/* Big icon */}
        <div style={{ fontSize: 64, marginBottom: 20, animation: "float 4s ease-in-out infinite" }}>{s.icon}</div>

        <h1 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, color: "#101828", lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.5px", whiteSpace: "pre-line" }}>
          {s.headline}
        </h1>
        <p style={{ fontSize: 16, color: "#344054", lineHeight: 1.7, maxWidth: 480, marginBottom: 32 }}>{s.sub}</p>

        {/* Stat chip */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#ffffff", border: `1px solid ${s.accent}30`, borderRadius: 99, padding: "10px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.accent, animation: "pulse-soft 2s ease infinite" }}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#344054" }}>{s.stat.label}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: s.accent }}>{s.stat.suffix === "+" ? <><CountUp target={s.stat.val}/>{s.stat.suffix}</> : s.stat.val}</span>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 8, marginTop: 32 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            style={{ width: i === idx ? 28 : 8, height: 8, borderRadius: 99, border: "none", cursor: "pointer", transition: "all 0.35s", background: i === idx ? s.accent : s.accent + "30" }}/>
        ))}
      </div>
    </div>
  );
}

/* ── Feature card ─────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, color }) {
  return (
    <div className="landing-card" style={{ background: "var(--bg-white)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px", transition: "box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,24,40,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>
        {icon}
      </div>
      <h3 className="landing-text" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{title}</h3>
      <p className="landing-text-3" style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

/* ── Step ─────────────────────────────────────────────────────── */
function Step({ num, title, desc }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1B4FD8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
        {num}
      </div>
      <div>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{title}</h4>
        <p className="landing-text-3" style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Testimonial ──────────────────────────────────────────────── */
function TestimonialCard({ name, role, text, avatar }) {
  return (
    <div className="landing-card" style={{ background: "var(--bg-white)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {[1,2,3,4,5].map(i => <span key={i} style={{ color: "var(--amber)", fontSize: 16 }}>★</span>)}
      </div>
      <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>"{text}"</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#1B4FD8" }}>{avatar}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{name}</div>
          <div style={{ fontSize: 12, color: "var(--text-4)" }}>{role}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Landing ─────────────────────────────────────────────── */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navStyle = {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    background: scrolled ? "var(--bg-white)" : "transparent",
    backdropFilter: scrolled ? "blur(12px)" : "none",
    borderBottom: scrolled ? "1px solid var(--border)" : "none",
    transition: "all 0.3s",
    padding: "0 24px",
  };

  return (
    <div className="landing-bg" style={{ background: "var(--bg)", fontFamily: "'Inter',-apple-system,sans-serif", color: "var(--text)" }}>
      {/* ── Navbar ── */}
      <nav style={navStyle}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Logo height={38} />
          </Link>

          {/* Desktop nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="desktop-only">
            {[["#features","Fitur"],["#cara-kerja","Cara Kerja"],["#testimoni","Testimoni"]].map(([href,label]) => (
              <a key={href} href={href} className="landing-nav-link">{label}</a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link to="/login" style={{ padding: "8px 16px", border: "1px solid var(--border-2)", borderRadius: 8, color: "var(--text-2)", fontSize: 14, fontWeight: 600, textDecoration: "none", background: "var(--bg-white)", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--brand)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-2)"}>
              Masuk
            </Link>
            <Link to="/register" style={{ padding: "8px 16px", background: "#1B4FD8", border: "1px solid #1B4FD8", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#1540B0"}
              onMouseLeave={e => e.currentTarget.style.background = "#1B4FD8"}>
              Daftar Gratis
            </Link>
            <ThemePanel position="inline" align="right" dark={false} />
            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }} className="mobile-menu-btn">
              ☰
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: "var(--bg-white)", borderBottom: "1px solid var(--border)", padding: "12px 24px 16px", color: "var(--text)" }}>
            {[["#features","Fitur"],["#cara-kerja","Cara Kerja"],["#testimoni","Testimoni"]].map(([href,label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 0", color: "var(--text-2)", fontSize: 14, fontWeight: 500, textDecoration: "none", borderBottom: "1px solid var(--border)" }}>{label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="landing-bg landing-hero-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        {/* Left */}
        <div>
          <div className="hero-animate-1" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--brand-light)", border: "1px solid #C7D7FD", borderRadius: 99, padding: "6px 14px", marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1B4FD8", animation: "pulse-soft 2s ease infinite" }}/>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1B4FD8" }}>Aplikasi keuangan gratis untuk semua</span>
          </div>

          <h1 className="hero-animate-2" style={{ fontSize: "clamp(26px,4.5vw,52px)", fontWeight: 800, color: "var(--text)", lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 20 }}>
            Kendali Penuh<br/>
            <span style={{ color: "#1B4FD8" }}>Keuangan Kamu</span><br/>
            di Satu Tempat
          </h1>

          <p className="hero-animate-3" style={{ fontSize: 17, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
            SpendWise membantu kamu mencatat transaksi, mengatur anggaran, memantau tabungan, dan mendapatkan analisis keuangan yang cerdas — semuanya gratis.
          </p>

          <div className="hero-animate-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40, flexDirection: "row" }}>
            <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#1B4FD8", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "background 0.15s, transform 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background="#1540B0"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#1B4FD8"; e.currentTarget.style.transform="none"; }}>
              Mulai Gratis →
            </Link>
            <a href="#cara-kerja" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", background: "var(--bg-white)", border: "1px solid var(--border-2)", borderRadius: 10, color: "var(--text-2)", fontSize: 15, fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor="var(--brand)"}
              onMouseLeave={e => e.currentTarget.style.borderColor="var(--border-2)"}>
              ▶ Lihat Cara Kerja
            </a>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex" }}>
              {["A","B","C","D","E"].map((l,i) => (
                <div key={l} style={{ width: 32, height: 32, borderRadius: "50%", background: ["#1B4FD8","#12A05C","#7C3AED","#B45309","#D92D20"][i], border: "2px solid #fff", marginLeft: i===0?0:-8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", gap: 2 }}>
                {[1,2,3,4,5].map(i => <span key={i} style={{ color: "var(--amber)", fontSize: 14 }}>★</span>)}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>Dipercaya <strong style={{ color: "var(--text)" }}>10.000+</strong> pengguna</p>
            </div>
          </div>
        </div>

        {/* Right — slider */}
        <div style={{ animation: "slideInRight 0.8s ease both" }}>
          <HeroSlider/>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ background: "#1B4FD8", padding: "28px 24px" }}>
        <div className="landing-stats-grid" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, textAlign: "center" }}>
          {[
            { val: 10000, suffix: "+", label: "Pengguna Aktif" },
            { val: 500000, suffix: "+", label: "Transaksi Dicatat" },
            { val: 98, suffix: "%",  label: "Kepuasan Pengguna" },
            { val: 0, suffix: " Rupiah", label: "Biaya Berlangganan" },
          ].map((item, i) => (
            <div key={i} style={{ color: "#fff", animation: `countUp 0.6s ease ${i*0.1}s both` }}>
              <div style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, letterSpacing: "-0.5px" }}>
                {item.val === 0 ? "Gratis" : <CountUp target={item.val} suffix={item.suffix}/>}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="landing-bg" style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "#1B4FD8", background: "var(--brand-light)", padding: "5px 14px", borderRadius: 99, marginBottom: 14, letterSpacing: "0.5px", textTransform: "uppercase" }}>Fitur Unggulan</div>
          <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px", marginBottom: 12 }}>Semua yang kamu butuhkan</h2>
          <p style={{ fontSize: 16, color: "var(--text-3)", maxWidth: 480, margin: "0 auto" }}>Dari pencatatan sederhana hingga analisis keuangan mendalam — semua tersedia.</p>
        </div>
        <div className="landing-testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {[
            { icon:"💸", color:"var(--brand)", title:"Catat Transaksi", desc:"Rekam setiap pemasukan dan pengeluaran dengan cepat. Lengkap dengan kategori, catatan, dan lampiran struk." },
            { icon:"👛", color:"#7C3AED", title:"Multi Wallet", desc:"Kelola semua rekening bank, dompet digital, dan kas tunai dalam satu dashboard terpadu." },
            { icon:"🎯", color:"var(--green)", title:"Anggaran Cerdas", desc:"Buat batas pengeluaran per kategori dan terima notifikasi email otomatis saat mendekati limit." },
            { icon:"🏦", color:"var(--amber)", title:"Target Tabungan", desc:"Tetapkan tujuan keuangan dan pantau progress tabungan kamu setiap saat." },
            { icon:"🤖", color:"var(--red)", title:"Analisis AI", desc:"Dapatkan skor kesehatan keuangan dan rekomendasi personal berdasarkan pola keuangan kamu." },
            { icon:"🧾", color:"#0891B2", title:"Split Bill", desc:"Hitung patungan dengan mudah. Catat siapa yang sudah bayar dan berapa yang masih harus dibayar." },
            { icon:"📊", color:"#6D28D9", title:"Laporan Visual", desc:"Grafik bulanan dan tahunan yang membantu kamu memahami tren keuangan secara visual." },
            { icon:"📥", color:"#047857", title:"Export Data", desc:"Unduh laporan keuangan dalam format CSV untuk Excel atau cetak langsung sebagai PDF." },
          ].map(f => <FeatureCard key={f.title} {...f}/>)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="cara-kerja" className="landing-section-white" style={{ background: "var(--bg-white)", padding: "72px 24px" }}>
        <div className="landing-hw-grid" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "#1B4FD8", background: "var(--brand-light)", padding: "5px 14px", borderRadius: 99, marginBottom: 14, letterSpacing: "0.5px", textTransform: "uppercase" }}>Cara Kerja</div>
            <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px", marginBottom: 12 }}>Mulai dalam 3 langkah mudah</h2>
            <p style={{ fontSize: 16, color: "var(--text-3)", marginBottom: 36, lineHeight: 1.7 }}>Tidak perlu pengalaman akuntansi. SpendWise dirancang untuk semua orang.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <Step num="1" title="Buat akun gratis" desc="Daftar hanya dengan email. Verifikasi OTP dikirim langsung ke inbox kamu dalam hitungan detik."/>
              <Step num="2" title="Tambah wallet & kategori" desc="Hubungkan semua rekening dan dompet digital kamu. Pilih kategori sesuai kebutuhan."/>
              <Step num="3" title="Catat & analisis" desc="Mulai catat transaksi harian dan biarkan SpendWise menganalisis keuangan kamu secara otomatis."/>
            </div>
            <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 36, padding: "13px 24px", background: "#1B4FD8", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
              Coba Sekarang →
            </Link>
          </div>

          {/* Visual mockup */}
          <div style={{ background: "linear-gradient(135deg,#EBF0FF,#F5F7FF)", borderRadius: 24, padding: 32, position: "relative", overflow: "hidden", colorScheme: "light" }}>
            {/* Fake dashboard preview */}
            <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, boxShadow: "0 8px 32px rgba(16,24,40,0.12)", animation: "float 5s ease-in-out infinite" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#101828" }}>Ringkasan Bulan Ini</span>
                <span style={{ fontSize: 11, color: "#98A2B3" }}>Juni 2026</span>
              </div>
              {[
                { label:"Total Saldo",     val:"Rp 12.450.000", color:"#101828", size:20 },
                { label:"Pemasukan",       val:"Rp 8.000.000",  color:"var(--green)", size:14 },
                { label:"Pengeluaran",     val:"Rp 4.230.000",  color:"var(--red)", size:14 },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #E4E7EC" }}>
                  <span style={{ fontSize: 13, color: "#667085" }}>{r.label}</span>
                  <span style={{ fontSize: r.size, fontWeight: 700, color: r.color }}>{r.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: "#98A2B3", marginBottom: 6 }}>Pengeluaran bulan ini</div>
                <div style={{ background: "#F0F2F5", borderRadius: 99, height: 8 }}>
                  <div style={{ background: "#1B4FD8", width: "53%", height: 8, borderRadius: 99 }}/>
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>53% dari anggaran</div>
              </div>
            </div>

            {/* Floating notification */}
            <div style={{ position: "absolute", bottom: 24, right: 24, background: "#ffffff", border: "1px solid #E4E7EC", borderRadius: 12, padding: "10px 14px", boxShadow: "0 4px 16px rgba(16,24,40,0.1)", animation: "floatSlow 6s ease-in-out infinite", maxWidth: 200 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>🔔</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#101828" }}>Budget Makan</div>
                  <div style={{ fontSize: 10, color: "#D92D20" }}>80% terpakai</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimoni" className="landing-bg" style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "#1B4FD8", background: "var(--brand-light)", padding: "5px 14px", borderRadius: 99, marginBottom: 14, letterSpacing: "0.5px", textTransform: "uppercase" }}>Testimoni</div>
          <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px", marginBottom: 12 }}>Apa kata pengguna kami</h2>
          <p style={{ fontSize: 16, color: "var(--text-3)" }}>Ribuan orang sudah mempercayakan keuangan mereka ke SpendWise.</p>
        </div>
        <div className="landing-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          <TestimonialCard name="Andi Pratama" role="Mahasiswa, Medan" avatar="A"
            text="Sebelumnya sering nggak tahu ke mana uang bulanan habis. Sekarang dengan SpendWise semua jelas dan bisa atur budget dengan lebih baik."/>
          <TestimonialCard name="Sari Dewi" role="Guru, Surabaya" avatar="S"
            text="Fitur notifikasi budget-nya sangat membantu. Setiap mau over budget langsung dapat email peringatan. Sangat berguna untuk mengontrol pengeluaran."/>
          <TestimonialCard name="Budi Santoso" role="Wirausaha, Jakarta" avatar="B"
            text="Multi wallet-nya keren! Bisa pantau semua rekening dan dompet digital dalam satu tempat. Laporan bulanannya juga detail dan mudah dipahami."/>
          <TestimonialCard name="Rini Fitriani" role="Ibu Rumah Tangga, Bandung" avatar="R"
            text="Sangat mudah digunakan bahkan buat yang tidak melek teknologi seperti saya. Fitur split bill-nya juga sering saya pakai untuk arisan."/>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ background: "linear-gradient(135deg,#1B4FD8,#1540B0)", padding: "64px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: 14 }}>
          Mulai kelola keuangan kamu sekarang
        </h2>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          Gratis selamanya. Tidak perlu kartu kredit. Daftar dalam 60 detik.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/register" style={{ padding: "14px 32px", background: "var(--bg-white)", border: "none", borderRadius: 10, color: "#1B4FD8", fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "opacity 0.15s" }}>
            Daftar Gratis Sekarang
          </Link>
          <Link to="/login" style={{ padding: "14px 24px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
            Sudah punya akun? Masuk
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0D1117", padding: "40px 24px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ marginBottom: 12 }}>
                <Logo height={32} style={{ filter:"brightness(0) invert(1)", opacity:0.9 }} />
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", maxWidth: 260, lineHeight: 1.7 }}>Aplikasi manajemen keuangan pribadi yang membantu kamu hidup lebih bijak secara finansial.</p>
            </div>
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>Produk</div>
                {["Fitur","Cara Kerja","Harga"].map(l => (
                  <div key={l} style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 8, cursor: "pointer" }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>Akun</div>
                {[["Daftar","/register"],["Masuk","/login"]].map(([l,to]) => (
                  <div key={l} style={{ marginBottom: 8 }}><Link to={to} style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>{l}</Link></div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1F2937", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>© 2026 SpendWise. Dibuat dengan ❤️ untuk Indonesia.</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Gratis · Aman · Terpercaya</p>
          </div>
        </div>
      </footer>


      {/* Landing dark mode styles */}
      <style>{`
        /* ── Sections that FOLLOW dark mode ── */
        [data-theme="dark"] .landing-bg {
          background: var(--bg) !important;
          color: var(--text);
        }
        [data-theme="dark"] .landing-section-white {
          background: var(--bg-white) !important;
          color: var(--text);
        }
        /* Feature & testimonial cards */
        [data-theme="dark"] .landing-card {
          background: var(--bg-white) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
        }
        [data-theme="dark"] .landing-card h3,
        [data-theme="dark"] .landing-card h4 { color: var(--text) !important; }
        [data-theme="dark"] .landing-card p   { color: var(--text-3) !important; }
        /* Headings & text in bg sections */
        [data-theme="dark"] .landing-bg h2,
        [data-theme="dark"] .landing-section-white h2,
        [data-theme="dark"] .landing-bg h3 { color: var(--text); }
        [data-theme="dark"] .landing-bg p,
        [data-theme="dark"] .landing-section-white p { color: var(--text-3); }
        /* Step component text */
        [data-theme="dark"] .landing-section-white h4 { color: var(--text); }
        /* Navbar */
        [data-theme="dark"] .landing-nav-link { color: var(--text-2) !important; }
        [data-theme="dark"] .landing-nav-link:hover { color: var(--brand) !important; }
        /* Navbar bg when scrolled */
        [data-theme="dark"] nav[style*="rgba(255,255"] {
          background: rgba(10,12,20,0.97) !important;
          border-bottom-color: var(--border) !important;
        }
        /* Mobile menu */
        [data-theme="dark"] nav div[style*="var(--bg-white)"] {
          background: var(--bg-white) !important;
        }

        /* ── Elements that DON'T change in dark mode ── */
        /* Hero slider: always stays light (has its own gradient bg) */
        [data-theme="dark"] #hero-slider-wrap { color-scheme: light; }

        /* Cara Kerja mockup: always light */
        [data-theme="dark"] #cara-kerja-mockup { color-scheme: light; }

        /* Stats bar: always blue bg, always white text — no change needed */
        /* CTA banner: always blue bg, always white text — no change needed */

        /* Footer: always dark bg */
        [data-theme="dark"] footer { background: #0D1117 !important; }
      `}</style>
      {/* Responsive */}
      <style>{`
        /* Landing nav */
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        /* Hero grid */
        .landing-hero-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 900px) {
          .landing-hero-grid { grid-template-columns: 1fr !important; }
          .landing-hero-grid > div:last-child { display: none; }
        }
        /* How it works */
        .landing-hw-grid { grid-template-columns: 1fr 1fr; gap: 64px; }
        @media (max-width: 900px) {
          .landing-hw-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .landing-hw-grid > div:last-child { display: none; }
        }
        /* Stats bar */
        .landing-stats-grid { grid-template-columns: repeat(4,1fr); }
        @media (max-width: 640px) {
          .landing-stats-grid { grid-template-columns: repeat(2,1fr) !important; gap: 16px !important; }
        }
        /* Features */
        .landing-features-grid { grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); }
        @media (max-width: 480px) {
          .landing-features-grid { grid-template-columns: 1fr !important; }
        }
        /* Testimonials */
        .landing-testimonials-grid { grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); }
        @media (max-width: 640px) {
          .landing-testimonials-grid { grid-template-columns: 1fr !important; }
        }
        /* Hero padding */
        @media (max-width: 768px) {
          .landing-hero-grid { padding: 80px 20px 40px !important; }
        }
        @media (max-width: 480px) {
          .landing-hero-grid { padding: 70px 16px 32px !important; }
        }
        /* Section padding */
        @media (max-width: 768px) {
          section { padding-left: 16px !important; padding-right: 16px !important; }
        }
        /* Footer grid */
        @media (max-width: 640px) {
          .landing-footer-grid { flex-direction: column !important; }
        }
        /* CTA buttons */
        @media (max-width: 480px) {
          .landing-cta-btns { flex-direction: column !important; }
          .landing-cta-btns a { width: 100%; text-align: center; justify-content: center; }
        }
        /* Text clamp */
        @media (max-width: 480px) {
          h1 { font-size: clamp(24px,8vw,40px) !important; }
          h2 { font-size: clamp(20px,6vw,32px) !important; }
        }
      `}</style>
    </div>
  );
}
