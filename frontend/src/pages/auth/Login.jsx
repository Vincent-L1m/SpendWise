import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ThemePanel from "../../components/ThemePanel";
import Logo from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/api";

function OtpBoxes({ value, onChange }) {
  const vals = (value + "      ").slice(0, 6).split("");
  const handle = (e, i) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = (value + "      ").slice(0, 6).split("");
    arr[i] = v || " ";
    onChange(arr.join("").trimEnd());
    if (v && i < 5) document.getElementById(`otpl${i+1}`)?.focus();
    if (e.key === "Backspace" && !value[i] && i > 0) document.getElementById(`otpl${i-1}`)?.focus();
  };
  const paste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    onChange(p); e.preventDefault();
    document.getElementById(`otpl${Math.min(p.length,5)}`)?.focus();
  };
  return (
    <div style={{ display:"flex", gap:10, justifyContent:"center", margin:"20px 0" }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} id={`otpl${i}`} type="text" inputMode="numeric" maxLength={1}
          value={vals[i].trim()}
          onChange={e=>handle(e,i)} onKeyDown={e=>e.key==="Backspace"&&handle(e,i)} onPaste={paste}
          style={{ width:48, height:56, textAlign:"center", fontSize:24, fontWeight:700, background:"#fff", border:`2px solid ${vals[i].trim()?"#1B4FD8":"var(--border-2)"}`, borderRadius:10, color:"var(--text)", outline:"none", transition:"border-color .15s" }}/>
      ))}
    </div>
  );
}

/* ── Left panel illustration ── */
function LeftPanel() {
  const features = ["Catat transaksi kapan saja","Pantau anggaran real-time","Analisis AI keuangan kamu","Multi wallet & split bill"];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(p => (p+1)%features.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="auth-split-left">
      {/* Background shapes */}
      <div style={{ position:"absolute", top:-60, right:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", top:100, right:40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:100, left:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>

      {/* Logo top */}
      <div style={{ position:"absolute", top:28, left:36 }}>
        <Logo height={36} style={{ filter:"brightness(0) invert(1)", opacity:0.92 }} />
      </div>

      {/* Center illustration */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          {/* Fake app card floating */}
          <div style={{ background:"rgba(255,255,255,0.1)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:20, padding:"28px 32px", marginBottom:24, animation:"float 5s ease-in-out infinite" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>💰</div>
            <div style={{ fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.5px", marginBottom:4 }}>Rp 12.450.000</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>Total Saldo Kamu</div>
            <div style={{ display:"flex", gap:16, marginTop:16, justifyContent:"center" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--green)" }}>↑ Rp 8jt</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>Pemasukan</div>
              </div>
              <div style={{ width:1, background:"rgba(255,255,255,0.2)" }}/>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--red)" }}>↓ Rp 4.2jt</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>Pengeluaran</div>
              </div>
            </div>
          </div>

          {/* Floating notification */}
          <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:12, padding:"10px 16px", display:"inline-flex", gap:10, alignItems:"center", animation:"floatSlow 4s ease-in-out infinite", boxShadow:"0 8px 24px rgba(0,0,0,0.15)" }}>
            <span style={{ fontSize:18 }}>🎯</span>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>Target Liburan</div>
              <div style={{ fontSize:11, color:"var(--green)", fontWeight:600 }}>75% tercapai ✓</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom content */}
      <div style={{ position:"relative", zIndex:1 }}>
        <h2 style={{ fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.5px", marginBottom:12, lineHeight:1.2 }}>
          Kendali penuh<br/>keuangan kamu
        </h2>
        <div style={{ height:48, overflow:"hidden", marginBottom:20, position:"relative" }}>
          {features.map((f,i) => (
            <div key={i} style={{ position:"absolute", transition:"all 0.5s ease", opacity:i===active?1:0, transform:`translateY(${(i-active)*100}%)`, color:"rgba(255,255,255,0.8)", fontSize:15, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"var(--green)" }}>✓</span> {f}
            </div>
          ))}
        </div>
        {/* Dots */}
        <div style={{ display:"flex", gap:6 }}>
          {features.map((_,i) => <div key={i} style={{ width:i===active?24:6, height:6, borderRadius:99, background:"rgba(255,255,255,0.5)", transition:"all 0.3s" }}/>)}
        </div>
      </div>
    </div>
  );
}

/* ── Login ── */
export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ login:"", password:"" });

  const [needsOtp, setNeedsOtp] = useState(false);
  const [userId,   setUserId]   = useState(null);
  const [otpCode,  setOtpCode]  = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => { if (location.state?.message) setSuccess(location.state.message); }, [location.state]);

  const startCooldown = () => {
    setCooldown(60);
    const iv = setInterval(() => setCooldown(p => { if(p<=1){clearInterval(iv);return 0;} return p-1; }), 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      setLoading(true);
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      const d = err.response?.data;
      if (d?.data?.needs_verification) { setUserId(d.data.user_id); setNeedsOtp(true); startCooldown(); }
      else setError(d?.message || "Email/username atau password salah.");
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError("");
    if (otpCode.length !== 6) return setError("Masukkan 6 digit kode OTP.");
    try {
      setLoading(true);
      await authApi.verifyOtp({ user_id: userId, code: otpCode });
      await login(form);
      navigate("/dashboard");
    } catch (err) { setError(err.response?.data?.message || "Kode tidak valid atau kedaluwarsa."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try { await authApi.resendOtp({ user_id: userId }); setOtpCode(""); setError(""); startCooldown(); } catch {}
  };

  const inputStyle = { width:"100%", padding:"11px 14px", border:"1px solid #D0D5DD", borderRadius:8, background:"#fff", color:"var(--text)", fontSize:14, outline:"none", transition:"border .15s", boxSizing:"border-box" };
  const labelStyle = { display:"block", fontSize:13, fontWeight:500, color:"var(--text-2)", marginBottom:6 };

  return (
    <div className="auth-split">
      <LeftPanel/>

      <div className="auth-split-right" style={{ position:"relative" }}>
        {/* Theme toggle — top right of form panel */}
        <div style={{ position:"absolute", top:20, right:20, zIndex:10 }}>
          <ThemePanel position="inline" align="right" />
        </div>
        <div style={{ width:"100%", maxWidth:360, animation:"slideInRight 0.6s ease both" }}>
          {/* Mobile logo */}
          <div style={{ marginBottom:32 }}>
            <Logo height={34} />
          </div>

          {!needsOtp ? (
            <>
              <h1 style={{ fontSize:26, fontWeight:800, color:"var(--text)", letterSpacing:"-0.4px", marginBottom:6 }}>Selamat datang</h1>
              <p style={{ fontSize:14, color:"var(--text-3)", marginBottom:28 }}>
                Belum punya akun?{" "}
                <Link to="/register" style={{ color:"var(--brand)", fontWeight:600, textDecoration:"none" }}>Daftar gratis</Link>
              </p>

              {success && <div style={{ background:"var(--green-bg)", border:"1px solid #A9EFC5", borderRadius:8, padding:"11px 14px", color:"var(--green)", fontSize:13, marginBottom:16 }}>✓ {success}</div>}
              {error   && <div style={{ background:"var(--red-bg)", border:"1px solid #FECDCA", borderRadius:8, padding:"11px 14px", color:"var(--red)", fontSize:13, marginBottom:16 }}>⚠ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:16 }}>
                  <label style={labelStyle}>Email atau Username</label>
                  <input style={inputStyle} value={form.login} onChange={e=>setForm({...form,login:e.target.value})} placeholder="emailkamu@gmail.com" required autoFocus
                    onFocus={e=>e.target.style.borderColor="#1B4FD8"} onBlur={e=>e.target.style.borderColor="var(--border-2)"}/>
                </div>
                <div style={{ marginBottom:24 }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position:"relative" }}>
                    <input type={showPw?"text":"password"} style={{ ...inputStyle, paddingRight:80 }} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password kamu" required
                      onFocus={e=>e.target.style.borderColor="#1B4FD8"} onBlur={e=>e.target.style.borderColor="var(--border-2)"}/>
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--text-3)", cursor:"pointer", fontSize:12, fontWeight:500 }}>
                      {showPw?"Sembunyikan":"Lihat"}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ width:"100%", padding:"12px", background: loading?"#93A8F4":"#1B4FD8", border:"none", borderRadius:8, color:"#fff", fontSize:15, fontWeight:700, cursor: loading?"not-allowed":"pointer", transition:"background .15s" }}>
                  {loading ? "Masuk..." : "Masuk →"}
                </button>
              </form>

              <div style={{ position:"relative", textAlign:"center", margin:"20px 0" }}>
                <div style={{ borderTop:"1px solid #E4E7EC", position:"absolute", top:"50%", left:0, right:0 }}/>
                <span style={{ position:"relative", background:"#fff", padding:"0 12px", fontSize:12, color:"var(--text-4)" }}>atau</span>
              </div>
              <Link to="/" style={{ display:"block", textAlign:"center", fontSize:13, color:"var(--text-3)", textDecoration:"none" }}>← Kembali ke Beranda</Link>
            </>
          ) : (
            <>
              <h1 style={{ fontSize:26, fontWeight:800, color:"var(--text)", letterSpacing:"-0.4px", marginBottom:6 }}>Verifikasi email</h1>
              <p style={{ fontSize:14, color:"var(--text-3)", marginBottom:8 }}>Masukkan kode 6 digit yang dikirim ke email kamu.</p>
              <p style={{ fontSize:12, color:"var(--text-4)", marginBottom:20 }}>Cek folder Spam jika tidak muncul di inbox.</p>

              {error && <div style={{ background:"var(--red-bg)", border:"1px solid #FECDCA", borderRadius:8, padding:"11px 14px", color:"var(--red)", fontSize:13, marginBottom:16 }}>⚠ {error}</div>}

              <form onSubmit={handleVerify}>
                <OtpBoxes value={otpCode} onChange={setOtpCode}/>
                <button type="submit" disabled={loading}
                  style={{ width:"100%", padding:"12px", background: loading?"#93A8F4":"#1B4FD8", border:"none", borderRadius:8, color:"#fff", fontSize:15, fontWeight:700, cursor: loading?"not-allowed":"pointer" }}>
                  {loading ? "Memverifikasi..." : "Verifikasi & Masuk →"}
                </button>
              </form>

              <p style={{ textAlign:"center", fontSize:13, color:"var(--text-3)", marginTop:16 }}>
                Tidak dapat kode?{" "}
                <button onClick={handleResend} disabled={cooldown>0} style={{ background:"none", border:"none", color:cooldown>0?"var(--text-4)":"#1B4FD8", cursor:cooldown>0?"default":"pointer", fontWeight:600, fontSize:13 }}>
                  {cooldown>0?`Kirim ulang (${cooldown}s)`:"Kirim ulang"}
                </button>
              </p>
              <button onClick={()=>{setNeedsOtp(false);setOtpCode("");setError("");}} style={{ display:"block", margin:"12px auto 0", background:"none", border:"none", color:"var(--text-4)", fontSize:13, cursor:"pointer" }}>
                ← Kembali ke login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
