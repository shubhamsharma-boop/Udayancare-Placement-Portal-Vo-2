
'use strict';

/*
 * =========================================================
 * UCPP V2 — Employer Manage Jobs v1.0
 *
 * READ-ONLY MODE
 * - Employer session validation
 * - Load employer jobs
 * - Statistics
 * - Search and status filter
 * - Sorting and pagination
 * - No backend write operations
 * =========================================================
 */

(function () {

  const API = window.UCPP_API;
  const SESSION = window.UCPP_SESSION_MANAGER;

  const PAGE_SIZE = 10;

  const state = {
    jobs: [],
    filteredJobs: [],
    currentPage: 1,
    loading: false,
    sessionToken: ''
  };

  const $ = (id) => document.getElementById(id);

  function setText(id, value) {
    const element = $(id);

    if (element) {
      element.textContent = String(value ?? '');
    }
  }

  function show(id, visible) {
    const element = $(id);

    if (element) {
      element.hidden = !visible;
    }
  }

  function showAlert(message, type = 'error') {
    const element = $('manageJobsAlert');

    if (!element) return;

    element.textContent = message;
    element.className = 'profile-alert ' + type;
    element.hidden = false;
  }

  function hideAlert() {
    const element = $('manageJobsAlert');

    if (element) {
      element.textContent = '';
      element.hidden = true;
    }
  }

  function isInvalidSession(result) {
    return [
      'INVALID_SESSION',
      'NO_SESSION',
      'SESSION_EXPIRED',
      'SESSION_NOT_FOUND',
      'UNAUTHORIZED'
    ].includes(String(result?.code || ''));
  }

  function formatDate(value) {
    if (!value) return '—';

    const raw = String(value).trim();

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      const date = new Date(year, month - 1, day);

      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    }

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function dateSortValue(value) {
    if (!value) return 0;

    const raw = String(value).trim();
    const timestamp = Date.parse(raw);

    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function normalizeStatus(value) {
    return String(value || '').trim().toLowerCase();
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = String(text);
    }

    return element;
  }

  /*
   * STATISTICS
   */

  function updateStatistics() {

    const jobs = state.jobs;

    const active = jobs.filter(
      (job) => normalizeStatus(job.Job_Status) === 'active'
    ).length;

    const closed = jobs.filter(
      (job) => normalizeStatus(job.Job_Status) === 'closed'
    ).length;

    const vacancies = jobs.reduce((total, job) => {
      const count = Number(job.Vacancies);

      return total + (
        Number.isFinite(count) && count > 0
          ? count
          : 0
      );
    }, 0);

    setText('totalJobsCount', jobs.length);
    setText('activeJobsCount', active);
    setText('closedJobsCount', closed);
    setText('totalVacanciesCount', vacancies);

  }

  /*
   * FILTER AND SORT
   */

  function applyFilters(resetPage = true) {

    const search = String(
      $('jobSearch')?.value || ''
    ).trim().toLowerCase();

    const statusFilter = String(
      $('jobStatusFilter')?.value || 'all'
    );

    const sortBy = String(
      $('jobSort')?.value || 'newest'
    );

    let jobs = state.jobs.filter((job) => {

      const searchable = [
        job.Job_ID,
        job.Job_Title,
        job.Job_Category,
        job.City,
        job.District,
        job.State
      ]
        .map((value) => String(value ?? ''))
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !search || searchable.includes(search);

      const matchesStatus =
        statusFilter === 'all' ||
        normalizeStatus(job.Job_Status) ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;

    });

    jobs.sort((a, b) => {

      if (sortBy === 'oldest') {
        return dateSortValue(a.Posted_Date) -
          dateSortValue(b.Posted_Date);
      }

      if (sortBy === 'deadline') {
        return dateSortValue(a.Application_Last_Date) -
          dateSortValue(b.Application_Last_Date);
      }

      if (sortBy === 'title') {
        return String(a.Job_Title || '').localeCompare(
          String(b.Job_Title || ''),
          'en',
          { sensitivity: 'base' }
        );
      }

      return dateSortValue(b.Posted_Date) -
        dateSortValue(a.Posted_Date);

    });

    state.filteredJobs = jobs;

    if (resetPage) {
      state.currentPage = 1;
    }

    const totalPages = Math.max(
      1,
      Math.ceil(jobs.length / PAGE_SIZE)
    );

    state.currentPage = Math.min(
      state.currentPage,
      totalPages
    );

    renderJobs();

  }

  /*
   * JOB TABLE
   */

  function createJobRow(job) {

    const row = document.createElement('tr');

    // Job Details
    const detailsCell = document.createElement('td');

    detailsCell.appendChild(
      createElement(
        'span',
        'manage-job-title',
        job.Job_Title || 'Untitled Job'
      )
    );

    detailsCell.appendChild(
      createElement(
        'span',
        'manage-job-id',
        job.Job_ID || '—'
      )
    );

    detailsCell.appendChild(
      createElement(
        'span',
        'manage-job-category',
        job.Job_Category || '—'
      )
    );

    row.appendChild(detailsCell);

    // Location
    const location = [
      job.City,
      job.State
    ].filter(Boolean).join(', ') || '—';

    const locationCell = document.createElement('td');

    locationCell.appendChild(
      createElement(
        'span',
        'manage-job-location',
        location
      )
    );

    row.appendChild(locationCell);

    // Vacancies
    const vacanciesCell = document.createElement('td');

    vacanciesCell.appendChild(
      createElement(
        'span',
        'manage-job-vacancies',
        job.Vacancies ?? '—'
      )
    );

    row.appendChild(vacanciesCell);

    // Posted Date
    row.appendChild(
      createElement(
        'td',
        '',
        formatDate(job.Posted_Date)
      )
    );

    // Application Last Date
    row.appendChild(
      createElement(
        'td',
        '',
        formatDate(job.Application_Last_Date)
      )
    );

    // Status
    const statusCell = document.createElement('td');

    const status = String(
      job.Job_Status || 'Unknown'
    ).trim();

    const normalized = normalizeStatus(status);

    const statusBadge = createElement(
      'span',
      'manage-job-status',
      status
    );

    if (normalized === 'active') {
      statusBadge.classList.add('active');
    } else if (normalized === 'closed') {
      statusBadge.classList.add('closed');
    }

    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    // Actions — disabled in preparation mode
    const actionsCell = document.createElement('td');

    const actions = createElement(
      'div',
      'manage-job-actions'
    );

    const editButton = createElement(
      'button',
      'manage-job-action',
      'Edit'
    );

    editButton.type = 'button';
    editButton.disabled = true;
    editButton.title = 'Job editing is not enabled yet';

    const statusButton = createElement(
      'button',
      'manage-job-action danger',
      normalized === 'active' ? 'Close' : 'Reopen'
    );

    statusButton.type = 'button';
    statusButton.disabled = true;
    statusButton.title =
      'Job status changes are not enabled yet';

    actions.appendChild(editButton);
    actions.appendChild(statusButton);

    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);

    return row;

  }

  function renderJobs() {

    const tbody = $('manageJobsTableBody');

    if (!tbody) return;

    tbody.replaceChildren();

    const jobs = state.filteredJobs;

    if (jobs.length === 0) {

      show('manageJobsTableWrap', false);
      show('manageJobsPagination', false);
      show('manageJobsEmpty', true);

      if (state.jobs.length === 0) {

        setText(
          'manageJobsEmptyTitle',
          'No jobs posted yet'
        );

        setText(
          'manageJobsEmptyDescription',
          'Your job postings will appear here once jobs are published.'
        );

        show('manageJobsEmptyAction', true);

      } else {

        setText(
          'manageJobsEmptyTitle',
          'No matching jobs found'
        );

        setText(
          'manageJobsEmptyDescription',
          'Try changing your search term or status filter.'
        );

        show('manageJobsEmptyAction', false);

      }

      setText('jobsResultCount', '0 jobs found');

      return;

    }

    const start = (state.currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    const pageJobs = jobs.slice(start, end);

    const fragment = document.createDocumentFragment();

    pageJobs.forEach((job) => {
      fragment.appendChild(createJobRow(job));
    });

    tbody.appendChild(fragment);

    show('manageJobsEmpty', false);
    show('manageJobsTableWrap', true);

    const totalPages = Math.ceil(jobs.length / PAGE_SIZE);

    show('manageJobsPagination', totalPages > 1);

    setText(
      'jobsPageInfo',
      'Page ' + state.currentPage + ' of ' + totalPages
    );

    $('jobsPreviousButton').disabled =
      state.currentPage <= 1;

    $('jobsNextButton').disabled =
      state.currentPage >= totalPages;

    setText(
      'jobsResultCount',
      'Showing ' +
        (start + 1) +
        '–' +
        Math.min(end, jobs.length) +
        ' of ' +
        jobs.length +
        ' jobs'
    );

  }

  /*
   * LOADING STATE
   */

  function setLoading(loading) {

    state.loading = loading;

    show('manageJobsSkeleton', loading);

    if (loading) {
      show('manageJobsTableWrap', false);
      show('manageJobsEmpty', false);
      show('manageJobsPagination', false);

      setText('jobsResultCount', 'Loading jobs...');
    }

    const refreshButton = $('refreshJobsButton');

    if (refreshButton) {
      refreshButton.disabled = loading;
      refreshButton.textContent =
        loading ? 'Loading...' : 'Refresh';
    }

  }

  /*
   * LOAD JOBS
   * Read-only backend operation
   */

  async function loadJobs() {

    if (state.loading) return;

    hideAlert();
    setLoading(true);

    try {

      const result = await API.post(
        'getEmployerJobs',
        {
          sessionToken: state.sessionToken
        }
      );

      if (!result || result.success !== true) {

        if (isInvalidSession(result)) {
          window.location.replace('login.html');
          return;
        }

        throw new Error(
          result?.message || 'Unable to load employer jobs.'
        );

      }

      if (
        !result.data ||
        !Array.isArray(result.data.jobs)
      ) {
        throw new Error(
          'Invalid job list received from the server.'
        );
      }

      state.jobs = result.data.jobs.filter(
        (job) => job && typeof job === 'object'
      );

      updateStatistics();
      applyFilters(false);

    } catch (error) {

      showAlert(
        error?.message ||
        'Unable to load jobs. Please try again.'
      );

      if (state.jobs.length === 0) {
        setText('jobsResultCount', 'Unable to load jobs');
      } else {
        applyFilters(false);
      }

    } finally {

      setLoading(false);

    }

  }

  /*
   * EVENT HANDLERS
   */

  function initializeEvents() {

    $('jobSearch')?.addEventListener(
      'input',
      () => applyFilters(true)
    );

    $('jobStatusFilter')?.addEventListener(
      'change',
      () => applyFilters(true)
    );

    $('jobSort')?.addEventListener(
      'change',
      () => applyFilters(true)
    );

    $('refreshJobsButton')?.addEventListener(
      'click',
      loadJobs
    );

    $('jobsPreviousButton')?.addEventListener(
      'click',
      () => {

        if (state.currentPage > 1) {
          state.currentPage--;
          renderJobs();
        }

      }
    );

    $('jobsNextButton')?.addEventListener(
      'click',
      () => {

        const totalPages = Math.ceil(
          state.filteredJobs.length / PAGE_SIZE
        );

        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderJobs();
        }

      }
    );

  }

  /*
   * INITIALIZATION
   */

  async function initialize() {

    initializeEvents();

    try {

      if (
        !API ||
        typeof API.post !== 'function' ||
        !SESSION ||
        typeof SESSION.getSession !== 'function' ||
        typeof SESSION.validateSession !== 'function'
      ) {
        throw new Error(
          'Employer services are unavailable.'
        );
      }

      const session = SESSION.getSession();

      if (
        !session ||
        session.role !== 'employer' ||
        !session.sessionToken
      ) {
        window.location.replace('login.html');
        return;
      }

      const validation = await SESSION.validateSession();

      if (validation.success !== true) {

        if (isInvalidSession(validation)) {
          window.location.replace('login.html');
          return;
        }

        throw new Error(
          validation.message ||
          'Unable to verify employer session.'
        );

      }

      state.sessionToken = session.sessionToken;

      await loadJobs();

    } catch (error) {

      setLoading(false);

      showAlert(
        error?.message ||
        'Unable to initialize Manage Jobs.'
      );

      setText('jobsResultCount', 'Unable to load jobs');

    }

  }

  initialize();

})();
