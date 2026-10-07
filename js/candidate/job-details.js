document.addEventListener("DOMContentLoaded",()=>{
"use strict";

const API=window.UCPP_API;
const els={};
let jobId="";
let loading=false;

function cacheElements(){
[
"jobDetailsSkeleton","jobDetailsContent","jobNotFound","jobNotFoundMessage",
"jobLoadError","jobLoadErrorMessage","retryJobButton","jobCompany","jobTitle",
"jobStatus","jobMeta","jobPostedDate","jobDeadline","jobDescription",
"responsibilitiesSection","jobResponsibilities","skillsSection","jobSkills",
"jobType","jobWorkMode","jobExperience","jobQualification","jobVacancies",
"jobCategory","jobSalary","jobLocation","jobLastDate","applyJobButton",
"applyHelp","sidebarCompany","jobAddress"
].forEach(id=>els[id]=document.getElementById(id));
}

function safe(value){
return String(value??"")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}

function value(obj,...keys){
for(const key of keys){
if(obj&&obj[key]!==undefined&&obj[key]!==null&&String(obj[key]).trim()!==""){
return String(obj[key]).trim();
}
}
return "";
}

function parseDate(input){
if(!input)return null;
const date=new Date(input);
return Number.isNaN(date.getTime())?null:date;
}

function formatDate(input){
const date=parseDate(input);
if(!date)return "";
return date.toLocaleDateString("en-IN",{
day:"2-digit",
month:"short",
year:"numeric"
});
}

function formatSalary(min,max){
const minValue=String(min??"").trim();
const maxValue=String(max??"").trim();
if(!minValue&&!maxValue)return "Not specified";
const format=v=>{
if(!v)return "";
const numeric=Number(String(v).replace(/[₹,\s]/g,""));
if(Number.isFinite(numeric)){
return "₹"+numeric.toLocaleString("en-IN");
}
return v.startsWith("₹")?v:"₹"+v;
};
if(minValue&&maxValue)return `${format(minValue)} - ${format(maxValue)}`;
if(minValue)return `From ${format(minValue)}`;
return `Up to ${format(maxValue)}`;
}

function buildLocation(job){
const parts=[
value(job,"City"),
value(job,"District"),
value(job,"State")
].filter(Boolean);
return [...new Set(parts)].join(", ")||"Not specified";
}

function buildAddress(job){
const address=value(job,"Address");
const location=buildLocation(job);
if(address&&location!=="Not specified")return `${address}, ${location}`;
return address||location||"Location details not available.";
}

function splitSkills(input){
if(!input)return [];
return String(input)
.split(/[,;|]/)
.map(item=>item.trim())
.filter(Boolean)
.filter((item,index,array)=>array.indexOf(item)===index);
}

function showSkeleton(){
els.jobDetailsSkeleton.hidden=false;
els.jobDetailsContent.hidden=true;
els.jobNotFound.hidden=true;
els.jobLoadError.hidden=true;
}

function showContent(){
els.jobDetailsSkeleton.hidden=true;
els.jobDetailsContent.hidden=false;
els.jobNotFound.hidden=true;
els.jobLoadError.hidden=true;
}

function showNotFound(message){
els.jobDetailsSkeleton.hidden=true;
els.jobDetailsContent.hidden=true;
els.jobLoadError.hidden=true;
els.jobNotFound.hidden=false;
if(message)els.jobNotFoundMessage.textContent=message;
}

function showError(message){
els.jobDetailsSkeleton.hidden=true;
els.jobDetailsContent.hidden=true;
els.jobNotFound.hidden=true;
els.jobLoadError.hidden=false;
els.jobLoadErrorMessage.textContent=message||"Something went wrong while loading this opportunity.";
}

function renderMeta(job){
const items=[];
const location=buildLocation(job);
const jobType=value(job,"Job_Type");
const workMode=value(job,"Work_Mode");
const experience=value(job,"Experience");

if(location!=="Not specified")items.push(location);
if(jobType)items.push(jobType);
if(workMode)items.push(workMode);
if(experience)items.push(experience);

els.jobMeta.innerHTML=items.map(item=>
`<span class="job-meta-item">${safe(item)}</span>`
).join("");
}

function renderSkills(job){
const skills=[
...splitSkills(value(job,"Skills")),
...splitSkills(value(job,"Required_Skills"))
].filter((item,index,array)=>array.indexOf(item)===index);

if(!skills.length){
els.skillsSection.hidden=true;
els.jobSkills.innerHTML="";
return;
}

els.skillsSection.hidden=false;
els.jobSkills.innerHTML=skills.map(skill=>
`<span class="skill-tag">${safe(skill)}</span>`
).join("");
}

function renderResponsibilities(job){
const responsibilities=value(job,"Job_Responsibilities");

if(!responsibilities){
els.responsibilitiesSection.hidden=true;
els.jobResponsibilities.textContent="";
return;
}

els.responsibilitiesSection.hidden=false;
els.jobResponsibilities.textContent=responsibilities;
}

function renderDeadline(job){
const raw=value(job,"Application_Last_Date");
const formatted=formatDate(raw);

els.jobLastDate.textContent=formatted||"Not specified";
els.jobDeadline.textContent=formatted?`Apply by ${formatted}`:"";

if(!raw)return;

const deadline=parseDate(raw);
if(!deadline)return;

deadline.setHours(23,59,59,999);

if(deadline.getTime()<Date.now()){
els.applyJobButton.disabled=true;
els.applyJobButton.textContent="Applications Closed";
els.applyHelp.textContent="The application deadline for this opportunity has passed.";
}
}

function renderJob(job){
const company=value(job,"Company_Name")||"Company";
const title=value(job,"Job_Title")||"Job Opportunity";
const description=value(job,"Job_Description")||"Job description is not available.";
const posted=value(job,"Posted_Date");
const status=value(job,"Job_Status")||"Active";

document.title=`${title} | Udayan Care Placement Portal`;

els.jobCompany.textContent=company;
els.sidebarCompany.textContent=company;
els.jobTitle.textContent=title;
els.jobStatus.textContent=status;
els.jobDescription.textContent=description;
els.jobType.textContent=value(job,"Job_Type")||"Not specified";
els.jobWorkMode.textContent=value(job,"Work_Mode")||"Not specified";
els.jobExperience.textContent=value(job,"Experience")||"Not specified";
els.jobQualification.textContent=value(job,"Qualification")||"Not specified";
els.jobVacancies.textContent=value(job,"Vacancies")||"Not specified";
els.jobCategory.textContent=value(job,"Job_Category")||"Not specified";
els.jobSalary.textContent=formatSalary(
value(job,"Salary_Min"),
value(job,"Salary_Max")
);
els.jobLocation.textContent=buildLocation(job);
els.jobAddress.textContent=buildAddress(job);
els.jobPostedDate.textContent=posted?`Posted ${formatDate(posted)}`:"";

renderMeta(job);
renderResponsibilities(job);
renderSkills(job);
renderDeadline(job);
showContent();
}

async function loadJob(){
if(loading)return;

if(!jobId){
showNotFound("The job link is invalid. Please return to Available Jobs and select an opportunity.");
return;
}

if(!API||typeof API.getJob!=="function"){
showError("Job service is unavailable. Please refresh the page and try again.");
return;
}

loading=true;
showSkeleton();

try{
const response=await API.getJob(jobId);

if(!response||response.success!==true){
const message=response?.message||"This job may have been closed, expired or is no longer available.";
showNotFound(message);
return;
}

const job=response.data;

if(!job||typeof job!=="object"){
showNotFound("This job is no longer available.");
return;
}

renderJob(job);

}catch(error){
console.error("Job details load failed:",error);
showError(
error?.message==="Request timed out"
?"The request took too long. Please try again."
:"Unable to load this job right now. Please try again."
);
}finally{
loading=false;
}
}

function handleApply(){
if(els.applyJobButton.disabled)return;

els.applyHelp.textContent="Application submission will be enabled in the next step.";
}

function init(){
cacheElements();

const params=new URLSearchParams(window.location.search);
jobId=(params.get("id")||"").trim();

els.retryJobButton?.addEventListener("click",loadJob);
els.applyJobButton?.addEventListener("click",handleApply);

loadJob();
}

init();

});
