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
      position: relative !important;
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

  // Feature Discovery Engine: Curated steps across Admin, Leader, and Member pages
  function discoverAppFeatures() {
    var steps = [];
    var role = 'ADMIN';
    try {
      if (window.API && window.API.getUser) {
        var user = window.API.getUser();
        if (user && user.role) role = user.role.toUpperCase();
      }
    } catch(e) {}

    // ── ADMIN PAGE TOUR STEPS ──
    if (role === 'ADMIN' || document.getElementById('ssSearch')) {
      // 1. Dashboard Overview Stats
      var adminStat = document.querySelector('.stat-card, .cards-row > div');
      if (adminStat) {
        steps.push({
          type: 'modal-feature',
          selector: adminStat,
          title: 'System Realtime Analytics 📊',
          badge: 'Executive Dashboard',
          description: 'Tracks total alumni records, pending updates, draft saves, completed verifications, and active team member performance live.'
        });
      }

      // 2. Global Universal Search
      var searchInput = document.getElementById('ssSearch') || document.getElementById('globalSearchInput');
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

      // 3. Advanced Filter Button
      var filterBtn = document.getElementById('ssFilterBtnWrap') || document.querySelector('button[onclick*="FilterModal"]');
      if (filterBtn) {
        steps.push({
          type: 'modal-feature',
          selector: filterBtn,
          title: 'Multi-Criteria Dataset Filters 🎛️',
          badge: 'Smart Filtering',
          description: 'Filter working datasets by Team Leader, Team Member, Department, Batch, or Status. Watch the live filter overlay in action!',
          demo: function () {
            var mId = document.getElementById('ssFilterModal') ? 'ssFilterModal' : 'dashboardFilterModal';
            if (window.openModal) window.openModal(mId);
            setTimeout(function () { if (window.closeModal) window.closeModal(mId); }, 2000);
          }
        });
      }

      // 4. Assign New Alumni Datasets
      var assignNewBtn = document.querySelector('button[onclick*="assignAlumniModal"]');
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

      // 5. Reassign Modal & History Audit
      var reassignBtn = document.querySelector('button[onclick*="openReassignModal"]');
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

      // 6. Database Health Diagnostics
      var dbHealthBtn = document.querySelector('button[onclick*="openDbHealthModal"]');
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

      // 7. Customizable Export & Download
      var exportBtn = document.querySelector('button[onclick*="openExportCustomizationModal"]');
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

      // 8. Audit Logs Navigation Tab
      var auditTab = document.querySelector('a[data-section="audit"]');
      if (auditTab) {
        steps.push({
          type: 'modal-feature',
          selector: auditTab,
          title: 'System Activity & Audit Logs 📜',
          badge: 'Security & Compliance',
          description: 'Review login activities, user updates, role changes, and assignment history with single-click modal filters.'
        });
      }
    }

    // ── LEADER PAGE TOUR STEPS ──
    if (role === 'LEADER' || document.getElementById('distributeModalOverlay')) {
      // 1. Leader Request Details (n8n Email Campaign)
      var emailCampBtn = document.querySelector('button[onclick*="openEmailCampaignModal"]');
      if (emailCampBtn) {
        steps.push({
          type: 'modal-feature',
          selector: emailCampBtn,
          title: 'Request Details via n8n Automation 📧',
          badge: 'Email Campaign',
          description: 'Triggers bulk email requests to alumni with trackable Plus-Addressing headers to capture responses automatically.',
          demo: function () {
            if (window.openEmailCampaignModal) window.openEmailCampaignModal();
            setTimeout(function () { if (window.closeModal) window.closeModal('emailCampaignModal'); }, 2200);
          }
        });
      }

      // 2. Circulate / Faculty-Wise Distribution
      var distributeBtn = document.querySelector('button[onclick*="openCirculateModal"]') || document.querySelector('button[onclick*="openDistributeModal"]');
      if (distributeBtn) {
        steps.push({
          type: 'modal-feature',
          selector: distributeBtn,
          title: 'Faculty-Wise Team Distribution 👥',
          badge: 'Team Leader Allocation',
          description: 'Distribute unassigned team alumni to faculty members evenly or by custom proportions with preview steps.',
          demo: function () {
            if (window.openModal) window.openModal('circulateModal');
            setTimeout(function () { if (window.closeModal) window.closeModal('circulateModal'); }, 2200);
          }
        });
      }

      // 3. Leader Reassign Modal
      var leaderReassignBtn = document.querySelector('button[onclick*="openLeaderReassignModal"]');
      if (leaderReassignBtn) {
        steps.push({
          type: 'modal-feature',
          selector: leaderReassignBtn,
          title: 'Team Workload Rebalancing 🔄',
          badge: 'Team Leadership',
          description: 'Shift pending records between team members instantly to prevent bottlenecks and equalize progress.',
          demo: function () {
            if (window.openModal) window.openModal('leaderReassignModal');
            setTimeout(function () { if (window.closeModal) window.closeModal('leaderReassignModal'); }, 2000);
          }
        });
      }
    }

    // ── MEMBER PAGE TOUR STEPS ──
    if (role === 'MEMBER' || document.getElementById('recordsBody') || document.getElementById('memberName')) {
      // 1. Member Analytics & Stat Cards
      var memberStat = document.querySelector('.stat-card') || document.querySelector('.cards-row');
      if (memberStat) {
        steps.push({
          type: 'modal-feature',
          selector: memberStat,
          title: 'Personal Progress & Workload Stats 📈',
          badge: 'Member Analytics',
          description: 'Track assigned alumni records, completed updates, drafts, and daily targets live in real-time.'
        });
      }

      // 2. Alumni Replies Inbox
      var repliesNav = document.querySelector('[data-page="replies"]') || document.querySelector('button[onclick*="openAlumniRepliesModal"]') || document.querySelector('a[data-page="replies"]');
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

      // 3. Today's Tasks Modal
      var todayTasksBtn = document.querySelector('button[onclick*="openTodayTasksModal"]');
      if (todayTasksBtn) {
        steps.push({
          type: 'modal-feature',
          selector: todayTasksBtn,
          title: 'Today\'s Task List & Daily Checklist 📋',
          badge: 'Daily Planner',
          description: 'Review today\'s assigned targets, auto-generated task summary, and remaining alumni verifications.',
          demo: function () {
            if (window.openTodayTasksModal) window.openTodayTasksModal();
            setTimeout(function () { if (window.closeModal) window.closeModal('todayTasksModal'); }, 2200);
          }
        });
      }

      // 4. Member Assigned List & Edit Profile
      var updateBtn = document.querySelector('.btn-update') || document.querySelector('.update-alumni-btn') || document.querySelector('button[onclick*="openUpdateModal"]');
      if (updateBtn) {
        steps.push({
          type: 'modal-feature',
          selector: updateBtn,
          title: 'Alumni Information Update Form ✏️',
          badge: 'Data Verification',
          description: 'Verify and fill company, designation, city, secondary phone/email, and social links with Save Draft support.',
          demo: function () {
            try { updateBtn.click(); } catch(e) {}
            setTimeout(function () {
              var m = document.getElementById('updateAlumniModal') || document.getElementById('updateModal');
              if (m && window.closeModal) window.closeModal(m.id);
            }, 2400);
          }
        });
      }

      // 5. Spreadsheet Sheet View Nav
      var previewNav = document.querySelector('[data-page="preview"]');
      if (previewNav) {
        steps.push({
          type: 'modal-feature',
          selector: previewNav,
          title: 'Full-Screen Spreadsheet View 📊',
          badge: 'Data Grid',
          description: 'Switch to a full-screen interactive spreadsheet grid to view all assigned fields across alumni in a clean tabular view.'
        });
      }

      // 6. Dataset Filtering
      var filterBtn = document.querySelector('button[onclick*="openFilterModal"]');
      if (filterBtn) {
        steps.push({
          type: 'modal-feature',
          selector: filterBtn,
          title: 'Advanced Record Filtering 🎛️',
          badge: 'Dataset Filter',
          description: 'Filter your assigned list by Department, Batch, Verification Status, or Date range.',
          demo: function () {
            if (window.openFilterModal) window.openFilterModal();
            setTimeout(function () { if (window.closeFilterModal) window.closeFilterModal(); }, 2000);
          }
        });
      }

      // 7. Custom Column Exporter
      var memberExportBtn = document.querySelector('button[onclick*="openExportCustomizationModal"]') || document.querySelector('button[onclick*="handleExport"]');
      if (memberExportBtn) {
        steps.push({
          type: 'modal-feature',
          selector: memberExportBtn,
          title: 'Custom Column CSV Exporter 📤',
          badge: 'Data Export',
          description: 'Select exact fields to export and download your assigned alumni records as a formatted CSV file.',
          demo: function () {
            if (window.openExportCustomizationModal) window.openExportCustomizationModal();
            setTimeout(function () { if (window.closeModal) window.closeModal('exportCustomizationModal'); }, 2000);
          }
        });
      }
    }

    // ── UNIVERSAL TOOLBAR FEATURES ──
    // Theme Switcher
    var themeBtn = document.getElementById('themeToggle') || document.querySelector('button[id*="theme"]');
    if (themeBtn) {
      steps.push({
        type: 'modal-feature',
        selector: themeBtn,
        title: 'Butter-Smooth Dark Mode 🌙',
        badge: 'Theme Switcher',
        description: 'Switch between light and sleek dark mode themes effortlessly with zero latency.',
        demo: function () {
          themeBtn.click();
          setTimeout(function () { themeBtn.click(); }, 1200);
        }
      });
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
      if (!el || el.offsetParent === null) {
        // Skip missing or hidden element automatically
        renderStep(index + 1);
        return;
      }

      // Scroll into view smoothly
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      el.classList.add('tour-spotlight-active');
      currentHighlightedEl = el;

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
    if (window.Toast) window.Toast.success('Tour Finished! 🎉', 'You are ready to manage alumni details efficiently!');
  };

})();
