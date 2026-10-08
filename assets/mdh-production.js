(()=>{
"use strict";
const db=supabase.createClient("https://klmkjvtmxxttrxujtiwe.supabase.co","sb_publishable_nCB64gQ4vOZuWsJ2QOujuw_gFBkTXpd",{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
let orders=[],profiles=[],working=false;
const fmtDate=d=>new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",dateStyle:"medium",timeStyle:"short"}).format(new Date(d))+" ET";
const dateLabel=d=>d.submitted_at?"Submitted "+fmtDate(d.submitted_at):"Created "+fmtDate(d.created_at);
const dateSearch=d=>[d.submitted_at,d.created_at,d.approved_at].filter(Boolean).flatMap(v=>{
 const day=new Date(v);
 return [day.toISOString().slice(0,10),new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York"}).format(day),fmtDate(v)];
}).join(" ");
const ready=d=>Array.isArray(d.component_snapshot?.totals)&&d.component_snapshot.totals.length>0;
function error(s){$("error").textContent=s?.message||s||"";if(s)$("success").textContent="";}
function message(s){error("");$("success").textContent=s;}
async function check(){
 const {data:{user}}=await db.auth.getUser();
 if(!user){$("login").classList.remove("hide");$("workspace").classList.add("hide");$("logout").classList.add("hide");$("refresh").classList.add("hide");$("returnToAdmin").classList.add("hide");return;}
 const {data:p,error:e}=await db.from("profiles").select("role,approval_status,is_active").eq("id",user.id).single();
 if(e||!p||p.approval_status!=="approved"||!p.is_active||!["production","admin"].includes(p.role)){
   await db.auth.signOut(); throw Error("This account has not been approved for production access.");
 }
 $("login").classList.add("hide");$("workspace").classList.remove("hide");$("logout").classList.remove("hide");$("refresh").classList.remove("hide");$("returnToAdmin").classList.toggle("hide",p.role!=="admin");
 await load();
}
async function load(){
 const {data,error:e}=await db.from("documents").select("id,user_id,company_name,sidemark,status,document_type,form_data,component_snapshot,inventory_deducted,approved_at,created_at,submitted_at").eq("document_type","Order").eq("status","approved").eq("inventory_deducted",false).order("approved_at",{ascending:true});
 if(e)throw e;orders=data||[];render();
}
function render(){
 const q=$("search").value.toLowerCase().trim();
 const shown=orders.filter(x=>[x.company_name,x.sidemark,x.id,dateSearch(x)].join(" ").toLowerCase().includes(q));
 $("count").textContent=shown.length+" approved order(s) · "+shown.filter(ready).length+" ready · "+shown.filter(d=>!ready(d)).length+" awaiting components";
 $("jobs").innerHTML=shown.length?shown.map(d=>{
 const components=Array.isArray(d.component_snapshot?.totals)?d.component_snapshot.totals:[];
 const openings=Array.isArray(d.form_data?.openings)?d.form_data.openings.length:0;
 const configured=ready(d);
 return '<article class="job"><div><div class="path">'+esc(d.company_name||"Company Not Provided")+' › '+esc(d.sidemark||"No Sidemark")+' › Order</div>'+
 '<div class="meta">'+esc(dateLabel(d))+' · Order ID: '+esc(d.id.slice(0,8))+' · '+openings+' opening(s)</div>'+
 '<div class="meta">Approved: '+esc(d.approved_at?fmtDate(d.approved_at):"—")+'</div>'+
 (configured?'<div class="production-ready">Ready for Assembly</div>':'<div class="production-warning">Awaiting Component Configuration — admin action required</div>')+
 '<details><summary class="meta">Required components ('+components.length+')</summary><div class="components">'+
 (components.length?components.map(c=>esc(c.name||c.sku)+': '+esc(c.quantity)+' '+esc(c.unit)).join("<br>"):"An administrator must enter verified components in the admin order review before assembly completion can be recorded.")+
 '</div></details></div><label class="check"><input type="checkbox" data-job="'+esc(d.id)+'" '+(working||!configured?"disabled":"")+'>'+
 (configured?"Assembled":"Cannot complete yet")+'</label></article>';
 }).join(""):'<p>No approved production orders to show.</p>';
}
$("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();
 error("");
 const submit=e.currentTarget.querySelector("button[type=submit],button:not([type])");
 if(submit)submit.disabled=true;
 try{
  const username=$("username").value.trim();
  const password=$("password").value;
  if(!username||!password)throw Error("Enter your username and password.");
  // Reuse the MDH portal's existing server-side username/password login.
  // The password is checked by Supabase Auth; no email lookup is exposed to the browser.
  const {data:result,error:loginError}=await db.functions.invoke("username-login",{body:{username,password}});
  if(loginError){
   let reason="Invalid username or password.";
   try{const response=await loginError.context?.json();if(response?.error)reason=response.error;}catch{}
   throw Error(reason);
  }
  if(!result?.access_token||!result?.refresh_token)throw Error("Unable to establish a secure login session.");
  const {error:sessionError}=await db.auth.setSession({access_token:result.access_token,refresh_token:result.refresh_token});
  if(sessionError)throw sessionError;
  await check();
 }catch(x){error(x);}finally{if(submit)submit.disabled=false;}
});
$("logout").onclick=async()=>{await db.auth.signOut();await check();message("Signed out.")};
$("refresh").onclick=()=>load().catch(error);$("search").oninput=render;
$("jobs").addEventListener("change",async e=>{
 const input=e.target.closest("[data-job]");if(!input||!input.checked||working)return;
 const d=orders.find(x=>x.id===input.dataset.job);if(!d||!ready(d)){input.checked=false;error("This order is awaiting administrator component configuration.");return;}
 if(!confirm("Confirm the track assembly is FINISHED for "+(d.company_name||"Company")+" / "+(d.sidemark||"Order")+"? This will permanently deduct every listed component.")){input.checked=false;return;}
 working=true;render();
 try{
 const {data,error:x}=await db.rpc("mdh_complete_assembly",{p_id:d.id});if(x)throw x;
 message(data?.already_completed?"Order already completed. No additional inventory was deducted.":"Completed: components deducted and order removed from the queue.");await load();
 }catch(x){error(x);await load().catch(error)}finally{working=false;render();}
});
check().catch(error);
// Keep an already-open workroom dashboard in sync after admin approvals.
setInterval(()=>{
 if(!$("workspace").classList.contains("hide")&&!working&&document.visibilityState!=="hidden")load().catch(error);
},25000);
})();