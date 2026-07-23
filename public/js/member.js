(function () {
    'use strict';

    let alumniData = [];
    let filteredData = [];
    let currentPage = 1;
    let rowsPerPage = 10;
    let todayUpdateCount = 0;
    let sessionTimeout = null;
    let _apiMemberData = null;
    let _apiAlumniData = null;
    let _apiDataLoaded = false;
    let previewPage = 1;
    let previewLimit = 10;

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
    const higherStudiesSelect = document.getElementById('fieldHigherStudies');
    const higherStudiesDetails = document.getElementById('higherStudiesDetails');
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const markAllRead = document.getElementById('markAllRead');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const todayCountEl = document.getElementById('todayCount');

    const departments = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT'];
    const batches = ['2020', '2021', '2022', '2023'];
    const companies = ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'HCL', 'Accenture', 'Deloitte', 'Goldman Sachs', 'IBM', 'Cisco', 'Oracle', 'Adobe', 'Meta'];
    const positions = ['Software Engineer', 'Data Analyst', 'Product Manager', 'Consultant', 'UI/UX Designer', 'Cloud Architect', 'DevOps Engineer', 'Business Analyst', 'Data Scientist', 'Project Manager', 'Full Stack Developer', 'AI Engineer', 'System Analyst', 'Network Engineer', 'Security Analyst'];
    const cities = ['Bangalore', 'Hyderabad', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
    const states = ['Karnataka', 'Telangana', 'Tamil Nadu', 'Maharashtra', 'Delhi', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Gujarat', 'Punjab'];
    const statuses = ['Completed', 'Pending', 'Draft'];

    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function buildAlumniData() {
        const names = [
            'Aarav Sharma', 'Aditi Patel', 'Arjun Singhania', 'Deepika Krishnan',
            'Karthik Iyer', 'Meera Nair', 'Pranav Joshi', 'Riya Kapoor',
            'Sahil Mehta', 'Tanvi Gupta', 'Vikram Reddy', 'Ananya Deshmukh',
            'Rohit Verma', 'Isha Saxena', 'Manish Tiwari', 'Neha Aggarwal',
            'Siddharth Rao', 'Priya Menon', 'Amit Khanna', 'Shreya Dutta',
            'Rahul Bose', 'Kavya Srinivasan', 'Harsh Vardhan', 'Divya Nair',
            'Suresh Babu', 'Anjali Kulkarni', 'Vivek Oberoi', 'Pooja Jain',
            'Nitin Choudhury', 'Lakshmi Narayan', 'Gaurav Bhatia', 'Sneha Roy'
        ];
        const data = [];
        for (let i = 0; i < names.length; i++) {
            const dept = getRandomItem(departments);
            const batch = getRandomItem(batches);
            const company = getRandomItem(companies);
            const position = getRandomItem(positions);
            const city = getRandomItem(cities);
            const state = getRandomItem(states);
            let status;
            if (i < 13) {
                status = statuses[i % 2];
            } else if (i < 19) {
                status = 'Draft';
            } else {
                status = statuses[(i - 6) % 2];
            }
            data.push({
                id: i + 1,
                name: names[i],
                department: dept,
                batch: batch,
                company: company,
                designation: position,
                city: city,
                state: state,
                country: 'India',
                email: names[i].toLowerCase().replace(/\s+/g, '.') + '@alumni.edu',
                phone: '+91 ' + getRandomInt(7000000000, 9999999999),
                linkedin: 'https://linkedin.com/in/' + names[i].toLowerCase().replace(/\s+/g, ''),
                higherStudies: i % 4 === 0 ? 'Yes' : 'No',
                higherDetails: i % 4 === 0 ? 'MIT, MBA, 2024' : '',
                entrepreneur: i % 5 === 0 ? 'Yes' : 'No',
                govtJob: i % 7 === 0 ? 'Yes' : 'No',
                otherOcc: '',
                remarks: '',
                status: status
            });
        }
        return data;
    }

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
                const badgeClass = isCompleted ? 'completed' : (isDraft ? 'draft' : 'pending');
                const badgeIcon = isCompleted ? 'fa-check-circle' : (isDraft ? 'fa-pen' : 'fa-clock');
                html += '<tr>' +
                    '<td style="font-weight:600;color:var(--text-secondary);">' + serial + '</td>' +
                    '<td><strong>' + r.name + '</strong></td>' +
                    '<td>' + r.department + '</td>' +
                    '<td>' + r.batch + '</td>' +
                    '<td>' + r.company + '</td>' +
                    '<td>' + r.designation + '</td>' +
                    '<td><span class="status-badge ' + badgeClass + '"><i class="fas ' + badgeIcon + '"></i> ' + r.status + '</span></td>' +
                    '<td><button class="btn-update" data-index="' + r.id + '"><i class="fas fa-edit"></i> Update</button></td>' +
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
        record.working_details = document.getElementById('fieldWorkingDetails').value.trim();
        record.higherStudies = document.getElementById('fieldHigherStudies').value;
        record.higherDetails = document.getElementById('fieldHigherDetails').value.trim();
        record.entrepreneur = document.getElementById('fieldEntrepreneur').value;
        record.govtJob = document.getElementById('fieldGovtJob').value;
        record.otherOcc = document.getElementById('fieldOtherOcc').value.trim();
        record.remarks = document.getElementById('fieldRemarks').value.trim();
    }

    function ensureOptionExists(selectEl, val) {
        if (!val) return;
        for (let i = 0; i < selectEl.options.length; i++) {
            if (selectEl.options[i].value === val) return;
        }
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        selectEl.appendChild(opt);
    }

    window._currentModalRecordIndex = -1;

    function updateModalNavCounter() {
        var prevBtn = document.getElementById('modalNavPrevBtn');
        var nextBtn = document.getElementById('modalNavNextBtn');
        var counterEl = document.getElementById('modalNavCounter');
        if (!alumniData || alumniData.length === 0 || window._currentModalRecordIndex === -1) {
            if (counterEl) counterEl.textContent = '0 / 0';
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }
        if (counterEl) counterEl.textContent = (window._currentModalRecordIndex + 1) + ' / ' + alumniData.length;
        if (prevBtn) prevBtn.disabled = window._currentModalRecordIndex <= 0;
        if (nextBtn) nextBtn.disabled = window._currentModalRecordIndex >= alumniData.length - 1;
    }

    window.navigateModalRecord = function(dir) {
        if (!alumniData || alumniData.length === 0) return;
        var newIdx = window._currentModalRecordIndex + dir;
        if (newIdx < 0 || newIdx >= alumniData.length) return;
        var targetRecord = alumniData[newIdx];
        if (!targetRecord) return;

        // Visual transition
        var form = document.getElementById('updateForm');
        if (form) {
            form.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
            form.style.opacity = '0.3';
            form.style.transform = dir > 0 ? 'translateX(15px)' : 'translateX(-15px)';
            setTimeout(function() {
                openModal(targetRecord.id);
                form.style.opacity = '1';
                form.style.transform = 'translateX(0)';
            }, 150);
        } else {
            openModal(targetRecord.id);
        }
    };

    function openModal(index) {
        const targetId = parseInt(index, 10);
        const recordIdx = alumniData.findIndex(function (r) { return r.id === targetId; });
        if (recordIdx === -1) return;
        window._currentModalRecordIndex = recordIdx;
        const record = alumniData[recordIdx];

        updateModalNavCounter();

        fieldIndex.value = record.id || '';
        modalTitle.textContent = record.name;
        modalSubtitle.textContent = record.department + ' (' + record.batch + ')';
        modalAvatar.textContent = record.name.charAt(0).toUpperCase();
        const isCompleted = record.status === 'Completed';
        const isDraft = record.status === 'Draft';
        const badgeClass = isCompleted ? 'completed' : (isDraft ? 'draft' : 'pending');
        const badgeIcon = isCompleted ? 'fa-check-circle' : (isDraft ? 'fa-pen' : 'fa-clock');
        modalStatusBadge.className = 'status-badge ' + badgeClass;
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
        document.getElementById('fieldWorkingDetails').value = record.working_details || '';
        document.getElementById('fieldHigherStudies').value = record.higherStudies || record.higher_studies || 'No';
        document.getElementById('fieldHigherDetails').value = record.higherDetails || record.higher_studies_details || '';
        document.getElementById('fieldEntrepreneur').value = record.entrepreneur || (record.is_entrepreneur ? 'Yes' : 'No') || 'No';
        document.getElementById('fieldGovtJob').value = record.govtJob || (record.is_government_job ? 'Yes' : 'No') || 'No';
        document.getElementById('fieldOtherOcc').value = record.otherOcc || record.other_occupation || '';
        document.getElementById('fieldRemarks').value = record.remarks || '';

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

        if (record.higherStudies === 'Yes') {
            higherStudiesDetails.classList.add('active');
        } else {
            higherStudiesDetails.classList.remove('active');
        }

        document.getElementById('fieldSmartParser').value = '';
        loadAutosave(record.id);

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
        updateModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        updateModal.classList.remove('show');
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

    // Auto-save form progress to localStorage
    let autosaveTimeout = null;
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
            working_details: document.getElementById('fieldWorkingDetails').value,
            higherStudies: document.getElementById('fieldHigherStudies').value,
            higherDetails: document.getElementById('fieldHigherDetails').value,
            entrepreneur: document.getElementById('fieldEntrepreneur').value,
            govtJob: document.getElementById('fieldGovtJob').value,
            otherOcc: document.getElementById('fieldOtherOcc').value,
            remarks: document.getElementById('fieldRemarks').value,
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
                    document.getElementById('fieldWorkingDetails').value = data.working_details || '';
                    document.getElementById('fieldHigherStudies').value = data.higherStudies || 'No';
                    document.getElementById('fieldHigherDetails').value = data.higherDetails || '';
                    document.getElementById('fieldEntrepreneur').value = data.entrepreneur || 'No';
                    document.getElementById('fieldGovtJob').value = data.govtJob || 'No';
                    document.getElementById('fieldOtherOcc').value = data.otherOcc || '';
                    document.getElementById('fieldRemarks').value = data.remarks || '';

                    if (data.higherStudies === 'Yes') {
                        higherStudiesDetails.classList.add('active');
                    } else {
                        higherStudiesDetails.classList.remove('active');
                    }
                    showToast('Loaded unsaved changes from auto-save draft.', 'success');
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    function clearAutosave(idx) {
        localStorage.removeItem('autosave_member_alumni_' + idx);
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

        // Also set working details to full pasted text as a fallback
        if (val.length > 10) {
            document.getElementById('fieldWorkingDetails').value = val.substring(0, 500);
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
            { id: 'fieldCity', errorId: 'errorCity', label: 'City' },
            { id: 'fieldEmail', errorId: 'errorEmail', label: 'Email' },
            { id: 'fieldPhone', errorId: 'errorPhone', label: 'Phone' }
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
        if (typeof window.showToast === 'function') {
            window.showToast(type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Success', message, type === 'error' ? 'danger' : type);
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
        toast.className = 'toast ' + type;
        var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle' };
        toast.innerHTML = '<i class="fas ' + (icons[type] || 'fa-info-circle') + '"></i> ' + message;
        container.appendChild(toast);
        setTimeout(function () {
            toast.classList.add('removing');
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3000);
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
            var badgeClass = 'draft';
            var badgeIcon = 'fa-pen';
            modalStatusBadge.className = 'status-badge ' + badgeClass;
            modalStatusBadge.innerHTML = '<i class="fas ' + badgeIcon + '"></i> Draft';
            showToast('Record saved as draft', 'success');
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
                openModal(nextRecord.id);
            } else {
                closeModal();
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

    function handleHigherStudiesChange() {
        if (this.value === 'Yes') {
            higherStudiesDetails.classList.add('active');
        } else {
            higherStudiesDetails.classList.remove('active');
            document.getElementById('fieldHigherDetails').value = '';
        }
    }

    function handleUpdateClick(e) {
        var btn = e.target.closest('.btn-update');
        if (btn) {
            const idx = btn.getAttribute('data-index');
            openModal(idx);
        }
    }

    function handleModalClose(e) {
        if (e.target === updateModal || e.target === modalClose || e.target.closest('#modalClose') || e.target.closest('#cancelModalBtn')) {
            closeModal();
        }
    }

    function handleKeyboard(e) {
        if (!updateModal.classList.contains('show')) return;

        if (e.key === 'Escape') {
            closeModal();
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
        notifBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            notifDropdown.classList.toggle('active');
        });
        document.addEventListener('click', function (e) {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.remove('active');
            }
        });
        markAllRead.addEventListener('click', function () {
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
            notifDropdown.classList.remove('active');
        });
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
            body.innerHTML = '<tr><td colspan="17" style="text-align:center;padding:24px;color:var(--text-secondary);"><span class="spinner spinner-sm"></span> Loading records...</td></tr>';

            var search = document.getElementById('previewSearch').value || '';
            var dept = filterDept ? filterDept.value : '';
            var batch = filterBatch ? filterBatch.value : '';
            var status = filterStatus ? filterStatus.value : '';
            var limitVal = parseInt(document.getElementById('previewLimit').value, 10) || 10;
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
                    var status = row.assignment_status || 'Available';
                    var badgeClass = 'badge-secondary';
                    if (status === 'Completed') badgeClass = 'badge-success';
                    else if (status === 'Pending') badgeClass = 'badge-warning';
                    else if (status === 'ASSIGNED_TO_LEADER') badgeClass = 'badge-primary';
                    else if (status === 'Draft') badgeClass = 'badge-info';

                    var link = row.linkedin_profile || '';
                    var linkedin;
                    if (link) {
                      var href = link.startsWith('http') ? link : 'https://' + link;
                      var safeHref = href.replace(/'/g, "\\'");
                      linkedin = '<div style="display:flex;align-items:center;gap:10px;">' +
                        '<a href="' + href + '" target="_blank" rel="noopener noreferrer" style="color:#0A66C2;font-size:1.15rem;text-decoration:none;" title="Open LinkedIn Profile"><i class="fab fa-linkedin"></i></a>' +
                        '<button onclick="event.stopPropagation();showLinkPreview(this,\'' + safeHref + '\')" style="background:none;border:none;cursor:pointer;color:#64748B;font-size:0.85rem;padding:2px 4px;line-height:1;" title="Show URL"><i class="far fa-eye"></i></button>' +
                        '</div>';
                    } else {
                      linkedin = '-';
                    }
                    var updatedDateStr = row.updated_date ? new Date(row.updated_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

                    html += '<tr>' +
                        '<td class="sticky-col" style="padding:12px 16px; border-bottom:1px solid var(--border); font-weight:600; left:0;">' + serial + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border); font-weight:600;">' + (row.name || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.register_no || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.father_name || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.department || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.batch || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.email || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.phone || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.company || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.designation || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.experience || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.city || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.country || '-') + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + linkedin + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);"><span class="badge ' + badgeClass + '">' + status + '</span></td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + updatedDateStr + '</td>' +
                        '<td style="padding:12px 16px; border-bottom:1px solid var(--border);">' + (row.working_details || '-') + '</td>' +
                        '</tr>';
                });
                body.innerHTML = html;
                renderPreviewPagination(total);
            }).catch(function (err) {
                console.error(err);
                body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--danger);">Failed to load records.</td></tr>';
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

        // Populate dynamic filters from database
        API.getAlumniFilters().then(function (res) {
            if (res && res.success && res.data) {
                const depts = res.data.departments || [];
                const batches = res.data.batches || [];
                if (filterDept) {
                    filterDept.innerHTML = '<option value="">All Departments</option>';
                    depts.forEach(d => {
                        filterDept.innerHTML += '<option value="' + d + '">' + d + '</option>';
                    });
                }
                if (filterBatch) {
                    filterBatch.innerHTML = '<option value="">All Batches</option>';
                    batches.forEach(b => {
                        filterBatch.innerHTML += '<option value="' + b + '">' + b + '</option>';
                    });
                }

            }
        }
        ).catch(err => {
            console.error('Failed to load dynamic filters in member:', err);
        });

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

        recordsBody.addEventListener('click', handleUpdateClick);

        higherStudiesSelect.addEventListener('change', handleHigherStudiesChange);

        saveDraftBtn.addEventListener('click', handleSaveDraft);
        submitRecordBtn.addEventListener('click', handleSubmitRecord);
        if (submitNextBtn) {
            submitNextBtn.addEventListener('click', handleSubmitNext);
        }

        // Set up input autosave listeners for all fields in the update modal form
        if (updateForm) {
            updateForm.querySelectorAll('input, select, textarea').forEach(function (inputEl) {
                if (inputEl.id !== 'fieldSmartParser') {
                    inputEl.addEventListener('input', triggerAutosave);
                    inputEl.addEventListener('change', triggerAutosave);
                }
            });
        }

        modalClose.addEventListener('click', handleModalClose);
        cancelModalBtn.addEventListener('click', handleModalClose);
        updateModal.addEventListener('click', handleModalClose);

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
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle' };
    toast.innerHTML = '<i class="fas ' + (icons[type] || 'fa-info-circle') + '"></i> ' + message;
    container.appendChild(toast);
    setTimeout(function () {
        toast.classList.add('removing');
        setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, 3500);
}

window.undoAlumniSubmission = function() {
    var fieldIndexEl = document.getElementById('fieldIndex');
    var idx = fieldIndexEl ? parseInt(fieldIndexEl.value, 10) : 0;
    if (!idx) return;
    if (!confirm('Are you sure you want to undo submission and set status back to Pending?')) return;

    var undoBtn = document.getElementById('undoSubmitBtn');
    if (undoBtn) { undoBtn.disabled = true; undoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Undoing...'; }

    var token = localStorage.getItem('token');
    fetch('/api/v1/assignments/reopen/' + idx, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    }).then(function(r) { return r.json(); }).then(function(res) {
        if (res && res.success) {
            if (window.Toast) window.Toast.success('Undo Submission', res.message || 'Submission undone. Record is back to Pending.');
            else _memberShowToast('Submission undone. Record is back to Pending.', 'success');
            // Close modal and refresh data
            var modal = document.getElementById('updateModal');
            if (modal) modal.classList.remove('show');
            if (window.fetchMemberData) window.fetchMemberData();
        } else {
            if (window.Toast) window.Toast.error('Undo Submission', res && res.message || 'Failed to undo submission.');
            else _memberShowToast(res && res.message || 'Failed to undo submission.', 'error');
        }
    }).catch(function() {
        if (window.Toast) window.Toast.error('Undo Submission', 'Network error undoing submission.');
        else _memberShowToast('Network error undoing submission.', 'error');
    }).finally(function() {
        if (undoBtn) { undoBtn.disabled = false; undoBtn.innerHTML = '<i class="fas fa-undo"></i> Undo Submit'; }
    });
};



