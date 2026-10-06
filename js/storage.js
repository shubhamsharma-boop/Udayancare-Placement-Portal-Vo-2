// ======================================
// UCPP STORAGE SERVICE
// Version: 1.0.0
// ======================================

const Storage = {
    
    // ============================
    // CANDIDATE
    // ============================

    saveCandidate(data) {

        localStorage.setItem(
            CONFIG.STORAGE.CANDIDATE,
            JSON.stringify(data)
        );

    },

    getCandidate() {

        const data =
            localStorage.getItem(CONFIG.STORAGE.CANDIDATE);

        return data ? JSON.parse(data) : null;

    },

    removeCandidate() {

        localStorage.removeItem(
            CONFIG.STORAGE.CANDIDATE
        );

    },



    // ============================
    // EMPLOYER
    // ============================

    saveEmployer(data) {

        localStorage.setItem(
            CONFIG.STORAGE.EMPLOYER,
            JSON.stringify(data)
        );

    },

    getEmployer() {

        const data =
            localStorage.getItem(CONFIG.STORAGE.EMPLOYER);

        return data ? JSON.parse(data) : null;

    },

    removeEmployer() {

        localStorage.removeItem(
            CONFIG.STORAGE.EMPLOYER
        );

    },



    // ============================
    // ADMIN
    // ============================

    saveAdmin(data) {

        localStorage.setItem(
            CONFIG.STORAGE.ADMIN,
            JSON.stringify(data)
        );

    },

    getAdmin() {

        const data =
            localStorage.getItem(CONFIG.STORAGE.ADMIN);

        return data ? JSON.parse(data) : null;

    },

    removeAdmin() {

        localStorage.removeItem(
            CONFIG.STORAGE.ADMIN
        );

    },

    // ============================
// JOB
// ============================

saveJob(data){

localStorage.setItem(
CONFIG.STORAGE.JOB,
JSON.stringify(data)
);

},

getJob(){

const data=
localStorage.getItem(
CONFIG.STORAGE.JOB
);

return data ?
JSON.parse(data)
:null;

},

removeJob(){

localStorage.removeItem(
CONFIG.STORAGE.JOB
);

},


    // ============================
    // LOGOUT ALL
    // ============================

    clearAll(){

this.removeCandidate();
this.removeEmployer();
this.removeAdmin();
this.removeJob();

}
    
};

Object.freeze(Storage);
