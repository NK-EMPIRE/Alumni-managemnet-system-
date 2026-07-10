(function () {
  'use strict';

  var userData = {
    name: 'Admin User',
    email: 'admin@college.edu',
    phone: '+91 98765 43210',
    dob: '15/03/1990',
    address: '123, College Road, City',
    dept: 'Computer Science',
    role: 'Administrator',
    empId: 'EMP001',
    joinDate: '15 Jan 2024',
    lastLogin: '08 Jul 2026 10:30 AM'
  };

  var activities = [
    { date: '08 Jul 2026, 10:30 AM', desc: 'Logged into the system' },
    { date: '08 Jul 2026, 09:15 AM', desc: 'Generated CSE Department Progress report' },
    { date: '07 Jul 2026, 04:45 PM', desc: 'Assigned 15 alumni to Amit Verma' },
    { date: '07 Jul 2026, 02:30 PM', desc: 'Updated system settings - notification preferences' },
    { date: '06 Jul 2026, 11:00 AM', desc: 'Reviewed Pending Updates for ECE department' },
    { date: '05 Jul 2026, 05:20 PM', desc: 'Added new team member - Anjali Rao' },
    { date: '05 Jul 2026, 01:10 PM', desc: 'Completed profile verification for 10 alumni' },
    { date: '04 Jul 2026, 03:45 PM', desc: 'Generated Batch 2022 completion report' },
    { date: '03 Jul 2026, 10:00 AM', desc: 'Performed system database backup' },
    { date: '02 Jul 2026, 04:30 PM', desc: 'Updated Team Leader performance targets' }
  ];

  function loadUserFromAPI() {
    if (typeof API === 'undefined') return;
    var apiUser = API.getUser();
    if (apiUser && apiUser.name && apiUser.name !== 'User') {
      userData.name = apiUser.name || userData.name;
      userData.email = apiUser.email || userData.email;
      userData.role = apiUser.role || userData.role;
    }
  }

  function loadUserData() {
    loadUserFromAPI();
    var saved = localStorage.getItem('alumni_user_profile');
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        for (var k in parsed) userData[k] = parsed[k];
      } catch (e) {}
    }
    updateProfileDisplay();
    updateProfileCompletion();
  }

  function updateProfileDisplay() {
    var initials = userData.name.split(' ').map(function (w) { return w.charAt(0); }).join('').toUpperCase().slice(0, 2);
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileDisplayName').textContent = userData.name;
    document.getElementById('profileDisplayEmail').textContent = userData.email;
    document.getElementById('profileDisplayJoinDate').textContent = userData.joinDate;
    document.getElementById('profileDisplayLastLogin').textContent = userData.lastLogin;
    document.getElementById('profFullName').textContent = userData.name;
    document.getElementById('profEmail').textContent = userData.email;
    document.getElementById('profPhone').textContent = userData.phone;
    document.getElementById('profDob').textContent = userData.dob;
    document.getElementById('profAddress').textContent = userData.address;
    document.getElementById('profDept').textContent = userData.dept;
    document.getElementById('profRole').textContent = userData.role;
    document.getElementById('profEmpId').textContent = userData.empId;
    document.getElementById('profJoinDate').textContent = userData.joinDate;
    document.getElementById('profLastLogin').textContent = userData.lastLogin;

    var editName = document.getElementById('editName');
    var editEmail = document.getElementById('editEmail');
    var editPhone = document.getElementById('editPhone');
    var editDob = document.getElementById('editDob');
    var editAddress = document.getElementById('editAddress');
    var editDept = document.getElementById('editDept');
    var editEmpId = document.getElementById('editEmpId');
    if (editName) editName.value = userData.name;
    if (editEmail) editEmail.value = userData.email;
    if (editPhone) editPhone.value = userData.phone;
    if (editDob) editDob.value = userData.dob;
    if (editAddress) editAddress.value = userData.address;
    if (editDept) editDept.value = userData.dept;
    if (editEmpId) editEmpId.value = userData.empId;
  }

  function updateProfileCompletion() {
    var fields = [userData.name, userData.email, userData.phone, userData.dob, userData.address, userData.dept, userData.empId];
    var filled = fields.filter(function (f) { return f && f.length > 0; }).length;
    var pct = Math.round((filled / fields.length) * 100);
    document.getElementById('profileCompletionPct').textContent = pct + '%';
    var bar = document.getElementById('profileCompletionBar');
    if (bar) {
      bar.style.width = pct + '%';
      if (pct >= 80) bar.classList.add('green');
      else if (pct >= 50) {}
      else bar.classList.add('yellow');
    }
  }

  window.switchProfileTab = function (tab, btn) {
    var tabs = document.querySelectorAll('.tabs .tab-item');
    tabs.forEach(function (t) { t.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var contents = ['details', 'password', 'activity'];
    contents.forEach(function (c) {
      var el = document.getElementById('profileTab' + c.charAt(0).toUpperCase() + c.slice(1));
      if (el) el.classList.toggle('active', c === tab);
    });
  };

  window.togglePasswordField = function (id, btn) {
    var input = document.getElementById(id);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerHTML = '<i class="far fa-eye-slash"></i>';
    } else {
      input.type = 'password';
      btn.innerHTML = '<i class="far fa-eye"></i>';
    }
  };

  window.checkPasswordStrength = function (val) {
    var str1 = document.getElementById('str1');
    var str2 = document.getElementById('str2');
    var str3 = document.getElementById('str3');
    var label = document.getElementById('strengthLabel');
    if (!str1 || !str2 || !str3) return;
    str1.style.background = '#E2E8F0';
    str2.style.background = '#E2E8F0';
    str3.style.background = '#E2E8F0';
    if (!val) {
      label.textContent = 'Enter a password';
      return;
    }
    var score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    if (score <= 2) {
      str1.style.background = '#EF4444';
      label.textContent = 'Weak - Add more characters, numbers, and symbols';
    } else if (score <= 3) {
      str1.style.background = '#F59E0B';
      str2.style.background = '#F59E0B';
      label.textContent = 'Medium - Try adding special characters';
    } else {
      str1.style.background = '#10B981';
      str2.style.background = '#10B981';
      str3.style.background = '#10B981';
      label.textContent = 'Strong password';
    }
  };

  window.updatePassword = function () {
    var current = document.getElementById('currentPassword').value;
    var newPass = document.getElementById('newPassword').value;
    var confirm = document.getElementById('confirmPassword').value;
    if (!current) { Toast.warning('Validation Error', 'Please enter your current password.'); return; }
    if (!newPass) { Toast.warning('Validation Error', 'Please enter a new password.'); return; }
    if (newPass !== confirm) { Toast.warning('Validation Error', 'New passwords do not match.'); return; }
    if (newPass.length < 6) { Toast.warning('Validation Error', 'Password must be at least 6 characters.'); return; }

    if (typeof API !== 'undefined' && API.changePassword) {
      API.changePassword(current, newPass).then(function (res) {
        if (res && res.success) {
          Toast.success('Password Updated', 'Your password has been changed successfully.');
        } else {
          Toast.warning('Password Error', res && res.message || 'Failed to change password.');
        }
      }).catch(function (err) {
        Toast.warning('Password Error', err.message || 'Failed to change password.');
      });
    } else {
      Toast.success('Password Updated', 'Your password has been changed successfully.');
    }
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    checkPasswordStrength('');
  };

  window.openEditProfile = function () {
    var modal = document.getElementById('editProfileModal');
    if (modal) modal.classList.add('show');
  };

  window.closeEditProfile = function () {
    var modal = document.getElementById('editProfileModal');
    if (modal) modal.classList.remove('show');
  };

  window.saveProfileChanges = function () {
    var name = document.getElementById('editName').value;
    var email = document.getElementById('editEmail').value;
    var phone = document.getElementById('editPhone').value;
    var dob = document.getElementById('editDob').value;
    var address = document.getElementById('editAddress').value;
    var dept = document.getElementById('editDept').value;
    var empId = document.getElementById('editEmpId').value;
    if (!name || !email) {
      Toast.warning('Validation Error', 'Name and Email are required fields.');
      return;
    }
    var user = API.getUser();
    userData.name = name;
    userData.email = email;
    userData.phone = phone || userData.phone;
    userData.dob = dob || userData.dob;
    userData.address = address || userData.address;
    userData.dept = dept || userData.dept;
    userData.empId = empId || userData.empId;
    localStorage.setItem('alumni_user_profile', JSON.stringify(userData));
    updateProfileDisplay();
    updateProfileCompletion();
    if (typeof API !== 'undefined' && API.updateProfile && user && user.id) {
      API.updateProfile(user.id, { firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' '), email: email, phone: phone }).catch(function () {});
    }
    Toast.success('Profile Updated', 'Your profile has been updated successfully.');
    closeEditProfile();
  };

  window.handleAvatarUpload = function (input) {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var avatar = document.getElementById('profileAvatar');
      avatar.innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
      Toast.success('Avatar Updated', 'Profile picture has been updated.');
    };
    reader.readAsDataURL(file);
  };

  function populateActivityTimeline() {
    var container = document.getElementById('activityTimeline');
    if (!container) return;
    var html = '';
    activities.forEach(function (a, i) {
      var colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#EF4444'];
      var color = colors[i % colors.length];
      html += '<div style="display:flex;gap:14px;padding:12px 0;border-bottom:1px solid var(--border);">';
      html += '<div style="width:10px;height:10px;border-radius:50%;background:' + color + ';flex-shrink:0;margin-top:6px;"></div>';
      html += '<div style="flex:1;">';
      html += '<div style="font-size:0.8rem;color:var(--text-muted);">' + a.date + '</div>';
      html += '<div style="font-size:0.85rem;color:var(--text-dark);">' + a.desc + '</div>';
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  window.handleGlobalSearch = function (val) {
    if (val && val.length > 2) {
      Toast.info('Search', 'Searching for "' + val + '"...');
    }
  };

  window.handleLogout = function () {
    if (typeof API !== 'undefined') API.clearToken();
    Toast.warning('Logout', 'You have been logged out successfully.');
    setTimeout(function () { window.location.href = 'index.html'; }, 1500);
  };

  window.toggleMobileSidebar = function () {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('show');
    document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
  };

  window.toggleSidebar = function () {
    document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebar_collapsed', document.body.classList.contains('sidebar-collapsed'));
  };

  window.toggleNotifications = function (e) {
    e.stopPropagation();
    closeDropdown('profileMenu');
    var menu = document.getElementById('notifMenu');
    menu.classList.toggle('show');
  };

  window.toggleProfileDropdown = function (e) {
    e.stopPropagation();
    closeDropdown('notifMenu');
    var menu = document.getElementById('profileMenu');
    menu.classList.toggle('show');
  };

  window.closeDropdown = function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('show');
  };

  window.showAllNotifications = function () {
    closeDropdown('notifMenu');
    Toast.info('Notifications', 'Showing all notifications.');
  };

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) {
      closeDropdown('profileMenu');
      closeDropdown('notifMenu');
    }
  });

  if (localStorage.getItem('sidebar_collapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
  }

  var loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    window.addEventListener('load', function () {
      setTimeout(function () { loadingScreen.classList.add('hide'); }, 300);
    });
    setTimeout(function () { loadingScreen.classList.add('hide'); }, 1500);
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadUserData();
    populateActivityTimeline();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadUserData();
    populateActivityTimeline();
  }

})();