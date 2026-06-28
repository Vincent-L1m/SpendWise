const nodemailer = require("nodemailer");
const { OtpCode } = require("../models");
const { Op } = require("sequelize");

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const saveOtp = async (userId, type, purpose = "verify") => {
  await OtpCode.update(
    { used: true },
    { where: { user_id: userId, type, purpose, used: false } }
  );
  const code = generateOtpCode();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);
  await OtpCode.create({ user_id: userId, code, type, purpose, expires_at });
  return code;
};

const verifyOtp = async (userId, code, type, purpose = "verify") => {
  const otp = await OtpCode.findOne({
    where: {
      user_id: userId, code, type, purpose, used: false,
      expires_at: { [Op.gt]: new Date() },
    },
    order: [["created_at", "DESC"]],
  });
  if (!otp) return false;
  await otp.update({ used: true });
  return true;
};

const createEmailTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.SMTP_HOST || "smtp.gmail.com",
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendEmailOtp = async (email, fullname, code, purpose = "verify") => {
  const transporter = createEmailTransporter();
  const isVerify    = purpose === "verify";
  const firstName   = fullname.split(" ")[0];
  const year        = new Date().getFullYear();

  const subject = isVerify
    ? "Konfirmasi pendaftaran SpendWise kamu"
    : "Reset password SpendWise kamu";

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="left" style="padding-bottom:28px;">
              <span style="font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.5px;">SpendWise</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:8px;padding:40px 40px 32px;border:1px solid #e5e7eb;">

              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Title -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
                      ${isVerify ? "Selesaikan pendaftaran kamu" : "Reset password kamu"}
                    </h1>
                  </td>
                </tr>

                <!-- Body text -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.7;">
                      ${isVerify
                        ? `Halo <strong>${firstName}</strong>, masukkan kode konfirmasi di bawah ini pada halaman pendaftaran SpendWise kamu:`
                        : `Halo <strong>${firstName}</strong>, masukkan kode di bawah ini untuk mereset password akun SpendWise kamu:`
                      }
                    </p>
                  </td>
                </tr>

                <!-- OTP Code Box -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px 48px;">
                      <tr>
                        <td align="center">
                          <span style="font-size:38px;font-weight:700;letter-spacing:8px;color:#111827;font-family:'Courier New',monospace;">${code}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiry note -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                      Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapapun.
                    </p>
                  </td>
                </tr>

                <!-- Confirm button -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111827;">
                      Atau klik tombol ini untuk konfirmasi email kamu:
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#2563eb;border-radius:6px;">
                          <a href="#" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                            ${isVerify ? "Konfirmasi email kamu" : "Reset password sekarang"}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #e5e7eb;padding-top:24px;">
                    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                      Jika kamu tidak membuat akun SpendWise, abaikan email ini.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${year} SpendWise. Email ini dikirim otomatis, mohon tidak membalas.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  await transporter.sendMail({
    from:    `"SpendWise" <${process.env.SMTP_USER}>`,
    to:      email,
    subject,
    html,
  });
};

module.exports = { saveOtp, verifyOtp, sendEmailOtp };
