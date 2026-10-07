'use strict';

/*
 * =========================================================
 * UCPP V2
 * Candidate Login
 *
 * CURRENT MODE:
 * UI + validation only.
 *
 * Real authentication will be connected to the
 * secure V2 backend in the next phase.
 * =========================================================
 */

(function () {

  const form =
    document.getElementById(
      'candidateLoginForm'
    );


  if (!form) {
    return;
  }


  const email =
    document.getElementById(
      'loginEmail'
    );


  const password =
    document.getElementById(
      'loginPassword'
    );


  const emailError =
    document.getElementById(
      'loginEmailError'
    );


  const passwordError =
    document.getElementById(
      'loginPasswordError'
    );


  const status =
    document.getElementById(
      'loginStatus'
    );


  const passwordToggle =
    document.getElementById(
      'passwordToggle'
    );


  /*
   * STATUS
   */

  function clearStatus() {

    status.hidden = true;

    status.textContent = '';

    status.className =
      'login-status';

  }


  function showStatus(
    message,
    type
  ) {

    status.hidden = false;

    status.textContent =
      message;

    status.className =
      'login-status login-status--' +
      type;

  }


  /*
   * ERROR
   */

  function clearError(
    field,
    errorElement
  ) {

    field.classList.remove(
      'is-invalid'
    );


    errorElement.hidden = true;

    errorElement.textContent = '';

  }


  function showError(
    field,
    errorElement,
    message
  ) {

    field.classList.add(
      'is-invalid'
    );


    errorElement.textContent =
      message;


    errorElement.hidden =
      false;

  }


  /*
   * EMAIL
   */

  function validateEmail() {

    clearError(
      email,
      emailError
    );


    const value =
      email.value.trim();


    const pattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!pattern.test(value)) {

      showError(
        email,
        emailError,
        'Enter a valid registered email address.'
      );

      return false;

    }


    return true;

  }


  /*
   * PASSWORD
   */

  function validatePassword() {

    clearError(
      password,
      passwordError
    );


    if (!password.value) {

      showError(
        password,
        passwordError,
        'Please enter your password.'
      );

      return false;

    }


    return true;

  }


  /*
   * PASSWORD SHOW / HIDE
   */

  passwordToggle.addEventListener(
    'click',
    function () {

      const shouldShow =
        password.type ===
        'password';


      password.type =
        shouldShow
          ? 'text'
          : 'password';


      passwordToggle.textContent =
        shouldShow
          ? 'Hide'
          : 'Show';


      passwordToggle.setAttribute(
        'aria-label',
        shouldShow
          ? 'Hide password'
          : 'Show password'
      );

    }
  );


  /*
   * FIELD VALIDATION
   */

  email.addEventListener(
    'blur',
    validateEmail
  );


  password.addEventListener(
    'blur',
    validatePassword
  );


  email.addEventListener(
    'input',
    function () {

      if (
        email.classList.contains(
          'is-invalid'
        )
      ) {

        validateEmail();

      }

    }
  );


  password.addEventListener(
    'input',
    function () {

      if (
        password.classList.contains(
          'is-invalid'
        )
      ) {

        validatePassword();

      }

    }
  );


  /*
   * SUBMIT
   */

  form.addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      clearStatus();


      const emailValid =
        validateEmail();


      const passwordValid =
        validatePassword();


      if (
        !emailValid ||
        !passwordValid
      ) {

        showStatus(
          'Please check your login details.',
          'error'
        );


        const invalidField =
          form.querySelector(
            '.is-invalid'
          );


        invalidField?.focus();


        return;

      }


      /*
       * IMPORTANT
       *
       * No V1 authentication is performed here.
       *
       * No Password_Hash is changed.
       *
       * No fake frontend session is created.
       */

      showStatus(
        'Candidate login interface is ready. Secure V2 authentication will be connected in the next phase.',
        'info'
      );

    }
  );


})();
