const nodemailer = require('nodemailer');

/**
 * Gmail SMTP — set EMAIL_USER + EMAIL_PASS (or legacy SMTP_USER / SMTP_PASS).
 * App password: Google Account → Security → 2-Step Verification → App passwords.
 */
function getSmtpCredentials() {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  // Gmail app passwords are often pasted with spaces — strip them
  const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').replace(/\s/g, '');
  return { user, pass };
}

function isSmtpConfigured() {
  const { user, pass } = getSmtpCredentials();
  return !!(user && pass);
}

function getEmailFromAddress() {
  const fromName = (process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.CLINIC_NAME || 'E.H. Arogya Sutra').trim();
  const { user } = getSmtpCredentials();
  if (fromName.includes('@')) return fromName;
  if (user) return `"${fromName}" <${user}>`;
  return fromName;
}

function createTransporter() {
  const { user, pass } = getSmtpCredentials();
  if (!user || !pass) return null;

  const port = parseInt(process.env.SMTP_PORT || '587', 10) || 587;
  const useGmailService =
    process.env.EMAIL_USE_GMAIL_SERVICE !== '0' &&
    (process.env.SMTP_HOST || 'smtp.gmail.com').includes('gmail');

  // Port 587 + STARTTLS — avoids ETIMEDOUT on 465 on some networks
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: useGmailService ? 587 : port,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000
  });
}

function isDevelopment() {
  return (process.env.NODE_ENV || 'development') === 'development';
}

/** Always log OTP in dev; also log when SMTP is off or send fails. */
function logOtpToConsole(toEmail, code, reason = 'dev') {
  console.log('\n=== OTP CODE ===');
  console.log(code);
  console.log(`To: ${toEmail}`);
  if (reason) console.log(`Note: ${reason}`);
  console.log('================\n');
}

/**
 * @returns {Promise<{ sent: boolean, devLogged: boolean, error?: string }>}
 */
async function sendOtpEmail({ to, subject, text, html }) {
  const toEmail = String(to || '').trim();
  if (!toEmail) {
    return { sent: false, devLogged: false, error: 'missing_recipient' };
  }

  const transporter = createTransporter();
  const devLog = () => logOtpToConsole(toEmail, extractCodeFromText(text), 'SMTP not configured or send failed');

  if (!transporter) {
    if (isDevelopment()) devLog();
    return { sent: false, devLogged: isDevelopment() };
  }

  try {
    await transporter.sendMail({
      from: getEmailFromAddress(),
      to: toEmail,
      subject,
      text,
      html
    });
    if (isDevelopment()) {
      logOtpToConsole(toEmail, extractCodeFromText(text), 'also sent to Gmail (dev copy)');
    }
    return { sent: true, devLogged: isDevelopment() };
  } catch (err) {
    console.error('[email] send failed:', err.message);
    if (isDevelopment()) devLog();
    return { sent: false, devLogged: isDevelopment(), error: err.message };
  }
}

function extractCodeFromText(text) {
  const m = String(text || '').match(/\b(\d{6})\b/);
  return m ? m[1] : '------';
}

module.exports = {
  getSmtpCredentials,
  isSmtpConfigured,
  getEmailFromAddress,
  createTransporter,
  logOtpToConsole,
  sendOtpEmail,
  isDevelopment
};
