// ======================================
// UCPP RESET PASSWORD
// Version: 1.0.0
// ======================================

document.addEventListener("DOMContentLoaded", function () {

    const form =
        document.getElementById("resetPasswordForm");

    if (!form) return;


    const emailInput =
        document.getElementById("email");

    const newPasswordInput =
        document.getElementById("newPassword");

    const confirmPasswordInput =
        document.getElementById("confirmPassword");


    // ================================
    // GET EMAIL FROM URL
    // ================================

    const params =
        new URLSearchParams(window.location.search);

    const email =
        params.get("email");


    if (!email) {

        alert(
            "Invalid password reset session. Please request a new OTP."
        );

        window.location.replace(
            "forgot-password.html"
        );

        return;

    }


    emailInput.value =
        decodeURIComponent(email);


    // ================================
    // FORM SUBMIT
    // ================================

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const newPassword =
                newPasswordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;


            // ============================
            // PASSWORD VALIDATION
            // ============================

            if (!newPassword) {

                alert(
                    "Please enter your new password."
                );

                return;

            }


            if (newPassword.length < 8) {

                alert(
                    "Password must be at least 8 characters long."
                );

                return;

            }


            if (!confirmPassword) {

                alert(
                    "Please confirm your new password."
                );

                return;

            }


            if (newPassword !== confirmPassword) {

                alert(
                    "Passwords do not match."
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
                '<i class="fa-solid fa-spinner fa-spin"></i> Resetting...';


            try {

                // ============================
                // RESET PASSWORD API
                // ============================

                const response =
                    await API.resetPassword({

                        email: email,

                        newPassword: newPassword

                    });


                if (response.success) {

                    alert(
                        response.message ||
                        "Password reset successfully."
                    );


                    // ========================
                    // REDIRECT TO LOGIN
                    // ========================

                    window.location.replace(
                        "candidate-login.html"
                    );

                }
                else {

                    alert(
                        response.message ||
                        "Unable to reset password."
                    );

                }

            }

            catch (error) {

                console.error(
                    "Reset password error:",
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
