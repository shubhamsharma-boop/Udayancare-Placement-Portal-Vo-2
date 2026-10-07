'use strict';

/*
 * =========================================================
 * UCPP V2
 * Core API Client
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
   * API requests running together.
   */
  const activeRequests =
    new Map();



  /*
   * =======================================================
   * BUILD API URL
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
     * If identical request is
     * already running, reuse it.
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
   * PERFORM GET
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

        CONFIG.API_TIMEOUT || 30000
      );


    try {

      const response =
        await fetch(
          requestURL,
          {

            method: 'GET',

            cache: 'no-store',

            redirect: 'follow',

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
          CONFIG.PAGINATION.JOBS_PER_PAGE,

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
   * PUBLIC API
   * =======================================================
   */

  window.UCPP_API =
    Object.freeze({

      get,

      health,

      getJobs,

      getJob

    });


})();
