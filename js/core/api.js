'use strict';

/*
 * =========================================================
 * UCPP V2
 * Core API Client
 * =========================================================
 *
 * Handles:
 * - GET requests
 * - POST requests
 * - Request timeout
 * - Duplicate GET request prevention
 * - Public Jobs APIs
 * - Candidate Forgot Password APIs
 *
 * IMPORTANT:
 * Password / OTP / Reset Token are sent through POST body.
 * They are never added to the URL.
 * =========================================================
 */

(function () {

  if (!window.UCPP_CONFIG) {

    console.error(
      'UCPP_CONFIG is not available.'
    );

    return;

  }


  const CONFIG =
    window.UCPP_CONFIG;


  /*
   * Prevent duplicate identical
   * GET requests running together.
   */
  const activeRequests =
    new Map();


  /*
   * =======================================================
   * BUILD GET API URL
   * =======================================================
   */

  function buildURL(
    action,
    params = {}
  ) {

    const url =
      new URL(
        CONFIG.API_URL
      );


    url.searchParams.set(
      'action',
      action
    );


    Object.entries(params)
      .forEach(
        ([key, value]) => {

          if (
            value === undefined ||
            value === null ||
            value === ''
          ) {

            return;

          }


          url.searchParams.set(
            key,
            String(value)
          );

        }
      );


    return url.toString();

  }


  /*
   * =======================================================
   * GET REQUEST
   * =======================================================
   */

  async function get(
    action,
    params = {}
  ) {

    const requestURL =
      buildURL(
        action,
        params
      );


    /*
     * Reuse identical request
     * if already running.
     */

    if (
      activeRequests.has(
        requestURL
      )
    ) {

      return activeRequests.get(
        requestURL
      );

    }


    const request =
      performGetRequest(
        requestURL
      );


    activeRequests.set(
      requestURL,
      request
    );


    try {

      return await request;

    }

    finally {

      activeRequests.delete(
        requestURL
      );

    }

  }


  /*
   * =======================================================
   * PERFORM GET REQUEST
   * =======================================================
   */

  async function performGetRequest(
    requestURL
  ) {

    const controller =
      new AbortController();


    const timeout =
      setTimeout(
        function () {

          controller.abort();

        },

        CONFIG.API_TIMEOUT ||
        30000
      );


    try {

      const response =
        await fetch(
          requestURL,
          {

            method:
              'GET',

            cache:
              'no-store',

            redirect:
              'follow',

            signal:
              controller.signal

          }
        );


      if (!response.ok) {

        throw new Error(
          'Server returned HTTP ' +
          response.status
        );

      }


      const result =
        await response.json();


      if (
        !result ||
        result.success !== true
      ) {

        throw new Error(
          result?.message ||
          'API request failed.'
        );

      }


      return result;

    }

    catch (error) {

      if (
        error.name ===
        'AbortError'
      ) {

        throw new Error(
          'Request timed out. Please try again.'
        );

      }


      throw error;

    }

    finally {

      clearTimeout(
        timeout
      );

    }

  }


  /*
   * =======================================================
   * POST REQUEST
   * =======================================================
   */

  async function post(
    action,
    data = {}
  ) {

    const cleanAction =
      String(
        action || ''
      ).trim();


    if (!cleanAction) {

      throw new Error(
        'API action is required.'
      );

    }


    const payload = {

      action:
        cleanAction,

      ...data

    };


    return performPostRequest(
      payload
    );

  }


  /*
   * =======================================================
   * PERFORM POST REQUEST
   * =======================================================
   */

  async function performPostRequest(
    payload
  ) {

    const controller =
      new AbortController();


    const timeout =
      setTimeout(
        function () {

          controller.abort();

        },

        CONFIG.API_TIMEOUT ||
        30000
      );


    try {

      const response =
        await fetch(
          CONFIG.API_URL,
          {

            method:
              'POST',

            /*
             * IMPORTANT:
             *
             * Google Apps Script Web Apps work
             * reliably from GitHub Pages when
             * using text/plain for JSON payload.
             *
             * This also avoids unnecessary
             * browser preflight behaviour.
             */

            headers: {

              'Content-Type':
                'text/plain;charset=utf-8'

            },

            body:
              JSON.stringify(
                payload
              ),

            cache:
              'no-store',

            redirect:
              'follow',

            signal:
              controller.signal

          }
        );


      if (!response.ok) {

        throw new Error(
          'Server returned HTTP ' +
          response.status
        );

      }


      const result =
        await response.json();


      /*
       * IMPORTANT:
       *
       * Unlike GET, POST must return
       * failed API responses too.
       *
       * Example:
       * INVALID_OTP
       * INVALID_PASSWORD
       * INVALID_RESET_TOKEN
       *
       * Therefore we only reject malformed
       * server responses here.
       */

      if (
        !result ||
        typeof result.success !==
          'boolean'
      ) {

        throw new Error(
          'Invalid response from server.'
        );

      }


      return result;

    }

    catch (error) {

      if (
        error.name ===
        'AbortError'
      ) {

        throw new Error(
          'Request timed out. Please try again.'
        );

      }


      throw error;

    }

    finally {

      clearTimeout(
        timeout
      );

    }

  }


  /*
   * =======================================================
   * HEALTH
   * =======================================================
   */

  function health() {

    return get(
      'health'
    );

  }


  /*
   * =======================================================
   * PUBLIC JOBS
   * =======================================================
   */

  function getJobs(
    options = {}
  ) {

    return get(
      'getPublicJobs',
      {

        page:
          options.page || 1,

        limit:
          options.limit ||
          CONFIG.PAGINATION
            .JOBS_PER_PAGE,

        search:
          options.search || '',

        city:
          options.city || '',

        category:
          options.category || '',

        jobType:
          options.jobType || '',

        workMode:
          options.workMode || ''

      }
    );

  }


  /*
   * =======================================================
   * SINGLE PUBLIC JOB
   * =======================================================
   */

  function getJob(
    jobId
  ) {

    const id =
      String(
        jobId || ''
      ).trim();


    if (!id) {

      return Promise.reject(
        new Error(
          'Job ID is required.'
        )
      );

    }


    return get(
      'getPublicJob',
      {
        id: id
      }
    );

  }


  /*
   * =======================================================
   * CANDIDATE
   * REQUEST PASSWORD RESET OTP
   * =======================================================
   */

  function requestCandidatePasswordReset(
    email
  ) {

    const cleanEmail =
      String(
        email || ''
      )
        .trim()
        .toLowerCase();


    if (!cleanEmail) {

      return Promise.resolve({

        success:
          false,

        code:
          'EMAIL_REQUIRED',

        message:
          'Email address is required.',

        data:
          null

      });

    }


    return post(
      'requestCandidatePasswordReset',
      {

        email:
          cleanEmail

      }
    );

  }


  /*
   * =======================================================
   * CANDIDATE
   * VERIFY PASSWORD RESET OTP
   * =======================================================
   */

  function verifyCandidatePasswordResetOtp(
    email,
    otp
  ) {

    const cleanEmail =
      String(
        email || ''
      )
        .trim()
        .toLowerCase();


    const cleanOtp =
      String(
        otp || ''
      ).trim();


    if (
      !cleanEmail ||
      !cleanOtp
    ) {

      return Promise.resolve({

        success:
          false,

        code:
          'INVALID_REQUEST',

        message:
          'Email and verification code are required.',

        data:
          null

      });

    }


    return post(
      'verifyCandidatePasswordResetOtp',
      {

        email:
          cleanEmail,

        otp:
          cleanOtp

      }
    );

  }


  /*
   * =======================================================
   * CANDIDATE
   * RESET PASSWORD
   * =======================================================
   */

  function resetCandidatePassword(
    resetToken,
    newPassword
  ) {

    const cleanToken =
      String(
        resetToken || ''
      ).trim();


    const password =
      String(
        newPassword || ''
      );


    if (
      !cleanToken ||
      !password
    ) {

      return Promise.resolve({

        success:
          false,

        code:
          'INVALID_REQUEST',

        message:
          'Invalid password reset request.',

        data:
          null

      });

    }


    return post(
      'resetCandidatePassword',
      {

        resetToken:
          cleanToken,

        newPassword:
          password

      }
    );

  }


  /*
   * =======================================================
   * PUBLIC API
   * =======================================================
   */

  window.UCPP_API =
    Object.freeze({

      /*
       * Core
       */

      get,

      post,


      /*
       * System
       */

      health,


      /*
       * Public Jobs
       */

      getJobs,

      getJob,


      /*
       * Candidate Password Reset
       */

      requestCandidatePasswordReset,

      verifyCandidatePasswordResetOtp,

      resetCandidatePassword

    });


})();
