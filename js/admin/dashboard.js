
/**
 * =========================================================
 * UCPP V2 — Admin Dashboard Controller
 * File: js/admin/dashboard.js
 * Version: 6.0 — Live Dashboard & CSV Reports
 *
 * FEATURES:
 * - Secure admin session validation
 * - Dashboard KPI metrics
 * - Recruitment pipeline
 * - Date filters
 * - Secure CSV report downloads
 * - Applied dashboard period synchronization
 * - Logout
 *
 * Candidate/Employer modules are not modified.
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
  let exportingReport = false;

  // Last successfully applied dashboard filter.
  let appliedPeriod = {
    period: 'all',
    label: 'All Time'
  };

  const dashboard = document.getElementById(
    'adminDashboard'
  );

  const alertBox = document.getElementById(
    'adminDashboardAlert'
  );

  const logoutButton = document.getElementById(
    'adminLogout'
  );

  const filterButton = document.getElementById(
    'adminApplyFilter'
  );

  const filterForm = document.getElementById(
    'adminDashboardFilterForm'
  );

  const exportForm = document.getElementById(
    'adminExportForm'
  );

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

  const AVAILABLE_REPORTS = Object.freeze([
    'candidates',
    'employers',
    'jobs',
    'applications',
    'enquiries'
  ]);

  // =====================================================
  // UI HELPERS
  // =====================================================

  function setText(id, value) {
    const element = $(id);

    if (element) {
      element.textContent = String(
        value ?? '—'
      );
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
    alertBox.className =
      'profile-alert ' + type;
  }

  function setExportMessage(message) {
    const element = $('adminExportMessage');

    if (element) {
      element.textContent = message;
    }
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

  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================

  function clearSession() {
    try {
      if (CONFIG?.SESSION?.STORAGE_KEY) {
        sessionStorage.removeItem(
          CONFIG.SESSION.STORAGE_KEY
        );
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
      window.location.replace(
        CONFIG.PATHS.LOGIN
      );
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
    ].includes(
      String(response?.code || '')
    );
  }

  function extractAdmin(response) {
    if (response?.admin) {
      return response.admin;
    }

    if (response?.data?.admin) {
      return response.data.admin;
    }

    return null;
  }

  function extractDashboard(response) {
    if (response?.dashboard) {
      return response.dashboard;
    }

    if (response?.data?.dashboard) {
      return response.data.dashboard;
    }

    return null;
  }

  // =====================================================
  // DATE FILTERS
  // =====================================================

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

  function validDateKey(value) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return false;
    }

    const date = new Date(
      value + 'T00:00:00Z'
    );

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }

  function getPeriodPayload() {
    const preset = String(
      $('adminDatePreset')?.value || 'all'
    );

    const today = new Date();
    const todayKey = localDateKey(today);

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
      return {
        period: 'custom',
        startDate: todayKey,
        endDate: todayKey,
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
        endDate: todayKey,
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

      if (
        !validDateKey(startDate) ||
        !validDateKey(endDate)
      ) {
        throw new Error(
          'Please select valid From and To dates.'
        );
      }

      if (startDate > endDate) {
        throw new Error(
          'From Date cannot be after To Date.'
        );
      }

      if (endDate > todayKey) {
        throw new Error(
          'To Date cannot be in the future.'
        );
      }

      return {
        period: 'custom',
        startDate,
        endDate,
        label: `${startDate} to ${endDate}`
      };
    }

    throw new Error(
      'Unsupported reporting period.'
    );
  }

  function updateDateFields() {
    const isCustom =
      $('adminDatePreset')?.value === 'custom';

    const fromWrap = $('adminFromDateWrap');
    const toWrap = $('adminToDateWrap');

    if (fromWrap) {
      fromWrap.hidden = !isCustom;
    }

    if (toWrap) {
      toWrap.hidden = !isCustom;
    }

    const today = localDateKey(
      new Date()
    );

    const fromInput = $('adminFromDate');
    const toInput = $('adminToDate');

    if (fromInput) {
      fromInput.max = today;
    }

    if (toInput) {
      toInput.max = today;
    }
  }

  // =====================================================
  // DASHBOARD METRICS
  // =====================================================

  function clearMetrics() {
    Object.values(METRIC_IDS).forEach(
      function (id) {
        setText(id, '—');
      }
    );

    [
      'adminPipelineApplied',
      'adminPipelineShortlisted',
      'adminPipelineInterview',
      'adminPipelineRejected'
    ].forEach(function (id) {
      setText(id, '—');
    });
  }

  function renderMetrics(metrics) {
    Object.entries(METRIC_IDS).forEach(
      function ([key, id]) {
        setText(
          id,
          formatNumber(metrics[key])
        );
      }
    );

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

  async function loadDashboard(
    periodOptions,
    initial = false
  ) {
    if (
      loadingDashboard ||
      !token
    ) {
      return;
    }

    loadingDashboard = true;

    if (filterButton) {
      filterButton.disabled = true;
      filterButton.textContent = 'Loading...';
    }

    if (initial) {
      showMessage(
        'Loading dashboard metrics...'
      );
    }

    try {
      const response = await API.getDashboard(
        token,
        {
          period: periodOptions.period,
          startDate: periodOptions.startDate || '',
          endDate: periodOptions.endDate || ''
        }
      );

      if (
        !response ||
        response.success !== true
      ) {
        if (isInvalidSession(response)) {
          denyAccess(
            'Your session has expired.',
            true
          );
          return;
        }

        throw new Error(
          response?.message ||
          response?.code ||
          'Unable to load dashboard metrics.'
        );
      }

      const dashboardData =
        extractDashboard(response);

      if (
        !dashboardData ||
        !dashboardData.metrics ||
        typeof dashboardData.metrics !== 'object'
      ) {
        throw new Error(
          'Dashboard metrics response is incomplete.'
        );
      }

      renderMetrics(
        dashboardData.metrics
      );

      // Update only after a successful response.
      appliedPeriod = {
        period: periodOptions.period,
        startDate: periodOptions.startDate || '',
        endDate: periodOptions.endDate || '',
        label: periodOptions.label
      };

      setText(
        'adminSelectedPeriodLabel',
        appliedPeriod.label
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
        filterButton.textContent =
          'Apply Filter';
      }
    }
  }

  // =====================================================
  // CSV REPORT DOWNLOAD
  // =====================================================

  function configureExportForm() {
    const formatSelect =
      $('adminExportFormat');

    const segmentSelect =
      $('adminExportSegment');

    const downloadButton =
      $('adminDownloadReport');

    if (formatSelect) {
      const excelOption =
        formatSelect.querySelector(
          'option[value="xlsx"]'
        );

      if (excelOption) {
        excelOption.disabled = true;
        excelOption.textContent =
          'Excel (.xlsx) — Coming Soon';
      }

      formatSelect.value = 'csv';
    }

    if (segmentSelect) {
      Array.from(
        segmentSelect.options
      ).forEach(function (option) {
        if (
          !AVAILABLE_REPORTS.includes(
            option.value
          )
        ) {
          option.disabled = true;

          if (
            !option.textContent.includes(
              'Coming Soon'
            )
          ) {
            option.textContent +=
              ' — Coming Soon';
          }
        }
      });

      segmentSelect.value =
        'candidates';
    }

    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.removeAttribute(
        'title'
      );
    }

    setExportMessage(
      'CSV reports will be available after administrator verification.'
    );
  }

  function enableExport() {
    const button = $('adminDownloadReport');

    if (
      button &&
      token &&
      API &&
      typeof API.exportData === 'function'
    ) {
      button.disabled = false;

      setExportMessage(
        'Select a report and click Download Report.'
      );
    }
  }

  function disableExport() {
    const button = $('adminDownloadReport');

    if (button) {
      button.disabled = true;
    }
  }

  function downloadCsv(
    filename,
    content
  ) {
    const blob = new Blob(
      [content],
      {
        type: 'text/csv;charset=utf-8'
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    // Never trust server filename as a path.
    link.download = String(
      filename || 'UCPP_Report.csv'
    )
      .split(/[\\/]/)
      .pop()
      .replace(/[^\w.\-]/g, '_');

    link.style.display = 'none';

    document.body.appendChild(link);

    link.click();
    link.remove();

    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  async function handleReportExport(event) {
    event.preventDefault();

    if (
      exportingReport ||
      loadingDashboard ||
      !token
    ) {
      return;
    }

    if (
      !API ||
      typeof API.exportData !== 'function'
    ) {
      setExportMessage(
        'Export API unavailable. Refresh the page.'
      );
      return;
    }

    const segment = String(
      $('adminExportSegment')?.value || ''
    ).trim().toLowerCase();

    const format = String(
      $('adminExportFormat')?.value || 'csv'
    ).trim().toLowerCase();

    const exportPeriod = String(
      $('adminExportPeriod')?.value ||
      'selected'
    );

    if (
      !AVAILABLE_REPORTS.includes(segment)
    ) {
      setExportMessage(
        'Please select an available report.'
      );
      return;
    }

    if (format !== 'csv') {
      setExportMessage(
        'Only CSV export is currently supported.'
      );
      return;
    }

    const periodOptions =
      exportPeriod === 'all'
        ? {
            period: 'all',
            startDate: '',
            endDate: ''
          }
        : { ...appliedPeriod };

    const button =
      $('adminDownloadReport');

    exportingReport = true;

    if (button) {
      button.disabled = true;
      button.textContent =
        'Preparing Report...';
    }

    setExportMessage(
      'Generating report. Please wait...'
    );

    try {
      const response =
        await API.exportData(
          token,
          {
            segment,
            format: 'csv',
            period: periodOptions.period,
            startDate:
              periodOptions.startDate || '',
            endDate:
              periodOptions.endDate || ''
          }
        );

      if (
        !response ||
        response.success !== true
      ) {
        if (isInvalidSession(response)) {
          disableExport();

          denyAccess(
            'Your session has expired.',
            true
          );

          return;
        }

        throw new Error(
          response?.message ||
          response?.code ||
          'Report generation failed.'
        );
      }

      if (
        typeof response.content !==
          'string' ||
        typeof response.filename !==
          'string' ||
        !response.filename
          .toLowerCase()
          .endsWith('.csv')
      ) {
        throw new Error(
          'Report response is incomplete.'
        );
      }

      downloadCsv(
        response.filename,
        response.content
      );

      setExportMessage(
        'Report download started. ' +
        formatNumber(response.rowCount) +
        ' records exported.'
      );

    } catch (error) {
      console.error(
        '[UCPP ADMIN] Export error:',
        error
      );

      setExportMessage(
        error?.message ||
        'Unable to download report.'
      );

    } finally {
      exportingReport = false;

      if (button) {
        button.textContent =
          'Download Report';

        button.disabled =
          !token ||
          loggingOut;
      }
    }
  }

  // =====================================================
  // ADMIN AUTHORIZATION
  // =====================================================

  async function verifyAccess() {
    hideDashboard();
    disableExport();
    clearMetrics();

    showMessage(
      'Verifying administrator session...'
    );

    if (
      !CONFIG ||
      !API ||
      typeof API.validateSession !==
        'function' ||
      typeof API.getDashboard !==
        'function'
    ) {
      showMessage(
        'Admin configuration or API unavailable.'
      );
      return;
    }

    const savedToken =
      readSession();

    if (!savedToken) {
      denyAccess(
        'Please sign in.',
        true
      );
      return;
    }

    try {
      const validation =
        await API.validateSession(
          savedToken
        );

      if (
        !validation ||
        validation.success !== true
      ) {
        if (
          isInvalidSession(validation)
        ) {
          denyAccess(
            'Your session has expired.',
            true
          );
        } else {
          showMessage(
            validation?.message ||
            'Unable to verify your session.'
          );
        }

        return;
      }

      const verifiedAdmin =
        extractAdmin(validation);

      if (!verifiedAdmin) {
        showMessage(
          'Admin identity response is incomplete.'
        );
        return;
      }

      token = savedToken;
      admin = verifiedAdmin;

      await loadDashboard(
        {
          period: 'all',
          label: 'All Time'
        },
        true
      );

      if (
        dashboard &&
        !dashboard.hidden
      ) {
        enableExport();

        document.dispatchEvent(
          new CustomEvent(
            'ucpp:admin-authorized',
            {
              detail: {
                admin: {
                  name: String(
                    admin.name || ''
                  ),
                  role: String(
                    admin.role || ''
                  )
                }
              }
            }
          )
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

  // =====================================================
  // LOGOUT
  // =====================================================

  async function logout() {
    if (loggingOut) return;

    loggingOut = true;

    const activeToken =
      token || readSession();

    disableExport();
    hideDashboard();

    showMessage('Signing out...');

    clearSession();

    if (
      activeToken &&
      API
    ) {
      try {
        await API.logout(
          activeToken
        );
      } catch (_) {}
    }

    redirectLogin();
  }

  // =====================================================
  // EVENTS
  // =====================================================

  function initializeEvents() {
    $('adminDatePreset')?.addEventListener(
      'change',
      updateDateFields
    );

    filterForm?.addEventListener(
      'submit',
      async function (event) {
        event.preventDefault();

        if (
          !token ||
          loadingDashboard
        ) {
          return;
        }

        try {
          const periodOptions =
            getPeriodPayload();

          await loadDashboard(
            periodOptions
          );

        } catch (error) {
          showAlert(
            error.message
          );
        }
      }
    );

    exportForm?.addEventListener(
      'submit',
      handleReportExport
    );

    if (logoutButton) {
      logoutButton.addEventListener(
        'click',
        logout
      );
    }

    configureExportForm();
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  function initialize() {
    hideDashboard();
    clearMetrics();

    updateDateFields();
    initializeEvents();
    verifyAccess();
  }

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

  window.UCPP_ADMIN_DASHBOARD =
    Object.freeze({
      validateAccess: verifyAccess,
      logout: logout,
      isAuthenticated: function () {
        return Boolean(
          token && admin
        );
      }
    });

})(window, document);

