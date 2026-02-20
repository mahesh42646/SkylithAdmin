const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const {
    MAIL_SMTP_HOST,
    MAIL_SMTP_PORT,
    MAIL_SMTP_TLS,
    MAIL_SMTP_USER,
    MAIL_SMTP_PASS
  } = process.env;

  if (!MAIL_SMTP_HOST || !MAIL_SMTP_PORT || !MAIL_SMTP_USER || !MAIL_SMTP_PASS) {
    console.warn(
      '[smtpMailService] SMTP environment variables are not fully configured. MAIL_SMTP_HOST, MAIL_SMTP_PORT, MAIL_SMTP_USER, MAIL_SMTP_PASS are required.'
    );
  }

  transporter = nodemailer.createTransport({
    host: MAIL_SMTP_HOST,
    port: Number(MAIL_SMTP_PORT) || 587,
    secure: MAIL_SMTP_TLS === 'true',
    auth: {
      user: MAIL_SMTP_USER,
      pass: MAIL_SMTP_PASS
    }
  });

  return transporter;
}

async function sendMail({ from, to, subject, text, html, attachments }) {
  const tx = getTransporter();

  const mailFrom = from || process.env.MAIL_DEFAULT_FROM || process.env.MAIL_SMTP_USER;

  const info = await tx.sendMail({
    from: mailFrom,
    to,
    subject,
    text,
    html,
    attachments
  });

  return info;
}

module.exports = {
  sendMail
};

