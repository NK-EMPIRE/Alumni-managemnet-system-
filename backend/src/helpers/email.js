const nodemailer = require('nodemailer');
const emailTemplates = require('./emailTemplates');

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

  if (!to || !to.includes('@')) {
    logger.warn('Skipping email send: invalid recipient address', { to });
    return { error: 'Invalid recipient' };
  }

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

/** 1. Leader Welcome Email */
async function sendLeaderWelcomeEmail({ name, email, plainPassword }) {
  const html = emailTemplates.getLeaderWelcomeEmail({ name, email, plainPassword });
  return sendEmail({
    to: email,
    subject: 'Welcome to Mount Zion AMS — Team Leader Account Created',
    html
  });
}

/** 2. Member Welcome Email */
async function sendMemberWelcomeEmail({ name, email, plainPassword, leaderName }) {
  const html = emailTemplates.getMemberWelcomeEmail({ name, email, plainPassword, leaderName });
  return sendEmail({
    to: email,
    subject: 'Welcome to Mount Zion AMS — Team Member Account Created',
    html
  });
}

/** 3. Alumni Assigned to Leader Email */
async function sendAlumniAssignedToLeaderEmail({ email, leaderName, totalCount, method, batch }) {
  const html = emailTemplates.getAlumniAssignedToLeaderEmail({ leaderName, totalCount, method, batch });
  return sendEmail({
    to: email,
    subject: `[Mount Zion AMS] ${totalCount} New Alumni Records Assigned to Your Team`,
    html
  });
}

/** 4. Alumni Distributed to Member Email */
async function sendAlumniDistributedToMemberEmail({ email, memberName, leaderName, count }) {
  const html = emailTemplates.getAlumniDistributedToMemberEmail({ memberName, leaderName, count });
  return sendEmail({
    to: email,
    subject: `[Mount Zion AMS] ${count} Alumni Records Assigned to Your Queue`,
    html
  });
}

/** 5. Alumni Redistributed / Circulated Email */
async function sendAlumniRedistributedEmail({ email, memberName, sourceName, count, departmentFilter }) {
  const html = emailTemplates.getAlumniRedistributedEmail({ memberName, sourceName, count, departmentFilter });
  return sendEmail({
    to: email,
    subject: `[Mount Zion AMS] Workload Update: ${count} Alumni Records Transferred to You`,
    html
  });
}

/** 6. Password Reset Approved Email */
async function sendPasswordResetApprovedEmail({ email, name, tempPassword }) {
  const html = emailTemplates.getPasswordResetApprovedEmail({ name: name || 'User', email, tempPassword: tempPassword || 'mzcet@123' });
  return sendEmail({
    to: email,
    subject: 'Mount Zion AMS — Password Reset Approved',
    html
  });
}

/** Legacy Wrapper */
async function sendPasswordResetEmail(email, temporaryPassword) {
  return sendPasswordResetApprovedEmail({ email, tempPassword: temporaryPassword });
}

/** 7. Alumni Record Reopened Email */
async function sendAlumniRecordReopenedEmail({ email, recipientName, alumniName, registerNo, department, reopenedBy }) {
  const html = emailTemplates.getAlumniRecordReopenedEmail({ recipientName, alumniName, registerNo, department, reopenedBy });
  return sendEmail({
    to: email,
    subject: `[Mount Zion AMS] Record Reopened for Verification: ${alumniName}`,
    html
  });
}

module.exports = {
  sendEmail,
  sendLeaderWelcomeEmail,
  sendMemberWelcomeEmail,
  sendAlumniAssignedToLeaderEmail,
  sendAlumniDistributedToMemberEmail,
  sendAlumniRedistributedEmail,
  sendPasswordResetApprovedEmail,
  sendPasswordResetEmail,
  sendAlumniRecordReopenedEmail
};