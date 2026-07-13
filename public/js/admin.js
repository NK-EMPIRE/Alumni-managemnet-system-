/* ============================================================
   Alumni Professional Details Update Management System
   Admin Dashboard JavaScript
   ============================================================ */

/* ────────────────────────────────────────────────────────────
   1. DATA – Dummy datasets for Indian context
   ──────────────────────────────────────────────────────────── */

const dummyTeamLeaders = [
  { name: 'Amit Verma', email: 'amit.verma@alumnims.edu', phone: '+91-9876543210', dept: 'CSE', members: 4, assigned: 35 },
  { name: 'Priya Sharma', email: 'priya.sharma@alumnims.edu', phone: '+91-9876543211', dept: 'ECE', members: 3, assigned: 28 },
  { name: 'Rajesh Patel', email: 'rajesh.patel@alumnims.edu', phone: '+91-9876543212', dept: 'EEE', members: 5, assigned: 42 },
  { name: 'Sunita Gupta', email: 'sunita.gupta@alumnims.edu', phone: '+91-9876543213', dept: 'IT', members: 4, assigned: 31 },
  { name: 'Vikram Singh', email: 'vikram.singh@alumnims.edu', phone: '+91-9876543214', dept: 'ME', members: 3, assigned: 24 }
];

const dummyTeamMembers = [
  { name: 'Anjali Rao', email: 'anjali.rao@alumnims.edu', phone: '+91-9988776651', dept: 'CSE', leader: 'Amit Verma', assigned: 8 },
  { name: 'Deepak Nair', email: 'deepak.nair@alumnims.edu', phone: '+91-9988776652', dept: 'CSE', leader: 'Amit Verma', assigned: 10 },
  { name: 'Kavita Joshi', email: 'kavita.joshi@alumnims.edu', phone: '+91-9988776653', dept: 'ECE', leader: 'Priya Sharma', assigned: 12 },
  { name: 'Manoj Kumar', email: 'manoj.kumar@alumnims.edu', phone: '+91-9988776654', dept: 'ECE', leader: 'Priya Sharma', assigned: 6 },
  { name: 'Neelam Reddy', email: 'neelam.reddy@alumnims.edu', phone: '+91-9988776655', dept: 'EEE', leader: 'Rajesh Patel', assigned: 15 },
  { name: 'Pooja Mehta', email: 'pooja.mehta@alumnims.edu', phone: '+91-9988776656', dept: 'EEE', leader: 'Rajesh Patel', assigned: 9 },
  { name: 'Rahul Saxena', email: 'rahul.saxena@alumnims.edu', phone: '+91-9988776657', dept: 'IT', leader: 'Sunita Gupta', assigned: 11 },
  { name: 'Swati Desai', email: 'swati.desai@alumnims.edu', phone: '+91-9988776658', dept: 'ME', leader: 'Vikram Singh', assigned: 7 },
  { name: 'Ravi Kumar', email: 'ravi.kumar@alumnims.edu', phone: '+91-9988776659', dept: 'IT', leader: 'Sunita Gupta', assigned: 8 },
  { name: 'Meena Iyer', email: 'meena.iyer@alumnims.edu', phone: '+91-9988776660', dept: 'ME', leader: 'Vikram Singh', assigned: 5 },
  { name: 'Akash Gupta', email: 'akash.gupta@alumnims.edu', phone: '+91-9988776661', dept: 'EEE', leader: 'Rajesh Patel', assigned: 10 },
  { name: 'Sneha Rao', email: 'sneha.rao@alumnims.edu', phone: '+91-9988776662', dept: 'CSE', leader: 'Amit Verma', assigned: 7 }
];

const dummyActivities = [];

// Real notifications drawn from audit logs — no dummy data

const dummyDeptProgress = [
  { dept: 'CSE', completed: 320, total: 465, color: '#3B82F6' },
  { dept: 'ECE', completed: 280, total: 400, color: '#10B981' },
  { dept: 'EEE', completed: 195, total: 285, color: '#F59E0B' },
  { dept: 'ME', completed: 240, total: 350, color: '#EF4444' },
  { dept: 'CE', completed: 170, total: 255, color: '#8B5CF6' },
  { dept: 'IT', completed: 389, total: 595, color: '#EC4899' }
];

const dummyBatchProgress = [
  { batch: '2024', completed: 120, total: 200, color: '#3B82F6' },
  { batch: '2023', completed: 280, total: 400, color: '#10B981' },
  { batch: '2022', completed: 350, total: 450, color: '#F59E0B' },
  { batch: '2021', completed: 180, total: 250, color: '#EF4444' },
  { batch: '2020', completed: 90, total: 120, color: '#8B5CF6' }
];

/* ────────────────────────────────────────────────────────────
    1b. IMPORT & AUDIT DATA
    ──────────────────────────────────────────────────────────── */

var importHistory = [
  { file: 'alumni_batch_2023.xlsx', imported: 200, merged: 45, skipped: 3, duplicates: 12, errors: 3, by: 'Admin User', date: '05 Jul 2026', status: 'Completed' },
  { file: 'cse_alumni_2022.xlsx', imported: 150, merged: 30, skipped: 1, duplicates: 5, errors: 1, by: 'Admin User', date: '28 Jun 2026', status: 'Completed' },
  { file: 'ece_alumni_update.csv', imported: 60, merged: 32, skipped: 0, duplicates: 8, errors: 0, by: 'Admin User', date: '15 Jun 2026', status: 'Completed' },
  { file: 'mech_batch_2021.xlsx', imported: 120, merged: 36, skipped: 2, duplicates: 3, errors: 2, by: 'Admin User', date: '01 Jun 2026', status: 'Completed' },
  { file: 'full_alumni_export.csv', imported: 400, merged: 220, skipped: 7, duplicates: 45, errors: 7, by: 'Admin User', date: '20 May 2026', status: 'Completed' },
  { file: 'batch_2020_update.xlsx', imported: 0, merged: 0, skipped: 0, duplicates: 0, errors: 0, by: 'Admin User', date: '10 May 2026', status: 'Failed' }
];

var auditLogs = [];

/* ────────────────────────────────────────────────────────────
   2. STATE
   ──────────────────────────────────────────────────────────── */
const state = {
  currentPage: 1,
  rowsPerPage: 5,
  filteredData: []
};

var auditState = {
  currentPage: 1,
  rowsPerPage: 10,
  filteredData: []
};

var selectedImportFile = null;

/* ────────────────────────────────────────────────────────────
    3. DOM READY – Initialization
    ──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  try {
    setCurrentDate();
    setUserInfo();
    initSessionTimeout();
    setupClickOutside();
    populateTeamLeaderDropdowns();
    initImportHandlers();
    initAuditHandlers();
    fetchAllData();
  } catch (err) {
    console.error('Admin init error:', err);
  }
});

var _apiDataLoaded = false;
var _dashboardData = null;
var _apiUsers = null;
var _apiMembers = null;
var _apiAlumni = null;
var _apiImportHistory = null;
var _apiTeams = null;
var _apiAuditLogs = null;
var _apiAssignHistory = null;

function setUserInfo() {
  var user = API.getUser();
  var sidebarName = document.getElementById('sidebarUserName');
  var navbarName = document.getElementById('navbarProfileName');
  if (sidebarName && user.name) sidebarName.textContent = user.name;
  if (navbarName && user.name) navbarName.textContent = user.name.split(' ')[0];
}

function fetchAllData() {
  Promise.all([
    API.getAdminDashboard().catch(function () { return null; }),
    API.getUsers({ role: 'LEADER', page: 1, limit: 100 }).catch(function () { return null; }),
    API.getUsers({ role: 'MEMBER', page: 1, limit: 100 }).catch(function () { return null; }),
    API.getAlumni({ page: 1, limit: 500 }).catch(function () { return null; }),
    API.getImportHistory().catch(function () { return null; }),
    API.getTeams().catch(function () { return null; }),
    API.getAuditLogs({ page: 1, limit: 1000 }).catch(function () { return null; }),
    API.getAssignmentHistory({ page: 1, limit: 100 }).catch(function () { return null; })
  ]).then(function (results) {
    _dashboardData = results[0] && results[0].success ? results[0].data : null;
    _apiUsers = results[1] && results[1].success ? results[1].data : null;
    _apiMembers = results[2] && results[2].success ? results[2].data : null;
    _apiAlumni = results[3] && results[3].success ? results[3].data : null;
    _apiImportHistory = results[4] && results[4].success ? results[4].data : null;
    _apiTeams = results[5] && results[5].success ? results[5].data : null;
    _apiAuditLogs = results[6] && results[6].success ? results[6].data : null;
    _apiAssignHistory = results[7] && results[7].success ? results[7].data : null;
    _apiDataLoaded = true;
    populateDashboardStats();
    populateActivityFeed();
    populateTable();
    populateTeamLeadersTable();
    populateTeamMembersTable();
    populateAssignHistoryTable();
    populateDeptProgress();
    populateTLRankings();
    populateNotifications();
    populateImportHistory();
    populateAuditLogTable();
    populateTeamLeaderDropdowns();
  }).catch(function () {
    _apiDataLoaded = false;
    populateDashboardStats();
    populateActivityFeed();
    populateTable();
    populateTeamLeadersTable();
    populateTeamMembersTable();
    populateAssignHistoryTable();
    populateDeptProgress();
    populateTLRankings();
    populateNotifications();
    populateImportHistory();
    populateAuditLogTable();
    populateTeamLeaderDropdowns();
  });
}

/* ────────────────────────────────────────────────────────────
   4. DATE HELPER
   ──────────────────────────────────────────────────────────── */
function setCurrentDate() {
  var dateEl = document.getElementById('currentDate');
  var timeEl = document.getElementById('currentTime');
  if (!dateEl && !timeEl) return;
  var now = new Date();
  var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  var timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-IN', dateOptions);
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-IN', timeOptions);
}

/* ────────────────────────────────────────────────────────────
    5. DASHBOARD STATS
    ──────────────────────────────────────────────────────────── */
function populateDashboardStats() {
  var total, pending, completed, tlCount, tmCount, progressPct;
  if (_apiDataLoaded && _dashboardData) {
    var d = _dashboardData;
    total = d.totalAlumni || 0;
    pending = d.pendingRecords || 0;
    completed = d.completedRecords || 0;
    tlCount = d.totalLeaders || 0;
    tmCount = d.totalMembers || 0;
    progressPct = d.completionPercentage || 0;
  } else {
    total = 0;
    pending = 0;
    completed = 0;
    tlCount = dummyTeamLeaders.length;
    tmCount = dummyTeamMembers.length;
    progressPct = 0;
  }

  setText('totalAlumni', total);
  setText('pendingUpdates', pending);
  setText('completedUpdates', completed);
  setText('totalTeamLeaders', tlCount);
  setText('totalTeamMembers', tmCount);
  setText('overallProgress', progressPct + '%');

  var bar = document.getElementById('progressBar');
  if (bar) {
    bar.style.width = progressPct + '%';
    if (progressPct >= 80) bar.classList.add('green');
    else if (progressPct >= 50) { /* keep default blue */ }
    else bar.classList.add('yellow');
  }
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ────────────────────────────────────────────────────────────
    6. ACTIVITY FEED
    ──────────────────────────────────────────────────────────── */
function populateActivityFeed() {
  var feed = document.getElementById('activityFeed');
  if (!feed) return;
  var activities;
  if (_apiDataLoaded && _dashboardData && _dashboardData.recentActivity) {
    activities = _dashboardData.recentActivity.map(function (a) {
      return { user: a.user, action: a.action, time: a.time, avatar: (a.user || '?').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2) };
    });
  } else {
    activities = dummyActivities;
  }
  var html = '';
  var colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];
  activities.forEach(function (act, i) {
    var color = colors[i % colors.length];
    html += '<div style="display:flex;gap:14px;padding:12px 0;border-bottom:1px solid var(--border);" class="activity-item">';
    html += '<div style="width:38px;height:38px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:0.75rem;flex-shrink:0;">' + act.avatar + '</div>';
    html += '<div style="flex:1;min-width:0;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">';
    html += '<div><strong style="font-size:0.85rem;">' + act.user + '</strong>';
    html += '<span style="font-size:0.85rem;color:var(--text-muted);margin-left:4px;">' + act.action + '</span></div>';
    html += '<span style="font-size:0.7rem;color:var(--text-muted);white-space:nowrap;">' + act.time + '</span>';
    html += '</div></div></div>';
  });
  feed.innerHTML = html;
}

/* ────────────────────────────────────────────────────────────
   7. TABLE POPULATION & PAGINATION
   ──────────────────────────────────────────────────────────── */
function populateTable() {
  if (_apiDataLoaded && _apiAlumni && _apiAlumni.records) {
    state.filteredData = _apiAlumni.records.map(function (a) {
      return {
        id: a.alumni_id || a.id,
        name: a.name || a.fullName || 'Unknown',
        dept: a.department || a.dept || '',
        batch: a.batch || '',
        company: a.company || '',
        leader: a.assignedTo || a.leader || '',
        status: a.status || 'Pending',
        progress: (function(rec) {
          if (rec.status === 'Completed') return 100;
          if (rec.status === 'Pending') return 0;
          var fields = ['company', 'designation', 'email', 'phone', 'working_details', 'linkedin_profile'];
          var filled = 0;
          fields.forEach(function(f) { if (rec[f] && String(rec[f]).trim() !== '') filled++; });
          return Math.round((filled / fields.length) * 100);
        })(a)
      };
    });
  } else {
    state.filteredData = [];
  }
  state.currentPage = 1;
  renderTable();
}

function renderTable() {
  var data = state.filteredData;
  var page = state.currentPage;
  var perPage = state.rowsPerPage;
  var start = (page - 1) * perPage;
  var end = Math.min(start + perPage, data.length);
  var pageData = data.slice(start, end);

  var tbody = document.getElementById('tableBody');
  if (!tbody) return;

  if (pageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:8px;opacity:0.4;"></i>No records found</td></tr>';
    renderPagination(data.length);
    return;
  }

  var html = '';
  pageData.forEach(function (item, i) {
    var sno = start + i + 1;
    var statusBadge = getStatusBadge(item.status);
    var progressColor = item.progress >= 80 ? 'green' : (item.progress >= 40 ? '' : 'red');
    html += '<tr>';
    html += '<td>' + sno + '</td>';
    html += '<td><strong>' + item.name + '</strong></td>';
    html += '<td>' + item.dept + '</td>';
    html += '<td>' + item.batch + '</td>';
    html += '<td>' + item.leader + '</td>';
    html += '<td>' + statusBadge + '</td>';
    html += '<td><div class="progress-label" style="margin-bottom:2px;"><span></span><span>' + item.progress + '%</span></div><div class="progress"><div class="progress-bar ' + progressColor + '" style="width:' + item.progress + '%;"></div></div></td>';
    html += '<td><button class="btn btn-sm btn-outline" onclick="viewAlumniDetails(' + item.id + ')"><i class="fas fa-eye"></i></button></td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
  renderPagination(data.length);
}

function getStatusBadge(status) {
  var map = {
    'Completed': '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Completed</span>',
    'In Progress': '<span class="badge badge-warning"><i class="fas fa-spinner"></i> In Progress</span>',
    'Pending': '<span class="badge badge-danger"><i class="fas fa-clock"></i> Pending</span>'
  };
  return map[status] || '<span class="badge badge-light">' + status + '</span>';
}

function renderPagination(total) {
  var perPage = state.rowsPerPage;
  var totalPages = Math.max(1, Math.ceil(total / perPage));
  var page = state.currentPage;

  var info = document.getElementById('paginationInfo');
  if (info) {
    var start = (page - 1) * perPage + 1;
    var end = Math.min(page * perPage, total);
    info.textContent = 'Showing ' + start + '-' + end + ' of ' + total + ' records';
  }

  var container = document.getElementById('pagination');
  if (!container) return;
  var html = '';
  html += '<button class="pagination-item ' + (page <= 1 ? 'disabled' : '') + '" onclick="goToPage(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';

  var rangeStart = Math.max(1, page - 2);
  var rangeEnd = Math.min(totalPages, page + 2);

  if (rangeStart > 1) {
    html += '<button class="pagination-item" onclick="goToPage(1)">1</button>';
    if (rangeStart > 2) html += '<span style="padding:0 4px;color:var(--text-muted);">...</span>';
  }
  for (var i = rangeStart; i <= rangeEnd; i++) {
    html += '<button class="pagination-item ' + (i === page ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
  }
  if (rangeEnd < totalPages) {
    if (rangeEnd < totalPages - 1) html += '<span style="padding:0 4px;color:var(--text-muted);">...</span>';
    html += '<button class="pagination-item" onclick="goToPage(' + totalPages + ')">' + totalPages + '</button>';
  }

  html += '<button class="pagination-item ' + (page >= totalPages ? 'disabled' : '') + '" onclick="goToPage(' + (page + 1) + ')" ' + (page >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
  container.innerHTML = html;
}

function changeRowsPerPage(val) {
  state.rowsPerPage = parseInt(val);
  state.currentPage = 1;
  renderTable();
}

function goToPage(page) {
  var total = state.filteredData.length;
  var totalPages = Math.max(1, Math.ceil(total / state.rowsPerPage));
  if (page < 1 || page > totalPages) return;
  state.currentPage = page;
  renderTable();
}

/* ────────────────────────────────────────────────────────────
   8. TABLE SEARCH & FILTER
   ──────────────────────────────────────────────────────────── */
function filterTable() {
  var q = getVal('tableSearch').toLowerCase();
  var dept = getVal('filterDepartment');
  var status = getVal('filterStatus');
  var batch = getVal('filterBatch');

  var source = (_apiDataLoaded && _apiAlumni && _apiAlumni.records) ? _apiAlumni.records.map(function (a) {
    return {
      id: a.alumni_id || a.id,
      name: a.name || a.fullName || 'Unknown',
      dept: a.department || a.dept || '',
      batch: a.batch || '',
      company: a.company || '',
      leader: a.assignedTo || a.leader || '',
      status: a.status || 'Pending',
      progress: (function(rec) {
        if (rec.status === 'Completed') return 100;
        if (rec.status === 'Pending') return 0;
        var fields = ['company', 'designation', 'email', 'phone', 'working_details', 'linkedin_profile'];
        var filled = 0;
        fields.forEach(function(f) { if (rec[f] && String(rec[f]).trim() !== '') filled++; });
        return Math.round((filled / fields.length) * 100);
      })(a)
    };
  }) : [];

  if (!source || source.length === 0) {
    state.filteredData = [];
    state.currentPage = 1;
    renderTable();
    return;
  }
  state.filteredData = source.filter(function (item) {
    var match = true;
    if (q && item.name.toLowerCase().indexOf(q) === -1) match = false;
    if (dept && item.dept !== dept) match = false;
    if (status && item.status !== status) match = false;
    if (batch && String(item.batch) !== batch) match = false;
    return match;
  });
  state.currentPage = 1;
  renderTable();
}

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : '';
}

/* ────────────────────────────────────────────────────────────
   9. TEAM LEADERS TABLE
   ──────────────────────────────────────────────────────────── */
/* ────────────────────────────────────────────────────────────
    Helper: View Team Leader Details
   ──────────────────────────────────────────────────────────── */
function viewTeamLeaderDetails(name) {
  var data;
  if (_apiDataLoaded && _apiUsers && _apiUsers.records) {
    data = _apiUsers.records;
  } else {
    data = dummyTeamLeaders;
  }
  var tl = null;
  for (var i = 0; i < data.length; i++) {
    var n = data[i].name || (data[i].first_name + ' ' + (data[i].last_name || ''));
    if (n === name) { tl = data[i]; break; }
  }
  if (!tl) { Toast.error('Error', 'Team Leader not found'); return; }
  var tlName = tl.name || n;
  var initials = tlName.split(' ').map(function(w){return w[0]}).join('').toUpperCase().slice(0,2);
  document.getElementById('tlAvatar').textContent = initials;
  document.getElementById('tlDetailName').textContent = tlName;
  document.getElementById('tlDetailDept').textContent = tl.dept || tl.department || '-';
  document.getElementById('tlDetailEmail').textContent = tl.email || '-';
  document.getElementById('tlDetailPhone').textContent = tl.phone || '-';
  document.getElementById('tlDetailMembers').textContent = tl.members || tl.member_count || 0;
  document.getElementById('tlDetailAssigned').textContent = tl.assigned || tl.assigned_count || 0;
  openModal('viewTLModal');
}

/* ────────────────────────────────────────────────────────────
    Helper: View Team Member Details
   ──────────────────────────────────────────────────────────── */
function viewTeamMemberDetails(name) {
  var data;
  if (_apiDataLoaded && _apiMembers && _apiMembers.records) {
    data = _apiMembers.records;
  } else {
    data = dummyTeamMembers;
  }
  var tm = null;
  for (var i = 0; i < data.length; i++) {
    var n = data[i].name || (data[i].first_name + ' ' + (data[i].last_name || ''));
    if (n === name) { tm = data[i]; break; }
  }
  if (!tm) { Toast.error('Error', 'Team Member not found'); return; }
  var tmName = tm.name || n;
  var initials = tmName.split(' ').map(function(w){return w[0]}).join('').toUpperCase().slice(0,2);
  document.getElementById('tmAvatar').textContent = initials;
  document.getElementById('tmDetailName').textContent = tmName;
  document.getElementById('tmDetailDept').textContent = tm.dept || tm.department || '-';
  document.getElementById('tmDetailEmail').textContent = tm.email || '-';
  document.getElementById('tmDetailPhone').textContent = tm.phone || '-';
  document.getElementById('tmDetailLeader').textContent = tm.leader || tm.team_leader_name || '-';
  document.getElementById('tmDetailAssigned').textContent = tm.assigned || tm.assigned_count || 0;
  openModal('viewTMModal');
}

function populateTeamLeadersTable() {
  var tbody = document.getElementById('tlBody');
  if (!tbody) return;
  var data;
  if (_apiDataLoaded && _apiUsers && _apiUsers.records) {
    data = _apiUsers.records.map(function (u) {
      var name = u.name || (u.first_name + ' ' + (u.last_name || ''));
      return { name: name, email: u.email, phone: u.phone || '-', dept: u.department || '-', members: u.member_count || 0, assigned: u.assigned_count || 0 };
    });
  } else {
    data = dummyTeamLeaders;
  }
  var html = '';
  data.forEach(function (tl, i) {
    html += '<tr>';
    html += '<td>' + (i + 1) + '</td>';
    html += '<td><strong>' + tl.name + '</strong></td>';
    html += '<td>' + tl.email + '</td>';
    html += '<td>' + tl.phone + '</td>';
    html += '<td>' + tl.dept + '</td>';
    html += '<td>' + tl.members + '</td>';
    html += '<td>' + tl.assigned + '</td>';
    html += '<td><button class="btn btn-sm btn-outline" onclick="viewTeamLeaderDetails(\'' + tl.name + '\')"><i class="fas fa-eye"></i></button></td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

/* ────────────────────────────────────────────────────────────
   10. TEAM MEMBERS TABLE
   ──────────────────────────────────────────────────────────── */
function populateTeamMembersTable() {
  var tbody = document.getElementById('tmBody');
  if (!tbody) return;
  var data;
  if (_apiDataLoaded && _apiMembers && _apiMembers.records) {
    data = _apiMembers.records.slice(0, 12).map(function (u) {
      var name = u.name || (u.first_name + ' ' + (u.last_name || ''));
      return { name: name, email: u.email, phone: u.phone || '-', dept: u.department || '-', leader: u.team_leader_name || '-', assigned: u.assigned_count || 0 };
    });
  } else {
    data = dummyTeamMembers;
  }
  var html = '';
  data.forEach(function (tm, i) {
    html += '<tr>';
    html += '<td>' + (i + 1) + '</td>';
    html += '<td><strong>' + tm.name + '</strong></td>';
    html += '<td>' + tm.email + '</td>';
    html += '<td>' + tm.phone + '</td>';
    html += '<td>' + tm.dept + '</td>';
    html += '<td>' + tm.leader + '</td>';
    html += '<td>' + tm.assigned + '</td>';
    html += '<td><button class="btn btn-sm btn-outline" onclick="viewTeamMemberDetails(\'' + tm.name + '\')"><i class="fas fa-eye"></i></button></td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

/* ────────────────────────────────────────────────────────────
   11. ASSIGN HISTORY TABLE
   ──────────────────────────────────────────────────────────── */
function populateAssignHistoryTable() {
  var tbody = document.getElementById('assignHistoryBody');
  if (!tbody) return;
  var data = [];
  if (_apiDataLoaded && _apiAssignHistory && _apiAssignHistory.records) {
    data = _apiAssignHistory.records.map(function (a) {
      var dateStr = '';
      if (a.last_assigned) {
        var d = new Date(a.last_assigned);
        dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      var totalAssigned = a.total_assigned || 0;
      var completedCount = a.completed || 0;
      return {
        leader: a.leader_name || '-',
        dept: a.department || '-',
        count: totalAssigned,
        date: dateStr || '-',
        status: completedCount === totalAssigned && totalAssigned > 0 ? 'Completed' : totalAssigned > 0 ? 'In Progress' : 'Pending',
        completed: completedCount
      };
    });
  }
  var html = '';
  data.forEach(function (item, i) {
    var statusBadge = getStatusBadge(item.status);
    html += '<tr>';
    html += '<td>' + (i + 1) + '</td>';
    html += '<td>' + item.leader + '</td>';
    html += '<td>' + item.dept + '</td>';
    html += '<td>' + item.count + '</td>';
    html += '<td>' + item.date + '</td>';
    html += '<td>' + statusBadge + '</td>';
    html += '<td>' + item.completed + '/' + item.count + '</td>';
    html += '</tr>';
  });
  if (data.length === 0) {
    html = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:8px;opacity:0.4;"></i>No assignment history found</td></tr>';
  }
  tbody.innerHTML = html;
}

/* ────────────────────────────────────────────────────────────
   12. DEPARTMENT PROGRESS
   ──────────────────────────────────────────────────────────── */
function populateDeptProgress() {
  var container = document.getElementById('deptProgressList');
  if (!container) return;
  var data;
  var colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  if (_apiDataLoaded && _dashboardData && _dashboardData.batchWiseProgress) {
    data = _dashboardData.batchWiseProgress.map(function (d, i) {
      return { dept: 'Batch ' + (d.batch || '-'), completed: d.completed || 0, total: d.total || 1, color: d.color || colors[i % colors.length] };
    });
  } else {
    data = dummyBatchProgress.map(function (d) {
      return { dept: 'Batch ' + d.batch, completed: d.completed, total: d.total, color: d.color };
    });
  }
  var html = '';
  data.forEach(function (d) {
    var pct = Math.round((d.completed / d.total) * 100);
    html += '<div style="margin-bottom:16px;">';
    html += '<div class="progress-label"><span>' + d.dept + '</span><span>' + d.completed + '/' + d.total + ' (' + pct + '%)</span></div>';
    html += '<div class="progress"><div class="progress-bar" style="width:' + pct + '%;background:' + d.color + ';"></div></div>';
    html += '</div>';
  });
  container.innerHTML = html;
}

/* ────────────────────────────────────────────────────────────
   13. TEAM LEADER RANKINGS
   ──────────────────────────────────────────────────────────── */
function populateTLRankings() {
  var container = document.getElementById('tlRankingList');
  if (!container) return;
  var rankedData;
  if (_apiDataLoaded && _dashboardData && _dashboardData.leaderRankings) {
    rankedData = _dashboardData.leaderRankings.map(function (l) {
      return { name: l.name || l.leader, dept: l.department || l.dept || '', assigned: l.assigned || 0, completed: l.completed || 0 };
    });
    rankedData.sort(function (a, b) { return b.completed - a.completed; });
  } else {
    rankedData = dummyTeamLeaders.slice().sort(function (a, b) { return b.assigned - a.assigned; });
  }
  var html = '';
  var medals = ['#FFD700', '#C0C0C0', '#CD7F32'];
  rankedData.forEach(function (tl, i) {
    var medal = i < 3 ? '<span style="margin-right:8px;font-size:1.1rem;">' + (i === 0 ? '<i class="fas fa-trophy" style="color:#FFD700;"></i>' : i === 1 ? '<i class="fas fa-trophy" style="color:#C0C0C0;"></i>' : '<i class="fas fa-trophy" style="color:#CD7F32;"></i>') + '</span>' : '<span style="margin-right:8px;font-weight:600;color:var(--text-muted);width:20px;display:inline-block;">' + (i + 1) + '.</span>';
    var completed = i < rankedData.length ? rankedData[i].completed : 0;
    html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">';
    html += medal;
    html += '<div style="flex:1;"><strong style="font-size:0.85rem;">' + tl.name + '</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">' + tl.dept + ' Dept</span></div>';
    html += '<div style="text-align:right;"><span style="font-weight:700;font-size:0.95rem;">' + completed + '</span><br><span style="font-size:0.7rem;color:var(--text-muted);">Completed</span></div>';
    html += '</div>';
  });
  container.innerHTML = html;
}

/* ────────────────────────────────────────────────────────────
   14. NOTIFICATIONS
   ──────────────────────────────────────────────────────────── */
function populateNotifications() {
  var list = document.getElementById('notifList');
  if (!list) return;

  var cleared = JSON.parse(localStorage.getItem('cleared_notifications_admin') || '[]');

  // Use real audit log data when available
  var rawNotifs = [];
  if (_apiAuditLogs && _apiAuditLogs.records && _apiAuditLogs.records.length > 0) {
    rawNotifs = _apiAuditLogs.records.slice(0, 10).map(function(r) {
      var nid = 'al_' + (r.audit_id || r.created_at + '_' + r.action);
      return {
        id: nid,
        text: (r.username || 'System') + ' — ' + (r.action || '').replace(/_/g, ' ').toLowerCase(),
        time: r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '',
        unread: true
      };
    });
  }

  var notifs = rawNotifs.filter(function(n) { return cleared.indexOf(n.id) === -1; });

  if (notifs.length === 0) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;">No notifications</div>';
    var count = document.querySelector('.notification-count');
    if (count) { count.textContent = '0'; count.style.display = 'none'; }
    return;
  }

  var html = '';
  notifs.forEach(function (n) {
    html += '<button class="dropdown-item" data-nid="' + n.id + '" style="flex-wrap:wrap;gap:4px;' + (n.unread ? 'background:rgba(99,102,241,0.06);' : '') + '" onclick="markNotifRead(this)">';
    html += '<div style="display:flex;gap:10px;width:100%;align-items:flex-start;">';
    if (n.unread) html += '<span style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0;margin-top:6px;"></span>';
    else html += '<span style="width:8px;height:8px;flex-shrink:0;"></span>';
    html += '<div style="flex:1;"><div style="font-size:0.8rem;color:var(--text-dark);">' + n.text + '</div><div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">' + n.time + '</div></div>';
    html += '</div></button>';
  });
  list.innerHTML = html;

  var count = document.querySelector('.notification-count');
  var unreadCount = notifs.filter(function(n) { return n.unread; }).length;
  if (count) {
    if (unreadCount > 0) { count.textContent = unreadCount; count.style.display = 'inline-flex'; }
    else { count.textContent = '0'; count.style.display = 'none'; }
  }
}

function markNotifRead(btn) {
  var nid = btn.getAttribute('data-nid');
  if (nid) {
    var cleared = JSON.parse(localStorage.getItem('cleared_notifications_admin') || '[]');
    if (cleared.indexOf(nid) === -1) {
      cleared.push(nid);
      localStorage.setItem('cleared_notifications_admin', JSON.stringify(cleared));
    }
  }
  btn.style.background = 'transparent';
  var dot = btn.querySelector('span:first-child');
  if (dot) dot.style.background = 'transparent';
  btn.querySelector('[data-nid]');
  var count = document.querySelector('.notification-count');
  if (count) {
    var c = parseInt(count.textContent);
    if (c > 0) count.textContent = c - 1;
    if (c - 1 <= 0) count.style.display = 'none';
  }
}

window.clearAllNotifications = function() {
  // Clear all non-dismissed notification IDs (save all current IDs as dismissed)
  var notifButtons = document.querySelectorAll('#notifList .dropdown-item[data-nid]');
  var cleared = JSON.parse(localStorage.getItem('cleared_notifications_admin') || '[]');
  notifButtons.forEach(function(btn) {
    var nid = btn.getAttribute('data-nid');
    if (nid && cleared.indexOf(nid) === -1) {
      cleared.push(nid);
    }
  });
  localStorage.setItem('cleared_notifications_admin', JSON.stringify(cleared));

  var list = document.getElementById('notifList');
  if (list) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;">No new notifications</div>';
  }
  var count = document.querySelector('.notification-count');
  if (count) {
    count.textContent = '0';
    count.style.display = 'none';
  }
  Toast.success('Notifications', 'All notifications cleared');
};

function showAllNotifications() {
  closeDropdown('notifMenu');
  Toast.info('Notifications', 'Showing all notifications');
}

/* ────────────────────────────────────────────────────────────
   15. TEAM LEADER DROPDOWNS (for modals)
   ──────────────────────────────────────────────────────────── */
function populateTeamLeaderDropdowns() {
  var selects = ['tmTeamLeader', 'assignTeamLeader'];
  var leaders;
  if (_apiDataLoaded && _apiUsers && _apiUsers.records) {
    leaders = _apiUsers.records.map(function (u) {
      var name = u.name || (u.first_name + ' ' + (u.last_name || ''));
      return { id: u.user_id, name: name.trim(), dept: u.department || '' };
    });
  } else {
    leaders = dummyTeamLeaders;
  }
  selects.forEach(function (id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">Select Team Leader</option>';
    leaders.forEach(function (tl) {
      var opt = document.createElement('option');
      opt.value = tl.id || tl.name;
      opt.setAttribute('data-name', tl.name);
      opt.textContent = tl.name + (tl.dept ? ' (' + tl.dept + ')' : '');
      sel.appendChild(opt);
    });
  });

  var batchSel = document.getElementById('assignBatch');
  if (batchSel) {
    batchSel.innerHTML = '<option value="">All Batches</option>';
    var seen = {};
    if (_apiDataLoaded && _apiAlumni && _apiAlumni.records) {
      _apiAlumni.records.forEach(function (a) {
        if (a.batch && !seen[a.batch]) {
          seen[a.batch] = true;
          var opt = document.createElement('option');
          opt.value = a.batch;
          opt.textContent = a.batch;
          batchSel.appendChild(opt);
        }
      });
    }
  }
}

/* ────────────────────────────────────────────────────────────
   16. CHARTS INITIALIZATION
   ──────────────────────────────────────────────────────────── */
function initCharts() {
  try {
    updateChartsWithData(_dashboardData);
  } catch (e) {
    console.warn('Chart init error:', e);
  }
}

function updateChartsWithData(dashData) {
  try {
    if (typeof AlumniCharts === 'undefined') return;
    var completed = dashData ? dashData.completedRecords : 65;
    var pending = dashData ? dashData.pendingRecords : 20;
    var inProgress = 0;
    AlumniCharts.createDoughnutChart('completionChart', {
      labels: ['Completed', 'Pending', 'In Progress'],
      values: [completed, pending, inProgress],
      colors: ['#10B981', '#F59E0B', '#3B82F6']
    });

    if (dashData && dashData.batchWiseProgress) {
      var deptLabels = dashData.batchWiseProgress.map(function (d) { return 'Batch ' + (d.batch || ''); });
      var deptValues = dashData.batchWiseProgress.map(function (d) { return Math.round((d.completed / d.total) * 100) || 0; });
      AlumniCharts.createBarChart('departmentChart', { labels: deptLabels, values: deptValues, label: 'Completion Rate (%)' });
    } else {
      AlumniCharts.createBarChart('departmentChart');
    }

    if (dashData && dashData.weeklyProgress) {
      var wkLabels = dashData.weeklyProgress.map(function (w) { return w.label || w.week; });
      var wkValues = dashData.weeklyProgress.map(function (w) { return w.completed || w.value || 0; });
      var wkTargets = dashData.weeklyProgress.map(function (w) { return w.target || 0; });
      if (wkTargets.some(function (t) { return t > 0; })) {
        AlumniCharts.createLineChart('weeklyChart', {
          labels: wkLabels,
          datasets: [
            { label: 'Profiles Completed', values: wkValues, color: '#2563EB' },
            { label: 'Target', values: wkTargets, color: '#F59E0B' }
          ]
        });
      } else {
        AlumniCharts.createLineChart('weeklyChart', { labels: wkLabels, datasets: [{ label: 'Profiles Completed', values: wkValues, color: '#2563EB' }] });
      }
    } else {
      AlumniCharts.createLineChart('weeklyChart');
    }
  } catch (e) {
    console.warn('Chart update error:', e);
  }
}

/* ────────────────────────────────────────────────────────────
   17. SIDEBAR NAVIGATION
   ──────────────────────────────────────────────────────────── */
function navigateTo(section, el) {
  /* Update sidebar active state */
  var items = document.querySelectorAll('.sidebar-item');
  items.forEach(function (item) { item.classList.remove('active'); });
  if (el) el.classList.add('active');

  /* Also check parent if sub-item */
  var subItem = el && el.classList.contains('sub-item');
  if (subItem) {
    var parentItem = el.closest('.has-sub');
    if (parentItem) parentItem.classList.add('active');
  }

  /* Show/hide sections */
  var sections = document.querySelectorAll('.content-section, .dashboard-section');
  sections.forEach(function (s) { s.classList.remove('active'); s.style.display = 'none'; });
  var target = document.getElementById('section-' + section);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
  }

  if (section === 'audit') {
    fetchLatestAuditLogs(populateAuditLogTable);
  }

  /* Update breadcrumb */
  var bc = document.getElementById('breadcrumb');
  if (bc) {
    var names = {
      'dashboard': 'Dashboard',
      'teamLeaders': 'Team Leaders',
      'teamMembers': 'Team Members',
      'assignAlumni': 'Assign Alumni',
      'progress': 'Progress',
      'settings': 'Settings',
      'import': 'Import Alumni',
      'audit': 'Audit Logs'
    };
    var name = names[section] || 'Dashboard';
    bc.innerHTML = '<a href="#" onclick="event.preventDefault();navigateTo(\'dashboard\',document.querySelector(\'[data-section=dashboard]\'))">Home</a><span class="separator"><i class="fas fa-chevron-right"></i></span><span class="current">' + name + '</span>';
  }

  /* Close mobile sidebar */
  if (window.innerWidth < 1024) {
    closeMobileSidebar();
  }

  /* Close all dropdowns */
  closeDropdown('profileMenu');
  closeDropdown('notifMenu');
}

/* ────────────────────────────────────────────────────────────
   18. SIDEBAR COLLAPSE
   ──────────────────────────────────────────────────────────── */
function toggleSidebar() {
  var wrapper = document.body;
  wrapper.classList.toggle('sidebar-collapsed');
  var isCollapsed = wrapper.classList.contains('sidebar-collapsed');
  if (isCollapsed) {
    document.querySelectorAll('.submenu').forEach(function (s) { s.style.display = 'none'; });
  }
}

/* ────────────────────────────────────────────────────────────
   19. MOBILE SIDEBAR
   ──────────────────────────────────────────────────────────── */
function toggleMobileSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('show');
  document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
}

function closeMobileSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

/* ────────────────────────────────────────────────────────────
   20. SUBMENU TOGGLE
   ──────────────────────────────────────────────────────────── */
function toggleSubmenu(el) {
  var isCollapsed = document.body.classList.contains('sidebar-collapsed');
  if (isCollapsed) return;
  var submenu = el.nextElementSibling;
  if (submenu && submenu.classList.contains('submenu')) {
    var isOpen = submenu.style.display === 'block';
    submenu.style.display = isOpen ? 'none' : 'block';
    var chevron = el.querySelector('.fa-chevron-down');
    if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  }
}

/* ────────────────────────────────────────────────────────────
   21. PROFILE DROPDOWN
   ──────────────────────────────────────────────────────────── */
function toggleProfileDropdown(event) {
  event.stopPropagation();
  closeDropdown('notifMenu');
  var menu = document.getElementById('profileMenu');
  menu.classList.toggle('show');
}

/* ────────────────────────────────────────────────────────────
   22. NOTIFICATIONS DROPDOWN
   ──────────────────────────────────────────────────────────── */
function toggleNotifications(event) {
  event.stopPropagation();
  closeDropdown('profileMenu');
  var menu = document.getElementById('notifMenu');
  menu.classList.toggle('show');
}

/* ────────────────────────────────────────────────────────────
   23. DROPDOWN HELPERS
   ──────────────────────────────────────────────────────────── */
function closeDropdown(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function setupClickOutside() {
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) {
      closeDropdown('profileMenu');
      closeDropdown('notifMenu');
    }
  });
}

/* ────────────────────────────────────────────────────────────
   24. MODAL CONTROLS
   ──────────────────────────────────────────────────────────── */
function openModal(id) {
  var modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  /* Clear previous errors */
  clearAllErrors(modal);
}

function closeModal(id) {
  var modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('show');
  document.body.style.overflow = '';
  /* Reset form */
  var inputs = modal.querySelectorAll('.form-control');
  inputs.forEach(function (inp) { inp.value = ''; });
  clearAllErrors(modal);
}

/* Close modal on overlay click */
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('show')) {
    closeModal(e.target.id);
  }
});

/* Close modal on Escape key */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    var openModal = document.querySelector('.modal-overlay.show');
    if (openModal) closeModal(openModal.id);
  }
});

/* ────────────────────────────────────────────────────────────
   25. FORM VALIDATION & SUBMISSION
   ──────────────────────────────────────────────────────────── */
function submitAddTeamLeader() {
  var btn = document.getElementById('tlSubmitBtn');
  if (!validateTLForm()) return;
  showLoading(btn);
  var name = document.getElementById('tlName').value.trim().split(' ');
  var firstName = name[0] || '';
  var lastName = name.slice(1).join(' ') || '';
  var email = document.getElementById('tlEmail').value.trim();
  var phone = document.getElementById('tlPhone').value.trim();
  var dept = document.getElementById('tlDept').value;
  var pass = document.getElementById('tlPassword').value;
  API.createUser({ firstName: firstName, lastName: lastName, email: email, phone: phone, password: pass, roleId: 2, department: dept }).then(function (res) {
    hideLoading(btn);
    if (res.success) {
      var tmpPwd = res.data && res.data.temporaryPassword;
      Toast.success('Success', 'Team Leader added successfully!' + (tmpPwd ? ' Password: ' + tmpPwd : ''));
      closeModal('addTeamLeaderModal');
      fetchAllData();
    } else {
      Toast.danger('Error', res.message || 'Failed to add team leader');
    }
  }).catch(function (err) {
    hideLoading(btn);
    Toast.danger('Error', err.message || 'Failed to add team leader');
  });
}

function submitAddTeamMember() {
  var btn = document.getElementById('tmSubmitBtn');
  if (!validateTMForm()) return;
  showLoading(btn);
  var name = document.getElementById('tmName').value.trim().split(' ');
  var firstName = name[0] || '';
  var lastName = name.slice(1).join(' ') || '';
  var email = document.getElementById('tmEmail').value.trim();
  var phone = document.getElementById('tmPhone').value.trim();
  var leaderSelect = document.getElementById('tmTeamLeader');
  var leaderId = parseInt(leaderSelect.value, 10);
  var leaderName = leaderSelect.options[leaderSelect.selectedIndex].getAttribute('data-name') || leaderSelect.options[leaderSelect.selectedIndex].text;
  if (!leaderId || isNaN(leaderId)) {
    leaderId = null;
  }
  var dept = document.getElementById('tmDept').value;
  var pass = document.getElementById('tmPassword').value;
  API.createUser({ firstName: firstName, lastName: lastName, email: email, phone: phone, password: pass, roleId: 3, leaderId: leaderId, department: dept }).then(function (res) {
    if (res.success) {
      var createdUserId = res.data.user_id;
      var tmpPwd = res.data && res.data.temporaryPassword;

      function resolveLeaderId() {
        if (leaderId) return Promise.resolve(leaderId);
        return API.getUsers({ role: 'LEADER', search: leaderName, limit: 1 }).then(function (res) {
          if (res && res.success && res.data && res.data.records && res.data.records.length > 0) {
            leaderId = res.data.records[0].user_id;
            return leaderId;
          }
          return API.getUsers({ role: 'LEADER', limit: 100 }).then(function (res2) {
            if (res2 && res2.success && res2.data && res2.data.records) {
              var found = res2.data.records.find(function (u) { return (u.first_name + ' ' + (u.last_name || '')).trim() === leaderName; });
              if (found) { leaderId = found.user_id; return leaderId; }
            }
            throw new Error('Leader "' + leaderName + '" not found. Add the team leader first and ensure the page is refreshed.');
          });
        });
      }

    function findOrCreateTeam() {
        // Look up existing team by this specific leaderId (not name)
        if (_apiTeams && _apiTeams.records) {
          var t = _apiTeams.records.find(function (x) { return x.leader_id === leaderId; });
          if (t) return Promise.resolve(t.team_id);
        }
        // Only create if no existing team found for this leader
        return API.createTeam({ teamName: leaderName + "'s Team", leaderId: leaderId }).then(function (tr) {
          if (tr && tr.success) return tr.data.team_id;
          throw new Error('Team creation failed');
        });
      }

      findOrCreateTeam().then(function (teamId) {
        return API.addTeamMember(teamId, { userId: createdUserId });
      }).then(function () {
        Toast.success('Success', 'Team Member added successfully!' + (tmpPwd ? ' Password: ' + tmpPwd : ''));
        closeModal('addTeamMemberModal');
        fetchAllData();
      }).catch(function (err) {
        hideLoading(btn);
        Toast.danger('Error', err.message || 'Failed to add member to team');
        fetchAllData();
      });
    } else {
      hideLoading(btn);
      Toast.danger('Error', res.message || 'Failed to create user');
    }
  }).catch(function (err) {
    hideLoading(btn);
    Toast.danger('Error', err.message || 'Failed to add team member');
  });
}

function submitAssignAlumni() {
  var btn = document.getElementById('assignSubmitBtn');
  if (!validateAssignForm()) return;
  showLoading(btn);
  var leaderSelect = document.getElementById('assignTeamLeader');
  var leaderId = parseInt(leaderSelect.value, 10);
  var leaderName = leaderSelect.options[leaderSelect.selectedIndex].getAttribute('data-name') || leaderSelect.options[leaderSelect.selectedIndex].text;
  if (!leaderId || isNaN(leaderId)) {
    hideLoading(btn);
    Toast.danger('Error', 'Please select a valid team leader.');
    return;
  }

  function doAssign(teamId) {
    var batch = document.getElementById('assignBatch').value;
    var count = parseInt(document.getElementById('assignCount').value, 10) || 0;
    var params = {};
    if (batch) params.batch = batch;
    if (count > 0) params.count = count;
    API.assignAlumni(teamId, params).then(function (res) {
      hideLoading(btn);
      if (res.success) {
        Toast.success('Success', res.data.assigned + ' alumni assigned successfully!');
        closeModal('assignAlumniModal');
        fetchAllData();
      } else {
        Toast.danger('Error', res.message || 'Failed to assign alumni');
      }
    }).catch(function (err) {
      hideLoading(btn);
      Toast.danger('Error', err.message || 'Failed to assign alumni');
    });
  }

  if (_apiTeams && _apiTeams.records) {
    var found = _apiTeams.records.find(function (t) { return t.leader_id === leaderId; });
    if (found) {
      doAssign(found.team_id);
      return;
    }
  }

  API.createTeam({ teamName: leaderName + "'s Team", leaderId: leaderId }).then(function (teamRes) {
    if (teamRes && teamRes.success) {
      doAssign(teamRes.data.team_id);
    } else {
      hideLoading(btn);
      Toast.danger('Error', 'Could not create team: ' + (teamRes && teamRes.message || 'Unknown error'));
    }
  }).catch(function (err) {
    hideLoading(btn);
    Toast.danger('Error', err.message || 'Failed to create team');
  });
}

/* ─── VALIDATORS ─── */
function validateTLForm() {
  var modal = document.getElementById('addTeamLeaderModal');
  clearAllErrors(modal);
  var valid = true;

  var name = document.getElementById('tlName');
  if (!validateRequired(name.value)) { showFieldError(name, 'Name is required'); valid = false; }

  var email = document.getElementById('tlEmail');
  if (!validateRequired(email.value)) { showFieldError(email, 'Email is required'); valid = false; }
  else if (!validateEmail(email.value)) { showFieldError(email, 'Invalid email format'); valid = false; }

  var phone = document.getElementById('tlPhone');
  if (!validateRequired(phone.value)) { showFieldError(phone, 'Phone is required'); valid = false; }
  else if (!validatePhone(phone.value)) { showFieldError(phone, 'Invalid phone number'); valid = false; }

  var dept = document.getElementById('tlDept');
  if (!dept.value) { showFieldError(dept, 'Please select a department'); valid = false; }

  var pass = document.getElementById('tlPassword');
  if (!validateRequired(pass.value)) { showFieldError(pass, 'Password is required'); valid = false; }
  else if (pass.value.length < 6) { showFieldError(pass, 'Password must be at least 6 characters'); valid = false; }

  return valid;
}

function validateTMForm() {
  var modal = document.getElementById('addTeamMemberModal');
  clearAllErrors(modal);
  var valid = true;

  var name = document.getElementById('tmName');
  if (!validateRequired(name.value)) { showFieldError(name, 'Name is required'); valid = false; }

  var email = document.getElementById('tmEmail');
  if (!validateRequired(email.value)) { showFieldError(email, 'Email is required'); valid = false; }
  else if (!validateEmail(email.value)) { showFieldError(email, 'Invalid email format'); valid = false; }

  var phone = document.getElementById('tmPhone');
  if (!validateRequired(phone.value)) { showFieldError(phone, 'Phone is required'); valid = false; }
  else if (!validatePhone(phone.value)) { showFieldError(phone, 'Invalid phone number'); valid = false; }

  var dept = document.getElementById('tmDept');
  if (!dept.value) { showFieldError(dept, 'Please select a department'); valid = false; }

  var leader = document.getElementById('tmTeamLeader');
  if (!leader.value) { showFieldError(leader, 'Please select a team leader'); valid = false; }

  var pass = document.getElementById('tmPassword');
  if (!validateRequired(pass.value)) { showFieldError(pass, 'Password is required'); valid = false; }
  else if (pass.value.length < 6) { showFieldError(pass, 'Password must be at least 6 characters'); valid = false; }

  return valid;
}

function validateAssignForm() {
  var modal = document.getElementById('assignAlumniModal');
  clearAllErrors(modal);
  var valid = true;

  var leader = document.getElementById('assignTeamLeader');
  if (!leader.value) { showFieldError(leader, 'Please select a team leader'); valid = false; }

  var count = document.getElementById('assignCount');
  if (!validateRequired(count.value)) { showFieldError(count, 'Number of alumni is required'); valid = false; }
  else if (parseInt(count.value) < 1) { showFieldError(count, 'Minimum 1 alumni required'); valid = false; }

  return valid;
}

/* ─── BUTTON LOADING STATE ─── */
function showLoading(btn) {
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span> Saving...';
}

function hideLoading(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-save"></i> Save';
}

/* ────────────────────────────────────────────────────────────
   26. PASSWORD TOGGLE
   ──────────────────────────────────────────────────────────── */
function togglePassword(inputId, btn) {
  var input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="far fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="far fa-eye"></i>';
  }
}

/* ────────────────────────────────────────────────────────────
   27. TEAM SEARCH / FILTER
   ──────────────────────────────────────────────────────────── */
function filterTeamLeaders() {
  var q = getVal('tlSearch').toLowerCase();
  var rows = document.querySelectorAll('#tlBody tr');
  rows.forEach(function (row) {
    var text = row.textContent.toLowerCase();
    row.style.display = text.indexOf(q) === -1 ? 'none' : '';
  });
}

function filterTeamMembers() {
  var q = getVal('tmSearch').toLowerCase();
  var rows = document.querySelectorAll('#tmBody tr');
  rows.forEach(function (row) {
    var text = row.textContent.toLowerCase();
    row.style.display = text.indexOf(q) === -1 ? 'none' : '';
  });
}

/* ────────────────────────────────────────────────────────────
   28. GLOBAL SEARCH
   ──────────────────────────────────────────────────────────── */
function handleGlobalSearch(val) {
  if (val && val.length > 2) {
    Toast.info('Search', 'Searching for "' + val + '"...');
  }
}

/* ────────────────────────────────────────────────────────────
   29. SETTINGS TABS
   ──────────────────────────────────────────────────────────── */
function switchSettingsTab(tab, btn) {
  var tabs = document.querySelectorAll('#settingsTabs .tab-item');
  tabs.forEach(function (t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');

  var contents = document.querySelectorAll('#section-settings .tab-content');
  contents.forEach(function (c) { c.classList.remove('active'); });
  var target = document.getElementById('tab-' + tab);
  if (target) target.classList.add('active');
}

/* ────────────────────────────────────────────────────────────
   30. EXPORT BUTTON
   ──────────────────────────────────────────────────────────── */
function handleExport() {
  var data = state.filteredData;
  if (!data || data.length === 0) {
    Toast.warning('Export', 'No data to export');
    return;
  }
  var csv = '\uFEFF';
  csv += 'S.No,Name,Department,Batch,Team Leader,Status,Progress(%)\r\n';
  data.forEach(function (item, i) {
    var name = '"' + (item.name || '').replace(/"/g, '""') + '"';
    var dept = '"' + (item.dept || '').replace(/"/g, '""') + '"';
    var batch = '"' + (item.batch || '').replace(/"/g, '""') + '"';
    var leader = '"' + (item.leader || '').replace(/"/g, '""') + '"';
    csv += (i + 1) + ',' + name + ',' + dept + ',' + batch + ',' + leader + ',' + (item.status || '') + ',' + (item.progress || 0) + '\r\n';
  });
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'alumni_export_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  Toast.success('Export', 'Exported ' + data.length + ' records');
}

/* ────────────────────────────────────────────────────────────
   31. QUICK ACTION FAB
   ──────────────────────────────────────────────────────────── */
var fabOpen = false;
function toggleQuickActions() {
  fabOpen = !fabOpen;
  var menu = document.getElementById('quickActionMenu');
  var icon = document.getElementById('fabIcon');
  if (fabOpen) {
    menu.style.display = 'flex';
    icon.className = 'fas fa-times';
  } else {
    menu.style.display = 'none';
    icon.className = 'fas fa-plus';
  }
}

/* ────────────────────────────────────────────────────────────
   32. SESSION TIMEOUT SIMULATION
   ──────────────────────────────────────────────────────────── */
var sessionTimer = null;
var sessionCountdown = 60;
var sessionOverlay = null;

function initSessionTimeout() {
  sessionOverlay = document.getElementById('sessionTimeout');
  /* Simulate session timeout after 5 minutes of inactivity */
  var idleTime = 0;
  var resetIdle = function () { idleTime = 0; if (sessionOverlay && sessionOverlay.classList.contains('show')) { extendSession(); } };
  document.addEventListener('mousemove', resetIdle);
  document.addEventListener('keydown', resetIdle);
  document.addEventListener('click', resetIdle);
  document.addEventListener('scroll', resetIdle);

  setInterval(function () {
    idleTime++;
    if (idleTime >= 5) { /* 5 minutes = 300 seconds, using 5 for demo */
      showSessionTimeout();
    }
  }, 60000); /* Check every minute, but for demo purposes we make it faster */
}

function showSessionTimeout() {
  if (!sessionOverlay) return;
  sessionCountdown = 60;
  updateSessionTimer();
  sessionOverlay.classList.add('show');
  if (sessionTimer) clearInterval(sessionTimer);
  sessionTimer = setInterval(function () {
    sessionCountdown--;
    updateSessionTimer();
    if (sessionCountdown <= 0) {
      clearInterval(sessionTimer);
      handleLogout();
    }
  }, 1000);
}

function updateSessionTimer() {
  var el = document.getElementById('sessionTimer');
  if (el) el.textContent = sessionCountdown;
}

function extendSession() {
  if (sessionTimer) clearInterval(sessionTimer);
  if (sessionOverlay) sessionOverlay.classList.remove('show');
  /* Reset idle timer */
}

/* ────────────────────────────────────────────────────────────
   33. LOGOUT HANDLER
   ──────────────────────────────────────────────────────────── */
function handleLogout() {
  if (sessionTimer) clearInterval(sessionTimer);
  API.clearToken();
  Toast.warning('Logout', 'You have been logged out successfully.');
  setTimeout(function () {
    window.location.href = 'index.html';
  }, 1500);
}

/* ────────────────────────────────────────────────────────────
   34. RESPONSIVE SIDEBAR CLOSE ON RESIZE
   ──────────────────────────────────────────────────────────── */
window.addEventListener('resize', function () {
  if (window.innerWidth >= 1024) {
    closeMobileSidebar();
  }
});

/* ────────────────────────────────────────────────────────────
   35. COLLAPSIBLE SUBMENU ON PAGE LOAD
       (show Dashboard by default)
   ──────────────────────────────────────────────────────────── */
(function () {
  var sections = document.querySelectorAll('.content-section, .dashboard-section');
  sections.forEach(function (s) {
    if (!s.classList.contains('active')) s.style.display = 'none';
  });
  var dash = document.getElementById('section-dashboard');
  if (dash) { dash.style.display = 'block'; dash.classList.add('active'); }
})();

/* ────────────────────────────────────────────────────────────
   36. IMPORT ALUMNI – File Handling
   ──────────────────────────────────────────────────────────── */
function initImportHandlers() {
  var uploadZone = document.getElementById('uploadZone');
  var fileInput = document.getElementById('fileInput');
  var browseBtn = document.getElementById('browseBtn');
  var importBtn = document.getElementById('importBtn');
  var downloadBtn = document.getElementById('downloadTemplateBtn');
  var fileNameEl = document.getElementById('fileName');

  if (!fileInput || !importBtn) return;

  /* Click upload zone or browse button triggers file input */
  if (uploadZone) {
    uploadZone.addEventListener('click', function () { fileInput.click(); });
  }
  if (browseBtn) {
    browseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.click();
    });
  }

  /* File selection handler */
  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files.length > 0) {
      selectedImportFile = fileInput.files[0];
      if (fileNameEl) {
        fileNameEl.style.display = 'block';
        fileNameEl.innerHTML = '<i class="fas fa-check-circle"></i> ' + selectedImportFile.name + ' (' + (selectedImportFile.size / 1024 / 1024).toFixed(2) + ' MB)';
      }
      
      // Generate Preview
      var formData = new FormData();
      formData.append('file', selectedImportFile);
      var previewBody = document.getElementById('importPreviewBody');
      var previewContainer = document.getElementById('importPreviewContainer');
      if (previewBody) previewBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;"><span class="spinner spinner-sm"></span> Loading Preview...</td></tr>';
      if (previewContainer) previewContainer.style.display = 'block';
      
      API.uploadPreview(formData).then(function (res) {
        if (res.success && res.data && res.data.length > 0) {
          var html = '';
          res.data.forEach(function (row, idx) {
            var badgeClass = row.action === 'Insert' ? 'badge-success' : row.action === 'Update' ? 'badge-primary' : 'badge-danger';
            html += '<tr>' +
              '<td style="padding:10px 12px;font-weight:600;color:#64748B;">' + (idx + 1) + '</td>' +
              '<td style="padding:10px 12px;">' + row.registerNo + '</td>' +
              '<td style="padding:10px 12px;"><strong>' + row.name + '</strong></td>' +
              '<td style="padding:10px 12px;">' + row.department + '</td>' +
              '<td style="padding:10px 12px;">' + row.batch + '</td>' +
              '<td style="padding:10px 12px;"><span class="badge ' + badgeClass + '">' + row.action + '</span></td>' +
              '<td style="padding:10px 12px;color:#64748B;">' + row.reason + '</td>' +
              '</tr>';
          });
          if (previewBody) previewBody.innerHTML = html;
          importBtn.disabled = false;
        } else {
          if (previewBody) previewBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#EF4444;padding:20px;">No valid rows to preview.</td></tr>';
          importBtn.disabled = true;
        }
      }).catch(function (err) {
        if (previewBody) previewBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#EF4444;padding:20px;">Failed to generate preview: ' + err.message + '</td></tr>';
        importBtn.disabled = true;
      });

    } else {
      selectedImportFile = null;
      if (fileNameEl) { fileNameEl.style.display = 'none'; }
      var pc = document.getElementById('importPreviewContainer');
      if (pc) pc.style.display = 'none';
      importBtn.disabled = true;
    }
  });

  /* Import button click */
  importBtn.addEventListener('click', function () {
    if (!selectedImportFile) return;
    importBtn.disabled = true;
    importBtn.innerHTML = '<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span> Importing...';
    var formData = new FormData();
    formData.append('file', selectedImportFile);
    API.uploadImport(formData).then(function (res) {
      importBtn.disabled = false;
      importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data';
      var pc = document.getElementById('importPreviewContainer');
      if (pc) pc.style.display = 'none';
      if (res.success) {
        var msg = 'Imported: ' + res.data.imported + ', Merged: ' + (res.data.merged || 0) + ', Skipped: ' + (res.data.skipped || 0) + ', Duplicates: ' + res.data.duplicates + ', Errors: ' + res.data.errors;
        if (res.data.errors > 0 && res.data.errorDetails) {
          msg += '. Check import history for details.';
        }
        Toast.success('Import Completed', msg);
        if (_apiDataLoaded) fetchAllData();
      } else {
        Toast.danger('Import Failed', res.message || 'Import failed');
      }
    }).catch(function (err) {
      importBtn.disabled = false;
      importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data';
      Toast.danger('Import Failed', err.message || 'Import failed');
    });
    if (fileNameEl) { fileNameEl.style.display = 'none'; }
    fileInput.value = '';
    selectedImportFile = null;
  });

  /* Download template button */
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      API.downloadTemplate();
      Toast.info('Template', 'Downloading alumni import template...');
    });
  }
}

/* ────────────────────────────────────────────────────────────
   37. IMPORT HISTORY TABLE
   ──────────────────────────────────────────────────────────── */
function populateImportHistory() {
  var tbody = document.getElementById('importHistoryBody');
  if (!tbody) return;
  var data;
  if (_apiDataLoaded && _apiImportHistory && _apiImportHistory.records) {
    data = _apiImportHistory.records.map(function (h) {
      return {
        file: h.file_name || h.file || h.fileName || '-',
        imported: h.imported || h.recordsImported || 0,
        merged: h.merged || 0,
        skipped: h.skipped || 0,
        duplicates: h.duplicates || h.duplicatesSkipped || 0,
        errors: h.errors || 0,
        by: h.importer_name || h.by || h.importedBy || '-',
        date: h.created_at || h.date || h.importedAt || '-',
        status: h.status || 'Completed',
        errorDetails: h.error_details || null
      };
    });
  } else {
    data = importHistory;
  }
  var html = '';
  data.forEach(function (item, i) {
    var statusBadge = item.status === 'Completed'
      ? '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Completed</span>'
      : '<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Failed</span>';
    html += '<tr>';
    html += '<td>' + (i + 1) + '</td>';
    html += '<td>' + item.file + '</td>';
    html += '<td>' + item.imported + '</td>';
    html += '<td>' + (item.merged || 0) + '</td>';
    html += '<td>' + (item.skipped || 0) + '</td>';
    html += '<td>' + item.duplicates + '</td>';
    var errBtn = '';
    if (item.errors > 0) {
      var errData = item.errorDetails;
      var errMsg = errData ? (typeof errData === 'string' ? errData : JSON.stringify(errData)).slice(0, 500) : 'Check server logs';
      errBtn = ' <button class="btn btn-sm btn-ghost" onclick="Toast.info(\'Import Errors (' + item.errors + ')\',\'' + errMsg.replace(/'/g,"\\'").replace(/"/g,'&quot;') + '\')"><i class="fas fa-info-circle"></i></button>';
    }
    html += '<td>' + item.errors + errBtn + '</td>';
    html += '<td>' + item.by + '</td>';
    html += '<td>' + item.date + '</td>';
    html += '<td>' + statusBadge + '</td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

/* ────────────────────────────────────────────────────────────
   38. AUDIT LOGS – Table Population
   ──────────────────────────────────────────────────────────── */
function getAuditActionBadge(action) {
  var map = {
    'login': '<span class="badge badge-info"><i class="fas fa-sign-in-alt"></i> Login</span>',
    'logout': '<span class="badge badge-secondary"><i class="fas fa-sign-out-alt"></i> Logout</span>',
    'create': '<span class="badge badge-success"><i class="fas fa-plus-circle"></i> Create</span>',
    'update': '<span class="badge badge-primary"><i class="fas fa-edit"></i> Update</span>',
    'delete': '<span class="badge badge-danger"><i class="fas fa-trash"></i> Delete</span>',
    'import': '<span class="badge badge-warning"><i class="fas fa-file-import"></i> Import</span>',
    'export': '<span class="badge badge-info"><i class="fas fa-file-export"></i> Export</span>',
    'assign': '<span class="badge badge-purple" style="background:#EDE9FE;color:#7C3AED;"><i class="fas fa-user-check"></i> Assign</span>'
  };
  return map[action] || '<span class="badge badge-light">' + action + '</span>';
}

function getAuditStatusBadge(status) {
  if (status === 'Success') {
    return '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Success</span>';
  }
  return '<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Failed</span>';
}

function populateAuditLogTable() {
  if (_apiDataLoaded && _apiAuditLogs && _apiAuditLogs.records) {
    auditState.filteredData = _apiAuditLogs.records.map(function (item) {
      var tsStr = '';
      if (item.created_at) {
        var d = new Date(item.created_at);
        tsStr = d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      }
      return {
        ts: tsStr,
        user: item.username || '-',
        role: item.role_name || '-',
        action: item.action || '-',
        target: item.target || '-',
        ip: item.ip_address || '-',
        status: item.status || 'Success'
      };
    });
  } else {
    auditState.filteredData = auditLogs.slice();
  }
  auditState.currentPage = 1;
  renderAuditLogTable();
}

function renderAuditLogTable() {
  var data = auditState.filteredData;
  var page = auditState.currentPage;
  var perPage = auditState.rowsPerPage;
  var start = (page - 1) * perPage;
  var end = Math.min(start + perPage, data.length);
  var pageData = data.slice(start, end);

  var tbody = document.getElementById('auditLogBody');
  if (!tbody) return;

  if (pageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:8px;opacity:0.4;"></i>No audit records found</td></tr>';
    renderAuditPagination(data.length);
    return;
  }

  var html = '';
  pageData.forEach(function (item, i) {
    var sno = start + i + 1;
    var actionBadge = getAuditActionBadge(item.action);
    var statusBadge = getAuditStatusBadge(item.status);
    html += '<tr>';
    html += '<td>' + sno + '</td>';
    html += '<td style="white-space:nowrap;font-size:0.8rem;">' + item.ts + '</td>';
    html += '<td><strong>' + item.user + '</strong></td>';
    html += '<td>' + item.role + '</td>';
    html += '<td>' + actionBadge + '</td>';
    html += '<td style="font-size:0.8rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + item.target + '">' + item.target + '</td>';
    html += '<td style="font-family:monospace;font-size:0.8rem;">' + item.ip + '</td>';
    html += '<td>' + statusBadge + '</td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
  renderAuditPagination(data.length);
}

function renderAuditPagination(total) {
  var perPage = auditState.rowsPerPage;
  var totalPages = Math.max(1, Math.ceil(total / perPage));
  var page = auditState.currentPage;

  var container = document.getElementById('auditPagination');
  if (!container) return;
  var html = '';
  html += '<button class="pagination-item ' + (page <= 1 ? 'disabled' : '') + '" onclick="goToAuditPage(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
  for (var i = 1; i <= totalPages; i++) {
    html += '<button class="pagination-item ' + (i === page ? 'active' : '') + '" onclick="goToAuditPage(' + i + ')">' + i + '</button>';
  }
  html += '<button class="pagination-item ' + (page >= totalPages ? 'disabled' : '') + '" onclick="goToAuditPage(' + (page + 1) + ')" ' + (page >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
  container.innerHTML = html;
}

function goToAuditPage(page) {
  var total = auditState.filteredData.length;
  var totalPages = Math.max(1, Math.ceil(total / auditState.rowsPerPage));
  if (page < 1 || page > totalPages) return;
  auditState.currentPage = page;
  renderAuditLogTable();
}

/* ────────────────────────────────────────────────────────────
   39. AUDIT LOGS – Filters
   ──────────────────────────────────────────────────────────── */
function initAuditHandlers() {
  var filterBtn = document.getElementById('auditFilterBtn');
  var resetBtn = document.getElementById('auditResetBtn');

  if (filterBtn) {
    filterBtn.addEventListener('click', function () {
      applyAuditFilters();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      var actionFilter = document.getElementById('auditActionFilter');
      var roleFilter = document.getElementById('auditRoleFilter');
      var dateFrom = document.getElementById('auditDateFrom');
      var dateTo = document.getElementById('auditDateTo');
      if (actionFilter) actionFilter.value = 'all';
      if (roleFilter) roleFilter.value = 'all';
      if (dateFrom) dateFrom.value = '';
      if (dateTo) dateTo.value = '';
      applyAuditFilters();
    });
  }
}

function fetchLatestAuditLogs(callback) {
  API.getAuditLogs({ page: 1, limit: 1000 }).then(function (res) {
    if (res.success && res.data) {
      _apiAuditLogs = res.data;
    }
    if (callback) callback();
  }).catch(function (err) {
    console.error('Failed to fetch latest audit logs:', err);
    if (callback) callback();
  });
}

function applyAuditFilters() {
  fetchLatestAuditLogs(function () {
    var actionFilter = document.getElementById('auditActionFilter');
    var roleFilter = document.getElementById('auditRoleFilter');
    var dateFrom = document.getElementById('auditDateFrom');
    var dateTo = document.getElementById('auditDateTo');

    var actionVal = actionFilter ? actionFilter.value : 'all';
    var roleVal = roleFilter ? roleFilter.value : 'all';
    var fromVal = dateFrom ? dateFrom.value : '';
    var toVal = dateTo ? dateTo.value : '';

    var fullData;
    if (_apiDataLoaded && _apiAuditLogs && _apiAuditLogs.records) {
      fullData = _apiAuditLogs.records.map(function (item) {
        var tsStr = '';
        if (item.created_at) {
          var d = new Date(item.created_at);
          tsStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        return {
          ts: tsStr,
          user: item.username || '-',
          role: item.role_name || '-',
          action: item.action || '-',
          target: item.target || '-',
          ip: item.ip_address || '-',
          status: item.status || 'Success',
          created_at: item.created_at
        };
      });
    } else {
      fullData = auditLogs.slice();
    }
    auditState.filteredData = fullData.filter(function (item) {
      var match = true;
      if (actionVal !== 'all' && item.action !== actionVal) match = false;
      if (roleVal !== 'all' && item.role !== roleVal) match = false;
      if (fromVal) {
        var fromDate = new Date(fromVal);
        var itemDate = item.created_at ? new Date(item.created_at) : parseAuditDate(item.ts);
        if (itemDate < fromDate) match = false;
      }
      if (toVal) {
        var toDate = new Date(toVal);
        toDate.setHours(23, 59, 59, 999);
        var itemDate = item.created_at ? new Date(item.created_at) : parseAuditDate(item.ts);
        if (itemDate > toDate) match = false;
      }
      return match;
    });
    auditState.currentPage = 1;
    renderAuditLogTable();
  });
}

function parseAuditDate(ts) {
  /* ts format: "08 Jul 2026, 09:15:32" */
  var parts = ts.split(', ');
  if (parts.length < 2) return new Date(0);
  var datePart = parts[0];
  var months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  var dparts = datePart.split(' ');
  if (dparts.length < 3) return new Date(0);
  var day = parseInt(dparts[0], 10);
  var month = months[dparts[1]] !== undefined ? months[dparts[1]] : 0;
  var year = parseInt(dparts[2], 10);
  return new Date(year, month, day);
}

/* ────────────────────────────────────────────────────────────
    40. REPORTS – View & Export
    ──────────────────────────────────────────────────────────── */
function viewReportData(type, title) {
  var columns, rows;
  if (type === 'alumni') {
    columns = ['Name', 'Department', 'Batch', 'Company', 'Designation', 'Status'];
    if (_apiDataLoaded && _apiAlumni && _apiAlumni.records) {
      rows = _apiAlumni.records.map(function (a) {
        return [a.name || (a.first_name + ' ' + (a.last_name || '')).trim(), a.department || a.dept || '-', a.batch || '-', a.company || a.working_details || '-', a.designation || '-', a.status || 'Pending'];
      });
    } else {
      rows = [];
    }
  } else if (type === 'progress') {
    columns = ['Batch', 'Total', 'Completed', 'Remaining', 'Completion %'];
    if (_apiDataLoaded && _dashboardData && _dashboardData.batchWiseProgress) {
      rows = _dashboardData.batchWiseProgress.map(function (d) {
        var remaining = (d.total || 0) - (d.completed || 0);
        var pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
        return ['Batch ' + d.batch, d.total || 0, d.completed || 0, remaining, pct + '%'];
      });
    } else {
      rows = dummyBatchProgress.map(function (d) {
        var remaining = d.total - d.completed;
        var pct = Math.round((d.completed / d.total) * 100);
        return ['Batch ' + d.batch, d.total, d.completed, remaining, pct + '%'];
      });
    }
  } else if (type === 'department') {
    columns = ['Department', 'Total Leaders', 'Total Members', 'Assigned Alumni'];
    if (_apiDataLoaded && _dashboardData && _dashboardData.departmentWiseProgress) {
      rows = _dashboardData.departmentWiseProgress.map(function (d) {
        return [d.department || d.dept || '-', '-', '-', (d.total || 0) + ' (' + (d.completed || 0) + ' completed)'];
      });
    } else {
      rows = dummyDeptProgress.map(function (d) { return [d.dept, '-', '-', d.total + ' (' + d.completed + ' completed)']; });
    }
  } else if (type === 'team') {
    columns = ['Leader', 'Members', 'Assigned', 'Completed', 'Progress'];
    if (_apiDataLoaded && _apiTeams && _apiTeams.records) {
      rows = _apiTeams.records.map(function (t) {
        var pct = (t.assigned_count || 0) > 0 ? Math.round(((t.completed_count || 0) / (t.assigned_count || 1)) * 100) : 0;
        return [t.leader_name || t.name || '-', t.member_count || 0, t.assigned_count || 0, t.completed_count || 0, pct + '%'];
      });
    } else {
      rows = dummyTeamLeaders.map(function (t) {
        var pct = t.assigned > 0 ? Math.round(((t.assigned * 0.6) / t.assigned) * 100) : 0;
        return [t.name, t.members, t.assigned, Math.round(t.assigned * 0.6), pct + '%'];
      });
    }
  } else {
    Toast.error('Report', 'Unknown report type');
    return;
  }
  showReportModal(title, columns, rows);
}

function showReportModal(title, columns, rows) {
  var existing = document.getElementById('reportViewerModal');
  if (existing) existing.remove();

  var html = '<div id="reportViewerModal" class="modal-overlay" onclick="if(event.target===this)this.remove()">';
  html += '<div class="modal-content" style="max-width:900px;max-height:85vh;overflow-y:auto;">';
  html += '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">&times;</button></div>';
  html += '<div class="modal-body" style="padding:20px;">';
  html += '<div style="margin-bottom:12px;text-align:right;"><button class="btn btn-primary btn-sm" onclick="exportReportData(\'' + title.replace(/'/g, "\\'") + '\')"><i class="fas fa-download"></i> Export CSV</button></div>';
  html += '<div class="table-container"><table class="table"><thead><tr>';
  columns.forEach(function (c) { html += '<th>' + c + '</th>'; });
  html += '</tr></thead><tbody id="reportViewerBody">';
  rows.forEach(function (r) {
    html += '<tr>';
    r.forEach(function (v) { html += '<td>' + v + '</td>'; });
    html += '</tr>';
  });
  html += '</tbody></table></div></div></div></div>';

  document.body.insertAdjacentHTML('beforeend', html);

  var _reportColumns = columns;
  var _reportRows = rows;
  var _reportTitle = title;
  window.exportReportData = function (t) {
    var csv = '\uFEFF';
    csv += _reportColumns.join(',') + '\r\n';
    _reportRows.forEach(function (r) {
      csv += r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',') + '\r\n';
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = t.replace(/\s+/g, '_') + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
}

window.viewAlumniDetails = function(id) {
  API.getAlumniById(id).then(function(res) {
    if (res && res.success && res.data) {
      populateViewModal(res.data);
    } else {
      // Fallback to cached data
      var records = [];
      if (_apiAlumni && Array.isArray(_apiAlumni.records)) {
        records = _apiAlumni.records;
      }
      var record = records.find(function(r) { return (r.alumni_id || r.id) == id; });
      if (record) {
        populateViewModal(record);
      } else {
        Toast.error('View Details', 'Alumni record not found');
      }
    }
  }).catch(function() {
    // Fallback to cached data on error
    var records = [];
    if (_apiAlumni && Array.isArray(_apiAlumni.records)) {
      records = _apiAlumni.records;
    }
    var record = records.find(function(r) { return (r.alumni_id || r.id) == id; });
    if (record) {
      populateViewModal(record);
    } else {
      Toast.error('View Details', 'Failed to load alumni details');
    }
  });
};

function populateViewModal(record) {
  
  document.getElementById('vAlumniName').innerText = record.name || '-';
  document.getElementById('vAlumniMeta').innerText = (record.department || record.dept || '-') + ' | Batch ' + (record.batch || '-');
  document.getElementById('vAlumniRegNo').innerText = record.register_no || record.registerNo || '-';
  document.getElementById('vAlumniGender').innerText = record.gender || '-';
  document.getElementById('vAlumniDOB').innerText = record.date_of_birth || record.dob || '-';
  document.getElementById('vAlumniEmail').innerText = record.email || '-';
  document.getElementById('vAlumniPhone').innerText = record.phone || '-';
  
  var li = document.getElementById('vAlumniLinkedIn');
  if (record.linkedin_profile || record.linkedin) {
    var url = record.linkedin_profile || record.linkedin;
    li.innerText = url;
    li.href = url.startsWith('http') ? url : 'https://' + url;
    li.style.display = 'inline';
  } else {
    li.innerText = '-';
    li.href = '#';
  }
  
  document.getElementById('vAlumniCompany').innerText = record.company || '-';
  document.getElementById('vAlumniDesignation').innerText = record.designation || '-';
  document.getElementById('vAlumniCity').innerText = record.current_city || record.city || '-';
  document.getElementById('vAlumniStateCountry').innerText = (record.state || '-') + ', ' + (record.country || '-');
  document.getElementById('vAlumniWorkingDetails').innerText = record.working_details || '-';
  document.getElementById('vAlumniHigherStudies').innerText = record.higher_studies || record.higherStudies || '-';
  document.getElementById('vAlumniEntrepreneur').innerText = record.entrepreneur || '-';
  document.getElementById('vAlumniGovtJob').innerText = record.govt_job || record.govtJob || '-';
  
  var avatar = document.getElementById('vAlumniAvatar');
  var initials = (record.name || 'A').split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  avatar.innerText = initials;

  openModal('viewAlumniModal');
}

window.handleGlobalSearch = function(val) {
  var activeItem = document.querySelector('.sidebar-item.active');
  var activeSection = activeItem ? (activeItem.getAttribute('data-section') || 'dashboard') : 'dashboard';
  if (activeSection === 'alumni' || activeSection === 'dashboard') {
    var ts = document.getElementById('tableSearch');
    if (ts) { ts.value = val; filterTable(); }
  } else if (activeSection === 'teamLeaders') {
    var ts = document.getElementById('tlSearch');
    if (ts) { ts.value = val; filterTeamLeaders(); }
  } else if (activeSection === 'teamMembers') {
    var ts = document.getElementById('tmSearch');
    if (ts) { ts.value = val; filterTeamMembers(); }
  }
};
