import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemePanel from "../../components/ThemePanel";
import Logo from "../../components/Logo";
import { authApi } from "../../services/api";

function OtpBoxes({ value, onChange }) {
  const vals = (value + "      ").slice(0, 6).split("");
  const handle = (e, i) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = (value + "      ").slice(0, 6).split("");
    arr[i] = v || " ";
    onChange(arr.join("").trimEnd());
    if (v && i < 5) document.getElementById(`otpr${i+1}`)?.focus();
    if (e.key === "Backspace" && !value[i] && i > 0) document.getElementById(`otpr${i-1}`)?.focus();
  };
  const paste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    onChange(p); e.preventDefault();
    document.getElementById(`otpr${Math.min(p.length,5)}`)?.focus();
  };
  return (
    <div style={{ display:"flex", gap:10, justifyContent:"center", margin:"20px 0" }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} id={`otpr${i}`} type="text" inputMode="numeric" maxLength={1}
          value={vals[i].trim()}
          onChange={e=>handle(e,i)} onKeyDown={e=>e.key==="Backspace"&&handle(e,i)} onPaste={paste}
          style={{ width:48, height:56, textAlign:"center", fontSize:24, fontWeight:700, background:"#fff", border:`2px solid ${vals[i].trim()?"#1B4FD8":"var(--border-2)"}`, borderRadius:10, color:"var(--text)", outline:"none", transition:"border-color .15s" }}/>
      ))}
    </div>
  );
}

/* ── Left panel for Register ── */
function LeftPanelRegister() {
  const perks = [
    { icon:"🔒", title:"Aman & Terenkripsi", desc:"Data kamu dilindungi dengan enkripsi tingkat tinggi" },
    { icon:"🌐", title:"Akses di Mana Saja", desc:"Buka dari browser, kapan saja dan di mana saja" },
    { icon:"🎯", title:"Analisis Otomatis", desc:"Laporan dan skor kesehatan keuangan dihasilkan otomatis" },
    { icon:"💬", title:"Gratis Selamanya", desc:"Tidak ada biaya tersembunyi, tidak perlu kartu kredit" },
  ];

  return (
    <div className="auth-split-left">
      <div style={{ position:"absolute", top:-80, left:-80, width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:-40, right:-40, width:240, height:240, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }}/>

      {/* Logo */}
      <div style={{ position:"absolute", top:28, left:36 }}>
        <Logo height={36} style={{ filter:"brightness(0) invert(1)", opacity:0.92 }} />
      </div>

      {/* Center */}
      <div style={{ flex:1, display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:20, width:"100%" }}>
          {perks.map((p,i) => (
            <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start", animation:`slideInLeft 0.5s ease ${i*0.1}s both` }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:3 }}>{p.title}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.5 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:14, padding:"18px 20px" }}>
          <div style={{ display:"flex", gap:4, marginBottom:8 }}>
            {[1,2,3,4,5].map(i=><span key={i} style={{ color:"var(--amber)", fontSize:16 }}>★</span>)}
          </div>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontStyle:"italic", marginBottom:12 }}>
            "SpendWise mengubah cara saya melihat keuangan. Sekarang saya tahu persis ke mana uang saya pergi."
          </p>
          <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.7)" }}>— Andi Pratama, Pengguna aktif</div>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const navigate  = useNavigate();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [userId,  setUserId]  = useState(null);
  const [sentTo,  setSentTo]  = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [cooldown,setCooldown]= useState(0);
  const [form, setForm] = useState({ fullname:"", username:"", email:"", phone:"", password:"", confirm:"" });

  const ch = (e) => setForm({...form, [e.target.name]: e.target.value});

  const startCooldown = () => {
    setCooldown(60);
    const iv = setInterval(() => setCooldown(p => { if(p<=1){clearInterval(iv);return 0;} return p-1; }), 1000);
  };

  const score = (() => {
    const p = form.password; let s = 0;
    if (p.length>=8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const scoreLabel = ["","Lemah","Cukup","Kuat","Sangat kuat"][score];
  const scoreColor = ["","#D92D20","#B45309","#12A05C","#1B4FD8"][score];

  const handleRegister = async (e) => {
    e.preventDefault(); setError("");
    if (form.password.length < 8) return setError("Password minimal 8 karakter.");
    if (form.password !== form.confirm) return setError("Konfirmasi password tidak cocok.");
    try {
      setLoading(true);
      const r = await authApi.register({ fullname:form.fullname, username:form.username, email:form.email, phone:form.phone||undefined, password:form.password });
      setUserId(r.data.data.user_id);
      setSentTo(r.data.data.email);
      setStep(3);
      startCooldown();
    } catch (err) { setError(err.response?.data?.message || "Pendaftaran gagal. Coba lagi."); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError("");
    if (otpCode.length !== 6) return setError("Masukkan 6 digit kode OTP.");
    try {
      setLoading(true);
      await authApi.verifyOtp({ user_id: userId, code: otpCode });
      navigate("/login", { state:{ message:"Akun berhasil dibuat! Silakan masuk." } });
    } catch (err) { setError(err.response?.data?.message || "Kode tidak valid atau kedaluwarsa."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try { await authApi.resendOtp({ user_id:userId }); setOtpCode(""); setError(""); startCooldown(); } catch {}
  };

  const inputStyle = { width:"100%", padding:"11px 14px", border:"1px solid #D0D5DD", borderRadius:8, background:"#fff", color:"var(--text)", fontSize:14, outline:"none", transition:"border .15s", boxSizing:"border-box" };
  const labelStyle = { display:"block", fontSize:13, fontWeight:500, color:"var(--text-2)", marginBottom:6 };

  // Step bar
  const STEPS = ["Info Pribadi","Keamanan","Verifikasi"];

  return (
    <div className="auth-split">
      <LeftPanelRegister/>

      <div className="auth-split-right" style={{ position:"relative" }}>
        {/* Theme toggle — top right of form panel */}
        <div style={{ position:"absolute", top:20, right:20, zIndex:10 }}>
          <ThemePanel position="inline" align="right" />
        </div>
        <div style={{ width:"100%", maxWidth:380, animation:"slideInRight 0.6s ease both" }}>
          {/* Mobile logo */}
          <div style={{ marginBottom:28 }}>
            <Logo height={32} />
          </div>

          {/* Step indicator */}
          <div style={{ display:"flex", alignItems:"center", marginBottom:28, gap:4 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:4, flex: i<STEPS.length-1 ? 1 : "none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                  <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0,
                    background: step>i+1 ? "#12A05C" : step===i+1 ? "#1B4FD8" : "var(--bg-subtle)",
                    color: step>=i+1 ? "#fff" : "var(--text-4)",
                  }}>
                    {step>i+1 ? "✓" : i+1}
                  </div>
                  <span style={{ fontSize:11, fontWeight:500, color: step===i+1?"var(--text-2)":"var(--text-4)", whiteSpace:"nowrap" }}>{s}</span>
                </div>
                {i < STEPS.length-1 && <div style={{ flex:1, height:1, background: step>i+1?"#12A05C":"var(--border)", margin:"0 4px" }}/>}
              </div>
            ))}
          </div>

          {error && <div style={{ background:"var(--red-bg)", border:"1px solid #FECDCA", borderRadius:8, padding:"11px 14px", color:"var(--red)", fontSize:13, marginBottom:16 }}>⚠ {error}</div>}

          {/* Step 1 */}
          {step === 1 && (
            <>
              <h1 style={{ fontSize:24, fontWeight:800, color:"var(--text)", letterSpacing:"-0.3px", marginBottom:6 }}>Buat akun gratis</h1>
              <p style={{ fontSize:14, color:"var(--text-3)", marginBottom:24 }}>Sudah punya akun? <Link to="/login" style={{ color:"var(--brand)", fontWeight:600, textDecoration:"none" }}>Masuk di sini</Link></p>
              <form onSubmit={e => { e.preventDefault(); setError(""); if (!form.fullname.trim()) return setError("Nama wajib diisi."); if (form.username.trim().length<4) return setError("Username minimal 4 karakter."); setStep(2); }}>
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Nama lengkap</label>
                  <input name="fullname" value={form.fullname} onChange={ch} style={inputStyle} placeholder="Nama lengkap kamu" required autoFocus
                    onFocus={e=>e.target.style.borderColor="#1B4FD8"} onBlur={e=>e.target.style.borderColor="var(--border-2)"}/>
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={labelStyle}>Username</label>
                  <input name="username" value={form.username} onChange={ch} style={inputStyle} placeholder="Minimal 4 karakter, huruf & angka"
                    onFocus={e=>e.target.style.borderColor="#1B4FD8"} onBlur={e=>e.target.style.borderColor="var(--border-2)"}/>
                </div>
                <button type="submit" style={{ width:"100%", padding:"12px", background:"#1B4FD8", border:"none", borderRadius:8, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>
                  Lanjutkan →
                </button>
              </form>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <h1 style={{ fontSize:24, fontWeight:800, color:"var(--text)", letterSpacing:"-0.3px", marginBottom:6 }}>Keamanan akun</h1>
              <p style={{ fontSize:14, color:"var(--text-3)", marginBottom:24 }}>Gunakan email aktif untuk menerima kode verifikasi.</p>
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Email</label>
                  <input name="email" type="email" value={form.email} onChange={ch} style={inputStyle} placeholder="emailkamu@gmail.com" required autoFocus
                    onFocus={e=>e.target.style.borderColor="#1B4FD8"} onBlur={e=>e.target.style.borderColor="var(--border-2)"}/>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Nomor telepon <span style={{ fontWeight:400, color:"var(--text-4)" }}>(opsional)</span></label>
                  <input name="phone" type="tel" value={form.phone} onChange={ch} style={inputStyle} placeholder="+6281234567890"
                    onFocus={e=>e.target.style.borderColor="#1B4FD8"} onBlur={e=>e.target.style.borderColor="var(--border-2)"}/>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position:"relative" }}>
                    <input name="password" type={showPw?"text":"password"} value={form.password} onChange={ch} style={{ ...inputStyle, paddingRight:80 }} placeholder="Minimal 8 karakter" required
                      onFocus={e=>e.target.style.borderColor="#1B4FD8"} onBlur={e=>e.target.style.borderColor="var(--border-2)"}/>
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--text-3)", cursor:"pointer", fontSize:12, fontWeight:500 }}>
                      {showPw?"Sembunyikan":"Lihat"}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop:8 }}>
                      <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                        {[1,2,3,4].map(i=><div key={i} style={{ flex:1, height:3, borderRadius:99, background:i<=score?scoreColor:"var(--border)", transition:"background .3s" }}/>)}
                      </div>
                      <span style={{ fontSize:11, color:scoreColor, fontWeight:500 }}>{scoreLabel}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={labelStyle}>Konfirmasi password</label>
                  <input name="confirm" type="password" value={form.confirm} onChange={ch} style={inputStyle} placeholder="Ulangi password" required
                    onFocus={e=>e.target.style.borderColor="#1B4FD8"} onBlur={e=>e.target.style.borderColor="var(--border-2)"}/>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button type="button" onClick={()=>{setStep(1);setError("");}} style={{ padding:"11px 16px", background:"var(--bg)", border:"1px solid #E4E7EC", borderRadius:8, color:"var(--text-2)", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                    ← Kembali
                  </button>
                  <button type="submit" disabled={loading} style={{ flex:1, padding:"12px", background:loading?"#93A8F4":"#1B4FD8", border:"none", borderRadius:8, color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
                    {loading ? "Mendaftar..." : "Daftar & Kirim Kode →"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3 - OTP */}
          {step === 3 && (
            <>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ width:64, height:64, background:"var(--brand-light)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px" }}>📧</div>
                <h1 style={{ fontSize:24, fontWeight:800, color:"var(--text)", letterSpacing:"-0.3px", marginBottom:8 }}>Cek email kamu</h1>
                <p style={{ fontSize:14, color:"var(--text-3)", lineHeight:1.6 }}>
                  Kode 6 digit dikirim ke<br/>
                  <strong style={{ color:"var(--text)" }}>{sentTo}</strong>
                </p>
              </div>

              <form onSubmit={handleVerify}>
                <OtpBoxes value={otpCode} onChange={setOtpCode}/>
                <button type="submit" disabled={loading} style={{ width:"100%", padding:"12px", background:loading?"#93A8F4":"#1B4FD8", border:"none", borderRadius:8, color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
                  {loading ? "Memverifikasi..." : "Verifikasi Akun →"}
                </button>
              </form>

              <p style={{ textAlign:"center", fontSize:13, color:"var(--text-3)", marginTop:16 }}>
                Tidak dapat kode?{" "}
                <button onClick={handleResend} disabled={cooldown>0} style={{ background:"none", border:"none", color:cooldown>0?"var(--text-4)":"#1B4FD8", cursor:cooldown>0?"default":"pointer", fontWeight:600, fontSize:13 }}>
                  {cooldown>0?`Kirim ulang (${cooldown}s)`:"Kirim ulang"}
                </button>
              </p>
              <p style={{ textAlign:"center", fontSize:12, color:"var(--text-4)", marginTop:6 }}>Cek folder Spam jika tidak muncul</p>
            </>
          )}

          {step < 3 && (
            <div style={{ textAlign:"center", marginTop:24 }}>
              <Link to="/" style={{ fontSize:13, color:"var(--text-4)", textDecoration:"none" }}>← Kembali ke Beranda</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
