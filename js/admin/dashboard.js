
/* =====================================================
   UCPP V2 — ADMIN DASHBOARD
   File: js/admin/dashboard.js
   Version: 1.0
   Read-only frontend foundation
===================================================== */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const IDS = {
    form: "adminDashboardFilterForm",
    preset: "adminDatePreset",
    fromWrap: "adminFromDateWrap",
    toWrap: "adminToDateWrap",
    from: "adminFromDate",
    to: "adminToDate",
    apply: "adminApplyFilter",
    alert: "adminDashboardAlert",
    periodLabel: "adminSelectedPeriodLabel",
    exportForm: "adminExportForm",
    exportButton: "adminDownloadReport",
    exportMessage: "adminExportMessage"
  };

  const METRICS = [
    "adminCandidatesCount",
    "adminEmployersCount",
    "adminJobsCount",
    "adminApplicationsCount",
    "adminShortlistedCount",
    "adminInterviewsCount",
    "adminRejectedCount",
    "adminPlacementsCount",
    "adminPipelineApplied",
    "adminPipelineShortlisted",
    "adminPipelineInterview",
    "adminPipelineRejected"
  ];

  const state = {
    period: null,
    loading: false,
    dataAvailable: false
  };

  function localDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getToday() {
    return new Date();
  }

  function getDateRange() {
    const preset = $(IDS.preset).value;
    const today = getToday();

    let startDate = null;
    let endDate = null;

    if (preset === "today") {
      startDate = localDate(today);
      endDate = startDate;
    }

    if (preset === "7days") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);

      startDate = localDate(start);
      endDate = localDate(today);
    }

    if (preset === "month") {
      startDate = localDate(
        new Date(today.getFullYear(), today.getMonth(), 1)
      );
      endDate = localDate(today);
    }

    if (preset === "lastmonth") {
      startDate = localDate(
        new Date(today.getFullYear(), today.getMonth() - 1, 1)
      );

      endDate = localDate(
        new Date(today.getFullYear(), today.getMonth(), 0)
      );
    }

    if (preset === "custom") {
      startDate = $(IDS.from).value;
      endDate = $(IDS.to).value;

      if (!startDate || !endDate) {
        throw new Error("Please select both From Date and To Date.");
      }

      if (startDate > endDate) {
        throw new Error("From Date cannot be later than To Date.");
      }

      if (endDate > localDate(today)) {
        throw new Error("To Date cannot be in the future.");
      }
    }

    return {
      preset,
      startDate,
      endDate
    };
  }

  function toggleCustomDates() {
    const custom = $(IDS.preset).value === "custom";

    $(IDS.fromWrap).hidden = !custom;
    $(IDS.toWrap).hidden = !custom;

    $(IDS.from).disabled = !custom;
    $(IDS.to).disabled = !custom;
  }

  function clearAlert() {
    const alert = $(IDS.alert);
    alert.hidden = true;
    alert.textContent = "";
  }

  function showAlert(message) {
    const alert = $(IDS.alert);
    alert.textContent = message;
    alert.hidden = false;
  }

  function setLoading(loading) {
    state.loading = loading;

    const button = $(IDS.apply);
    button.disabled = loading;
    button.textContent = loading
      ? "Loading..."
      : "Apply Filter";
  }

  function resetMetrics() {
    METRICS.forEach((id) => {
      const element = $(id);

      if (element) {
        element.textContent = "—";
      }
    });

    state.dataAvailable = false;
    $(IDS.exportButton).disabled = true;
  }

  function updatePeriodLabel(range) {
    const label = $(IDS.periodLabel);

    if (range.preset === "all") {
      label.textContent = "All-time overview";
      return;
    }

    label.textContent =
      `${range.startDate} to ${range.endDate}`;
  }

  function setExportUnavailable() {
    $(IDS.exportButton).disabled = true;

    $(IDS.exportMessage).textContent =
      "Secure Excel/CSV downloads will be available " +
      "after Admin API integration.";
  }

  /*
   * Backend contract — planned, not implemented yet.
   *
   * Action: getAdminDashboard
   *
   * Request:
   * {
   *   sessionToken: "...",
   *   startDate: "YYYY-MM-DD" | null,
   *   endDate: "YYYY-MM-DD" | null
   * }
   *
   * Authentication and role checks must happen
   * inside Google Apps Script.
   *
   * Never trust frontend-only authorization.
   */

  async function loadDashboard() {
    clearAlert();

    let range;

    try {
      range = getDateRange();
    } catch (error) {
      showAlert(error.message);
      return;
    }

    state.period = range;
    updatePeriodLabel(range);
    resetMetrics();
    setExportUnavailable();

    setLoading(true);

    try {
      /*
       * Admin backend is not connected yet.
       *
       * Do not call an unimplemented API action.
       * Do not show fabricated statistics.
       *
       * Next backend development step will replace
       * this placeholder with authenticated,
       * read-only dashboard retrieval.
       */

      showAlert(
        "Dashboard layout is ready. Live statistics " +
        "will appear after secure Admin API integration."
      );

    } catch (error) {
      showAlert(
        error.message || "Unable to load dashboard."
      );

    } finally {
      setLoading(false);
    }
  }

  function handleExport(event) {
    event.preventDefault();

    setExportUnavailable();
  }

  function initialize() {
    const required = [
      IDS.form,
      IDS.preset,
      IDS.fromWrap,
      IDS.toWrap,
      IDS.from,
      IDS.to,
      IDS.apply,
      IDS.alert,
      IDS.periodLabel,
      IDS.exportForm,
      IDS.exportButton,
      IDS.exportMessage
    ];

    const missing = required.filter((id) => !$(id));

    if (missing.length) {
      console.error(
        "[UCPP Admin Dashboard] Missing elements:",
        missing
      );
      return;
    }

    const today = localDate(getToday());

    $(IDS.from).max = today;
    $(IDS.to).max = today;

    $(IDS.preset).addEventListener(
      "change",
      toggleCustomDates
    );

    $(IDS.form).addEventListener(
      "submit",
      function (event) {
        event.preventDefault();
        loadDashboard();
      }
    );

    $(IDS.exportForm).addEventListener(
      "submit",
      handleExport
    );

    toggleCustomDates();
    resetMetrics();
    setExportUnavailable();

    loadDashboard();

    console.info(
      "[UCPP Admin Dashboard] Frontend initialized."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );
  } else {
    initialize();
  }

})();
