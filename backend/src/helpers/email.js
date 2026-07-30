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

async function sendEmail({ to, subject, html, from }) {
  const { logger } = require('../utils/logger');
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPass || emailUser.trim() === '' || emailPass.trim() === '') {
    logger.info('[MOCK EMAIL] SMTP credentials not configured. Email simulated successfully.', { to, subject });
    return { messageId: `mock-${Date.now()}`, response: '250 Mock Email OK' };
  }

  try {
    const mailTransporter = getTransporter();
    const fromAddress = from || process.env.EMAIL_FROM || emailUser;
    logger.info('Attempting to send email...', { to, subject, from: fromAddress });
    const info = await mailTransporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html
    });
    logger.info('Email sent successfully', { messageId: info.messageId, response: info.response });
    return info;
  } catch (error) {
    logger.error('Failed to send email', { error: error.message, to, subject });
    return { error: error.message };
  }
}

async function sendPasswordResetEmail(email, temporaryPassword) {
  return sendEmail({
    to: email,
    subject: 'APIUMS - Password Reset',
    html: `Temporary Password: ${temporaryPassword}`
  });
}

async function sendAssignmentNotificationEmail(email, memberName, count, leaderName) {
  return sendEmail({
    to: email,
    subject: 'AlumniMS - New Alumni Records Assigned to You',
    html: `Notification for ${memberName}`
  });
}

module.exports = { sendEmail, sendPasswordResetEmail, sendAssignmentNotificationEmail };