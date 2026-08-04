(function () {
    'use strict';

    let alumniData = [];
    let filteredData = [];
    let currentPage = 1;
    let rowsPerPage = 50;
    let todayUpdateCount = 0;
    let sessionTimeout = null;
    let _apiMemberData = null;
    let _apiAlumniData = null;
    let _apiDataLoaded = false;
    let previewPage = 1;
    let previewLimit = 10;
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

    const toastContainer = document.getElementById('toastContainer');
    const recordsBody = document.getElementById('recordsBody');
    const tableInfo = document.getElementById('tableInfo');
    const pagination = document.getElementById('pagination');
    const tableSearch = document.getElementById('tableSearch');
    const filterDept = document.getElementById('filterDept');
    const filterBatch = document.getElementById('filterBatch');
    const filterStatus = document.getElementById('filterStatus');
    const updateModal = document.getElementById('updateModal');
    const updateForm = document.getElementById('updateForm');
    const modalClose = document.getElementById('modalClose');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const submitRecordBtn = document.getElementById('submitRecordBtn');
    const submitNextBtn = document.getElementById('submitNextBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const modalAvatar = document.getElementById('modalAvatar');
    const modalStatusBadge = document.getElementById('modalStatusBadge');
    const fieldIndex = document.getElementById('fieldIndex');
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const markAllRead = document.getElementById('markAllRead');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const todayCountEl = document.getElementById('todayCount');

    function renderTable() {
        const searchTerm = tableSearch.value.toLowerCase().trim();
        const deptFilter = filterDept.value;
        const batchFilter = filterBatch.value;
        const statusFilter = filterStatus.value;
        var dateFromEl = document.getElementById('filterDateFrom');
        var dateToEl = document.getElementById('filterDateTo');
        var dateFrom = dateFromEl && dateFromEl.value ? new Date(dateFromEl.value + 'T00:00:00') : null;
        var dateTo = dateToEl && dateToEl.value ? new Date(dateToEl.value + 'T23:59:59') : null;

        filteredData = alumniData.filter(function (r) {
            const matchesSearch = !searchTerm ||
                r.name.toLowerCase().includes(searchTerm) ||
                r.department.toLowerCase().includes(searchTerm) ||
                r.batch.toLowerCase().includes(searchTerm) ||
                r.company.toLowerCase().includes(searchTerm) ||
                r.designation.toLowerCase().includes(searchTerm);
            const matchesDept = !deptFilter || r.department === deptFilter;
            const matchesBatch = !batchFilter || r.batch === batchFilter;
            const matchesStatus = !statusFilter || r.status === statusFilter;

            var matchesDate = true;
            if (dateFrom || dateTo) {
                var rawDate = r.created_at || r.createdAt || r.assigned_date;
                if (rawDate) {
                    var itemDate = new Date(rawDate.substring(0, 10) + 'T00:00:00');
                    if (dateFrom && itemDate < dateFrom) matchesDate = false;
                    if (dateTo && itemDate > dateTo) matchesDate = false;
                } else {
                    matchesDate = false;
                }
            }

            return matchesSearch && matchesDept && matchesBatch && matchesStatus && matchesDate;
        });

        const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const start = (currentPage - 1) * rowsPerPage;
        const end = Math.min(start + rowsPerPage, filteredData.length);
        const pageData = filteredData.slice(start, end);

        if (pageData.length === 0) {
            recordsBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-light);"><i class="fas fa-inbox" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.4;"></i>No records found</td></tr>';
        } else {
            let html = '';
            for (let i = 0; i < pageData.length; i++) {
                const r = pageData[i];
                const serial = start + i + 1;
                const isCompleted = r.status === 'Completed';
                const isDraft = r.status === 'Draft';
                const isReopened = r.status === 'Reopened';
                const badgeClass = isCompleted ? 'completed' : (isDraft ? 'draft' : (isReopened ? 'badge-danger' : 'pending'));
                const badgeIcon = isCompleted ? 'fa-check-circle' : (isDraft ? 'fa-pen' : (isReopened ? 'fa-undo' : 'fa-clock'));
                var actionButtons = '<div style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap;">' +
                    '<button class="btn-update" data-index="' + r.id + '"><i class="fas fa-edit"></i> Update</button>';
                if (isCompleted) {
                    var safeName = (r.name || '').replace(/'/g, "\\'");
                    actionButtons += '<button class="btn-undo-icon" onclick="confirmUndoSubmission(' + r.id + ', \'' + safeName + '\')" title="Undo Submission to Draft"><i class="fas fa-undo"></i></button>';
                }
                actionButtons += '</div>';
                var fatherVal = String(r.father_name || r.fatherName || '');
                var safeName = String(r.name || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
                var safeFather = fatherVal.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                var nameCellContent = '<div>' +
                    '<div style="display:flex;align-items:center;gap:6px;">' +
                    '  <strong style="color:#1E293B;">' + (r.name || '-') + '</strong>' +
                    '  <button type="button" onclick="event.stopPropagation();copyAlumniAndFather(\'' + safeName + '\', \'' + safeFather + '\')" style="background:none;border:none;cursor:pointer;color:#64748B;font-size:0.8rem;padding:2px;" title="Copy Alumni & Father Name"><i class="far fa-copy"></i></button>' +
                    '</div>' +
                    (fatherVal ? '<div style="font-size:0.75rem;color:#64748B;font-weight:400;margin-top:2px;">S/O: ' + fatherVal + '</div>' : '') +
                    '</div>';

                html += '<tr>' +
                    '<td style="font-weight:600;color:var(--text-secondary);">' + serial + '</td>' +
                    '<td>' + nameCellContent + '</td>' +
                    '<td>' + r.department + '</td>' +
                    '<td>' + r.batch + '</td>' +
                    '<td>' + r.company + '</td>' +
                    '<td>' + r.designation + '</td>' +
                    '<td><span class="status-badge ' + badgeClass + '" style="' + (isReopened ? 'background:#FEE2E2;color:#991B1B;padding:4px 10px;border-radius:12px;font-weight:600;' : '') + '"><i class="fas ' + badgeIcon + '"></i> ' + r.status + '</span></td>' +
                    '<td>' + actionButtons + '</td>' +
                    '</tr>';
            }
            recordsBody.innerHTML = html;
        }

        tableInfo.textContent = 'Showing ' + (filteredData.length > 0 ? (start + 1) + ' to ' + end + ' of ' + filteredData.length : '0') + ' entries';
        renderPagination(totalPages);

        updateCardCounts();
        updateFilterBadge();
    }

    function renderPagination(totalPages) {
        let html = '';
        html += '<button class="prev" data-page="prev" ' + (currentPage <= 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
        for (let i = 1; i <= totalPages; i++) {
            html += '<button class="' + (i === currentPage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
        }
        html += '<button class="next" data-page="next" ' + (currentPage >= totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
        pagination.innerHTML = html;

        pagination.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const page = btn.getAttribute('data-page');
                if (page === 'prev' && currentPage > 1) {
                    currentPage--;
                } else if (page === 'next' && currentPage < totalPages) {
                    currentPage++;
                } else if (page !== 'prev' && page !== 'next') {
                    currentPage = parseInt(page, 10);
                }
                renderTable();
            });
        });
    }

    function updateCardCounts() {
        const completed = alumniData.filter(function (r) { return r.status === 'Completed'; }).length;
        const pending = alumniData.filter(function (r) { return r.status === 'Pending'; }).length;
        const draft = alumniData.filter(function (r) { return r.status === 'Draft'; }).length;
        document.getElementById('assignedCount').textContent = alumniData.length;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('draftCount').textContent = draft;
        document.getElementById('remainingCount').textContent = pending;
    }

    function animateTodayCount(target) {
        let current = parseInt(todayCountEl.textContent, 10) || 0;
        if (current === target) return;
        const increment = target > current ? 1 : -1;
        const interval = setInterval(function () {
            current += increment;
            todayCountEl.textContent = current;
            if (current === target) {
                clearInterval(interval);
            }
        }, 80);
    }

    function updateFilterBadge() {
        var count = 0;
        if (filterDept && filterDept.value) count++;
        if (filterBatch && filterBatch.value) count++;
        if (filterStatus && filterStatus.value) count++;
        if (document.getElementById('filterDateFrom') && document.getElementById('filterDateFrom').value) count++;
        if (document.getElementById('filterDateTo') && document.getElementById('filterDateTo').value) count++;
        var badge = document.getElementById('activeFilterBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
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

    window.clearAllNotifications = function () {
        var list = document.getElementById('notifList');
        if (list) {
            list.innerHTML = '<div style="padding:16px;text-align:center;color:#64748B;font-size:0.8rem;">No new notifications</div>';
        }
        var count = document.getElementById('notifCount');
        if (count) { count.textContent = '0'; count.style.display = 'none'; }
        localStorage.setItem('notif_member_cleared', Date.now().toString());
    };

    window.openFilterModal = function () {
        var modal = document.getElementById('ssFilterModal');
        if (modal) modal.classList.add('show');
    };

    window.closeFilterModal = function () {
        var modal = document.getElementById('ssFilterModal');
        if (modal) modal.classList.remove('show');
    };

    window.applyModalFilters = function () {
        currentPage = 1;
        renderTable();
        var preview = document.getElementById('section-preview');
        if (preview && preview.style.display !== 'none') {
            previewPage = 1;
            loadPreviewSpreadsheet();
        }
    };

    window.clearModalFilters = function () {
        if (filterDept) filterDept.value = '';
        if (filterBatch) filterBatch.value = '';
        if (filterStatus) filterStatus.value = '';
        if (document.getElementById('filterDateFrom')) document.getElementById('filterDateFrom').value = '';
        if (document.getElementById('filterDateTo')) document.getElementById('filterDateTo').value = '';
        applyModalFilters();
    };

    function incrementTodayCount() {
        todayUpdateCount++;
        animateTodayCount(todayUpdateCount);
    }

    function readFormValues(record) {
        record.name = document.getElementById('fieldName').value.trim();
        record.department = document.getElementById('fieldDept').value;
        record.batch = document.getElementById('fieldBatch').value;
        record.fatherName = document.getElementById('fieldFatherName').value.trim();
        record.father_name = record.fatherName;
        record.date_of_birth = document.getElementById('fieldDOB').value.trim();
        record.dob = record.date_of_birth;
        record.company = document.getElementById('fieldCompany').value.trim();
        record.designation = document.getElementById('fieldDesignation').value.trim();
        record.city = document.getElementById('fieldCity').value.trim();
        record.state = document.getElementById('fieldState').value.trim();
        record.country = document.getElementById('fieldCountry').value.trim();
        record.email = document.getElementById('fieldEmail').value.trim();
        record.phone = document.getElementById('fieldPhone').value.trim();
        record.secondary_email = document.getElementById('fieldSecondaryEmail').value.trim();
        record.secondary_phone = document.getElementById('fieldSecondaryPhone').value.trim();
        record.linkedin_profile = document.getElementById('fieldLinkedin').value.trim();
        record.govtJob = document.getElementById('fieldGovtJob').value;
    }

    function ensureOptionExists(selectEl, val) {
        if (!selectEl) return;
        if (!selectEl.options) {
            if (val !== undefined && val !== null) selectEl.value = val;
            return;
        }
        var existing = {};
        for (var i = selectEl.options.length - 1; i >= 0; i--) {
            var optVal = selectEl.options[i].value || selectEl.options[i].text;
            if (existing[optVal] && optVal !== '') {
                selectEl.remove(i);
            } else if (optVal !== '') {
                existing[optVal] = true;
            }
        }
        if (!val) return;
        var valTrim = String(val).trim();
        var found = false;
        for (var j = 0; j < selectEl.options.length; j++) {
            var curVal = (selectEl.options[j].value || '').trim();
            var curText = (selectEl.options[j].text || '').trim();
            if (curVal.toLowerCase() === valTrim.toLowerCase() || curText.toLowerCase() === valTrim.toLowerCase()) {
                found = true;
                selectEl.options[j].value = valTrim;
                break;
            }
        }
        if (!found && valTrim) {
            var opt = document.createElement('option');
            opt.value = valTrim;
            opt.textContent = valTrim;
            selectEl.appendChild(opt);
        }
    }

    window._currentModalRecordIndex = -1;

    function getEffectiveAlumniList() {
        return (filteredData && filteredData.length > 0) ? filteredData : alumniData;
    }

    var _isModalEditMode = false;

    function applyPreFilledLocking() {
        var fieldIds = [
            'fieldName', 'fieldDept', 'fieldBatch', 'fieldFatherName', 'fieldDOB',
            'fieldCompany', 'fieldDesignation', 'fieldCity', 'fieldState', 'fieldCountry',
            'fieldEmail', 'fieldPhone', 'fieldSecondaryEmail', 'fieldSecondaryPhone',
            'fieldLinkedin', 'fieldGovtJob'
        ];

        _isModalEditMode = false;
        var topEditBtn = document.getElementById('modalTopEditBtn');
        if (topEditBtn) {
            topEditBtn.style.background = '#EFF6FF';
            topEditBtn.style.color = '#2563EB';
            topEditBtn.style.borderColor = '#BFDBFE';
            topEditBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            topEditBtn.title = 'Click pencil to unlock pre-filled data for editing';
        }

        fieldIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;

            var val = el.value ? el.value.trim() : '';
            var isPreFilled = val !== '' && val !== 'No' && val !== 'Select Department' && val !== 'Select Batch';

            if (isPreFilled) {
                el.readOnly = true;
                if (el.tagName === 'SELECT') el.disabled = true;
            } else {
                el.readOnly = false;
                el.disabled = false;
            }
        });
    }

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
                topEditBtn.title = 'Click pencil to unlock pre-filled data for editing';
            }
        }
    };

    function updateModalNavCounter() {
        var prevBtn = document.getElementById('modalNavPrevBtn');
        var nextBtn = document.getElementById('modalNavNextBtn');
        var counterEl = document.getElementById('modalNavCounter');
        var activeList = getEffectiveAlumniList();
        if (!activeList || activeList.length === 0 || window._currentModalRecordIndex === -1) {
            if (counterEl) counterEl.textContent = '0 / 0';
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }
        var curPos = activeList.findIndex(function (r) { return r.id === window._currentModalRecordId; });
        if (curPos === -1) curPos = 0;
        if (counterEl) counterEl.textContent = (curPos + 1) + ' / ' + activeList.length;
        if (prevBtn) prevBtn.disabled = curPos <= 0;
        if (nextBtn) nextBtn.disabled = curPos >= activeList.length - 1;
    }

    window.navigateModalRecord = function (dir) {
        var activeList = getEffectiveAlumniList();
        if (!activeList || activeList.length === 0) return;

        var curPos = activeList.findIndex(function (r) { return r.id === window._currentModalRecordId; });
        if (curPos === -1) curPos = 0;

        var newPos = curPos + dir;
        if (newPos < 0 || newPos >= activeList.length) return;
        var targetRecord = activeList[newPos];
        if (!targetRecord) return;

        var form = document.getElementById('updateForm');
        if (form) {
            form.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
            form.style.opacity = '0.3';
            form.style.transform = dir > 0 ? 'translateX(15px)' : 'translateX(-15px)';
            setTimeout(function () {
                openUpdateModal(targetRecord.id);
                form.style.opacity = '1';
                form.style.transform = 'translateX(0)';
            }, 150);
        } else {
            openUpdateModal(targetRecord.id);
        }
    };

    function openUpdateModal(index) {
        const targetId = parseInt(index, 10);
        const recordIdx = alumniData.findIndex(function (r) { return r.id === targetId; });
        if (recordIdx === -1) return;
        window._currentModalRecordIndex = recordIdx;
        window._currentModalRecordId = targetId;
        const record = alumniData[recordIdx];

        updateModalNavCounter();

        fieldIndex.value = record.id || '';
        modalTitle.textContent = record.name;
        modalSubtitle.textContent = record.department + ' (' + record.batch + ')';
        modalAvatar.textContent = record.name.charAt(0).toUpperCase();
        const isCompleted = record.status === 'Completed';
        const isDraft = record.status === 'Draft';
        const isReopened = record.status === 'Reopened';
        const badgeClass = isCompleted ? 'completed' : (isDraft ? 'draft' : (isReopened ? 'badge-danger' : 'pending'));
        const badgeIcon = isCompleted ? 'fa-check-circle' : (isDraft ? 'fa-pen' : (isReopened ? 'fa-redo-alt' : 'fa-clock'));
        modalStatusBadge.className = 'status-badge ' + badgeClass;
        if (isReopened) {
            modalStatusBadge.style.cssText = 'background:#FEE2E2;color:#991B1B;padding:4px 10px;border-radius:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px;';
        }
        modalStatusBadge.innerHTML = '<i class="fas ' + badgeIcon + '"></i> ' + record.status;

        const deptEl = document.getElementById('fieldDept');
        const batchEl = document.getElementById('fieldBatch');
        ensureOptionExists(deptEl, record.department);
        ensureOptionExists(batchEl, record.batch);

        document.getElementById('fieldName').value = record.name || '';
        deptEl.value = record.department || '';
        batchEl.value = record.batch || '';
        document.getElementById('fieldFatherName').value = record.fatherName || record.father_name || record.pi_father_name || '';
        document.getElementById('fieldDOB').value = record.date_of_birth || record.dob || '';
        document.getElementById('fieldCompany').value = record.company || '';
        document.getElementById('fieldDesignation').value = record.designation || '';
        document.getElementById('fieldCity').value = record.city || record.current_city || '';
        document.getElementById('fieldState').value = record.state || '';
        document.getElementById('fieldCountry').value = record.country || '';
        document.getElementById('fieldEmail').value = record.email || '';
        document.getElementById('fieldPhone').value = record.phone || '';
        document.getElementById('fieldSecondaryEmail').value = record.secondary_email || '';
        document.getElementById('fieldSecondaryPhone').value = record.secondary_phone || '';
        document.getElementById('fieldLinkedin').value = record.linkedin_profile || record.linkedin_url || '';
        document.getElementById('fieldGovtJob').value = record.govtJob || (record.is_government_job ? 'Yes' : 'No') || 'No';

        // Apply pre-filled field locking with pencil icon
        applyPreFilledLocking();

        // Auto-toggle secondary containers if values exist
        var secEmailContainer = document.getElementById('fieldSecondaryEmailContainer');
        var secEmailBtn = secEmailContainer && secEmailContainer.previousElementSibling ? secEmailContainer.previousElementSibling.querySelector('button') : null;
        if (record.secondary_email && secEmailContainer) {
            secEmailContainer.style.display = 'block';
            if (secEmailBtn) secEmailBtn.innerHTML = '<i class="fas fa-minus-circle" style="color: #EF4444;"></i> Remove Secondary';
        } else if (secEmailContainer) {
            secEmailContainer.style.display = 'none';
            if (secEmailBtn) secEmailBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Secondary';
        }

        var secPhoneContainer = document.getElementById('fieldSecondaryPhoneContainer');
        var secPhoneBtn = secPhoneContainer && secPhoneContainer.previousElementSibling ? secPhoneContainer.previousElementSibling.querySelector('button') : null;
        if (record.secondary_phone && secPhoneContainer) {
            secPhoneContainer.style.display = 'block';
            if (secPhoneBtn) secPhoneBtn.innerHTML = '<i class="fas fa-minus-circle" style="color: #EF4444;"></i> Remove Secondary';
        } else if (secPhoneContainer) {
            secPhoneContainer.style.display = 'none';
            if (secPhoneBtn) secPhoneBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Secondary';
        }

        var parserEl = document.getElementById('fieldSmartParser');
        if (parserEl) parserEl.value = '';
        loadAutosave(record.id);

        if (typeof applyPreFilledLocking === 'function') applyPreFilledLocking();

        clearErrors();
        var undoBtn = document.getElementById('undoSubmitBtn');
        if (undoBtn) {
            undoBtn.style.display = isCompleted ? 'inline-flex' : 'none';
        }
        saveDraftBtn.classList.remove('loading');
        saveDraftBtn.disabled = false;
        submitRecordBtn.classList.remove('loading');
        submitRecordBtn.disabled = false;
        if (submitNextBtn) {
            submitNextBtn.classList.remove('loading');
            submitNextBtn.disabled = false;
        }
        var updateModalEl = document.getElementById('updateModal');
        if (updateModalEl) updateModalEl.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    window.openUpdateModal = openUpdateModal;

    function closeUpdateModal() {
        var updateModalEl = document.getElementById('updateModal');
        if (updateModalEl) updateModalEl.classList.remove('show');
        document.body.style.overflow = '';
        saveDraftBtn.classList.remove('loading');
        saveDraftBtn.disabled = false;
        submitRecordBtn.classList.remove('loading');
        submitRecordBtn.disabled = false;
        if (submitNextBtn) {
            submitNextBtn.classList.remove('loading');
            submitNextBtn.disabled = false;
        }
        clearErrors();
    }
    window.closeUpdateModal = closeUpdateModal;

    // Auto-save form progress to localStorage
    var autosaveTimeout = null;
    function triggerAutosave() {
        if (autosaveTimeout) clearTimeout(autosaveTimeout);
        autosaveTimeout = setTimeout(function () {
            saveAutosave();
        }, 1000); // Debounce autosave by 1 second
    }

    function saveAutosave() {
        var idx = fieldIndex.value;
        if (!idx) return;
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
        localStorage.setItem('autosave_member_alumni_' + idx, JSON.stringify(data));
    }

    function loadAutosave(idx) {
        var saved = localStorage.getItem('autosave_member_alumni_' + idx);
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
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    function clearAutosave(idx) {
        localStorage.removeItem('autosave_member_alumni_' + idx);
    }

    function readFormValues(record) {
        if (!record) return;
        var getVal = function (id) {
            var el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        record.name = getVal('fieldName') || record.name;
        record.department = getVal('fieldDept') || record.department;
        record.batch = getVal('fieldBatch') || record.batch;
        record.father_name = getVal('fieldFatherName') || record.father_name;
        record.fatherName = record.father_name;
        record.date_of_birth = getVal('fieldDOB') || record.date_of_birth;
        record.company = getVal('fieldCompany') || record.company;
        record.designation = getVal('fieldDesignation') || record.designation;
        record.city = getVal('fieldCity') || record.city;
        record.state = getVal('fieldState') || record.state;
        record.country = getVal('fieldCountry') || record.country;
        record.email = getVal('fieldEmail') || record.email;
        record.phone = getVal('fieldPhone') || record.phone;
        record.secondary_email = getVal('fieldSecondaryEmail') || record.secondary_email;
        record.secondary_phone = getVal('fieldSecondaryPhone') || record.secondary_phone;
        record.linkedin_profile = getVal('fieldLinkedin') || record.linkedin_profile;
        record.linkedin_url = record.linkedin_profile;
        record.govtJob = getVal('fieldGovtJob') || record.govtJob;
    }

    // Smart Copy-Paste Parser (LinkedIn Profile Parser)
    window.parseProfileHeader = function () {
        var val = document.getElementById('fieldSmartParser').value || '';
        if (!val.trim()) return;

        // Try extracting LinkedIn URL
        var linkedinRegex = /(https?:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+)/i;
        var linkedinMatch = val.match(linkedinRegex);
        if (linkedinMatch) {
            document.getElementById('fieldLinkedin').value = linkedinMatch[1];
        }

        // Try extracting "Company" and "Designation" from patterns like "Software Engineer at Google" or "Software Engineer | Google"
        var headlineRegex = /([A-Za-z0-9\s\-&]+?)\s+(?:at|@|\|)\s+([A-Za-z0-9\s\-&]+)/i;
        var headlineMatch = val.match(headlineRegex);
        if (headlineMatch) {
            document.getElementById('fieldDesignation').value = headlineMatch[1].trim();
            document.getElementById('fieldCompany').value = headlineMatch[2].trim();
        }

        // Try extracting location (e.g., "Bangalore, India" or "Chennai, Tamil Nadu, India")
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

        // Sync values back to record in memory
        var idx = parseInt(fieldIndex.value, 10);
        var record = alumniData.find(function (r) { return r.id === idx; });
        if (record) {
            readFormValues(record);
        }

        showToast('Parsed profile details auto-filled successfully!', 'success');
        saveAutosave(); // Save progress immediately
    };

    function clearErrors() {
        document.querySelectorAll('.form-group input, .form-group select').forEach(function (el) {
            el.classList.remove('error');
        });
        document.querySelectorAll('.error-text').forEach(function (el) {
            el.classList.remove('show');
        });
    }

    function validateForm() {
        let isValid = true;
        clearErrors();

        const fields = [
            { id: 'fieldName', errorId: 'errorName', label: 'Name' },
            { id: 'fieldDept', errorId: 'errorDept', label: 'Department' },
            { id: 'fieldBatch', errorId: 'errorBatch', label: 'Batch' },
            { id: 'fieldCompany', errorId: 'errorCompany', label: 'Company' },
            { id: 'fieldDesignation', errorId: 'errorDesignation', label: 'Designation' },
            { id: 'fieldCity', errorId: 'errorCity', label: 'City' }
        ];

        fields.forEach(function (f) {
            const el = document.getElementById(f.id);
            const err = document.getElementById(f.errorId);
            if (!el || !el.value || el.value.trim() === '') {
                if (el) el.classList.add('error');
                if (err) err.classList.add('show');
                isValid = false;
            }
        });

        return isValid;
    }

    function showToast(message, type) {
        // Disabled: Toast notifications removed from member page per request
        return;
    }

    function handleSaveDraft() {
        saveDraftBtn.classList.add('loading');
        saveDraftBtn.disabled = true;

        var idx = parseInt(fieldIndex.value, 10);
        var record = alumniData.find(function (r) { return r.id === idx; });

        function doLocalSave() {
            if (record) {
                readFormValues(record);
                record.status = 'Draft';
            }
            clearAutosave(idx);
            saveDraftBtn.classList.remove('loading');
            saveDraftBtn.disabled = false;
            renderTable();
            incrementTodayCount();
            closeUpdateModal();
        }

        if (_apiDataLoaded && record && record.id) {
            readFormValues(record);
            var draftData = {
                name: record.name,
                department: record.department,
                batch: record.batch,
                company: record.company,
                designation: record.designation,
                father_name: record.father_name,
                date_of_birth: record.date_of_birth,
                email: record.email,
                phone: record.phone,
                secondary_email: record.secondary_email,
                secondary_phone: record.secondary_phone,
                working_details: record.working_details,
                linkedin_profile: record.linkedin_profile,
                linkedin_url: record.linkedin_profile,
                current_city: record.city,
                state: record.state,
                country: record.country,
                higher_studies: record.higherStudies,
                is_entrepreneur: record.entrepreneur === 'Yes',
                is_government_job: record.govtJob === 'Yes',
                other_occupation: record.otherOcc,
                remarks: record.remarks
            };
            API.saveAlumniDraft(record.id, draftData).then(function () {
                doLocalSave();
            }).catch(function (err) {
                saveDraftBtn.classList.remove('loading');
                saveDraftBtn.disabled = false;
                showToast(err.message || 'Failed to save draft.', 'error');
            });
        } else {
            setTimeout(doLocalSave, 1000);
        }
    }

    function handleSubmitRecord() {
        if (!validateForm()) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        submitRecordBtn.classList.add('loading');
        submitRecordBtn.disabled = true;

        var idx = parseInt(fieldIndex.value, 10);
        var record = alumniData.find(function (r) { return r.id === idx; });

        function doLocalSubmit() {
            if (record) {
                readFormValues(record);
                record.status = 'Completed';
            }
            clearAutosave(idx);
            submitRecordBtn.classList.remove('loading');
            submitRecordBtn.disabled = false;
            renderTable();
            incrementTodayCount();
            showToast('Record submitted successfully!', 'success');
            closeModal();
        }

        if (_apiDataLoaded && record && record.id) {
            readFormValues(record);
            var submitData = {
                name: record.name,
                department: record.department,
                batch: record.batch,
                company: record.company,
                designation: record.designation,
                father_name: record.father_name,
                date_of_birth: record.date_of_birth,
                current_city: record.city,
                state: record.state,
                country: record.country,
                email: record.email,
                phone: record.phone,
                secondary_email: record.secondary_email,
                secondary_phone: record.secondary_phone,
                linkedin_url: record.linkedin_profile,
                working_details: record.working_details,
                higher_studies: record.higherStudies,
                other_occupation: record.otherOcc,
                remarks: record.remarks,
                is_entrepreneur: record.entrepreneur === 'Yes' ? 1 : 0,
                is_government_job: record.govtJob === 'Yes' ? 1 : 0
            };
            API.submitAlumni(record.id, submitData).then(function () {
                if (record.assignment_id) {
                    return API.updateAssignmentStatus(record.assignment_id, { status: 'Completed' });
                }
            }).then(function () {
                doLocalSubmit();
            }).catch(function (err) {
                submitRecordBtn.classList.remove('loading');
                submitRecordBtn.disabled = false;
                showToast(err.message || 'Failed to submit record.', 'error');
            });
        } else {
            setTimeout(doLocalSubmit, 1500);
        }
    }

    function handleSubmitNext() {
        if (!validateForm()) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (submitNextBtn) {
            submitNextBtn.classList.add('loading');
            submitNextBtn.disabled = true;
        }

        var idx = parseInt(fieldIndex.value, 10);
        var record = alumniData.find(function (r) { return r.id === idx; });

        function doLocalSubmitAndNext() {
            if (record) {
                readFormValues(record);
                record.status = 'Completed';
            }
            clearAutosave(idx);
            if (submitNextBtn) {
                submitNextBtn.classList.remove('loading');
                submitNextBtn.disabled = false;
            }
            renderTable();
            incrementTodayCount();
            showToast('Record submitted successfully!', 'success');

            // Find the next pending/draft record
            var nextRecord = alumniData.find(function (r) {
                return r.status !== 'Completed' && r.id !== idx;
            });

            if (nextRecord) {
                openUpdateModal(nextRecord.id);
            } else {
                closeUpdateModal();
                showToast('All assigned records completed! Great job!', 'success');
            }
        }

        if (_apiDataLoaded && record && record.id) {
            readFormValues(record);
            var submitData = {
                name: record.name,
                department: record.department,
                batch: record.batch,
                company: record.company,
                designation: record.designation,
                current_city: record.city,
                state: record.state,
                country: record.country,
                email: record.email,
                phone: record.phone,
                linkedin_url: record.linkedin_profile,
                working_details: record.working_details,
                higher_studies: record.higherStudies,
                other_occupation: record.otherOcc,
                remarks: record.remarks,
                is_entrepreneur: record.entrepreneur === 'Yes' ? 1 : 0,
                is_government_job: record.govtJob === 'Yes' ? 1 : 0
            };
            API.submitAlumni(record.id, submitData).then(function () {
                if (record.assignment_id) {
                    return API.updateAssignmentStatus(record.assignment_id, { status: 'Completed' });
                }
            }).then(function () {
                doLocalSubmitAndNext();
            }).catch(function (err) {
                if (submitNextBtn) {
                    submitNextBtn.classList.remove('loading');
                    submitNextBtn.disabled = false;
                }
                showToast(err.message || 'Failed to submit record.', 'error');
            });
        } else {
            setTimeout(doLocalSubmitAndNext, 1500);
        }
    }

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', handleSaveDraft);
    }
    if (submitRecordBtn) {
        submitRecordBtn.addEventListener('click', handleSubmitRecord);
    }
    if (submitNextBtn) {
        submitNextBtn.addEventListener('click', handleSubmitNext);
    }

    function handleUpdateClick(e) {
        var btn = e.target.closest('.btn-update');
        if (btn) {
            const idx = btn.getAttribute('data-index');
            openUpdateModal(idx);
        }
    }

    function handleModalClose(e) {
        var updateModalEl = document.getElementById('updateModal');
        if (e.target === updateModalEl || e.target === modalClose || e.target.closest('#modalClose') || e.target.closest('#cancelModalBtn')) {
            closeUpdateModal();
        }
    }

    function handleKeyboard(e) {
        if (!updateModal.classList.contains('show')) return;

        if (e.key === 'Escape') {
            closeUpdateModal();
        }

        // Ctrl + S: Save Draft
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            handleSaveDraft();
        }

        // Ctrl + Enter: Submit Record
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmitRecord();
        }
    }

    function initNotifications() {
        var nBtn = document.getElementById('notifBtn');
        var nDrop = document.getElementById('notifDropdown');
        var mRead = document.getElementById('markAllRead');

        if (nBtn && nDrop) {
            nBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                nDrop.classList.toggle('active');
            });
            document.addEventListener('click', function (e) {
                if (!nBtn.contains(e.target) && !nDrop.contains(e.target)) {
                    nDrop.classList.remove('active');
                }
            });
        }

        if (mRead) {
            mRead.addEventListener('click', function () {
                var list = document.getElementById('notifList');
                if (list) {
                    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.85rem;">No new notifications</div>';
                }
                var pendingIds = alumniData.filter(function (r) { return r.status === 'Pending' || r.status === 'Draft'; }).map(function (r) { return String(r.id); });
                var cleared = JSON.parse(localStorage.getItem('cleared_notifications_member') || '[]');
                pendingIds.forEach(function (id) { if (cleared.indexOf(id) === -1) cleared.push(id); });
                localStorage.setItem('cleared_notifications_member', JSON.stringify(cleared));

                var dot = document.querySelector('#notifBtn .notif-dot');
                if (dot) dot.style.display = 'none';
                showToast('All notifications cleared', 'success');
                if (nDrop) nDrop.classList.remove('active');
            });
        }
    }

    function initSidebar() {
        document.querySelectorAll('.nav-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var page = item.getAttribute('data-page');
                if (page === 'logout') {
                    showToast('Logging out...', 'warning');
                    API.clearToken();
                    setTimeout(function () {
                        window.location.href = 'index.html?logout=success';
                    }, 1500);
                    return;
                }
                if (page === 'replies') {
                    if (typeof window.openAlumniRepliesModal === 'function') window.openAlumniRepliesModal();
                    return;
                }
                if (page === 'campaign') {
                    if (typeof window.openEmailCampaignModal === 'function') window.openEmailCampaignModal();
                    return;
                }
                if (page === 'chat' || page === 'notifications') {
                    return;
                }

                document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
                item.classList.add('active');

                // Toggle sections
                var dashboardSection = document.getElementById('section-dashboard');
                var settingsSection = document.getElementById('section-settings');
                var previewSection = document.getElementById('section-preview');
                if (page === 'dashboard') {
                    if (dashboardSection) dashboardSection.style.display = 'block';
                    if (settingsSection) settingsSection.style.display = 'none';
                    if (previewSection) previewSection.style.display = 'none';
                } else if (page === 'settings') {
                    if (dashboardSection) dashboardSection.style.display = 'none';
                    if (settingsSection) settingsSection.style.display = 'block';
                    if (previewSection) previewSection.style.display = 'none';
                } else if (page === 'preview') {
                    if (dashboardSection) dashboardSection.style.display = 'none';
                    if (settingsSection) settingsSection.style.display = 'none';
                    if (previewSection) previewSection.style.display = 'block';
                    loadPreviewSpreadsheet();
                }

                var mainContent = document.querySelector('.main-content');
                if (mainContent) mainContent.scrollTop = 0;
                window.scrollTo({ top: 0, behavior: 'instant' });

                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                }
            });
        });

        var _previewDebounce = null;
        window.onPreviewFilterChange = function () {
            previewPage = 1;
            clearTimeout(_previewDebounce);
            _previewDebounce = setTimeout(loadPreviewSpreadsheet, 300);
        };

        window.loadPreviewSpreadsheet = function () {
            var body = document.getElementById('previewSpreadsheetBody');
            if (!body) return;
            body.innerHTML = '<tr><td colspan="18" style="text-align:center;padding:24px;color:var(--text-secondary);"><span class="spinner spinner-sm"></span> Loading records...</td></tr>';

            var searchEl = document.getElementById('previewSearch');
            var search = searchEl ? searchEl.value.trim() : '';
            var dept = filterDept ? filterDept.value : '';
            var batch = filterBatch ? filterBatch.value : '';
            var status = filterStatus ? filterStatus.value : '';
            var limitEl = document.getElementById('previewLimit');
            var limitVal = limitEl ? (parseInt(limitEl.value, 10) || 10) : 10;
            previewLimit = limitVal;

            API.getAssignedAlumni({
                page: previewPage,
                limit: previewLimit,
                search: search || undefined,
                department: dept || undefined,
                batch: batch || undefined,
                status: status || undefined
            }).then(function (res) {
                var records = [];
                var total = 0;
                if (res && res.success && res.data) {
                    records = res.data.records || (Array.isArray(res.data) ? res.data : []);
                    var pag = res.data.pagination;
                    total = (pag && pag.total) ? pag.total : records.length;
                } else if (Array.isArray(alumniData) && alumniData.length > 0) {
                    records = alumniData;
                    total = records.length;
                }

                var infoEl = document.getElementById('previewTableInfo');
                if (infoEl) {
                    var start = records.length > 0 ? (previewPage - 1) * previewLimit + 1 : 0;
                    var end = (previewPage - 1) * previewLimit + records.length;
                    infoEl.textContent = 'Showing ' + start + ' to ' + end + ' of ' + total + ' entries';
                }

                if (records.length === 0) {
                    body.innerHTML = '<tr><td colspan="17" style="text-align:center;padding:24px;color:var(--text-secondary);">No records found matching filters.</td></tr>';
                    renderPreviewPagination(total);
                    return;
                }

                // Sort alphabetically by default
                records.sort(function (a, b) {
                    var nameA = (a.name || '').toLowerCase();
                    var nameB = (b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                var html = '';
                records.forEach(function (row, idx) {
                    var serial = (previewPage - 1) * previewLimit + idx + 1;
                    var statusStr = row.status || 'Pending';
                    var badgeClass = 'badge-secondary';
                    if (statusStr === 'Completed') badgeClass = 'badge-success';
                    else if (statusStr === 'Pending') badgeClass = 'badge-warning';
                    else if (statusStr === 'ASSIGNED_TO_LEADER') badgeClass = 'badge-primary';
                    else if (statusStr === 'Draft') badgeClass = 'badge-info';

                    var link = row.linkedin_profile || '';
                    var linkedin;
                    if (link) {
                        var href = link.startsWith('http') ? link : 'https://' + link;
                        var isFb = href.toLowerCase().indexOf('facebook.com') !== -1 || href.toLowerCase().indexOf('fb.com') !== -1;
                        var iconClass = isFb ? 'fab fa-facebook' : 'fab fa-linkedin';
                        var iconColor = isFb ? '#1877F2' : '#0A66C2';
                        var titleText = isFb ? 'Open Facebook Profile' : 'Open LinkedIn Profile';
                        var safeHref = String(href).replace(/'/g, "\\'").replace(/"/g, "&quot;");
                        linkedin = '<div style="display:flex;align-items:center;gap:10px;">' +
                            '<a href="' + safeHref + '" target="_blank" rel="noopener noreferrer" style="color:' + iconColor + ';font-size:1.15rem;text-decoration:none;" title="' + titleText + '"><i class="' + iconClass + '"></i></a>' +
                            '<button onclick="event.stopPropagation();showLinkPreview(this,\'' + safeHref + '\')" style="background:none;border:none;cursor:pointer;color:#64748B;font-size:0.85rem;padding:2px 4px;line-height:1;" title="Show URL"><i class="far fa-eye"></i></button>' +
                            '</div>';
                    } else {
                        linkedin = '-';
                    }
                    var updatedDateStr = row.updated_date ? new Date(row.updated_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

                    var fatherVal = String(row.father_name || row.fatherName || row.pi_father_name || '');
                    var safeName = String(row.name || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
                    var safeFather = fatherVal.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                    var nameCellContent = '<div>' +
                        '<div style="display:flex;align-items:center;gap:6px;">' +
                        '  <span style="font-weight:600;color:#1E293B;">' + (row.name || '-') + '</span>' +
                        '  <button type="button" onclick="event.stopPropagation();copyAlumniAndFather(\'' + safeName + '\', \'' + safeFather + '\')" style="background:none;border:none;cursor:pointer;color:#64748B;font-size:0.8rem;padding:2px;" title="Copy Alumni & Father Name"><i class="far fa-copy"></i></button>' +
                        '</div>' +
                        (fatherVal ? '<div style="font-size:0.75rem;color:#64748B;font-weight:400;margin-top:2px;">S/O: ' + fatherVal + '</div>' : '') +
                        '</div>';

                    html += '<tr>' +
                        '<td class="sticky-col" style="padding:12px 16px; border-bottom:1px solid var(--border); font-weight:600; left:0;">' + serial + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border); font-weight:600;">' + nameCellContent + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.register_no || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.father_name || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.date_of_birth || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.department || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.batch || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.email || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.phone || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.company || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.designation || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + linkedin + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);"><span class="badge ' + badgeClass + '">' + statusStr + '</span></td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + updatedDateStr + '</td>' +
                        '</tr>';
                });
                body.innerHTML = html;
                renderPreviewPagination(total);
            }).catch(function (err) {
                console.error('loadPreviewSpreadsheet error:', err);
                if (Array.isArray(alumniData) && alumniData.length > 0) {
                    var records = alumniData;
                    var total = records.length;
                    var infoEl = document.getElementById('previewTableInfo');
                    if (infoEl) {
                        infoEl.textContent = 'Showing 1 to ' + records.length + ' of ' + total + ' entries';
                    }
                    var html = '';
                    records.forEach(function (row, idx) {
                        var serial = idx + 1;
                        var statusStr = row.status || 'Pending';
                        var badgeClass = statusStr === 'Completed' ? 'badge-success' : 'badge-warning';
                        var fatherVal = String(row.father_name || row.fatherName || '');
                        var safeName = String(row.name || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
                        var safeFather = fatherVal.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                        var nameCellContent = '<div><div style="display:flex;align-items:center;gap:6px;"><span style="font-weight:600;">' + (row.name || '-') + '</span><button type="button" onclick="event.stopPropagation();copyAlumniAndFather(\'' + safeName + '\', \'' + safeFather + '\')" style="background:none;border:none;cursor:pointer;color:#64748B;font-size:0.8rem;padding:2px;"><i class="far fa-copy"></i></button></div></div>';
                        html += '<tr>' +
                            '<td class="sticky-col" style="padding:12px 16px; border-bottom:1px solid var(--border); font-weight:600; left:0;">' + serial + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border); font-weight:600;">' + nameCellContent + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.register_no || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.father_name || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.date_of_birth || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.department || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.batch || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.email || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.phone || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.company || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.designation || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.linkedin_profile || '-') + '</td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);"><span class="badge ' + badgeClass + '">' + statusStr + '</span></td>' +
                            '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">-</td>' +
                            '</tr>';
                    });
                    body.innerHTML = html;
                    renderPreviewPagination(total);
                } else {
                    body.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:24px;color:var(--danger);">Failed to load records.</td></tr>';
                }
            });
        };

        function renderPreviewPagination(total) {
            var pagContainer = document.getElementById('previewPagination');
            if (!pagContainer) return;
            var totalPages = Math.ceil(total / previewLimit) || 1;

            var html = '';
            // Prev button
            html += '<button class="prev" ' + (previewPage <= 1 ? 'disabled' : '') + ' onclick="changePreviewPage(\'prev\')"><i class="fas fa-chevron-left"></i></button>';

            for (var i = 1; i <= totalPages; i++) {
                if (totalPages > 6) {
                    if (i === 1 || i === totalPages || Math.abs(i - previewPage) <= 1) {
                        html += '<button class="' + (i === previewPage ? 'active' : '') + '" onclick="changePreviewPage(' + i + ')">' + i + '</button>';
                    } else if (i === 2 || i === totalPages - 1) {
                        html += '<span class="dots">...</span>';
                    }
                } else {
                    html += '<button class="' + (i === previewPage ? 'active' : '') + '" onclick="changePreviewPage(' + i + ')">' + i + '</button>';
                }
            }
            // Remove duplicate consecutive dots
            html = html.replace(/(<span class="dots">\.\.\.<\/span>\s*)+/g, '<span class="dots">...</span>');

            // Next button
            html += '<button class="next" ' + (previewPage >= totalPages ? 'disabled' : '') + ' onclick="changePreviewPage(\'next\')"><i class="fas fa-chevron-right"></i></button>';
            pagContainer.innerHTML = html;
        }

        window.changePreviewPage = function (target) {
            if (target === 'prev') {
                if (previewPage > 1) previewPage--;
            } else if (target === 'next') {
                previewPage++;
            } else {
                previewPage = parseInt(target, 10) || 1;
            }
            loadPreviewSpreadsheet();
        };

        window.switchSettingsTab = function (tabName, btn) {
            var tabsContainer = btn.closest('.card') || btn.closest('.card-body');
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

        window.saveMemberProfile = function () {
            var user = API.getUser();
            if (!user || !user.id) return;
            var name = document.getElementById('settingsName').value.trim();
            var email = document.getElementById('settingsEmail').value.trim();
            if (!name || !email) {
                showToast('Name and Email are required.', 'error');
                return;
            }

            var parts = name.split(' ');
            var fName = parts[0];
            var lName = parts.slice(1).join(' ') || '';

            API.updateProfile(user.id, { firstName: fName, lastName: lName, email: email }).then(function (res) {
                showToast('Profile settings updated successfully!', 'success');
                user.name = name;
                user.email = email;
                localStorage.setItem('user', JSON.stringify(user));
                setMemberUserInfo();
            }).catch(function (err) {
                showToast(err.message || 'Failed to update profile.', 'error');
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

        window.saveMemberPassword = function () {
            var oldPass = document.getElementById('settingsOldPass').value;
            var newPass = document.getElementById('settingsNewPass').value;
            var confirmPass = document.getElementById('settingsConfirmPass').value;

            if (!oldPass || !newPass || !confirmPass) {
                showToast('All password fields are required.', 'error');
                return;
            }
            if (newPass !== confirmPass) {
                showToast('Passwords do not match.', 'error');
                return;
            }

            API.changePassword(oldPass, newPass).then(function (res) {
                document.getElementById('settingsOldPass').value = '';
                document.getElementById('settingsNewPass').value = '';
                document.getElementById('settingsConfirmPass').value = '';
                window.showPasswordSuccessModal();
            }).catch(function (err) {
                showToast(err.message || 'Failed to update password.', 'error');
            });
        };
    }

    function initSessionTimeout() {
        function resetSession() {
            if (sessionTimeout) {
                clearTimeout(sessionTimeout);
            }
            sessionTimeout = setTimeout(function () {
                showToast('Session expired. Please login again.', 'warning');
                setTimeout(function () {
                    window.location.reload();
                }, 2000);
            }, 30 * 60 * 1000);
        }
        document.addEventListener('click', resetSession);
        document.addEventListener('keypress', resetSession);
        document.addEventListener('mousemove', resetSession);
        resetSession();
    }

    function setMemberUserInfo() {
        var user = API.getUser();
        if (user && user.name) {
            document.getElementById('memberName').textContent = user.name.split(' ')[0] || user.name;

            // Populate sidebar user details
            var sidebarName = document.getElementById('sidebarUserName');
            var sidebarAvatar = document.getElementById('sidebarUserAvatar');
            if (sidebarName) sidebarName.textContent = user.name;
            if (sidebarAvatar) {
                var names = user.name.split(' ');
                var initials = names[0].charAt(0).toUpperCase();
                if (names.length > 1) {
                    initials += names[names.length - 1].charAt(0).toUpperCase();
                }
                sidebarAvatar.textContent = initials;
            }

            // Populate General Settings with real user data
            var settingsName = document.getElementById('settingsName');
            var settingsEmail = document.getElementById('settingsEmail');
            if (settingsName) settingsName.value = user.name;
            if (settingsEmail && user.email) settingsEmail.value = user.email;
        }
    }

    function populateNotifications() {
        var list = document.getElementById('notifList');
        if (!list) return;

        var cleared = JSON.parse(localStorage.getItem('cleared_notifications_member') || '[]');
        var pendingRecords = alumniData.filter(function (r) {
            return (r.status === 'Pending' || r.status === 'Draft') && cleared.indexOf(String(r.id)) === -1;
        });
        var dot = document.querySelector('#notifBtn .notif-dot');

        if (pendingRecords.length === 0) {
            list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.85rem;">No new notifications</div>';
            if (dot) dot.style.display = 'none';
            return;
        }

        if (dot) {
            dot.style.display = 'block';
        }

        var html = '';
        var drafts = pendingRecords.filter(function (r) { return r.status === 'Draft'; });
        var pendings = pendingRecords.filter(function (r) { return r.status === 'Pending'; });

        if (pendings.length > 0) {
            html += '<div class="notif-item">' +
                '<div class="notif-icon blue"><i class="fas fa-clock"></i></div>' +
                '<div class="notif-text">' +
                '<p>You have ' + pendings.length + ' pending assignments to update</p>' +
                '<span>Action required</span>' +
                '</div>' +
                '<span class="notif-dot"></span>' +
                '</div>';
        }

        if (drafts.length > 0) {
            html += '<div class="notif-item">' +
                '<div class="notif-icon orange"><i class="fas fa-pen"></i></div>' +
                '<div class="notif-text">' +
                '<p>You have ' + drafts.length + ' saved drafts</p>' +
                '<span>Action required</span>' +
                '</div>' +
                '<span class="notif-dot"></span>' +
                '</div>';
        }
        list.innerHTML = html;
    }

    function populateFiltersFromData() {
        var deptMap = {};
        var batchMap = {};
        alumniData.forEach(function (r) {
            if (r.department) deptMap[r.department] = true;
            if (r.batch) batchMap[r.batch] = true;
        });
        if (filterDept) {
            var html = '<option value="">All Departments</option>';
            Object.keys(deptMap).sort().forEach(function (d) { html += '<option value="' + d + '">' + d + '</option>'; });
            filterDept.innerHTML = html;
        }
        if (filterBatch) {
            var html = '<option value="">All Batches</option>';
            Object.keys(batchMap).sort().forEach(function (b) { html += '<option value="' + b + '">' + b + '</option>'; });
            filterBatch.innerHTML = html;
        }
    }

    function fetchMemberData() {
        window.fetchMemberData = fetchMemberData; // expose globally
        return Promise.all([
            API.getMemberDashboard().catch(function () { return null; }),
            API.getAssignedAlumni({ page: 1, limit: 500 }).catch(function () { return null; })
        ]).then(function (results) {
            var dash = results[0];
            if (dash && dash.success) {
                _apiMemberData = dash.data;
                _apiDataLoaded = true;
                var d = _apiMemberData;
                document.getElementById('assignedCount').textContent = d.assignedRecords || d.totalAssigned || 0;
                document.getElementById('completedCount').textContent = d.completedRecords || d.completed || 0;
                document.getElementById('draftCount').textContent = d.draftRecords || d.drafts || 0;
                document.getElementById('remainingCount').textContent = d.pendingRecords || d.pending || 0;
                var todayVal = d.todayUpdates || d.todayCount || 0;
                todayUpdateCount = todayVal;
                document.getElementById('todayCount').textContent = todayVal;

                // Set the Team Leader name label
                var leaderNameEl = document.getElementById('memberLeaderName');
                if (leaderNameEl) {
                    leaderNameEl.textContent = d.leaderName || 'Not Assigned';
                }
            }
            var assigned = results[1];
            if (assigned && assigned.success && assigned.data && assigned.data.records) {
                _apiAlumniData = assigned.data.records.map(function (a) {
                    var st = a.status || 'Pending';
                    return {
                        id: a.alumni_id || a.id,
                        alumni_id: a.alumni_id || a.id,
                        assignment_id: a.assignment_id,
                        name: a.name || a.fullName || 'Unknown',
                        register_no: a.register_no || '',
                        department: a.department || a.dept || '',
                        batch: a.batch || '',
                        company: a.company || '',
                        designation: a.designation || '',
                        city: a.current_city || a.city || '',
                        state: a.state || '',
                        country: a.country || 'India',
                        email: a.email || '',
                        phone: a.phone || '',
                        linkedin_profile: a.linkedin_profile || '',
                        working_details: a.working_details || '',
                        date_of_birth: a.date_of_birth || '',
                        father_name: a.father_name || '',
                        higherStudies: a.higher_studies || a.higherStudies || 'No',
                        higherDetails: a.higher_details || a.higherDetails || '',
                        entrepreneur: a.is_entrepreneur ? 'Yes' : (a.entrepreneur || 'No'),
                        govtJob: a.is_government_job ? 'Yes' : (a.govtJob || 'No'),
                        otherOcc: a.other_occupation || a.otherOcc || '',
                        remarks: a.remarks || '',
                        status: st
                    };
                });
                alumniData = _apiAlumniData;
            } else {
                alumniData = [];
            }
            populateFiltersFromData();
            renderTable();
            populateNotifications();
        }).catch(function () {
            alumniData = [];
            renderTable();
            populateNotifications();
        });
    }
    function init() {
        setMemberUserInfo();

        var hideLoading = function () {
            var ls = document.getElementById('loadingScreen');
            if (ls) ls.classList.add('hide');
        };

        fetchMemberData().then(hideLoading).catch(hideLoading);

        // Fallback: hide loading after 8s regardless
        setTimeout(hideLoading, 8000);

        if (tableSearch) {
            tableSearch.addEventListener('input', function () {
                currentPage = 1;
                renderTable();
            });
        }

        if (recordsBody) recordsBody.addEventListener('click', handleUpdateClick);

        if (saveDraftBtn) saveDraftBtn.addEventListener('click', handleSaveDraft);
        if (submitRecordBtn) submitRecordBtn.addEventListener('click', handleSubmitRecord);
        if (submitNextBtn) submitNextBtn.addEventListener('click', handleSubmitNext);

        // Set up input autosave listeners for all fields in the update modal form
        if (updateForm) {
            updateForm.querySelectorAll('input, select, textarea').forEach(function (inputEl) {
                if (inputEl.id !== 'fieldSmartParser') {
                    inputEl.addEventListener('input', triggerAutosave);
                    inputEl.addEventListener('change', triggerAutosave);
                }
            });
        }

        if (modalClose) modalClose.addEventListener('click', handleModalClose);
        if (cancelModalBtn) cancelModalBtn.addEventListener('click', handleModalClose);
        if (updateModal) updateModal.addEventListener('click', handleModalClose);

        document.addEventListener('keydown', handleKeyboard);

        var rppSelect = document.getElementById('rowsPerPageSelect');
        if (rppSelect) {
            rppSelect.addEventListener('change', function () {
                rowsPerPage = parseInt(this.value, 10);
                currentPage = 1;
                renderTable();
            });
        }

        initNotifications();
        initSidebar();
        initSessionTimeout();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

/* ── Global helpers for Security Settings (called via onclick in HTML) ── */

window.switchSettingsTab = function (tabName, btn) {
    // Deactivate all tab buttons
    document.querySelectorAll('#settingsTabs .tab-item').forEach(function (b) {
        b.classList.remove('active');
        b.style.color = '';
        b.style.borderBottom = '';
    });
    // Hide all tab content panels
    document.querySelectorAll('.tab-content').forEach(function (p) {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    // Activate clicked button
    if (btn) {
        btn.classList.add('active');
        btn.style.color = 'var(--primary)';
        btn.style.borderBottom = '2px solid var(--primary)';
    }
    // Show the target panel
    var panel = document.getElementById('tab-' + tabName);
    if (panel) {
        panel.style.display = '';
        panel.classList.add('active');
    }
};

window.togglePasswordVisibility = function (inputId, btn) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var icon = btn ? btn.querySelector('i') : null;
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    } else {
        input.type = 'password';
        if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
    }
};

window.showPasswordSuccessModal = function () {
    var modal = document.getElementById('passwordSuccessModal');
    if (modal) modal.classList.add('show');
};

window.closePasswordSuccessModal = function () {
    var modal = document.getElementById('passwordSuccessModal');
    if (modal) modal.classList.remove('show');
};

window.saveMemberPassword = function () {
    var oldPass = document.getElementById('settingsOldPass');
    var newPass = document.getElementById('settingsNewPass');
    var confirmPass = document.getElementById('settingsConfirmPass');
    var btn = document.querySelector('#tab-security .btn-primary');

    if (!oldPass || !newPass || !confirmPass) return;

    var oldVal = oldPass.value.trim();
    var newVal = newPass.value.trim();
    var confirmVal = confirmPass.value.trim();

    // --- Validation ---
    if (!oldVal) {
        _memberShowToast('Please enter your current password.', 'warning');
        oldPass.focus();
        return;
    }
    if (!newVal || newVal.length < 6) {
        _memberShowToast('New password must be at least 6 characters.', 'warning');
        newPass.focus();
        return;
    }
    if (newVal !== confirmVal) {
        _memberShowToast('New password and confirm password do not match.', 'error');
        confirmPass.focus();
        return;
    }
    if (oldVal === newVal) {
        _memberShowToast('New password must be different from the current password.', 'warning');
        newPass.focus();
        return;
    }

    // --- Call API ---
    if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

    API.changePassword(oldVal, newVal)
        .then(function (res) {
            oldPass.value = '';
            newPass.value = '';
            confirmPass.value = '';
            window.showPasswordSuccessModal();
        })
        .catch(function (err) {
            var msg = (err && err.message) ? err.message : 'Failed to update password. Please try again.';
            _memberShowToast(msg, 'error');
        })
        .finally(function () {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Update Password';
            }
        });
};

/* Internal toast helper so the global functions can show toasts */
function _memberShowToast(message, type) {
    if (window.Toast) {
        if (type === 'error' || type === 'danger') window.Toast.error(type === 'error' ? 'Error' : 'Alert', message);
        else if (type === 'warning') window.Toast.warning('Warning', message);
        else if (type === 'info') window.Toast.info('Notification', message);
        else window.Toast.success('Success', message);
        return;
    }
    if (typeof window.showToast === 'function') {
        window.showToast(type === 'error' ? 'Error' : (type === 'warning' ? 'Warning' : 'Success'), message, type === 'error' ? 'danger' : type);
        return;
    }
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'danger' : type);
    var icons = { success: 'fa-check-circle', danger: 'fa-times-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    toast.innerHTML =
        '<div class="toast-icon"><i class="fas ' + (icons[type] || 'fa-info-circle') + '"></i></div>' +
        '<div class="toast-content">' +
        '<p class="toast-title">' + (type === 'error' ? 'Error' : (type === 'warning' ? 'Warning' : (type === 'info' ? 'Info' : 'Success'))) + '</p>' +
        '<p class="toast-message">' + message + '</p>' +
        '</div>' +
        '<button class="toast-close" onclick="this.parentElement.classList.add(\'exit\');setTimeout(function(){if(this.parentElement)this.parentElement.remove()}.bind(this),300)"><i class="fas fa-times"></i></button>';
    container.appendChild(toast);
    setTimeout(function () {
        if (toast.parentElement) {
            toast.classList.add('exit');
            setTimeout(function () { if (toast.parentElement) toast.remove(); }, 300);
        }
    }, 4000);
}

var _undoTargetId = null;

window.confirmUndoSubmission = function (alumniId, name) {
    _undoTargetId = alumniId;
    var nameEl = document.getElementById('undoTargetName');
    if (nameEl) nameEl.textContent = name || 'this record';
    var modal = document.getElementById('undoConfirmModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
};

window.closeUndoModal = function () {
    _undoTargetId = null;
    var modal = document.getElementById('undoConfirmModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
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
        ? window.API.reopenAssignment(_undoTargetId, 'Undone by member')
        : window.API.reopenAlumni(_undoTargetId);

    apiCall.then(function (res) {
        if (window.Toast) window.Toast.success('Submission Undone!', 'Record moved back to Draft successfully.');
        else _memberShowToast('Submission undone. Record is back in Draft.', 'success');
        window.closeUndoModal();
        if (window.fetchMemberData) window.fetchMemberData();
    }).catch(function (err) {
        if (window.Toast) window.Toast.error('Undo Failed', err && err.message || 'Failed to undo submission.');
        else _memberShowToast(err && err.message || 'Failed to undo submission.', 'error');
    }).finally(function () {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-undo"></i> Undo & Change to Draft';
        }
    });
};

window.undoAlumniSubmission = function () {
    var fieldIndexEl = document.getElementById('fieldIndex');
    var idx = fieldIndexEl ? parseInt(fieldIndexEl.value, 10) : 0;
    if (!idx) return;
    window.confirmUndoSubmission(idx, '');
};

/* ────────────────────────────────────────────────────────────
   INTERACTIVE EXPORT ENGINE & CUSTOMIZATION MODAL (MEMBER)
   ──────────────────────────────────────────────────────────── */
var _memberColumns = [
    { key: 'register_no', label: 'Register Number', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'father_name', label: 'Father Name', visible: true },
    { key: 'date_of_birth', label: 'Date of Birth', visible: true },
    { key: 'gender', label: 'Gender', visible: true },
    { key: 'department', label: 'Department', visible: true },
    { key: 'batch', label: 'Batch', visible: true },
    { key: 'email', label: 'Primary Email', visible: true },
    { key: 'secondary_email', label: 'Secondary Email', visible: true },
    { key: 'phone', label: 'Primary Phone', visible: true },
    { key: 'secondary_phone', label: 'Secondary Phone', visible: true },
    { key: 'company', label: 'Company', visible: true },
    { key: 'designation', label: 'Designation', visible: true },
    { key: 'experience', label: 'Experience', visible: true },
    { key: 'city', label: 'City', visible: true },
    { key: 'state', label: 'State', visible: true },
    { key: 'country', label: 'Country', visible: true },
    { key: 'linkedin_profile', label: 'LinkedIn', visible: true },
    { key: 'working_details', label: 'Working Details', visible: true },
    { key: 'updated_date', label: 'Updated Date', visible: true }
];

var _exportSelectedCols = {};

window.handleExport = function () {
    openExportCustomizationModal();
};

window.exportAlumniCSV = function () {
    openExportCustomizationModal();
};

window.openExportCustomizationModal = function () {
    _memberColumns.forEach(function (col) {
        if (_exportSelectedCols[col.key] === undefined) {
            _exportSelectedCols[col.key] = true;
        }
    });

    populateExportModalFilterOptions();
    renderExportColumnChips();
    onExportFilterChange();

    if (window.openModal) openModal('exportCustomizationModal');
};

window.populateExportModalFilterOptions = function () {
    var deptSel = document.getElementById('expFilterDept');
    var batchSel = document.getElementById('expFilterBatch');

    var srcDept = document.getElementById('previewFilterDept');
    var srcBatch = document.getElementById('previewFilterBatch');

    if (deptSel && srcDept && deptSel.options.length <= 1) {
        deptSel.innerHTML = srcDept.innerHTML;
    }
    if (batchSel && srcBatch && batchSel.options.length <= 1) {
        batchSel.innerHTML = srcBatch.innerHTML;
    }
};

window.resetExportModalFilters = function () {
    var expDept = document.getElementById('expFilterDept');
    var expBatch = document.getElementById('expFilterBatch');
    var expStatus = document.getElementById('expFilterStatus');
    var expSearch = document.getElementById('expFilterSearch');

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

        API.getMyAssignments(params).then(function (res) {
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
        status: expStatus && expStatus.value ? expStatus.value : undefined
    };
};

window.renderExportColumnChips = function () {
    var container = document.getElementById('exportColsContainer');
    if (!container) return;

    var html = '';
    _memberColumns.forEach(function (col) {
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
    _memberColumns.forEach(function (col) {
        _exportSelectedCols[col.key] = selectState;
    });
    renderExportColumnChips();
    updateExportStatsBanner();
};

window.updateExportStatsBanner = function () {
    var colsEl = document.getElementById('expStatCols');
    var statusEl = document.getElementById('expStatStatus');

    var selectedCount = Object.keys(_exportSelectedCols).filter(function (k) { return _exportSelectedCols[k]; }).length;
    if (colsEl) colsEl.innerText = selectedCount + ' / ' + _memberColumns.length;

    var expStatus = document.getElementById('expFilterStatus');
    var statusVal = expStatus ? expStatus.value : '';
    if (statusEl) statusEl.innerText = statusVal ? statusVal.toUpperCase() : 'ALL';
};

window.startExportDownloadProcess = function () {
    var selectedKeys = Object.keys(_exportSelectedCols).filter(function (k) { return _exportSelectedCols[k]; });
    if (selectedKeys.length === 0) {
        _memberShowToast('Please select at least one column to export.', 'warning');
        return;
    }

    if (window.closeModal) closeModal('exportCustomizationModal');

    var overlay = document.getElementById('exportProgressOverlay');
    var fill = document.getElementById('exportProgressBarFill');
    var title = document.getElementById('exportProgressTitle');
    var sub = document.getElementById('exportProgressSubtitle');
    var percentEl = document.getElementById('exportProgressPercent');
    var countEl = document.getElementById('exportProgressCount');

    if (overlay) overlay.classList.add('show');
    if (fill) fill.style.width = '10%';
    if (title) title.innerText = 'Querying Database...';
    if (sub) sub.innerText = 'Fetching assigned alumni records...';
    if (percentEl) percentEl.innerText = '10%';

    var params = buildExportParams();

    API.getMyAssignments(params).then(function (res) {
        if (res && res.success) {
            var data = (res.data && res.data.records) ? res.data.records : (Array.isArray(res.data) ? res.data : []);
            if (data.length === 0) {
                if (overlay) overlay.classList.remove('show');
                _memberShowToast('No alumni records found matching selected export filters.', 'warning');
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

                var activeCols = _memberColumns.filter(function (c) { return _exportSelectedCols[c.key]; });
                var csv = '\uFEFF';
                var headers = activeCols.map(function (c) { return c.label; });
                csv += headers.join(',') + '\r\n';

                data.forEach(function (row) {
                    var line = activeCols.map(function (col) {
                        var val = row[col.key];
                        if (col.key === 'updated_date') {
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
                link.download = 'Member_Assigned_Alumni_' + new Date().toISOString().slice(0, 10) + '.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

                setTimeout(function () {
                    if (overlay) overlay.classList.remove('show');
                    _memberShowToast('Exported ' + data.length + ' records with ' + activeCols.length + ' selected columns!', 'success');
                }, 600);
            }, 700);

        } else {
            if (overlay) overlay.classList.remove('show');
            _memberShowToast('Failed to retrieve alumni records for export.', 'error');
        }
    }).catch(function (err) {
        console.error('Export error:', err);
        if (overlay) overlay.classList.remove('show');
        _memberShowToast('An error occurred during export: ' + (err.message || 'Network error'), 'error');
    });
};

/* ── ALUMNI REPLIES INBOX HANDLERS ── */
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
            if (typeof _memberShowToast === 'function') _memberShowToast('Reply marked as reviewed!', 'success');
            window.openAlumniRepliesModal();
        }
    }).catch(function () { });
};

window.copyAlumniAndFather = function (name, father) {
    var textStr = 'Alumni: ' + name + (father ? ' | Father: ' + father : '');
    if (navigator.clipboard) {
        navigator.clipboard.writeText(textStr).then(function () {
            showToast('Copied: ' + textStr, 'success');
        });
    }
};

/* ── EMAIL CAMPAIGN HANDLERS (MEMBER) ── */
window.switchCampaignTab = function (tabName) {
    var tabRec = document.getElementById('campaignTabRecipients');
    var tabTpl = document.getElementById('campaignTabTemplate');
    var btnRec = document.getElementById('tabBtnCampaignRecipients');
    var btnTpl = document.getElementById('tabBtnCampaignTemplate');

    if (tabName === 'recipients') {
        if (tabRec) tabRec.style.display = 'block';
        if (tabTpl) tabTpl.style.display = 'none';
        if (btnRec) { btnRec.style.color = '#2563EB'; btnRec.style.borderBottom = '2px solid #2563EB'; }
        if (btnTpl) { btnTpl.style.color = '#64748B'; btnTpl.style.borderBottom = 'none'; }
    } else {
        if (tabRec) tabRec.style.display = 'none';
        if (tabTpl) tabTpl.style.display = 'block';
        if (btnRec) { btnRec.style.color = '#64748B'; btnRec.style.borderBottom = 'none'; }
        if (btnTpl) { btnTpl.style.color = '#2563EB'; btnTpl.style.borderBottom = '2px solid #2563EB'; }
    }
};

window.previewIndividualAlumniEmail = function (name, email, assignId) {
    var nameTag = document.getElementById('previewAlumniName');
    var emailTag = document.getElementById('previewToEmail');
    var replyToTag = document.getElementById('previewReplyToTag');

    if (nameTag) nameTag.textContent = name || 'Alumnus';
    if (emailTag) emailTag.textContent = email || 'alumni@mountzion.ac.in';
    if (replyToTag) replyToTag.textContent = 'alumnims+' + (assignId || 'ID') + '@mountzion.ac.in';

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
    if (badge) badge.textContent = 'Counting assigned records...';
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#64748B;"><i class="fas fa-spinner fa-spin"></i> Loading alumni records...</td></tr>';

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
            } else {
                if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#64748B;">No assigned alumni records found.</td></tr>';
            }
        } else {
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#EF4444;">Failed to load assigned alumni.</td></tr>';
        }
    }).catch(function () {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#EF4444;">Error fetching assigned alumni.</td></tr>';
    });

    if (window.openModal) window.openModal('emailCampaignModal');
};

window.submitEmailCampaignLaunch = function () {
    var launchBtn = document.getElementById('launchCampaignSubmitBtn');
    if (launchBtn) { launchBtn.disabled = true; launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Launching...'; }

    var token = localStorage.getItem('token');
    fetch('/api/v1/email-campaigns', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ campaign_name: 'Member Email Update Campaign ' + new Date().toLocaleDateString() })
    }).then(function (r) { return r.json(); }).then(function (res) {
        if (res && res.success && res.data) {
            _memberShowToast('Email campaign launched successfully!', 'success');
            var setupState = document.getElementById('campaignSetupState');
            var progressState = document.getElementById('campaignProgressState');
            if (setupState) setupState.style.display = 'none';
            if (progressState) progressState.style.display = 'block';
            if (launchBtn) launchBtn.style.display = 'none';
        } else {
            _memberShowToast(res && res.message || 'Failed to dispatch campaign', 'error');
            if (launchBtn) { launchBtn.disabled = false; launchBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Launch Campaign'; }
        }
    }).catch(function () {
        _memberShowToast('Network error dispatching campaign', 'error');
        if (launchBtn) { launchBtn.disabled = false; launchBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Launch Campaign'; }
    });
};
