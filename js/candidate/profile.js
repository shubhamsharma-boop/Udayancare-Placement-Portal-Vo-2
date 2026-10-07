'use strict';
(function(){
'use strict';
const API=window.UCPP_API;
const SESSION=window.UCPP_SESSION_MANAGER;
if(!API||!SESSION){console.error('Profile dependencies are not available.');return;}
const state={sessionToken:'',profile:null,experience:[],certifications:[],socialLinks:null,pendingDelete:null};
const el={};
document.addEventListener('DOMContentLoaded',init);
async function init(){
cacheElements();
bindEvents();
setDobMax();
updateAboutCount();
try{
const valid=await ensureSession();
if(!valid)return;
await loadProfile();
}catch(error){
console.error('Profile initialization failed:',error);
showFatalError(error.message||'Unable to load your profile. Please try again.');
}
}
function cacheElements(){
el.profileSkeleton=document.getElementById('profileSkeleton');
el.profileMain=document.getElementById('profileMain');
el.profileAlert=document.getElementById('profileAlert');
el.heroName=document.getElementById('heroName');
el.heroMeta=document.getElementById('heroMeta');
el.heroCandidateId=document.getElementById('heroCandidateId');
el.heroEmail=document.getElementById('heroEmail');
el.profileInitials=document.getElementById('profileInitials');
el.completionPercent=document.getElementById('completionPercent');
el.completionBar=document.getElementById('completionBar');
el.completionText=document.getElementById('completionText');
el.basicProfileForm=document.getElementById('basicProfileForm');
el.saveBasicProfile=document.getElementById('saveBasicProfile');
el.fullName=document.getElementById('fullName');
el.shaliniId=document.getElementById('shaliniId');
el.email=document.getElementById('email');
el.mobile=document.getElementById('mobile');
el.gender=document.getElementById('gender');
el.dob=document.getElementById('dob');
el.currentCity=document.getElementById('currentCity');
el.preferredLocation=document.getElementById('preferredLocation');
el.education=document.getElementById('education');
el.qualification=document.getElementById('qualification');
el.passingYear=document.getElementById('passingYear');
el.employmentStatus=document.getElementById('employmentStatus');
el.experience=document.getElementById('experience');
el.expectedSalary=document.getElementById('expectedSalary');
el.skills=document.getElementById('skills');
el.aboutCandidate=document.getElementById('aboutCandidate');
el.aboutCount=document.getElementById('aboutCount');
el.experienceList=document.getElementById('experienceList');
el.experienceEmpty=document.getElementById('experienceEmpty');
el.addExperienceBtn=document.getElementById('addExperienceBtn');
el.emptyAddExperienceBtn=document.getElementById('emptyAddExperienceBtn');
el.experienceModal=document.getElementById('experienceModal');
el.experienceModalTitle=document.getElementById('experienceModalTitle');
el.experienceForm=document.getElementById('experienceForm');
el.experienceId=document.getElementById('experienceId');
el.companyName=document.getElementById('companyName');
el.jobTitle=document.getElementById('jobTitle');
el.employmentType=document.getElementById('employmentType');
el.experienceLocation=document.getElementById('experienceLocation');
el.experienceStartDate=document.getElementById('experienceStartDate');
el.experienceEndDate=document.getElementById('experienceEndDate');
el.currentlyWorking=document.getElementById('currentlyWorking');
el.responsibilities=document.getElementById('responsibilities');
el.saveExperienceBtn=document.getElementById('saveExperienceBtn');
el.certificationList=document.getElementById('certificationList');
el.certificationEmpty=document.getElementById('certificationEmpty');
el.addCertificationBtn=document.getElementById('addCertificationBtn');
el.emptyAddCertificationBtn=document.getElementById('emptyAddCertificationBtn');
el.certificationModal=document.getElementById('certificationModal');
el.certificationModalTitle=document.getElementById('certificationModalTitle');
el.certificationForm=document.getElementById('certificationForm');
el.certificationId=document.getElementById('certificationId');
el.certificationName=document.getElementById('certificationName');
el.issuingOrganization=document.getElementById('issuingOrganization');
el.issueDate=document.getElementById('issueDate');
el.expiryDate=document.getElementById('expiryDate');
el.credentialId=document.getElementById('credentialId');
el.credentialUrl=document.getElementById('credentialUrl');
el.certificationDescription=document.getElementById('certificationDescription');
el.saveCertificationBtn=document.getElementById('saveCertificationBtn');
el.socialLinksForm=document.getElementById('socialLinksForm');
el.saveSocialLinks=document.getElementById('saveSocialLinks');
el.linkedIn=document.getElementById('linkedIn');
el.naukri=document.getElementById('naukri');
el.indeed=document.getElementById('indeed');
el.portfolio=document.getElementById('portfolio');
el.github=document.getElementById('github');
el.otherLink=document.getElementById('otherLink');
el.confirmModal=document.getElementById('confirmModal');
el.confirmTitle=document.getElementById('confirmTitle');
el.confirmMessage=document.getElementById('confirmMessage');
el.cancelConfirmBtn=document.getElementById('cancelConfirmBtn');
el.confirmDeleteBtn=document.getElementById('confirmDeleteBtn');
}
function bindEvents(){
document.querySelectorAll('.profile-tab').forEach(button=>button.addEventListener('click',()=>switchSection(button.dataset.section)));
el.basicProfileForm.addEventListener('submit',saveBasicProfile);
el.aboutCandidate.addEventListener('input',updateAboutCount);
el.addExperienceBtn.addEventListener('click',()=>openExperienceModal());
el.emptyAddExperienceBtn.addEventListener('click',()=>openExperienceModal());
el.experienceForm.addEventListener('submit',saveExperience);
el.currentlyWorking.addEventListener('change',handleCurrentlyWorking);
el.experienceList.addEventListener('click',handleExperienceAction);
el.addCertificationBtn.addEventListener('click',()=>openCertificationModal());
el.emptyAddCertificationBtn.addEventListener('click',()=>openCertificationModal());
el.certificationForm.addEventListener('submit',saveCertification);
el.certificationList.addEventListener('click',handleCertificationAction);
el.socialLinksForm.addEventListener('submit',saveSocialLinks);
document.querySelectorAll('[data-close-modal]').forEach(button=>button.addEventListener('click',()=>closeModal(button.dataset.closeModal)));
el.cancelConfirmBtn.addEventListener('click',closeConfirm);
el.confirmDeleteBtn.addEventListener('click',executeDelete);
document.addEventListener('keydown',handleEscape);
}
async function ensureSession(){
const session=SESSION.getSession();
if(!session||!session.sessionToken||session.role!=='candidate'){redirectLogin();return false;}
state.sessionToken=session.sessionToken;
let validation;
try{validation=await API.validateCandidateSession(state.sessionToken);}
catch(error){throw new Error('Unable to verify your session. Please check your connection and try again.');}
if(!validation||validation.success!==true){
if(isInvalidSession(validation)){handleExpiredSession();return false;}
throw new Error(validation?.message||'Unable to verify your session.');
}
return true;
}
async function loadProfile(){
setLoading(true);
try{
const result=await API.getCandidateProfile(state.sessionToken);
if(!result||result.success!==true){
if(isInvalidSession(result)){handleExpiredSession();return;}
throw new Error(result?.message||'Unable to load profile.');
}
const data=result.data||{};
state.profile=data.profile||{};
state.experience=Array.isArray(data.experience)?data.experience:[];
state.certifications=Array.isArray(data.certifications)?data.certifications:[];
state.socialLinks=data.socialLinks||{};
renderAll(data);
setLoading(false);
}catch(error){setLoading(false);throw error;}
}
function renderAll(data){
renderHero();
populateBasicProfile();
renderCompletion(data.profileCompletion);
renderExperience();
renderCertifications();
populateSocialLinks();
}
function renderHero(){
const profile=state.profile||{};
const name=value(profile.fullName,'Candidate');
el.heroName.textContent=name;
const meta=[];
if(profile.qualification)meta.push(profile.qualification);
if(profile.currentCity)meta.push(profile.currentCity);
if(profile.employmentStatus)meta.push(profile.employmentStatus);
el.heroMeta.textContent=meta.length?meta.join(' • '):'Complete your profile to help employers know you better.';
el.heroCandidateId.textContent='Candidate ID: '+value(profile.candidateId,'--');
el.heroEmail.textContent='Email: '+value(profile.email,'--');
el.profileInitials.textContent=getInitials(name);
}
function populateBasicProfile(){
const p=state.profile||{};
setValue(el.fullName,p.fullName);
setValue(el.shaliniId,p.shaliniId);
setValue(el.email,p.email);
setValue(el.mobile,p.mobile);
setValue(el.gender,p.gender);
setValue(el.dob,toDateInput(p.dob));
setValue(el.currentCity,p.currentCity);
setValue(el.preferredLocation,p.preferredLocation);
setValue(el.education,p.education);
setValue(el.qualification,p.qualification);
setValue(el.passingYear,p.passingYear);
setValue(el.employmentStatus,p.employmentStatus);
setValue(el.experience,p.experience);
setValue(el.expectedSalary,p.expectedSalary);
setValue(el.skills,p.skills);
setValue(el.aboutCandidate,p.aboutCandidate);
updateAboutCount();
}
function renderCompletion(completion){
let percent=0;
if(typeof completion==='number')percent=completion;
else if(completion&&typeof completion==='object')percent=Number(completion.percentage??completion.percent??completion.completion??completion.value??0);
percent=Math.round(Math.max(0,Math.min(100,Number(percent)||0)));
el.completionPercent.textContent=percent+'%';
el.completionBar.style.width=percent+'%';
if(percent>=100)el.completionText.textContent='Great! Your profile is complete.';
else if(percent>=75)el.completionText.textContent='Almost there. Add the remaining details to complete your profile.';
else if(percent>=40)el.completionText.textContent='Good progress. Add more details to strengthen your profile.';
else el.completionText.textContent='Complete your profile to improve visibility.';
}
async function saveBasicProfile(event){
event.preventDefault();
clearFieldErrors();
const profile={
fullName:el.fullName.value.trim(),
gender:el.gender.value.trim(),
dob:el.dob.value.trim(),
currentCity:el.currentCity.value.trim(),
mobile:el.mobile.value.trim(),
education:el.education.value.trim(),
qualification:el.qualification.value.trim(),
passingYear:el.passingYear.value.trim(),
skills:el.skills.value.trim(),
experience:el.experience.value.trim(),
employmentStatus:el.employmentStatus.value.trim(),
preferredLocation:el.preferredLocation.value.trim(),
expectedSalary:el.expectedSalary.value.trim(),
aboutCandidate:el.aboutCandidate.value.trim()
};
if(!validateBasicProfile(profile))return;
setButtonLoading(el.saveBasicProfile,true);
try{
const result=await API.updateCandidateProfile(state.sessionToken,profile);
if(!result||result.success!==true){
if(isInvalidSession(result)){handleExpiredSession();return;}
throw new Error(result?.message||'Unable to update profile.');
}
applyReturnedProfileData(result.data);
showAlert(result.message||'Profile updated successfully.','success');
}catch(error){showAlert(error.message||'Unable to update profile.','error');}
finally{setButtonLoading(el.saveBasicProfile,false);}
}
function validateBasicProfile(profile){
let validForm=true;
if(!profile.fullName||profile.fullName.length<2){setFieldError('fullName','Please enter your full name.');validForm=false;}
if(profile.mobile&&!/^[6-9]\d{9}$/.test(profile.mobile)){setFieldError('mobile','Enter a valid 10-digit mobile number.');validForm=false;}
if(profile.dob){
const dob=new Date(profile.dob+'T00:00:00');
if(Number.isNaN(dob.getTime())||dob>new Date()){setFieldError('dob','Enter a valid date of birth.');validForm=false;}
}
if(profile.passingYear){
const year=Number(profile.passingYear);
const maxYear=new Date().getFullYear()+10;
if(!Number.isInteger(year)||year<1950||year>maxYear){setFieldError('passingYear','Enter a valid passing year.');validForm=false;}
}
return validForm;
}
function applyReturnedProfileData(data){
if(!data)return;
if(data.profile){state.profile=data.profile;populateBasicProfile();renderHero();}
else if(data.candidateId||data.fullName||data.email){state.profile=data;populateBasicProfile();renderHero();}
else{
state.profile={...(state.profile||{}),fullName:el.fullName.value.trim(),gender:el.gender.value,dob:el.dob.value,currentCity:el.currentCity.value.trim(),mobile:el.mobile.value.trim(),education:el.education.value.trim(),qualification:el.qualification.value.trim(),passingYear:el.passingYear.value.trim(),skills:el.skills.value.trim(),experience:el.experience.value.trim(),employmentStatus:el.employmentStatus.value,preferredLocation:el.preferredLocation.value.trim(),expectedSalary:el.expectedSalary.value.trim(),aboutCandidate:el.aboutCandidate.value.trim()};
renderHero();
}
if(data.profileCompletion!==undefined)renderCompletion(data.profileCompletion);
}
function renderExperience(){
el.experienceList.innerHTML='';
if(!state.experience.length){el.experienceEmpty.hidden=false;return;}
el.experienceEmpty.hidden=true;
state.experience.forEach(record=>{
const id=getExperienceId(record);
const card=document.createElement('article');
card.className='record-card';
const company=value(record.companyName,'Company');
const title=value(record.jobTitle,'Role not specified');
const meta=[];
if(record.employmentType)meta.push(record.employmentType);
const dates=formatDateRange(record.startDate,record.endDate,isTrue(record.currentlyWorking));
if(dates)meta.push(dates);
if(record.location)meta.push(record.location);
card.innerHTML='<div class="record-card-top"><div class="record-card-main"><h3>'+escapeHtml(title)+'</h3><p class="record-subtitle">'+escapeHtml(company)+'</p><div class="record-meta">'+meta.map(item=>'<span>'+escapeHtml(item)+'</span>').join('')+'</div></div><div class="record-actions"><button type="button" class="record-action" data-action="edit-experience" data-id="'+escapeAttribute(id)+'">Edit</button><button type="button" class="record-action delete" data-action="delete-experience" data-id="'+escapeAttribute(id)+'">Delete</button></div></div>'+(record.responsibilities?'<p class="record-description">'+escapeHtml(record.responsibilities)+'</p>':'');
el.experienceList.appendChild(card);
});
}
function handleExperienceAction(event){
const button=event.target.closest('[data-action]');
if(!button)return;
const id=button.dataset.id;
if(button.dataset.action==='edit-experience'){
const record=findExperience(id);
if(record)openExperienceModal(record);
}
if(button.dataset.action==='delete-experience')openConfirm({type:'experience',id,title:'Delete experience?',message:'This work experience will be permanently removed from your profile.'});
}
function openExperienceModal(record=null){
el.experienceForm.reset();
setValue(el.experienceId,record?getExperienceId(record):'');
el.experienceModalTitle.textContent=record?'Edit Experience':'Add Experience';
if(record){
setValue(el.companyName,record.companyName);
setValue(el.jobTitle,record.jobTitle);
setValue(el.employmentType,record.employmentType);
setValue(el.experienceLocation,record.location);
setValue(el.experienceStartDate,toDateInput(record.startDate));
setValue(el.experienceEndDate,toDateInput(record.endDate));
el.currentlyWorking.checked=isTrue(record.currentlyWorking);
setValue(el.responsibilities,record.responsibilities);
}
handleCurrentlyWorking();
openModal(el.experienceModal);
setTimeout(()=>el.companyName.focus(),50);
}
async function saveExperience(event){
event.preventDefault();
const experience={
experienceId:el.experienceId.value.trim(),
companyName:el.companyName.value.trim(),
jobTitle:el.jobTitle.value.trim(),
employmentType:el.employmentType.value.trim(),
startDate:el.experienceStartDate.value,
endDate:el.currentlyWorking.checked?'':el.experienceEndDate.value,
currentlyWorking:el.currentlyWorking.checked,
location:el.experienceLocation.value.trim(),
responsibilities:el.responsibilities.value.trim()
};
if(!experience.companyName){showAlert('Company Name is required.','error');el.companyName.focus();return;}
if(!experience.jobTitle){showAlert('Job Title is required.','error');el.jobTitle.focus();return;}
if(experience.startDate&&experience.endDate&&experience.endDate<experience.startDate){showAlert('End Date cannot be earlier than Start Date.','error');return;}
setButtonLoading(el.saveExperienceBtn,true);
try{
const result=await API.saveCandidateExperience(state.sessionToken,experience);
if(!result||result.success!==true){
if(isInvalidSession(result)){handleExpiredSession();return;}
throw new Error(result?.message||'Unable to save experience.');
}
closeModal('experience');
await refreshProfileData();
showAlert(result.message||'Experience saved successfully.','success');
}catch(error){showAlert(error.message||'Unable to save experience.','error');}
finally{setButtonLoading(el.saveExperienceBtn,false);}
}

function handleCurrentlyWorking(){
el.experienceEndDate.disabled=el.currentlyWorking.checked;
if(el.currentlyWorking.checked)el.experienceEndDate.value='';
}
function findExperience(id){
return state.experience.find(record=>String(getExperienceId(record))===String(id));
}
function getExperienceId(record){
return String(record?.experienceId??record?.id??'');
}
function renderCertifications(){
el.certificationList.innerHTML='';
if(!state.certifications.length){
el.certificationEmpty.hidden=false;
return;
}
el.certificationEmpty.hidden=true;
state.certifications.forEach(record=>{
const id=getCertificationId(record);
const card=document.createElement('article');
card.className='record-card';
const name=value(record.certificationName,'Certification');
const organization=value(record.issuingOrganization,'');
const meta=[];
if(record.issueDate)meta.push('Issued '+formatDisplayDate(record.issueDate));
if(record.expiryDate)meta.push('Expires '+formatDisplayDate(record.expiryDate));
if(record.credentialId)meta.push('Credential ID: '+record.credentialId);
card.innerHTML='<div class="record-card-top"><div class="record-card-main"><h3>'+escapeHtml(name)+'</h3>'+(organization?'<p class="record-subtitle">'+escapeHtml(organization)+'</p>':'')+'<div class="record-meta">'+meta.map(item=>'<span>'+escapeHtml(item)+'</span>').join('')+'</div></div><div class="record-actions"><button type="button" class="record-action" data-action="edit-certification" data-id="'+escapeAttribute(id)+'">Edit</button><button type="button" class="record-action delete" data-action="delete-certification" data-id="'+escapeAttribute(id)+'">Delete</button></div></div>'+(record.description?'<p class="record-description">'+escapeHtml(record.description)+'</p>':'')+(record.credentialUrl&&isValidUrl(record.credentialUrl)?'<a class="record-link" href="'+escapeAttribute(record.credentialUrl)+'" target="_blank" rel="noopener noreferrer">View Credential ↗</a>':'');
el.certificationList.appendChild(card);
});
}
function handleCertificationAction(event){
const button=event.target.closest('[data-action]');
if(!button)return;
const id=button.dataset.id;
if(button.dataset.action==='edit-certification'){
const record=findCertification(id);
if(record)openCertificationModal(record);
}
if(button.dataset.action==='delete-certification'){
openConfirm({
type:'certification',
id,
title:'Delete certification?',
message:'This certification will be permanently removed from your profile.'
});
}
}
function openCertificationModal(record=null){
el.certificationForm.reset();
setValue(el.certificationId,record?getCertificationId(record):'');
el.certificationModalTitle.textContent=record?'Edit Certification':'Add Certification';
if(record){
setValue(el.certificationName,record.certificationName);
setValue(el.issuingOrganization,record.issuingOrganization);
setValue(el.issueDate,toDateInput(record.issueDate));
setValue(el.expiryDate,toDateInput(record.expiryDate));
setValue(el.credentialId,record.credentialId);
setValue(el.credentialUrl,record.credentialUrl);
setValue(el.certificationDescription,record.description);
}
openModal(el.certificationModal);
setTimeout(()=>el.certificationName.focus(),50);
}
async function saveCertification(event){
event.preventDefault();
const certification={
certificationId:el.certificationId.value.trim(),
certificationName:el.certificationName.value.trim(),
issuingOrganization:el.issuingOrganization.value.trim(),
issueDate:el.issueDate.value,
expiryDate:el.expiryDate.value,
credentialId:el.credentialId.value.trim(),
credentialUrl:el.credentialUrl.value.trim(),
description:el.certificationDescription.value.trim()
};
if(!certification.certificationName){
showAlert('Certification Name is required.','error');
el.certificationName.focus();
return;
}
if(certification.issueDate&&certification.expiryDate&&certification.expiryDate<certification.issueDate){
showAlert('Expiry Date cannot be earlier than Issue Date.','error');
return;
}
if(certification.credentialUrl&&!isValidUrl(certification.credentialUrl)){
showAlert('Please enter a valid Credential URL.','error');
el.credentialUrl.focus();
return;
}
setButtonLoading(el.saveCertificationBtn,true);
try{
const result=await API.saveCandidateCertification(state.sessionToken,certification);
if(!result||result.success!==true){
if(isInvalidSession(result)){
handleExpiredSession();
return;
}
throw new Error(result?.message||'Unable to save certification.');
}
closeModal('certification');
await refreshProfileData();
showAlert(result.message||'Certification saved successfully.','success');
}catch(error){
showAlert(error.message||'Unable to save certification.','error');
}finally{
setButtonLoading(el.saveCertificationBtn,false);
}
}
function findCertification(id){
return state.certifications.find(record=>String(getCertificationId(record))===String(id));
}
function getCertificationId(record){
return String(record?.certificationId??record?.id??'');
}
function populateSocialLinks(){
const links=state.socialLinks||{};
setValue(el.linkedIn,links.linkedIn);
setValue(el.naukri,links.naukri);
setValue(el.indeed,links.indeed);
setValue(el.portfolio,links.portfolio);
setValue(el.github,links.github);
setValue(el.otherLink,links.otherLink);
}
async function saveSocialLinks(event){
event.preventDefault();
const links={
linkedIn:el.linkedIn.value.trim(),
naukri:el.naukri.value.trim(),
indeed:el.indeed.value.trim(),
portfolio:el.portfolio.value.trim(),
github:el.github.value.trim(),
otherLink:el.otherLink.value.trim()
};
for(const [key,url] of Object.entries(links)){
if(url&&!isValidUrl(url)){
const label={
linkedIn:'LinkedIn',
naukri:'Naukri',
indeed:'Indeed',
portfolio:'Portfolio',
github:'GitHub',
otherLink:'Other Professional Link'
}[key]||'URL';
showAlert('Please enter a valid '+label+' URL.','error');
return;
}
}
setButtonLoading(el.saveSocialLinks,true);
try{
const result=await API.saveCandidateSocialLinks(state.sessionToken,links);
if(!result||result.success!==true){
if(isInvalidSession(result)){
handleExpiredSession();
return;
}
throw new Error(result?.message||'Unable to save social links.');
}
if(result.data?.socialLinks)state.socialLinks=result.data.socialLinks;
else state.socialLinks=links;
populateSocialLinks();
if(result.data?.profileCompletion!==undefined)renderCompletion(result.data.profileCompletion);
showAlert(result.message||'Professional links saved successfully.','success');
}catch(error){
showAlert(error.message||'Unable to save professional links.','error');
}finally{
setButtonLoading(el.saveSocialLinks,false);
}
}
function openConfirm(config){
state.pendingDelete=config;
el.confirmTitle.textContent=config.title||'Delete record?';
el.confirmMessage.textContent=config.message||'This action cannot be undone.';
el.confirmModal.hidden=false;
document.body.classList.add('modal-open');
}
function closeConfirm(){
state.pendingDelete=null;
el.confirmModal.hidden=true;
if(!isAnyModalOpen())document.body.classList.remove('modal-open');
}
async function executeDelete(){
const pending=state.pendingDelete;
if(!pending)return;
setButtonLoading(el.confirmDeleteBtn,true,'Deleting...');
try{
let result;
if(pending.type==='experience'){
result=await API.deleteCandidateExperience(state.sessionToken,pending.id);
}else if(pending.type==='certification'){
result=await API.deleteCandidateCertification(state.sessionToken,pending.id);
}else{
throw new Error('Invalid delete request.');
}
if(!result||result.success!==true){
if(isInvalidSession(result)){
handleExpiredSession();
return;
}
throw new Error(result?.message||'Unable to delete record.');
}
closeConfirm();
await refreshProfileData();
showAlert(result.message||'Record deleted successfully.','success');
}catch(error){
showAlert(error.message||'Unable to delete record.','error');
}finally{
setButtonLoading(el.confirmDeleteBtn,false);
}
}
async function refreshProfileData(){
const result=await API.getCandidateProfile(state.sessionToken);
if(!result||result.success!==true){
if(isInvalidSession(result)){
handleExpiredSession();
return;
}
throw new Error(result?.message||'Unable to refresh profile.');
}
const data=result.data||{};
state.profile=data.profile||state.profile||{};
state.experience=Array.isArray(data.experience)?data.experience:[];
state.certifications=Array.isArray(data.certifications)?data.certifications:[];
state.socialLinks=data.socialLinks||{};
renderAll(data);
}
function switchSection(sectionId){
document.querySelectorAll('.profile-tab').forEach(tab=>{
tab.classList.toggle('active',tab.dataset.section===sectionId);
});
document.querySelectorAll('.profile-section').forEach(section=>{
section.classList.toggle('active',section.id===sectionId);
});
}
function openModal(modal){
modal.hidden=false;
document.body.classList.add('modal-open');
}
function closeModal(type){
let modal=null;
if(type==='experience')modal=el.experienceModal;
if(type==='certification')modal=el.certificationModal;
if(modal)modal.hidden=true;
if(!isAnyModalOpen())document.body.classList.remove('modal-open');
}
function isAnyModalOpen(){
return(
(el.experienceModal&&!el.experienceModal.hidden)||
(el.certificationModal&&!el.certificationModal.hidden)||
(el.confirmModal&&!el.confirmModal.hidden)
);
}
function handleEscape(event){
if(event.key!=='Escape')return;
if(!el.confirmModal.hidden){
closeConfirm();
return;
}
if(!el.experienceModal.hidden){
closeModal('experience');
return;
}
if(!el.certificationModal.hidden)closeModal('certification');
}
function setLoading(loading){
if(el.profileSkeleton)el.profileSkeleton.hidden=!loading;
if(el.profileMain)el.profileMain.hidden=loading;
}
function showFatalError(message){
setLoading(false);
if(el.profileMain)el.profileMain.hidden=true;
showAlert(message,'error');
}
function showAlert(message,type='success'){
if(!el.profileAlert)return;
el.profileAlert.textContent=message;
el.profileAlert.className='profile-alert '+type;
el.profileAlert.hidden=false;
if(type==='success'){
window.clearTimeout(showAlert.timer);
showAlert.timer=window.setTimeout(()=>{
el.profileAlert.hidden=true;
},5000);
}
window.scrollTo({
top:Math.max(0,el.profileAlert.getBoundingClientRect().top+window.scrollY-100),
behavior:'smooth'
});
}
function clearFieldErrors(){
document.querySelectorAll('.field-error').forEach(item=>item.textContent='');
}
function setFieldError(field,message){
const target=document.querySelector('[data-error-for="'+field+'"]');
if(target)target.textContent=message;
}
function setButtonLoading(button,loading,loadingText=''){
if(!button)return;
button.disabled=loading;
const textNode=button.querySelector('.button-text');
const loader=button.querySelector('.button-loader');
if(textNode)textNode.hidden=loading;
if(loader){
loader.hidden=!loading;
if(loadingText)loader.textContent=loadingText;
}
if(!textNode&&!loader&&loadingText)button.textContent=loadingText;
}
function updateAboutCount(){
if(el.aboutCount)el.aboutCount.textContent=String(el.aboutCandidate?.value?.length||0);
}
function setDobMax(){
if(el.dob)el.dob.max=new Date().toISOString().slice(0,10);
}
function getInitials(name){
const words=String(name||'')
.trim()
.split(/\s+/)
.filter(Boolean);
if(!words.length)return '--';
if(words.length===1)return words[0].slice(0,2).toUpperCase();
return(words[0][0]+words[words.length-1][0]).toUpperCase();
}
function setValue(element,val){
if(element)element.value=val===undefined||val===null?'':String(val);
}
function value(val,fallback=''){
if(val===undefined||val===null||String(val).trim()==='')return fallback;
return String(val);
}
function toDateInput(val){
if(!val)return'';
if(val instanceof Date&&!Number.isNaN(val.getTime()))return val.toISOString().slice(0,10);
const text=String(val).trim();
const direct=text.match(/^(\d{4})-(\d{2})-(\d{2})/);
if(direct)return direct[1]+'-'+direct[2]+'-'+direct[3];
const date=new Date(text);
if(Number.isNaN(date.getTime()))return'';
return date.toISOString().slice(0,10);
}
function formatDisplayDate(val){
const input=toDateInput(val);
if(!input)return'';
const date=new Date(input+'T00:00:00');
return date.toLocaleDateString('en-IN',{
month:'short',
year:'numeric'
});
}
function formatDateRange(start,end,current){
const startText=formatDisplayDate(start);
const endText=current?'Present':formatDisplayDate(end);
if(startText&&endText)return startText+' - '+endText;
if(startText)return startText;
if(endText)return endText;
return'';
}
function isTrue(val){
return val===true||String(val).toLowerCase()==='true'||String(val).toLowerCase()==='yes'||String(val)==='1';
}
function isValidUrl(url){
try{
const parsed=new URL(url);
return parsed.protocol==='http:'||parsed.protocol==='https:';
}catch(error){
return false;
}
}
function escapeHtml(val){
return String(val??'')
.replace(/&/g,'&amp;')
.replace(/</g,'&lt;')
.replace(/>/g,'&gt;')
.replace(/"/g,'&quot;')
.replace(/'/g,'&#039;');
}
function escapeAttribute(val){
return escapeHtml(val);
}
function isInvalidSession(result){
const code=String(result?.code||'').toUpperCase();
return code==='INVALID_SESSION'||code==='SESSION_EXPIRED'||code==='UNAUTHORIZED';
}
function handleExpiredSession(){
try{
const logout=SESSION.logout();
if(logout&&typeof logout.catch==='function')logout.catch(()=>redirectLogin());
else redirectLogin();
}catch(error){
redirectLogin();
}
}
function redirectLogin(){
window.location.replace('login.html');
}
})(); 
