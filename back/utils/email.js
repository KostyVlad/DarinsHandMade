const nodemailer = require('nodemailer');

// One mail sender for the whole project: order confirmations and the
// "forgot password" link both go through here.
// Without the two environment variables the mail is only written to the
// console, so the site keeps working on a machine with no mail account.
const mailer = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      // Port 587 with STARTTLS, because the hosting provider blocks port 465.
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    })
  : null;

const FROM = `DARIN'S HANDMADE <${process.env.GMAIL_USER || 'no-reply@example.com'}>`;

const sendMail = async ({ to, subject, html }) => {
  if (!mailer) {
    console.log(`[email skipped - no GMAIL creds] "${subject}" -> ${to}`);
    return;
  }
  await mailer.sendMail({ from: FROM, to, subject, html });
};

module.exports = { sendMail };
