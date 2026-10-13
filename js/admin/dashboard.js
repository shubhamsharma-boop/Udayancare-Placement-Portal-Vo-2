
/**
 * =========================================================
 * UCPP V2 — Admin Dashboard Controller
 * File: js/admin/dashboard.js
 * Version: 5.0 — Live Metrics & Date Filters
 *
 * Secure backend-authorized dashboard.
 * Read-only dashboard operations.
 * =========================================================
 */

(function (window, document) {
  'use strict';

  const CONFIG = window.UCPP_ADMIN_CONFIG;
  const API = window.UCPP_ADMIN_API;

  let token = null;
  let admin = null;
  let loggingOut = false;
  let loadingDashboard = false;

  const dashboard = document.getElementById('adminDashboard');
  const alertBox = document.getElementById('adminDashboardAlert');
  const logoutButton = document.getElementById('adminLogout');
  const filterButton = document.getElementById('adminApplyFilter');
  const filterForm = document.getElementById('adminDashboardFilterForm');
  const exportForm = document.getElementById('adminExportForm');

  const $ = (id) => document.getElementById(id);

  const METRIC_IDS = Object.freeze({
    newCandidates: 'adminCandidatesCount',
    newEmployers: 'adminEmployersCount',
    jobsPosted: 'adminJobsCount',
    applications: 'adminApplicationsCount',
    shortlisted: 'adminShortlistedCount',
    interviews: 'adminInterviewsCount',
    rejected: 'adminRejectedCount',
    verifiedPlacements: 'adminPlacementsCount'
  });

  function setText(id, value) {
    const element = $(id);

    if (element) {
      element.textContent = String(value ?? '—');
    }
  }

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
    let overlay = $('adminAccessMessage');

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
    const overlay = $('adminAccessMessage');

    if (overlay) {
      overlay.remove();
    }
  }

  function showAlert(message, type = 'error') {
    if (!alertBox) return;

    alertBox.textContent = message;
    alertBox.hidden = !message;
    alertBox.className = 'profile-alert ' + type;
  }

  function clearSession() {
    try {
      if (CONFIG?.SESSION?.STORAGE_KEY) {
        sessionStorage.removeItem(CONFIG.SESSION.STORAGE_KEY);
      }
    } catch (_) {}

    token = null;
    admin = null;
  }

  function readSession() {
    try {
      if (!CONFIG?.SESSION?.STORAGE_KEY) {
        return null;
      }

      const raw = sessionStorage.getItem(
        CONFIG.SESSION.STORAGE_KEY
      );

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
    if (CONFIG?.PATHS?.LOGIN) {
      window.location.replace(CONFIG.PATHS.LOGIN);
    }
  }

  function denyAccess(message, shouldRedirect) {
    hideDashboard();
    showMessage(message);

    if (shouldRedirect) {
      clearSession();
      redirectLogin();
    }
  }

  function isInvalidSession(response) {
    return [
      'ADMIN_SESSION_INVALID',
      'ADMIN_ACCESS_DENIED',
      'ADMIN_SESSION_REQUIRED',
      'ADMIN_SESSION_EXPIRED'
    ].includes(String(response?.code || ''));
  }

  function extractAdmin(response) {
    if (response?.admin) return response.admin;
    if (response?.data?.admin) return response.data.admin;
    return null;
  }

  function extractDashboard(response) {
    if (response?.dashboard) return response.dashboard;
    if (response?.data?.dashboard) {
      return response.data.dashboard;
    }
    return null;
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');
    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function getPeriodPayload() {
    const preset = String(
      $('adminDatePreset')?.value || 'all'
    );

    const today = new Date();

    if (preset === 'all') {
      return {
        period: 'all',
        label: 'All Time'
      };
    }

    if (preset === 'month') {
      return {
        period: 'this_month',
        label: 'This Month'
      };
    }

    if (preset === 'lastmonth') {
      return {
        period: 'last_month',
        label: 'Last Month'
      };
    }

    if (preset === 'today') {
      const date = localDateKey(today);

      return {
        period: 'custom',
        startDate: date,
        endDate: date,
        label: 'Today'
      };
    }

    if (preset === '7days') {
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 6
      );

      return {
        period: 'custom',
        startDate: localDateKey(start),
        endDate: localDateKey(today),
        label: 'Last 7 Days'
      };
    }

    if (preset === 'custom') {
      const startDate = String(
        $('adminFromDate')?.value || ''
      ).trim();

      const endDate = String(
        $('adminToDate')?.value || ''
      ).trim();

      if (!startDate || !endDate) {
        throw new Error(
          'Please select both From Date and To Date.'
        );
      }

      if (startDate > endDate) {
        throw new Error(
          'From Date cannot be after To Date.'
        );
      }

      return {
        period: 'custom',
        startDate,
        endDate,
        label: `${startDate} to ${endDate}`
      };
    }

    throw new Error('Unsupported reporting period.');
  }

  function updateDateFields() {
    const isCustom =
      $('adminDatePreset')?.value === 'custom';

    const fromWrap = $('adminFromDateWrap');
    const toWrap = $('adminToDateWrap');

    if (fromWrap) fromWrap.hidden = !isCustom;
    if (toWrap) toWrap.hidden = !isCustom;

    const today = localDateKey(new Date());

    const fromInput = $('adminFromDate');
    const toInput = $('adminToDate');

    if (fromInput) fromInput.max = today;
    if (toInput) toInput.max = today;
  }

  function formatNumber(value) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—';
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return '—';
    }

    return number.toLocaleString('en-IN');
  }

  function clearMetrics() {
    Object.values(METRIC_IDS).forEach(id => {
      setText(id, '—');
    });

    [
      'adminPipelineApplied',
      'adminPipelineShortlisted',
      'adminPipelineInterview',
      'adminPipelineRejected'
    ].forEach(id => setText(id, '—'));
  }

  function renderMetrics(metrics) {
    Object.entries(METRIC_IDS).forEach(([key, id]) => {
      setText(id, formatNumber(metrics[key]));
    });

    // Backend currently does not provide an Applied-only count.
setText(
  'adminPipelineApplied',
  formatNumber(metrics.applied)
);
    setText(
      'adminPipelineShortlisted',
      formatNumber(metrics.shortlisted)
    );

    setText(
      'adminPipelineInterview',
      formatNumber(metrics.interviews)
    );

    setText(
      'adminPipelineRejected',
      formatNumber(metrics.rejected)
    );
  }

  async function loadDashboard(periodOptions, initial = false) {
    if (loadingDashboard || !token) return;

    loadingDashboard = true;

    if (filterButton) {
      filterButton.disabled = true;
      filterButton.textContent = 'Loading...';
    }

    if (initial) {
      showMessage('Loading dashboard metrics...');
    }

    try {
      const response = await API.getDashboard(
        token,
        {
          period: periodOptions.period,
          startDate: periodOptions.startDate,
          endDate: periodOptions.endDate
        }
      );

      if (!response || response.success !== true) {
        if (isInvalidSession(response)) {
          denyAccess('Your session has expired.', true);
          return;
        }

        throw new Error(
          response?.message ||
          response?.code ||
          'Unable to load dashboard metrics.'
        );
      }

      const dashboardData = extractDashboard(response);

      if (
        !dashboardData ||
        !dashboardData.metrics ||
        typeof dashboardData.metrics !== 'object'
      ) {
        throw new Error(
          'Dashboard metrics response is incomplete.'
        );
      }

      renderMetrics(dashboardData.metrics);

      setText(
        'adminSelectedPeriodLabel',
        periodOptions.label
      );

      removeMessage();
      showDashboard();
      showAlert('');

    } catch (error) {
      console.error(
        '[UCPP ADMIN] Dashboard metrics error:',
        error
      );

      if (initial) {
        removeMessage();
        showDashboard();
      }

      showAlert(
        error?.message ||
        'Unable to load dashboard metrics.'
      );

    } finally {
      loadingDashboard = false;

      if (filterButton) {
        filterButton.disabled = false;
        filterButton.textContent = 'Apply Filter';
      }
    }
  }

  async function verifyAccess() {
    hideDashboard();
    clearMetrics();
    showMessage('Verifying administrator session...');

    if (
      !CONFIG ||
      !API ||
      typeof API.validateSession !== 'function' ||
      typeof API.getDashboard !== 'function'
    ) {
      showMessage('Admin configuration or API unavailable.');
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
        if (isInvalidSession(validation)) {
          denyAccess('Your session has expired.', true);
        } else {
          showMessage(
            validation?.message ||
            'Unable to verify your session.'
          );
        }
        return;
      }

      const verifiedAdmin = extractAdmin(validation);

      if (!verifiedAdmin) {
        showMessage(
          'Admin identity response is incomplete.'
        );
        return;
      }

      token = savedToken;
      admin = verifiedAdmin;

      const periodOptions = {
        period: 'all',
        label: 'All Time'
      };

      await loadDashboard(periodOptions, true);

      if (dashboard && !dashboard.hidden) {
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
      }

    } catch (error) {
      console.error(
        '[UCPP ADMIN] Authorization error:',
        error
      );

      showMessage(
        'Unable to connect to the admin server. Please refresh.'
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
      } catch (_) {}
    }

    redirectLogin();
  }

  function initializeEvents() {
    $('adminDatePreset')?.addEventListener(
      'change',
      updateDateFields
    );

    filterForm?.addEventListener(
      'submit',
      async event => {
        event.preventDefault();

        if (!token || loadingDashboard) return;

        try {
          const periodOptions = getPeriodPayload();
          await loadDashboard(periodOptions);
        } catch (error) {
          showAlert(error.message);
        }
      }
    );

    exportForm?.addEventListener(
      'submit',
      event => event.preventDefault()
    );

    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }

    const exportButton = $('adminDownloadReport');

    if (exportButton) {
      exportButton.disabled = true;
      exportButton.title =
        'Secure report export is not enabled yet.';
    }
  }

  function initialize() {
    hideDashboard();
    clearMetrics();
    updateDateFields();
    initializeEvents();
    verifyAccess();
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

  window.UCPP_ADMIN_DASHBOARD = Object.freeze({
    validateAccess: verifyAccess,
    logout: logout,
    isAuthenticated: function () {
      return Boolean(token && admin);
    }
  });

})(window, document);
