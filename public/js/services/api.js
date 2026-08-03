(function () {
    'use strict';

    var BASE_URL = '/api/v1';

    function getToken() {
        return localStorage.getItem('token');
    }

    function request(method, path, data) {
        var options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            }
        };
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        var url = BASE_URL + path;
        if (method === 'GET' && data) {
            var params = new URLSearchParams();
            Object.keys(data).forEach(function (k) {
                if (data[k] !== undefined && data[k] !== null && data[k] !== '') {
                    params.append(k, data[k]);
                }
            });
            var qs = params.toString();
            if (qs) url += '?' + qs;
        }
        return fetch(url, options).then(function (res) {
            if (!res.ok) {
                return res.json().then(function (err) {
                    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
                        var msg = err.errors.map(function (e) { return e.message || e.msg || ''; }).filter(Boolean).join(', ');
                        if (msg) throw new Error(msg);
                    }
                    throw new Error(err.message || 'Request failed with status ' + res.status);
                }).catch(function (e) {
                    if (e instanceof TypeError) throw new Error('Request failed with status ' + res.status);
                    throw e;
                });
            }
            return res.json();
        });
    }

    function get(path, params) { return request('GET', path, params); }
    function post(path, data) { return request('POST', path, data); }
    function put(path, data) { return request('PUT', path, data); }
    function patch(path, data) { return request('PATCH', path, data); }
    function del(path) { return request('DELETE', path); }

    window.API = {
        // Auth
        login: function (username, password) {
            return post('/auth/login', { username: username, password: password }).then(function (res) {
                if (res.success && res.data && res.data.token) {
                    localStorage.setItem('token', res.data.token);
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                }
                return res;
            });
        },
        forgotPassword: function (email) {
            return post('/auth/forgot-password', { email: email });
        },
        resetPasswordWithTemp: function (data) {
            return post('/auth/reset-password-with-temp', data);
        },
        isAuthenticated: function () {
            return !!localStorage.getItem('token');
        },
        getUser: function () {
            try {
                return JSON.parse(localStorage.getItem('user')) || { id: null, name: 'User', email: '', role: '' };
            } catch (e) {
                return { id: null, name: 'User', email: '', role: '' };
            }
        },
        clearToken: function () {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },

// Dashboard
    getAdminDashboard: function () {
        return get('/dashboard/admin');
    },
    getLeaderDashboard: function () {
        return get('/dashboard/leader');
    },
    getMemberDashboard: function () {
        return get('/dashboard/member');
    },
    getDashboardStats: function () {
        return get('/dashboard/stats');
    },
    getLeaderStats: function (leaderId) {
        return get('/dashboard/leader/' + leaderId + '/stats');
    },
    getMyTasks: function () {
        return get('/tasks/my-tasks');
    },

    // Users
    getUsers: function (params) {
        return get('/users', params);
    },
    createUser: function (data) {
        return post('/users', data);
    },
    updateUser: function (id, data) {
        return put('/users/' + id, data);
    },
    deleteUser: function (id) {
        return del('/users/' + id);
    },
    getUserById: function (id) {
        return get('/users/' + id);
    },

    // Teams
    getTeams: function (params) {
        return get('/teams', params);
    },
    createTeam: function (data) {
        return post('/teams', data);
    },
    getTeamById: function (id) {
        return get('/teams/' + id);
    },
    addTeamMember: function (teamId, data) {
        return post('/teams/' + teamId + '/members', data);
    },
    removeTeamMember: function (teamMemberId) {
        return del('/teams/members/' + teamMemberId);
    },
    redistributeAssignments: function (teamId, data) {
        return post('/teams/' + teamId + '/redistribute', data);
    },
    lockDistribution: function (teamId) {
        return patch('/teams/' + teamId + '/lock', {});
    },
    unlockDistribution: function (teamId) {
        return patch('/teams/' + teamId + '/unlock', {});
    },

    // Alumni records
    getAlumni: function (params) {
        return get('/alumni', params);
    },
    getAlumniById: function (id) {
        return get('/alumni/' + id);
    },
    createAlumni: function (data) {
        return post('/alumni', data);
    },
    updateAlumni: function (id, data) {
        return put('/alumni/' + id, data);
    },
    getAssignedAlumni: function (params) {
        return get('/alumni/assigned', params);
    },
    getAlumniStats: function () {
        return get('/alumni/stats');
    },
    getAlumniFilters: function () {
        return get('/alumni/filters');
    },
    saveAlumniDraft: function (id, data) {
        return patch('/alumni/' + id + '/draft', data);
    },
    submitAlumni: function (id, data) {
        return patch('/alumni/' + id + '/submit', data);
    },
    updateAssignmentStatus: function (assignmentId, data) {
        return patch('/alumni/assignments/' + assignmentId + '/status', data);
    },

    reopenAlumni: function (id) {
        return patch('/alumni/' + id + '/reopen', {});
    },
    reopenAssignment: function (id, reason) {
        return post('/assignments/reopen/' + id, { reason: reason || 'Undone by user' });
    },

    uploadImport: function (formData) {
        return fetch(BASE_URL + '/upload/import', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            body: formData
        }).then(function (res) {
            if (!res.ok) {
                return res.json().then(function (err) { throw new Error(err.message || 'Import failed'); });
            }
            return res.json();
        });
    },
    uploadPreview: function (formData) {
        return fetch(BASE_URL + '/upload/preview', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            body: formData
        }).then(function (res) {
            if (!res.ok) {
                return res.json().then(function (err) { throw new Error(err.message || 'Preview failed'); });
            }
            return res.json();
        });
    },
    inspectSheets: function (formData) {
        return fetch(BASE_URL + '/upload/sheets', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            body: formData
        }).then(function (res) {
            if (!res.ok) {
                return res.json().then(function (err) { throw new Error(err.message || 'Sheet inspection failed'); });
            }
            return res.json();
        });
    },
    getImportHistory: function (params) {
        return get('/upload/history', params);
    },
    confirmAliases: function (data) {
        return post('/upload/aliases/confirm', data);
    },
    rollbackImport: function (importId) {
        return post('/upload/rollback/' + importId, {});
    },

    // Round robin assignment
    getAvailableAlumniCount: function (params) {
        return get('/assignments/available-count', params);
    },
    adminAssign: function (params) {
        return post('/assignments/admin-assign', params);
    },
    leaderPreview: function (data) {
        return post('/assignments/leader-preview', data);
    },
    leaderDistribute: function (data) {
        return post('/assignments/leader-distribute', data);
    },
    getUndistributedAlumni: function (params) {
        return get('/assignments/undistributed', params);
    },
    getUndistributedCount: function () {
        return get('/assignments/undistributed-count');
    },

    // Reports
    getReports: function (params) {
        return get('/reports', params);
    },
    generateReport: function (data) {
        return post('/reports/generate', data);
    },
    deleteReport: function (id) {
        return del('/reports/' + id);
    },
    getSchedules: function () {
        return get('/reports/schedules');
    },
    createSchedule: function (data) {
        return post('/reports/schedules', data);
    },
    deleteSchedule: function (id) {
        return del('/reports/schedules/' + id);
    },
    downloadReport: function (id) {
        return get('/reports/' + id + '/download');
    },
    downloadTemplate: function () {
        window.open(BASE_URL + '/upload/template', '_blank');
        return Promise.resolve({ success: true });
    },
    getAssignmentHistory: function (params) {
        return get('/assignments/history', params);
    },

    // Audit Logs
    getAuditLogs: function (params) {
        return get('/audit-logs', params);
    },

    // Profile
    changePassword: function (oldPassword, newPassword) {
        return post('/auth/change-password', { oldPassword: oldPassword, newPassword: newPassword });
    },
    updateProfile: function (id, data) {
        return put('/users/' + id, data);
    },

    // Additional export method
    downloadImportTemplate: function () {
        return this.downloadTemplate();
    },

    // Reset password requests
    getResetRequests: function () {
        return get('/auth/reset-password-requests');
    },
    updateResetRequestStatus: function (requestId, status) {
        return patch('/auth/reset-password-requests/' + requestId, { status: status });
    },

    // Settings sync
    getSettings: function () {
        return get('/settings');
    },
    updateSettings: function (settings, group) {
        return post('/settings', { settings: settings, group: group });
    }
    };

})();