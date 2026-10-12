
'use strict';

/*
 * =========================================================
 * UCPP V2 — Employer Candidate Profile View v1.0
 *
 * READ-ONLY
 * No automatic Viewed status update
 * No Shortlist / Interview / Reject write calls
 * =========================================================
 */

(function () {

  const API = window.UCPP_API;
  const SESSION = window.UCPP_SESSION_MANAGER;

  const $ = (id) => document.getElementById(id);

  const state = {
    sessionToken: '',
    application: null,
    candidate: null,
    job: null
  };

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

  function setText(id, value) {
    const element = $(id);

    if (element) {
      element.textContent =
        value === undefined ||
        value === null ||
        String(value).trim() === ''
          ? '—'
          : String(value);
    }
  }

  function show(id, visible) {
    const element = $(id);

    if (element) {
      element.hidden = !visible;
    }
  }

  function showAlert(message) {
    const alert = $('candidateViewAlert');

    if (!alert) return;

    alert.textContent = message;
    alert.className = 'profile-alert error';
    alert.hidden = false;
  }

  function getList(result, key) {
    const data = result?.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.[key])) {
      return data[key];
    }

    return null;
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

  function getApplicationId(app) {
    return String(getField(app, [
      'Application_ID',
      'applicationId'
    ]));
  }

  function getCandidateId(app) {
    return String(getField(app, [
      'Candidate_ID',
      'candidateId'
    ]));
  }

  function getJobId(app) {
    return String(getField(app, [
      'Job_ID',
      'jobId'
    ]));
  }

  function getStatus(app) {
    return String(getField(app, [
      'Application_Status',
      'applicationStatus',
      'status'
    ], 'Applied'));
  }

  function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function setStatus(status) {
    const element = $('candidateApplicationStatus');

    if (element) {
      element.className =
        'status-badge ' +
        String(status).trim().toLowerCase();

      element.textContent = status;
    }

    setText('candidateSidebarStatus', status);
  }

  function renderSkills(value) {
    const container = $('candidateSkills');

    if (!container) return;

    container.replaceChildren();

    const skills = Array.isArray(value)
      ? value
      : String(value || '')
          .split(/[,;\n]+/)
          .map((item) => item.trim())
          .filter(Boolean);

    if (!skills.length) {
      const empty = document.createElement('span');
      empty.className = 'candidate-empty-value';
      empty.textContent = 'Not provided';
      container.appendChild(empty);
      return;
    }

    skills.forEach((skill) => {
      const tag = document.createElement('span');
      tag.className = 'candidate-skill-tag';
      tag.textContent = String(skill);
      container.appendChild(tag);
    });
  }

  function renderPhoto(url, name) {
    const image = $('candidateProfilePhoto');
    const fallback = $('candidateAvatarFallback');

    const initials = String(name || 'Candidate')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'C';

    if (fallback) {
      fallback.textContent = initials;
      fallback.hidden = false;
    }

    if (!image) return;

    image.hidden = true;
    image.removeAttribute('src');

    const photoUrl = String(url || '').trim();

    if (!/^https:\/\//i.test(photoUrl)) {
      return;
    }

    image.onload = () => {
      image.hidden = false;

      if (fallback) {
        fallback.hidden = true;
      }
    };

    image.onerror = () => {
      image.hidden = true;

      if (fallback) {
        fallback.hidden = false;
      }
    };

    image.src = photoUrl;
  }

  function renderProfile() {
    const candidate = state.candidate;
    const application = state.application;
    const job = state.job;

    const name = getField(candidate, [
      'Full_Name',
      'fullName',
      'Candidate_Name',
      'candidateName'
    ], getField(application, [
      'Candidate_Name',
      'candidateName'
    ], 'Candidate'));

    const education = getField(candidate, [
      'Education',
      'education'
    ]);

    const qualification = getField(candidate, [
      'Qualification',
      'qualification'
    ]);

    const experience = getField(candidate, [
      'Experience',
      'experience'
    ]);

    const city = getField(candidate, [
      'Current_City',
      'currentCity'
    ]);

    setText('candidateFullName', name);
    setText('candidateId', getCandidateId(application));
    setText('candidateApplicationId', getApplicationId(application));

    setText(
      'candidateHeadline',
      qualification || education || 'Candidate Digital Resume'
    );

    setText('candidateCurrentCity', city);
    setText('candidateEducationSummary', qualification || education);
    setText('candidateExperienceSummary', experience);

    setText('candidateAbout', getField(candidate, [
      'About_Candidate',
      'aboutCandidate'
    ], 'Not provided'));

    setText('candidateEducation', education);
    setText('candidateQualification', qualification);

    setText('candidatePassingYear', getField(candidate, [
      'Passing_Year',
      'passingYear'
    ]));

    renderSkills(getField(candidate, [
      'Skills',
      'skills'
    ]));

    setText('candidateExperience', experience);

    setText('candidateEmploymentStatus', getField(candidate, [
      'Employment_Status',
      'employmentStatus'
    ]));

    setText('candidatePreferredLocation', getField(candidate, [
      'Preferred_Location',
      'preferredLocation'
    ]));

    setText('candidateExpectedSalary', getField(candidate, [
      'Expected_Salary',
      'expectedSalary'
    ]));

    setText('candidateEmail', getField(candidate, [
      'Email',
      'email'
    ], getField(application, [
      'Candidate_Email',
      'candidateEmail'
    ])));

    setText('candidateMobile', getField(candidate, [
      'Mobile',
      'mobile'
    ], getField(application, [
      'Candidate_Mobile',
      'candidateMobile'
    ])));

    setText('candidateContactCity', city);

    setText('candidateAppliedJob', getField(job, [
      'Job_Title',
      'jobTitle'
    ], getField(application, [
      'Job_Title',
      'jobTitle'
    ])));

    setText(
  'candidateAppliedDate',
  formatDate(getField(application, [
    'Applied_Date',
    'appliedDate',
    'Application_Date',
    'applicationDate'
  ]))
);

    setText('candidateEmployerNotes', getField(application, [
  'Employer_Remarks',
  'employerRemarks',
  'Employer_Notes',
  'employerNotes'
], 'No notes available.'));

    
    setStatus(getStatus(application));

    renderPhoto(getField(candidate, [
      'Profile_Photo_URL',
      'profilePhotoUrl'
    ]), name);
  }

  function showError(message) {
    show('candidateViewSkeleton', false);
    show('candidateViewContent', false);
    show('candidateViewEmpty', true);

    setText(
      'candidateViewEmptyTitle',
      'Candidate profile unavailable'
    );

    setText(
      'candidateViewEmptyDescription',
      message
    );

    showAlert(message);
  }

  async function loadProfile(applicationId) {
    show('candidateViewSkeleton', true);
    show('candidateViewContent', false);
    show('candidateViewEmpty', false);

    try {
      /*
       * First load employer-owned applications.
       * Only an application belonging to this employer
       * may be selected.
       */

      const applicationsResult = await API.post(
        'getEmployerApplications',
        { sessionToken: state.sessionToken }
      );

      if (applicationsResult?.success !== true) {
        if (isInvalidSession(applicationsResult)) {
          window.location.replace('login.html');
          return;
        }

        throw new Error(
          applicationsResult?.message ||
          'Unable to load employer applications.'
        );
      }

      const applications = getList(
        applicationsResult,
        'applications'
      );

      if (!applications) {
        throw new Error(
          'Invalid employer applications response.'
        );
      }

      const application = applications.find(
        (item) =>
          getApplicationId(item) === applicationId
      );

      if (!application) {
        throw new Error(
          'This application is unavailable for your employer account.'
        );
      }

      state.application = application;

      const candidateId = getCandidateId(application);
      const jobId = getJobId(application);

      if (!candidateId) {
        throw new Error(
          'Candidate ID is missing from this application.'
        );
      }

      /*
       * Candidate profile API must enforce employer
       * authorization on the backend.
       *
       * This frontend check is not a security boundary.
       *
       * Do not substitute getCandidateProfile here:
       * that API is intended for candidate accounts.
       */

      const profileResult = await API.post(
        'getEmployerCandidateProfile',
        {
          sessionToken: state.sessionToken,
          applicationId: applicationId,
          candidateId: candidateId
        }
      );

      if (profileResult?.success !== true) {
        if (isInvalidSession(profileResult)) {
          window.location.replace('login.html');
          return;
        }

        throw new Error(
          profileResult?.message ||
          'Candidate profile API is unavailable or access was denied.'
        );
      }

      const profileData = profileResult.data;

      const candidate =
        profileData?.candidate ||
        profileData?.profile ||
        profileData;

      if (
        !candidate ||
        typeof candidate !== 'object' ||
        Array.isArray(candidate)
      ) {
        throw new Error(
          'Invalid candidate profile response.'
        );
      }

      state.candidate = candidate;

      /*
       * Job details are optional.
       * The application remains the primary record.
       */

      state.job = null;

      if (jobId) {
        try {
          const jobsResult = await API.post(
            'getEmployerJobs',
            { sessionToken: state.sessionToken }
          );

          if (jobsResult?.success === true) {
            const jobs = getList(jobsResult, 'jobs');

            if (jobs) {
              state.job = jobs.find(
                (job) =>
                  String(getField(job, [
                    'Job_ID',
                    'jobId'
                  ])) === jobId
              ) || null;
            }
          }
        } catch (jobError) {
          // Optional job lookup must not block profile display.
        }
      }

      renderProfile();

      show('candidateViewSkeleton', false);
      show('candidateViewEmpty', false);
      show('candidateViewContent', true);

    } catch (error) {
      showError(
        error?.message ||
        'Unable to load candidate profile.'
      );
    }
  }

  async function initialize() {
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

      if (validation?.success !== true) {
        if (isInvalidSession(validation)) {
          window.location.replace('login.html');
          return;
        }

        throw new Error(
          validation?.message ||
          'Unable to validate employer session.'
        );
      }

      state.sessionToken = session.sessionToken;

      const params = new URLSearchParams(
        window.location.search
      );

      const applicationId = String(
        params.get('applicationId') || ''
      ).trim();

      if (!applicationId) {
        throw new Error(
          'Application ID is missing from the page URL.'
        );
      }

      await loadProfile(applicationId);

    } catch (error) {
      showError(
        error?.message ||
        'Unable to initialize candidate profile.'
      );
    }
  }

  initialize();

})();
