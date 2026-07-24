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
    .tour-spotlight-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(2px);
      z-index: 99980;
      pointer-events: auto;
      transition: opacity 0.3s ease;
    }
    .tour-spotlight-active {
      position: relative !important;
      z-index: 99995 !important;
      box-shadow: 0 0 0 4px #3B82F6, 0 0 25px rgba(59, 130, 246, 0.8) !important;
      border-radius: 8px;
      transition: all 0.3s ease !important;
      animation: tourPulse 2s infinite ease-in-out !important;
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
    body.dark-mode .tour-tooltip-badge {
      background: rgba(37, 99, 235, 0.25) !important;
      color: #60A5FA !important;
    }
  `;
  document.head.appendChild(tourStyle);

  var activeTourSteps = [];
  var currentStepIndex = 0;
  var spotlightBackdrop = null;
  var tooltipCard = null;
  var currentHighlightedEl = null;

  // Feature Discovery Engine: Scans DOM & Role context
  function discoverAppFeatures() {
    var steps = [];
    var role = 'ADMIN';
    if (window.API && window.API.getUser) {
      var user = window.API.getUser();
      if (user && user.role) role = user.role.toUpperCase();
    }

    // 1. Sidebar Navigation
    var sidebarItems = document.querySelectorAll('.sidebar-item, .sidebar-nav a');
    sidebarItems.forEach(function (item) {
      var text = (item.textContent || '').trim();
      var page = item.getAttribute('data-page') || item.getAttribute('data-section');
      if (text && page && page !== 'logout') {
        steps.push({
          type: 'navigation',
          selector: item,
          action: function () { item.click(); },
          title: `Navigate: ${text}`,
          badge: 'Navigation Menu',
          description: `Access your ${text} workspace. Switches active view dynamically.`
        });
      }
    });

    // 2. Stat / Overview Cards
    var statCards = document.querySelectorAll('.stat-card, .cards-row > div');
    if (statCards.length > 0) {
      steps.push({
        type: 'card',
        selector: statCards[0],
        title: 'Realtime Metrics & Stats',
        badge: 'Analytics Engine',
        description: 'Monitors assigned alumni metrics, pending updates, drafts, and completion progress live.'
      });
    }

    // 3. Search Bar
    var searchInput = document.getElementById('ssSearch') || document.getElementById('tableSearch') || document.getElementById('globalSearchInput');
    if (searchInput) {
      steps.push({
        type: 'interactive',
        selector: searchInput.closest('.search-bar') || searchInput,
        title: 'Instant Global Search',
        badge: 'Intelligent Search',
        description: 'Type any name, register number, department or company to filter records instantly across all columns.',
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

    // 4. Filters Button
    var filterBtn = document.getElementById('ssFilterBtnWrap') || document.querySelector('button[onclick*="FilterModal"]');
    if (filterBtn) {
      steps.push({
        type: 'interactive',
        selector: filterBtn,
        title: 'Advanced Data Filters',
        badge: 'Smart Filtering',
        description: 'Filter records by Leader, Member, Department, Batch, or Status. A pulsing dot alerts you when filters are active! 🔴'
      });
    }

    // 5. Fetch Data Button (Realtime DB Sync)
    var fetchBtn = document.querySelector('button[onclick*="fetchRealtimeDatabaseData"]');
    if (fetchBtn) {
      steps.push({
        type: 'action',
        selector: fetchBtn,
        title: 'Fetch Realtime Data ⚡',
        badge: 'Database Sync',
        description: 'Pulls the latest live records directly from SQL Server with dynamic progress animations.'
      });
    }

    // 6. Today's Tasks Button
    var taskBtn = document.querySelector('button[onclick*="openTodayTasksModal"]');
    if (taskBtn) {
      steps.push({
        type: 'action',
        selector: taskBtn,
        title: "Today's Work Summary 📋",
        badge: 'Personal Assistant',
        description: 'Auto-generates daily checklists based on pending assignments, drafts, and reopened records.'
      });
    }

    // 7. Theme Toggle
    var themeBtn = document.getElementById('themeToggle') || document.querySelector('button[id*="theme"]');
    if (themeBtn) {
      steps.push({
        type: 'interactive',
        selector: themeBtn,
        title: 'Butter-Smooth Dark Mode 🌙',
        badge: 'Theme Switcher',
        description: 'Switch between light and sleek dark modes effortlessly with zero lag and optimized contrast.',
        demo: function () {
          themeBtn.click();
          setTimeout(function () { themeBtn.click(); }, 1200);
        }
      });
    }

    // 8. View Modal Feature Guide
    var viewBtn = document.querySelector('.btn-secondary.btn-sm[onclick*="viewAlumniDetails"]') || document.querySelector('button[title="View Details"]');
    if (viewBtn) {
      steps.push({
        type: 'modal-feature',
        selector: viewBtn,
        title: 'Alumni Profile Preview Modal',
        badge: 'Detailed View',
        description: 'Opens complete alumni profile including father name, date of birth, social profile link (with auto Facebook/LinkedIn icon detection) and audit trail.'
      });
    }

    // 9. Update Record Modal Feature Guide (Member/Leader)
    var updateBtn = document.querySelector('.update-alumni-btn') || document.querySelector('button[onclick*="openUpdateModal"]') || document.querySelector('button[onclick*="editAlumniRecord"]');
    if (updateBtn) {
      steps.push({
        type: 'modal-feature',
        selector: updateBtn,
        title: 'Alumni Information Update Form',
        badge: 'Data Verification',
        description: 'Update verified alumni details (father name, email, phone, company, designation, city, state, LinkedIn/Facebook profile). Supports Save Draft & Submit.'
      });
    }

    // 10. Export Customization Modal Feature Guide (Admin/Leader)
    var exportBtn = document.querySelector('button[onclick*="openExportCustomizationModal"]');
    if (exportBtn) {
      steps.push({
        type: 'modal-feature',
        selector: exportBtn,
        title: 'Customizable Export & Download',
        badge: 'Data Export',
        description: 'Opens export customization modal to select specific columns, filter matched records, and download Excel/CSV reports cleanly.'
      });
    }

    // 11. Database Health Check Feature Guide (Admin)
    var dbHealthBtn = document.querySelector('button[onclick*="openDbHealthModal"]');
    if (dbHealthBtn) {
      steps.push({
        type: 'modal-feature',
        selector: dbHealthBtn,
        title: 'Database Health Diagnostics',
        badge: 'Quality Control',
        description: 'Monitors database completion rate, missing field breakdown (including father name), and sends automated notifications to assignees.'
      });
    }

    // 12. Role-Specific Extensions
    if (role === 'LEADER') {
      var reassignBtn = document.querySelector('button[onclick*="openReassignModal"]') || document.querySelector('button[onclick*="openCirculateModal"]');
      if (reassignBtn) {
        steps.push({
          type: 'role',
          selector: reassignBtn,
          title: 'Member Distribution & Circulate',
          badge: 'Team Leader Feature',
          description: 'Distribute or reassign alumni records across team members manually or auto-evenly with sleek minimal modals.'
        });
      }
    }

    return steps;
  }

  // Create Backdrop & Tooltip DOM elements
  function initSpotlightDOM() {
    if (!spotlightBackdrop) {
      spotlightBackdrop = document.createElement('div');
      spotlightBackdrop.className = 'tour-spotlight-backdrop';
      document.body.appendChild(spotlightBackdrop);
    }
    if (!tooltipCard) {
      tooltipCard = document.createElement('div');
      tooltipCard.className = 'tour-tooltip-card';
      document.body.appendChild(tooltipCard);
    }
  }

  function clearSpotlight() {
    if (currentHighlightedEl) {
      currentHighlightedEl.classList.remove('tour-spotlight-active');
      currentHighlightedEl = null;
    }
    if (spotlightBackdrop) spotlightBackdrop.style.display = 'none';
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

      spotlightBackdrop.style.display = 'block';

      // Position tooltip near target element
      var rect = el.getBoundingClientRect();
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
          <span style="font-size:0.75rem;color:#64748B;font-weight:600;">Step ${index + 1} of ${activeTourSteps.length}</span>
        </div>
        <h4 style="margin:4px 0 8px;font-size:1.1rem;font-weight:700;">${step.title}</h4>
        <p style="font-size:0.85rem;color:var(--text-secondary,#64748B);margin:0 0 16px;line-height:1.5;">${step.description}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #E2E8F0;padding-top:14px;margin-top:12px;">
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
