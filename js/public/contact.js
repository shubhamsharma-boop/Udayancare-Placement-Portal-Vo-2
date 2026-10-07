'use strict';

/*
 * =========================================================
 * UCPP V2
 * Public Contact Page
 *
 * Current mode:
 * UI + client-side validation only.
 *
 * Production Enquiries sheet is NOT modified.
 * =========================================================
 */

(function () {


  /*
   * =======================================================
   * ELEMENTS
   * =======================================================
   */

  const form =
    document.getElementById(
      'contactForm'
    );


  if (!form) {
    return;
  }


  const elements = {

    name:
      document.getElementById(
        'contactName'
      ),

    mobile:
      document.getElementById(
        'contactMobile'
      ),

    email:
      document.getElementById(
        'contactEmail'
      ),

    subject:
      document.getElementById(
        'contactSubject'
      ),

    message:
      document.getElementById(
        'contactMessage'
      ),

    nameError:
      document.getElementById(
        'contactNameError'
      ),

    mobileError:
      document.getElementById(
        'contactMobileError'
      ),

    emailError:
      document.getElementById(
        'contactEmailError'
      ),

    subjectError:
      document.getElementById(
        'contactSubjectError'
      ),

    messageError:
      document.getElementById(
        'contactMessageError'
      ),

    counter:
      document.getElementById(
        'messageCounter'
      ),

    status:
      document.getElementById(
        'contactStatus'
      ),

    submit:
      document.getElementById(
        'contactSubmit'
      )

  };



  /*
   * =======================================================
   * HELPERS
   * =======================================================
   */

  function value(element) {

    return String(
      element?.value || ''
    ).trim();

  }


  function showFieldError(
    input,
    errorElement,
    message
  ) {

    input?.classList.add(
      'is-invalid'
    );


    if (errorElement) {

      errorElement.textContent =
        message;

      errorElement.hidden =
        false;

    }

  }


  function clearFieldError(
    input,
    errorElement
  ) {

    input?.classList.remove(
      'is-invalid'
    );


    if (errorElement) {

      errorElement.textContent =
        '';

      errorElement.hidden =
        true;

    }

  }


  function clearAllErrors() {

    clearFieldError(
      elements.name,
      elements.nameError
    );


    clearFieldError(
      elements.mobile,
      elements.mobileError
    );


    clearFieldError(
      elements.email,
      elements.emailError
    );


    clearFieldError(
      elements.subject,
      elements.subjectError
    );


    clearFieldError(
      elements.message,
      elements.messageError
    );

  }



  /*
   * =======================================================
   * STATUS
   * =======================================================
   */

  function showStatus(
    message,
    type = 'info'
  ) {

    elements.status.hidden =
      false;


    elements.status.className =
      'contact-status contact-status--' +
      type;


    elements.status.textContent =
      message;

  }


  function clearStatus() {

    elements.status.hidden =
      true;


    elements.status.className =
      'contact-status';


    elements.status.textContent =
      '';

  }



  /*
   * =======================================================
   * VALIDATION
   * =======================================================
   */

  function validateName() {

    const name =
      value(elements.name);


    clearFieldError(
      elements.name,
      elements.nameError
    );


    if (!name) {

      showFieldError(
        elements.name,
        elements.nameError,
        'Please enter your full name.'
      );

      return false;

    }


    if (name.length < 2) {

      showFieldError(
        elements.name,
        elements.nameError,
        'Please enter a valid name.'
      );

      return false;

    }


    return true;

  }



  function validateMobile() {

    const mobile =
      value(elements.mobile);


    clearFieldError(
      elements.mobile,
      elements.mobileError
    );


    if (!mobile) {

      showFieldError(
        elements.mobile,
        elements.mobileError,
        'Please enter your mobile number.'
      );

      return false;

    }


    if (
      !/^[6-9][0-9]{9}$/.test(
        mobile
      )
    ) {

      showFieldError(
        elements.mobile,
        elements.mobileError,
        'Please enter a valid 10-digit mobile number.'
      );

      return false;

    }


    return true;

  }



  function validateEmail() {

    const email =
      value(elements.email);


    clearFieldError(
      elements.email,
      elements.emailError
    );


    if (!email) {

      showFieldError(
        elements.email,
        elements.emailError,
        'Please enter your email address.'
      );

      return false;

    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !emailPattern.test(
        email
      )
    ) {

      showFieldError(
        elements.email,
        elements.emailError,
        'Please enter a valid email address.'
      );

      return false;

    }


    return true;

  }



  function validateSubject() {

    const subject =
      value(elements.subject);


    clearFieldError(
      elements.subject,
      elements.subjectError
    );


    if (!subject) {

      showFieldError(
        elements.subject,
        elements.subjectError,
        'Please select an enquiry type.'
      );

      return false;

    }


    return true;

  }



  function validateMessage() {

    const message =
      value(elements.message);


    clearFieldError(
      elements.message,
      elements.messageError
    );


    if (!message) {

      showFieldError(
        elements.message,
        elements.messageError,
        'Please enter your message.'
      );

      return false;

    }


    if (message.length < 10) {

      showFieldError(
        elements.message,
        elements.messageError,
        'Please provide a little more detail about your enquiry.'
      );

      return false;

    }


    if (message.length > 1500) {

      showFieldError(
        elements.message,
        elements.messageError,
        'Message cannot exceed 1500 characters.'
      );

      return false;

    }


    return true;

  }



  function validateForm() {

    clearAllErrors();


    const results = [

      validateName(),

      validateMobile(),

      validateEmail(),

      validateSubject(),

      validateMessage()

    ];


    return results.every(
      Boolean
    );

  }



  /*
   * =======================================================
   * MOBILE INPUT
   * =======================================================
   */

  elements.mobile
    ?.addEventListener(
      'input',
      function () {

        this.value =
          this.value
            .replace(
              /\D/g,
              ''
            )
            .slice(
              0,
              10
            );


        if (
          this.classList.contains(
            'is-invalid'
          )
        ) {

          validateMobile();

        }

      }
    );



  /*
   * =======================================================
   * MESSAGE COUNTER
   * =======================================================
   */

  function updateMessageCounter() {

    const length =
      elements.message
        ?.value
        .length || 0;


    elements.counter.textContent =
      length + ' / 1500';

  }


  elements.message
    ?.addEventListener(
      'input',
      function () {

        updateMessageCounter();


        if (
          this.classList.contains(
            'is-invalid'
          )
        ) {

          validateMessage();

        }

      }
    );


  updateMessageCounter();



  /*
   * =======================================================
   * LIVE VALIDATION
   * =======================================================
   */

  elements.name
    ?.addEventListener(
      'blur',
      validateName
    );


  elements.mobile
    ?.addEventListener(
      'blur',
      validateMobile
    );


  elements.email
    ?.addEventListener(
      'blur',
      validateEmail
    );


  elements.subject
    ?.addEventListener(
      'change',
      validateSubject
    );


  elements.message
    ?.addEventListener(
      'blur',
      validateMessage
    );



  /*
   * =======================================================
   * FORM SUBMIT
   * =======================================================
   */

  form.addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      clearStatus();


      const isValid =
        validateForm();


      if (!isValid) {

        showStatus(
          'Please check the highlighted fields and complete the required information.',
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
       * IMPORTANT:
       *
       * UCPP V2 is currently operating
       * in read-only development mode.
       *
       * We intentionally do NOT send
       * this data to the production
       * Enquiries sheet yet.
       */

      showStatus(
        'The enquiry form is ready. Online submission will be enabled after the secure enquiry service is activated.',
        'info'
      );

    }
  );


})();
