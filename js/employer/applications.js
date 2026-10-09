
'use strict';

/*
 * =========================================================
 * UCPP V2 — Employer Applications v1.0
 *
 * READ-ONLY MODE
 * =========================================================
 */

(function () {

  const API = window.UCPP_API;
  const SESSION = window.UCPP_SESSION_MANAGER;

  const PAGE_SIZE = 10;

  const state = {
    applications: [],
    filtered: [],
    jobs: [],
    currentPage: 1,
    sessionToken: '',
    loading: false
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
    const element = $('applicationsAlert');

    if (!element) return;

    element.textContent = message;
    element.className = 'profile-alert ' + type;
    element.hidden = false;
  }

  function hideAlert() {
    const element = $('applicationsAlert');

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

  function createElement(tag, className, value) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (value !== undefined) {
      element.textContent = String(value);
    }

    return element;
  }

  function getField(object, keys, fallback = '') {
    if (!object || typeof object !== 'object') {
      return fallback;
    }

    for (const key of keys) {
      const value = object[key];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ) {
        return value;
      }
    }

    return fallback;
  }

  function getApplicationId(app) {
    return getField(app, [
      'Application_ID',
      'applicationId'
    ]);
  }

  function getCandidateName(app) {
    return getField(app, [
      'Candidate_Name',
      'candidateName',
      'Full_Name',
      'fullName'
    ], 'Candidate');
  }

  function getCandidateId(app) {
    return getField(app, [
      'Candidate_ID',
      'candidateId'
    ]);
  }

  function getCandidateEmail(app) {
    return getField(app, [
      'Candidate_Email',
      'candidateEmail',
      'Email',
      'email'
    ]);
  }

  function getJobId(app) {
    return String(getField(app, [
      'Job_ID',
      'jobId'
    ]));
  }

  function getJobTitle(app) {
    const direct = getField(app, [
      'Job_Title',
      'jobTitle'
    ]);

    if (direct) return String(direct);

    const jobId = getJobId(app);

    const job = state.jobs.find(
      (item) => String(
        getField(item, ['Job_ID', 'jobId'])
      ) === jobId
    );

    return String(getField(job, [
      'Job_Title',
      'jobTitle'
    ], 'Job details unavailable'));
  }

  function getStatus(app) {
    return String(getField(app, [
      'Application_Status',
      'applicationStatus',
      'status'
    ], 'Applied')).trim();
  }

  function getApplicationDate(app) {
    return getField(app, [
      'Application_Date',
      'applicationDate',
      'appliedDate'
    ]);
  }

  function getQualification(app) {
    return getField(app, [
      'Qualification',
      'qualification',
      'Candidate_Qualification',
      'candidateQualification'
    ], '—');
  }

  function getLocation(app) {
    const direct = getField(app, [
      'Current_City',
      'currentCity',
      'Candidate_City',
      'candidateCity',
      'Location',
      'location'
    ]);

    if (direct) return String(direct);

    return '—';
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

  function dateValue(value) {
    const timestamp = Date.parse(String(value || ''));

    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function normalizeStatus(value) {
    return String(value || '').trim().toLowerCase();
  }

  /*
   * STATISTICS
   */

  function updateStatistics() {

    const applications = state.applications;

    const countStatus = (status) =>
      applications.filter(
        (app) => normalizeStatus(getStatus(app)) === status
      ).length;

    setText(
      'totalApplicationsCount',
      applications.length
    );

    setText(
      'appliedApplicationsCount',
      countStatus('applied')
    );

    setText(
      'shortlistedApplicationsCount',
      countStatus('shortlisted')
    );

    setText(
      'interviewApplicationsCount',
      countStatus('interview')
    );

  }

  /*
   * JOB FILTER
   */

  function populateJobFilter() {

    const select = $('applicationJobFilter');

    if (!select) return;

    const previousValue = select.value;

    select.replaceChildren();

    const allOption = new Option('All Jobs', 'all');
    select.appendChild(allOption);

    const jobMap = new Map();

    state.jobs.forEach((job) => {
      const id = String(
        getField(job, ['Job_ID', 'jobId'])
      );

      if (!id) return;

      jobMap.set(
        id,
        String(getField(job, [
          'Job_Title',
          'jobTitle'
        ], id))
      );
    });

    state.applications.forEach((app) => {
      const id = getJobId(app);

      if (!id || jobMap.has(id)) return;

      jobMap.set(id, getJobTitle(app));
    });

    [...jobMap.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([id, title]) => {
        select.appendChild(
          new Option(title, id)
        );
      });

    const stillExists = [...select.options].some(
      (option) => option.value === previousValue
    );

    select.value = stillExists ? previousValue : 'all';

  }

  /*
   * SEARCH, FILTER AND SORT
   */

  function applyFilters(resetPage = true) {

    const search = String(
      $('applicationSearch')?.value || ''
    ).trim().toLowerCase();

    const jobFilter = String(
      $('applicationJobFilter')?.value || 'all'
    );

    const statusFilter = String(
      $('applicationStatusFilter')?.value || 'all'
    );

    const sortBy = String(
      $('applicationSort')?.value || 'newest'
    );

    let applications = state.applications.filter((app) => {

      const searchable = [
        getApplicationId(app),
        getCandidateName(app),
        getCandidateId(app),
        getCandidateEmail(app),
        getJobId(app),
        getJobTitle(app)
      ]
        .map((value) => String(value || ''))
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !search || searchable.includes(search);

      const matchesJob =
        jobFilter === 'all' ||
        getJobId(app) === jobFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        normalizeStatus(getStatus(app)) ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesJob && matchesStatus;

    });

    applications.sort((a, b) => {

      if (sortBy === 'oldest') {
        return dateValue(getApplicationDate(a)) -
          dateValue(getApplicationDate(b));
      }

      if (sortBy === 'candidate') {
        return getCandidateName(a).localeCompare(
          getCandidateName(b),
          'en',
          { sensitivity: 'base' }
        );
      }

      if (sortBy === 'job') {
        return getJobTitle(a).localeCompare(
          getJobTitle(b),
          'en',
          { sensitivity: 'base' }
        );
      }

      return dateValue(getApplicationDate(b)) -
        dateValue(getApplicationDate(a));

    });

    state.filtered = applications;

    if (resetPage) {
      state.currentPage = 1;
    }

    const totalPages = Math.max(
      1,
      Math.ceil(applications.length / PAGE_SIZE)
    );

    state.currentPage = Math.min(
      state.currentPage,
      totalPages
    );

    renderApplications();

  }

  /*
   * APPLICATION ROW
   */

  function createApplicationRow(app) {

    const row = document.createElement('tr');

    // Candidate
    const candidateCell = document.createElement('td');

    const candidateWrap = createElement(
      'div',
      'application-candidate'
    );

    const name = String(getCandidateName(app));

    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'C';

    candidateWrap.appendChild(
      createElement(
        'div',
        'application-candidate-avatar',
        initials
      )
    );

    const candidateInfo = createElement(
      'div',
      'application-candidate-info'
    );

    candidateInfo.appendChild(
      createElement(
        'span',
        'application-candidate-name',
        name
      )
    );

    candidateInfo.appendChild(
      createElement(
        'span',
        'application-candidate-id',
        getCandidateId(app) ||
          getApplicationId(app) ||
          '—'
      )
    );

    const email = getCandidateEmail(app);

    if (email) {
      candidateInfo.appendChild(
        createElement(
          'span',
          'application-candidate-email',
          email
        )
      );
    }

    candidateWrap.appendChild(candidateInfo);
    candidateCell.appendChild(candidateWrap);
    row.appendChild(candidateCell);

    // Job
    const jobCell = document.createElement('td');

    jobCell.appendChild(
      createElement(
        'span',
        'application-job-title',
        getJobTitle(app)
      )
    );

    jobCell.appendChild(
      createElement(
        'span',
        'application-job-id',
        getJobId(app) || '—'
      )
    );

    row.appendChild(jobCell);

    // Qualification
    row.appendChild(
      createElement(
        'td',
        'application-qualification',
        getQualification(app)
      )
    );

    // Location
    row.appendChild(
      createElement(
        'td',
        'application-location',
        getLocation(app)
      )
    );

    // Date
    row.appendChild(
      createElement(
        'td',
        '',
        formatDate(getApplicationDate(app))
      )
    );

    // Status
    const statusCell = document.createElement('td');

    const status = getStatus(app);

    const badge = createElement(
      'span',
      'application-status',
      status
    );

    const normalized = normalizeStatus(status);

    if ([
      'applied',
      'viewed',
      'shortlisted',
      'rejected',
      'interview'
    ].includes(normalized)) {
      badge.classList.add(normalized);
    }

    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    // Actions — intentionally disabled
    const actionsCell = document.createElement('td');

    const actions = createElement(
      'div',
      'application-actions'
    );

    const shortlistButton = createElement(
      'button',
      'application-action success',
      'Shortlist'
    );

    shortlistButton.type = 'button';
    shortlistButton.disabled = true;
    shortlistButton.title =
      'Application updates are not enabled yet';

    const rejectButton = createElement(
      'button',
      'application-action danger',
      'Reject'
    );

    rejectButton.type = 'button';
    rejectButton.disabled = true;
    rejectButton.title =
      'Application updates are not enabled yet';

    actions.appendChild(shortlistButton);
    actions.appendChild(rejectButton);

    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);

    return row;

  }

  /*
   * RENDER
   */

  function renderApplications() {

    const tbody = $('applicationsTableBody');

    if (!tbody) return;

    tbody.replaceChildren();

    const applications = state.filtered;

    if (applications.length === 0) {

      show('applicationsTableWrap', false);
      show('applicationsPagination', false);
      show('applicationsEmpty', true);

      if (state.applications.length === 0) {

        setText(
          'applicationsEmptyTitle',
          'No applications received yet'
        );

        setText(
          'applicationsEmptyDescription',
          'Candidate applications will appear here once candidates apply to your jobs.'
        );

        show('applicationsEmptyAction', true);

      } else {

        setText(
          'applicationsEmptyTitle',
          'No matching applications'
        );

        setText(
          'applicationsEmptyDescription',
          'Try changing your search term or filters.'
        );

        show('applicationsEmptyAction', false);

      }

      setText('applicationsResultCount', '0 applications found');

      return;

    }

    const start = (state.currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    const pageApplications = applications.slice(start, end);

    const fragment = document.createDocumentFragment();

    pageApplications.forEach((app) => {
      fragment.appendChild(createApplicationRow(app));
    });

    tbody.appendChild(fragment);

    show('applicationsEmpty', false);
    show('applicationsTableWrap', true);

    const totalPages = Math.ceil(
      applications.length / PAGE_SIZE
    );

    show(
      'applicationsPagination',
      totalPages > 1
    );

    setText(
      'applicationsPageInfo',
      'Page ' + state.currentPage + ' of ' + totalPages
    );

    $('applicationsPreviousButton').disabled =
      state.currentPage <= 1;

    $('applicationsNextButton').disabled =
      state.currentPage >= totalPages;

    setText(
      'applicationsResultCount',
      'Showing ' +
        (start + 1) +
        '–' +
        Math.min(end, applications.length) +
        ' of ' +
        applications.length +
        ' applications'
    );

  }

  /*
   * LOADING
   */

  function setLoading(loading) {

    state.loading = loading;

    show('applicationsSkeleton', loading);

    if (loading) {
      show('applicationsTableWrap', false);
      show('applicationsEmpty', false);
      show('applicationsPagination', false);

      setText(
        'applicationsResultCount',
        'Loading applications...'
      );
    }

    const button = $('refreshApplicationsButton');

    if (button) {
      button.disabled = loading;
      button.textContent =
        loading ? 'Loading...' : 'Refresh';
    }

  }

  /*
   * API — READ ONLY
   */

  async function loadApplications() {

    if (state.loading) return;

    hideAlert();
    setLoading(true);

    try {

      const [applicationsResult, jobsResult] =
        await Promise.all([
          API.post('getEmployerApplications', {
            sessionToken: state.sessionToken
          }),
          API.post('getEmployerJobs', {
            sessionToken: state.sessionToken
          })
        ]);

      if (
        !applicationsResult ||
        applicationsResult.success !== true
      ) {

        if (isInvalidSession(applicationsResult)) {
          window.location.replace('login.html');
          return;
        }

        throw new Error(
          applicationsResult?.message ||
          'Unable to load applications.'
        );

      }

      if (
        !jobsResult ||
        jobsResult.success !== true
      ) {

        if (isInvalidSession(jobsResult)) {
          window.location.replace('login.html');
          return;
        }

        throw new Error(
          jobsResult?.message ||
          'Unable to load job details.'
        );

      }

      /*
       * Supports either:
       * { data: { applications: [...] } }
       * or { data: [...] }
       */

      const applicationData = applicationsResult.data;

      const applicationList = Array.isArray(applicationData)
        ? applicationData
        : applicationData?.applications;

      if (!Array.isArray(applicationList)) {
        throw new Error(
          'Invalid applications data received.'
        );
      }

      const jobData = jobsResult.data;

      const jobList = Array.isArray(jobData)
        ? jobData
        : jobData?.jobs;

      if (!Array.isArray(jobList)) {
        throw new Error(
          'Invalid jobs data received.'
        );
      }

      state.jobs = jobList.filter(
        (job) => job && typeof job === 'object'
      );

      state.applications = applicationList.filter(
        (app) => app && typeof app === 'object'
      );

      updateStatistics();
      populateJobFilter();
      applyFilters(false);

    } catch (error) {

      showAlert(
        error?.message ||
        'Unable to load applications. Please try again.'
      );

      if (state.applications.length === 0) {
        setText(
          'applicationsResultCount',
          'Unable to load applications'
        );
      } else {
        applyFilters(false);
      }

    } finally {

      setLoading(false);

    }

  }

  /*
   * EVENTS
   */

  function initializeEvents() {

    $('applicationSearch')?.addEventListener(
      'input',
      () => applyFilters(true)
    );

    $('applicationJobFilter')?.addEventListener(
      'change',
      () => applyFilters(true)
    );

    $('applicationStatusFilter')?.addEventListener(
      'change',
      () => applyFilters(true)
    );

    $('applicationSort')?.addEventListener(
      'change',
      () => applyFilters(true)
    );

    $('refreshApplicationsButton')?.addEventListener(
      'click',
      loadApplications
    );

    $('applicationsPreviousButton')?.addEventListener(
      'click',
      () => {

        if (state.currentPage > 1) {
          state.currentPage--;
          renderApplications();
        }

      }
    );

    $('applicationsNextButton')?.addEventListener(
      'click',
      () => {

        const totalPages = Math.ceil(
          state.filtered.length / PAGE_SIZE
        );

        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderApplications();
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

      await loadApplications();

    } catch (error) {

      setLoading(false);

      showAlert(
        error?.message ||
        'Unable to initialize Applications.'
      );

      setText(
        'applicationsResultCount',
        'Unable to load applications'
      );

    }

  }

  initialize();

})();
