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
    const globalSearch = document.getElementById('globalSearch');
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
            return matchesSearch && matchesDept && matchesBatch && matchesStatus;
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

    function incrementTodayCount() {
        todayUpdateCount++;
        animateTodayCount(todayUpdateCount);
    }

    function readFormValues(record) {
        record.name = document.getElementById('fieldName').value.trim();
        record.department = document.getElementById('fieldDept').value;
        record.batch = document.getElementById('fieldBatch').value;
        record.company = document.getElementById('fieldCompany').value.trim();
        record.designation = document.getElementById('fieldDesignation').value.trim();
        record.city = document.getElementById('fieldCity').value.trim();
        record.state = document.getElementById('fieldState').value.trim();
        record.country = document.getElementById('fieldCountry').value.trim();
        record.email = document.getElementById('fieldEmail').value.trim();
        record.phone = document.getElementById('fieldPhone').value.trim();
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

    function openModal(index) {
        const record = alumniData.find(function (r) { return r.id === parseInt(index, 10); });
        if (!record) return;

        fieldIndex.value = record.id;
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

        document.getElementById('fieldName').value = record.name;
        deptEl.value = record.department || '';
        batchEl.value = record.batch || '';
        document.getElementById('fieldCompany').value = record.company;
        document.getElementById('fieldDesignation').value = record.designation;
        document.getElementById('fieldCity').value = record.city;
        document.getElementById('fieldState').value = record.state;
        document.getElementById('fieldCountry').value = record.country;
        document.getElementById('fieldEmail').value = record.email;
        document.getElementById('fieldPhone').value = record.phone;
        document.getElementById('fieldLinkedin').value = record.linkedin_profile;
        document.getElementById('fieldWorkingDetails').value = record.working_details || '';
        document.getElementById('fieldHigherStudies').value = record.higherStudies;
        document.getElementById('fieldHigherDetails').value = record.higherDetails || '';
        document.getElementById('fieldEntrepreneur').value = record.entrepreneur;
        document.getElementById('fieldGovtJob').value = record.govtJob;
        document.getElementById('fieldOtherOcc').value = record.otherOcc || '';
        document.getElementById('fieldRemarks').value = record.remarks || '';

        if (record.higherStudies === 'Yes') {
            higherStudiesDetails.classList.add('active');
        } else {
            higherStudiesDetails.classList.remove('active');
        }

        clearErrors();
        saveDraftBtn.classList.remove('loading');
        saveDraftBtn.disabled = false;
        submitRecordBtn.classList.remove('loading');
        submitRecordBtn.disabled = false;
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
        clearErrors();
    }

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
            { id: 'fieldBatch', errorId: 'errorBatch', label: 'Batch' }
        ];

        fields.forEach(function (f) {
            const el = document.getElementById(f.id);
            const err = document.getElementById(f.errorId);
            if (!el.value || el.value.trim() === '') {
                el.classList.add('error');
                err.classList.add('show');
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
                email: record.email,
                phone: record.phone,
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
            }).catch(function () {
                doLocalSave();
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
            // submitAlumni is allowed for MEMBERs (PATCH /:alumniId/submit)
            API.submitAlumni(record.id, submitData).then(function () {
                if (record.assignment_id) {
                    return API.updateAssignmentStatus(record.assignment_id, { status: 'Completed' });
                }
            }).then(function () {
                doLocalSubmit();
            }).catch(function () {
                doLocalSubmit();
            });
        } else {
            setTimeout(doLocalSubmit, 1500);
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
        if (e.key === 'Escape' && updateModal.classList.contains('show')) {
            closeModal();
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
                        window.location.href = 'index.html';
                    }, 1500);
                    return;
                }
                
                document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
                item.classList.add('active');

                // Toggle sections
                var dashboardSection = document.getElementById('section-dashboard');
                var settingsSection = document.getElementById('section-settings');
                if (page === 'dashboard' || page === 'records') {
                    if (dashboardSection) dashboardSection.style.display = 'block';
                    if (settingsSection) settingsSection.style.display = 'none';
                } else if (page === 'settings') {
                    if (dashboardSection) dashboardSection.style.display = 'none';
                    if (settingsSection) settingsSection.style.display = 'block';
                }

                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                }
            });
        });

        window.switchSettingsTab = function(tabName, btn) {
            var tabsContainer = btn.closest('.card') || btn.closest('.card-body');
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
            var avatar = document.querySelector('.profile-avatar');
            if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
            
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
        
        var pendingRecords = alumniData.filter(function(r) { return r.status === 'Pending' || r.status === 'Draft'; });
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
        pendingRecords.slice(0, 5).forEach(function(r) {
            var iconClass = r.status === 'Draft' ? 'orange' : 'blue';
            var icon = r.status === 'Draft' ? 'fa-pen' : 'fa-clock';
            var text = r.status === 'Draft' ? 'Draft saved: ' + r.name : 'Pending update: ' + r.name;
            html += '<div class="notif-item">' +
                '<div class="notif-icon ' + iconClass + '"><i class="fas ' + icon + '"></i></div>' +
                '<div class="notif-text">' +
                '<p>' + text + '</p>' +
                '<span>Action required</span>' +
                '</div>' +
                '<span class="notif-dot"></span>' +
                '</div>';
        });
        list.innerHTML = html;
    }

    function fetchMemberData() {
        Promise.all([
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
                alumniData = buildAlumniData();
            }
            renderTable();
            populateNotifications();
        }).catch(function () {
            alumniData = buildAlumniData();
            renderTable();
            populateNotifications();
        });
    }

    function init() {
        setMemberUserInfo();
        fetchMemberData();

        tableSearch.addEventListener('input', function () {
            currentPage = 1;
            renderTable();
        });

        filterDept.addEventListener('change', function () {
            currentPage = 1;
            renderTable();
        });

        filterBatch.addEventListener('change', function () {
            currentPage = 1;
            renderTable();
        });

        filterStatus.addEventListener('change', function () {
            currentPage = 1;
            renderTable();
        });

        globalSearch.addEventListener('input', function () {
            tableSearch.value = globalSearch.value;
            currentPage = 1;
            renderTable();
        });

        recordsBody.addEventListener('click', handleUpdateClick);

        higherStudiesSelect.addEventListener('change', handleHigherStudiesChange);

        saveDraftBtn.addEventListener('click', handleSaveDraft);
        submitRecordBtn.addEventListener('click', handleSubmitRecord);

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
