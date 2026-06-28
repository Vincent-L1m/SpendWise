import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePin  } from "../../context/PinContext";
import { useTheme } from "../../context/ThemeContext";
import ThemePanel from "../../components/ThemePanel";
import DashboardLayout from "../../layouts/DashboardLayout";
import { userApi, securityApi } from "../../services/api";

const ORDINAL = (n) => {
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { hasPin, refreshPinStatus } = usePin();
  const { theme } = useTheme();
  const [tab,    setTab]   = useState("profile");
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]   = useState({ type:"", text:"" });

  const [prof, setProf] = useState({ fullname:"", username:"", phone:"" });
  const [pw,   setPw]   = useState({ oldPassword:"", newPassword:"", confirmPassword:"" });
  const [pin,  setPin]  = useState({ action:"", currentPin:"", newPin:"", confirmPin:"" });
  const [cycle, setCycle] = useState({ enabled: false, day: 1 });

  useEffect(() => {
    if (!user) return;
    setProf({ fullname: user.fullname||"", username: user.username||"", phone: user.phone||"" });
    setCycle({ enabled: !!user.salary_cycle_enabled, day: user.salary_day || 1 });
  }, [user]);

  const notify = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({}), 4000); };

  const saveProf = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await userApi.updateProfile(prof); await refreshUser(); notify("success", "Profil berhasil diperbarui!"); }
    catch (err) { notify("error", err.response?.data?.message || "Gagal memperbarui profil."); }
    finally { setSaving(false); }
  };

  const savePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) return notify("error", "Konfirmasi password tidak cocok.");
    if (pw.newPassword.length < 8) return notify("error", "Password baru minimal 8 karakter.");
    setSaving(true);
    try { await userApi.changePassword({ oldPassword: pw.oldPassword, newPassword: pw.newPassword }); notify("success", "Password berhasil diubah!"); setPw({ oldPassword:"", newPassword:"", confirmPassword:"" }); }
    catch (err) { notify("error", err.response?.data?.message || "Gagal mengubah password."); }
    finally { setSaving(false); }
  };

  const savePin = async (e) => {
    e.preventDefault();
    const a = pin.action;
    if (!a) return;
    if ((a==="create"||a==="change") && !/^\d{6}$/.test(pin.newPin)) return notify("error","PIN harus 6 digit angka.");
    if ((a==="create"||a==="change") && pin.newPin !== pin.confirmPin) return notify("error","Konfirmasi PIN tidak cocok.");
    setSaving(true);
    try {
      if (a==="create") await securityApi.createPin({ pin: pin.newPin });
      else if (a==="change") await securityApi.changePin({ oldPin: pin.currentPin, newPin: pin.newPin });
      else if (a==="remove") await securityApi.removePin({ pin: pin.currentPin });
      notify("success", a==="remove" ? "PIN berhasil dihapus." : "PIN berhasil disimpan!");
      setPin({ action:"", currentPin:"", newPin:"", confirmPin:"" });
      await refreshPinStatus();
    } catch (err) { notify("error", err.response?.data?.message || "Gagal."); }
    finally { setSaving(false); }
  };

  const saveCycle = async () => {
    setSaving(true);
    try {
      await userApi.updateSalaryCycle({ enabled: cycle.enabled, day: cycle.day });
      await refreshUser();
      notify("success", cycle.enabled ? `Siklus gaji aktif! Periode dimulai setiap tanggal ${cycle.day}.` : "Siklus gaji dinonaktifkan.");
    } catch (err) { notify("error", err.response?.data?.message || "Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const TABS = [["profile","Akun"],["password","Password"],["pin","PIN"],["cycle","Siklus Gaji"],["appearance","Tampilan"]];

  return (
    <DashboardLayout>
      {/* Avatar card */}
      <div className="sw-card" style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px", padding:"16px 20px", flexWrap:"wrap" }}>
        <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:"linear-gradient(135deg,var(--brand),var(--violet))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", fontWeight:"700", color:"#fff", flexShrink:0 }}>
          {user?.fullname?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:"inherit", fontSize:"17px", fontWeight:"700", color:"var(--text)", marginBottom:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.fullname}</p>
          <p style={{ fontSize:"12px", color:"var(--text-3)" }}>{user?.email}</p>
        </div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          <span style={{ padding:"4px 10px", borderRadius:"9999px", fontSize:"11px", fontWeight:"600", background:hasPin?"var(--green-bg)":"var(--bg-subtle)", border:`1px solid ${hasPin?"var(--green)":"var(--border)"}`, color:hasPin?"var(--green)":"var(--text-3)" }}>
            {hasPin ? "🔒 PIN On" : "🔓 No PIN"}
          </span>
          {user?.salary_cycle_enabled ? (
            <span style={{ padding:"4px 10px", borderRadius:"9999px", fontSize:"11px", fontWeight:"600", background:"var(--brand-light)", border:"1px solid var(--border-2)", color:"var(--brand)" }}>
              💰 Gaji tgl {user.salary_day}
            </span>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"3px", marginBottom:"16px", background:"var(--bg-white)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"3px", overflowX:"auto" }}>
        {TABS.map(([v,l]) => (
          <button key={v} onClick={() => { setTab(v); setMsg({}); }}
            style={{ flex:"1 0 auto", padding:"9px 12px", background:tab===v?"var(--bg-subtle)":"transparent", border:"none", borderRadius:"var(--radius-sm)", color:tab===v?"var(--text)":"var(--text-3)", fontSize:"13px", fontWeight:tab===v?"600":"400", cursor:"pointer", transition:"all .15s ease", whiteSpace:"nowrap" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Alert */}
      {msg.text && (
        <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", borderRadius:"var(--radius)", fontSize:"13px", fontWeight:"500", marginBottom:"14px", background:msg.type==="success"?"var(--green-bg)":"var(--red-bg)", border:`1px solid ${msg.type==="success"?"rgba(0,229,160,.3)":"rgba(255,77,109,.3)"}`, color:msg.type==="success"?"var(--green)":"#ff8fa3" }}>
          {msg.type==="success" ? "✓" : "⚠"} {msg.text}
        </div>
      )}

      <div className="sw-card" style={{ maxWidth:"500px" }}>
        {/* ── Profile ── */}
        {tab==="profile" && (
          <form onSubmit={saveProf}>
            <F label="Nama Lengkap *" val={prof.fullname}  onChange={v=>setProf(p=>({...p,fullname:v}))}  ph="Nama lengkap"/>
            <F label="Username *"     val={prof.username}  onChange={v=>setProf(p=>({...p,username:v}))}  ph="username"/>
            <F label="Email"          val={user?.email||""} disabled ph=""/>
            <F label="No. Telepon"    val={prof.phone}     onChange={v=>setProf(p=>({...p,phone:v}))}     ph="08xxxxxxxxxx"/>
            <Btn saving={saving} label="Simpan Perubahan"/>
          </form>
        )}

        {/* ── Password ── */}
        {tab==="password" && (
          <form onSubmit={savePw}>
            <F label="Password Lama *"  type="password" val={pw.oldPassword}     onChange={v=>setPw(p=>({...p,oldPassword:v}))}     ph="Password saat ini"/>
            <F label="Password Baru *"  type="password" val={pw.newPassword}     onChange={v=>setPw(p=>({...p,newPassword:v}))}     ph="Min. 8 karakter"/>
            <F label="Konfirmasi *"     type="password" val={pw.confirmPassword} onChange={v=>setPw(p=>({...p,confirmPassword:v}))} ph="Ulangi password baru"/>
            <Btn saving={saving} label="Ubah Password"/>
          </form>
        )}

        {/* ── PIN ── */}
        {tab==="pin" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px", background:"var(--bg-white)", borderRadius:"var(--radius)", marginBottom:"18px", border:"1px solid var(--border)" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"var(--radius)", background:hasPin?"var(--green-bg)":"var(--bg-subtle)", border:`1px solid ${hasPin?"var(--green)":"var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"20px" }}>
                {hasPin ? "🔒" : "🔓"}
              </div>
              <div>
                <p style={{ fontSize:"14px", fontWeight:"600", color:"var(--text)", marginBottom:"2px" }}>PIN {hasPin?"Aktif":"Belum Diatur"}</p>
                <p style={{ fontSize:"12px", color:"var(--text-3)" }}>{hasPin?"Aplikasi terkunci setiap dibuka":"Tambahkan PIN 6 digit untuk keamanan"}</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"18px" }}>
              {!hasPin && <PinActionBtn val="create" cur={pin.action} label="Buat PIN" onClick={()=>setPin(p=>({...p,action:"create"}))}/>}
              {hasPin && <><PinActionBtn val="change" cur={pin.action} label="Ganti PIN" onClick={()=>setPin(p=>({...p,action:"change"}))}/>
              <PinActionBtn val="remove" cur={pin.action} label="Hapus PIN" danger onClick={()=>setPin(p=>({...p,action:"remove"}))}/></>}
            </div>
            {pin.action && (
              <form onSubmit={savePin}>
                {(pin.action==="change"||pin.action==="remove") && <F label="PIN Saat Ini *" type="password" val={pin.currentPin} onChange={v=>setPin(p=>({...p,currentPin:v}))} ph="6 digit PIN" maxLen={6}/>}
                {(pin.action==="create"||pin.action==="change") && (<>
                  <F label="PIN Baru *" type="password" val={pin.newPin} onChange={v=>setPin(p=>({...p,newPin:v}))} ph="6 digit angka" maxLen={6}/>
                  <F label="Konfirmasi PIN *" type="password" val={pin.confirmPin} onChange={v=>setPin(p=>({...p,confirmPin:v}))} ph="Ulangi PIN baru" maxLen={6}/>
                </>)}
                <Btn saving={saving} label={pin.action==="remove"?"Hapus PIN":pin.action==="create"?"Buat PIN":"Ganti PIN"} danger={pin.action==="remove"}/>
              </form>
            )}
          </div>
        )}

        {/* ── Salary Cycle ── */}
        {tab==="cycle" && (
          <div>
            {/* Explainer */}
            <div style={{ padding:"14px 16px", background:"var(--brand-light)", border:"1px solid var(--border-2)", borderRadius:"var(--radius)", marginBottom:"20px" }}>
              <p style={{ fontSize:"13px", fontWeight:"600", color:"var(--brand)", marginBottom:"4px" }}>💰 Apa itu Salary Cycle?</p>
              <p style={{ fontSize:"12px", color:"var(--text-2)", lineHeight:"1.6" }}>
                Selaraskan periode laporan dengan tanggal gajian kamu. Misalnya gajian tanggal 25 setiap bulan — periode keuanganmu akan dihitung dari tgl 25 bulan ini hingga tgl 24 bulan depan, bukan dari awal bulan.
              </p>
            </div>

            {/* Toggle */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", padding:"14px 16px", background:"var(--bg-white)", borderRadius:"var(--radius)", border:"1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize:"14px", fontWeight:"600", color:"var(--text)", marginBottom:"2px" }}>Aktifkan Salary Cycle</p>
                <p style={{ fontSize:"12px", color:"var(--text-3)" }}>Periode berdasarkan tanggal gajian</p>
              </div>
              {/* Toggle switch */}
              <button type="button" onClick={() => setCycle(p => ({ ...p, enabled: !p.enabled }))}
                style={{ width:"48px", height:"26px", borderRadius:"9999px", background:cycle.enabled?"var(--brand)":"var(--bg-subtle)", border:`1px solid ${cycle.enabled?"var(--brand)":"var(--border)"}`, cursor:"pointer", position:"relative", transition:"background .15s ease", padding:0 }}>
                <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"white", position:"absolute", top:"2px", left:cycle.enabled?"25px":"3px", transition:"left .15s ease", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/>
              </button>
            </div>

            {/* Day picker — only shown when enabled */}
            {cycle.enabled && (
              <div style={{ marginBottom:"20px" }}>
                <label className="sw-label">Tanggal Gajian (1–28)</label>
                {/* Scrollable day pills */}
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"10px" }}>
                  {Array.from({length:28},(_,i)=>i+1).map(d => (
                    <button key={d} type="button" onClick={() => setCycle(p => ({ ...p, day: d }))}
                      style={{ width:"36px", height:"36px", borderRadius:"var(--radius)", border:`1px solid ${cycle.day===d?"var(--brand)":"var(--border)"}`, background:cycle.day===d?"var(--brand-light)":"var(--bg-white)", color:cycle.day===d?"var(--brand)":"var(--text-3)", fontSize:"13px", fontWeight:cycle.day===d?"700":"400", cursor:"pointer", transition:"all .15s ease" }}>
                      {d}
                    </button>
                  ))}
                </div>
                <div style={{ padding:"10px 14px", background:"var(--bg-white)", borderRadius:"var(--radius)", border:"1px solid var(--border)" }}>
                  <p style={{ fontSize:"13px", color:"var(--text-2)" }}>
                    Periode kamu: <strong style={{ color:"var(--brand)" }}>Setiap tanggal {cycle.day}</strong> hingga <strong style={{ color:"var(--brand)" }}>tanggal {cycle.day > 1 ? cycle.day - 1 : 28} bulan berikutnya</strong>
                  </p>
                </div>
              </div>
            )}

            <button type="button" onClick={saveCycle} disabled={saving} className="btn-primary"
              style={{ width:"100%", justifyContent:"center", padding:"12px", fontSize:"14px" }}>
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        )}

        {/* ── Appearance / Theme ── */}
        {tab==="appearance" && (
          <div>
            <div style={{ padding:"14px 16px", background:"var(--brand-light)", border:"1px solid var(--border)", borderRadius:10, marginBottom:"20px" }}>
              <p style={{ fontSize:"13px", fontWeight:"600", color:"var(--brand)", marginBottom:"4px" }}>🎨 Kustomisasi Tampilan</p>
              <p style={{ fontSize:"12px", color:"var(--text-3)", lineHeight:"1.6" }}>
                Pilih mode gelap atau terang, dan warna aksen yang kamu suka. Tersimpan otomatis.
              </p>
            </div>
            <ThemePanel position="inline" align="left" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ── Sub-components ───────────────────────────────────────────
function F({ label, val, onChange, type="text", ph="", disabled=false, maxLen }) {
  return (
    <div style={{ marginBottom:"16px" }}>
      <label className="sw-label">{label}</label>
      <input type={type} value={val} onChange={onChange ? e => onChange(e.target.value) : undefined}
        placeholder={ph} disabled={disabled} maxLength={maxLen}
        required={label.endsWith("*")} className="sw-input"
        style={{ background:disabled?"var(--bg-subtle)":"var(--bg-white)", cursor:disabled?"not-allowed":"text", color:disabled?"var(--text-3)":"var(--text)" }}/>
    </div>
  );
}

function Btn({ saving, label, danger=false }) {
  return (
    <button type="submit" disabled={saving} className={danger?"btn-danger":"btn-primary"}
      style={{ width:"100%", justifyContent:"center", padding:"12px", fontSize:"14px", marginTop:"4px" }}>
      {saving ? "Memproses..." : label}
    </button>
  );
}

function PinActionBtn({ val, cur, label, onClick, danger=false }) {
  const active = cur === val;
  return (
    <button type="button" onClick={onClick}
      style={{ padding:"9px 16px", background: active ? (danger?"var(--red-bg)":"var(--brand-light)") : "var(--bg-white)", border:`1px solid ${active ? (danger?"var(--red)":"var(--brand)") : "var(--border)"}`, borderRadius:"var(--radius)", color: active ? (danger?"var(--red)":"var(--brand)") : (danger?"var(--red)":"var(--text-2)"), fontSize:"13px", fontWeight:"600", cursor:"pointer", transition:"all .15s ease" }}>
      {label}
    </button>
  );
}
