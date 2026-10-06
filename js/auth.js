// ======================================
// UCPP AUTH SERVICE
// Version: 1.1.0
// ======================================

const Auth = {

    // ============================
    // CANDIDATE
    // ============================

    isCandidateLoggedIn() {

        return Storage.getCandidate() !== null;

    },


    requireCandidateLogin(
        loginPage = "candidate-login.html"
    ) {

        if (!this.isCandidateLoggedIn()) {

            window.location.replace(loginPage);

        }

    },


    logoutCandidate(
        loginPage = "candidate-login.html"
    ) {

        try {

            Storage.removeCandidate();

        } catch (error) {

            console.error(
                "Candidate logout error:",
                error
            );

        }

        window.location.replace(loginPage);

    },


    // ============================
    // EMPLOYER
    // ============================

    isEmployerLoggedIn() {

        return Storage.getEmployer() !== null;

    },


    requireEmployerLogin(
        loginPage = "employer-login.html"
    ) {

        if (!this.isEmployerLoggedIn()) {

            window.location.replace(loginPage);

        }

    },


    logoutEmployer(
        loginPage = "employer-login.html"
    ) {

        try {

            Storage.removeEmployer();

        } catch (error) {

            console.error(
                "Employer logout error:",
                error
            );

        }

        window.location.replace(loginPage);

    },


    // ============================
    // ADMIN
    // ============================

    isAdminLoggedIn() {

        return Storage.getAdmin() !== null;

    },


    requireAdminLogin(
        loginPage = "admin-login.html"
    ) {

        if (!this.isAdminLoggedIn()) {

            window.location.replace(loginPage);

        }

    },


    logoutAdmin(
        loginPage = "admin-login.html"
    ) {

        try {

            Storage.removeAdmin();

        } catch (error) {

            console.error(
                "Admin logout error:",
                error
            );

        }

        window.location.replace(loginPage);

    },


    // ============================
    // LOGOUT ALL
    // ============================

    logoutAll(
        homePage = "../index.html"
    ) {

        try {

            Storage.clearAll();

        } catch (error) {

            console.error(
                "Logout all error:",
                error
            );

        }

        window.location.replace(homePage);

    }

};

Object.freeze(Auth);
