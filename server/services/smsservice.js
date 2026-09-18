// server/services/smsService.js
//
// Sends SMS notifications for threshold alerts.
//
// Follows the same fallback pattern as utils/sendEmail.js:
//   - If Twilio credentials are configured (TWILIO_ACCOUNT_SID,
//     TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, SMS_ALERT_RECIPIENTS) the
//     alert message is sent via the Twilio REST API to each configured
//     recipient number.
//   - Otherwise SMS sending is skipped (and logged to the console) so
//     alert generation still works end-to-end without an SMS provider
//     set up locally.
//
// This keeps the exact interface sensorreadingController.js expects:
//   const { sendAlertSMS } = require("../services/smsService");
//   const result = await sendAlertSMS(message);
//   // result: { success: boolean, skipped: boolean }

const hasTwilioConfig = () =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER &&
      process.env.SMS_ALERT_RECIPIENTS
  );

/**
 * Send an SMS alert message to all configured recipients.
 * @param {string} message - The alert message body to send.
 * @returns {Promise<{success: boolean, skipped: boolean}>}
 */
const sendAlertSMS = async (message) => {
  if (!hasTwilioConfig()) {
    console.log(
      `[SMS SERVICE] SMS provider not configured - skipping SMS: "${message}"`
    );
    return { success: false, skipped: true };
  }

  try {
    // Required lazily so the app doesn't need the `twilio` package
    // installed unless SMS is actually configured and used.
    const twilio = require("twilio");
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const recipients = process.env.SMS_ALERT_RECIPIENTS.split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      console.log("[SMS SERVICE] No SMS recipients configured - skipping SMS.");
      return { success: false, skipped: true };
    }

    await Promise.all(
      recipients.map((to) =>
        client.messages.create({
          body: message,
          from: process.env.TWILIO_FROM_NUMBER,
          to
        })
      )
    );

    return { success: true, skipped: false };
  } catch (error) {
    console.error("[SMS SERVICE ERROR]:", error.message);
    return { success: false, skipped: false };
  }
};

module.exports = { sendAlertSMS };