// ======================================
// CANDIDATE DIGITAL PROFILE
// ======================================

let applicationID = "";

let profile = {};

// ======================================
// DATE FORMATTER
// ======================================

function formatDate(dateValue) {

    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return dateValue;
    }

    const day = String(date.getDate()).padStart(2, "0");

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const year = date.getFullYear();

    return `${day}/${month}/${year}`;

}

document.addEventListener("DOMContentLoaded", async () => {

    // ===============================
    // Read URL
    // ===============================

    const params = new URLSearchParams(window.location.search);

    applicationID = params.get("applicationID");

    if (!applicationID) {

        alert("Invalid Application.");

        window.close();

        return;

    }

    loadProfile();

});

// ======================================
// LOAD PROFILE
// ======================================

async function loadProfile() {

    const response = await API.getCandidateDigitalProfile({

        applicationID: applicationID

    });

    if (!response.success) {

        alert(response.message);

        return;

    }

    profile = response.profile;

    fillProfile();

}

// ======================================
// FILL PROFILE
// ======================================

function fillProfile() {

    // ==================================
    // BASIC INFORMATION
    // ==================================

    document.getElementById("fullName").textContent =
        profile.fullName || "";

    document.getElementById("candidateID").textContent =
        profile.candidateID || "";

    document.getElementById("shaliniID").textContent =
        profile.shaliniID || "";

    document.getElementById("profileStatus").textContent =
        profile.profileStatus || "";

    document.getElementById("pFullName").textContent =
        profile.fullName || "";

    document.getElementById("gender").textContent =
        profile.gender || "";

    document.getElementById("dob").textContent =
        profile.dob || "";

    document.getElementById("currentCity").textContent =
        profile.currentCity || "";

    document.getElementById("mobile").textContent =
        profile.mobile || "";

    document.getElementById("email").textContent =
        profile.email || "";


    // ==================================
    // EDUCATION
    // ==================================

    document.getElementById("education").textContent =
        profile.education || "";

    document.getElementById("qualification").textContent =
        profile.qualification || "";

    document.getElementById("passingYear").textContent =
        profile.passingYear || "";


    // ==================================
    // EMPLOYMENT
    // ==================================

    document.getElementById("employmentStatus").textContent =
        profile.employmentStatus || "";

    document.getElementById("experience").textContent =
        profile.experience || "";


    // ==================================
    // JOB PREFERENCES
    // ==================================

    document.getElementById("preferredLocation").textContent =
        profile.preferredLocation || "";

    document.getElementById("expectedSalary").textContent =
        profile.expectedSalary || "";


    // ==================================
    // ACCOUNT
    // ==================================

    document.getElementById("accProfileStatus").textContent =
        profile.profileStatus || "";

    document.getElementById("registrationDate").textContent =
    formatDate(profile.registrationDate);

document.getElementById("lastLogin").textContent =
    formatDate(profile.lastLogin);

    document.getElementById("accountStatus").textContent =
        profile.accountStatus || "";


    // ==================================
    // SKILLS
    // ==================================

    const skillsBox =
        document.getElementById("skillsContainer");

    skillsBox.innerHTML = "";

    if(profile.skills){

        profile.skills
            .split(",")
            .map(skill => skill.trim())
            .filter(skill => skill)
            .forEach(skill => {

                const chip =
                    document.createElement("span");

                chip.className = "skill-chip";

                chip.textContent = skill;

                skillsBox.appendChild(chip);

            });

    }


    // ==================================
    // EXPERIENCE
    // ==================================

    renderExperience();


    // ==================================
    // CERTIFICATIONS
    // ==================================

    renderCertifications();


    // ==================================
    // SOCIAL LINKS
    // ==================================

    renderSocialLinks();


    // ==================================
    // ABOUT CANDIDATE
    // ==================================

    const aboutBox =
        document.getElementById("aboutCandidate");

    if(aboutBox){

        aboutBox.textContent =
            profile.aboutCandidate || "Not provided.";

    }

}

// ======================================
// RENDER EXPERIENCE
// ======================================

function renderExperience(){

    const container =
        document.getElementById("experienceContainer");

    if(!container){
        return;
    }

    container.innerHTML = "";

    const experiences =
        Array.isArray(profile.experienceList)
            ? profile.experienceList
            : [];

    if(experiences.length === 0){

        container.innerHTML =
            `<p class="empty-profile-message">
                No professional experience added.
            </p>`;

        return;

    }

    experiences.forEach(exp => {

        const card =
            document.createElement("div");

        card.className =
            "profile-experience-card";

        card.innerHTML = `

            <div class="experience-header">

                <div>

                    <h4>
                        ${escapeHTML(
                            exp.jobTitle ||
                            exp.designation ||
                            "Professional Experience"
                        )}
                    </h4>

                    <p class="experience-company">

                        ${escapeHTML(
                            exp.companyName ||
                            exp.company ||
                            ""
                        )}

                    </p>

                </div>

                <span class="experience-duration">

                    ${escapeHTML(
                        exp.duration ||
                        ""
                    )}

                </span>

            </div>

            <div class="experience-details">

                ${
                    exp.location
                    ?
                    `<p>
                        <strong>Location:</strong>
                        ${escapeHTML(exp.location)}
                    </p>`
                    :
                    ""
                }

                ${
                    exp.startDate
                    ?
                    `<p>
                        <strong>Start:</strong>
                        ${escapeHTML(formatDate(exp.startDate))}
                    </p>`
                    :
                    ""
                }

                ${
                    exp.endDate
                    ?
                    `<p>
                        <strong>End:</strong>
                        ${escapeHTML(formatDate(exp.endDate))}
                    </p>`
                    :
                    ""
                }

                ${
                    exp.description
                    ?
                    `<p class="experience-description">
                        ${escapeHTML(exp.description)}
                    </p>`
                    :
                    ""
                }

            </div>
        `;

        container.appendChild(card);

    });

}


// ======================================
// RENDER CERTIFICATIONS
// ======================================

function renderCertifications(){

    const container =
        document.getElementById("certificationContainer");

    if(!container){
        return;
    }

    container.innerHTML = "";

    const certifications =
        Array.isArray(profile.certificationList)
            ? profile.certificationList
            : [];

    if(certifications.length === 0){

        container.innerHTML =
            `<p class="empty-profile-message">
                No certifications or courses added.
            </p>`;

        return;

    }

    certifications.forEach(cert => {

        const card =
            document.createElement("div");

        card.className =
            "profile-certification-card";

        let credentialHTML = "";

        if(cert.credentialURL){

            credentialHTML = `

                <a
                    href="${escapeHTML(cert.credentialURL)}"
                    target="_blank"
                    rel="noopener noreferrer">

                    <i class="fa-solid fa-arrow-up-right-from-square"></i>

                    View Credential

                </a>

            `;

        }

        card.innerHTML = `

            <div class="certification-header">

                <div>

                    <h4>

                        ${escapeHTML(
                            cert.certificationName ||
                            "Certification / Course"
                        )}

                    </h4>

                    <p>

                        ${escapeHTML(
                            cert.issuingOrganization ||
                            ""
                        )}

                    </p>

                </div>

            </div>

            <div class="certification-details">

                ${
                    cert.issueDate
                    ?
                    `<p>
                        <strong>Issue Date:</strong>
                        ${escapeHTML(formatDate(cert.issueDate))}
                    </p>`
                    :
                    ""
                }

                ${
                    cert.expiryDate
                    ?
                    `<p>
                        <strong>Expiry Date:</strong>
                        ${escapeHTML(formatDate(cert.expiryDate))}
                    </p>`
                    :
                    ""
                }

                ${
                    cert.credentialID
                    ?
                    `<p>
                        <strong>Credential ID:</strong>
                        ${escapeHTML(cert.credentialID)}
                    </p>`
                    :
                    ""
                }

                ${
                    cert.description
                    ?
                    `<p class="certification-description">
                        ${escapeHTML(cert.description)}
                    </p>`
                    :
                    ""
                }

                ${credentialHTML}

            </div>

        `;

        container.appendChild(card);

    });

}


// ======================================
// RENDER SOCIAL LINKS
// ======================================

function renderSocialLinks(){

    const container =
        document.getElementById("socialLinksContainer");

    if(!container){
        return;
    }

    container.innerHTML = "";

    const links =
        profile.socialLinks || {};

    const socialProfiles = [

        {
            name:"LinkedIn",
            icon:"fa-brands fa-linkedin",
            url:links.linkedin
        },

        {
            name:"Naukri",
            icon:"fa-solid fa-briefcase",
            url:links.naukri
        },

        {
            name:"Indeed",
            icon:"fa-solid fa-briefcase",
            url:links.indeed
        },

        {
            name:"Portfolio",
            icon:"fa-solid fa-globe",
            url:links.portfolio
        },

        {
            name:"GitHub",
            icon:"fa-brands fa-github",
            url:links.github
        },

        {
            name:"Other Profile",
            icon:"fa-solid fa-link",
            url:links.otherLink
        }

    ];

    const availableProfiles =
        socialProfiles.filter(
            profile => profile.url
        );

    if(availableProfiles.length === 0){

        container.innerHTML =
            `<p class="empty-profile-message">
                No professional social profiles added.
            </p>`;

        return;

    }

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "profile-social-links";

    availableProfiles.forEach(item => {

        const link =
            document.createElement("a");

        link.href = item.url;

        link.target = "_blank";

        link.rel = "noopener noreferrer";

        link.innerHTML = `

            <i class="${item.icon}"></i>

            <span>
                ${escapeHTML(item.name)}
            </span>

            <i class="fa-solid fa-arrow-up-right-from-square"></i>

        `;

        wrapper.appendChild(link);

    });

    container.appendChild(wrapper);

}


// ======================================
// HTML SECURITY HELPER
// ======================================

function escapeHTML(value){

    const div =
        document.createElement("div");

    div.textContent =
        value == null ? "" : String(value);

    return div.innerHTML;

}

// ======================================
// PRINT
// ======================================

document.getElementById("printResume").onclick = function () {

    window.print();

};

// ======================================
// DOWNLOAD PDF
// ======================================

document.getElementById("downloadPDF").onclick = function () {

    window.print();

};

// ======================================
// STATUS UPDATE
// ======================================

async function updateStatus(status) {

    const response = await API.updateApplicationStatus({

        applicationID: applicationID,

        status: status,

        remarks: ""

    });

    if (response.success) {

        alert("Status Updated Successfully.");

        location.reload();

    } else {

        alert(response.message);

    }

}

document.getElementById("btnViewed").onclick = () => {

    updateStatus("Viewed");

};

document.getElementById("btnShortlist").onclick = () => {

    updateStatus("Shortlisted");

};

document.getElementById("btnInterview").onclick = () => {

    updateStatus("Interview");

};

document.getElementById("btnReject").onclick = () => {

    updateStatus("Rejected");

};
