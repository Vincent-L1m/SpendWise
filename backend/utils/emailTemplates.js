const nodemailer = require("nodemailer");

const createTransporter = () => nodemailer.createTransport({
  host:   process.env.SMTP_HOST || "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const fmtRp = (n) => new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const year  = new Date().getFullYear();

const baseLayout = (content) => `
<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:48px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
<tr><td align="left" style="padding-bottom:28px;">
  <span style="font-size:20px;font-weight:800;color:#111827;">SpendWise</span>
</td></tr>
<tr><td style="background:#fff;border-radius:8px;padding:40px;border:1px solid #e5e7eb;">
  ${content}
</td></tr>
<tr><td style="padding-top:24px;">
  <p style="margin:0;font-size:12px;color:#9ca3af;">© ${year} SpendWise. Email otomatis, mohon tidak membalas.</p>
</td></tr>
</table></td></tr></table></body></html>`;

// ── Budget Alert Email ─────────────────────────────────────────
const sendBudgetEmail = async (email, fullname, { category, spent, limit, percent, level }) => {
  const isOver   = level === "100";
  const firstName = fullname.split(" ")[0];
  const color    = isOver ? "#ef4444" : "#f59e0b";
  const emoji    = isOver ? "🚨" : "⚠️";

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">
      ${emoji} ${isOver ? "Budget Habis!" : "Budget Hampir Habis"}
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">
      Halo <strong>${firstName}</strong>, pengeluaran kamu untuk kategori
      <strong>${category}</strong> sudah mencapai <strong style="color:${color};">${percent}%</strong> dari budget bulan ini.
    </p>
    <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;width:100%;margin-bottom:24px;">
      <tr>
        <td style="font-size:14px;color:#6b7280;padding-bottom:8px;">Kategori</td>
        <td style="font-size:14px;font-weight:600;color:#111827;text-align:right;padding-bottom:8px;">${category}</td>
      </tr>
      <tr>
        <td style="font-size:14px;color:#6b7280;padding-bottom:8px;">Terpakai</td>
        <td style="font-size:14px;font-weight:600;color:${color};text-align:right;padding-bottom:8px;">${fmtRp(spent)}</td>
      </tr>
      <tr>
        <td style="font-size:14px;color:#6b7280;">Batas Budget</td>
        <td style="font-size:14px;font-weight:600;color:#111827;text-align:right;">${fmtRp(limit)}</td>
      </tr>
    </table>
    <!-- Progress bar -->
    <div style="background:#e5e7eb;border-radius:99px;height:10px;margin-bottom:24px;">
      <div style="background:${color};width:${Math.min(percent,100)}%;height:10px;border-radius:99px;"></div>
    </div>
    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
      ${isOver ? "Kamu telah melampaui budget. Pertimbangkan untuk mengurangi pengeluaran di kategori ini bulan depan." : "Sisa budget kamu " + fmtRp(limit - spent) + ". Bijak dalam pengeluaran ya!"}
    </p>`;

  await createTransporter().sendMail({
    from: `"SpendWise" <${process.env.SMTP_USER}>`,
    to: email,
    subject: isOver ? `🚨 Budget ${category} Habis! — SpendWise` : `⚠️ Budget ${category} Hampir Habis — SpendWise`,
    html: baseLayout(content),
  });
};

module.exports = { sendBudgetEmail };
