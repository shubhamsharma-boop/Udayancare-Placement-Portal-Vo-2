'use strict';

/*
 * =========================================================
 * UCPP V2
 * Candidate Registration
 *
 * CURRENT MODE:
 * UI + validation only.
 *
 * NO production Candidate_Master write is performed.
 * =========================================================
 */

(function () {

  const form =
    document.getElementById(
      'candidateRegisterForm'
    );


  if (!form) {
    return;
  }


  const fields = {

    fullName:
      document.getElementById('fullName'),

    mobile:
      document.getElementById('mobile'),

    email:
      document.getElementById('email'),

    currentCity:
      document.getElementById('currentCity'),

    gender:
      document.getElementById('gender'),

    dob:
      document.getElementById('dob'),

    password:
      document.getElementById('password'),

    confirmPassword:
      document.getElementById('confirmPassword'),

    consent:
      document.getElementById('consent')

  };


  const errors = {

    fullName:
      document.getElementById('fullNameError'),

    mobile:
      document.getElementById('mobileError'),

    email:
      document.getElementById('emailError'),

    currentCity:
      document.getElementById('currentCityError'),

    gender:
      document.getElementById('genderError'),

    dob:
      document.getElementById('dobError'),

    password:
      document.getElementById('passwordError'),

    confirmPassword:
      document.getElementById('confirmPasswordError'),

    consent:
      document.getElementById('consentError')

  };


  const status =
    document.getElementById(
      'registerStatus'
    );


  /*
   * VALUE
   */

  function value(field) {

    return String(
      field?.value || ''
    ).trim();

  }


  /*
   * ERROR
   */

  function setError(
    field,
    error,
    message
  ) {

    field?.classList.add(
      'is-invalid'
    );


    if (error) {

      error.textContent =
        message;

      error.hidden =
        false;

    }

  }


  function clearError(
    field,
    error
  ) {

    field?.classList.remove(
      'is-invalid'
    );


    if (error) {

      error.textContent = '';

      error.hidden = true;

    }

  }


  /*
   * STATUS
   */

  function clearStatus() {

    status.hidden = true;

    status.textContent = '';

    status.className =
      'register-status';

  }


  function showStatus(
    message,
    type
  ) {

    status.hidden = false;

    status.textContent =
      message;

    status.className =
      'register-status register-status--' +
      type;

  }


  /*
   * NAME
   */

  function validateName() {

    clearError(
      fields.fullName,
      errors.fullName
    );


    const name =
      value(fields.fullName);


    if (name.length < 2) {

      setError(
        fields.fullName,
        errors.fullName,
        'Please enter your full name.'
      );

      return false;

    }


    return true;

  }


  /*
   * MOBILE
   */

  function validateMobile() {

    clearError(
      fields.mobile,
      errors.mobile
    );


    const mobile =
      value(fields.mobile);


    if (
      !/^[6-9][0-9]{9}$/.test(
        mobile
      )
    ) {

      setError(
        fields.mobile,
        errors.mobile,
        'Enter a valid 10-digit mobile number.'
      );

      return false;

    }


    return true;

  }


  /*
   * EMAIL
   */

  function validateEmail() {

    clearError(
      fields.email,
      errors.email
    );


    const email =
      value(fields.email);


    const pattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !pattern.test(email)
    ) {

      setError(
        fields.email,
        errors.email,
        'Enter a valid email address.'
      );

      return false;

    }


    return true;

  }


  /*
   * CITY
   */

  function validateCity() {

    clearError(
      fields.currentCity,
      errors.currentCity
    );


    if (
      value(fields.currentCity).length < 2
    ) {

      setError(
        fields.currentCity,
        errors.currentCity,
        'Please enter your current city.'
      );

      return false;

    }


    return true;

  }


  /*
   * GENDER
   */

  function validateGender() {

    clearError(
      fields.gender,
      errors.gender
    );


    if (!value(fields.gender)) {

      setError(
        fields.gender,
        errors.gender,
        'Please select gender.'
      );

      return false;

    }


    return true;

  }


  /*
   * DOB
   */

  function validateDOB() {

    clearError(
      fields.dob,
      errors.dob
    );


    const dob =
      value(fields.dob);


    if (!dob) {

      setError(
        fields.dob,
        errors.dob,
        'Please select your date of birth.'
      );

      return false;

    }


    const selected =
      new Date(
        dob + 'T00:00:00'
      );


    const today =
      new Date();


    if (
      Number.isNaN(
        selected.getTime()
      ) ||
      selected > today
    ) {

      setError(
        fields.dob,
        errors.dob,
        'Please enter a valid date of birth.'
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
      fields.password,
      errors.password
    );


    const password =
      fields.password.value;


    if (password.length < 8) {

      setError(
        fields.password,
        errors.password,
        'Password must contain at least 8 characters.'
      );

      return false;

    }


    if (
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {

      setError(
        fields.password,
        errors.password,
        'Password must contain at least one letter and one number.'
      );

      return false;

    }


    return true;

  }


  /*
   * CONFIRM PASSWORD
   */

  function validateConfirmPassword() {

    clearError(
      fields.confirmPassword,
      errors.confirmPassword
    );


    if (
      !fields.confirmPassword.value
    ) {

      setError(
        fields.confirmPassword,
        errors.confirmPassword,
        'Please confirm your password.'
      );

      return false;

    }


    if (
      fields.password.value !==
      fields.confirmPassword.value
    ) {

      setError(
        fields.confirmPassword,
        errors.confirmPassword,
        'Passwords do not match.'
      );

      return false;

    }


    return true;

  }


  /*
   * CONSENT
   */

  function validateConsent() {

    errors.consent.hidden = true;

    errors.consent.textContent = '';


    if (
      !fields.consent.checked
    ) {

      errors.consent.textContent =
        'Please confirm before continuing.';

      errors.consent.hidden =
        false;

      return false;

    }


    return true;

  }


  /*
   * ALL
   */

  function validateForm() {

    const checks = [

      validateName(),

      validateMobile(),

      validateEmail(),

      validateCity(),

      validateGender(),

      validateDOB(),

      validatePassword(),

      validateConfirmPassword(),

      validateConsent()

    ];


    return checks.every(Boolean);

  }


  /*
   * MOBILE CLEANING
   */

  fields.mobile.addEventListener(
    'input',
    function () {

      this.value =
        this.value
          .replace(/\D/g, '')
          .slice(0, 10);

    }
  );


  /*
   * PASSWORD TOGGLE
   */

  document
    .querySelectorAll(
      '.password-toggle'
    )
    .forEach(function (button) {

      button.addEventListener(
        'click',
        function () {

          const target =
            document.getElementById(
              this.dataset.target
            );


          if (!target) {
            return;
          }


          const show =
            target.type ===
            'password';


          target.type =
            show
              ? 'text'
              : 'password';


          this.textContent =
            show
              ? 'Hide'
              : 'Show';


          this.setAttribute(
            'aria-label',
            show
              ? 'Hide password'
              : 'Show password'
          );

        }
      );

    });


  /*
   * DOB MAX
   */

  const today =
    new Date();


  const year =
    today.getFullYear();


  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, '0');


  const day =
    String(
      today.getDate()
    ).padStart(2, '0');


  fields.dob.max =
    `${year}-${month}-${day}`;


  /*
   * BLUR VALIDATION
   */

  fields.fullName.addEventListener(
    'blur',
    validateName
  );


  fields.mobile.addEventListener(
    'blur',
    validateMobile
  );


  fields.email.addEventListener(
    'blur',
    validateEmail
  );


  fields.currentCity.addEventListener(
    'blur',
    validateCity
  );


  fields.gender.addEventListener(
    'change',
    validateGender
  );


  fields.dob.addEventListener(
    'change',
    validateDOB
  );


  fields.password.addEventListener(
    'blur',
    function () {

      validatePassword();


      if (
        fields.confirmPassword.value
      ) {

        validateConfirmPassword();

      }

    }
  );


  fields.confirmPassword.addEventListener(
    'blur',
    validateConfirmPassword
  );


  /*
   * SUBMIT
   */

  form.addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      clearStatus();


      if (!validateForm()) {

        showStatus(
          'Please check the highlighted fields before continuing.',
          'error'
        );


        const firstInvalid =
          form.querySelector(
            '.is-invalid'
          );


        firstInvalid?.focus();


        return;

      }


      /*
       * IMPORTANT
       *
       * We intentionally stop here.
       *
       * Candidate_Master is NOT modified.
       * Existing V1 Password_Hash is NOT modified.
       */

      showStatus(
        'Registration form is ready. Secure account creation will be enabled after the V2 registration service is connected.',
        'info'
      );

    }
  );


})();
