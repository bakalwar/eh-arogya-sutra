const speakeasy = require('speakeasy');
const { isSmtpConfigured, sendOtpEmail, isDevelopment, logOtpToConsole } = require('./emailService');

const OTP_STEP_SEC = parseInt(process.env.OTP_STEP_SECONDS || '300', 10) || 300;

function shouldShowDevOtpOnScreen() {
  return isDevelopment() && process.env.SHOW_DEV_OTP !== '0';
}

/** Speakeasy TOTP — 6 digits, 5-minute window (step 300s). */
function generateOtpSecretAndCode() {
  const secret = speakeasy.generateSecret({ length: 20 }).base32;
  const code = speakeasy.totp({
    secret,
    encoding: 'base32',
    digits: 6,
    step: OTP_STEP_SEC
  });
  return { secret, code };
}

function verifyOtpCode(secret, token) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(token).trim(),
    digits: 6,
    step: OTP_STEP_SEC,
    window: 1
  });
}

async function sendLoginOtpEmail(toEmail, code, userName) {
  const clinic = process.env.CLINIC_NAME || 'E.H. AROGYA SUTRA';
  const subject = `${clinic} — Login verification code`;
  const text = `Hello ${userName || 'Doctor'},\n\nYour login verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you did not request this, ignore this email.\n\n— ${clinic}`;
  const html = `<p>Hello <strong>${userName || 'Doctor'}</strong>,</p>
<p>Your login verification code is:</p>
<p style="font-size:28px;letter-spacing:6px;font-weight:bold;color:#2d6a35">${code}</p>
<p>Expires in <strong>5 minutes</strong>.</p>
<p style="color:#666;font-size:12px">If you did not request this, ignore this email.</p>
<p>— ${clinic}</p>`;

  if (!isSmtpConfigured() && isDevelopment()) {
    logOtpToConsole(toEmail, code, 'configure EMAIL_USER + EMAIL_PASS in .env for Gmail');
  }

  let result = { sent: false, devLogged: false };
  if (isSmtpConfigured()) {
    result = await sendOtpEmail({ to: toEmail, subject, text, html });
  } else if (isDevelopment()) {
    logOtpToConsole(toEmail, code, 'configure EMAIL_USER + EMAIL_PASS in .env for Gmail');
    result = { sent: false, devLogged: true };
  }

  return {
    sent: result.sent,
    devLogged: result.devLogged || (!result.sent && isDevelopment()),
    devOtp: shouldShowDevOtpOnScreen() ? code : undefined,
    smtpConfigured: isSmtpConfigured()
  };
}

module.exports = {
  generateOtpSecretAndCode,
  verifyOtpCode,
  sendLoginOtpEmail,
  isSmtpConfigured,
  shouldShowDevOtpOnScreen,
  OTP_STEP_SEC
};
