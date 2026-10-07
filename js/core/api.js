'use strict';

/*
 * UCPP V2
 * Central API Client
 */

(function () {

  if (!window.UCPP_CONFIG) {
    console.error(
      'UCPP_CONFIG is not available. Load config.js before api.js.'
    );
    return;
  }


  const activeRequests = new Map();


  /*
   * Build API URL
   */
  function buildURL(action, params = {}) {

    const url = new URL(
      window.UCPP_CONFIG.API_URL
    );

    url.searchParams.set(
      'action',
      action
    );


    Object.entries(params).forEach(
      ([key, value]) => {

        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ''
        ) {

          url.searchParams.set(
            key,
            String(value)
          );

        }

      }
    );


    return url.toString();

  }


  /*
   * Create unique request key
   *
   * Prevents duplicate API requests
   * for the same action + parameters.
   */
  function createRequestKey(
    action,
    params = {}
  ) {

    const sortedParams = {};

    Object
      .keys(params)
      .sort()
      .forEach(key => {

        sortedParams[key] =
          params[key];

      });


    return (
      action +
      ':' +
      JSON.stringify(sortedParams)
    );

  }


  /*
   * Perform GET request
   */
  async function performGet(
    action,
    params = {}
  ) {

    const controller =
      new AbortController();


    const timeout = setTimeout(
      () => controller.abort(),
      window.UCPP_CONFIG.API_TIMEOUT
    );


    try {

      const response = await fetch(
        buildURL(action, params),
        {
          method: 'GET',

          signal:
            controller.signal,

          cache:
            'no-store',

          redirect:
            'follow'
        }
      );


      if (!response.ok) {

        throw new Error(
          `HTTP Error ${response.status}`
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


      console.error(
        'UCPP API Error:',
        action,
        error
      );


      throw error;

    }

    finally {

      clearTimeout(timeout);

    }

  }


  /*
   * Deduplicated GET
   */
  async function get(
    action,
    params = {}
  ) {

    const requestKey =
      createRequestKey(
        action,
        params
      );


    /*
     * Same request already running?
     *
     * Return existing Promise instead
     * of hitting Apps Script again.
     */
    if (
      activeRequests.has(
        requestKey
      )
    ) {

      return activeRequests.get(
        requestKey
      );

    }


    const requestPromise =
      performGet(
        action,
        params
      );


    activeRequests.set(
      requestKey,
      requestPromise
    );


    try {

      return await requestPromise;

    }

    finally {

      activeRequests.delete(
        requestKey
      );

    }

  }


  /*
   * Backend health
   */
  function health() {

    return get(
      'health'
    );

  }


  /*
   * Public Jobs
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
          window.UCPP_CONFIG
            .PAGINATION
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
   * Public API
   */
  window.UCPP_API =
    Object.freeze({

      get,

      health,

      getJobs

    });


})();
