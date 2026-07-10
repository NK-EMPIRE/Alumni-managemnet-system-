(function () {
  'use strict';

  var deptData = [
    { dept: 'CSE', total: 465, completed: 362, inProgress: 72, pending: 31 },
    { dept: 'ECE', total: 400, completed: 260, inProgress: 88, pending: 52 },
    { dept: 'EEE', total: 285, completed: 205, inProgress: 50, pending: 30 },
    { dept: 'ME', total: 350, completed: 203, inProgress: 97, pending: 50 },
    { dept: 'CE', total: 255, completed: 115, inProgress: 85, pending: 55 },
    { dept: 'IT', total: 595, completed: 417, inProgress: 128, pending: 50 }
  ];

  var leaderData = [
    { name: 'Amit Verma', rate: 92 },
    { name: 'Priya Sharma', rate: 85 },
    { name: 'Rajesh Patel', rate: 78 },
    { name: 'Sunita Gupta', rate: 74 },
    { name: 'Vikram Singh', rate: 63 }
  ];

  var batchData = [
    { batch: '2020', rate: 85 },
    { batch: '2021', rate: 72 },
    { batch: '2022', rate: 68 },
    { batch: '2023', rate: 55 }
  ];

  var overallCompleted = 0;
  var overallTotal = 0;
  deptData.forEach(function (d) {
    overallCompleted += d.completed;
    overallTotal += d.total;
  });
  var overallPct = Math.round((overallCompleted / overallTotal) * 100);

  function fetchDataFromAPI() {
    if (typeof API === 'undefined') return;

    var statsPromise = API.getAlumniStats ? API.getAlumniStats().catch(function () { return null; }) : Promise.resolve(null);
    var adminPromise = API.getAdminDashboard ? API.getAdminDashboard().catch(function () { return null; }) : Promise.resolve(null);

    Promise.all([statsPromise, adminPromise]).then(function (results) {
      var stats = results[0];
      var dashboard = results[1];

      if (stats) {
        if (stats.overallProgress !== undefined) {
          overallPct = stats.overallProgress;
          document.getElementById('overallProgressVal').textContent = overallPct + '%';
          var bar = document.getElementById('overallProgressBar');
          if (bar) {
            bar.style.width = overallPct + '%';
            if (overallPct >= 80) bar.classList.add('green');
            else if (overallPct >= 50) {}
            else bar.classList.add('yellow');
          }
        }
        if (stats.totalRecords !== undefined) document.getElementById('totalRecordsVal').textContent = stats.totalRecords.toLocaleString();
        if (stats.updatedRecords !== undefined) document.getElementById('updatedRecordsVal').textContent = stats.updatedRecords.toLocaleString();
        if (stats.activeTeams !== undefined) document.getElementById('activeTeamsVal').textContent = stats.activeTeams;
        if (stats.newRecords !== undefined) {
          var el = document.getElementById('totalRecordsVal');
          if (el && el.nextElementSibling && el.nextElementSibling.querySelector('.stat-card-change')) {
            el.nextElementSibling.querySelector('.stat-card-change').innerHTML = '<i class="fas fa-arrow-up"></i> ' + stats.newRecords + ' new';
          }
        }
        if (stats.completionRate !== undefined) {
          var updEl = document.getElementById('updatedRecordsVal');
          if (updEl && updEl.nextElementSibling && updEl.nextElementSibling.querySelector('.stat-card-change')) {
            updEl.nextElementSibling.querySelector('.stat-card-change').innerHTML = '<i class="fas fa-arrow-up"></i> ' + stats.completionRate + '% of total';
          }
        }
      }

      if (dashboard) {
        if (dashboard.departments && dashboard.departments.length > 0) {
          deptData = dashboard.departments.map(function (d) {
            return {
              dept: d.code || d.name,
              total: d.total || 0,
              completed: d.completed || 0,
              inProgress: d.inProgress || 0,
              pending: d.pending || (d.total - d.completed - (d.inProgress || 0))
            };
          });
          overallCompleted = 0;
          overallTotal = 0;
          deptData.forEach(function (d) {
            overallCompleted += d.completed;
            overallTotal += d.total;
          });
          overallPct = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;
          document.getElementById('overallProgressVal').textContent = overallPct + '%';
          if (document.getElementById('overallProgressBar')) document.getElementById('overallProgressBar').style.width = overallPct + '%';
          populateDeptTable();
        }
        if (dashboard.leaders && dashboard.leaders.length > 0) {
          leaderData = dashboard.leaders.map(function (l) {
            return { name: l.name, rate: l.completionRate || l.rate || 0 };
          });
        }
        if (dashboard.batches && dashboard.batches.length > 0) {
          batchData = dashboard.batches.map(function (b) {
            return { batch: b.year || b.batch, rate: b.completionRate || b.rate || 0 };
          });
        }
        if (dashboard.activeTeams !== undefined) document.getElementById('activeTeamsVal').textContent = dashboard.activeTeams;
        if (dashboard.totalRecords !== undefined) document.getElementById('totalRecordsVal').textContent = dashboard.totalRecords.toLocaleString();
        if (dashboard.updatedRecords !== undefined) document.getElementById('updatedRecordsVal').textContent = dashboard.updatedRecords.toLocaleString();
      }

      initCharts();
    });
  }

  function initStatsCards() {
    document.getElementById('overallProgressVal').textContent = overallPct + '%';
    var bar = document.getElementById('overallProgressBar');
    if (bar) {
      bar.style.width = overallPct + '%';
      if (overallPct >= 80) bar.classList.add('green');
      else if (overallPct >= 50) {}
      else bar.classList.add('yellow');
    }
    document.getElementById('activeTeamsVal').textContent = '12';
    document.getElementById('totalRecordsVal').textContent = overallTotal.toLocaleString();
    document.getElementById('updatedRecordsVal').textContent = overallCompleted.toLocaleString();
  }

  function initCharts() {
    AlumniCharts.waitForChartJS(function () {
      AlumniCharts.createDoughnutChart('completionChart', {
        labels: ['Completed', 'In Progress', 'Pending'],
        values: [overallPct, Math.round(overallTotal > 0 ? (overallCompleted / overallTotal) * 20 : 20), 100 - overallPct - Math.round(overallTotal > 0 ? (overallCompleted / overallTotal) * 20 : 20)],
        colors: ['#10B981', '#F59E0B', '#EF4444']
      });

      var deptLabels = deptData.map(function (d) { return d.dept; });
      var deptValues = deptData.map(function (d) { return d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0; });
      AlumniCharts.createBarChart('deptChart', {
        labels: deptLabels,
        values: deptValues,
        label: 'Completion Rate (%)'
      });

      AlumniCharts.createLineChart('trendChart', {
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
        datasets: [
          { label: 'Profiles Completed', values: [30, 42, 38, 55, 48, 62, 58, 70, 75, 82, 78, 85], color: '#2563EB' },
          { label: 'Target', values: [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95], color: '#F59E0B' }
        ]
      });

      var leaderLabels = leaderData.map(function (l) { return l.name; });
      var leaderValues = leaderData.map(function (l) { return l.rate; });
      AlumniCharts.createHorizontalBarChart('rankingChart', {
        labels: leaderLabels,
        values: leaderValues,
        label: 'Completion Rate (%)'
      });

      var batchLabels = batchData.map(function (b) { return b.batch; });
      var batchValues = batchData.map(function (b) { return b.rate; });
      AlumniCharts.createBarChart('batchChart', {
        labels: batchLabels,
        values: batchValues,
        label: 'Completion Rate (%)'
      });
    });
  }

  function populateDeptTable() {
    var tbody = document.getElementById('deptBreakdownBody');
    if (!tbody) return;

    var deptNames = {
      'CSE': 'Computer Science (CSE)',
      'ECE': 'Electronics & Comm (ECE)',
      'EEE': 'Electrical & Elec (EEE)',
      'ME': 'Mechanical (ME)',
      'CE': 'Civil (CE)',
      'IT': 'Information Tech (IT)'
    };

    var deptColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    var html = '';
    deptData.forEach(function (d, i) {
      var pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
      var barColor = pct >= 80 ? 'green' : (pct >= 50 ? '' : 'red');
      var fullName = deptNames[d.dept] || d.dept + ' Department';
      var color = deptColors[i % deptColors.length];
      html += '<tr>';
      html += '<td><strong>' + fullName + '</strong></td>';
      html += '<td>' + d.total.toLocaleString() + '</td>';
      html += '<td>' + d.completed.toLocaleString() + '</td>';
      html += '<td>' + d.inProgress + '</td>';
      html += '<td>' + d.pending + '</td>';
      html += '<td><strong>' + pct + '%</strong></td>';
      html += '<td style="min-width:140px;"><div class="progress"><div class="progress-bar ' + barColor + '" style="width:' + pct + '%;background:' + color + ';"></div></div></td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  window.refreshProgress = function () {
    Toast.info('Refreshing', 'Progress data is being refreshed...');
    if (typeof API !== 'undefined') {
      fetchDataFromAPI();
    }
    setTimeout(function () {
      Toast.success('Refreshed', 'Progress data updated successfully.');
    }, 1500);
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
    initStatsCards();
    populateDeptTable();
    fetchDataFromAPI();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initStatsCards();
    populateDeptTable();
    fetchDataFromAPI();
  }

})();