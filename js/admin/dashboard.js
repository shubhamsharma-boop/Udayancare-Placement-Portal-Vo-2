
/**
 * UCPP V2 — Admin Dashboard Controller
 * File: js/admin/dashboard.js
 * Version: 1.0
 *
 * PHASE 1 — Authentication Guard
 *
 * SECURITY:
 * - No unauthenticated dashboard API calls.
 * - No admin token in URL.
 * - No token in localStorage.
 * - No mock admin data.
 * - Dashboard access remains blocked until
 *   secure session handoff is implemented.
 *
 * Dependencies:
 * - admin-config.js
 * - admin-api.js
 */

(function (window, document) {
  'use strict';

  const CONFIG = window.UCPP_ADMIN_CONFIG;
  const API = window.UCPP_ADMIN_API;

  let authenticatedAdmin = null;
  let dashboardData = null;
  let sessionToken = null;

  function getElement(id) {
    return document.getElementById(id);
  }

  function hideProtectedContent() {
    const selectors = [
      '[data-admin-protected]',
      '[data-admin-dashboard]',
      '#dashboardContent',
      '#adminDashboardContent',
      '#dashboardMain',
      '#adminDashboard'
    ];

    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (element) {
        element.hidden = true;
        element.style.display = 'none';
      });
    });
  }

  function showAccessMessage(message) {
    let container = getElement('adminAccessMessage');

    if (!container) {
      container = document.createElement('div');
      container.id = 'adminAccessMessage';

      container.setAttribute('role', 'alert');
      container.setAttribute('aria-live', 'polite');

      document.body.appendChild(container);
    }

    container.textContent = message;

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

  function clearSensitiveState() {
    authenticatedAdmin = null;
    dashboardData = null;
    sessionToken = null;
  }

  function denyAccess(message) {
    clearSensitiveState();
    hideProtectedContent();

    showAccessMessage(
      message ||
      'Administrator authentication is required.'
    );
  }

  async function validateDashboardAccess(token) {
    if (!API || !CONFIG) {
      denyAccess('Admin configuration is unavailable.');
      return false;
    }

    const normalizedToken = String(token || '').trim();

    if (!normalizedToken) {
      denyAccess(
        'Administrator session is required. Please sign in again.'
      );
      return false;
    }

    try {
      const validation = await API.validateSession(
        normalizedToken
      );

      if (
        !validation ||
        validation.success !== true ||
        !validation.admin
      ) {
        denyAccess('Administrator session is invalid or expired.');
        return false;
      }

      const dashboard = await API.getDashboard(
        normalizedToken
      );

      if (
        !dashboard ||
        dashboard.success !== true ||
        !dashboard.dashboard
      ) {
        denyAccess('Unable to authorize dashboard access.');
        return false;
      }

      authenticatedAdmin = validation.admin;
      dashboardData = dashboard.dashboard;
      sessionToken = normalizedToken;

      const message = getElement('adminAccessMessage');

      if (message) {
        message.remove();
      }

      return true;

    } catch (_) {
      denyAccess(
        'Unable to verify administrator access. Please try again.'
      );
      return false;
    }
  }

  async function logout() {
    const token = sessionToken;

    clearSensitiveState();
    hideProtectedContent();

    if (token && API) {
      try {
        await API.logout(token);
      } catch (_) {
        // Server-side logout could not be confirmed.
      }
    }

    window.location.replace(
      CONFIG && CONFIG.PATHS
        ? CONFIG.PATHS.LOGIN
        : 'login.html'
    );
  }

  function initialize() {
    hideProtectedContent();

    /*
     * No cross-page session handoff is currently
     * implemented.
     *
     * Until that is reviewed and completed, this
     * dashboard must remain inaccessible.
     */
    denyAccess(
      'Admin dashboard access is not enabled yet. Secure session integration is pending.'
    );
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

  /*
   * Expose only minimal controller methods.
   * These do not bypass backend authorization.
   */
  Object.defineProperty(window, 'UCPP_ADMIN_DASHBOARD', {
    value: Object.freeze({
      validateAccess: validateDashboardAccess,
      logout: logout,
      isAuthenticated: function () {
        return Boolean(authenticatedAdmin && sessionToken);
      }
    }),
    writable: false,
    configurable: false
  });

})(window, document);
