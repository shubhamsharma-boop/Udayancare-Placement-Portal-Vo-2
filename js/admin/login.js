
/**
 * UCPP V2 — Admin Login Controller
 * File: js/admin/login.js
 * Version: 2.0
 *
 * PHASE 1 — Secure Session Handoff
 *
 * Features:
 * - Login form validation
 * - Password visibility toggle
 * - Remember email only
 * - Loading and error states
 * - Backend session validation
 * - Same-tab sessionStorage handoff
 * - Dashboard redirect
 *
 * SECURITY:
 * - Password is never stored.
 * - Token is never added to a URL.
 * - Token is never stored in localStorage.
 * - Authentication is verified by the backend.
 * - Login remains disabled server-side until approved.
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
    console.error('Required admin login elements are missing.');
    return;
  }

  let isSubmitting = false;

  function showAlert(message, type = 'error') {
    alertBox.textContent = String(
      message || 'Something went wrong.'
    );

    alertBox.className = 'login-alert';

    if (type === 'success' || type === 'info') {
      alertBox.classList.add(type);
    }

    alertBox.hidden = false;
  }

  function clearAlert() {
    alertBox.textContent = '';
    alertBox.className = 'login-alert';
    alertBox.hidden = true;
  }

  function setLoading(loading) {
    isSubmitting = Boolean(loading);

    submitButton.disabled = isSubmitting;
    emailInput.disabled = isSubmitting;
    passwordInput.disabled = isSubmitting;

    if (rememberEmail) {
      rememberEmail.disabled = isSubmitting;
    }

    if (buttonText) {
      buttonText.textContent = isSubmitting
        ? 'Signing in...'
        : 'Sign In';
    }

    if (buttonSpinner) {
      buttonSpinner.hidden = !isSubmitting;
    }

    if (buttonArrow) {
      buttonArrow.hidden = isSubmitting;
    }

    if (togglePassword) {
      togglePassword.disabled = isSubmitting;
    }
  }

  function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    emailInput.removeAttribute('aria-invalid');
    passwordInput.removeAttribute('aria-invalid');

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

    return {
      email: email,
      password: password
    };
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
      // Browser storage may be unavailable.
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
      // Remember-email is optional.
    }
  }

  function saveSession(token, expiresIn) {
    const normalizedToken = String(token || '').trim();

    if (!normalizedToken) {
      throw new Error('Invalid administrator session token.');
    }

    const serverLifetime = Number(expiresIn);

    const configuredLifetime = Number(
      CONFIG.SESSION.MAX_AGE_SECONDS
    );

    const maxLifetime = (
      Number.isFinite(configuredLifetime) &&
      configuredLifetime > 0
    ) ? configuredLifetime : 21600;

    const lifetime = (
      Number.isFinite(serverLifetime) &&
      serverLifetime > 0
    ) ? Math.min(serverLifetime, maxLifetime) : maxLifetime;

    const session = {
      token: normalizedToken,
      expiresAt: Date.now() + lifetime * 1000
    };

    try {
      window.sessionStorage.setItem(
        CONFIG.SESSION.STORAGE_KEY,
        JSON.stringify(session)
      );
    } catch (_) {
      throw new Error(
        'Unable to establish a browser session. Please enable session storage.'
      );
    }
  }

  function clearSession() {
    try {
      window.sessionStorage.removeItem(
        CONFIG.SESSION.STORAGE_KEY
      );
    } catch (_) {
      // No stored session to clear.
    }
  }

  async function revokeSession(token) {
    if (!token) {
      return;
    }

    try {
      await API.logout(token);
    } catch (_) {
      // Revocation could not be confirmed.
    }
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

    let issuedToken = '';

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

      const sessionData = (
        result.data &&
        typeof result.data === 'object'
      ) ? result.data : result;

      issuedToken = String(
        sessionData.token || ''
      ).trim();

      if (!issuedToken) {
        throw new Error(
          'Login response did not include a session token.'
        );
      }

      const validation = await API.validateSession(
        issuedToken
      );

      if (!validation || validation.success !== true) {
        throw new Error(
          'Session verification failed. Please sign in again.'
        );
      }

      saveSession(
        issuedToken,
        sessionData.expiresIn
      );

      updateRememberedEmail(credentials.email);

      passwordInput.value = '';

      showAlert(
        'Login successful. Opening dashboard...',
        'success'
      );

      window.location.assign(
        CONFIG.PATHS.DASHBOARD
      );

    } catch (error) {
      clearSession();
      await revokeSession(issuedToken);

      showAlert(
        error && error.message
          ? error.message
          : 'Unable to sign in. Please try again.'
      );

    } finally {
      passwordInput.value = '';
      setLoading(false);
    }
  }

  function setupPasswordToggle() {
    if (!togglePassword) {
      return;
    }

    togglePassword.addEventListener('click', function () {
      const isVisible = passwordInput.type === 'text';

      passwordInput.type = isVisible
        ? 'password'
        : 'text';

      togglePassword.textContent = isVisible
        ? 'Show'
        : 'Hide';

      togglePassword.setAttribute(
        'aria-label',
        isVisible ? 'Show password' : 'Hide password'
      );

      togglePassword.setAttribute(
        'aria-pressed',
        String(!isVisible)
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
      yearElement.textContent = String(
        new Date().getFullYear()
      );
    }

    restoreRememberedEmail();
    setupPasswordToggle();
    setupInputListeners();

    form.addEventListener('submit', handleLogin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

})(window, document);
