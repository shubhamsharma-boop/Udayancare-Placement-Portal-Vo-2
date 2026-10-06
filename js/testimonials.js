const testimonials=[
{
name:"Priya Sharma",
job:"Customer Support Executive",
company:"Teleperformance",
text:"Udayan Care helped me prepare for interviews and I got my first corporate job."
},

{
name:"Neha Kumari",
job:"HR Associate",
company:"HCLTech",
text:"The placement team guided me throughout the recruitment process."
},

{
name:"Anjali Verma",
job:"Operations Executive",
company:"Genpact",
text:"My digital profile helped recruiters shortlist me quickly."
},

{
name:"Pooja Singh",
job:"Process Associate",
company:"Wipro",
text:"I gained confidence through mock interviews and secured my job."
},

{
name:"Riya Gupta",
job:"MIS Executive",
company:"Infosys BPM",
text:"The portal made applying for jobs simple and transparent."
},

{
name:"Komal Yadav",
job:"Customer Success Associate",
company:"Tech Mahindra",
text:"I received interview calls within a few days of applying."
},

{
name:"Sakshi Sharma",
job:"HR Coordinator",
company:"Quess Corp",
text:"Career counselling improved my confidence significantly."
},

{
name:"Aarti Verma",
job:"Recruitment Executive",
company:"Vision India",
text:"The placement support was available at every stage."
},

{
name:"Megha Singh",
job:"Back Office Executive",
company:"Concentrix",
text:"Today I am financially independent because of this opportunity."
},

{
name:"Nidhi Kumari",
job:"Office Executive",
company:"PolicyBazaar",
text:"I learned professional communication before joining."
},

{
name:"Shivani Sharma",
job:"Customer Advisor",
company:"ICICI Bank",
text:"The complete hiring process was smooth and transparent."
},

{
name:"Kajal Verma",
job:"HR Executive",
company:"TCS",
text:"The career guidance sessions were extremely helpful."
},

{
name:"Muskan",
job:"Sales Coordinator",
company:"Airtel",
text:"My confidence improved after every interview session."
},

{
name:"Deepika",
job:"Operations Associate",
company:"Amazon",
text:"I never imagined getting placed so quickly."
},

{
name:"Pallavi",
job:"Process Executive",
company:"Capgemini",
text:"The portal connected me with verified employers only."
},

{
name:"Sneha",
job:"Executive",
company:"Accenture",
text:"Every step was easy from registration to final selection."
},

{
name:"Ruchi",
job:"HR Assistant",
company:"Deloitte",
text:"The placement team continuously motivated me."
},

{
name:"Preeti",
job:"Associate",
company:"Coforge",
text:"My profile reached multiple recruiters through one platform."
},

{
name:"Khushboo",
job:"Customer Executive",
company:"Paytm",
text:"The digital resume feature is very useful."
},

{
name:"Monika",
job:"Operations Executive",
company:"Infosys",
text:"Today I proudly support my family through my job."
}

];

const track=document.querySelector(".testimonial-track");

let html="";

testimonials.forEach(t=>{

html+=`

<div class="testimonial-card">

<div class="quote-icon">

<i class="fa-solid fa-quote-left"></i>

</div>

<p class="testimonial-text">

${t.text}

</p>

<div class="rating">

★★★★★

</div>

<h4>

${t.name}

</h4>

<p>

${t.job}

</p>

<small>

${t.company}

</small>

</div>

`;

});

track.innerHTML=html+html;
