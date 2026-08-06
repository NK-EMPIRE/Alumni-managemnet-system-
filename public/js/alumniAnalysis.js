/* ============================================================
   ALUMNI ANALYSIS REPORTING CONTROLLER
   ============================================================ */

var analysisCurrentPage = 1;
var analysisRowsPerPage = 20;
var analysisSearchDebounce = null;
var analysisViewMode = 'cards'; // 'cards' or 'table'

window.setAnalysisViewMode = function (mode) {
  analysisViewMode = mode;
  var btnCards = document.getElementById('btnAnalysisViewCards');
  var btnTable = document.getElementById('btnAnalysisViewTable');

  if (btnCards && btnTable) {
    if (mode === 'cards') {
      btnCards.style.background = '#EFF6FF'; btnCards.style.color = '#2563EB'; btnCards.style.fontWeight = '600';
      btnTable.style.background = 'transparent'; btnTable.style.color = '#64748B'; btnTable.style.fontWeight = 'normal';
    } else {
      btnTable.style.background = '#EFF6FF'; btnTable.style.color = '#2563EB'; btnTable.style.fontWeight = '600';
      btnCards.style.background = 'transparent'; btnCards.style.color = '#64748B'; btnCards.style.fontWeight = 'normal';
    }
  }
  fetchAnalysisData(analysisCurrentPage);
};

window.initAnalysisPage = function () {
  loadAnalysisRoleCategories();
  loadAnalysisCompanies();
  loadAnalysisDropdownFilters();
  fetchAnalysisData(1);
};

function loadAnalysisRoleCategories() {
  if (typeof API === 'undefined' || !API.getAnalysisRoleCategories) return;

  API.getAnalysisRoleCategories()
    .then(function (res) {
      if (res && res.success && res.data) {
        var select = document.getElementById('analysisFilterRoleCategory');
        if (!select) return;

        var savedVal = select.value;
        select.innerHTML = '<option value="">All Role Categories</option>';
        
        var maxCount = 0;
        var topCategory = 'Operations & Quality';
        var totalWorking = 0;

        res.data.forEach(function (item) {
          select.innerHTML += '<option value="' + item.category + '">' + item.category + ' (' + item.count + ')</option>';
          totalWorking += item.count;
          if (item.count > maxCount && item.category !== 'Other / Unclassified') {
            maxCount = item.count;
            topCategory = item.category;
          }
        });
        if (savedVal) select.value = savedVal;

        // Populate System Intelligence Digest Banner
        var summaryEl = document.getElementById('analysisExecutiveSummary');
        var totalWorkingEl = document.getElementById('analysisTotalWorkingCount');
        var topSectorEl = document.getElementById('analysisTopSectorName');

        if (summaryEl) {
          summaryEl.innerHTML = 'Intelligence Engine classified <strong>' + totalWorking + '</strong> verified alumni across 14 industry sectors. Primary concentration in <strong>' + topCategory + '</strong> (' + maxCount + ' records).';
        }
        if (totalWorkingEl) totalWorkingEl.innerText = totalWorking;
        if (topSectorEl) topSectorEl.innerText = topCategory;
      }
    })
    .catch(function (err) { console.error('Error loading analysis role categories:', err); });
}

function loadAnalysisCompanies() {
  if (typeof API === 'undefined' || !API.getAnalysisCompanies) return;

  API.getAnalysisCompanies()
    .then(function (res) {
      if (res && res.success && res.data) {
        var select = document.getElementById('analysisFilterCompany');
        if (!select) return;

        var savedVal = select.value;
        select.innerHTML = '<option value="">All Companies</option>';
        res.data.forEach(function (companyName) {
          select.innerHTML += '<option value="' + companyName.replace(/"/g, '&quot;') + '">' + companyName + '</option>';
        });
        if (savedVal) select.value = savedVal;
      }
    })
    .catch(function (err) { console.error('Error loading analysis companies:', err); });
}

function loadAnalysisDropdownFilters() {
  if (typeof API === 'undefined' || !API.getAlumniFilters) return;

  API.getAlumniFilters().then(function (res) {
    if (res && res.success && res.data) {
      var depts = res.data.departments || [];
      var batches = res.data.batches || [];

      var deptEl = document.getElementById('analysisFilterDept');
      var batchEl = document.getElementById('analysisFilterBatch');

      if (deptEl) {
        var savedDept = deptEl.value;
        deptEl.innerHTML = '<option value="">All Departments</option>';
        depts.forEach(function (d) { deptEl.innerHTML += '<option value="' + d + '">' + d + '</option>'; });
        if (savedDept) deptEl.value = savedDept;
      }

      if (batchEl) {
        var savedBatch = batchEl.value;
        batchEl.innerHTML = '<option value="">All Batches</option>';
        batches.forEach(function (b) { batchEl.innerHTML += '<option value="' + b + '">' + b + '</option>'; });
        if (savedBatch) batchEl.value = savedBatch;
      }
    }
  }).catch(function (err) { console.error('Error fetching alumni filter options for analysis:', err); });
}

window.debounceAnalysisSearch = function () {
  clearTimeout(analysisSearchDebounce);
  analysisSearchDebounce = setTimeout(function () {
    fetchAnalysisData(1);
  }, 350);
};

window.openAnalysisFiltersModal = function () {
  var modal = document.getElementById('analysisFiltersModal');
  if (modal) modal.style.display = 'flex';
};

window.closeAnalysisFiltersModal = function () {
  var modal = document.getElementById('analysisFiltersModal');
  if (modal) modal.style.display = 'none';
};

window.onAnalysisFilterChange = function () {
  updateActiveFiltersBadge();
  debounceAnalysisSearch();
};

window.applyAnalysisFiltersModal = function () {
  closeAnalysisFiltersModal();
  updateActiveFiltersBadge();
  fetchAnalysisData(1);
};

function updateActiveFiltersBadge() {
  var badge = document.getElementById('analysisActiveFiltersBadge');
  if (!badge) return;

  var filterIds = ['analysisFilterRoleCategory', 'analysisFilterCompany', 'analysisFilterCity', 'analysisFilterState', 'analysisFilterCountry', 'analysisFilterDept', 'analysisFilterBatch', 'analysisFilterStatus'];
  var activeCount = 0;

  filterIds.forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.value && el.value.trim() !== '') {
      activeCount++;
    }
  });

  if (activeCount > 0) {
    badge.innerText = activeCount;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

window.resetAnalysisFilters = function () {
  var ids = ['analysisFilterRoleCategory', 'analysisFilterCompany', 'analysisFilterCity', 'analysisFilterState', 'analysisFilterCountry', 'analysisFilterBatch', 'analysisFilterDept', 'analysisFilterStatus', 'analysisCustomQueryInput'];
  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  updateActiveFiltersBadge();
  closeAnalysisFiltersModal();
  fetchAnalysisData(1);
};

window.fetchAnalysisData = function (page) {
  analysisCurrentPage = page || 1;

  var roleCategory = document.getElementById('analysisFilterRoleCategory') ? document.getElementById('analysisFilterRoleCategory').value : '';
  var company = document.getElementById('analysisFilterCompany') ? document.getElementById('analysisFilterCompany').value : '';
  var city = document.getElementById('analysisFilterCity') ? document.getElementById('analysisFilterCity').value : '';
  var state = document.getElementById('analysisFilterState') ? document.getElementById('analysisFilterState').value : '';
  var country = document.getElementById('analysisFilterCountry') ? document.getElementById('analysisFilterCountry').value : '';
  var batch = document.getElementById('analysisFilterBatch') ? document.getElementById('analysisFilterBatch').value : '';
  var dept = document.getElementById('analysisFilterDept') ? document.getElementById('analysisFilterDept').value : '';
  var status = document.getElementById('analysisFilterStatus') ? document.getElementById('analysisFilterStatus').value : '';
  var customQuery = document.getElementById('analysisCustomQueryInput') ? document.getElementById('analysisCustomQueryInput').value : '';

  var params = {
    page: analysisCurrentPage,
    limit: analysisRowsPerPage,
    roleCategory: roleCategory || undefined,
    company: company || undefined,
    city: city || undefined,
    state: state || undefined,
    country: country || undefined,
    batch: batch || undefined,
    department: dept || undefined,
    status: status || undefined,
    customQuery: customQuery || undefined
  };

  var tbody = document.getElementById('analysisTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#94A3B8;"><i class="fas fa-spinner fa-spin"></i> Loading alumni analysis records...</td></tr>';

  API.getAlumniAnalysis(params)
    .then(function (res) {
      if (res && (res.success || res.data)) {
        var d = res.data !== undefined ? res.data : res;
        var data = (d && d.records) ? d.records : (Array.isArray(d) ? d : []);
        var total = (d && d.pagination) ? d.pagination.total : data.length;
        renderAnalysisDataView(data);
        renderAnalysisPagination(total);
      } else {
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#EF4444;">Failed to load analysis records</td></tr>';
      }
    })
    .catch(function (err) {
      console.error('Error fetching analysis data:', err);
      if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#EF4444;">Network error loading analysis data</td></tr>';
    });
};

function renderAnalysisDataView(data) {
  var tbody = document.getElementById('analysisTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#94A3B8;">No alumni records with verified professional details found matching the selected analysis filters</td></tr>';
    return;
  }

  if (analysisViewMode === 'cards') {
    var cardsHtml = '<tr><td colspan="9" style="padding:10px 0;"><div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px;">';
    data.forEach(function (row) {
      var phone = row.phone || '';
      var email = row.email || '';
      var linkedin = row.linkedin_profile || '';

      var location = [row.city, row.state, row.country].filter(Boolean).join(', ') || 'Not Specified';

      cardsHtml += `
        <div class="alumni-card" style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.02);display:flex;flex-direction:column;justify-space-between;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
              <div>
                <h4 style="margin:0 0 2px;font-size:1rem;font-weight:700;color:#0F172A;">${row.name || 'Unknown'}</h4>
                <span style="font-size:0.78rem;color:#64748B;font-weight:600;">${row.register_no || '-'} • ${row.department || ''} (${row.batch || ''})</span>
              </div>
              <span class="badge badge-primary" style="font-size:0.7rem;">${row.assignment_status || 'Unassigned'}</span>
            </div>

            <div style="margin-bottom:12px;background:#F8FAFC;padding:10px;border-radius:8px;border:1px solid #F1F5F9;">
              <div style="font-size:0.85rem;font-weight:700;color:#2563EB;margin-bottom:2px;"><i class="fas fa-briefcase" style="margin-right:6px;"></i>${row.designation || 'Role Not Specified'}</div>
              <div style="font-size:0.8rem;color:#334155;font-weight:500;"><i class="fas fa-building" style="margin-right:6px;color:#64748B;"></i>${row.company || 'Company Not Specified'}</div>
              <div style="font-size:0.75rem;color:#64748B;margin-top:2px;"><i class="fas fa-map-marker-alt" style="margin-right:6px;color:#EF4444;"></i>${location}</div>
            </div>

            <!-- Contact icons: click to reveal / copy -->
            <div style="display:flex;gap:12px;align-items:center;padding-top:4px;">
              ${phone ? `<button onclick="copyToClipboard('${phone}', 'Phone number')" class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:0.75rem;color:#10B981;border-color:#10B981;" title="Copy Phone: ${phone}"><i class="fas fa-phone"></i> ${phone}</button>` : ''}
              ${email ? `<button onclick="copyToClipboard('${email}', 'Email address')" class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:0.75rem;color:#3B82F6;border-color:#3B82F6;" title="Copy Email: ${email}"><i class="fas fa-envelope"></i> Email</button>` : ''}
              ${linkedin ? `<a href="${linkedin.startsWith('http') ? linkedin : 'https://' + linkedin}" target="_blank" class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:0.75rem;color:#0A66C2;border-color:#0A66C2;" title="View LinkedIn"><i class="fab fa-linkedin"></i> LinkedIn</a>` : ''}
            </div>
          </div>
        </div>
      `;
    });
    cardsHtml += '</div></td></tr>';
    tbody.innerHTML = cardsHtml;
  } else {
    var html = '';
    data.forEach(function (row) {
      var phone = row.phone || '';
      var email = row.email || '';
      var linkedin = row.linkedin_profile || '';
      var location = [row.city, row.state, row.country].filter(Boolean).join(', ') || '—';

      var phoneBtn = phone ? `<button onclick="copyToClipboard('${phone}', 'Phone')" style="background:none;border:none;color:#10B981;cursor:pointer;" title="${phone}"><i class="fas fa-phone"></i></button>` : '—';
      var emailBtn = email ? `<button onclick="copyToClipboard('${email}', 'Email')" style="background:none;border:none;color:#3B82F6;cursor:pointer;" title="${email}"><i class="fas fa-envelope"></i></button>` : '—';
      var linkedinBtn = linkedin ? `<a href="${linkedin.startsWith('http') ? linkedin : 'https://' + linkedin}" target="_blank" style="color:#0A66C2;"><i class="fab fa-linkedin"></i></a>` : '—';

      html += `
        <tr style="border-bottom:1px solid #F1F5F9;font-size:0.85rem;">
          <td style="padding:10px 12px;font-weight:600;">${row.register_no || '-'}</td>
          <td style="padding:10px 12px;"><strong>${row.name}</strong><br><span style="font-size:0.75rem;color:#64748B;">${row.department} (${row.batch})</span></td>
          <td style="padding:10px 12px;"><strong style="color:#2563EB;">${row.designation}</strong><br><span style="font-size:0.78rem;color:#475569;">${row.company}</span></td>
          <td style="padding:10px 12px;">${location}</td>
          <td style="padding:10px 12px;display:flex;gap:10px;align-items:center;">${phoneBtn} ${emailBtn} ${linkedinBtn}</td>
          <td style="padding:10px 12px;"><span class="badge badge-primary">${row.assignment_status || 'Unassigned'}</span></td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }
}

function renderAnalysisPagination(total) {
  var info = document.getElementById('analysisPaginationInfo');
  var btns = document.getElementById('analysisPaginationBtns');
  if (!info || !btns) return;

  var totalPages = Math.ceil(total / analysisRowsPerPage) || 1;
  var start = total === 0 ? 0 : (analysisCurrentPage - 1) * analysisRowsPerPage + 1;
  var end = Math.min(analysisCurrentPage * analysisRowsPerPage, total);

  info.innerText = `Showing ${start}-${end} of ${total} entries`;

  var html = '';
  html += `<button class="btn btn-secondary btn-sm" ${analysisCurrentPage <= 1 ? 'disabled' : ''} onclick="fetchAnalysisData(${analysisCurrentPage - 1})"><i class="fas fa-chevron-left"></i> Prev</button>`;
  html += `<span style="padding:4px 10px;font-size:0.82rem;font-weight:600;">Page ${analysisCurrentPage} of ${totalPages}</span>`;
  html += `<button class="btn btn-secondary btn-sm" ${analysisCurrentPage >= totalPages ? 'disabled' : ''} onclick="fetchAnalysisData(${analysisCurrentPage + 1})">Next <i class="fas fa-chevron-right"></i></button>`;

  btns.innerHTML = html;
}

window.copyToClipboard = function (text, label) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(function () {
    if (typeof showToast === 'function') {
      showToast(label + ' copied to clipboard: ' + text, 'success');
    } else {
      alert(label + ' copied: ' + text);
    }
  }).catch(function () {
    alert(text);
  });
};
