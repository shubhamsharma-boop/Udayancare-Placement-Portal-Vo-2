/*=========================================================
 UDAYAN CARE PLACEMENT PORTAL (UCPP)

 app.js v2.0

 Frontend Controller
 HTML + CSS + Google Apps Script API Ready

==========================================================*/


document.addEventListener("DOMContentLoaded",()=>{

 /*=========================================================
 WEBSITE CONFIG LOADER
==========================================================*/

function loadWebsiteConfig(){

// Phone
document.querySelectorAll("#sitePhone").forEach(el=>{
el.textContent = CONFIG.CONTACT.PHONE;
});

// Email
document.querySelectorAll("#siteEmail").forEach(el=>{
el.textContent = CONFIG.CONTACT.EMAIL;
});

// Address
document.querySelectorAll("#siteAddress").forEach(el=>{
el.textContent = CONFIG.CONTACT.ADDRESS;
});

// Facebook
document.querySelectorAll("#facebookLink").forEach(el=>{
el.href = CONFIG.SOCIAL.FACEBOOK;
el.target="_blank";
});

// LinkedIn
document.querySelectorAll("#linkedinLink").forEach(el=>{
el.href = CONFIG.SOCIAL.LINKEDIN;
el.target="_blank";
});

// Instagram
document.querySelectorAll("#instagramLink").forEach(el=>{
el.href = CONFIG.SOCIAL.INSTAGRAM;
el.target="_blank";
});

// WhatsApp
document.querySelectorAll("#whatsappLink").forEach(el=>{
el.href = CONFIG.SOCIAL.WHATSAPP;
el.target="_blank";
});

 // Logo
document.querySelectorAll(".siteLogo").forEach(el=>{
    el.src = CONFIG.LOGO.MAIN;
    el.alt = CONFIG.SITE.NAME;
});

// Site Name
document.querySelectorAll(".siteName").forEach(el=>{
    el.textContent = CONFIG.SITE.NAME;
});

// Tagline
document.querySelectorAll(".siteTagline").forEach(el=>{
    el.textContent = CONFIG.SITE.TAGLINE;
});

 // Site Description
document.querySelectorAll(".siteDescription").forEach(el=>{
    el.textContent = CONFIG.SITE.DESCRIPTION;
});

}

loadWebsiteConfig();


/*=========================================================
 GLOBAL CONFIGURATION
==========================================================*/


const API_URL = "YOUR_GOOGLE_SCRIPT_WEB_APP_URL";



/*=========================================================
 API REQUEST FUNCTION

 Used For:
 - Candidate Registration
 - Login
 - Jobs
 - Applications

==========================================================*/


window.apiRequest = async function(action,data={}){


try{


const response = await fetch(API_URL,{

method:"POST",

headers:{

"Content-Type":"text/plain"

},

body:JSON.stringify({

action:action,

data:data

})


});



const result = await response.json();


return result;



}

catch(error){


console.error(
"API Error:",
error
);



return {

success:false,

message:"Server connection failed"

};


}



};




/*=========================================================
 MOBILE MENU
==========================================================*/


const menuToggle =
document.querySelector(".menu-toggle");


const navMenu =
document.querySelector(".nav-menu");



if(menuToggle && navMenu){


menuToggle.addEventListener("click",()=>{


navMenu.classList.toggle("active");



menuToggle.innerHTML =
navMenu.classList.contains("active")

?
'<i class="fa-solid fa-xmark"></i>'

:
'<i class="fa-solid fa-bars"></i>';



});


}



/*=========================================================
 CLOSE MOBILE MENU
==========================================================*/


document.querySelectorAll(".nav-menu a")
.forEach(link=>{


link.addEventListener("click",()=>{


if(window.innerWidth<=992){


navMenu?.classList.remove("active");


if(menuToggle){

menuToggle.innerHTML =
'<i class="fa-solid fa-bars"></i>';

}


}



});


});





/*=========================================================
 STICKY HEADER
==========================================================*/


const header =
document.querySelector(".header");



window.addEventListener("scroll",()=>{


if(!header) return;



if(window.scrollY>50){


header.classList.add("scrolled");


}

else{


header.classList.remove("scrolled");


}



});





/*=========================================================
 ACTIVE PAGE
==========================================================*/


const currentPage =
window.location.pathname
.split("/")
.pop();



document.querySelectorAll(".nav-menu a")
.forEach(link=>{


const href =
link.getAttribute("href");



if(
href===currentPage ||
(currentPage==="" && href==="index.html")
){


link.classList.add("active");


}


});





/*=========================================================
 COUNTER ANIMATION
==========================================================*/


const counters =
document.querySelectorAll(".counter");



function animateCounter(counter){


const target =
parseInt(counter.innerText);



let count=0;


const speed =
target/80;



function update(){


if(count<target){


count += speed;


counter.innerText =
Math.ceil(count)+"+";


requestAnimationFrame(update);


}

else{


counter.innerText =
target+"+";


}


}



update();



}



const counterObserver =
new IntersectionObserver(entries=>{


entries.forEach(entry=>{


if(entry.isIntersecting){


animateCounter(entry.target);


counterObserver.unobserve(
entry.target
);


}



});


});



counters.forEach(counter=>{


counterObserver.observe(counter);


});





/*=========================================================
 SMOOTH SCROLL
==========================================================*/


document
.querySelectorAll('a[href^="#"]')
.forEach(anchor=>{


anchor.addEventListener("click",function(e){


const target =
document.querySelector(
this.getAttribute("href")
);



if(target){


e.preventDefault();


target.scrollIntoView({

behavior:"smooth"

});


}


});


});

/*=========================================================
 FORM HANDLER
==========================================================*/


const forms = document.querySelectorAll("form");



forms.forEach(form=>{


form.addEventListener("submit",async(e)=>{


if(form.dataset.api){


e.preventDefault();



const action =
form.dataset.api;



const formData =
new FormData(form);



const data =
Object.fromEntries(formData);



showLoader(form);



const response =
await apiRequest(
action,
data
);



hideLoader(form);



if(response.success){


showToast(
response.message || "Success",
"success"
);



form.reset();



}

else{


showToast(
response.message || "Something went wrong",
"error"
);


}



}



});


});





/*=========================================================
 PASSWORD TOGGLE
==========================================================*/


const passwordButtons =
document.querySelectorAll(".password-toggle");



passwordButtons.forEach(btn=>{


btn.addEventListener("click",()=>{


const input =
btn.parentElement
.querySelector("input");



if(!input) return;



if(input.type==="password"){


input.type="text";


btn.innerHTML =
'<i class="fa-solid fa-eye-slash"></i>';


}

else{


input.type="password";


btn.innerHTML =
'<i class="fa-solid fa-eye"></i>';


}



});


});





/*=========================================================
 LOADING STATE
==========================================================*/


function showLoader(form){


const button =
form.querySelector("button[type='submit']");


if(button){


button.dataset.text =
button.innerHTML;


button.innerHTML =
`
<i class="fa-solid fa-spinner fa-spin"></i>
Please Wait...
`;


button.disabled=true;


}


}




function hideLoader(form){


const button =
form.querySelector("button[type='submit']");



if(button){


button.innerHTML =
button.dataset.text || "Submit";


button.disabled=false;


}


}





/*=========================================================
 TOAST NOTIFICATION
==========================================================*/


window.showToast=function(message,type="success"){



const toast =
document.createElement("div");



toast.className =
"toast "+type;



toast.innerHTML =
message;



document.body.appendChild(toast);



setTimeout(()=>{


toast.classList.add("show");


},100);



setTimeout(()=>{


toast.remove();


},3500);



};





/*=========================================================
 JOB LOAD FUNCTION
==========================================================*/


window.loadJobs = async function(){



const jobContainer =
document.querySelector("#jobList");



if(!jobContainer) return;



jobContainer.innerHTML =
`
<div class="loading">

<div class="spinner"></div>

</div>
`;



const response =
await apiRequest(
"getJobs",
{}
);



if(response.success){



jobContainer.innerHTML="";



response.data.forEach(job=>{



jobContainer.innerHTML +=
`

<div class="job-card">


<span class="badge">
${job.Job_Type || "Full Time"}
</span>


<h3>
${job.Job_Title}
</h3>


<p>
<i class="fa-solid fa-building"></i>
${job.Company_Name}
</p>


<p>
<i class="fa-solid fa-location-dot"></i>
${job.Location}
</p>


<p>
<i class="fa-solid fa-indian-rupee-sign"></i>
${job.Salary}
</p>


<a href="job-details.html?id=${job.Job_ID}"
class="btn btn-primary">

View Details

</a>


</div>

`;



});



}

else{


jobContainer.innerHTML =
`
<p>No jobs available.</p>
`;

}


};






/*=========================================================
 APPLY JOB FUNCTION
==========================================================*/


window.applyJob = async function(jobId){



const user =
JSON.parse(
localStorage.getItem("candidate")
);



if(!user){


showToast(
"Please login first",
"error"
);


return;


}




const response =
await apiRequest(

"applyJob",

{

Job_ID:jobId,

Candidate_ID:user.Candidate_ID

}

);



if(response.success){


showToast(
"Application submitted",
"success"
);


}

else{


showToast(
response.message,
"error"
);


}



};





/*=========================================================
 LOGIN SESSION
==========================================================*/


window.saveSession=function(user){


localStorage.setItem(

"user",

JSON.stringify(user)

);


};





window.logout=function(){


localStorage.removeItem("user");

localStorage.removeItem("candidate");

localStorage.removeItem("employer");



window.location.href =
"index.html";


};





/*=========================================================
 BACK TO TOP
==========================================================*/


const backTop =
document.querySelector(".back-top");



if(backTop){


window.addEventListener("scroll",()=>{


if(window.scrollY>300){


backTop.classList.add("show");


}

else{


backTop.classList.remove("show");


}


});



backTop.addEventListener("click",()=>{


window.scrollTo({

top:0,

behavior:"smooth"

});


});


}




}); 


/*=========================================================
 END app.js v2.0
==========================================================*/
