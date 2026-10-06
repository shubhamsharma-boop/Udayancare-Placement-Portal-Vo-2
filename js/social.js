// ======================================
// UCPP SOCIAL LINKS
// Version : 1.0.0
// ======================================

const SOCIAL = {

facebook: "https://www.facebook.com/udayancareindia",

linkedin: "https://www.linkedin.com/company/udayan-care",

instagram: "https://www.instagram.com/udayancare",

youtube: "https://www.youtube.com/@UdayanCare",

whatsapp: "https://wa.me/911127821333"

};

Object.freeze(SOCIAL);

// ======================================
// AUTO LINK BINDING
// ======================================

document.addEventListener("DOMContentLoaded",()=>{

const facebook=document.querySelectorAll(".social-facebook");
facebook.forEach(link=>link.href=SOCIAL.facebook);

const linkedin=document.querySelectorAll(".social-linkedin");
linkedin.forEach(link=>link.href=SOCIAL.linkedin);

const instagram=document.querySelectorAll(".social-instagram");
instagram.forEach(link=>link.href=SOCIAL.instagram);

const youtube=document.querySelectorAll(".social-youtube");
youtube.forEach(link=>link.href=SOCIAL.youtube);

const whatsapp=document.querySelectorAll(".social-whatsapp");
whatsapp.forEach(link=>link.href=SOCIAL.whatsapp);

});
