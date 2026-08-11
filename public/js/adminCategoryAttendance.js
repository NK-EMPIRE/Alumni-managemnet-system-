
/* ============================================================
   ALUMNI CATEGORY & ATTENDANCE SYSTEM FRONTEND CONTROLLERS
   ============================================================ */

/* ─── 1. ALUMNI CATEGORY SECTION ─── */
var catCurrentPage = 1;
var catRowsPerPage = 20;
var catSearchDebounce = null;
var catActiveGroupFilter = null; // e.g. { key: 'designation', val: 'Software Engineer' }

var catViewMode = 'cards'; // 'cards' or 'table'

window.setCategoryViewMode = function (mode) {
  catViewMode = mode;
  var btnCards = document.getElementById('btnCatViewCards');
  var btnTable = document.getElementById('btnCatViewTable');

  if (btnCards && btnTable) {
    if (mode === 'cards') {
      btnCards.style.background = '#EFF6FF'; btnCards.style.color = '#2563EB'; btnCards.style.fontWeight = '600';
      btnTable.style.background = 'transparent'; btnTable.style.color = '#64748B'; btnTable.style.fontWeight = 'normal';
    } else {
      btnTable.style.background = '#EFF6FF'; btnTable.style.color = '#2563EB'; btnTable.style.fontWeight = '600';
      btnCards.style.background = 'transparent'; btnCards.style.color = '#64748B'; btnCards.style.fontWeight = 'normal';
    }
  }
  fetchCategoryAlumni(catCurrentPage);
};

window.fetchCategoryGroups = function () {
  var dept = document.getElementById('catFilterDept') ? document.getElementById('catFilterDept').value : '';
  var batch = document.getElementById('catFilterBatch') ? document.getElementById('catFilterBatch').value : '';
  var onlyUpdated = document.getElementById('catFilterOnlyUpdated') ? document.getElementById('catFilterOnlyUpdated').checked : true;

  // Always reload dept/batch dropdowns from filters API
  if (typeof API !== 'undefined' && API.getAlumniFilters) {
    API.getAlumniFilters().then(function (res) {
      if (res && res.success && res.data) {
        var depts = res.data.departments || [];
        var batches = res.data.batches || [];
        var savedDept = document.getElementById('catFilterDept') ? document.getElementById('catFilterDept').value : '';
        var savedBatch = document.getElementById('catFilterBatch') ? document.getElementById('catFilterBatch').value : '';
        var deptEl = document.getElementById('catFilterDept');
        var batchEl = document.getElementById('catFilterBatch');
        if (deptEl) {
          deptEl.innerHTML = '<option value="">All Departments</option>';
          depts.forEach(function (d) { deptEl.innerHTML += '<option value="' + d + '">' + d + '</option>'; });
          if (savedDept) deptEl.value = savedDept;
        }
        if (batchEl) {
          batchEl.innerHTML = '<option value="">All Batches</option>';
          batches.forEach(function (b) { batchEl.innerHTML += '<option value="' + b + '">' + b + '</option>'; });
          if (savedBatch) batchEl.value = savedBatch;
        }
      }
    }).catch(function (err) { console.error('Error fetching category filter options:', err); });
  }

  // Always reload role/company/city dropdowns from category groups
  API.getAlumniCategoryGroups({ department: dept, batch: batch, onlyUpdated: onlyUpdated })
    .then(function (res) {
      if (res && res.success && res.data) {
        var d = res.data;
        var desigs = d.designations || [];
        var comps = d.companies || [];
        var cities = d.cities || [];
        var profs = d.professionTypes || [];

        // Saved values to restore after reload
        var savedDesig = document.getElementById('catFilterDesignation') ? document.getElementById('catFilterDesignation').value : '';
        var savedComp = document.getElementById('catFilterCompany') ? document.getElementById('catFilterCompany').value : '';
        var savedCity = document.getElementById('catFilterCity') ? document.getElementById('catFilterCity').value : '';

        // Repopulate Designation dropdown
        var desigSelect = document.getElementById('catFilterDesignation');
        if (desigSelect) {
          desigSelect.innerHTML = '<option value="">All Roles / Designations</option>';
          desigs.forEach(function (item) {
            if (item.designation && item.designation !== 'Not Specified') {
              desigSelect.innerHTML += '<option value="' + item.designation + '">' + item.designation + ' (' + item.count + ')</option>';
            }
          });
          if (savedDesig) desigSelect.value = savedDesig;
        }

        // Repopulate Company dropdown
        var compSelect = document.getElementById('catFilterCompany');
        if (compSelect) {
          compSelect.innerHTML = '<option value="">All Companies</option>';
          comps.forEach(function (item) {
            if (item.company && item.company !== 'Not Specified') {
              compSelect.innerHTML += '<option value="' + item.company + '">' + item.company + ' (' + item.count + ')</option>';
            }
          });
          if (savedComp) compSelect.value = savedComp;
        }

        // Repopulate City dropdown
        var citySelect = document.getElementById('catFilterCity');
        if (citySelect) {
          citySelect.innerHTML = '<option value="">All Locations</option>';
          cities.forEach(function (item) {
            if (item.city && item.city !== 'Not Specified') {
              citySelect.innerHTML += '<option value="' + item.city + '">' + item.city + ' (' + item.count + ')</option>';
            }
          });
          if (savedCity) citySelect.value = savedCity;
        }

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
  var desig = document.getElementById('catFilterDesignation') ? document.getElementById('catFilterDesignation').value : '';
  var comp = document.getElementById('catFilterCompany') ? document.getElementById('catFilterCompany').value : '';
  var city = document.getElementById('catFilterCity') ? document.getElementById('catFilterCity').value : '';
  var profType = document.getElementById('catFilterProfType') ? document.getElementById('catFilterProfType').value : '';
  var search = document.getElementById('catSearchInput') ? document.getElementById('catSearchInput').value : '';
  var onlyUpdated = document.getElementById('catFilterOnlyUpdated') ? document.getElementById('catFilterOnlyUpdated').checked : true;

  var params = {
    page: catCurrentPage,
    limit: catRowsPerPage,
    department: dept || undefined,
    batch: batch || undefined,
    designation: desig || undefined,
    company: comp || undefined,
    city: city || undefined,
    professionType: profType || undefined,
    search: search || undefined,
    onlyUpdated: onlyUpdated
  };

  var tbody = document.getElementById('catTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#94A3B8;"><i class="fas fa-spinner fa-spin"></i> Loading categorized alumni...</td></tr>';

  API.getAlumniCategoryList(params)
    .then(function (res) {
      if (res && (res.success || res.data)) {
        var d = res.data !== undefined ? res.data : res;
        var data = (d && d.records) ? d.records : (Array.isArray(d) ? d : []);
        var total = (d && d.pagination) ? d.pagination.total : data.length;
        renderCategoryDataView(data);
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

function renderCategoryDataView(data) {
  var tbody = document.getElementById('catTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#94A3B8;">No updated alumni records found matching the selected filters</td></tr>';
    return;
  }

  if (catViewMode === 'cards') {
    var cardsHtml = '<tr><td colspan="9" style="padding:10px 0;"><div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px;">';
    data.forEach(function (row) {
      var profClass = 'badge-secondary';
      var pt = row.profession_type || 'Unknown';
      if (pt === 'Government') profClass = 'badge-success';
      else if (pt === 'Private Sector') profClass = 'badge-primary';
      else if (pt === 'Business / Entrepreneur') profClass = 'badge-warning';

      cardsHtml += `
        <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.02);display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
              <div>
                <h4 style="margin:0 0 2px;font-size:1rem;font-weight:700;color:#0F172A;">${row.name || 'Unknown'}</h4>
                <span style="font-size:0.78rem;color:#64748B;font-weight:600;">${row.register_no || '-'} • ${row.department || ''} (${row.batch || ''})</span>
              </div>
              <span class="badge ${profClass}" style="font-size:0.7rem;">${pt}</span>
            </div>
            
            <div style="margin-bottom:12px;background:#F8FAFC;padding:10px;border-radius:8px;border:1px solid #F1F5F9;">
              <div style="font-size:0.85rem;font-weight:700;color:#2563EB;margin-bottom:2px;"><i class="fas fa-briefcase" style="margin-right:6px;"></i>${row.designation || 'Role Not Specified'}</div>
              <div style="font-size:0.8rem;color:#334155;font-weight:500;"><i class="fas fa-building" style="margin-right:6px;color:#64748B;"></i>${row.company || 'Company Not Specified'}</div>
              <div style="font-size:0.75rem;color:#64748B;margin-top:2px;"><i class="fas fa-map-marker-alt" style="margin-right:6px;color:#EF4444;"></i>${row.current_city || row.city || 'Location Not Specified'}</div>
            </div>

            <div style="display:flex;flex-direction:column;gap:6px;font-size:0.8rem;color:#475569;">
              ${row.phone ? '<div><i class="fas fa-phone" style="width:16px;color:#10B981;"></i> <a href="tel:' + row.phone + '" style="color:#0F172A;text-decoration:none;">' + row.phone + '</a></div>' : ''}
              ${row.email ? '<div><i class="fas fa-envelope" style="width:16px;color:#3B82F6;"></i> <a href="mailto:' + row.email + '" style="color:#0F172A;text-decoration:none;">' + row.email + '</a></div>' : ''}
              ${row.linkedin_profile ? '<div><i class="fab fa-linkedin" style="width:16px;color:#0A66C2;"></i> <a href="' + (row.linkedin_profile.startsWith('http') ? row.linkedin_profile : 'https://' + row.linkedin_profile) + '" target="_blank" style="color:#0A66C2;font-weight:600;">LinkedIn Profile</a></div>' : ''}
            </div>
          </div>

          <div style="margin-top:14px;padding-top:10px;border-top:1px solid #F1F5F9;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.75rem;color:#94A3B8;">Status: <strong style="color:#1E293B;">${row.assignment_status || 'Unassigned'}</strong></span>
            <button class="btn btn-primary btn-sm" style="padding:4px 10px;font-size:0.75rem;font-weight:600;" onclick="openUpdateModalAdmin(${row.alumni_id})"><i class="fas fa-eye"></i> View Profile</button>
          </div>
        </div>
      `;
    });
    cardsHtml += '</div></td></tr>';
    tbody.innerHTML = cardsHtml;
  } else {
    // Render table view with full contact info
    var html = '';
    data.forEach(function (row) {
      var profClass = 'badge-secondary';
      var pt = row.profession_type || 'Unknown';
      if (pt === 'Government') profClass = 'badge-success';
      else if (pt === 'Private Sector') profClass = 'badge-primary';
      else if (pt === 'Business / Entrepreneur') profClass = 'badge-warning';

      var statusClass = 'badge-secondary';
      var st = row.assignment_status || 'Unassigned';
      if (st === 'Completed' || st === 'Updated') statusClass = 'badge-success';
      else if (st === 'Pending') statusClass = 'badge-warning';
      else if (st === 'Reopened') statusClass = 'badge-danger';

      var phoneHtml = row.phone ? '<a href="tel:' + row.phone + '" style="color:#10B981;text-decoration:none;font-size:0.8rem;" title="Call"><i class="fas fa-phone" style="margin-right:3px;"></i>' + row.phone + '</a>' : '<span style="color:#CBD5E1;">—</span>';
      var emailHtml = row.email ? '<a href="mailto:' + row.email + '" style="color:#3B82F6;text-decoration:none;font-size:0.78rem;" title="Email"><i class="fas fa-envelope" style="margin-right:3px;"></i>' + row.email + '</a>' : '<span style="color:#CBD5E1;">—</span>';
      var linkedinHtml = row.linkedin_profile ? '<a href="' + (row.linkedin_profile.startsWith('http') ? row.linkedin_profile : 'https://' + row.linkedin_profile) + '" target="_blank" style="color:#0A66C2;font-weight:600;font-size:0.8rem;"><i class="fab fa-linkedin"></i> LinkedIn</a>' : '<span style="color:#CBD5E1;">—</span>';

      html += '<tr style="border-bottom:1px solid #F1F5F9;">';
      html += '<td style="padding:10px 12px;font-weight:600;font-size:0.82rem;">' + (row.register_no || '-') + '</td>';
      html += '<td style="padding:10px 12px;font-weight:600;color:#1E293B;">' + (row.name || 'Unknown') + '<br><span style="font-size:0.73rem;color:#64748B;">' + (row.department || '') + ' • ' + (row.batch || '') + '</span></td>';
      html += '<td style="padding:10px 12px;font-weight:600;color:#2563EB;font-size:0.85rem;">' + (row.designation || '<span style="color:#CBD5E1;">—</span>') + '<br><span style="font-size:0.75rem;color:#334155;font-weight:400;">' + (row.company || '') + '</span></td>';
      html += '<td style="padding:10px 12px;font-size:0.82rem;color:#475569;">' + (row.current_city || row.city || '<span style="color:#CBD5E1;">—</span>') + '</td>';
      html += '<td style="padding:10px 12px;"><span class="badge ' + profClass + '" style="font-size:0.72rem;">' + pt + '</span></td>';
      html += '<td style="padding:10px 12px;">' + phoneHtml + '<br>' + emailHtml + '</td>';
      html += '<td style="padding:10px 12px;">' + linkedinHtml + '</td>';
      html += '<td style="padding:10px 12px;"><span class="badge ' + statusClass + '" style="font-size:0.72rem;">' + st + '</span></td>';
      html += '<td style="padding:10px 12px;"><button class="btn btn-primary btn-sm" style="padding:3px 10px;font-size:0.75rem;font-weight:600;" onclick="openUpdateModalAdmin(' + row.alumni_id + ')"><i class="fas fa-edit"></i> View</button></td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }
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
  if (document.getElementById('catFilterDesignation')) document.getElementById('catFilterDesignation').value = '';
  if (document.getElementById('catFilterCompany')) document.getElementById('catFilterCompany').value = '';
  if (document.getElementById('catFilterCity')) document.getElementById('catFilterCity').value = '';
  if (document.getElementById('catFilterDept')) document.getElementById('catFilterDept').value = '';
  if (document.getElementById('catFilterBatch')) document.getElementById('catFilterBatch').value = '';
  if (document.getElementById('catFilterProfType')) document.getElementById('catFilterProfType').value = '';
  if (document.getElementById('catSearchInput')) document.getElementById('catSearchInput').value = '';
  if (document.getElementById('catFilterOnlyUpdated')) document.getElementById('catFilterOnlyUpdated').checked = true;
  catActiveGroupFilter = null;
  fetchCategoryGroups();
};

window.exportCategoryData = function () {
  var desig = document.getElementById('catFilterDesignation') ? document.getElementById('catFilterDesignation').value : '';
  var comp = document.getElementById('catFilterCompany') ? document.getElementById('catFilterCompany').value : '';
  var city = document.getElementById('catFilterCity') ? document.getElementById('catFilterCity').value : '';
  var dept = document.getElementById('catFilterDept') ? document.getElementById('catFilterDept').value : '';
  var batch = document.getElementById('catFilterBatch') ? document.getElementById('catFilterBatch').value : '';
  var profType = document.getElementById('catFilterProfType') ? document.getElementById('catFilterProfType').value : '';
  var search = document.getElementById('catSearchInput') ? document.getElementById('catSearchInput').value : '';
  var onlyUpdated = document.getElementById('catFilterOnlyUpdated') ? document.getElementById('catFilterOnlyUpdated').checked : true;

  API.getAlumniCategoryList({ page: 1, limit: 10000, designation: desig, company: comp, city: city, department: dept, batch: batch, professionType: profType, search: search, onlyUpdated: onlyUpdated })
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

function getLatestTuesdayDateStr() {
  var d = new Date();
  var day = d.getDay();
  var diff = 2 - day;
  if (day < 2) diff = diff - 7;
  d.setDate(d.getDate() + diff);
  var yyyy = d.getFullYear();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

window.onTuesdayDateChange = function () {
  var input = document.getElementById('attDateSelect');
  if (!input || !input.value) return;

  var parts = input.value.split('-');
  if (parts.length === 3) {
    var selected = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    var day = selected.getDay();
    if (day !== 2) {
      var diff = 2 - day;
      if (day === 0) diff = -5;
      else if (day === 1) diff = 1;
      else if (day > 2) diff = 2 - day;

      selected.setDate(selected.getDate() + diff);

      var yyyy = selected.getFullYear();
      var mm = String(selected.getMonth() + 1).padStart(2, '0');
      var dd = String(selected.getDate()).padStart(2, '0');
      var tuesdayStr = yyyy + '-' + mm + '-' + dd;

      input.value = tuesdayStr;
      if (window.Toast && typeof window.Toast.warning === 'function') {
        window.Toast.warning('Tuesday Only', 'Selection adjusted to Tuesday (' + tuesdayStr + ')');
      }
    }
  }

  fetchAttendanceData();
};

window.fetchAttendanceData = function () {
  var dateInput = document.getElementById('attDateSelect');
  if (dateInput && !dateInput.value) {
    dateInput.value = getLatestTuesdayDateStr();
  }
  var selectedDate = dateInput ? dateInput.value : '';

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
      if (res && (res.success || res.data)) {
        var d = res.data !== undefined ? res.data : res;
        var data = (d && d.records) ? d.records : (Array.isArray(d) ? d : []);
        var total = (d && d.pagination) ? d.pagination.total : data.length;
        renderAttendanceTable(data);
        renderAttendancePagination(total);
      } else {
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#EF4444;">Failed to load attendance logs</td></tr>';
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
      statusBadge = '<span class="badge badge-success" style="background:#10B981;color:#fff;padding:6px 12px;border-radius:20px;font-weight:600;"><i class="fas fa-check-circle"></i> Present (On-Time 1:15 - 1:30 PM)</span>';
    } else if (row.status === 'Late') {
      statusBadge = '<span class="badge badge-warning" style="background:#F59E0B;color:#fff;padding:6px 12px;border-radius:20px;font-weight:600;"><i class="fas fa-clock"></i> Late (Delayed 1:30 - 2:45 PM)</span>';
    } else {
      statusBadge = '<span class="badge badge-danger" style="background:#EF4444;color:#fff;padding:6px 12px;border-radius:20px;font-weight:600;"><i class="fas fa-times-circle"></i> Absent (No Login in Window)</span>';
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
