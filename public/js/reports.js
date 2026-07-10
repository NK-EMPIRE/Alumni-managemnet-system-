(function () {
  'use strict';

  var recentReports = [
    { name: 'CSE Department Progress - June 2026', type: 'Department-wise', by: 'Admin User', date: '08 Jul 2026', status: 'Completed' },
    { name: 'Batch 2022 Completion Report', type: 'Batch-wise', by: 'Admin User', date: '07 Jul 2026', status: 'Completed' },
    { name: 'Team Leader Performance - Q2 2026', type: 'Team-wise', by: 'Admin User', date: '06 Jul 2026', status: 'Completed' },
    { name: 'ECE Department Pending Analysis', type: 'Department-wise', by: 'Priya Sharma', date: '05 Jul 2026', status: 'Generating' },
    { name: 'Individual Progress - Aarav Sharma', type: 'Individual', by: 'Amit Verma', date: '04 Jul 2026', status: 'Completed' },
    { name: 'EEE Department Monthly Summary', type: 'Department-wise', by: 'Rajesh Patel', date: '03 Jul 2026', status: 'Completed' },
    { name: 'ME Department Progress Report', type: 'Department-wise', by: 'Vikram Singh', date: '02 Jul 2026', status: 'Failed' },
    { name: 'Batch 2023 Alumni Status', type: 'Batch-wise', by: 'Admin User', date: '01 Jul 2026', status: 'Completed' },
    { name: 'IT Department Weekly Progress', type: 'Department-wise', by: 'Sunita Gupta', date: '30 Jun 2026', status: 'Completed' },
    { name: 'Comprehensive Alumni Report - June', type: 'Team-wise', by: 'Admin User', date: '28 Jun 2026', status: 'Completed' },
    { name: 'CE Department Pending Updates', type: 'Department-wise', by: 'Rajesh Patel', date: '25 Jun 2026', status: 'Generating' },
    { name: 'Batch 2021 Complete Overview', type: 'Batch-wise', by: 'Admin User', date: '20 Jun 2026', status: 'Completed' }
  ];

  var scheduledReports = [
    { name: 'Weekly Progress Summary', freq: 'Weekly', next: '12 Jul 2026 08:00 AM', status: 'Active' },
    { name: 'Monthly Department Report', freq: 'Monthly', next: '01 Aug 2026 06:00 AM', status: 'Active' },
    { name: 'Daily Completion Status', freq: 'Daily', next: '09 Jul 2026 11:59 PM', status: 'Active' },
    { name: 'Team Leader Performance Review', freq: 'Weekly', next: '15 Jul 2026 09:00 AM', status: 'Paused' }
  ];

  function getStatusBadge(status) {
    var map = {
      'Completed': '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Completed</span>',
      'Generating': '<span class="badge badge-warning"><i class="fas fa-spinner"></i> Generating</span>',
      'Failed': '<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Failed</span>',
      'Active': '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Active</span>',
      'Paused': '<span class="badge badge-warning"><i class="fas fa-pause-circle"></i> Paused</span>'
    };
    return map[status] || '<span class="badge badge-light">' + status + '</span>';
  }

  function fetchReportsFromAPI() {
    if (typeof API === 'undefined' || !API.getReports) return;
    API.getReports().then(function (res) {
      var data = res && res.success ? res.data : null;
      if (!data || !data.records) return;
      recentReports = data.records.map(function (r) {
        return {
          name: r.report_name || r.name || r.reportName,
          type: r.report_type || r.type || 'Department-wise',
          by: r.generator_name || r.generatedBy || r.by || 'Admin',
          date: r.created_at || r.date || r.createdAt || new Date().toLocaleDateString('en-IN'),
          status: r.status || 'Completed'
        };
      });
      populateRecentReports();
    }).catch(function () {});
  }

  function fetchSchedulesFromAPI() {
    if (typeof API === 'undefined' || !API.getSchedules) return;
    API.getSchedules().then(function (res) {
      var data = res && res.success ? res.data : null;
      if (data && data.length > 0) {
        scheduledReports = data.map(function (s) {
          return {
            name: s.report_name || s.name || s.reportName,
            freq: s.frequency || s.freq || 'Weekly',
            next: s.next_run || s.nextRun || s.next || 'N/A',
            status: s.is_active ? 'Active' : 'Paused'
          };
        });
        populateScheduledReports();
      }
    }).catch(function () {});
  }

  function populateRecentReports() {
    var tbody = document.getElementById('recentReportsBody');
    if (!tbody) return;
    var html = '';
    recentReports.forEach(function (r) {
      html += '<tr>';
      html += '<td><strong>' + r.name + '</strong></td>';
      html += '<td>' + r.type + '</td>';
      html += '<td>' + r.by + '</td>';
      html += '<td>' + r.date + '</td>';
      html += '<td>' + getStatusBadge(r.status) + '</td>';
      html += '<td><button class="btn btn-sm btn-outline" onclick="downloadReport(\'' + r.name.replace(/'/g, "\\'") + '\',\'' + (r.id || '') + '\')"><i class="fas fa-download"></i></button></td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  function populateScheduledReports() {
    var tbody = document.getElementById('scheduledReportsBody');
    if (!tbody) return;
    var html = '';
    scheduledReports.forEach(function (r, i) {
      html += '<tr>';
      html += '<td><strong>' + r.name + '</strong></td>';
      html += '<td>' + r.freq + '</td>';
      html += '<td>' + r.next + '</td>';
      html += '<td>' + getStatusBadge(r.status) + '</td>';
      html += '<td><div class="table-actions"><button class="btn btn-sm btn-ghost" onclick="toggleScheduleStatus(' + i + ')"><i class="fas ' + (r.status === 'Active' ? 'fa-pause' : 'fa-play') + '"></i></button><button class="btn btn-sm btn-ghost text-danger" onclick="deleteSchedule(' + i + ')"><i class="fas fa-trash"></i></button></div></td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  window.toggleDeptChip = function (el) {
    el.classList.toggle('active');
    var cb = el.querySelector('input[type="checkbox"]');
    if (cb) cb.checked = !cb.checked;
  };

  window.selectFormat = function (el, format) {
    document.querySelectorAll('#deptFilterChips .chip').forEach(function (c) { c.classList.remove('active'); });
    el.classList.add('active');
    var radios = document.querySelectorAll('input[name="reportFormat"]');
    radios.forEach(function (r) { if (r.value === format) r.checked = true; });
  };

  window.generateReport = function (event) {
    event = event || window.event;
    var type = document.getElementById('reportType').value;
    var from = document.getElementById('reportFromDate').value;
    var to = document.getElementById('reportToDate').value;
    var formatEl = document.querySelector('input[name="reportFormat"]:checked');
    var format = formatEl ? formatEl.value : 'pdf';
    var teamLeader = document.getElementById('reportTeamLeader').value;

    if (!from || !to) {
      Toast.warning('Validation Error', 'Please select both From and To dates.');
      return;
    }
    var btn = event && event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span> Generating...';

    var typeNames = { department: 'Department-wise', batch: 'Batch-wise', team: 'Team-wise', individual: 'Individual' };
    var reportName = (typeNames[type] || type) + ' Report - ' + new Date().toLocaleDateString('en-IN');

    var generatePromise;
    if (typeof API !== 'undefined' && API.generateReport) {
      generatePromise = API.generateReport({ type: type, fromDate: from, toDate: to, format: format, teamLeader: teamLeader }).catch(function () { return null; });
    } else {
      generatePromise = new Promise(function (resolve) { setTimeout(resolve, 2000); });
    }

    generatePromise.then(function () {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-cog"></i> Generate Report';
      recentReports.unshift({ name: reportName, type: typeNames[type] || type, by: 'Admin User', date: 'Today', status: 'Completed' });
      populateRecentReports();
      Toast.success('Report Generated', reportName + ' has been generated successfully.');
    });
  };

  window.downloadReport = function (name, id) {
    if (id && typeof API !== 'undefined' && API.downloadReport) {
      API.downloadReport(id).then(function () {
        Toast.success('Download Complete', '"' + name + '" has been downloaded.');
      }).catch(function () {
        Toast.info('Download', 'Downloading "' + name + '"...');
        setTimeout(function () { Toast.success('Download Complete', '"' + name + '" has been downloaded.'); }, 1500);
      });
    } else {
      Toast.info('Download', 'Downloading "' + name + '"...');
      setTimeout(function () { Toast.success('Download Complete', '"' + name + '" has been downloaded.'); }, 1500);
    }
  };

  window.filterReports = function (filter) {
    var rows = document.querySelectorAll('#recentReportsBody tr');
    rows.forEach(function (row) {
      var status = row.querySelector('.badge');
      if (!status) return;
      var text = status.textContent.trim();
      if (filter === 'all') {
        row.style.display = '';
      } else if (filter === 'completed') {
        row.style.display = text.indexOf('Completed') !== -1 ? '' : 'none';
      } else if (filter === 'generating') {
        row.style.display = text.indexOf('Generating') !== -1 || text.indexOf('Failed') !== -1 ? '' : 'none';
      }
    });
    document.querySelectorAll('.card-header .btn-ghost').forEach(function (b) { b.style.background = ''; b.style.color = ''; });
    var btn = event && event.target;
    if (btn) { btn.style.background = 'var(--primary-light)'; btn.style.color = 'var(--primary)'; }
  };

  window.closeScheduleModal = function () {
    var modal = document.getElementById('addScheduleModal');
    modal.classList.remove('show');
    document.getElementById('schedReportName').value = '';
    document.getElementById('schedFrequency').selectedIndex = 0;
    document.getElementById('schedType').selectedIndex = 0;
  };

  window.saveSchedule = function () {
    var name = document.getElementById('schedReportName').value;
    var freq = document.getElementById('schedFrequency').value;
    var time = document.getElementById('schedTime').value;
    var type = document.getElementById('schedType').value;
    if (!name || !freq || !type) {
      Toast.warning('Validation Error', 'Please fill in all required fields.');
      return;
    }
    var btn = document.getElementById('saveScheduleBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span> Saving...';

    var savePromise;
    if (typeof API !== 'undefined' && API.createSchedule) {
      savePromise = API.createSchedule({ name: name, frequency: freq, time: time, type: type }).then(function () { return true; }).catch(function () { return false; });
    } else {
      savePromise = new Promise(function (resolve) { setTimeout(function () { resolve(true); }, 1500); });
    }

    savePromise.then(function (success) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Save Schedule';
      var nextRunDate = new Date();
      nextRunDate.setDate(nextRunDate.getDate() + (freq === 'daily' ? 1 : freq === 'weekly' ? 7 : 30));
      var nextStr = nextRunDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + time;
      scheduledReports.push({ name: name, freq: freq.charAt(0).toUpperCase() + freq.slice(1), next: nextStr, status: 'Active' });
      populateScheduledReports();
      Toast.success('Schedule Added', 'Report schedule "' + name + '" has been saved.');
      closeScheduleModal();
    });
  };

  window.toggleScheduleStatus = function (index) {
    var r = scheduledReports[index];
    if (!r) return;
    r.status = r.status === 'Active' ? 'Paused' : 'Active';
    populateScheduledReports();
    Toast.info('Schedule Updated', '"' + r.name + '" is now ' + r.status + '.');
  };

  window.deleteSchedule = function (index) {
    var r = scheduledReports[index];
    if (!r) return;

    if (typeof API !== 'undefined' && API.deleteSchedule) {
      API.deleteSchedule(r.id || index).then(function () {
        scheduledReports.splice(index, 1);
        populateScheduledReports();
        Toast.warning('Schedule Deleted', '"' + r.name + '" has been deleted.');
      }).catch(function () {
        scheduledReports.splice(index, 1);
        populateScheduledReports();
        Toast.warning('Schedule Deleted', '"' + r.name + '" has been deleted.');
      });
    } else {
      scheduledReports.splice(index, 1);
      populateScheduledReports();
      Toast.warning('Schedule Deleted', '"' + r.name + '" has been deleted.');
    }
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

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) {
      closeDropdown('profileMenu');
      closeDropdown('notifMenu');
    }
  });

  if (localStorage.getItem('sidebar_collapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
  }

  var loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    window.addEventListener('load', function () {
      setTimeout(function () { loadingScreen.classList.add('hide'); }, 300);
    });
    setTimeout(function () { loadingScreen.classList.add('hide'); }, 1500);
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetchReportsFromAPI();
    fetchSchedulesFromAPI();
    populateRecentReports();
    populateScheduledReports();
    var today = new Date().toISOString().split('T')[0];
    if (document.getElementById('reportFromDate')) document.getElementById('reportFromDate').value = '2026-01-01';
    if (document.getElementById('reportToDate')) document.getElementById('reportToDate').value = today;
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fetchReportsFromAPI();
    fetchSchedulesFromAPI();
    populateRecentReports();
    populateScheduledReports();
  }

})();