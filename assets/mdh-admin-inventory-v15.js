
(() => {
"use strict";
const db = window.supabase.createClient(
  "https://klmkjvtmxxttrxujtiwe.supabase.co",
  "sb_publishable_nCB64gQ4vOZuWsJ2QOujuw_gFBkTXpd",
  { auth: { persistSession: true, autoRefreshToken: true } }
);
const esc = v => String(v == null ? "" : v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const num = v => Number(v);
const four = v => Math.round((Number(v) + Number.EPSILON) * 10000) / 10000;
const fmt = v => v ? new Date(v).toLocaleString("en-US") : "—";
const money = v => Number(v || 0).toLocaleString("en-US",{maximumFractionDigits:4});
const assert = (ok,msg) => { if (!ok) throw new Error(msg); };
const app = document.getElementById("adminApp");
const layout = app && app.querySelector(".layout");
if (!layout || !window.supabase) return;
const host=document.createElement("div");
host.id="mdhV15";
layout.insertBefore(host,layout.querySelector(".grid-two"));
const css=document.createElement("style");
css.textContent = [
"#mdhV15{display:grid;gap:20px;margin:20px 0}#mdhV15 .panel{overflow:hidden}",
"#mdhV15 .mdh-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:19px 22px;border-bottom:1px solid var(--border-soft)}",
"#mdhV15 .mdh-head h3{margin:0 0 4px;font-size:1.12rem}#mdhV15 .mdh-head p{margin:0;color:var(--muted);font-size:.83rem}",
"#mdhV15 .mdh-body{padding:18px 22px}#mdhV15 .mdh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}",
"#mdhV15 label{display:grid;gap:5px;font-size:.81rem;font-weight:700}#mdhV15 input,#mdhV15 select,#mdhV15 textarea,.mdh-dialog input,.mdh-dialog select{width:100%;min-width:0;padding:10px;border:1px solid var(--border);border-radius:9px;background:var(--field);color:var(--text);font:inherit}",
"#mdhV15 button,.mdh-dialog button{cursor:pointer;border:1px solid var(--border);border-radius:8px;background:var(--surface-soft);color:var(--text);padding:8px 11px;font-weight:700}",
"#mdhV15 button.primary,.mdh-dialog button.primary{background:var(--accent);border-color:var(--accent);color:white}#mdhV15 button:disabled,.mdh-dialog button:disabled{opacity:.45;cursor:not-allowed}",
"#mdhV15 .mdh-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}#mdhV15 .mdh-scroll{overflow-x:auto}#mdhV15 table{width:100%;border-collapse:collapse;font-size:.84rem}",
"#mdhV15 th,#mdhV15 td{padding:11px 10px;text-align:left;border-bottom:1px solid var(--border-soft);vertical-align:middle}#mdhV15 th{color:var(--muted);font-size:.74rem;text-transform:uppercase;white-space:nowrap}",
"#mdhV15 .mdh-muted{color:var(--muted);font-size:.8rem}#mdhV15 .mdh-alert{padding:12px 16px;border:1px solid var(--border);border-radius:10px;background:var(--surface-soft);margin:10px 0}",
"#mdhV15 .mdh-good{color:var(--positive)}#mdhV15 .mdh-low{color:var(--shortage)}#mdhV15 .mdh-component{display:grid;grid-template-columns:minmax(140px,2fr) 1fr 1fr auto;gap:7px;align-items:end;margin:8px 0}",
".mdh-dialog{border:1px solid var(--border);border-radius:14px;max-width:980px;width:calc(100% - 28px);max-height:90vh;overflow:auto;background:var(--surface);color:var(--text);padding:22px;box-shadow:0 30px 70px rgba(0,0,0,.45)}",
".mdh-dialog::backdrop{background:rgba(0,0,0,.7)}.mdh-dialog .mdh-opening{margin:12px 0;padding:14px;border:1px solid var(--border);border-radius:12px}",
".mdh-dialog .mdh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px}.mdh-dialog .mdh-actions{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}",
"@media(max-width:620px){#mdhV15 .mdh-body{padding:12px}#mdhV15 .mdh-component{grid-template-columns:1fr 1fr}#mdhV15 .mdh-component select{grid-column:span 2}}"
].join("");
document.head.appendChild(css);
const dialog=document.createElement("dialog");
dialog.className="mdh-dialog";dialog.id="mdhReviewV15";document.body.appendChild(dialog);
let profiles=[],docs=[],items=[],recipes=[],movements=[],reviewDoc=null,busy=false;
function message(value,bad=false){ const el=document.getElementById("mdhStatusV15");if(el){el.textContent=value||"";el.style.color=bad?"var(--shortage)":"var(--text)";} }
function err(e){console.error("MDH V15:",e);message(e.message||String(e),true);window.alert(e.message||"Operation failed.");}
async function rpc(fn,args){const {data,error}=await db.rpc(fn,args);if(error)throw error;return data;}
async function load(){
 const {data:{session}}=await db.auth.getSession();
 assert(session && session.user,"Admin session required.");
 const mine=await db.from("profiles").select("role,is_active").eq("id",session.user.id).single();
 assert(!mine.error && mine.data && mine.data.role==="admin" && mine.data.is_active,"Administrator access required.");
 const all=await Promise.all([
 db.from("profiles").select("id,username,email,company_name,role,is_active,approval_status,created_at").order("created_at",{ascending:false}),
 db.from("documents").select("id,user_id,sidemark,document_type,status,form_data,updated_at,created_at,inventory_deducted,component_snapshot").order("updated_at",{ascending:false}),
 db.from("inventory_items").select("*").order("name"),
 db.from("assembly_recipes").select("*").order("name"),
 db.from("inventory_movements").select("id,item_id,document_id,delta,balance,reason,actor_id,created_at").order("created_at",{ascending:false}).limit(35)
 ]);
 all.forEach(r=>{if(r.error)throw r.error;});
 [profiles,docs,items,recipes,movements]=all.map(r=>r.data||[]);
 render();
}
function table(headers,rows,empty){
 return '<div class="mdh-scroll"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+(rows.length?rows.join(""):'<tr><td colspan="'+headers.length+'" class="mdh-muted">'+esc(empty)+'</td></tr>')+'</tbody></table></div>';
}
function section(title,subtitle,body){
 return '<section class="panel"><div class="mdh-head"><div><h3>'+esc(title)+'</h3><p>'+esc(subtitle)+'</p></div></div><div class="mdh-body">'+body+'</div></section>';
}
function options(entries,selected){return entries.map(([v,t])=>'<option value="'+esc(v)+'"'+(String(v)===String(selected)?" selected":"")+'>'+esc(t)+'</option>').join("");}
function render(){
 const awaiting=profiles.filter(p=>p.role==="client" && p.approval_status==="pending").length;
 const pending=docs.filter(d=>d.status==="submitted");
 const low=items.filter(i=>i.active && Number(i.stock)<=Number(i.low_stock)).length;
 const accountRows=profiles.filter(p=>p.role==="client").map(p=>'<tr><td><b>'+esc(p.username)+'</b><div class="mdh-muted">'+esc(p.email)+'</div></td><td>'+esc(p.company_name)+'</td><td>'+esc(p.approval_status||"pending")+'</td><td>'+esc(fmt(p.created_at))+'</td><td><div class="mdh-actions">'+(p.approval_status!=="approved"?'<button data-action="account" data-id="'+p.id+'" data-value="approved" class="primary">Approve</button>':'')+(p.approval_status!=="rejected"?'<button data-action="account" data-id="'+p.id+'" data-value="rejected">Reject</button>':'')+(p.approval_status!=="pending"?'<button data-action="account" data-id="'+p.id+'" data-value="pending">Set Pending</button>':'')+'</div></td></tr>');
 const docRows=docs.filter(d=>d.status==="submitted" || d.status==="approved" || d.status==="rejected").map(d=>{
 const p=profiles.find(x=>x.id===d.user_id)||{};return '<tr><td><b>'+esc(d.sidemark||"Untitled")+'</b><div class="mdh-muted">'+esc(p.username||p.email||"Unknown")+'</div></td><td>'+esc(d.document_type)+'</td><td>'+esc(d.status)+'</td><td>'+esc(fmt(d.updated_at))+'</td><td>'+(d.inventory_deducted?"Yes":"No")+'</td><td><button data-action="review" data-id="'+d.id+'">'+(d.status==="submitted"?"Review":"View")+'</button></td></tr>';
 });
 const itemRows=items.map(i=>'<tr><td><b>'+esc(i.sku)+'</b><div class="mdh-muted">'+esc(i.name)+'</div></td><td>'+esc(i.unit)+'</td><td class="'+(Number(i.stock)<=Number(i.low_stock)?"mdh-low":"mdh-good")+'"><b>'+money(i.stock)+'</b></td><td>'+money(i.low_stock)+'</td><td>'+esc(i.active?"Active":"Inactive")+'</td><td><div class="mdh-actions"><button data-action="edit-item" data-id="'+i.id+'">Edit</button><button data-action="stock" data-id="'+i.id+'">Receive / Adjust</button></div></td></tr>');
 const recipeRows=recipes.map(r=>'<tr><td><b>'+esc(r.name)+'</b></td><td>'+esc(Object.entries(r.match_fields||{}).map(([k,v])=>k+": "+v).join("; ")||"Manual selection")+'</td><td>'+esc((r.components||[]).map(c=>{const i=items.find(x=>x.id===c.item_id);return (i?i.sku:"Unknown")+" ("+c.fixed+" fixed + "+c.per_foot+"/ft)";}).join(", "))+'</td><td>'+esc(r.active?"Active":"Inactive")+'</td><td><button data-action="edit-recipe" data-id="'+r.id+'">Edit</button></td></tr>');
 const movementRows=movements.map(m=>'<tr><td>'+esc(fmt(m.created_at))+'</td><td>'+esc((items.find(i=>i.id===m.item_id)||{}).sku||m.item_id)+'</td><td>'+esc(money(m.delta))+'</td><td>'+esc(money(m.balance))+'</td><td>'+esc(m.reason)+'</td></tr>');
 host.innerHTML='<div id="mdhStatusV15" role="status" aria-live="polite"></div>'+
 section('Approval Queue','New clients must be approved before accessing forms. '+awaiting+' pending.',table(['Username','Company','Status','Registered','Actions'],accountRows,'No client accounts yet.'))+
 section('Order & Estimate Reviews',pending.length+' submission(s) awaiting administrator review. Inventory moves only when an Order is approved.',table(['Sidemark / Account','Type','Status','Last Changed','Stock Deducted','Action'],docRows,'No submitted documents to review.'))+
 section('Inventory / Products',items.length+' components in the catalog, '+low+' at or below minimum stock.',
  '<form id="mdhItemForm"><input type="hidden" name="id"><div class="mdh-grid">'+
   '<label>SKU<input name="sku" required maxlength="80" placeholder="SOMFY-MOTOR-01"></label>'+
   '<label>Item / Component Name<input name="name" required placeholder="Somfy track motor"></label>'+
   '<label>Unit<select name="unit">'+options([["each","Each"],["ft","Feet"],["m","Meters"],["in","Inches"],["yd","Yards"]],"each")+'</select></label>'+
   '<label>Low Stock Alert<input name="low" type="number" min="0" step="any" value="0" required></label>'+
   '<label>Notes<input name="notes" placeholder="Optional notes"></label>'+
   '<label>Active<select name="active"><option value="true">Active</option><option value="false">Inactive</option></select></label></div>'+
   '<div class="mdh-actions" style="margin:12px 0"><button type="submit" class="primary">Save Component</button><button type="reset">New Item / Clear</button></div></form>'+
   table(["SKU / Name","Unit","On Hand","Low Alert","Status","Actions"],itemRows,"Add motors, belts, pulleys, carriers, and other stock above.")+
   '<p class="mdh-muted">Creating an item starts at zero stock. Receive or adjust stock separately so every change is recorded.</p>')+
 section('Assembly Recipes','Create component bills of materials for Ripple Fold / Somfy tracks and other products. Fixed quantity + per-foot quantity per opening.',
  '<form id="mdhRecipeForm"><input type="hidden" name="id"><div class="mdh-grid">'+
   '<label>Recipe Name<input name="name" required placeholder="Ripple Fold Somfy Motorized Track"></label>'+
   '<label>Product Type (exact form value)<input name="productType" placeholder="Optional"></label>'+
   '<label>Pleat / Style (exact value)<input name="pleat" placeholder="Optional"></label>'+
   '<label>Operation (exact value)<input name="operation" placeholder="Optional"></label>'+
   '<label>Motor Brand (exact value)<input name="motorBrand" placeholder="Optional"></label>'+
   '<label>Active<select name="active"><option value="true">Active</option><option value="false">Inactive</option></select></label></div>'+
   '<div id="mdhRecipeComponents"></div><div class="mdh-actions"><button data-action="add-component" type="button">Add Component</button><button type="submit" class="primary">Save Recipe</button><button type="reset">New Recipe / Clear</button></div></form>'+
   table(["Recipe","Match Fields","Components (fixed + per foot)","Status","Edit"],recipeRows,"Create a recipe by selecting stock items and their quantities.")+
   '<p class="mdh-muted">For a track using 1 motor, 2 pulleys, and 1 ft of belt per track foot: enter 1, 2, and 0 fixed + 1 per foot. Enter track length in feet when approving each order; quantities are never guessed.</p>')+
 section('Stock Movement History','Audit trail for manual stock adjustments and approved orders.',table(["When","SKU","Change","New Stock","Reason"],movementRows,"No stock movements yet."));
 addRecipeComponent();
}
function addRecipeComponent(c={}){
 const box=host.querySelector("#mdhRecipeComponents");if(!box)return;
 const d=document.createElement("div");d.className="mdh-component";
 d.innerHTML='<label>Inventory Component<select class="rcItem" required>'+options([["","Choose item"]].concat(items.filter(i=>i.active || i.id===c.item_id).map(i=>[i.id,i.sku+" — "+i.name+" ("+i.unit+")"])),c.item_id||"")+'</select></label>'+
 '<label>Fixed / Opening<input class="rcFixed" type="number" min="0" step="0.0001" value="'+esc(c.fixed==null?0:c.fixed)+'" required></label>'+
 '<label>Per Track Foot<input class="rcFoot" type="number" min="0" step="0.0001" value="'+esc(c.per_foot==null?0:c.per_foot)+'" required></label>'+
 '<button type="button" data-action="remove-component">Remove</button>';box.appendChild(d);
}
function editItem(i){
 const f=host.querySelector("#mdhItemForm");if(!f)return;
 for(const [k,v] of Object.entries({id:i.id,sku:i.sku,name:i.name,unit:i.unit,low:i.low_stock,notes:i.notes,active:String(i.active)}))if(f.elements.namedItem(k))f.elements.namedItem(k).value=v??"";
 f.scrollIntoView({behavior:"smooth",block:"center"});
}
function editRecipe(r){
 const f=host.querySelector("#mdhRecipeForm");if(!f)return;
 const vals={id:r.id,name:r.name,active:String(r.active),productType:r.match_fields?.productType||"",pleat:r.match_fields?.pleat||"",operation:r.match_fields?.operation||"",motorBrand:r.match_fields?.motorBrand||""};
 Object.entries(vals).forEach(([k,v])=>{if(f.elements.namedItem(k))f.elements.namedItem(k).value=v;});
 host.querySelector("#mdhRecipeComponents").innerHTML="";(r.components||[]).forEach(addRecipeComponent);
 f.scrollIntoView({behavior:"smooth",block:"center"});
}
function matches(opening,recipe){
 const entries=Object.entries(recipe.match_fields||{});
 return recipe.active && entries.length && entries.every(([k,v])=>String(opening[k]||"").trim().toLowerCase()===String(v).trim().toLowerCase());
}
function review(id){
 reviewDoc=docs.find(d=>d.id===id);if(!reviewDoc)return;
 const d=reviewDoc, openings=Array.isArray(d.form_data?.openings)?d.form_data.openings:[];
 let body='<p><b>'+esc(d.document_type)+' — '+esc(d.sidemark||"Untitled")+'</b> | Status: '+esc(d.status)+'</p>';
 if(d.status==="submitted" && d.document_type==="Order"){
   body+='<div class="mdh-alert">Choose one recipe and enter the actual track length (in feet) for each opening. Check calculated quantities before approval. Stock is not deducted until approval succeeds.</div>';
   openings.forEach((o,j)=>{
    const chosen=recipes.find(r=>matches(o,r))?.id||"";
    body+='<div class="mdh-opening" data-opening="'+j+'"><b>Opening '+(j+1)+': '+esc(o.room||o.productType||"Untitled")+'</b><p class="mdh-muted">'+esc([o.size,o.productType,o.pleat,o.operation,o.motorBrand].filter(Boolean).join(" · "))+'</p>'+
    '<div class="mdh-grid"><label>Assembly Recipe<select class="roRecipe">'+options([["","Choose recipe"]].concat(recipes.filter(r=>r.active).map(r=>[r.id,r.name])),chosen)+'</select></label>'+
    '<label>Track Length (feet)<input class="roLength" type="number" min="0.001" step="0.0001" placeholder="Measured length in feet"></label></div></div>';
   });
   body+='<div class="mdh-actions"><button type="button" data-review-action="preview">Preview Component Requirements</button><button class="primary" type="button" data-review-action="approve">Approve Order & Deduct Stock</button></div>';
 }else if(d.status==="submitted"){
   body+='<div class="mdh-alert">Approving an estimate does not deduct stock.</div><div class="mdh-actions"><button class="primary" data-review-action="approve" type="button">Approve Estimate</button></div>';
 }else{
   body+='<div class="mdh-alert">Previously reviewed: '+esc(d.status)+(d.inventory_deducted?'. Inventory was deducted on approval.':'. No inventory deducted.')+'</div>';
   const totals=d.component_snapshot?.totals||[];
   if(Array.isArray(totals)&&totals.length)body+='<ul>'+totals.map(c=>'<li>'+esc(c.sku)+': '+esc(c.quantity)+' '+esc(c.unit)+'</li>').join("")+'</ul>';
 }
 if(d.status==="submitted")body+='<label>Admin Review Note (optional)<input id="mdhReviewNote" maxlength="500" placeholder="Reason or internal note"></label><div class="mdh-actions"><button data-review-action="reject" type="button">Reject Submission (No Stock Deduction)</button></div>';
 dialog.innerHTML='<h2>Document Review</h2>'+body+'<div id="mdhPreview"></div><div class="mdh-actions"><button data-review-action="close" type="button">Close</button></div>';
 dialog.showModal();
}
function linesForReview(){
 assert(reviewDoc && reviewDoc.document_type==="Order","No order selected");
 const op=reviewDoc.form_data?.openings||[], lines=[],preview=[];
 assert(op.length>0,"An order must contain at least one opening.");
 for(let j=0;j<op.length;j++){
   const panel=dialog.querySelector('[data-opening="'+j+'"]');assert(panel,"Opening "+(j+1)+" missing");
   const recipe=recipes.find(r=>r.id===panel.querySelector(".roRecipe").value && r.active);
   assert(recipe,"Select a recipe for opening "+(j+1)+".");
   const raw=panel.querySelector(".roLength").value;
   const feet=num(raw);
   assert(raw.trim()!=="" && Number.isFinite(feet) && feet>0,"Enter an actual track length in feet for opening "+(j+1)+".");
   for(const c of recipe.components||[]){
      const item=items.find(i=>i.id===c.item_id);
      assert(item && item.active,"Inactive or missing component in "+recipe.name);
      const fixed=num(c.fixed),per=num(c.per_foot);
      assert(Number.isFinite(fixed)&&Number.isFinite(per)&&fixed>=0&&per>=0,"Invalid recipe quantity.");
      let qty=four(fixed+per*feet);
      if(item.unit==="each")qty=Math.ceil(qty);
      assert(qty>0 && Number.isFinite(qty),"Component quantity must be positive.");
      lines.push({opening_index:j,item_id:item.id,quantity:qty});
      preview.push({opening:j+1,item,qty});
   }
 }
 assert(lines.length>0,"Add components to the selected recipes.");
 return {lines,preview};
}
function previewLines(){
 const {lines,preview}=linesForReview(),byId=new Map();
 for(const row of preview){const old=byId.get(row.item.id)||{item:row.item,need:0};old.need=four(old.need+row.qty);byId.set(row.item.id,old);}
 const shortages=[...byId.values()].filter(r=>r.need>Number(r.item.stock));
 dialog.querySelector("#mdhPreview").innerHTML='<h3>Approval-time stock requirements</h3><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><tr><th>Component</th><th>Required</th><th>Available</th><th>After Approval</th></tr>'+
 [...byId.values()].map(r=>'<tr><td>'+esc(r.item.sku)+' — '+esc(r.item.name)+'</td><td>'+esc(money(r.need))+'</td><td>'+esc(money(r.item.stock))+'</td><td style="color:'+(r.need>Number(r.item.stock)?"#ed7780":"inherit")+'">'+esc(money(Number(r.item.stock)-r.need))+'</td></tr>').join("")+'</table></div>'+
 (shortages.length?'<p class="mdh-low">Not enough stock. Approval is blocked until inventory is received.</p>':'<p class="mdh-good">All components appear available; the server rechecks and deducts them atomically upon approval.</p>');
 return {lines,shortages};
}
host.addEventListener("click", async event=>{
 const b=event.target.closest("button[data-action]");if(!b || busy)return;
 const id=b.dataset.id;
 try{
  switch(b.dataset.action){
   case "account":
    if(!window.confirm("Change this account to "+b.dataset.value+"?"))return;
    busy=true;await rpc("mdh_review_account",{p_id:id,p_status:b.dataset.value});await load();message("Account status updated.");break;
   case "review": review(id);break;
   case "edit-item":editItem(items.find(i=>i.id===id));break;
   case "stock":{
    const item=items.find(i=>i.id===id);if(!item)return;
    const raw=window.prompt("Change quantity for "+item.sku+" (positive = receive, negative = adjust):","");
    if(raw===null)return;const delta=Number(raw);assert(raw.trim() && Number.isFinite(delta) && delta!==0,"Enter a valid nonzero change.");
    const reason=window.prompt("Reason (required, at least 3 characters):","");
    if(reason===null)return;assert(reason.trim().length>=3,"A reason is required.");
    assert(window.confirm("Change "+item.sku+" stock by "+delta+" "+item.unit+"?"),"Adjustment cancelled.");
    busy=true;await rpc("mdh_adjust_inventory",{p_id:id,p_delta:delta,p_reason:reason.trim(),p_request:crypto.randomUUID()});await load();message("Stock movement saved.");break;
   }
   case "edit-recipe":editRecipe(recipes.find(r=>r.id===id));break;
   case "add-component":addRecipeComponent();break;
   case "remove-component":if(host.querySelectorAll(".mdh-component").length>1)b.closest(".mdh-component").remove();else window.alert("At least one component is required.");break;
  }
 }catch(e){if(e.message!=="Adjustment cancelled.")err(e);}finally{busy=false;}
});
host.addEventListener("submit",async event=>{
 const f=event.target;if(f.id!=="mdhItemForm" && f.id!=="mdhRecipeForm")return;event.preventDefault();if(busy)return;busy=true;
 try{
  if(f.id==="mdhItemForm"){
   const val=n=>f.elements.namedItem(n).value;
   assert(val("sku").trim()&&val("name").trim(),"SKU and Name are required.");
   await rpc("mdh_save_inventory_item",{p_id:val("id")||null,p_sku:val("sku").trim(),p_name:val("name").trim(),p_unit:val("unit"),p_low:Number(val("low")),p_notes:val("notes"),p_active:val("active")==="true"});
  }else{
   const val=n=>f.elements.namedItem(n).value;
   const c=[...f.querySelectorAll(".mdh-component")].map(x=>({item_id:x.querySelector(".rcItem").value,fixed:Number(x.querySelector(".rcFixed").value),per_foot:Number(x.querySelector(".rcFoot").value)}));
   assert(val("name").trim(),"Recipe name is required.");
   assert(c.length&&c.every(x=>x.item_id&&Number.isFinite(x.fixed)&&Number.isFinite(x.per_foot)&&x.fixed>=0&&x.per_foot>=0&&x.fixed+x.per_foot>0),"Select components with nonnegative quantities (at least one positive).");
   const match={};
   for(const k of ["productType","pleat","operation","motorBrand"])if(val(k).trim())match[k]=val(k).trim();
   await rpc("mdh_save_recipe",{p_id:val("id")||null,p_name:val("name").trim(),p_match:match,p_components:c,p_active:val("active")==="true"});
  }
  await load();message("Saved successfully.");
 }catch(e){err(e);}finally{busy=false;}
});
host.addEventListener("reset",event=>{
 if(event.target.id==="mdhRecipeForm")setTimeout(()=>{host.querySelector("#mdhRecipeComponents").innerHTML="";addRecipeComponent();},0);
});
dialog.addEventListener("click",async event=>{
 const b=event.target.closest("button[data-review-action]");if(!b||busy)return;
 const action=b.dataset.reviewAction;
 if(action==="close"){dialog.close();return;}
 try{
  if(action==="preview"){previewLines();return;}
  assert(reviewDoc && reviewDoc.status==="submitted","Document is not awaiting review.");
  let lines=[];
  if(action==="approve" && reviewDoc.document_type==="Order"){
   const p=previewLines();assert(!p.shortages.length,"Insufficient stock. Receive the missing stock first.");lines=p.lines;
  }
  if(!window.confirm(action==="approve" ? "Approve this "+reviewDoc.document_type+"? Stock is deducted immediately for approved orders." : "Reject this submission? No stock will be deducted."))return;
  busy=true;const result=await rpc("mdh_review_document",{p_id:reviewDoc.id,p_decision:action==="approve"?"approved":"rejected",p_lines:lines,p_note:dialog.querySelector("#mdhReviewNote")?.value||"",p_expected:reviewDoc.updated_at});
  dialog.close();await load();message(result?.already_reviewed?"Already reviewed; no additional stock deducted.":"Review saved and inventory updated where applicable.");
 }catch(e){err(e);}finally{busy=false;}
});
const refresh=document.getElementById("refreshButton");
if(refresh)refresh.addEventListener("click",()=>load().catch(err));
(async()=>{try{await load();}catch(e){console.error("MDH inventory initialization:",e);}})();
})();
