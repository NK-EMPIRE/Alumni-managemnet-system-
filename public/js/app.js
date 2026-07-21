(function () {
  'use strict';

  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const pageWrapper = document.querySelector('.page-wrapper');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      if (window.innerWidth < 1024) {
        if (sidebar) sidebar.classList.toggle('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('show');
      } else {
        document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebar_collapsed', document.body.classList.contains('sidebar-collapsed'));
      }
    });
  }

  if (localStorage.getItem('sidebar_collapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function () {
      sidebar.classList.add('mobile-open');
      sidebarOverlay.classList.add('show');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function () {
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('show');
    });
  }

  document.addEventListener('click', function (e) {
    var dropdown = e.target.closest('.dropdown');
    if (!dropdown) {
      document.querySelectorAll('.dropdown-menu.show').forEach(function (m) {
        m.classList.remove('show');
      });
    }
  });

  document.querySelectorAll('.dropdown-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = this.nextElementSibling;
      if (menu && menu.classList.contains('dropdown-menu')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(function (m) {
          if (m !== menu) m.classList.remove('show');
        });
        menu.classList.toggle('show');
      }
    });
  });

  window.showToast = function (title, message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    var iconMap = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', danger: 'fa-times-circle' };
    var icon = iconMap[type] || 'fa-info-circle';

    toast.innerHTML =
      '<div class="toast-icon"><i class="fas ' + icon + '"></i></div>' +
      '<div class="toast-content">' +
      '<p class="toast-title">' + title + '</p>' +
      '<p class="toast-message">' + message + '</p>' +
      '</div>' +
      '<button class="toast-close" onclick="this.parentElement.classList.add(\'exit\');setTimeout(function(){this.parentElement.remove()}.bind(this),300)"><i class="fas fa-times"></i></button>';

    container.appendChild(toast);

    setTimeout(function () {
      if (toast.parentElement) {
        toast.classList.add('exit');
        setTimeout(function () { if (toast.parentElement) toast.remove(); }, 300);
      }
    }, 4000);
  };

  window.Toast = {
    success: function (title, msg) { window.showToast(title, msg, 'success'); },
    warning: function (title, msg) { window.showToast(title, msg, 'warning'); },
    info: function (title, msg) { window.showToast(title, msg, 'info'); },
    danger: function (title, msg) { window.showToast(title, msg, 'danger'); }
  };

  window.openModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
  };

  window.closeModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
  };

  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) {
        this.classList.remove('show');
      }
    });
  });

  document.querySelectorAll('.modal-close').forEach(function (btn) {
    btn.addEventListener('click', function () {
      this.closest('.modal-overlay').classList.remove('show');
    });
  });

  window.initTabs = function (container) {
    var tabs = container.querySelectorAll('.tab-item');
    var contents = container.querySelectorAll('.tab-content');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        contents.forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        var content = container.querySelector('.tab-content[data-tab-content="' + target + '"]');
        if (content) content.classList.add('active');
      });
    });
  };

  document.querySelectorAll('.tabs-container').forEach(function (container) {
    window.initTabs(container);
  });

  var loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    window.addEventListener('load', function () {
      setTimeout(function () { loadingScreen.classList.add('hide'); }, 300);
    });
    setTimeout(function () { loadingScreen.classList.add('hide'); }, 1500);
  }
})();

(function () {
  window.clearAllErrors = function (modal) {
    if (modal) {
      modal.querySelectorAll('.form-error').forEach(function (el) { el.remove(); });
      modal.querySelectorAll('.form-control.error').forEach(function (el) { el.classList.remove('error'); });
    }
  };

  window.showFieldError = function (input, message) {
    input.classList.add('error');
    var error = document.createElement('div');
    error.className = 'form-error';
    error.textContent = message;
    input.parentElement.appendChild(error);
  };

  window.validateRequired = function (val) {
    return val && val.trim().length > 0;
  };

  window.validateEmail = function (email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  window.validatePhone = function (phone) {
    return /^[\+\d\s\-\(\)]{7,20}$/.test(phone);
  };

  // --- UNIVERSAL DARK MODE SWITCH TOGGLE ---
  function setupUniversalDarkMode() {
    var rightContainer = document.querySelector('.navbar-right') || document.querySelector('.topbar-right');
    if (!rightContainer) return;

    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'themeToggleBtn';
    toggleBtn.className = rightContainer.classList.contains('navbar-right') ? 'navbar-btn' : 'topbar-btn';
    toggleBtn.title = 'Toggle Dark Mode';
    toggleBtn.style.marginRight = '12px';
    toggleBtn.style.display = 'inline-flex';
    toggleBtn.style.alignItems = 'center';
    toggleBtn.style.justifyContent = 'center';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';

    var refNode = rightContainer.querySelector('.dropdown') || rightContainer.querySelector('#notifBtn') || rightContainer.firstChild;
    if (refNode && refNode.parentNode === rightContainer) {
      rightContainer.insertBefore(toggleBtn, refNode.nextSibling);
    } else {
      var refNode = rightContainer.querySelector('.dropdown') || rightContainer.firstChild;
      if (refNode && refNode.parentNode === rightContainer) {
        rightContainer.insertBefore(toggleBtn, refNode);
      } else {
        rightContainer.appendChild(toggleBtn);
      }
    }

    var currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark');
      toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    toggleBtn.addEventListener('click', function () {
      if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
      } else {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
      }
    });
  }

  function setupUniversalClock() {
    function updateClock() {
      var now = new Date();
      var dateStr = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      });
      var timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });

      var dateEls = document.querySelectorAll('#hdrClockDate');
      var timeEls = document.querySelectorAll('#hdrClockTime');

      dateEls.forEach(function(el) { el.textContent = dateStr; });
      timeEls.forEach(function(el) { el.textContent = timeStr; });
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  function setupGlobalSettings() {
    // 1. General Settings
    var saveGeneralBtn = document.querySelector('#tab-general button.btn-primary');
    if (saveGeneralBtn) {
      // Remove inline onclick
      saveGeneralBtn.removeAttribute('onclick');
      saveGeneralBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var nameInput = document.getElementById('settingsName');
        var emailInput = document.getElementById('settingsEmail');
        if (!nameInput || !emailInput) return;
        var name = nameInput.value.trim();
        var email = emailInput.value.trim();

        if (!name || !email) {
          if (window.Toast) Toast.error('Settings', 'Name and Email are required');
          else alert('Name and Email are required');
          return;
        }

        var user = API.getUser();
        if (!user || !user.id) {
          if (window.Toast) Toast.error('Settings', 'User session not found');
          return;
        }

        saveGeneralBtn.disabled = true;
        saveGeneralBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        API.updateProfile(user.id, { firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') || ' ', email: email })
          .then(function (res) {
            if (res && res.success !== false) {
              // Update local user object
              user.name = name;
              user.email = email;
              localStorage.setItem('user', JSON.stringify(user));
              if (window.Toast) Toast.success('Settings', 'Profile settings updated successfully!');
              else if (window.showToast) window.showToast('Settings', 'Profile settings updated successfully!', 'success');
            } else {
              if (window.Toast) Toast.error('Settings', res.message || 'Failed to update profile');
            }
          })
          .catch(function (err) {
            if (window.Toast) Toast.error('Settings', err.message || 'Failed to update profile');
          })
          .finally(function () {
            saveGeneralBtn.disabled = false;
            saveGeneralBtn.innerHTML = '<i class="fas fa-save"></i> Save Settings';
          });
      });
    }

    // 2. Security / Password Settings
    // Handled by page-specific scripts (admin.js, leader.js, member.js, settings.js)
    // to avoid conflicts with role-specific input IDs and UX flows.
  }

  function initUniversalWidgets() {
    setupUniversalDarkMode();
    setupUniversalClock();
    // Wait for other scripts to populate settings values before binding settings tab handlers
    setTimeout(setupGlobalSettings, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUniversalWidgets);
  } else {
    initUniversalWidgets();
  }
  // ─── Collapsed Sidebar Hover Popover ─────────────────────────────────────
  (function () {
    var activePopover = null;
    var activeItem = null;
    var hideTimer = null;

    function isDark() { return document.body.classList.contains('dark-mode'); }

    function clearHideTimer() {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    }

    function scheduleHide(delay) {
      clearHideTimer();
      hideTimer = setTimeout(removePopover, delay || 120);
    }

    function removePopover() {
      clearHideTimer();
      if (activePopover) { activePopover.remove(); activePopover = null; }
      activeItem = null;
    }

    function buildPopover(el) {
      if (!document.body.classList.contains('sidebar-collapsed')) return;
      if (activeItem === el) return; // already showing for this item

      clearHideTimer();
      if (activePopover) { activePopover.remove(); activePopover = null; }
      activeItem = el;

      var submenu = el.nextElementSibling;
      var hasSub = el.classList.contains('has-sub') && submenu && submenu.classList.contains('submenu');

      var pop = document.createElement('div');
      pop.id = 'sidebar-collapsed-popover';
      pop.style.cssText = [
        'position:fixed',
        'background:' + (isDark() ? '#1E293B' : '#fff'),
        'border:1px solid ' + (isDark() ? '#334155' : '#E2E8F0'),
        'border-radius:10px',
        'box-shadow:0 10px 25px rgba(0,0,0,0.15)',
        'z-index:999999',
        'min-width:160px',
        'padding:6px 0',
        'pointer-events:auto',
        'transition:opacity .12s ease'
      ].join(';');

      if (hasSub) {
        pop.innerHTML = submenu.innerHTML;
        var items = pop.querySelectorAll('.sidebar-item');
        items.forEach(function (si) {
          si.style.cssText = 'display:flex;align-items:center;gap:10px;padding:9px 16px;font-size:13px;color:' +
            (isDark() ? '#F1F5F9' : '#1E293B') + ';cursor:pointer;transition:background .15s;text-decoration:none;border-radius:6px;margin:2px 6px;';
          si.addEventListener('mouseenter', function () {
            si.style.background = isDark() ? '#334155' : '#F1F5F9';
          });
          si.addEventListener('mouseleave', function () {
            si.style.background = 'transparent';
          });
          // Close popover when a submenu item is clicked
          si.addEventListener('click', function () {
            removePopover();
          });
          // Make sure the icon + text are visible (they may be hidden via CSS in collapsed mode)
          var icon = si.querySelector('i, .sidebar-item-icon');
          if (icon) icon.style.display = 'inline-flex';
          var txt = si.querySelector('.sidebar-item-text');
          if (txt) txt.style.display = 'inline';
        });
      } else {
        var labelEl = el.querySelector('.sidebar-item-text');
        var label = labelEl ? labelEl.innerText.trim() : '';
        if (!label) { activeItem = null; return; }
        pop.innerHTML = '<div style="padding:9px 16px;font-weight:600;font-size:13px;color:' +
          (isDark() ? '#F1F5F9' : '#1E293B') + ';white-space:nowrap;">' + label + '</div>';
      }

      document.body.appendChild(pop);
      activePopover = pop;

      // Position: right of the sidebar item, vertically centred
      var rect = el.getBoundingClientRect();
      var popH = pop.offsetHeight || 40;
      var top = Math.min(rect.top, window.innerHeight - popH - 8);
      pop.style.top = Math.max(8, top) + 'px';
      pop.style.left = (rect.right + 6) + 'px';

      pop.addEventListener('mouseenter', clearHideTimer);
      pop.addEventListener('mouseleave', function () { scheduleHide(80); });
    }

    // Use mouseover (bubbling) so we catch all child elements too
    document.addEventListener('mouseover', function (e) {
      if (!document.body.classList.contains('sidebar-collapsed')) return;
      // Stay inside popover
      if (activePopover && activePopover.contains(e.target)) {
        clearHideTimer(); return;
      }
      var sidebarEl = e.target.closest ? e.target.closest('.sidebar-item:not(.submenu .sidebar-item)') : null;
      if (sidebarEl) {
        buildPopover(sidebarEl);
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (!document.body.classList.contains('sidebar-collapsed')) return;
      // If leaving a sidebar item but entering the popover — don't hide
      var toEl = e.relatedTarget;
      if (toEl && activePopover && activePopover.contains(toEl)) { clearHideTimer(); return; }
      var fromItem = e.target.closest ? e.target.closest('.sidebar-item:not(.submenu .sidebar-item)') : null;
      var fromPop = e.target.closest ? e.target.closest('#sidebar-collapsed-popover') : null;
      if (fromItem || fromPop) {
        scheduleHide(120);
      }
    });

    // Hide on any click outside
    document.addEventListener('click', function (e) {
      if (activePopover && !activePopover.contains(e.target)) {
        removePopover();
      }
    }, true);
  }());

  window.showCollapsedPopover = function() {};

  window.toggleSecondaryField = function (containerId, btn) {
    var container = document.getElementById(containerId);
    if (container) {
      var isHidden = container.style.display === 'none' || container.style.display === '';
      container.style.display = isHidden ? 'block' : 'none';
      if (btn) {
        var hasText = btn.textContent.trim().length > 0;
        if (isHidden) {
          btn.innerHTML = '<i class="fas fa-minus-circle" style="color: #EF4444;"></i>' + (hasText ? ' Remove Secondary' : '');
        } else {
          btn.innerHTML = '<i class="fas fa-plus-circle"></i>' + (hasText ? ' Add Secondary' : '');
        }
      }
    }
  };

  // ─── LinkedIn URL Preview Tooltip ───────────────────────────────────────────
  window.showLinkPreview = function (el, url) {
    var existing = document.getElementById('_linkPreviewTooltip');
    if (existing) { existing.remove(); return; }

    var isDark = document.body.classList.contains('dark-mode');
    var tip = document.createElement('div');
    tip.id = '_linkPreviewTooltip';
    tip.style.cssText = 'position:fixed;z-index:999999;background:' + (isDark ? '#1E293B' : '#fff') +
      ';border:1px solid ' + (isDark ? '#334155' : '#E2E8F0') +
      ';border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,0.18);padding:10px 14px;max-width:400px;min-width:200px;pointer-events:auto;';

    var label = document.createElement('div');
    label.style.cssText = 'font-size:10px;font-weight:700;color:#94A3B8;letter-spacing:.06em;margin-bottom:5px;';
    label.textContent = 'LINKEDIN URL';
    tip.appendChild(label);

    var urlText = document.createElement('div');
    urlText.style.cssText = 'font-size:12px;color:' + (isDark ? '#60A5FA' : '#1D4ED8') + ';word-break:break-all;line-height:1.5;';
    urlText.textContent = url;
    tip.appendChild(urlText);

    var copyBtn = document.createElement('button');
    copyBtn.style.cssText = 'margin-top:8px;padding:3px 10px;font-size:11px;border-radius:5px;border:1px solid #CBD5E1;background:transparent;cursor:pointer;color:' + (isDark ? '#CBD5E1' : '#374151') + ';';
    copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
    copyBtn.onclick = function (ev) {
      ev.stopPropagation();
      navigator.clipboard.writeText(url).then(function () {
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(function () { copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy'; }, 1500);
      });
    };
    tip.appendChild(copyBtn);
    document.body.appendChild(tip);

    var rect = el.getBoundingClientRect();
    var left = Math.min(rect.left, window.innerWidth - 410);
    tip.style.top = (rect.bottom + 6) + 'px';
    tip.style.left = Math.max(8, left) + 'px';

    var dismiss = function (ev) {
      if (!tip.contains(ev.target) && ev.target !== el) {
        tip.remove();
        document.removeEventListener('click', dismiss, true);
      }
    };
    setTimeout(function () { document.addEventListener('click', dismiss, true); }, 10);
  };

  window.toggleFullScreenSpreadsheet = function (btn) {
    var wrapper = document.querySelector('.card.spreadsheet-card');
    if (!wrapper && btn) {
      wrapper = btn.closest('.card');
    }
    if (!wrapper) return;

    var button = btn || document.querySelector('button[title="View in Full Screen"]');
    var icon = button ? button.querySelector('i') : null;

    if (wrapper.classList.contains('spreadsheet-fullscreen')) {
      wrapper.classList.remove('spreadsheet-fullscreen');
      if (icon) {
        icon.className = 'fas fa-expand';
      }
    } else {
      wrapper.classList.add('spreadsheet-fullscreen');
      if (icon) {
        icon.className = 'fas fa-compress';
      }
    }
  };

  /* ────────────────────────────────────────────────────────────
     GLOBAL TOPBAR DATE FILTER & SHORTCUTS HELPERS
     ──────────────────────────────────────────────────────────── */
  window.toggleTopbarDateMenu = function (e) {
    if (e) e.stopPropagation();
    var menu = document.getElementById('topbarDateMenu');
    if (menu) {
      var isVisible = menu.style.display === 'block';
      menu.style.display = isVisible ? 'none' : 'block';
    }
  };

  window.applyGlobalDateFilter = function () {
    var from = document.getElementById('globalDateFrom') ? document.getElementById('globalDateFrom').value : '';
    var to = document.getElementById('globalDateTo') ? document.getElementById('globalDateTo').value : '';
    var field = document.getElementById('globalDateField') ? document.getElementById('globalDateField').value : 'created_at';
    var label = document.getElementById('topbarDateLabel');

    if (from || to) {
      if (label) label.textContent = (from || 'Start') + ' to ' + (to || 'End');
    } else {
      if (label) label.textContent = 'All Time';
    }

    // Sync to spreadsheet hidden date inputs if present
    var ssFrom = document.getElementById('ssDateFrom');
    var ssTo = document.getElementById('ssDateTo');
    var ssField = document.getElementById('ssDateField');

    if (ssFrom) ssFrom.value = from;
    if (ssTo) ssTo.value = to;
    if (ssField) ssField.value = field;

    if (window.fetchSpreadsheetData && typeof window.fetchSpreadsheetData === 'function') {
      window.fetchSpreadsheetData();
    } else if (window.renderTable && typeof window.renderTable === 'function') {
      window.renderTable();
    }

    var menu = document.getElementById('topbarDateMenu');
    if (menu) menu.style.display = 'none';

    if (window.Toast) window.Toast.info('Date Filter Applied', (from || to) ? `Working dataset filtered from ${from || 'Start'} to ${to || 'End'}` : 'Showing all-time records');
  };

  window.clearGlobalDateFilter = function () {
    var from = document.getElementById('globalDateFrom');
    var to = document.getElementById('globalDateTo');
    var label = document.getElementById('topbarDateLabel');

    if (from) from.value = '';
    if (to) to.value = '';
    if (label) label.textContent = 'All Time';

    window.applyGlobalDateFilter();
  };

  window.resetSpreadsheetFilters = function () {
    ['ssFilterLeader', 'ssFilterMember', 'ssFilterDept', 'ssFilterBatch', 'ssFilterStatus'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    window.clearGlobalDateFilter();
    var badge = document.getElementById('activeFilterBadge');
    if (badge) badge.style.display = 'none';
  };

  window.startWelcomeTour = function () {
    if (window.openModal && typeof window.openModal === 'function') {
      window.openModal('welcomeTourModal');
    } else {
      var modal = document.getElementById('welcomeTourModal');
      if (modal) modal.style.display = 'flex';
    }
  };

  // Keyboard Shortcuts Listener
  document.addEventListener('keydown', function (e) {
    // Ctrl + K -> Focus global search
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      var searchInput = document.getElementById('ssSearch') || document.getElementById('globalSearchInput') || document.getElementById('tableSearch');
      if (searchInput) searchInput.focus();
    }
    // Ctrl + F -> Toggle Filter Modal
    if (e.ctrlKey && e.key.toLowerCase() === 'f') {
      var modal = document.getElementById('ssFilterModal');
      if (modal) {
        e.preventDefault();
        if (modal.style.display === 'flex' || modal.classList.contains('active')) {
    // Escape -> Close any open modal
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay, .modal-backdrop').forEach(function (m) {
        if (m.style.display === 'flex' || m.classList.contains('active') || m.classList.contains('show')) {
          m.style.display = 'none';
          m.classList.remove('active', 'show');
        }
      });
    }
    // Ctrl + S -> Save / Submit active record form
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      var submitBtn = document.getElementById('submitRecordBtn') || document.getElementById('saveAlumniBtn') || document.querySelector('.modal.show .btn-primary');
      if (submitBtn) {
        submitBtn.click();
        if (window.Toast) window.Toast.success('Saved', 'Record submission triggered via Ctrl + S');
      }
    }
    // Alt + E -> Export CSV
    if (e.altKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      if (window.handleExport && typeof window.handleExport === 'function') {
        window.handleExport();
      } else if (window.exportAlumniCSV && typeof window.exportAlumniCSV === 'function') {
        window.exportAlumniCSV();
      }
    }
    // Alt + R -> Refresh Data
    if (e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      if (window.fetchSpreadsheetData && typeof window.fetchSpreadsheetData === 'function') {
        window.fetchSpreadsheetData();
      }
    }
  });

})();

