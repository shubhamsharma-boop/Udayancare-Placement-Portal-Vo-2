
/**
 * UCPP V2 — Admin API Client
 * File: js/admin/admin-api.js
 * Version: 1.0
 *
 * Handles:
 * - Admin login
 * - Session validation
 * - Admin logout
 * - Protected dashboard requests
 *
 * Does not modify existing Candidate/Employer APIs.
 *
 * SECURITY:
 * - Never logs passwords or session tokens.
 * - Requires HTTPS Apps Script endpoint.
 * - Does not automatically persist tokens.
 * - Backend remains the authority for authentication.
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
      throw new Error('Invalid Admin API configuration.');
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
      throw new Error('Invalid Admin API endpoint.');
    }

    return parsed.href;
  }

  function normalizeResponse(payload) {
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      throw new Error('Invalid response received from the server.');
    }

    return payload;
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
      throw new Error('Invalid Admin API request.');
    }

    const controller = new AbortController();

    const timeoutMs =
      Number(CONFIG.REQUEST.TIMEOUT_MS) || 30000;

    const timeout = window.setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      /*
       * text/plain avoids a CORS preflight for this
       * Apps Script POST request.
       *
       * Never use mode: 'no-cors' because that produces
       * an unreadable opaque response.
       */
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

      const result = normalizeResponse(
        await response.json()
      );

      return result;

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

  function login(email, password) {
    return request(CONFIG.ACTIONS.LOGIN, {
      email: String(email || '').trim(),
      password: String(password || '')
    });
  }

  function validateSession(token) {
    return request(CONFIG.ACTIONS.VALIDATE_SESSION, {
      token: String(token || '').trim()
    });
  }

  function logout(token) {
    return request(CONFIG.ACTIONS.LOGOUT, {
      token: String(token || '').trim()
    });
  }

  function getDashboard(token) {
    return request(CONFIG.ACTIONS.DASHBOARD, {
      token: String(token || '').trim()
    });
  }

  const API = Object.freeze({
    request,
    login,
    validateSession,
    logout,
    getDashboard
  });

  Object.defineProperty(window, 'UCPP_ADMIN_API', {
    value: API,
    writable: false,
    configurable: false
  });

})(window);
