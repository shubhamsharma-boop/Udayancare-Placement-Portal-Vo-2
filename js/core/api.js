'use strict';

/*
 * UCPP V2 - Core API Client
 * GET + POST + Jobs + Candidate Auth + Session + Dashboard
 */
(function(){
  if(!window.UCPP_CONFIG){
    console.error('UCPP_CONFIG is not available.');
    return;
  }

  const CONFIG=window.UCPP_CONFIG;
  const activeRequests=new Map();

  function buildURL(action,params={}){
    const url=new URL(CONFIG.API_URL);
    url.searchParams.set('action',action);

    Object.entries(params).forEach(([key,value])=>{
      if(value===undefined||value===null||value==='')return;
      url.searchParams.set(key,String(value));
    });

    return url.toString();
  }

  async function get(action,params={}){
    const requestURL=buildURL(action,params);

    if(activeRequests.has(requestURL)){
      return activeRequests.get(requestURL);
    }

    const request=performGetRequest(requestURL);
    activeRequests.set(requestURL,request);

    try{
      return await request;
    }finally{
      activeRequests.delete(requestURL);
    }
  }

  async function performGetRequest(requestURL){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),CONFIG.API_TIMEOUT||30000);

    try{
      const response=await fetch(requestURL,{
        method:'GET',
        cache:'no-store',
        redirect:'follow',
        signal:controller.signal
      });

      if(!response.ok){
        throw new Error('Server returned HTTP '+response.status);
      }

      const result=await response.json();

      if(!result||result.success!==true){
        throw new Error(result?.message||'API request failed.');
      }

      return result;
    }catch(error){
      if(error.name==='AbortError'){
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }finally{
      clearTimeout(timeout);
    }
  }

  async function post(action,data={}){
    const cleanAction=String(action||'').trim();

    if(!cleanAction){
      throw new Error('API action is required.');
    }

    return performPostRequest({
      action:cleanAction,
      ...data
    });
  }

  async function performPostRequest(payload){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),CONFIG.API_TIMEOUT||30000);

    try{
      const response=await fetch(CONFIG.API_URL,{
        method:'POST',
        headers:{
          'Content-Type':'text/plain;charset=utf-8'
        },
        body:JSON.stringify(payload),
        cache:'no-store',
        redirect:'follow',
        signal:controller.signal
      });

      if(!response.ok){
        throw new Error('Server returned HTTP '+response.status);
      }

      const result=await response.json();

      if(!result||typeof result.success!=='boolean'){
        throw new Error('Invalid response from server.');
      }

      return result;
    }catch(error){
      if(error.name==='AbortError'){
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }finally{
      clearTimeout(timeout);
    }
  }

  function health(){
    return get('health');
  }

  function getJobs(options={}){
    return get('getPublicJobs',{
      page:options.page||1,
      limit:options.limit||CONFIG.PAGINATION.JOBS_PER_PAGE,
      search:options.search||'',
      city:options.city||'',
      category:options.category||'',
      jobType:options.jobType||'',
      workMode:options.workMode||''
    });
  }

  function getJob(jobId){
    const id=String(jobId||'').trim();

    if(!id){
      return Promise.reject(
        new Error('Job ID is required.')
      );
    }

    return get('getPublicJob',{id:id});
  }

  /*
   * Candidate Login
   */
  function candidateLogin(email,password){
    const cleanEmail=String(email||'').trim().toLowerCase();
    const cleanPassword=String(password||'');

    if(!cleanEmail||!cleanPassword){
      return Promise.resolve({
        success:false,
        code:'INVALID_LOGIN',
        message:'Email and password are required.',
        data:null
      });
    }

    return post('candidateLogin',{
      email:cleanEmail,
      password:cleanPassword
    });
  }

  /*
   * Validate Candidate Session
   */
  function validateCandidateSession(sessionToken){
    const token=String(sessionToken||'').trim();

    if(!token){
      return Promise.resolve({
        success:false,
        code:'INVALID_SESSION',
        message:'Session is not available.',
        data:null
      });
    }

    return post('validateCandidateSession',{
      sessionToken:token
    });
  }

  /*
   * Candidate Logout
   */
  function logoutCandidate(sessionToken){
    const token=String(sessionToken||'').trim();

    if(!token){
      return Promise.resolve({
        success:true,
        code:'LOGOUT_SUCCESS',
        message:'Logged out successfully.',
        data:null
      });
    }

    return post('logoutCandidate',{
      sessionToken:token
    });
  }

  /*
   * Candidate Dashboard
   *
   * Candidate ID is NOT sent from frontend.
   * Backend derives Candidate_ID from validated session.
   */
  function getCandidateDashboard(sessionToken){
    const token=String(sessionToken||'').trim();

    if(!token){
      return Promise.resolve({
        success:false,
        code:'INVALID_SESSION',
        message:'Session is not available.',
        data:null
      });
    }

    return post('getCandidateDashboard',{
      sessionToken:token
    });
  }

  /*
   * Forgot Password
   */
  function requestCandidatePasswordReset(email){
    const cleanEmail=String(email||'').trim().toLowerCase();

    if(!cleanEmail){
      return Promise.resolve({
        success:false,
        code:'EMAIL_REQUIRED',
        message:'Email address is required.',
        data:null
      });
    }

    return post('requestCandidatePasswordReset',{
      email:cleanEmail
    });
  }

  function verifyCandidatePasswordResetOtp(email,otp){
    const cleanEmail=String(email||'').trim().toLowerCase();
    const cleanOtp=String(otp||'').trim();

    if(!cleanEmail||!cleanOtp){
      return Promise.resolve({
        success:false,
        code:'INVALID_REQUEST',
        message:'Email and verification code are required.',
        data:null
      });
    }

    return post('verifyCandidatePasswordResetOtp',{
      email:cleanEmail,
      otp:cleanOtp
    });
  }

  function resetCandidatePassword(resetToken,newPassword){
    const cleanToken=String(resetToken||'').trim();
    const password=String(newPassword||'');

    if(!cleanToken||!password){
      return Promise.resolve({
        success:false,
        code:'INVALID_REQUEST',
        message:'Invalid password reset request.',
        data:null
      });
    }

    return post('resetCandidatePassword',{
      resetToken:cleanToken,
      newPassword:password
    });
  }

  window.UCPP_API=Object.freeze({
    get,
    post,
    health,
    getJobs,
    getJob,
    candidateLogin,
    validateCandidateSession,
    logoutCandidate,
    getCandidateDashboard,
    requestCandidatePasswordReset,
    verifyCandidatePasswordResetOtp,
    resetCandidatePassword
  });
})();
