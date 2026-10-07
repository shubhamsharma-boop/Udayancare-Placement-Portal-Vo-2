'use strict';

/*
 * =========================================================
 * UCPP V2
 * Session Manager
 * =========================================================
 *
 * SECURITY RULES
 *
 * 1. Password is NEVER stored in browser storage.
 * 2. OTP is NEVER stored here.
 * 3. Candidate / Employer / Admin private data is NOT stored.
 * 4. Authentication will ultimately be verified by backend.
 * 5. This module only manages an authenticated V2 session.
 *
 * Backend session API will be connected later.
 * =========================================================
 */

(function () {

  const STORAGE_KEY =
    'ucpp_v2_session';


  const VALID_ROLES =
    new Set([
      'candidate',
      'employer',
      'admin'
    ]);


  /*
   * =======================================================
   * SAFE JSON
   * =======================================================
   */

  function parseJSON(value) {

    try {

      return JSON.parse(value);

    } catch (error) {

      return null;

    }

  }


  /*
   * =======================================================
   * NORMALIZE ROLE
   * =======================================================
   */

  function normalizeRole(role) {

    const value =
      String(role || '')
        .trim()
        .toLowerCase();


    return VALID_ROLES.has(value)
      ? value
      : '';

  }


  /*
   * =======================================================
   * READ SESSION
   * =======================================================
   */

  function readStoredSession() {

    const raw =
      sessionStorage.getItem(
        STORAGE_KEY
      );


    if (!raw) {

      return null;

    }


    const data =
      parseJSON(raw);


    if (
      !data ||
      data.isAuthenticated !== true
    ) {

      clearStoredSession();

      return null;

    }


    const role =
      normalizeRole(
        data.role
      );


    if (!role) {

      clearStoredSession();

      return null;

    }


    if (
      !data.sessionToken ||
      typeof data.sessionToken !==
        'string'
    ) {

      clearStoredSession();

      return null;

    }


    return {

      isAuthenticated: true,

      role,

      sessionToken:
        data.sessionToken,

      userId:
        String(
          data.userId || ''
        ),

      displayName:
        String(
          data.displayName || ''
        )

    };

  }


  /*
   * =======================================================
   * STORE SESSION
   * =======================================================
   *
   * This function will only be called after the backend
   * successfully authenticates the user.
   * =======================================================
   */

  function setSession(data) {

    if (!data) {

      throw new Error(
        'Session data is required.'
      );

    }


    const role =
      normalizeRole(
        data.role
      );


    if (!role) {

      throw new Error(
        'Invalid session role.'
      );

    }


    const sessionToken =
      String(
        data.sessionToken || ''
      ).trim();


    if (!sessionToken) {

      throw new Error(
        'Session token is required.'
      );

    }


    const session = {

      isAuthenticated: true,

      role,

      sessionToken,

      userId:
        String(
          data.userId || ''
        ),

      displayName:
        String(
          data.displayName || ''
        )

    };


    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(session)
    );


    syncPublicState(
      session
    );


    return session;

  }


  /*
   * =======================================================
   * CLEAR SESSION
   * =======================================================
   */

  function clearStoredSession() {

    sessionStorage.removeItem(
      STORAGE_KEY
    );

  }


  /*
   * =======================================================
   * CURRENT SESSION
   * =======================================================
   */

  function getSession() {

    return readStoredSession();

  }


  /*
   * =======================================================
   * AUTH CHECK
   * =======================================================
   */

  function isAuthenticated() {

    return Boolean(
      readStoredSession()
    );

  }


  /*
   * =======================================================
   * ROLE CHECK
   * =======================================================
   */

  function hasRole(requiredRole) {

    const session =
      readStoredSession();


    if (!session) {

      return false;

    }


    return (
      session.role ===
      normalizeRole(requiredRole)
    );

  }


  /*
   * =======================================================
   * PUBLIC STATE
   * =======================================================
   *
   * header.js reads window.UCPP_SESSION.
   * =======================================================
   */

  function syncPublicState(session) {

    if (!session) {

      window.UCPP_SESSION = {

        isAuthenticated: false,

        role: 'public',

        logout

      };


      return;

    }


    window.UCPP_SESSION = {

      isAuthenticated: true,

      role:
        session.role,

      userId:
        session.userId,

      displayName:
        session.displayName,

      logout

    };

  }


  /*
   * =======================================================
   * LOGOUT
   * =======================================================
   *
   * Backend session invalidation will be added when
   * authentication APIs are built.
   * =======================================================
   */

  function logout() {

    const session =
      readStoredSession();


    clearStoredSession();


    syncPublicState(null);


    let redirect =
      'index.html';


    const path =
      window.location.pathname;


    if (
      path.includes('/candidate/') ||
      path.includes('/employer/') ||
      path.includes('/admin/')
    ) {

      redirect =
        '../index.html';

    }


    /*
     * Until backend session invalidation exists,
     * this clears only the frontend session.
     */

    window.location.replace(
      redirect
    );


    return session;

  }


  /*
   * =======================================================
   * REQUIRE AUTH
   * =======================================================
   */

  function requireAuth(
    requiredRole
  ) {

    const session =
      readStoredSession();


    if (!session) {

      return false;

    }


    if (
      requiredRole &&
      session.role !==
        normalizeRole(requiredRole)
    ) {

      return false;

    }


    return true;

  }


  /*
   * =======================================================
   * INITIALIZE
   * =======================================================
   */

  const existingSession =
    readStoredSession();


  syncPublicState(
    existingSession
  );


  /*
   * Developer API
   *
   * setSession exists for the future login module.
   * We are NOT calling it manually or creating fake users.
   */

  window.UCPP_SESSION_MANAGER =
    Object.freeze({

      getSession,

      setSession,

      isAuthenticated,

      hasRole,

      requireAuth,

      logout

    });


})();
