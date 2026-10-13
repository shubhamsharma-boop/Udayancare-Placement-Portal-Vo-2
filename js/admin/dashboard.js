
/**
 * UCPP V2 — Admin Dashboard Controller
 * File: js/admin/dashboard.js
 * Version: 2.0
 *
 * PHASE 1 — Authentication & Session Guard
 *
 * Dependencies:
 * - admin-config.js
 * - admin-api.js
 *
 * SECURITY:
 * - Session restored from same-tab sessionStorage.
 * - Backend validates session on every page load.
 * - Dashboard authorization checked server-side.
 * - No token in URL or localStorage.
 * - No mock data or unauthenticated dashboard access.
 */

(function (window, document) {
  'use strict';

  const CONFIG = window.UCPP_ADMIN_CONFIG;
  const API = window.UCPP_ADMIN_API;

  let sessionToken = null;
  let authenticatedAdmin = null;
  let dashboardData = null;
  let isInitializing = false;
  let isLoggingOut = false;

  function getElement(id) {
    return document.getElementById(id);
  }

  function getProtectedElements() {
    return document.querySelectorAll(
      '[data-admin-protected], ' +
      '[data-admin-dashboard], ' +
      '#dashboardContent, ' +
      '#adminDashboardContent, ' +
      '#dashboardMain, ' +
      '#adminDashboard'
    );
  }

  function hideProtectedContent() {
    getProtectedElements().forEach(function (element) {
      element.hidden = true;
      element.style.display = 'none';
    });
  }

  function showProtectedContent() {
    getProtectedElements().forEach(function (element) {
      element.hidden = false;
      element.style.removeProperty('display');
    });
  }

  function showAccessMessage(message) {
    let container = getElement('adminAccessMessage');

    if (!container) {
      container = document.createElement('div');
      container.id = 'adminAccessMessage';

      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');

      document.body.appendChild(container);
    }

    container.textContent = String(message || '');

    Object.assign(container.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '99999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#f5f8fc',
      color: '#174a83',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '16px',
      fontWeight: '600',
      textAlign: 'center'
    });
  }

  function removeAccessMessage() {
    const container = getElement('adminAccessMessage');

    if (container) {
      container.remove();
    }
  }

  function clearSensitiveState() {
    sessionToken = null;
    authenticatedAdmin = null;
    dashboardData = null;
  }

  function clearStoredSession() {
    if (!CONFIG || !CONFIG.SESSION) {
      return;
    }

    try {
      window.sessionStorage.removeItem(
        CONFIG.SESSION.STORAGE_KEY
      );
    } catch (_) {
      // Storage may be unavailable.
    }
  }

  function restoreStoredSession() {
    if (!CONFIG || !CONFIG.SESSION) {
      return null;
    }

    try {
      const raw = window.sessionStorage.getItem(
        CONFIG.SESSION.STORAGE_KEY
      );

      if (!raw) {
        return null;
      }

      const session = JSON.parse(raw);

      if (
        !session ||
        typeof session.token !== 'string' ||
        !session.token.trim() ||
        !Number.isFinite(session.expiresAt) ||
        session.expiresAt <= Date.now()
      ) {
        clearStoredSession();
        return null;
      }

      return session.token.trim();

    } catch (_) {
      clearStoredSession();
      return null;
    }
  }

  function redirectToLogin() {
    window.location.replace(
      CONFIG && CONFIG.PATHS
        ? CONFIG.PATHS.LOGIN
        : 'login.html'
    );
  }

  function denyAccess(message, redirect) {
    clearSensitiveState();
    clearStoredSession();
    hideProtectedContent();

    showAccessMessage(
      message || 'Administrator authentication is required.'
    );

    if (redirect) {
      redirectToLogin();
    }
  }

  function extractAdmin(response) {
    if (!response || typeof response !== 'object') {
      return null;
    }

    if (
      response.admin &&
      typeof response.admin === 'object'
    ) {
      return response.admin;
    }

    if (
      response.data &&
      response.data.admin &&
      typeof response.data.admin === 'object'
    ) {
      return response.data.admin;
    }

    return null;
  }

  function extractDashboard(response) {
    if (!response || typeof response !== 'object') {
      return null;
    }

    if (
      response.dashboard &&
      typeof response.dashboard === 'object'
    ) {
      return response.dashboard;
    }

    if (
      response.data &&
      response.data.dashboard &&
      typeof response.data.dashboard === 'object'
    ) {
      return response.data.dashboard;
    }

    return null;
  }

  async function validateDashboardAccess(token) {
    if (!CONFIG || !API) {
      denyAccess('Admin configuration is unavailable.', false);
      return false;
    }

    const normalizedToken = String(token || '').trim();

    if (!normalizedToken) {
      denyAccess(
        'Administrator session is required.',
        true
      );
      return false;
    }

    hideProtectedContent();
    showAccessMessage('Verifying administrator session...');

    try {
      const validation = await API.validateSession(
        normalizedToken
      );

      if (!validation || validation.success !== true) {
        denyAccess(
          'Your administrator session has expired.',
          true
        );
        return false;
      }

      const admin = extractAdmin(validation);

      if (!admin) {
        denyAccess(
          'Unable to verify administrator identity.',
          true
        );
        return false;
      }

      const dashboardResponse = await API.getDashboard(
        normalizedToken
      );

      if (
        !dashboardResponse ||
        dashboardResponse.success !== true
      ) {
        denyAccess(
          'Dashboard access was not authorized.',
          true
        );
        return false;
      }

      const dashboard = extractDashboard(
        dashboardResponse
      );

      if (!dashboard) {
        denyAccess(
          'Dashboard authorization response is incomplete.',
          true
        );
        return false;
      }

      sessionToken = normalizedToken;
      authenticatedAdmin = admin;
      dashboardData = dashboard;

      removeAccessMessage();
      showProtectedContent();

      document.dispatchEvent(
        new CustomEvent('ucpp:admin-authorized', {
          detail: {
            admin: {
              name: String(
                admin.name || admin.fullName || ''
              ),
              role: String(admin.role || '')
            }
          }
        })
      );

      return true;

    } catch (_) {
      /*
       * Fail closed on network or server errors.
       * Do not display cached protected data.
       */
      denyAccess(
        'Unable to verify administrator access.',
        true
      );
      return false;
    }
  }

  async function logout() {
    if (isLoggingOut) {
      return;
    }

    isLoggingOut = true;

    const token = sessionToken || restoreStoredSession();

    clearSensitiveState();
    clearStoredSession();
    hideProtectedContent();

    showAccessMessage('Signing out...');

    if (token && API) {
      try {
        await API.logout(token);
      } catch (_) {
        // Server revocation could not be confirmed.
      }
    }

    redirectToLogin();
  }

  function setupLogoutButtons() {
    const buttons = document.querySelectorAll(
      '[data-admin-logout], #adminLogout, #logoutButton'
    );

    buttons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        logout();
      });
    });
  }

  async function initialize() {
    if (isInitializing) {
      return;
    }

    isInitializing = true;

    hideProtectedContent();

    if (!CONFIG || !API) {
      denyAccess(
        'Admin services are not configured.',
        false
      );
      return;
    }

    setupLogoutButtons();

    const token = restoreStoredSession();

    if (!token) {
      denyAccess(
        'Please sign in to access the dashboard.',
        true
      );
      return;
    }

    await validateDashboardAccess(token);
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

  Object.defineProperty(window, 'UCPP_ADMIN_DASHBOARD', {
    value: Object.freeze({
      validateAccess: validateDashboardAccess,
      logout: logout,
      isAuthenticated: function () {
        return Boolean(
          authenticatedAdmin &&
          sessionToken
        );
      }
    }),
    writable: false,
    configurable: false
  });

})(window, document);
