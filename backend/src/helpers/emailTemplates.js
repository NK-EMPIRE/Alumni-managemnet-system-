/**
 * Mount Zion College of Engineering and Technology
 * Official Email Templates Engine (Nodemailer)
 */

const BASE_URL = process.env.AMS_BASE_URL || 'http://localhost:3000';
const LOGO_URL = 'https://mountzion.ac.in/wp-content/uploads/2021/04/mzcet-logo.png';

/**
 * Base HTML Layout Template
 */
function buildBaseEmail({ preheader, title, subtitle, contentHtml, ctaUrl, ctaText }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
    .logo { height: 75px; max-width: 220px; object-fit: contain; margin-bottom: 10px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
    .badge { display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #F8FAFC; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; }
    .header-title { font-size: 20px; font-weight: 700; margin: 0 0 4px 0; color: #ffffff; }
    .header-subtitle { font-size: 13px; color: #DBEAFE; margin: 0; font-weight: 400; }
    .body { padding: 32px 28px; color: #334155; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #1E293B; margin-bottom: 16px; }
    .card { background-color: #F1F5F9; border-left: 4px solid #2563EB; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #CBD5E1; }
    .cred-label { font-size: 13px; font-weight: 600; color: #64748B; }
    .cred-value { font-size: 14px; font-weight: 700; color: #1E293B; font-family: monospace; }
    .cta-container { text-align: center; margin: 30px 0 10px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #ffffff !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35); }
    .footer { background-color: #0F172A; padding: 24px; text-align: center; color: #94A3B8; font-size: 12px; line-height: 1.5; }
    .footer-link { color: #60A5FA; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader || title}</div>
  <div class="container">
    <!-- College Header -->
    <div class="header">
      <img class="logo" src="${LOGO_URL}" alt="Mount Zion College Logo" onerror="this.style.display='none'">
      <div><span class="badge">An Autonomous Institution</span></div>
      <h1 class="header-title">${title}</h1>
      <p class="header-subtitle">${subtitle || 'Mount Zion College of Engineering and Technology — Alumni Management System'}</p>
    </div>

    <!-- Main Content -->
    <div class="body">
      ${contentHtml}

      ${ctaUrl ? `
      <div class="cta-container">
        <a href="${ctaUrl}" class="cta-btn">${ctaText || 'Access Portal'} &rarr;</a>
      </div>
      ` : ''}
    </div>

    <!-- Official Footer -->
    <div class="footer">
      <p style="margin:0 0 6px 0;font-weight:700;color:#F8FAFC;">Mount Zion College of Engineering and Technology</p>
      <p style="margin:0 0 12px 0;">Pudukkottai, Tamil Nadu - 622507 | Affiliated to Anna University</p>
      <p style="margin:0;">Need assistance? Contact <a href="mailto:alumnims@mountzion.ac.in" class="footer-link">alumnims@mountzion.ac.in</a></p>
      <p style="margin:12px 0 0 0;font-size:11px;color:#64748B;">&copy; ${new Date().getFullYear()} Alumni Management System (AMS). All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 1. Leader Welcome Email Template
 */
function getLeaderWelcomeEmail({ name, email, plainPassword, portalUrl }) {
  const loginUrl = portalUrl || BASE_URL;
  const contentHtml = `
    <div class="greeting">Welcome aboard, ${name}! 👋</div>
    <p>You have been registered as a <strong>Team Leader</strong> in the <strong>Mount Zion Alumni Management System (AMS)</strong>.</p>
    <p>As a Team Leader, you can manage your allocated team members, review alumni assignment queues, distribute batch data, and oversee alumni engagement tasks.</p>

    <div class="card">
      <div style="font-size:14px;font-weight:700;color:#1E3A8A;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">🔑 Your Account Credentials</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Role:</td><td style="padding:6px 0;font-weight:700;color:#2563EB;">TEAM LEADER</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Username / Email:</td><td style="padding:6px 0;font-weight:700;color:#1E293B;">${email}</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Temporary Password:</td><td style="padding:6px 0;font-weight:700;color:#D97706;font-family:monospace;">${plainPassword}</td></tr>
      </table>
    </div>

    <p style="font-size:13px;color:#64748B;">Please log in to your dashboard to view your team members and start managing assigned alumni records.</p>
  `;

  return buildBaseEmail({
    preheader: `Welcome to AMS as Team Leader — Login Credentials inside`,
    title: `Welcome to AMS — Team Leader`,
    subtitle: `Mount Zion College of Engineering and Technology`,
    contentHtml,
    ctaUrl: loginUrl,
    ctaText: `Log In to Leader Dashboard`
  });
}

/**
 * 2. Member Welcome Email Template
 */
function getMemberWelcomeEmail({ name, email, plainPassword, leaderName, portalUrl }) {
  const loginUrl = portalUrl || BASE_URL;
  const contentHtml = `
    <div class="greeting">Welcome to the Team, ${name}! 🎉</div>
    <p>You have been welcomed to the <strong>Mount Zion Alumni Management System (AMS)</strong> as a <strong>Team Member</strong>.</p>
    ${leaderName ? `<p style="background:#EFF6FF;padding:10px 14px;border-radius:6px;color:#1E40AF;font-size:13px;"><strong>Team Leader:</strong> ${leaderName}</p>` : ''}
    <p>You can now log in to update alumni details, record job placements, verify higher education details, and coordinate with your Team Leader.</p>

    <div class="card">
      <div style="font-size:14px;font-weight:700;color:#1E3A8A;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">🔑 Your Login Credentials</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Role:</td><td style="padding:6px 0;font-weight:700;color:#10B981;">TEAM MEMBER</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Username / Email:</td><td style="padding:6px 0;font-weight:700;color:#1E293B;">${email}</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Temporary Password:</td><td style="padding:6px 0;font-weight:700;color:#D97706;font-family:monospace;">${plainPassword}</td></tr>
      </table>
    </div>

    <p style="font-size:13px;color:#64748B;">Click below to access your member dashboard.</p>
  `;

  return buildBaseEmail({
    preheader: `Welcome to AMS as Team Member — Login Credentials inside`,
    title: `Welcome to AMS — Team Member`,
    subtitle: `Mount Zion College of Engineering and Technology`,
    contentHtml,
    ctaUrl: loginUrl,
    ctaText: `Log In to Member Dashboard`
  });
}

/**
 * 3. Alumni Assigned to Leader Notification Email
 */
function getAlumniAssignedToLeaderEmail({ leaderName, totalCount, method, batch, portalUrl }) {
  const loginUrl = portalUrl || BASE_URL;
  const contentHtml = `
    <div class="greeting">Hello ${leaderName},</div>
    <p>The Administrator has assigned <strong>${totalCount} new alumni records</strong> to your team in AMS.</p>

    <div class="card">
      <div style="font-size:14px;font-weight:700;color:#1E3A8A;margin-bottom:12px;text-transform:uppercase;">📋 Assignment Summary</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Total Records:</td><td style="padding:6px 0;font-weight:700;color:#2563EB;">${totalCount} Records</td></tr>
        ${method ? `<tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Distribution Method:</td><td style="padding:6px 0;font-weight:600;color:#1E293B;">${method}</td></tr>` : ''}
        ${batch ? `<tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Batch:</td><td style="padding:6px 0;font-weight:600;color:#1E293B;">${batch}</td></tr>` : ''}
      </table>
    </div>

    <p>Please log in to your Leader Dashboard to distribute these alumni records among your team members.</p>
  `;

  return buildBaseEmail({
    preheader: `${totalCount} New Alumni Records Assigned to Your Team`,
    title: `New Alumni Records Assigned`,
    subtitle: `Admin Assignment Notification`,
    contentHtml,
    ctaUrl: loginUrl,
    ctaText: `Review & Distribute Records`
  });
}

/**
 * 4. Alumni Distributed to Member Notification Email
 */
function getAlumniDistributedToMemberEmail({ memberName, leaderName, count, portalUrl }) {
  const loginUrl = portalUrl || BASE_URL;
  const contentHtml = `
    <div class="greeting">Hello ${memberName},</div>
    <p>Your Team Leader <strong>${leaderName}</strong> has assigned <strong>${count} alumni records</strong> to your task queue.</p>

    <div class="card" style="border-left-color:#10B981;">
      <div style="font-size:14px;font-weight:700;color:#065F46;margin-bottom:8px;text-transform:uppercase;">📌 Workload Update</div>
      <p style="margin:0;font-size:15px;font-weight:700;color:#1E293B;">${count} Pending Alumni Records Assigned</p>
    </div>

    <p>Please review your assigned records, reach out to the alumni to collect updated job/higher studies information, and submit your entries on the portal.</p>
  `;

  return buildBaseEmail({
    preheader: `${count} New Alumni Records Assigned to You by ${leaderName}`,
    title: `New Task Assignment`,
    subtitle: `Team Workload Allocation`,
    contentHtml,
    ctaUrl: loginUrl,
    ctaText: `View My Assignments`
  });
}

/**
 * 5. Alumni Redistributed / Circulated Email
 */
function getAlumniRedistributedEmail({ memberName, sourceName, count, departmentFilter, portalUrl }) {
  const loginUrl = portalUrl || BASE_URL;
  const deptText = (departmentFilter && departmentFilter !== 'all') ? ` (${departmentFilter})` : '';
  const contentHtml = `
    <div class="greeting">Hello ${memberName},</div>
    <p>A workload redistribution has taken place. <strong>${count} alumni records</strong>${deptText} previously assigned to <strong>${sourceName}</strong> have been transferred to your queue.</p>

    <div class="card" style="border-left-color:#F59E0B;">
      <div style="font-size:14px;font-weight:700;color:#92400E;margin-bottom:8px;text-transform:uppercase;">🔄 Reassignment Details</div>
      <p style="margin:0;font-size:14px;color:#1E293B;"><strong>Transferred Count:</strong> ${count} Records</p>
      ${departmentFilter && departmentFilter !== 'all' ? `<p style="margin:4px 0 0 0;font-size:13px;color:#B45309;"><strong>Department:</strong> ${departmentFilter}</p>` : ''}
    </div>

    <p>Check your dashboard for updated assignment lists.</p>
  `;

  return buildBaseEmail({
    preheader: `${count} Alumni Records Transferred to Your Queue`,
    title: `Workload Reassigned`,
    subtitle: `Circulation & Workload Balancing`,
    contentHtml,
    ctaUrl: loginUrl,
    ctaText: `Go to My Dashboard`
  });
}

/**
 * 6. Password Reset Approved Email
 */
function getPasswordResetApprovedEmail({ name, email, tempPassword, portalUrl }) {
  const loginUrl = portalUrl || BASE_URL;
  const passwordToDisplay = tempPassword || 'mzcet@123';
  const contentHtml = `
    <div class="greeting">Hello ${name},</div>
    <p>Your password reset request has been processed and approved by the System Administrator.</p>

    <div class="card" style="border-left-color:#EF4444;">
      <div style="font-size:14px;font-weight:700;color:#991B1B;margin-bottom:12px;text-transform:uppercase;">🔒 Your Updated Login Details</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Email:</td><td style="padding:6px 0;font-weight:700;color:#1E293B;">${email}</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Reset Password:</td><td style="padding:6px 0;font-weight:700;color:#EF4444;font-family:monospace;font-size:16px;">${passwordToDisplay}</td></tr>
      </table>
    </div>

    <p style="font-size:13px;color:#64748B;">For security purposes, please change your password immediately after logging in.</p>
  `;

  return buildBaseEmail({
    preheader: `Your AMS Password Has Been Reset`,
    title: `Password Reset Approved`,
    subtitle: `Account Security Update`,
    contentHtml,
    ctaUrl: loginUrl,
    ctaText: `Log In Now`
  });
}

/**
 * 7. Alumni Record Reopened Email
 */
function getAlumniRecordReopenedEmail({ recipientName, alumniName, registerNo, department, reopenedBy, portalUrl }) {
  const loginUrl = portalUrl || BASE_URL;
  const contentHtml = `
    <div class="greeting">Hello ${recipientName},</div>
    <p>An alumni record has been <strong>reopened</strong> for re-verification by <strong>${reopenedBy || 'Leader/Admin'}</strong>.</p>

    <div class="card" style="border-left-color:#3B82F6;">
      <div style="font-size:14px;font-weight:700;color:#1E40AF;margin-bottom:12px;text-transform:uppercase;">📝 Record Details</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Alumni Name:</td><td style="padding:6px 0;font-weight:700;color:#1E293B;">${alumniName}</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Register No:</td><td style="padding:6px 0;font-weight:600;color:#64748B;">${registerNo || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Department:</td><td style="padding:6px 0;font-weight:600;color:#64748B;">${department || 'N/A'}</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;font-weight:600;">Status:</td><td style="padding:6px 0;font-weight:700;color:#F59E0B;">REOPENED (PENDING)</td></tr>
      </table>
    </div>

    <p>Please review and update the information for this record at your earliest convenience.</p>
  `;

  return buildBaseEmail({
    preheader: `Alumni Record ${alumniName} Reopened for Review`,
    title: `Record Reopened for Review`,
    subtitle: `Alumni Verification Alert`,
    contentHtml,
    ctaUrl: loginUrl,
    ctaText: `View Record`
  });
}

module.exports = {
  buildBaseEmail,
  getLeaderWelcomeEmail,
  getMemberWelcomeEmail,
  getAlumniAssignedToLeaderEmail,
  getAlumniDistributedToMemberEmail,
  getAlumniRedistributedEmail,
  getPasswordResetApprovedEmail,
  getAlumniRecordReopenedEmail
};
