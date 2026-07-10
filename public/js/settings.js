(function () {
  'use strict';

  function loadSettings() {
    var saved = localStorage.getItem('alumni_settings');
    if (!saved) return;
    try {
      var data = JSON.parse(saved);
      if (data.siteName) document.getElementById('siteName').value = data.siteName;
      if (data.collegeName) document.getElementById('collegeName').value = data.collegeName;
      if (data.timezone) document.getElementById('timezone').value = data.timezone;
      if (data.language) document.getElementById('language').value = data.language;
      if (data.emailNotif !== undefined) document.getElementById('emailNotif').checked = data.emailNotif;
      if (data.smsNotif !== undefined) document.getElementById('smsNotif').checked = data.smsNotif;
      if (data.digestFreq) document.getElementById('digestFreq').value = data.digestFreq;
      if (data.notifNewAssign !== undefined) document.getElementById('notifNewAssign').checked = data.notifNewAssign;
      if (data.notifCompletion !== undefined) document.getElementById('notifCompletion').checked = data.notifCompletion;
      if (data.sessionTimeout) document.getElementById('sessionTimeout').value = data.sessionTimeout;
      if (data.passMinLength) document.getElementById('passMinLength').value = data.passMinLength;
      if (data.requireSpecialChars !== undefined) document.getElementById('requireSpecialChars').checked = data.requireSpecialChars;
      if (data.twoFactorAuth !== undefined) document.getElementById('twoFactorAuth').checked = data.twoFactorAuth;
    } catch (e) {}
  }

  window.switchTab = function (tab, btn) {
    var tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(function (t) { t.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var contents = document.querySelectorAll('.tab-content');
    contents.forEach(function (c) { c.classList.remove('active'); });
    var target = document.getElementById('tab-' + tab);
    if (target) target.classList.add('active');
  };

  window.handleLogoUpload = function (input) {
    var file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Toast.warning('Upload Error', 'File size must be less than 2MB');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var preview = document.getElementById('logoPreview');
      preview.innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">';
      Toast.success('Logo Uploaded', 'Logo has been uploaded successfully.');
    };
    reader.readAsDataURL(file);
  };

  window.saveGeneralSettings = function () {
    var data = {
      siteName: document.getElementById('siteName').value,
      collegeName: document.getElementById('collegeName').value,
      timezone: document.getElementById('timezone').value,
      language: document.getElementById('language').value
    };
    persistSettings(data);
    Toast.success('Settings Saved', 'General settings have been saved successfully.');
  };

  window.saveNotificationSettings = function () {
    var data = {
      emailNotif: document.getElementById('emailNotif').checked,
      smsNotif: document.getElementById('smsNotif').checked,
      digestFreq: document.getElementById('digestFreq').value,
      notifNewAssign: document.getElementById('notifNewAssign').checked,
      notifCompletion: document.getElementById('notifCompletion').checked
    };
    persistSettings(data);
    Toast.success('Settings Saved', 'Notification preferences have been saved successfully.');
  };

  window.saveSecuritySettings = function () {
    var data = {
      sessionTimeout: document.getElementById('sessionTimeout').value,
      passMinLength: document.getElementById('passMinLength').value,
      requireSpecialChars: document.getElementById('requireSpecialChars').checked,
      twoFactorAuth: document.getElementById('twoFactorAuth').checked
    };
    persistSettings(data);
    Toast.success('Settings Saved', 'Security settings have been saved successfully.');
  };

  function persistSettings(newData) {
    var saved = localStorage.getItem('alumni_settings');
    var existing = saved ? JSON.parse(saved) : {};
    var merged = {};
    for (var key in existing) merged[key] = existing[key];
    for (var key2 in newData) merged[key2] = newData[key2];
    localStorage.setItem('alumni_settings', JSON.stringify(merged));
  }

  window.testDbConnection = function (event) {
    event = event || window.event;
    var btn = event && event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span> Testing...';
    setTimeout(function () {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-plug"></i> Test Connection';
      Toast.success('Connection Successful', 'Database connection test passed successfully.');
    }, 1500);
  };

  window.backupDatabase = function (event) {
    event = event || window.event;
    var btn = event && event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span> Backing up...';
    setTimeout(function () {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-database"></i> Backup Database';
      Toast.success('Backup Complete', 'Database backup has been created successfully.');
    }, 2500);
  };

  window.handleGlobalSearch = function (val) {
    if (val && val.length > 2) {
      Toast.info('Search', 'Searching for "' + val + '"...');
    }
  };

  window.handleLogout = function () {
    if (typeof API !== 'undefined') API.clearToken();
    Toast.warning('Logout', 'You have been logged out successfully.');
    setTimeout(function () { window.location.href = 'index.html'; }, 1500);
  };

  window.toggleMobileSidebar = function () {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('show');
    document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
  };

  window.toggleSidebar = function () {
    document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebar_collapsed', document.body.classList.contains('sidebar-collapsed'));
  };

  window.toggleNotifications = function (e) {
    e.stopPropagation();
    closeDropdown('profileMenu');
    var menu = document.getElementById('notifMenu');
    menu.classList.toggle('show');
  };

  window.toggleProfileDropdown = function (e) {
    e.stopPropagation();
    closeDropdown('notifMenu');
    var menu = document.getElementById('profileMenu');
    menu.classList.toggle('show');
  };

  window.closeDropdown = function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('show');
  };

  window.showAllNotifications = function () {
    closeDropdown('notifMenu');
    Toast.info('Notifications', 'Showing all notifications.');
  };

  var savedCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  if (savedCollapsed) document.body.classList.add('sidebar-collapsed');

  var loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    window.addEventListener('load', function () {
      setTimeout(function () { loadingScreen.classList.add('hide'); }, 300);
    });
    setTimeout(function () { loadingScreen.classList.add('hide'); }, 1500);
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) {
      closeDropdown('profileMenu');
      closeDropdown('notifMenu');
    }
  });

  loadSettings();

  document.querySelectorAll('.sidebar-item a').forEach(function (item) {
    item.addEventListener('click', function (e) {
      if (window.innerWidth < 1024) {
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  });

})();
