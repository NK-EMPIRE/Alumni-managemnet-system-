const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  return transporter;
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    const { logger } = require('../utils/logger');
    logger.warn('Email not configured. Skipping email send.', { to, subject });
    return { messageId: 'not-configured' };
  }

  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: `"APIUMS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });

  return info;
}

async function sendPasswordResetEmail(email, temporaryPassword) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; padding: 24px; background: #f4f7fc;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #2563EB; margin: 0;">APIUMS</h2>
          <p style="color: #64748B; font-size: 14px;">Alumni Professional Information Update Management System</p>
        </div>
        <h3 style="color: #1E293B;">Password Reset</h3>
        <p style="color: #475569; line-height: 1.6;">Your password has been reset by the administrator.</p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0 0 8px;">Your temporary password:</p>
          <code style="font-size: 20px; font-weight: 700; color: #2563EB; letter-spacing: 2px;">${temporaryPassword}</code>
        </div>
        <p style="color: #EF4444; font-size: 13px;"><strong>Important:</strong> Please change this password immediately after logging in.</p>
        <p style="color: #64748B; font-size: 13px;">If you did not request this reset, please contact your system administrator.</p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">
        <p style="color: #94A3B8; font-size: 12px; text-align: center;">This is an automated message from APIUMS. Do not reply.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'APIUMS - Password Reset',
    html
  });
}

module.exports = { sendEmail, sendPasswordResetEmail };