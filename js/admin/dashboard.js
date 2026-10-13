
/**
 * UCPP V2 — Admin Dashboard Controller
 * File: js/admin/dashboard.js
 * Version: 3.0
 *
 * Features:
 * - Existing admin session protection
 * - Live dashboard metrics
 * - Reporting period filters
 * - Recruitment pipeline
 * - Loading and error handling
 * - Secure logout
 *
 * Dependencies:
 * - admin-config.js
 * - admin-api.js
 *
 * Does not modify:
 * - Candidate/Employer APIs
 * - Google Sheets
 * - Existing dashboard HTML/CSS
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
  let isLoadingMetrics = false;

  let currentPeriod = {
    period: 'all'
  };

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

  function showAlert(message) {
    const alert = getElement('adminDashboardAlert');

    if (!alert) {
      return;
    }

    alert.textContent = String(message || '');
    alert.hidden = !message;
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
      message ||
      'Administrator authentication is required.'
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

  function formatCount(value) {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      return '—';
    }

    return Math.trunc(value).toLocaleString('en-IN');
  }

  function setCount(id, value) {
    const element = getElement(id);

    if (element) {
      element.textContent = formatCount(value);
    }
  }

  function resetMetrics() {
    Object.keys(METRIC_IDS).forEach(function (key) {
      setCount(METRIC_IDS[key], null);
    });

    [
      'adminPipelineApplied',
      'adminPipelineShortlisted',
      'adminPipelineInterview',
      'adminPipelineRejected'
    ].forEach(function (id) {
      setCount(id, null);
    });
  }

  function renderMetrics(metrics) {
    if (
      !metrics ||
      typeof metrics !== 'object'
    ) {
      resetMetrics();
      return;
    }

    Object.keys(METRIC_IDS).forEach(function (key) {
      setCount(
        METRIC_IDS[key],
        metrics[key]
      );
    });

    /*
     * Pipeline values represent current
     * application statuses, not a historical
     * sequence of stage transitions.
     *
     * The current backend returns:
     * applications, shortlisted,
     * interviews, rejected.
     */
    setCount(
      'adminPipelineApplied',
      metrics.applications
    );

    setCount(
      'adminPipelineShortlisted',
      metrics.shortlisted
    );

    setCount(
      'adminPipelineInterview',
      metrics.interviews
    );

    setCount(
      'adminPipelineRejected',
      metrics.rejected
    );
  }

  function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return year + '-' + month + '-' + day;
  }

  function getPeriodPayload() {
    const preset = getElement('adminDatePreset');
    const from = getElement('adminFromDate');
    const to = getElement('adminToDate');

    const value = preset ? preset.value : 'all';

    if (value === 'all') {
      return {
        period: 'all'
      };
    }

    if (value === 'month') {
      return {
        period: 'this_month'
      };
    }

    if (value === 'lastmonth') {
      return {
        period: 'last_month'
      };
    }

    if (value === 'today') {
      const today = getLocalDateKey(new Date());

      return {
        period: 'custom',
        startDate: today,
        endDate: today
      };
    }

    if (value === '7days') {
      const today = new Date();
      const start = new Date(today);

      start.setDate(start.getDate() - 6);

      return {
        period: 'custom',
        startDate: getLocalDateKey(start),
        endDate: getLocalDateKey(today)
      };
    }

    if (value === 'custom') {
      const startDate = from ? from.value : '';
      const endDate = to ? to.value : '';

      if (
        !startDate ||
        !endDate ||
        startDate > endDate
      ) {
        throw new Error(
          'Please select a valid date range.'
        );
      }

      return {
        period: 'custom',
        startDate: startDate,
        endDate: endDate
      };
    }

    throw new Error(
      'Unsupported reporting period.'
    );
  }

  function getPeriodLabel() {
    const preset = getElement('adminDatePreset');

    if (!preset) {
      return 'All-time overview';
    }

    const labels = {
      all: 'All-time overview',
      today: 'Today',
      '7days': 'Last 7 days',
      month: 'This month',
      lastmonth: 'Last month',
      custom: 'Custom date range'
    };

    return labels[preset.value] ||
      'Selected reporting period';
  }

  function updateCustomDateVisibility() {
    const preset = getElement('adminDatePreset');

    const fromWrap = getElement(
      'adminFromDateWrap'
    );

    const toWrap = getElement(
      'adminToDateWrap'
    );

    const custom = Boolean(
      preset && preset.value === 'custom'
    );

    if (fromWrap) {
      fromWrap.hidden = !custom;
      fromWrap.style.display = custom ? '' : 'none';
    }

    if (toWrap) {
      toWrap.hidden = !custom;
      toWrap.style.display = custom ? '' : 'none';
    }
  }

  function setLoading(loading) {
    isLoadingMetrics = loading;

    const button = getElement(
      'adminApplyFilter'
    );

    if (button) {
      button.disabled = loading;
      button.textContent = loading
        ? 'Loading...'
        : 'Apply Filter';

      button.removeAttribute('title');
    }
  }

  async function loadMetrics(periodPayload) {
    if (
      !sessionToken ||
      !API ||
      isLoadingMetrics
    ) {
      return;
    }

    setLoading(true);
    showAlert('');

    try {
      const response = await API.request(
        CONFIG.ACTIONS.DASHBOARD,
        {
          token: sessionToken,
          ...periodPayload
        }
      );

      if (
        !response ||
        response.success !== true
      ) {
        if (
          response &&
          [
            'INVALID_ADMIN_SESSION',
            'ADMIN_SESSION_REQUIRED',
            'ADMIN_ACCESS_DENIED',
            'ADMIN_IDENTITY_INVALID'
          ].includes(response.code)
        ) {
          denyAccess(
            'Your administrator session has expired.',
            true
          );
          return;
        }

        throw new Error(
          response && response.message
            ? response.message
            : 'Unable to load dashboard metrics.'
        );
      }

      const dashboard = extractDashboard(
        response
      );

      if (
        !dashboard ||
        dashboard.metricsAvailable !== true ||
        !dashboard.metrics
      ) {
        throw new Error(
          'Live dashboard metrics are not available.'
        );
      }

      dashboardData = dashboard;
      currentPeriod = periodPayload;

      renderMetrics(dashboard.metrics);

      const label = getElement(
        'adminSelectedPeriodLabel'
      );

      if (label) {
        label.textContent = getPeriodLabel();
      }

    } catch (error) {
      showAlert(
        error && error.message
          ? error.message
          : 'Unable to load dashboard metrics.'
      );

    } finally {
      setLoading(false);
    }
  }

  function setupFilters() {
    const form = getElement(
      'adminDashboardFilterForm'
    );

    const preset = getElement(
      'adminDatePreset'
    );

    if (preset) {
      preset.addEventListener(
        'change',
        updateCustomDateVisibility
      );
    }

    updateCustomDateVisibility();

    if (form) {
      form.addEventListener(
        'submit',
        function (event) {
          event.preventDefault();

          try {
            const period = getPeriodPayload();

            loadMetrics(period);

          } catch (error) {
            showAlert(error.message);
          }
        }
      );
    }
  }

  async function validateDashboardAccess(token) {
    if (!CONFIG || !API) {
      denyAccess(
        'Admin configuration is unavailable.',
        false
      );
      return false;
    }

    const normalizedToken = String(
      token || ''
    ).trim();

    if (!normalizedToken) {
      denyAccess(
        'Administrator session is required.',
        true
      );
      return false;
    }

    hideProtectedContent();

    showAccessMessage(
      'Verifying administrator session...'
    );

    try {
      const validation = await API.validateSession(
        normalizedToken
      );

      if (
        !validation ||
        validation.success !== true
      ) {
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

      const dashboardResponse =
        await API.getDashboard(normalizedToken);

      
if (
  !dashboardResponse ||
  dashboardResponse.success !== true
) {
  const code = dashboardResponse
    ? String(dashboardResponse.code || '')
    : '';

  const sessionErrors = [
    'INVALID_ADMIN_SESSION',
    'ADMIN_SESSION_REQUIRED',
    'ADMIN_ACCESS_DENIED',
    'ADMIN_IDENTITY_INVALID'
  ];

  if (sessionErrors.includes(code)) {
    denyAccess(
      'Your administrator session has expired or access was denied.',
      true
    );
    return false;
  }

  /*
   * A dashboard data error is not automatically
   * an authentication failure.
   *
   * Do not delete a valid session.
   */
  sessionToken = normalizedToken;
  authenticatedAdmin = admin;
  dashboardData = null;

  removeAccessMessage();
  showProtectedContent();
  resetMetrics();

  showAlert(
    dashboardResponse && dashboardResponse.message
      ? dashboardResponse.message
      : 'Dashboard data is temporarily unavailable.'
  );

  return true;
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
        new CustomEvent(
          'ucpp:admin-authorized',
          {
            detail: {
              admin: {
                name: String(
                  admin.name ||
                  admin.fullName ||
                  ''
                ),
                role: String(
                  admin.role || ''
                )
              }
            }
          }
        )
      );

      if (
        dashboard.metricsAvailable === true &&
        dashboard.metrics
      ) {
        renderMetrics(dashboard.metrics);

        const applyButton = getElement(
          'adminApplyFilter'
        );

        if (applyButton) {
          applyButton.disabled = false;
          applyButton.removeAttribute('title');
        }

      } else {
        resetMetrics();

        showAlert(
          'Dashboard is accessible, but live metrics are not available yet.'
        );
      }

      return true;

} catch (_) {
  /*
   * Network errors must not be treated as
   * proof that the session is invalid.
   *
   * Keep protected content hidden because
   * dashboard authorization was not confirmed.
   */
  hideProtectedContent();

  showAccessMessage(
    'Unable to verify dashboard access. Please refresh and try again.'
  );

  return false;
}

   
  }

  async function logout() {
    if (isLoggingOut) {
      return;
    }

    isLoggingOut = true;

    const token =
      sessionToken || restoreStoredSession();

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
      '[data-admin-logout], ' +
      '#adminLogout, ' +
      '#logoutButton'
    );

    buttons.forEach(function (button) {
      button.addEventListener(
        'click',
        function (event) {
          event.preventDefault();
          logout();
        }
      );
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
    setupFilters();

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

  Object.defineProperty(
    window,
    'UCPP_ADMIN_DASHBOARD',
    {
      value: Object.freeze({
        validateAccess: validateDashboardAccess,
        logout: logout,
        isAuthenticated: function () {
          return Boolean(
            authenticatedAdmin &&
            sessionToken
          );
        },
        refreshMetrics: function () {
          return loadMetrics(currentPeriod);
        }
      }),
      writable: false,
      configurable: false
    }
  );

})(window, document);
