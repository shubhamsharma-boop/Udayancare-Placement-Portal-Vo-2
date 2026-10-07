'use strict';

/*
 * =========================================================
 * UCPP V2
 * Global Footer
 * =========================================================
 */

(function () {

  const footerTarget =
    document.getElementById(
      'siteFooter'
    );


  if (!footerTarget) {
    return;
  }


  /*
   * PATH
   */

  const path =
    window.location.pathname;


  const isNestedPage =
    path.includes('/candidate/') ||
    path.includes('/employer/') ||
    path.includes('/admin/');


  const root =
    isNestedPage
      ? '../'
      : '';


  const currentYear =
    new Date().getFullYear();


  /*
   * RENDER
   */

  footerTarget.innerHTML = `

    <footer class="site-footer">


      <div class="container site-footer__main">


        <!-- BRAND -->

        <div class="site-footer__brand">

          <a
            href="${root}index.html"
            class="site-footer__brand-header"
          >

            <span class="site-footer__logo">
              UC
            </span>


            <span>

              <strong>
                Udayan Care
              </strong>

              <small>
                Placement Portal
              </small>

            </span>

          </a>


          <p class="site-footer__description">

            Connecting candidates with employment
            opportunities and supporting their journey
            towards meaningful careers.

          </p>


          <div class="site-footer__badge">

            Making Young Lives Shine Through Employment

          </div>

        </div>



        <!-- QUICK LINKS -->

        <div class="site-footer__column">

          <h3>
            Quick Links
          </h3>


          <ul class="site-footer__links">

            <li>
              <a href="${root}index.html">
                Home
              </a>
            </li>

            <li>
              <a href="${root}jobs.html">
                Find Jobs
              </a>
            </li>

            <li>
              <a href="${root}about.html">
                About Us
              </a>
            </li>

            <li>
              <a href="${root}contact.html">
                Contact
              </a>
            </li>

          </ul>

        </div>



        <!-- CANDIDATES -->

        <div class="site-footer__column">

          <h3>
            For Candidates
          </h3>


          <ul class="site-footer__links">

            <li>
              <a href="${root}candidate/login.html">
                Candidate Login
              </a>
            </li>

            <li>
              <a href="${root}candidate/register.html">
                Candidate Registration
              </a>
            </li>

            <li>
              <a href="${root}jobs.html">
                Explore Jobs
              </a>
            </li>

            <li>
              <a href="${root}candidate/applications.html">
                My Applications
              </a>
            </li>

          </ul>

        </div>



        <!-- EMPLOYERS -->

        <div class="site-footer__column">

          <h3>
            For Employers
          </h3>


          <ul class="site-footer__links">

            <li>
              <a href="${root}employer/login.html">
                Employer Login
              </a>
            </li>

            <li>
              <a href="${root}employer/register.html">
                Employer Registration
              </a>
            </li>

            <li>
              <a href="${root}employer/post-job.html">
                Post a Job
              </a>
            </li>

            <li>
              <a href="${root}employer/applications.html">
                Applications
              </a>
            </li>

          </ul>

        </div>


      </div>



      <!-- BOTTOM -->

      <div class="site-footer__bottom">

        <div class="container site-footer__bottom-inner">


          <p>
            © ${currentYear} Udayan Care.
            All rights reserved.
          </p>


          <p class="site-footer__initiative">
            An Initiative of Udayan Care
          </p>


        </div>

      </div>


    </footer>

  `;


})();
