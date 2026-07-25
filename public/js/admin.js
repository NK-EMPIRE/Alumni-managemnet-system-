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
  { file: 'alumni_batch_2023.xlsx', imported: 200, merged: 45, skipped: 3, duplicates: 12, errors: 3, by: 'Admin User', date: '05 Jul 2026', status: 'Completed', original_name: 'alumni_batch_2023.xlsx', errorDetails: 'Row 23: Invalid email format "john.doe@"\nRow 67: Duplicate register number "2023CSE045"\nRow 89: Missing required field "FullName"' },
  { file: 'cse_alumni_2022.xlsx', imported: 150, merged: 30, skipped: 1, duplicates: 5, errors: 1, by: 'Admin User', date: '28 Jun 2026', status: 'Completed', original_name: 'cse_alumni_2022.xlsx', errorDetails: 'Row 12: Invalid phone number "+91-98765"' },
  { file: 'ece_alumni_update.csv', imported: 60, merged: 32, skipped: 0, duplicates: 8, errors: 0, by: 'Admin User', date: '15 Jun 2026', status: 'Completed', original_name: 'ece_alumni_update.csv', errorDetails: null },
  { file: 'mech_batch_2021.xlsx', imported: 120, merged: 36, skipped: 2, duplicates: 3, errors: 2, by: 'Admin User', date: '01 Jun 2026', status: 'Completed', original_name: 'mech_batch_2021.xlsx', errorDetails: 'Row 45: Batch year mismatch "2020" expected "2021"\nRow 78: Invalid department code "MEC"' },
  { file: 'full_alumni_export.csv', imported: 400, merged: 220, skipped: 7, duplicates: 45, errors: 7, by: 'Admin User', date: '20 May 2026', status: 'Completed', original_name: 'full_alumni_export.csv', errorDetails: 'Row 3: Missing email\nRow 15: Invalid register number\nRow 34: Duplicate entry\nRow 56: Invalid batch format\nRow 78: Missing department\nRow 102: Invalid phone\nRow 145: Duplicate email' },
  { file: 'batch_2020_update.xlsx', imported: 0, merged: 0, skipped: 0, duplicates: 0, errors: 0, by: 'Admin User', date: '10 May 2026', status: 'Failed', original_name: 'batch_2020_update.xlsx', errorDetails: 'File corrupted: Unable to read worksheet. The file may be damaged or in an unsupported format.' }
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

var selectedImportFiles = [];

function initSpreadsheetHandlers() {
  // Initialize leader dropdown for edit modal
  populateEditLeaderDropdown(null);

  // Populate department and batch filters from Excel data dynamically
  API.getAlumniFilters().then(function (res) {
    if (res && res.success && res.data) {
      var depts = res.data.departments || [];
      var batches = res.data.batches || [];

      var ssFilterDept = document.getElementById('ssFilterDept');
      var ssFilterBatch = document.getElementById('ssFilterBatch');

      if (ssFilterDept) {
        ssFilterDept.innerHTML = '<option value="">All Depts</option>';
        depts.forEach(function (d) {
          ssFilterDept.innerHTML += '<option value="' + d + '">' + d + '</option>';
        });
      }

      if (ssFilterBatch) {
        ssFilterBatch.innerHTML = '<option value="">All Batches</option>';
        batches.forEach(function (b) {
          ssFilterBatch.innerHTML += '<option value="' + b + '">' + b + '</option>';
        });
      }
    }
  }).catch(function (err) {
    console.error('Failed to load dynamic spreadsheet filters:', err);
  });
}

/* ────────────────────────────────────────────────────────────
    3b. SPREADSHEET STATE
    ──────────────────────────────────────────────────────────── */
var spreadsheetState = {
  currentPage: 1,
  rowsPerPage: 10,
  filteredData: [],
  columns: [
    { id: 'name', label: 'Name', visible: true },
    { id: 'registerNo', label: 'Register No', visible: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'batch', label: 'Batch', visible: true },
    { id: 'status', label: 'Current Status', visible: true },
    { id: 'leader', label: 'Leader', visible: true }
  ],
  selectedAlumni: new Set(),
  inEditMode: false,
  editedAlumni: null
};

/* ────────────────────────────────────────────────────────────
    3c. DOM READY – Initialization
    ──────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
document.addEventListener('DOMContentLoaded', function () {
  try {
    setUserInfo();
    initSessionTimeout();
    setupClickOutside();
    populateTeamLeaderDropdowns();
    initImportHandlers();
    initAuditHandlers();
    initSpreadsheetHandlers();
    initProgressWatch();
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
var _alumniMapped = null;
var _apiStats = null;

function parseUTCDateTime(dateStr) {
  if (!dateStr) return new Date();
  if (typeof dateStr === 'string') {
    var cleanStr = dateStr.trim();
    if (!cleanStr.endsWith('Z') && !cleanStr.includes('+')) {
      cleanStr = cleanStr.replace(' ', 'T') + 'Z';
    }
    return new Date(cleanStr);
  }
  return new Date(dateStr);
}

function initRealtimeClock() {
  // Clock is now handled universally by app.js setupUniversalClock()
  // This function is kept for backward compatibility
}

var _apiAssignHistory = null;
var _apiAlumniFilters = null;
var _importErrorDetails = [];

function setUserInfo() {
  var user = API.getUser();
  var sidebarName = document.getElementById('sidebarUserName');
  var navbarName = document.getElementById('navbarProfileName');
  if (sidebarName && user.name) sidebarName.textContent = user.name;
  if (navbarName && user.name) navbarName.textContent = user.name.split(' ')[0];

  var settingsName = document.getElementById('adminSettingsName');
  var settingsEmail = document.getElementById('adminSettingsEmail');
  if (settingsName) settingsName.value = user.name || '';
  if (settingsEmail && user.email) settingsEmail.value = user.email || '';
}

function fetchAllData() {
  Promise.all([
    API.getAdminDashboard().catch(function () { return null; }),
    API.getUsers({ role: 'LEADER', page: 1, limit: 100 }).catch(function () { return null; }),
    API.getUsers({ role: 'MEMBER', page: 1, limit: 100 }).catch(function () { return null; }),
    API.getAlumni({ page: 1, limit: 10000 }).catch(function () { return null; }),
    API.getImportHistory().catch(function () { return null; }),
    API.getTeams().catch(function () { return null; }),
    API.getAuditLogs({ page: 1, limit: 1000 }).catch(function () { return null; }),
    API.getAssignmentHistory({ page: 1, limit: 100 }).catch(function () { return null; }),
    API.getAlumniFilters().catch(function () { return null; })
  ]).then(function (results) {
    _dashboardData = results[0] && results[0].success ? results[0].data : null;
    _apiUsers = results[1] && results[1].success ? results[1].data : null;
    _apiMembers = results[2] && results[2].success ? results[2].data : null;
    _apiAlumni = results[3] && results[3].success ? results[3].data : null;
    _apiImportHistory = results[4] && results[4].success ? results[4].data : null;
    _apiTeams = results[5] && results[5].success ? results[5].data : null;
    _apiAuditLogs = results[6] && results[6].success ? results[6].data : null;
    _apiAssignHistory = results[7] && results[7].success ? results[7].data : null;
    _apiAlumniFilters = results[8] && results[8].success ? results[8].data : null;
    _apiDataLoaded = true;

    // Populate dynamic filters first
    populateDynamicFilters(_apiAlumniFilters);

    populateDashboardStats();
    populateTable();
    populateTeamLeadersTable();
    populateTeamMembersTable();
    populateAssignHistoryTable();
    populateDeptProgress();
    populateTLRankings();
    populateNotifications();
    populateImportHistory();
    populateAuditActionFilter();
    populateAuditLogTable();
    populateTeamLeaderDropdowns();
    populateProgressLeaderDropdown();
    if (window.fetchResetRequests) window.fetchResetRequests();
    if (window.fetchSpreadsheetData) window.fetchSpreadsheetData();
    // Dismiss loading screen
    var ls = document.getElementById('loadingScreen');
    if (ls) { ls.classList.add('hide'); setTimeout(function () { ls.style.display = 'none'; }, 600); }
  }).catch(function () {
    _apiDataLoaded = false;
    populateDashboardStats();
    populateTable();
    populateTeamLeadersTable();
    populateTeamMembersTable();
    populateAssignHistoryTable();
    populateDeptProgress();
    populateTLRankings();
    populateNotifications();
    populateImportHistory();
    populateAuditActionFilter();
    populateAuditLogTable();
    populateTeamLeaderDropdowns();
    populateProgressLeaderDropdown();
    var ls = document.getElementById('loadingScreen');
    if (ls) { ls.classList.add('hide'); setTimeout(function () { ls.style.display = 'none'; }, 600); }
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
  var total, pending, completed, tlCount, tmCount, draft;
  if (_apiDataLoaded && _dashboardData) {
    var d = _dashboardData;
    total = d.totalAlumni || 0;
    pending = d.pendingRecords || 0;
    completed = d.completedRecords || 0;
    tlCount = d.totalLeaders || 0;
    tmCount = d.totalMembers || 0;
    draft = d.draftRecords || 0;
  } else {
    total = 0;
    pending = 0;
    completed = 0;
    tlCount = 0;
    tmCount = 0;
    draft = 0;
  }

  setText('totalAlumni', total);
  setText('pendingUpdates', pending);
  setText('completedUpdates', completed);
  setText('totalTeamLeaders', tlCount);
  setText('totalTeamMembers', tmCount);
  setText('draftCount', draft);
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
    _alumniMapped = _apiAlumni.records.map(function (a) {
      return {
        id: a.alumni_id || a.id,
        name: a.name || a.fullName || 'Unknown',
        dept: a.department || a.dept || '',
        batch: a.batch || '',
        company: a.company || '',
        leader: a.assignedTo || a.leader || '',
        status: a.assignment_status || 'Pending',
        progress: (function (rec) {
          if (rec.assignment_status === 'Completed') return 100;
          if (rec.assignment_status === 'Pending') return 0;
          var fields = ['company', 'designation', 'email', 'phone', 'working_details', 'linkedin_profile'];
          var filled = 0;
          fields.forEach(function (f) { if (rec[f] && String(rec[f]).trim() !== '') filled++; });
          return Math.round((filled / fields.length) * 100);
        })(a)
      };
    });
    state.filteredData = _alumniMapped.slice();
  } else {
    _alumniMapped = null;
    state.filteredData = [];
  }

  var cntEl = document.getElementById('dashboardFilteredCount');
  if (cntEl) {
    cntEl.textContent = state.filteredData.length + ' Records';
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
  var q = (document.getElementById('tableSearch').value || '').toLowerCase().trim();
  pageData.forEach(function (item, i) {
    var sno = start + i + 1;
    var statusBadge = getStatusBadge(item.status);
    var progressColor = item.progress >= 80 ? 'green' : (item.progress >= 40 ? '' : 'red');

    var nameVal = item.name || '';
    var deptVal = item.dept || '';
    var batchVal = item.batch || '';
    var leaderVal = item.leader || '';

    if (q) {
      var cleanQuery = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      var regex = new RegExp('(' + cleanQuery + ')', 'gi');
      var escapeHtml = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
      var highlighter = function (match) { return '<mark style="background:#FEF08A;color:#854D0E;padding:0 2px;border-radius:2px;font-weight:600;">' + escapeHtml(match) + '</mark>'; };
      nameVal = String(nameVal).replace(regex, highlighter);
      deptVal = String(deptVal).replace(regex, highlighter);
      batchVal = String(batchVal).replace(regex, highlighter);
      leaderVal = String(leaderVal).replace(regex, highlighter);
    }

    html += '<tr>';
    html += '<td>' + sno + '</td>';
    html += '<td><strong>' + nameVal + '</strong></td>';
    html += '<td>' + deptVal + '</td>';
    html += '<td>' + batchVal + '</td>';
    html += '<td>' + leaderVal + '</td>';
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
var _filterDebounce = null;
function filterTable() {
  clearTimeout(_filterDebounce);
  _filterDebounce = setTimeout(_doFilter, 250);
}
function _doFilter() {
  var q = getVal('tableSearch').toLowerCase();
  var dept = getVal('dashFilterDept');
  var status = getVal('dashFilterStatus');
  var batch = getVal('dashFilterBatch');

  var source = _alumniMapped || [];

  if (!source || source.length === 0) {
    state.filteredData = [];
    var cntEl = document.getElementById('dashboardFilteredCount');
    if (cntEl) cntEl.textContent = '0 Records';
    state.currentPage = 1;
    renderTable();
    return;
  }
  state.filteredData = source.filter(function (item) {
    var match = true;
    if (q) {
      var haystack = (item.name + ' ' + item.dept + ' ' + item.batch + ' ' + item.leader + ' ' + item.company).toLowerCase();
      if (haystack.indexOf(q) === -1) match = false;
    }
    if (dept && item.dept.toLowerCase() !== dept.toLowerCase()) match = false;
    if (status && item.status.toLowerCase() !== status.toLowerCase()) match = false;
    if (batch && String(item.batch) !== String(batch)) match = false;
    return match;
  });

  var cntEl = document.getElementById('dashboardFilteredCount');
  if (cntEl) {
    cntEl.textContent = state.filteredData.length + ' Records';
  }

  updateDashboardFilterBadge();

  state.currentPage = 1;
  renderTable();
}

function applyDashboardFilters() {
  filterTable();
}

function resetDashboardFilters() {
  var dept = document.getElementById('dashFilterDept');
  var batch = document.getElementById('dashFilterBatch');
  var status = document.getElementById('dashFilterStatus');
  if (dept) dept.value = '';
  if (batch) batch.value = '';
  if (status) status.value = '';
  filterTable();
}

function updateDashboardFilterBadge() {
  var dept = getVal('dashFilterDept');
  var batch = getVal('dashFilterBatch');
  var status = getVal('dashFilterStatus');
  var count = 0;
  if (dept) count++;
  if (batch) count++;
  if (status) count++;
  var badge = document.getElementById('filterBadge') || document.getElementById('dashboardActiveFilterBadge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
  // Update filter dot indicator
  var wrap = document.getElementById('dashFilterBtnWrap');
  if (wrap) {
    if (count > 0) wrap.classList.add('has-active-filter');
    else wrap.classList.remove('has-active-filter');
  }
}

function updateSsFilterDot() {
  var leader = getVal('ssFilterLeader');
  var member = getVal('ssFilterMember');
  var dept = getVal('ssFilterDept');
  var batch = getVal('ssFilterBatch');
  var status = getVal('ssFilterStatus');
  var search = (document.getElementById('ssSearch') ? document.getElementById('ssSearch').value : '').trim();
  var hasFilter = !!(leader || member || dept || batch || status || search);
  var wrap = document.getElementById('ssFilterBtnWrap');
  if (wrap) {
    if (hasFilter) wrap.classList.add('has-active-filter');
    else wrap.classList.remove('has-active-filter');
  }
  // Also update badge count
  var count = [leader, member, dept, batch, status].filter(Boolean).length;
  var badge = document.getElementById('activeFilterBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
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
  var n = '';
  for (var i = 0; i < data.length; i++) {
    n = data[i].name || (data[i].first_name + ' ' + (data[i].last_name || ''));
    if (n === name) { tl = data[i]; break; }
  }
  if (!tl) { Toast.error('Error', 'Team Leader not found'); return; }
  var tlName = tl.name || n;
  var initials = tlName.split(' ').map(function (w) { return w[0] }).join('').toUpperCase().slice(0, 2);
  document.getElementById('tlAvatar').textContent = initials;
  document.getElementById('tlDetailName').textContent = tlName;
  document.getElementById('tlDetailDept').textContent = tl.dept || tl.department || '-';
  document.getElementById('tlDetailEmail').textContent = tl.email || '-';
  document.getElementById('tlDetailPhone').textContent = tl.phone || '-';
  document.getElementById('tlDetailMembers').textContent = tl.members || tl.member_count || 0;
  document.getElementById('tlDetailAssigned').textContent = tl.assigned || tl.assigned_count || 0;

  // List teammates / members assigned to this leader
  var teammatesDiv = document.getElementById('tlDetailTeammatesList');
  if (teammatesDiv) {
    var leaderId = tl.user_id || tl.id;
    var teammates = [];
    if (_apiDataLoaded && _apiMembers && _apiMembers.records) {
      teammates = _apiMembers.records.filter(function (m) {
        return m.leader_id === leaderId;
      });
    } else {
      teammates = dummyTeamMembers.filter(function (m) {
        return m.leader === tlName;
      });
    }

    if (teammates.length > 0) {
      var names = teammates.map(function (m) {
        var mName = m.name || (m.first_name + ' ' + (m.last_name || ''));
        return '<div style="display:flex;align-items:center;justify-content:between;border-bottom:1px solid #F1F5F9;padding:4px 0;"><span style="font-weight:500;">' + mName + '</span> <span style="font-size:0.75rem;color:var(--text-muted);">' + (m.department || m.dept || '') + '</span></div>';
      }).join('');
      teammatesDiv.innerHTML = names;
    } else {
      teammatesDiv.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">No team members assigned</span>';
    }
  }
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
  var initials = tmName.split(' ').map(function (w) { return w[0] }).join('').toUpperCase().slice(0, 2);
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
  var data = [];
  if (_apiDataLoaded && _apiUsers && _apiUsers.records) {
    data = _apiUsers.records.map(function (u) {
      var name = u.name || (u.first_name + ' ' + (u.last_name || ''));
      return { name: name, email: u.email, phone: u.phone || '-', dept: u.department || '-', members: u.member_count || 0, assigned: u.assigned_count || 0 };
    });
  }
  var html = '';
  if (data.length === 0) {
    html = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">No team leaders available.</td></tr>';
  } else {
    data.forEach(function (tl, i) {
      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td><strong>' + tl.name + '</strong></td>';
      html += '<td>' + tl.email + '</td>';
      html += '<td>' + tl.phone + '</td>';
      html += '<td>' + tl.dept + '</td>';
      html += '<td>' + tl.members + '</td>';
      html += '<td>' + tl.assigned + '</td>';
      html += '<td><button class="btn btn-sm btn-outline" onclick="viewTeamLeaderDetails(\'' + String(tl.name).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\')"><i class="fas fa-eye"></i></button></td>';
      html += '</tr>';
    });
  }
  tbody.innerHTML = html;
}

/* ────────────────────────────────────────────────────────────
   10. TEAM MEMBERS TABLE
   ──────────────────────────────────────────────────────────── */
function populateTeamMembersTable() {
  var tbody = document.getElementById('tmBody');
  if (!tbody) return;
  var data = [];
  if (_apiDataLoaded && _apiMembers && _apiMembers.records) {
    data = _apiMembers.records.map(function (u) {
      var name = u.name || (u.first_name + ' ' + (u.last_name || ''));
      return { name: name, email: u.email, phone: u.phone || '-', dept: u.department || '-', leader: u.team_leader_name || '-', assigned: u.assigned_count || 0 };
    });
  }
  var html = '';
  if (data.length === 0) {
    html = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">No team members available.</td></tr>';
  } else {
    data.forEach(function (tm, i) {
      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td><strong>' + tm.name + '</strong></td>';
      html += '<td>' + tm.email + '</td>';
      html += '<td>' + tm.phone + '</td>';
      html += '<td>' + tm.dept + '</td>';
      html += '<td>' + tm.leader + '</td>';
      html += '<td>' + tm.assigned + '</td>';
      html += '<td><button class="btn btn-sm btn-outline" onclick="viewTeamMemberDetails(\'' + String(tm.name).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\')"><i class="fas fa-eye"></i></button></td>';
      html += '</tr>';
    });
  }
  tbody.innerHTML = html;
}

/* ────────────────────────────────────────────────────────────
   11. ASSIGN HISTORY TABLE
   ──────────────────────────────────────────────────────────── */
function populateAssignHistoryTable() {
  var tbody = document.getElementById('assignHistoryBody');
  if (!tbody) return;
  var data = [];
  var records = _apiAssignHistory ? (_apiAssignHistory.records || (Array.isArray(_apiAssignHistory) ? _apiAssignHistory : [])) : [];
  if (_apiDataLoaded && records.length > 0) {
    data = records.map(function (a) {
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
   13b. TEAM PROGRESS WATCH (Admin Progress Page)
   ──────────────────────────────────────────────────────────── */
function initProgressWatch() {
  var sel = document.getElementById('progressLeaderSelect');
  if (!sel) return;
  sel.addEventListener('change', function () {
    var lid = this.value;
    if (lid) loadTeamProgressData(lid);
    else document.getElementById('teamProgressPanel').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:24px;">Select a team leader to view progress.</p>';
  });
}

function populateProgressLeaderDropdown() {
  var sel = document.getElementById('progressLeaderSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Select Team Leader —</option>';
  var leaders = _apiUsers && _apiUsers.records ? _apiUsers.records : [];
  leaders.forEach(function (l) {
    var opt = document.createElement('option');
    opt.value = l.user_id;
    opt.textContent = l.first_name + ' ' + l.last_name + ' (' + (l.department || 'No Dept') + ')';
    sel.appendChild(opt);
  });
}

function loadTeamProgressData(leaderId) {
  var panel = document.getElementById('teamProgressPanel');
  if (!panel) return;
  panel.innerHTML = '<div style="text-align:center;padding:32px;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:var(--primary);"></i><p style="margin-top:10px;color:var(--text-muted);">Loading...</p></div>';

  API.getLeaderStats(leaderId).then(function (res) {
    if (!res || !res.success || !res.data) {
      panel.innerHTML = '<p style="color:var(--danger);text-align:center;padding:24px;">Failed to load team data.</p>';
      return;
    }
    var d = res.data;
    var pct = d.completionPercentage || 0;
    var members = d.teamMembers || [];

    // Sort team leader to the top
    members.sort(function (a, b) {
      return (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0);
    });

    // Leader card
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px;">';
    html += mkStatBox('Total Assigned', d.totalAssigned || 0, '#3B82F6');
    html += mkStatBox('Completed', d.completed || 0, '#10B981');
    html += mkStatBox('Pending', d.pending || 0, '#F59E0B');
    html += mkStatBox('Draft', d.draft || 0, '#8B5CF6');
    html += '</div>';
    html += '<div style="margin-bottom:20px;">';
    html += '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-weight:600;font-size:0.85rem;">Team Completion</span><span style="font-weight:700;color:var(--primary);">' + pct + '%</span></div>';
    html += '<div class="progress"><div class="progress-bar" style="width:' + pct + '%;background:var(--primary);"></div></div>';
    html += '</div>';

    if (members.length === 0) {
      html += '<p style="color:var(--text-muted);text-align:center;padding:16px;">No team members assigned to this leader.</p>';
    } else {
      html += '<h5 style="font-size:0.9rem;font-weight:600;margin-bottom:12px;color:var(--text);"><i class="fas fa-users" style="color:var(--primary);margin-right:6px;"></i>Team Member Progress</h5>';
      html += '<table style="width:100%;border-collapse:collapse;">';
      html += '<thead><tr style="background:var(--surface);">';
      html += '<th style="text-align:left;padding:8px 10px;font-size:0.78rem;color:var(--text-muted);">Member</th>';
      html += '<th style="text-align:center;padding:8px;font-size:0.78rem;color:var(--text-muted);">Assigned</th>';
      html += '<th style="text-align:center;padding:8px;font-size:0.78rem;color:var(--text-muted);">Done</th>';
      html += '<th style="text-align:center;padding:8px;font-size:0.78rem;color:var(--text-muted);">Pending</th>';
      html += '<th style="text-align:left;padding:8px 10px;font-size:0.78rem;color:var(--text-muted);">Progress</th>';
      html += '<th style="text-align:center;padding:8px;font-size:0.78rem;color:var(--text-muted);">Status</th>';
      html += '</tr></thead><tbody>';
      members.forEach(function (m, i) {
        var bg = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)';
        var sc = m.progress >= 75 ? '#10B981' : m.progress >= 50 ? '#F59E0B' : '#EF4444';

        var nameHtml = escapeHtml(m.name);
        if (m.isLeader) {
          nameHtml += ' <span class="badge leader-badge" style="margin-left:6px;"><i class="fas fa-crown"></i> Team Leader</span>';
        }

        html += '<tr style="background:' + bg + ';border-bottom:1px solid var(--border);">';
        html += '<td style="padding:10px 10px;font-size:0.83rem;font-weight:500;display:flex;align-items:center;">' + nameHtml + '</td>';
        html += '<td style="text-align:center;padding:8px;font-size:0.83rem;">' + m.assigned + '</td>';
        html += '<td style="text-align:center;padding:8px;font-size:0.83rem;color:#10B981;font-weight:600;">' + m.completed + '</td>';
        html += '<td style="text-align:center;padding:8px;font-size:0.83rem;color:#F59E0B;">' + m.pending + '</td>';
        html += '<td style="padding:8px 10px;">';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += '<div style="flex:1;background:#E2E8F0;border-radius:4px;height:8px;overflow:hidden;"><div style="width:' + m.progress + '%;height:100%;background:' + sc + ';border-radius:4px;"></div></div>';
        html += '<span style="font-size:0.78rem;font-weight:600;color:' + sc + ';width:32px;">' + m.progress + '%</span>';
        html += '</div></td>';
        html += '<td style="text-align:center;padding:8px;"><span style="font-size:0.73rem;padding:3px 8px;border-radius:20px;background:' + sc + '20;color:' + sc + ';font-weight:600;">' + (m.status || '') + '</span></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    panel.innerHTML = html;
  }).catch(function () {
    panel.innerHTML = '<p style="color:var(--danger);text-align:center;padding:24px;">Error loading team data.</p>';
  });
}

function mkStatBox(label, val, color) {
  return '<div style="background:' + color + '15;border:1px solid ' + color + '30;border-radius:10px;padding:14px;text-align:center;">' +
    '<div style="font-size:1.5rem;font-weight:700;color:' + color + ';">' + val + '</div>' +
    '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">' + label + '</div>' +
    '</div>';
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
    var filteredLogs = _apiAuditLogs.records.filter(function (r) {
      var role = (r.role_name || r.roleName || '').toLowerCase().trim();
      return role !== 'admin' && role !== '';
    });
    rawNotifs = filteredLogs.slice(0, 10).map(function (r) {
      var nid = 'al_' + (r.audit_id || r.created_at + '_' + r.action);
      var actionStr = (r.action || '').replace(/_/g, ' ').toLowerCase();
      var text = (r.username || 'Faculty') + ' — ' + actionStr;
      if (r.action === 'USER_CREATED') {
        text = 'New Faculty user created';
      } else if (r.action === 'EXCEL_IMPORTED') {
        text = 'Excel import completed';
      } else if (r.action === 'ALUMNI_UPDATED' || r.action === 'ALUMNI_UPDATE') {
        text = 'Alumni details updated by faculty';
      } else if (r.action === 'ASSIGNMENT_DISTRIBUTED') {
        text = 'Alumni records distributed';
      }
      return {
        id: nid,
        text: text,
        time: r.created_at ? parseUTCDateTime(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '',
        unread: true
      };
    });
  }

  var notifs = rawNotifs.filter(function (n) { return cleared.indexOf(n.id) === -1; });

  if (notifs.length === 0) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;">No notifications</div>';
    var count = document.getElementById('notifCount');
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

  var count = document.getElementById('notifCount');
  var unreadCount = notifs.filter(function (n) { return n.unread; }).length;
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

window.clearAllNotifications = function () {
  // Clear all non-dismissed notification IDs (save all current IDs as dismissed)
  var notifButtons = document.querySelectorAll('#notifList .dropdown-item[data-nid]');
  var cleared = JSON.parse(localStorage.getItem('cleared_notifications_admin') || '[]');
  notifButtons.forEach(function (btn) {
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

function populateDynamicFilters(filters) {
  if (!filters) return;
  var data = filters.data || filters;
  var depts = data.departments || [];
  var batches = data.batches || [];

  // Populate all department selects
  var deptSelects = ['filterDepartment', 'ssFilterDept', 'tlDept', 'tmDept', 'assignDept', 'editDepartment', 'dashFilterDept', 'expFilterDept'];
  deptSelects.forEach(function (id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var currentVal = sel.value;
    var isFilter = id.indexOf('Filter') !== -1 || id.indexOf('filter') !== -1 || id.startsWith('dash') || id.startsWith('ssFilter') || id.startsWith('expFilter');
    var html = isFilter ? '<option value="">All Depts</option>' : '<option value="" disabled selected hidden>Select Department</option>';
    depts.forEach(function (d) {
      if (d) html += '<option value="' + d + '">' + d + '</option>';
    });
    sel.innerHTML = html;
    if (currentVal) sel.value = currentVal;
  });

  // Populate all batch selects
  var batchSelects = ['filterBatch', 'ssFilterBatch', 'assignBatch', 'dashFilterBatch', 'expFilterBatch'];
  batchSelects.forEach(function (id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var currentVal = sel.value;
    var isFilter = id.indexOf('Filter') !== -1 || id.indexOf('filter') !== -1 || id.startsWith('dash') || id.startsWith('ssFilter') || id.startsWith('expFilter');
    var html = isFilter ? '<option value="">All Batches</option>' : '<option value="" disabled selected hidden>Select Batch</option>';
    batches.forEach(function (b) {
      if (b) html += '<option value="' + b + '">' + b + '</option>';
    });
    sel.innerHTML = html;
    if (currentVal) sel.value = currentVal;
  });
}

/* ────────────────────────────────────────────────────────────
   15. TEAM LEADER DROPDOWNS (for modals)
   ──────────────────────────────────────────────────────────── */
function populateTeamLeaderDropdowns() {
  var selects = ['tmTeamLeader', 'assignTeamLeader', 'ssFilterLeader', 'tmFilterLeader', 'expFilterLeader'];
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
    var isFilter = id === 'ssFilterLeader' || id === 'tmFilterLeader' || id === 'expFilterLeader';
    sel.innerHTML = isFilter ? '<option value="">All Leaders</option>' : '<option value="" disabled selected hidden>Select Team Leader</option>';
    leaders.forEach(function (tl) {
      var opt = document.createElement('option');
      opt.value = tl.id || tl.name;
      opt.setAttribute('data-name', tl.name);
      opt.textContent = tl.name + (tl.dept ? ' (' + tl.dept + ')' : '');
      sel.appendChild(opt);
    });
  });

  // Populate ssFilterMember and expFilterMember dropdowns
  ['ssFilterMember', 'expFilterMember'].forEach(function (memId) {
    var memberSel = document.getElementById(memId);
    if (!memberSel) return;
    var currentMemberVal = memberSel.value;
    memberSel.innerHTML = '<option value="">All Members</option>';
    var members = [];
    if (_apiDataLoaded && _apiMembers && _apiMembers.records) {
      members = _apiMembers.records.map(function (u) {
        var name = u.name || (u.first_name + ' ' + (u.last_name || ''));
        return { id: u.user_id, name: name.trim(), dept: u.department || '', leaderId: u.team_leader_id };
      });
    }

    var leaderSrcId = memId === 'expFilterMember' ? 'expFilterLeader' : 'ssFilterLeader';
    var currentLeaderId = document.getElementById(leaderSrcId) ? document.getElementById(leaderSrcId).value : '';

    members.forEach(function (m) {
      if (currentLeaderId && String(m.leaderId) !== String(currentLeaderId)) {
        return;
      }
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name + (m.dept ? ' (' + m.dept + ')' : '');
      memberSel.appendChild(opt);
    });
    if (currentMemberVal) memberSel.value = currentMemberVal;
  });

  // Bind change event to ssFilterLeader to filter ssFilterMember options dynamically
  var leaderSel = document.getElementById('ssFilterLeader');
  if (leaderSel && !leaderSel.dataset.hasMemberFilterBound) {
    leaderSel.dataset.hasMemberFilterBound = 'true';
    leaderSel.addEventListener('change', function () {
      var selectedLeaderId = this.value;
      var memberSelElement = document.getElementById('ssFilterMember');
      if (!memberSelElement) return;

      var membersList = [];
      if (_apiDataLoaded && _apiMembers && _apiMembers.records) {
        membersList = _apiMembers.records.map(function (u) {
          var name = u.name || (u.first_name + ' ' + (u.last_name || ''));
          return { id: u.user_id, name: name.trim(), dept: u.department || '', leaderId: u.team_leader_id };
        });
      }

      var selectedMemberVal = memberSelElement.value;
      memberSelElement.innerHTML = '<option value="">All Members</option>';

      var hasSelectedMemberStillVisible = false;
      membersList.forEach(function (m) {
        if (selectedLeaderId && String(m.leaderId) !== String(selectedLeaderId)) {
          return;
        }
        var opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name + (m.dept ? ' (' + m.dept + ')' : '');
        if (String(m.id) === String(selectedMemberVal)) {
          opt.selected = true;
          hasSelectedMemberStillVisible = true;
        }
        memberSelElement.appendChild(opt);
      });

      if (!hasSelectedMemberStillVisible) {
        memberSelElement.value = "";
      }
    });
  }

  var batchSel = document.getElementById('assignBatch');
  if (batchSel) {
    var currentVal = batchSel.value;
    batchSel.innerHTML = '<option value="" disabled selected hidden>Select Batch</option>';
    var seen = {};
    if (_apiDataLoaded && _apiAlumni && _apiAlumni.records) {
      _apiAlumni.records.forEach(function (a) {
        if (a.batch && !seen[a.batch]) {
          seen[a.batch] = true;
          var opt = document.createElement('option');
          opt.value = a.batch;
          opt.textContent = a.batch;
          if (a.batch === currentVal) opt.selected = true;
          batchSel.appendChild(opt);
        }
      });
    } else {
      ['2024', '2023', '2022', '2021', '2020'].forEach(function (b) {
        var opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        if (b === currentVal) opt.selected = true;
        batchSel.appendChild(opt);
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
  /* Auto-close FAB menu if open */
  if (typeof fabOpen !== 'undefined' && fabOpen) {
    toggleQuickActions();
  }

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
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (section === 'audit') {
    fetchLatestAuditLogs(populateAuditLogTable);
  } else if (section === 'viewAlumni') {
    fetchSpreadsheetData();
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
  var submenu = el.nextElementSibling;
  if (submenu && submenu.classList.contains('submenu')) {
    if (document.body.classList.contains('sidebar-collapsed')) {
      if (window.showCollapsedPopover) window.showCollapsedPopover(el, submenu);
      return;
    }
    var isOpen = submenu.style.display === 'block';
    submenu.style.display = isOpen ? 'none' : 'block';
    var chevron = el.querySelector('.fa-chevron-down');
    if (chevron) {
      chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    }
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
   22b. RESET REQUESTS DROPDOWN
   ──────────────────────────────────────────────────────────── */
window.toggleResetRequests = function (event) {
  event.stopPropagation();
  closeDropdown('profileMenu');
  closeDropdown('notifMenu');
  var menu = document.getElementById('resetReqMenu');
  if (menu) {
    menu.classList.toggle('show');
    if (menu.classList.contains('show')) {
      fetchResetRequests();
    }
  }
};

window.fetchResetRequests = function () {
  var list = document.getElementById('resetReqList');
  if (!list) return;

  API.getResetRequests().then(function (res) {
    if (res && res.success && Array.isArray(res.data)) {
      var reqs = res.data;
      var count = reqs.length;

      // Update badge counts
      var countEl = document.getElementById('resetReqCount');
      var badgeEl = document.getElementById('resetReqCountBadge');
      if (countEl) {
        countEl.textContent = count;
        countEl.style.display = count > 0 ? 'flex' : 'none';
      }
      if (badgeEl) {
        badgeEl.textContent = count + ' pending';
        badgeEl.style.display = count > 0 ? 'inline-block' : 'none';
      }

      if (count === 0) {
        list.innerHTML = '<div style="padding:16px;text-align:center;color:#64748B;font-size:0.85rem;">No pending reset requests</div>';
        return;
      }

      var html = '';
      reqs.forEach(function (r) {
        var dateStr = '';
        if (r.created_at) {
          var d = parseUTCDateTime(r.created_at);
          dateStr = d.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }
        html += '<div class="reset-item" style="padding:12px 0;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:0.85rem;">' +
          '<div><strong>' + r.name + '</strong> <span style="font-size:0.75rem;color:#64748B;">(' + r.role + ')</span></div>' +
          '<div style="font-size:0.75rem;color:#94A3B8;">' + dateStr + '</div>' +
          '</div>' +
          '<div style="font-size:0.8rem;color:#64748B;word-break:break-all;">' + r.email + '</div>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
          '<button class="btn btn-sm btn-primary" onclick="handleResetRequest(' + r.request_id + ', \'Accepted\', this)" style="padding:4px 8px;font-size:0.75rem;">' +
          '<span class="spinner spinner-xs" style="display:none;margin-right:4px;"></span>Accept' +
          '</button>' +
          '<button class="btn btn-sm btn-outline-danger" onclick="handleResetRequest(' + r.request_id + ', \'Declined\', this)" style="padding:4px 8px;font-size:0.75rem;border-color:#EF4444;color:#EF4444;">' +
          '<span class="spinner spinner-xs" style="display:none;margin-right:4px;"></span>Decline' +
          '</button>' +
          '</div>' +
          '</div>';
      });
      list.innerHTML = html;
    }
  }).catch(function (err) {
    console.error('Failed to load reset requests:', err);
  });
};

window.handleResetRequest = function (requestId, status, btn) {
  if (btn.classList.contains('loading') || btn.disabled) return;
  var spinner = btn.querySelector('.spinner');
  if (spinner) spinner.style.display = 'inline-block';
  btn.classList.add('loading');
  btn.disabled = true;

  API.updateResetRequestStatus(requestId, status).then(function (res) {
    if (spinner) spinner.style.display = 'none';
    btn.classList.remove('loading');
    btn.disabled = false;
    Toast.success('Password Reset', 'Request ' + (status === 'Accepted' ? 'approved' : 'declined') + ' successfully!');
    fetchResetRequests();
  }).catch(function (err) {
    if (spinner) spinner.style.display = 'none';
    btn.classList.remove('loading');
    btn.disabled = false;
    Toast.danger('Password Reset', err.message || 'Failed to update request.');
  });
};

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
      closeDropdown('resetReqMenu');
    }
  });
}

/* ────────────────────────────────────────────────────────────
   24. MODAL CONTROLS
   ──────────────────────────────────────────────────────────── */
window.openModal = function (id) {
  var modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  /* Clear previous errors */
  clearAllErrors(modal);
  /* Initialize assign modal with DB-loaded options */
  if (id === 'assignAlumniModal') {
    initAssignModal();
  }
};

window.closeModal = function (id) {
  var modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('show');
  document.body.style.overflow = '';
  clearAllErrors(modal);
}

/* Close modal on overlay click */
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal-overlay')) {
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
      var tmpPwd = (res.data && res.data.temporaryPassword) || pass || 'mzcet@123';
      Toast.success('Success', 'Team Leader added successfully! Password: ' + tmpPwd);
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
        hideLoading(btn);
        var showPwd = tmpPwd || pass || 'mzcet@123';
        Toast.success('Success', 'Team Member added successfully! Password: ' + showPwd);
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
  if (!leaderId || isNaN(leaderId)) {
    hideLoading(btn);
    Toast.danger('Error', 'Please select a valid team leader.');
    return;
  }

  var dept = document.getElementById('assignDept').value;
  var batch = document.getElementById('assignBatch').value;
  var count = parseInt(document.getElementById('assignCount').value, 10) || 0;

  API.adminAssign({ department: dept, batch: batch, leaderId: leaderId, count: count }).then(function (res) {
    hideLoading(btn);
    if (res.success) {
      Toast.success('Success', res.message || 'Alumni assigned successfully!');
      closeModal('assignAlumniModal');

      // Show success modal
      document.getElementById('assignmentResultIcon').innerHTML = '<i class="fas fa-check-circle" style="color:#10B981;"></i>';
      document.getElementById('assignmentResultTitle').innerText = 'Assignment Successful';
      document.getElementById('assignmentResultMsg').innerText = res.message || 'Alumni data has been successfully assigned to the selected Team Leader.';
      openModal('assignmentResultModal');

      // Reset form
      document.getElementById('assignDept').value = 'ALL';
      document.getElementById('assignBatch').value = '';
      document.getElementById('assignCount').value = '';
      document.getElementById('assignTeamLeader').value = '';
      document.getElementById('assignCountGroup').style.display = 'none';
      document.getElementById('assignPreviewSummary').style.display = 'none';
      fetchAllData();
    } else {
      Toast.danger('Error', res.message || 'Failed to assign alumni');

      // Show error modal
      document.getElementById('assignmentResultIcon').innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#EF4444;"></i>';
      document.getElementById('assignmentResultTitle').innerText = 'Assignment Failed';
      document.getElementById('assignmentResultMsg').innerText = res.message || 'An error occurred while processing the assignment request.';
      openModal('assignmentResultModal');
    }
  }).catch(function (err) {
    hideLoading(btn);
    Toast.danger('Error', err.message || 'Failed to assign alumni');

    // Show error modal with error message / reason
    document.getElementById('assignmentResultIcon').innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#EF4444;"></i>';
    document.getElementById('assignmentResultTitle').innerText = 'Assignment Failed';
    document.getElementById('assignmentResultMsg').innerText = err.message || 'An error occurred while communicating with the database or server.';
    openModal('assignmentResultModal');
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

  var dept = document.getElementById('assignDept');
  // dept is optional — 'ALL' means all departments
  // no validation error needed for dept

  var batch = document.getElementById('assignBatch');
  if (!batch.value) { showFieldError(batch, 'Batch is required'); valid = false; }

  var leader = document.getElementById('assignTeamLeader');
  if (!leader.value) { showFieldError(leader, 'Please select a team leader'); valid = false; }

  var count = document.getElementById('assignCount');
  var available = parseInt(document.getElementById('availableAlumniCount').innerText, 10) || 0;
  if (!validateRequired(count.value)) { showFieldError(count, 'Number of alumni is required'); valid = false; }
  else {
    var cVal = parseInt(count.value, 10);
    if (cVal < 1) { showFieldError(count, 'Minimum 1 alumni required'); valid = false; }
    else if (cVal > available) { showFieldError(count, 'Cannot exceed available alumni count'); valid = false; }
  }

  return valid;
}

window.fetchAvailableAlumniForAssign = function () {
  var dept = document.getElementById('assignDept').value || 'ALL';
  var batch = document.getElementById('assignBatch').value;
  if (!batch) return;

  var countGroup = document.getElementById('assignCountGroup');
  var badge = document.getElementById('availableAlumniCount');

  badge.innerText = '...';
  countGroup.style.display = 'block';

  API.getAvailableAlumniCount({ department: dept, batch: batch }).then(function (res) {
    if (res && res.success) {
      var cnt = res.data.count || 0;
      badge.innerText = cnt;

      var input = document.getElementById('assignCount');
      input.value = cnt > 0 ? Math.min(50, cnt) : '';
      input.max = cnt;

      if (cnt === 0) {
        document.getElementById('assignPreviewSummary').style.display = 'block';
        document.getElementById('assignPreviewSummary').style.background = '#FEF9C3';
        document.getElementById('assignPreviewSummary').style.borderColor = '#FDE047';
        document.getElementById('assignPreviewSummary').style.color = '#78350F';
        document.getElementById('assignPreviewSummary').innerHTML = '<i class="fas fa-info-circle" style="margin-right:6px;"></i>No available alumni for this batch and department combination.';
      } else {
        updateAssignPreviewSummary();
      }
    }
  }).catch(function (err) {
    console.error('Error fetching available alumni count:', err);
    badge.innerText = 'Error';
  });
};

window.onAssignBatchChange = function () {
  var batch = document.getElementById('assignBatch').value;
  var deptSel = document.getElementById('assignDept');

  // Reset to All Departments and count group
  deptSel.value = 'ALL';
  document.getElementById('assignCountGroup').style.display = 'none';
  document.getElementById('assignPreviewSummary').style.display = 'none';

  if (!batch) return;
  // Immediately fetch available count for All Departments
  fetchAvailableAlumniForAssign();
};

window.initAssignModal = function () {
  var batchSel = document.getElementById('assignBatch');
  var deptSel = document.getElementById('assignDept');

  // Reset
  batchSel.value = '';
  deptSel.value = 'ALL';
  document.getElementById('assignCountGroup').style.display = 'none';
  document.getElementById('assignPreviewSummary').style.display = 'none';
  document.getElementById('assignCount').value = '';
  document.getElementById('availableAlumniCount').innerText = '0';

  // Populate from DB
  API.getAlumniFilters().then(function (res) {
    if (res && res.success && res.data) {
      var batches = res.data.batches || [];
      var depts = res.data.departments || [];

      batchSel.innerHTML = '<option value="" disabled selected hidden>Select Batch...</option>';
      batches.forEach(function (b) {
        batchSel.innerHTML += '<option value="' + b + '">' + b + '</option>';
      });

      deptSel.innerHTML = '<option value="ALL">All Departments</option>';
      depts.forEach(function (d) {
        deptSel.innerHTML += '<option value="' + d + '">' + d + '</option>';
      });
    }
  }).catch(function () {
    // Fallback static options
    batchSel.innerHTML = '<option value="" disabled selected hidden>Select Batch...</option><option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option><option value="2021">2021</option><option value="2020">2020</option>';
    deptSel.innerHTML = '<option value="ALL">All Departments</option><option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="ME">ME</option><option value="CE">CE</option><option value="IT">IT</option><option value="CIVIL">CIVIL</option><option value="MBA">MBA</option><option value="MCA">MCA</option>';
  });
};

window.updateAssignPreviewSummary = function () {
  var dept = document.getElementById('assignDept').value;
  var batch = document.getElementById('assignBatch').value;
  var available = parseInt(document.getElementById('availableAlumniCount').innerText, 10) || 0;
  var countInput = document.getElementById('assignCount');
  var count = parseInt(countInput.value, 10) || 0;

  var previewBox = document.getElementById('assignPreviewSummary');
  if (!batch || isNaN(available) || isNaN(count) || count <= 0) {
    previewBox.style.display = 'none';
    return;
  }

  var remaining = available - count;
  if (remaining < 0) {
    countInput.classList.add('error');
    previewBox.style.background = '#FEF2F2';
    previewBox.style.borderColor = '#FCA5A5';
    previewBox.style.color = '#991B1B';
    previewBox.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Assign count exceeds available alumni!';
    previewBox.style.display = 'block';
    return;
  } else {
    countInput.classList.remove('error');
  }

  previewBox.style.background = '#F0FDF4';
  previewBox.style.borderColor = '#BBF7D0';
  previewBox.style.color = '#166534';
  previewBox.innerHTML = `
    <strong>Preview Summary:</strong><br/>
    Department: <strong>${dept}</strong> | Batch: <strong>${batch}</strong><br/>
    Available: <strong>${available}</strong> | Assigning: <strong>${count}</strong> | Remaining: <strong>${remaining}</strong>
  `;
  previewBox.style.display = 'block';
};

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
  var leaderFilter = document.getElementById('tmFilterLeader') ? document.getElementById('tmFilterLeader').value.toLowerCase() : '';

  var rows = document.querySelectorAll('#tmBody tr');
  rows.forEach(function (row) {
    var text = row.textContent.toLowerCase();

    // Check search query matches
    var matchesSearch = text.indexOf(q) !== -1;

    // Check leader matches
    var matchesLeader = true;
    if (leaderFilter) {
      // Find the 6th column (index 5)
      var leaderCol = row.cells[5];
      var leaderText = leaderCol ? leaderCol.textContent.trim().toLowerCase() : '';

      // Resolve option name
      var select = document.getElementById('tmFilterLeader');
      var selectedOpt = select.options[select.selectedIndex];
      var leaderName = selectedOpt ? selectedOpt.getAttribute('data-name') : null;
      if (leaderName) {
        matchesLeader = leaderText.indexOf(leaderName.toLowerCase()) !== -1;
      } else {
        matchesLeader = leaderText.indexOf(leaderFilter) !== -1;
      }
    }

    row.style.display = (matchesSearch && matchesLeader) ? '' : 'none';
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

window.saveAdminProfile = function () {
  var user = API.getUser();
  if (!user || !user.id) return;
  var name = document.getElementById('adminSettingsName').value.trim();
  var email = document.getElementById('adminSettingsEmail').value.trim();
  if (!name || !email) {
    Toast.danger('Validation', 'Name and Email are required.');
    return;
  }

  var parts = name.split(' ');
  var fName = parts[0];
  var lName = parts.slice(1).join(' ') || '';

  API.updateProfile(user.id, { firstName: fName, lastName: lName, email: email }).then(function (res) {
    Toast.success('Settings', 'Admin profile updated successfully!');
    user.name = name;
    user.email = email;
    localStorage.setItem('user', JSON.stringify(user));
    setUserInfo();
  }).catch(function (err) {
    Toast.danger('Error', err.message || 'Failed to update profile.');
  });
};

window.showPasswordSuccessModal = function () {
  var modal = document.getElementById('passwordSuccessModal');
  if (modal) modal.classList.add('show');
};

window.closePasswordSuccessModal = function () {
  var modal = document.getElementById('passwordSuccessModal');
  if (modal) modal.classList.remove('show');
};

window.saveAdminPassword = function () {
  var oldPass = document.getElementById('adminSettingsOldPass').value;
  var newPass = document.getElementById('adminSettingsNewPass').value;
  var confirmPass = document.getElementById('adminSettingsConfirmPass').value;

  if (!oldPass || !newPass || !confirmPass) {
    Toast.danger('Validation', 'All password fields are required.');
    return;
  }
  if (newPass !== confirmPass) {
    Toast.danger('Validation', 'Passwords do not match.');
    return;
  }

  API.changePassword(oldPass, newPass).then(function (res) {
    document.getElementById('adminSettingsOldPass').value = '';
    document.getElementById('adminSettingsNewPass').value = '';
    document.getElementById('adminSettingsConfirmPass').value = '';
    window.showPasswordSuccessModal();
  }).catch(function (err) {
    Toast.danger('Error', err.message || 'Failed to update password.');
  });
};

/* ────────────────────────────────────────────────────────────
   30. EXPORT BUTTON
   ──────────────────────────────────────────────────────────── */
window.handleExport = function () {
  window.openExportCustomizationModal();
};

/* ────────────────────────────────────────────────────────────
   31. QUICK ACTION FAB
   ──────────────────────────────────────────────────────────── */
var fabOpen = false;
function toggleQuickActions() {
  fabOpen = !fabOpen;
  var menu = document.getElementById('quickActionMenu');
  var icon = document.getElementById('fabIcon');
  var overlay = document.getElementById('quickActionOverlay');
  if (fabOpen) {
    menu.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';
    icon.className = 'fas fa-times';
  } else {
    menu.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
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
  var lastActivity = Date.now();
  var IDLE_TIMEOUT = 5 * 60 * 1000; /* 5 minutes */
  var resetIdle = function () {
    lastActivity = Date.now();
    if (sessionOverlay && sessionOverlay.classList.contains('show')) { extendSession(); }
  };
  document.addEventListener('mousemove', resetIdle);
  document.addEventListener('keydown', resetIdle);
  document.addEventListener('click', resetIdle);
  document.addEventListener('scroll', resetIdle);

  setInterval(function () {
    if (Date.now() - lastActivity >= IDLE_TIMEOUT) {
      showSessionTimeout();
    }
  }, 10000); /* Check every 10 seconds */
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
    window.location.href = 'index.html?logout=success';
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

    uploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.style.borderColor = 'var(--primary)';
      uploadZone.style.background = 'rgba(99, 102, 241, 0.04)';
    });

    uploadZone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.style.borderColor = 'var(--border)';
      uploadZone.style.background = '';
    });

    uploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.style.borderColor = 'var(--border)';
      uploadZone.style.background = '';

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        // Trigger the change handler manually
        var event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });
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
      selectedImportFiles = Array.prototype.slice.call(fileInput.files);
      if (fileNameEl) {
        fileNameEl.style.display = 'block';
        fileNameEl.innerHTML = selectedImportFiles.map(function (f) {
          return '<div style="margin-top: 4px; font-weight: 500;"><i class="fas fa-check-circle"></i> ' + f.name + ' (' + (f.size / 1024 / 1024).toFixed(2) + ' MB)</div>';
        }).join('');
      }

      var previewBody = document.getElementById('importPreviewBody');
      var previewContainer = document.getElementById('importPreviewContainer');
      if (previewBody) previewBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;"><span class="spinner spinner-sm"></span> Loading Preview...</td></tr>';
      if (previewContainer) previewContainer.style.display = 'block';

      // Parallel preview calls
      var previewPromises = selectedImportFiles.map(function (file) {
        var formData = new FormData();
        formData.append('file', file);
        return API.uploadPreview(formData).then(function (res) {
          return res.success && res.data ? res.data : [];
        }).catch(function () { return []; });
      });

      Promise.all(previewPromises).then(function (results) {
        var combinedData = [];
        results.forEach(function (rows) {
          combinedData = combinedData.concat(rows);
        });

        if (combinedData.length > 0) {
          var html = '';
          combinedData.forEach(function (row, idx) {
            var badgeClass = row.action === 'Insert' ? 'badge-success' : row.action === 'Update' ? 'badge-primary' : 'badge-danger';
            var regNo = row.registerNo || row.register_no || '<span style="color:#EF4444;font-style:italic;">[Missing Reg No]</span>';
            var name = row.name || '<span style="color:#EF4444;font-style:italic;">[Missing Name]</span>';
            var dept = row.department || row.dept || '<span style="color:#EF4444;font-style:italic;">[Missing Dept]</span>';
            var batch = row.batch || '<span style="color:#EF4444;font-style:italic;">[Missing Batch]</span>';

            html += '<tr>' +
              '<td style="padding:10px 12px;font-weight:600;color:#64748B;">' + (idx + 1) + '</td>' +
              '<td style="padding:10px 12px;">' + regNo + '</td>' +
              '<td style="padding:10px 12px;"><strong>' + name + '</strong></td>' +
              '<td style="padding:10px 12px;">' + dept + '</td>' +
              '<td style="padding:10px 12px;">' + batch + '</td>' +
              '<td style="padding:10px 12px;"><span class="badge ' + badgeClass + '">' + row.action + '</span></td>' +
              '<td style="padding:10px 12px;color:#64748B;">' + (row.reason || '-') + '</td>' +
              '</tr>';
          });
          if (previewBody) previewBody.innerHTML = html;
          var statusEl = document.getElementById('importPreviewStatus');
          if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.textContent = 'Showing ' + combinedData.length + ' rows in selected files (scroll to view).';
          }
          importBtn.disabled = false;
        } else {
          if (previewBody) previewBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#EF4444;padding:20px;">No valid rows to preview.</td></tr>';
          var statusEl = document.getElementById('importPreviewStatus');
          if (statusEl) statusEl.style.display = 'none';
          importBtn.disabled = true;
        }
      });

    } else {
      selectedImportFiles = [];
      if (fileNameEl) { fileNameEl.style.display = 'none'; }
      var pc = document.getElementById('importPreviewContainer');
      if (pc) pc.style.display = 'none';
      importBtn.disabled = true;
    }
  });

  /* Import button click */
  importBtn.addEventListener('click', function () {
    if (selectedImportFiles.length === 0) return;
    importBtn.disabled = true;
    importBtn.innerHTML = '<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span> Importing...';

    var startTime = performance.now();
    var importPromises = selectedImportFiles.map(function (file) {
      var formData = new FormData();
      formData.append('file', file);
      return API.uploadImport(formData).then(function (res) {
        return { file: file.name, success: true, res: res };
      }).catch(function (err) {
        return { file: file.name, success: false, message: err.message };
      });
    });

    Promise.all(importPromises).then(function (results) {
      var duration = ((performance.now() - startTime) / 1000).toFixed(2);
      importBtn.disabled = false;
      importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data';
      var pc = document.getElementById('importPreviewContainer');
      if (pc) pc.style.display = 'none';

      var iconEl = document.getElementById('importResultIcon');
      var titleEl = document.getElementById('importResultTitle');
      var detailsEl = document.getElementById('importResultDetails');
      var durationEl = document.getElementById('importDurationSec');

      if (durationEl) durationEl.textContent = duration;

      var totalRows = 0;
      var totalImported = 0;
      var totalMerged = 0;
      var totalSkipped = 0;
      var totalDuplicates = 0;
      var totalErrors = 0;
      var allPendingAliases = [];
      var allUnmappedColumns = [];
      var failCount = 0;
      var successCount = 0;

      results.forEach(function (item) {
        if (!item.success) {
          failCount++;
          return;
        }
        var res = item.res;
        if (!res.success) {
          failCount++;
          return;
        }
        successCount++;
        var s = res.data && (res.data.summary || res.data) ? (res.data.summary || res.data) : {};
        totalRows += (s.totalRows || s.total_rows || s.totalRecords || 0);
        totalImported += (s.imported || 0);
        totalMerged += (s.merged || 0);
        totalSkipped += (s.skipped || 0);
        totalDuplicates += (s.duplicates || 0);
        totalErrors += (s.errors || 0);
        if (res.data.pendingAliasReview) {
          allPendingAliases = allPendingAliases.concat(res.data.pendingAliasReview);
        }
        if (res.data.unmappedColumns) {
          allUnmappedColumns = allUnmappedColumns.concat(res.data.unmappedColumns);
        }
      });

      if (successCount > 0) {
        if (iconEl) {
          iconEl.style.background = '#ECFDF5';
          iconEl.style.color = '#10B981';
          iconEl.innerHTML = '<i class="fas fa-check-circle"></i>';
        }
        if (titleEl) titleEl.textContent = 'Import Finished (' + successCount + ' Succeeded, ' + failCount + ' Failed)';

        var detailsHtml =
          '<strong>Total Rows Processed:</strong> ' + totalRows + '<br>' +
          '<strong>Imported:</strong> ' + totalImported + '<br>' +
          '<strong>Merged/Updated:</strong> ' + totalMerged + '<br>' +
          '<strong>Skipped:</strong> ' + totalSkipped + '<br>' +
          '<strong>Duplicates:</strong> ' + totalDuplicates + '<br>' +
          '<strong>Errors:</strong> ' + totalErrors;

        if (allPendingAliases.length > 0) {
          detailsHtml += '<div style="margin-top: 15px; padding: 10px; background: #F3F4F6; border-radius: 6px; text-align: left;">' +
            '<h4 style="margin: 0 0 10px 0; font-size: 14px; color: #374151;"><i class="fas fa-question-circle" style="color: #3B82F6;"></i> Pending Memory of Faculty to Confirm:</h4>';

          allPendingAliases.forEach(function (item, idx) {
            detailsHtml += '<div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px;">' +
              '<input type="checkbox" class="alias-review-cb" id="alias_review_' + idx + '" checked data-excel-name="' + item.excelName + '" data-leader-id="' + item.suggestedLeaderId + '" style="margin-right: 8px;">' +
              '<label for="alias_review_' + idx + '">Save memory "<strong>' + item.excelName + '</strong>" for Faculty <strong>' + item.suggestedLeaderName + '</strong></label>' +
              '</div>';
          });

          detailsHtml += '<button id="confirmAliasesBtn" class="btn btn-sm btn-primary" style="margin-top: 5px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 5px;"><i class="fas fa-check"></i> Confirm Selected Memories</button></div>';

          // Event delegation bound once — safe even when modal HTML is re-injected
          if (!window._aliasConfirmDelegated) {
            window._aliasConfirmDelegated = true;
            document.addEventListener('click', function (e) {
              var btn = e.target.closest('#confirmAliasesBtn');
              if (!btn) return;
              var checkboxes = document.querySelectorAll('.alias-review-cb');
              var pairs = [];
              checkboxes.forEach(function (cb) {
                if (cb.checked) {
                  pairs.push({
                    excelName: cb.getAttribute('data-excel-name'),
                    leaderId: parseInt(cb.getAttribute('data-leader-id'), 10)
                  });
                }
              });
              if (pairs.length === 0) {
                Toast.info('No Selection', 'Check at least one memory to save.');
                return;
              }
              btn.disabled = true;
              btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
              API.confirmAliases({ pairs: pairs }).then(function () {
                btn.innerHTML = '<i class="fas fa-check"></i> Memories Saved!';
                btn.style.background = '#10B981';
                Toast.success('Memories Saved', 'Faculty memories saved successfully.');
              }).catch(function (err) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Confirm Selected Memories';
                Toast.danger('Save Failed', err.message || 'Failed to save memories.');
              });
            });
          }
        }

        if (allUnmappedColumns.length > 0) {
          detailsHtml += '<div style="margin-top: 15px; padding: 10px; background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 6px; text-align: left;">' +
            '<h4 style="margin: 0 0 10px 0; font-size: 14px; color: #D97706;"><i class="fas fa-exclamation-triangle"></i> Unmapped Columns (Skipped):</h4>';
          allUnmappedColumns.forEach(function (col) {
            detailsHtml += '<div style="font-size: 12px; margin-bottom: 6px; color: #B45309;">' +
              '• <strong>' + col.columnName + '</strong> (e.g. ' + col.sampleValues.join(', ') + ')' +
              '</div>';
          });
          detailsHtml += '</div>';
        }

        if (detailsEl) detailsEl.innerHTML = detailsHtml;
        Toast.success('Import Completed', 'Import finished in ' + duration + 's');
        if (_apiDataLoaded) fetchAllData();
      } else {
        if (iconEl) {
          iconEl.style.background = '#FEF2F2';
          iconEl.style.color = '#EF4444';
          iconEl.innerHTML = '<i class="fas fa-times-circle"></i>';
        }
        if (titleEl) titleEl.textContent = 'Import Failed';
        if (detailsEl) detailsEl.innerHTML = '<strong>Reason:</strong> All file imports failed.';
        Toast.danger('Import Failed', 'All file imports failed.');
      }

      openModal('importResultModal');
    }).catch(function (err) {
      var duration = ((performance.now() - startTime) / 1000).toFixed(2);
      importBtn.disabled = false;
      importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data';

      var iconEl = document.getElementById('importResultIcon');
      var titleEl = document.getElementById('importResultTitle');
      var detailsEl = document.getElementById('importResultDetails');
      var durationEl = document.getElementById('importDurationSec');

      if (durationEl) durationEl.textContent = duration;
      if (iconEl) {
        iconEl.style.background = '#FEF2F2';
        iconEl.style.color = '#EF4444';
        iconEl.innerHTML = '<i class="fas fa-times-circle"></i>';
      }
      if (titleEl) titleEl.textContent = 'Import Failed';
      if (detailsEl) detailsEl.innerHTML = '<strong>Reason:</strong> ' + err.message;

      openModal('importResultModal');
      Toast.danger('Import Failed', err.message);
    });

    if (fileNameEl) { fileNameEl.style.display = 'none'; }
    fileInput.value = '';
    selectedImportFiles = [];
  });

  /* Download template button */
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      Toast.info('Template', 'Downloading alumni import template...');
      fetch('/api/v1/upload/template', {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Failed to download template');
          return res.blob();
        })
        .then(function (blob) {
          var url = window.URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'alumni_import_template.xlsx';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          Toast.success('Template', 'Template downloaded successfully');
        })
        .catch(function (err) {
          Toast.danger('Download Failed', err.message);
        });
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
        file: h.original_name || h.file_name || h.file || h.fileName || '-',
        imported: h.imported || h.recordsImported || 0,
        merged: h.merged || 0,
        duplicates: h.duplicates || h.duplicatesSkipped || 0,
        errors: h.errors || 0,
        by: h.importer_name || h.by || h.importedBy || '-',
        date: h.created_at || h.date || h.importedAt || '-',
        status: h.status || 'Completed',
        errorDetails: h.error_details || null,
        duration: h.duration_sec !== undefined && h.duration_sec !== null ? parseFloat(h.duration_sec).toFixed(1) + 's' : '-'
      };
    });
    // Reverse array to show oldest first and new imports next
    data.reverse();
  } else {
    data = [];
  }
  _importErrorDetails = data;
  var html = '';
  data.forEach(function (item, i) {
    var statusBadge = item.status === 'Completed'
      ? '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Completed</span>'
      : '<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Failed</span>';
    var formattedDate = item.date;
    if (item.date && item.date !== '-' && item.date.indexOf('T') > -1) {
      try {
        var d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        }
      } catch (e) { }
    }
    html += '<tr>';
    html += '<td>' + (i + 1) + '</td>';
    html += '<td>' + item.file + '</td>';
    html += '<td>' + item.imported + '</td>';
    html += '<td>' + (item.merged || 0) + '</td>';
    html += '<td>' + item.duplicates + '</td>';
    var errBtn = '';
    if (item.errors > 0) {
      var errData = item.errorDetails;
      var errMsg = errData ? (typeof errData === 'string' ? errData : JSON.stringify(errData, null, 2)) : 'No error details available. Check server logs.';
      var errIndex = i;
      errBtn = ' <button class="btn btn-sm btn-ghost" onclick="showImportErrors(' + errIndex + ')"><i class="fas fa-info-circle"></i></button>';
    }
    html += '<td>' + item.errors + errBtn + '</td>';
    html += '<td>' + item.by + '</td>';
    html += '<td>' + formattedDate + '</td>';
    html += '<td>' + item.duration + '</td>';
    html += '<td>' + statusBadge + '</td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

function showImportErrors(index) {
  var item = _importErrorDetails[index];
  if (!item) return;
  var errData = item.errorDetails;
  var content = document.getElementById('importErrorContent');
  if (!content) return;
  if (!errData) {
    content.innerHTML = '<div style="padding:12px;color:#6B7280;"><i class="fas fa-check-circle" style="color:#10B981;margin-right:6px;"></i> No error details available.</div>';
    openModal('importErrorModal');
    return;
  }
  var errLines = (typeof errData === 'string' ? errData : JSON.stringify(errData, null, 2)).split('\n');
  var listHtml = '';
  errLines.forEach(function (line) {
    var trimmed = line.trim();
    if (!trimmed) return;
    var icon = '<i class="fas fa-times-circle" style="color:#EF4444;margin-right:8px;flex-shrink:0;margin-top:3px;"></i>';
    listHtml += '<div style="display:flex;gap:4px;padding:6px 0;border-bottom:1px solid #FECACA;font-size:0.85rem;line-height:1.5;color:#991B1B;">' + icon + '<span>' + trimmed + '</span></div>';
  });
  var infoBadge = '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;"><span style="background:#DBEAFE;color:#1D4ED8;padding:4px 12px;border-radius:6px;font-size:0.8rem;font-weight:500;"><i class="fas fa-file"></i> ' + item.file + '</span><span style="background:#FEE2E2;color:#DC2626;padding:4px 12px;border-radius:6px;font-size:0.8rem;font-weight:500;"><i class="fas fa-exclamation-circle"></i> ' + item.errors + ' error(s)</span></div>';
  content.innerHTML = infoBadge + listHtml;
  openModal('importErrorModal');
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

function populateAuditActionFilter() {
  var select = document.getElementById('auditActionFilter');
  if (!select) return;
  var currentVal = select.value;
  var actions = [];
  if (_apiAuditLogs && _apiAuditLogs.records) {
    _apiAuditLogs.records.forEach(function (r) {
      if (r.action && actions.indexOf(r.action) === -1) actions.push(r.action);
    });
  } else {
    auditLogs.forEach(function (r) {
      if (r.action && actions.indexOf(r.action) === -1) actions.push(r.action);
    });
  }
  actions.sort();
  select.innerHTML = '<option value="all">All Actions</option>';
  actions.forEach(function (a) {
    select.innerHTML += '<option value="' + a + '">' + a.charAt(0).toUpperCase() + a.slice(1) + '</option>';
  });
  if (currentVal && Array.from(select.options).some(function(opt){ return opt.value === currentVal; })) {
    select.value = currentVal;
  } else {
    select.value = 'all';
  }
}

function fetchLatestAuditLogs(callback) {
  API.getAuditLogs({ page: 1, limit: 1000 }).then(function (res) {
    if (res.success && res.data) {
      _apiAuditLogs = res.data;
    }
    populateAuditActionFilter();
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
    var searchInput = document.getElementById('auditSearchInput');

    var actionVal = actionFilter ? actionFilter.value : 'all';
    var roleVal = roleFilter ? roleFilter.value : 'all';
    var fromVal = dateFrom ? dateFrom.value : '';
    var toVal = dateTo ? dateTo.value : '';
    var q = searchInput ? searchInput.value.toLowerCase().trim() : '';

    var activeCount = 0;
    if (actionVal !== 'all') activeCount++;
    if (roleVal !== 'all') activeCount++;
    if (fromVal) activeCount++;
    if (toVal) activeCount++;

    var badge = document.getElementById('auditActiveFilterBadge');
    if (badge) {
      if (activeCount > 0) {
        badge.textContent = activeCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

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
      if (actionVal !== 'all' && (item.action || '').toUpperCase() !== actionVal.toUpperCase()) match = false;
      if (roleVal !== 'all' && (item.role || '').toUpperCase() !== roleVal.toUpperCase()) match = false;
      if (fromVal) {
        var fromDate = new Date(fromVal);
        fromDate.setHours(0, 0, 0, 0);
        var itemDate = item.created_at ? new Date(item.created_at) : parseAuditDate(item.ts);
        if (itemDate < fromDate) match = false;
      }
      if (toVal) {
        var toDate = new Date(toVal);
        toDate.setHours(23, 59, 59, 999);
        var itemDate = item.created_at ? new Date(item.created_at) : parseAuditDate(item.ts);
        if (itemDate > toDate) match = false;
      }
      if (q) {
        var blob = (item.user + ' ' + item.role + ' ' + item.action + ' ' + item.target + ' ' + item.ip + ' ' + item.status + ' ' + item.ts).toLowerCase();
        if (blob.indexOf(q) === -1) match = false;
      }
      return match;
    });
    auditState.currentPage = 1;
    renderAuditLogTable();
  });
}

window.applyAuditFiltersModal = function () {
  applyAuditFilters();
  if (window.closeModal) window.closeModal('auditFilterModal');
};

window.filterAuditLogsLocal = function () {
  applyAuditFilters();
};

window.resetAuditFilters = function () {
  var actionFilter = document.getElementById('auditActionFilter');
  var roleFilter = document.getElementById('auditRoleFilter');
  var dateFrom = document.getElementById('auditDateFrom');
  var dateTo = document.getElementById('auditDateTo');
  var searchInput = document.getElementById('auditSearchInput');

  if (actionFilter) actionFilter.value = 'all';
  if (roleFilter) roleFilter.value = 'all';
  if (dateFrom) dateFrom.value = '';
  if (dateTo) dateTo.value = '';
  if (searchInput) searchInput.value = '';

  applyAuditFilters();
};

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
    columns = ['Name', 'Department', 'Batch', 'Company/Institution', 'Designation', 'Status'];
    if (_apiDataLoaded && _apiAlumni && _apiAlumni.records) {
      rows = _apiAlumni.records.map(function (a) {
        return [a.name || (a.first_name + ' ' + (a.last_name || '')).trim(), a.department || a.dept || '-', a.batch || '-', a.company || a.working_details || '-', a.designation || '-', a.assignment_status || 'Pending'];
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

window.viewAlumniDetails = function (id) {
  API.getAlumniById(id).then(function (res) {
    if (res && res.success && res.data) {
      populateViewModal(res.data);
    } else {
      // Fallback to cached data
      var records = [];
      if (_apiAlumni && Array.isArray(_apiAlumni.records)) {
        records = _apiAlumni.records;
      }
      var record = records.find(function (r) { return (r.alumni_id || r.id) == id; });
      if (record) {
        populateViewModal(record);
      } else {
        Toast.error('View Details', 'Alumni record not found');
      }
    }
  }).catch(function () {
    // Fallback to cached data on error
    var records = [];
    if (_apiAlumni && Array.isArray(_apiAlumni.records)) {
      records = _apiAlumni.records;
    }
    var record = records.find(function (r) { return (r.alumni_id || r.id) == id; });
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
  document.getElementById('vAlumniFatherName').innerText = record.father_name || record.fatherName || '-';
  document.getElementById('vAlumniEmail').innerText = record.email || '-';
  document.getElementById('vAlumniSecEmail').innerText = record.secondary_email || '-';
  document.getElementById('vAlumniPhone').innerText = record.phone || '-';
  document.getElementById('vAlumniSecPhone').innerText = record.secondary_phone || '-';

  var li = document.getElementById('vAlumniLinkedIn');
  if (record.linkedin_profile || record.linkedin) {
    var url = record.linkedin_profile || record.linkedin;
    var href = url.startsWith('http') ? url : 'https://' + url;
    var safeHref = href.replace(/'/g, "\\'");
    var isFb = href.toLowerCase().indexOf('facebook.com') !== -1 || href.toLowerCase().indexOf('fb.com') !== -1;
    var iconClass = isFb ? 'fab fa-facebook' : 'fab fa-linkedin';
    var iconColor = isFb ? '#1877F2' : '#0A66C2';
    var labelText = isFb ? 'Facebook Profile' : 'LinkedIn Profile';
    li.innerHTML = '<div style="display:flex;align-items:center;gap:14px;">' +
      '<a href="' + href + '" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:5px;color:' + iconColor + ';font-size:1rem;text-decoration:none;font-weight:600;"><i class="' + iconClass + '"></i> ' + labelText + '</a>' +
      '<button onclick="event.stopPropagation();showLinkPreview(this,\'' + safeHref + '\')" style="display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer;color:#64748B;font-size:0.85rem;padding:2px 4px;" title="Show URL"><i class="far fa-eye"></i> Preview</button>' +
      '</div>';
  } else {
    li.innerHTML = '-';
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
  var initials = (record.name || 'A').trim().split(/\s+/).map(function (w) { return w ? w[0] : ''; }).join('').toUpperCase().slice(0, 2);
  avatar.innerText = initials;

  openModal('viewAlumniModal');
}

/* ────────────────────────────────────────────────────────────
   19. SPREADSHEET-STYLE VIEW ALUMNI & DRAWER CONTROLS
   ──────────────────────────────────────────────────────────── */
var ssPage = 1;
var ssLimit = 10;
var ssTotal = 0;
var ssSearchQuery = '';
var ssSortColumn = 'alumni_id';
var ssSortDirection = 'DESC';

var ssColumns = [
  { key: 'register_no', label: 'Register Number', visible: true, width: 140 },
  { key: 'name', label: 'Name', visible: true, width: 160 },
  { key: 'father_name', label: 'Father Name', visible: true, width: 150 },
  { key: 'date_of_birth', label: 'Date of Birth', visible: true, width: 120 },
  { key: 'gender', label: 'Gender', visible: true, width: 80 },
  { key: 'department', label: 'Department', visible: true, width: 100 },
  { key: 'batch', label: 'Batch', visible: true, width: 80 },
  { key: 'email', label: 'Email', visible: true, width: 180 },
  { key: 'phone', label: 'Phone', visible: true, width: 120 },
  { key: 'company', label: 'Company/Institution', visible: true, width: 150 },
  { key: 'designation', label: 'Designation', visible: true, width: 150 },
  { key: 'experience', label: 'Experience', visible: true, width: 100 },
  { key: 'city', label: 'City', visible: true, width: 120 },
  { key: 'state', label: 'State', visible: true, width: 120 },
  { key: 'country', label: 'Country', visible: true, width: 120 },
  { key: 'linkedin_profile', label: 'LinkedIn/Facebook URL', visible: true, width: 180 },
  { key: 'assignment_status', label: 'Current Status', visible: true, width: 120 },
  { key: 'leader_name', label: 'Assigned Leader', visible: true, width: 150 },
  { key: 'member_name', label: 'Assigned Member', visible: true, width: 150 },
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
  var dept = document.getElementById('ssFilterDept').value;
  var batch = document.getElementById('ssFilterBatch').value;
  var status = document.getElementById('ssFilterStatus').value;
  var leaderId = document.getElementById('ssFilterLeader') ? document.getElementById('ssFilterLeader').value : '';
  var memberId = document.getElementById('ssFilterMember') ? document.getElementById('ssFilterMember').value : '';

  // Update filter dot indicator
  if (typeof updateSsFilterDot === 'function') updateSsFilterDot();

  // Load stats
  API.getAlumniStats().then(function (res) {
    if (res && res.success && res.data) {
      var d = res.data;
      document.getElementById('sumTotalAlumni').innerText = d.totalAlumni || 0;
      var available = 0, assigned = 0, completed = 0, pending = 0;
      if (Array.isArray(d.statusCounts)) {
        d.statusCounts.forEach(function (sc) {
          var s = String(sc.status || sc.assignment_status).toLowerCase();
          if (s === 'unassigned' || s === 'available' || sc.status === null) available += sc.count;
          else if (s === 'assigned_to_leader') assigned += sc.count;
          else if (s === 'completed') completed += sc.count;
          else pending += sc.count; // Pending or Draft
        });
      }
      document.getElementById('sumAvailable').innerText = available;
      document.getElementById('sumAssigned').innerText = assigned;
      document.getElementById('sumCompleted').innerText = completed;
      document.getElementById('sumPending').innerText = pending;
    }
  }).catch(function (err) {
    console.error('Failed to load stats:', err);
  });

  var dateFrom = document.getElementById('ssDateFrom') ? document.getElementById('ssDateFrom').value : null;
  var dateTo = document.getElementById('ssDateTo') ? document.getElementById('ssDateTo').value : null;
  var dateField = document.getElementById('ssDateField') ? document.getElementById('ssDateField').value : null;

  // Load alumni records
  var params = {
    page: ssPage,
    limit: ssLimit,
    search: ssSearchQuery || undefined,
    department: dept || undefined,
    batch: batch || undefined,
    status: status || undefined,
    leaderId: leaderId || undefined,
    memberId: memberId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    dateField: dateField || undefined
  };

  API.getAlumni(params).then(function (res) {
    if (res && res.success) {
      var records = (res.data && res.data.records) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
      var pagination = (res.data && res.data.pagination) ? res.data.pagination : null;
      ssTotal = (pagination && pagination.total) ? pagination.total : records.length;
      renderSpreadsheetTable(records);
      renderSpreadsheetPagination();
    } else {
      Toast.danger('Load Alumni', 'Failed to retrieve records');
    }
  }).catch(function (err) {
    console.error('Error fetching alumni:', err);
    Toast.danger('Load Alumni', 'An error occurred fetching records');
  });
};

window.renderSpreadsheetTable = function (data) {
  var headRow = document.getElementById('ssTableHeadRow');
  var body = document.getElementById('ssTableBody');
  if (!headRow || !body) return;

  // Render headers
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
  headHtml += '<th style="width: 200px; min-width: 200px; text-align: center; position: sticky; right: 0; background: var(--bg-light); z-index: 4;">Actions</th>';
  headRow.innerHTML = headHtml;

  // Render rows
  if (data.length === 0) {
    body.innerHTML = '<tr><td colspan="' + (ssColumns.filter(function (c) { return c.visible; }).length + 2) + '" style="text-align: center; padding: 24px; color: var(--text-muted);">No alumni records found</td></tr>';
    return;
  }

  var bodyHtml = '';
  data.forEach(function (row, idx) {
    var serial = (ssPage - 1) * ssLimit + idx + 1;
    bodyHtml += '<tr>';
    bodyHtml += '<td class="sticky-col" style="text-align: center; font-weight: 500;">' + serial + '</td>';

    ssColumns.forEach(function (col) {
      if (!col.visible) return;
      var val = row[col.key];
      if (val === null || val === undefined) {
        if (col.key === 'father_name') val = row.fatherName;
        else if (col.key === 'date_of_birth') val = row.dob;
      }
      var isDate = col.key === 'updated_date' || col.key === 'created_at' || col.key === 'date_of_birth';
      if (isDate) {
        val = val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
      } else if (col.key === 'assignment_status') {
        var status = val || 'Available';
        var badgeClass = 'badge-secondary';
        if (status === 'Completed') badgeClass = 'badge-success';
        else if (status === 'Pending') badgeClass = 'badge-warning';
        else if (status === 'ASSIGNED_TO_LEADER') badgeClass = 'badge-primary';
        else if (status === 'Draft') badgeClass = 'badge-info';
        else if (status === 'Reopened') badgeClass = 'badge-danger';
        val = '<span class="badge ' + badgeClass + '">' + (status === 'Reopened' ? '<i class="fas fa-undo"></i> Reopened' : status) + '</span>';
      } else if (col.key === 'email') {
        var primary = row.email || '';
        var secondary = row.secondary_email || '';
        if (primary && secondary) {
          val = '<div>' + primary + '</div><div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Sec: ' + secondary + '</div>';
        } else {
          val = primary || secondary || '-';
        }
      } else if (col.key === 'phone') {
        var primary = row.phone || '';
        var secondary = row.secondary_phone || '';
        if (primary && secondary) {
          val = '<div>' + primary + '</div><div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Sec: ' + secondary + '</div>';
        } else {
          val = primary || secondary || '-';
        }
      } else if (col.key === 'linkedin_profile') {
        var link = row.linkedin_profile || '';
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
        val = val || '-';
      }

      // Dynamic search query highlighting
      if (!isDate && col.key !== 'assignment_status' && col.key !== 'linkedin_profile' && val !== '-' && ssSearchQuery) {
        var cleanQuery = ssSearchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var regex = new RegExp('(' + cleanQuery + ')', 'gi');
        var escapeHtml = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
        val = String(val).replace(regex, function (match) { return '<mark style="background:#FEF08A;color:#854D0E;padding:0 2px;border-radius:2px;font-weight:600;">' + escapeHtml(match) + '</mark>'; });
      }

      bodyHtml += '<td>' + val + '</td>';
    });

    // Action column
    var isCompleted = row.assignment_status === 'Completed' || row.assignment_status === 'Updated';
    var actionButtons = '<div style="display:flex; gap:6px; justify-content:center; align-items:center; flex-wrap:nowrap;">';
    actionButtons += '<button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="viewAlumniDetails(' + row.alumni_id + ')" title="View Details"><i class="fas fa-eye"></i></button>';
    actionButtons += '<button class="btn btn-primary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="editAlumniRecord(' + row.alumni_id + ')" title="Edit Details"><i class="fas fa-edit"></i></button>';
    var _safeName = String(row.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    actionButtons += '<button class="btn btn-warning btn-sm" style="padding: 4px 8px; font-size: 0.75rem; color:#fff; background:#F59E0B;" onclick="openAssignmentHistoryDrawer(' + row.alumni_id + ', \'' + _safeName + '\')" title="History"><i class="fas fa-history"></i></button>';
    if (isCompleted || row.assignment_status === 'Completed') {
      actionButtons += '<button class="btn btn-sm" style="padding: 4px 8px; font-size: 0.75rem; color:#fff; background:#EF4444; border:none;" onclick="confirmAdminReopenModal(' + row.alumni_id + ', \'' + _safeName + '\')" title="Reopen Record"><i class="fas fa-redo-alt"></i></button>';
    }
    actionButtons += '</div>';

    bodyHtml += '<td style="position: sticky; right: 0; background: var(--bg-white); z-index: 2; border-left: 1px solid var(--border) !important; text-align: center; min-width: 200px; width: 200px; white-space: nowrap;">' + actionButtons + '</td>';
    bodyHtml += '</tr>';
  });
  body.innerHTML = bodyHtml;

  window.confirmAdminReopenModal = function (alumniId, name) {
    var msg = document.getElementById('reopenConfirmMsg');
    if (msg) msg.textContent = 'Are you sure you want to reopen record for "' + (name || 'Alumni') + '"? It will be marked as "Reopened" and returned to the assigned member.';
    var btn = document.getElementById('reopenConfirmBtn');
    if (btn) {
      btn.onclick = function () {
        closeModal('reopenConfirmModal');
        API.reopenAlumni(alumniId)
          .then(function (res) {
            if (res && res.success) {
              Toast.success('Reopened', 'Alumni record has been reopened and returned to assigned user');
              if (typeof fetchSpreadsheetData === 'function') fetchSpreadsheetData();
              if (typeof loadDashboardData === 'function') loadDashboardData();
            } else {
              Toast.danger('Reopen Failed', res ? res.message : 'Unknown error');
            }
          })
          .catch(function (err) {
            Toast.danger('Error', err.message || 'Failed to reopen record');
          });
      };
    }
    openModal('reopenConfirmModal');
  };

  window.adminReopenAlumniRecord = window.confirmAdminReopenModal;

  window.fetchRealtimeDatabaseData = function () {
    var overlay = document.getElementById('fetchProgressOverlay');
    var barFill = document.getElementById('fetchProgressBarFill');
    var percentText = document.getElementById('fetchProgressPercent');
    var titleText = document.getElementById('fetchProgressTitle');
    var subtitleText = document.getElementById('fetchProgressSubtitle');

    if (overlay) {
      overlay.style.display = 'flex';
      barFill.style.width = '15%';
      percentText.textContent = '15%';
      titleText.textContent = 'Fetching Database Data...';
      subtitleText.textContent = 'Connecting to database server...';
    }

    setTimeout(function () {
      if (barFill) { barFill.style.width = '55%'; percentText.textContent = '55%'; subtitleText.textContent = 'Updating stats & record views...'; }
      
      Promise.all([
        typeof fetchSpreadsheetData === 'function' ? fetchSpreadsheetData() : Promise.resolve(),
        typeof loadDashboardData === 'function' ? loadDashboardData() : Promise.resolve(),
        typeof fetchUsers === 'function' ? fetchUsers() : Promise.resolve()
      ]).then(function () {
        if (barFill) { barFill.style.width = '100%'; percentText.textContent = '100%'; titleText.textContent = 'Fetch Complete!'; subtitleText.textContent = 'All alumni data and metrics updated live.'; }
        setTimeout(function () {
          if (overlay) overlay.style.display = 'none';
          Toast.success('Data Synchronized', 'All database records and UI metrics updated successfully.');
        }, 600);
      }).catch(function (err) {
        if (overlay) overlay.style.display = 'none';
        Toast.danger('Sync Error', err.message || 'Failed to sync latest data.');
      });
    }, 400);
  };

  // Initialize resizers
  var table = document.querySelector('.spreadsheet-table');
  if (table) {
    initializeResizers(table);
  }
};

window.sortSpreadsheet = function (colKey) {
  if (ssSortColumn === colKey) {
    ssSortDirection = ssSortDirection === 'ASC' ? 'DESC' : 'ASC';
  } else {
    ssSortColumn = colKey;
    ssSortDirection = 'ASC';
  }
  // Local sort for fast feedback
  var tableBody = document.getElementById('ssTableBody');
  var rows = Array.from(tableBody.querySelectorAll('tr'));
  if (rows.length === 0 || rows[0].innerText.includes('No alumni')) return;

  var colIdx = ssColumns.filter(function (c) { return c.visible; }).findIndex(function (c) { return c.key === colKey; });
  if (colIdx === -1) return;
  colIdx += 1; // offset S.No

  rows.sort(function (a, b) {
    var valA = a.children[colIdx].innerText.trim();
    var valB = b.children[colIdx].innerText.trim();
    return ssSortDirection === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  rows.forEach(function (r) { tableBody.appendChild(r); });
};

window.initializeResizers = function (table) {
  var cols = table.querySelectorAll('th');
  cols.forEach(function (col) {
    var resizer = col.querySelector('.resizer');
    if (!resizer) return;

    var startX, startWidth;

    resizer.addEventListener('mousedown', function (e) {
      startX = e.clientX;
      startWidth = col.offsetWidth;
      resizer.classList.add('resizing');

      document.addEventListener('mousemove', doResize);
      document.addEventListener('mouseup', stopResize);
      e.preventDefault();
    });

    function doResize(e) {
      var width = startWidth + (e.clientX - startX);
      if (width > 60) {
        col.style.width = width + 'px';
        col.style.minWidth = width + 'px';
      }
    }

    function stopResize() {
      resizer.classList.remove('resizing');
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);
    }
  });
};

window.changeSpreadsheetPageSize = function (limit) {
  ssLimit = parseInt(limit, 10);
  ssPage = 1;
  fetchSpreadsheetData();
};

window.changeSpreadsheetPage = function (page) {
  ssPage = page;
  fetchSpreadsheetData();
};

window.renderSpreadsheetPagination = function () {
  var wrapper = document.getElementById('ssPagination');
  var info = document.getElementById('ssPaginationInfo');
  if (!wrapper || !info) return;

  var totalPages = Math.ceil(ssTotal / ssLimit) || 1;
  var start = (ssPage - 1) * ssLimit + 1;
  var end = Math.min(ssPage * ssLimit, ssTotal);
  if (ssTotal === 0) start = 0;

  info.innerText = 'Showing ' + start + ' to ' + end + ' of ' + ssTotal + ' entries';

  var html = '<button class="btn btn-outline btn-sm" onclick="changeSpreadsheetPage(1)" ' + (ssPage === 1 ? 'disabled' : '') + '><i class="fas fa-angle-double-left"></i></button>';
  html += '<button class="btn btn-outline btn-sm" onclick="changeSpreadsheetPage(' + (ssPage - 1) + ')" ' + (ssPage === 1 ? 'disabled' : '') + '><i class="fas fa-angle-left"></i></button>';

  var startPage = Math.max(1, ssPage - 2);
  var endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (var p = startPage; p <= endPage; p++) {
    html += '<button class="btn ' + (p === ssPage ? 'btn-primary' : 'btn-outline') + ' btn-sm" onclick="changeSpreadsheetPage(' + p + ')">' + p + '</button>';
  }

  html += '<button class="btn btn-outline btn-sm" onclick="changeSpreadsheetPage(' + (ssPage + 1) + ')" ' + (ssPage === totalPages ? 'disabled' : '') + '><i class="fas fa-angle-right"></i></button>';
  html += '<button class="btn btn-outline btn-sm" onclick="changeSpreadsheetPage(' + totalPages + ')" ' + (ssPage === totalPages ? 'disabled' : '') + '><i class="fas fa-angle-double-right"></i></button>';

  wrapper.innerHTML = html;
};

window.toggleColumnVisibilityMenu = function () {
  var menu = document.getElementById('columnVisibilityMenu');
  if (!menu) return;

  if (menu.style.display === 'block') {
    menu.style.display = 'none';
    return;
  }

  var html = '<div style="font-weight:600; margin-bottom:8px; font-size:0.85rem; border-bottom:1px solid var(--border); padding-bottom:6px; color:#1E293B;">Show/Hide Columns</div>';
  ssColumns.forEach(function (col) {
    html += '<label style="display:flex; align-items:center; gap:8px; font-size:0.8rem; margin-bottom:6px; cursor:pointer; font-weight:normal; color:#475569;">';
    html += '<input type="checkbox" ' + (col.visible ? 'checked' : '') + ' onchange="toggleColumnVisibility(\'' + col.key + '\')"> ' + col.label;
    html += '</label>';
  });

  var btn = document.getElementById('colVisibilityBtn');
  var rect = btn.getBoundingClientRect();
  menu.style.top = (rect.bottom + window.scrollY + 6) + 'px';
  menu.style.left = (rect.left + window.scrollX - 60) + 'px';
  menu.innerHTML = html;
  menu.style.display = 'block';

  // Click outside to close, checking we don't close when selecting the checkboxes
  setTimeout(function () {
    function clickOutsideMenu(e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', clickOutsideMenu);
      }
    }
    document.addEventListener('click', clickOutsideMenu);
  }, 50);
};

window.toggleColumnVisibility = function (key) {
  var col = ssColumns.find(function (c) { return c.key === key; });
  if (col) {
    col.visible = !col.visible;
    renderSpreadsheetTable();
  }
};

/* ────────────────────────────────────────────────────────────
   INTERACTIVE EXPORT ENGINE & CUSTOMIZATION MODAL
   ──────────────────────────────────────────────────────────── */
var _exportSelectedCols = {};

window.exportAlumniCSV = function () {
  window.openExportCustomizationModal();
};

window.openExportCustomizationModal = function () {
  // 1. Initialize default column selections
  if (typeof ssColumns !== 'undefined' && Array.isArray(ssColumns)) {
    ssColumns.forEach(function (col) {
      if (_exportSelectedCols[col.key] === undefined) {
        _exportSelectedCols[col.key] = true;
      }
    });
  }

  // 2. Populate filter dropdowns inside the export modal if empty
  populateExportModalFilterOptions();

  // 3. Sync active page/spreadsheet filters to export modal inputs
  syncSpreadsheetFiltersToExportModal();

  // 4. Render Column Choices
  renderExportColumnChips();

  // 5. Update stats banner count live
  onExportFilterChange();

  // 6. Display modal
  openModal('exportCustomizationModal');
};

window.populateExportModalFilterOptions = function () {
  var leaderSel = document.getElementById('expFilterLeader');
  var memberSel = document.getElementById('expFilterMember');
  var deptSel = document.getElementById('expFilterDept');
  var batchSel = document.getElementById('expFilterBatch');

  var srcLeader = document.getElementById('ssFilterLeader');
  var srcMember = document.getElementById('ssFilterMember');
  var srcDept = document.getElementById('ssFilterDept');
  var srcBatch = document.getElementById('ssFilterBatch');

  if (leaderSel && srcLeader && leaderSel.options.length <= 1) {
    leaderSel.innerHTML = srcLeader.innerHTML;
  }
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
  var srcLeader = document.getElementById('ssFilterLeader');
  var srcMember = document.getElementById('ssFilterMember');
  var srcDept = document.getElementById('ssFilterDept');
  var srcBatch = document.getElementById('ssFilterBatch');
  var srcStatus = document.getElementById('ssFilterStatus');
  var srcSearch = document.getElementById('ssSearch');

  var dashDept = document.getElementById('dashFilterDept');
  var dashBatch = document.getElementById('dashFilterBatch');
  var dashStatus = document.getElementById('dashFilterStatus');
  var dashSearch = document.getElementById('tableSearch');

  var expLeader = document.getElementById('expFilterLeader');
  var expMember = document.getElementById('expFilterMember');
  var expDept = document.getElementById('expFilterDept');
  var expBatch = document.getElementById('expFilterBatch');
  var expStatus = document.getElementById('expFilterStatus');
  var expSearch = document.getElementById('expFilterSearch');

  if (expLeader) expLeader.value = (srcLeader && srcLeader.value) || '';
  if (expMember) expMember.value = (srcMember && srcMember.value) || '';
  if (expDept) expDept.value = (srcDept && srcDept.value) || (dashDept && dashDept.value) || '';
  if (expBatch) expBatch.value = (srcBatch && srcBatch.value) || (dashBatch && dashBatch.value) || '';
  if (expStatus) expStatus.value = (srcStatus && srcStatus.value) || (dashStatus && dashStatus.value) || '';
  if (expSearch) expSearch.value = (srcSearch && srcSearch.value) || (dashSearch && dashSearch.value) || '';
};

window.resetExportModalFilters = function () {
  var expLeader = document.getElementById('expFilterLeader');
  var expMember = document.getElementById('expFilterMember');
  var expDept = document.getElementById('expFilterDept');
  var expBatch = document.getElementById('expFilterBatch');
  var expStatus = document.getElementById('expFilterStatus');
  var expSearch = document.getElementById('expFilterSearch');

  if (expLeader) expLeader.value = '';
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

    API.getAlumni(params).then(function (res) {
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
  var expLeader = document.getElementById('expFilterLeader');
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
    leaderId: expLeader && expLeader.value ? expLeader.value : undefined,
    memberId: expMember && expMember.value ? expMember.value : undefined
  };
};

window.renderExportColumnChips = function () {
  var container = document.getElementById('exportColsContainer');
  if (!container) return;

  var html = '';
  ssColumns.forEach(function (col) {
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
  ssColumns.forEach(function (col) {
    _exportSelectedCols[col.key] = selectState;
  });
  renderExportColumnChips();
  updateExportStatsBanner();
};

window.updateExportStatsBanner = function () {
  var colsEl = document.getElementById('expStatCols');
  var statusEl = document.getElementById('expStatStatus');

  var selectedCount = Object.keys(_exportSelectedCols).filter(function (k) { return _exportSelectedCols[k]; }).length;
  if (colsEl) colsEl.innerText = selectedCount + ' / ' + ssColumns.length;

  var expStatus = document.getElementById('expFilterStatus');
  var statusVal = expStatus ? expStatus.value : '';
  if (statusEl) statusEl.innerText = statusVal ? statusVal.toUpperCase() : 'ALL';
};

window.startExportDownloadProcess = function () {
  var selectedKeys = Object.keys(_exportSelectedCols).filter(function (k) { return _exportSelectedCols[k]; });
  if (selectedKeys.length === 0) {
    Toast.warning('Export', 'Please select at least one column to export.');
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
  if (sub) sub.innerText = 'Fetching alumni records matching selected filters...';
  if (percentEl) percentEl.innerText = '10%';

  var params = buildExportParams();

  API.getAlumni(params).then(function (res) {
    if (res && res.success) {
      var data = (res.data && res.data.records) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
      if (data.length === 0) {
        if (overlay) overlay.classList.remove('show');
        Toast.danger('Export', 'No alumni records found matching selected export filters.');
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

        var activeCols = ssColumns.filter(function (c) { return _exportSelectedCols[c.key]; });
        var csv = '\uFEFF';
        var headers = activeCols.map(function (c) { return c.label; });
        csv += headers.join(',') + '\r\n';

        data.forEach(function (row) {
          var line = activeCols.map(function (col) {
            var val = row[col.key];
            if ((val === null || val === undefined) && col.key === 'father_name') {
              val = row.fatherName || '';
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
        link.download = 'Alumni_Custom_Export_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        setTimeout(function () {
          if (overlay) overlay.classList.remove('show');
          Toast.success('Export Successful', 'Exported ' + data.length + ' records with ' + activeCols.length + ' selected columns!');
        }, 600);
      }, 700);

    } else {
      if (overlay) overlay.classList.remove('show');
      Toast.danger('Export Failed', 'Failed to retrieve alumni records for export.');
    }
  }).catch(function (err) {
    console.error('Export error:', err);
    if (overlay) overlay.classList.remove('show');
    Toast.error('Export Error', 'An error occurred during export: ' + (err.message || 'Network error'));
  });
};

window.openAssignmentHistoryDrawer = function (alumniId, alumniName) {
  var drawer = document.getElementById('assignmentHistoryDrawer');
  var list = document.getElementById('assignmentHistoryList');
  if (!drawer || !list) return;

  drawer.classList.add('show');
  drawer.classList.add('open');
  list.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem; color:var(--primary);"></i><div style="margin-top:10px; font-size:0.85rem; color:var(--text-muted);">Loading history...</div></div>';

  API.getAuditLogs({ target: 'Alumni#' + alumniId, page: 1, limit: 100 }).then(function (res) {
    if (res && res.success) {
      var logs = (res.data && res.data.records) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
      // Reverse array so oldest is at the top, new entries added down at the bottom
      logs.reverse();
      if (logs.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:40px 0; color:var(--text-muted);"><i class="fas fa-info-circle" style="font-size:1.5rem; margin-bottom:12px; display:block;"></i>No history records found for ' + alumniName + '</div>';
        return;
      }

      var html = '<h4 style="font-size:0.95rem; font-weight:600; margin-bottom:16px; color:var(--text-secondary);">History for ' + alumniName + '</h4>';
      html += '<div style="display:flex; flex-direction:column; gap:16px; border-left:2px solid var(--border); padding-left:16px; margin-left:8px;">';
      logs.forEach(function (log) {
        var dateStr = new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        html += '<div style="position:relative;">';
        html += '<div style="width:10px; height:10px; border-radius:50%; background:var(--primary); position:absolute; left:-22px; top:6px; border:2px solid var(--bg-white);"></div>';
        html += '<div style="font-size:0.75rem; color:var(--text-muted); font-weight:500;">' + dateStr + '</div>';
        html += '<div style="font-size:0.85rem; font-weight:600; color:var(--text-dark); margin-top:2px;">' + log.description + '</div>';
        html += '<div style="font-size:0.75rem; color:var(--text-muted); margin-top:1px;">By ' + log.username + ' (' + log.role_name + ')</div>';
        html += '</div>';
      });
      html += '</div>';
      list.innerHTML = html;
    } else {
      list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--danger);">Failed to load history logs</div>';
    }
  }).catch(function (err) {
    console.error('Drawer history error:', err);
    list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--danger);">Error loading history</div>';
  });
};

window.closeDrawer = function () {
  var drawer = document.getElementById('assignmentHistoryDrawer');
  if (drawer) {
    drawer.classList.remove('show');
    drawer.classList.remove('open');
  }
};


window.editAlumniRecord = function (id) {
  API.getAlumniById(id).then(function (res) {
    if (res && res.success && res.data) {
      var record = res.data;
      document.getElementById('editAlumniId').value = record.alumni_id;
      document.getElementById('editName').value = record.name || '';
      document.getElementById('editRegisterNo').value = record.register_no || '';
      document.getElementById('editGender').value = record.gender || 'Male';
      document.getElementById('editBatch').value = record.batch || '';
      var selectEl = document.getElementById('editDepartment');
      var rawDept = record.department || '';
      if (rawDept) {
        var exists = false;
        for (var i = 0; i < selectEl.options.length; i++) {
          if (selectEl.options[i].value === rawDept) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          var opt = document.createElement('option');
          opt.value = rawDept;
          opt.text = rawDept;
          selectEl.appendChild(opt);
        }
        selectEl.value = rawDept;
      } else {
        selectEl.value = '';
      }
      document.getElementById('editFatherName').value = record.father_name || record.pi_father_name || '';
      document.getElementById('editDOB').value = record.date_of_birth || record.dob || '';
      document.getElementById('editEmail').value = record.email || '';
      document.getElementById('editPhone').value = record.phone || '';
      document.getElementById('editSecondaryEmail').value = record.secondary_email || '';
      document.getElementById('editSecondaryPhone').value = record.secondary_phone || '';
      document.getElementById('editLinkedIn').value = record.linkedin_profile || '';
      document.getElementById('editCompany').value = record.company || '';
      document.getElementById('editDesignation').value = record.designation || '';
      document.getElementById('editCity').value = record.current_city || record.city || '';
      document.getElementById('editState').value = record.state || '';
      document.getElementById('editCountry').value = record.country || '';

      // Auto-toggle secondary containers if values exist
      var secEmailContainer = document.getElementById('editSecondaryEmailContainer');
      var secEmailBtn = secEmailContainer.previousElementSibling.querySelector('.btn-add-secondary');
      if (record.secondary_email) {
        secEmailContainer.style.display = 'block';
        if (secEmailBtn) secEmailBtn.innerHTML = '<i class="fas fa-minus-circle" style="color: #EF4444;"></i>';
      } else {
        secEmailContainer.style.display = 'none';
        if (secEmailBtn) secEmailBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
      }

      var secPhoneContainer = document.getElementById('editSecondaryPhoneContainer');
      var secPhoneBtn = secPhoneContainer.previousElementSibling.querySelector('.btn-add-secondary');
      if (record.secondary_phone) {
        secPhoneContainer.style.display = 'block';
        if (secPhoneBtn) secPhoneBtn.innerHTML = '<i class="fas fa-minus-circle" style="color: #EF4444;"></i>';
      } else {
        secPhoneContainer.style.display = 'none';
        if (secPhoneBtn) secPhoneBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
      }

      // Populate leader dropdown
      populateEditLeaderDropdown(record.assigned_leader_id || (record.assignedTo ? record.assignedTo.userId : null));

      document.getElementById('editStatus').value = record.assignment_status || 'Available';

      openModal('editAlumniModal');
    } else {
      Toast.error('Load Details', 'Alumni record not found');
    }
  }).catch(function (e) {
    console.error('Edit modal fetch error:', e);
    Toast.error('Load Details', 'Failed to retrieve alumni details');
  });
};

window.populateEditLeaderDropdown = function (selectedLeaderId) {
  var dropdown = document.getElementById('editLeader');
  if (!dropdown) return;

  // Get team leaders from API
  API.getUsers({ role: 'LEADER', page: 1, limit: 100 }).then(function (res) {
    if (res && res.success && res.data && res.data.records) {
      dropdown.innerHTML = '<option value="">No Leader Assigned</option>';
      res.data.records.forEach(function (leader) {
        var option = document.createElement('option');
        option.value = leader.user_id;
        option.text = leader.first_name + ' ' + leader.last_name;
        if (leader.user_id === selectedLeaderId) {
          option.selected = true;
        }
        dropdown.appendChild(option);
      });
    }
  }).catch(function (err) {
    console.error('Failed to load leaders:', err);
  });
};

window.submitEditAlumni = function () {
  var id = document.getElementById('editAlumniId').value;
  var data = {
    name: document.getElementById('editName').value,
    registerNo: document.getElementById('editRegisterNo').value,
    gender: document.getElementById('editGender').value,
    batch: document.getElementById('editBatch').value,
    department: document.getElementById('editDepartment').value,
    father_name: document.getElementById('editFatherName').value,
    date_of_birth: document.getElementById('editDOB').value,
    email: document.getElementById('editEmail').value,
    phone: document.getElementById('editPhone').value,
    secondary_email: document.getElementById('editSecondaryEmail').value,
    secondary_phone: document.getElementById('editSecondaryPhone').value,
    linkedin_profile: document.getElementById('editLinkedIn').value,
    company: document.getElementById('editCompany').value,
    designation: document.getElementById('editDesignation').value,
    city: document.getElementById('editCity').value,
    state: document.getElementById('editState').value,
    country: document.getElementById('editCountry').value
  };

  API.updateAlumni(id, data).then(function (res) {
    if (res && res.success) {
      Toast.success('Edit Alumni', 'Alumni record updated successfully');
      closeModal('editAlumniModal');
      fetchSpreadsheetData();
    } else {
      Toast.error('Edit Alumni', res.message || 'Failed to update record');
    }
  }).catch(function (err) {
    console.error('Update error:', err);
    Toast.error('Edit Alumni', 'An error occurred updating the record');
  });
};

// Auto refresh dashboard data disabled by user request

// ============================================================
// FEATURE 1 — REASSIGN / REDISTRIBUTE (Admin)
// ============================================================

var _reassignLeaderId = null;
var _reassignTeamId = null;
var _reassignPreviewData = null;

window.openReassignModal = function () {
  // Reset state
  _reassignLeaderId = null;
  _reassignTeamId = null;
  _reassignPreviewData = null;
  document.getElementById('reassignStep1').style.display = 'block';
  document.getElementById('reassignStep2').style.display = 'none';
  document.getElementById('reassignStep3').style.display = 'none';

  // Populate leader dropdown
  var sel = document.getElementById('reassignLeaderSelect');
  sel.innerHTML = '<option value="">Loading...</option>';
  API.getUsers({ role: 'LEADER', page: 1, limit: 100 }).then(function (res) {
    sel.innerHTML = '<option value="">-- Select Leader --</option>';
    if (res && res.success && res.data && res.data.records) {
      res.data.records.forEach(function (l) {
        var opt = document.createElement('option');
        opt.value = l.user_id;
        opt.text = l.first_name + ' ' + l.last_name;
        sel.appendChild(opt);
      });
    }
  }).catch(function () {
    sel.innerHTML = '<option value="">-- Failed to load --</option>';
  });

  openModal('reassignModal');
};

window.reassignLoadTeam = function () {
  var sel = document.getElementById('reassignLeaderSelect');
  var leaderId = parseInt(sel.value, 10);
  if (!leaderId) { Toast.warning('Reassign', 'Please select a leader.'); return; }
  _reassignLeaderId = leaderId;

  var token = localStorage.getItem('token');
  fetch('/api/v1/assignments/reassign/team-load?leaderId=' + leaderId, {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (!res || !res.success) { Toast.error('Reassign', res && res.message || 'Failed to load team.'); return; }
    var data = res.data;
    _reassignTeamId = data.team.team_id;

    document.getElementById('reassignTeamName').textContent = data.team.team_name;

    // Build workload table
    var tbl = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">' +
      '<thead><tr style="background:#F1F5F9;">' +
      '<th style="padding:8px;text-align:left;border-bottom:2px solid #E2E8F0;">Member</th>' +
      '<th style="padding:8px;text-align:center;border-bottom:2px solid #E2E8F0;">Assigned</th>' +
      '<th style="padding:8px;text-align:center;border-bottom:2px solid #E2E8F0;">Pending</th>' +
      '<th style="padding:8px;text-align:center;border-bottom:2px solid #E2E8F0;">Completed</th>' +
      '</tr></thead><tbody>';
    data.members.forEach(function (m) {
      tbl += '<tr>' +
        '<td style="padding:8px;border-bottom:1px solid #E2E8F0;">' + m.name + ' <small style="color:#94A3B8;">(' + m.role + ')</small></td>' +
        '<td style="padding:8px;text-align:center;border-bottom:1px solid #E2E8F0;">' + m.assigned_count + '</td>' +
        '<td style="padding:8px;text-align:center;border-bottom:1px solid #E2E8F0;color:var(--warning);font-weight:600;">' + m.pending_count + '</td>' +
        '<td style="padding:8px;text-align:center;border-bottom:1px solid #E2E8F0;color:var(--success);">' + m.completed_count + '</td>' +
        '</tr>';
    });
    tbl += '</tbody></table>';
    document.getElementById('reassignWorkloadTable').innerHTML = tbl;

    // Populate source select and target checkboxes
    var sourceSel = document.getElementById('reassignSourceSelect');
    var targetBox = document.getElementById('reassignTargetCheckboxes');
    sourceSel.innerHTML = '<option value="">-- Select Source --</option>';

    data.members.forEach(function (m) {
      var opt1 = document.createElement('option');
      opt1.value = m.user_id;
      opt1.text = m.name + ' (' + m.pending_count + ' pending)';
      sourceSel.appendChild(opt1);
    });

    var renderCheckboxes = function () {
      var srcId = parseInt(sourceSel.value, 10);
      targetBox.innerHTML = '';
      if (!srcId) {
        targetBox.innerHTML = '<span style="color:#94A3B8;font-size:0.8rem;">Select source first...</span>';
        return;
      }
      data.members.forEach(function (m) {
        if (m.user_id !== srcId) {
          var label = document.createElement('label');
          label.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:0.85rem;cursor:pointer;color:var(--text-dark);';
          label.innerHTML = '<input type="checkbox" class="reassign-target-cb" value="' + m.user_id + '" style="accent-color:var(--primary);width:16px;height:16px;"> ' + m.name + ' <small style="color:#64748B;">(' + m.pending_count + ' pending)</small>';
          targetBox.appendChild(label);
        }
      });
    };

    sourceSel.onchange = renderCheckboxes;
    renderCheckboxes();

    document.getElementById('reassignStep1').style.display = 'none';
    document.getElementById('reassignStep2').style.display = 'block';
  }).catch(function (err) {
    Toast.error('Reassign', 'Network error: ' + err.message);
  });
};

window.reassignPreview = function () {
  var sourceMemberId = parseInt(document.getElementById('reassignSourceSelect').value, 10);
  if (!sourceMemberId) { Toast.warning('Reassign', 'Please select a source member.'); return; }

  var cbs = document.querySelectorAll('.reassign-target-cb:checked');
  var targetMemberIds = Array.from(cbs).map(function (cb) { return parseInt(cb.value, 10); });
  if (targetMemberIds.length === 0) { Toast.warning('Reassign', 'Please select at least one target member.'); return; }

  var count = parseInt(document.getElementById('reassignCount').value, 10) || null;

  var token = localStorage.getItem('token');
  fetch('/api/v1/assignments/reassign/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ leaderId: _reassignLeaderId, sourceMemberId: sourceMemberId, targetMemberIds: targetMemberIds, count: count })
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (!res || !res.success) { Toast.error('Reassign', res && res.message || 'Preview failed.'); return; }
    _reassignPreviewData = res.data;

    var html = '<p style="color:var(--text-secondary);margin-bottom:14px;font-size:0.85rem;">' +
      'Moving <strong>' + res.data.totalMoving + '</strong> Pending alumni from <strong>' + res.data.sourceName + '</strong>:</p>';

    res.data.preview.forEach(function (group) {
      html += '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;background:#EFF6FF;padding:10px 14px;border-radius:8px;margin-bottom:8px;">' +
        '<strong style="color:#1E40AF;">' + group.targetName + '</strong>' +
        '<span style="background:#2563EB;color:#fff;padding:2px 10px;border-radius:20px;font-size:0.78rem;">' + group.count + ' records</span>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">' +
        '<thead><tr style="background:#F8FAFC;"><th style="padding:6px 10px;text-align:left;">Name</th><th style="padding:6px 10px;text-align:left;">Reg No</th><th style="padding:6px 10px;text-align:center;">Status</th></tr></thead><tbody>';
      group.alumni.forEach(function (a) {
        html += '<tr><td style="padding:5px 10px;">' + a.name + '</td><td style="padding:5px 10px;color:var(--text-secondary);">' + a.register_no + '</td>' +
          '<td style="padding:5px 10px;text-align:center;"><span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:10px;font-size:0.75rem;">Pending</span></td></tr>';
      });
      html += '</tbody></table></div>';
    });

    document.getElementById('reassignPreviewContent').innerHTML = html;
    document.getElementById('reassignStep2').style.display = 'none';
    document.getElementById('reassignStep3').style.display = 'block';
  }).catch(function (err) {
    Toast.error('Reassign', 'Network error: ' + err.message);
  });
};

window.reassignCommit = function () {
  if (!_reassignPreviewData) { Toast.error('Reassign', 'No preview data.'); return; }

  // Build allocations map: { targetMemberId: [assignment_id, ...] }
  var allocations = {};
  _reassignPreviewData.preview.forEach(function (group) {
    allocations[group.targetMemberId] = group.alumni.map(function (a) { return a.assignment_id; });
  });

  var token = localStorage.getItem('token');
  fetch('/api/v1/assignments/reassign/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      leaderId: _reassignLeaderId,
      sourceMemberId: _reassignPreviewData.sourceMemberId,
      allocations: allocations
    })
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (!res || !res.success) { Toast.error('Reassign', res && res.message || 'Commit failed.'); return; }
    Toast.success('Reassign', res.message || (res.data.moved + ' alumni reassigned!'));
    closeModal('reassignModal');
    if (typeof fetchSpreadsheetData === 'function') fetchSpreadsheetData();
  }).catch(function (err) {
    Toast.error('Reassign', 'Network error: ' + err.message);
  });
};

// Real-time sync listener (Feature 5)
if (typeof io !== 'undefined') {
  try {
    var socket = io();
    socket.emit('join', { role: 'ADMIN' });
    socket.on('assignmentsUpdated', function () {
      if (typeof fetchSpreadsheetData === 'function') fetchSpreadsheetData();
      if (typeof fetchAllData === 'function') fetchAllData();
    });
  } catch (e) {
    console.warn('Socket.io connection failed:', e);
  }
}

// ============================================================
// FEATURE 2 — DATABASE HEALTH CHECK (Admin)
// ============================================================

var _healthCurrentType = null;
var _healthCurrentPage = 1;
var _healthCurrentRows = [];

window.openDbHealthModal = function () {
  document.getElementById('dbHealthDetailContainer').style.display = 'none';
  document.getElementById('dbHealthSummaryPanel').innerHTML = '<p style="color:var(--text-secondary);">Scanning database records...</p>';
  openModal('dbHealthModal');

  var token = localStorage.getItem('token');
  fetch('/api/v1/health/db-summary', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (!res || !res.success) {
      document.getElementById('dbHealthSummaryPanel').innerHTML = '<p style="color:var(--danger);">Failed to load DB health summary.</p>';
      return;
    }
    var d = res.data;
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:14px;margin-bottom:20px;">' +
      '<div style="background:#F8FAFC;padding:12px;border-radius:10px;border:1px solid #E2E8F0;text-align:center;"><div style="font-size:0.75rem;color:#64748B;">Total Alumni</div><div style="font-size:1.4rem;font-weight:700;color:#0F172A;">' + d.totalAlumni + '</div></div>' +
      '<div style="background:#FEF2F2;padding:12px;border-radius:10px;border:1px solid #FCA5A5;text-align:center;"><div style="font-size:0.75rem;color:#991B1B;">Duplicates</div><div style="font-size:1.4rem;font-weight:700;color:#991B1B;">' + d.duplicates + '</div><button class="btn btn-sm btn-danger" style="margin-top:6px;font-size:0.7rem;padding:2px 8px;" onclick="loadDbHealthDetail(\'duplicates\')">View (' + d.duplicates + ')</button></div>' +
      '<div style="background:#FFFBEB;padding:12px;border-radius:10px;border:1px solid #FCD34D;text-align:center;"><div style="font-size:0.75rem;color:#92400E;">Pending</div><div style="font-size:1.4rem;font-weight:700;color:#92400E;">' + d.assignments.pending + '</div><button class="btn btn-sm btn-warning" style="margin-top:6px;font-size:0.7rem;padding:2px 8px;color:#fff;" onclick="loadDbHealthDetail(\'pending\')">View (' + d.assignments.pending + ')</button></div>' +
      '<div style="background:#F0FDF4;padding:12px;border-radius:10px;border:1px solid #86EFAC;text-align:center;"><div style="font-size:0.75rem;color:#166534;">Completed</div><div style="font-size:1.4rem;font-weight:700;color:#166534;">' + d.assignments.completed + '</div><button class="btn btn-sm btn-success" style="margin-top:6px;font-size:0.7rem;padding:2px 8px;" onclick="loadDbHealthDetail(\'completed\')">View (' + d.assignments.completed + ')</button></div>' +
      '<div style="background:#F1F5F9;padding:12px;border-radius:10px;border:1px solid #CBD5E1;text-align:center;"><div style="font-size:0.75rem;color:#475569;">Unassigned</div><div style="font-size:1.4rem;font-weight:700;color:#475569;">' + d.assignments.unassigned + '</div><button class="btn btn-sm btn-secondary" style="margin-top:6px;font-size:0.7rem;padding:2px 8px;" onclick="loadDbHealthDetail(\'unassigned\')">View (' + d.assignments.unassigned + ')</button></div>' +
      '</div>';

    html += '<h4 style="font-size:0.9rem;margin-bottom:10px;color:var(--text-primary);">Missing Fields Breakdown</h4>' +
      '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;"><thead><tr style="background:#F8FAFC;"><th style="padding:6px;text-align:left;">Field</th><th style="padding:6px;text-align:center;">Missing Count</th><th style="padding:6px;text-align:center;">Action</th></tr></thead><tbody>';

    Object.keys(d.missingFields).forEach(function (f) {
      var cnt = d.missingFields[f];
      html += '<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;text-transform:capitalize;">' + f.replace('_', ' ') + '</td>' +
        '<td style="padding:6px;border-bottom:1px solid #E2E8F0;text-align:center;font-weight:600;' + (cnt > 0 ? 'color:var(--danger);' : 'color:var(--text-secondary);') + '">' + cnt + '</td>' +
        '<td style="padding:6px;border-bottom:1px solid #E2E8F0;text-align:center;">' +
        '<button class="btn btn-secondary btn-sm" style="font-size:0.7rem;padding:2px 8px;" onclick="loadDbHealthDetail(\'missing_' + f + '\')">View Records</button>' +
        '</td></tr>';
    });
    html += '</tbody></table>';

    document.getElementById('dbHealthSummaryPanel').innerHTML = html;
  }).catch(function (err) {
    document.getElementById('dbHealthSummaryPanel').innerHTML = '<p style="color:var(--danger);">Network error scanning health.</p>';
  });
};

window.loadDbHealthDetail = function (type) {
  _healthCurrentType = type || _healthCurrentType;

  document.getElementById('dbHealthDetailTitle').textContent = 'Records Detail: ' + _healthCurrentType.replace('_', ' ').toUpperCase();
  document.getElementById('dbHealthDetailTable').innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Loading records...</p>';
  document.getElementById('dbHealthDetailContainer').style.display = 'block';

  var token = localStorage.getItem('token');
  fetch('/api/v1/health/db-detail?type=' + _healthCurrentType, {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (!res || !res.success) {
      document.getElementById('dbHealthDetailTable').innerHTML = '<p style="color:var(--danger);">Failed to load detail records.</p>';
      return;
    }
    var rows = res.data.rows || [];
    _healthCurrentRows = rows;
    var total = res.data.total || rows.length;

    var tbl = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;"><thead><tr style="background:#F1F5F9;">' +
      '<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E2E8F0;">Name</th>' +
      '<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E2E8F0;">Reg No</th>' +
      '<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E2E8F0;">Dept / Batch</th>' +
      '<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E2E8F0;">Assigned To</th>' +
      '<th style="padding:8px 10px;text-align:center;border-bottom:2px solid #E2E8F0;">Action</th></tr></thead><tbody>';

    if (rows.length === 0) {
      tbl += '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-secondary);">No records found matching criteria.</td></tr>';
    } else {
      rows.forEach(function (r) {
        tbl += '<tr>' +
          '<td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;font-weight:500;">' + r.name + '</td>' +
          '<td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;color:#64748B;">' + r.register_no + '</td>' +
          '<td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;">' + r.department + ' (' + r.batch + ')</td>' +
          '<td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;">' + (r.assigned_person_name || '<em style="color:#94A3B8;">Unassigned</em>') + '</td>' +
          '<td style="padding:8px 10px;border-bottom:1px solid #E2E8F0;text-align:center;">' +
          '<button class="btn btn-warning btn-sm" style="font-size:0.75rem;padding:3px 10px;color:#fff;border-radius:6px;" onclick="notifySingleAlumni(' + r.alumni_id + ')"><i class="fas fa-bell"></i> Notify</button>' +
          '</td>' +
          '</tr>';
      });
    }
    tbl += '</tbody></table>';
    document.getElementById('dbHealthDetailTable').innerHTML = tbl;
    document.getElementById('dbHealthDetailPagination').innerHTML = '<small style="color:var(--text-secondary);font-weight:600;">Total Records Found: ' + total + '</small>';
  }).catch(function (err) {
    document.getElementById('dbHealthDetailTable').innerHTML = '<p style="color:var(--danger);">Network error fetching details.</p>';
  });
};


window.notifyAllDbHealth = function () {
  if (!_healthCurrentRows || _healthCurrentRows.length === 0) {
    Toast.warning('Notify All', 'No records loaded in current view.');
    return;
  }
  var alumniIds = _healthCurrentRows.map(function (r) { return r.alumni_id; }).filter(Boolean);
  if (alumniIds.length === 0) {
    Toast.warning('Notify All', 'No valid alumni IDs found to notify.');
    return;
  }

  var btn = document.getElementById('notifyAllDbHealthBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Notifying...'; }

  var token = localStorage.getItem('token');
  fetch('/api/v1/health/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ alumniIds: alumniIds, message: 'Attention: Please complete missing information or process assigned alumni record.' })
  }).then(function (r) { return r.json(); }).then(function (res) {
    if (res && res.success) {
      Toast.success('Notify All', res.message || ('Notifications sent to ' + (res.data ? res.data.notified : alumniIds.length) + ' assignees.'));
    } else {
      Toast.error('Notify All', res && res.message || 'Failed to send notifications.');
    }
  }).catch(function () {
    Toast.error('Notify All', 'Network error sending notifications.');
  }).finally(function () {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Notify All Assignees'; }
  });
};



