
/**
 * =========================================================
 * UCPP V2 — Admin Dashboard Controller
 * File: js/admin/dashboard.js
 * Version: 8.0
 *
 * FEATURES:
 * - Secure admin session validation
 * - Live dashboard metrics
 * - Recruitment pipeline
 * - Dashboard reporting-period filters
 * - Independent export duration filters
 * - Custom date range selection
 * - Secure CSV downloads
 * - Genuine Excel (.xlsx) downloads
 * - Session-aware logout
 *
 * Existing Candidate/Employer modules unaffected.
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
  let authorized = false;

  let appliedPeriod = {
    period: 'all',
    startDate: '',
    endDate: '',
    label: 'All Time'
  };

  const $ = id => document.getElementById(id);

  const dashboard = $('adminDashboard');
  const alertBox = $('adminDashboardAlert');
  const logoutButton = $('adminLogout');
  const filterButton = $('adminApplyFilter');
  const filterForm = $('adminDashboardFilterForm');
  const exportForm = $('adminExportForm');
  const exportButton = $('adminDownloadReport');

  const AVAILABLE_REPORTS = Object.freeze([
    'candidates',
    'employers',
    'jobs',
    'applications',
    'enquiries'
  ]);

  const AVAILABLE_FORMATS = Object.freeze([
    'xlsx',
    'csv'
  ]);

  const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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

  // =====================================================
  // COMMON UI HELPERS
  // =====================================================

  function setText(id, value) {
    const element = $(id);

    if (element) {
      element.textContent = String(value ?? '—');
    }
  }

  function hideDashboard() {
    if (!dashboard) return;

    dashboard.hidden = true;
    dashboard.style.display = 'none';
  }

  function showDashboard() {
    if (!dashboard) return;

    dashboard.hidden = false;
    dashboard.style.removeProperty('display');
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
    $('adminAccessMessage')?.remove();
  }

  function showAlert(message, type = 'error') {
    if (!alertBox) return;

    alertBox.textContent = message;
    alertBox.hidden = !message;
    alertBox.className = 'profile-alert ' + type;
  }

  function setExportMessage(message) {
    setText('adminExportMessage', message);
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

    return Number.isFinite(number)
      ? number.toLocaleString('en-IN')
      : '—';
  }

  function updateExportButton() {
    if (!exportButton) return;

    exportButton.disabled =
      !authorized ||
      !token ||
      loggingOut ||
      exportingReport ||
      typeof API?.exportData !== 'function';
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
    authorized = false;
  }

  function readSession() {
    try {
      const key = CONFIG?.SESSION?.STORAGE_KEY;

      if (!key) return null;

      const raw = sessionStorage.getItem(key);

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
    authorized = false;
    hideDashboard();
    updateExportButton();
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
    return response?.admin ||
      response?.data?.admin ||
      null;
  }

  function extractDashboard(response) {
    return response?.dashboard ||
      response?.data?.dashboard ||
      null;
  }

  // =====================================================
  // DATE HELPERS
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
      typeof value !== 'string' ||
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

  function buildPeriod(preset, startDate, endDate) {
    const today = new Date();
    const todayKey = localDateKey(today);

    switch (preset) {
      case 'all':
        return {
          period: 'all',
          startDate: '',
          endDate: '',
          label: 'All Time'
        };

      case 'month':
        return {
          period: 'this_month',
          startDate: '',
          endDate: '',
          label: 'This Month'
        };

      case 'lastmonth':
        return {
          period: 'last_month',
          startDate: '',
          endDate: '',
          label: 'Last Month'
        };

      case 'today':
        return {
          period: 'custom',
          startDate: todayKey,
          endDate: todayKey,
          label: 'Today'
        };

      case '7days': {
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

      case 'custom': {
        const start = String(
          startDate || ''
        ).trim();

        const end = String(
          endDate || ''
        ).trim();

        if (
          !validDateKey(start) ||
          !validDateKey(end)
        ) {
          throw new Error(
            'Please select valid From Date and To Date.'
          );
        }

        if (start > end) {
          throw new Error(
            'From Date cannot be after To Date.'
          );
        }

        if (end > todayKey) {
          throw new Error(
            'To Date cannot be in the future.'
          );
        }

        return {
          period: 'custom',
          startDate: start,
          endDate: end,
          label: `${start} to ${end}`
        };
      }

      default:
        throw new Error(
          'Unsupported reporting period.'
        );
    }
  }

  function getDashboardPeriod() {
    return buildPeriod(
      $('adminDatePreset')?.value || 'all',
      $('adminFromDate')?.value,
      $('adminToDate')?.value
    );
  }

  function updateDateFields() {
    const custom =
      $('adminDatePreset')?.value === 'custom';

    const fromWrap = $('adminFromDateWrap');
    const toWrap = $('adminToDateWrap');

    if (fromWrap) fromWrap.hidden = !custom;
    if (toWrap) toWrap.hidden = !custom;

    const today = localDateKey(new Date());

    const fromInput = $('adminFromDate');
    const toInput = $('adminToDate');

    if (fromInput) {
      fromInput.max = today;
      fromInput.required = custom;
      fromInput.disabled = !custom;
    }

    if (toInput) {
      toInput.max = today;
      toInput.required = custom;
      toInput.disabled = !custom;
    }
  }

  // =====================================================
  // INDEPENDENT EXPORT DATE FILTERS
  // =====================================================

  function updateExportDateFields() {
    const custom =
      $('adminExportPeriod')?.value === 'custom';

    const fromWrap = $('adminExportFromDateWrap');
    const toWrap = $('adminExportToDateWrap');

    if (fromWrap) fromWrap.hidden = !custom;
    if (toWrap) toWrap.hidden = !custom;

    const today = localDateKey(new Date());

    const fromInput = $('adminExportFromDate');
    const toInput = $('adminExportToDate');

    if (fromInput) {
      fromInput.max = today;
      fromInput.required = custom;
      fromInput.disabled = !custom;
    }

    if (toInput) {
      toInput.max = today;
      toInput.required = custom;
      toInput.disabled = !custom;
    }

    if (custom) {
      setExportMessage(
        'Select From Date and To Date, then download your report.'
      );
    } else {
      setExportMessage(
        'Select a report, duration and format to download.'
      );
    }
  }

  function getExportPeriod() {
    const preset = String(
      $('adminExportPeriod')?.value || 'all'
    );

    if (preset === 'selected') {
      return { ...appliedPeriod };
    }

    return buildPeriod(
      preset,
      $('adminExportFromDate')?.value,
      $('adminExportToDate')?.value
    );
  }

  // =====================================================
  // DASHBOARD METRICS
  // =====================================================

  function clearMetrics() {
    Object.values(METRIC_IDS).forEach(
      id => setText(id, '—')
    );

    [
      'adminPipelineApplied',
      'adminPipelineShortlisted',
      'adminPipelineInterview',
      'adminPipelineRejected'
    ].forEach(id => setText(id, '—'));
  }

  function renderMetrics(metrics) {
    Object.entries(METRIC_IDS).forEach(
      ([key, id]) => {
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
    if (loadingDashboard || !token) return false;

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
          startDate: periodOptions.startDate || '',
          endDate: periodOptions.endDate || ''
        }
      );

      if (!response || response.success !== true) {
        if (isInvalidSession(response)) {
          denyAccess(
            'Your session has expired.',
            true
          );
          return false;
        }

        throw new Error(
          response?.message ||
          response?.code ||
          'Unable to load dashboard metrics.'
        );
      }

      const data = extractDashboard(response);

      if (!data || !data.metrics) {
        throw new Error(
          'Dashboard metrics response is incomplete.'
        );
      }

      renderMetrics(data.metrics);

      appliedPeriod = {
        period: periodOptions.period,
        startDate: periodOptions.startDate || '',
        endDate: periodOptions.endDate || '',
        label: periodOptions.label || 'All Time'
      };

      setText(
        'adminSelectedPeriodLabel',
        appliedPeriod.label
      );

      removeMessage();
      showDashboard();
      showAlert('');

      return true;

    } catch (error) {
      console.error(
        '[UCPP ADMIN] Dashboard error:',
        error
      );

      if (initial && authorized) {
        removeMessage();
        showDashboard();
      }

      showAlert(
        error?.message ||
        'Unable to load dashboard metrics.'
      );

      return false;

    } finally {
      loadingDashboard = false;

      if (filterButton) {
        filterButton.disabled = !authorized;
        filterButton.textContent = 'Apply Filter';
      }
    }
  }

  // =====================================================
  // EXPORT CONFIGURATION
  // =====================================================

  function configureExportForm() {
    const segmentSelect = $('adminExportSegment');
    const formatSelect = $('adminExportFormat');

    if (segmentSelect) {
      Array.from(segmentSelect.options).forEach(
        option => {
          const available =
            AVAILABLE_REPORTS.includes(option.value);

          option.disabled = !available;

          if (
            !available &&
            !option.textContent.includes('Coming Soon')
          ) {
            option.textContent += ' — Coming Soon';
          }
        }
      );

      if (
        !AVAILABLE_REPORTS.includes(
          segmentSelect.value
        )
      ) {
        segmentSelect.value = 'candidates';
      }
    }

    if (formatSelect) {
      Array.from(formatSelect.options).forEach(
        option => {
          option.disabled =
            !AVAILABLE_FORMATS.includes(option.value);
        }
      );

      // Enable genuine Excel download.
      const excelOption = formatSelect.querySelector(
        'option[value="xlsx"]'
      );

      if (excelOption) {
        excelOption.disabled = false;
        excelOption.textContent = 'Excel (.xlsx)';
      }

      // Default to Excel.
      formatSelect.value = 'xlsx';
    }

    updateExportButton();
    updateExportDateFields();
  }

  // =====================================================
  // FILE DOWNLOAD HELPERS
  // =====================================================

  function sanitizeFilename(filename, extension) {
    const safeName = String(
      filename || `UCPP_Report.${extension}`
    )
      .split(/[\\/]/)
      .pop()
      .replace(/[^\w.\-]/g, '_');

    if (
      !safeName.toLowerCase().endsWith(
        '.' + extension
      )
    ) {
      throw new Error(
        'Unexpected report file format.'
      );
    }

    return safeName;
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  }

  function downloadCsv(filename, content) {
    if (typeof content !== 'string') {
      throw new Error(
        'CSV report content is invalid.'
      );
    }

    const safeName = sanitizeFilename(
      filename,
      'csv'
    );

    const blob = new Blob(
      [content],
      {
        type: 'text/csv;charset=utf-8'
      }
    );

    downloadBlob(safeName, blob);
  }

  function base64ToBytes(base64) {
    if (
      typeof base64 !== 'string' ||
      !base64.trim()
    ) {
      throw new Error(
        'Excel report content is missing.'
      );
    }

    const clean = base64.replace(/\s/g, '');

    if (
      clean.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(clean)
    ) {
      throw new Error(
        'Invalid Excel report encoding.'
      );
    }

    let binary;

    try {
      binary = window.atob(clean);
    } catch (_) {
      throw new Error(
        'Unable to decode Excel report.'
      );
    }

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // XLSX is a ZIP-based format.
    // Check its standard ZIP signature.
    if (
      bytes.length < 4 ||
      bytes[0] !== 0x50 ||
      bytes[1] !== 0x4b ||
      !(
        (bytes[2] === 0x03 && bytes[3] === 0x04) ||
        (bytes[2] === 0x05 && bytes[3] === 0x06)
      )
    ) {
      throw new Error(
        'Server did not return a valid Excel workbook.'
      );
    }

    return bytes;
  }

  function downloadXlsx(filename, content, encoding) {
    if (
      String(encoding || '').toLowerCase() !==
      'base64'
    ) {
      throw new Error(
        'Unexpected Excel report encoding.'
      );
    }

    const safeName = sanitizeFilename(
      filename,
      'xlsx'
    );

    const bytes = base64ToBytes(content);

    const blob = new Blob(
      [bytes],
      {
        type: XLSX_MIME
      }
    );

    downloadBlob(safeName, blob);
  }

  // =====================================================
  // SECURE REPORT EXPORT
  // =====================================================

  async function handleReportExport(event) {
    event.preventDefault();

    if (
      exportingReport ||
      !authorized ||
      !token ||
      loggingOut
    ) {
      return;
    }

    if (
      !API ||
      typeof API.exportData !== 'function'
    ) {
      setExportMessage(
        'Export API unavailable. Please refresh.'
      );
      return;
    }

    const segment = String(
      $('adminExportSegment')?.value || ''
    ).trim().toLowerCase();

    const format = String(
      $('adminExportFormat')?.value || 'xlsx'
    ).trim().toLowerCase();

    if (!AVAILABLE_REPORTS.includes(segment)) {
      setExportMessage(
        'Please select an available report.'
      );
      return;
    }

    if (!AVAILABLE_FORMATS.includes(format)) {
      setExportMessage(
        'Please select Excel or CSV format.'
      );
      return;
    }

    let periodOptions;

    try {
      periodOptions = getExportPeriod();
    } catch (error) {
      setExportMessage(
        error?.message ||
        'Invalid reporting period.'
      );
      return;
    }

    exportingReport = true;
    updateExportButton();

    if (exportButton) {
      exportButton.textContent =
        'Preparing Report...';
    }

    setExportMessage(
      format === 'xlsx'
        ? 'Generating Excel workbook. Please wait...'
        : 'Generating CSV report. Please wait...'
    );

    try {
      const response = await API.exportData(
        token,
        {
          segment,
          format,
          period: periodOptions.period,
          startDate: periodOptions.startDate || '',
          endDate: periodOptions.endDate || ''
        }
      );

      if (!response || response.success !== true) {
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
          'Report generation failed.'
        );
      }

      if (
        typeof response.filename !== 'string' ||
        typeof response.content !== 'string'
      ) {
        throw new Error(
          'Report response is incomplete.'
        );
      }

      if (format === 'xlsx') {
        downloadXlsx(
          response.filename,
          response.content,
          response.encoding
        );
      } else {
        downloadCsv(
          response.filename,
          response.content
        );
      }

      setExportMessage(
        'Report download started successfully. ' +
        formatNumber(response.rowCount) +
        ' records exported. ' +
        'Format: ' +
        format.toUpperCase() +
        '. Duration: ' +
        periodOptions.label
      );

    } catch (error) {
      console.error(
        '[UCPP ADMIN] Report export error:',
        error
      );

      setExportMessage(
        error?.message ||
        'Unable to download report.'
      );

    } finally {
      exportingReport = false;

      if (exportButton) {
        exportButton.textContent =
          'Download Report';
      }

      updateExportButton();
    }
  }

  // =====================================================
  // AUTHORIZATION
  // =====================================================

  async function verifyAccess() {
    authorized = false;
    hideDashboard();
    updateExportButton();
    clearMetrics();

    showMessage(
      'Verifying administrator session...'
    );

    if (
      !CONFIG ||
      !API ||
      typeof API.validateSession !== 'function' ||
      typeof API.getDashboard !== 'function'
    ) {
      showMessage(
        'Admin configuration or API unavailable.'
      );
      return;
    }

    const savedToken = readSession();

    if (!savedToken) {
      denyAccess(
        'Please sign in.',
        true
      );
      return;
    }

    try {
      const validation =
        await API.validateSession(savedToken);

      if (
        !validation ||
        validation.success !== true
      ) {
        if (isInvalidSession(validation)) {
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

      const verifiedAdmin = extractAdmin(
        validation
      );

      if (!verifiedAdmin) {
        showMessage(
          'Admin identity response is incomplete.'
        );
        return;
      }

      token = savedToken;
      admin = verifiedAdmin;
      authorized = true;

      const loaded = await loadDashboard(
        {
          period: 'all',
          startDate: '',
          endDate: '',
          label: 'All Time'
        },
        true
      );

      if (!authorized) return;

      if (!loaded) {
        // Session is valid, but metrics could not load.
        // Keep the authorized dashboard available.
        removeMessage();
        showDashboard();
      }

      updateExportButton();

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

    } catch (error) {
      console.error(
        '[UCPP ADMIN] Authorization error:',
        error
      );

      authorized = false;
      updateExportButton();
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

    const activeToken = token || readSession();

    authorized = false;
    updateExportButton();
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

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  function initializeEvents() {
    $('adminDatePreset')?.addEventListener(
      'change',
      updateDateFields
    );

    $('adminExportPeriod')?.addEventListener(
      'change',
      updateExportDateFields
    );

    filterForm?.addEventListener(
      'submit',
      async event => {
        event.preventDefault();

        if (
          !token ||
          !authorized ||
          loadingDashboard
        ) {
          return;
        }

        try {
          const options = getDashboardPeriod();
          await loadDashboard(options);
        } catch (error) {
          showAlert(
            error?.message ||
            'Invalid reporting period.'
          );
        }
      }
    );

    exportForm?.addEventListener(
      'submit',
      handleReportExport
    );

    logoutButton?.addEventListener(
      'click',
      logout
    );

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
      return Boolean(
        authorized &&
        token &&
        admin
      );
    }
  });

})(window, document);
