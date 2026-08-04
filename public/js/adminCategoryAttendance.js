
/* ============================================================
   ALUMNI CATEGORY & ATTENDANCE SYSTEM FRONTEND CONTROLLERS
   ============================================================ */

/* ─── 1. ALUMNI CATEGORY SECTION ─── */
var catCurrentPage = 1;
var catRowsPerPage = 20;
var catSearchDebounce = null;
var catActiveGroupFilter = null; // e.g. { key: 'designation', val: 'Software Engineer' }

window.fetchCategoryGroups = function () {
  var dept = document.getElementById('catFilterDept') ? document.getElementById('catFilterDept').value : '';
  var batch = document.getElementById('catFilterBatch') ? document.getElementById('catFilterBatch').value : '';
  var status = document.getElementById('catFilterStatus') ? document.getElementById('catFilterStatus').value : '';

  // Populate dynamic dropdown options from filters API if empty
  if (typeof API !== 'undefined' && API.getAlumniFilters) {
    API.getAlumniFilters().then(function (res) {
      if (res && res.success && res.data) {
        var depts = res.data.departments || [];
        var batches = res.data.batches || [];
        var deptEl = document.getElementById('catFilterDept');
        var batchEl = document.getElementById('catFilterBatch');
        if (deptEl && deptEl.options.length <= 1) {
          depts.forEach(function (d) { deptEl.innerHTML += '<option value="' + d + '">' + d + '</option>'; });
        }
        if (batchEl && batchEl.options.length <= 1) {
          batches.forEach(function (b) { batchEl.innerHTML += '<option value="' + b + '">' + b + '</option>'; });
        }
      }
    }).catch(function (err) { console.error('Error fetching category filter options:', err); });
  }

  API.getAlumniCategoryGroups({ department: dept, batch: batch, status: status })
    .then(function (res) {
      if (res && res.success && res.data) {
        var d = res.data;
        var desigs = d.designations || [];
        var comps = d.companies || [];
        var cities = d.cities || [];
        var profs = d.professionTypes || [];

        var desigCount = desigs.filter(function (x) { return x.designation !== 'Not Specified'; }).length;
        var compCount = comps.filter(function (x) { return x.company !== 'Not Specified'; }).length;
        var cityCount = cities.filter(function (x) { return x.city !== 'Not Specified'; }).length;
        var govtCount = (profs.find(function (p) { return p.profession_type === 'Government'; }) || {}).count || 0;
        govtCount += (profs.find(function (p) { return p.profession_type === 'Business / Entrepreneur'; }) || {}).count || 0;

        if (document.getElementById('catCountDesignations')) document.getElementById('catCountDesignations').innerText = desigCount;
        if (document.getElementById('catCountCompanies')) document.getElementById('catCountCompanies').innerText = compCount;
        if (document.getElementById('catCountCities')) document.getElementById('catCountCities').innerText = cityCount;
        if (document.getElementById('catCountGovt')) document.getElementById('catCountGovt').innerText = govtCount;
      }
    })
    .catch(function (err) { console.error('Failed to load category groups:', err); });

  fetchCategoryAlumni(1);
};

window.debounceCategorySearch = function () {
  clearTimeout(catSearchDebounce);
  catSearchDebounce = setTimeout(function () {
    fetchCategoryAlumni(1);
  }, 300);
};

window.fetchCategoryAlumni = function (page) {
  catCurrentPage = page || 1;
  var dept = document.getElementById('catFilterDept') ? document.getElementById('catFilterDept').value : '';
  var batch = document.getElementById('catFilterBatch') ? document.getElementById('catFilterBatch').value : '';
  var profType = document.getElementById('catFilterProfType') ? document.getElementById('catFilterProfType').value : '';
  var status = document.getElementById('catFilterStatus') ? document.getElementById('catFilterStatus').value : '';
  var search = document.getElementById('catSearchInput') ? document.getElementById('catSearchInput').value : '';

  var params = {
    page: catCurrentPage,
    limit: catRowsPerPage,
    department: dept || undefined,
    batch: batch || undefined,
    professionType: profType || undefined,
    status: status || undefined,
    search: search || undefined
  };

  if (catActiveGroupFilter) {
    params[catActiveGroupFilter.key] = catActiveGroupFilter.val;
  }

  var tbody = document.getElementById('catTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#94A3B8;"><i class="fas fa-spinner fa-spin"></i> Loading categorized alumni...</td></tr>';

  API.getAlumniCategoryList(params)
    .then(function (res) {
      if (res && res.success) {
        var data = (res.data && res.data.records) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
        var total = (res.data && res.data.pagination) ? res.data.pagination.total : data.length;
        renderCategoryTable(data);
        renderCategoryPagination(total);
      } else {
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#EF4444;">Failed to load category records</td></tr>';
      }
    })
    .catch(function (err) {
      console.error('Error fetching category alumni list:', err);
      if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#EF4444;">Network error loading category data</td></tr>';
    });
};

function renderCategoryTable(data) {
  var tbody = document.getElementById('catTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#94A3B8;">No alumni records matching the selected categories</td></tr>';
    return;
  }

  var html = '';
  data.forEach(function (row) {
    var profClass = 'badge-secondary';
    var pt = row.profession_type || 'Unknown';
    if (pt === 'Government') profClass = 'badge-success';
    else if (pt === 'Private Sector') profClass = 'badge-primary';
    else if (pt === 'Business / Entrepreneur') profClass = 'badge-warning';
    else if (pt === 'Higher Studies') profClass = 'badge-info';

    var stClass = 'badge-secondary';
    var st = row.assignment_status || 'Unassigned';
    if (st === 'Completed') stClass = 'badge-success';
    else if (st === 'Pending') stClass = 'badge-warning';
    else if (st === 'Draft') stClass = 'badge-info';

    html += '<tr>';
    html += '<td style="padding:10px 12px;font-weight:600;">' + (row.register_no || '-') + '</td>';
    html += '<td style="padding:10px 12px;font-weight:600;color:#1E293B;">' + (row.name || 'Unknown') + '</td>';
    html += '<td style="padding:10px 12px;">' + (row.department || '-') + '</td>';
    html += '<td style="padding:10px 12px;">' + (row.batch || '-') + '</td>';
    html += '<td style="padding:10px 12px;font-weight:500;">' + (row.designation || '-') + '</td>';
    html += '<td style="padding:10px 12px;">' + (row.company || '-') + '</td>';
    html += '<td style="padding:10px 12px;">' + (row.current_city || row.city || '-') + '</td>';
    html += '<td style="padding:10px 12px;"><span class="badge ' + profClass + '">' + pt + '</span></td>';
    html += '<td style="padding:10px 12px;"><span class="badge ' + stClass + '">' + st + '</span></td>';
    html += '</tr>';
  });

  tbody.innerHTML = html;
}

function renderCategoryPagination(total) {
  var info = document.getElementById('catPaginationInfo');
  var btns = document.getElementById('catPaginationBtns');
  if (!info || !btns) return;

  var totalPages = Math.ceil(total / catRowsPerPage) || 1;
  var start = (catCurrentPage - 1) * catRowsPerPage + 1;
  var end = Math.min(catCurrentPage * catRowsPerPage, total);
  if (total === 0) start = 0;

  info.innerText = 'Showing ' + start + ' to ' + end + ' of ' + total + ' entries';

  var html = '<button class="btn btn-outline btn-sm" onclick="fetchCategoryAlumni(' + Math.max(1, catCurrentPage - 1) + ')" ' + (catCurrentPage === 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i> Prev</button>';
  html += '<span style="padding:4px 10px;font-size:0.85rem;font-weight:600;align-self:center;">' + catCurrentPage + ' / ' + totalPages + '</span>';
  html += '<button class="btn btn-outline btn-sm" onclick="fetchCategoryAlumni(' + Math.min(totalPages, catCurrentPage + 1) + ')" ' + (catCurrentPage === totalPages ? 'disabled' : '') + '>Next <i class="fas fa-chevron-right"></i></button>';

  btns.innerHTML = html;
}

window.resetCategoryFilters = function () {
  if (document.getElementById('catFilterDept')) document.getElementById('catFilterDept').value = '';
  if (document.getElementById('catFilterBatch')) document.getElementById('catFilterBatch').value = '';
  if (document.getElementById('catFilterProfType')) document.getElementById('catFilterProfType').value = '';
  if (document.getElementById('catFilterStatus')) document.getElementById('catFilterStatus').value = '';
  if (document.getElementById('catSearchInput')) document.getElementById('catSearchInput').value = '';
  catActiveGroupFilter = null;
  fetchCategoryGroups();
};

window.exportCategoryData = function () {
  var dept = document.getElementById('catFilterDept') ? document.getElementById('catFilterDept').value : '';
  var batch = document.getElementById('catFilterBatch') ? document.getElementById('catFilterBatch').value : '';
  var profType = document.getElementById('catFilterProfType') ? document.getElementById('catFilterProfType').value : '';
  var status = document.getElementById('catFilterStatus') ? document.getElementById('catFilterStatus').value : '';
  var search = document.getElementById('catSearchInput') ? document.getElementById('catSearchInput').value : '';

  API.getAlumniCategoryList({ page: 1, limit: 10000, department: dept, batch: batch, professionType: profType, status: status, search: search })
    .then(function (res) {
      if (res && res.success) {
        var records = (res.data && res.data.records) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
        if (records.length === 0) {
          Toast.warning('Category Export', 'No records found matching current category filters.');
          return;
        }
        var csv = '\uFEFFRegister No,Name,Department,Batch,Designation,Company,City / Location,Profession Type,Status,Email,Phone\r\n';
        records.forEach(function (r) {
          var line = [
            '"\t' + (r.register_no || '') + '"',
            '"' + (r.name || '').replace(/"/g, '""') + '"',
            '"' + (r.department || '').replace(/"/g, '""') + '"',
            '"' + (r.batch || '') + '"',
            '"' + (r.designation || '').replace(/"/g, '""') + '"',
            '"' + (r.company || '').replace(/"/g, '""') + '"',
            '"' + (r.current_city || r.city || '').replace(/"/g, '""') + '"',
            '"' + (r.profession_type || '') + '"',
            '"' + (r.assignment_status || '') + '"',
            '"' + (r.email || '') + '"',
            '"\t' + (r.phone || '') + '"'
          ];
          csv += line.join(',') + '\r\n';
        });

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Alumni_Category_Export_' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        Toast.success('Export Complete', 'Exported ' + records.length + ' categorized records!');
      }
    }).catch(function (err) {
      Toast.error('Export Error', err.message || 'Failed to export category data');
    });
};


/* ─── 2. AUTO ATTENDANCE SYSTEM SECTION ─── */
var attCurrentPage = 1;
var attRowsPerPage = 20;

window.fetchAttendanceData = function () {
  // Populate available Tuesday dates dropdown
  API.getAttendanceDates().then(function (res) {
    if (res && res.success && Array.isArray(res.data)) {
      var select = document.getElementById('attDateSelect');
      if (select) {
        var currentVal = select.value;
        var html = '<option value="">Latest Tuesday</option>';
        res.data.forEach(function (d) {
          var dateStr = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
          html += '<option value="' + dateStr + '">' + dateStr + '</option>';
        });
        select.innerHTML = html;
        if (currentVal) select.value = currentVal;
      }
    }
  }).catch(function (err) { console.error('Error fetching attendance dates:', err); });

  var selectedDate = document.getElementById('attDateSelect') ? document.getElementById('attDateSelect').value : '';

  API.getAttendanceSummary(selectedDate).then(function (res) {
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      var s = res.data[0];
      if (document.getElementById('attCountPresent')) document.getElementById('attCountPresent').innerText = s.present_count || 0;
      if (document.getElementById('attCountLate')) document.getElementById('attCountLate').innerText = s.late_count || 0;
      if (document.getElementById('attCountAbsent')) document.getElementById('attCountAbsent').innerText = s.absent_count || 0;
    } else {
      if (document.getElementById('attCountPresent')) document.getElementById('attCountPresent').innerText = 0;
      if (document.getElementById('attCountLate')) document.getElementById('attCountLate').innerText = 0;
      if (document.getElementById('attCountAbsent')) document.getElementById('attCountAbsent').innerText = 0;
    }
  }).catch(function (err) { console.error('Error fetching attendance summary:', err); });

  fetchAttendanceReport(1);
};

window.fetchAttendanceReport = function (page) {
  attCurrentPage = page || 1;
  var selectedDate = document.getElementById('attDateSelect') ? document.getElementById('attDateSelect').value : '';
  var status = document.getElementById('attFilterStatus') ? document.getElementById('attFilterStatus').value : '';
  var role = document.getElementById('attFilterRole') ? document.getElementById('attFilterRole').value : '';

  var tbody = document.getElementById('attTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#94A3B8;"><i class="fas fa-spinner fa-spin"></i> Loading attendance logs...</td></tr>';

  API.getAttendanceReport({ page: attCurrentPage, limit: attRowsPerPage, date: selectedDate || undefined, status: status || undefined, role: role || undefined })
    .then(function (res) {
      if (res && res.success) {
        var data = (res.data && res.data.records) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
        var total = (res.data && res.data.pagination) ? res.data.pagination.total : data.length;
        renderAttendanceTable(data);
        renderAttendancePagination(total);
      } else {
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#EF4444;">Failed to load attendance logs</td></tr>';
      }
    })
    .catch(function (err) {
      console.error('Error fetching attendance report:', err);
      if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#EF4444;">Network error loading attendance logs</td></tr>';
    });
};

function renderAttendanceTable(data) {
  var tbody = document.getElementById('attTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#94A3B8;">No attendance records found for the selected filter</td></tr>';
    return;
  }

  var html = '';
  data.forEach(function (row) {
    var dateStr = row.attendance_date ? new Date(row.attendance_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    var timeStr = row.login_time ? new Date(row.login_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'No Login';

    var statusBadge = '';
    if (row.status === 'Present') {
      statusBadge = '<span class="badge badge-success" style="background:#10B981;color:#fff;padding:6px 12px;border-radius:20px;font-weight:600;"><i class="fas fa-check-circle"></i> Present (On-Time)</span>';
    } else if (row.status === 'Late') {
      statusBadge = '<span class="badge badge-warning" style="background:#F59E0B;color:#fff;padding:6px 12px;border-radius:20px;font-weight:600;"><i class="fas fa-clock"></i> Late (Delayed)</span>';
    } else {
      statusBadge = '<span class="badge badge-danger" style="background:#EF4444;color:#fff;padding:6px 12px;border-radius:20px;font-weight:600;"><i class="fas fa-times-circle"></i> Absent</span>';
    }

    html += '<tr>';
    html += '<td style="padding:12px;font-weight:600;">' + dateStr + '</td>';
    html += '<td style="padding:12px;font-weight:600;color:#1E293B;">' + (row.user_name || 'Unknown') + '</td>';
    html += '<td style="padding:12px;"><span class="badge badge-secondary">' + (row.role || '-') + '</span></td>';
    html += '<td style="padding:12px;">' + (row.department || '-') + '</td>';
    html += '<td style="padding:12px;font-family:monospace;font-weight:600;">' + timeStr + '</td>';
    html += '<td style="padding:12px;">' + statusBadge + '</td>';
    html += '<td style="padding:12px;font-size:0.85rem;color:#64748B;">' + (row.marked_by || 'system') + '</td>';
    html += '</tr>';
  });

  tbody.innerHTML = html;
}

function renderAttendancePagination(total) {
  var info = document.getElementById('attPaginationInfo');
  var btns = document.getElementById('attPaginationBtns');
  if (!info || !btns) return;

  var totalPages = Math.ceil(total / attRowsPerPage) || 1;
  var start = (attCurrentPage - 1) * attRowsPerPage + 1;
  var end = Math.min(attCurrentPage * attRowsPerPage, total);
  if (total === 0) start = 0;

  info.innerText = 'Showing ' + start + ' to ' + end + ' of ' + total + ' entries';

  var html = '<button class="btn btn-outline btn-sm" onclick="fetchAttendanceReport(' + Math.max(1, attCurrentPage - 1) + ')" ' + (attCurrentPage === 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i> Prev</button>';
  html += '<span style="padding:4px 10px;font-size:0.85rem;font-weight:600;align-self:center;">' + attCurrentPage + ' / ' + totalPages + '</span>';
  html += '<button class="btn btn-outline btn-sm" onclick="fetchAttendanceReport(' + Math.min(totalPages, attCurrentPage + 1) + ')" ' + (attCurrentPage === totalPages ? 'disabled' : '') + '>Next <i class="fas fa-chevron-right"></i></button>';

  btns.innerHTML = html;
}

window.triggerMarkAbsent = function () {
  var selectedDate = document.getElementById('attDateSelect') ? document.getElementById('attDateSelect').value : '';
  if (!selectedDate) {
    selectedDate = new Date().toISOString().slice(0, 10);
  }

  if (!confirm('Mark absentees for ' + selectedDate + '? This will record "Absent" status for all active Users (Admins, Leaders & Members) who did not log in between 1:15 PM - 2:45 PM IST.')) {
    return;
  }

  API.markAttendanceAbsent(selectedDate)
    .then(function (res) {
      if (res && res.success) {
        Toast.success('Absentees Marked', res.message || 'Absent status recorded successfully.');
        fetchAttendanceData();
      } else {
        Toast.error('Mark Absent Failed', res ? res.message : 'Failed to mark absentees.');
      }
    })
    .catch(function (err) {
      Toast.error('Error', err.message || 'Failed to trigger absent marking.');
    });
};
