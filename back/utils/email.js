const nodemailer = require('nodemailer');

const mailer = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;

const FROM = `DARIN'S HANDMADE <${process.env.GMAIL_USER || 'no-reply@example.com'}>`;

// Sends an email if Gmail is configured; otherwise logs (so local dev without
// credentials doesn't crash the flow).
async function sendMail({ to, subject, html }) {
  if (!mailer) {
    console.log(`[email skipped — no GMAIL creds] "${subject}" -> ${to}`);
    return;
  }
  await mailer.sendMail({ from: FROM, to, subject, html });
}

module.exports = { sendMail };
