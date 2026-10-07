'use strict';

/*
 * =========================================================
 * UCPP V2
 * Global Role-Aware Header / Navigation
 * =========================================================
 *
 * Current:
 * - Public navigation works immediately.
 *
 * Future:
 * - Candidate / Employer / Admin navigation is already
 *   structurally supported.
 * - Actual role will later come from secure V2 session.
 *
 * IMPORTANT:
 * - No fake authentication is created here.
 * - Navbar does not decide whether a user is authenticated.
 * =========================================================
 */

(function () {

  const headerMount =
    document.getElementById('siteHeader');


  if (!headerMount) {

    console.warn(
      'UCPP Header: #siteHeader element not found.'
    );

    return;

  }



  /*
   * =======================================================
   * PATH HELPERS
   * =======================================================
   */

  function getPathInfo() {

    const pathname =
      window.location.pathname
        .replace(/\\/g, '/');


    const segments =
      pathname
        .split('/')
        .filter(Boolean);


    const fileName =
      segments.length
        ? segments[segments.length - 1]
        : 'index.html';


    const parentFolder =
      segments.length >= 2
        ? segments[segments.length - 2].toLowerCase()
        : '';


    let area = 'public';


    if (parentFolder === 'candidate') {

      area = 'candidate';

    } else if (parentFolder === 'employer') {

      area = 'employer';

    } else if (parentFolder === 'admin') {

      area = 'admin';

    }


    return {

      pathname,

      fileName:
        fileName.toLowerCase(),

      area

    };

  }


  const pathInfo =
    getPathInfo();



  /*
   * =======================================================
   * ROOT PATH
   * =======================================================
   *
   * Public pages:
   * index.html
   *
   * Nested pages:
   * candidate/login.html
   *
   * Therefore nested areas require ../
   * =======================================================
   */

  function getRootPath() {

    if (
      pathInfo.area === 'candidate' ||
      pathInfo.area === 'employer' ||
      pathInfo.area === 'admin'
    ) {

      return '../';

    }


    return '';

  }


  const ROOT =
    getRootPath();



  /*
   * =======================================================
   * AUTH STATE
   * =======================================================
   *
   * For now authentication is NOT implemented.
   *
   * Later our secure session module will provide:
   *
   * window.UCPP_SESSION = {
   *   isAuthenticated: true,
   *   role: 'candidate'
   * }
   *
   * Until then everybody receives public navigation.
   * =======================================================
   */

  function getUserState() {

    const session =
      window.UCPP_SESSION;


    if (
      !session ||
      session.isAuthenticated !== true
    ) {

      return {
        authenticated: false,
        role: 'public'
      };

    }


    const role =
      String(
        session.role || ''
      )
        .trim()
        .toLowerCase();


    if (
      role !== 'candidate' &&
      role !== 'employer' &&
      role !== 'admin'
    ) {

      return {
        authenticated: false,
        role: 'public'
      };

    }


    return {
      authenticated: true,
      role
    };

  }



  /*
   * =======================================================
   * NAVIGATION CONFIGURATION
   * =======================================================
   */

  function getPublicNavigation() {

    return [

      {
        label: 'Home',
        href: ROOT + 'index.html',
        match: ['index.html']
      },

      {
        label: 'Jobs',
        href: ROOT + 'jobs.html',
        match: [
          'jobs.html',
          'job-details.html'
        ]
      },

      {
        label: 'About',
        href: ROOT + 'about.html',
        match: ['about.html']
      },

      {
        label: 'Contact',
        href: ROOT + 'contact.html',
        match: ['contact.html']
      }

    ];

  }



  function getCandidateNavigation() {

    return [

      {
        label: 'Dashboard',
        href: ROOT + 'candidate/dashboard.html',
        match: ['dashboard.html']
      },

      {
        label: 'Find Jobs',
        href: ROOT + 'candidate/available-jobs.html',
        match: [
          'available-jobs.html',
          'job-details.html'
        ]
      },

      {
        label: 'My Applications',
        href: ROOT + 'candidate/applications.html',
        match: ['applications.html']
      },

      {
        label: 'My Profile',
        href: ROOT + 'candidate/profile.html',
        match: ['profile.html']
      }

    ];

  }



  function getEmployerNavigation() {

    return [

      {
        label: 'Dashboard',
        href: ROOT + 'employer/dashboard.html',
        match: ['dashboard.html']
      },

      {
        label: 'Post Job',
        href: ROOT + 'employer/post-job.html',
        match: ['post-job.html']
      },

      {
        label: 'Manage Jobs',
        href: ROOT + 'employer/manage-jobs.html',
        match: ['manage-jobs.html']
      },

      {
        label: 'Applications',
        href: ROOT + 'employer/applications.html',
        match: ['applications.html']
      },

      {
        label: 'Shortlisted',
        href: ROOT + 'employer/shortlisted.html',
        match: ['shortlisted.html']
      },

      {
        label: 'Company Profile',
        href: ROOT + 'employer/company-profile.html',
        match: ['company-profile.html']
      }

    ];

  }



  function getAdminNavigation() {

    return [

      {
        label: 'Dashboard',
        href: ROOT + 'admin/dashboard.html',
        match: ['dashboard.html']
      },

      {
        label: 'Candidates',
        href: ROOT + 'admin/candidates.html',
        match: ['candidates.html']
      },

      {
        label: 'Employers',
        href: ROOT + 'admin/employers.html',
        match: ['employers.html']
      },

      {
        label: 'Jobs',
        href: ROOT + 'admin/jobs.html',
        match: ['jobs.html']
      },

      {
        label: 'Applications',
        href: ROOT + 'admin/applications.html',
        match: ['applications.html']
      },

      {
        label: 'Reports',
        href: ROOT + 'admin/reports.html',
        match: ['reports.html']
      },

      {
        label: 'Settings',
        href: ROOT + 'admin/settings.html',
        match: ['settings.html']
      }

    ];

  }



  /*
   * =======================================================
   * ACTIVE LINK
   * =======================================================
   */

  function isActive(item) {

    if (!item.match) {

      return false;

    }


    /*
     * Public job-details.html should activate Jobs.
     *
     * Nested candidate job-details.html will later activate
     * Find Jobs because role navigation is different.
     */

    return item.match.includes(
      pathInfo.fileName
    );

  }



  /*
   * =======================================================
   * ELEMENT HELPERS
   * =======================================================
   */

  function createElement(
    tag,
    className = '',
    text = ''
  ) {

    const element =
      document.createElement(tag);


    if (className) {

      element.className =
        className;

    }


    if (text) {

      element.textContent =
        text;

    }


    return element;

  }



  /*
   * =======================================================
   * BRAND
   * =======================================================
   */

  function createBrand(userState) {

    const brand =
      createElement(
        'a',
        'ucpp-brand'
      );


    if (
      userState.authenticated &&
      userState.role === 'admin'
    ) {

      brand.href =
        ROOT + 'admin/dashboard.html';

    } else {

      brand.href =
        ROOT + 'index.html';

    }


    const mark =
      createElement(
        'span',
        'ucpp-brand__mark'
      );


    mark.setAttribute(
      'aria-hidden',
      'true'
    );


    mark.textContent =
      'UC';


    const text =
      createElement(
        'span',
        'ucpp-brand__text'
      );


    const title =
      createElement(
        'strong',
        'ucpp-brand__title'
      );


    title.textContent =
      userState.role === 'admin'
        ? 'UCPP Admin'
        : 'Udayan Care';


    const subtitle =
      createElement(
        'span',
        'ucpp-brand__subtitle'
      );


    subtitle.textContent =
      userState.role === 'admin'
        ? 'Administration'
        : 'Placement Portal';


    text.append(
      title,
      subtitle
    );


    brand.append(
      mark,
      text
    );


    return brand;

  }



  /*
   * =======================================================
   * NAV LINKS
   * =======================================================
   */

  function createNavLink(item) {

    const link =
      createElement(
        'a',
        'ucpp-nav__link',
        item.label
      );


    link.href =
      item.href;


    if (isActive(item)) {

      link.classList.add(
        'is-active'
      );


      link.setAttribute(
        'aria-current',
        'page'
      );

    }


    return link;

  }



  /*
   * =======================================================
   * PUBLIC ACTIONS
   * =======================================================
   */

  function createPublicActions() {

    const actions =
      createElement(
        'div',
        'ucpp-header__actions'
      );


    const candidate =
      createElement(
        'a',
        'ucpp-header__login ucpp-header__login--candidate',
        'Candidate Login'
      );


    candidate.href =
      ROOT + 'candidate/login.html';


    const employer =
      createElement(
        'a',
        'ucpp-header__login ucpp-header__login--employer',
        'Employer Login'
      );


    employer.href =
      ROOT + 'employer/login.html';


    actions.append(
      candidate,
      employer
    );


    return actions;

  }



  /*
   * =======================================================
   * LOGOUT BUTTON
   * =======================================================
   */

  function createLogoutButton() {

    const button =
      createElement(
        'button',
        'ucpp-header__logout',
        'Logout'
      );


    button.type =
      'button';


    button.addEventListener(
      'click',
      function () {

        /*
         * Secure logout will be connected
         * when V2 Auth/Session module is built.
         */

        if (
          window.UCPP_SESSION &&
          typeof window.UCPP_SESSION.logout ===
            'function'
        ) {

          window.UCPP_SESSION.logout();

          return;

        }


        console.warn(
          'UCPP secure logout service is not available yet.'
        );

      }
    );


    return button;

  }



  /*
   * =======================================================
   * NAVIGATION BY ROLE
   * =======================================================
   */

  function getNavigationForState(
    userState
  ) {

    if (!userState.authenticated) {

      return getPublicNavigation();

    }


    switch (userState.role) {

      case 'candidate':
        return getCandidateNavigation();


      case 'employer':
        return getEmployerNavigation();


      case 'admin':
        return getAdminNavigation();


      default:
        return getPublicNavigation();

    }

  }



  /*
   * =======================================================
   * MOBILE MENU BUTTON
   * =======================================================
   */

  function createMenuButton() {

    const button =
      createElement(
        'button',
        'ucpp-menu-button'
      );


    button.type =
      'button';


    button.setAttribute(
      'aria-label',
      'Open navigation menu'
    );


    button.setAttribute(
      'aria-expanded',
      'false'
    );


    button.setAttribute(
      'aria-controls',
      'ucppNavigation'
    );


    for (
      let i = 0;
      i < 3;
      i++
    ) {

      button.appendChild(
        createElement(
          'span',
          'ucpp-menu-button__line'
        )
      );

    }


    return button;

  }



  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  function renderHeader() {

    const userState =
      getUserState();


    const navigationItems =
      getNavigationForState(
        userState
      );


    const header =
      createElement(
        'header',
        'ucpp-header'
      );


    const container =
      createElement(
        'div',
        'container ucpp-header__container'
      );


    /*
     * Brand
     */

    const brand =
      createBrand(
        userState
      );


    /*
     * Navigation
     */

    const navigation =
      createElement(
        'nav',
        'ucpp-nav'
      );


    navigation.id =
      'ucppNavigation';


    navigation.setAttribute(
      'aria-label',
      'Main navigation'
    );


    const links =
      createElement(
        'div',
        'ucpp-nav__links'
      );


    navigationItems.forEach(
      item => {

        links.appendChild(
          createNavLink(item)
        );

      }
    );


    navigation.appendChild(
      links
    );


    /*
     * Right actions
     */

    if (
      userState.authenticated
    ) {

      navigation.appendChild(
        createLogoutButton()
      );

    } else {

      navigation.appendChild(
        createPublicActions()
      );

    }


    /*
     * Mobile button
     */

    const menuButton =
      createMenuButton();


    container.append(
      brand,
      navigation,
      menuButton
    );


    header.appendChild(
      container
    );


    headerMount.replaceChildren(
      header
    );



    /*
     * =====================================================
     * MOBILE MENU EVENTS
     * =====================================================
     */

    function closeMenu() {

      navigation.classList.remove(
        'is-open'
      );


      menuButton.classList.remove(
        'is-open'
      );


      menuButton.setAttribute(
        'aria-expanded',
        'false'
      );


      menuButton.setAttribute(
        'aria-label',
        'Open navigation menu'
      );

    }


    function openMenu() {

      navigation.classList.add(
        'is-open'
      );


      menuButton.classList.add(
        'is-open'
      );


      menuButton.setAttribute(
        'aria-expanded',
        'true'
      );


      menuButton.setAttribute(
        'aria-label',
        'Close navigation menu'
      );

    }


    menuButton.addEventListener(
      'click',
      function () {

        const isOpen =
          navigation.classList.contains(
            'is-open'
          );


        if (isOpen) {

          closeMenu();

        } else {

          openMenu();

        }

      }
    );


    /*
     * Close after clicking a navigation link.
     */

    navigation
      .querySelectorAll('a')
      .forEach(
        link => {

          link.addEventListener(
            'click',
            closeMenu
          );

        }
      );


    /*
     * Escape closes mobile navigation.
     */

    document.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Escape'
        ) {

          closeMenu();

        }

      }
    );


    /*
     * If desktop size is restored,
     * clear mobile menu state.
     */

    window.addEventListener(
      'resize',
      function () {

        if (
          window.innerWidth > 980
        ) {

          closeMenu();

        }

      }
    );

  }



  /*
   * =======================================================
   * START
   * =======================================================
   */

  renderHeader();


})();
