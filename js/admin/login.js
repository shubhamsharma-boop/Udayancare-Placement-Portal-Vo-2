
/**
 * UCPP V2 — Admin Login Controller
 * File: js/admin/login.js
 * Version: 1.0
 *
 * Features:
 * - Email/password form validation
 * - Password visibility toggle
 * - Remember email (not password)
 * - Loading and error states
 * - Authenticated dashboard redirect
 *
 * IMPORTANT:
 * - Does not store passwords.
 * - Does not automatically persist session tokens.
 * - Session token stays in memory only.
 * - Backend controls authentication.
 *
 * Dependency:
 * - admin-config.js
 * - admin-api.js
 */

(function (window, document) {
  'use strict';

  const CONFIG = window.UCPP_ADMIN_CONFIG;
  const API = window.UCPP_ADMIN_API;

  if (!CONFIG || !API) {
    console.error('Admin login dependencies unavailable.');
    return;
  }

  const form = document.getElementById('adminLoginForm');
  const emailInput = document.getElementById('adminEmail');
  const passwordInput = document.getElementById('adminPassword');
  const submitButton = document.getElementById('adminLoginButton');
  const buttonText = document.getElementById('loginButtonText');
  const buttonSpinner = document.getElementById('loginButtonSpinner');
  const buttonArrow = document.getElementById('loginButtonArrow');
  const togglePassword = document.getElementById('togglePassword');
  const rememberEmail = document.getElementById('rememberEmail');
  const alertBox = document.getElementById('loginAlert');
  const yearElement = document.getElementById('currentYear');

  if (
    !form ||
    !emailInput ||
    !passwordInput ||
    !submitButton ||
    !alertBox
  ) {
    console.error('Admin login form elements missing.');
    return;
  }

  let isSubmitting = false;
  let activeSessionToken = null;

  function showAlert(message, type = 'error') {
    alertBox.textContent = String(message || 'An error occurred.');
    alertBox.className = 'login-alert';

    if (type === 'success' || type === 'info') {
      alertBox.classList.add(type);
    }

    alertBox.hidden = false;
  }

  function clearAlert() {
    alertBox.textContent = '';
    alertBox.hidden = true;
    alertBox.className = 'login-alert';
  }

  function setLoading(loading) {
    isSubmitting = loading;

    submitButton.disabled = loading;
    emailInput.disabled = loading;
    passwordInput.disabled = loading;

    if (rememberEmail) {
      rememberEmail.disabled = loading;
    }

    if (buttonText) {
      buttonText.textContent = loading ? 'Signing in...' : 'Sign In';
    }

    if (buttonSpinner) {
      buttonSpinner.hidden = !loading;
    }

    if (buttonArrow) {
      buttonArrow.hidden = loading;
    }
  }

  function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    emailInput.setAttribute('aria-invalid', 'false');
    passwordInput.setAttribute('aria-invalid', 'false');

    if (!email || !emailInput.validity.valid) {
      emailInput.setAttribute('aria-invalid', 'true');
      showAlert('Please enter a valid email address.');
      emailInput.focus();
      return null;
    }

    if (!password || password.length < 12) {
      passwordInput.setAttribute('aria-invalid', 'true');
      showAlert('Please enter your administrator password.');
      passwordInput.focus();
      return null;
    }

    return { email, password };
  }

  function restoreRememberedEmail() {
    try {
      const savedEmail = window.localStorage.getItem(
        CONFIG.SESSION.EMAIL_STORAGE_KEY
      );

      if (savedEmail) {
        emailInput.value = savedEmail;

        if (rememberEmail) {
          rememberEmail.checked = true;
        }
      }
    } catch (_) {
      // Storage may be disabled by browser policy.
    }
  }

  function updateRememberedEmail(email) {
    try {
      if (rememberEmail && rememberEmail.checked) {
        window.localStorage.setItem(
          CONFIG.SESSION.EMAIL_STORAGE_KEY,
          email
        );
      } else {
        window.localStorage.removeItem(
          CONFIG.SESSION.EMAIL_STORAGE_KEY
        );
      }
    } catch (_) {
      // Login must not depend on localStorage availability.
    }
  }

  function getSafeDashboardPath() {
    return CONFIG.PATHS.DASHBOARD;
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearAlert();

    const credentials = validateForm();

    if (!credentials) {
      return;
    }

    setLoading(true);

    try {
      const result = await API.login(
        credentials.email,
        credentials.password
      );

      if (!result || result.success !== true) {
        showAlert(
          result && result.message
            ? result.message
            : 'Unable to sign in. Please check your credentials.'
        );
        return;
      }

      /*
       * Login succeeds only if the backend provides
       * a valid-looking session token.
       *
       * The token is NOT stored in localStorage.
       */
      const token = String(
        result.token ||
        (result.data && result.data.token) ||
        ''
      ).trim();

      if (!token) {
        showAlert(
          'Login response is incomplete. Please contact the administrator.'
        );
        return;
      }

      activeSessionToken = token;

      /*
       * Verify the issued session with the backend.
       * A successful login response alone is not enough.
       */
      const validation = await API.validateSession(
        activeSessionToken
      );

      if (!validation || validation.success !== true) {
        activeSessionToken = null;
        showAlert(
          'Unable to verify your session. Please sign in again.'
        );
        return;
      }

      updateRememberedEmail(credentials.email);

      passwordInput.value = '';

      showAlert(
        'Login successful. Opening dashboard...',
        'success'
      );

      /*
       * SECURITY NOTE:
       *
       * Session token is intentionally memory-only.
       * A full-page redirect loses JavaScript memory.
       *
       * Do not place the token in URL parameters.
       * Do not store it in localStorage without a
       * reviewed session security design.
       *
       * Dashboard redirect remains disabled until
       * secure session handoff is implemented.
       */
      showAlert(
        'Authentication verified. Dashboard session handoff is pending security integration.',
        'info'
      );

    } catch (error) {
      showAlert(
        error && error.message
          ? error.message
          : 'Unable to sign in. Please try again.'
      );

    } finally {
      activeSessionToken = null;
      passwordInput.value = '';
      setLoading(false);
    }
  }

  function setupPasswordToggle() {
    if (!togglePassword) {
      return;
    }

    togglePassword.addEventListener('click', function () {
      const showing = passwordInput.type === 'text';

      passwordInput.type = showing ? 'password' : 'text';

      togglePassword.textContent = showing ? 'Show' : 'Hide';
      togglePassword.setAttribute(
        'aria-label',
        showing ? 'Show password' : 'Hide password'
      );
      togglePassword.setAttribute(
        'aria-pressed',
        String(!showing)
      );
    });
  }

  function setupInputListeners() {
    emailInput.addEventListener('input', function () {
      emailInput.removeAttribute('aria-invalid');
      clearAlert();
    });

    passwordInput.addEventListener('input', function () {
      passwordInput.removeAttribute('aria-invalid');
      clearAlert();
    });
  }

  function initialize() {
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }

    restoreRememberedEmail();
    setupPasswordToggle();
    setupInputListeners();

    form.addEventListener('submit', handleLogin);
  }

  initialize();

})(window, document);
