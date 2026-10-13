
/**
 * UCPP V2 — Admin API Client
 * File: js/admin/admin-api.js
 * Version: 3.0
 *
 * Features:
 * - Secure admin login
 * - Session validation
 * - Logout
 * - Live dashboard metrics
 * - Reporting-period filters
 * - Protected CSV export requests
 *
 * Existing Candidate/Employer APIs unaffected.
 */

(function (window) {
  'use strict';

  const CONFIG = window.UCPP_ADMIN_CONFIG;

  if (!CONFIG) {
    console.error('UCPP Admin configuration is missing.');
    return;
  }

  function getApiUrl() {
    const url = String(CONFIG.API_URL || '').trim();

    if (!url) {
      throw new Error(
        'Admin API is not configured. Contact the system administrator.'
      );
    }

    let parsed;

    try {
      parsed = new URL(url);
    } catch (_) {
      throw new Error(
        'Invalid Admin API configuration.'
      );
    }

    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname !== 'script.google.com' ||
      !/^\/macros\/s\/[^/]+\/exec\/?$/.test(parsed.pathname) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(
        'Invalid Admin API endpoint.'
      );
    }

    return parsed.href;
  }

  function normalizeResponse(payload) {
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      throw new Error(
        'Invalid response received from the server.'
      );
    }

    return payload;
  }

  function generateSessionToken() {
    if (
      !window.isSecureContext ||
      !window.crypto ||
      typeof window.crypto.getRandomValues !== 'function'
    ) {
      throw new Error(
        'Secure browser cryptography is unavailable.'
      );
    }

    const bytes = new Uint8Array(32);

    window.crypto.getRandomValues(bytes);

    return Array.from(bytes, function (byte) {
      return byte.toString(16).padStart(2, '0');
    }).join('');
  }

  async function request(action, payload = {}) {
    const url = getApiUrl();

    if (
      typeof action !== 'string' ||
      !action.trim() ||
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      throw new Error(
        'Invalid Admin API request.'
      );
    }

    const controller = new AbortController();

    const timeoutMs =
      Number(CONFIG.REQUEST.TIMEOUT_MS) || 30000;

    const timeout = window.setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        credentials: 'omit',
        cache: 'no-store',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: JSON.stringify({
          ...payload,
          action
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(
          'Admin server request failed. Please try again.'
        );
      }

      return normalizeResponse(
        await response.json()
      );

    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new Error(
          'The server took too long to respond. Please try again.'
        );
      }

      if (error instanceof TypeError) {
        throw new Error(
          'Unable to connect to the Admin server. Check the deployment URL and network.'
        );
      }

      throw error;

    } finally {
      window.clearTimeout(timeout);
    }
  }

  /**
   * ADMIN LOGIN
   */
  function login(email, password) {
    const sessionToken = generateSessionToken();

    return request(CONFIG.ACTIONS.LOGIN, {
      email: String(email || '').trim(),
      password: String(password || ''),
      sessionToken
    });
  }

  /**
   * SESSION VALIDATION
   */
  function validateSession(token) {
    return request(CONFIG.ACTIONS.VALIDATE_SESSION, {
      token: String(token || '').trim()
    });
  }

  /**
   * LOGOUT
   */
  function logout(token) {
    return request(CONFIG.ACTIONS.LOGOUT, {
      token: String(token || '').trim()
    });
  }

  /**
   * DASHBOARD METRICS
   *
   * Supports:
   * all
   * this_month
   * last_month
   * custom
   */
  function getDashboard(token, options = {}) {
    return request(CONFIG.ACTIONS.DASHBOARD, {
      token: String(token || '').trim(),
      period: String(options.period || 'all'),
      startDate: String(options.startDate || ''),
      endDate: String(options.endDate || '')
    });
  }

  /**
   * SECURE REPORT EXPORT
   *
   * Backend currently supports CSV only.
   *
   * Supported segments:
   * candidates, employers, jobs,
   * applications, enquiries
   */
  function exportData(token, options = {}) {
    const segment = String(
      options.segment || ''
    ).trim().toLowerCase();

    const format = String(
      options.format || 'csv'
    ).trim().toLowerCase();

    const period = String(
      options.period || 'all'
    ).trim().toLowerCase();

    const allowedSegments = [
      'candidates',
      'employers',
      'jobs',
      'applications',
      'enquiries'
    ];

    if (!allowedSegments.includes(segment)) {
      return Promise.reject(
        new Error(
          'Selected report is not available yet.'
        )
      );
    }

    if (format !== 'csv') {
      return Promise.reject(
        new Error(
          'Excel export is not enabled yet. Please select CSV.'
        )
      );
    }

    return request('exportAdminData', {
      token: String(token || '').trim(),
      segment,
      format,
      period,
      startDate: String(options.startDate || ''),
      endDate: String(options.endDate || '')
    });
  }

  const API = Object.freeze({
    request,
    login,
    validateSession,
    logout,
    getDashboard,
    exportData
  });

  Object.defineProperty(
    window,
    'UCPP_ADMIN_API',
    {
      value: API,
      writable: false,
      configurable: false
    }
  );

})(window);
