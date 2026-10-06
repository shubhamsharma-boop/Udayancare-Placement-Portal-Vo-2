// ======================================
// UCPP CONTACT MODULE
// Version : 1.0.0
// ======================================

const Contact = {

    // ===============================
    // INITIALIZE
    // ===============================

    init() {

        this.bindContactForm();

    },

    // ===============================
    // CONTACT FORM
    // ===============================

    bindContactForm() {

        const form =
        document.getElementById("contactForm");

        if (!form) return;

        form.addEventListener("submit", (e) => {

            e.preventDefault();

            this.submitEnquiry();

        });

    },

    // ===============================
    // SUBMIT ENQUIRY
    // ===============================

    async submitEnquiry() {

        const fullName =
        document.getElementById("fullName").value.trim();

        const mobile =
        document.getElementById("mobile").value.trim();

        const email =
        document.getElementById("email").value.trim();

        const subject =
        document.getElementById("subject").value;

        const message =
        document.getElementById("message").value.trim();

        // ===========================
        // VALIDATION
        // ===========================

        if (

            !fullName ||
            !mobile ||
            !email ||
            !subject ||
            !message

        ) {

            alert("Please fill all required fields.");

            return;

        }

        if (mobile.length != 10) {

            alert("Please enter a valid mobile number.");

            return;

        }

        // ===========================
        // BUTTON LOADING
        // ===========================

        const button =
        document.querySelector("#contactForm button[type='submit']");

        const oldText =
        button.innerHTML;

        button.disabled = true;

        button.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

        // ===========================
        // API CALL
        // ===========================

        const response =
        await API.submitEnquiry({

            fullName,

            mobile,

            email,

            subject,

            message

        });

        button.disabled = false;

        button.innerHTML = oldText;

        // ===========================
        // RESPONSE
        // ===========================

        if (response.success) {

            alert(response.message);

            document
            .getElementById("contactForm")
            .reset();

        }

        else {

            alert(response.message);

        }

    }

};

// ===============================
// START MODULE
// ===============================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        Contact.init();

    }

);
