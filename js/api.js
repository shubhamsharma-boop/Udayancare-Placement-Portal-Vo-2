/**
 * UCPP V2 - CENTRAL API CLIENT
 * Version: 2.0.0
 */

(function () {
  'use strict';

  if (!window.UCPP_CONFIG) {
    console.error('UCPP_CONFIG not loaded. Load config.js before api.js.');
    return;
  }

  const activeRequests = new Map();

  /**
   * Build API URL
   */
  function buildURL(action, params = {}) {

    const url = new URL(window.UCPP_CONFIG.API_URL);

    url.searchParams.set('action', action);

    Object.entries(params).forEach(([key, value]) => {

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ) {
        url.searchParams.set(key, value);
      }

    });

    return url.toString();
  }


  /**
   * Create unique request key
   */
  function createRequestKey(action, params) {

    const sortedParams = Object.keys(params || {})
      .sort()
      .reduce((result, key) => {

        result[key] = params[key];

        return result;

      }, {});

    return action + ':' + JSON.stringify(sortedParams);
  }


  /**
   * Main GET request
   */
  async function get(action, params = {}) {

    const requestKey = createRequestKey(action, params);

    /*
     * If identical request is already running,
     * return same Promise instead of another API call.
     */
    if (activeRequests.has(requestKey)) {
      return activeRequests.get(requestKey);
    }

    const requestPromise = performGet(action, params);

    activeRequests.set(requestKey, requestPromise);

    try {

      return await requestPromise;

    } finally {

      activeRequests.delete(requestKey);

    }
  }


  /**
   * Actual network request
   */
  async function performGet(action, params) {

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, window.UCPP_CONFIG.API_TIMEOUT || 15000);

    try {

      const response = await fetch(
        buildURL(action, params),
        {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(
          'HTTP Error ' + response.status
        );
      }

      const result = await response.json();

      if (!result || result.success !== true) {

        throw new Error(
          result?.message ||
          'API request failed'
        );

      }

      return result;

    } catch (error) {

      if (error.name === 'AbortError') {

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

    } finally {

      clearTimeout(timeout);

    }
  }


  /**
   * Public Jobs
   */
  function getJobs(options = {}) {

    return get('getPublicJobs', {

      page:
        options.page ||
        1,

      limit:
        options.limit ||
        window.UCPP_CONFIG.JOBS_PER_PAGE ||
        10,

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

    });

  }


  /**
   * API Health Check
   */
  function health() {

    return get('health');

  }


  /**
   * Expose only required methods globally
   */
  window.UCPP_API = Object.freeze({

    get,
    getJobs,
    health

  });

})();
