
'use strict';

/*
 * =========================================================
 * UCPP V2 — Employer Registration
 * File: js/employer/register.js
 * Version: 1.0
 *
 * CURRENT MODE:
 * Frontend validation only.
 *
 * No production Employer_Master writes.
 * No registration API calls.
 *
 * Existing Employer Login / Dashboard unaffected.
 * =========================================================
 */

(function () {

  const form = document.getElementById(
    'employerRegisterForm'
  );

  if (!form) return;

  const fields = {
    companyName: document.getElementById('companyName'),
    companyType: document.getElementById('companyType'),
    industry: document.getElementById('industry'),
    website: document.getElementById('website'),
    companyDescription: document.getElementById('companyDescription'),
    contactPerson: document.getElementById('contactPerson'),
    designation: document.getElementById('designation'),
    mobile: document.getElementById('mobile'),
    email: document.getElementById('email'),
    state: document.getElementById('state'),
    district: document.getElementById('district'),
    city: document.getElementById('city'),
    companyAddress: document.getElementById('companyAddress'),
    gstNumber: document.getElementById('gstNumber'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirmPassword'),
    consent: document.getElementById('consent')
  };

  const errors = {};

  Object.keys(fields).forEach(function (key) {
    errors[key] = document.getElementById(
      key + 'Error'
    );
  });

  const status = document.getElementById(
    'registerStatus'
  );

  const submitButton = document.getElementById(
    'registerButton'
  );

  function value(key) {
    return String(
      fields[key] && fields[key].value || ''
    ).trim();
  }

  function clearError(key) {
    if (fields[key]) {
      fields[key].classList.remove('is-invalid');
      fields[key].removeAttribute('aria-invalid');
    }

    if (errors[key]) {
      errors[key].textContent = '';
      errors[key].hidden = true;
    }
  }

  function setError(key, message) {
    if (fields[key]) {
      fields[key].classList.add('is-invalid');
      fields[key].setAttribute('aria-invalid', 'true');
    }

    if (errors[key]) {
      errors[key].textContent = message;
      errors[key].hidden = false;
    }

    return false;
  }

  function clearStatus() {
    if (!status) return;

    status.hidden = true;
    status.textContent = '';
    status.className = 'register-status';
  }

  function showStatus(message, type) {
    if (!status) return;

    status.hidden = false;
    status.textContent = message;
    status.className =
      'register-status register-status--' + type;
  }

  function requiredText(key, label, minLength) {
    clearError(key);

    const text = value(key);

    if (text.length < (minLength || 2)) {
      return setError(
        key,
        'Please enter a valid ' + label + '.'
      );
    }

    return true;
  }

  function validateCompanyName() {
    return requiredText(
      'companyName',
      'company / organization name',
      2
    );
  }

  function validateIndustry() {
    clearError('industry');

    if (!value('industry')) {
      return setError(
        'industry',
        'Please select an industry.'
      );
    }

    return true;
  }

  function validateContactPerson() {
    return requiredText(
      'contactPerson',
      'contact person name',
      2
    );
  }

  function validateDesignation() {
    return requiredText(
      'designation',
      'designation',
      2
    );
  }

  function validateMobile() {
    clearError('mobile');

    if (!/^[6-9]\d{9}$/.test(value('mobile'))) {
      return setError(
        'mobile',
        'Enter a valid 10-digit mobile number.'
      );
    }

    return true;
  }

  function validateEmail() {
    clearError('email');

    const email = value('email');

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return setError(
        'email',
        'Enter a valid email address.'
      );
    }

    return true;
  }

  function validateState() {
    return requiredText(
      'state',
      'state',
      2
    );
  }

  function validateCity() {
    return requiredText(
      'city',
      'city',
      2
    );
  }

  function validateWebsite() {
    clearError('website');

    const website = value('website');

    if (!website) return true;

    try {
      const url = new URL(website);

      if (
        url.protocol !== 'https:' &&
        url.protocol !== 'http:'
      ) {
        throw new Error('Invalid protocol');
      }

      if (!url.hostname.includes('.')) {
        throw new Error('Invalid hostname');
      }

      return true;

    } catch (_) {
      return setError(
        'website',
        'Enter a valid website URL starting with https://'
      );
    }
  }

  function validateGST() {
    clearError('gstNumber');

    const gst = value('gstNumber').toUpperCase();

    if (!gst) return true;

    if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)
    ) {
      return setError(
        'gstNumber',
        'Enter a valid 15-character GSTIN.'
      );
    }

    return true;
  }

  function validatePassword() {
    clearError('password');

    const password = fields.password.value;

    if (password.length < 8) {
      return setError(
        'password',
        'Password must contain at least 8 characters.'
      );
    }

    if (
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return setError(
        'password',
        'Password must contain at least one letter and one number.'
      );
    }

    return true;
  }

  function validateConfirmPassword() {
    clearError('confirmPassword');

    if (!fields.confirmPassword.value) {
      return setError(
        'confirmPassword',
        'Please confirm your password.'
      );
    }

    if (
      fields.password.value !==
      fields.confirmPassword.value
    ) {
      return setError(
        'confirmPassword',
        'Passwords do not match.'
      );
    }

    return true;
  }

  function validateConsent() {
    clearError('consent');

    if (!fields.consent.checked) {
      return setError(
        'consent',
        'Please confirm the declaration before continuing.'
      );
    }

    return true;
  }

  function validateForm() {
    const results = [
      validateCompanyName(),
      validateIndustry(),
      validateContactPerson(),
      validateDesignation(),
      validateMobile(),
      validateEmail(),
      validateState(),
      validateCity(),
      validateWebsite(),
      validateGST(),
      validatePassword(),
      validateConfirmPassword(),
      validateConsent()
    ];

    return results.every(Boolean);
  }

  // Clean mobile input.

  fields.mobile.addEventListener('input', function () {
    this.value = this.value
      .replace(/\D/g, '')
      .slice(0, 10);
  });

  // Normalize GSTIN.

  fields.gstNumber.addEventListener('input', function () {
    this.value = this.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 15);
  });

  // Password visibility controls.

  form.querySelectorAll('.password-toggle')
    .forEach(function (button) {

      button.addEventListener('click', function () {
        const target = document.getElementById(
          this.dataset.target
        );

        if (!target) return;

        const reveal = target.type === 'password';

        target.type = reveal ? 'text' : 'password';
        this.textContent = reveal ? 'Hide' : 'Show';

        this.setAttribute(
          'aria-label',
          reveal ? 'Hide password' : 'Show password'
        );
      });

    });

  // Validate individual fields.

  const validators = {
    companyName: validateCompanyName,
    industry: validateIndustry,
    contactPerson: validateContactPerson,
    designation: validateDesignation,
    mobile: validateMobile,
    email: validateEmail,
    state: validateState,
    city: validateCity,
    website: validateWebsite,
    gstNumber: validateGST,
    password: validatePassword,
    confirmPassword: validateConfirmPassword,
    consent: validateConsent
  };

  Object.keys(validators).forEach(function (key) {
    const field = fields[key];

    if (!field) return;

    field.addEventListener(
      field.tagName === 'SELECT' ||
      field.type === 'checkbox'
        ? 'change'
        : 'blur',
      validators[key]
    );
  });

  fields.password.addEventListener('input', function () {
    if (fields.confirmPassword.value) {
      validateConfirmPassword();
    }
  });

  // Backend integration pending.
  // Keep account creation disabled until verified.

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.title =
      'Registration will be enabled after secure backend integration';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    clearStatus();

    if (!validateForm()) {
      showStatus(
        'Please check the highlighted fields.',
        'error'
      );

      const firstInvalid = form.querySelector(
        '.is-invalid'
      );

      if (firstInvalid) firstInvalid.focus();

      return;
    }

    showStatus(
      'Employer registration form is ready. Secure account creation will be enabled after backend integration.',
      'info'
    );
  });

})();
