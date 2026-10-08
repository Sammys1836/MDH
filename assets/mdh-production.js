(()=>{
"use strict";
const db=supabase.createClient("https://klmkjvtmxxttrxujtiwe.supabase.co","sb_publishable_nCB64gQ4vOZuWsJ2QOujuw_gFBkTXpd",{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
let orders=[],profiles=[],working=false;
function error(s){$("error").textContent=s?.message||s||"";if(s)$("success").textContent="";}
function message(s){error("");$("success").textContent=s;}
async function check(){
 const {data:{user}}=await db.auth.getUser();
 if(!user){$("login").classList.remove("hide");$("workspace").classList.add("hide");$("logout").classList.add("hide");$("refresh").classList.add("hide");return;}
 const {data:p,error:e}=await db.from("profiles").select("role,approval_status,is_active").eq("id",user.id).single();
 if(e||!p||p.approval_status!=="approved"||!p.is_active||!["production","admin"].includes(p.role)){
   await db.auth.signOut(); throw Error("This account has not been approved for production access.");
 }
 $("login").classList.add("hide");$("workspace").classList.remove("hide");$("logout").classList.remove("hide");$("refresh").classList.remove("hide");
 await load();
}
async function load(){
 const {data,error:e}=await db.from("documents").select("id,user_id,company_name,sidemark,status,document_type,form_data,component_snapshot,inventory_deducted,approved_at").eq("document_type","Order").eq("status","approved").eq("inventory_deducted",false).order("approved_at",{ascending:true});
 if(e)throw e;orders=data||[];render();
}
function render(){
 const q=$("search").value.toLowerCase().trim();
 const shown=orders.filter(x=>[x.company_name,x.sidemark,x.id].join(" ").toLowerCase().includes(q));
 $("count").textContent=shown.length+" approved order(s) ready for assembly";
 $("jobs").innerHTML=shown.length?shown.map(d=>{
 const components=d.component_snapshot?.totals||[], openings=Array.isArray(d.form_data?.openings)?d.form_data.openings.length:0;
 return '<article class="job"><div><div class="path">'+esc(d.company_name||"Company Not Provided")+' › '+esc(d.sidemark||"No Sidemark")+' › Order</div><div class="meta">Order '+esc(d.id.slice(0,8))+' · '+openings+' opening(s)</div><details><summary class="meta">Required components ('+components.length+')</summary><div class="components">'+(components.length?components.map(c=>esc(c.name||c.sku)+': '+esc(c.quantity)+' '+esc(c.unit)).join("<br>"):"No assembly recipe on file")+'</div></details></div><label class="check"><input type="checkbox" data-job="'+esc(d.id)+'" '+(working?"disabled":"")+'>Assembled</label></article>';
 }).join(""):'<p>No approved production orders to show.</p>';
}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();error("");try{const {error:x}=await db.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(x)throw x;await check()}catch(x){error(x)}});
$("logout").onclick=async()=>{await db.auth.signOut();await check();message("Signed out.")};
$("refresh").onclick=()=>load().catch(error);$("search").oninput=render;
$("jobs").addEventListener("change",async e=>{
 const input=e.target.closest("[data-job]");if(!input||!input.checked||working)return;
 const d=orders.find(x=>x.id===input.dataset.job);if(!d)return;
 if(!confirm("Confirm the track assembly is FINISHED for "+(d.company_name||"Company")+" / "+(d.sidemark||"Order")+"? This will permanently deduct every listed component.")){input.checked=false;return;}
 working=true;render();
 try{
 const {data,error:x}=await db.rpc("mdh_complete_assembly",{p_id:d.id});if(x)throw x;
 message(data?.already_completed?"Order already completed. No additional inventory was deducted.":"Completed: components deducted and order removed from the queue.");await load();
 }catch(x){error(x);await load().catch(error)}finally{working=false;render();}
});
check().catch(error);
})();