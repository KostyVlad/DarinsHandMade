const { Resend } = require('resend');

// One mail sender for the whole project: order confirmations and the
// "forgot password" link both go through here.
//
// Resend is used instead of an SMTP mailbox because Gmail needs a paid
// workspace on a real domain, and this project has neither. Resend sends
// over its own HTTPS API, so no SMTP port has to be open on the host.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Until a domain of our own is verified in Resend, mail may only be sent
// from their shared test address, and only to the address that owns the
// Resend account. With a verified domain this becomes info@<domain>.
const FROM = process.env.MAIL_FROM || "DARIN'S HANDMADE <onboarding@resend.dev>";

const sendMail = async ({ to, subject, html }) => {
  // No key on this machine: write the letter to the console instead of
  // failing, so the site keeps working in development.
  if (!resend) {
    console.log(`[email skipped - no RESEND_API_KEY] "${subject}" -> ${to}`);
    return;
  }

  // The SDK does not throw on a rejected message; it reports the problem
  // in the error field, so it has to be checked by hand.
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });

  if (error) {
    throw new Error(error.message || 'Resend refused the message');
  }

  return data;
};

module.exports = { sendMail };
