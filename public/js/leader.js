(function () {
  'use strict';

  var totalAlumni = 450;
  var totalCompleted = 292;
  var totalPending = 158;

  var _apiDashboardData = null;
  var _apiAssignedAlumni = null;
  var _apiDataLoaded = false;
  var _teamId = null;

  var teamMembers = [
    { id: 1, name: 'Priya Sharma', initials: 'PS', color: '#2563EB', assigned: 65, completed: 52, pending: 13, progress: 80, status: 'On Track', lastActivity: '2 hours ago' },
    { id: 2, name: 'Amit Verma', initials: 'AV', color: '#7C3AED', assigned: 58, completed: 45, pending: 13, progress: 78, status: 'On Track', lastActivity: '4 hours ago' },
    { id: 3, name: 'Sneha Patel', initials: 'SP', color: '#F59E0B', assigned: 62, completed: 38, pending: 24, progress: 61, status: 'Behind', lastActivity: '6 hours ago' },
    { id: 4, name: 'Rahul Kumar', initials: 'RK', color: '#10B981', assigned: 55, completed: 50, pending: 5, progress: 91, status: 'On Track', lastActivity: '1 hour ago' },
    { id: 5, name: 'Deepika Gupta', initials: 'DG', color: '#EF4444', assigned: 60, completed: 30, pending: 30, progress: 50, status: 'Critical', lastActivity: '1 day ago' },
    { id: 6, name: 'Vikram Singh', initials: 'VS', color: '#06B6D4', assigned: 54, completed: 42, pending: 12, progress: 78, status: 'On Track', lastActivity: '3 hours ago' },
    { id: 7, name: 'Anjali Mishra', initials: 'AM', color: '#F43F5E', assigned: 48, completed: 35, pending: 13, progress: 73, status: 'On Track', lastActivity: '5 hours ago' },
    { id: 8, name: 'Rohan Desai', initials: 'RD', color: '#8B5CF6', assigned: 48, completed: 0, pending: 48, progress: 0, status: 'Critical', lastActivity: '2 days ago' }
  ];

  var activities = [
    { member: 'Priya Sharma', action: 'completed verification for 12 alumni records', time: '2 hours ago', type: 'green' },
    { member: 'Rahul Kumar', action: 'updated contact details for 8 alumni', time: '3 hours ago', type: 'green' },
    { member: 'Amit Verma', action: 'submitted pending documents for 5 alumni', time: '4 hours ago', type: 'green' },
    { member: 'Vikram Singh', action: 'marked 3 alumni as verified', time: '5 hours ago', type: 'purple' },
    { member: 'Anjali Mishra', action: 'uploaded 10 alumni profiles for review', time: '6 hours ago', type: 'purple' },
    { member: 'Sneha Patel', action: 'flagged 4 alumni with incorrect data', time: '7 hours ago', type: 'yellow' },
    { member: 'Deepika Gupta', action: 'requested extension for 8 pending alumni', time: '1 day ago', type: 'red' },
    { member: 'Rohan Desai', action: 'started initial review of assigned alumni', time: '2 days ago', type: 'yellow' },
    { member: 'Priya Sharma', action: 'completed phone verification for 6 alumni', time: '2 days ago', type: 'green' },
    { member: 'Amit Verma', action: 'resolved 3 data discrepancies in alumni records', time: '2 days ago', type: 'purple' }
  ];

  var notifications = [
    { icon: 'fa-check-circle', iconBg: '#D1FAE5', iconColor: '#10B981', title: 'Rahul Kumar completed 50 alumni', desc: 'Highest completion in the team', time: '1 hour ago', unread: true },
    { icon: 'fa-exclamation-triangle', iconBg: '#FEF3C7', iconColor: '#F59E0B', title: 'Deepika Gupta behind schedule', desc: 'Only 50% completion rate', time: '3 hours ago', unread: true },
    { icon: 'fa-user-plus', iconBg: '#DBEAFE', iconColor: '#2563EB', title: 'New alumni assigned to team', desc: '25 new profiles added to pool', time: '5 hours ago', unread: true },
    { icon: 'fa-flag', iconBg: '#FEE2E2', iconColor: '#EF4444', title: 'Rohan Desai has 0% progress', desc: 'Needs immediate attention', time: '1 day ago', unread: true },
    { icon: 'fa-file-export', iconBg: '#EDE9FE', iconColor: '#7C3AED', title: 'Weekly report generated', desc: 'Download available in Reports', time: '2 days ago', unread: false },
    { icon: 'fa-check-circle', iconBg: '#D1FAE5', iconColor: '#10B981', title: 'Target milestone achieved', desc: 'Team crossed 60% overall progress', time: '3 days ago', unread: false }
  ];

  var currentPage = 1;
  var pageSize = 5;
  var filteredMembers = [];
  var memberProgressChart = null;
  var completionChart = null;
  var sessionTimerInterval = null;
  var sessionTimeoutDuration = 60;
  var isSidebarCollapsed = true;

  var isDistributionLocked = false;
  var savedLockState = localStorage.getItem('teamleader_distLocked');
  if (savedLockState === 'true') isDistributionLocked = true;

  function getInitials(name) {
    return name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  function showToast(title, message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    var icons = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', danger: 'fa-times-circle', info: 'fa-info-circle' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML =
      '<div class="toast-icon"><i class="fas ' + (icons[type] || icons.info) + '"></i></div>' +
      '<div class="toast-content"><p class="toast-title">' + title + '</p><p class="toast-message">' + message + '</p></div>' +
      '<button class="toast-close"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    var closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function () { removeToast(toast); });
    setTimeout(function () { removeToast(toast); }, 4000);
  }

  function removeToast(toast) {
    if (toast.classList.contains('exit')) return;
    toast.classList.add('exit');
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }

  function updateLockBadge() {
    var badge = document.getElementById('lockStatusBadge');
    if (!badge) return;
    var icon = badge.querySelector('.lock-icon');
    var text = badge.querySelector('.lock-text');
    if (isDistributionLocked) {
      badge.style.background = '#FEF2F2';
      badge.style.borderColor = '#FECACA';
      if (icon) { icon.className = 'fas fa-lock lock-icon'; icon.style.color = '#EF4444'; }
      if (text) { text.textContent = 'Distribution: Locked'; text.style.color = '#991B1B'; }
    } else {
      badge.style.background = '#F0FDF4';
      badge.style.borderColor = '#BBF7D0';
      if (icon) { icon.className = 'fas fa-lock-open lock-icon'; icon.style.color = '#10B981'; }
      if (text) { text.textContent = 'Distribution: Open'; text.style.color = '#166534'; }
    }
    var bc = document.querySelector('.breadcrumb .current');
    if (bc) {
      if (isDistributionLocked) {
        bc.innerHTML = '<i class="fas fa-lock" style="margin-right:6px;color:#EF4444;font-size:0.7rem;"></i>Team Leader Dashboard';
      } else {
        bc.textContent = 'Team Leader Dashboard';
      }
    }
    var assignBtn = document.getElementById('assignModalBtn');
    if (assignBtn) {
      if (isDistributionLocked) {
        assignBtn.style.opacity = '0.5';
        assignBtn.style.pointerEvents = 'none';
        assignBtn.title = 'Distribution is locked';
      } else {
        assignBtn.style.opacity = '';
        assignBtn.style.pointerEvents = '';
        assignBtn.title = '';
      }
    }
  }

  function updateAssignModalLockState() {
    var lockMsg = document.getElementById('lockMessage');
    var checkboxes = document.querySelectorAll('.member-assign-check');
    var inputs = document.querySelectorAll('.member-count-input');
    var leaderInput = document.getElementById('leaderCount');
    var saveBtn = document.getElementById('saveAssignmentBtn');
    var autoDistBtn = document.getElementById('autoDistributeBtn');
    var disabled = isDistributionLocked;
    if (lockMsg) lockMsg.style.display = disabled ? 'flex' : 'none';
    checkboxes.forEach(function (cb) { cb.disabled = disabled; });
    inputs.forEach(function (inp) { inp.disabled = disabled; });
    if (leaderInput) leaderInput.disabled = disabled;
    if (saveBtn) saveBtn.disabled = disabled;
    if (autoDistBtn) autoDistBtn.disabled = disabled;
  }

  function populateOverviewCards() {
    var container = document.getElementById('overviewCards');
    var cards = [
      { icon: 'fa-user-graduate', color: 'blue', value: totalAlumni, label: 'Assigned Alumni', change: '+12 this week', changeDir: 'up' },
      { icon: 'fa-check-circle', color: 'green', value: totalCompleted, label: 'Completed', change: '+8 this week', changeDir: 'up' },
      { icon: 'fa-clock', color: 'yellow', value: totalPending, label: 'Pending', change: '-3 this week', changeDir: 'down' },
      { icon: 'fa-users', color: 'purple', value: teamMembers.length, label: 'Team Members', change: '0 this week', changeDir: 'up' }
    ];
    var html = '';
    cards.forEach(function (card) {
      html += '<div class="stat-card fade-in-up">' +
        '<div class="stat-card-icon ' + card.color + '"><i class="fas ' + card.icon + '"></i></div>' +
        '<div class="stat-card-content">' +
        '<h2 class="stat-card-value">' + card.value + '</h2>' +
        '<p class="stat-card-label">' + card.label + '</p>' +
        '<span class="stat-card-change ' + card.changeDir + '"><i class="fas fa-' + (card.changeDir === 'up' ? 'arrow-up' : 'arrow-down') + '"></i> ' + card.change + '</span>' +
        '</div></div>';
    });

    var overallProgress = Math.round((totalCompleted / totalAlumni) * 100);
    var circumference = 2 * Math.PI * 38;
    var offset = circumference - (overallProgress / 100) * circumference;
    var ringColorClass = overallProgress >= 75 ? 'green' : overallProgress >= 50 ? '' : 'yellow';

    html += '<div class="stat-card fade-in-up" style="display:flex;align-items:center;justify-content:center">' +
      '<div style="text-align:center">' +
      '<div class="progress-ring-container" style="margin:0 auto 8px">' +
      '<svg width="100" height="100" viewBox="0 0 100 100">' +
      '<circle class="progress-ring-bg" cx="50" cy="50" r="38"></circle>' +
      '<circle class="progress-ring-fill ' + ringColorClass + '" cx="50" cy="50" r="38" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"></circle>' +
      '</svg>' +
      '<div class="progress-ring-text"><span class="value">' + overallProgress + '%</span><span class="label">Progress</span></div>' +
      '</div>' +
      '<p class="stat-card-label" style="margin:0">Team Progress</p>' +
      '</div></div>';

    container.innerHTML = html;
    container.style.marginBottom = html ? '28px' : '0';
  }

  function populateTeamTable() {
    var searchVal = (document.getElementById('tableSearch').value || '').toLowerCase().trim();
    var statusVal = document.getElementById('statusFilter').value;

    filteredMembers = teamMembers.filter(function (m) {
      var matchSearch = m.name.toLowerCase().indexOf(searchVal) !== -1;
      var matchStatus = statusVal === 'all' || m.status === statusVal;
      return matchSearch && matchStatus;
    });

    var totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * pageSize;
    var end = Math.min(start + pageSize, filteredMembers.length);
    var pageData = filteredMembers.slice(start, end);

    var tbody = document.getElementById('memberTableBody');
    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px 16px;color:#94A3B8"><i class="fas fa-search" style="font-size:2rem;display:block;margin-bottom:12px;opacity:0.4"></i>No team members found matching your criteria.</td></tr>';
    } else {
      var rows = '';
      pageData.forEach(function (m, idx) {
        var statusClass = m.status === 'On Track' ? 'badge-success' : m.status === 'Behind' ? 'badge-warning' : 'badge-danger';
        var barClass = m.progress >= 75 ? 'green' : m.progress >= 50 ? '' : 'red';
        var sno = start + idx + 1;
        rows += '<tr>' +
          '<td style="font-weight:600;color:#64748B">' + sno + '</td>' +
          '<td><div style="display:flex;align-items:center;gap:10px"><div class="member-avatar" style="background:' + m.color + '">' + m.initials + '</div><span style="font-weight:500">' + m.name + '</span></div></td>' +
          '<td style="text-align:center;font-weight:600">' + m.assigned + '</td>' +
          '<td style="text-align:center;font-weight:600;color:#10B981">' + m.completed + '</td>' +
          '<td style="text-align:center;font-weight:600;color:' + (m.pending > 20 ? '#EF4444' : '#F59E0B') + '">' + m.pending + '</td>' +
          '<td><div style="display:flex;align-items:center;gap:10px"><div class="progress" style="flex:1"><div class="progress-bar ' + barClass + '" style="width:' + m.progress + '%"></div></div><span style="font-size:0.75rem;font-weight:600;color:#64748B;min-width:36px;text-align:right">' + m.progress + '%</span></div></td>' +
          '<td><span class="badge ' + statusClass + '">' + m.status + '</span></td>' +
          '<td style="font-size:0.8rem;color:#64748B">' + m.lastActivity + '</td>' +
          '<td style="text-align:center"><button class="btn btn-sm btn-outline view-detail-btn" data-id="' + m.id + '"><i class="fas fa-eye"></i> View</button></td>' +
          '</tr>';
      });
      tbody.innerHTML = rows;
    }

    document.getElementById('paginationInfo').textContent = 'Showing ' + (filteredMembers.length > 0 ? (start + 1) + '-' + end : '0') + ' of ' + filteredMembers.length + ' members';

    var pagContainer = document.getElementById('pagination');
    var pagHtml = '';
    pagHtml += '<button class="pagination-item" data-page="prev" ' + (currentPage <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
    for (var i = 1; i <= totalPages; i++) {
      pagHtml += '<button class="pagination-item ' + (i === currentPage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    pagHtml += '<button class="pagination-item" data-page="next" ' + (currentPage >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
    pagContainer.innerHTML = pagHtml;

    pagContainer.querySelectorAll('.pagination-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page === 'prev' && currentPage > 1) { currentPage--; populateTeamTable(); }
        else if (page === 'next' && currentPage < totalPages) { currentPage++; populateTeamTable(); }
        else if (page !== 'prev' && page !== 'next') { currentPage = parseInt(page); populateTeamTable(); }
      });
    });

    document.querySelectorAll('.view-detail-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'));
        openMemberDetail(id);
      });
    });
  }

  function openMemberDetail(memberId) {
    var member = null;
    for (var i = 0; i < teamMembers.length; i++) {
      if (teamMembers[i].id === memberId) { member = teamMembers[i]; break; }
    }
    if (!member) return;

    document.getElementById('memberDetailName').textContent = member.name + ' - Assigned Alumni';
    document.getElementById('memberDetailTitle').textContent = member.name;
    document.getElementById('memberDetailSubtitle').textContent = 'Team Member | ' + member.assigned + ' alumni assigned';
    document.getElementById('memberDetailRate').textContent = member.progress + '%';
    var avatar = document.getElementById('memberDetailAvatar');
    avatar.textContent = member.initials;
    avatar.style.background = member.color;

    var skeleton = document.getElementById('memberDetailSkeleton');
    var body = document.getElementById('memberDetailBody');
    skeleton.style.display = 'block';
    body.innerHTML = '';

    document.getElementById('memberDetailModalOverlay').classList.add('show');

    var apiAlumni = [];
    if (_apiDataLoaded && _apiAssignedAlumni && _apiAssignedAlumni.records) {
      apiAlumni = _apiAssignedAlumni.records.filter(function (a) {
        var assignedName = a.assignedTo || a.teamMember || '';
        return assignedName.indexOf(member.name) !== -1;
      });
    }

    setTimeout(function () {
      skeleton.style.display = 'none';
      var rows = '';
      var list = apiAlumni.length > 0 ? apiAlumni : [];
      if (list.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#94A3B8"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:12px;opacity:0.4"></i>No alumni records found for this member.</td></tr>';
        return;
      }
      list.forEach(function (a) {
        var status = a.status || 'Pending';
        var statusBadge = status === 'Completed' ? 'badge-success' : status === 'Pending' ? 'badge-warning' : 'badge-info';
        rows += '<tr><td>' + (a.name || a.fullName || '-') + '</td><td>' + (a.department || a.dept || '-') + '</td><td>' + (a.batch || '-') + '</td><td><span class="badge ' + statusBadge + '">' + status + '</span></td><td style="font-size:0.8rem;color:#64748B">' + (a.updatedAt || '-') + '</td></tr>';
      });
      body.innerHTML = rows;
    }, 400);
  }

  function populateRecentActivities() {
    var timeline = document.getElementById('timeline');
    var html = '';
    activities.forEach(function (act) {
      html += '<div class="timeline-item">' +
        '<div class="timeline-dot ' + act.type + '"></div>' +
        '<div class="timeline-content">' +
        '<h4>' + act.member + '</h4>' +
        '<p>' + act.action + '</p>' +
        '<div class="time"><i class="far fa-clock" style="margin-right:4px"></i>' + act.time + '</div>' +
        '</div></div>';
    });
    timeline.innerHTML = html;
  }

  function populateNotifications() {
    var list = document.getElementById('notifList');
    var html = '';
    var unreadCount = 0;
    var notifSource = (_apiDataLoaded && activities.length > 0) ? activities : notifications;
    notifSource.forEach(function (n, idx) {
      var isUnread = idx < 3;
      if (isUnread) unreadCount++;
      var bgColor = n.type === 'green' ? '#D1FAE5' : n.type === 'yellow' ? '#FEF3C7' : n.type === 'red' ? '#FEE2E2' : '#DBEAFE';
      var iconColor = n.type === 'green' ? '#10B981' : n.type === 'yellow' ? '#F59E0B' : n.type === 'red' ? '#EF4444' : '#2563EB';
      var icon = n.type === 'green' ? 'fa-check-circle' : n.type === 'red' ? 'fa-exclamation-triangle' : 'fa-info-circle';
      html += '<div class="notification-item ' + (isUnread ? 'unread' : '') + '">' +
        '<div class="notif-icon" style="background:' + bgColor + ';color:' + iconColor + '"><i class="fas ' + icon + '"></i></div>' +
        '<div class="notif-text"><h5>' + (n.member || 'System') + '</h5><p>' + n.action + '</p><div class="notif-time">' + n.time + '</div></div>' +
        '</div>';
    });
    list.innerHTML = html;
    document.getElementById('notifCount').textContent = unreadCount;
  }

  window.clearAllNotifications = function() {
    var list = document.getElementById('notifList');
    if (list) {
      list.innerHTML = '<div style="padding:16px;text-align:center;color:#64748B;font-size:0.8rem;">No new notifications</div>';
    }
    var count = document.getElementById('notifCount');
    if (count) {
      count.textContent = '0';
      count.style.display = 'none';
    }
    showToast('Notifications', 'All notifications cleared', 'success');
  };

  function populateAssignModal() {
    var poolEl = document.getElementById('totalPoolCount');
    if (poolEl) poolEl.textContent = totalAlumni;
    var remainingEl = document.getElementById('remainingToAssign');
    if (remainingEl) remainingEl.textContent = totalPending;
    var leaderNameEl = document.querySelector('#assignMembersList .leader-name');
    var user = API.getUser();
    var leaderName = user && user.name ? user.name : 'Arun Rajan';
    var leaderInitials = leaderName.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
    var leaderRow = document.querySelector('#assignMembersList + div .assign-member-row') || document.querySelector('.assign-member-row:first-child');
    if (leaderRow) {
      var nameEl = leaderRow.querySelector('div[style*="flex:1"] div:first-child');
      if (nameEl) {
        var badgeSpan = nameEl.querySelector('.leader-badge');
        if (badgeSpan) nameEl.innerHTML = leaderName + ' <span class="leader-badge">Leader</span>';
        else nameEl.textContent = leaderName;
      }
      var avatarEl = leaderRow.querySelector('.member-avatar');
      if (avatarEl) avatarEl.textContent = leaderInitials;
    }

    var list = document.getElementById('assignMembersList');
    var html = '';
    teamMembers.forEach(function (m) {
      var remaining = m.pending;
      html += '<div class="assign-member-row">' +
        '<input type="checkbox" class="member-assign-check" data-id="' + m.id + '" checked style="accent-color:#2563EB;width:16px;height:16px" />' +
        '<div class="member-avatar" style="background:' + m.color + '">' + m.initials + '</div>' +
        '<div style="flex:1"><div style="font-weight:600;font-size:0.85rem;color:#1E293B">' + m.name + '</div><div style="font-size:0.75rem;color:#64748B">Pending: ' + remaining + '</div></div>' +
        '<input type="number" class="count-input member-count-input" data-id="' + m.id + '" value="0" min="0" max="' + totalPending + '" />' +
        '</div>';
    });
    list.innerHTML = html;

    document.querySelectorAll('.member-assign-check, .member-count-input, #leaderCount').forEach(function (el) {
      el.addEventListener('input', updateModalTotal);
      el.addEventListener('change', updateModalTotal);
    });
    document.querySelectorAll('.member-assign-check').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var row = this.closest('.assign-member-row');
        var input = row ? row.querySelector('.count-input') : null;
        if (input) input.disabled = !this.checked;
      });
    });
    updateModalTotal();
    updateAssignModalLockState();
  }

  function updateModalTotal() {
    var total = 0;
    var leaderVal = parseInt(document.getElementById('leaderCount').value) || 0;
    total += leaderVal;
    document.querySelectorAll('.member-count-input').forEach(function (inp) {
      var cb = inp.closest('.assign-member-row').querySelector('.member-assign-check');
      if (cb && cb.checked) {
        total += parseInt(inp.value) || 0;
      }
    });
    document.getElementById('modalTotalAssign').textContent = total;
    var remaining = totalPending - total;
    document.getElementById('remainingToAssign').textContent = Math.max(0, remaining);
  }

  function autoDistribute() {
    if (isDistributionLocked) {
      showToast('Error', 'Distribution is locked. Cannot auto-distribute.', 'danger');
      return;
    }
    var checkboxes = document.querySelectorAll('.member-assign-check:checked');
    var allCountInputs = document.querySelectorAll('.member-count-input');
    var leaderInput = document.getElementById('leaderCount');
    var checkedIds = [];
    checkboxes.forEach(function (cb) { checkedIds.push(parseInt(cb.getAttribute('data-id'))); });

    allCountInputs.forEach(function (inp) {
      var id = parseInt(inp.getAttribute('data-id'));
      if (checkedIds.indexOf(id) === -1) {
        inp.value = 0;
      }
    });

    var totalPeople = checkedIds.length + 1;
    var pool = totalPending;
    var base = Math.floor(pool / totalPeople);
    var extra = pool - (base * totalPeople);

    leaderInput.value = base + (extra > 0 ? 1 : 0);
    extra--;

    allCountInputs.forEach(function (inp) {
      var id = parseInt(inp.getAttribute('data-id'));
      if (checkedIds.indexOf(id) !== -1) {
        inp.value = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra--;
      }
    });

    updateModalTotal();
    showToast('Distribution Complete', 'Alumni count evenly distributed among selected members and leader.', 'success');
  }

  function initCharts() {
    if (typeof Chart === 'undefined') return;
    var memberCanvas = document.getElementById('memberProgressChart');
    if (!memberCanvas) return;
    var memberCtx = memberCanvas.getContext('2d');
    var memberLabels = teamMembers.map(function (m) { return m.name.split(' ')[0]; });
    var memberData = teamMembers.map(function (m) { return m.progress; });
    var memberColors = teamMembers.map(function (m) { return m.color; });

    if (memberProgressChart) memberProgressChart.destroy();
    memberProgressChart = new Chart(memberCtx, {
      type: 'bar',
      data: {
        labels: memberLabels,
        datasets: [{
          label: 'Progress (%)',
          data: memberData,
          backgroundColor: memberColors.map(function (c) { return c + 'CC'; }),
          borderColor: memberColors,
          borderWidth: 2,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.y + '%'; }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: '#F1F5F9' }, ticks: { callback: function (val) { return val + '%'; } } },
          x: { grid: { display: false } }
        }
      }
    });

    var completionCanvas = document.getElementById('completionChart');
    if (!completionCanvas) return;
    var completionCtx = completionCanvas.getContext('2d');
    if (completionChart) completionChart.destroy();
    completionChart = new Chart(completionCtx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending', 'In Progress'],
        datasets: [{
          data: [totalCompleted, totalPending, 0],
          backgroundColor: ['#10B981', '#F59E0B', '#3B82F6'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, font: { family: 'Poppins', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                return ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  function setupSidebar() {
    var toggleBtn = document.getElementById('sidebarToggle');
    var hamburger = document.getElementById('hamburgerBtn');
    var overlay = document.getElementById('sidebarOverlay');
    var body = document.body;

    toggleBtn.addEventListener('click', function () {
      body.classList.toggle('sidebar-collapsed');
      isSidebarCollapsed = body.classList.contains('sidebar-collapsed');
    });

    hamburger.addEventListener('click', function () {
      document.getElementById('sidebar').classList.toggle('mobile-open');
      overlay.classList.toggle('show');
    });

    overlay.addEventListener('click', function () {
      document.getElementById('sidebar').classList.remove('mobile-open');
      overlay.classList.remove('show');
    });

    document.querySelectorAll('.sidebar-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var page = this.getAttribute('data-page');
        if (page === 'logout') {
          API.clearToken();
          showToast('Logged Out', 'You have been logged out successfully.', 'warning');
          setTimeout(function () { window.location.href = 'index.html'; }, 1500);
          return;
        }
        document.querySelectorAll('.sidebar-item').forEach(function (i) { i.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.content-section').forEach(function (s) { s.classList.remove('active'); });
        var target = document.getElementById('section-' + page);
        if (target) target.classList.add('active');
        if (body.classList.contains('sidebar-collapsed') && window.innerWidth >= 1024) {
          body.classList.remove('sidebar-collapsed');
          isSidebarCollapsed = false;
        }
        if (window.innerWidth < 1024) {
          document.getElementById('sidebar').classList.remove('mobile-open');
          overlay.classList.remove('show');
        }
      });
    });
  }

  function setupNotifications() {
    var notifBtn = document.getElementById('notifBtn');
    var dropdown = document.getElementById('notifDropdown');

    notifBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
      closeProfileDropdown();
    });

    document.addEventListener('click', function (e) {
      var container = document.getElementById('notifDropdownContainer');
      if (!container.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });
  }

  function setupProfileDropdown() {
    var profileBtn = document.getElementById('profileBtn');
    var dropdown = document.getElementById('profileDropdown');

    profileBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
      closeNotifDropdown();
    });

    document.addEventListener('click', function (e) {
      var container = document.getElementById('profileDropdownContainer');
      if (!container.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    dropdown.querySelectorAll('.dropdown-item').forEach(function (item) {
      item.addEventListener('click', function () {
        dropdown.classList.remove('show');
        showToast('Action', this.textContent.trim() + ' clicked', 'info');
      });
    });
  }

  function closeNotifDropdown() {
    document.getElementById('notifDropdown').classList.remove('show');
  }

  function closeProfileDropdown() {
    document.getElementById('profileDropdown').classList.remove('show');
  }

  function setupSearchAndFilter() {
    document.getElementById('tableSearch').addEventListener('input', function () {
      currentPage = 1;
      populateTeamTable();
    });
    document.getElementById('statusFilter').addEventListener('change', function () {
      currentPage = 1;
      populateTeamTable();
    });
    document.getElementById('globalSearch').addEventListener('input', function () {
      var val = this.value.trim();
      var activeItem = document.querySelector('.sidebar-item.active');
      var activePage = activeItem ? activeItem.getAttribute('data-page') : 'dashboard';
      if (activePage === 'dashboard') {
        var el = document.getElementById('memberSearch');
        if (el) { el.value = val; populateTeamTable(); }
      } else if (activePage === 'assignments') {
        var el = document.getElementById('myAssignmentsSearch');
        if (el) { el.value = val; renderMyAssignmentsTable(); }
      } else if (activePage === 'reports') {
        var el = document.getElementById('reportSearch');
        if (el) { el.value = val; renderTeamReportTable(); }
      }
    });
  }

  function setupModals() {
    document.getElementById('assignModalBtn').addEventListener('click', function () {
      populateAssignModal();
      document.getElementById('assignModalOverlay').classList.add('show');
    });

    document.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var overlayId = this.getAttribute('data-close');
        document.getElementById(overlayId).classList.remove('show');
      });
    });

    document.getElementById('assignModalOverlay').addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('show');
    });
    document.getElementById('memberDetailModalOverlay').addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('show');
    });

    document.getElementById('autoDistributeBtn').addEventListener('click', autoDistribute);

    document.getElementById('saveAssignmentBtn').addEventListener('click', function () {
      if (isDistributionLocked) {
        showToast('Error', 'Distribution is locked. Assignments cannot be modified.', 'danger');
        return;
      }
      var total = parseInt(document.getElementById('modalTotalAssign').textContent) || 0;
      if (total === 0) {
        showToast('Warning', 'Please assign at least one alumni to a member.', 'warning');
        return;
      }
      if (!_teamId) {
        showToast('Error', 'No team found.', 'danger');
        return;
      }
      var saveAssignmentBtn = document.getElementById('saveAssignmentBtn');
      if (!saveAssignmentBtn) return;
      saveAssignmentBtn.disabled = true;
      saveAssignmentBtn.textContent = 'Saving...';
      var allocations = [];
      var leaderId = API.getUser().id;
      var leaderCount = parseInt(document.getElementById('leaderCount').value) || 0;
      if (leaderCount > 0 && leaderId) allocations.push({ userId: leaderId, count: leaderCount });
      document.querySelectorAll('.member-count-input').forEach(function (inp) {
        var cb = inp.closest('.assign-member-row').querySelector('.member-assign-check');
        if (cb && cb.checked) {
          var count = parseInt(inp.value) || 0;
          if (count > 0) allocations.push({ userId: parseInt(inp.getAttribute('data-id')), count: count });
        }
      });
      API.redistributeAssignments(_teamId, { allocations: allocations }).then(function (res) {
        document.getElementById('assignModalOverlay').classList.remove('show');
        if (res && res.success !== false) {
          showToast('Success', total + ' alumni redistributed successfully.', 'success');
        } else {
          showToast('Success', total + ' alumni redistribution completed.', 'success');
        }
        return fetchLeaderData();
      }).catch(function (err) {
        document.getElementById('assignModalOverlay').classList.remove('show');
        showToast('Error', err.message || 'Failed to redistribute alumni.', 'danger');
      }).finally(function () {
        saveAssignmentBtn.disabled = false;
        saveAssignmentBtn.textContent = 'Save Assignment';
      });
    });

    document.getElementById('refreshDataBtn').addEventListener('click', function () {
      showToast('Refreshing', 'Dashboard data is being refreshed...', 'info');
      fetchLeaderData();
      setTimeout(function () {
        showToast('Success', 'Dashboard data refreshed successfully.', 'success');
      }, 1500);
    });

    document.getElementById('refreshBtn').addEventListener('click', function () {
      document.getElementById('refreshDataBtn').click();
    });
  }

  function setupExport() {
    var btn = document.getElementById('exportReportBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!filteredReportData || filteredReportData.length === 0) {
        showToast('Warning', 'No team progress data available to export.', 'warning');
        return;
      }
      var csv = '\uFEFF';
      csv += 'S.No,Alumni Name,Department,Batch,Assigned Member,Company,Designation,Status,Update Date\r\n';
      filteredReportData.forEach(function (r, idx) {
        var sno = idx + 1;
        var name = '"' + (r.name || '').replace(/"/g, '""') + '"';
        var dept = '"' + (r.department || '').replace(/"/g, '""') + '"';
        var batch = '"' + (r.batch || '').replace(/"/g, '""') + '"';
        var member = '"' + (r.assigned_to || r.assignedTo || r.teamMember || '').replace(/"/g, '""') + '"';
        var company = '"' + (r.company || '').replace(/"/g, '""') + '"';
        var designation = '"' + (r.designation || '').replace(/"/g, '""') + '"';
        var status = '"' + (r.status || '').replace(/"/g, '""') + '"';
        var compDate = r.completed_date || r.completedDate || r.updated_date || r.updatedDate || '-';
        if (compDate !== '-') {
          compDate = new Date(compDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        }
        csv += sno + ',' + name + ',' + dept + ',' + batch + ',' + member + ',' + company + ',' + designation + ',' + status + ',"' + compDate + '"\r\n';
      });
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'team_progress_report_' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      showToast('Success', 'Report exported successfully as CSV.', 'success');
    });
    
    var exp = document.getElementById('exportBtn');
    if (exp) {
      exp.addEventListener('click', function () {
        btn.click();
      });
    }
  }

  function setupLockFeatures() {
    var badge = document.getElementById('lockStatusBadge');
    if (badge) {
      badge.addEventListener('dblclick', function () {
        if (!isDistributionLocked) return;
        if (!_teamId) {
          showToast('Error', 'No team found.', 'danger');
          return;
        }
        API.unlockDistribution(_teamId).then(function (res) {
          if (res && res.success !== false) {
            isDistributionLocked = false;
            localStorage.setItem('teamleader_distLocked', 'false');
            updateLockBadge();
            showToast('Unlocked', 'Distribution has been unlocked.', 'success');
          } else {
            showToast('Error', res.message || 'Failed to unlock distribution.', 'danger');
          }
        }).catch(function (err) {
          showToast('Error', err.message || 'Failed to unlock distribution.', 'danger');
        });
      });
    }

    var lockBtn = document.getElementById('lockDistributionBtn');
    if (lockBtn) {
      lockBtn.addEventListener('click', function () {
        if (isDistributionLocked) {
          showToast('Already Locked', 'Distribution is already locked.', 'warning');
          return;
        }
        if (!_teamId) {
          showToast('Error', 'No team found. Cannot lock distribution.', 'danger');
          return;
        }
        API.lockDistribution(_teamId).then(function (res) {
          if (res && res.success !== false) {
            isDistributionLocked = true;
            localStorage.setItem('teamleader_distLocked', 'true');
            updateLockBadge();
            showToast('Locked', 'Distribution has been locked successfully.', 'success');
          } else {
            showToast('Error', res.message || 'Failed to lock distribution.', 'danger');
          }
        }).catch(function (err) {
          showToast('Error', err.message || 'Failed to lock distribution.', 'danger');
        });
      });
    }

    var confirmBtn = document.getElementById('confirmLockBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        if (!_teamId) {
          showToast('Error', 'No team found.', 'danger');
          var modal = document.getElementById('lockConfirmModal');
          if (modal) modal.classList.remove('show');
          return;
        }
        API.lockDistribution(_teamId).then(function (res) {
          if (res && res.success !== false) {
            isDistributionLocked = true;
            localStorage.setItem('teamleader_distLocked', 'true');
            updateLockBadge();
            var modal = document.getElementById('lockConfirmModal');
            if (modal) modal.classList.remove('show');
            showToast('Locked', 'Distribution has been locked successfully.', 'success');
          } else {
            showToast('Error', res.message || 'Failed to lock distribution.', 'danger');
            var modal = document.getElementById('lockConfirmModal');
            if (modal) modal.classList.remove('show');
          }
        }).catch(function (err) {
          showToast('Error', err.message || 'Failed to lock distribution.', 'danger');
          var modal = document.getElementById('lockConfirmModal');
          if (modal) modal.classList.remove('show');
        });
      });
    }

    var cancelBtn = document.getElementById('cancelLockBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var modal = document.getElementById('lockConfirmModal');
        if (modal) modal.classList.remove('show');
      });
    }

    var confirmModal = document.getElementById('lockConfirmModal');
    if (confirmModal) {
      confirmModal.addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('show');
      });
    }

    updateLockBadge();
  }

  function updateCharts() {
    if (memberProgressChart) {
      memberProgressChart.data.datasets[0].data = teamMembers.map(function (m) { return m.progress; });
      memberProgressChart.update();
    }
    if (completionChart) {
      completionChart.data.datasets[0].data = [totalCompleted, totalPending, 0];
      completionChart.update();
    }
  }

  // --- MY ASSIGNMENTS SECTION (Update alumni details) ---
  var myAssignmentsData = [];
  var myFilteredAssignments = [];
  var myCurrentPage = 1;
  var myPageSize = 10;

  function loadMyAssignments() {
    var tbody = document.getElementById('myAssignmentsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;"><div class="spinner"></div> Loading assignments...</td></tr>';
    
    API.getAssignedAlumni({ onlyMe: true, page: 1, limit: 100 }).then(function (res) {
      if (res && res.success) {
        myAssignmentsData = res.data.records || res.data || [];
        renderMyAssignmentsTable();
      } else {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94A3B8">Failed to load assignments.</td></tr>';
      }
    }).catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94A3B8">Error: ' + err.message + '</td></tr>';
    });
  }

  function renderMyAssignmentsTable() {
    var searchVal = (document.getElementById('myAssignmentsSearch').value || '').toLowerCase().trim();
    var statusVal = document.getElementById('myAssignmentsStatusFilter').value;

    myFilteredAssignments = myAssignmentsData.filter(function (r) {
      var matchSearch = !searchVal ||
        (r.name || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.department || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.batch || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.company || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.designation || '').toLowerCase().indexOf(searchVal) !== -1;
      var matchStatus = statusVal === 'all' || (r.status || 'Pending') === statusVal;
      return matchSearch && matchStatus;
    });

    var totalPages = Math.max(1, Math.ceil(myFilteredAssignments.length / myPageSize));
    if (myCurrentPage > totalPages) myCurrentPage = totalPages;
    var start = (myCurrentPage - 1) * myPageSize;
    var end = Math.min(start + myPageSize, myFilteredAssignments.length);
    var pageData = myFilteredAssignments.slice(start, end);

    var tbody = document.getElementById('myAssignmentsTableBody');
    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94A3B8"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:12px;opacity:0.4"></i>No assignments found.</td></tr>';
    } else {
      var html = '';
      pageData.forEach(function (r, idx) {
        var sno = start + idx + 1;
        var status = r.status || 'Pending';
        var isCompleted = status === 'Completed';
        var isDraft = status === 'Draft';
        var badgeClass = isCompleted ? 'badge-success' : (isDraft ? 'badge-info' : 'badge-warning');
        html += '<tr>' +
          '<td style="font-weight:600;color:#64748B">' + sno + '</td>' +
          '<td><strong>' + (r.name || '-') + '</strong></td>' +
          '<td>' + (r.department || '-') + '</td>' +
          '<td>' + (r.batch || '-') + '</td>' +
          '<td>' + (r.company || '-') + '</td>' +
          '<td>' + (r.designation || '-') + '</td>' +
          '<td><span class="badge ' + badgeClass + '">' + status + '</span></td>' +
          '<td style="text-align:center"><button class="btn btn-sm btn-primary update-alumni-btn" data-id="' + r.alumni_id + '" ' + (isCompleted ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '') + '><i class="fas fa-edit"></i> ' + (isCompleted ? 'Done' : 'Update') + '</button></td>' +
          '</tr>';
      });
      tbody.innerHTML = html;

      tbody.querySelectorAll('.update-alumni-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-id');
          openUpdateModal(id);
        });
      });
    }

    document.getElementById('myAssignmentsPaginationInfo').textContent = 'Showing ' + (myFilteredAssignments.length > 0 ? (start + 1) + '-' + end : '0') + ' of ' + myFilteredAssignments.length + ' assignments';

    var pagContainer = document.getElementById('myAssignmentsPagination');
    var pagHtml = '';
    pagHtml += '<button class="pagination-item" data-page="prev" ' + (myCurrentPage <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
    for (var i = 1; i <= totalPages; i++) {
      pagHtml += '<button class="pagination-item ' + (i === myCurrentPage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    pagHtml += '<button class="pagination-item" data-page="next" ' + (myCurrentPage >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
    pagContainer.innerHTML = pagHtml;

    pagContainer.querySelectorAll('.pagination-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page === 'prev' && myCurrentPage > 1) { myCurrentPage--; renderMyAssignmentsTable(); }
        else if (page === 'next' && myCurrentPage < totalPages) { myCurrentPage++; renderMyAssignmentsTable(); }
        else if (page !== 'prev' && page !== 'next') { myCurrentPage = parseInt(page); renderMyAssignmentsTable(); }
      });
    });
  }

  // --- UPDATE MODAL MANAGEMENT (For Leader Assignments Update) ---
  var currentSelectedAlumniId = null;

  function openUpdateModal(alumniId) {
    currentSelectedAlumniId = alumniId;
    var overlay = document.getElementById('updateModal');
    
    // Clear old errors
    document.querySelectorAll('#updateForm input, #updateForm select').forEach(function (el) { el.classList.remove('error'); });
    document.querySelectorAll('#updateForm .error-text').forEach(function (el) { el.style.display = 'none'; });

    // Fetch latest details
    API.getAlumniById(alumniId).then(function (res) {
      if (res && res.success) {
        var record = res.data;
        document.getElementById('modalTitle').textContent = record.name || 'Update Profile';
        document.getElementById('modalSubtitle').textContent = (record.department || '') + ' (' + (record.batch || '') + ')';
        document.getElementById('modalAvatar').textContent = (record.name || 'A').charAt(0).toUpperCase();
        
        var status = record.assignment_status || 'Pending';
        var isCompleted = status === 'Completed';
        var isDraft = status === 'Draft';
        var badgeClass = isCompleted ? 'badge-success' : (isDraft ? 'badge-info' : 'badge-warning');
        var badgeIcon = isCompleted ? 'fa-check-circle' : (isDraft ? 'fa-pen' : 'fa-clock');
        
        var statusBadge = document.getElementById('modalStatusBadge');
        statusBadge.className = 'status-badge ' + badgeClass;
        statusBadge.innerHTML = '<i class="fas ' + badgeIcon + '"></i> ' + status;

        document.getElementById('fieldName').value = record.name || '';
        document.getElementById('fieldDept').value = record.department || '';
        document.getElementById('fieldBatch').value = record.batch || '';
        document.getElementById('fieldCompany').value = record.company || record.pi_company || '';
        document.getElementById('fieldDesignation').value = record.designation || record.pi_designation || '';
        document.getElementById('fieldCity').value = record.current_city || '';
        document.getElementById('fieldState').value = record.state || '';
        document.getElementById('fieldCountry').value = record.country || '';
        document.getElementById('fieldEmail').value = record.email || record.pi_email || '';
        document.getElementById('fieldPhone').value = record.phone || record.pi_phone || '';
        document.getElementById('fieldLinkedin').value = record.linkedin_profile || record.linkedin_url || '';
        document.getElementById('fieldWorkingDetails').value = record.working_details || '';
        document.getElementById('fieldHigherStudies').value = record.higher_studies || '';
        document.getElementById('fieldHigherDetails').value = record.higher_studies_details || '';
        document.getElementById('fieldEntrepreneur').value = record.is_entrepreneur ? 'Yes' : 'No';
        document.getElementById('fieldGovtJob').value = record.is_government_job ? 'Yes' : 'No';
        document.getElementById('fieldOtherOcc').value = record.other_occupation || '';
        document.getElementById('fieldRemarks').value = record.remarks || '';

        if (record.higher_studies === 'Yes') {
          document.getElementById('higherStudiesDetails').style.display = 'block';
        } else {
          document.getElementById('higherStudiesDetails').style.display = 'none';
        }

        overlay.classList.add('show');
      }
    });
  }

  function readFormValues() {
    return {
      name: document.getElementById('fieldName').value.trim(),
      department: document.getElementById('fieldDept').value,
      batch: document.getElementById('fieldBatch').value,
      company: document.getElementById('fieldCompany').value.trim(),
      designation: document.getElementById('fieldDesignation').value.trim(),
      current_city: document.getElementById('fieldCity').value.trim(),
      state: document.getElementById('fieldState').value.trim(),
      country: document.getElementById('fieldCountry').value.trim(),
      email: document.getElementById('fieldEmail').value.trim(),
      phone: document.getElementById('fieldPhone').value.trim(),
      linkedin_url: document.getElementById('fieldLinkedin').value.trim(),
      working_details: document.getElementById('fieldWorkingDetails').value.trim(),
      higher_studies: document.getElementById('fieldHigherStudies').value,
      higher_studies_details: document.getElementById('fieldHigherDetails').value.trim(),
      is_entrepreneur: document.getElementById('fieldEntrepreneur').value === 'Yes',
      is_government_job: document.getElementById('fieldGovtJob').value === 'Yes',
      other_occupation: document.getElementById('fieldOtherOcc').value.trim(),
      remarks: document.getElementById('fieldRemarks').value.trim()
    };
  }

  function validateForm() {
    var isValid = true;
    var required = ['fieldName', 'fieldDept', 'fieldBatch', 'fieldCompany'];
    required.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el.value || el.value.trim() === '') {
        el.classList.add('error');
        isValid = false;
      } else {
        el.classList.remove('error');
      }
    });
    return isValid;
  }

  function setupUpdateModalEvents() {
    var select = document.getElementById('fieldHigherStudies');
    if (select) {
      select.addEventListener('change', function () {
        document.getElementById('higherStudiesDetails').style.display = this.value === 'Yes' ? 'block' : 'none';
      });
    }

    document.getElementById('saveDraftBtn').addEventListener('click', function () {
      var draftBtn = this;
      draftBtn.disabled = true;
      var data = readFormValues();
      API.saveAlumniDraft(currentSelectedAlumniId, data).then(function (res) {
        showToast('Success', 'Draft saved successfully.', 'success');
        document.getElementById('updateModal').classList.remove('show');
        loadMyAssignments();
      }).catch(function (err) {
        showToast('Error', err.message || 'Failed to save draft.', 'danger');
      }).finally(function () {
        draftBtn.disabled = false;
      });
    });

    document.getElementById('submitRecordBtn').addEventListener('click', function () {
      if (!validateForm()) {
        showToast('Validation Error', 'Please fill in all required fields.', 'danger');
        return;
      }
      var submitBtn = this;
      submitBtn.disabled = true;
      var data = readFormValues();
      API.submitAlumni(currentSelectedAlumniId, data).then(function (res) {
        showToast('Success', 'Record submitted successfully.', 'success');
        document.getElementById('updateModal').classList.remove('show');
        loadMyAssignments();
        fetchLeaderData();
      }).catch(function (err) {
        showToast('Error', err.message || 'Failed to submit record.', 'danger');
      }).finally(function () {
        submitBtn.disabled = false;
      });
    });
  }

  // --- REAL-TIME TEAM PROGRESS SECTION ---
  var realtimeMemberChart = null;
  var realtimeCompletionChart = null;

  function loadTeamProgress() {
    // Populate detailed realtime table
    var tbody = document.getElementById('realtimeProgressTableBody');
    if (teamMembers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94A3B8">No progress details.</td></tr>';
      return;
    }
    var rows = '';
    teamMembers.forEach(function (m, idx) {
      var statusClass = m.status === 'On Track' ? 'badge-success' : m.status === 'Behind' ? 'badge-warning' : 'badge-danger';
      var barClass = m.progress >= 75 ? 'green' : m.progress >= 50 ? '' : 'red';
      var sno = idx + 1;
      rows += '<tr>' +
        '<td style="font-weight:600;color:#64748B">' + sno + '</td>' +
        '<td><div style="display:flex;align-items:center;gap:10px"><div class="member-avatar" style="background:' + m.color + '">' + m.initials + '</div><span style="font-weight:500">' + m.name + '</span></div></td>' +
        '<td style="text-align:center;font-weight:600">' + m.assigned + '</td>' +
        '<td style="text-align:center;font-weight:600;color:#10B981">' + m.completed + '</td>' +
        '<td style="text-align:center;font-weight:600;color:' + (m.pending > 20 ? '#EF4444' : '#F59E0B') + '">' + m.pending + '</td>' +
        '<td><div style="display:flex;align-items:center;gap:10px"><div class="progress" style="flex:1"><div class="progress-bar ' + barClass + '" style="width:' + m.progress + '%"></div></div><span style="font-size:0.75rem;font-weight:600;color:#64748B;min-width:36px;text-align:right">' + m.progress + '%</span></div></td>' +
        '<td><span class="badge ' + statusClass + '">' + m.status + '</span></td>' +
        '<td style="font-size:0.8rem;color:#64748B">' + m.lastActivity + '</td>' +
        '</tr>';
    });
    tbody.innerHTML = rows;

    // Render Progress Page Charts
    if (typeof Chart === 'undefined') return;
    var memberCanvas = document.getElementById('realtimeMemberChart');
    if (memberCanvas) {
      var memberCtx = memberCanvas.getContext('2d');
      var memberLabels = teamMembers.map(function (m) { return m.name.split(' ')[0]; });
      var memberData = teamMembers.map(function (m) { return m.progress; });
      var memberColors = teamMembers.map(function (m) { return m.color; });

      if (realtimeMemberChart) realtimeMemberChart.destroy();
      realtimeMemberChart = new Chart(memberCtx, {
        type: 'bar',
        data: {
          labels: memberLabels,
          datasets: [{
            label: 'Progress (%)',
            data: memberData,
            backgroundColor: memberColors.map(function (c) { return c + 'CC'; }),
            borderColor: memberColors,
            borderWidth: 2,
            borderRadius: 6,
            barPercentage: 0.6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, max: 100 }, x: { grid: { display: false } } }
        }
      });
    }

    var completionCanvas = document.getElementById('realtimeCompletionChart');
    if (completionCanvas) {
      var completionCtx = completionCanvas.getContext('2d');
      if (realtimeCompletionChart) realtimeCompletionChart.destroy();
      realtimeCompletionChart = new Chart(completionCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending'],
          datasets: [{
            data: [totalCompleted, totalPending],
            backgroundColor: ['#10B981', '#F59E0B'],
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }

  // --- TEAM REPORT SECTION (Read-only update viewing) ---
  var reportData = [];
  var filteredReportData = [];
  var reportCurrentPage = 1;
  var reportPageSize = 10;

  function loadTeamReport() {
    var tbody = document.getElementById('teamReportTableBody');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;"><div class="spinner"></div> Loading report history...</td></tr>';
    
    API.getAssignedAlumni({ onlyMe: false, page: 1, limit: 100 }).then(function (res) {
      if (res && res.success) {
        reportData = res.data.records || res.data || [];
        populateReportUserFilter();
        renderTeamReportTable();
      } else {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#94A3B8">Failed to load report history.</td></tr>';
      }
    }).catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#94A3B8">Error: ' + err.message + '</td></tr>';
    });
  }

  function populateReportUserFilter() {
    var select = document.getElementById('reportUserFilter');
    if (!select) return;
    
    var users = {};
    reportData.forEach(function (r) {
      var name = r.assigned_to || r.assignedTo || r.teamMember || '';
      if (name) users[name] = true;
    });

    var html = '<option value="all">All Members</option>';
    Object.keys(users).sort().forEach(function (name) {
      html += '<option value="' + name + '">' + name + '</option>';
    });
    select.innerHTML = html;
  }

  function renderTeamReportTable() {
    var searchVal = (document.getElementById('reportSearch').value || '').toLowerCase().trim();
    var userVal = document.getElementById('reportUserFilter').value;
    var statusVal = document.getElementById('reportStatusFilter').value;

    filteredReportData = reportData.filter(function (r) {
      var assignedTo = r.assigned_to || r.assignedTo || r.teamMember || '';
      var matchSearch = !searchVal ||
        (r.name || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.register_no || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.department || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.batch || '').toLowerCase().indexOf(searchVal) !== -1;
      var matchUser = userVal === 'all' || assignedTo === userVal;
      var matchStatus = statusVal === 'all' || (r.status || 'Pending') === statusVal;
      return matchSearch && matchUser && matchStatus;
    });

    var totalPages = Math.max(1, Math.ceil(filteredReportData.length / reportPageSize));
    if (reportCurrentPage > totalPages) reportCurrentPage = totalPages;
    var start = (reportCurrentPage - 1) * reportPageSize;
    var end = Math.min(start + reportPageSize, filteredReportData.length);
    var pageData = filteredReportData.slice(start, end);

    var tbody = document.getElementById('teamReportTableBody');
    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#94A3B8"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:12px;opacity:0.4"></i>No update history found.</td></tr>';
    } else {
      var html = '';
      pageData.forEach(function (r, idx) {
        var sno = start + idx + 1;
        var status = r.status || 'Pending';
        var badgeClass = status === 'Completed' ? 'badge-success' : (status === 'Draft' ? 'badge-info' : 'badge-warning');
        var compDate = r.completed_date || r.completedDate || r.updated_date || r.updatedDate || '-';
        if (compDate !== '-') {
          compDate = new Date(compDate).toLocaleDateString() + ' ' + new Date(compDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        var updaterName = r.assigned_to || r.assignedTo || r.teamMember || '-';
        html += '<tr>' +
          '<td style="font-weight:600;color:#64748B">' + sno + '</td>' +
          '<td><strong>' + (r.name || '-') + '</strong></td>' +
          '<td>' + (r.department || '-') + '</td>' +
          '<td>' + (r.batch || '-') + '</td>' +
          '<td>' + updaterName + '</td>' +
          '<td>' + (r.company || '-') + '</td>' +
          '<td>' + (r.designation || '-') + '</td>' +
          '<td><span class="badge ' + badgeClass + '">' + status + '</span></td>' +
          '<td style="font-size:0.8rem;color:#64748B">' + compDate + '</td>' +
          '</tr>';
      });
      tbody.innerHTML = html;
    }

    document.getElementById('reportPaginationInfo').textContent = 'Showing ' + (filteredReportData.length > 0 ? (start + 1) + '-' + end : '0') + ' of ' + filteredReportData.length + ' records';

    var pagContainer = document.getElementById('reportPagination');
    var pagHtml = '';
    pagHtml += '<button class="pagination-item" data-page="prev" ' + (reportCurrentPage <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
    for (var i = 1; i <= totalPages; i++) {
      pagHtml += '<button class="pagination-item ' + (i === reportCurrentPage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    pagHtml += '<button class="pagination-item" data-page="next" ' + (reportCurrentPage >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
    pagContainer.innerHTML = pagHtml;

    pagContainer.querySelectorAll('.pagination-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page === 'prev' && reportCurrentPage > 1) { reportCurrentPage--; renderTeamReportTable(); }
        else if (page === 'next' && reportCurrentPage < totalPages) { reportCurrentPage++; renderTeamReportTable(); }
        else if (page !== 'prev' && page !== 'next') { reportCurrentPage = parseInt(page); renderTeamReportTable(); }
      });
    });
  }

  function setupSessionTimeout() {
    var overlay = document.getElementById('sessionTimeoutOverlay');
    var timerEl = document.getElementById('sessionTimer');
    var extendBtn = document.getElementById('extendSessionBtn');
    var logoutBtn = document.getElementById('logoutSessionBtn');
    var timeout = null;
    var countdown = null;

    function resetSessionTimer() {
      if (timeout) clearTimeout(timeout);
      if (countdown) clearInterval(countdown);
      overlay.classList.remove('show');
      sessionTimeoutDuration = 60;

      timeout = setTimeout(function () {
        overlay.classList.add('show');
        sessionTimeoutDuration = 60;
        timerEl.textContent = sessionTimeoutDuration;
        countdown = setInterval(function () {
          sessionTimeoutDuration--;
          timerEl.textContent = sessionTimeoutDuration;
          if (sessionTimeoutDuration <= 0) {
            clearInterval(countdown);
            overlay.classList.remove('show');
            showToast('Session Expired', 'Your session has expired. Please log in again.', 'danger');
          }
        }, 1000);
      }, 300000);
    }

    extendBtn.addEventListener('click', function () {
      resetSessionTimer();
      showToast('Session Extended', 'Your session has been extended.', 'success');
    });

    logoutBtn.addEventListener('click', function () {
      if (countdown) clearInterval(countdown);
      if (timeout) clearTimeout(timeout);
      overlay.classList.remove('show');
      showToast('Logged Out', 'You have been logged out successfully.', 'warning');
    });

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function (evt) {
      document.addEventListener(evt, resetSessionTimer);
    });

    resetSessionTimer();
  }

  function setLeaderUserInfo() {
    var user = API.getUser();
    if (user && user.name) {
      var nameEls = document.querySelectorAll('.sidebar-user-name, .navbar-profile-name');
      nameEls.forEach(function (el) { if (el) el.textContent = user.name; });
      var avatarEls = document.querySelectorAll('.sidebar-user-avatar, .navbar-profile-avatar .avatar');
      avatarEls.forEach(function (el) { if (el) el.textContent = user.name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2); });
      var greeting = document.querySelector('.page-header p');
      if (greeting) greeting.textContent = 'Welcome back, ' + user.name.split(' ')[0] + '! Here\'s your team\'s progress overview.';
    }
  }

  function fetchLeaderData() {
    return Promise.all([
      API.getLeaderDashboard().catch(function () { return null; }),
      API.getAssignedAlumni({ page: 1, limit: 100 }).catch(function () { return null; })
    ]).then(function (results) {
      var dash = results[0];
      if (dash && dash.success) {
        _apiDashboardData = dash.data;
        _apiDataLoaded = true;
        _teamId = _apiDashboardData.teamId || null;
        if (_apiDashboardData.totalAssigned !== undefined) totalAlumni = _apiDashboardData.totalAssigned;
        if (_apiDashboardData.totalCompleted !== undefined) totalCompleted = _apiDashboardData.totalCompleted;
        else if (_apiDashboardData.completed !== undefined) totalCompleted = _apiDashboardData.completed;
        if (_apiDashboardData.totalPending !== undefined) totalPending = _apiDashboardData.totalPending;
        else if (_apiDashboardData.pending !== undefined) totalPending = _apiDashboardData.pending;
        if (_apiDashboardData.teamMembers && _apiDashboardData.teamMembers.length > 0) {
          teamMembers = _apiDashboardData.teamMembers.map(function (m, idx) {
            var initials = (m.name || '?').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
            var colors = ['#2563EB', '#7C3AED', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#F43F5E', '#8B5CF6'];
            return {
              id: m.id || (idx + 1),
              name: m.name,
              initials: initials,
              color: m.color || colors[idx % colors.length],
              assigned: m.assigned || 0,
              completed: m.completed || 0,
              pending: (m.assigned || 0) - (m.completed || 0),
              progress: m.progress || ((m.assigned || 0) > 0 ? Math.round(((m.completed || 0) / m.assigned) * 100) : 0),
              status: m.status || (m.progress >= 75 ? 'On Track' : m.progress >= 50 ? 'Behind' : 'Critical'),
              lastActivity: m.lastActivity || '-'
            };
          });
        }
      }
      var assigned = results[1];
      if (assigned && assigned.success) {
        _apiAssignedAlumni = assigned.data;
      }
      populateNotifications();
      populateOverviewCards();
      populateTeamTable();
      initCharts();
    }).catch(function () {
      populateNotifications();
      populateOverviewCards();
      populateTeamTable();
      initCharts();
    });
  }

  function init() {
    setLeaderUserInfo();
    setupSidebar();
    setupNotifications();
    setupProfileDropdown();
    setupSearchAndFilter();
    setupModals();
    setupExport();
    setupLockFeatures();
    setupSessionTimeout();
    setupUpdateModalEvents();
    fetchLeaderData();

    // Hook tab-specific navigation load events
    document.querySelectorAll('.sidebar-nav .sidebar-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page === 'assignments') {
          loadMyAssignments();
        } else if (page === 'progress') {
          loadTeamProgress();
        } else if (page === 'reports') {
          loadTeamReport();
        }
      });
    });

    // Bind my assignments sub-filters
    document.getElementById('myAssignmentsSearch').addEventListener('input', renderMyAssignmentsTable);
    document.getElementById('myAssignmentsStatusFilter').addEventListener('change', renderMyAssignmentsTable);

    // Bind report sub-filters
    document.getElementById('reportSearch').addEventListener('input', renderTeamReportTable);
    document.getElementById('reportUserFilter').addEventListener('change', renderTeamReportTable);
    document.getElementById('reportStatusFilter').addEventListener('change', renderTeamReportTable);

    setTimeout(function () {
      document.getElementById('loadingScreen').classList.add('hide');
      document.body.style.overflow = 'visible';
    }, 800);

    document.querySelectorAll('.stat-card').forEach(function (card, idx) {
      card.style.animationDelay = (idx * 0.08) + 's';
    });
  }

  window.switchSettingsTab = function(tabName, btn) {
    var tabsContainer = btn.closest('.card-body');
    tabsContainer.querySelectorAll('.tab-item').forEach(function(item) {
      item.classList.remove('active');
      item.style.fontWeight = 'normal';
    });
    tabsContainer.querySelectorAll('.tab-content').forEach(function(content) {
      content.style.display = 'none';
      content.classList.remove('active');
    });
    btn.classList.add('active');
    btn.style.fontWeight = 'bold';
    var target = document.getElementById('tab-' + tabName);
    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
