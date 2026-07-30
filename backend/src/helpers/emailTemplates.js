/**
 * Mount Zion College of Engineering and Technology
 * Official Email Templates Engine (Nodemailer)
 */

function getBaseUrl() {
  return process.env.AMS_BASE_URL || process.env.APP_URL || 'http://alumni.mzcet.in:2026';
}

function getLogoUrl() {
  if (process.env.EMAIL_LOGO_URL && process.env.EMAIL_LOGO_URL.trim() !== '') {
    return process.env.EMAIL_LOGO_URL.trim();
  }
  return `${getBaseUrl()}/assets/images/mzcet-logo.png`;
}

/**
 * Base HTML Layout Template
 */
function buildBaseEmail({ preheader, title, subtitle, contentHtml, ctaUrl, ctaText }) {
  const logoSrc = getLogoUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #F1F5F9; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased; }
    .container { max-width: 760px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 36px 32px 30px 32px; text-align: center; color: #ffffff; position: relative; }
    
    /* White Circle Badge Behind Logo */
    .logo-circle-wrapper { width: 90px; height: 90px; background-color: #ffffff; border-radius: 50%; margin: 0 auto 16px auto; padding: 10px; box-shadow: 0 8px 20px rgba(0,0,0,0.16); box-sizing: border-box; text-align: center; }
    .logo-img { width: 70px; height: 70px; max-width: 70px; max-height: 70px; object-fit: contain; display: inline-block; vertical-align: middle; }

    .badge { display: inline-block; background-color: rgba(255, 255, 255, 0.18); backdrop-filter: blur(4px); color: #F8FAFC; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25); }
    .header-title { font-size: 23px; font-weight: 800; margin: 0 0 6px 0; color: #ffffff; letter-spacing: -0.01em; }
    .header-subtitle { font-size: 14px; color: #E0E7FF; margin: 0; font-weight: 400; opacity: 0.95; }

    .body { padding: 40px 44px; color: #334155; line-height: 1.65; font-size: 15px; }
    .greeting { font-size: 20px; font-weight: 700; color: #0F172A; margin-bottom: 18px; }
    .card { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 5px solid #2563EB; border-radius: 10px; padding: 22px 24px; margin: 24px 0; }
    
    .cta-container { text-align: center; margin: 36px 0 12px 0; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 10px; box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35); transition: all 0.2s ease; }
    
    .footer { background-color: #0F172A; padding: 28px 32px; text-align: center; color: #94A3B8; font-size: 13px; line-height: 1.6; }
    .footer-link { color: #60A5FA; text-decoration: none; font-weight: 600; }
    
    @media only screen and (max-width: 600px) {
      .body { padding: 24px 20px !important; }
      .header { padding: 28px 16px !important; }
      .header-title { font-size: 19px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader || title}</div>
  <div class="container">
    <!-- Wide College Header -->
    <div class="header">
      <!-- White Circle Behind Logo (Larger Size + Link Wrapped to Prevent Download Overlay) -->
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
        <tr>
          <td align="center" valign="middle" style="width:115px;height:115px;background-color:#ffffff;border-radius:50%;text-align:center;vertical-align:middle;box-shadow:0 8px 22px rgba(0,0,0,0.2);padding:10px;">
            <a href="${getBaseUrl()}" target="_blank" style="text-decoration:none;display:inline-block;border:none;outline:none;">
              <img src="${logoSrc}" alt="Mount Zion Logo" width="92" height="92" style="width:92px;height:92px;max-width:92px;max-height:92px;object-fit:contain;display:block;margin:0 auto;border:0;outline:none;" />
            </a>
          </td>
        </tr>
      </table>

      <div><span class="badge">An Autonomous Institution</span></div>
      <h1 class="header-title">${title}</h1>
      <p class="header-subtitle">${subtitle || 'Mount Zion College of Engineering and Technology — Alumni Management System'}</p>
    </div>

    <!-- Wide Main Content -->
    <div class="body">
      ${contentHtml}

      ${ctaUrl ? `
      <div class="cta-container">
        <a href="${ctaUrl}" class="cta-btn">${ctaText || 'Access Portal'} &rarr;</a>
      </div>
      ` : ''}
    </div>

    <!-- Official Wide Footer -->
    <div class="footer">
      <p style="margin:0 0 6px 0;font-weight:700;color:#F8FAFC;font-size:14px;">Mount Zion College of Engineering and Technology</p>
      <p style="margin:0 0 12px 0;">Pudukkottai, Tamil Nadu - 622507 | Affiliated to Anna University</p>
      <p style="margin:0;">Need assistance? Contact <a href="mailto:alumnims@mountzion.ac.in" class="footer-link">alumnims@mountzion.ac.in</a></p>
      <p style="margin:14px 0 0 0;font-size:11px;color:#64748B;">&copy; ${new Date().getFullYear()} Alumni Management System (AMS). All rights reserved.</p>
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
  const loginUrl = portalUrl || getBaseUrl();
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
  const loginUrl = portalUrl || getBaseUrl();
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
  const loginUrl = portalUrl || getBaseUrl();
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
  const loginUrl = portalUrl || getBaseUrl();
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
  const loginUrl = portalUrl || getBaseUrl();
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
  const loginUrl = portalUrl || getBaseUrl();
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
  const loginUrl = portalUrl || getBaseUrl();
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
