(function () {
  'use strict';

  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const pageWrapper = document.querySelector('.page-wrapper');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('sidebar_collapsed', document.body.classList.contains('sidebar-collapsed'));
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
    success: function(title, msg) { window.showToast(title, msg, 'success'); },
    warning: function(title, msg) { window.showToast(title, msg, 'warning'); },
    info: function(title, msg) { window.showToast(title, msg, 'info'); },
    danger: function(title, msg) { window.showToast(title, msg, 'danger'); }
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

(function() {
  window.clearAllErrors = function(modal) {
    if (modal) {
      modal.querySelectorAll('.form-error').forEach(function(el) { el.remove(); });
      modal.querySelectorAll('.form-control.error').forEach(function(el) { el.classList.remove('error'); });
    }
  };

  window.showFieldError = function(input, message) {
    input.classList.add('error');
    var error = document.createElement('div');
    error.className = 'form-error';
    error.textContent = message;
    input.parentElement.appendChild(error);
  };

  window.validateRequired = function(val) {
    return val && val.trim().length > 0;
  };

  window.validateEmail = function(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  window.validatePhone = function(phone) {
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

    // Insert before profile dropdown or notifications button
    var refNode = rightContainer.querySelector('.dropdown') || rightContainer.querySelector('#notifBtn') || rightContainer.firstChild;
    rightContainer.insertBefore(toggleBtn, refNode);

    var currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-mode');
      toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    toggleBtn.addEventListener('click', function () {
      if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
      } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
      }
    });
  }

  function setupUniversalClock() {
    var rightContainer = document.querySelector('.navbar-right') || document.querySelector('.topbar-right');
    if (!rightContainer) return;

    var clockDiv = document.createElement('div');
    clockDiv.id = 'universalLiveClock';
    clockDiv.style.fontSize = '0.85rem';
    clockDiv.style.color = 'var(--text-muted)';
    clockDiv.style.fontWeight = '500';
    clockDiv.style.marginRight = '16px';
    clockDiv.style.display = 'inline-flex';
    clockDiv.style.alignItems = 'center';
    clockDiv.style.gap = '8px';
    clockDiv.innerHTML = '<i class="far fa-clock" style="color:var(--primary);"></i><span id="universalClockSpan">-</span>';

    // Insert at the beginning of the container
    rightContainer.insertBefore(clockDiv, rightContainer.firstChild);

    function updateClock() {
      var d = new Date();
      var options = {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      var span = document.getElementById('universalClockSpan');
      if (span) {
        span.textContent = d.toLocaleString('en-IN', options);
      }
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  function initUniversalWidgets() {
    setupUniversalDarkMode();
    setupUniversalClock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUniversalWidgets);
  } else {
    initUniversalWidgets();
  }
})();
