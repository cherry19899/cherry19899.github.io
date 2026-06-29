(function(){
"use strict";

// ===== CONFIG =====
const API_BASE = "https://workpro-api.onrender.com";
const APP_VERSION = "v629-pure";

// ===== STATE =====
let currentUser = null;
let currentScreen = "login";
let jobs = [];
let myJobs = [];
let applications = [];
let messages = [];
let escrow = [];
let unreadCount = 0;
let currentJobId = null;
let currentJob = null;
let currentChatId = null;
let adminStats = null;

// ===== UTILS =====
function $(id){return document.getElementById(id);}
function ce(tag,cls,html){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(html)el.innerHTML=html;
  return el;
}
function fmtDate(d){return d?new Date(d).toLocaleDateString():"";}
function fmtMoney(n){return n?"$"+Number(n).toFixed(2):"$0.00";}

// ===== API =====
async function apiCall(method,path,body){
  const url=API_BASE+path;
  const opts={method,headers:{"Content-Type":"application/json"}};
  if(currentUser&&currentUser.token)opts.headers["Authorization"]="Bearer "+currentUser.token;
  if(body)opts.body=JSON.stringify(body);
  try{
    const res=await fetch(url,opts);
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.message||data.error||"HTTP "+res.status);
    return data;
  }catch(e){throw e;}
}

const api={
  get:(p)=>apiCall("GET",p),
  post:(p,b)=>apiCall("POST",p,b),
  put:(p,b)=>apiCall("PUT",p,b),
  del:(p)=>apiCall("DELETE",p)
};

// ===== AUTH =====
async function piLogin(){
  showLoader("Connecting to Pi...");
  try{
    if(!window.Pi)throw new Error("Pi SDK not loaded");
    Pi.init({version:"2.0",sandbox:false});
    const auth=await Pi.authenticate(["username","payments"],function(){return;});
    const res=await api.post("/api/auth/pi",{
      accessToken:auth.accessToken,
      user:{uid:auth.user.uid,username:auth.user.username}
    });
    currentUser={
      id:res.user.id,
      username:res.user.username||auth.user.username,
      role:res.user.role||"user",
      token:res.token,
      pi_uid:auth.user.uid,
      connects:res.user.connects||0,
      title:res.user.title||"",
      hourly_rate:res.user.hourly_rate||0,
      location:res.user.location||""
    };
    localStorage.setItem("workpro_user",JSON.stringify(currentUser));
    hideLoader();
    showScreen("jobs");
  }catch(e){
    hideLoader();
    showError("Pi login failed: "+e.message);
  }
}

function logout(){
  currentUser=null;
  localStorage.removeItem("workpro_user");
  showScreen("login");
}

function loadUser(){
  const saved=localStorage.getItem("workpro_user");
  if(saved){try{currentUser=JSON.parse(saved);return true;}catch(e){}}
  return false;
}

// ===== LOADER / ERROR =====
function showLoader(text){
  const l=$("loader");if(l){$("status-text").textContent=text||"Loading...";l.style.display="flex";}
}
function hideLoader(){
  const l=$("loader");if(l)l.style.display="none";
}
function showError(msg){
  alert(msg);
}

// ===== RENDER =====
function render(){
  const root=$("root");if(!root)return;
  root.innerHTML="";
  if(currentScreen==="login"){root.appendChild(renderLogin());}
  else if(currentScreen==="jobs"){root.appendChild(renderJobs());}
  else if(currentScreen==="jobDetail"){root.appendChild(renderJobDetail());}
  else if(currentScreen==="createJob"){root.appendChild(renderCreateJob());}
  else if(currentScreen==="myJobs"){root.appendChild(renderMyJobs());}
  else if(currentScreen==="chat"){root.appendChild(renderChat());}
  else if(currentScreen==="chatRoom"){root.appendChild(renderChatRoom());}
  else if(currentScreen==="escrow"){root.appendChild(renderEscrow());}
  else if(currentScreen==="profile"){root.appendChild(renderProfile());}
  else if(currentScreen==="admin"){root.appendChild(renderAdmin());}
}

// ===== SCREENS =====
function renderLogin(){
  const div=ce("div","screen-login");
  div.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;background:#0f172a;">
    <div style="width:80px;height:80px;background:#38bdf8;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:36px;">&#128188;</div>
    <h1 style="font-size:32px;font-weight:700;color:#38bdf8;margin-bottom:8px;">Work Pro</h1>
    <p style="color:#94a3b8;margin-bottom:32px;text-align:center;">Freelance jobs powered by Pi Network</p>
    <button onclick="window._app.piLogin()" style="padding:14px 32px;background:#38bdf8;color:#0f172a;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;width:100%;max-width:300px;">&#128274; Login with Pi</button>
    <p style="color:#64748b;font-size:12px;margin-top:16px;">Version ${APP_VERSION}</p>
  </div>`;
  return div;
}

function renderNav(){
  const nav=ce("nav","bottom-nav");
  const items=[
    {id:"jobs",icon:"&#128269;",label:"Jobs"},
    {id:"myJobs",icon:"&#128203;",label:"My Jobs"},
    {id:"chat",icon:"&#128172;",label:"Chat"},
    {id:"escrow",icon:"&#128274;",label:"Escrow"},
    {id:"profile",icon:"&#128100;",label:"Profile"}
  ];
  if(currentUser&&currentUser.role==="admin"){
    items.push({id:"admin",icon:"&#9881;",label:"Admin"});
  }
  nav.innerHTML=`<div style="position:fixed;bottom:0;left:0;right:0;background:#1e293b;border-top:1px solid #334155;display:flex;justify-content:space-around;padding:8px 0;z-index:100;">
    ${items.map(it=>`<button onclick="window._app.nav('${it.id}')" style="background:none;border:none;color:${currentScreen===it.id?'#38bdf8':'#94a3b8'};font-size:11px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 8px;position:relative;">
      <span style="font-size:20px;">${it.icon}</span>
      <span>${it.label}</span>
      ${it.id==="chat"&&unreadCount>0?`<span style="position:absolute;top:2px;right:2px;background:#ef4444;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;display:flex;align-items:center;justify-content:center;">${unreadCount}</span>`:""}
    </button>`).join("")}
  </div>`;
  return nav;
}

function renderHeader(title){
  const h=ce("header","app-header");
  h.innerHTML=`<div style="position:fixed;top:0;left:0;right:0;background:#0f172a;border-bottom:1px solid #334155;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;z-index:100;">
    <h2 style="font-size:18px;font-weight:600;color:#e2e8f0;margin:0;">${title}</h2>
    <button onclick="window._app.logout()" style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;">&#128682;</button>
  </div>
  <div style="height:50px;"></div>`;
  return h;
}

// ===== JOBS SCREEN =====
async function loadJobs(){
  showLoader("Loading jobs...");
  try{const data=await api.get("/api/jobs");jobs=data.jobs||data||[];}
  catch(e){showError("Failed to load jobs");}
  hideLoader();render();
}

function renderJobs(){
  const div=ce("div","screen-jobs");
  div.style.cssText="background:#0f172a;min-height:100vh;padding-bottom:70px;";
  div.appendChild(renderHeader("Browse Jobs"));
  const createBtn=ce("div","");
  createBtn.innerHTML=`<div style="padding:12px 16px;"><button onclick="window._app.showScreen('createJob')" style="width:100%;padding:12px;background:#38bdf8;color:#0f172a;border:none;border-radius:8px;font-weight:600;cursor:pointer;">+ Post a Job</button></div>`;
  div.appendChild(createBtn);
  const list=ce("div","jobs-list");list.style.cssText="padding:0 16px;";
  if(!jobs.length){list.innerHTML=`<p style="color:#94a3b8;text-align:center;padding:40px;">No jobs yet</p>`;}
  else{jobs.forEach(job=>{const card=ce("div","job-card");card.style.cssText="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:12px;cursor:pointer;border:1px solid #334155;";card.onclick=()=>{currentJobId=job.id;showScreen("jobDetail");};card.innerHTML=`<h3 style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">${job.title||"Untitled"}</h3><p style="color:#94a3b8;font-size:13px;margin:0 0 8px;line-height:1.4;">${(job.description||"").substring(0,100)}${(job.description||"").length>100?"...":""}</p><div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#38bdf8;font-weight:600;">${fmtMoney(job.budget)}</span><span style="color:#64748b;font-size:12px;">${job.category||"General"}</span></div>`;list.appendChild(card);});}
  div.appendChild(list);div.appendChild(renderNav());
  return div;
}

// ===== JOB DETAIL =====
async function loadJobDetail(){
  if(!currentJobId)return;
  showLoader("Loading...");
  try{const data=await api.get("/api/jobs/"+currentJobId);currentJob=data.job||data;}
  catch(e){showError("Failed to load job");}
  hideLoader();render();
}

function renderJobDetail(){
  const div=ce("div","screen-detail");
  div.style.cssText="background:#0f172a;min-height:100vh;padding-bottom:70px;";
  div.appendChild(renderHeader("Job Details"));
  if(!currentJob){div.innerHTML+=`<p style="color:#94a3b8;text-align:center;padding:40px;">Loading...</p>`;return div;}
  const j=currentJob;
  const content=ce("div","");content.style.cssText="padding:16px;";
  content.innerHTML=`<h2 style="color:#e2e8f0;font-size:20px;margin:0 0 12px;">${j.title||"Untitled"}</h2><p style="color:#94a3b8;font-size:14px;line-height:1.5;margin:0 0 16px;">${j.description||"No description"}</p><div style="background:#1e293b;border-radius:8px;padding:12px;margin-bottom:16px;"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#94a3b8;">Budget</span><span style="color:#38bdf8;font-weight:600;">${fmtMoney(j.budget)}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#94a3b8;">Category</span><span style="color:#e2e8f0;">${j.category||"General"}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#94a3b8;">Connects</span><span style="color:#e2e8f0;">${j.connects_required||0}</span></div><div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Posted</span><span style="color:#e2e8f0;">${fmtDate(j.created_at)}</span></div></div><button onclick="window._app.applyJob()" style="width:100%;padding:14px;background:#22c55e;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-bottom:12px;">Apply Now</button><button onclick="window._app.showScreen('jobs')" style="width:100%;padding:14px;background:#334155;color:#e2e8f0;border:none;border-radius:8px;cursor:pointer;">&#8592; Back</button>`;
  div.appendChild(content);div.appendChild(renderNav());
  return div;
}

async function applyJob(){
  if(!currentJob)return;
  const bid=prompt("Enter your bid amount:",currentJob.budget||"");
  if(!bid)return;
  const message=prompt("Enter cover letter:","");
  showLoader("Applying...");
  try{
    await api.post("/api/jobs/"+currentJob.id+"/apply",{bid_amount:Number(bid),cover_letter:message||"",message:message||""});
    hideLoader();alert("Application sent!");
  }catch(e){hideLoader();showError(e.message||"Failed to apply");}
}

// ===== CREATE JOB =====
function renderCreateJob(){
  const div=ce("div","screen-create");
  div.style.cssText="background:#0f172a;min-height:100vh;padding-bottom:70px;";
  div.appendChild(renderHeader("Post a Job"));
  const form=ce("div","");form.style.cssText="padding:16px;";
  form.innerHTML=`<input id="cj-title" placeholder="Job title" style="width:100%;padding:12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;margin-bottom:12px;box-sizing:border-box;"><textarea id="cj-desc" placeholder="Description" rows="4" style="width:100%;padding:12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;margin-bottom:12px;box-sizing:border-box;resize:vertical;"></textarea><input id="cj-budget" type="number" placeholder="Budget ($)" style="width:100%;padding:12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;margin-bottom:12px;box-sizing:border-box;"><input id="cj-cat" placeholder="Category" style="width:100%;padding:12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;margin-bottom:12px;box-sizing:border-box;"><input id="cj-connects" type="number" placeholder="Connects required" value="2" style="width:100%;padding:12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;margin-bottom:12px;box-sizing:border-box;"><button onclick="window._app.createJob()" style="width:100%;padding:14px;background:#38bdf8;color:#0f172a;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-bottom:12px;">Post Job</button><button onclick="window._app.showScreen('jobs')" style="width:100%;padding:14px;background:#334155;color:#e2e8f0;border:none;border-radius:8px;cursor:pointer;">Cancel</button>`;
  div.appendChild(form);div.appendChild(renderNav());
  return div;
}

async function createJob(){
  const title=$("cj-title").value;
  const desc=$("cj-desc").value;
  const budget=$("cj-budget").value;
  const cat=$("cj-cat").value;
  const connects=$("cj-connects").value;
  if(!title||!desc||!budget){showError("Fill all required fields");return;}
  showLoader("Posting...");
  try{
    await api.post("/api/jobs",{title,description:desc,budget:Number(budget),category:cat||"General",connects_required:Number(connects)||2});
    hideLoader();showScreen("jobs");
  }catch(e){hideLoader();showError(e.message||"Failed to create job");}
}

// ===== MY JOBS =====
async function loadMyJobs(){
  showLoader("Loading...");
  try{const data=await api.get("/api/jobs/my-jobs");myJobs=data.jobs||data||[];}
  catch(e){showError("Failed to load");}
  hideLoader();render();
}

function renderMyJobs(){
  const div=ce("div","screen-myjobs");
  div.style.cssText="background:#0f172a;min-height:100vh;padding-bottom:70px;";
  div.appendChild(renderHeader("My Jobs"));
  const list=ce("div","");list.style.cssText="padding:0 16px;";
  if(!myJobs.length){list.innerHTML=`<p style="color:#94a3b8;text-align:center;padding:40px;">No jobs yet</p>`;}
  else{myJobs.forEach(job=>{const card=ce("div","");card.style.cssText="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid #334155;";card.innerHTML=`<h3 style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">${job.title||"Untitled"}</h3><p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">${(job.description||"").substring(0,80)}...</p><div style="display:flex;justify-content:space-between;"><span style="color:#38bdf8;font-weight:600;">${fmtMoney(job.budget)}</span><span style="color:#64748b;font-size:12px;">${job.status||"open"}</span></div>`;list.appendChild(card);});}
  div.appendChild(list);div.appendChild(renderNav());
  return div;
}

// ===== CHAT =====
async function loadChat(){
  showLoader("Loading chats...");
  try{const data=await api.get("/api/chat/rooms");messages=data.rooms||data||[];}
  catch(e){showError("Failed to load chats");}
  hideLoader();render();
}

function renderChat(){
  const div=ce("div","screen-chat");
  div.style.cssText="background:#0f172a;min-height:100vh;padding-bottom:70px;";
  div.appendChild(renderHeader("Messages"));
  const list=ce("div","");list.style.cssText="padding:0 16px;";
  if(!messages.length){list.innerHTML=`<p style="color:#94a3b8;text-align:center;padding:40px;">No messages yet</p>`;}
  else{messages.forEach(room=>{const card=ce("div","");card.style.cssText="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:12px;cursor:pointer;border:1px solid #334155;";card.onclick=()=>{currentChatId=room.id;showScreen("chatRoom");};const other=room.participants?.find(p=>p.id!==currentUser?.id);card.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;"><h3 style="color:#e2e8f0;font-size:16px;margin:0;">${other?.username||"Chat"}</h3>${room.unread?`<span style="background:#ef4444;color:#fff;border-radius:50%;width:20px;height:20px;font-size:12px;display:flex;align-items:center;justify-content:center;">${room.unread}</span>`:""}</div><p style="color:#94a3b8;font-size:13px;margin:8px 0 0;">${room.last_message?.substring(0,60)||"No messages"}</p>`;list.appendChild(card);});}
  div.appendChild(list);div.appendChild(renderNav());
  return div;
}

function renderChatRoom(){
  const div=ce("div","screen-chatroom");
  div.style.cssText="background:#0f172a;min-height:100vh;display:flex;flex-direction:column;";
  div.appendChild(renderHeader("Chat"));
  const msgs=ce("div","chat-messages");msgs.style.cssText="flex:1;overflow-y:auto;padding:16px;";msgs.innerHTML=`<p style="color:#94a3b8;text-align:center;">Loading messages...</p>`;
  const input=ce("div","");input.style.cssText="padding:12px;border-top:1px solid #334155;display:flex;gap:8px;";
  input.innerHTML=`<input id="chat-msg" placeholder="Type a message..." style="flex:1;padding:12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;"><button onclick="window._app.sendMessage()" style="padding:12px 20px;background:#38bdf8;color:#0f172a;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Send</button>`;
  div.appendChild(msgs);div.appendChild(input);
  loadChatMessages(msgs);
  return div;
}

async function loadChatMessages(container){
  if(!currentChatId)return;
  try{const data=await api.get("/api/chat/rooms/"+currentChatId+"/messages");const msgs=data.messages||data||[];container.innerHTML="";msgs.forEach(m=>{const isMe=m.sender_id===currentUser?.id;const bubble=ce("div","");bubble.style.cssText=`max-width:70%;padding:10px 14px;border-radius:12px;margin-bottom:8px;${isMe?'background:#38bdf8;color:#0f172a;margin-left:auto;':'background:#1e293b;color:#e2e8f0;'}`;bubble.innerHTML=`<p style="margin:0;font-size:14px;">${m.content||m.message||""}</p><span style="font-size:10px;opacity:0.7;">${fmtDate(m.created_at)}</span>`;container.appendChild(bubble);});container.scrollTop=container.scrollHeight;}
  catch(e){container.innerHTML=`<p style="color:#ef4444;">Failed to load messages</p>`;}
}

async function sendMessage(){
  const input=$("chat-msg");if(!input||!input.value.trim()||!currentChatId)return;
  try{await api.post("/api/chat/rooms/"+currentChatId+"/messages",{content:input.value.trim()});input.value="";const msgs=document.querySelector(".chat-messages");if(msgs)loadChatMessages(msgs);}
  catch(e){showError("Failed to send");}
}

// ===== ESCROW =====
async function loadEscrow(){
  showLoader("Loading...");
  try{const data=await api.get("/api/escrow");escrow=data.escrow||data||[];}
  catch(e){showError("Failed to load escrow");}
  hideLoader();render();
}

function renderEscrow(){
  const div=ce("div","screen-escrow");
  div.style.cssText="background:#0f172a;min-height:100vh;padding-bottom:70px;";
  div.appendChild(renderHeader("Escrow"));
  const list=ce("div","");list.style.cssText="padding:0 16px;";
  if(!escrow.length){list.innerHTML=`<p style="color:#94a3b8;text-align:center;padding:40px;">No escrow transactions</p>`;}
  else{escrow.forEach(e=>{const card=ce("div","");card.style.cssText="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid #334155;";card.innerHTML=`<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#e2e8f0;font-weight:600;">${e.job_title||"Job"}</span><span style="color:${e.status==='released'?'#22c55e':e.status==='held'?'#f59e0b':'#ef4444'};">${e.status||"pending"}</span></div><div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Amount</span><span style="color:#38bdf8;font-weight:600;">${fmtMoney(e.amount)}</span></div>`;list.appendChild(card);});}
  div.appendChild(list);div.appendChild(renderNav());
  return div;
}

// ===== PROFILE =====
async function loadProfile(){
  showLoader("Loading profile...");
  try{const data=await api.get("/api/users/me");if(data.user)Object.assign(currentUser,data.user);}
  catch(e){}
  hideLoader();render();
}

function renderProfile(){
  const div=ce("div","screen-profile");
  div.style.cssText="background:#0f172a;min-height:100vh;padding-bottom:70px;";
  div.appendChild(renderHeader("My Profile"));
  const content=ce("div","");content.style.cssText="padding:16px;";
  const u=currentUser||{};
  content.innerHTML=`<div style="text-align:center;padding:20px 0;"><div style="width:80px;height:80px;background:#38bdf8;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:36px;">&#128100;</div><h2 style="color:#e2e8f0;margin:0 0 4px;">${u.username||"User"}</h2><p style="color:#94a3b8;margin:0 0 16px;">${u.role||"Freelancer"}</p><div style="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:16px;"><div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#94a3b8;">Connects</span><span style="color:#38bdf8;font-weight:600;">${u.connects||0}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#94a3b8;">Hourly Rate</span><span style="color:#38bdf8;font-weight:600;">${fmtMoney(u.hourly_rate)}/hr</span></div><div style="display:flex;justify-content:space-between;"><span style="color:#94a3b8;">Location</span><span style="color:#e2e8f0;">${u.location||"Not set"}</span></div></div><button onclick="window._app.logout()" style="width:100%;padding:14px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Logout</button></div>`;
  div.appendChild(content);div.appendChild(renderNav());
  return div;
}

// ===== ADMIN =====
async function loadAdmin(){
  showLoader("Loading admin...");
  try{const data=await api.get("/api/admin/stats");adminStats=data;}
  catch(e){showError("Admin access denied");}
  hideLoader();render();
}

function renderAdmin(){
  const div=ce("div","screen-admin");
  div.style.cssText="background:#0f172a;min-height:100vh;padding-bottom:70px;";
  div.appendChild(renderHeader("Admin Panel"));
  const content=ce("div","");content.style.cssText="padding:16px;";
  if(!adminStats){content.innerHTML=`<p style="color:#94a3b8;text-align:center;padding:40px;">Loading stats...</p>`;}
  else{content.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;"><div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;"><div style="font-size:24px;font-weight:700;color:#38bdf8;">${adminStats.total_users||0}</div><div style="color:#94a3b8;font-size:12px;">Users</div></div><div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;"><div style="font-size:24px;font-weight:700;color:#38bdf8;">${adminStats.total_jobs||0}</div><div style="color:#94a3b8;font-size:12px;">Jobs</div></div><div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;"><div style="font-size:24px;font-weight:700;color:#38bdf8;">${adminStats.total_applications||0}</div><div style="color:#94a3b8;font-size:12px;">Applications</div></div><div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;"><div style="font-size:24px;font-weight:700;color:#38bdf8;">${adminStats.total_escrow||0}</div><div style="color:#94a3b8;font-size:12px;">Escrow</div></div></div>`;}
  div.appendChild(content);div.appendChild(renderNav());
  return div;
}

// ===== NAVIGATION =====
function showScreen(name){
  currentScreen=name;
  if(name==="jobs")loadJobs();
  else if(name==="jobDetail")loadJobDetail();
  else if(name==="myJobs")loadMyJobs();
  else if(name==="chat")loadChat();
  else if(name==="chatRoom")render();
  else if(name==="escrow")loadEscrow();
  else if(name==="profile")loadProfile();
  else if(name==="admin")loadAdmin();
  else render();
}
function nav(screen){showScreen(screen);}

// ===== INIT =====
function init(){
  if(loadUser()){showScreen("jobs");}
  else{showScreen("login");}
}

// ===== EXPOSE TO WINDOW =====
window._app={piLogin,logout,showScreen,nav,render,applyJob,createJob,sendMessage,loadJobs,loadJobDetail,loadMyJobs,loadChat,loadEscrow,loadProfile,loadAdmin};

// Start
init();

})();