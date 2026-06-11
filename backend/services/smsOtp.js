const { isDevelopment, logOtpToConsole } = require('./emailService');

function getFast2SmsKey() {
  return (process.env.FAST2SMS_KEY || process.env.FAST2SMS_API_KEY || '').trim();
}

function isSmsConfigured() {
  return !!getFast2SmsKey();
}

function maskMobile(mobile10) {
  const m = String(mobile10 || '').replace(/\D/g, '');
  if (m.length !== 10) return '**********';
  return `${m.slice(0, 2)}******${m.slice(-2)}`;
}

function shouldShowDevOtpOnScreen() {
  return isDevelopment() && process.env.SHOW_DEV_OTP !== '0';
}

/**
 * Send 6-digit login OTP via SMS (Fast2SMS — India).
 * Dev without key: logs to console + optional devOtp in API response.
 */
async function sendLoginOtpSms(mobile10, code, userName) {
  const mobile = String(mobile10 || '').replace(/\D/g, '').slice(-10);
  if (mobile.length !== 10) {
    return { sent: false, error: 'invalid_mobile', smsConfigured: isSmsConfigured() };
  }

  const clinic = process.env.CLINIC_NAME || 'E.H. AROGYA SUTRA';

  if (!isSmsConfigured()) {
    if (isDevelopment()) {
      logOtpToConsole(mobile, code, 'set FAST2SMS_KEY on Railway for live SMS OTP');
      return {
        sent: false,
        devLogged: true,
        devOtp: shouldShowDevOtpOnScreen() ? code : undefined,
        smsConfigured: false,
        mobileHint: maskMobile(mobile)
      };
    }
    console.error('[sms] FAST2SMS_KEY not configured — cannot send OTP');
    return { sent: false, devLogged: false, error: 'sms_not_configured', smsConfigured: false };
  }

  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: getFast2SmsKey(),
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: String(code),
        numbers: mobile
      })
    });

    const data = await res.json().catch(() => ({}));
    const ok = res.ok && (data.return === true || data.status_code === 200 || data.status === 'OK');

    if (ok) {
      if (isDevelopment()) {
        logOtpToConsole(mobile, code, 'also sent via Fast2SMS (dev copy)');
      }
      return {
        sent: true,
        devLogged: isDevelopment(),
        smsConfigured: true,
        mobileHint: maskMobile(mobile)
      };
    }

    console.error('[sms] Fast2SMS response:', data);
    return {
      sent: false,
      error: data.message || data.msg || 'sms_send_failed',
      smsConfigured: true,
      mobileHint: maskMobile(mobile)
    };
  } catch (err) {
    console.error('[sms] send failed:', err.message);
    return { sent: false, error: err.message, smsConfigured: true };
  }
}

module.exports = {
  sendLoginOtpSms,
  isSmsConfigured,
  maskMobile
};
