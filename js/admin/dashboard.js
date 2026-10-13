
/**
 * UCPP V2 — Admin Dashboard Controller
 * File: js/admin/dashboard.js
 * Version: 4.0 — Recovery
 *
 * Purpose:
 * Restore stable admin dashboard access.
 * Live metrics integration temporarily disabled.
 */

(function (window, document) {
  'use strict';

  const CONFIG = window.UCPP_ADMIN_CONFIG;
  const API = window.UCPP_ADMIN_API;

  let token = null;
  let admin = null;
  let loggingOut = false;

  const dashboard = document.getElementById('adminDashboard');
  const alertBox = document.getElementById('adminDashboardAlert');
  const logoutButton = document.getElementById('adminLogout');
  const filterButton = document.getElementById('adminApplyFilter');
  const filterForm = document.getElementById('adminDashboardFilterForm');
  const exportForm = document.getElementById('adminExportForm');

  function hideDashboard() {
    if (dashboard) {
      dashboard.hidden = true;
      dashboard.style.display = 'none';
    }
  }

  function showDashboard() {
    if (dashboard) {
      dashboard.hidden = false;
      dashboard.style.removeProperty('display');
    }
  }

  function showMessage(message) {
    let overlay = document.getElementById('adminAccessMessage');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'adminAccessMessage';
      overlay.setAttribute('role', 'status');
      document.body.appendChild(overlay);
    }

    overlay.textContent = message;

    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#f5f8fc',
      color: '#174a83',
      fontWeight: '600',
      textAlign: 'center',
      zIndex: '99999'
    });
  }

  function removeMessage() {
    const overlay = document.getElementById('adminAccessMessage');
    if (overlay) overlay.remove();
  }

  function showAlert(message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.hidden = !message;
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(CONFIG.SESSION.STORAGE_KEY);
    } catch (_) {}

    token = null;
    admin = null;
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(CONFIG.SESSION.STORAGE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);

      if (
        !data ||
        typeof data.token !== 'string' ||
        !data.token.trim() ||
        !Number.isFinite(data.expiresAt) ||
        data.expiresAt <= Date.now()
      ) {
        clearSession();
        return null;
      }

      return data.token.trim();
    } catch (_) {
      return null;
    }
  }

  function redirectLogin() {
    window.location.replace(CONFIG.PATHS.LOGIN);
  }

  function denyAccess(message, shouldRedirect) {
    hideDashboard();
    showMessage(message);

    if (shouldRedirect) {
      clearSession();
      redirectLogin();
    }
  }

  function extractAdmin(response) {
    if (response && response.admin) return response.admin;
    if (response && response.data && response.data.admin) {
      return response.data.admin;
    }
    return null;
  }

  function extractDashboard(response) {
    if (response && response.dashboard) return response.dashboard;
    if (response && response.data && response.data.dashboard) {
      return response.data.dashboard;
    }
    return null;
  }

  function disablePendingFeatures() {
    if (filterButton) {
      filterButton.disabled = true;
      filterButton.title = 'Available after live metrics integration';
    }

    if (filterForm) {
      filterForm.addEventListener('submit', function (event) {
        event.preventDefault();
      });
    }

    if (exportForm) {
      exportForm.addEventListener('submit', function (event) {
        event.preventDefault();
      });
    }
  }

  async function verifyAccess() {
    hideDashboard();
    showMessage('Verifying administrator session...');

    if (!CONFIG || !API) {
      showMessage('Admin configuration unavailable.');
      return;
    }

    const savedToken = readSession();

    if (!savedToken) {
      denyAccess('Please sign in.', true);
      return;
    }

    try {
      const validation = await API.validateSession(savedToken);

      if (!validation || validation.success !== true) {
        const code = validation ? validation.code : '';

        if (
          code === 'ADMIN_SESSION_INVALID' ||
          code === 'ADMIN_ACCESS_DENIED'
        ) {
          denyAccess('Your session has expired.', true);
        } else {
          showMessage(
            'Unable to verify your session. Please refresh and try again.'
          );
        }
        return;
      }

      const verifiedAdmin = extractAdmin(validation);

      if (!verifiedAdmin) {
        showMessage('Admin identity response is incomplete.');
        return;
      }

      /*
       * A successful session validation confirms identity,
       * but dashboard access must also be authorized by backend.
       */
      const dashboardResponse = await API.getDashboard(savedToken);

if (!dashboardResponse || dashboardResponse.success !== true) {

  console.error(
    '[UCPP ADMIN] Dashboard API failed:',
    dashboardResponse
  );

  showMessage(
    'Dashboard error: ' +
    (
      dashboardResponse?.code ||
      dashboardResponse?.message ||
      'Unknown API failure'
    )
  );

  return;
}

      const dashboardData = extractDashboard(dashboardResponse);

      if (!dashboardData) {
        showMessage('Dashboard response is incomplete.');
        return;
      }

      token = savedToken;
      admin = verifiedAdmin;

      removeMessage();
      showDashboard();

      showAlert(
        'Dashboard access restored. Live metrics will be enabled next.'
      );

      document.dispatchEvent(
        new CustomEvent('ucpp:admin-authorized', {
          detail: {
            admin: {
              name: String(admin.name || ''),
              role: String(admin.role || '')
            }
          }
        })
      );

    } catch (_) {
      showMessage(
        'Unable to connect to the admin server. Please refresh and try again.'
      );
    }
  }

  async function logout() {
    if (loggingOut) return;
    loggingOut = true;

    const activeToken = token || readSession();

    hideDashboard();
    showMessage('Signing out...');

    clearSession();

    if (activeToken && API) {
      try {
        await API.logout(activeToken);
      } catch (_) {
        // Local session has already been cleared.
      }
    }

    redirectLogin();
  }

  function initialize() {
    hideDashboard();
    disablePendingFeatures();

    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }

    verifyAccess();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, {
      once: true
    });
  } else {
    initialize();
  }

  window.UCPP_ADMIN_DASHBOARD = Object.freeze({
    validateAccess: verifyAccess,
    logout: logout,
    isAuthenticated: function () {
      return Boolean(token && admin);
    }
  });

})(window, document);
