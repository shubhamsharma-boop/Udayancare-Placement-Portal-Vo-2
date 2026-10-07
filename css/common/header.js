'use strict';

/*
 * UCPP V2
 * Common Header
 */

(function () {

  const headerTarget =
    document.getElementById('siteHeader');


  if (!headerTarget) {
    return;
  }


  /*
   * Detect whether page is inside
   * candidate/, employer/ or admin/
   */
  const path =
    window.location.pathname;


  const isNestedPage =
    path.includes('/candidate/') ||
    path.includes('/employer/') ||
    path.includes('/admin/');


  const root =
    isNestedPage ? '../' : '';


  /*
   * Current page
   */
  const currentPage =
    path.split('/').pop() ||
    'index.html';


  function activeClass(page) {

    return currentPage === page
      ? ' is-active'
      : '';

  }


  headerTarget.innerHTML = `
    <header class="site-header">

      <div class="container site-header__inner">

        <a
          href="${root}index.html"
          class="site-brand"
          aria-label="Udayan Care Placement Portal Home"
        >

          <span class="site-brand__text">

            <span class="site-brand__name">
              Udayan Care
            </span>

            <span class="site-brand__portal">
              Placement Portal
            </span>

          </span>

        </a>


        <nav
          class="site-nav"
          aria-label="Main navigation"
        >

          <a
            href="${root}index.html"
            class="site-nav__link${activeClass('index.html')}"
          >
            Home
          </a>

          <a
            href="${root}jobs.html"
            class="site-nav__link${activeClass('jobs.html')}"
          >
            Jobs
          </a>

          <a
            href="${root}about.html"
            class="site-nav__link${activeClass('about.html')}"
          >
            About
          </a>

          <a
            href="${root}contact.html"
            class="site-nav__link${activeClass('contact.html')}"
          >
            Contact
          </a>

        </nav>


        <div class="site-header__actions">

          <a
            href="${root}candidate/login.html"
            class="btn btn-outline"
          >
            Candidate Login
          </a>

          <a
            href="${root}employer/login.html"
            class="btn btn-primary"
          >
            Employer Login
          </a>

        </div>


        <button
          type="button"
          id="mobileMenuButton"
          class="mobile-menu-button"
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-controls="mobileNavigation"
        >

          <span
            class="mobile-menu-button__icon"
            aria-hidden="true"
          ></span>

        </button>

      </div>


      <div
        id="mobileNavigation"
        class="mobile-navigation"
      >

        <div class="container">

          <nav
            class="mobile-navigation__links"
            aria-label="Mobile navigation"
          >

            <a
              href="${root}index.html"
              class="site-nav__link${activeClass('index.html')}"
            >
              Home
            </a>

            <a
              href="${root}jobs.html"
              class="site-nav__link${activeClass('jobs.html')}"
            >
              Jobs
            </a>

            <a
              href="${root}about.html"
              class="site-nav__link${activeClass('about.html')}"
            >
              About
            </a>

            <a
              href="${root}contact.html"
              class="site-nav__link${activeClass('contact.html')}"
            >
              Contact
            </a>

          </nav>


          <div class="mobile-navigation__actions">

            <a
              href="${root}candidate/login.html"
              class="btn btn-outline"
            >
              Candidate Login
            </a>

            <a
              href="${root}employer/login.html"
              class="btn btn-primary"
            >
              Employer Login
            </a>

          </div>

        </div>

      </div>

    </header>
  `;


  const menuButton =
    document.getElementById(
      'mobileMenuButton'
    );


  const mobileNavigation =
    document.getElementById(
      'mobileNavigation'
    );


  if (
    !menuButton ||
    !mobileNavigation
  ) {
    return;
  }


  function closeMenu() {

    menuButton.classList.remove(
      'is-open'
    );

    mobileNavigation.classList.remove(
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


  menuButton.addEventListener(
    'click',
    function () {

      const isOpen =
        mobileNavigation.classList.toggle(
          'is-open'
        );


      menuButton.classList.toggle(
        'is-open',
        isOpen
      );


      menuButton.setAttribute(
        'aria-expanded',
        String(isOpen)
      );


      menuButton.setAttribute(
        'aria-label',
        isOpen
          ? 'Close navigation menu'
          : 'Open navigation menu'
      );

    }
  );


  mobileNavigation.addEventListener(
    'click',
    function (event) {

      if (
        event.target.closest('a')
      ) {
        closeMenu();
      }

    }
  );


  window.addEventListener(
    'resize',
    function () {

      if (
        window.innerWidth > 900
      ) {
        closeMenu();
      }

    }
  );


})();
