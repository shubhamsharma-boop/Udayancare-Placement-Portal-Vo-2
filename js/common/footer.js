'use strict';

/*
 * UCPP V2
 * Common Footer
 */

(function () {

  const footerTarget =
    document.getElementById('siteFooter');


  if (!footerTarget) {
    return;
  }


  const path =
    window.location.pathname;


  const isNestedPage =
    path.includes('/candidate/') ||
    path.includes('/employer/') ||
    path.includes('/admin/');


  const root =
    isNestedPage ? '../' : '';


  const currentYear =
    new Date().getFullYear();


  footerTarget.innerHTML = `
    <footer class="site-footer">

      <div class="container site-footer__main">

        <div>

          <div class="site-footer__title">
            Udayan Care Placement Portal
          </div>

          <p class="site-footer__description">
            Connecting candidates with employment
            opportunities and supporting their journey
            towards meaningful careers.
          </p>

        </div>


        <div>

          <div class="site-footer__heading">
            Quick Links
          </div>

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
                About
              </a>
            </li>

            <li>
              <a href="${root}contact.html">
                Contact
              </a>
            </li>

          </ul>

        </div>


        <div>

          <div class="site-footer__heading">
            Portal
          </div>

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
              <a href="${root}employer/login.html">
                Employer Login
              </a>
            </li>

            <li>
              <a href="${root}employer/register.html">
                Employer Registration
              </a>
            </li>

          </ul>

        </div>

      </div>


      <div class="site-footer__bottom">

        <div class="container site-footer__bottom-inner">

          <p>
            © ${currentYear} Udayan Care.
            All rights reserved.
          </p>

          <p>
            Making Young Lives Shine Through Employment
          </p>

        </div>

      </div>

    </footer>
  `;


})();

