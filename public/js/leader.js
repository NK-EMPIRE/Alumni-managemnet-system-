(function () {
  'use strict';

  var totalAlumni = 0;
  var totalCompleted = 0;
  var totalPending = 0;
  var totalDraft = 0;
  var totalUndistributed = 0;

  var _apiDashboardData = null;
  var _apiAssignedAlumni = null;
  var _apiDataLoaded = false;
  var _teamId = null;

  var teamMembers = [];
  var activities = [];

  // No dummy notifications — real data loaded from API activities

  var currentPage = 1;
  var pageSize = 50;
  var filteredMembers = [];
  var memberProgressChart = null;
  var completionChart = null;
  var sessionTimerInterval = null;
  var sessionTimeoutDuration = 60;
  var isSidebarCollapsed = false;

  var isDistributionLocked = false;

  window.openModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

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
    var bc = document.querySelector('.breadcrumb .current');
    if (bc) {
      bc.textContent = 'Team Leader Dashboard';
    }
    var badge = document.getElementById('lockStatusBadge');
    if (!badge) return;
    var icon = badge.querySelector('.lock-icon');
    var text = badge.querySelector('.lock-text');
    var isDark = document.body.classList.contains('dark-mode');
    if (isDistributionLocked) {
      badge.style.background = isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2';
      badge.style.borderColor = isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA';
      if (icon) { icon.className = 'fas fa-lock lock-icon'; icon.style.color = '#EF4444'; }
      if (text) { text.textContent = 'Distribution: Locked'; text.style.color = isDark ? '#FCA5A5' : '#991B1B'; }
    } else {
      badge.style.background = isDark ? 'rgba(16, 185, 129, 0.2)' : '#F0FDF4';
      badge.style.borderColor = isDark ? 'rgba(16, 185, 129, 0.4)' : '#BBF7D0';
      if (icon) { icon.className = 'fas fa-lock-open lock-icon'; icon.style.color = '#10B981'; }
      if (text) { text.textContent = 'Distribution: Open'; text.style.color = isDark ? '#6EE7B7' : '#166534'; }
    }
  }

  function updateAssignModalLockState() {
    var lockMsg = document.getElementById('lockMessage');
    var checkboxes = document.querySelectorAll('.member-assign-check');
    var inputs = document.querySelectorAll('.member-count-input');
    var saveBtn = document.getElementById('saveAssignmentBtn');
    var autoDistBtn = document.getElementById('autoDistributeBtn');
    var disabled = isDistributionLocked;
    if (lockMsg) lockMsg.style.display = disabled ? 'flex' : 'none';
    checkboxes.forEach(function (cb) { cb.disabled = disabled; });
    inputs.forEach(function (inp) { inp.disabled = disabled; });
    if (saveBtn) saveBtn.disabled = disabled;
    if (autoDistBtn) autoDistBtn.disabled = disabled;
  }

  function populateOverviewCards() {
    var container = document.getElementById('overviewCards');
    var leaderMember = teamMembers.find(function (m) { return m.isLeader; });
    var assignedValue = leaderMember ? leaderMember.assigned : 0;
    var cards = [
      { icon: 'fa-user-graduate', color: 'blue', value: assignedValue, label: 'Assigned Alumni', change: '', changeDir: 'up' },
      { icon: 'fa-check-circle', color: 'green', value: totalCompleted, label: 'Completed', change: '', changeDir: 'up' },
      { icon: 'fa-clock', color: 'yellow', value: totalPending, label: 'Pending', change: '', changeDir: 'down' },
      { icon: 'fa-file-alt', color: 'blue', value: totalDraft, label: 'In Draft', change: '', changeDir: 'up' },
      { icon: 'fa-hourglass-half', color: 'purple', value: totalUndistributed, label: 'Awaiting Distribution', change: '', changeDir: 'up' },
      { icon: 'fa-users', color: 'green', value: teamMembers.length, label: 'Team Members', change: '', changeDir: 'up' }
    ];
    var html = '';
    cards.forEach(function (card) {
      html += '<div class="stat-card fade-in-up">' +
        '<div class="stat-card-icon ' + card.color + '"><i class="fas ' + card.icon + '"></i></div>' +
        '<div class="stat-card-content">' +
        '<h2 class="stat-card-value">' + card.value + '</h2>' +
        '<p class="stat-card-label">' + card.label + '</p>' +
        '</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function populateTeamTable() {
    var searchVal = (document.getElementById('tableSearch').value || '').toLowerCase().trim();

    filteredMembers = teamMembers.filter(function (m) {
      var matchSearch = m.name.toLowerCase().indexOf(searchVal) !== -1;
      return matchSearch;
    });

    filteredMembers.sort(function (a, b) {
      if (a.isLeader && !b.isLeader) return -1;
      if (!a.isLeader && b.isLeader) return 1;
      return 0;
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
        var barClass = m.progress >= 75 ? 'green' : m.progress >= 50 ? '' : 'red';
        var sno = start + idx + 1;
        var displayName = m.name;
        if (searchVal) {
          var cleanQuery = searchVal.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          var regex = new RegExp('(' + cleanQuery + ')', 'gi');
          displayName = displayName.replace(regex, '<mark style="background:#FEF08A;color:#854D0E;padding:0 2px;border-radius:2px;font-weight:600;">$1</mark>');
        }
        var user = API.getUser();
        var isLeader = m.isLeader || m.is_leader || (user && user.id && m.id == user.id) || (user && user.name && m.name === user.name) || (m.name && m.name.indexOf('Sarala') !== -1);
        if (isLeader) {
          displayName += ' <span class="leader-badge" style="margin-left:8px;">Leader</span>';
        }
        rows += '<tr>' +
          '<td style="font-weight:600;color:#64748B">' + sno + '</td>' +
          '<td><div style="display:flex;align-items:center;gap:10px"><div class="member-avatar" style="background:' + m.color + '">' + m.initials + '</div><span style="font-weight:500">' + displayName + '</span></div></td>' +
          '<td style="text-align:center;font-weight:600">' + m.assigned + '</td>' +
          '<td style="text-align:center;font-weight:600;color:#10B981">' + m.completed + '</td>' +
          '<td style="text-align:center;font-weight:600;color:' + (m.pending > 20 ? '#EF4444' : '#F59E0B') + '">' + m.pending + '</td>' +
          '<td><div style="display:flex;align-items:center;gap:10px"><div class="progress" style="flex:1"><div class="progress-bar ' + barClass + '" style="width:' + m.progress + '%"></div></div><span style="font-size:0.75rem;font-weight:600;color:#64748B;min-width:36px;text-align:right">' + m.progress + '%</span></div></td>' +
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
    var roleLabel = member.isLeader ? 'Team Leader' : 'Team Member';
    document.getElementById('memberDetailSubtitle').textContent = roleLabel + ' | ' + member.assigned + ' alumni assigned';
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
        var assignedName = a.assigned_to || a.assignedTo || a.teamMember || '';
        return assignedName.toLowerCase().indexOf(member.name.toLowerCase()) !== -1;
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
    if (!timeline) return;
    var html = '';
    var list = _apiDataLoaded && _apiDashboardData && _apiDashboardData.recentActivity ? _apiDashboardData.recentActivity : [];
    if (list.length === 0) {
      timeline.innerHTML = '<div style="padding:16px;text-align:center;color:#64748B;font-size:0.8rem;">No recent activities.</div>';
      return;
    }
    list.forEach(function (act) {
      var actTime = act.time || act.timestamp || 'Just now';
      if (actTime && actTime !== 'Just now') {
        actTime = new Date(actTime).toLocaleDateString() + ' ' + new Date(actTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      html += '<div class="timeline-item">' +
        '<div class="timeline-dot green"></div>' +
        '<div class="timeline-content">' +
        '<h4>' + (act.user || 'System') + '</h4>' +
        '<p>' + act.action + '</p>' +
        '<div class="time"><i class="far fa-clock" style="margin-right:4px"></i>' + actTime + '</div>' +
        '</div></div>';
    });
    timeline.innerHTML = html;
  }

  window.toggleNotifications = function (e) {
    if (e) e.stopPropagation();
    var dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;
    var isShowing = dropdown.style.display === 'block';
    dropdown.style.display = isShowing ? 'none' : 'block';
  };

  document.addEventListener('click', function (e) {
    var dropdown = document.getElementById('notifDropdown');
    var btn = document.getElementById('notifBtn');
    if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  function populateNotifications() {
    var list = document.getElementById('notifList');
    if (!list) return;

    var records = _apiAssignedAlumni && _apiAssignedAlumni.records ? _apiAssignedAlumni.records : [];
    var cleared = JSON.parse(localStorage.getItem('cleared_notifications_leader') || '[]');
    // Filter completed or draft records as notifications
    var updatedRecords = records.filter(function (r) {
      var key = (r.alumni_id || r.id) + '_' + r.status;
      return (r.status === 'Completed' || r.status === 'Draft') && cleared.indexOf(key) === -1;
    });
    var nc = document.getElementById('notifCount');

    if (updatedRecords.length === 0) {
      list.innerHTML = '<div style="padding:16px;text-align:center;color:#64748B;font-size:0.8rem;">No notifications</div>';
      if (nc) { nc.textContent = '0'; nc.style.display = 'none'; }
      return;
    }

    var html = '';
    var unreadCount = 0;

    var completedList = updatedRecords.filter(function (r) { return r.status === 'Completed'; });
    var draftList = updatedRecords.filter(function (r) { return r.status === 'Draft'; });

    if (completedList.length > 0) {
      unreadCount++;
      html += '<div class="notification-item unread">' +
        '<div class="notif-icon" style="background:#D1FAE5;color:#10B981;"><i class="fas fa-check-circle"></i></div>' +
        '<div class="notif-text">' +
        '<h5>Completed Updates</h5>' +
        '<p>' + completedList.length + ' alumni details successfully updated by your team</p>' +
        '</div></div>';
    }

    if (draftList.length > 0) {
      unreadCount++;
      html += '<div class="notification-item unread">' +
        '<div class="notif-icon" style="background:#FEF3C7;color:#F59E0B;"><i class="fas fa-pen"></i></div>' +
        '<div class="notif-text">' +
        '<h5>Draft Updates</h5>' +
        '<p>' + draftList.length + ' updates saved as draft by your team</p>' +
        '</div></div>';
    }

    list.innerHTML = html;
    if (nc) { nc.textContent = unreadCount; nc.style.display = unreadCount > 0 ? 'inline-flex' : 'none'; }
  }

  window.clearAllNotifications = function () {
    var list = document.getElementById('notifList');
    if (list) {
      list.innerHTML = '<div style="padding:16px;text-align:center;color:#64748B;font-size:0.8rem;">No new notifications</div>';
    }

    var records = _apiAssignedAlumni && _apiAssignedAlumni.records ? _apiAssignedAlumni.records : [];
    var cleared = JSON.parse(localStorage.getItem('cleared_notifications_leader') || '[]');
    records.forEach(function (r) {
      if (r.status === 'Completed' || r.status === 'Draft') {
        var key = (r.alumni_id || r.id) + '_' + r.status;
        if (cleared.indexOf(key) === -1) cleared.push(key);
      }
    });
    localStorage.setItem('cleared_notifications_leader', JSON.stringify(cleared));

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

    document.querySelectorAll('.member-assign-check, .member-count-input').forEach(function (el) {
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
    var checkedIds = [];
    checkboxes.forEach(function (cb) { checkedIds.push(parseInt(cb.getAttribute('data-id'))); });

    allCountInputs.forEach(function (inp) {
      var id = parseInt(inp.getAttribute('data-id'));
      if (checkedIds.indexOf(id) === -1) {
        inp.value = 0;
      }
    });

    var totalPeople = checkedIds.length || 1;
    var pool = totalPending;
    var base = Math.floor(pool / totalPeople);
    var extra = pool - (base * totalPeople);

    allCountInputs.forEach(function (inp) {
      var id = parseInt(inp.getAttribute('data-id'));
      if (checkedIds.indexOf(id) !== -1) {
        inp.value = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra--;
      }
    });

    updateModalTotal();
    showToast('Distribution Complete', 'Alumni count evenly distributed among selected members.', 'success');
  }

  function initCharts() {
    if (typeof Chart === 'undefined') return;
    var isDark = document.body.classList.contains('dark-mode');
    var tickColor = isDark ? '#F8FAFC' : '#475569';
    var gridColor = isDark ? 'rgba(255, 255, 255, 0.15)' : '#E2E8F0';

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
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              font: { family: 'Poppins', size: 11, weight: '500' },
              callback: function (val) { return val + '%'; }
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: tickColor,
              font: { family: 'Poppins', size: 11, weight: '500' }
            }
          }
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
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              color: tickColor,
              font: { family: 'Poppins', size: 11, weight: '500' }
            }
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

  window.addEventListener('themeChanged', function () {
    if (typeof initCharts === 'function') initCharts();
    if (typeof updateLockBadge === 'function') updateLockBadge();
  });

  function setupSidebar() {
    var body = document.body;

    document.querySelectorAll('.sidebar-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var page = this.getAttribute('data-page');
        if (page === 'logout') {
          API.clearToken();
          showToast('Logged Out', 'You have been logged out successfully.', 'warning');
          setTimeout(function () { window.location.href = 'index.html?logout=success'; }, 1500);
          return;
        }
        if (page === 'campaign' || page === 'email-campaign') {
          if (typeof window.openEmailCampaignModal === 'function') {
            window.openEmailCampaignModal();
          }
          return;
        }
        if (page === 'chat') {
          // Show full-page WhatsApp chat section
          document.body.classList.add('chat-active');
          document.querySelectorAll('.sidebar-item').forEach(function (i) { i.classList.remove('active'); });
          document.querySelectorAll('.content-section').forEach(function (s) { s.classList.remove('active'); s.style.display = 'none'; });
          document.querySelector('.sidebar-item[data-page="chat"]') && document.querySelector('.sidebar-item[data-page="chat"]').classList.add('active');
          var chatSec = document.getElementById('section-chat');
          if (chatSec) { chatSec.style.display = 'flex'; chatSec.classList.add('active'); }
          var globalHeader = document.getElementById('globalPageHeader');
          if (globalHeader) globalHeader.style.display = 'none';
          if (typeof window.initWhatsAppChatPage === 'function') window.initWhatsAppChatPage();
          return;
        }
        document.body.classList.remove('chat-active');
        if (page === 'notifications') {
          return;
        }
        document.querySelectorAll('.sidebar-item').forEach(function (i) { i.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.content-section').forEach(function (s) {
          s.classList.remove('active');
          s.style.display = 'none';
        });
        var target = document.getElementById('section-' + page);
        if (target) {
          target.style.display = 'block';
          target.classList.add('active');
        }
        if (page === 'alumniAnalysis' && typeof window.initAnalysisPage === 'function') {
          window.initAnalysisPage();
        }
        window.scrollTo({ top: 0, behavior: 'instant' });

        var globalHeader = document.getElementById('globalPageHeader');
        if (globalHeader) {
          if (page === 'dashboard') {
            globalHeader.style.display = 'flex';
          } else {
            globalHeader.style.display = 'none';
          }
        }

        if (window.innerWidth < 1024) {
          var sidebar = document.getElementById('sidebar');
          var overlay = document.getElementById('sidebarOverlay');
          if (sidebar) sidebar.classList.remove('mobile-open');
          if (overlay) overlay.classList.remove('show');
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
    if (!profileBtn || !dropdown) return;

    profileBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
      closeNotifDropdown();
    });

    document.addEventListener('click', function (e) {
      var container = document.getElementById('profileDropdownContainer');
      if (container && !container.contains(e.target)) {
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
    var el = document.getElementById('notifDropdown');
    if (el) el.classList.remove('show');
  }

  function closeProfileDropdown() {
    var el = document.getElementById('profileDropdown');
    if (el) el.classList.remove('show');
  }

  function setupSearchAndFilter() {
    var tblSearch = document.getElementById('tableSearch');
    if (tblSearch) {
      tblSearch.addEventListener('input', function () {
        currentPage = 1;
        populateTeamTable();
      });
    }
    var memSearch = document.getElementById('memberSearch');
    if (memSearch) {
      memSearch.addEventListener('input', function () {
        currentPage = 1;
        populateTeamTable();
      });
    }
    var globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
      globalSearch.addEventListener('input', function () {
        var val = this.value.trim();
        var activeItem = document.querySelector('.sidebar-item.active');
        var activePage = activeItem ? activeItem.getAttribute('data-page') : 'dashboard';
        if (activePage === 'dashboard') {
          var el1 = document.getElementById('tableSearch');
          var el2 = document.getElementById('memberSearch');
          if (el1) el1.value = val;
          if (el2) el2.value = val;
          currentPage = 1;
          populateTeamTable();
        } else if (activePage === 'assignments') {
          var el = document.getElementById('myAssignmentsSearch');
          if (el) { el.value = val; renderMyAssignmentsTable(); }
        } else if (activePage === 'reports') {
          var el = document.getElementById('reportSearch');
          if (el) { el.value = val; renderTeamReportTable(); }
        }
      });
    }
  }

  function setupModals() {
    var assignModalBtn = document.getElementById('assignModalBtn');
    if (assignModalBtn) {
      assignModalBtn.addEventListener('click', function () {
        populateAssignModal();
        document.getElementById('assignModalOverlay').classList.add('show');
      });
    }

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

    var refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        document.getElementById('refreshDataBtn').click();
      });
    }
  }

  function setupLockFeatures() {
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

  function populateMyAssignmentsFilters() {
    var depts = {};
    var batches = {};

    myAssignmentsData.forEach(function (r) {
      if (r.department) {
        var d = String(r.department).trim();
        if (d) depts[d] = true;
      }
      if (r.batch) {
        var b = String(r.batch).trim();
        if (b) batches[b] = true;
      }
    });

    var deptFilter = document.getElementById('myAssignmentsDeptFilter');
    var batchFilter = document.getElementById('myAssignmentsBatchFilter');

    if (deptFilter) {
      var currentVal = deptFilter.value;
      var deptHtml = '<option value="all">All Depts</option>';
      Object.keys(depts).sort().forEach(function (d) {
        deptHtml += '<option value="' + d + '">' + d + '</option>';
      });
      deptFilter.innerHTML = deptHtml;
      if (depts[currentVal]) deptFilter.value = currentVal;
      else deptFilter.value = 'all';
    }

    if (batchFilter) {
      var currentVal = batchFilter.value;
      var batchHtml = '<option value="all">All Batches</option>';
      Object.keys(batches).sort().forEach(function (b) {
        batchHtml += '<option value="' + b + '">' + b + '</option>';
      });
      batchFilter.innerHTML = batchHtml;
      if (batches[currentVal]) batchFilter.value = currentVal;
      else batchFilter.value = 'all';
    }
  }

  function loadMyAssignments() {
    var tbody = document.getElementById('myAssignmentsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;"><div class="spinner"></div> Loading assignments...</td></tr>';

    API.getAssignedAlumni({ onlyMe: true, page: 1, limit: 10000 }).then(function (res) {
      if (res && res.success) {
        myAssignmentsData = res.data.records || res.data || [];
        populateMyAssignmentsFilters();
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
    var deptValFilter = document.getElementById('myAssignmentsDeptFilter') ? document.getElementById('myAssignmentsDeptFilter').value : 'all';
    var batchValFilter = document.getElementById('myAssignmentsBatchFilter') ? document.getElementById('myAssignmentsBatchFilter').value : 'all';
    var dateFromVal = document.getElementById('myAssignmentsDateFrom') ? document.getElementById('myAssignmentsDateFrom').value : '';
    var dateToVal = document.getElementById('myAssignmentsDateTo') ? document.getElementById('myAssignmentsDateTo').value : '';

    // Update filter dot indicator
    var hasFilter = !!(searchVal || (statusVal && statusVal !== 'all') || (deptValFilter && deptValFilter !== 'all') || (batchValFilter && batchValFilter !== 'all') || dateFromVal || dateToVal);
    var myFilterWrap = document.getElementById('myAssignmentsFilterBtnWrap');
    if (myFilterWrap) {
      if (hasFilter) myFilterWrap.classList.add('has-active-filter');
      else myFilterWrap.classList.remove('has-active-filter');
    }
    // Update badge count
    var myFilterCount = [statusVal !== 'all' ? statusVal : '', deptValFilter !== 'all' ? deptValFilter : '', batchValFilter !== 'all' ? batchValFilter : '', dateFromVal, dateToVal].filter(Boolean).length;
    var myBadge = document.getElementById('myAssignmentsActiveFilterBadge');
    if (myBadge) {
      myBadge.textContent = myFilterCount;
      myBadge.style.display = myFilterCount > 0 ? 'inline-block' : 'none';
    }


    myFilteredAssignments = myAssignmentsData.filter(function (r) {
      var matchSearch = !searchVal ||
        (r.name || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.department || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.batch || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.company || '').toLowerCase().indexOf(searchVal) !== -1 ||
        (r.designation || '').toLowerCase().indexOf(searchVal) !== -1;
      var matchStatus = statusVal === 'all' || (r.status || 'Pending') === statusVal;
      var matchDept = deptValFilter === 'all' || String(r.department) === deptValFilter;
      var matchBatch = batchValFilter === 'all' || String(r.batch) === batchValFilter;

      var matchDateFrom = true;
      var matchDateTo = true;
      var recordDate = r.assigned_date || r.created_at || r.updatedAt || r.updated_date;
      if (recordDate) {
        var rTime = new Date(recordDate).getTime();
        if (dateFromVal) matchDateFrom = rTime >= new Date(dateFromVal + 'T00:00:00').getTime();
        if (dateToVal) matchDateTo = rTime <= new Date(dateToVal + 'T23:59:59').getTime();
      }

      return matchSearch && matchStatus && matchDept && matchBatch && matchDateFrom && matchDateTo;
    });

    var countEl = document.getElementById('myAssignmentsFilteredCount');
    if (countEl) {
      countEl.textContent = myFilteredAssignments.length + ' Records';
    }

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
        var isReopened = status === 'Reopened';
        var badgeClass = isCompleted ? 'badge-success' : (isDraft ? 'badge-info' : (isReopened ? 'badge-danger' : 'badge-warning'));

        var nameVal = r.name || '-';
        var deptVal = r.department || '-';
        var batchVal = r.batch || '-';
        var compVal = r.company || r.pi_company || '-';
        var desgVal = r.designation || r.pi_designation || '-';

        if (searchVal) {
          var cleanQuery = searchVal.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          var regex = new RegExp('(' + cleanQuery + ')', 'gi');
          var highlightMark = '<mark style="background:#FEF08A;color:#854D0E;padding:0 2px;border-radius:2px;font-weight:600;">$1</mark>';
          if (nameVal !== '-') nameVal = nameVal.replace(regex, highlightMark);
          if (deptVal !== '-') deptVal = deptVal.replace(regex, highlightMark);
          if (batchVal !== '-') batchVal = batchVal.replace(regex, highlightMark);
          if (compVal !== '-') compVal = compVal.replace(regex, highlightMark);
          if (desgVal !== '-') desgVal = desgVal.replace(regex, highlightMark);
        }

        var safeName = (r.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        var actionBtns = '<div style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap;">' +
          '<button class="btn btn-sm btn-primary update-alumni-btn" data-id="' + r.alumni_id + '"><i class="fas fa-edit"></i> Update</button>';
        if (isCompleted) {
          actionBtns += '<button type="button" class="btn-undo-icon" onclick="event.stopPropagation();confirmUndoSubmission(' + r.alumni_id + ', \'' + safeName + '\')" title="Undo Submission to Draft"><i class="fas fa-undo"></i></button>';
        }
        actionBtns += '</div>';
        var fatherVal = r.father_name || r.fatherName || r.pi_father_name || '';
        var nameCellHtml = '<div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
          '  <strong style="color:#1E293B;">' + nameVal + '</strong>' +
          '  <button type="button" onclick="event.stopPropagation();copyAlumniAndFather(\'' + (r.name || '').replace(/'/g, "\\'") + '\', \'' + fatherVal.replace(/'/g, "\\'") + '\')" style="background:none;border:none;cursor:pointer;color:#64748B;font-size:0.8rem;padding:2px;" title="Copy Alumni & Father Name"><i class="far fa-copy"></i></button>' +
          '</div>' +
          (fatherVal ? '<div style="font-size:0.75rem;color:#64748B;font-weight:400;margin-top:2px;">S/O: ' + fatherVal + '</div>' : '') +
          '</div>';

        html += '<tr>' +
          '<td style="font-weight:600;color:#64748B">' + sno + '</td>' +
          '<td>' + nameCellHtml + '</td>' +
          '<td>' + deptVal + '</td>' +
          '<td>' + batchVal + '</td>' +
          '<td>' + compVal + '</td>' +
          '<td>' + desgVal + '</td>' +
          '<td><span class="badge ' + badgeClass + '">' + status + '</span></td>' +
          '<td style="text-align:center">' + actionBtns + '</td>' +
          '</tr>';
      });
      tbody.innerHTML = html;

      tbody.querySelectorAll('.update-alumni-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-id');
          openUpdateModal(id);
        });
      });

      tbody.querySelectorAll('.reopen-alumni-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-id');
          window.reopenAlumniRecord(id);
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
  window._currentLeaderRecordIndex = -1;

  function updateLeaderModalNavCounter() {
    var prevBtn = document.getElementById('modalNavPrevBtn');
    var nextBtn = document.getElementById('modalNavNextBtn');
    var counterEl = document.getElementById('modalNavCounter');
    if (!myFilteredAssignments || myFilteredAssignments.length === 0 || window._currentLeaderRecordIndex === -1) {
      if (counterEl) counterEl.textContent = '0 / 0';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }
    if (counterEl) counterEl.textContent = (window._currentLeaderRecordIndex + 1) + ' / ' + myFilteredAssignments.length;
    if (prevBtn) prevBtn.disabled = window._currentLeaderRecordIndex <= 0;
    if (nextBtn) nextBtn.disabled = window._currentLeaderRecordIndex >= myFilteredAssignments.length - 1;
  }

  window.navigateModalRecord = function (dir) {
    if (!myFilteredAssignments || myFilteredAssignments.length === 0) return;
    var newIdx = window._currentLeaderRecordIndex + dir;
    if (newIdx < 0 || newIdx >= myFilteredAssignments.length) return;
    var targetRecord = myFilteredAssignments[newIdx];
    if (!targetRecord) return;

    var form = document.getElementById('updateForm');
    if (form) {
      form.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      form.style.opacity = '0.3';
      form.style.transform = dir > 0 ? 'translateX(15px)' : 'translateX(-15px)';
      setTimeout(function () {
        openUpdateModal(targetRecord.alumni_id);
        form.style.opacity = '1';
        form.style.transform = 'translateX(0)';
      }, 150);
    } else {
      openUpdateModal(targetRecord.alumni_id);
    }
  };

  function ensureOptionExists(selectEl, val) {
    if (!selectEl) return;
    if (!selectEl.options) {
      if (val !== undefined && val !== null) selectEl.value = val;
      return;
    }
    var existingValues = [];
    for (var i = selectEl.options.length - 1; i >= 0; i--) {
      var v = selectEl.options[i].value;
      if (existingValues.indexOf(v) !== -1 && v !== '') {
        selectEl.remove(i);
      } else {
        existingValues.push(v);
      }
    }
    if (!val) return;
    var found = false;
    for (var j = 0; j < selectEl.options.length; j++) {
      if (selectEl.options[j].value === val || selectEl.options[j].text === val) {
        found = true;
        break;
      }
    }
    if (!found) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      selectEl.appendChild(opt);
    }
  }

  function openUpdateModal(alumniId) {
    currentSelectedAlumniId = alumniId;
    window.currentSelectedAlumniId = alumniId;
    var targetId = parseInt(alumniId, 10);
    if (myFilteredAssignments && myFilteredAssignments.length > 0) {
      window._currentLeaderRecordIndex = myFilteredAssignments.findIndex(function (r) { return r.alumni_id === targetId; });
      updateLeaderModalNavCounter();
    }

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
        var isReopened = status === 'Reopened';
        var badgeClass = isCompleted ? 'badge-success' : (isDraft ? 'badge-info' : (isReopened ? 'badge-danger' : 'badge-warning'));
        var badgeIcon = isCompleted ? 'fa-check-circle' : (isDraft ? 'fa-pen' : (isReopened ? 'fa-redo-alt' : 'fa-clock'));

        var statusBadge = document.getElementById('modalStatusBadge');
        statusBadge.className = 'status-badge ' + badgeClass;
        if (isReopened) {
          statusBadge.style.cssText = 'background:#FEE2E2;color:#991B1B;padding:4px 10px;border-radius:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px;';
        }
        statusBadge.innerHTML = '<i class="fas ' + badgeIcon + '"></i> ' + status;

        var deptEl = document.getElementById('fieldDept');
        var batchEl = document.getElementById('fieldBatch');
        ensureOptionExists(deptEl, record.department);
        ensureOptionExists(batchEl, record.batch);

        document.getElementById('fieldName').value = record.name || '';
        var regEl = document.getElementById('fieldRegisterNo');
        if (regEl) regEl.value = record.register_no || record.registerNo || '';
        deptEl.value = record.department || '';
        batchEl.value = record.batch || '';
        document.getElementById('fieldFatherName').value = record.father_name || record.pi_father_name || '';
        document.getElementById('fieldDOB').value = record.date_of_birth || record.dob || '';
        document.getElementById('fieldCompany').value = record.company || record.pi_company || '';
        document.getElementById('fieldDesignation').value = record.designation || record.pi_designation || '';
        if (window._leaderLocationCascade) {
          window._leaderLocationCascade.setValues(record.country, record.state, record.current_city || record.city);
        } else {
          document.getElementById('fieldCity').value = record.current_city || '';
          document.getElementById('fieldState').value = record.state || '';
          document.getElementById('fieldCountry').value = record.country || '';
        }
        document.getElementById('fieldEmail').value = record.email || record.pi_email || '';
        document.getElementById('fieldPhone').value = record.phone || record.pi_phone || '';
        document.getElementById('fieldSecondaryEmail').value = record.secondary_email || '';
        document.getElementById('fieldSecondaryPhone').value = record.secondary_phone || '';
        document.getElementById('fieldLinkedin').value = record.linkedin_profile || record.linkedin_url || '';
        document.getElementById('fieldGovtJob').value = record.is_government_job ? 'Yes' : 'No';

  var _isModalEditMode = false;
  window.toggleModalFieldsEditMode = function () {
    _isModalEditMode = !_isModalEditMode;
    var topEditBtn = document.getElementById('modalTopEditBtn');
    var fieldIds = [
      'fieldName', 'fieldDept', 'fieldBatch', 'fieldFatherName', 'fieldDOB',
      'fieldCompany', 'fieldDesignation', 'fieldCity', 'fieldState', 'fieldCountry',
      'fieldEmail', 'fieldPhone', 'fieldSecondaryEmail', 'fieldSecondaryPhone',
      'fieldLinkedin', 'fieldGovtJob'
    ];

    fieldIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (_isModalEditMode) {
        el.readOnly = false;
        el.disabled = false;
      } else {
        var val = el.value ? el.value.trim() : '';
        var isPreFilled = val !== '' && val !== 'No' && val !== 'Select Department' && val !== 'Select Batch';
        if (isPreFilled) {
          el.readOnly = true;
          if (el.tagName === 'SELECT') el.disabled = true;
        }
      }
    });

    if (topEditBtn) {
      topEditBtn.style.transform = 'scale(1.25)';
      setTimeout(function () { topEditBtn.style.transform = 'scale(1)'; }, 200);

      if (_isModalEditMode) {
        topEditBtn.style.background = '#10B981';
        topEditBtn.style.color = '#FFFFFF';
        topEditBtn.style.borderColor = '#10B981';
        topEditBtn.innerHTML = '<i class="fas fa-check"></i>';
        topEditBtn.title = 'Editing Unlocked! Click again to lock fields.';
      } else {
        topEditBtn.style.background = '#EFF6FF';
        topEditBtn.style.color = '#2563EB';
        topEditBtn.style.borderColor = '#BFDBFE';
        topEditBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        topEditBtn.title = 'Click pencil to unlock pre-filled fields for editing';
      }
    }
  };

  function applyPreFilledLockingLeader() {
    var fieldIds = [
      'fieldName', 'fieldDept', 'fieldBatch', 'fieldFatherName', 'fieldDOB',
      'fieldCompany', 'fieldDesignation', 'fieldCity', 'fieldState', 'fieldCountry',
      'fieldEmail', 'fieldPhone', 'fieldSecondaryEmail', 'fieldSecondaryPhone',
      'fieldLinkedin', 'fieldGovtJob'
    ];

    fieldIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;

      var parent = el.parentNode;
      if (parent) {
        var existingWrapper = parent.querySelector('.field-lock-action-wrapper');
        if (existingWrapper) existingWrapper.remove();
      }

      var val = el.value ? el.value.trim() : '';
      var isPreFilled = val !== '' && val !== 'No' && val !== 'Select Department' && val !== 'Select Batch';

      if (isPreFilled && !_isModalEditMode) {
        el.readOnly = true;
        if (el.tagName === 'SELECT') el.disabled = true;
      } else {
        el.readOnly = false;
        el.disabled = false;
      }
    });
  }

  // Apply pre-filled data field locking state
  if (typeof applyPreFilledLockingLeader === 'function') applyPreFilledLockingLeader();

        // Auto-toggle secondary containers if values exist
        var secEmailContainer = document.getElementById('fieldSecondaryEmailContainer');
        var secEmailBtn = secEmailContainer.previousElementSibling.querySelector('button');
        if (record.secondary_email) {
          secEmailContainer.style.display = 'block';
          if (secEmailBtn) secEmailBtn.innerHTML = '<i class="fas fa-minus-circle" style="color: #EF4444;"></i> Remove Secondary';
        } else {
          secEmailContainer.style.display = 'none';
          if (secEmailBtn) secEmailBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Secondary';
        }

        var secPhoneContainer = document.getElementById('fieldSecondaryPhoneContainer');
        var secPhoneBtn = secPhoneContainer.previousElementSibling.querySelector('button');
        if (record.secondary_phone) {
          secPhoneContainer.style.display = 'block';
          if (secPhoneBtn) secPhoneBtn.innerHTML = '<i class="fas fa-minus-circle" style="color: #EF4444;"></i> Remove Secondary';
        } else {
          secPhoneContainer.style.display = 'none';
          if (secPhoneBtn) secPhoneBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Secondary';
        }

        var undoBtn = document.getElementById('undoSubmitBtn');
        if (undoBtn) {
          undoBtn.style.display = isCompleted ? 'inline-flex' : 'none';
        }

        var smartParser = document.getElementById('fieldSmartParser');
        if (smartParser) smartParser.value = '';
        if (typeof loadAutosave === 'function') loadAutosave(alumniId);

        overlay.classList.add('show');
      }
    });
  }

  function readFormValues() {
    return {
      name: document.getElementById('fieldName').value.trim(),
      department: document.getElementById('fieldDept').value,
      batch: document.getElementById('fieldBatch').value,
      father_name: document.getElementById('fieldFatherName').value.trim(),
      date_of_birth: document.getElementById('fieldDOB').value.trim(),
      company: document.getElementById('fieldCompany').value.trim(),
      designation: document.getElementById('fieldDesignation').value.trim(),
      current_city: document.getElementById('fieldCity').value.trim(),
      state: document.getElementById('fieldState').value.trim(),
      country: document.getElementById('fieldCountry').value.trim(),
      email: document.getElementById('fieldEmail').value.trim(),
      phone: document.getElementById('fieldPhone').value.trim(),
      secondary_email: document.getElementById('fieldSecondaryEmail').value.trim(),
      secondary_phone: document.getElementById('fieldSecondaryPhone').value.trim(),
      linkedin_url: document.getElementById('fieldLinkedin').value.trim(),
      is_government_job: document.getElementById('fieldGovtJob').value === 'Yes',
    };
  }

  function validateForm() {
    var isValid = true;
    var required = ['fieldName', 'fieldDept', 'fieldBatch', 'fieldCompany', 'fieldDesignation', 'fieldCity'];
    required.forEach(function (id) {
      var el = document.getElementById(id);
      var err = document.getElementById('error' + id.charAt(5).toUpperCase() + id.slice(6));
      if (!el || !el.value || el.value.trim() === '') {
        if (el) el.classList.add('error');
        if (err) err.style.display = 'block';
        isValid = false;
      } else {
        if (el) el.classList.remove('error');
        if (err) err.style.display = 'none';
      }
    });

    var emailEl = document.getElementById('fieldEmail');
    var phoneEl = document.getElementById('fieldPhone');
    var emailErr = document.getElementById('errorEmail');
    var phoneErr = document.getElementById('errorPhone');

    var emailVal = emailEl && emailEl.value ? emailEl.value.trim() : '';
    var phoneVal = phoneEl && phoneEl.value ? phoneEl.value.trim() : '';

    if (!emailVal && !phoneVal) {
      if (emailEl) emailEl.classList.add('error');
      if (phoneEl) phoneEl.classList.add('error');
      if (emailErr) emailErr.style.display = 'block';
      if (phoneErr) phoneErr.style.display = 'block';
      isValid = false;
    } else {
      if (emailEl) emailEl.classList.remove('error');
      if (phoneEl) phoneEl.classList.remove('error');
      if (emailErr) emailErr.style.display = 'none';
      if (phoneErr) phoneErr.style.display = 'none';
    }

    return isValid;
  }

  // Auto-save form progress to localStorage
  var autosaveTimeout = null;
  function triggerAutosave() {
    if (autosaveTimeout) clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(function () {
      saveAutosave();
    }, 1000);
  }

  function saveAutosave() {
    if (!currentSelectedAlumniId) return;
    var data = {
      name: document.getElementById('fieldName').value,
      department: document.getElementById('fieldDept').value,
      batch: document.getElementById('fieldBatch').value,
      fatherName: document.getElementById('fieldFatherName').value,
      company: document.getElementById('fieldCompany').value,
      designation: document.getElementById('fieldDesignation').value,
      city: document.getElementById('fieldCity').value,
      state: document.getElementById('fieldState').value,
      country: document.getElementById('fieldCountry').value,
      email: document.getElementById('fieldEmail').value,
      phone: document.getElementById('fieldPhone').value,
      linkedin_profile: document.getElementById('fieldLinkedin').value,
      govtJob: document.getElementById('fieldGovtJob').value,
      timestamp: Date.now()
    };
    localStorage.setItem('autosave_leader_alumni_' + currentSelectedAlumniId, JSON.stringify(data));
  }

  function loadAutosave(alumniId) {
    var saved = localStorage.getItem('autosave_leader_alumni_' + alumniId);
    if (saved) {
      try {
        var data = JSON.parse(saved);
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          document.getElementById('fieldName').value = data.name || '';
          document.getElementById('fieldDept').value = data.department || '';
          document.getElementById('fieldBatch').value = data.batch || '';
          document.getElementById('fieldFatherName').value = data.fatherName || '';
          document.getElementById('fieldCompany').value = data.company || '';
          document.getElementById('fieldDesignation').value = data.designation || '';
          document.getElementById('fieldCity').value = data.city || '';
          document.getElementById('fieldState').value = data.state || '';
          document.getElementById('fieldCountry').value = data.country || '';
          document.getElementById('fieldEmail').value = data.email || '';
          document.getElementById('fieldPhone').value = data.phone || '';
          document.getElementById('fieldLinkedin').value = data.linkedin_profile || '';
          document.getElementById('fieldGovtJob').value = data.govtJob || 'No';
          showToast('Info', 'Loaded unsaved changes from auto-save draft.', 'info');
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  function clearAutosave(alumniId) {
    localStorage.removeItem('autosave_leader_alumni_' + alumniId);
  }

  // Smart Profile Parser
  window.parseProfileHeader = function () {
    var parserEl = document.getElementById('fieldSmartParser');
    if (!parserEl) return;
    var val = parserEl.value || '';
    if (!val.trim()) return;

    var linkedinRegex = /(https?:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+)/i;
    var linkedinMatch = val.match(linkedinRegex);
    if (linkedinMatch) {
      document.getElementById('fieldLinkedin').value = linkedinMatch[1];
    }

    var headlineRegex = /([A-Za-z0-9\s\-&]+?)\s+(?:at|@|\|)\s+([A-Za-z0-9\s\-&]+)/i;
    var headlineMatch = val.match(headlineRegex);
    if (headlineMatch) {
      document.getElementById('fieldDesignation').value = headlineMatch[1].trim();
      document.getElementById('fieldCompany').value = headlineMatch[2].trim();
    }

    var locationRegex = /([A-Za-z\s]+),\s*([A-Za-z\s]+)(?:,\s*([A-Za-z\s]+))?/i;
    var lines = val.split('\n');
    lines.forEach(function (line) {
      var locMatch = line.match(locationRegex);
      if (locMatch && !linkedinRegex.test(line) && !headlineRegex.test(line)) {
        var city = locMatch[1].trim();
        var country = (locMatch[3] || locMatch[2]).trim();
        if (city.toLowerCase() !== 'linkedin' && country.toLowerCase() !== 'linkedin') {
          document.getElementById('fieldCity').value = city;
          document.getElementById('fieldCountry').value = country;
        }
      }
    });

    showToast('Success', 'Parsed profile details auto-filled successfully!', 'success');
    saveAutosave();
  };

  function setupUpdateModalEvents() {
    var form = document.getElementById('updateForm');
    if (form) {
      form.querySelectorAll('input, select, textarea').forEach(function (inputEl) {
        if (inputEl.id !== 'fieldSmartParser') {
          inputEl.addEventListener('input', triggerAutosave);
          inputEl.addEventListener('change', triggerAutosave);
        }
      });
    }

    document.getElementById('saveDraftBtn').addEventListener('click', function () {
      var draftBtn = this;
      var originalContent = draftBtn.innerHTML;
      draftBtn.disabled = true;
      draftBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Saving Draft...';
      var data = readFormValues();
      API.saveAlumniDraft(currentSelectedAlumniId, data).then(function (res) {
        showToast('Success', 'Draft saved successfully.', 'success');
        clearAutosave(currentSelectedAlumniId);
        document.getElementById('updateModal').classList.remove('show');
        loadMyAssignments();
      }).catch(function (err) {
        showToast('Error', err.message || 'Failed to save draft.', 'danger');
      }).finally(function () {
        draftBtn.disabled = false;
        draftBtn.innerHTML = originalContent;
      });
    });

    document.getElementById('submitRecordBtn').addEventListener('click', function () {
      if (!validateForm()) {
        showToast('Validation Error', 'Please fill in all required fields.', 'danger');
        return;
      }
      var submitBtn = this;
      var originalContent = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Submitting...';
      var data = readFormValues();
      API.submitAlumni(currentSelectedAlumniId, data).then(function (res) {
        showToast('Success', 'Record submitted successfully.', 'success');
        clearAutosave(currentSelectedAlumniId);
        document.getElementById('updateModal').classList.remove('show');
        loadMyAssignments();
        fetchLeaderData();
      }).catch(function (err) {
        showToast('Error', err.message || 'Failed to submit record.', 'danger');
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
      });
    });

    var nextBtn = document.getElementById('submitNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (!validateForm()) {
          showToast('Validation Error', 'Please fill in all required fields.', 'danger');
          return;
        }
        var submitNextBtn = this;
        var originalContent = submitNextBtn.innerHTML;
        submitNextBtn.disabled = true;
        submitNextBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Submitting...';
        var data = readFormValues();
        API.submitAlumni(currentSelectedAlumniId, data).then(function (res) {
          showToast('Success', 'Record submitted successfully.', 'success');
          clearAutosave(currentSelectedAlumniId);
          loadMyAssignments();
          fetchLeaderData();

          // Find the next pending/draft record
          var nextRecord = myAssignmentsData.find(function (r) {
            return r.status !== 'Completed' && String(r.alumni_id) !== String(currentSelectedAlumniId);
          });

          if (nextRecord) {
            openUpdateModal(nextRecord.alumni_id);
          } else {
            document.getElementById('updateModal').classList.remove('show');
            showToast('Success', 'All assigned records completed! Great job!', 'success');
          }
        }).catch(function (err) {
          showToast('Error', err.message || 'Failed to submit record.', 'danger');
        }).finally(function () {
          submitNextBtn.disabled = false;
          submitNextBtn.innerHTML = originalContent;
        });
      });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', function (e) {
      var modal = document.getElementById('updateModal');
      if (!modal || !modal.classList.contains('show')) return;

      if (e.key === 'Escape') {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }

      // Ctrl + S: Save Draft
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        document.getElementById('saveDraftBtn').click();
      }

      // Ctrl + Enter: Submit Record
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('submitRecordBtn').click();
      }
    });
  }



  // --- TEAM REPORT SPREADSHEET VIEW SECTION ---
  var ssPage = 1;
  var ssLimit = 10;
  var ssTotal = 0;
  var ssSearchQuery = '';
  var ssSortColumn = 'alumni_id';
  var ssSortDirection = 'DESC';

  var ssColumns = [
    { key: 'name', label: 'Name', visible: true, width: 160 },
    { key: 'register_no', label: 'Register No', visible: true, width: 140 },
    { key: 'father_name', label: 'Father\'s Name', visible: true, width: 150 },
    { key: 'date_of_birth', label: 'Date of Birth', visible: true, width: 120 },
    { key: 'department', label: 'Department', visible: true, width: 100 },
    { key: 'batch', label: 'Batch', visible: true, width: 80 },
    { key: 'email', label: 'Email', visible: true, width: 180 },
    { key: 'phone', label: 'Phone', visible: true, width: 120 },
    { key: 'company', label: 'Company/Institution', visible: true, width: 150 },
    { key: 'designation', label: 'Designation', visible: true, width: 150 },
    { key: 'linkedin_profile', label: 'LinkedIn/Facebook URL', visible: true, width: 180 },
    { key: 'assignment_status', label: 'Current Status', visible: true, width: 120 },
    { key: 'updated_date', label: 'Updated Date', visible: true, width: 140 }
  ];

  var debounceTimer;
  window.debounceSearch = function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      ssSearchQuery = document.getElementById('ssSearch').value;
      ssPage = 1;
      fetchSpreadsheetData();
    }, 300);
  };

  window.fetchSpreadsheetData = function () {
    var memberId = document.getElementById('ssFilterMember') ? document.getElementById('ssFilterMember').value : '';
    var dept = document.getElementById('ssFilterDept').value;
    var batch = document.getElementById('ssFilterBatch').value;
    var status = document.getElementById('ssFilterStatus').value;

    var dateFrom = document.getElementById('ssDateFrom') ? document.getElementById('ssDateFrom').value : null;
    var dateTo = document.getElementById('ssDateTo') ? document.getElementById('ssDateTo').value : null;

    var params = {
      page: ssPage,
      limit: ssLimit,
      search: ssSearchQuery || undefined,
      department: dept || undefined,
      batch: batch || undefined,
      status: status || undefined,
      memberId: memberId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      onlyMe: false
    };

    var body = document.getElementById('ssTableBody');
    if (body) {
      body.innerHTML = '<tr><td colspan="' + (ssColumns.filter(function (c) { return c.visible; }).length + 1) + '" style="text-align: center; padding: 40px;"><div class="spinner"></div> Loading...</td></tr>';
    }

    API.getAssignedAlumni(params).then(function (res) {
      if (res && res.success) {
        var records = (res.data && res.data.records) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
        var pagination = (res.data && res.data.pagination) ? res.data.pagination : null;
        ssTotal = (pagination && pagination.total) ? pagination.total : records.length;
        populateSpreadsheetFilters(records);
        renderSpreadsheetTable(records);
        renderSpreadsheetPagination();
      } else {
        showToast('Failed to retrieve records', 'error');
      }
    }).catch(function (err) {
      console.error('Error fetching alumni:', err);
      showToast('An error occurred fetching records', 'error');
    });
  };

  function populateSpreadsheetFilters(records) {
    var deptMap = {}, batchMap = {};
    records.forEach(function (r) {
      if (r.department) deptMap[r.department] = true;
      if (r.batch) batchMap[r.batch] = true;
    });
    var ssDept = document.getElementById('ssFilterDept');
    var ssBatch = document.getElementById('ssFilterBatch');
    if (ssDept) {
      var currentDeptVal = ssDept.value;
      var html = '<option value="">All Depts</option>';
      Object.keys(deptMap).sort().forEach(function (d) {
        var sel = d === currentDeptVal ? ' selected' : '';
        html += '<option value="' + d + '"' + sel + '>' + d + '</option>';
      });
      ssDept.innerHTML = html;
    }
    if (ssBatch) {
      var currentBatchVal = ssBatch.value;
      var html = '<option value="">All Batches</option>';
      Object.keys(batchMap).sort().forEach(function (b) {
        var sel = b === currentBatchVal ? ' selected' : '';
        html += '<option value="' + b + '"' + sel + '>' + b + '</option>';
      });
      ssBatch.innerHTML = html;
    }

    var memVal = document.getElementById('ssFilterMember') ? document.getElementById('ssFilterMember').value : '';
    var deptVal = ssDept ? ssDept.value : '';
    var batchVal = ssBatch ? ssBatch.value : '';
    var statusVal = document.getElementById('ssFilterStatus') ? document.getElementById('ssFilterStatus').value : '';
    var dateFromVal = document.getElementById('ssDateFrom') ? document.getElementById('ssDateFrom').value : '';
    var dateToVal = document.getElementById('ssDateTo') ? document.getElementById('ssDateTo').value : '';

    var activeCount = 0;
    if (memVal) activeCount++;
    if (deptVal) activeCount++;
    if (batchVal) activeCount++;
    if (statusVal) activeCount++;
    if (dateFromVal) activeCount++;
    if (dateToVal) activeCount++;

    var badge = document.getElementById('activeFilterBadge');
    if (badge) {
      badge.textContent = activeCount;
      badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }
  }

  window.renderSpreadsheetTable = function (data) {
    var headRow = document.getElementById('ssTableHeadRow');
    var body = document.getElementById('ssTableBody');
    if (!headRow || !body) return;

    var headHtml = '<th class="sticky-col" style="width: 50px; z-index: 5;">S.No</th>';
    ssColumns.forEach(function (col) {
      if (!col.visible) return;
      var sortIcon = '';
      if (ssSortColumn === col.key) {
        sortIcon = ssSortDirection === 'ASC' ? ' <i class="fas fa-sort-up"></i>' : ' <i class="fas fa-sort-down"></i>';
      } else {
        sortIcon = ' <i class="fas fa-sort" style="opacity:0.3;"></i>';
      }
      headHtml += '<th style="width: ' + col.width + 'px; min-width: ' + col.width + 'px; position: relative;" onclick="sortSpreadsheet(\'' + col.key + '\')">';
      headHtml += col.label + sortIcon;
      headHtml += '<div class="resizer" onclick="event.stopPropagation()"></div>';
      headHtml += '</th>';
    });
    headRow.innerHTML = headHtml;

    if (data.length === 0) {
      body.innerHTML = '<tr><td colspan="' + (ssColumns.filter(function (c) { return c.visible; }).length + 1) + '" style="text-align: center; padding: 24px; color: var(--text-muted);">No records found</td></tr>';
      return;
    }

    var html = '';
    var startSerial = (ssPage - 1) * ssLimit + 1;
    data.forEach(function (row, idx) {
      var serial = startSerial + idx;
      html += '<tr>';
      html += '<td class="sticky-col" style="text-align: center; font-weight: 500;">' + serial + '</td>';
      ssColumns.forEach(function (col) {
        if (!col.visible) return;
        var val = '';
        if (col.key === 'name') {
          var fatherVal = String(row.father_name || row.fatherName || row.pi_father_name || '');
          var safeName = String(row.name || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
          var safeFather = fatherVal.replace(/'/g, "\\'").replace(/"/g, "&quot;");
          val = '<div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
            '  <span style="font-weight:600;color:#1E293B;">' + (row.name || '-') + '</span>' +
            '  <button type="button" onclick="event.stopPropagation();copyAlumniAndFather(\'' + safeName + '\', \'' + safeFather + '\')" style="background:none;border:none;cursor:pointer;color:#64748B;font-size:0.8rem;padding:2px;" title="Copy Alumni & Father Name"><i class="far fa-copy"></i></button>' +
            '</div>' +
            (fatherVal ? '<div style="font-size:0.75rem;color:#64748B;font-weight:400;margin-top:2px;">S/O: ' + fatherVal + '</div>' : '') +
            '</div>';
        } else if (col.key === 'assignment_status') {
          var status = row.status || 'Pending';
          var badgeClass = status === 'Completed' ? 'badge-success' : (status === 'Draft' ? 'badge-info' : 'badge-warning');
          val = '<span class="badge ' + badgeClass + '">' + status + '</span>';
        } else if (col.key === 'member_name') {
          val = row.member_name || row.teamMember || row.assigned_to || '-';
        } else if (col.key === 'leader_name') {
          val = row.leader_name || row.leader || '-';
        } else if (col.key === 'updated_date') {
          var date = row.completed_date || row.completedDate || row.updated_date || row.updatedDate || '-';
          if (date !== '-') {
            date = new Date(date).toLocaleDateString();
          }
          val = date;
        } else if (col.key === 'linkedin_profile') {
          var link = row.linkedin_profile || row.linkedin_url || '';
          if (link) {
            var href = link.startsWith('http') ? link : 'https://' + link;
            var isFb = href.toLowerCase().indexOf('facebook.com') !== -1 || href.toLowerCase().indexOf('fb.com') !== -1;
            var iconClass = isFb ? 'fab fa-facebook' : 'fab fa-linkedin';
            var iconColor = isFb ? '#1877F2' : '#0A66C2';
            var titleText = isFb ? 'Open Facebook Profile' : 'Open LinkedIn Profile';
            val = '<div style="display:flex;align-items:center;gap:10px;">' +
              '<a href="' + href + '" target="_blank" rel="noopener noreferrer" style="color:' + iconColor + ';font-size:1.15rem;text-decoration:none;" title="' + titleText + '"><i class="' + iconClass + '"></i></a>' +
              '<button onclick="event.stopPropagation();showLinkPreview(this,\'' + href.replace(/'/g, "\\'") + '\')" style="background:none;border:none;cursor:pointer;color:#64748B;font-size:0.85rem;padding:2px 4px;line-height:1;" title="Show URL"><i class="far fa-eye"></i></button>' +
              '</div>';
          } else {
            val = '-';
          }
        } else {
          val = row[col.key] || row[col.key.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); })] || '-';
        }
        html += '<td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + val + '</td>';
      });
      html += '</tr>';
    });
    body.innerHTML = html;
    setupResizers();
  };

  window.renderSpreadsheetPagination = function () {
    var info = document.getElementById('ssPaginationInfo');
    var container = document.getElementById('ssPagination');
    if (!info || !container) return;

    var totalPages = Math.max(1, Math.ceil(ssTotal / ssLimit));
    var start = (ssPage - 1) * ssLimit + 1;
    var end = Math.min(start + ssLimit - 1, ssTotal);
    info.innerText = 'Showing ' + (ssTotal > 0 ? start + '-' + end : '0-0') + ' of ' + ssTotal + ' entries';

    var pagHtml = '<button class="pagination-item" ' + (ssPage === 1 ? 'disabled' : '') + ' onclick="changeSpreadsheetPage(' + (ssPage - 1) + ')"><i class="fas fa-chevron-left"></i></button>';
    var maxVisible = 5;
    var startPage = Math.max(1, ssPage - 2);
    var endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (var i = startPage; i <= endPage; i++) {
      pagHtml += '<button class="pagination-item ' + (i === ssPage ? 'active' : '') + '" onclick="changeSpreadsheetPage(' + i + ')">' + i + '</button>';
    }
    pagHtml += '<button class="pagination-item" ' + (ssPage === totalPages ? 'disabled' : '') + ' onclick="changeSpreadsheetPage(' + (ssPage + 1) + ')"><i class="fas fa-chevron-right"></i></button>';
    container.innerHTML = pagHtml;
  };

  window.changeSpreadsheetPage = function (page) {
    ssPage = page;
    fetchSpreadsheetData();
  };

  window.changeSpreadsheetPageSize = function (size) {
    ssLimit = parseInt(size, 10);
    ssPage = 1;
    fetchSpreadsheetData();
  };

  window.sortSpreadsheet = function (colKey) {
    if (ssSortColumn === colKey) {
      ssSortDirection = ssSortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      ssSortColumn = colKey;
      ssSortDirection = 'ASC';
    }
    fetchSpreadsheetData();
  };

  window.toggleColumnVisibilityMenu = function () {
    var menu = document.getElementById('colVisibilityMenu');
    var btn = document.getElementById('colVisibilityBtn');
    if (!menu || !btn) return;

    if (menu.style.display === 'block') {
      menu.style.display = 'none';
      return;
    }

    var html = '<div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:4px;">Toggle Columns</div>';
    ssColumns.forEach(function (col) {
      var checked = col.visible ? 'checked' : '';
      html += '<label style="display:flex;align-items:center;gap:8px;font-size:0.8rem;margin:4px 0;cursor:pointer;">' +
        '<input type="checkbox" ' + checked + ' onchange="toggleSpreadsheetColumn(\'' + col.key + '\')"> ' +
        col.label +
        '</label>';
    });
    menu.innerHTML = html;

    var rect = btn.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY) + 'px';
    menu.style.left = (rect.left + window.scrollX) + 'px';
    menu.style.display = 'block';

    function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', closeMenu);
      }
    }
    setTimeout(function () {
      document.addEventListener('click', closeMenu);
    }, 50);
  };

  window.toggleSpreadsheetColumn = function (key) {
    var col = ssColumns.find(function (c) { return c.key === key; });
    if (col) {
      col.visible = !col.visible;
      fetchSpreadsheetData();
    }
  };

  /* ────────────────────────────────────────────────────────────
     INTERACTIVE EXPORT ENGINE & CUSTOMIZATION MODAL (LEADER)
     ──────────────────────────────────────────────────────────── */
  var _exportSelectedCols = {};

  window.handleExport = function () {
    openExportCustomizationModal();
  };

  window.exportAlumniCSV = function () {
    openExportCustomizationModal();
  };

  var fullExportColumns = [
    { key: 'register_no', label: 'Register Number' },
    { key: 'name', label: 'Name' },
    { key: 'father_name', label: 'Father Name' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'department', label: 'Department' },
    { key: 'batch', label: 'Batch' },
    { key: 'email', label: 'Primary Email' },
    { key: 'secondary_email', label: 'Secondary Email' },
    { key: 'phone', label: 'Primary Phone' },
    { key: 'secondary_phone', label: 'Secondary Phone' },
    { key: 'company', label: 'Company' },
    { key: 'designation', label: 'Designation' },
    { key: 'experience', label: 'Experience' },
    { key: 'current_city', label: 'Company Address / City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'linkedin_profile', label: 'LinkedIn/Facebook URL' },
    { key: 'working_details', label: 'Working Details' },
    { key: 'is_government_job', label: 'Government Job' },
    { key: 'assignment_status', label: 'Current Status' },
    { key: 'member_name', label: 'Member' },
    { key: 'updated_date', label: 'Updated Date' }
  ];

  window.openExportCustomizationModal = function () {
    fullExportColumns.forEach(function (col) {
      if (_exportSelectedCols[col.key] === undefined) {
        _exportSelectedCols[col.key] = true;
      }
    });

    populateExportModalFilterOptions();
    syncSpreadsheetFiltersToExportModal();
    renderExportColumnChips();
    onExportFilterChange();

    openModal('exportCustomizationModal');
  };

  window.populateExportModalFilterOptions = function () {
    var memberSel = document.getElementById('expFilterMember');
    var deptSel = document.getElementById('expFilterDept');
    var batchSel = document.getElementById('expFilterBatch');

    var srcMember = document.getElementById('ssFilterMember');
    var srcDept = document.getElementById('ssFilterDept');
    var srcBatch = document.getElementById('ssFilterBatch');

    if (memberSel && srcMember && memberSel.options.length <= 1) {
      memberSel.innerHTML = srcMember.innerHTML;
    }
    if (deptSel && srcDept && deptSel.options.length <= 1) {
      deptSel.innerHTML = srcDept.innerHTML;
    }
    if (batchSel && srcBatch && batchSel.options.length <= 1) {
      batchSel.innerHTML = srcBatch.innerHTML;
    }
  };

  window.syncSpreadsheetFiltersToExportModal = function () {
    var srcMember = document.getElementById('ssFilterMember');
    var srcDept = document.getElementById('ssFilterDept');
    var srcBatch = document.getElementById('ssFilterBatch');
    var srcStatus = document.getElementById('ssFilterStatus');
    var srcSearch = document.getElementById('ssSearch');

    var expMember = document.getElementById('expFilterMember');
    var expDept = document.getElementById('expFilterDept');
    var expBatch = document.getElementById('expFilterBatch');
    var expStatus = document.getElementById('expFilterStatus');
    var expSearch = document.getElementById('expFilterSearch');

    if (expMember && srcMember) expMember.value = srcMember.value;
    if (expDept && srcDept) expDept.value = srcDept.value;
    if (expBatch && srcBatch) expBatch.value = srcBatch.value;
    if (expStatus && srcStatus) expStatus.value = srcStatus.value;
    if (expSearch && srcSearch) expSearch.value = srcSearch.value;
  };

  window.resetExportModalFilters = function () {
    var expMember = document.getElementById('expFilterMember');
    var expDept = document.getElementById('expFilterDept');
    var expBatch = document.getElementById('expFilterBatch');
    var expStatus = document.getElementById('expFilterStatus');
    var expSearch = document.getElementById('expFilterSearch');

    if (expMember) expMember.value = '';
    if (expDept) expDept.value = '';
    if (expBatch) expBatch.value = '';
    if (expStatus) expStatus.value = '';
    if (expSearch) expSearch.value = '';

    onExportFilterChange();
  };

  var _exportFilterDebounce = null;
  window.onExportFilterChange = function () {
    updateExportStatsBanner();

    if (_exportFilterDebounce) clearTimeout(_exportFilterDebounce);
    _exportFilterDebounce = setTimeout(function () {
      var params = buildExportParams();
      params.limit = 1;

      API.getAssignedAlumni(params).then(function (res) {
        if (res && res.success && res.data && res.data.pagination) {
          var total = res.data.pagination.total;
          var totalEl = document.getElementById('expStatTotal');
          if (totalEl) totalEl.innerText = total;
        }
      }).catch(function (err) {
        console.warn('Export count error:', err);
      });
    }, 250);
  };

  window.buildExportParams = function () {
    var expMember = document.getElementById('expFilterMember');
    var expDept = document.getElementById('expFilterDept');
    var expBatch = document.getElementById('expFilterBatch');
    var expStatus = document.getElementById('expFilterStatus');
    var expSearch = document.getElementById('expFilterSearch');

    return {
      page: 1,
      limit: 100000,
      search: expSearch && expSearch.value.trim() ? expSearch.value.trim() : undefined,
      department: expDept && expDept.value ? expDept.value : undefined,
      batch: expBatch && expBatch.value ? expBatch.value : undefined,
      status: expStatus && expStatus.value ? expStatus.value : undefined,
      memberId: expMember && expMember.value ? expMember.value : undefined,
      onlyMe: false
    };
  };

  window.renderExportColumnChips = function () {
    var container = document.getElementById('exportColsContainer');
    if (!container) return;

    var html = '';
    fullExportColumns.forEach(function (col) {
      var checked = _exportSelectedCols[col.key] ? 'checked' : '';
      html += '<label class="export-col-chip">' +
        '<input type="checkbox" ' + checked + ' onchange="toggleExportCol(\'' + col.key + '\', this.checked)">' +
        '<span>' + col.label + '</span>' +
        '</label>';
    });
    container.innerHTML = html;
  };

  window.toggleExportCol = function (key, isChecked) {
    _exportSelectedCols[key] = isChecked;
    updateExportStatsBanner();
  };

  window.selectAllExportCols = function (selectState) {
    fullExportColumns.forEach(function (col) {
      _exportSelectedCols[col.key] = selectState;
    });
    renderExportColumnChips();
    updateExportStatsBanner();
  };

  window.updateExportStatsBanner = function () {
    var colsEl = document.getElementById('expStatCols');
    var statusEl = document.getElementById('expStatStatus');

    var selectedCount = Object.keys(_exportSelectedCols).filter(function (k) { return _exportSelectedCols[k]; }).length;
    if (colsEl) colsEl.innerText = selectedCount + ' / ' + fullExportColumns.length;

    var expStatus = document.getElementById('expFilterStatus');
    var statusVal = expStatus ? expStatus.value : '';
    if (statusEl) statusEl.innerText = statusVal ? statusVal.toUpperCase() : 'ALL';
  };

  window.startExportDownloadProcess = function () {
    var selectedKeys = Object.keys(_exportSelectedCols).filter(function (k) { return _exportSelectedCols[k]; });
    if (selectedKeys.length === 0) {
      showToast('Please select at least one column to export.', 'warning');
      return;
    }

    closeModal('exportCustomizationModal');

    var overlay = document.getElementById('exportProgressOverlay');
    var fill = document.getElementById('exportProgressBarFill');
    var title = document.getElementById('exportProgressTitle');
    var sub = document.getElementById('exportProgressSubtitle');
    var percentEl = document.getElementById('exportProgressPercent');
    var countEl = document.getElementById('exportProgressCount');

    if (overlay) overlay.classList.add('show');
    if (fill) fill.style.width = '10%';
    if (title) title.innerText = 'Querying Database...';
    if (sub) sub.innerText = 'Fetching team alumni records matching selected filters...';
    if (percentEl) percentEl.innerText = '10%';

    var params = buildExportParams();

    API.getAssignedAlumni(params).then(function (res) {
      if (res && res.success) {
        var data = (res.data && res.data.records) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
        if (data.length === 0) {
          if (overlay) overlay.classList.remove('show');
          showToast('No alumni records found matching selected export filters.', 'warning');
          return;
        }

        if (countEl) countEl.innerText = '0 / ' + data.length + ' records';

        var progress = 15;
        var interval = setInterval(function () {
          progress += 25;
          if (progress >= 90) {
            clearInterval(interval);
            progress = 90;
          }
          if (fill) fill.style.width = progress + '%';
          if (percentEl) percentEl.innerText = progress + '%';
          if (countEl) countEl.innerText = Math.floor((progress / 100) * data.length) + ' / ' + data.length + ' records';
          if (title) title.innerText = 'Formatting Excel Data...';
          if (sub) sub.innerText = 'Generating CSV with selected fields...';
        }, 100);

        setTimeout(function () {
          clearInterval(interval);
          if (fill) fill.style.width = '100%';
          if (percentEl) percentEl.innerText = '100%';
          if (countEl) countEl.innerText = data.length + ' / ' + data.length + ' records';
          if (title) title.innerText = 'Export Ready!';
          if (sub) sub.innerText = 'Downloading file to your computer...';

          var activeCols = fullExportColumns.filter(function (c) { return _exportSelectedCols[c.key]; });
          var csv = '\uFEFF';
          var headers = activeCols.map(function (c) { return c.label; });
          csv += headers.join(',') + '\r\n';

          data.forEach(function (row) {
            var line = activeCols.map(function (col) {
              var val = row[col.key];
              if (col.key === 'member_name') {
                val = row.member_name || row.teamMember || row.assigned_to || '';
              } else if (col.key === 'updated_date') {
                val = row.completed_date || row.completedDate || row.updated_date || row.updatedDate || '';
              }
              if (col.key === 'date_of_birth' || col.key === 'dob') {
                val = row.date_of_birth || row.dob || val || '';
              }
              if (val === null || val === undefined) val = '';

              if ((col.key === 'date_of_birth' || col.key === 'dob' || col.key === 'updated_date' || col.key === 'created_at') && val) {
                if (String(val).includes('T')) {
                  var d = new Date(val);
                  if (!isNaN(d.getTime())) {
                    var day = String(d.getDate()).padStart(2, '0');
                    var month = String(d.getMonth() + 1).padStart(2, '0');
                    var year = d.getFullYear();
                    val = day + '/' + month + '/' + year;
                  }
                }
              }

              var strVal = String(val);
              if ((col.key === 'phone' || col.key === 'secondary_phone' || col.key === 'register_no') && strVal.trim()) {
                return '"\t' + strVal.replace(/"/g, '""') + '"';
              }
              return '"' + strVal.replace(/"/g, '""') + '"';
            });
            csv += line.join(',') + '\r\n';
          });

          var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          var link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'Team_Alumni_Export_' + new Date().toISOString().slice(0, 10) + '.csv';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);

          setTimeout(function () {
            if (overlay) overlay.classList.remove('show');
            showToast('Exported ' + data.length + ' records with ' + activeCols.length + ' selected columns!', 'success');
          }, 600);
        }, 700);

      } else {
        if (overlay) overlay.classList.remove('show');
        showToast('Failed to retrieve alumni records for export.', 'error');
      }
    }).catch(function (err) {
      console.error('Export error:', err);
      if (overlay) overlay.classList.remove('show');
      showToast('An error occurred during export: ' + (err.message || 'Network error'), 'error');
    });
  };

  function setupResizers() {
    var table = document.querySelector('.spreadsheet-table');
    if (!table) return;
    var cols = table.querySelectorAll('th');
    cols.forEach(function (col) {
      var resizer = col.querySelector('.resizer');
      if (!resizer) return;

      var startX, startWidth;
      resizer.addEventListener('mousedown', function (e) {
        startX = e.pageX;
        startWidth = col.offsetWidth;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
      });

      function resize(e) {
        var width = startWidth + (e.pageX - startX);
        col.style.width = width + 'px';
        col.style.minWidth = width + 'px';
        var colLabel = col.innerText.trim();
        var match = ssColumns.find(function (c) { return c.label === colLabel; });
        if (match) match.width = width;
      }

      function stopResize() {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
      }
    });
  }

  function loadTeamReport() {
    var dropdown = document.getElementById('ssFilterMember');
    if (dropdown) {
      var html = '<option value="">All Members</option>';
      teamMembers.forEach(function (m) {
        html += '<option value="' + m.id + '">' + m.name + '</option>';
      });
      dropdown.innerHTML = html;
    }

    fetchSpreadsheetData();
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
      var greeting = document.querySelector('#globalPageHeader p, .page-header p');
      if (greeting) greeting.textContent = 'Welcome back, ' + user.name.split(' ')[0] + '! Here\'s your team\'s progress overview.';

      var roleEl = document.querySelector('.sidebar-user-role');
      if (roleEl) {
        var role = user.role || 'LEADER';
        roleEl.textContent = (role === 'LEADER' || role === 'ADMIN') ? 'Team Leader' : 'Team Member';
      }

      // Populate General Settings fields
      var settingsName = document.getElementById('settingsName');
      var settingsEmail = document.getElementById('settingsEmail');
      if (settingsName) settingsName.value = user.name;
      if (settingsEmail && user.email) settingsEmail.value = user.email;
    }
  }

  function fetchLeaderData() {
    return Promise.all([
      API.getLeaderDashboard().catch(function () { return null; }),
      API.getAssignedAlumni({ page: 1, limit: 10000 }).catch(function () { return null; }),
      API.getUndistributedCount().catch(function () { return null; })
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
        if (_apiDashboardData.draft !== undefined) totalDraft = _apiDashboardData.draft;
        if (_apiDashboardData.teamMembers && _apiDashboardData.teamMembers.length > 0) {
          teamMembers = _apiDashboardData.teamMembers.map(function (m, idx) {
            var initials = (m.name || '?').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
            var colors = ['#2563EB', '#7C3AED', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#F43F5E', '#8B5CF6'];
            var user = API.getUser();
            var isLeader = m.isLeader || m.is_leader || (user && user.id && m.id == user.id) || (user && user.name && m.name === user.name) || (m.name && m.name.indexOf('Sarala') !== -1) || false;
            return {
              id: m.id || (idx + 1),
              name: m.name,
              initials: initials,
              color: m.color || colors[idx % colors.length],
              assigned: m.assigned || 0,
              completed: m.completed || 0,
              pending: (m.assigned || 0) - (m.completed || 0),
              progress: m.progress || ((m.assigned || 0) > 0 ? Math.round(((m.completed || 0) / m.assigned) * 100) : 0),
              status: m.status || (m.progress >= 75 ? 'On Track' : 'Behind'),
              lastActivity: m.lastActivity || '-',
              isLeader: isLeader
            };
          });
        }
      }
      var assigned = results[1];
      if (assigned && assigned.success) {
        _apiAssignedAlumni = assigned.data;
      }
      var undistRes = results[2];
      if (undistRes && undistRes.success && undistRes.data) {
        totalUndistributed = undistRes.data.count || 0;
      }
      populateNotifications();
      populateOverviewCards();
      populateTeamTable();
      populateRecentActivities();
      initCharts();
    }).catch(function () {
      populateNotifications();
      populateOverviewCards();
      populateTeamTable();
      populateRecentActivities();
      initCharts();
    });
  }

  // --- DISTRIBUTE MODAL LOGIC ---
  var _distPreviewData = null;


  function setupDistributeModal() {
    var distributeBtn = document.getElementById('distributeModalBtn');
    if (distributeBtn) {
      distributeBtn.addEventListener('click', function () {
        _distPreviewData = null;
        document.getElementById('distPreviewSection').style.display = 'none';
        document.getElementById('distEmptyState').style.display = 'block';
        document.getElementById('distLoadingState').style.display = 'none';
        document.getElementById('distEmptyMsg').textContent = 'Click Preview to load distribution.';
        document.getElementById('confirmDistributeBtn').style.display = 'none';

        // Fetch batches and populate select dropdown from assigned alumni data
        var batchInput = document.getElementById('distBatchInput');
        if (batchInput) {
          var batches = [];
          if (_apiAssignedAlumni && Array.isArray(_apiAssignedAlumni.records)) {
            var batchSet = {};
            _apiAssignedAlumni.records.forEach(function (a) {
              if (a.batch) {
                var bStr = String(a.batch).trim();
                if (bStr && bStr !== '-') {
                  batchSet[bStr] = true;
                }
              }
            });
            batches = Object.keys(batchSet).sort();
          }

          if (batches.length > 0) {
            var opts = '<option value="">Select Batch...</option>';
            batches.forEach(function (b) {
              opts += '<option value="' + b + '">' + b + '</option>';
            });
            batchInput.innerHTML = opts;
          } else {
            batchInput.innerHTML = '<option value="">No batches found in assigned alumni</option>';
          }
        }

        document.getElementById('distributeModalOverlay').classList.add('show');
      });
    }

     window.onDistMethodChange = function () {
      var select = document.getElementById('distMethodSelect');
      if (!select) return;
      var method = select.value;
      var batchContainer = document.getElementById('distBatchContainer');
      var deptMappingSection = document.getElementById('distDeptMappingSection');

      if (batchContainer) batchContainer.style.display = method === 'BatchWise' ? 'block' : 'none';
      if (deptMappingSection) {
        if (method === 'DepartmentWise') {
          deptMappingSection.style.display = 'block';
          renderDistDeptMappingGrid();
        } else {
          deptMappingSection.style.display = 'none';
        }
      }

    };

    function renderDistDeptMappingGrid() {
      var grid = document.getElementById('distDeptMappingGrid');
      if (!grid) return;

      var deptCounts = {};
      if (_apiAssignedAlumni) {
        var recs = Array.isArray(_apiAssignedAlumni.records) ? _apiAssignedAlumni.records : (Array.isArray(_apiAssignedAlumni) ? _apiAssignedAlumni : []);
        recs.forEach(function (a) {
          var d = (a.department || 'Unspecified').trim();
          if (d && d !== '-') {
            deptCounts[d] = (deptCounts[d] || 0) + 1;
          }
        });
      }

      var depts = Object.keys(deptCounts).sort();
      if (depts.length === 0) {
        var defaultDepts = ['CSE', 'ECE', 'EEE', 'ME', 'CIVIL', 'IT', 'AIDS', 'AIML'];
        defaultDepts.forEach(function (d) { deptCounts[d] = 0; });
        depts = defaultDepts;
      }

      var html = '<div style="display:grid;grid-template-columns:1fr;gap:8px;">';

      depts.forEach(function (dept) {
        var count = deptCounts[dept] || 0;
        var deptUpper = dept.toUpperCase().trim();
        var memberOptions = '<option value="">-- Leave Unassigned / Fallback --</option>';

        teamMembers.forEach(function (m) {
          var memberDeptUpper = (m.department || '').toUpperCase().trim();
          var isDefaultMatch = (memberDeptUpper && (memberDeptUpper === deptUpper || deptUpper.indexOf(memberDeptUpper) !== -1 || memberDeptUpper.indexOf(deptUpper) !== -1));
          var selected = isDefaultMatch ? 'selected' : '';
          var roleTag = m.isLeader ? ' (Leader)' : '';
          memberOptions += '<option value="' + m.id + '" ' + selected + '>' + m.name + roleTag + (m.department ? ' - ' + m.department : '') + '</option>';
        });

        html += '<div style="background:#FFFFFF;border:1px solid #CBD5E1;border-radius:8px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
          '<div>' +
            '<div style="font-weight:700;font-size:0.84rem;color:#1E293B;"><i class="fas fa-graduation-cap" style="color:#2563EB;margin-right:6px;"></i>' + dept + '</div>' +
            '<div style="font-size:0.75rem;color:#2563EB;font-weight:600;margin-top:2px;">' + (count > 0 ? (count + ' Pending Alumni Records') : 'Available Department') + '</div>' +
          '</div>' +
          '<div style="min-width:230px;">' +
            '<select class="dist-dept-target-select" data-dept="' + dept + '" style="width:100%;height:36px;font-size:0.82rem;border:1px solid #94A3B8;border-radius:6px;padding:6px 30px 6px 10px;background-color:#ffffff;color:#1E293B;outline:none;">' +
              memberOptions +
            '</select>' +
          '</div>' +
          '</div>';
      });

      html += '</div>';

      // Strategy for unassigned departments
      html += '<div style="margin-top:14px;padding-top:10px;border-top:1px dashed #CBD5E1;display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
        '<div>' +
          '<label style="font-size:0.8rem;font-weight:700;color:#334155;display:block;">Unassigned Departments Strategy</label>' +
          '<span style="font-size:0.72rem;color:#64748B;">How to handle departments not manually assigned above</span>' +
        '</div>' +
        '<select id="distDeptUnassignedFallback" style="width:230px;height:36px;font-size:0.8rem;border:1px solid #94A3B8;border-radius:6px;padding:6px 10px;background-color:#ffffff;color:#1E293B;outline:none;">' +
          '<option value="KeepUnassigned">Keep Unassigned (In Backlog)</option>' +
          '<option value="RoundRobin">Auto Round-Robin to Members</option>' +
          '<option value="AssignToLeader">Assign to Me (Team Leader)</option>' +
        '</select>' +
        '</div>';

      grid.innerHTML = html;
      grid.style.display = 'block';
    }

    function renderDistFallbackDeptGrid() {
      var grid = document.getElementById('distFallbackDeptGrid');
      if (!grid) return;
      var depts = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT'];
      var html = '';
      depts.forEach(function (dept) {
        var optionsHtml = '<option value="">-- Select Member --</option>';
        teamMembers.forEach(function (m) {
          optionsHtml += '<option value="' + m.id + '">' + m.name + (m.department ? ' (' + m.department + ')' : '') + '</option>';
        });
        html += '<div>' +
          '<label class="form-label" style="font-size:0.78rem;font-weight:600;color:#334155;margin-bottom:4px;display:block;">' + dept + '</label>' +
          '<select class="form-control dist-fallback-dept-select" data-dept="' + dept + '" style="height:34px;font-size:0.8rem;">' +
          optionsHtml +
          '</select>' +
          '</div>';
      });
      grid.innerHTML = html;
    }

    var distSelect = document.getElementById('distMethodSelect');
    if (distSelect) {
      distSelect.addEventListener('change', window.onDistMethodChange);
    }

    var previewBtn = document.getElementById('previewDistBtn');
    if (previewBtn) {
      previewBtn.addEventListener('click', function () {
        if (!_teamId) {
          showToast('Error', 'No team found. Please refresh.', 'danger');
          return;
        }
        var method = document.getElementById('distMethodSelect').value;
        var batch = document.getElementById('distBatchInput').value.trim() || undefined;
        var body = { teamId: _teamId, method: method };
        if (method === 'BatchWise' && batch) body.batch = batch;
        if (method === 'RoundRobin') {
          body.selectedMemberIds = teamMembers.map(function (m) { return m.id; });
        }
        if (method === 'DepartmentWise') {
          var mapping = {};
          document.querySelectorAll('.dist-dept-target-select').forEach(function (select) {
            var targetUserId = select.value;
            var deptName = select.getAttribute('data-dept');
            if (deptName && targetUserId) {
              mapping[deptName] = parseInt(targetUserId, 10);
            }
          });
          body.departmentMapping = mapping;
          var fbSelect = document.getElementById('distDeptUnassignedFallback');
          if (fbSelect) body.unmatchedFallback = fbSelect.value;
        }
        document.getElementById('distLoadingState').style.display = 'block';
        document.getElementById('distPreviewSection').style.display = 'none';
        document.getElementById('distEmptyState').style.display = 'none';
        document.getElementById('confirmDistributeBtn').style.display = 'none';

        API.leaderPreview(body).then(function (res) {
          document.getElementById('distLoadingState').style.display = 'none';
          if (!res || !res.success || !res.data || res.data.length === 0) {
            document.getElementById('distEmptyState').style.display = 'block';
            document.getElementById('distEmptyMsg').textContent = 'No undistributed alumni found for this selection.';
            return;
          }
          _distPreviewData = res.data;
          renderDistPreview(res.data);
          document.getElementById('distPreviewSection').style.display = 'block';
          document.getElementById('confirmDistributeBtn').style.display = 'inline-flex';
        }).catch(function (err) {
          document.getElementById('distLoadingState').style.display = 'none';
          document.getElementById('distEmptyState').style.display = 'block';
          document.getElementById('distEmptyMsg').textContent = err.message || 'Failed to generate preview.';
        });
      });
    }

    var confirmBtn = document.getElementById('confirmDistributeBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        if (!_distPreviewData) return;
        var method = document.getElementById('distMethodSelect').value;
        var batch = document.getElementById('distBatchInput').value.trim() || undefined;
        var body = { teamId: _teamId, method: method, manualAssignments: [] };
        if (method === 'BatchWise' && batch) body.batch = batch;
        if (method === 'RoundRobin') body.selectedMemberIds = teamMembers.map(function (m) { return m.id; });
        if (method === 'DepartmentWise') {
          var mapping = {};
          document.querySelectorAll('.dist-dept-target-select').forEach(function (select) {
            var targetUserId = select.value;
            var deptName = select.getAttribute('data-dept');
            if (deptName && targetUserId) {
              mapping[deptName] = parseInt(targetUserId, 10);
            }
          });
          // Also check for member-wise department selects if present
          document.querySelectorAll('.dist-member-dept-select').forEach(function (select) {
            var targetUserId = select.getAttribute('data-member-id');
            var selectedDept = select.value;
            if (targetUserId && selectedDept) {
              mapping[selectedDept] = parseInt(targetUserId, 10);
            }
          });
          body.departmentMapping = mapping;
          var fbSelect = document.getElementById('distDeptUnassignedFallback');
          if (fbSelect && fbSelect.value) body.unmatchedFallback = fbSelect.value;
        }
        var fbSelect = document.getElementById('distUnmatchedFallbackSelect');
        if (fbSelect && fbSelect.value) {
          body.unmatchedFallback = fbSelect.value;
          if (fbSelect.value === 'DepartmentWise') {
            var fbMapping = {};
            document.querySelectorAll('.dist-fallback-dept-select').forEach(function (sel) {
              var dept = sel.getAttribute('data-dept');
              var val = sel.value;
              if (dept && val) fbMapping[dept] = parseInt(val, 10);
            });
            body.fallbackDepartmentMapping = fbMapping;
          }
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Distributing...';
        API.leaderDistribute(body).then(function (res) {
          document.getElementById('distributeModalOverlay').classList.remove('show');
          var count = (res.data && res.data.distributed !== undefined) ? res.data.distributed :
            ((res.data && res.data.data && res.data.data.distributed !== undefined) ? res.data.data.distributed :
              (res.distributed || 0));
          showToast('Success', count + ' alumni distributed successfully!', 'success');
          fetchLeaderData();
        }).catch(function (err) {
          showToast('Error', err.message || 'Distribution failed.', 'danger');
        }).finally(function () {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Distribution';
        });
      });
    }
  }

  function renderDistPreview(groups) {
    var matchedGroups = groups.filter(function (g) { return g.userId !== -1 && !g.isUnmatched; });
    var unmatchedGroup = groups.find(function (g) { return g.userId === -1 || g.isUnmatched; });

    var html = '<table style="width:100%;border-collapse:collapse;font-size:0.82rem">' +
      '<thead><tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0">' +
      '<th style="padding:10px 14px;text-align:left;font-weight:700;color:#374151;white-space:nowrap;width:180px">Member</th>' +
      '<th style="padding:10px 14px;text-align:center;font-weight:700;color:#374151;width:70px">Count</th>' +
      '<th style="padding:10px 14px;text-align:left;font-weight:700;color:#374151">Alumni</th>' +
      '</tr></thead><tbody>';

    matchedGroups.forEach(function (g) {
      var nameTags = g.alumniList.map(function (a) {
        return '<span style="display:inline-block;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;' +
          'border-radius:4px;padding:2px 8px;font-size:0.75rem;margin:2px 3px 2px 0;white-space:nowrap;">' +
          (a.name || '-') + '</span>';
      }).join('');
      html += '<tr style="border-bottom:1px solid #F1F5F9;vertical-align:top">' +
        '<td style="padding:10px 14px;font-weight:600;color:#1E293B;white-space:nowrap">' + g.userName + '</td>' +
        '<td style="padding:10px 14px;text-align:center"><span style="display:inline-flex;align-items:center;justify-content:center;background:#DBEAFE;color:#1D4ED8;font-weight:700;font-size:0.8rem;border-radius:20px;min-width:28px;height:28px;padding:0 8px;">' + g.count + '</span></td>' +
        '<td style="padding:8px 14px;line-height:1.8">' + (nameTags || '-') + '</td>' +
        '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('distPreviewTable').innerHTML = html;

    if (unmatchedGroup && unmatchedGroup.alumniList.length > 0) {
      document.getElementById('distUnmatchedSection').style.display = 'block';
      var uHtml = '';
      unmatchedGroup.alumniList.forEach(function (a) {
        uHtml += '<div style="padding:4px 0;border-bottom:1px solid #F1F5F9">' +
          '<strong>' + a.name + '</strong> (' + (a.register_no || '-') + ')' +
          (a.originalFaculty ? ' <em style="color:#94A3B8;font-size:0.75rem">faculty: ' + a.originalFaculty + '</em>' : '') +
          '</div>';
      });
      document.getElementById('distUnmatchedList').innerHTML = uHtml;
      var fbSelect = document.getElementById('distUnmatchedFallbackSelect');
      if (fbSelect) {
        fbSelect.onchange = function () {
          var deptSection = document.getElementById('distFallbackDeptSection');
          if (deptSection) {
            deptSection.style.display = this.value === 'DepartmentWise' ? 'block' : 'none';
            if (this.value === 'DepartmentWise' && typeof renderDistFallbackDeptGrid === 'function') {
              renderDistFallbackDeptGrid();
            }
          }
        };
        fbSelect.value = 'RoundRobin';
        var deptSection = document.getElementById('distFallbackDeptSection');
        if (deptSection) deptSection.style.display = 'none';
      }
    } else {
      document.getElementById('distUnmatchedSection').style.display = 'none';
    }
  }

  function init() {
    setLeaderUserInfo();
    setupSidebar();
    setupNotifications();
    setupProfileDropdown();
    setupSearchAndFilter();
    setupModals();
    setupLockFeatures();
    setupSessionTimeout();
    setupUpdateModalEvents();
    setupDistributeModal();
    fetchLeaderData();

    // Hook tab-specific navigation load events
    document.querySelectorAll('.sidebar-nav .sidebar-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page === 'assignments') {
          loadMyAssignments();
        } else if (page === 'reports') {
          loadTeamReport();
        }
      });
    });

    // Bind my assignments sub-filters
    var mySearch = document.getElementById('myAssignmentsSearch');
    if (mySearch) mySearch.addEventListener('input', renderMyAssignmentsTable);
    var myStatusF = document.getElementById('myAssignmentsStatusFilter');
    if (myStatusF) myStatusF.addEventListener('change', renderMyAssignmentsTable);
    var myDeptF = document.getElementById('myAssignmentsDeptFilter');
    if (myDeptF) myDeptF.addEventListener('change', renderMyAssignmentsTable);
    var myBatchF = document.getElementById('myAssignmentsBatchFilter');
    if (myBatchF) myBatchF.addEventListener('change', renderMyAssignmentsTable);

    // Bind report sub-filters
    var repSearch = document.getElementById('reportSearch');
    if (repSearch) repSearch.addEventListener('input', renderTeamReportTable);
    var repUserF = document.getElementById('reportUserFilter');
    if (repUserF) repUserF.addEventListener('change', renderTeamReportTable);
    var repStatusF = document.getElementById('reportStatusFilter');
    if (repStatusF) repStatusF.addEventListener('change', renderTeamReportTable);

    // Bind rows per page dropdown listeners
    var rppSelect = document.getElementById('rowsPerPageSelect');
    if (rppSelect) {
      rppSelect.addEventListener('change', function () {
        pageSize = parseInt(this.value, 10);
        currentPage = 1;
        populateTeamTable();
      });
    }
    var myRppSelect = document.getElementById('myAssignmentsRowsPerPageSelect');
    if (myRppSelect) {
      myRppSelect.addEventListener('change', function () {
        myPageSize = parseInt(this.value, 10);
        myCurrentPage = 1;
        renderMyAssignmentsTable();
      });
    }
    var reportRppSelect = document.getElementById('reportRowsPerPageSelect');
    if (reportRppSelect) {
      reportRppSelect.addEventListener('change', function () {
        reportPageSize = parseInt(this.value, 10);
        reportCurrentPage = 1;
        renderTeamReportTable();
      });
    }

    setTimeout(function () {
      document.getElementById('loadingScreen').classList.add('hide');
      document.body.style.overflow = '';
    }, 800);

    document.querySelectorAll('.stat-card').forEach(function (card, idx) {
      card.style.animationDelay = (idx * 0.08) + 's';
    });
  }

  window.openSettingsPage = function () {
    var item = document.querySelector('.sidebar-item[data-page="settings"]');
    if (item) item.click();
  };

  window.updateMyAssignmentsFilterBadge = function () {
    var deptVal = document.getElementById('myAssignmentsDeptFilter') ? document.getElementById('myAssignmentsDeptFilter').value : 'all';
    var batchVal = document.getElementById('myAssignmentsBatchFilter') ? document.getElementById('myAssignmentsBatchFilter').value : 'all';
    var statusVal = document.getElementById('myAssignmentsStatusFilter') ? document.getElementById('myAssignmentsStatusFilter').value : 'all';
    var dateFromVal = document.getElementById('myAssignmentsDateFrom') ? document.getElementById('myAssignmentsDateFrom').value : '';
    var dateToVal = document.getElementById('myAssignmentsDateTo') ? document.getElementById('myAssignmentsDateTo').value : '';
    var activeCount = 0;
    if (deptVal !== 'all') activeCount++;
    if (batchVal !== 'all') activeCount++;
    if (statusVal !== 'all') activeCount++;
    if (dateFromVal) activeCount++;
    if (dateToVal) activeCount++;
    var badge = document.getElementById('myAssignmentsActiveFilterBadge');
    if (badge) {
      badge.textContent = activeCount;
      badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }
  };

  window.clearMyAssignmentsFilters = function () {
    if (document.getElementById('myAssignmentsDeptFilter')) document.getElementById('myAssignmentsDeptFilter').value = 'all';
    if (document.getElementById('myAssignmentsBatchFilter')) document.getElementById('myAssignmentsBatchFilter').value = 'all';
    if (document.getElementById('myAssignmentsStatusFilter')) document.getElementById('myAssignmentsStatusFilter').value = 'all';
    if (document.getElementById('myAssignmentsDateFrom')) document.getElementById('myAssignmentsDateFrom').value = '';
    if (document.getElementById('myAssignmentsDateTo')) document.getElementById('myAssignmentsDateTo').value = '';
    window.updateMyAssignmentsFilterBadge();
    if (typeof renderMyAssignmentsTable === 'function') renderMyAssignmentsTable();
    if (typeof closeModal === 'function') closeModal('myAssignmentsFilterModal');
  };

  window.switchSettingsTab = function (tabName, btn) {
    var tabsContainer = btn.closest('.card-body');
    tabsContainer.querySelectorAll('.tab-item').forEach(function (item) {
      item.classList.remove('active');
      item.style.fontWeight = 'normal';
    });
    tabsContainer.querySelectorAll('.tab-content').forEach(function (content) {
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

  window.saveLeaderProfile = function () {
    var user = API.getUser();
    if (!user || !user.id) return;
    var name = document.getElementById('settingsName').value.trim();
    var email = document.getElementById('settingsEmail').value.trim();
    if (!name || !email) {
      showToast('Validation Error', 'Name and Email are required.', 'danger');
      return;
    }

    // Split name to first and last
    var parts = name.split(' ');
    var fName = parts[0];
    var lName = parts.slice(1).join(' ') || '';

    API.updateProfile(user.id, { firstName: fName, lastName: lName, email: email }).then(function (res) {
      showToast('Success', 'Profile settings updated successfully!', 'success');
      // Update local storage representation
      user.name = name;
      user.email = email;
      localStorage.setItem('user', JSON.stringify(user));
      setLeaderUserInfo();
    }).catch(function (err) {
      showToast('Error', err.message || 'Failed to update profile.', 'danger');
    });
  };

  window.togglePasswordVisibility = function (id, btn) {
    var input = document.getElementById(id);
    var icon = btn.querySelector('i');
    if (!input || !icon) return;
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'far fa-eye';
    }
  };

  window.togglePassword = window.togglePasswordVisibility; // Alias just in case

  window.showPasswordSuccessModal = function () {
    var modal = document.getElementById('passwordSuccessModal');
    if (modal) modal.classList.add('show');
  };

  window.closePasswordSuccessModal = function () {
    var modal = document.getElementById('passwordSuccessModal');
    if (modal) modal.classList.remove('show');
  };

  window.saveLeaderPassword = function () {
    var oldPassEl = document.getElementById('settingsOldPass');
    var newPassEl = document.getElementById('settingsNewPass');
    var confirmPassEl = document.getElementById('settingsConfirmPass');
    var btn = document.querySelector('#tab-security .btn-primary');

    if (!oldPassEl || !newPassEl || !confirmPassEl) return;

    var oldVal = oldPassEl.value.trim();
    var newVal = newPassEl.value.trim();
    var confirmVal = confirmPassEl.value.trim();

    // --- Validation ---
    if (!oldVal) {
      showToast('Validation', 'Please enter your current password.', 'warning');
      oldPassEl.focus();
      return;
    }
    if (!newVal || newVal.length < 6) {
      showToast('Validation', 'New password must be at least 6 characters.', 'warning');
      newPassEl.focus();
      return;
    }
    if (newVal !== confirmVal) {
      showToast('Validation', 'New password and confirm password do not match.', 'danger');
      confirmPassEl.focus();
      return;
    }
    if (oldVal === newVal) {
      showToast('Validation', 'New password must be different from the current password.', 'warning');
      newPassEl.focus();
      return;
    }

    // --- Call API ---
    if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

    API.changePassword(oldVal, newVal)
      .then(function (res) {
        oldPassEl.value = '';
        newPassEl.value = '';
        confirmPassEl.value = '';
        window.showPasswordSuccessModal();
      })
      .catch(function (err) {
        showToast('Error', err.message || 'Failed to update password. Please try again.', 'danger');
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save"></i> Update Password';
        }
      });
  };

  // Auto refresh dashboard data disabled by user request

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ============================================================
// FEATURE 1 — CIRCULATE / REDISTRIBUTE (Leader)
// ============================================================

var _circulatePreviewData = null;

window.onCirculateDeptChange = function () {
  var dept = document.getElementById('circulateDeptFilter') ? document.getElementById('circulateDeptFilter').value : 'all';
  window.openCirculateModal(dept);
};

window.openCirculateModal = function (selectedDept) {
  _circulatePreviewData = null;
  document.getElementById('circulateStep1').style.display = 'block';
  document.getElementById('circulateStep2').style.display = 'none';
  document.getElementById('circulateWorkloadTable').innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;padding:12px;">Loading...</p>';

  var currentDept = selectedDept || (document.getElementById('circulateDeptFilter') ? document.getElementById('circulateDeptFilter').value : 'all');
  var token = localStorage.getItem('token');
  var queryUrl = '/api/v1/assignments/reassign/team-load' + (currentDept && currentDept !== 'all' ? '?department=' + encodeURIComponent(currentDept) : '');

  fetch(queryUrl, {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (!res || !res.success) {
      document.getElementById('circulateWorkloadTable').innerHTML = '<p style="color:var(--danger);padding:12px;">Failed to load team data.</p>';
      return;
    }
    var data = res.data;

    // Populate Dept filter options if returning departments list
    var deptFilterEl = document.getElementById('circulateDeptFilter');
    if (deptFilterEl && data.departments) {
      var prevVal = currentDept;
      var opts = '<option value="all">All Departments</option>';
      data.departments.forEach(function (d) {
        opts += '<option value="' + d + '"' + (d === prevVal ? ' selected' : '') + '>' + d + '</option>';
      });
      deptFilterEl.innerHTML = opts;
      deptFilterEl.value = prevVal;
    }

    var tbl = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">' +
      '<thead><tr style="background:#F1F5F9;">' +
      '<th style="padding:8px;text-align:left;border-bottom:2px solid #E2E8F0;">Member</th>' +
      '<th style="padding:8px;text-align:center;border-bottom:2px solid #E2E8F0;">Pending</th>' +
      '<th style="padding:8px;text-align:center;border-bottom:2px solid #E2E8F0;">Completed</th>' +
      '</tr></thead><tbody>';
    data.members.forEach(function (m) {
      tbl += '<tr><td style="padding:8px;border-bottom:1px solid #E2E8F0;">' + m.name + ' <small style="color:#94A3B8;">(' + m.role + ')</small></td>' +
        '<td style="padding:8px;text-align:center;border-bottom:1px solid #E2E8F0;color:var(--warning);font-weight:600;">' + m.pending_count + '</td>' +
        '<td style="padding:8px;text-align:center;border-bottom:1px solid #E2E8F0;color:var(--success);">' + m.completed_count + '</td></tr>';
    });
    tbl += '</tbody></table>';
    document.getElementById('circulateWorkloadTable').innerHTML = tbl;

    var sourceSel = document.getElementById('circulateSourceSelect');
    var targetBox = document.getElementById('circulateTargetCheckboxes');
    sourceSel.innerHTML = '<option value="">-- Select Source --</option>';

    data.members.forEach(function (m) {
      var o1 = document.createElement('option');
      o1.value = m.user_id;
      o1.text = m.name + ' (' + m.pending_count + ' pending)';
      sourceSel.appendChild(o1);
    });

    var onSourceSelect = function () {
      var srcId = parseInt(sourceSel.value, 10);
      targetBox.innerHTML = '';
      if (!srcId) {
        targetBox.innerHTML = '<span style="color:#94A3B8;font-size:0.8rem;">Select source first...</span>';
        var deptFilterEl = document.getElementById('circulateDeptFilter');
        if (deptFilterEl) deptFilterEl.innerHTML = '<option value="all">All Departments</option>';
        return;
      }

      // Fetch source member's specific department breakdown
      var token = localStorage.getItem('token');
      fetch('/api/v1/assignments/reassign/source-departments?sourceMemberId=' + srcId, {
        headers: { 'Authorization': 'Bearer ' + token }
      }).then(function (r) { return r.json(); }).then(function (res) {
        var deptFilterEl = document.getElementById('circulateDeptFilter');
        if (deptFilterEl && res.success && res.data.departments) {
          var opts = '<option value="all">All Departments (All Backlog)</option>';
          res.data.departments.forEach(function (d) {
            opts += '<option value="' + d.department + '">' + d.department + ' (' + d.count + ' pending)</option>';
          });
          deptFilterEl.innerHTML = opts;
        }
      }).catch(function (e) {});

      data.members.forEach(function (m) {
        if (m.user_id !== srcId) {
          var label = document.createElement('label');
          label.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:0.85rem;cursor:pointer;color:var(--text-dark);';
          label.innerHTML = '<input type="checkbox" class="circulate-target-cb" value="' + m.user_id + '" style="accent-color:var(--primary);width:16px;height:16px;"> ' + m.name + ' <small style="color:#64748B;">(' + m.pending_count + ' pending)</small>';
          targetBox.appendChild(label);
        }
      });
    };

    sourceSel.onchange = onSourceSelect;
  }).catch(function (err) {
    document.getElementById('circulateWorkloadTable').innerHTML = '<p style="color:var(--danger);padding:12px;">Network error.</p>';
  });

  openModal('circulateModal');
};

window.circulatePreview = function () {
  var sourceMemberId = parseInt(document.getElementById('circulateSourceSelect').value, 10);
  if (!sourceMemberId) { Toast.warning('Circulate', 'Please select a source member.'); return; }

  var cbs = document.querySelectorAll('.circulate-target-cb:checked');
  var targetMemberIds = Array.from(cbs).map(function (cb) { return parseInt(cb.value, 10); });
  if (targetMemberIds.length === 0) { Toast.warning('Circulate', 'Please select at least one target.'); return; }
  var count = parseInt(document.getElementById('circulateCount').value, 10) || null;
  var algorithm = document.getElementById('circulateAlgorithm') ? document.getElementById('circulateAlgorithm').value : 'RoundRobin';

  var token = localStorage.getItem('token');
  fetch('/api/v1/assignments/reassign/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ sourceMemberId: sourceMemberId, targetMemberIds: targetMemberIds, count: count, algorithm: algorithm })
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (!res || !res.success) { Toast.error('Circulate', res && res.message || 'Preview failed.'); return; }
    _circulatePreviewData = res.data;

    var algSubtext = ' <span style="background:#E0E7FF;color:#4338CA;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:600;">[' + algorithm + ']</span>';

    var html = '<p style="color:var(--text-secondary);margin-bottom:14px;font-size:0.85rem;">Moving <strong>' + res.data.totalMoving + '</strong> records' + algSubtext + ' from <strong>' + res.data.sourceName + '</strong>:</p>';
    res.data.preview.forEach(function (group) {
      html += '<div style="margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;background:#EFF6FF;padding:8px 12px;border-radius:8px;margin-bottom:6px;">' +
        '<strong style="color:#1E40AF;">' + group.targetName + '</strong>' +
        '<span style="background:#2563EB;color:#fff;padding:2px 8px;border-radius:20px;font-size:0.75rem;">' + group.count + ' records</span></div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;"><thead><tr style="background:#F8FAFC;">' +
        '<th style="padding:5px 8px;text-align:left;">Name</th><th style="padding:5px 8px;text-align:left;">Reg No</th><th style="padding:5px 8px;text-align:left;">Department</th></tr></thead><tbody>';
      group.alumni.forEach(function (a) {
        html += '<tr><td style="padding:4px 8px;">' + a.name + '</td><td style="padding:4px 8px;color:#94A3B8;">' + a.register_no + '</td><td style="padding:4px 8px;color:#64748B;">' + (a.department || '-') + '</td></tr>';
      });
      html += '</tbody></table></div>';
    });
    document.getElementById('circulatePreviewContent').innerHTML = html;
    document.getElementById('circulateStep1').style.display = 'none';
    document.getElementById('circulateStep2').style.display = 'block';
  }).catch(function (err) { Toast.error('Circulate', 'Network error.'); });
};

window.circulateCommit = function () {
  if (!_circulatePreviewData) { Toast.error('Circulate', 'No preview data.'); return; }
  var allocations = {};
  _circulatePreviewData.preview.forEach(function (group) {
    allocations[group.targetMemberId] = group.alumni.map(function (a) { return a.assignment_id; });
  });
  var token = localStorage.getItem('token');
  fetch('/api/v1/assignments/reassign/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ sourceMemberId: _circulatePreviewData.sourceMemberId, allocations: allocations })
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (!res || !res.success) { Toast.error('Circulate', res && res.message || 'Commit failed.'); return; }
    Toast.success('Circulate', res.message || (res.data.moved + ' alumni redistributed!'));
    closeModal('circulateModal');
    if (typeof fetchSpreadsheetData === 'function') fetchSpreadsheetData();
  }).catch(function (err) { Toast.error('Circulate', 'Network error.'); });
};

// Real-time sync listener (Feature 5)
if (typeof io !== 'undefined') {
  try {
    var socket = io();
    var user = API.getCurrentUser ? API.getCurrentUser() : null;
    socket.emit('join', { role: 'LEADER', teamId: user ? user.team_id : null });
    socket.on('assignmentsUpdated', function () {
      if (typeof fetchSpreadsheetData === 'function') fetchSpreadsheetData();
      if (typeof fetchDashboardStats === 'function') fetchDashboardStats();
    });
  } catch (e) {
    console.warn('Socket.io connection failed:', e);
  }
}

window.reopenAlumniRecord = function (alumniId) {
  if (!confirm('Are you sure you want to reopen this record back to Pending status for modifications?')) return;
  var token = localStorage.getItem('token');
  fetch('/api/v1/assignments/reopen/' + alumniId, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (res && res.success) {
      Toast.success('Reopen Record', res.message || 'Record reopened successfully.');
      if (typeof fetchSpreadsheetData === 'function') fetchSpreadsheetData();
      if (typeof fetchLeaderData === 'function') fetchLeaderData();
    } else {
      Toast.error('Reopen Record', res && res.message || 'Failed to reopen record.');
    }
  }).catch(function () {
    Toast.error('Reopen Record', 'Network error reopening record.');
  });
};

window.undoAlumniSubmission = function () {
  if (!currentSelectedAlumniId) return;
  if (!confirm('Are you sure you want to undo submission and set status back to Pending?')) return;

  var undoBtn = document.getElementById('undoSubmitBtn');
  if (undoBtn) { undoBtn.disabled = true; undoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Undoing...'; }

  var token = localStorage.getItem('token');
  fetch('/api/v1/assignments/reopen/' + currentSelectedAlumniId, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (res && res.success) {
      Toast.success('Undo Submission', res.message || 'Submission undone successfully.');
      var overlay = document.getElementById('updateModal');
      if (overlay) overlay.classList.remove('show');
      if (typeof fetchSpreadsheetData === 'function') fetchSpreadsheetData();
      if (typeof fetchLeaderData === 'function') fetchLeaderData();
    } else {
      Toast.error('Undo Submission', res && res.message || 'Failed to undo submission.');
    }
  }).catch(function () {
    Toast.error('Undo Submission', 'Network error undoing submission.');
  }).finally(function () {
    if (undoBtn) { undoBtn.disabled = false; undoBtn.innerHTML = '<i class="fas fa-undo"></i> Undo Submit'; }
  });
};

/* ── EMAIL CAMPAIGN (n8n AUTOMATION) HANDLERS ── */
var _activeCampaignPollInterval = null;

window.switchCampaignTab = function (tab) {
  var recipientsTab = document.getElementById('campaignTabRecipients');
  var templateTab = document.getElementById('campaignTabTemplate');
  var btnRecipients = document.getElementById('tabBtnCampaignRecipients');
  var btnTemplate = document.getElementById('tabBtnCampaignTemplate');

  if (tab === 'recipients') {
    if (recipientsTab) recipientsTab.style.display = 'block';
    if (templateTab) templateTab.style.display = 'none';
    if (btnRecipients) { btnRecipients.style.color = '#2563EB'; btnRecipients.style.borderBottom = '2px solid #2563EB'; }
    if (btnTemplate) { btnTemplate.style.color = '#64748B'; btnTemplate.style.borderBottom = 'none'; }
  } else {
    if (recipientsTab) recipientsTab.style.display = 'none';
    if (templateTab) templateTab.style.display = 'block';
    if (btnRecipients) { btnRecipients.style.color = '#64748B'; btnRecipients.style.borderBottom = 'none'; }
    if (btnTemplate) { btnTemplate.style.color = '#2563EB'; btnTemplate.style.borderBottom = '2px solid #2563EB'; }
  }
};

window.previewIndividualAlumniEmail = function (name, email, assignmentId) {
  var nameEl = document.getElementById('previewAlumniName');
  var emailEl = document.getElementById('previewToEmail');
  var tagEl = document.getElementById('previewReplyToTag');

  if (nameEl) nameEl.textContent = name || 'Alumnus';
  if (emailEl) emailEl.textContent = email || 'alumni@mountzion.ac.in';
  if (tagEl) tagEl.textContent = 'alumnims+' + (assignmentId || 'ID') + '@mountzion.ac.in';

  window.switchCampaignTab('template');
};

window.openEmailCampaignModal = function () {
  var setupState = document.getElementById('campaignSetupState');
  var progressState = document.getElementById('campaignProgressState');
  var launchBtn = document.getElementById('launchCampaignSubmitBtn');
  var badge = document.getElementById('campaignRecipientBadge');
  var countTag = document.getElementById('campaignRecipientsCountTag');
  var tbody = document.getElementById('campaignRecipientsPreviewTableBody');

  if (setupState) setupState.style.display = 'block';
  if (progressState) progressState.style.display = 'none';
  if (launchBtn) { launchBtn.style.display = 'inline-flex'; launchBtn.disabled = false; launchBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:6px;"></i> Launch Campaign'; }
  if (badge) badge.textContent = 'Counting team records...';
  if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#64748B;"><i class="fas fa-spinner fa-spin"></i> Loading team alumni records...</td></tr>';

  window.switchCampaignTab('recipients');

  var token = localStorage.getItem('token');
  fetch('/api/v1/email-campaigns/preview-recipients', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (res && res.success && res.data) {
      var records = (res.data.records && Array.isArray(res.data.records)) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
      var total = res.data.total !== undefined ? res.data.total : records.length;
      if (badge) badge.textContent = total + ' Alumni Records';
      if (countTag) countTag.textContent = records.length;

      if (records.length > 0) {
        var html = '';
        records.forEach(function (rec) {
          var safeName = (rec.name || 'Alumnus').replace(/'/g, "\\'");
          var safeEmail = (rec.email || 'No Email').replace(/'/g, "\\'");
          var assignId = rec.assignment_id || rec.id || 0;
          html += '<tr style="border-bottom:1px solid #F1F5F9;">';
          html += '  <td style="padding:8px 12px;font-weight:600;color:#1E293B;">' + (rec.name || '-') + '</td>';
          html += '  <td style="padding:8px 12px;color:#64748B;">' + (rec.department || '-') + ' (' + (rec.batch || '-') + ')</td>';
          html += '  <td style="padding:8px 12px;color:#2563EB;">' + (rec.email || '<span style="color:#EF4444;">No Email</span>') + '</td>';
          html += '  <td style="padding:8px 12px;text-align:right;">';
          html += '    <button type="button" class="btn btn-secondary btn-sm" onclick="previewIndividualAlumniEmail(\'' + safeName + '\', \'' + safeEmail + '\', ' + assignId + ')" style="padding:2px 8px;font-size:0.72rem;"><i class="fas fa-eye"></i> Preview</button>';
          html += '  </td>';
          html += '</tr>';
        });
        if (tbody) tbody.innerHTML = html;

        // Auto render first record preview
        var first = records[0];
        window.previewIndividualAlumniEmail(first.name, first.email, first.assignment_id || first.id || 0);
        window.switchCampaignTab('recipients');
      } else {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#64748B;">No team alumni records found.</td></tr>';
      }
    } else {
      if (badge) badge.textContent = 'Team Assignments Ready';
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#64748B;">Unable to load recipients list.</td></tr>';
    }
  }).catch(function () {
    if (badge) badge.textContent = 'Team Assignments Ready';
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#64748B;">Unable to load recipients list.</td></tr>';
  });

  if (window.openModal) window.openModal('emailCampaignModal');
};

window.submitEmailCampaignLaunch = function () {
  var launchBtn = document.getElementById('launchCampaignSubmitBtn');
  if (launchBtn) { launchBtn.disabled = true; launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Dispatching to n8n...'; }

  var token = localStorage.getItem('token');
  fetch('/api/v1/email-campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({})
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (res && res.success) {
      Toast.success('Campaign Dispatched', 'n8n email automation campaign has been queued.');
      var setupState = document.getElementById('campaignSetupState');
      var progressState = document.getElementById('campaignProgressState');
      if (setupState) setupState.style.display = 'none';
      if (progressState) progressState.style.display = 'block';
      if (launchBtn) launchBtn.style.display = 'none';

      var campaignId = res.data.campaignId;
      window.pollCampaignProgress(campaignId);
    } else {
      Toast.error('Campaign Failed', res && res.message || 'Failed to dispatch campaign');
      if (launchBtn) { launchBtn.disabled = false; launchBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Launch Campaign'; }
    }
  }).catch(function () {
    Toast.error('Campaign Failed', 'Network error dispatching campaign');
    if (launchBtn) { launchBtn.disabled = false; launchBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Launch Campaign'; }
  });
};

window.pollCampaignProgress = function (campaignId) {
  if (_activeCampaignPollInterval) clearInterval(_activeCampaignPollInterval);

  var token = localStorage.getItem('token');
  var progressBar = document.getElementById('campaignProgressBar');
  var progressStats = document.getElementById('campaignProgressStats');

  _activeCampaignPollInterval = setInterval(function () {
    fetch('/api/v1/email-campaigns/' + campaignId, {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res && res.data) {
        var c = res.data;
        var total = c.total_recipients || 1;
        var processed = (c.sent_count || 0) + (c.failed_count || 0);
        var pct = Math.min(100, Math.round((processed / total) * 100));

        if (progressBar) progressBar.style.width = pct + '%';
        if (progressStats) progressStats.textContent = 'Sent: ' + (c.sent_count || 0) + ' / Failed: ' + (c.failed_count || 0) + ' (Total: ' + total + ')';

        if (c.status === 'Completed' || c.status === 'Failed' || processed >= total) {
          clearInterval(_activeCampaignPollInterval);
          Toast.success('Campaign Completed', 'All emails have been processed via n8n automation.');
        }
      }
    }).catch(function () {});
  }, 3000);
};

window.copyAlumniAndFather = function (name, father) {
  var textStr = 'Alumni: ' + name + (father ? ' | Father: ' + father : '');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(textStr).then(function () {
      if (typeof window.showToast === 'function') window.showToast('Copied: ' + textStr, 'success');
    });
  }
};

/* ── ALUMNI REPLIES INBOX HANDLERS (LEADER) ── */
window.openAlumniRepliesModal = function () {
  var container = document.getElementById('alumniRepliesListContainer');
  if (container) container.innerHTML = '<p style="text-align:center;color:#64748B;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading alumni replies...</p>';

  var token = localStorage.getItem('token');
  fetch('/api/v1/email-campaigns/replies/all', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (res && res.data && res.data.length > 0) {
      var html = '<div style="display:flex;flex-direction:column;gap:12px;">';
      res.data.forEach(function (reply) {
        var isPending = reply.review_status === 'Pending Review';
        var badgeStyle = isPending ? 'background:#FEF3C7;color:#D97706;border:1px solid #FCD34D;' : 'background:#D1FAE5;color:#059669;border:1px solid #A7F3D0;';

        html += '<div style="border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px;background:#F8FAFC;">';
        html += '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
        html += '    <div>';
        html += '      <strong style="font-size:0.92rem;color:#1E293B;">' + (reply.alumni_name || 'Alumnus') + '</strong>';
        html += '      <span style="font-size:0.78rem;color:#64748B;margin-left:8px;">(' + (reply.alumni_email || '') + ')</span>';
        html += '    </div>';
        html += '    <span class="badge" style="padding:4px 10px;border-radius:12px;font-size:0.72rem;font-weight:600;' + badgeStyle + '">' + reply.review_status + '</span>';
        html += '  </div>';
        html += '  <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;font-size:0.83rem;color:#334155;white-space:pre-wrap;margin-bottom:10px;">' + (reply.raw_reply_text || '') + '</div>';
        html += '  <div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '    <span style="font-size:0.75rem;color:#94A3B8;"><i class="far fa-clock" style="margin-right:4px;"></i>' + new Date(reply.received_at).toLocaleString() + '</span>';
        if (isPending) {
          html += '    <button class="btn btn-primary btn-sm" onclick="markReplyAsReviewed(' + reply.reply_id + ')" style="padding:4px 12px;font-size:0.78rem;"><i class="fas fa-check" style="margin-right:4px;"></i> Mark Reviewed</button>';
        }
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';
      if (container) container.innerHTML = html;

      var badge = document.getElementById('pendingRepliesCountBadge');
      var pendingCount = res.data.filter(function (r) { return r.review_status === 'Pending Review'; }).length;
      if (badge) {
        if (pendingCount > 0) {
          badge.textContent = pendingCount;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    } else {
      if (container) container.innerHTML = '<p style="text-align:center;color:#64748B;padding:24px;"><i class="fas fa-inbox" style="font-size:2rem;color:#CBD5E1;display:block;margin-bottom:8px;"></i> No alumni email replies found.</p>';
    }
  }).catch(function (err) {
    if (container) container.innerHTML = '<p style="text-align:center;color:#EF4444;padding:16px;">Failed to load alumni replies.</p>';
  });

  if (window.openModal) window.openModal('alumniRepliesModal');
};

window.markReplyAsReviewed = function (replyId) {
  var token = localStorage.getItem('token');
  fetch('/api/v1/email-campaigns/replies/' + replyId + '/review', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (res && res.success) {
      if (typeof window.showToast === 'function') window.showToast('Reply marked as reviewed!', 'success');
      window.openAlumniRepliesModal();
    }
  }).catch(function () { });
};

var _undoTargetId = null;

window.confirmUndoSubmission = function (alumniId, name) {
  _undoTargetId = alumniId;
  var nameEl = document.getElementById('undoTargetName');
  if (nameEl) nameEl.textContent = name || 'this record';
  if (typeof window.openModal === 'function') {
    window.openModal('undoConfirmModal');
  } else {
    var modal = document.getElementById('undoConfirmModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }
};

window.closeUndoModal = function () {
  _undoTargetId = null;
  if (typeof window.closeModal === 'function') {
    window.closeModal('undoConfirmModal');
  } else {
    var modal = document.getElementById('undoConfirmModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }
};

window.executeUndoSubmission = function () {
  if (!_undoTargetId) return;
  var btn = document.getElementById('confirmUndoBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Undoing...';
  }

  var apiCall = (window.API && typeof window.API.reopenAssignment === 'function')
    ? window.API.reopenAssignment(_undoTargetId, 'Undone by team leader')
    : (window.API && typeof window.API.reopenAlumni === 'function'
      ? window.API.reopenAlumni(_undoTargetId)
      : Promise.reject(new Error('API unavailable')));

  apiCall.then(function (res) {
    if (window.Toast && typeof window.Toast.warning === 'function') {
      window.Toast.warning('Submission Undone!', 'Record moved back to Draft.');
    } else if (typeof showToast === 'function') {
      showToast('Submission Undone', 'Record moved back to Draft.', 'warning');
    }

    // Optimistically update local assignments array so the record status becomes Draft immediately
    if (typeof myAssignmentsData !== 'undefined' && Array.isArray(myAssignmentsData)) {
      myAssignmentsData.forEach(function (rec) {
        if (rec.alumni_id == _undoTargetId || rec.id == _undoTargetId) {
          rec.status = 'Draft';
        }
      });
    }

    window.closeUndoModal();

    // Hide update modal if open for this record
    var updateModalOverlay = document.getElementById('updateModal');
    if (updateModalOverlay) {
      if (typeof window.closeModal === 'function') {
        window.closeModal('updateModal');
      } else {
        updateModalOverlay.classList.remove('show');
        updateModalOverlay.style.display = 'none';
      }
    }

    // Re-render table and fetch fresh data from backend
    if (typeof renderMyAssignmentsTable === 'function') renderMyAssignmentsTable();
    if (typeof loadMyAssignments === 'function') loadMyAssignments();
    if (typeof fetchSpreadsheetData === 'function') fetchSpreadsheetData();
  }).catch(function (err) {
    var errMsg = (err && err.message) || 'Failed to undo submission.';
    if (window.Toast && typeof window.Toast.danger === 'function') {
      window.Toast.danger('Undo Failed', errMsg);
    } else if (typeof showToast === 'function') {
      showToast('Undo Failed', errMsg, 'danger');
    }
  }).finally(function () {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-undo"></i> Undo & Change to Draft';
    }
  });
};

window.undoAlumniSubmission = function () {
  if (!window.currentSelectedAlumniId) return;
  var recordName = (document.getElementById('modalTitle') ? document.getElementById('modalTitle').textContent : '');
  window.confirmUndoSubmission(window.currentSelectedAlumniId, recordName);
};

document.addEventListener('DOMContentLoaded', function () {
  if (typeof initLocationCascade === 'function') {
    window._leaderLocationCascade = initLocationCascade('fieldCountry', 'fieldState', 'fieldCity');
  }
});
