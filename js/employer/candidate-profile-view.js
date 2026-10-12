
'use strict';

/*
 * =========================================================
 * UCPP V2 — Employer Candidate Profile View v1.1
 *
 * READ-ONLY
 * Employer-authorized candidate digital resume
 *
 * No automatic Viewed status update
 * No Shortlist / Interview / Reject write calls
 * No production data modification
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
    job: null,
    experience: [],
    certifications: [],
    socialLinks: {}
  };

  /* =======================================================
   * COMMON HELPERS
   * ======================================================= */

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

    if (!element) return;

    element.textContent =
      value === undefined ||
      value === null ||
      String(value).trim() === ''
        ? '—'
        : String(value);
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

  function clearAlert() {
    const alert = $('candidateViewAlert');

    if (!alert) return;

    alert.textContent = '';
    alert.hidden = true;
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
    ].includes(String(result?.code || '').toUpperCase());
  }

  function getApplicationId(app) {
    return String(getField(app, [
      'Application_ID',
      'applicationId'
    ])).trim();
  }

  function getCandidateId(app) {
    return String(getField(app, [
      'Candidate_ID',
      'candidateId'
    ])).trim();
  }

  function getJobId(app) {
    return String(getField(app, [
      'Job_ID',
      'jobId'
    ])).trim();
  }

  function getStatus(app) {
    return String(getField(app, [
      'Application_Status',
      'applicationStatus',
      'status'
    ], 'Applied')).trim();
  }

  function formatDate(value) {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return '—';
    }

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

  function getSafeHttpsUrl(value) {
    const raw = String(value || '').trim();

    if (!raw) return null;

    try {
      const url = new URL(raw);

      if (url.protocol !== 'https:') {
        return null;
      }

      if (!url.hostname) {
        return null;
      }

      return url.href;

    } catch (error) {
      return null;
    }
  }

  function createEmptyMessage(message) {
    const element = document.createElement('p');

    element.className = 'candidate-empty-value';
    element.textContent = message;

    return element;
  }

  function isCurrentlyWorking(value) {
    if (value === true || value === 1) {
      return true;
    }

    return [
      'yes',
      'true',
      '1',
      'current',
      'present'
    ].includes(String(value || '').trim().toLowerCase());
  }

  function setStatus(status) {
    const element = $('candidateApplicationStatus');

    if (element) {
      const normalized = String(status || 'Applied')
        .trim()
        .toLowerCase();

      const allowed = [
        'applied',
        'viewed',
        'shortlisted',
        'interview',
        'rejected'
      ];

      element.className =
        'status-badge ' +
        (allowed.includes(normalized) ? normalized : '');

      element.textContent = status || 'Applied';
    }

    setText('candidateSidebarStatus', status || 'Applied');
  }

  /* =======================================================
   * SKILLS
   * ======================================================= */

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
      container.appendChild(
        createEmptyMessage('Not provided')
      );
      return;
    }

    skills.forEach((skill) => {
      const tag = document.createElement('span');

      tag.className = 'candidate-skill-tag';
      tag.textContent = String(skill);

      container.appendChild(tag);
    });
  }

  /* =======================================================
   * PROFILE PHOTO
   * ======================================================= */

  function renderPhoto(url, name) {
    const image = $('candidateProfilePhoto');
    const fallback = $('candidateAvatarFallback');

    const initials = String(name || 'Candidate')
      .trim()
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

    const photoUrl = getSafeHttpsUrl(url);

    if (!photoUrl) return;

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

  /* =======================================================
   * WORK EXPERIENCE DETAILS
   * ======================================================= */

  function renderExperienceDetails() {
    const container = $('candidateExperienceList');

    if (!container) return;

    container.replaceChildren();

    const experiences = Array.isArray(state.experience)
      ? state.experience
      : [];

    if (!experiences.length) {
      container.appendChild(
        createEmptyMessage(
          'No work experience details available.'
        )
      );
      return;
    }

    experiences.forEach((item) => {
      if (!item || typeof item !== 'object') return;

      const card = document.createElement('div');
      card.className = 'candidate-experience-item';

      const title = document.createElement('h3');
      title.textContent = getField(
        item,
        ['jobTitle', 'Job_Title'],
        'Job title not provided'
      );

      const company = document.createElement('p');
      company.className = 'candidate-experience-company';
      company.textContent = getField(
        item,
        ['companyName', 'Company_Name'],
        'Company not provided'
      );

      const details = document.createElement('p');
      details.className = 'candidate-experience-meta';

      const dateParts = [];

      const startDate = getField(item, [
        'startDate',
        'Start_Date'
      ]);

      const endDate = getField(item, [
        'endDate',
        'End_Date'
      ]);

      const currentlyWorking = getField(item, [
        'currentlyWorking',
        'Currently_Working'
      ]);

      if (startDate || endDate || isCurrentlyWorking(currentlyWorking)) {
        const from = startDate
          ? formatDate(startDate)
          : '—';

        const to = isCurrentlyWorking(currentlyWorking)
          ? 'Present'
          : formatDate(endDate);

        dateParts.push(from + ' – ' + to);
      }

      const employmentType = getField(item, [
        'employmentType',
        'Employment_Type'
      ]);

      const location = getField(item, [
        'location',
        'Location'
      ]);

      if (employmentType) {
        dateParts.push(String(employmentType));
      }

      if (location) {
        dateParts.push(String(location));
      }

      details.textContent = dateParts.join(' | ');

      const responsibilities = getField(item, [
        'responsibilities',
        'Responsibilities'
      ]);

      const description = document.createElement('p');
      description.className = 'candidate-experience-description';
      description.textContent =
        responsibilities || 'No responsibilities provided.';

      card.append(title, company);

      if (details.textContent) {
        card.appendChild(details);
      }

      card.appendChild(description);
      container.appendChild(card);
    });

    if (!container.children.length) {
      container.appendChild(
        createEmptyMessage(
          'No work experience details available.'
        )
      );
    }
  }

  /* =======================================================
   * CERTIFICATIONS & TRAINING
   * ======================================================= */

  function renderCertifications() {
    const container = $('candidateCertificationsList');

    if (!container) return;

    container.replaceChildren();

    const certifications = Array.isArray(state.certifications)
      ? state.certifications
      : [];

    if (!certifications.length) {
      container.appendChild(
        createEmptyMessage(
          'No certifications available.'
        )
      );
      return;
    }

    certifications.forEach((item) => {
      if (!item || typeof item !== 'object') return;

      const card = document.createElement('div');
      card.className = 'candidate-certification-item';

      const title = document.createElement('h3');
      title.textContent = getField(
        item,
        ['certificationName', 'Certification_Name'],
        'Certification'
      );

      const organization = document.createElement('p');
      organization.className = 'candidate-certification-org';
      organization.textContent = getField(
        item,
        ['issuingOrganization', 'Issuing_Organization'],
        'Organization not provided'
      );

      card.append(title, organization);

      const dateParts = [];

      const issueDate = getField(item, [
        'issueDate',
        'Issue_Date'
      ]);

      const expiryDate = getField(item, [
        'expiryDate',
        'Expiry_Date'
      ]);

      if (issueDate) {
        dateParts.push(
          'Issued: ' + formatDate(issueDate)
        );
      }

      if (expiryDate) {
        dateParts.push(
          'Expires: ' + formatDate(expiryDate)
        );
      }

      if (dateParts.length) {
        const dates = document.createElement('p');

        dates.className = 'candidate-certification-meta';
        dates.textContent = dateParts.join(' | ');

        card.appendChild(dates);
      }

      const description = getField(item, [
        'description',
        'Description'
      ]);

      if (description) {
        const descriptionElement =
          document.createElement('p');

        descriptionElement.className =
          'candidate-certification-description';

        descriptionElement.textContent = String(description);

        card.appendChild(descriptionElement);
      }

      const credentialUrl = getSafeHttpsUrl(
        getField(item, [
          'credentialUrl',
          'Credential_URL'
        ])
      );

      if (credentialUrl) {
        const link = document.createElement('a');

        link.href = credentialUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'candidate-credential-link';
        link.textContent = 'View Credential';

        card.appendChild(link);
      }

      container.appendChild(card);
    });

    if (!container.children.length) {
      container.appendChild(
        createEmptyMessage(
          'No certifications available.'
        )
      );
    }
  }

  /* =======================================================
   * PROFESSIONAL LINKS
   * ======================================================= */

  function renderSocialLinks() {
    const container = $('candidateSocialLinks');

    if (!container) return;

    container.replaceChildren();

    const links =
      state.socialLinks &&
      typeof state.socialLinks === 'object' &&
      !Array.isArray(state.socialLinks)
        ? state.socialLinks
        : {};

    const platforms = [
      {
        key: 'linkedIn',
        label: 'LinkedIn'
      },
      {
        key: 'naukri',
        label: 'Naukri'
      },
      {
        key: 'indeed',
        label: 'Indeed'
      },
      {
        key: 'github',
        label: 'GitHub'
      },
      {
        key: 'portfolio',
        label: 'Portfolio'
      },
      {
        key: 'otherLink',
        label: 'Other Link'
      }
    ];

    let count = 0;

    platforms.forEach((platform) => {
      const value = getField(
        links,
        [platform.key]
      );

      const safeUrl = getSafeHttpsUrl(value);

      if (!safeUrl) return;

      const link = document.createElement('a');

      link.href = safeUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'candidate-social-link';

      const label = document.createElement('span');
      label.textContent = platform.label;

      const arrow = document.createElement('span');
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');

      link.append(label, arrow);
      container.appendChild(link);

      count++;
    });

    if (count === 0) {
      container.appendChild(
        createEmptyMessage(
          'No professional links available.'
        )
      );
    }
  }

  /* =======================================================
   * MAIN PROFILE RENDERING
   * ======================================================= */

  function renderProfile() {
    const candidate = state.candidate || {};
    const application = state.application || {};
    const job = state.job || {};

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

    setText(
      'candidateId',
      getCandidateId(application)
    );

    setText(
      'candidateApplicationId',
      getApplicationId(application)
    );

    setText(
      'candidateHeadline',
      qualification ||
      education ||
      'Candidate Digital Resume'
    );

    setText('candidateCurrentCity', city);

    setText(
      'candidateEducationSummary',
      qualification || education
    );

    setText(
      'candidateExperienceSummary',
      experience
    );

    setText(
      'candidateAbout',
      getField(candidate, [
        'About_Candidate',
        'aboutCandidate'
      ], 'Not provided')
    );

    setText('candidateEducation', education);
    setText('candidateQualification', qualification);

    setText(
      'candidatePassingYear',
      getField(candidate, [
        'Passing_Year',
        'passingYear'
      ])
    );

    renderSkills(
      getField(candidate, [
        'Skills',
        'skills'
      ])
    );

    setText('candidateExperience', experience);

    setText(
      'candidateEmploymentStatus',
      getField(candidate, [
        'Employment_Status',
        'employmentStatus'
      ])
    );

    setText(
      'candidatePreferredLocation',
      getField(candidate, [
        'Preferred_Location',
        'preferredLocation'
      ])
    );

    setText(
      'candidateExpectedSalary',
      getField(candidate, [
        'Expected_Salary',
        'expectedSalary'
      ])
    );

    setText(
      'candidateEmail',
      getField(candidate, [
        'Email',
        'email'
      ], getField(application, [
        'Candidate_Email',
        'candidateEmail'
      ]))
    );

    setText(
      'candidateMobile',
      getField(candidate, [
        'Mobile',
        'mobile'
      ], getField(application, [
        'Candidate_Mobile',
        'candidateMobile'
      ]))
    );

    setText('candidateContactCity', city);

    setText(
      'candidateAppliedJob',
      getField(job, [
        'Job_Title',
        'jobTitle'
      ], getField(application, [
        'Job_Title',
        'jobTitle'
      ]))
    );

    setText(
      'candidateAppliedDate',
      formatDate(getField(application, [
        'Applied_Date',
        'appliedDate',
        'Application_Date',
        'applicationDate'
      ]))
    );

    setText(
      'candidateEmployerNotes',
      getField(application, [
        'Employer_Remarks',
        'employerRemarks',
        'Employer_Notes',
        'employerNotes'
      ], 'No notes available.')
    );

    setStatus(getStatus(application));

    renderPhoto(
      getField(candidate, [
        'Profile_Photo_URL',
        'profilePhotoUrl'
      ]),
      name
    );
  }

  /* =======================================================
   * ERROR HANDLING
   * ======================================================= */

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

  /* =======================================================
   * LOAD EMPLOYER-AUTHORIZED PROFILE
   * ======================================================= */

  async function loadProfile(applicationId) {
    clearAlert();

    show('candidateViewSkeleton', true);
    show('candidateViewContent', false);
    show('candidateViewEmpty', false);

    try {
      /*
       * Step 1:
       * Fetch employer-owned applications.
       * This is an additional frontend ownership check.
       *
       * Backend authorization is mandatory.
       */

      const applicationsResult = await API.post(
        'getEmployerApplications',
        {
          sessionToken: state.sessionToken
        }
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
       * Step 2:
       * Backend-secured candidate profile endpoint.
       *
       * Backend must independently validate:
       * 1. Employer session
       * 2. Application ownership
       * 3. Candidate ID from owned application
       *
       * Never call candidate-only profile endpoint here.
       */

      const profileResult = await API.post(
        'getEmployerCandidateProfile',
        {
          sessionToken: state.sessionToken,
          applicationId: applicationId
        }
      );

      if (profileResult?.success !== true) {
        if (isInvalidSession(profileResult)) {
          window.location.replace('login.html');
          return;
        }

        throw new Error(
          profileResult?.message ||
          'Candidate profile is unavailable or access was denied.'
        );
      }

      const profileData = profileResult.data;

      if (
        !profileData ||
        typeof profileData !== 'object' ||
        Array.isArray(profileData)
      ) {
        throw new Error(
          'Invalid candidate profile response.'
        );
      }

      const candidate =
        profileData.profile ||
        profileData.candidate ||
        null;

      if (
        !candidate ||
        typeof candidate !== 'object' ||
        Array.isArray(candidate)
      ) {
        throw new Error(
          'Candidate profile data is missing.'
        );
      }

      state.candidate = candidate;

      state.experience = Array.isArray(
        profileData.experience
      )
        ? profileData.experience
        : [];

      state.certifications = Array.isArray(
        profileData.certifications
      )
        ? profileData.certifications
        : [];

      state.socialLinks =
        profileData.socialLinks &&
        typeof profileData.socialLinks === 'object' &&
        !Array.isArray(profileData.socialLinks)
          ? profileData.socialLinks
          : {};

      /*
       * Backend application details may provide
       * canonical date/status/notes values.
       *
       * Only use them if the application ID matches
       * the already verified application.
       */

      const securedApplication = profileData.application;

      if (
        securedApplication &&
        typeof securedApplication === 'object' &&
        getApplicationId(securedApplication) === applicationId
      ) {
        state.application = {
          ...state.application,
          ...securedApplication
        };
      }

      /*
       * Step 3:
       * Optional employer job lookup.
       * A failure must not block resume display.
       */

      state.job = null;

      if (jobId) {
        try {
          const jobsResult = await API.post(
            'getEmployerJobs',
            {
              sessionToken: state.sessionToken
            }
          );

          if (jobsResult?.success === true) {
            const jobs = getList(
              jobsResult,
              'jobs'
            );

            if (jobs) {
              state.job = jobs.find(
                (job) =>
                  String(getField(job, [
                    'Job_ID',
                    'jobId'
                  ])).trim() === jobId
              ) || null;
            }
          }
        } catch (jobError) {
          // Optional lookup. No production write.
        }
      }

      /*
       * Step 4:
       * Render all read-only profile sections.
       */

      renderProfile();
      renderExperienceDetails();
      renderCertifications();
      renderSocialLinks();

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

  /* =======================================================
   * INITIALIZATION
   * ======================================================= */

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

      const validation =
        await SESSION.validateSession();

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
