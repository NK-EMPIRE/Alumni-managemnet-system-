/**
 * Intelligent Dynamic Product Tour System (SaaS Onboarding Assistant)
 * Auto-discovers UI elements, navigates, highlights with spotlight, and performs interactive demos.
 */

(function () {
  'use strict';

  // Inject Spotlight Overlay CSS
  var tourStyle = document.createElement('style');
  tourStyle.id = 'dynamic-tour-styles';
  tourStyle.innerHTML = `
    .tour-highlight-box {
      position: fixed;
      z-index: 99995;
      pointer-events: none;
      box-shadow: 0 0 0 4px #3B82F6, 0 0 35px rgba(59, 130, 246, 0.95);
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      animation: tourPulse 2s infinite ease-in-out;
    }
    .tour-spotlight-active {
      z-index: 99990 !important;
    }
    @keyframes tourPulse {
      0% { box-shadow: 0 0 0 4px #3B82F6, 0 0 15px rgba(59, 130, 246, 0.6); }
      50% { box-shadow: 0 0 0 8px #60A5FA, 0 0 30px rgba(96, 165, 250, 0.9); }
      100% { box-shadow: 0 0 0 4px #3B82F6, 0 0 15px rgba(59, 130, 246, 0.6); }
    }
    .tour-tooltip-card {
      position: fixed;
      z-index: 99999;
      background: #FFFFFF;
      color: #1E293B;
      border-radius: 16px;
      padding: 20px 24px;
      width: 380px;
      max-width: 90vw;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      border: 1px solid #E2E8F0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: 'Poppins', sans-serif;
    }
    body.dark-mode .tour-tooltip-card {
      background: #1E293B !important;
      color: #F8FAFC !important;
      border-color: #334155 !important;
    }
    .tour-tooltip-badge {
      display: inline-block;
      padding: 3px 10px;
      background: #EFF6FF;
      color: #2563EB;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    body.dark-mode .tour-tooltip-card {
      background: #1E293B !important;
      color: #F8FAFC !important;
      border-color: #334155 !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3) !important;
    }
    body.dark-mode .tour-tooltip-badge {
      background: rgba(37, 99, 235, 0.25) !important;
      color: #60A5FA !important;
    }
    body.dark-mode .tour-step-counter {
      color: #94A3B8 !important;
    }
    body.dark-mode .tour-tooltip-card h4 {
      color: #F8FAFC !important;
    }
    body.dark-mode .tour-tooltip-card p {
      color: #CBD5E1 !important;
    }
    body.dark-mode .tour-tooltip-footer {
      border-top-color: #334155 !important;
    }
    body.dark-mode #tourSkipBtn {
      color: #94A3B8 !important;
    }
    body.dark-mode #tourSkipBtn:hover {
      color: #F8FAFC !important;
    }
    body.dark-mode #tourBackStepBtn {
      background: #334155 !important;
      color: #F8FAFC !important;
      border: 1px solid #475569 !important;
    }
    body.dark-mode #tourBackStepBtn:hover {
      background: #475569 !important;
    }
  `;
  document.head.appendChild(tourStyle);

  var activeTourSteps = [];
  var currentStepIndex = 0;

  // Switch to a content section cleanly (hides all others so nothing overlaps)
  function goToSection(page) {
    if (typeof window.navigateTo === 'function') {
      var navItem = document.querySelector('.sidebar-item[data-section="' + page + '"]');
      try {
        window.navigateTo(page, navItem);
        return;
      } catch (e) {}
    }
    document.querySelectorAll('.content-section').forEach(function (s) {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    var target = document.getElementById('section-' + page);
    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
    }
    document.querySelectorAll('.sidebar-item, .nav-item').forEach(function (i) { i.classList.remove('active'); });
    var item = document.querySelector('.sidebar-item[data-section="' + page + '"]') ||
      document.querySelector('.sidebar-item[data-page="' + page + '"]') ||
      document.querySelector('.nav-item[data-page="' + page + '"]');
    if (item) item.classList.add('active');
  }

  // Feature Discovery Engine: Curated steps across Admin, Leader, and Member pages
  function discoverAppFeatures() {
    var steps = [];
    var role = 'ADMIN';
    try {
      if (window.API && window.API.getUser) {
        var user = window.API.getUser();
        if (user && user.role) role = user.role.toUpperCase();
      }
    } catch (e) {}

    if (document.getElementById('distributeModalBtn') || document.getElementById('navbarUserNameHeader')) {
      role = 'LEADER';
    } else if (document.getElementById('recordsBody') || document.getElementById('memberName')) {
      role = 'MEMBER';
    }

    function firstMatch(selectors) {
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el) return el;
      }
      return null;
    }

    // ── 1. ADMIN PAGE TOUR STEPS ──
    if (role === 'ADMIN' && document.querySelector('.stat-card')) {
      // 1. Executive Analytics
      var adminStat = document.querySelector('.stat-card');
      if (adminStat) {
        steps.push({
          type: 'modal-feature',
          selector: adminStat,
          title: 'System Realtime Analytics 📊',
          badge: 'Executive Dashboard',
          description: 'Track total alumni records, pending updates, draft saves, completed verifications, and active team member performance live.'
        });
      }

      // 2. Batch Alumni Assignment
      var assignNewBtn = firstMatch(['button[onclick*="assignAlumniModal"]']);
      if (assignNewBtn) {
        steps.push({
          type: 'modal-feature',
          selector: assignNewBtn,
          title: 'Batch Alumni Assignment ➕',
          badge: 'Admin Allocation',
          description: 'Assign batch & department datasets directly to Team Leaders with automatic round-robin workload balancing.',
          demo: function () {
            if (window.openModal) window.openModal('assignAlumniModal');
            setTimeout(function () { if (window.closeModal) window.closeModal('assignAlumniModal'); }, 2200);
          }
        });
      }

      // 3. Workload Reassignment
      var reassignBtn = firstMatch(['button[onclick*="openReassignModal"]']);
      if (reassignBtn) {
        steps.push({
          type: 'modal-feature',
          selector: reassignBtn,
          title: 'Workload Reassignment & Audit Log 🔄',
          badge: 'Workforce Optimization',
          description: 'Reallocate pending alumni between team members seamlessly with complete audit trail history logging.',
          demo: function () {
            if (window.openModal) window.openModal('reassignModal');
            setTimeout(function () { if (window.closeModal) window.closeModal('reassignModal'); }, 2200);
          }
        });
      }

      // 4. Database Health Diagnostics
      var dbHealthBtn = firstMatch(['button[onclick*="openDbHealthModal"]']);
      if (dbHealthBtn) {
        steps.push({
          type: 'modal-feature',
          selector: dbHealthBtn,
          title: 'Database Health & Field Quality 🩺',
          badge: 'Data Integrity',
          description: 'Monitors missing fields breakdown (Father Name, Email, DOB), completion rates, and notifies assignees automatically.',
          demo: function () {
            if (window.openModal) window.openModal('dbHealthModal');
            setTimeout(function () { if (window.closeModal) window.closeModal('dbHealthModal'); }, 2200);
          }
        });
      }

      // 5. Export Customization
      var exportBtn = firstMatch(['button[onclick*="openExportCustomizationModal"]']);
      if (exportBtn) {
        steps.push({
          type: 'modal-feature',
          selector: exportBtn,
          title: 'Customized Excel/CSV Export 📥',
          badge: 'Report Generator',
          description: 'Export specific columns and filtered records directly into formatted Excel spreadsheets or CSV reports.',
          demo: function () {
            if (window.openModal) window.openModal('exportCustomizationModal');
            setTimeout(function () { if (window.closeModal) window.closeModal('exportCustomizationModal'); }, 2200);
          }
        });
      }

      // 6. Nav: Alumni (View/Edit spreadsheet section)
      var alumniNav = document.querySelector('.sidebar-item[data-section="alumni"]');
      if (alumniNav) {
        steps.push({
          type: 'modal-feature',
          selector: alumniNav,
          title: 'Alumni Directory Navigation 📚',
          badge: 'Sidebar Navigation',
          description: 'Open the Alumni section to browse, search, edit and export every alumni record in a spreadsheet grid.',
          action: function () { goToSection('viewAlumni'); }
        });
      }

      // 7. Universal Intelligent Search
      var searchInput = document.getElementById('ssSearch');
      if (searchInput) {
        steps.push({
          type: 'modal-feature',
          selector: searchInput.closest('.search-bar') || searchInput,
          title: 'Universal Intelligent Search 🔍',
          badge: 'Search Engine',
          description: 'Instantly filters records by register number, name, department, batch, company, designation, or city with zero latency.',
          demo: function () {
            searchInput.value = 'CSE';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(function () {
              searchInput.value = '';
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }, 1200);
          }
        });
      }

      // 8. Multi-Criteria Dataset Filters
      var filterBtn = document.getElementById('ssFilterBtnWrap') || document.querySelector('button[onclick*="FilterModal"]');
      if (filterBtn) {
        steps.push({
          type: 'modal-feature',
          selector: filterBtn,
          title: 'Multi-Criteria Dataset Filters 🎛️',
          badge: 'Smart Filtering',
          description: 'Filter working datasets by Team Leader, Team Member, Department, Batch, or Status.'
        });
      }

      // 9. Nav: Assign Alumni
      var assignNav = document.querySelector('.sidebar-item[data-section="assignAlumni"]');
      if (assignNav) {
        steps.push({
          type: 'modal-feature',
          selector: assignNav,
          title: 'Assign Alumni Navigation ➕',
          badge: 'Sidebar Navigation',
          description: 'Navigate to Assign Alumni to allocate new batches to team leaders and members.',
          action: function () { goToSection('assignAlumni'); }
        });
      }

      // 10. Nav: Team Leaders
      var tlNav = document.querySelector('.sidebar-item[data-section="teamLeaders"]');
      if (tlNav) {
        steps.push({
          type: 'modal-feature',
          selector: tlNav,
          title: 'Team Leaders 👤',
          badge: 'Sidebar Navigation',
          description: 'Manage team leaders, add new leaders, and view their team performance.',
          action: function () { goToSection('teamLeaders'); }
        });
      }

      // 11. Nav: Team Members
      var tmNav = document.querySelector('.sidebar-item[data-section="teamMembers"]');
      if (tmNav) {
        steps.push({
          type: 'modal-feature',
          selector: tmNav,
          title: 'Team Members 👥',
          badge: 'Sidebar Navigation',
          description: 'Manage team members, assign them to leaders, and track their workloads.',
          action: function () { goToSection('teamMembers'); }
        });
      }

      // 12. Nav: Progress
      var progressNav = document.querySelector('.sidebar-item[data-section="progress"]');
      if (progressNav) {
        steps.push({
          type: 'modal-feature',
          selector: progressNav,
          title: 'Team Progress Watch 📈',
          badge: 'Sidebar Navigation',
          description: 'Track live progress of every team leader and member with completion analytics and date filters.',
          action: function () { goToSection('progress'); }
        });
      }

      // 13. Nav: Audit Logs
      var auditNav = document.querySelector('.sidebar-item[data-section="audit"]');
      if (auditNav) {
        steps.push({
          type: 'modal-feature',
          selector: auditNav,
          title: 'System Activity & Audit Logs 📜',
          badge: 'Security & Compliance',
          description: 'Review login activities, user updates, role changes, and assignment history with single-click modal filters.',
          action: function () { goToSection('audit'); }
        });
      }

      // 14. Nav: Settings
      var settingsNav = document.querySelector('.sidebar-item[data-section="settings"]');
      if (settingsNav) {
        steps.push({
          type: 'modal-feature',
          selector: settingsNav,
          title: 'Settings ⚙️',
          badge: 'Sidebar Navigation',
          description: 'Configure platform settings, user preferences, and master data from the Settings section.',
          action: function () { goToSection('settings'); }
        });
      }
    }

    // ── 2. LEADER PAGE TOUR STEPS ──
    if (role === 'LEADER' || document.getElementById('distributeModalBtn')) {
      // 1. Overview Cards
      var overviewCards = document.getElementById('overviewCards') || document.querySelector('#section-dashboard .card');
      if (overviewCards) {
        steps.push({
          type: 'modal-feature',
          selector: overviewCards,
          title: 'Team Overview & Distribution Stats 📊',
          badge: 'Leader Dashboard',
          description: 'View assigned records, completed verifications, and awaiting distribution counts for your team in real-time.'
        });
      }

      // 2. Distribute to Members
      var distBtn = document.getElementById('distributeModalBtn') || firstMatch(['button[onclick*="openDistributeModal"]', 'button[onclick*="distribute"]']);
      if (distBtn) {
        steps.push({
          type: 'modal-feature',
          selector: distBtn,
          title: 'Distribute Alumni to Team Members 🎯',
          badge: 'Department & Member Allocation',
          description: 'Distribute assigned alumni records to team members and the team leader using Department-Wise auto match, Round Robin, or custom splits with instant preview.',
          demo: function () {
            distBtn.click();
            setTimeout(function () {
              var overlay = document.getElementById('distributeModalOverlay');
              if (overlay) overlay.classList.remove('show');
            }, 2500);
          }
        });
      }

      // 3. Request Details via Email Campaign
      var emailCampBtn = firstMatch(['.quick-action-btn[onclick*="openEmailCampaignModal"]', 'button[onclick*="openEmailCampaignModal"]', 'a[data-page="campaign"]']);
      if (emailCampBtn) {
        steps.push({
          type: 'modal-feature',
          selector: emailCampBtn,
          title: 'Request Alumni Details (Email Campaign) 📧',
          badge: 'n8n Automation',
          description: 'Triggers automated detail request email campaigns to alumni with trackable Plus-Addressing headers to capture responses automatically.',
          demo: function () {
            if (window.openEmailCampaignModal) window.openEmailCampaignModal();
            setTimeout(function () { if (window.closeModal) window.closeModal('emailCampaignModal'); }, 2200);
          }
        });
      }

      // 4. Team Performance Tracker
      var memberTable = document.getElementById('memberTable') || document.querySelector('#section-dashboard .table');
      if (memberTable) {
        steps.push({
          type: 'modal-feature',
          selector: memberTable.closest('.card') || memberTable,
          title: 'Team Performance Tracker 👥',
          badge: 'Team Monitoring',
          description: 'Monitor each team member\'s assigned, completed, and pending records along with progress bars and last activity timestamps.'
        });
      }

      // 5. Completion Rate Charts
      var chartSec = null;
      var chartCanvas = document.querySelector('#section-dashboard canvas');
      if (chartCanvas) chartSec = chartCanvas.closest('.card');
      if (chartSec) {
        steps.push({
          type: 'modal-feature',
          selector: chartSec,
          title: 'Completion Rate Analytics 📈',
          badge: 'Visual Insights',
          description: 'Interactive charts rendering member completion rates and overall team status breakdown.'
        });
      }

      // 6. Nav: My Assignments
      var assignmentsNav = document.querySelector('.sidebar-item[data-page="assignments"]');
      if (assignmentsNav) {
        steps.push({
          type: 'modal-feature',
          selector: assignmentsNav,
          title: 'My Assignments Navigation 📋',
          badge: 'Sidebar Navigation',
          description: 'Open My Assignments to update alumni profiles assigned to you and track their verification status.',
          action: function () { goToSection('assignments'); }
        });
      }

      // 7. Nav: Alumni (Reports)
      var reportsNav = document.querySelector('.sidebar-item[data-page="reports"]');
      if (reportsNav) {
        steps.push({
          type: 'modal-feature',
          selector: reportsNav,
          title: 'Alumni Grid Navigation 📚',
          badge: 'Sidebar Navigation',
          description: 'Open the Alumni section to browse every team record in a spreadsheet grid with search and filters.',
          action: function () { goToSection('reports'); }
        });
      }

      // 8. Master Alumni Data Grid
      var spreadInput = document.getElementById('ssSearch');
      if (spreadInput) {
        var spreadCard = spreadInput.closest('.card') || spreadInput;
        steps.push({
          type: 'modal-feature',
          selector: spreadCard,
          title: 'Master Alumni Data Grid & Full Screen 📋',
          badge: 'Spreadsheet Grid',
          description: 'Browse all team alumni records in a full-screen tabular spreadsheet view with search, filter, column toggles, and CSV export.'
        });
      }

      // 9. Circulate / Redistribute Records
      var circulateBtn = firstMatch(['button[onclick*="openCirculateModal"]', 'button[onclick*="circulate"]']);
      if (circulateBtn) {
        steps.push({
          type: 'modal-feature',
          selector: circulateBtn,
          title: 'Redistribute / Circulate Records 🔄',
          badge: 'Workload Balancing',
          description: 'Redistribute pending records within your team members evenly to accelerate progress.'
        });
      }

      // 10. Nav: Settings
      var settingsNavL = document.querySelector('.sidebar-item[data-page="settings"]');
      if (settingsNavL) {
        steps.push({
          type: 'modal-feature',
          selector: settingsNavL,
          title: 'Settings ⚙️',
          badge: 'Sidebar Navigation',
          description: 'Configure your profile, notifications, and preferences from the Settings section.',
          action: function () { goToSection('settings'); }
        });
      }
    }

    // ── 3. MEMBER PAGE TOUR STEPS ──
    if (role === 'MEMBER' && document.getElementById('recordsBody')) {
      // 1. Personal Analytics Cards
      var memberStat = document.querySelector('.cards-row') || document.querySelector('.stat-card');
      if (memberStat) {
        steps.push({
          type: 'modal-feature',
          selector: memberStat,
          title: 'Personal Progress & Workload Stats 📈',
          badge: 'Member Dashboard',
          description: 'Track assigned alumni records, completed updates, drafts, and daily targets live in real-time.'
        });
      }

      // 2. Today's Task List
      var todayTasksBtn = firstMatch(['button[onclick*="openTodayTasksModal"]', 'button[onclick*="todayTasks"]']);
      if (todayTasksBtn) {
        steps.push({
          type: 'modal-feature',
          selector: todayTasksBtn,
          title: 'Today\'s Task List & Checklist 📋',
          badge: 'Daily Planner',
          description: 'Review today\'s assigned targets, auto-generated task summary, and remaining alumni verifications.',
          demo: function () {
            if (window.openTodayTasksModal) window.openTodayTasksModal();
            setTimeout(function () { if (window.closeModal) window.closeModal('todayTasksModal'); }, 2200);
          }
        });
      }

      // 3. Update Alumni Information
      var updateBtn = document.querySelector('.btn-update') || document.querySelector('#recordsBody');
      if (updateBtn) {
        steps.push({
          type: 'modal-feature',
          selector: updateBtn,
          title: 'Alumni Profile Verification & Update ✏️',
          badge: 'Data Verification',
          description: 'Verify and update company, designation, city, secondary phone/email, and social links with Save Draft support.'
        });
      }

      // 4. Nav: Preview Sheet
      var previewNav = document.querySelector('.nav-item[data-page="preview"]');
      if (previewNav) {
        steps.push({
          type: 'modal-feature',
          selector: previewNav,
          title: 'Preview Sheet Navigation 📊',
          badge: 'Sidebar Navigation',
          description: 'Switch to the full-screen interactive spreadsheet grid to view all assigned fields across alumni in a clean tabular view.'
        });
      }

      // 5. Nav: Alumni Replies
      var repliesNav = document.querySelector('.nav-item[data-page="replies"]') || firstMatch(['button[onclick*="openAlumniRepliesModal"]', 'a[data-page="replies"]']);
      if (repliesNav) {
        steps.push({
          type: 'modal-feature',
          selector: repliesNav,
          title: 'Alumni Email Replies Inbox 📥',
          badge: 'Communication Hub',
          description: 'View incoming emails from alumni detail requests and review details safely before updating profiles.',
          demo: function () {
            if (window.openAlumniRepliesModal) window.openAlumniRepliesModal();
            setTimeout(function () { if (window.closeModal) window.closeModal('alumniRepliesModal'); }, 2400);
          }
        });
      }

      // 6. Nav: Settings
      var settingsNavM = document.querySelector('.nav-item[data-page="settings"]');
      if (settingsNavM) {
        steps.push({
          type: 'modal-feature',
          selector: settingsNavM,
          title: 'Settings ⚙️',
          badge: 'Sidebar Navigation',
          description: 'Configure your profile, notifications, and preferences from the Settings section.'
        });
      }
    }

    return steps;
  }

  var cutoutTop = null;
  var cutoutBottom = null;
  var cutoutLeft = null;
  var cutoutRight = null;
  var highlightBox = null;
  var tooltipCard = null;
  var currentHighlightedEl = null;

  function createCutoutPanel(className) {
    var panel = document.createElement('div');
    panel.className = className;
    panel.style.cssText = 'position:fixed;background:rgba(15,23,42,0.75);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);pointer-events:none;z-index:99980;display:none;';
    document.body.appendChild(panel);
    return panel;
  }

  function initSpotlightDOM() {
    if (!cutoutTop) { cutoutTop = createCutoutPanel('tour-cutout-top'); }
    if (!cutoutBottom) { cutoutBottom = createCutoutPanel('tour-cutout-bottom'); }
    if (!cutoutLeft) { cutoutLeft = createCutoutPanel('tour-cutout-left'); }
    if (!cutoutRight) { cutoutRight = createCutoutPanel('tour-cutout-right'); }
    if (!highlightBox) {
      highlightBox = document.createElement('div');
      highlightBox.className = 'tour-highlight-box';
      highlightBox.style.cssText = 'position:fixed;z-index:99995;pointer-events:none;border-radius:8px;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);animation:tourPulse 2s infinite ease-in-out;display:none;';
      document.body.appendChild(highlightBox);
    }
    if (!tooltipCard) {
      tooltipCard = document.createElement('div');
      tooltipCard.className = 'tour-tooltip-card';
      document.body.appendChild(tooltipCard);
    }
  }

  function positionCutout(rect) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var pad = 8;
    var t = Math.max(0, rect.top - pad);
    var b = Math.min(vh, rect.bottom + pad);
    var l = Math.max(0, rect.left - pad);
    var r = Math.min(vw, rect.right + pad);
    // top panel
    cutoutTop.style.cssText = 'position:fixed;top:0;left:0;width:' + vw + 'px;height:' + t + 'px;background:rgba(15,23,42,0.75);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);pointer-events:none;z-index:99980;display:block;';
    // bottom panel
    cutoutBottom.style.cssText = 'position:fixed;top:' + b + 'px;left:0;width:' + vw + 'px;height:' + (vh - b) + 'px;background:rgba(15,23,42,0.75);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);pointer-events:none;z-index:99980;display:block;';
    // left panel (between top and bottom, left of target)
    cutoutLeft.style.cssText = 'position:fixed;top:' + t + 'px;left:0;width:' + l + 'px;height:' + (b - t) + 'px;background:rgba(15,23,42,0.75);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);pointer-events:none;z-index:99980;display:block;';
    // right panel (between top and bottom, right of target)
    cutoutRight.style.cssText = 'position:fixed;top:' + t + 'px;left:' + r + 'px;width:' + (vw - r) + 'px;height:' + (b - t) + 'px;background:rgba(15,23,42,0.75);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);pointer-events:none;z-index:99980;display:block;';
  }

  function clearSpotlight() {
    if (currentHighlightedEl) {
      currentHighlightedEl.classList.remove('tour-spotlight-active');
      currentHighlightedEl = null;
    }
    if (cutoutTop) cutoutTop.style.display = 'none';
    if (cutoutBottom) cutoutBottom.style.display = 'none';
    if (cutoutLeft) cutoutLeft.style.display = 'none';
    if (cutoutRight) cutoutRight.style.display = 'none';
    if (highlightBox) highlightBox.style.display = 'none';
    if (tooltipCard) tooltipCard.style.display = 'none';
  }

  function renderStep(index) {
    if (index < 0 || index >= activeTourSteps.length) {
      window.stopInteractiveTour();
      return;
    }

    currentStepIndex = index;
    var step = activeTourSteps[index];

    clearSpotlight();
    initSpotlightDOM();

    if (step.action && typeof step.action === 'function') {
      try { step.action(); } catch (e) {}
    }

    setTimeout(function () {
      var el = typeof step.selector === 'string' ? document.querySelector(step.selector) : step.selector;
      if (!el || el.getClientRects().length === 0) {
        // Skip missing or hidden element automatically
        renderStep(index + 1);
        return;
      }

      // Scroll into view smoothly
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      el.classList.add('tour-spotlight-active');
      currentHighlightedEl = el;

      function applyPosition() {
        var rect = el.getBoundingClientRect();

        // Position 4-side cutout panels around the target
        positionCutout(rect);

        // Position glowing highlight ring directly around element
        highlightBox.style.top = (rect.top - 4) + 'px';
        highlightBox.style.left = (rect.left - 4) + 'px';
        highlightBox.style.width = (rect.width + 8) + 'px';
        highlightBox.style.height = (rect.height + 8) + 'px';
        highlightBox.style.display = 'block';

        // Position tooltip near target element
        var tooltipTop = rect.bottom + 16;
        var tooltipLeft = Math.max(16, rect.left + (rect.width / 2) - 190);

        if (tooltipTop + 220 > window.innerHeight) {
          tooltipTop = Math.max(16, rect.top - 230);
        }
        if (tooltipLeft + 380 > window.innerWidth) {
          tooltipLeft = window.innerWidth - 396;
        }

        tooltipCard.style.top = tooltipTop + 'px';
        tooltipCard.style.left = tooltipLeft + 'px';
        tooltipCard.style.display = 'block';
      }

      // Wait for the smooth scroll to settle before measuring so the highlight stays aligned
      var startedAt = Date.now();
      (function waitForStableScroll() {
        var r1 = el.getBoundingClientRect().top;
        setTimeout(function () {
          var r2 = el.getBoundingClientRect().top;
          if (Math.abs(r1 - r2) > 1 && Date.now() - startedAt < 700) {
            waitForStableScroll();
          } else {
            applyPosition();
          }
        }, 80);
      })();

      tooltipCard.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="tour-tooltip-badge">${step.badge || 'Feature Guide'}</span>
          <span class="tour-step-counter" style="font-size:0.75rem;color:#64748B;font-weight:600;">Step ${index + 1} of ${activeTourSteps.length}</span>
        </div>
        <h4 style="margin:4px 0 8px;font-size:1.1rem;font-weight:700;">${step.title}</h4>
        <p style="font-size:0.85rem;color:var(--text-secondary,#64748B);margin:0 0 16px;line-height:1.5;">${step.description}</p>
        <div class="tour-tooltip-footer" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #E2E8F0;padding-top:14px;margin-top:12px;">
          <button id="tourSkipBtn" style="background:none;border:none;color:#64748B;font-size:0.8rem;cursor:pointer;font-weight:600;">Skip Tour</button>
          <div style="display:flex;gap:8px;">
            ${index > 0 ? '<button id="tourBackStepBtn" style="padding:6px 12px;background:#E2E8F0;color:#1E293B;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;">Back</button>' : ''}
            <button id="tourNextStepBtn" style="padding:6px 16px;background:#2563EB;color:#FFF;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;">
              ${index === activeTourSteps.length - 1 ? 'Finish Tour 🎉' : 'Next <i class="fas fa-arrow-right" style="margin-left:4px;"></i>'}
            </button>
          </div>
        </div>
      `;

      document.getElementById('tourSkipBtn').onclick = function () { window.stopInteractiveTour(); };
      if (document.getElementById('tourBackStepBtn')) {
        document.getElementById('tourBackStepBtn').onclick = function () { renderStep(index - 1); };
      }
      document.getElementById('tourNextStepBtn').onclick = function () { renderStep(index + 1); };

      // Trigger interactive demo if present
      if (step.demo && typeof step.demo === 'function') {
        try { step.demo(); } catch (e) {}
      }
    }, 400);
  }

  window.startIntelligentProductTour = function () {
    activeTourSteps = discoverAppFeatures();
    if (activeTourSteps.length === 0) {
      if (window.Toast) window.Toast.info('Tour Complete', 'All features explored!');
      return;
    }
    renderStep(0);
  };

  window.stopInteractiveTour = function () {
    clearSpotlight();
    localStorage.setItem('alumni_tour_dismissed', 'true');
    // Return the page to the dashboard after the tour
    try {
      if (document.querySelector('.sidebar-item[data-section="dashboard"]') || document.querySelector('.sidebar-item[data-page="dashboard"]') || document.querySelector('.nav-item[data-page="dashboard"]')) {
        goToSection('dashboard');
      }
    } catch (e) {}
    if (window.Toast) window.Toast.success('Tour Finished! 🎉', 'You are ready to manage alumni details efficiently!');
  };

})();
