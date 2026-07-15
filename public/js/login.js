/**
 * Alumni Professional Details Update Management System
 * Login Page JavaScript
 */

(function () {
  'use strict';

  // ─── DOM References ─────────────────────────────────────────
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const passwordToggle = document.getElementById('passwordToggle');
  const loginBtn = document.getElementById('loginBtn');
  const loginLoadingOverlay = document.getElementById('loginLoadingOverlay');
  const usernameError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  const loginError = document.getElementById('loginError');

  // ─── Role → Redirect Mapping ─────────────────────────────────
  const ROLE_REDIRECTS = {
    'ADMIN': 'admin.html',
    'LEADER': 'teamleader.html',
    'MEMBER': 'teammember.html',
    'Admin': 'admin.html',
    'Team Leader': 'teamleader.html',
    'Team Member': 'teammember.html'
  };

  function normalizeRole(role) {
    const map = {
      'Admin': 'ADMIN',
      'Team Leader': 'LEADER',
      'Team Member': 'MEMBER',
      'admin': 'ADMIN',
      'team_leader': 'LEADER',
      'team_member': 'MEMBER'
    };
    return map[role] || role;
  }

  // ─── General error reference ──────────────────────────────
  let generalError = null;

  // ─── Utility Functions ──────────────────────────────────────
  function setError(element, message) {
    element.textContent = message;
    const input = element.previousElementSibling?.previousElementSibling || element.parentElement.querySelector('.form-control');
    if (input) input.classList.add('error');
  }

  function clearError(element) {
    element.textContent = '';
    const input = element.previousElementSibling?.previousElementSibling || element.parentElement.querySelector('.form-control');
    if (input) input.classList.remove('error');
  }

  function clearAllErrors() {
    clearError(usernameError);
    clearError(passwordError);
    if (generalError) clearError(generalError);
    document.querySelectorAll('.form-control.error').forEach(function (el) {
      el.classList.remove('error');
    });
  }

  function getPasswordToggleIcon() {
    return passwordToggle.querySelector('i');
  }

  // ─── Password Visibility Toggle ──────────────────────────────
  passwordToggle.addEventListener('click', function () {
    const icon = getPasswordToggleIcon();
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      passwordInput.type = 'password';
      icon.className = 'fas fa-eye';
    }
    passwordInput.focus();
  });

  // ─── Validation ──────────────────────────────────────────────
  function validateForm() {
    let isValid = true;
    clearAllErrors();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) {
      setError(usernameError, 'Username / Email is required');
      isValid = false;
    }

    if (!password) {
      setError(passwordError, 'Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setError(passwordError, 'Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  }

  // ─── Show general error on the form ─────────────────────────
  function ensureGeneralError() {
    if (!generalError) {
      const el = document.createElement('div');
      el.className = 'form-error general-error';
      el.id = 'loginError';
      loginBtn.parentElement.insertBefore(el, loginBtn);
      generalError = el;
    }
    return generalError;
  }

  // ─── Login Handler ──────────────────────────────────────────
  async function handleLogin(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Show loading overlay
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    loginLoadingOverlay.classList.add('active');

    try {
      const res = await API.login(username, password);

      if (res.success && res.data) {
        const user = res.data.user;
        const role = normalizeRole(user.role);
        const redirect = ROLE_REDIRECTS[role] || ROLE_REDIRECTS[user.role];

        // Save Remember Me preference
        if (rememberMeCheckbox.checked) {
          localStorage.setItem('login_remember_username', username);
          localStorage.setItem('login_remember_role', role);
          localStorage.setItem('login_remember_checked', 'true');
        } else {
          localStorage.removeItem('login_remember_username');
          localStorage.removeItem('login_remember_role');
          localStorage.removeItem('login_remember_checked');
        }

        // Redirect after brief delay so user sees the loading animation
        setTimeout(function () {
          window.location.href = redirect || 'admin.html';
        }, 1500);
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (err) {
      // Hide loading overlay
      loginBtn.classList.remove('loading');
      loginBtn.disabled = false;
      loginLoadingOverlay.classList.remove('active');

      const msg = err.message || 'Invalid credentials. Please try again.';

      if (msg.toLowerCase().includes('disabled')) {
        setError(ensureGeneralError(), 'Your account has been disabled. Please contact an administrator.');
      } else if (msg.toLowerCase().includes('network')) {
        setError(ensureGeneralError(), msg);
      } else {
        setError(passwordError, msg);
      }
    }
  }

  // ─── Remember Me - Load Saved Data ──────────────────────────
  function loadRememberMe() {
    const savedUsername = localStorage.getItem('login_remember_username');
    const savedRole = localStorage.getItem('login_remember_role');
    const savedChecked = localStorage.getItem('login_remember_checked');

    if (savedChecked === 'true' && savedUsername) {
      usernameInput.value = savedUsername;
      rememberMeCheckbox.checked = true;
    }

    passwordInput.focus();
  }

  // ─── Clear field errors on input ────────────────────────────
  usernameInput.addEventListener('input', function () {
    clearError(usernameError);
    if (generalError) clearError(generalError);
  });

  passwordInput.addEventListener('input', function () {
    clearError(passwordError);
    if (generalError) clearError(generalError);
  });

  // ─── Keyboard Support: Enter to Submit ──────────────────────
  usernameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      loginForm.dispatchEvent(new Event('submit'));
    }
  });

  passwordInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      loginForm.dispatchEvent(new Event('submit'));
    }
  });

  // ─── Form Submit Event ──────────────────────────────────────
  loginForm.addEventListener('submit', handleLogin);

  // ─── Forgot Password Handler ─────────────────────────────────
  const forgotLink = document.querySelector('.forgot-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', function (e) {
      e.preventDefault();
      openForgotModal();
    });
  }

  // ─── Init ────────────────────────────────────────────────────
  loadRememberMe();
})();

// ─── Forgot Password Modal Globals ───────────────────────────
var _forgotEmail = '';

function openForgotModal() {
  var modal = document.getElementById('forgotPasswordModal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.getElementById('forgotStep1').style.display = 'block';
  document.getElementById('forgotStep2').style.display = 'none';
  document.getElementById('forgotEmail').value = '';
  document.getElementById('forgotEmailError').style.display = 'none';
  _forgotEmail = '';
}

function closeForgotModal() {
  var modal = document.getElementById('forgotPasswordModal');
  if (modal) modal.style.display = 'none';
}

function toggleForgotPwd(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  var isText = inp.type === 'text';
  inp.type = isText ? 'password' : 'text';
  btn.querySelector('i').className = isText ? 'far fa-eye' : 'far fa-eye-slash';
}

function sendTempPassword() {
  var email = document.getElementById('forgotEmail').value.trim();
  var errEl = document.getElementById('forgotEmailError');
  errEl.style.display = 'none';
  if (!email || !email.includes('@')) {
    errEl.textContent = 'Please enter a valid email address.';
    errEl.style.display = 'block';
    return;
  }
  _forgotEmail = email;
  var spinner = document.getElementById('sendTempBtnSpinner');
  var btn = document.getElementById('sendTempPasswordBtn');
  spinner.style.display = 'inline';
  btn.disabled = true;

  API.forgotPassword(email).then(function(res) {
    spinner.style.display = 'none';
    btn.disabled = false;
    if (res && res.success) {
      document.getElementById('forgotStep1').style.display = 'none';
      document.getElementById('forgotStep2').style.display = 'block';
    } else {
      errEl.textContent = res.message || 'Failed to send temporary password.';
      errEl.style.display = 'block';
    }
  }).catch(function(err) {
    spinner.style.display = 'none';
    btn.disabled = false;
    errEl.textContent = err.message || 'An error occurred. Try again.';
    errEl.style.display = 'block';
  });
}

function setNewPassword() {
  var tempPwd = document.getElementById('tempPasswordInput').value.trim();
  var newPwd = document.getElementById('newPasswordInput').value.trim();
  var confirmPwd = document.getElementById('confirmNewPasswordInput').value.trim();
  var errEl = document.getElementById('resetPasswordError');
  errEl.style.display = 'none';

  if (!tempPwd || !newPwd || !confirmPwd) {
    errEl.textContent = 'All fields are required.';
    errEl.style.display = 'block';
    return;
  }
  if (newPwd !== confirmPwd) {
    errEl.textContent = 'New passwords do not match.';
    errEl.style.display = 'block';
    return;
  }
  if (newPwd.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }

  var spinner = document.getElementById('setNewPwdSpinner');
  var btn = document.getElementById('setNewPasswordBtn');
  spinner.style.display = 'inline';
  btn.disabled = true;

  API.resetPasswordWithTemp({ email: _forgotEmail, temporaryPassword: tempPwd, newPassword: newPwd }).then(function(res) {
    spinner.style.display = 'none';
    btn.disabled = false;
    if (res && res.success) {
      closeForgotModal();
      alert('✅ Password reset successfully! You can now login with your new password.');
    } else {
      errEl.textContent = res.message || 'Reset failed. Check your temporary password.';
      errEl.style.display = 'block';
    }
  }).catch(function(err) {
    spinner.style.display = 'none';
    btn.disabled = false;
    errEl.textContent = err.message || 'An error occurred. Try again.';
    errEl.style.display = 'block';
  });
}