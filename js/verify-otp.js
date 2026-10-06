// ======================================
// UCPP VERIFY PASSWORD RESET OTP
// Version: 1.0.0
// ======================================

document.addEventListener("DOMContentLoaded", function () {

    const form =
        document.getElementById("verifyOtpForm");

    if (!form) return;


    const emailInput =
        document.getElementById("email");

    const otpInput =
        document.getElementById("otp");


    // ================================
    // LOAD EMAIL FROM URL
    // ================================

    const params =
        new URLSearchParams(window.location.search);

    const emailFromURL =
        params.get("email");


    if (emailFromURL) {

        emailInput.value =
            decodeURIComponent(emailFromURL);

    }


    // ================================
    // OTP INPUT
    // ================================

    otpInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value
                .replace(/\D/g, "")
                .slice(0, 6);

        }
    );


    // ================================
    // FORM SUBMIT
    // ================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                emailInput.value.trim();

            const otp =
                otpInput.value.trim();


            // ============================
            // VALIDATION
            // ============================

            if (!email) {

                alert(
                    "Please enter your email address."
                );

                return;

            }


            if (!otp) {

                alert(
                    "Please enter the OTP."
                );

                return;

            }


            if (!/^\d{6}$/.test(otp)) {

                alert(
                    "Please enter a valid 6-digit OTP."
                );

                return;

            }


            const submitButton =
                form.querySelector(
                    "button[type='submit']"
                );


            const originalText =
                submitButton.innerHTML;


            submitButton.disabled = true;

            submitButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';


            try {

                // ============================
                // VERIFY OTP
                // ============================

                const response =
                    await API.verifyPasswordResetOTP({

                        email: email,

                        otp: otp

                    });


                if (response.success) {

                    // ========================
                    // GO TO RESET PASSWORD
                    // ========================

                    window.location.href =
                        "reset-password.html?email=" +
                        encodeURIComponent(email);

                }
                else {

                    alert(
                        response.message ||
                        "Invalid or expired OTP."
                    );

                }

            }

            catch (error) {

                console.error(
                    "OTP verification error:",
                    error
                );

                alert(
                    "Something went wrong. Please try again later."
                );

            }


            finally {

                submitButton.disabled = false;

                submitButton.innerHTML =
                    originalText;

            }

        }
    );

});
